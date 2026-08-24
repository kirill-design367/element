'use client';

import { AVAILABILITY_LABEL, pricePerTon, type Material } from '@/lib/catalog';
import { num } from '@/lib/format';
import { useRequest } from '@/components/providers/RequestProvider';
import { fractionIds } from '@/lib/prefilter';

/**
 * Позиция каталога — лист спецификации. Характеристики набраны таблицей
 * с выравниванием по колонке, маркировка моноширинным, цены самым крупным
 * кеглем в карточке. Рамки нет: позицию отделяет линейка сверху.
 */
export function MaterialCard({ material }: { material: Material }) {
  const req = useRequest();
  const inList = req.has(material.id);
  const out = material.availability === 'out';

  const specs: [string, string][] = [
    ['Фракция', material.fraction],
    ['ГОСТ', material.gost.replace('ГОСТ ', '')],
    ...(material.strength ? ([['Марка', material.strength]] as [string, string][]) : []),
    ...(material.frost ? ([['Мороз.', material.frost]] as [string, string][]) : []),
    ['Плотность', `${String(material.density).replace('.', ',')} т/м³`],
  ];

  return (
    <article
      data-reveal
      data-cat={material.categoryId}
      data-fr={fractionIds(material)}
      data-gost={material.gost}
      className="flex flex-col border-t border-ink pt-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-t2 font-semibold leading-snug">{material.name}</h3>
        <span
          className={`mark shrink-0 whitespace-nowrap ${
            out ? 'text-warn' : material.availability === 'on-order' ? 'text-ink-2' : 'text-ink-2'
          }`}
        >
          {AVAILABILITY_LABEL[material.availability]}
        </span>
      </div>

      {/* Цены — самое заметное в карточке: крупнее названия и всей маркировки. */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4">
        <div>
          <dt className="mark text-ink-2">за м³</dt>
          <dd className="figure mt-1 text-t3 font-semibold">{num(material.pricePerM3)}</dd>
        </div>
        <div className="border-l border-line pl-4">
          <dt className="mark text-ink-2">за тонну</dt>
          <dd className="figure mt-1 text-t3 font-semibold">{num(pricePerTon(material))}</dd>
        </div>
      </dl>

      <dl className="mt-5">
        {specs.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 border-b border-line py-1.5">
            <dt className="mark text-ink-2">{term}</dt>
            <dd className="mark-value text-right">{value}</dd>
          </div>
        ))}
      </dl>

      {material.note && <p className="mt-4 text-t2 text-ink-2">{material.note}</p>}

      <p className="mark-value mt-4 pb-5 text-ink-2">{material.uses.join(' · ')}</p>

      <button
        type="button"
        onClick={() => (inList ? req.remove(material.id) : req.add(material.id))}
        disabled={out}
        aria-pressed={inList}
        className={`mt-auto inline-flex h-12 w-full items-center justify-center rounded-control text-t2 font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          out
            ? 'cursor-not-allowed border border-line text-ink-2'
            : inList
              ? 'border border-accent text-accent hover:bg-accent-soft'
              : 'bg-accent text-white hover:bg-accent-hover'
        }`}
      >
        {out ? 'Нет в наличии' : inList ? 'В заявке' : 'В заявку'}
      </button>
    </article>
  );
}
