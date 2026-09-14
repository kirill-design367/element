/**
 * СБОРКА PDF ВИЗИТКИ И КАРТОЧКИ ОРГАНИЗАЦИИ — ОДИН ЛИСТ A4.
 *
 * PDF собирает тот же Chromium, что и так стоит для замеров, — библиотек для
 * этого в проект не заводится. Печатает он СОБРАННУЮ СТАТИКУ из `out/`, а не
 * разметку из головы: так в файл попадают настоящие шрифты, настоящий кадр
 * площадки и настоящие поля страницы, а не их пересказ.
 *
 * ПОЧЕМУ ФАЙЛ КОММИТИТСЯ, А НЕ СОБИРАЕТСЯ КАЖДОЙ ВЫКЛАДКОЙ. Chromium на
 * раннере пришлось бы ставить на каждый пуш — это минута к каждой выкладке
 * ради файла, который меняется раз в полгода. Тем же порядком в репозитории
 * лежит комплект логотипа `public/brand/element-logo.zip`.
 *
 * ПОРЯДОК: сначала `npm run build`, потом этот скрипт, потом коммит.
 *   node scripts/build-card-pdf.mjs
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const ROUTE = 'doc-2f8b6a14';
const OUT = 'out';
const DEST_DIR = join('public', ROUTE);
const DEST = join(DEST_DIR, 'element-vizitka-i-rekvizity.pdf');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

/* Статический сервер на время рендера. `serve` из зависимостей брать нельзя:
   он переписывает любой путь на index.html при флаге -s, и страница
   документа молча подменилась бы лендингом. */
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let path = join(OUT, url);
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
  } catch {
    res.writeHead(404).end('нет такого файла');
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('нет такого файла');
  }
});

await new Promise((ok) => server.listen(4199, '127.0.0.1', ok));

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`не загрузилось: ${r.url()}`));

const res = await page.goto(`http://127.0.0.1:4199/${ROUTE}/`, { waitUntil: 'networkidle' });
if (!res || res.status() !== 200) {
  throw new Error(`страница документа отдала ${res ? res.status() : 'ничего'} — сначала npm run build`);
}
/* Шрифты обязаны приехать ДО печати: без ожидания Chromium печатает
   запасным системным, и кегли разъезжаются на миллиметры. */
await page.evaluate(() => document.fonts.ready);

/* Печатаем ровно то, что видит принтер: media print гасит панель со
   ссылкой и разводит два листа по страницам. */
await page.emulateMedia({ media: 'print' });

const pdf = await page.pdf({
  printBackground: true,
  /* Размер берётся из @page в CSS документа, а не назначается здесь: одно
     место правды о формате листа. */
  preferCSSPageSize: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});

await mkdir(DEST_DIR, { recursive: true });
await writeFile(DEST, pdf);

/* Проверяем результат чтением, а не тем, что файл появился: число страниц и
   размер листа читаются из самого PDF. */
const text = pdf.toString('latin1');
const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
const box = text.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
const mm = (pt) => (Number(pt) * 25.4 / 72).toFixed(1);

console.log(`${DEST}: ${(pdf.length / 1024).toFixed(0)} КБ`);
console.log(`  страниц: ${pages}`);
if (box) console.log(`  лист: ${mm(box[3])} × ${mm(box[4])} мм`);
if (errors.length) {
  console.error('  ⚠️ при отрисовке:');
  for (const e of errors.slice(0, 8)) console.error(`     ${e}`);
}

await browser.close();
server.close();

if (pages !== 1) {
  console.error(`\nСТРАНИЦ ${pages}, А ДОЛЖНА БЫТЬ 1 — документ собрался не так.`);
  process.exit(1);
}
if (errors.length) process.exit(1);
