import { FACTS } from './Hero';

/**
 * Три факта о поставке. Выделены из первого экрана: там они были нижней
 * частью карточки и делили с ней внимание, а по смыслу это перебивка
 * между экранами.
 */
export function FactsStrip() {
  return (
    <div className="shell">
      <dl className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FACTS.map((f) => (
          <div key={f.label} className="px-4 py-4 md:px-6 md:py-5">
            <dt className="text-t1 text-ink-2">{f.label}</dt>
            <dd className="mt-2 text-t2 font-medium leading-snug">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
