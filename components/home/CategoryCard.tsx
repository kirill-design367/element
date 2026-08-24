'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type MouseEvent } from 'react';
import { GrainPlate } from '@/components/ui/GrainPlate';
import { captureSource } from '@/lib/flip-store';
import { prefersReducedMotion } from '@/lib/motion';
import { priceFrom, materialsOf, type Category } from '@/lib/catalog';
import { plural, rub } from '@/lib/format';
import { ArrowIcon } from '@/components/site/Icons';

/**
 * Карточка категории. Она же — источник перехода в каталог: перед уходом
 * снимает своё положение и разметку, каталог достраивает перелёт.
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
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div ref={plateRef} data-flip-plate={category.id} className="relative">
        <GrainPlate category={category} className="aspect-[16/10] w-full sm:aspect-[4/3]">
          <span className="absolute left-3 top-3 rounded bg-white/85 px-2 py-1 text-[11px] font-medium tabular-nums text-ink-2">
            {count} {plural(count, 'позиция', 'позиции', 'позиций')}
          </span>
        </GrainPlate>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="font-display text-[19px] font-semibold leading-tight tracking-[-.015em] md:text-[21px]">
          {category.name}
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{category.fractionsLine}</p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <div className="text-[11px] uppercase tracking-[.08em] text-ink-2">Цена</div>
            <div className="tnum mt-0.5 font-display text-[19px] font-semibold leading-none">
              от {rub(priceFrom(category.id))}
              <span className="ml-1 text-[12px] font-normal text-ink-2">/ м³</span>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
