import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

import { MIN_ORDER_M3, MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_IN_STOCK, POSITIONS_TOTAL, priceFrom } from '@/lib/catalog';
import { num, plural } from '@/lib/format';
import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';

export const FACTS = [
  { label: 'География', value: `Москва и область, до ${MAX_KM} км от МКАД` },
  { label: 'Минимальная отгрузка', value: `${MIN_ORDER_M3} м³ — одна машина` },
  { label: 'Документы', value: 'Паспорт качества на каждую партию' },
];

/**
 * Первый экран: кадр во всю высоту и две стеклянные панели поверх него.
 *
 * Стекло настоящее: заливка 0,5, размытие 40 px, поднятая насыщенность
 * подложки. Сквозь панель видно самосвал, а не серое пятно. Контраст
 * добирается не плотностью, а мягким световым градиентом внутри самой
 * панели — он поднимает светлоту там, где стоят буквы, и сходит в ноль к
 * дальнему углу. Рецепт целиком — в globals.css, класс .glass.
 *
 * Пропорции по золотому сечению. Колонки 1,618 к 1. Панели стоят не по
 * центру экрана, а на золотой линии: сетка из трёх строк 1fr / auto /
 * 1,618fr ставит блок на 38% высоты. Промежуток между панелями — поле
 * контейнера, делённое на 1,618.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации: рядом с ним
 * фотография, и это она LCP, но заголовок обязан быть на месте с первого
 * кадра в любом случае.
 */
export function Hero() {
  return (
    <section className="relative grid min-h-[100svh] grid-rows-[1fr_auto_1.618fr] overflow-hidden pb-16 pt-24 md:pt-28">
      {/* Фоновый кадр. Спецификация — PHOTO.hero в lib/assets.ts. Кадр выше
          блока на 48 px и поднят на 24: параллакс возит его на ±2% высоты, и
          без этого запаса на краях показалась бы полоса фона. На узком экране
          идёт свой вертикальный кадр. */}
      {PHOTO.hero.file && (
        <Photo
          file={PHOTO.hero.file}
          mobile={PHOTO.hero.mobile}
          alt={PHOTO.hero.brief}
          sizes="100vw"
          priority
          parallax="hero"
          className="absolute inset-0 -z-10 bg-surface-2"
          imgClassName="absolute inset-x-0 -top-6 h-[calc(100%+48px)]"
        />
      )}

      {/* Общее затемнение 13%. Не подложка под текст — выравнивание светлоты
          кадра под стекло. Больше 15% снимок начинает выглядеть вечерним. */}
      {PHOTO.hero.file && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[5]"
          style={{ background: 'rgba(18, 20, 24, .13)' }}
        />
      )}

      <div className="shell row-start-2 w-full">
        <div className="grid items-start gap-[clamp(10px,2.5vw,25px)] lg:grid-cols-[1.618fr_1fr]">
          {/* ── Панель заголовка ─────────────────────────────────────────── */}
          <div data-hero="panel" data-glass-parallax className="hero-panel">
          <div
            className="glass glass-panel rounded-panel p-5 md:p-7 lg:p-9"
          >
            {/* Внутри стекла нет вторичного серого. Плотность заливки 0,5
                физически не может вытянуть #5a5f66 до 4,5:1 над тёмным
                пикселем кадра — нужна была бы 0,87, то есть уже не стекло.
                Иерархию внутри панели держат кегль и вес, а не светлота. */}
            <p
              data-hero="eyebrow"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-t1 font-medium text-ink"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                Поставка инертных материалов
              </span>
              {/* Разделитель сплошным цветом, а не альфой: на прозрачной
                  панели альфа даёт дымку. */}
              <span className="hidden text-ink sm:inline" aria-hidden="true">
                ·
              </span>
              <span>Москва и Московская область</span>
            </p>

            {/* Две строки заданы разметкой: точка переноса по ширине уезжает
                от экрана к экрану, и «с доставкой» повисало в первой строке. */}
            <h1 data-hero="title" className="mt-4 font-black text-t4 leading-[.95] tracking-[-.035em]">
              <span className="block">Щебень, песок и грунт</span>
              <span className="block">
                с доставкой <span className="text-accent">на объект</span>
              </span>
            </h1>

            <p data-hero="lead" className="mt-5 max-w-[46ch] text-t2 leading-relaxed text-ink">
              Пять групп материалов, {POSITIONS_TOTAL}{' '}
              {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}, из них{' '}
              {POSITIONS_IN_STOCK} на площадке сегодня. Считаем стоимость с доставкой прямо на
              странице — до звонка.
            </p>

            <div data-hero="cta" className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/#zayavka" size="lg" className="w-full sm:w-auto">
                Запросить прайс
              </ButtonLink>
              <ButtonLink href="/catalog/" variant="secondary" size="lg" className="w-full sm:w-auto">
                Каталог материалов
              </ButtonLink>
            </div>
          </div>
          </div>

          {/* ── Панель цен ───────────────────────────────────────────────── */}
          <div data-hero="price">
            <div data-glass-parallax className="hero-panel">
            <div className="glass glass-panel rounded-panel p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-t1 font-medium text-ink">Цены на площадке</h2>
                <span className="text-t1 text-ink">₽ / м³, с НДС</span>
              </div>

              <ul className="mt-4 divide-y divide-ink/12">
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/catalog/?category=${c.id}`}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="text-t1 text-ink">
                        {c.name}
                      </span>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-t1 text-ink">от</span>
                        <span className="tnum font-black text-t3 leading-none">
                          {num(priceFrom(c.id))}
                        </span>
                        <span className="text-t1 text-ink">₽</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-ink/15 pt-4 text-t1 leading-snug text-ink">
                Самовывоз с площадки. Доставка считается отдельно —{' '}
                <Link
                  href="/#raschet"
                  className="link-underline rounded font-medium text-ink underline-offset-4"
                >
                  в калькуляторе ниже
                </Link>
                .
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
