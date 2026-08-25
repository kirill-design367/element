import { typo, volume } from '@/lib/format';
import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';

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
 * Список и кадр связаны: при наведении на строку она подсвечивается, а кадр
 * справа за 0,4 с меняет кроп и масштаб. Своего снимка у каждого объекта пока нет — механика заложена и
 * работает на одном кадре, чтобы приём читался; когда придут отдельные
 * кадры, в data-object-photo будет подставляться свой файл, а не свой кроп.
 * Меняется только transform.
 */
export function Objects() {
  return (
    <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-0">
      <div className="narrow narrow-left lg:col-span-6 lg:max-w-none lg:pr-10">
        <h2 data-reveal className="font-black text-t4 leading-[1.04] tracking-[-.02em]">Объекты</h2>
        <p className="mt-3 max-w-[42ch] text-t2 leading-relaxed text-ink-2">
          {typo('Что и в каком объёме поставляли за последний год.')}
        </p>

        <ul className="mt-8 divide-y divide-line">
          {OBJECTS.map((o, i) => (
            <li
              key={o.name}
              data-reveal
              data-object={i}
              tabIndex={0}
              className="object-row flex items-start justify-between gap-5 rounded-card px-3 py-4 -mx-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="min-w-0">
                <h3 className="text-t2 font-bold leading-snug tracking-[-.015em]">{typo(o.name)}</h3>
                <p className="mt-1 text-t1 text-ink-2">
                  {o.place} · {o.period}
                </p>
                <p className="mt-2 text-t1 leading-snug text-ink-2">{typo(o.supplied)}</p>
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
        {/* contain: paint и свой слой композитора: без них кадр при
            прокрутке рвался — браузер каждый кадр пересчитывал обрезку по
            скруглению вместе со смещением параллакса. */}
        <div
          data-object-photo
          className="relative h-full min-h-[280px] overflow-hidden rounded-l-panel bg-surface-2 [contain:paint] [transform:translateZ(0)] lg:min-h-full"
        >
          {/* Кадр крупнее рамки на 16% и сдвинут вверх на 8: он едет внутри
              рамки по вертикали на ±5% своей высоты, и при любом положении
              пустых краёв не открывается. Запас считается в процентах от
              высоты рамки, а не в пикселях, — высота меняется от экрана к
              экрану, а доля остаётся той же. */}
          {PHOTO.objects.file && (
            <Photo
              file={PHOTO.objects.file}
              alt={PHOTO.objects.brief}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0"
              imgClassName="absolute inset-x-0 -top-[8%] h-[116%]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
