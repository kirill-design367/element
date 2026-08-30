<?php
declare(strict_types=1);

/**
 * ВЫГРУЗКА СНИМКА ДЛЯ СБОРКИ.
 *
 * Этот адрес зовёт GitHub Actions перед сборкой сайта. Отдаётся ПОСЛЕДНИЙ
 * ОПУБЛИКОВАННЫЙ СНИМОК, а не то, что в базе прямо сейчас: сборка идёт
 * полторы-две минуты, и всё это время заказчик может продолжать править.
 * Без снимка на сайт уехала бы половина одной правки и половина другой.
 *
 * ЗАКРЫТО КЛЮЧОМ, И ЭТО НЕ ПЕРЕСТРАХОВКА. Почти всё в снимке и так на
 * сайте — цены, номенклатура, контакты, — но не всё: банковские реквизиты
 * заказчик правит в админке, а на сайте они не показываются нигде. Отдавать
 * их по угадываемому адресу нельзя.
 *
 * Ключ живёт в файле настроек на хостинге и в секретах репозитория под
 * именем CMS_EXPORT_KEY. Сравнение через hash_equals: обычное сравнение
 * строк выходит из цикла на первом несовпавшем символе, и ключ подбирается
 * по времени ответа.
 *
 * ОТВЕТ ВСЕГДА JSON, даже на отказ: сборка разбирает его и по нему решает,
 * брать данные CMS или запасной вариант из репозитория.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

require_once __DIR__ . '/../admin/lib/config-load.php';
require_once __DIR__ . '/../admin/lib/db.php';

function out(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$config = cms_config();
$expected = (string) ($config['export_key'] ?? '');
if ($expected === '') {
    out(500, ['ok' => false, 'error' => 'На хостинге не задан export_key.']);
}

/* Ключ принимается заголовком, а не в адресе: адреса попадают в логи
   сервера и в историю, заголовки — нет. */
$given = (string) ($_SERVER['HTTP_X_CMS_KEY'] ?? '');
if (!hash_equals($expected, $given)) {
    out(403, ['ok' => false, 'error' => 'Ключ не подошёл.']);
}

$row = q1('SELECT payload, digest, created_at FROM snapshots ORDER BY id DESC LIMIT 1');
if ($row === null) {
    /* Публикаций ещё не было. Это не ошибка: сборка возьмёт запасной
       вариант из репозитория и скажет об этом в журнале. */
    out(404, ['ok' => false, 'error' => 'Публикаций ещё не было.']);
}

$data = json_decode((string) $row['payload'], true);
if (!is_array($data)) {
    out(500, ['ok' => false, 'error' => 'Снимок в базе повреждён.']);
}

out(200, [
    'ok' => true,
    'digest' => (string) $row['digest'],
    'published' => (string) $row['created_at'],
    'data' => $data,
]);
