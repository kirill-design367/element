/**
 * ЕДИНЫЙ ИСТОЧНИК НОМЕНКЛАТУРЫ И ЦЕН.
 *
 * Все цены здесь — из прайса заказчика. Выдуманных чисел не осталось: у
 * позиции либо стоит цена из прайса, либо не стоит ничего, и сайт пишет
 * «уточняйте у менеджера». Обновление прайса = правка этого файла, больше
 * нигде цифры не хранятся: лендинг, калькулятор, каталог и формы читают
 * отсюда.
 *
 * Цены хранятся ЗА ТОННУ, с НДС, на условиях самовывоза с площадки: так их
 * даёт заказчик. Показывает и считает сайт кубами — пересчёт через насыпную
 * плотность позиции, функция pricePerM3().
 * Стоимость доставки считается отдельно, см. lib/pricing.ts.
 */

import { num } from './format';

/**
 * ИДЕНТИФИКАТОР КАТЕГОРИИ — ОБЫЧНАЯ СТРОКА.
 *
 * Здесь стоял союз шести литералов, и он держал каталог ровно до того дня,
 * когда категории начнут заводиться снаружи: строка, пришедшая из CMS,
 * такому типу не соответствует, и сборка падала бы на первой же новой
 * категории. Проверка переехала из типов в рантайм — isCategoryId() и
 * categoryById(), возвращающий undefined вместо исключения.
 *
 * Псевдоним оставлен нарочно: он говорит в сигнатурах, ЧТО это за строка.
 * Гарантий он не даёт, гарантии дают функции ниже.
 */
export type CategoryId = string;

/**
 * Единица, в которой категория продаётся и показывается.
 *
 * Инертные считаются кубами: снабженец заказывает объём, и машина меряется
 * кубами. Металл считается тоннами — кубометр проката не значит ничего.
 */
export type SaleUnit = 'm3' | 't';

/**
 * Группа внутри категории. Пока есть только у металла: четыре вида проката.
 * Заведена не признаком позиции, а списком, потому что по ней работает
 * фильтр, а значения фильтра берутся из данных.
 */
export type GroupId = string;

export const GROUPS: { id: GroupId; categoryId: CategoryId; name: string }[] = [
  { id: 'armatura', categoryId: 'metall', name: 'Арматура' },
  { id: 'ugolok', categoryId: 'metall', name: 'Уголок' },
  { id: 'shveller', categoryId: 'metall', name: 'Швеллер' },
  { id: 'truba', categoryId: 'metall', name: 'Труба профильная' },
];

/**
 * Наличие. Влияет на метку в карточке и на текст в заявке.
 *
 * 'unknown' — наличие неизвестно: в прайсе металла его нет, а выдумывать
 * «в наличии» на сайте поставщика нельзя. Метка так и говорит.
 */
export type Availability = 'in-stock' | 'on-order' | 'out' | 'unknown';

export interface Category {
  id: CategoryId;
  /** Как называется в заголовке карточки. */
  name: string;
  /** Родительный падеж — для строк вида «доставка щебня». */
  genitive: string;
  /* fractionsLine здесь больше нет. Строка характеристик выводится из
     позиций категории хелпером categorySpec() — написанная руками, она
     разошлась с каталогом и обещала то, чего в нём нет. */
  /** Два-три предложения для превью на лендинге. */
  summary: string;
  /** Для чего берут. Короткие формулировки без маркетинга. */
  uses: string[];
  /** В чём считается и показывается цена. */
  unit: SaleUnit;
  /** Подпись строки фильтра по группам. Есть только там, где группы есть. */
  groupLabel?: string;
}

/**
 * ЗЕРНОВОЙ СОСТАВ ПОЗИЦИИ.
 *
 * Подпись для карточки и диапазон для фильтра выводятся ОТСЮДА хелперами
 * ниже — руками подпись больше не пишут. Раньше рядом лежали строка
 * `fraction` и пара чисел `fractionMm`, не связанные ничем: правка одной не
 * задевала другую, и разойтись они могли молча.
 *
 * Вариантов четыре, потому что четыре разные вещи и нормируются. Щебень и
 * отсев — фракцией в миллиметрах. Песок — модулем крупности. Обогащённая
 * ПГС — долей гравия. Грунты не нормируются по размеру зерна вовсе, и это
 * не «неизвестная фракция», а её отсутствие: подгонять их под корзины
 * фильтра значило бы врать про товар.
 */
