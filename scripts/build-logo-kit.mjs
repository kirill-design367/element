/**
 * КОМПЛЕКТ ЛОГОТИПА ДЛЯ ПЕРЕДАЧИ ЗАКАЗЧИКУ.
 *
 * Всё собирается из `app/logo/art.ts` — того же файла, откуда знак берут
 * шапка сайта, визитка и фавикон. Контуры не копируются руками ни разу:
 * скопированный однажды разойдётся с оригиналом, и заметить это будет
 * некому.
 *
 * ЧТО СОБИРАЕТСЯ. Три версии знака, каждая в трёх исполнениях:
 *
 *   full     скоба и слово ЭЛЕМЕНТ — основной логотип (композиция o1-n)
 *   compact  квадратная плашка со скобой и буквой Э — под аватарку (o1-c)
 *   mark     та же скоба с буквой, но БЕЗ плашки — когда подложка своя
 *
 *   color    фирменные краски
 *   black    всё чёрным — одноцветная печать, штамп, факс
 *   white    всё белым — для тёмных подложек
 *
 * У compact две роли краски: плашка и то, что из неё вынуто. У full и mark
 * роль одна — они и существуют для одноцветных исполнений. Поэтому у
 * compact в чёрном и белом исполнении меняются местами обе краски, а не
 * заливается всё одним цветом: заливка одним цветом дала бы сплошной
 * квадрат.
 *
 * PNG растрируются Chromium'ом, который и так стоит в проекте для замеров, —
 * отдельной библиотеки для этого не заводится. Фон прозрачный.
 *
 * ZIP пишется своим кодом на встроенном zlib: ради одного архива тащить в
 * проект зависимость незачем.
 *
 * Пересобрать:  node scripts/build-logo-kit.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { chromium } from 'playwright';

const SRC = 'app/logo/art.ts';
const OUT = 'public/brand/element-logo.zip';
const TMP = '.logo-kit';

/* ФИРМЕННЫЕ КРАСКИ. Те же значения, что стоят на визитке и в фавиконе:
   графит вместо чистого чёрного — на бумаге чёрный всегда выглядит дешевле,
   чем на экране, — и тёплый светлый вместо белого. */
const INK = '#17191c';
const SAND = '#f4f4f1';

/* ── art.ts: достаём два готовых объекта ───────────────────────────────── */
const src = readFileSync(SRC, 'utf8');
const grab = (name) => {
  const at = src.indexOf(`export const ${name}`);
  if (at === -1) throw new Error(`в ${SRC} нет ${name}`);
  const from = src.indexOf('{', src.indexOf('=', at));
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return JSON.parse(src.slice(from, i + 1));
  }
  throw new Error(`в ${SRC} не закрыт ${name}`);
};
const PATHS = grab('PATHS');
const ART = grab('ART');

/**
 * Композиция в SVG. `colors` задаёт краску каждой роли; роль со значением
 * null не рисуется вовсе — так из квадратной композиции получается вариант
 * без плашки.
 */
function svg(id, colors) {
  const art = ART[id];
  if (!art) throw new Error(`в ${SRC} нет композиции ${id}`);
  const parts = art.parts
    .filter((p) => colors[p.role])
    .map((p) => {
      const d = p.d ?? PATHS[p.ref];
      const move = p.d ? '' : ` transform="translate(${p.x ?? 0} ${p.y ?? 0})"`;
      return `  <path d="${d}"${move} fill="${colors[p.role]}"/>`;
    });
  /* Коробка обрезается по видимым частям: у варианта без плашки поля плашки
     остались бы пустым полем вокруг знака, и знак в аватарке был бы мельче,
     чем нужно. */
  const box = colors.ink && colors.bg ? `0 0 ${art.w} ${art.h}` : bounds(art, colors);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">\n`
    + `  <!-- Логотип «Элемент». Собран scripts/build-logo-kit.mjs\n`
    + `       из app/logo/art.ts, композиция «${id}». Руками не править. -->\n`
    + parts.join('\n') + '\n</svg>\n';
}

/** Габарит видимых частей — грубо, по числам в командах пути. */
function bounds(art, colors) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of art.parts) {
    if (!colors[p.role]) continue;
    const d = p.d ?? PATHS[p.ref];
    const dx = p.d ? 0 : p.x ?? 0;
    const dy = p.d ? 0 : p.y ?? 0;
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      x0 = Math.min(x0, nums[i] + dx); x1 = Math.max(x1, nums[i] + dx);
      y0 = Math.min(y0, nums[i + 1] + dy); y1 = Math.max(y1, nums[i + 1] + dy);
    }
  }
  return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
}

