<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/snapshot.php';

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

$repo = (string) ($config['github_repo'] ?? '');
$workflow = (string) ($config['github_workflow'] ?? 'deploy.yml');
$ref = (string) ($config['github_ref'] ?? 'main');
$token = (string) ($config['github_token'] ?? '');

if ($token === '' || $repo === '') {
    flash('publish', 'Данные сохранены снимком, но запустить сборку не удалось: '
        . 'в настройках на хостинге не заполнены github_token и github_repo. '
        . 'Сайт остался прежним.', 'err');
    ex('UPDATE snapshots SET dispatch = ? WHERE id = ?', ['сборка не запускалась: нет токена', $snapshotId]);
    header('Location: index.php');
    exit;
}

$url = "https://api.github.com/repos/{$repo}/actions/workflows/{$workflow}/dispatches";
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
        'X-GitHub-Api-Version: 2022-11-28',
        /* GitHub отвергает запросы без User-Agent — это не рекомендация, а
           требование их API. */
        'User-Agent: elementst-cms',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode(['ref' => $ref], JSON_UNESCAPED_SLASHES),
]);
$body = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($ch);
curl_close($ch);

/**
 * ОТВЕТ ПЕРЕСКАЗЫВАЕТСЯ ЧЕЛОВЕЧЕСКИМИ СЛОВАМИ, А НЕ КОДОМ.
 *
 * «404» человеку не говорит ничего, а вот «GitHub не нашёл сборку — проверьте
 * имя файла в настройках» говорит, куда идти. Коды здесь те, которые GitHub
 * действительно отдаёт на этот запрос.
 */
$message = match (true) {
    $body === false => 'Не получилось достучаться до GitHub: ' . ($curlError !== '' ? $curlError : 'нет ответа')
        . '. Данные сохранены — попробуйте опубликовать ещё раз через минуту.',
    $code === 204 => '',
    $code === 401 => 'GitHub не принял токен. Скорее всего он истёк или отозван — нужен новый в настройках на хостинге.',
    $code === 403 => 'GitHub отказал: у токена нет права запускать сборку. Нужно разрешение Actions: чтение и запись.',
    $code === 404 => 'GitHub не нашёл сборку. Проверьте в настройках имя репозитория и файла сборки.',
    $code === 422 => 'GitHub принял запрос, но не смог запустить: обычно это значит, что ветка указана неверно.',
    default => "GitHub ответил кодом {$code}. Данные сохранены, сборку можно запустить вручную на GitHub.",
};

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
