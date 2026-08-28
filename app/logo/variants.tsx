import { ART, INK, METRICS, SOLO, type Art } from './logos';
import { E_MODUL, FRAKTSIYA, SECHENIE, VES, type MarkSpec } from './marks';

/**
 * Пятнадцать логотипов. Каждый — законченный логотип, а не эскиз знака.
 *
 * Всё собирается в ОДНОЙ системе координат — единицах шрифта при upem 1000,
 * высота прописных 680. Слово, которое не правится, остаётся живым текстом:
 * SVG-элемент text ставится по базовой линии и берёт ту же гарнитуру, что
 * шапка сайта. Кривые вынимаются только там, где буквы режутся или
 * выворачиваются из плашки, — это и держит разметку страницы лёгкой.
 *
 * Никаких размеров «на глаз»: любое число ниже — доля высоты прописных.
 */

export type WordSet = 'caps' | 'mixed';
export const WORD: Record<WordSet, string> = { caps: 'ЭЛЕМЕНТ', mixed: 'Элемент' };

const U = METRICS.cap;            // 680 — высота прописных, единица всех размеров
const EM = METRICS.upem;          // 1000
const BASE = 689;                 // базовая линия: верх выносного элемента у Э
const LSB = 40;                   // левый полуапрош Э при кегле 1000
const GAP = 0.30 * U;             // отбивка знака от слова
const TRACK = METRICS.tracking;   // −0,02 em, трекинг шапки

/**
 * Готовая композиция: рамка в единицах шрифта плюс её содержимое.
 *
 * Содержимое — СТРОКА разметки, а не дерево элементов, и это не небрежность.
 * Next сериализует дерево серверных компонентов в JSON целиком, со всеми
 * атрибутами: то же самое дерево уезжает на страницу дважды — разметкой и
 * служебными данными. Для сорока статических композиций это лишние сотни
 * килобайт, поэтому они собираются строками и вставляются одним куском.
 */
export type Build = { vw: number; vh: number; svg: string };

/** Слово живым текстом. Ставится по базовой линии, левый полуапрош снят. */
function word(
  text: string,
  { size = EM, x = 0, y = BASE, cls = 'font-black', span = 0, lsb = LSB } = {},
) {
  const fit = span ? ` textLength="${round(span)}" lengthAdjust="spacing"` : '';
  return `<text x="${round(x - (lsb * size) / EM)}" y="${round(y)}" font-size="${round(size)}"`
    + ` letter-spacing="${round(TRACK * size)}"${fit} class="${cls}" fill="currentColor"`
    + ` style="white-space:pre">${text}</text>`;
}

const round = (n: number) => Math.round(n * 10) / 10;

const w = (t: string, size = EM) => (INK[t].w * size) / EM;

/** Готовый путь из генератора, поставленный в нужное место рамки.
    Масштаб не нужен: пути уже в единицах шрифта, то есть в той же системе
    координат, что и всё остальное — use только переносит. */
const piece = (id: string, x = 0, y = 0) => `<use href="#${id}" x="${round(x)}" y="${round(y)}"/>`;

/** Знак из marks.tsx ростом в высоту прописных. */
function markAt(spec: MarkSpec, x: number, y = BASE - U) {
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${U / 100})">`
    + `<path d="${spec.d}" fill="currentColor" fill-rule="${spec.rule ?? 'nonzero'}"/></g>`;
}

/** Брусок: скобы и всё прямоугольное. */
const bar = (x: number, y: number, w: number, h: number) =>
  `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="currentColor"/>`;

/** Знак слева, слово справа. Общая композиция трёх вариантов первой группы. */
function markPlusWord(spec: MarkSpec, set: WordSet): Build {
  const mw = spec.w * U;
  const t = WORD[set];
  return {
    vw: mw + GAP + w(t),
    vh: INK[t].h,
    svg: markAt(spec, 0) + word(t, { x: mw + GAP }),
  };
}

/** Готовая форма слева, слово справа: для монограмм из генератора. */
function piecePlusWord(id: string, art: Art, set: WordSet): Build {
  const t = WORD[set];
  const y = (INK[t].h - art.h) / 2;
  return {
    vw: art.w + GAP + w(t),
    vh: Math.max(art.h, INK[t].h),
    svg: piece(id, 0, y > 0 ? y : 0) + word(t, { x: art.w + GAP, y: BASE + (y < 0 ? -y : 0) }),
  };
}

/** Целиком готовый путь: контейнеры и правленые вордмарки. */
function whole(id: string, art: Art): Build {
  return { vw: art.w, vh: art.h, svg: piece(id) };
}

export type Variant = {
  id: string;
  no: number;
  group: string;
  name: string;
  /** Три строки под вариантом: замысел, чем хорош, где слабое место. */
  idea: string;
  strong: string;
  weak: string;
  build: (set: WordSet) => Build;
  /** Компактная форма, если она у варианта есть. */
  compact?: () => Build;
};

