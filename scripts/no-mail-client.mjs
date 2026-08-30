/**
 * ПРОВЕРКА, ЧТО САЙТ НЕ ОТПРАВЛЯЕТ ЗАЯВКУ ЧЕРЕЗ ПОЧТОВЫЙ КЛИЕНТ.
 *
 * Пока сервера не было, форма собирала текст письма и открывала почтовую
 * программу посетителя. У половины людей она не настроена, и заявка на этом
 * заканчивалась: человек видел, что «что-то произошло», а до нас ничего не
 * доходило. Кнопку письма убрали 26.08, отправку на сервер завели 30.08 —
 * и возвращаться этому механизму нельзя.
 *
 * ПРОВЕРЯЕТСЯ ДВА РАЗНЫХ ЗАПРЕТА, И ПУТАТЬ ИХ НЕЛЬЗЯ.
 *
 * 1. Почтовик не открывается КОДОМ. Ни `location.href = 'mailto:…'`, ни
 *    `window.open('mailto:…')`, ни клик по собранной на лету ссылке. Это и
 *    есть отправка через почтовый клиент, и её быть не должно нигде.
 *
 * 2. Ссылка `mailto:` как КАНАЛ СВЯЗИ — другое дело, и она остаётся. Адрес
 *    настоящий с 29.08, и почта стоит там, где её ищут: в контактах и в
 *    подвале. Это не отправка формы, а способ написать письмо руками, и
 *    убирать его значило бы снять канал, который заказчик только что
 *    завёл. Поэтому список мест закрытый: появится `mailto:` где-то ещё —
 *    проверка упадёт, и решение придётся принять осознанно.
 *
 * Запускается в сборке рядом с no-basepath.mjs и локально:
 *   node scripts/no-mail-client.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/** Где `mailto:` разрешён и почему. Ключ — путь, значение — обоснование. */
const ALLOWED = {
  'components/home/Contacts.tsx': 'почта в блоке контактов — канал связи, правило 15',
  'components/site/Footer.tsx': 'почта в подвале — тот же канал, правило 15',
};

/** Открытие почтовика кодом. Ищется по коду, а не по разметке. */
const OPENERS = [
  /location\s*(?:\.\s*href)?\s*=\s*[`'"]\s*mailto:/i,
  /(?:window\s*\.\s*)?open\s*\(\s*[`'"]\s*mailto:/i,
  /location\s*\.\s*(?:assign|replace)\s*\(\s*[`'"]\s*mailto:/i,
];

const ROOTS = ['app', 'components', 'lib'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (EXT.has(extname(path))) out.push(path);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
const opened = [];
const links = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const rule of OPENERS) {
    if (rule.test(text)) opened.push(file);
  }
  if (/mailto:/.test(text) && !(file in ALLOWED)) links.push(file);
}

console.log(`обойдено файлов: ${files.length}`);

let bad = false;
if (opened.length) {
  console.error('ПОЧТОВЫЙ КЛИЕНТ ОТКРЫВАЕТСЯ КОДОМ:');
  for (const f of new Set(opened)) console.error('  ' + f);
  console.error('  Заявка уходит на /api/lead.php. Почтовик открывать нельзя.');
  bad = true;
}
if (links.length) {
  console.error('ССЫЛКА mailto: В НЕОЖИДАННОМ МЕСТЕ:');
  for (const f of new Set(links)) console.error('  ' + f);
  console.error('  Разрешена только в контактах и подвале — см. список в этом файле.');
  bad = true;
}
if (bad) process.exit(1);

for (const [file, why] of Object.entries(ALLOWED)) {
  console.log(`mailto разрешён: ${file} — ${why}`);
}
console.log('почтовый клиент кодом не открывается нигде');
