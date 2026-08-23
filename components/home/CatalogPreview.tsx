'use client';

import { useRef } from 'react';
import { CATEGORIES } from '@/lib/catalog';
import { CategoryCard } from './CategoryCard';
import { useFlipArrival } from '@/components/providers/FlipArrival';

/**
 * Пять категорий крупными карточками. Этот же блок принимает обратный
 * перелёт из каталога: плашка сворачивается ровно на своё место.
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
    <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}
    </div>
  );
}
