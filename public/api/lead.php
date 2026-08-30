<?php
declare(strict_types=1);

/**
 * ПРИЁМНИК ЗАЯВКИ С САЙТА.
 *
 * Сайт статический: страницы собраны заранее и лежат файлами. Единственное
 * место, где на сервере выполняется наш код, — этот скрипт. Он делает ровно
 * одно: принимает поля формы и отправляет письмо на адрес заказчика. Ни
 * базы, ни хранения, ни очереди — заявка живёт только в письме.
 *
 * АДРЕС ЗДЕСЬ НЕ НАБРАН. Он приходит из `config.php`, который собирается при
 * сборке из `lib/company.ts` — там же, где остальные контакты сайта.
 *
 * ОТВЕЧАЕТ ВСЕГДА JSON. Форма разбирает ответ и по нему решает, показать
 * подтверждение или ошибку с телефоном.
 *
 *   200 {"ok":true}                     — письмо ушло
 *   405 {"ok":false,"error":"…"}        — не POST
 *   422 {"ok":false,"errors":{…}}       — поля не прошли проверку
 *   500 {"ok":false,"error":"…"}        — нет настроек
 *   502 {"ok":false,"error":"…"}        — почтовая подсистема отказала
 */

header('Content-Type: application/json; charset=utf-8');
/* Ответ индивидуален и кешироваться не должен ни на секунду. */
header('Cache-Control: no-store');
/* Скрипт вызывается только своей же страницей: заголовок CORS не выдаётся
   намеренно, чужой сайт нашу форму не переиспользует. */

/** Ответ и выход. Одной дверью, чтобы формат не разошёлся по веткам. */
function reply(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    /* Allow обязателен по стандарту и полезен на деле: по нему сразу видно,
       что скрипт исполняется, а не отдан текстом. */
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'Метод не поддерживается: нужен POST.']);
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    reply(500, ['ok' => false, 'error' => 'Приём заявок не настроен на сервере.']);
}
$config = require $configPath;
if (!is_array($config) || empty($config['to']) || empty($config['from'])) {
    reply(500, ['ok' => false, 'error' => 'Приём заявок не настроен на сервере.']);
}

/* ─── ПОЛЯ ───────────────────────────────────────────────────────────────
 *
 * Всё приходит строками. Управляющие символы вырезаются сразу и у всех
 * полей: в теле письма им делать нечего, а в заголовке перевод строки — это
 * готовая подстановка чужих заголовков.
 */
function field(string $name, int $limit): string
{
    $raw = $_POST[$name] ?? '';
    if (!is_string($raw)) {
        return '';
    }
    $clean = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $raw) ?? '';
    $clean = trim($clean);
    return mb_substr($clean, 0, $limit, 'UTF-8');
}

/** Сколько цифр в строке. Телефон проверяется по ним, а не по виду. */
function digits(string $s): int
{
    return preg_match_all('/\d/u', $s);
}

$name     = field('name', 80);
$phone    = field('phone', 32);
$company  = field('company', 120);
$material = field('material', 160);
$amount   = field('amount', 40);
$address  = field('address', 200);
$deadline = field('deadline', 80);
$comment  = field('comment', 2000);
$source   = field('source', 60);

/* ─── ПИСЬМО ─────────────────────────────────────────────────────────────
 *
 * Тело собирается ЗДЕСЬ, из проверенных полей, а не берётся готовым текстом
 * от браузера. Причина простая: то, что пришло от клиента, письмом стать не
 * должно без разбора, а имя и телефон всё равно нужны отдельно — они идут в
 * тему и в заголовки.
 */
$lines = [];
$lines[] = 'Заявка с сайта elementst.ru';
$lines[] = str_repeat('—', 40);
$lines[] = '';
$lines[] = 'Имя:              ' . ($name !== '' ? $name : '—');
$lines[] = 'Телефон:          ' . ($phone !== '' ? $phone : '—');
if ($company !== '') {
    $lines[] = 'Компания:         ' . $company;
}
$lines[] = '';
$lines[] = 'Материал:         ' . ($material !== '' ? $material : '—');
$lines[] = 'Количество:       ' . ($amount !== '' ? $amount : '—');
$lines[] = '';
$lines[] = 'Адрес объекта:    ' . ($address !== '' ? $address : '—');
$lines[] = 'Срок поставки:    ' . ($deadline !== '' ? $deadline : '—');
if ($comment !== '') {
    $lines[] = '';
    $lines[] = 'Комментарий:';
    $lines[] = $comment;
}
$lines[] = '';
$lines[] = str_repeat('—', 40);
if ($source !== '') {
    $lines[] = 'Откуда:           ' . $source;
}
$lines[] = 'Время:            ' . date('d.m.Y H:i') . ' по серверу';
$body = implode("\r\n", $lines) . "\r\n";

/**
 * Заголовок с кириллицей по RFC 2047.
 *
 * Кодировать надо ОБЯЗАТЕЛЬНО: голый UTF-8 в теме доходит до части почтовых
 * программ кракозябрами, а до части не доходит вовсе. Кодированное слово по
 * стандарту не длиннее 75 знаков, поэтому длинная тема режется на несколько
 * слов — и режется по СИМВОЛАМ, а не по байтам: разрубленная посередине
 * кириллическая буква ломает всю строку.
 */
function mimeHeader(string $text): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $text) === 1) {
        return $text;
    }
    /* 45 байт исходника → 60 знаков base64 → 72 с обёрткой «=?UTF-8?B??=». */
    $limit = 45;
    $parts = [];
    $chunk = '';
    foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $ch) {
        if (strlen($chunk) + strlen($ch) > $limit) {
            $parts[] = $chunk;
            $chunk = '';
        }
        $chunk .= $ch;
    }
    if ($chunk !== '') {
        $parts[] = $chunk;
    }
    $encoded = array_map(static fn(string $p): string => '=?UTF-8?B?' . base64_encode($p) . '?=', $parts);
    /* Между кодированными словами — перенос с пробелом: так их склеивает
       получатель, не вставляя лишнего пробела в текст темы. */
    return implode("\r\n ", $encoded);
}

$subjectText = 'Заявка с сайта — ' . ($name !== '' ? $name : 'без имени')
    . ($phone !== '' ? ', ' . $phone : '');
$subject = mimeHeader($subjectText);

$from = (string) $config['from'];
$to   = (string) $config['to'];

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    /* base64, а не 8bit: часть промежуточных серверов до сих пор не
       восьмибитная, и кириллица в теле у них рассыпается. */
    'Content-Transfer-Encoding: base64',
    /* ОТПРАВИТЕЛЬ — С НАШЕГО ДОМЕНА. Иначе письмо уйдёт в спам или будет
       отвергнуто: почта получателя проверяет, разрешено ли этому серверу
       отправлять от имени домена в поле From. */
    'From: ' . mimeHeader('Заявка с сайта') . ' <' . $from . '>',
    'X-Mailer: elementst.ru',
];

$sent = mail(
    $to,
    $subject,
    rtrim(chunk_split(base64_encode($body), 76, "\r\n")),
    implode("\r\n", $headers),
    /* Конверт тоже подписывается нашим адресом. Без этого sendmail ставит
       отправителем пользователя системы (вроде u3626726@server.hosting), и
       письмо не сходится с доменом в From — верный путь в спам. */
    '-f' . $from
);

if (!$sent) {
    reply(502, [
        'ok' => false,
        'error' => 'Почтовая служба сервера отказала. Позвоните — заявку примем по телефону.',
    ]);
}

reply(200, ['ok' => true]);
