/**
 * ЦИФРЫ БЛОКА «ПАРК И ОБЪЁМЫ».
 *
 * Записи правит заказчик — они в `lib/data/fleet.data.ts`. Здесь остаётся
 * то, что заказчик править не должен и не может: подстановка чисел, которые
 * СЧИТАЮТСЯ ИЗ ДАННЫХ.
 *
 * ЗАЧЕМ ЭТО НУЖНО. Две строки из четырёх — «позиций в каталоге» и «лет на
 * рынке» — раньше стояли в коде выражениями, а не числами: первое считается
 * из каталога, второе из года основания. Отдай их в админку числом — и
 * витрина начнёт врать при первой же правке прайса, причём молча. Поэтому у
 * записи есть признак `computed`: он говорит, что число берётся отсюда, а
 * набранное в админке значение остаётся только запасным.
 *
 * То же с уточнением под подписью: `{самосвалы}`, `{категорий}`, `{год}` и
 * `{объектов}` подставляются здесь. Текст вокруг них заказчик пишет сам.
 */

import { FLEET_VOLUME_RANGE } from './pricing';
import { CATEGORIES, POSITIONS_TOTAL } from './catalog';
import { OBJECTS_DONE, SINCE_YEAR } from './company';
import { FLEET_NUMBERS_DATA } from './data/fleet.data';
import type { FleetNumberData } from './data/types';

export type { FleetNumberData } from './data/types';

/** Цифра, готовая к показу: подстановки уже сделаны. */
export interface FleetNumber {
  value: number;
  unit: string;
  label: string;
  note: string;
  lead?: boolean;
}

/** Что подставляется в уточнение. Ключ — то, что пишут в админке. */
const SUBSTITUTIONS: Record<string, string> = {
  '{самосвалы}': `${FLEET_VOLUME_RANGE[0]}–${FLEET_VOLUME_RANGE[1]}`,
  '{категорий}': String(CATEGORIES.length),
  '{год}': String(SINCE_YEAR),
  '{объектов}': String(OBJECTS_DONE),
};

/** Числа, которые считаются, а не набираются. */
const COMPUTED: Record<NonNullable<FleetNumberData['computed']>, number> = {
  positions: POSITIONS_TOTAL,
  years: new Date().getFullYear() - SINCE_YEAR,
};

function resolve(n: FleetNumberData): FleetNumber {
  let note = n.note;
  for (const [key, value] of Object.entries(SUBSTITUTIONS)) {
    note = note.split(key).join(value);
  }
  return {
    value: n.computed ? COMPUTED[n.computed] : n.value,
    unit: n.unit,
    label: n.label,
    note,
    lead: n.lead,
  };
}

export const FLEET_NUMBERS: FleetNumber[] = FLEET_NUMBERS_DATA.map(resolve);

/**
 * Главное число и остальные. Если признака lead нет ни у одной записи,
 * главным становится первая, а пустой список отдаёт null — блок в этом
 * случае просто не рисует панель, а не роняет сборку.
 */
export const FLEET_LEAD: FleetNumber | null =
  FLEET_NUMBERS.find((n) => n.lead) ?? FLEET_NUMBERS[0] ?? null;

export const FLEET_REST: FleetNumber[] = FLEET_NUMBERS.filter((n) => n !== FLEET_LEAD);
