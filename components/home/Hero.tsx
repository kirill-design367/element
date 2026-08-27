import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

import { CATEGORIES, priceFrom } from '@/lib/catalog';
import { nbsp, num, ON_REQUEST, typo } from '@/lib/format';
import { PHOTO } from '@/lib/assets';
import { Photo } from '@/components/ui/Photo';

/**
 * Первый экран: кадр во всю высоту и две стеклянные панели поверх него.
 *
 * Стекло настоящее: заливка 0,07, размытие 12 px, поднятая насыщенность
 * подложки. Сквозь панель видно самосвал, а не серое пятно. Контраст
 * добирается не плотностью заливки, а притемнением самого кадра под
 * панелью (.hero-panel::before, 0,45) — оно лежит между фотографией и
 * стеклом и размывается вместе с кадром. Светлого градиента внутри панели
 * нет: он поднимал светлоту под буквами и этим убивал прозрачность.
 * Рецепт целиком — в globals.css, классы .glass и .hero-panel.
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
            {/* Точки-разделителя между частями больше нет: границу держит
                сам промежуток. gap-x-6 — это 24 px, то есть ровно 2em при
                кегле t1: вдвое шире прежнего gap-x-3 и в девять с половиной
                раз шире обычного пробела этого шрифта (2,52 px при 12 px).
                Знак препинания на такой ширине уже ничего не добавляет, а
                читается лишней меткой.

                Точка-МАРКЕР в начале строки — другая вещь и остаётся: она не
                разделяет части, а помечает начало надзаголовка. */}
            <p
              data-hero="eyebrow"
              className="flex flex-wrap items-center gap-x-6 gap-y-1 text-t1 font-medium text-ink"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                Инертные материалы и металлопрокат
              </span>
              <span>Площадка в Люберцах</span>
            </p>

            {/* Три строки заданы разметкой, а не переносом по ширине: точка
                переноса уезжает от экрана к экрану, и «с доставкой» повисало
                в первой строке.

                Перенос запрещён у «и металлопрокат» и у «без очереди».
                Первая — про категорию, которой в заголовке раньше не было
                вовсе; вторая — то самое условие, которым отгрузка отличается
                от очереди на карьере, и разорванной она не значит ничего.

                Строке целиком запрещать перенос нельзя: собственная ширина
                «с отгрузкой без очереди» при кегле 32 px больше колонки
                панели на узких экранах, и неразрывная строка распирала бы
                саму панель за край. Там строка переносится ПЕРЕД акцентом —
                по границе словосочетания, а не внутри него. */}
            <h1 data-hero="title" className="mt-4 font-black text-t4 leading-[.95] tracking-[-.035em]">
              <span className="block">Щебень, песок, грунт</span>
              <span className="block whitespace-nowrap">и металлопрокат</span>
              <span className="block">
                с отгрузкой <span className="hero-accent whitespace-nowrap">без очереди</span>
              </span>
            </h1>

            {/* Лид говорит про работу, а не пересказывает каталог: числа
                позиций стоят строкой ниже, в панели цен, и повторять их
                здесь незачем.

                Обе прежние фразы были про доставку, которой больше нет.
                Первая говорит, что делаем мы, вторая — что даёт страница:
                расчёт теперь считает не доставку, а объём, рейсы и время. */}
            <p data-hero="lead" className="mt-5 max-w-[46ch] text-t2 leading-relaxed text-ink">
              {typo(
                'Отгружаем круглосуточно по согласованному графику. Цену и число рейсов считаете здесь, до звонка.',
              )}
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
                <span className="text-t1 text-ink">{nbsp('₽/м³, с НДС')}</span>
              </div>

              {/* В панели только то, что считается кубами. Металл продаётся
                  тоннами, и строка «от 59 500 ₽» под шапкой «₽/м³» соврала бы
                  про единицу; у него своя карточка ниже по странице. */}
              {/* Разделители стоят на самих строках, а не утилитой divide-*.
                  Причина механическая: divide-* в этой версии Tailwind не
                  принимает модификатор прозрачности вовсе — «divide-ink/12»
                  не порождало правила, и линию рисовал запасной цвет из
                  «* { border-color: var(--line) }». Проверено отдельной
                  сборкой: divide-line правило даёт, divide-ink/12 — нет.
                  И доля записана в скобках: шкала прозрачности Tailwind идёт
                  через пять, двенадцати в ней нет, и «/12» тоже не породило
                  бы правила. */}
              <ul className="mt-4">
                {CATEGORIES.filter((c) => c.unit === 'm3').map((c) => (
                  <li key={c.id} className="border-t border-ink/[.12] first:border-t-0">
                    <Link
                      href={`/catalog/?category=${c.id}`}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="text-t1 text-ink">
                        {c.name}
                      </span>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        {priceFrom(c.id) === null ? (
                          <span className="text-t1 text-ink">{ON_REQUEST}</span>
                        ) : (
                          <>
                            <span className="text-t1 text-ink">от</span>
                            <span className="tnum font-black text-t3 leading-none">
                              {num(priceFrom(c.id) as number)}
                            </span>
                            <span className="text-t1 text-ink">₽</span>
                          </>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Примечание говорит про то, что расчёт ниже теперь делает.
                  Доставки нет: цены и есть цены отгрузки с площадки, а
                  калькулятор считает объём, рейсы и время до объекта. */}
              <p className="mt-4 border-t border-ink/15 pt-4 text-t1 leading-snug text-ink">
                Цены на отгрузку с площадки. Рейсы и время до объекта —{' '}
                <Link
                  href="/#raschet"
                  className="link-underline rounded font-medium text-ink underline-offset-4"
                >
                  в расчёте ниже
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
