/**
 * ТАРИФЫ ДОСТАВКИ И ФОРМУЛЫ РАСЧЁТА.
 *
 * ⚠️ ДАННЫЕ ДЕМОНСТРАЦИОННЫЕ И ПОДЛЕЖАТ ЗАМЕНЕ.
 * Менеджер правит только этот файл: подачу машины, цену километра, состав
 * парка и минимальный заказ. Калькулятор на лендинге и просчёт из каталога
 * считают по одним и тем же функциям — разойтись не могут.
 */

import { MATERIALS, pricePerM3, type Material } from './catalog';

export interface Truck {
  id: string;
  /** Как машину называет диспетчер. */
  name: string;
  /** Геометрический объём кузова, м³. */
  volumeM3: number;
  /** Разрешённая нагрузка, т. Ограничивает объём для тяжёлых материалов. */
  payloadT: number;
  /** Подача в пределах МКАД, ₽ за рейс. */
  baseCost: number;
  /** Каждый километр за МКАД, ₽. */
  perKm: number;
}

export const FLEET: Truck[] = [
  { id: 'kamaz-10', name: 'Самосвал 10 м³', volumeM3: 10, payloadT: 15, baseCost: 9500, perKm: 70 },
  { id: 'kamaz-15', name: 'Самосвал 15 м³', volumeM3: 15, payloadT: 20, baseCost: 12500, perKm: 85 },
  { id: 'tonar-20', name: 'Полуприцеп 20 м³', volumeM3: 20, payloadT: 28, baseCost: 15500, perKm: 100 },
  { id: 'tonar-30', name: 'Полуприцеп 30 м³', volumeM3: 30, payloadT: 40, baseCost: 21000, perKm: 130 },
];

/** Минимальный объём отгрузки — меньше самой маленькой машины не возим. */
export const MIN_ORDER_M3 = 10;

/** Ставка НДС, уже включённая в цены каталога. Показываем, не начисляем. */
export const VAT_RATE = 0.2;

/**
 * Сколько дней держим выставленную цену.
 *
 * Число было записано в двух компонентах и двумя способами — «5 дней» в
 * шаге «Просчёт» и «пять дней» в блоке заявки, на одной странице. Теперь
 * оно здесь, где и все остальные условия поставки.
 */
export const PRICE_HOLD_DAYS = 5;

/**
 * Готовые направления, чтобы снабженцу не искать километраж вручную.
 * Расстояние — от МКАД по вылетной трассе, округлённое.
 */
export const DESTINATIONS: { id: string; name: string; km: number }[] = [
  { id: 'mkad', name: 'В пределах МКАД', km: 0 },
  { id: 'himki', name: 'Химки', km: 9 },
  { id: 'odintsovo', name: 'Одинцово', km: 12 },
  { id: 'lyubertsy', name: 'Люберцы', km: 12 },
  { id: 'podolsk', name: 'Подольск', km: 16 },
  { id: 'domodedovo', name: 'Домодедово', km: 22 },
  { id: 'zelenograd', name: 'Зеленоград', km: 25 },
  { id: 'noginsk', name: 'Ногинск', km: 35 },
  { id: 'chekhov', name: 'Чехов', km: 45 },
  { id: 'dmitrov', name: 'Дмитров', km: 55 },
  { id: 'serpuhov', name: 'Серпухов', km: 75 },
  { id: 'other', name: 'Другой адрес', km: 30 },
];

/** Максимальное расстояние, на которое возим. Дальше — только по согласованию. */
export const MAX_KM = 150;

/**
 * Потолок объёма для расчёта на странице.
 *
 * Верхней границы не было вовсе: «1e9» принималось и давало итог в
 * тринадцать разрядов. Дело не только в вёрстке — такой объём это уже не
 * поставка по прайсу, а отдельный договор, и цифра из калькулятора по нему
 * ничего не значит. Выше потолка расчёт не показывается, а человек уходит
 * в заявку.
 */
export const MAX_ORDER_M3 = 10_000;

export type Unit = 'm3' | 't';