export const GROUPS = [
  { key: 'znak', title: 'Знак плюс слово' },
  { key: 'wordmark', title: 'Чистый вордмарк' },
  { key: 'mono', title: 'Монограмма' },
  { key: 'container', title: 'Слово в контейнере' },
  { key: 'free', title: 'Остальное' },
];

export const VARIANTS: Variant[] = [
  {
    id: 'fraktsiya',
    no: 1,
    group: 'znak',
    name: 'Фракция',
    idea: 'Три бруска шириной 42, 28 и 14 — ряд 3 : 2 : 1: рассев по размеру зерна.',
    strong: 'Силуэт из трёх убывающих брусков опознаётся с любого размера — самый узкий при кегле шапки это 2 px, он не исчезает.',
    weak: 'Ряд убывающих прямоугольников — форма распространённая: её же рисуют для связи, звука и аналитики.',
    build: (s) => markPlusWord(FRAKTSIYA, s),
    compact: () => ({ vw: FRAKTSIYA.w * U, vh: U, svg: markAt(FRAKTSIYA, 0, 0) }),
  },  {
    id: 'ves',
    no: 2,
    group: 'znak',
    name: 'Тонна и куб',
    idea: 'Залитый квадрат и квадратное кольцо той же стороны: две единицы, в которых компания считает товар.',
    strong: 'Знак говорит ровно то, чем этот поставщик отличается от соседнего: цена лежит за тонну, показывается за куб. Смысл читается без подписи.',
    weak: 'Два квадрата рядом — это ещё и значок «копировать» в любом интерфейсе, и на 20 px разница между залитым и полым съедается.',
    build: (s) => markPlusWord(VES, s),
    compact: () => ({ vw: VES.w * U, vh: U, svg: markAt(VES, 0, 0) }),
  },  {
    id: 'sechenie',
    no: 3,
    group: 'znak',
    name: 'Сечение',
    idea: 'Круг Ø100 с квадратным отверстием 44 по центру: профиль с торца, круглый снаружи и квадратный внутри.',
    strong: 'Круг — самый устойчивый силуэт набора: он не разваливается ни в 20 px, ни в аватарке, и отверстие в 44% диаметра держится вместе с ним.',
    weak: 'Говорит про металл, а металл здесь шестая категория из шести: знак обещает не тот товар, которым живёт каталог.',
    build: (s) => markPlusWord(SECHENIE, s),
    compact: () => ({ vw: U, vh: U, svg: markAt(SECHENIE, 0, 0) }),
  },  {
    id: 'prorez',
    no: 4,
    group: 'wordmark',
    name: 'Прорезь',
    idea: 'Сквозная щель толщиной 0,14 высоты прописных проходит через все буквы ровно посередине.',
    strong: 'Одна линия делает из набора логотип, не трогая рисунок букв: слово остаётся читаемым целиком, а приём виден с первого взгляда.',
    weak: 'При кегле шапки щель — 2 px, а на печати в одну краску мелко она затекает: примета держится ровно до того размера, где она нужнее всего.',
    build: (s) => whole(`a-prorez-${s}`, ART.prorez[s]),
  },  {
    id: 'srez',
    no: 5,
    group: 'wordmark',
    name: 'Срез блока',
    idea: 'Одна линия под 45° срезает верхний правый угол слова целиком на глубину 0,42 высоты прописных.',
    strong: 'Режется не буква, а блок: линия одна на весь логотип, и буквы попадают под неё настолько, насколько высовываются в угол. Силуэт меняется, поэтому примета выживает и в 20 px.',
    weak: 'Т теряет правую половину перекладины, и на мелком размере слово можно прочитать как «ЭЛЕМЕН». В строчном наборе срез задевает только т и выходит вдвое слабее.',
    build: (s) => whole(`a-srez-${s}`, ART.srez[s]),
  },  {
    id: 'osnovanie',
    no: 6,
    group: 'wordmark',
    name: 'Основание',
    idea: 'Низ букв на 0,22 высоты прописных слит в сплошную полосу во всю ширину слова.',
    strong: 'Самый крепкий вордмарк набора: полоса не исчезает ни при каком размере, а слово стоит на ней, как материал на площадке. Работает и в негативе.',
    weak: 'Полоса съедает низ букв: в строчном наборе она отнимает у х-высоты почти треть, и «лемент» начинает слипаться в сплошное поле.',
    build: (s) => whole(`a-osnovanie-${s}`, ART.osnovanie[s]),
  },  {
    id: 'badge',
    no: 7,
    group: 'mono',
    name: 'Э в круге',
    idea: 'Буква вывороткой в круге диаметром 1,6 высоты прописных, буква занимает 55% диаметра.',
    strong: 'Круг заполняет квадрат аватарки без остатка, и монограмма читается там, где слово уже нет. Одна заливка: буква это дырка, поэтому знак ложится на любой фон.',
    weak: 'Буква в круге — самая частая форма монограммы на свете, отличать «Элемент» от соседа она будет только начертанием Э.',
    build: (s) => piecePlusWord('s-badge-e', SOLO['badge-e'], s),
    compact: () => whole('s-badge-e', SOLO['badge-e']),
  },  {
    id: 'modul',
    no: 8,
    group: 'mono',
    name: 'Э-модуль',
    idea: 'Буква как самостоятельная фигура: бруски толщиной 20, просветы 20 — штрих, просвет и шаг сетки одно число.',
    strong: 'Монограмма без контейнера: знак не берёт форму взаймы у круга или квадрата, а держится сам. Прямые просветы не сужаются, поэтому мелкий размер переносит лучше круглой Э.',
    weak: 'Прямоугольная Э близка к цифре 3, а в зеркале — к Е. И без контейнера в квадрате аватарки знак остаётся с пустыми полями слева.',
    build: (s) => markPlusWord(E_MODUL, s),
    compact: () => ({ vw: E_MODUL.w * U, vh: U, svg: markAt(E_MODUL, 0, 0) }),
  },  {
    id: 'tile',
    no: 9,
    group: 'mono',
    name: 'ЭЛ',
    idea: 'Двухбуквенная монограмма: Э и Л вывороткой в квадрате со стороной 1,7 высоты прописных.',
    strong: 'Две буквы отличают знак от любой одиночной Э и дают компактной форме собственное имя. Квадрат садится в аватарку без обрезки.',
    weak: '«ЭЛ» ничего не значит: сокращение придётся объяснять, а необъяснённое сокращение читается как чужие инициалы.',
    build: (s) => piecePlusWord('s-tile-el', SOLO['tile-el'], s),
    compact: () => whole('s-tile-el', SOLO['tile-el']),
  },
];


