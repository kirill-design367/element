'use client';

import { useEffect } from 'react';
import { DUR, EASE, prefersReducedMotion } from '@/lib/motion';

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
 *
 * Группы движения: [data-reveal] — карточки и строки, [data-hero] — первый
 * экран, [data-fact] — полоса фактов, [data-rail-item] — лента материалов,
 * [data-fleet] и [data-total] — крупные числа, [data-parallax] — фоновые
 * слоты. Линейных переходов нет нигде: только power3.out из lib/motion.
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
            y: 18,
            duration: DUR.slow,
            ease: EASE,
            stagger: 0.06,
            overwrite: 'auto',
            clearProps: 'opacity,transform',
          }),
      });

      /** Один и тот же приём для всех именованных групп: сдвиг и проявление. */
      const enter = (
        selector: string,
        vars: Record<string, unknown>,
        opts: { start?: string; stagger?: number } = {},
      ) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
        if (!els.length) return;
        const visible = els.filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.92);
        const later = els.filter((el) => !visible.includes(el));
        // Уже в кадре — играем сразу, иначе ждём входа.
        if (visible.length) {
          gsap.from(visible, {
            ...vars,
            stagger: opts.stagger ?? 0.07,
            overwrite: 'auto',
            clearProps: 'opacity,transform',
          });
        }
        later.forEach((el) => {
          triggers.push(
            ScrollTrigger.create({
              trigger: el,
              start: opts.start ?? 'top 88%',
              once: true,
              onEnter: () =>
                gsap.from(el, { ...vars, overwrite: 'auto', clearProps: 'opacity,transform' }),
            }),
          );
        });
      };

      // Первый экран: заголовок, лид и кнопки набираются по очереди.
      enter('[data-hero]', { opacity: 0, y: 22, duration: DUR.slow, ease: EASE }, { stagger: 0.08 });

      // Полоса фактов: три факта с небольшим сдвигом друг за другом.
      enter('[data-fact]', { opacity: 0, y: 14, duration: DUR.base, ease: EASE }, { stagger: 0.07 });

      // Лента материалов слегка доезжает при входе в кадр.
      enter('[data-rail-item]', { opacity: 0, x: 36, duration: DUR.slow, ease: EASE }, { stagger: 0.06 });

      // Крупные числа набираются со сдвигом снизу — заметнее, чем у текста.
      enter('[data-fleet="lead"], [data-total]', { opacity: 0, y: 40, duration: 0.7, ease: EASE });
      enter('[data-fleet="rest"], [data-fleet="label"]', { opacity: 0, y: 16, duration: DUR.slow, ease: EASE }, { stagger: 0.06 });

      /**
       * Параллакс на фоновых слотах: первый экран, парк, объекты. Амплитуда
       * 40 пикселей на весь проход, по 20 в каждую сторону; двигается только
       * transform, вёрстка не пересчитывается. Кадры выше своих блоков на
       * 48 px и подняты на 24 — иначе на краях показалась бы полоса фона.
       * Селектор стоит на изображениях внутри слотов, поэтому пока в
       * lib/assets.ts не заполнен src, ни одного триггера не создаётся.
       */
      const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
      parallax.forEach((el) => {
        const box = el.parentElement ?? el;
        // У блока в самом верху документа диапазон «top bottom → bottom top»
        // почти исчерпан ещё до первой прокрутки, и кадр стоит на упоре.
        // Для него отсчёт начинается от верха экрана.
        const atTop = box.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.5;
        triggers.push(
          ScrollTrigger.create({
            trigger: box,
            start: atTop ? 'top top' : 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              gsap.set(el, { y: (self.progress - 0.5) * 40 });
            },
          }),
        );
        // Начальное положение: без этого кадр стоит по центру диапазона,
        // а видно его с самого верха.
        gsap.set(el, { y: atTop ? -20 : 0 });
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
