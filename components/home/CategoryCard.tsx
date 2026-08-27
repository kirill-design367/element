'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type MouseEvent } from 'react';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { captureSource } from '@/lib/flip-store';
import { prefersReducedMotion } from '@/lib/motion';
import { categorySpecLine, materialsOf, priceFrom, unitLabel, type Category } from '@/lib/catalog';
import { categorySlot } from '@/lib/assets';
import { ON_REQUEST, plural, rub, typo } from '@/lib/format';
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
  /* null — в категории не осталось ни одной цены. Показывать «от 0 ₽» нельзя. */
  const from = priceFrom(category.id);

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
      /* h-full — то, чем карточки в ленте выравниваются по высоте. Лента это
         flex, её элементы и так растягиваются по самому высокому, но сама
         карточка внутри элемента брала высоту по содержимому, и низ с ценой
         у шести карточек стоял на шести разных уровнях: разброс доходил до
         33 px и читался сбоем сетки. */
      className="group flex h-full select-none flex-col overflow-hidden rounded-panel bg-surface shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div ref={plateRef} data-flip-plate={category.id} className="relative">
        <PhotoSlot
          slot={categorySlot(category.id)}
          className="aspect-[4/3] w-full"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16"
            style={{
              background:
                'linear-gradient(to bottom, rgba(244,244,241,.95) 0%, rgba(244,244,241,.75) 46%, rgba(244,244,241,0) 100%)',
            }}
          />
          {/* Метка лежит на градиенте от верхнего края кадра, а не на плашке:
              плашка закрывала бы фактуру прямоугольником. */}
          {/* Пробел неразрывный: в .tnum обычный пробел подменяется широким
              табличным (13 px против 4), и метка расходится разрядкой. */}
          <span className="absolute left-3 top-2.5 text-t1 font-medium tabular-nums text-ink">
            {`${count}\u00A0${plural(count, 'позиция', 'позиции', 'позиций')}`}
          </span>
        </PhotoSlot>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="card-title text-t3 font-bold leading-tight tracking-[-.015em]">
          {typo(category.name)}
        </h3>
        {/* Ровно две строки, всегда: line-clamp-2 обрезает длинное многоточием,
            min-h держит короткое. Без min-h карточка металла, у которой
            характеристики в одну строку, поднимала бы всё, что ниже, на
            16,5 px относительно соседей. 2,75em — это две строки при
            leading-snug, то есть 2 × 1,375. */}
        {/* Зазор до блока цены висит здесь нижним отступом, а не верхним у
            самого блока: там стоит mt-auto, и своё значение он бы перебил. */}
        <p className="mb-4 mt-1.5 line-clamp-2 min-h-[2.75em] text-t1 leading-snug text-ink-2">
          {typo(categorySpecLine(category.id))}
        </p>

        {/* mt-auto прижимает блок цены к нижней кромке карточки. Строки цены
            у разных категорий разной высоты — «уточняйте у менеджера» набрано
            t2, а число t3, — и без этого низ карточек расходился на 3,2 px
            даже там, где характеристики у всех в одну строку. */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/70 pt-3">
          <div>
            <div className="text-t1 text-ink-2">Цена</div>
            <div className="mt-0.5 text-t3 font-bold leading-none">
              {from === null ? (
                /* leading-none — не украшение: у ступени t2 свой интерлиньяж
                   1,55, и строка «уточняйте у менеджера» выходила на 3,2 px
                   выше строки с ценой. Линия над блоком цены от этого стояла
                   у трёх карточек из шести на 3,2 px ниже, чем у остальных. */
                <span className="text-t2 font-normal leading-none">{ON_REQUEST}</span>
              ) : (
                /* leading-none у мелких приписок — по той же причине, что у
                   строки «уточняйте у менеджера»: у ступени t1 свой
                   интерлиньяж 1,3, и строка значения выходила 21,6 px против
                   21 у карточек без цены. Разница уезжала в линию над блоком
                   цены. */
                <>
                  <span className="text-t1 font-normal leading-none text-ink-2">от</span>{' '}
                  <span className="tnum">{rub(from)}</span>
                  <span className="ml-1.5 text-t1 font-normal leading-none text-ink-2">
                    /{unitLabel(category.unit)}
                  </span>
                </>
              )}
            </div>
          </div>
          {/* Стрелка сдвигается вправо, кружок не перекрашивается: на
              наведении анимируется только transform. */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong text-ink">
            <ArrowIcon className="arrow-slide h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
