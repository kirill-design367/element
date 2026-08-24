import { Counter } from './Counter';
import { PHOTO, asset } from '@/lib/assets';

/**
 * Заглушки. Порядок величин правдоподобный для поставщика такого размера.
 * Экспортируется, чтобы страница сравнения шрифтов набирала ту же цифру,
 * что стоит в блоке, а не свою копию.
 */
export const FLEET_NUMBERS = [
  { value: 24, unit: '', label: 'единицы техники', note: 'самосвалы 10–30 м³, свои и партнёрские' },
  { value: 1800, unit: 'м³', label: 'в сутки', note: 'пиковая отгрузка с трёх площадок' },
  { value: 150, unit: 'км', label: 'радиус доставки', note: 'от МКАД по всем направлениям' },
  { value: 11, unit: '', label: 'лет на рынке', note: 'с 2015 года, более 900 объектов' },
];

export function Fleet() {
  return (
    <>
      {/* Слот под кадр парка. Пока src равен null, ничего не рисуется —
          цифры держат блок сами. Спецификация — PHOTO.fleet в lib/assets.ts. */}
      {PHOTO.fleet.src && (
        <img
          src={asset(PHOTO.fleet.src)}
          alt={PHOTO.fleet.brief}
          className="mb-5 w-full rounded-card border border-line object-cover"
          style={{ aspectRatio: PHOTO.fleet.ratio }}
        />
      )}
      <dl className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {FLEET_NUMBERS.map((n) => (
        <div key={n.label} data-reveal className="bg-surface p-5 md:p-6">
          <dd className="font-black text-t5 font-semibold leading-none tracking-[-.03em]">
            <Counter value={n.value} />
            {n.unit && <span className="ml-1.5 text-[.42em] font-medium text-ink-2">{n.unit}</span>}
          </dd>
          <dt className="mt-3 text-t2 font-medium">{n.label}</dt>
          {/* Внутри div в <dl> допустимы только dt и dd — примечание тоже dd. */}
          <dd className="mt-1 text-t1 leading-snug text-ink-2">{n.note}</dd>
        </div>
      ))}
      </dl>
    </>
  );
}
