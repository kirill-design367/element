<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * ПОДКЛЮЧЕНИЕ К БАЗЕ.
 *
 * PDO, а не mysqli, ради одного: подготовленные выражения здесь читаются
 * так же, как обычный запрос, и подставлять значения в строку руками просто
 * не хочется. Весь код админки ходит в базу ТОЛЬКО через них — склейки SQL
 * со значением из формы нет ни одной.
 *
 * ОШИБКИ БРОСАЮТСЯ ИСКЛЮЧЕНИЕМ, а не молча возвращают false: молчаливый
 * false в CMS означает «правка не сохранилась, а человек думает, что
 * сохранилась».
 *
 * EMULATE_PREPARES ВЫКЛЮЧЕН. С эмуляцией PDO подставляет значения сам, и
 * подготовленное выражение перестаёт быть подготовленным — оно снова
 * становится склейкой строк, просто выполненной внутри драйвера.
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = cms_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        (string) ($c['db_host'] ?? 'localhost'),
        (string) ($c['db_name'] ?? ''),
    );
    try {
        $pdo = new PDO($dsn, (string) ($c['db_user'] ?? ''), (string) ($c['db_pass'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        /* Текст исключения PDO содержит имя базы и пользователя — в браузер
           он не идёт. Человеку говорится, что случилось и куда смотреть. */
        cms_config_fail('Не получилось подключиться к базе данных. Проверьте db_host, db_name, db_user и db_pass в файле настроек.');
    }
    return $pdo;
}

/** Выборка списка. */
function q(string $sql, array $args = []): array
{
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->fetchAll();
}

/** Выборка одной строки или null. */
function q1(string $sql, array $args = []): ?array
{
    $row = q($sql, $args);
    return $row[0] ?? null;
}

/** Выполнение без выборки. Возвращает число затронутых строк. */
function ex(string $sql, array $args = []): int
{
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->rowCount();
}

/** Есть ли таблицы админки вообще. По ней install.php решает, что делать. */
function db_installed(): bool
{
    try {
        q('SELECT 1 FROM materials LIMIT 1');
        return true;
    } catch (PDOException) {
        return false;
    }
}