export type Fraction =
  /** Фракция в миллиметрах: щебень, отсев, природная ПГС. */
  | { kind: 'mm'; from: number; to: number }
  /** Модуль крупности песка. В миллиметрах любой песок это 0–5. */
  | { kind: 'mkr'; from: number; to: number }
  /** Обогащённая ПГС: нормируется доля гравия. Сама смесь той же крупности,
      что природная, — 0–70 мм. */
  | { kind: 'gravel'; percent: number }
  /** Фракции нет. Подпись говорит про обработку («просеянный», «без
      сортировки»), а не про размер зерна. */
  | { kind: 'none'; label: string };

/**
 * Как фракция пишется в карточке и в накладной.
 *
 * Пробел перед единицей неразрывный: подпись стоит в классе `.mark`, а он
 * включает табличные цифры, и обычный пробел там подменяется широким.
 */
export function fractionLabel(f: Fraction): string {
  switch (f.kind) {
    case 'mm':
      return `${num(f.from)}–${num(f.to)}\u00A0мм`;
    case 'mkr':
      return `Мкр\u00A0${num(f.from, 1)}–${num(f.to, 1)}`;
    case 'gravel':
      return `гравий ${num(f.percent)}\u00A0%`;
    case 'none':
      return f.label;
  }
}

/**
 * Диапазон в миллиметрах — по нему работает фильтр.
 * `null` означает, что фракции у позиции нет и ни в одну корзину она не
 * попадает: это честный ответ, а не промах подбора.
 */
export function fractionMm(f: Fraction): [number, number] | null {
  switch (f.kind) {
    case 'mm':
      return [f.from, f.to];
    case 'mkr':
      return [0, 5];
    case 'gravel':
      return [0, 70];
    case 'none':
      return null;
  }
}

/** Позиция вообще участвует в подборе по фракции. */
export function hasFraction(m: Material): boolean {
  return m.fraction.kind !== 'none';
}

export interface Material {
  id: string;
  categoryId: CategoryId;
  /** Полное торговое название. */
  name: string;
  /** Группа внутри категории. Есть только у металла. */
  group?: GroupId;
  /** Разновидность: гранитный, известняковый, мытый… */
  kind: string;
  /** Зерновой состав. Подпись и диапазон для фильтра выводятся отсюда. */
  fraction: Fraction;
  /** ГОСТ или ТУ. У металла его нет: в прайсе не указан, выдумывать нельзя. */
  gost?: string;
  /** Марка прочности, если нормируется. */
  strength?: string;
  /** Морозостойкость. */
  frost?: string;
  /**
   * Насыпная плотность, т/м³ — по ней считается тоннаж, загрузка машины и
   * цена за куб. У металла её нет: кубами прокат не возят и не считают.
   */
  density?: number;
  /**
   * ЦЕНА ЗА ТОННУ, ₽, с НДС, самовывоз с площадки.
   *
   * Единица хранения — тонна, потому что в тоннах приходит прайс. Показывает
   * и считает сайт по-прежнему кубами: снабженец заказывает объём, и машина
   * меряется кубами. Пересчёт — pricePerM3() ниже, через насыпную плотность
   * этой же позиции, так что разойтись двум ценам не с чем.
   *
   * null — цены нет. Это не ноль и не «бесплатно»: сайт пишет одну
   * формулировку на все такие места (ON_REQUEST в lib/format.ts), в расчёт
   * такая позиция не идёт и в минимум по категории не попадает.
   *
   * Третьего состояния — «ориентировочная цена» — нет. Признак estimated
   * убран вместе с числами из прежней заглушки: цена либо есть и она из
   * прайса заказчика, либо её нет.
   */
  pricePerTon: number | null;
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
    summary:
      /* Марки и фракции отсюда убраны: они выводятся из позиций хелпером
         categorySpec(). Написанные здесь руками, они разошлись с каталогом —
         стояло «от М300 до М1400» при фактических М400…М1200. */
      'Подбираем под нагрузку на основание: марку берём по проекту.',
    uses: ['бетон', 'основание дороги', 'дренаж', 'отсыпка площадок'],
    unit: 'm3',
  },
  {
    id: 'pesok',
    name: 'Песок',
    genitive: 'песка',
    summary:
      /* Модуль крупности отсюда убран по той же причине: стояло «0,8–2,5»
         при фактических от 1,8–2,2 до 2,2–2,8. Теперь его считает
         categorySpec() из позиций. */
      'Карьерный на подсыпку и обратную засыпку, мытый — под кладочный и бетонный раствор.',
    uses: ['подушка под фундамент', 'раствор', 'обратная засыпка', 'благоустройство'],
    unit: 'm3',
  },
  {
    id: 'pgs',
    name: 'ПГС',
    genitive: 'ПГС',
    summary:
      'Песчано-гравийная смесь: природная для отсыпки и планировки, обогащённая — с нормированным содержанием гравия под бетон.',
    uses: ['отсыпка', 'планировка участка', 'подстилающий слой', 'бетон'],
    unit: 'm3',
  },
  {
    id: 'otsev',
    name: 'Отсев',
    genitive: 'отсева',
    summary:
      'Побочный продукт дробления. Дешевле песка на отсыпке, плотно трамбуется — берут под тротуарную плитку и дорожки.',
    uses: ['подсыпка под плитку', 'дорожки', 'антигололёдная посыпка', 'отсыпка'],
    unit: 'm3',
  },
  {
    id: 'grunt',
    name: 'Грунт и чернозём',
    genitive: 'грунта',
    summary:
      'Плодородные грунты под озеленение и планировочный грунт под вертикальную планировку. Отбираем по агрохимическому анализу.',
    uses: ['газон', 'озеленение', 'вертикальная планировка', 'рекультивация'],
    unit: 'm3',
  },
  {
    id: 'metall',
    name: 'Металлопрокат',
    genitive: 'металлопроката',
    /* Ни марок стали, ни ГОСТов, ни сроков: в присланном прайсе их нет, а
       выдумывать характеристики товара на сайте поставщика нельзя.
       Виды проката не перечисляются: их и так выводит categorySpec() из
       позиций, и в плашке категории строка шла дважды подряд. */
    summary: 'Цены за тонну. Марку стали, наличие и срок называем по заявке.',
    uses: ['армирование бетона', 'металлоконструкции', 'каркасы', 'ограждения'],
    unit: 't',
    groupLabel: 'Вид проката',
  },
];

