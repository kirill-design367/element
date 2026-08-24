/**
 * ЕДИНЫЙ ИСТОЧНИК НОМЕНКЛАТУРЫ И ЦЕН.
 *
 * ⚠️ ДАННЫЕ ДЕМОНСТРАЦИОННЫЕ И ПОДЛЕЖАТ ЗАМЕНЕ.
 * Порядок величин взят по московскому рынку инертных материалов, но это не
 * прайс компании. Обновление прайса = правка этого файла, больше нигде цифры
 * не хранятся: лендинг, калькулятор, каталог и формы читают отсюда.
 *
 * Цены — за кубометр, с НДС, на условиях самовывоза с площадки.
 * Стоимость доставки считается отдельно, см. lib/pricing.ts.
 */

export type CategoryId = 'shcheben' | 'pesok' | 'pgs' | 'otsev' | 'grunt';

/** Наличие. Влияет на цвет метки в карточке и на текст в заявке. */
export type Availability = 'in-stock' | 'on-order' | 'out';

export interface Category {
  id: CategoryId;
  /** Как называется в заголовке карточки. */
  name: string;
  /** Родительный падеж — для строк вида «доставка щебня». */
  genitive: string;
  /** Одна строка под названием: перечисление фракций. */
  fractionsLine: string;
  /** Два-три предложения для превью на лендинге. */
  summary: string;
  /** Для чего берут. Короткие формулировки без маркетинга. */
  uses: string[];
  /**
   * Заглушка фактуры. Фотографий нет, поэтому карточка рисует россыпь
   * зёрен: размер и форма — от самого материала. Масштаб внутри карточки
   * подобран под читаемость (в отличие от разреза в hero, где масштаб
   * единый и о нём заявлено прямо).
   *
   * min/max — размер зерна в пикселях, count — сколько их в поле,
   * round — окатанное зерно вместо дроблёного (песок, грунт).
   */
  grain: {
    bg: string;
    tint: string;
    tint2: string;
    min: number;
    max: number;
    count: number;
    round?: boolean;
  };
}

export interface Material {
  id: string;
  categoryId: CategoryId;
  /** Полное торговое название. */
  name: string;
  /** Разновидность: гранитный, известняковый, мытый… */
  kind: string;
  /** Фракция как пишут в накладной. */
  fraction: string;
  /** Числовой диапазон в мм — по нему работает фильтр и рисуется фактура. */
  fractionMm: [number, number];
  gost: string;
  /** Марка прочности, если нормируется. */
  strength?: string;
  /** Морозостойкость. */
  frost?: string;
  /** Насыпная плотность, т/м³ — по ней считается тоннаж и загрузка машины. */
  density: number;
  /** Цена за кубометр, ₽, с НДС, самовывоз. */
  pricePerM3: number;
  availability: Availability;
  /** Где применяется. Показывается в карточке каталога. */
  uses: string[];
  note?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'shcheben',
    name: 'Щебень',
    genitive: 'щебня',
    fractionsLine: '5–20 · 20–40 · 40–70 · 0–70 мм',
    summary:
      'Гранитный, известняковый, гравийный и вторичный. Марка прочности от М300 до М1400 — выбирается под нагрузку на основание.',
    uses: ['бетон', 'основание дороги', 'дренаж', 'отсыпка площадок'],
    grain: { bg: '#ddd9d3', tint: '#8f867e', tint2: '#a49a91', min: 9, max: 34, count: 46 },
  },
  {
    id: 'pesok',
    name: 'Песок',
    genitive: 'песка',
    fractionsLine: 'карьерный · сеяный · мытый · 0,8–2,5 Мкр',
    summary:
      'Карьерный на подсыпку и обратную засыпку, мытый — под кладочный и бетонный раствор. Модуль крупности в паспорте.',
    uses: ['подушка под фундамент', 'раствор', 'обратная засыпка', 'благоустройство'],
    grain: { bg: '#ebe0c9', tint: '#c3a163', tint2: '#d4b985', min: 3, max: 7, count: 90, round: true },
  },
  {
    id: 'pgs',
    name: 'ПГС',
    genitive: 'ПГС',
    fractionsLine: 'природная · обогащённая (ОПГС) · 0–70 мм',
    summary:
      'Песчано-гравийная смесь: природная для отсыпки и планировки, обогащённая — с нормированным содержанием гравия под бетон.',
    uses: ['отсыпка', 'планировка участка', 'подстилающий слой', 'бетон'],
    grain: { bg: '#e2dbcd', tint: '#9c8f78', tint2: '#bfb49c', min: 4, max: 26, count: 40 },
  },
  {
    id: 'otsev',
    name: 'Отсев',
    genitive: 'отсева',
    fractionsLine: '0–5 · 0–10 мм',
    summary:
      'Побочный продукт дробления. Дешевле песка на отсыпке, плотно трамбуется — берут под тротуарную плитку и дорожки.',
    uses: ['подсыпка под плитку', 'дорожки', 'антигололёдная посыпка', 'отсыпка'],
    grain: { bg: '#e4e1db', tint: '#9c968d', tint2: '#b4aea5', min: 3, max: 9, count: 64 },
  },
  {
    id: 'grunt',
    name: 'Грунт и чернозём',
    genitive: 'грунта',
    fractionsLine: 'чернозём · плодородный · растительный · торфогрунт',
    summary:
      'Плодородные грунты под озеленение и планировочный грунт под вертикальную планировку. Отбираем по агрохимическому анализу.',
    uses: ['газон', 'озеленение', 'вертикальная планировка', 'рекультивация'],
    grain: { bg: '#cbc2b3', tint: '#7d7161', tint2: '#9b9080', min: 5, max: 18, count: 52, round: true },
  },
];

