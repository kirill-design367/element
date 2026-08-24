import { volume } from '@/lib/format';

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

export function Objects() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {OBJECTS.map((o) => (
        <li
          key={o.name}
          data-reveal
          className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card md:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-[18px] font-semibold leading-snug tracking-[-.015em]">
                {o.name}
              </h3>
              <p className="mt-1 text-[13px] text-ink-2">
                {o.place} · {o.period}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="tnum font-display text-[20px] font-semibold leading-none">
                {volume(o.m3)}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[.08em] text-ink-2">поставлено</div>
            </div>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[14px] leading-relaxed text-ink-2">
            {o.supplied}
          </p>
        </li>
      ))}
    </ul>
  );
}
