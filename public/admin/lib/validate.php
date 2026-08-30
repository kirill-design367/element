<?php
declare(strict_types=1);

/**
 * ПРОВЕРКА ПОЛЕЙ НА СЕРВЕРЕ.
 *
 * Браузерная проверка это удобство, а не защита: до любой страницы админки
 * можно достучаться curl'ом, минуя форму. Всё, что приходит из формы,
 * проверяется здесь — типы, длины, диапазоны, — и ошибки объясняются
 * словами, а не кодом.
 *
 * ОТДЕЛЬНО ПРО ПУСТОТУ И НОЛЬ. Цена может отсутствовать, и это НЕ ноль:
 * пустое поле означает «цены в прайсе нет» и на сайте превращается в
 * «уточняйте у менеджера», а ноль означал бы «бесплатно». Поэтому у цены
 * своя функция, которая возвращает null для пустой строки и число для
 * заполненной, включая ноль.
 */

/** Обрезка управляющих символов и лишних пробелов по краям. */
function clean(string $name, int $limit = 500): string
{
    $raw = (string) ($_POST[$name] ?? '');
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $raw) ?? '';
    /* Перевод строки оставляем только там, где он осмыслен (uses, summary):
       за это отвечает вызывающий, передавая многострочный текст через
       clean_multi(). Здесь строка сводится к одной. */
    $s = preg_replace('/\s+/u', ' ', $s) ?? '';
    return mb_substr(trim($s), 0, $limit, 'UTF-8');
}

/** То же, но переводы строк сохраняются: применения, описания. */
function clean_multi(string $name, int $limit = 4000): string
{
    $raw = (string) ($_POST[$name] ?? '');
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $raw) ?? '';
    $s = str_replace("\r\n", "\n", $s);
    return mb_substr(trim($s), 0, $limit, 'UTF-8');
}

/** Идентификатор записи: латиница, цифры и дефис. */
function clean_id(string $name): string
{
    $s = strtolower(clean($name, 64));
    return preg_replace('/[^a-z0-9-]/', '', $s) ?? '';
}

/**
 * ЧИСЛО ИЛИ ПУСТО. Возвращает null, если поле не заполнено, и false, если
 * заполнено мусором: три исхода, а не два, потому что «пусто» и «ерунда» —
 * разные вещи, и отвечать на них надо по-разному.
 *
 * Запятая понимается как десятичный разделитель: на русской раскладке её и
 * набирают. Пробелы выбрасываются — сайт сам печатает числа разрядкой.
 */
function num_or_null(string $name): float|null|false
{
    $raw = trim((string) ($_POST[$name] ?? ''));
    if ($raw === '') {
        return null;
    }
    $bare = str_replace([' ', "\u{00A0}", "\u{202F}", ','], ['', '', '', '.'], $raw);
    if (!is_numeric($bare)) {
        return false;
    }
    return (float) $bare;
}

/** Значение из закрытого списка. Чужое — первое из списка. */
function one_of(string $name, array $allowed, string $fallback): string
{
    $v = (string) ($_POST[$name] ?? '');
    return in_array($v, $allowed, true) ? $v : $fallback;
}

function checkbox(string $name): bool
{
    return isset($_POST[$name]) && $_POST[$name] !== '';
}
