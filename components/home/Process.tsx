import { typo } from '@/lib/format';
const STEPS = [
  { title: 'Заявка', body: 'Материал, объём, адрес и срок. Через форму, по телефону или письмом.' },
  { title: 'Просчёт', body: 'Цена материала и доставки в письме в течение рабочего часа. Держим её 5 дней.' },
  { title: 'Договор', body: 'Спецификация на партию. Для повторных поставок — по рамочному договору.' },
  { title: 'Отгрузка', body: 'Машина в согласованном окне. Водитель на связи, вы видите номер и время.' },
  { title: 'Документы', body: 'УПД и паспорт качества с водителем, сканы — в день отгрузки на почту.' },
];

/**
 * Пять шагов — это последовательность, поэтому нумерация здесь несёт смысл,
 * а не украшает: снабженец понимает, на каком этапе он сейчас.
 */
export function Process() {
  return (
    <ol className="relative grid gap-8 md:grid-cols-5 md:gap-6">
      {/* Линия проходит через центры точек и на телефоне разворачивается вертикально. */}
      <span
        aria-hidden="true"
        className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-line md:left-0 md:top-[15px] md:h-px md:w-full"
      />
      {STEPS.map((s, i) => (
        <li key={s.title} data-reveal className="relative pl-11 md:pl-0">
          <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-surface md:relative md:mb-4">
            <span className="tnum text-t1 font-bold text-ink">{i + 1}</span>
          </span>
          <h3 className="text-t3 font-bold leading-snug tracking-[-.01em]">
            {typo(s.title)}
          </h3>
          <p className="mt-1.5 text-t2 leading-relaxed text-ink-2">{typo(s.body)}</p>
        </li>
      ))}
    </ol>
  );
}
