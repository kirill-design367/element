/* Файл собран scripts/build-marks.py — руками не править.

   Три прошлых направления убраны. Устройство строится следующим коммитом,
   поэтому композиций здесь пока нет; типы и метрики остаются — на них
   ссылается страница.

   Пересобрать:  python3 scripts/build-marks.py
*/

/** Роль краски в палитре: фон и основная. */
export type Role = 'bg' | 'ink';

/** Кусок композиции: свой контур или ссылка на общий. */
export type Part = { d?: string; ref?: string; x?: number; y?: number; role: Role };

/** Композиция: коробка в единицах шрифта и куски по порядку отрисовки. */
export type Art = { w: number; h: number; cap: number; parts: Part[] };

export const METRICS = { upem: 1000, cap: 680, xh: 495, stem: 176 };

export const PATHS: Record<string, string> = {};

export const ART: Record<string, Art> = {};
