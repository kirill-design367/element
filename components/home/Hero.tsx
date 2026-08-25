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
 * Кадр больше не выбеливается. Раньше под текстом лежал светлый градиент от
 * края, и на широком экране половина снимка превращалась в молочное пятно.
 * Теперь читаемость держат сами панели — матовое стекло того же рецепта, что
 * шапка, — а на кадр положено общее затемнение 13%: ровно столько, чтобы
 * светлые участки не спорили с белым стеклом, и не настолько, чтобы снимок
 * перестал читаться кадром.
 *
 * Тёмной карточки цен больше нет: обе панели светлые и одинаковые по
 * материалу. Левая поднята к середине высоты экрана, а не прижата к нижней
 * трети — под ней остаётся кадр, над ней остаётся кадр.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации: рядом с ним
 * фотография, и это она LCP, но заголовок обязан быть на месте с первого
 * кадра в любом случае.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-20 pt-28 md:pb-24 md:pt-32">
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

      <div className="shell w-full">
        <div className="grid items-center gap-4 md:gap-5 lg:grid-cols-12">
          {/* ── Панель заголовка ─────────────────────────────────────────── */}
          <div className="glass glass-panel rounded-card p-5 md:p-7 lg:col-span-7 lg:p-9">
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
            <h1 data-hero="title" className="mt-4 font-black text-t4 leading-[.95] tracking-[-.035em]">
              <span className="block">Щебень, песок и грунт</span>
              <span className="block">
                с доставкой <span className="text-accent">на объект</span>
              </span>
            </h1>

            <p data-hero="lead" className="mt-5 max-w-[46ch] text-t2 leading-relaxed text-ink-2">
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

          {/* ── Панель цен ───────────────────────────────────────────────── */}
          <div data-hero="price" className="lg:col-span-5">
            <div className="glass glass-panel rounded-card p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-t1 font-medium text-ink-2">Цены на площадке</h2>
                <span className="text-t1 text-ink-2">₽ / м³, с НДС</span>
              </div>

              <ul className="mt-4 divide-y divide-line">
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/catalog/?category=${c.id}`}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="text-t1 text-ink-2 transition-colors duration-300 group-hover:text-ink">
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