export const MATERIALS: Material[] = [
  // ── Щебень ────────────────────────────────────────────────────────────────
  {
    id: 'granit-5-20',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: { kind: 'mm', from: 5, to: 20 },
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.37,
    pricePerTon: 3000,
    availability: 'in-stock',
    uses: ['товарный бетон', 'фундамент', 'ЖБИ'],
    note: 'Лещадность I группы. Основная фракция под бетон.',
  },
  {
    id: 'granit-20-40',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: { kind: 'mm', from: 20, to: 40 },
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.35,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['основание дороги', 'дренаж', 'бетон крупных конструкций'],
  },
  {
    id: 'granit-40-70',
    categoryId: 'shcheben',
    name: 'Щебень гранитный',
    kind: 'гранитный',
    fraction: { kind: 'mm', from: 40, to: 70 },
    gost: 'ГОСТ 8267-93',
    strength: 'М1200',
    frost: 'F300',
    density: 1.33,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['подушка под дорогу', 'отсыпка слабых грунтов', 'габионы'],
  },
  {
    id: 'izvest-5-20',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: { kind: 'mm', from: 5, to: 20 },
    gost: 'ГОСТ 8267-93',
    strength: 'М600',
    frost: 'F150',
    density: 1.3,
    pricePerTon: 2400,
    availability: 'in-stock',
    uses: ['бетон низких марок', 'подсыпка', 'ландшафт'],
    note: 'Дешевле гранита, но не под нагруженные конструкции.',
  },
  {
    id: 'izvest-20-40',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: { kind: 'mm', from: 20, to: 40 },
    gost: 'ГОСТ 8267-93',
    strength: 'М600',
    frost: 'F150',
    density: 1.28,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['отсыпка дорог', 'основание площадок', 'дренаж'],
  },
  {
    id: 'izvest-40-70',
    categoryId: 'shcheben',
    name: 'Щебень известняковый',
    kind: 'известняковый',
    fraction: { kind: 'mm', from: 40, to: 70 },
    gost: 'ГОСТ 8267-93',
    strength: 'М400',
    frost: 'F150',
    density: 1.26,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['временные дороги', 'отсыпка котлована'],
  },
  {
    id: 'graviy-5-20',
    categoryId: 'shcheben',
    name: 'Щебень гравийный',
    kind: 'гравийный',
    fraction: { kind: 'mm', from: 5, to: 20 },
    gost: 'ГОСТ 8267-93',
    strength: 'М1000',
    frost: 'F200',
    density: 1.42,
    pricePerTon: 2500,
    availability: 'in-stock',
    uses: ['бетон', 'фундамент частного дома', 'дренаж'],
    note: 'Компромисс между гранитом и известняком по цене и прочности.',
  },
  {
    id: 'graviy-20-40',
    categoryId: 'shcheben',
    name: 'Щебень гравийный',
    kind: 'гравийный',
    fraction: { kind: 'mm', from: 20, to: 40 },
    gost: 'ГОСТ 8267-93',
    strength: 'М1000',
    frost: 'F200',
    density: 1.4,
    pricePerTon: null,
    availability: 'on-order',
    uses: ['основание дороги', 'отсыпка', 'дренажный слой'],
  },
  {
    /* Строка есть в присланном прайсе, цены против неё нет, а в каталоге не
       было и позиции. Заведена. Плотность взята у соседней фракции того же
       материала — у гравийного 20-40: между соседними фракциями одного
       материала она отличается на сотые, и без неё не считается ни куб, ни
       загрузка машины. ГОСТ, марка и морозостойкость оставлены пустыми, как
       у металла: в прайсе их нет, а выдумывать характеристики товара
       нельзя. Наличие по той же причине — «уточняем». */
    id: 'graviy-40-70',
    categoryId: 'shcheben',
    name: 'Щебень гравийный',
    kind: 'гравийный',
    fraction: { kind: 'mm', from: 40, to: 70 },
    density: 1.4,
    pricePerTon: null,
    availability: 'unknown',
    uses: ['основание дороги', 'отсыпка', 'дренажный слой'],
  },
  {
    id: 'vtor-20-40',
    categoryId: 'shcheben',
    name: 'Щебень вторичный',
    kind: 'вторичный',
    fraction: { kind: 'mm', from: 20, to: 40 },
    gost: 'ТУ 5711-006',
    strength: 'М400',
    frost: 'F50',
    density: 1.2,
    pricePerTon: null,
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
    fraction: { kind: 'mkr', from: 1.8, to: 2.2 },
    gost: 'ГОСТ 8736-2014',
    density: 1.55,
    pricePerTon: 1300,
    availability: 'in-stock',
    uses: ['обратная засыпка', 'подсыпка', 'планировка'],
    note: 'Содержит глинистые включения — не для кладочного раствора.',
  },
  {
    id: 'pesok-seyan',
    categoryId: 'pesok',
    name: 'Песок карьерный сеяный',
    kind: 'сеяный',
    fraction: { kind: 'mkr', from: 2.0, to: 2.5 },
    gost: 'ГОСТ 8736-2014',
    density: 1.5,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['подушка под фундамент', 'подсыпка под плитку', 'штукатурный раствор'],
  },
  {
    id: 'pesok-mytyy',
    categoryId: 'pesok',
    name: 'Песок мытый',
    kind: 'мытый',
    fraction: { kind: 'mkr', from: 2.0, to: 2.5 },
    gost: 'ГОСТ 8736-2014',
    density: 1.5,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['товарный бетон', 'кладочный раствор', 'стяжка'],
    note: 'Промыт от глины и пыли. Содержание пылевидных частиц до 2 %.',
  },
  {
    id: 'pesok-rechnoy',
    categoryId: 'pesok',
    name: 'Песок речной намывной',
    kind: 'речной',
    fraction: { kind: 'mkr', from: 2.2, to: 2.8 },
    gost: 'ГОСТ 8736-2014',
    density: 1.48,
    pricePerTon: null,
    availability: 'on-order',
    uses: ['бетон высоких марок', 'дренаж', 'пескоструй'],
  },

  // ── ПГС ───────────────────────────────────────────────────────────────────
  {
    id: 'pgs-prir',
    categoryId: 'pgs',
    name: 'ПГС природная',
    kind: 'природная',
    fraction: { kind: 'mm', from: 0, to: 70 },
    gost: 'ГОСТ 23735-2014',
    density: 1.65,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['отсыпка', 'планировка участка', 'подъездные пути'],
    note: 'Содержание гравия 10–20 %, не нормируется.',
  },
  {
    id: 'opgs-30',
    categoryId: 'pgs',
    name: 'ПГС обогащённая',
    kind: 'обогащённая',
    fraction: { kind: 'gravel', percent: 30 },
    gost: 'ГОСТ 23735-2014',
    density: 1.7,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['подстилающий слой дороги', 'бетон', 'основание площадки'],
  },
  {
    id: 'opgs-50',
    categoryId: 'pgs',
    name: 'ПГС обогащённая',
    kind: 'обогащённая',
    fraction: { kind: 'gravel', percent: 50 },
    gost: 'ГОСТ 23735-2014',
    density: 1.75,
    pricePerTon: null,
    availability: 'on-order',
    uses: ['несущее основание', 'бетон', 'дорожная одежда'],
  },

  // ── Отсев ─────────────────────────────────────────────────────────────────
  {
    id: 'otsev-granit',
    categoryId: 'otsev',
    name: 'Отсев гранитный',
    kind: 'гранитный',
    fraction: { kind: 'mm', from: 0, to: 5 },
    gost: 'ГОСТ 31424-2010',
    strength: 'М1200',
    density: 1.4,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['подсыпка под тротуарную плитку', 'дорожки', 'бетон'],
  },
  {
    id: 'otsev-izvest',
    categoryId: 'otsev',
    name: 'Отсев известняковый',
    kind: 'известняковый',
    fraction: { kind: 'mm', from: 0, to: 5 },
    gost: 'ГОСТ 31424-2010',
    strength: 'М600',
    density: 1.32,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['отсыпка дорожек', 'подсыпка', 'благоустройство'],
  },
  {
    id: 'otsev-graviy',
    categoryId: 'otsev',
    name: 'Отсев гравийный',
    kind: 'гравийный',
    fraction: { kind: 'mm', from: 0, to: 10 },
    gost: 'ГОСТ 31424-2010',
    strength: 'М1000',
    density: 1.45,
    pricePerTon: null,
    availability: 'on-order',
    uses: ['подсыпка', 'дренаж', 'отсыпка площадок'],
  },

  // ── Грунт и чернозём ──────────────────────────────────────────────────────
  {
    id: 'chernozem',
    categoryId: 'grunt',
    name: 'Чернозём',
    kind: 'чернозём',
    fraction: { kind: 'none', label: 'просеянный' },
    gost: 'без ГОСТ, по агроанализу',
    density: 1.15,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['газон', 'клумбы', 'плодовые посадки'],
    note: 'Содержание гумуса от 6 %. Паспорт агрохимического анализа по запросу.',
  },
  {
    id: 'grunt-plodorod',
    categoryId: 'grunt',
    name: 'Грунт плодородный',
    kind: 'плодородный',
    fraction: { kind: 'none', label: 'просеянный' },
    gost: 'без ГОСТ, по агроанализу',
    density: 1.2,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['газон', 'озеленение территории', 'рекультивация'],
  },
  {
    id: 'grunt-rastit',
    categoryId: 'grunt',
    name: 'Грунт растительный',
    kind: 'растительный',
    fraction: { kind: 'none', label: 'непросеянный' },
    gost: 'без ГОСТ',
    density: 1.25,
    pricePerTon: null,
    availability: 'in-stock',
    uses: ['выравнивание участка', 'подсыпка под газон'],
  },
  {
    id: 'torfogrunt',
    categoryId: 'grunt',
    name: 'Торфогрунт',
    kind: 'торфяной',
    fraction: { kind: 'none', label: 'просеянный' },
    gost: 'без ГОСТ, по агроанализу',
    density: 0.9,
    pricePerTon: null,
    availability: 'on-order',
    uses: ['теплицы', 'клумбы', 'улучшение почвы'],
  },
  {
    id: 'grunt-planir',
    categoryId: 'grunt',
    name: 'Грунт планировочный',
    kind: 'планировочный',
    fraction: { kind: 'none', label: 'без сортировки' },
    gost: 'без ГОСТ',
    density: 1.6,
    pricePerTon: null,
    availability: 'out',
    uses: ['вертикальная планировка', 'засыпка котлована'],
    note: 'Отгружаем с площадок в момент выемки — наличие уточняйте.',
  },

  // ── Металлопрокат ─────────────────────────────────────────────────────────
  // Цены из прайса заказчика, за тонну. Марок стали, ГОСТов, сроков и
  // минимальной партии в прайсе нет — и здесь их нет тоже.
  {
    id: 'arm-10',
    categoryId: 'metall',
    group: 'armatura',
    name: 'Арматура рифлёная',
    kind: 'арматура',
    fraction: { kind: 'none', label: '⌀\u00A010\u00A0мм' },
    pricePerTon: 78000,
    availability: 'unknown',
    uses: ['армирование бетона', 'фундамент', 'монолит'],
  },
  {
    id: 'arm-12',
    categoryId: 'metall',
    group: 'armatura',
    name: 'Арматура рифлёная',
    kind: 'арматура',
    fraction: { kind: 'none', label: '⌀\u00A012\u00A0мм' },
    pricePerTon: 75000,
    availability: 'unknown',
    uses: ['армирование бетона', 'фундамент', 'монолит'],
  },
  {
    id: 'arm-14',
    categoryId: 'metall',
    group: 'armatura',
    name: 'Арматура рифлёная',
    kind: 'арматура',
    fraction: { kind: 'none', label: '⌀\u00A014\u00A0мм' },
    pricePerTon: 74500,
    availability: 'unknown',
    uses: ['армирование бетона', 'фундамент', 'монолит'],
  },
  {
    id: 'arm-16',
    categoryId: 'metall',
    group: 'armatura',
    name: 'Арматура рифлёная',
    kind: 'арматура',
    fraction: { kind: 'none', label: '⌀\u00A016\u00A0мм' },
    pricePerTon: 74500,
    availability: 'unknown',
    uses: ['армирование бетона', 'фундамент', 'монолит'],
  },
  {
    id: 'ugol-40x40-4',
    categoryId: 'metall',
    group: 'ugolok',
    name: 'Уголок',
    kind: 'уголок',
    fraction: { kind: 'none', label: '40×40×4\u00A0мм' },
    pricePerTon: 101000,
    availability: 'unknown',
    uses: ['металлоконструкции', 'обвязка'],
  },
  {
    id: 'ugol-50x50-5',
    categoryId: 'metall',
    group: 'ugolok',
    name: 'Уголок',
    kind: 'уголок',
    fraction: { kind: 'none', label: '50×50×5\u00A0мм' },
    pricePerTon: 85000,
    availability: 'unknown',
    uses: ['металлоконструкции', 'обвязка'],
  },
  {
    id: 'ugol-63x63-6',
    categoryId: 'metall',
    group: 'ugolok',
    name: 'Уголок',
    kind: 'уголок',
    fraction: { kind: 'none', label: '63×63×6\u00A0мм' },
    pricePerTon: 81000,
    availability: 'unknown',
    uses: ['металлоконструкции', 'обвязка'],
  },
  {
    id: 'ugol-75x75-6',
    categoryId: 'metall',
    group: 'ugolok',
    name: 'Уголок',
    kind: 'уголок',
    fraction: { kind: 'none', label: '75×75×6\u00A0мм' },
    pricePerTon: 92000,
    availability: 'unknown',
    uses: ['металлоконструкции', 'обвязка'],
  },
  {
    id: 'shveller-10',
    categoryId: 'metall',
    group: 'shveller',
    name: 'Швеллер',
    kind: 'швеллер',
    fraction: { kind: 'none', label: '№\u00A010' },
    pricePerTon: 102000,
    availability: 'unknown',
    uses: ['перемычки', 'балки', 'рамы'],
  },
  {
    id: 'shveller-12',
    categoryId: 'metall',
    group: 'shveller',
    name: 'Швеллер',
    kind: 'швеллер',
    fraction: { kind: 'none', label: '№\u00A012' },
    pricePerTon: 106000,
    availability: 'unknown',
    uses: ['перемычки', 'балки', 'рамы'],
  },
  {
    id: 'shveller-14',
    categoryId: 'metall',
    group: 'shveller',
    name: 'Швеллер',
    kind: 'швеллер',
    fraction: { kind: 'none', label: '№\u00A014' },
    pricePerTon: 107000,
    availability: 'unknown',
    uses: ['перемычки', 'балки', 'рамы'],
  },
  {
    id: 'shveller-16',
    categoryId: 'metall',
    group: 'shveller',
    name: 'Швеллер',
    kind: 'швеллер',
    fraction: { kind: 'none', label: '№\u00A016' },
    pricePerTon: 105000,
    availability: 'unknown',
    uses: ['перемычки', 'балки', 'рамы'],
  },
  {
    id: 'truba-40x20-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '40×20×2\u00A0мм' },
    pricePerTon: 70000,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-40x25-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '40×25×2\u00A0мм' },
    pricePerTon: 63000,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-40x40-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '40×40×2\u00A0мм' },
    pricePerTon: 62500,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-50x50-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '50×50×2\u00A0мм' },
    pricePerTon: 75000,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-60x40-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '60×40×2\u00A0мм' },
    pricePerTon: 69000,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-60x60-2',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '60×60×2\u00A0мм' },
    pricePerTon: 62500,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-80x40-3',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '80×40×3\u00A0мм' },
    pricePerTon: 60000,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-80x80-3',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '80×80×3\u00A0мм' },
    pricePerTon: 59500,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
  },
  {
    id: 'truba-100x100-3',
    categoryId: 'metall',
    group: 'truba',
    name: 'Труба профильная',
    kind: 'труба профильная',
    fraction: { kind: 'none', label: '100×100×3\u00A0мм' },
    pricePerTon: 59500,
    availability: 'unknown',
    uses: ['каркасы', 'навесы', 'ограждения'],
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
/** Сколько позиций стоит с ценой из прайса заказчика. */
export const POSITIONS_PRICED = MATERIALS.filter((m) => m.pricePerTon !== null).length;
/** Сколько позиций стоит без цены: её нет в прайсе, спрашиваем у менеджера. */
export const POSITIONS_ON_REQUEST = MATERIALS.filter((m) => m.pricePerTon === null).length;

/**
 * Цена за кубометр выводится из цены за тонну и насыпной плотности.
 *
 * Направление пересчёта развёрнуто: раньше в данных лежал куб, а тонна
 * считалась. Прайс приходит за тонну, и хранить надо то, что прислали, —
 * иначе правка прайса превращается в арифметику на калькуляторе, а сайт
 * показывает округление округления.
 */
export function pricePerM3(m: Material): number | null {
  if (m.pricePerTon === null || m.density === undefined) return null;
  return Math.round((m.pricePerTon * m.density) / 10) * 10;
}

/**
 * В чём позиция продаётся: инертные кубами, металл тоннами.
 *
 * Позиция с неизвестной категорией считается кубами: это единица, в которой
 * работает весь остальной сайт, и падать из-за неё незачем.
 */
export function sellUnit(m: Material): SaleUnit {
  return categoryById(m.categoryId)?.unit ?? 'm3';
}

/** Цена в той единице, в которой позиция продаётся. */
export function priceOf(m: Material): number | null {
  return sellUnit(m) === 't' ? m.pricePerTon : pricePerM3(m);
}

/** Подпись единицы цены: «/м³» или «/т». */
export function unitLabel(u: SaleUnit): string {
  return u === 't' ? 'т' : 'м³';
}

/** Группы выбранной категории. Пусто — значит делить нечего. */
export function groupsOf(id: CategoryId): { id: GroupId; name: string }[] {
  return GROUPS.filter((g) => g.categoryId === id);
}

/** Есть ли у позиции цена вообще. */
export function hasPrice(m: Material): boolean {
  return m.pricePerTon !== null;
}

/**
 * Категория по идентификатору. Нет такой — undefined, а не исключение.
 *
 * Раньше здесь стоял throw, и это было ровно то поведение, которого нельзя
 * допускать после выноса данных наружу: опечатка редактора в поле
 * «категория» роняла бы сборку целиком вместо одной неправильной карточки.
 */
export function categoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((x) => x.id === id);
}

