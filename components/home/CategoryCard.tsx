'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type MouseEvent } from 'react';
import { GrainPlate } from '@/components/ui/GrainPlate';
import { captureSource } from '@/lib/flip-store';
import { prefersReducedMotion } from '@/lib/motion';
import { priceFrom, materialsOf, type Category } from '@/lib/catalog';
import { num, plural } from '@/lib/format';
import { ArrowIcon } from '@/components/site/Icons';

/**
 * Категория — строка реестра с образцом фактуры, а не карточка: рамки и
 * скругления нет, снизу линейка. Плашка фактуры остаётся, потому что несёт
 * смысл (размер точки пропорционален фракции) и служит источником перелёта
 * в каталог.
 *
 * Ссылка остаётся настоящей ссылкой: работает средний клик, «открыть в новой
 * вкладке» и клавиатура. Анимация — надстройка над обычной навигацией.
 */
export function CategoryCard({ category }: { category: Category }) {
  const router = useRouter();
  const plateRef = useRef<HTMLDivElement>(null);
  const href = `/catalog/?category=${category.id}`;
  const count = materialsOf(category.id).length;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (prefersReducedMotion() || !plateRef.current) return;
    e.preventDefault();
    captureSource(plateRef.current, category.id, 'to-catalog');
    router.push(href);
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      data-reveal
      className="group flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div ref={plateRef} data-flip-plate={category.id}>
        <GrainPlate category={category} className="aspect-[16/10] w-full sm:aspect-[4/3]" />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-ink pt-3">
        <h3 className="text-t3 font-display font-semibold tracking-[-.02em]">{category.name}</h3>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="mark text-ink-2">от</span>
          <span className="figure text-t3 font-semibold transition-colors group-hover:text-accent">
            {num(priceFrom(category.id))}
          </span>
          <span className="mark text-ink-2">₽/м³</span>
        </span>
      </div>

      <p className="mark-value mt-3 text-ink-2">{category.fractionsLine}</p>

      <p className="mark mt-3 flex items-center gap-2 text-ink-2">
        {count} {plural(count, 'позиция', 'позиции', 'позиций')}
        <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </p>
    </Link>
  );
}
