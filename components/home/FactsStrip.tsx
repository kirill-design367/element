import { FACTS } from './Hero';

/**
 * Перебивка между экранами: три факта о поставке во всю ширину экрана.
 *
 * Не блок и не карточка — полоса. Инвертированная, без рамок и без
 * разделителей, невысокая: её задача — разорвать светлую ленту и дать глазу
 * отбивку перед калькулятором, а не сообщить что-то новое. Интервалы между
 * фактами большие, границ между ними нет: три отдельные вещи, стоящие рядом,
 * а не таблица из трёх ячеек.
 */
export function FactsStrip() {
  return (
    <div className="inv">
      <dl className="shell flex flex-col gap-6 py-8 md:flex-row md:items-baseline md:justify-between md:gap-16 md:py-10">
        {FACTS.map((f) => (
          <div key={f.label} data-fact className="md:max-w-[30ch]">
            <dt className="text-t1 text-ink-2">{f.label}</dt>
            <dd className="mt-1.5 text-t2 font-medium leading-snug">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