/** Есть ли такая категория. Проверка адреса страницы и данных из CMS. */
export function isCategoryId(id: string): boolean {
  return CATEGORIES.some((c) => c.id === id);
}

/** Название категории или пустая строка: незнакомая категория молчит. */
export function categoryName(id: CategoryId): string {
  return categoryById(id)?.name ?? '';
}

export function materialsOf(id: CategoryId): Material[] {
  return MATERIALS.filter((m) => m.categoryId === id);
}

/**
 * «от 1 210 ₽» для карточки категории на лендинге.
 *
 * Позиции без цены в минимум не попадают: иначе Math.min получил бы null,
 * привёл его к нулю и категория показала бы «от 0 ₽». null здесь значит, что
 * в категории не осталось ни одной цены — тогда карточка пишет «уточняйте».
 */
export function priceFrom(id: CategoryId): number | null {
  const prices = materialsOf(id)
    .map((m) => priceOf(m))
    .filter((x): x is number => x !== null);
  return prices.length ? Math.min(...prices) : null;
}

/**
 * ХАРАКТЕРИСТИКИ КАТЕГОРИИ — СЧИТАЮТСЯ ИЗ ПОЗИЦИЙ, А НЕ ПИШУТСЯ РУКАМИ.
 *
 * Так было раньше, и так расходилось с каталогом. У щебня стояла фракция
 * «0–70 мм» — это диапазон ПГС, у самого щебня такой позиции нет ни одной;
 * марки «от М300 до М1400» при фактических М400…М1200. У песка стоял
 * модуль крупности «0,8–2,5» при фактических от 1,8–2,2 до 2,2–2,8. Это
 * характеристики товара на сайте поставщика: расходиться им нельзя.
 *
 * Теперь каждая строка выводится из позиций категории, и разойтись ей не с
 * чем: правка прайса меняет и её.
 */
