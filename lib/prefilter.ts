/**
 * Дофильтрация до гидратации.
 *
 * Статический экспорт отдаёт один и тот же HTML на любой адрес, поэтому в
 * разметку попадают все позиции, а фильтр из адреса применяется только когда
 * оживёт React. На придушенном процессоре это почти две секунды, в течение
 * которых человек, открывший присланную ссылку, видит не ту выборку.
 *
 * Решение без дублирования логики: короткий скрипт переносит параметры адреса
 * в атрибуты <html>, а правила ниже — сгенерированные из тех же данных, что и
 * сам фильтр, — прячут неподходящие карточки средствами CSS. Как только React
 * возьмёт управление, атрибуты снимаются и правила перестают действовать.
 */

import { CATEGORIES, FRACTION_FILTERS, GOST_FILTERS, MATERIALS, type Material } from './catalog';

export const PREFILTER_KEYS = ['category', 'fraction', 'gost'] as const;

/** Идентификаторы фракций, под которые подходит позиция. */
export function fractionIds(m: Material): string {
  return FRACTION_FILTERS.filter((f) => f.test(m))
    .map((f) => f.id)
    .join(' ');
}

const chipOn = 'background:var(--accent);color:#fff;border-color:var(--accent)';
const chipOff = 'background:var(--surface);color:var(--ink-2);border-color:var(--line-strong)';

/** Скрипт выполняется до разбора списка — карточки не успевают мигнуть. */
export const PREFILTER_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search),d=document.documentElement;${JSON.stringify(
  PREFILTER_KEYS,
)}.forEach(function(k){var v=p.get(k);if(v)d.setAttribute('data-f-'+k,v)})}catch(e){}})()`;

export function prefilterCss(): string {
  const rules: string[] = [];

  const pair = (key: string, value: string, itemSelector: string) => {
    const esc = value.replace(/"/g, '\\"');
    rules.push(`html[data-f-${key}="${esc}"] ${itemSelector}{display:none}`);
    rules.push(`html[data-f-${key}="${esc}"] [data-chip="${key}:${esc}"]{${chipOn}}`);
    rules.push(`html[data-f-${key}="${esc}"] [data-chip="${key}:all"]{${chipOff}}`);
  };

  CATEGORIES.forEach((c) => pair('category', c.id, `article[data-cat]:not([data-cat="${c.id}"])`));
  FRACTION_FILTERS.forEach((f) => pair('fraction', f.id, `article[data-fr]:not([data-fr~="${f.id}"])`));
  GOST_FILTERS.forEach((g) =>
    pair('gost', g, `article[data-gost]:not([data-gost="${g.replace(/"/g, '\\"')}"])`),
  );

  // Счётчик найденного до гидратации соврал бы — прячем его на этот миг.
  rules.push(
    PREFILTER_KEYS.map((k) => `html[data-f-${k}] [data-found]`).join(',') + '{visibility:hidden}',
  );

  return rules.join('');
}

/** Проверка целостности: у каждой позиции должна найтись хотя бы одна фракция. */
export const PREFILTER_COVERAGE = MATERIALS.every((m) => fractionIds(m).length > 0);
