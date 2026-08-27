/**
 * ПАРК, ПОРОГИ И ФОРМУЛЫ РАСЧЁТА.
 *
 * ⚠️ ДАННЫЕ ДЕМОНСТРАЦИОННЫЕ И ПОДЛЕЖАТ ЗАМЕНЕ.
 * Менеджер правит только этот файл: состав парка, минимальную отгрузку и
 * пороги. Калькулятор на лендинге и просчёт из каталога считают по одним и
 * тем же функциям — разойтись не могут.
 *
 * ДОСТАВКИ У НАС НЕТ. Заказчик работает только на самовывоз, поэтому в этом
 * файле не осталось ни тарифов, ни направлений, ни радиуса: цены в каталоге
 * это цены отгрузки с площадки. Парк остался — по нему подбирается машина и
 * число рейсов, чтобы человек понимал, сколько раз ехать.
 */

import { MATERIALS, pricePerM3, sellUnit, type Material } from './catalog';

export interface Truck {
  id: string;
  /** Как машину называет диспетчер. */
  name: string;
  /** Геометрический объём кузова, м³. */
  volumeM3: number;
  /** Разрешённая нагрузка, т. Ограничивает объём для тяжёлых материалов. */
  payloadT: number;
}

/* Полей baseCost и perKm у машины больше нет — это были подача в пределах
   МКАД и цена километра за МКАД, то есть тариф доставки. Возить мы перестали,
   и тариф не «обнулён на всякий случай», а удалён: пустое поле с ценой рано
   или поздно кто-нибудь заполнит и включит расчёт обратно. */
