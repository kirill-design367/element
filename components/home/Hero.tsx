import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

import { MIN_ORDER_M3, MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_IN_STOCK, POSITIONS_TOTAL, priceFrom } from '@/lib/catalog';
import { plural, rub } from '@/lib/format';

const FACTS = [
  { label: 'География', value: `Москва и область, до ${MAX_KM} км от МКАД` },
  { label: 'Минимальная отгрузка', value: `${MIN_ORDER_M3} м³ — одна машина` },
  { label: 'Документы', value: 'Паспорт качества на каждую партию' },
];

/**
 * Первый экран. Слева — заявление, справа — цены: на этом сайте главный
 * аргумент это цифра, и она должна попасть в кадр без прокрутки.
 *
 * Фотографии нет, поэтому под будущий кадр отведена полоса с фактурой.
 * Когда PHOTO.hero получит путь, снимок встанет ровно сюда, а строка фактов
 * останется поверх него.
 *
 * H1 отрисован на сервере и не участвует ни в одной анимации — это LCP.
 */
export function Hero() {
  return (
    <section className="relative border-b border-line pt-8 md:pt-14">
      <div className="shell grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              Поставка инертных материалов
            </span>
            <span className="hidden text-line-strong sm:inline" aria-hidden="true">
              ·
            </span>
            <span>Москва и Московская область</span>
          </p>

          <h1 className="mt-4 font-display text-[clamp(34px,6.4vw,64px)] font-semibold leading-[1.02] tracking-[-.035em]">
            Щебень, песок и грунт&nbsp;— <span className="text-accent">на объект</span>, а не на склад
          </h1>

          <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink-2 md:text-[18px]">
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
            за три секунды и только потом решает, читать ли дальше. */}
        <div className="lg:col-span-5">
          <div className="rounded-card border border-line bg-surface p-4 shadow-card md:p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium uppercase tracking-[.08em]">
                Цены на площадке
              </h2>
              <span className="text-[12px] text-ink-2">₽ за м³, с НДС</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/catalog/?category=${c.id}`}
                    className="group flex items-baseline justify-between gap-3 py-2.5 transition-colors hover:text-accent"
                  >
                    <span className="text-[15px]">{c.name}</span>
                    <span className="tnum text-[16px] font-bold">
                      от {rub(priceFrom(c.id))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-[13px] leading-snug text-ink-2">
              Самовывоз с площадки. Доставка считается отдельно —{' '}
              <Link href="/#raschet" className="rounded text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent">
                в калькуляторе ниже
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Место под кадр с карьера или разгрузки. Бриф — в lib/assets.ts.
          Пропорция кадра описана там же; здесь задана высота, чтобы полоса
          держала ширину колонки и не сжималась под соотношение сторон. */}
      <div className="shell mt-10 md:mt-14">
        <div className="overflow-hidden rounded-card border border-line">
          <div
            className="grain h-[168px] border-b border-line md:h-[260px]"
            style={
              {
                '--grain-bg': '#dedbd6',
                '--grain-tint': '#978e86',
                '--grain-tint-2': '#b5aca3',
                '--grain-dot': '4.5px',
                '--grain-step': '16px',
                '--grain-rot': '-6deg',
              } as React.CSSProperties
            }
          />
          <dl className="grid grid-cols-1 divide-y divide-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FACTS.map((f) => (
              <div key={f.label} className="px-4 py-3 md:px-5 md:py-4">
                <dt className="text-[11px] uppercase tracking-[.09em] text-ink-2">{f.label}</dt>
                <dd className="mt-1 text-[14px] font-medium leading-snug md:text-[15px]">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="h-10 md:h-14" aria-hidden="true" />
    </section>
  );
}
