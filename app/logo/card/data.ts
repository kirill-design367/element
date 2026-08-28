/**
 * СОДЕРЖИМОЕ ВИЗИТКИ. Собирается из тех же файлов данных, что и сайт: ни
 * одного числа и ни одной характеристики здесь не набрано руками.
 *
 * Категории и характеристики — lib/catalog.ts, пороги и сроки —
 * lib/pricing.ts, документы — lib/workflow.ts, контакты и реквизиты —
 * lib/company.ts.
 */

import {
  CATEGORIES,
  categoryName,
  categorySpec,
  materialsOf,
  POSITIONS_TOTAL,
  POSITIONS_IN_STOCK,
} from '@/lib/catalog';
import { COMPANY } from '@/lib/company';
import { num, typo } from '@/lib/format';
import { DEFERRAL_DAYS, MIN_ORDER_M3, PRICE_HOLD_DAYS } from '@/lib/pricing';
import { TERMS } from '@/lib/workflow';

/** Строка «что возим»: название, сколько позиций и характеристика. */
export type Row = { name: string; count: number | null; spec: string };

/**
 * ПГС и отсев идут одной строкой: на визитке шесть строк, а категорий пять
 * плюс документы. Характеристики обеих категорий складываются, потому что
 * считаются из позиций и разойтись с каталогом не могут.
 */
function merged(ids: string[], name: string): Row {
  return {
    name,
    count: ids.reduce((n, id) => n + materialsOf(id).length, 0),
    spec: ids.flatMap((id) => categorySpec(id)).join(' · '),
  };
}

/** Документы — не категория каталога, поэтому берутся из условий для юрлиц. */
const DOC_TERMS = TERMS.filter((t) => /документ|паспорт/i.test(t.title));

export const ROWS: Row[] = [
  ...['shcheben', 'pesok'].map((id) => ({
    name: categoryName(id),
    count: materialsOf(id).length,
    spec: categorySpec(id).join(' · '),
  })),
  merged(['pgs', 'otsev'], `${categoryName('pgs')} и ${categoryName('otsev').toLowerCase()}`),
  ...['grunt', 'metall'].map((id) => ({
    name: categoryName(id),
    count: materialsOf(id).length,
    spec: categorySpec(id).join(' · '),
  })),
  { name: 'Документы', count: null, spec: DOC_TERMS.map((t) => t.title).join(' · ') },
];

/** Три ключевых факта: число, единица и подпись. */
export type Fact = { value: string; unit: string; label: string };

export const FACTS: Fact[] = [
  { value: num(MIN_ORDER_M3), unit: 'м³', label: 'минимальная отгрузка' },
  { value: num(DEFERRAL_DAYS), unit: 'дней', label: 'отсрочка для юрлиц' },
  { value: num(PRICE_HOLD_DAYS), unit: 'дней', label: 'держим названную цену' },
];

export const POSITIONS = { total: POSITIONS_TOTAL, inStock: POSITIONS_IN_STOCK,
  categories: CATEGORIES.length };

/** Условия отгрузки одной строкой — то же, что в контактах сайта. */
export const SHIPPING = COMPANY.shipping;

/**
 * Заголовок-предложение. Это не данные, а тот же текст, что в заголовке
 * первого экрана: держать его в двух местах нельзя, поэтому он объявлен
 * здесь один раз и отсюда идёт во все три варианта.
 */
export const OFFER = typo('Щебень, песок, грунт и металлопрокат с отгрузкой без очереди');

export const CONTACTS = {
  phone: COMPANY.phoneLabel,
  phoneHref: `tel:${COMPANY.phone}`,
  address: COMPANY.address,
  hours: COMPANY.hoursShipping,
};

/**
 * Реквизиты. Почты здесь нет: поля email в lib/company.ts не существует —
 * почта убрана со всего сайта решением заказчика, и заводить её обратно
 * запрещено правилом проекта. Каналов связи два: телефон и заявка.
 */
export const LEGAL: [string, string][] = [
  ['ИНН', COMPANY.inn],
  ['КПП', COMPANY.kpp],
  ['ОГРН', COMPANY.ogrn],
];

export const LEGAL_NAME = COMPANY.legalName;