export function categorySpec(id: CategoryId): string[] {
  const list = materialsOf(id);
  const out: string[] = [];

  const mm = list
    .map((m) => (m.fraction.kind === 'mm' ? [m.fraction.from, m.fraction.to] : null))
    .filter((x): x is number[] => x !== null);
  if (mm.length) {
    out.push(`фракция ${num(Math.min(...mm.map((r) => r[0])))}–${num(Math.max(...mm.map((r) => r[1])))}\u00A0мм`);
  }

  const mkr = list
    .map((m) => (m.fraction.kind === 'mkr' ? [m.fraction.from, m.fraction.to] : null))
    .filter((x): x is number[] => x !== null);
  if (mkr.length) {
    out.push(
      `модуль крупности ${num(Math.min(...mkr.map((r) => r[0])), 1)}–${num(Math.max(...mkr.map((r) => r[1])), 1)}`,
    );
  }

  const gravel = list
    .map((m) => (m.fraction.kind === 'gravel' ? m.fraction.percent : null))
    .filter((x): x is number => x !== null);
  if (gravel.length) {
    const lo = Math.min(...gravel);
    const hi = Math.max(...gravel);
    out.push(lo === hi ? `гравий ${num(lo)}\u00A0%` : `гравий ${num(lo)}–${num(hi)}\u00A0%`);
  }

  /* Марка прочности нормируется не у всех позиций. Считаем по тем, у кого
     она есть, и берём числом из «М1200», а не сравнением строк: «М600» и
     «М1200» как строки сравниваются по первому символу. */
  const grades = list
    .map((m) => (m.strength ? Number(m.strength.replace(/\D/g, '')) : null))
    .filter((x): x is number => x !== null && Number.isFinite(x));
  if (grades.length) {
    const lo = Math.min(...grades);
    const hi = Math.max(...grades);
    /* Без num(): марка прочности — обозначение, а не количество. num()
       ставит разделитель разрядов, и «М1200» превращалось в «М1 200». */
    out.push(lo === hi ? `марка М${lo}` : `марка М${lo}…М${hi}`);
  }

  /* Разновидности — то, чем позиции категории отличаются друг от друга.
     Для грунтов это единственная содержательная характеристика: ни фракции,
     ни марки у них нет. */
  const kinds = [...new Set(list.map((m) => m.kind))];
  if (kinds.length > 1 || !out.length) out.unshift(kinds.join(' · '));

  return out;
}

