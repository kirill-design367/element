/** Один источник правды по анимациям: длительности, easing и режим покоя. */

export const DUR = { fast: 0.18, base: 0.32, slow: 0.55, flip: 0.62 } as const;
export const EASE = 'power3.out';
export const EASE_INOUT = 'power3.inOut';

/** Пользователь просил не двигать интерфейс — уважаем на каждом входе. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
