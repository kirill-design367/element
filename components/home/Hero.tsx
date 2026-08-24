import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { MIN_ORDER_M3, MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_IN_STOCK, POSITIONS_TOTAL, priceFrom } from '@/lib/catalog';
import { num, plural } from '@/lib/format';
import { FractionScale } from './FractionScale';

const FACTS = [
  { label: 'География', value: `Москва и область, до ${MAX_KM} км от МКАД` },
  { label: 'Минимальная отгрузка', value: `${MIN_ORDER_M3} м³ — одна машина` },
  { label: 'Документы', value: 'Паспорт качества на каждую партию' },
];

/**
 * Первый экран — обложка спецификации: шапка с полем маркировки,
 * заявление и сразу колонка цен. Цифры на первом экране без прокрутки,
 * потому что снабженец сверяет порядок величин раньше, чем читает текст.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации — это LCP.
 */
export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="shell pt-6 md:pt-10">
        <div className="doc-grid border-t border-line-strong pt-4 md:pt-5">
          <p className="mark pb-4 text-ink-2 md:pb-0">
            Поставка
            <br className="hidden md:block" /> инертных материалов
          </p>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-7">
              <h1 className="text-t4 font-display font-semibold tracking-[-.035em]">
                Щебень, песок и грунт&nbsp;— на объект, а не на склад
              </h1>

              <p className="mt-6 max-w-[54ch] text-t2 text-ink-2">
                Пять групп, {POSITIONS_TOTAL}{' '}
                {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}, из них{' '}
                {POSITIONS_IN_STOCK} на площадке сегодня. Считаем стоимость с доставкой прямо на
                странице — до звонка. Подаём машину под график работ, а не под свой.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
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

            {/* Прайс как отрывной талон: колонка цен выровнена по разряду. */}
            <div className="lg:col-span-5">
              <div className="flex items-baseline justify-between border-b border-ink pb-2">
                <p className="mark">Цены на площадке</p>
                <p className="mark text-ink-2">₽ / м³, с НДС</p>
              </div>
              <ul>
                {CATEGORIES.map((c) => (
                  <li key={c.id} className="border-b border-line">
                    <Link
                      href={`/catalog/?category=${c.id}`}
                      className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-accent"
                    >
                      <span className="text-t2">{c.name}</span>
                      <span className="flex items-baseline gap-1.5">
                        <span className="mark text-ink-2">от</span>
                        <span className="figure text-t3 font-semibold">
                          {num(priceFrom(c.id))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-t2 text-ink-2">
                Самовывоз с площадки. Доставка считается отдельно —{' '}
                <Link
                  href="/#raschet"
                  className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
                >
                  в калькуляторе ниже
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Гранулометрия вместо фотографии: заглушка, которая сообщает о товаре. */}
      <div className="shell mt-12 md:mt-16">
        <FractionScale />
      </div>

      <div className="shell">
        <dl className="grid grid-cols-1 sm:grid-cols-3">
          {FACTS.map((f) => (
            <div key={f.label} className="border-b border-line py-4 sm:border-b-0 sm:pr-8">
              <dt className="mark text-ink-2">{f.label}</dt>
              <dd className="mt-2 text-t2">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="h-8 md:h-12" aria-hidden="true" />
    </section>
  );
}
