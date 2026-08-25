'use client';

import { useEffect, useRef } from 'react';
import { num } from '@/lib/format';
import { DUR, prefersReducedMotion } from '@/lib/motion';

/**
 * Цифра набегает при появлении в кадре.
 *
 * Набор идёт прямой записью в текстовый узел, а не через состояние React.
 * Прошлая версия дёргала setState каждый кадр: на один экран с четырьмя
 * счётчиками это давало 86 пересчётов вёрстки и 98 пересчётов стилей за
 * полторы секунды на неподвижной странице — реконсиляция, смена текста,
 * пересчёт ширины, и так шестьдесят раз в секунду.
 *
 * Ширина зафиксирована: под цифрой лежит невидимый двойник с конечным
 * значением, он и держит ячейку. Цифры табличные, поэтому «1 778» и «1 000»
 * одной ширины, и во время набора ничего не прыгает. `contain: layout size`
 * не даёт пересчёту выйти за пределы ячейки.
 *
 * Значение сразу отрисовано на сервере: без JS и в режиме покоя посетитель
 * видит итоговое число, а не ноль.
 */
export function Counter({ value, digits = 0 }: { value: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = DUR.count * 1000;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          // power3.out — тот же easing, что у появления блоков: цифра
          // разгоняется сразу и мягко останавливается, без линейного хода.
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = num(value * eased, digits);
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
  }, [value, digits]);

  return (
    <span className="counter tnum">
      {/* Двойник держит ширину ячейки: конечное значение самое широкое. */}
      <span aria-hidden="true" className="counter-ghost">
        {num(value, digits)}
      </span>
      <span ref={ref} className="counter-live">
        {num(value, digits)}
      </span>
    </span>
  );
}