export const MATERIALS: Material[] = [
  // ── Щебень ────────────────────────────────────────────────────────────────
  {
    id: 'granit-5-20',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: '5–20 мм',
    fractionMm: [5, 20],
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.37,
    pricePerM3: 2450,
    availability: 'in-stock',
    uses: ['товарный бетон', 'фундамент', 'ЖБИ'],
    note: 'Лещадность I группы. Основная фракция под бетон.',
  },
  {
    id: 'granit-20-40',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: '20–40 мм',
    fractionMm: [20, 40],
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.35,
    pricePerM3: 2260,
    availability: 'in-stock',
    uses: ['основание дороги', 'дренаж', 'бетон крупных конструкций'],
  },
  {
    id: 'granit-40-70',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: '40–70 мм',
    fractionMm: [40, 70],
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.33,
    pricePerM3: 2080,
    availability: 'in-stock',
    uses: ['подушка под дорогу', 'отсыпка слабых грунтов', 'габионы'],
  },
  {
    id: 'izvest-5-20',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: '5–20 мм',
    fractionMm: [5, 20],
    gost: 'ГОСТ 8267-93',
    strength: 'М600',
    frost: 'F150',
    density: 1.3,
    pricePerM3: 1480,
    availability: 'in-stock',
    uses: ['бетон низких марок', 'подсыпка', 'ландшафт'],
    note: 'Дешевле гранита, но не под нагруженные конструкции.',
  },
  {
    id: 'izvest-20-40',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: '20–40 мм',
    fractionMm: [20, 40],
    gost: 'ГОСТ 8267-93',
    strength: 'М600',
    frost: 'F150',
    density: 1.28,
    pricePerM3: 1340,
    availability: 'in-stock',
    uses: ['отсыпка дорог', 'основание площадок', 'дренаж'],
  },
  {
    id: 'izvest-40-70',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: '40–70 мм',
    fractionMm: [40, 70],
    gost: 'ГОСТ 8267-93',
    strength: 'М400',
    frost: 'F150',
    density: 1.26,
    pricePerM3: 1210,
    availability: 'in-stock',
    uses: ['временные дороги', 'отсыпка котлована'],
  },
  {
    id: 'graviy-5-20',
    categoryId: 'shcheben',
    name: 'Щебень гравийный',
    kind: 'гравийный',
    fraction: '5–20 мм',
    fractionMm: [5, 20],
    gost: 'ГОСТ 8267-93',
    strength: 'М1000',
    frost: 'F200',
    density: 1.42,
    pricePerM3: 1720,
    availability: 'in-stock',
    uses: ['бетон', 'фундамент частного дома', 'дренаж'],
    note: 'Компромисс между гранитом и известняком по цене и прочности.',
  },
  {
    id: 'graviy-20-40',
    categoryId: 'shcheben',
    name: 'Щебень гравийный',
    kind: 'гравийный',
    fraction: '20–40 мм',
    fractionMm: [20, 40],
    gost: 'ГОСТ 8267-93',
    strength: 'М1000',
    frost: 'F200',
    density: 1.4,
    pricePerM3: 1610,
    availability: 'on-order',
    uses: ['основание дороги', 'отсыпка', 'дренажный слой'],
  },
  {
    id: 'vtor-20-40',
    categoryId: 'shcheben',
    name: 'Щебень вторичный',
    kind: 'вторичный',
    fraction: '20–40 мм',
    fractionMm: [20, 40],
    gost: 'ТУ 5711-006',
    strength: 'М400',
    frost: 'F50',
    density: 1.2,
    pricePerM3: 780,
    availability: 'in-stock',
    uses: ['временные дороги', 'засыпка ям', 'подъездные пути'],
    note: 'Дроблёный бетонный бой. Самый дешёвый вариант под технологический проезд.',
  },

  // ── Песок ─────────────────────────────────────────────────────────────────
  {
    id: 'pesok-kar',
    categoryId: 'pesok',
    name: 'Песок карьерный',
    kind: 'карьерный',
    fraction: 'Мкр 1,8–2,2',
    fractionMm: [0, 3],
    gost: 'ГОСТ 8736-2014',
    density: 1.55,
    pricePerM3: 680,
    availability: 'in-stock',
    uses: ['обратная засыпка', 'подсыпка', 'планировка'],
    note: 'Содержит глинистые включения — не для кладочного раствора.',
  },
  {
    id: 'pesok-seyan',
    categoryId: 'pesok',
    name: 'Песок карьерный сеяный',
    kind: 'сеяный',
    fraction: 'Мкр 2,0–2,5',
    fractionMm: [0, 3],
    gost: 'ГОСТ 8736-2014',
    density: 1.5,
    pricePerM3: 840,
    availability: 'in-stock',
    uses: ['подушка под фундамент', 'подсыпка под плитку', 'штукатурный раствор'],
  },
  {
    id: 'pesok-mytyy',
    categoryId: 'pesok',
    name: 'Песок мытый',
    kind: 'мытый',
    fraction: 'Мкр 2,0–2,5',
    fractionMm: [0, 3],
    gost: 'ГОСТ 8736-2014',
    density: 1.5,
    pricePerM3: 1090,
    availability: 'in-stock',
    uses: ['товарный бетон', 'кладочный раствор', 'стяжка'],
    note: 'Промыт от глины и пыли. Содержание пылевидных частиц до 2 %.',
  },
  {
    id: 'pesok-rechnoy',
    categoryId: 'pesok',
    name: 'Песок речной намывной',
    kind: 'речной',
    fraction: 'Мкр 2,2–2,8',
    fractionMm: [0, 3],
    gost: 'ГОСТ 8736-2014',
    density: 1.48,
    pricePerM3: 1280,
    availability: 'on-order',
    uses: ['бетон высоких марок', 'дренаж', 'пескоструй'],
  },

  // ── ПГС ───────────────────────────────────────────────────────────────────
  {
    id: 'pgs-prir',
    categoryId: 'pgs',
    name: 'ПГС природная',
    kind: 'природная',
    fraction: '0–70 мм',
    fractionMm: [0, 70],
    gost: 'ГОСТ 23735-2014',
    density: 1.65,
    pricePerM3: 790,
    availability: 'in-stock',
    uses: ['отсыпка', 'планировка участка', 'подъездные пути'],
    note: 'Содержание гравия 10–20 %, не нормируется.',
  },
  {
    id: 'opgs-30',
    categoryId: 'pgs',
    name: 'ПГС обогащённая',
    kind: 'обогащённая',
    fraction: 'гравий 30 %',
    fractionMm: [0, 70],
    gost: 'ГОСТ 23735-2014',
    density: 1.7,
    pricePerM3: 1180,
    availability: 'in-stock',
    uses: ['подстилающий слой дороги', 'бетон', 'основание площадки'],
  },
  {
    id: 'opgs-50',
    categoryId: 'pgs',
    name: 'ПГС обогащённая',
    kind: 'обогащённая',
    fraction: 'гравий 50 %',
    fractionMm: [0, 70],
    gost: 'ГОСТ 23735-2014',
    density: 1.75,
    pricePerM3: 1420,
    availability: 'on-order',
    uses: ['несущее основание', 'бетон', 'дорожная одежда'],
  },

  // ── Отсев ─────────────────────────────────────────────────────────────────
  {
    id: 'otsev-granit',
    categoryId: 'otsev',
    name: 'Отсев гранитный',
    kind: 'гранитный',
    fraction: '0–5 мм',
    fractionMm: [0, 5],
    gost: 'ГОСТ 31424-2010',
    strength: 'М1200',
    density: 1.4,
    pricePerM3: 1150,
    availability: 'in-stock',
    uses: ['подсыпка под тротуарную плитку', 'дорожки', 'бетон'],
  },
  {
    id: 'otsev-izvest',
    categoryId: 'otsev',
    name: 'Отсев известняковый',
    kind: 'известняковый',
    fraction: '0–5 мм',
    fractionMm: [0, 5],
    gost: 'ГОСТ 31424-2010',
    strength: 'М600',
    density: 1.32,
    pricePerM3: 720,
    availability: 'in-stock',
    uses: ['отсыпка дорожек', 'подсыпка', 'благоустройство'],
  },
  {
    id: 'otsev-graviy',
    categoryId: 'otsev',
    name: 'Отсев гравийный',
    kind: 'гравийный',
    fraction: '0–10 мм',
    fractionMm: [0, 10],
    gost: 'ГОСТ 31424-2010',
    strength: 'М1000',
    density: 1.45,
    pricePerM3: 880,
    availability: 'on-order',
    uses: ['подсыпка', 'дренаж', 'отсыпка площадок'],
  },

  // ── Грунт и чернозём ──────────────────────────────────────────────────────
  {
    id: 'chernozem',
    categoryId: 'grunt',
    name: 'Чернозём',
    kind: 'чернозём',
    fraction: 'просеянный',
    fractionMm: [0, 20],
    gost: 'без ГОСТ, по агроанализу',
    density: 1.15,
    pricePerM3: 1450,
    availability: 'in-stock',
    uses: ['газон', 'клумбы', 'плодовые посадки'],
    note: 'Содержание гумуса от 6 %. Паспорт агрохимического анализа по запросу.',
  },
  {
    id: 'grunt-plodorod',
    categoryId: 'grunt',
    name: 'Грунт плодородный',
    kind: 'плодородный',
    fraction: 'просеянный',
    fractionMm: [0, 20],
    gost: 'без ГОСТ, по агроанализу',
    density: 1.2,
    pricePerM3: 980,
    availability: 'in-stock',
    uses: ['газон', 'озеленение территории', 'рекультивация'],
  },
  {
    id: 'grunt-rastit',
    categoryId: 'grunt',
    name: 'Грунт растительный',
    kind: 'растительный',
    fraction: 'непросеянный',
    fractionMm: [0, 40],
    gost: 'без ГОСТ',
    density: 1.25,
    pricePerM3: 760,
    availability: 'in-stock',
    uses: ['выравнивание участка', 'подсыпка под газон'],
  },
  {
    id: 'torfogrunt',
    categoryId: 'grunt',
    name: 'Торфогрунт',
    kind: 'торфяной',
    fraction: 'просеянный',
    fractionMm: [0, 20],
    gost: 'без ГОСТ, по агроанализу',
    density: 0.9,
    pricePerM3: 1120,
    availability: 'on-order',
    uses: ['теплицы', 'клумбы', 'улучшение почвы'],
  },
  {
    id: 'grunt-planir',
    categoryId: 'grunt',
    name: 'Грунт планировочный',
    kind: 'планировочный',
    fraction: 'без сортировки',
    fractionMm: [0, 70],
    gost: 'без ГОСТ',
    density: 1.6,
    pricePerM3: 390,
    availability: 'out',
    uses: ['вертикальная планировка', 'засыпка котлована'],
    note: 'Отгружается с площадок в момент выемки — наличие уточняйте.',
  },
];

