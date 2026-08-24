import { num } from '@/lib/format';

/** Заглушки: объекты вымышленные, объёмы правдоподобные. */
const OBJECTS = [
  {
    name: 'ЖК «Лесная Гавань»',
    place: 'Красногорск',
    supplied: 'Щебень гранитный 20–40, песок карьерный сеяный',
    m3: 4200,
    period: 'март — август 2025',
  },
  {
    name: 'Логистический комплекс',
    place: 'Домодедово',
    supplied: 'ПГС обогащённая, щебень известняковый 40–70',
    m3: 9600,
    period: 'май — ноябрь 2025',
  },
  {
    name: 'Реконструкция подъездной дороги',
    place: 'Ногинский район',
    supplied: 'Щебень гранитный 40–70, отсев гранитный',
    m3: 6100,
    period: 'июнь — сентябрь 2025',
  },
  {
    name: 'Благоустройство парка',
    place: 'Мытищи',
    supplied: 'Чернозём просеянный, грунт плодородный',
    m3: 1450,
    period: 'апрель — май 2026',
  },
];

/**
 * Объекты — строки реестра поставок, а не карточки: объём стоит в своей
 * колонке и выровнен по разряду, поэтому четыре числа читаются столбцом.
 */
export function Objects() {
  return (
    <ul>
      {OBJECTS.map((o) => (
        <li
          key={o.name}
          data-reveal
          className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-line py-6 md:grid-cols-12 md:items-baseline"
        >
          <div className="md:col-span-5">
            <h3 className="text-t3 font-display font-semibold tracking-[-.02em]">{o.name}</h3>
            <p className="mark-value mt-2 text-ink-2">
              {o.place} · {o.period}
            </p>
          </div>
          <p className="text-t2 text-ink-2 md:col-span-5">{o.supplied}</p>
          <div className="md:col-span-2 md:text-right">
            <span className="figure text-t3 font-semibold">{num(o.m3)}</span>
            <span className="mark ml-2 text-ink-2">м³</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
