import { Counter } from './Counter';

/**
 * Цифры парка — самый крупный кегль на сайте наравне с итогом расчёта.
 * Это блок про числа, и числа в нём главные: подпись рядом мельче
 * примерно в семь раз. Заглушки, порядок величин правдоподобный.
 */
const NUMBERS = [
  { value: 24, unit: '', label: 'единицы техники', note: 'самосвалы 10–30 м³, свои и партнёрские' },
  { value: 1800, unit: 'м³', label: 'в сутки', note: 'пиковая отгрузка с трёх площадок' },
  { value: 150, unit: 'км', label: 'радиус доставки', note: 'от МКАД по всем направлениям' },
  { value: 11, unit: '', label: 'лет на рынке', note: 'с 2015 года, более 900 объектов' },
];

export function Fleet() {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
      {NUMBERS.map((n) => (
        <li key={n.label} data-reveal className="figure-fit border-t border-line pt-4 pb-8">
          <p className="figure font-semibold leading-[.9]">
            <Counter value={n.value} />
            {n.unit && <span className="ml-2 text-t3 font-medium text-ink-2">{n.unit}</span>}
          </p>
          <p className="mt-4 text-t2">{n.label}</p>
          <p className="mark-value mt-2 max-w-[34ch] text-ink-2">{n.note}</p>
        </li>
      ))}
    </ul>
  );
}
