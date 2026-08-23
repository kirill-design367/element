'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { flipStore, type FlipHandoff } from '@/lib/flip-store';
import { DUR, EASE_INOUT, prefersReducedMotion } from '@/lib/motion';

/**
 * Приземление перелёта. Страница-получатель говорит, куда должна прийти
 * плашка; хук достраивает движение поверх настоящего DOM.
 *
 * Пусто в хранилище — значит, на страницу зашли по прямой ссылке, и она
 * просто открывается. Это требование заказчика, а не побочный эффект.
 */
export function useFlipArrival(
  direction: FlipHandoff['direction'],
  resolveTarget: (handoff: FlipHandoff) => HTMLElement | null,
  options?: { beforeMeasure?: (handoff: FlipHandoff) => void; fadeIn?: RefObject<HTMLElement | null> },
) {
  useLayoutEffect(() => {
    const handoff = flipStore.take(direction);
    if (!handoff || prefersReducedMotion()) return;

    let killed = false;
    let overlay: HTMLDivElement | null = null;

    const run = async () => {
      const [{ gsap }, { Flip }] = await Promise.all([import('gsap'), import('gsap/Flip')]);
      if (killed) return;
      gsap.registerPlugin(Flip);

      // Цель может лежать ниже сгиба — сначала доводим экран, потом меряем.
      options?.beforeMeasure?.(handoff);
      const target = resolveTarget(handoff);
      if (!target) return;

      overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = [
        'position:fixed',
        `top:${handoff.rect.top}px`,
        `left:${handoff.rect.left}px`,
        `width:${handoff.rect.width}px`,
        `height:${handoff.rect.height}px`,
        'z-index:90',
        'pointer-events:none',
        'will-change:transform,width,height',
        // Ограничиваем пересчёт вёрстки двойником: страница под ним не трогается.
        'contain:layout paint',
        `border-radius:${handoff.radius}`,
        'overflow:hidden',
      ].join(';');
      overlay.innerHTML = handoff.html;
      const inner = overlay.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.width = '100%';
        inner.style.height = '100%';
        inner.style.margin = '0';
      }
      document.body.appendChild(overlay);

      // Настоящая плашка ждёт, пока долетит её двойник.
      gsap.set(target, { autoAlpha: 0 });
      const fadeEl = options?.fadeIn?.current ?? null;
      if (fadeEl) gsap.set(fadeEl, { autoAlpha: 0, y: 12 });

      const tl = gsap.timeline({
        onComplete: () => {
          overlay?.remove();
          overlay = null;
        },
      });

      tl.add(
        Flip.fit(overlay, target, {
          duration: DUR.flip,
          ease: EASE_INOUT,
        }) as gsap.core.Tween,
        0,
      );
      // Форма меняется вместе с размером: у карточки радиус свой, у полосы каталога свой.
      tl.to(
        overlay,
        { borderRadius: getComputedStyle(target).borderRadius, duration: DUR.flip, ease: EASE_INOUT },
        0,
      );
      tl.to(target, { autoAlpha: 1, duration: 0.22 }, DUR.flip - 0.2);
      tl.to(overlay, { autoAlpha: 0, duration: 0.2 }, DUR.flip - 0.16);
      if (fadeEl) {
        tl.to(fadeEl, { autoAlpha: 1, y: 0, duration: 0.44, ease: 'power2.out' }, DUR.flip * 0.42);
      }
    };

    void run();

    return () => {
      killed = true;
      overlay?.remove();
    };
    // Перелёт отыгрывается один раз при монтировании получателя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
