/**
 * ЗАБРАТЬ ДАННЫЕ CMS С ХОСТИНГА.
 *
 * Шаг терпимый ко всему, что может пойти не так: сеть, хостинг, база,
 * отсутствие публикаций. Ни один из этих случаев не должен ронять сборку —
 * в репозитории лежат прежние данные, и сайт соберётся на них. Падать надо
 * не когда данных нет, а когда они пришли БИТЫЕ: это делает cms-apply.mjs.
 *
 * Отсюда правило: любой отказ здесь — это код выхода 0 и внятная строка в
 * журнале. Файл при этом не создаётся, и следующий шаг просто не запускается.
 *
 * Запуск:
 *   CMS_EXPORT_URL=https://elementst.ru/api/cms-export.php \
 *   CMS_EXPORT_KEY=… node scripts/cms-fetch.mjs cms-data.json
 */
import { writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'cms-data.json';
const url = process.env.CMS_EXPORT_URL ?? '';
const key = process.env.CMS_EXPORT_KEY ?? '';

/** Сообщение и мягкий выход: сборка продолжится на данных из репозитория. */
function fallback(reason) {
  console.log(`CMS: ${reason}`);
  console.log('CMS: сборка пойдёт на данных из репозитория — сайт выйдет прежним, а не пустым.');
  process.exit(0);
}

if (url === '' || key === '') {
  fallback('адрес выгрузки или ключ не заданы (CMS_EXPORT_URL, CMS_EXPORT_KEY)');
}

/* Таймаут обязателен. Без него зависший хостинг держал бы сборку до
   потолка задания, а нужно быстро откатиться на запасной вариант. */
const timeout = AbortSignal.timeout(20_000);

let res;
try {
  res = await fetch(url, { headers: { 'X-CMS-Key': key }, signal: timeout });
} catch (e) {
  fallback(`хостинг не ответил: ${e instanceof Error ? e.message : String(e)}`);
}

if (!res.ok) {
  /* 404 — публикаций ещё не было, это штатный случай на новом сайте.
     403 — ключ не подошёл, и об этом надо сказать отдельно: настройка. */
  const hint = res.status === 404
    ? 'публикаций из админки ещё не было'
    : res.status === 403
      ? 'ключ выгрузки не подошёл — сверьте CMS_EXPORT_KEY в секретах и export_key на хостинге'
      : `хостинг ответил кодом ${res.status}`;
  fallback(hint);
}

let body;
try {
  body = await res.json();
} catch {
  fallback('хостинг ответил не JSON — возможно, PHP на пути выключен');
}

if (body?.ok !== true || typeof body.data !== 'object' || body.data === null) {
  fallback('в ответе хостинга нет данных');
}

writeFileSync(out, JSON.stringify(body.data));
console.log(
  `CMS: снимок получен, опубликован ${body.published ?? '—'}, отпечаток ${String(body.digest ?? '').slice(0, 12)}`,
);
console.log(`CMS: записан ${out}`);
