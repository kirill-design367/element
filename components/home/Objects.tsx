import { volume } from '@/lib/format';
import { PHOTO, asset } from '@/lib/assets';

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
 * Фотография занимает правую половину экрана и уходит за правый край,
 * список объектов стоит слева в узкой колонке. Высота блока меньше экрана —
 * после полноэкранного парка сюда нужен короткий блок, а не второй такой же.
 *
 * Пока снимка нет, правая половина остаётся полем в тон фона: заглушек не
 * рисуем, а перепад плотности между колонками работает и без кадра.
 */
export function Objects() {
  return (
    <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-0">
      <div className="narrow narrow-left lg:col-span-6 lg:max-w-none lg:pr-10">
        <h2 className="font-black text-t4 leading-[1.04] tracking-[-.02em]">Объекты</h2>
        <p className="mt-3 max-w-[42ch] text-t2 leading-relaxed text-ink-2">
          Что и в каком объёме поставляли за последний год.
        </p>

        <ul className="mt-8 divide-y divide-line">
          {OBJECTS.map((o) => (
            <li key={o.name} data-reveal className="flex items-start justify-between gap-5 py-4">
              <div className="min-w-0">
                <h3 className="text-t2 font-bold leading-snug tracking-[-.015em]">{o.name}</h3>
                <p className="mt-1 text-t1 text-ink-2">
                  {o.place} · {o.period}
                </p>
                <p className="mt-2 text-t1 leading-snug text-ink-2">{o.supplied}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="tnum font-black text-t3 leading-none">{volume(o.m3)}</div>
                <div className="mt-1 text-t1 text-ink-2">поставлено</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Правая половина уходит за край экрана: у неё нет правого поля,
          а сама секция обрезает вылет. */}
      <div className="lg:col-span-6">
        <div className="relative h-full min-h-[280px] overflow-hidden rounded-l-card bg-surface-2 lg:min-h-full">
          {PHOTO.objects.src && (
            <img
              src={asset(PHOTO.objects.src)}
              alt={PHOTO.objects.brief}
              data-parallax="objects"
              loading="lazy"
              decoding="async"
              className="absolute inset-x-0 -top-6 h-[calc(100%+48px)] w-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
