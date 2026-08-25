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
 * Карточки одного размера. Ступенчатость через одну читалась не как ритм, а
 * как сбой вёрстки — особенно на планшете, где в кадре видно ровно две.
 *
 * Прокрутка мягкая: у ленты своя горизонтальная копия Lenis на том же тикере
 * gsap, что и вертикальная. Из-за неё снят scroll-snap: программная инерция
 * и снап тянут ленту в разные стороны и она дёргается на остановке.
 *
 * Под лентой тонкая полоса прогресса — единственный указатель на то, сколько
 * ленты осталось.
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
    <>
      <div
      ref={gridRef}
      data-rail
      role="group"
      aria-label="Группы материалов, лента с прокруткой"
      tabIndex={0}
      className="rail hide-rail-bar flex gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {/* Отбивка слева распоркой, а не паддингом: паддинг у прокручиваемого
          контейнера съедается при программной прокрутке. Ширина в процентах
          от ленты, не в vw: vw включает полосу прокрутки. */}
      <div className="rail-gutter shrink-0" aria-hidden="true" />
      {CATEGORIES.map((c) => (
        <div key={c.id} data-rail-item className="w-[78vw] shrink-0 sm:w-[46vw] lg:w-[30%]">
          <CategoryCard category={c} />
        </div>
      ))}
      {/* Правый вылет: последняя карточка не упирается в край экрана. */}
      <div className="w-[var(--shell-x)] shrink-0" aria-hidden="true" />
      </div>

      {/* Полоса прогресса. Ширина бегунка — доля видимой части ленты,
          положение — доля прокрутки. Двигается transform, не width. */}
      <div className="shell relative z-10 mt-5 pb-2">
        <div className="rail-progress" aria-hidden="true">
          <span data-rail-bar />
        </div>
      </div>
    </>
  );
}