// ── Производные и помощники ─────────────────────────────────────────────────

/**
 * Счётчики позиций. Выведены из данных, а не записаны словами: в hero и в
 * превью каталога однажды разъехались «23 позиции» и «двадцать четыре»,
 * потому что одно число считалось, а другое было набрано руками.
 */
export const POSITIONS_TOTAL = MATERIALS.length;
export const POSITIONS_IN_STOCK = MATERIALS.filter((m) => m.availability === 'in-stock').length;
export const POSITIONS_ON_ORDER = MATERIALS.filter((m) => m.availability === 'on-order').length;

/** Цена за тонну выводится из цены за куб и насыпной плотности. */
export function pricePerTon(m: Material): number {
  return Math.round(m.pricePerM3 / m.density / 10) * 10;
}

export function categoryById(id: CategoryId): Category {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Нет категории ${id}`);
  return c;
}

export function materialsOf(id: CategoryId): Material[] {
  return MATERIALS.filter((m) => m.categoryId === id);
}

/** «от 1 210 ₽» для карточки категории на лендинге. */
export function priceFrom(id: CategoryId): number {
  return Math.min(...materialsOf(id).map((m) => m.pricePerM3));
}

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

/** Значения фильтров собираются из данных, а не пишутся руками. */
export const FRACTION_FILTERS = [
  { id: '0-5', label: '0–5 мм', test: (m: Material) => m.fractionMm[1] <= 5 },
  { id: '5-20', label: '5–20 мм', test: (m: Material) => m.fractionMm[0] >= 5 && m.fractionMm[1] <= 20 },
  { id: '20-40', label: '20–40 мм', test: (m: Material) => m.fractionMm[0] >= 20 && m.fractionMm[1] <= 40 },
  { id: '40-70', label: '40–70 мм', test: (m: Material) => m.fractionMm[1] > 40 },
] as const;

export const GOST_FILTERS: string[] = Array.from(new Set(MATERIALS.map((m) => m.gost))).sort();

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'in-stock': 'В наличии',
  'on-order': 'Под заказ',
  out: 'Нет в наличии',
};
