<?php
declare(strict_types=1);

/**
 * ЗАГРУЗКА НАСТРОЕК АДМИНКИ.
 *
 * Настройки лежат ВНЕ КОРНЯ САЙТА — там же токен GitHub и пароль от базы.
 * Внутри корня им не место по двум причинам сразу: браузер может запросить
 * файл напрямую, а выкладка с `--delete` стёрла бы его при первой же
 * публикации.
 *
 * Путь не записан числом, а ищется: ISPmanager кладёт домены по-разному, и
 * промах здесь означал бы, что админка не открывается вовсе, без объяснения
 * причины. Перебираются четыре места, и если не нашлось ни одного — на
 * экране печатается список того, где искали.
 */

/** @return array<string,mixed> */
function cms_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    foreach (cms_config_candidates() as $path) {
        if ($path !== '' && is_file($path)) {
            $loaded = require $path;
            if (!is_array($loaded)) {
                cms_config_fail('Файл настроек найден, но он не возвращает массив: ' . $path);
            }
            $config = $loaded;
            return $config;
        }
    }
    cms_config_fail(null);
}

/** Где ищем файл настроек. Порядок от точного к запасному. */
function cms_config_candidates(): array
{
    $root = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
    return [
        (string) getenv('ELEMENT_CMS_CONFIG'),
        /* Рядом с корнем сайта: /www/cms-config.php */
        $root !== '' ? dirname($root) . '/cms-config.php' : '',
        /* Точка входа FTP: /cms-config.php — рекомендуемое место. */
        $root !== '' ? dirname($root, 2) . '/cms-config.php' : '',
        /* Запасной путь от самого скрипта, если DOCUMENT_ROOT пуст. */
        dirname(__DIR__, 4) . '/cms-config.php',
    ];
}

/** Понятная страница вместо белого экрана или следа исключения. */
function cms_config_fail(?string $reason): never
{
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    $where = '';
    foreach (cms_config_candidates() as $p) {
        if ($p !== '') {
            $where .= '<li><code>' . htmlspecialchars($p, ENT_QUOTES) . '</code></li>';
        }
    }
    echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
        . '<title>Админка не настроена</title>'
        . '<style>body{font:16px/1.6 system-ui,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1.25rem;color:#17191c}'
        . 'code{background:#f0f0ee;padding:.1em .35em;border-radius:4px;font-size:.9em}'
        . 'h1{font-size:1.5rem}li{margin:.3em 0}</style></head><body>';
    echo '<h1>Админка ещё не настроена</h1>';
    if ($reason !== null) {
        echo '<p>' . htmlspecialchars($reason, ENT_QUOTES) . '</p>';
    } else {
        echo '<p>Нет файла настроек. Скопируйте <code>/admin/cms-config.sample.php</code>, '
            . 'впишите доступы и положите копию под именем <code>cms-config.php</code> '
            . 'по FTP в корень аккаунта — рядом с папкой <code>www</code>, а не внутрь сайта.</p>';
        echo '<p>Искали здесь:</p><ul>' . $where . '</ul>';
        echo '<p>Внутрь корня сайта класть нельзя: выкладка стирает оттуда всё, '
            . 'чего нет в сборке, — файл с доступами исчез бы при первой публикации.</p>';
    }
    echo '</body></html>';
    exit;
}
