/**
 * Передача состояния для перехода «карточка категории ↔ каталог».
 *
 * Клик по карточке на главной запоминает её положение и разметку, страница
 * каталога подхватывает это и достраивает перелёт. Модульная переменная, а не
 * контекст: значение нужно ровно один раз, между размонтированием одной
 * страницы и монтированием другой, и переживать перезагрузку не должно —
 * прямой заход на /catalog обязан открываться без анимации.
 */

export interface FlipHandoff {
  categoryId: string;
  direction: 'to-catalog' | 'to-home';
  /** Координаты источника в системе вьюпорта на момент клика. */
  rect: { top: number; left: number; width: number; height: number };
  /** Разметка исходной плашки — перелетает ровно то, что было на экране. */
  html: string;
  /** Радиус скругления источника, чтобы форма менялась вместе с размером. */
  radius: string;
}

let pending: FlipHandoff | null = null;

export const flipStore = {
  set(h: FlipHandoff) {
    pending = h;
  },
  /** Забрать и очистить: перелёт срабатывает один раз. */
  take(direction: FlipHandoff['direction']): FlipHandoff | null {
    if (!pending || pending.direction !== direction) return null;
    const p = pending;
    pending = null;
    return p;
  },
  clear() {
    pending = null;
  },
};

/** Снимает всё нужное с элемента-источника перед уходом со страницы. */
export function captureSource(
  el: HTMLElement,
  categoryId: string,
  direction: FlipHandoff['direction'],
): void {
  const r = el.getBoundingClientRect();
  flipStore.set({
    categoryId,
    direction,
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    html: el.outerHTML,
    radius: getComputedStyle(el).borderRadius,
  });
}