export interface CalcInput {
  materialId: string;
  /** Количество в выбранных единицах. */
  amount: number;
  unit: Unit;
  /** Расстояние от МКАД, км. */
  km: number;
}

/**
 * Почему полного расчёта нет. null — расчёт полный.
 *
 * 'no-price' — у позиции нет цены: она есть в прайсе, а числа против неё не
 * стоит. Доставку в этом случае посчитать всё равно можно — она зависит от
 * объёма и плотности, а не от цены, — и она показывается: это честная часть
 * ответа. Итога нет, и подставлять на его место ноль нельзя.
 */
export type CalcBlock = null | 'no-price';

export interface CalcResult {
  material: Material;
  blocked: CalcBlock;
  /** Объём после приведения к кубам. */
  volumeM3: number;
  /** Масса — её спрашивают на въезде на объект. */
  massT: number;
  /** Подобранная машина и число рейсов. */
  truck: Truck;
  rides: number;
  /** Сколько кубов реально влезает в один рейс с учётом тоннажа. */
  perRideM3: number;
  /** null, если цены у позиции нет. */
  materialCost: number | null;
  deliveryCost: number;
  /** null, если цены у позиции нет: ноль на месте итога — это неправда. */
  total: number | null;
  /** Цена одного куба «на объекте» — по ней сравнивают поставщиков. */
  totalPerM3: number | null;
  /** Заказ меньше минимального: машина всё равно поедет целиком. */
  belowMinimum: boolean;
  /** Расстояние вне зоны — цена ориентировочная. */
  beyondRange: boolean;
  /** Цена позиции ориентировочная: её нет в прайсе заказчика. */
  estimated: boolean;
}

/** Сколько кубов данного материала влезает в машину: кузов или тоннаж. */
export function capacityM3(truck: Truck, density: number): number {
  return Math.min(truck.volumeM3, truck.payloadT / density);
}

/**
 * Подбор машины. Перебираем весь парк и берём вариант с наименьшей суммой
 * доставки: на 12 кубах дешевле один пятнадцатикубовый, чем два десятых.
 */
export function pickTruck(volumeM3: number, density: number, km: number) {
  let best: { truck: Truck; rides: number; cost: number; perRideM3: number } | null = null;
  for (const truck of FLEET) {
    const perRideM3 = capacityM3(truck, density);
    const rides = Math.max(1, Math.ceil(round2(volumeM3) / perRideM3 - 1e-9));
    const cost = rides * (truck.baseCost + truck.perKm * Math.max(0, km));
    if (!best || cost < best.cost) best = { truck, rides, cost, perRideM3 };
  }
  return best!;
}

export function toM3(amount: number, unit: Unit, density: number): number {
  return unit === 'm3' ? amount : amount / density;
}

export function calculate(input: CalcInput): CalcResult | null {
  const material = MATERIALS.find((m) => m.id === input.materialId);
  if (!material) return null;

  const amount = Number.isFinite(input.amount) ? Math.max(0, input.amount) : 0;
  const volumeM3 = round2(toM3(amount, input.unit, material.density));
  const massT = round2(volumeM3 * material.density);
  const km = clamp(input.km, 0, MAX_KM * 2);

  const { truck, rides, cost, perRideM3 } = pickTruck(Math.max(volumeM3, 0.01), material.density, km);
  const perM3 = pricePerM3(material);
  const materialCost = perM3 === null ? null : Math.round(volumeM3 * perM3);
  const deliveryCost = volumeM3 > 0 ? Math.round(cost) : 0;
  const total = materialCost === null ? null : materialCost + deliveryCost;

  return {
    material,
    blocked: perM3 === null ? 'no-price' : null,
    volumeM3,
    massT,
    truck,
    rides,
    perRideM3: round2(perRideM3),
    materialCost,
    deliveryCost,
    total,
    totalPerM3: total !== null && volumeM3 > 0 ? Math.round(total / volumeM3) : null,
    belowMinimum: volumeM3 > 0 && volumeM3 < MIN_ORDER_M3,
    beyondRange: km > MAX_KM,
    estimated: !!material.estimated,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
