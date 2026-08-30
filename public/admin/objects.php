<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/publishbar.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * ОБЪЕКТЫ, НА КОТОРЫЕ ПОСТАВЛЯЛИ.
 *
 * Все на одной странице: их четыре, и правятся они пачкой. Здесь же
 * добавление и удаление — заводить отдельную карточку ради пяти полей
 * незачем.
 *
 * ЧТО ПОСТАВЛЯЛИ — СВОБОДНАЯ СТРОКА, а не выбор из каталога. Номенклатура
 * объекта редко совпадает с позициями слово в слово, и заставлять выбирать
 * из списка значило бы врать в обе стороны.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    $action = (string) ($_POST['action'] ?? 'save');

    /* Удаление — своей кнопкой в строке. Отдельной формы на каждый объект
       быть не может: формы не вкладываются друг в друга, а вся страница уже
       одна форма. Кнопка приносит идентификатор своим значением. */
    if (isset($_POST['delete_id'])) {
        $id = (int) $_POST['delete_id'];
        ex('DELETE FROM objects WHERE id = ?', [$id]);
        flash('ob', 'Объект удалён.');
        header('Location: objects.php');
        exit;
    }

    if ($action === 'add') {
        $sort = (int) (q1('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM objects')['n'] ?? 0);
        ex('INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES (?,?,?,?,?,?)',
            ['Новый объект', '', '', 0, '', $sort]);
        flash('ob', 'Объект добавлен — заполните поля и сохраните.');
        header('Location: objects.php');
        exit;
    }

    $rows = $_POST['obj'] ?? [];
    $saved = 0;
    $bad = [];
    if (is_array($rows)) {
        foreach ($rows as $id => $row) {
            $id = (int) $id;
            if (q1('SELECT id FROM objects WHERE id = ?', [$id]) === null) {
                continue;
            }
            $name = mb_substr(trim((string) ($row['name'] ?? '')), 0, 200);
            $place = mb_substr(trim((string) ($row['place'] ?? '')), 0, 120);
            $supplied = mb_substr(trim((string) ($row['supplied'] ?? '')), 0, 400);
            $period = mb_substr(trim((string) ($row['period'] ?? '')), 0, 120);
            $m3raw = trim((string) ($row['m3'] ?? ''));
            $m3 = (int) str_replace([' ', "\u{00A0}"], '', $m3raw);
            if ($name === '') {
                $bad[] = 'без названия';
                continue;
            }
            if ($m3raw !== '' && preg_match('/^[\d\s\x{00A0}]+$/u', $m3raw) !== 1) {
                $bad[] = $name . ': объём должен быть числом';
                continue;
            }
            ex('UPDATE objects SET name=?, place=?, supplied=?, m3=?, period=?, sort=? WHERE id=?',
                [$name, $place, $supplied, max(0, $m3), $period, (int) ($row['sort'] ?? 0), $id]);
            $saved++;
        }
    }
    flash('ob', $bad !== []
        ? 'Не сохранены: ' . implode('; ', $bad) . '. Остальное сохранено.'
        : "Сохранено объектов: {$saved}. Чтобы правка попала на сайт, нажмите «Опубликовать».",
        $bad !== [] ? 'err' : 'ok');
    header('Location: objects.php');
    exit;
}

$list = q('SELECT * FROM objects ORDER BY sort, id');

page_head('Объекты');
publish_bar();
show_flash('ob');
?>
<h1>Объекты</h1>
<p class="lead">Показываются на лендинге списком. Порядок задаётся числом.
  ⚠️ Сейчас здесь заглушки — объекты вымышленные, объёмы правдоподобные.</p>

<form method="post">
  <?= csrf_field() ?>
  <?php foreach ($list as $o): ?>
    <div class="card">
      <div class="grid">
        <div>
          <label class="req">Название</label>
          <input type="text" name="obj[<?= (int) $o['id'] ?>][name]" value="<?= h($o['name']) ?>">
        </div>
        <div>
          <label>Район или город</label>
          <input type="text" name="obj[<?= (int) $o['id'] ?>][place]" value="<?= h($o['place']) ?>">
        </div>
        <div>
          <label>Период</label>
          <input type="text" name="obj[<?= (int) $o['id'] ?>][period]" value="<?= h($o['period']) ?>">
          <p class="hint">Как называете сами: «март — август 2025».</p>
        </div>
        <div>
          <label>Объём, м³</label>
          <input type="text" inputmode="numeric" name="obj[<?= (int) $o['id'] ?>][m3]" value="<?= (int) $o['m3'] ?>">
        </div>
        <div>
          <label>Порядок</label>
          <input type="text" inputmode="numeric" name="obj[<?= (int) $o['id'] ?>][sort]" value="<?= (int) $o['sort'] ?>">
        </div>
      </div>
      <div style="margin-top:12px">
        <label>Что поставляли</label>
        <input type="text" name="obj[<?= (int) $o['id'] ?>][supplied]" value="<?= h($o['supplied']) ?>">
        <p class="hint">Свободной строкой, через запятую. С каталогом сверяться не нужно.</p>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn danger" type="submit" name="delete_id" value="<?= (int) $o['id'] ?>"
                onclick="return confirm('Удалить объект «<?= h($o['name']) ?>»?')">Удалить</button>
      </div>
    </div>
  <?php endforeach; ?>

  <div class="card">
    <div class="row">
      <button class="btn" type="submit" name="action" value="save">Сохранить объекты</button>
      <button class="btn ghost" type="submit" name="action" value="add">Добавить объект</button>
    </div>
  </div>
</form>
<?php page_foot(); ?>
