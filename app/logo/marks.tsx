import { METRICS } from './logos';

/**
 * Знаки нарисованы руками, не сгенерированы: это чистая геометрия без единой
 * буквы, и держать её в скрипте вместе с контурами шрифта незачем.
 *
 * Общая система координат: viewBox высотой 100, где 100 — высота прописных.
 * Значит любое число здесь читается как процент от кегля, а не как «на глаз».
 * Все размеры кратны 2, толщины повторяются, углы прямые или 45°.
 */

export type MarkSpec = {
  /** Ширина в долях высоты прописных. */
  w: number;
  d: string;
  rule?: 'evenodd';
};

/** 1. Фракция: три бруска шириной 42, 28 и 14 — ряд 3 : 2 : 1. Просветы 14. */
export const FRAKTSIYA: MarkSpec = {
  w: 1.12,
  d: 'M0 0H42V100H0Z M56 0H84V100H56Z M98 0H112V100H98Z',
};

/**
 * 2. Тонна и куб: залитый квадрат и квадратное кольцо той же стороны.
 * Стенка кольца 22 — та же величина, что просвет у «Фракции» плюс восьмая.
 */
export const VES: MarkSpec = {
  w: 2.14,
  d: 'M0 0H100V100H0Z M114 0H214V100H114Z M136 22H192V78H136Z',
  rule: 'evenodd',
};

/** 3. Сечение: круг Ø100 с квадратным отверстием 44 по центру. */
export const SECHENIE: MarkSpec = {
  w: 1,
  d: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z M28 28H72V72H28Z',
  rule: 'evenodd',
};


/** Знак нужного роста. Высота задаётся в долях высоты прописных. */
export function Mark({ spec, cap, className }: {
  spec: MarkSpec; cap: number; className?: string;
}) {
  return (
    <svg
      width={cap * spec.w}
      height={cap}
      viewBox={`0 0 ${spec.w * 100} 100`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={spec.d} fill="currentColor" fillRule={spec.rule ?? 'nonzero'} />
    </svg>
  );
}

/** Кегль, при котором высота прописных равна cap. */
export const fontFor = (cap: number) => (cap * METRICS.upem) / METRICS.cap;
