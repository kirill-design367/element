<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';

/**
 * УСТАНОВКА: ТАБЛИЦЫ И ПЕРВОНАЧАЛЬНОЕ НАПОЛНЕНИЕ.
 *
 * Запускается один раз, руками, после того как в файле настроек прописаны
 * доступы к базе. Заливает схему и, если каталог пуст, — нынешние данные
 * сайта: 46 позиций, 6 категорий, контакты, объекты, цифры парка. Заказчик
 * должен открыть админку и увидеть свой каталог, а не пустоту.
 *
 * ПОВТОРНЫЙ ЗАПУСК БЕЗОПАСЕН. Схема заливается через CREATE TABLE IF NOT
 * EXISTS, наполнение — только когда в таблице позиций пусто. Перезалить
 * поверх правок заказчика скрипт не может физически.
 *
 * Вход не требуется, и это осознанно: пока таблиц нет, войти всё равно
 * некуда — счётчик попыток входа живёт в той же базе. Опасности в этом нет:
 * скрипт ничего не показывает и ничего не портит, а без файла настроек
 * (который лежит вне корня сайта) он не подключится к базе вовсе.
 */

require_https();
send_headers();
start_session();

$log = [];
$done = false;
$fail = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    try {
        $schema = file_get_contents(__DIR__ . '/sql/schema.sql');
        if ($schema === false) {
            throw new RuntimeException('не читается sql/schema.sql');
        }
        run_sql($schema);
        $log[] = 'Таблицы созданы (или уже были).';

        $count = (int) (q1('SELECT COUNT(*) AS n FROM materials')['n'] ?? 0);
        if ($count > 0) {
            $log[] = "В каталоге уже {$count} позиций — наполнение пропущено, ваши правки не тронуты.";
        } else {
            $seed = file_get_contents(__DIR__ . '/sql/seed.sql');
            if ($seed === false) {
                throw new RuntimeException('не читается sql/seed.sql');
            }
            run_sql($seed);
            $log[] = 'Каталог заполнен: '
                . (int) (q1('SELECT COUNT(*) AS n FROM materials')['n'] ?? 0) . ' позиций, '
                . (int) (q1('SELECT COUNT(*) AS n FROM categories')['n'] ?? 0) . ' категорий, '
                . (int) (q1('SELECT COUNT(*) AS n FROM objects')['n'] ?? 0) . ' объектов.';
        }
        $done = true;
    } catch (Throwable $e) {
        $fail = $e->getMessage();
    }
}

/**
 * Выполнение файла SQL по одному выражению.
 *
 * PDO::exec умеет несколько выражений разом далеко не везде, а падать на
 * этом посреди установки — худший из возможных исходов. Разбор простой и
 * этого достаточно: в наших двух файлах нет ни процедур, ни строк с
 * точкой с запятой внутри — за это отвечает генератор seed, который
 * экранирует кавычки, а не разделители.
 */
function run_sql(string $sql): void
{
    $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
    foreach (explode(";\n", $sql) as $stmt) {
        $stmt = trim($stmt, " \t\n\r;");
        if ($stmt === '') {
            continue;
        }
        db()->exec($stmt);
    }
}

page_head('Установка', false);
?>
<h1>Установка админки</h1>
<p class="lead">Создаёт таблицы и переносит нынешние данные сайта в базу. Запускается один раз.</p>

<?php if ($fail !== null): ?>
  <div class="msg err">Не получилось: <?= h($fail) ?></div>
<?php endif; ?>

<?php foreach ($log as $line): ?>
  <div class="msg ok"><?= h($line) ?></div>
<?php endforeach; ?>

<?php if ($done): ?>
  <div class="card">
    <p>Готово. Дальше — <a href="login.php">вход в админку</a>.</p>
    <p class="hint">Этот файл можно удалить с сервера: он больше не нужен. Если оставить,
      повторный запуск ничего не испортит — наполнение заливается только в пустой каталог.</p>
  </div>
<?php else: ?>
  <form method="post" class="card">
    <?= csrf_field() ?>
    <p>Файл настроек найден, к базе подключились. Нажмите — и таблицы будут созданы.</p>
    <button class="btn" type="submit">Создать таблицы и перенести данные</button>
  </form>
<?php endif; ?>
<?php page_foot(); ?>
