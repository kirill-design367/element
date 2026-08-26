'use client';

import { AVAILABILITY_LABEL, fractionLabel, pricePerM3, sellUnit, type Material } from '@/lib/catalog';
import { num, ON_REQUEST, rub, typo } from '@/lib/format';
import { useRequest } from '@/components/providers/RequestProvider';
import { CheckIcon } from '@/components/site/Icons';
import { fractionIds } from '@/lib/prefilter';

/**
 * Карточка позиции. Цена и наличие — самое заметное: снабженец сравнивает
 * именно их, всё остальное читает вторым заходом.
 */
export function MaterialCard({ material }: { material: Material }) {
  const req = useRequest();
  const inList = req.has(material.id);
  const out = material.availability === 'out';
  /* Цена за куб считается из цены за тонну; null значит, что цены нет вовсе
     или что позиция кубами не меряется — это металл. */
  const perM3 = pricePerM3(material);
  const perTon = material.pricePerTon;
  /* Металл продаётся тоннами: колонки «за м³» у него не бывает. */
  const byTon = sellUnit(material) === 't';

  return (
    <article
      data-reveal
      data-cat={material.categoryId}
      data-fr={fractionIds(material)}
      data-gost={material.gost ?? ''}
      data-group={material.group ?? ''}
      className="flex flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-t3 font-bold leading-snug tracking-[-.015em]">
            {typo(material.name)}
          </h3>
          {/* Маркировка партии — единственное место моноширинного. */}
          {/* Маркировка партии: у инертных это фракция и ГОСТ, у металла —
              типоразмер. ГОСТа у металла в прайсе нет, и точки-разделителя
              без второй половины быть не должно. */}
          <p className="mark mt-1.5 text-t1 text-ink-2">
            {[fractionLabel(material.fraction), material.gost].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Availability material={material} />
      </div>

      {/* Цены — крупно и в табличных цифрах, чтобы колонки не плясали.
          Цена за куб не хранится, а считается из цены за тонну и насыпной
          плотности этой же позиции: прайс приходит за тонну. */}
      {perTon === null ? (
        /* Цены нет — так и написано, одной формулировкой на весь сайт.
           Ноль читался бы как «бесплатно», прочерк — как незаполненное поле,
           а число из прежней заглушки — как прайс. Пояснения под строкой нет:
           сама строка и есть пояснение. */
        <div className="mt-4 overflow-hidden rounded border border-line bg-surface-2 px-3 py-2.5">
          <div className="text-t1 text-ink-2">Цена</div>
          <div className="mt-0.5 text-t3 font-bold leading-snug">{ON_REQUEST}</div>
        </div>
      ) : byTon ? (
        /* Металл: одна колонка. Кубометр проката не значит ничего, и
           показывать его — врать про единицу отгрузки. */
        <div className="mt-4 overflow-hidden rounded border border-line bg-surface-2 px-3 py-2.5">
          <div className="text-t1 text-ink-2">За тонну</div>
          <div className="tnum mt-0.5 text-t3 font-bold leading-none">{rub(perTon)}</div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
          <div className="bg-surface-2 px-3 py-2.5">
            <div className="text-t1 text-ink-2">За м³</div>
            <div className="tnum mt-0.5 text-t3 font-bold leading-none">{rub(perM3 as number)}</div>
          </div>
          <div className="bg-surface-2 px-3 py-2.5">
            <div className="text-t1 text-ink-2">За тонну</div>
            <div className="tnum mt-0.5 text-t3 font-bold leading-none">{rub(perTon)}</div>
          </div>
        </div>
      )}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-t1 text-ink-2">
        {material.strength && <Spec term="Марка" value={material.strength} />}
        {material.frost && <Spec term="Морозостойкость" value={material.frost} />}
        {/* Плотность через num(): запятая как десятичный разделитель и
            неразрывный пробел перед единицей. Печаталась «1.37 т/м³» —
            точкой, по-английски. На /fonts/ то же число уже выводилось с
            запятой, то есть разнобой был внутри проекта. */}
        {material.density !== undefined && (
          <Spec term="Насыпная плотность" value={`${num(material.density, 2)}\u00A0т/м³`} />
        )}
      </dl>

      {material.note && (
        <p className="mt-3 text-t1 leading-relaxed text-ink-2">{material.note}</p>
      )}

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {material.uses.map((u) => (
          <li
            key={u}
            className="rounded-pill border border-line bg-surface-2 px-2 py-0.5 text-t1 text-ink-2"
          >
            {u}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => (inList ? req.remove(material.id) : req.add(material.id))}
        disabled={out}
        aria-pressed={inList}
        className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-card text-t2 font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          out
            ? 'cursor-not-allowed border border-line bg-surface-2 text-ink-2'
            : inList
              ? 'border border-accent bg-accent-soft text-accent'
              : 'bg-accent text-white hover:bg-accent-hover'
        }`}
      >
        {out ? 'Нет в наличии' : inList ? <><CheckIcon className="h-4 w-4" /> В заявке</> : 'В заявку'}
      </button>
    </article>
  );
}

function Availability({ material }: { material: Material }) {
  const label = AVAILABILITY_LABEL[material.availability];
  /* Красным отмечается только «нет в наличии». «Под заказ» и «наличие
     уточняем» — нейтральные состояния, а не ошибка. */
  const style =
    material.availability === 'in-stock'
      ? 'border-line-strong bg-surface-2 text-ink'
      : material.availability === 'out'
        ? 'border-warn/30 bg-warn-soft text-warn'
        : 'border-line bg-surface-2 text-ink-2';
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-pill border px-2.5 py-1 text-t1 font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function Spec({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt>{term}</dt>
      <dd className="tnum font-medium text-ink">{value}</dd>
    </div>
  );
}
