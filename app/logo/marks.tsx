/**
 * Знаки для служебной страницы /logo.
 *
 * Условия, общие для всех: квадратный viewBox 48×48, один цвет через
 * currentColor, никаких градиентов, теней и растра. Заливки — path и circle,
 * обводки — со своей толщиной, butt-концами и miter-стыками, чтобы геометрия
 * читалась ровно так, как задана.
 *
 * Идентификаторов (id, mask, clipPath) здесь нет намеренно: каждый знак
 * рисуется на странице по пять раз, и дубли id сделали бы разметку невалидной.
 * Просветы внутри одной фигуры — отдельными контурами, а не масками.
 *
 * Поле у всех одно: фигура вписана в 4…44, то есть по 4 единицы отступа с
 * каждой стороны. Исключение оговорено в описании самого знака.
 */

export type MarkProps = {
  /** Сторона квадрата в пикселях. */
  size: number
  className?: string
}

/** Корневой svg: квадрат, цвет от текста, из дерева доступности убран. */
function frame(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    'aria-hidden': true,
    focusable: 'false' as const,
  }
}

/** Общие атрибуты обводки: ровная толщина, прямые концы и углы. */
const stroke = {
  stroke: 'currentColor',
  strokeLinecap: 'butt' as const,
  strokeLinejoin: 'miter' as const,
  fill: 'none',
}

/**
 * 1. Скол — восьмигранник, у которого одна фаска срезана вдвое глубже.
 * Семь сторон вместо восьми: шесть фасок по 10, седьмая — 20. Все до одного
 * углы кратны 45°, поэтому «отбитая» грань лежит в той же сетке, что и целые.
 *
 * V-образная выемка на верхней грани пробовалась и отвергнута: на любой
 * глубине силуэт читался надкусанным яблоком, а не сколом. Проверено пятью
 * построениями подряд — выемка по центру, выемка на ребре, выемка со ступенью.
 */
export function MarkSkol({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path
        d="M14 4 H24 L44 24 V34 L34 44 H14 L4 34 V14 Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * 2. Фракция — девять зёрен в строгой сетке 3 × 3, шаг 16.
 * Радиус убывает по рядам: 6,5 → 4,5 → 2,5, то есть рассев сверху вниз.
 */
export function MarkFraktsiya({ size, className }: MarkProps) {
  const axes = [8, 24, 40]
  const radii = [6.5, 4.5, 2.5]
  return (
    <svg {...frame(size, className)}>
      {radii.map((r, row) =>
        axes.map((cx) => (
          <circle key={`${row}-${cx}`} cx={cx} cy={axes[row]} r={r} fill="currentColor" />
        )),
      )}
    </svg>
  )
}

/**
 * 3. Керн — круг r = 20, разрезанный на три слоя разной толщины (14, 10, 8)
 * просветами по 4. Каждый слой — настоящий сегмент круга, а не прямоугольник
 * поверх: хорды посчитаны от радиуса, поэтому края слоёв ложатся на окружность.
 */
export function MarkKern({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path d="M4.9212 18 A20 20 0 0 1 43.0788 18 Z" fill="currentColor" />
      <path
        d="M4.1003 22 H43.8997 A20 20 0 0 1 42.3303 32 H5.6697 A20 20 0 0 1 4.1003 22 Z"
        fill="currentColor"
      />
      <path d="M8 36 A20 20 0 0 0 40 36 Z" fill="currentColor" />
    </svg>
  )
}

/**
 * 4. Сечение — замкнутый профиль трубы, вид с торца.
 * Стенка ровно 8 по всему контуру, включая углы: внешний радиус 12, внутренний
 * 4, разница равна толщине стенки — только при этом условии обвод получается
 * настоящим эквидистантом, а не похожим на него.
 */
export function MarkSechenie({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M16 4 H32 A12 12 0 0 1 44 16 V32 A12 12 0 0 1 32 44 H16 A12 12 0 0 1 4 32 V16 A12 12 0 0 1 16 4 Z
           M16 12 H32 A4 4 0 0 1 36 16 V32 A4 4 0 0 1 32 36 H16 A4 4 0 0 1 12 32 V16 A4 4 0 0 1 16 12 Z"
      />
    </svg>
  )
}

/**
 * 5. Уголок — открытый профиль: две полки по 40 при толщине 13.
 */
export function MarkUgolok({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path d="M4 4 H17 V31 H44 V44 H4 Z" fill="currentColor" />
    </svg>
  )
}

/**
 * 6. Э круглая — дуга и язык одной толщины 8.
 * Осевой радиус 16, значит наружу 20 и внутрь 12: кольцо вписано в те же 4…44.
 * Разрыв слева ровно 90°, концы срезаны прямо. Круг здесь настоящий круг —
 * дуга, а не четыре кривые Безье.
 */
export function MarkEKrug({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path {...stroke} strokeWidth={8} d="M12.6863 12.6863 A16 16 0 1 1 12.6863 35.3137" />
      <path {...stroke} strokeWidth={8} d="M14 24 H40" />
    </svg>
  )
}

/**
 * 7. Э модульная — та же буква прямыми штрихами той же толщины 8.
 * Просветы тоже 8: штрих, просвет и шаг сетки — одно число.
 */
export function MarkEModul({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path {...stroke} strokeWidth={8} d="M4 8 H40 V40 H4" />
      <path {...stroke} strokeWidth={8} d="M16 24 H40" />
    </svg>
  )
}

/**
 * 8. Грань — ромб 40 × 40, расколотый надвое просветом в 4.
 * Боковые рёбра под 45°. Крайние точки ромба приходятся ровно на просвет,
 * поэтому по ширине знак занимает 36, а не 40, — это следствие раскола.
 */
export function MarkGran({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path d="M24 4 L42 22 L6 22 Z" fill="currentColor" />
      <path d="M6 26 L42 26 L24 44 Z" fill="currentColor" />
    </svg>
  )
}

/**
 * 9. Сито — сетка грохота 3 × 3 с одной закрытой ячейкой в центре.
 *
 * Пруток 2 при шаге 12, то есть на прутки уходит шестая часть стороны. Толщина
 * подбиралась замером, а не на глаз: при 4 и при 3 чёрного в фигуре больше
 * трети, сетка сливается в плиту с девятью окнами, а закрытая ячейка исчезает
 * на чёрном совсем. При 2 сетка читается сеткой, а закрытая ячейка — закрытой.
 *
 * Из-за тонкого прутка знак стоит в 5…43 вместо общих 4…44: наружная кромка
 * идёт по краю обводки, а она здесь вдвое тоньше.
 */
export function MarkSito({ size, className }: MarkProps) {
  return (
    <svg {...frame(size, className)}>
      <path {...stroke} strokeWidth={2} d="M6 6 H42 V42 H6 Z" />
      <path {...stroke} strokeWidth={2} d="M18 6 V42 M30 6 V42 M6 18 H42 M6 30 H42" />
      <path d="M19 19 H29 V29 H19 Z" fill="currentColor" />
    </svg>
  )
}
