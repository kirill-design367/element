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

/** Главное число блока — пиковая отгрузка. Остальные идут мелко в столбик. */
const LEAD = FLEET_NUMBERS.find((n) => n.unit === 'м³')!;
const REST = FLEET_NUMBERS.filter((n) => n !== LEAD);

/**
 * Полноэкранный блок. Слот под фотографию на весь экран, одно крупное число
 * поверх него слева, остальные цифры мелко в столбик справа внизу. Больше на
 * экране нет ничего — это точка отдыха между двумя плотными блоками.
 *
 * Пока снимка нет, фон инвертирован: перепад с соседними светлыми секциями
 * должен читаться даже без кадра.
 */
export function Fleet() {
  return (
    <div
      className="inv relative flex min-h-[86svh] flex-col justify-between overflow-hidden py-16 md:py-24"
      /* Фон .inv прозрачный: он непрозрачным перекрывал фотографию, лежащую
         ниже по стопке. Тёмный тон теперь даёт сам кадр плюс градиент. */
      style={{ background: 'transparent' }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#14161a]">
        {PHOTO.fleet.src && (
          <img
            src={asset(PHOTO.fleet.src)}
            alt={PHOTO.fleet.brief}
            data-parallax="fleet"
            loading="lazy"
            decoding="async"
            className="absolute inset-x-0 -top-6 h-[calc(100%+48px)] w-full object-cover"
          />
        )}
        {/* Читаемость: градиент от левого и нижнего краёв кадра. Не сплошная
            заливка и не размытие — правая часть снимка остаётся чистой. */}
        {PHOTO.fleet.src && (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(12,14,17,.92) 0%, rgba(12,14,17,.72) 34%, rgba(12,14,17,.18) 64%, rgba(12,14,17,0) 88%),' +
                'linear-gradient(to top, rgba(12,14,17,.93) 0%, rgba(12,14,17,.82) 42%, rgba(12,14,17,.42) 72%, rgba(12,14,17,0) 100%)',
            }}
          />
        )}
      </div>

      <div className="shell">
        <p data-fleet="label" className="max-w-[24ch] text-t2 text-ink-2">
          {LEAD.note}
        </p>
      </div>

      <div className="shell mt-16 flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-16">
        {/* tracking-normal на потомках — не украшение. letter-spacing в em
            наследуется вычисленным значением: −0,04em от 128 px это −5,1 px,
            и на подписи в 16 px буквы налезали друг на друга. */}
        <p data-fleet="lead" className="font-black text-t5 leading-[.82] tracking-[-.04em]">
          <Counter value={LEAD.value} />
          <span className="ml-3 text-[.28em] font-medium tracking-normal text-ink-2">
            {LEAD.unit}
          </span>
          <span className="mt-3 block text-t2 font-medium tracking-normal text-ink-2">
            {LEAD.label}
          </span>
        </p>

        {/* dt стоит перед dd — этого требует разметка списка определений;
            визуальный порядок задаёт order у колонок. */}
        <dl className="grid shrink-0 gap-5 sm:grid-cols-3 md:max-w-[38ch] md:grid-cols-1 md:gap-4">
          {REST.map((n) => (
            <div key={n.label} data-fleet="rest" className="flex items-baseline gap-3">
              <dt className="order-2 text-t1 leading-snug text-ink-2">{n.label}</dt>
              <dd className="tnum order-1 shrink-0 font-black text-t3 leading-none">
                <Counter value={n.value} />
                {n.unit && <span className="ml-1 text-t1 font-medium text-ink-2">{n.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