/* ── что именно собираем ───────────────────────────────────────────────── */
const VERSIONS = {
  full: { id: 'o1-n', roles: (ink) => ({ ink, bg: null }) },
  compact: { id: 'o1-c', roles: null },
  mark: { id: 'o1-c', roles: (ink) => ({ ink: null, bg: ink }) },
};
const TONES = { color: INK, black: '#000000', white: '#ffffff' };
/* У квадратной композиции краски две, и в одноцветных исполнениях они
   меняются местами, а не сливаются. */
const COMPACT = {
  color: { ink: INK, bg: SAND },
  black: { ink: '#000000', bg: '#ffffff' },
  white: { ink: '#ffffff', bg: '#000000' },
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(`${TMP}/svg`, { recursive: true });
mkdirSync(`${TMP}/png`, { recursive: true });

const files = [];
const add = (name, body) => {
  writeFileSync(`${TMP}/${name}`, body);
  files.push(name);
};

for (const [vName, v] of Object.entries(VERSIONS)) {
  for (const [tName, tone] of Object.entries(TONES)) {
    const colors = v.roles ? v.roles(tone) : COMPACT[tName];
    add(`svg/element-logo-${vName}-${tName}.svg`, svg(v.id, colors));
  }
}

/* ── PNG на прозрачном фоне ────────────────────────────────────────────── */
const PNG = [
  ...[2400, 1200, 600].map((w) => ({ v: 'full', w })),
  ...[1024, 512, 256, 128].map((w) => ({ v: 'compact', w })),
];
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { v, w } of PNG) {
  const file = `${TMP}/svg/element-logo-${v}-color.svg`;
  const body = readFileSync(file, 'utf8');
  const vb = body.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const h = Math.round((w * vb[3]) / vb[2]);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<body style="margin:0">${body.replace('<svg', `<svg width="${w}" height="${h}"`)}</body>`,
  );
  const shot = await page.screenshot({ omitBackground: true });
  add(`png/element-logo-${v}-color-${w}.png`, shot);
}
await browser.close();

/* ── README ────────────────────────────────────────────────────────────── */
add('README.txt', readFileSync('assets/brand-readme.txt'));

/* ── ZIP: локальные заголовки, потом центральный каталог ───────────────── */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

const local = [];
const central = [];
let offset = 0;
for (const name of files) {
  const raw = readFileSync(`${TMP}/${name}`);
  const packed = deflateRawSync(raw, { level: 9 });
  const nameBuf = Buffer.from(name, 'utf8');
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);
  head.writeUInt16LE(20, 4);          // нужна версия 2.0
  head.writeUInt16LE(0x0800, 6);      // имена в UTF-8
  head.writeUInt16LE(8, 8);           // deflate
  head.writeUInt32LE(CRC(raw), 14);
  head.writeUInt32LE(packed.length, 18);
  head.writeUInt32LE(raw.length, 22);
  head.writeUInt16LE(nameBuf.length, 26);
  local.push(head, nameBuf, packed);

  const dir = Buffer.alloc(46);
  dir.writeUInt32LE(0x02014b50, 0);
  dir.writeUInt16LE(20, 4);
  dir.writeUInt16LE(20, 6);
  dir.writeUInt16LE(0x0800, 8);
  dir.writeUInt16LE(8, 10);
  dir.writeUInt32LE(CRC(raw), 16);
  dir.writeUInt32LE(packed.length, 20);
  dir.writeUInt32LE(raw.length, 24);
  dir.writeUInt16LE(nameBuf.length, 28);
  dir.writeUInt32LE(offset, 42);
  central.push(dir, nameBuf);
  offset += head.length + nameBuf.length + packed.length;
}
const dirBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(dirBuf.length, 12);
end.writeUInt32LE(offset, 16);

mkdirSync('public/brand', { recursive: true });
writeFileSync(OUT, Buffer.concat([...local, dirBuf, end]));
rmSync(TMP, { recursive: true, force: true });

const size = readFileSync(OUT).length;
console.log(`${OUT}: ${files.length} файлов, ${(size / 1024).toFixed(0)} КБ`);
for (const f of files) console.log('  ' + f);
