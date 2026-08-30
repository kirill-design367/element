<?php
declare(strict_types=1);

/**
 * ПРЯМОЕ ОБРАЩЕНИЕ ИЗ БРАУЗЕРА ОТБИВАЕТСЯ ЗДЕСЬ ЖЕ.
 *
 * Файл — библиотека, его подключают страницы админки. Открытый по адресу, он
 * и так ничего не печатает: сплошные объявления функций. Но полагаться на это
 * нельзя, и на настройки сервера тоже: 30.08 выяснилось, что .htaccess в
 * подпапке на этом хостинге не применяется вовсе.
 *
 * Признак «нас открыли напрямую» — совпадение имени запрошенного скрипта с
 * этим файлом. При подключении через require они разные.
 */
if (
    isset($_SERVER['SCRIPT_FILENAME'])
    && realpath((string) $_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    http_response_code(403);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/** Сколько сидеть без действий, прежде чем сессия истечёт. */
const SESSION_TTL = 3600;
/** С какой попытки начинается задержка. */
const LOCK_AFTER = 3;
/** Потолок задержки, секунды. */
const LOCK_MAX = 300;

/**
 * ТОЛЬКО ПО HTTPS.
 *
 * Спереди стоит nginx, и Apache видит соединение от него как
 * незашифрованное: $_SERVER['HTTPS'] у него всегда пуст, сколько бы
 * посетитель ни пришёл по https. О настоящей схеме говорит только
 * X-Forwarded-Proto — ровно та же история, что в .htaccess с редиректом.
 */
function require_https(): void
{
    $https = ($_SERVER['HTTPS'] ?? '') === 'on'
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    if ($https) {
        return;
    }
    /* На локальной машине без сертификата админку тоже надо открывать. */
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if (str_starts_with($host, 'localhost') || str_starts_with($host, '127.0.0.1')) {
        return;
    }
    header('Location: https://' . $host . ($_SERVER['REQUEST_URI'] ?? '/admin/'), true, 301);
    exit;
}

/**
 * Заголовки, общие для всех страниц админки.
 *
 * ОТ ИНДЕКСАЦИИ ЗАКРЫТА ЗАГОЛОВКОМ, А НЕ СТРОКОЙ В robots.txt. robots.txt
 * открыт всем, и запись `Disallow: /admin/` опубликовала бы ровно тот
 * адрес, который прячется. Главная защита — отсутствие ссылок: на админку не
 * ссылается ни одна страница сайта.
 */
function send_headers(): void
{
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: no-store, private');
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('Content-Type: text/html; charset=utf-8');
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/admin/',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure' => ($_SERVER['HTTPS'] ?? '') === 'on'
            || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https',
    ]);
    session_name('elementadm');
    session_start();
}

/**
 * НАСТОЯЩИЙ АДРЕС ЛЕЖИТ НЕ В REMOTE_ADDR. Apache видит соединение от
 * локального nginx, и без разбора заголовков защита от перебора считала бы
 * всех одним человеком. Заголовкам верим только с петли.
 */
function client_ip(): string
{
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($remote === '' || $remote === '127.0.0.1' || $remote === '::1') {
        foreach (['HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR'] as $h) {
            $v = (string) ($_SERVER[$h] ?? '');
            if ($v === '') {
                continue;
            }
            $first = trim(explode(',', $v)[0]);
            if (filter_var($first, FILTER_VALIDATE_IP) !== false) {
                return $first;
            }
        }
    }
    return $remote !== '' ? $remote : 'unknown';
}

function ip_key(): string
{
    return hash('sha256', client_ip() . '|element-admin');
}

/**
 * СКОЛЬКО ЖДАТЬ ПОСЛЕ НЕУДАЧНЫХ ПОПЫТОК.
 *
 * Задержка, а не блокировка: заблокированный вход это отказ в обслуживании
 * самому себе — заказчик, ошибившийся паролем трижды, не должен остаться без
 * админки до утра. Растёт вдвое с каждой попыткой и упирается в пять минут.
 *
 * Считается по НЕУДАЧНЫМ попыткам: удачный вход обнуляет счётчик.
 */
function lock_seconds(): int
{
    $row = q1('SELECT fails, UNIX_TIMESTAMP(last_at) AS ts FROM login_attempts WHERE ip_hash = ?', [ip_key()]);
    if (!$row) {
        return 0;
    }
    $fails = (int) $row['fails'];
    if ($fails < LOCK_AFTER) {
        return 0;
    }
    $wait = min(LOCK_MAX, 2 ** ($fails - LOCK_AFTER + 1) * 5);
    $left = (int) $row['ts'] + $wait - time();
    return max(0, $left);
}

function note_failure(): void
{
    ex(
        'INSERT INTO login_attempts (ip_hash, fails, last_at) VALUES (?, 1, NOW())
         ON DUPLICATE KEY UPDATE fails = fails + 1, last_at = NOW()',
        [ip_key()],
    );
}

function clear_failures(): void
{
    ex('DELETE FROM login_attempts WHERE ip_hash = ?', [ip_key()]);
}

function is_logged_in(): bool
{
    if (empty($_SESSION['admin'])) {
        return false;
    }
    /* Выход по времени. Сессия без действий дольше часа считается чужой:
       админку открывают с телефона и оставляют открытой. */
    if (time() - (int) ($_SESSION['seen'] ?? 0) > SESSION_TTL) {
        logout();
        return false;
    }
    $_SESSION['seen'] = time();
    return true;
}

function login_ok(string $login, string $password): bool
{
    $c = cms_config();
    $expectedLogin = (string) ($c['login'] ?? '');
    $hash = (string) ($c['password_hash'] ?? '');
    /* hash_equals, а не ==: сравнение строк выходит из цикла на первом
       несовпавшем символе, и по времени ответа логин подбирается. */
    $loginOk = hash_equals($expectedLogin, $login);
    $passOk = $hash !== '' && password_verify($password, $hash);
    return $loginOk && $passOk;
}

function do_login(): void
{
    /* Новый идентификатор сессии после входа: иначе тот, кто подсунул
       посетителю свой идентификатор до входа, получил бы вошедшую сессию. */
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['seen'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/** Страница только для вошедших. */
function require_login(): void
{
    require_https();
    send_headers();
    start_session();
    if (!is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

/* ── Защита от подделки запросов ───────────────────────────────────────
 *
 * Токен один на сессию и проверяется на КАЖДОЙ форме. Без него чужая
 * страница, открытая в соседней вкладке, могла бы отправить в админку
 * форму от имени вошедшего — и, например, обнулить цены.
 */
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES) . '">';
}

function csrf_check(): void
{
    $sent = (string) ($_POST['csrf'] ?? '');
    if (!hash_equals(csrf_token(), $sent)) {
        http_response_code(400);
        send_headers();
        echo '<!doctype html><meta charset="utf-8"><p>Форма устарела — откройте страницу заново и повторите.</p>';
        exit;
    }
}
