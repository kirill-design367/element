'use client';

import { useEffect, useRef, useState } from 'react';
import { num } from '@/lib/format';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Цифра набегает при появлении в кадре. Значение сразу отрисовано на сервере:
 * без JS и в режиме покоя посетитель видит итоговое число, а не ноль.
 */
export function Counter({ value, digits = 0 }: { value: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 900;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(value * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="tnum">
      {num(shown, digits)}
    </span>
  );
}
