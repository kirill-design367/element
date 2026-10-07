<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/snapshot.php';
require_once __DIR__ . '/lib/github.php';

require_login();

/**
 * ПУБЛИКАЦИЯ: СНИМОК ДАННЫХ И ЗАПУСК СБОРКИ.
 *
 * Два действия, и порядок между ними значим.
 *
 * 1. СНИМОК. Данные складываются в JSON и сохраняются в базу. Сборка потом
 *    забирает именно снимок, а не «то, что в базе сейчас»: она идёт
 *    полторы-две минуты, и всё это время заказчик может продолжать править.
 *    Без снимка на сайт уехала бы половина одной правки и половина другой.
 *
 * 2. ЗАПУСК. GitHub получает workflow_dispatch, и дальше всё как при
 *    обычном пуше: сборка забирает снимок, проверяет его, подставляет в
 *    проект и заливает по FTP.
 *
 * СНИМОК СОХРАНЯЕТСЯ ДО ЗАПУСКА. Если GitHub не ответит, снимок всё равно
 * останется — сборку можно будет запустить руками, и она возьмёт его же.
 * Наоборот было бы хуже: запуск без снимка означал бы сборку на данных,
 * которых никто не фиксировал.
 *
 * ТОКЕН ЛЕЖИТ В ФАЙЛЕ НАСТРОЕК ВНЕ КОРНЯ САЙТА и в репозиторий не попадает
 * никогда. Здесь он только читается.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.php');
    exit;
}
csrf_check();

$config = cms_config();
$data = snapshot_build();

/* ПУСТОЙ КАТАЛОГ НЕ ПУБЛИКУЕТСЯ. Дальше его отвергнет и сборка, но
   останавливать надо здесь: иначе человек уйдёт, думая, что опубликовал. */
if (count($data['materials']) === 0 || count($data['categories']) === 0) {
    flash('publish', 'В каталоге нет позиций или категорий — публиковать нечего. '
        . 'Сайт остался прежним.', 'err');
    header('Location: index.php');
    exit;
}

$json = snapshot_json($data);
$digest = snapshot_digest($data);
ex('INSERT INTO snapshots (payload, digest, created_at) VALUES (?, ?, NOW())', [$json, $digest]);
$snapshotId = (int) db()->lastInsertId();

/* Значения приводятся к нужному виду ДО запроса: адрес репозитория целиком,
   путь вместо имени файла, лишний пробел на конце строки — каждый из этих
   случаев давал бы 404, неотличимый от «нет прав у токена». Разбор — в
   lib/github.php. */
['repo' => $repo, 'workflow' => $workflow, 'ref' => $ref, 'token' => $token] = gh_settings();

if ($token === '' || $repo === '') {
    flash('publish', 'Данные сохранены снимком, но запустить сборку не удалось: '
        . 'в настройках на хостинге не заполнены github_token и github_repo. '
        . 'Сайт остался прежним.', 'err');
    ex('UPDATE snapshots SET dispatch = ? WHERE id = ?', ['сборка не запускалась: нет токена', $snapshotId]);
    header('Location: index.php');
    exit;
}

$res = gh_request(
    'POST',
    '/repos/' . $repo . '/actions/workflows/' . rawurlencode($workflow) . '/dispatches',
    $token,
    ['ref' => $ref],
);

/* Пересказ ответа словами живёт в lib/github.php: тот же разбор нужен и
   странице проверки связи, и держать два списка кодов нельзя — разойдутся. */
$message = gh_explain($res['code'], $res['error']);
$code = $res['code'];

if ($message === '') {
    ex('UPDATE snapshots SET dispatch = ? WHERE id = ?', ['сборка запущена', $snapshotId]);
    flash('publish', 'Публикация запущена. Сборка и выкладка занимают одну-две минуты — '
        . 'обновите сайт через пару минут. Пока она идёт, править данные можно: '
        . 'на сайт уедет снимок, сделанный сейчас.');
} else {
    ex('UPDATE snapshots SET dispatch = ? WHERE id = ?', ['ошибка запуска', $snapshotId]);
    flash('publish', $message, 'err');
}

header('Location: index.php');