/* ── отрисовка ─────────────────────────────────────────────────────────── */

/**
 * Каждая композиция собирается ОДИН раз и кладётся в общий набор символом.
 * Состояний у варианта шесть, наборов слова два — двенадцать показов на
 * вариант; собирая дерево заново на каждый показ, страница раздувалась вдвое,
 * причём не столько разметкой, сколько служебными данными Next: он
 * сериализует дерево серверных компонентов в JSON целиком, со всеми
 * атрибутами. Один символ плюс двенадцать ссылок на него убирают и то, и это.
 */
export type Composition = { id: string; vw: number; vh: number; svg: string };

export const COMPOSITIONS: Composition[] = [];
const comp = new Map<string, Composition>();

function register(id: string, build: Build) {
  const c = { id, ...build };
  COMPOSITIONS.push(c);
  comp.set(id, c);
  return c;
}

for (const v of VARIANTS) {
  for (const set of ['caps', 'mixed'] as const) register(`lg-${v.id}-${set}`, v.build(set));
  if (v.compact) register(`lg-${v.id}-c`, v.compact());
}

/** Разметка всех символов одной строкой: см. комментарий у типа Build. */
const SYMBOLS = COMPOSITIONS.map(
  (c) => `<symbol id="${c.id}" viewBox="0 0 ${c.vw} ${c.vh}">${c.svg}</symbol>`,
).join('');

/** Композиция варианта: набор слова или компактная форма. */
export const lookup = (id: string, kind: WordSet | 'c') => comp.get(`lg-${id}-${kind}`);

/** Логотип нужного размера. По высоте прописных, по полной высоте или в короб. */
export function Logo({ c, cap, height, fit, className }: {
  c: Composition;
  /** Размер по высоте прописных. */
  cap?: number;
  /** Размер по полной высоте рамки. */
  height?: number;
  /** Вписать в короб целиком. */
  fit?: { w: number; h: number };
  className?: string;
}) {
  const k = cap != null ? cap / U
    : height != null ? height / c.vh
    : Math.min(fit!.w / c.vw, fit!.h / c.vh);
  /* viewBox обязателен: без него max-width у svg сжимает коробку, а
     содержимое остаётся прежнего размера и обрезается. С ним CSS
     масштабирует всё вместе. */
  return (
    <svg
      width={Math.round(c.vw * k * 100) / 100}
      height={Math.round(c.vh * k * 100) / 100}
      viewBox={`0 0 ${c.vw} ${c.vh}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <use href={`#${c.id}`} width={c.vw} height={c.vh} />
    </svg>
  );
}

/**
 * Общий набор: сперва готовые пути из генератора, потом композиции символами.
 * Ссылка на путь внутри символа работает так же, как снаружи, а currentColor
 * разрешается в месте вызова — поэтому логотип меняет цвет вместе с текстом.
 */
export function Defs() {
  const paths: [string, Art][] = [];
  for (const key of Object.keys(ART)) {
    for (const set of ['caps', 'mixed'] as const) paths.push([`a-${key}-${set}`, ART[key][set]]);
  }
  for (const key of Object.keys(SOLO)) paths.push([`s-${key}`, SOLO[key]]);
  return (
    <svg aria-hidden focusable="false" className="sr-only">
      <defs>
        {paths.map(([id, art]) => (
          <path key={id} id={id} d={art.d} fill="currentColor" fillRule={art.rule ?? 'evenodd'} />
        ))}
      </defs>
      <g dangerouslySetInnerHTML={{ __html: SYMBOLS }} />
    </svg>
  );
}