/** Та же характеристика одной строкой — под названием категории. */
export function categorySpecLine(id: CategoryId): string {
  return categorySpec(id).join(' · ');
}

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

/** Значения фильтров собираются из данных, а не пишутся руками. */
/**
 * Корзины подбора по фракции. Сами корзины прежние — менялось только
 * условие попадания.
 *
 * Последняя открыта сверху: она значит «40 мм и крупнее», а не строго
 * 40–70. Отдельной корзины под более крупное в проекте нет.
 */
export const FRACTION_FILTERS = [
  { id: '0-5', label: '0–5 мм', from: 0, to: 5 },
  { id: '5-20', label: '5–20 мм', from: 5, to: 20 },
  { id: '20-40', label: '20–40 мм', from: 20, to: 40 },
  { id: '40-70', label: '40–70 мм', from: 40, to: Infinity },
] as const;

/**
 * Попадание — по ПЕРЕСЕЧЕНИЮ диапазонов, а не по вложенности.
 *
 * Раньше требовалось, чтобы диапазон позиции влез в корзину целиком, и это
 * врало в обе стороны. Мимо всех корзин проходило пять позиций, у которых
 * диапазон начинается с нуля. А корзина «40–70 мм» ловила смеси 0–70,
 * которые в неё «влезали» верхней границей, — и при этом не показывала их
 * в корзинах помельче, куда они подходят ничуть не меньше.
 *
 * Сравнение строгое с обеих сторон: диапазоны, соприкасающиеся в одной
 * точке (щебень 5–20 и корзина 0–5), пересечением не считаются.
 */
export function inFraction(m: Material, id: string): boolean {
  const f = FRACTION_FILTERS.find((x) => x.id === id);
  const mm = fractionMm(m.fraction);
  if (!f || !mm) return false;
  return mm[0] < f.to && mm[1] > f.from;
}

/* ГОСТ есть не у всего: у металла в прайсе его нет вовсе. Пустое значение в
   список фильтра не идёт — иначе в выпадающем списке появился бы пункт ни о
   чём, а выбор по нему прятал бы весь металл молча. */
export const GOST_FILTERS: string[] = Array.from(
  new Set(MATERIALS.map((m) => m.gost).filter((g): g is string => !!g)),
).sort();

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'in-stock': 'В наличии',
  'on-order': 'Под заказ',
  out: 'Нет в наличии',
  /* Не «нет» и не «есть»: про металл в прайсе не сказано ничего, и сайт
     говорит ровно это. */
  unknown: 'Наличие уточняем',
};
