import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

import { MIN_ORDER_M3, MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_IN_STOCK, POSITIONS_TOTAL, priceFrom } from '@/lib/catalog';
import { num, plural } from '@/lib/format';
import { PHOTO, asset } from '@/lib/assets';

const FACTS = [
  { label: 'География', value: `Москва и область, до ${MAX_KM} км от МКАД` },
  { label: 'Минимальная отгрузка', value: `${MIN_ORDER_M3} м³ — одна машина` },
  { label: 'Документы', value: 'Паспорт качества на каждую партию' },
];

/**
 * Первый экран. Слева — заявление, справа — цены: на этом сайте главный
 * аргумент это цифра, и она должна попасть в кадр без прокрутки.
 *
 * Фотографии нет. Заглушку не рисуем: пустой прямоугольник с узором честно
 * сообщал, что здесь ничего нет, и отодвигал вниз всё остальное. Когда
 * PHOTO.hero получит путь, снимок встанет над строкой фактов сам.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации — это LCP.
 */
export function Hero() {
  return (
    <section className="relative border-b border-line pt-8 md:pt-14">
      <div className="shell grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-t1 text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-3" aria-hidden="true" />
              Поставка инертных материалов
            </span>
            <span className="hidden text-line-strong sm:inline" aria-hidden="true">
              ·
            </span>
            <span>Москва и Московская область</span>
          </p>

          {/* Две строки заданы разметкой, а не переносом по ширине: у Peshka
              на разных экранах точка переноса уезжает, и «с доставкой» то и
              дело оставалось висеть в первой строке. */}
          <h1 className="mt-4 font-black text-t4 leading-[.95] tracking-[-.005em]">
            <span className="block">Щебень, песок и грунт</span>
            <span className="block">
              с доставкой <span className="text-accent">на объект</span>
            </span>
          </h1>

          <p className="mt-5 max-w-[52ch] text-t2 leading-relaxed text-ink-2">
            Пять групп материалов, {POSITIONS_TOTAL}{' '}
            {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}, из них {POSITIONS_IN_STOCK} на
            площадке сегодня. Считаем стоимость с доставкой прямо на странице — до звонка. Подаём
            машину под график работ, а не под свой.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/#zayavka" size="lg" className="w-full sm:w-auto">
              Запросить прайс
            </ButtonLink>
            <ButtonLink href="/catalog/" variant="secondary" size="lg" className="w-full sm:w-auto">
              Каталог материалов
            </ButtonLink>
          </div>
        </div>

        {/* Цены сразу, без прокрутки: снабженец сверяет порядок величин
            за три секунды и только потом решает, читать ли дальше.

            Карточка инвертирована — это самый плотный объект первого экрана
            после заголовка. Инверсия здесь не приём, а вес: белая карточка
            на почти белом фоне читалась четвёртой, после кнопок и лида, хотя
            несёт главное. Одна карточка на светлой секции — не тёмный блок
            встык, отклонённый заказчиком: секция вокруг остаётся светлой. */}
        <div className="lg:col-span-5">
          <div className="inv rounded-card p-5 shadow-lift md:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mark text-t1 text-ink-2">Цены на площадке</h2>
              <span className="mark text-t1 text-ink-2">₽ / м³, с НДС</span>
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
                      <span className="mark text-t1 text-ink-2">от</span>
                      {/* Цена — крупная ступень, название — мелкая. Разрыв
                          между ними и есть сообщение: смотреть надо на цифру. */}
                      <span className="font-black text-t4 leading-[.9]">
                        {num(priceFrom(c.id))}
                      </span>
                      <span className="mark text-t1 text-ink-2">₽</span>
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

      {/* Слот под кадр с карьера или разгрузки. Спецификация — PHOTO.hero
          в lib/assets.ts. Пока снимка нет, слот НЕ рисует заглушку: точечный
          узор читался как «здесь ничего нет» и тянул первый экран вниз.
          Место держит строка фактов — она типографическая и работает сама
          по себе, а когда придёт кадр, встанет над ней без правки вёрстки. */}
      <div className="shell mt-10 md:mt-14">
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {PHOTO.hero.src && (
            <img
              src={asset(PHOTO.hero.src)}
              alt={PHOTO.hero.brief}
              className="w-full border-b border-line object-cover"
              style={{ aspectRatio: PHOTO.hero.ratio }}
            />
          )}
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FACTS.map((f) => (
              <div key={f.label} className="px-4 py-4 md:px-6 md:py-5">
                <dt className="mark text-t1 text-ink-2">{f.label}</dt>
                <dd className="mt-2 text-t2 font-medium leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="h-10 md:h-14" aria-hidden="true" />
    </section>
  );
}
