/** Один источник правды по анимациям: длительности, easing и режим покоя. */

export const DUR = {
  /** Микровзаимодействия: наведение, фокус, смена плотности фона. */
  hover: 0.3,
  /** Служебные переходы интерфейса. */
  base: 0.4,
  /** Появление блока при входе в кадр. Короче 0,4 с не бывает ничего. */
  reveal: 0.9,
  /** Набор цифры в счётчике. */
  count: 1.4,
  /** Перелёт карточки категории в каталог. */
  flip: 0.62,
} as const;

export const EASE = 'power3.out';
export const EASE_INOUT = 'power3.inOut';

/** Пользователь просил не двигать интерфейс — уважаем на каждом входе. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
