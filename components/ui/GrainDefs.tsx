import { CATEGORIES } from '@/lib/catalog';

/**
 * Россыпь зёрен как SVG-паттерн.
 *
 * Первый заход рисовал каждое зерно отдельным узлом — чтобы заполнить
 * плашку песком, требовались тысячи элементов и полторы сотни килобайт
 * разметки на одних инлайновых стилях. Паттерн решает это: узор задан
 * один раз, замощает поле любого размера и весит около трёх килобайт
 * в сжатом виде на все пять категорий.
 *
 * Плитка повёрнута и вымощена зёрнами по детерминированной раскладке —
 * ни одной случайной величины, которая могла бы разойтись между сервером
 * и браузером. Поворот и разный шаг у каждой категории прячут стык плитки.
 */

const TILE = 100;

/** Линейный конгруэнтный генератор: одинаковый результат при каждой сборке. */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Зерно, пересекающее край плитки, повторяется с противоположной стороны —
 * без этого стык плитки читается диагональными полосами по всему полю.
 * Копия появляется только у тех зёрен, что действительно вылезают за край,
 * поэтому разметка вырастает примерно в полтора раза, а не в девять.
 */
function wrap<T extends { x: number; y: number; half: number }>(item: T): { dx: number; dy: number }[] {
  const out: { dx: number; dy: number }[] = [];
  for (const dx of [-TILE, 0, TILE]) {
    for (const dy of [-TILE, 0, TILE]) {
      const x = item.x + dx;
      const y = item.y + dy;
      if (x + item.half < 0 || x - item.half > TILE) continue;
      if (y + item.half < 0 || y - item.half > TILE) continue;
      out.push({ dx, dy });
    }
  }
  return out;
}

/** Дроблёное зерно: щебень, ПГС, отсев. */
function makeGrains(seed: number, count: number) {
  const rand = lcg(seed);
  const shapes: { points: string; light: boolean }[] = [];

  for (let n = 0; n < count; n++) {
    const size = 7 + rand() * 13;
    const cx = rand() * TILE;
    const cy = rand() * TILE;
    const sides = 5 + Math.floor(rand() * 2);
    const spin = rand() * Math.PI;
    const light = rand() > 0.62;

    // Радиус гуляет — зерно получается дроблёным, а не правильным многоугольником.
    const radii = Array.from({ length: sides }, () => (size / 2) * (0.62 + rand() * 0.38));

    for (const { dx, dy } of wrap({ x: cx, y: cy, half: size / 2 })) {
      const points = radii
        .map((r, i) => {
          const a = spin + (i / sides) * Math.PI * 2;
          return `${(cx + dx + Math.cos(a) * r).toFixed(1)},${(cy + dy + Math.sin(a) * r).toFixed(1)}`;
        })
        .join(' ');
      shapes.push({ points, light });
    }
  }
  return shapes;
}

/** Окатанное зерно: песок и грунт не дробят. */
function makeRounds(seed: number, count: number) {
  const rand = lcg(seed);
  const out: { cx: string; cy: string; r: string; light: boolean }[] = [];

  for (let n = 0; n < count; n++) {
    const cx = rand() * TILE;
    const cy = rand() * TILE;
    const r = 3.5 + rand() * 5;
    const light = rand() > 0.62;
    for (const { dx, dy } of wrap({ x: cx, y: cy, half: r })) {
      out.push({ cx: (cx + dx).toFixed(1), cy: (cy + dy).toFixed(1), r: r.toFixed(1), light });
    }
  }
  return out;
}

/**
 * Разметка узора собирается строкой и вставляется одним куском.
 *
 * Отрисованная как обычный JSX, она давала React три с половиной сотни
 * элементов на гидратацию только ради фона — мобильная скорость падала
 * с 98 до 81. Для React это теперь один узел, для браузера — тот же SVG.
 */
function buildDefs(): string {
  return CATEGORIES.map((c) => {
    const g = c.grain;
    // Шаг плитки в пикселях: чем крупнее зерно материала, тем крупнее плитка.
    const step = (TILE * g.max) / 20;
    const rot = -13 + CATEGORIES.indexOf(c) * 7;
    const seed = CATEGORIES.indexOf(c) * 7919 + 13;

    const body = g.round
      ? makeRounds(seed, g.count)
          .map((p) => `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.light ? g.tint2 : g.tint}"/>`)
          .join('')
      : makeGrains(seed, g.count)
          .map((p) => `<polygon points="${p.points}" fill="${p.light ? g.tint2 : g.tint}"/>`)
          .join('');

    return (
      `<pattern id="grain-${c.id}" width="${step}" height="${step}" ` +
      `patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})" viewBox="0 0 ${TILE} ${TILE}">` +
      `<rect width="${TILE}" height="${TILE}" fill="${g.bg}"/>${body}</pattern>`
    );
  }).join('');
}

const DEFS = buildDefs();

export function GrainDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      className="absolute"
      dangerouslySetInnerHTML={{ __html: `<defs>${DEFS}</defs>` }}
    />
  );
}