export const FLEET: Truck[] = [
  { id: 'kamaz-10', name: 'Самосвал 10 м³', volumeM3: 10, payloadT: 15 },
  { id: 'kamaz-15', name: 'Самосвал 15 м³', volumeM3: 15, payloadT: 20 },
  { id: 'tonar-20', name: 'Полуприцеп 20 м³', volumeM3: 20, payloadT: 28 },
  { id: 'tonar-30', name: 'Полуприцеп 30 м³', volumeM3: 30, payloadT: 40 },
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
 * Отсрочка платежа для постоянных заказчиков, дней.
 *
 * Число стояло в двух местах сразу — в условии «Отсрочка платежа до 30 дней»
 * и в мета-описании лендинга, — и правка одного места оставляла второе
 * врать. Здесь же, где и остальные условия поставки.
 */
export const DEFERRAL_DAYS = 30;

/** Разброс объёмов самосвалов в парке, м³. Считается, а не пишется. */
export const FLEET_VOLUME_RANGE: [number, number] = [
  Math.min(...FLEET.map((t) => t.volumeM3)),
  Math.max(...FLEET.map((t) => t.volumeM3)),
];

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

/**
 * То же самое для товара, который считается тоннами, — металла.
 *
 * Потолок нужен по той же причине и найден тем же способом: «1e9» в поле
 * массы давало итог в пятнадцать разрядов, и на 1280 страница уезжала вбок
 * на 24 px. Это не поставка по прайсу, а отдельный договор.
 */
export const MAX_ORDER_T = 10_000;

/* ── Рейс до объекта ──────────────────────────────────────────────────────
   Доставки у нас нет, но человеку, который поедет за материалом сам, надо
   понимать не только сколько рейсов, но и сколько времени занимает один.
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Средняя скорость гружёного самосвала по области, км/ч.
 *
 * Не максимальная и не «по трассе»: это скорость от площадки до объекта
 * дверь в дверь, вместе с городскими участками, светофорами и выездом на
 * трассу. Значение одно на весь сайт и лежит здесь, а не в компоненте.
 */
export const AVG_SPEED_KMH = 45;

/**
 * Потолок расстояния в поле расчёта, км.
 *
 * Это НЕ радиус обслуживания — радиуса у самовывоза нет вовсе, ехать можно
 * откуда угодно. Это граница поля ввода, того же рода, что MAX_ORDER_M3:
 * без неё «1e9» в поле километров давало время в семь разрядов и уводило
 * панель за край экрана.
 */
export const MAX_TRIP_KM = 500;

export interface Trip {
  /** Расстояние в одну сторону, км. */
  km: number;
  /** Время в одну сторону, минут. */
  minutes: number;
}

/**
 * ОЦЕНКА РЕЙСА — ОДНА ФУНКЦИЯ И ОДНА ТОЧКА ЗАМЕНЫ.
 *
 * Сейчас считает по расстоянию и средней скорости: расстояние человек ставит
 * руками, потому что маршрутизатора у статического сайта нет.
 *
 * Когда появится картографический сервис, меняется только тело этой функции —
 * ни один компонент про это не узнает. Что для этого понадобится, записано в
 * CLAUDE.md: ключ на боевой домен, координаты площадки, адрес объекта вместо
 * километров и асинхронный вызов вместо чистой функции.
 */
export function estimateTrip(km: number): Trip {
  const d = Number.isFinite(km) ? Math.min(MAX_TRIP_KM, Math.max(0, km)) : 0;
  return { km: round2(d), minutes: Math.round((d / AVG_SPEED_KMH) * 60) };
}

export type Unit = 'm3' | 't';

export interface CalcInput {
  materialId: string;
  /** Количество в выбранных единицах. */
  amount: number;
  unit: Unit;
}

/**
 * Почему расчёт неполный. null — полный.
 *
 * 'no-price' — у позиции нет цены: она есть в прайсе, а числа против неё не
 * стоит. Объём, массу и рейсы посчитать всё равно можно — они от цены не
 * зависят, — и они показываются: это честная часть ответа. Стоимости нет, и
 * подставлять на её место ноль нельзя.
 *
 * 'no-fleet' — металл. Стоимость проката считается точно, тоннаж на цену за
 * тонну, а рейсы не подбираются: плотности у проката в данных нет, и
 * самосвал ему не подходит. Подставить самосвал ради того, чтобы в панели
 * появилось число, нельзя — это была бы выдумка про товар.
 */
export type CalcBlock = null | 'no-price' | 'no-fleet';

export interface CalcResult {
  material: Material;
  blocked: CalcBlock;
  /** Объём после приведения к кубам. */
  volumeM3: number;
  /** Масса — её спрашивают на въезде на объект. */
  massT: number;
  /** Подобранная машина и число рейсов. null у металла. */
  truck: Truck | null;
  rides: number;
  /** Сколько кубов реально влезает в один рейс с учётом тоннажа. */
  perRideM3: number;
  /** null, если цены у позиции нет. */
  materialCost: number | null;
  /** Заказ меньше минимальной отгрузки. */
  belowMinimum: boolean;
}

/** Сколько кубов данного материала влезает в машину: кузов или тоннаж. */
export function capacityM3(truck: Truck, density: number): number {
  return Math.min(truck.volumeM3, truck.payloadT / density);
}

/**
 * Подбор машины. Перебираем весь парк и берём тот вариант, который увозит
 * объём за наименьшее число рейсов; при равном числе рейсов — машину
 * поменьше, чтобы она не шла полупустой. На 12 кубах это пятнадцатикубовый
 * самосвал, а не тридцатикубовый полуприцеп.
 *
 * Денежной части здесь больше нет: доставки у нас нет вовсе, и сравнивать
 * варианты по стоимости подачи не по чему.
 */
export function pickTruck(volumeM3: number, density: number) {
  let best: { truck: Truck; rides: number; perRideM3: number } | null = null;
  for (const truck of FLEET) {
    const perRideM3 = capacityM3(truck, density);
    const rides = Math.max(1, Math.ceil(round2(volumeM3) / perRideM3 - 1e-9));
    const better =
      !best || rides < best.rides || (rides === best.rides && truck.volumeM3 < best.truck.volumeM3);
    if (better) best = { truck, rides, perRideM3 };
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

  /* Металл считается только в тоннах: кубометр проката не значит ничего, и
     плотности у него в данных нет. Машину под него не подбираем — тарифа на
     перевозку металла в проекте нет, и придумывать его нельзя. */
  if (sellUnit(material) === 't') {
    const tons = round2(amount);
    const perTon = material.pricePerTon;
    return {
      material,
      blocked: 'no-fleet',
      volumeM3: 0,
      massT: tons,
      truck: null,
      rides: 0,
      perRideM3: 0,
      materialCost: perTon === null ? null : Math.round(tons * perTon),
      belowMinimum: false,
    };
  }

  const density = material.density as number;
  const volumeM3 = round2(toM3(amount, input.unit, density));
  const massT = round2(volumeM3 * density);

  const { truck, rides, perRideM3 } = pickTruck(Math.max(volumeM3, 0.01), density);
  const perM3 = pricePerM3(material);
  const materialCost = perM3 === null ? null : Math.round(volumeM3 * perM3);

  return {
    material,
    blocked: perM3 === null ? 'no-price' : null,
    volumeM3,
    massT,
    truck,
    rides,
    perRideM3: round2(perRideM3),
    materialCost,
    belowMinimum: volumeM3 > 0 && volumeM3 < MIN_ORDER_M3,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
