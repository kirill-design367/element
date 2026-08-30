/**
 * ФАВИКОН ИЗ ТОГО ЖЕ ЗНАКА.
 *
 * Иконка вкладки не рисуется руками и не копируется контурами: она
 * собирается из `app/logo/art.ts` — того же файла, из которого знак берут
 * шапка и визитка. Скопированный контур однажды разойдётся с оригиналом, и
 * никто этого не заметит: фавикон смотрят раз в жизни.
 *
 * Берётся композиция `small` — та, что нарисована специально под 16 px. У
 * обычной компактной формы буква на плашке 16 px выходит 6,0 px, у этой —
 * 7,5: поля ужаты, скоба подтянута. Больше не выжать, это упирается в вес
 * шрифта, а не в вёрстку.
 *
 * Две краски, а не одна: у знака ровно две роли — плашка и то, что из неё
 * вынуто. Цвета те же, что на визитке.
 *
 * Пересобрать:  node scripts/build-icon.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'app/logo/art.ts';
const OUT = 'app/icon.svg';
/** Композиция под 16 px. */
const ID = 'small';
/** Плашка и то, что из неё вынуто. Те же значения, что на визитке. */
const COLOR = { ink: '#17191c', bg: '#f4f4f1' };

/* art.ts — обычный TypeScript, но оба нужных объявления в нём это готовый
   JSON после знака равенства. Разбираем его, а не тащим в сборку tsx. */
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
const art = ART[ID];
if (!art) throw new Error(`в ${SRC} нет композиции ${ID}`);

const parts = art.parts.map((p) => {
  const d = p.d ?? PATHS[p.ref];
  const move = p.d ? '' : ` transform="translate(${p.x ?? 0} ${p.y ?? 0})"`;
  return `  <path d="${d}"${move} fill="${COLOR[p.role]}"/>`;
});

writeFileSync(
  OUT,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.w} ${art.h}">\n`
    + `  <!-- Собран scripts/build-icon.mjs из app/logo/art.ts, композиция «${ID}».\n`
    + `       Руками не править: правка потеряется при пересборке знака. -->\n`
    + parts.join('\n')
    + '\n</svg>\n',
);
console.log(`${OUT}: композиция ${ID}, ${art.w}×${art.h}, частей ${art.parts.length}`);
