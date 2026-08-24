'use client';

import { useRef } from 'react';
import { CATEGORIES } from '@/lib/catalog';
import { CategoryCard } from './CategoryCard';
import { useFlipArrival } from '@/components/providers/FlipArrival';

/**
 * Пять категорий горизонтальной лентой. Лента начинается от левой линии
 * контейнера и уходит за правый край экрана — видно, что она продолжается,
 * и это единственное место на сайте с горизонтальной прокруткой. Крутится
 * мышью, свайпом и клавиатурой.
 *
 * Карточки чередуют две высоты через одну: ровный ряд одинаковых плиток
 * читался бы как таблица, а не как лента.
 *
 * Этот же блок принимает обратный перелёт из каталога: плашка сворачивается
 * ровно на своё место.
 */
export function CatalogPreview() {
  const gridRef = useRef<HTMLDivElement>(null);

  useFlipArrival(
    'to-home',
    (h) => gridRef.current?.querySelector<HTMLElement>(`[data-flip-plate="${h.categoryId}"]`) ?? null,
    {
      beforeMeasure: (h) => {
        const el = gridRef.current?.querySelector<HTMLElement>(`[data-flip-plate="${h.categoryId}"]`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        // Доводим карточку в кадр мгновенно: перелёт должен начаться сразу.
        if (r.top < 80 || r.bottom > window.innerHeight) {
          window.scrollTo({ top: window.scrollY + r.top - window.innerHeight * 0.28, behavior: 'auto' });
        }
      },
    },
  );

  return (
    <div
      ref={gridRef}
      data-rail
      role="group"
      aria-label="Группы материалов, лента с прокруткой"
      tabIndex={0}
      className="rail hide-rail-bar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {/* Отбивка слева вместо padding: у контейнера с snap-mandatory
          Chromium прокручивает левый паддинг под первый снап-элемент, и
          лента открывалась уже сдвинутой. Распорка так не съедается.
          Ширина в процентах от ленты, не в vw: vw включает полосу прокрутки. */}
      <div className="rail-gutter shrink-0" aria-hidden="true" />
      {CATEGORIES.map((c, i) => (
        <div
          key={c.id}
          data-rail-item
          className={`w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30%] ${
            i % 2 === 1 ? 'lg:pt-14' : ''
          }`}
        >
          <CategoryCard category={c} tall={i % 2 === 0} />
        </div>
      ))}
      {/* Правый вылет: последняя карточка не упирается в край экрана. */}
      <div className="w-[var(--shell-x)] shrink-0" aria-hidden="true" />
    </div>
  );
}
