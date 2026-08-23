'use client';

import { useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Lenis + ScrollTrigger. Грузятся динамически после интерактива, чтобы не
 * лежать в критическом бандле: сайт обязан открываться быстро, плавность —
 * приятное дополнение, а не условие работы.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 0.9, wheelMultiplier: 1, touchMultiplier: 1.6 });
      lenis.on('scroll', ScrollTrigger.update);

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    };

    // requestIdleCallback есть не везде — таймер как запасной путь.
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => void start(), { timeout: 1200 })
        : window.setTimeout(() => void start(), 400);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      cleanup?.();
    };
  }, []);

  return null;
}
