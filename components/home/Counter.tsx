'use client';

import { useEffect, useRef } from 'react';
import { num } from '@/lib/format';
import { DUR, prefersReducedMotion } from '@/lib/motion';

/**
 * Цифра, которая набегает.
 *
 * Два режима. По умолчанию — набор один раз при появлении в кадре: так живут
 * числа парка. С `live` — добегание до нового значения при каждой смене: так
 * живёт итог расчёта, он не должен подменяться мгновенно.
 *
 * Набор идёт прямой записью в текстовый узел, а не через состояние React.
 * Прошлая версия дёргала setState каждый кадр: на один экран с четырьмя
 * счётчиками это давало 86 пересчётов вёрстки и 98 пересчётов стилей за
 * полторы секунды на неподвижной странице.
 *
 * Ширина зафиксирована: под цифрой лежит невидимый двойник с конечным
 * значением, он и держит ячейку. Цифры табличные, поэтому «1 778» и «1 000»
 * одной ширины, и во время набора ничего не прыгает. Ячейка закрыта
 * contain: layout style — пересчёт не выходит за её пределы.
 *
 * Значение сразу отрисовано на сервере: без JS и в режиме покоя посетитель
 * видит итоговое число, а не ноль.
 */
export function Counter({
  value,
  digits = 0,
  format,
  live = false,
}: {
  value: number;
  digits?: number;
  /** Своё форматирование, например rub. По умолчанию — разрядка пробелами. */
  format?: (n: number) => string;
  /** Добегать при каждой смене значения, а не один раз при входе в кадр. */
  live?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const fmt = format ?? ((n: number) => num(n, digits));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt(value);
      shown.current = value;
      return;
    }

    let raf = 0;
    const from = live ? shown.current : 0;
    const dur = (live ? DUR.recount : DUR.count) * 1000;

    const play = () => {
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        // power3.out — тот же easing, что у появления блоков: цифра
        // разгоняется сразу и мягко останавливается, без линейного хода.
        const eased = 1 - Math.pow(1 - p, 3);
        shown.current = from + (value - from) * eased;
        el.textContent = fmt(shown.current);
        if (p < 1) raf = requestAnimationFrame(tick);
        else shown.current = value;
      };
      raf = requestAnimationFrame(tick);
    };

    if (live) {
      if (from === value) return;
      play();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        play();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // fmt пересобирается каждый рендер — в зависимостях его держать нельзя
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, digits, live]);

  return (
    <span className="counter tnum">
      {/* Двойник держит ширину ячейки: конечное значение самое широкое. */}
      <span aria-hidden="true" className="counter-ghost">
        {fmt(value)}
      </span>
      <span ref={ref} className="counter-live">
        {fmt(value)}
      </span>
    </span>
  );
}
