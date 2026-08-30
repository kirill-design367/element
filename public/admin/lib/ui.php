<?php
declare(strict_types=1);

/**
 * ОФОРМЛЕНИЕ АДМИНКИ.
 *
 * Собственные стили строкой, без сборки и без библиотек: админка это
 * десяток страниц с таблицами и формами, и тащить ради них конвейер незачем.
 * Открывается она в том числе с телефона — прямо на площадке, — поэтому
 * таблица на узком экране превращается в карточки, а поля растягиваются на
 * всю ширину.
 *
 * Оформление намеренно НЕ повторяет сайт: это рабочий инструмент, а не
 * витрина, и путать одно с другим не надо.
 */

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

/** Заголовок страницы и шапка. */
function page_head(string $title, bool $withNav = true): void
{
    ?><!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title><?= h($title) ?> — админка «Элемент»</title>
<style>
  :root { --ink:#17191c; --ink2:#5a5f66; --line:#dcdcd6; --bg:#f4f4f1; --surface:#fff;
          --accent:#173fa6; --warn:#b3261e; --ok:#1d6b3a; }
  * { box-sizing:border-box; }
  body { margin:0; font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         color:var(--ink); background:var(--bg); }
  a { color:var(--accent); }
  .wrap { max-width:1180px; margin:0 auto; padding:0 16px 64px; }
  header.top { background:var(--surface); border-bottom:1px solid var(--line); position:sticky; top:0; z-index:5; }
  .topin { max-width:1180px; margin:0 auto; padding:10px 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  .brand { font-weight:700; margin-right:auto; }
  nav.tabs { display:flex; gap:2px; flex-wrap:wrap; margin:0 auto 0 0; }
  nav.tabs a { padding:7px 12px; border-radius:8px; text-decoration:none; color:var(--ink2); font-size:15px; }
  nav.tabs a.on { background:var(--bg); color:var(--ink); font-weight:600; }
  nav.tabs a:hover { background:var(--bg); color:var(--ink); }
  h1 { font-size:22px; margin:22px 0 4px; }
  .lead { color:var(--ink2); margin:0 0 18px; font-size:15px; }
  .card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:16px; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; background:var(--surface); }
  th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
  th { font-size:13px; color:var(--ink2); font-weight:600; text-transform:none; }
  tbody tr:hover { background:#fafaf8; }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  input[type=text], input[type=password], input[type=number], select, textarea {
    width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:8px;
    font:inherit; background:var(--surface); color:var(--ink); }
  input:focus, select:focus, textarea:focus { outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent); }
  textarea { resize:vertical; min-height:64px; }
  label { display:block; font-size:14px; color:var(--ink2); margin-bottom:4px; }
  .req::after { content:" *"; color:var(--warn); }
  .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
  .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:8px;
         border:1px solid var(--accent); background:var(--accent); color:#fff; font:inherit;
         font-weight:500; cursor:pointer; text-decoration:none; }
  .btn:hover { background:#0f2f80; }
  .btn.ghost { background:var(--surface); color:var(--ink); border-color:var(--line); }
  .btn.ghost:hover { background:var(--bg); }
  .btn.danger { background:var(--surface); color:var(--warn); border-color:#e5c4c1; }
  .btn[disabled] { opacity:.5; cursor:not-allowed; }
  .row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .msg { padding:11px 14px; border-radius:8px; margin-bottom:16px; font-size:15px; }
  .msg.ok { background:#e7f3ec; color:var(--ok); }
  .msg.err { background:#fbeceb; color:var(--warn); }
  .msg.info { background:#eaeef8; color:var(--accent); }
  .hint { font-size:13px; color:var(--ink2); margin-top:4px; }
  .err-text { color:var(--warn); font-size:13px; margin-top:4px; }
  .pill { display:inline-block; padding:2px 8px; border-radius:99px; font-size:12px; background:var(--bg); color:var(--ink2); }
  .pill.on { background:#e7f3ec; color:var(--ok); }
  .pill.no { background:#fbeceb; color:var(--warn); }
  .muted { color:var(--ink2); }
  .pubbar { background:var(--surface); border:1px solid var(--line); border-radius:10px;
            padding:12px 16px; margin:16px 0; display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .pubbar .state { margin-right:auto; font-size:14px; color:var(--ink2); }
  @media (max-width:720px) {
    .hide-s { display:none; }
    table, tbody, tr, td { display:block; width:100%; }
    thead { display:none; }
    tbody tr { border:1px solid var(--line); border-radius:10px; margin-bottom:10px; background:var(--surface); padding:6px 4px; }
    td { border:0; padding:5px 10px; }
    td::before { content:attr(data-l) " "; color:var(--ink2); font-size:13px; }
    .num { text-align:left; }
  }
</style>
</head>
<body>
<?php if ($withNav): ?>
<header class="top"><div class="topin">
  <span class="brand">Элемент — данные сайта</span>
  <nav class="tabs">
    <?php
    $here = basename((string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $tabs = [
        'index.php' => 'Публикация',
        'materials.php' => 'Каталог',
        'categories.php' => 'Категории',
        'company.php' => 'Контакты',
        'objects.php' => 'Объекты',
        'fleet.php' => 'Парк',
    ];
    foreach ($tabs as $file => $name) {
        $on = $here === $file || ($file === 'materials.php' && $here === 'material.php');
        echo '<a href="' . h($file) . '"' . ($on ? ' class="on"' : '') . '>' . h($name) . '</a>';
    }
    ?>
  </nav>
  <a class="btn ghost" href="logout.php">Выйти</a>
</div></header>
<?php endif; ?>
<div class="wrap">
<?php
}

function page_foot(): void
{
    echo "</div>\n</body>\n</html>\n";
}

/** Сообщение об успехе или отказе поверх страницы. */
function flash(string $key, string $text = null, string $kind = 'ok'): ?array
{
    if ($text !== null) {
        $_SESSION['flash'][$key] = ['text' => $text, 'kind' => $kind];
        return null;
    }
    $got = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);
    return $got;
}

function show_flash(string $key): void
{
    $f = flash($key);
    if ($f) {
        echo '<div class="msg ' . h($f['kind']) . '">' . h($f['text']) . '</div>';
    }
}

/** Русское склонение после числа: 1 позиция, 2 позиции, 5 позиций. */
function plural_ru(int $n, string $one, string $few, string $many): string
{
    $mod100 = $n % 100;
    if ($mod100 >= 11 && $mod100 <= 14) {
        return $many;
    }
    return match ($n % 10) {
        1 => $one,
        2, 3, 4 => $few,
        default => $many,
    };
}

/**
 * Обозначение партии одной строкой — то же, что видно в карточке на сайте.
 *
 * Собирается ИЗ ЧИСЕЛ, а не берётся отдельным полем: подпись и границы
 * подбора должны быть одним и тем же фактом. Исключение — вид «none», там
 * подпись это не размер зерна, а обозначение («⌀ 10 мм», «просеянный»).
 */
function fraction_text(array $m): string
{
    $from = $m['fraction_from'];
    $to = $m['fraction_to'];
    return match ((string) $m['fraction_kind']) {
        'mm' => num_ru($from) . '–' . num_ru($to) . ' мм',
        'mkr' => 'Мкр ' . num_ru($from, 1) . '–' . num_ru($to, 1),
        'gravel' => 'гравий ' . num_ru($m['fraction_percent']) . ' %',
        default => (string) ($m['fraction_label'] ?? ''),
    };
}

/** Число по-русски: запятая вместо точки, без хвостовых нулей. */
function num_ru(mixed $v, int $decimals = 0): string
{
    if ($v === null || $v === '') {
        return '';
    }
    $f = (float) $v;
    $s = $decimals > 0 || fmod($f, 1.0) !== 0.0
        ? rtrim(rtrim(number_format($f, max($decimals, 2), ',', ' '), '0'), ',')
        : number_format($f, 0, ',', ' ');
    return $s;
}
