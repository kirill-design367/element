import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

import { MIN_ORDER_M3, MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_IN_STOCK, POSITIONS_TOTAL, priceFrom } from '@/lib/catalog';
import { num, plural } from '@/lib/format';
import { PHOTO, asset } from '@/lib/assets';

export const FACTS = [
  { label: 'География', value: `Москва и область, до ${MAX_KM} км от МКАД` },
  { label: 'Минимальная отгрузка', value: `${MIN_ORDER_M3} м³ — одна машина` },
  { label: 'Документы', value: 'Паспорт качества на каждую партию' },
];

/**
 * Первый экран во всю высоту вьюпорта.
 *
 * Заголовок опущен ниже середины: над ним пустота, и это единственное место
 * на сайте, где пустоты столько. Карточка цен уходит вправо навылет и
 * обрезается краем экрана — она не помещается в кадр целиком, и именно
 * поэтому её хочется дочитать.
 *
 * Слот под фотографию лежит фоном на всю ширину, заголовок ложится поверх.
 * Пока снимка нет, фон однотонный: заглушек не рисуем.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации — это LCP.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-24 md:pb-24 md:pt-28">
      {/* Фоновый слот. Спецификация — PHOTO.hero в lib/assets.ts.
          Кадр выше блока на 48 px и поднят на 24: параллакс возит его на
          ±20, и без этого запаса на краях показалась бы полоса фона. */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-surface-2">
        {PHOTO.hero.src && (
          <picture>
            <source media="(max-width: 767px)" srcSet={asset(PHOTO.hero.srcMobile ?? PHOTO.hero.src)} />
            <img
              src={asset(PHOTO.hero.src)}
              alt={PHOTO.hero.brief}
              data-parallax="hero"
              /* Это LCP: грузим первым и не откладываем. */
              fetchPriority="high"
              decoding="async"
              className="absolute inset-x-0 -top-6 h-[calc(100%+48px)] w-full object-cover"
            />
          </picture>
        )}
        {/* Читаемость текста поверх кадра — отдельным слоем ниже. */}
      </div>

      {/* bleed-r: левый край сетки совпадает с линией контейнера, правый —
          с краем экрана. Дальше карточка выходит за него отрицательным
          полем, а overflow секции её обрезает. */}
      <div className="bleed-r">
        <div className="grid w-full items-end gap-10 lg:grid-cols-12 lg:gap-10">
          {/* Левая колонка стоит по линии контейнера. */}
          <div className="pr-[var(--shell-x)] lg:col-span-7 lg:pr-0">
            <p
              data-hero="eyebrow"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-t1 text-ink-2"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-3" aria-hidden="true" />
                Поставка инертных материалов
              </span>
              <span className="hidden text-line-strong sm:inline" aria-hidden="true">
                ·
              </span>
              <span>Москва и Московская область</span>
            </p>

            {/* Две строки заданы разметкой: точка переноса по ширине уезжает
                от экрана к экрану, и «с доставкой» повисало в первой строке. */}
            <h1
              data-hero="title"
              className="mt-5 font-black text-t4 leading-[.95] tracking-[-.035em]"
            >
              <span className="block">Щебень, песок и грунт</span>
              <span className="block">
                с доставкой <span className="text-accent">на объект</span>
              </span>
            </h1>

            <p data-hero="lead" className="mt-6 max-w-[46ch] text-t2 leading-relaxed text-ink-2">
              Пять групп материалов, {POSITIONS_TOTAL}{' '}
              {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}, из них{' '}
              {POSITIONS_IN_STOCK} на площадке сегодня. Считаем стоимость с доставкой прямо на
              странице — до звонка.
            </p>

            <div data-hero="cta" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/#zayavka" size="lg" className="w-full sm:w-auto">
                Запросить прайс
              </ButtonLink>
              <ButtonLink
                href="/catalog/"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Каталог материалов
              </ButtonLink>
            </div>
          </div>

          {/* Карточка цен уходит вправо навылет: отрицательное правое поле
              выносит её за край экрана, overflow секции обрезает. Радиус
              справа снят — обрезанная карточка со скруглением читалась бы
              как ошибка вёрстки, а не как приём. */}
          <div data-hero="price" className="lg:col-span-5">
            <div className="inv -mr-6 rounded-l-card p-5 pr-10 shadow-lift md:-mr-12 md:p-6 md:pr-16">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-t1 font-medium text-ink-2">Цены на площадке</h2>
                <span className="text-t1 text-ink-2">₽ / м³, с НДС</span>
              </div>

              <ul className="mt-4 divide-y divide-line">
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/catalog/?category=${c.id}`}
                      className="group flex items-baseline justify-between gap-4 py-3 transition-colors"
                    >
                      <span className="text-t1 text-ink-2 transition-colors group-hover:text-ink">
                        {c.name}
                      </span>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-t1 text-ink-2">от</span>
                        <span className="tnum font-black text-t3 leading-none">
                          {num(priceFrom(c.id))}
                        </span>
                        <span className="text-t1 text-ink-2">₽</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-line pt-4 text-t1 leading-snug text-ink-2">
                Самовывоз с площадки. Доставка считается отдельно —{' '}
                <Link
                  href="/#raschet"
                  className="rounded text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
                >
                  в калькуляторе ниже
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
