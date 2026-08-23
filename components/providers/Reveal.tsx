'use client';

import { useEffect } from 'react';
import { EASE, prefersReducedMotion } from '@/lib/motion';

/**
 * Появление секций при скролле.
 *
 * Принципиально: элементы НИКОГДА не прячутся заранее. Анимация строится
 * через gsap.from в момент входа в кадр — если ScrollTrigger не сработает
 * (не выполнился скрипт, экран не прокручивали, страницу снимают целиком),
 * содержимое просто остаётся на месте. Обратный порядок — сначала спрятать,
 * потом показать по триггеру — однажды уже съел половину страницы.
 *
 * Один сканер на всё приложение вместо обёртки вокруг каждого блока:
 * меньше клиентских компонентов — меньше гидратации.
 */
export function Reveal() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let killed = false;
    let triggers: { kill: () => void }[] = [];

    const run = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
      // Первый экран не анимируем: он и есть LCP.
      const below = nodes.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
      if (!below.length) return;

      triggers = ScrollTrigger.batch(below, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            opacity: 0,
            y: 14,
            duration: 0.5,
            ease: EASE,
            stagger: 0.05,
            overwrite: 'auto',
            clearProps: 'opacity,transform',
          }),
      });
    };

    void run();
    return () => {
      killed = true;
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return null;
}
