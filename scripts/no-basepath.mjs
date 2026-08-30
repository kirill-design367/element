/**
 * ПРОВЕРКА, ЧТО В ВЫДАЧЕ НЕТ ПОДПАПКИ.
 *
 * Сайт собирается под корень домена. Любой путь, начинающийся с /element, —
 * наследие GitHub Pages и в бою даёт 404: битую картинку, непришедший шрифт
 * или ссылку в никуда. Такое ловится не глазом, а обходом всей выдачи.
 *
 * Обходятся ВСЕ файлы out/, а не только HTML: базовый путь попадает и в
 * инлайновый CSS, и в JSON-полезную нагрузку RSC, и в манифесты.
 *
 * Запускается в сборке (workflow) и локально: node scripts/no-basepath.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const OUT = 'out';
/* Двоичное не читаем: базового пути там быть не может, а гигабайты картинок
   обходить незачем. */
const BINARY = new Set([
  '.webp', '.jpg', '.jpeg', '.png', '.woff2', '.woff', '.ico', '.pdf', '.zip',
]);
const NEEDLE = '/element';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const files = walk(OUT);
const hits = [];
for (const file of files) {
  if (BINARY.has(extname(file).toLowerCase())) continue;
  const text = readFileSync(file, 'utf8');
  let from = 0;
  for (;;) {
    const at = text.indexOf(NEEDLE, from);
    if (at === -1) break;
    /* «/elementst.ru» и «/elements» — не подпапка. Считаем совпадением только
       то, за чем идёт граница пути или конец строки. */
    const next = text[at + NEEDLE.length];
    if (next === undefined || next === '/' || next === '"' || next === "'" || next === ')') {
      hits.push(`${file}: …${text.slice(Math.max(0, at - 40), at + 40)}…`);
    }
    from = at + NEEDLE.length;
  }
}

console.log(`обойдено файлов: ${files.length}`);
if (hits.length) {
  console.error(`НАЙДЕНА ПОДПАПКА ${NEEDLE} в ${hits.length} местах:`);
  for (const hit of hits.slice(0, 20)) console.error('  ' + hit);
  process.exit(1);
}
console.log(`подпапки ${NEEDLE} в выдаче нет`);
