/**
 * КАТАЛОГ: ХЕЛПЕРЫ, СЧЁТЧИКИ И ПРОИЗВОДНЫЕ ВЕЛИЧИНЫ.
 *
 * САМИ ЗАПИСИ ЛЕЖАТ НЕ ЗДЕСЬ, а в `lib/data/catalog.data.ts`: тот файл
 * пересобирается из CMS перед сборкой, этот — нет. Разделение не
 * косметическое: генератор переписывает данные целиком, и если бы рядом с
 * ними лежали функции, он затирал бы и их.
 *
 * Типы тоже вынесены — `lib/data/types.ts`. Отсюда они переэкспортируются,
 * чтобы весь остальной проект по-прежнему писал `import { Material } from
 * '@/lib/catalog'` и ничего не знал про расшивку.
 *
 * Цены хранятся ЗА ТОННУ; куб считает pricePerM3() через насыпную плотность
 * позиции, так что разойтись двум ценам не с чем. Цены — на отгрузку с
 * площадки: доставки у нас нет вовсе.
 */

import { num } from './format';
import { CATEGORIES, GROUPS, MATERIALS } from './data/catalog.data';
import type {
  Availability,
  Category,
  CategoryId,
  Fraction,
  Group,
  GroupId,
  Material,
  SaleUnit,
} from './data/types';

export { CATEGORIES, GROUPS, MATERIALS };
export type { Availability, Category, CategoryId, Fraction, Group, GroupId, Material, SaleUnit };

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
     ни марки у них нет.

     Идут ПОСЛЕ чисел, а не перед ними, и это не вкус. В карточке ленты
     строка обрезается по второй строке, а обрезается она с конца — значит с
     конца должно стоять то, без чего можно обойтись. У щебня перечень
     разновидностей длиннее всей остальной строки: пока он стоял первым, на
     узкой карточке отваливались ровно фракция и марка, то есть те две
     величины, за которыми снабженец на карточку и смотрит. */
  const kinds = [...new Set(list.map((m) => m.kind))];
  if (kinds.length > 1 || !out.length) out.push(kinds.join(' · '));

  return out;
}

/** Та же характеристика одной строкой — под названием категории. */
export function categorySpecLine(id: CategoryId): string {
  return categorySpec(id).join(' · ');
}

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

/**
 * Позиция, с которой открывается калькулятор. Признак — в данных, порядок
 * записей на неё не влияет. Пустой каталог даёт пустую строку, и калькулятор
 * просто не находит материал — это уже штатный путь.
 */
export const DEFAULT_MATERIAL_ID: string =
  (MATERIALS.find((m) => m.isDefault) ?? MATERIALS[0])?.id ?? '';

/** Значения фильтров собираются из данных, а не пишутся руками. */
/**
 * Корзины подбора по фракции. Сами корзины прежние — менялось только
 * условие попадания.
 *
 * Последняя открыта сверху: она значит «40 мм и крупнее», а не строго
 * 40–70. Отдельной корзины под более крупное в проекте нет.
 */
export interface FractionFilter {
  /** Идентификатор в адресе страницы. */
  id: string;
  /**
   * Подпись на чипе. Необязательная: у корзины с обеими границами она
   * выводится из чисел, и разойтись с ними не может. Писать её руками надо
   * только там, где числа подписи не равны границам подбора, — у последней
   * корзины верхней границы нет вовсе, а подписана она «40–70 мм», потому
   * что 70 мм это крупнейшая фракция каталога.
   */
  label?: string;
  /** Нижняя граница корзины, мм. */
  from: number;
  /**
   * Верхняя граница, мм. null — границы нет.
   *
   * Здесь стояла Infinity, и для типов это было верно, а для выноса —
   * нет: JSON.stringify(Infinity) даёт null молча, и корзина «40–70 мм»
   * после первого же круга через CMS ловила бы пустоту. null объявлен
   * значением, а не получается случайно.
   */
  to: number | null;
}

export const FRACTION_FILTERS: FractionFilter[] = [
  { id: '0-5', from: 0, to: 5 },
  { id: '5-20', from: 5, to: 20 },
  { id: '20-40', from: 20, to: 40 },
  { id: '40-70', label: '40–70 мм', from: 40, to: null },
];

/** Подпись корзины: из чисел, если её не написали руками. */
export function fractionFilterLabel(f: FractionFilter): string {
  if (f.label) return f.label;
  return f.to === null ? `от ${f.from} мм` : `${f.from}–${f.to} мм`;
}

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
  /* Верхней границы нет — значит сверху корзина не ограничена ничем. */
  const upper = f.to ?? Number.POSITIVE_INFINITY;
  return mm[0] < upper && mm[1] > f.from;
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
