import type { Metadata } from 'next';
import Link from 'next/link';
import { asset } from '@/lib/assets';
import { ART, METRICS, PATHS, type Art } from './art';
import { PALETTES, type Palette } from './palettes';
import { DIRS, HEADER_CAP, VARIANTS, artOf, type Variant, type WordSet } from './variants';

export const metadata: Metadata = {
  title: 'Логотип: три направления',
  description:
    'Служебная страница выбора: восемнадцать отрисовок по трём направлениям, каждая в двух наборах слова, трёх палитрах и шести состояниях.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

const U = METRICS.cap;
const HERO = asset('/img/hero-mobile-420.webp');

const SETS: { key: WordSet; label: string }[] = [
  { key: 'caps', label: 'Прописными: ЭЛЕМЕНТ' },
  { key: 'mixed', label: 'Как в шапке сайта: Элемент' },
];

/**
 * Все композиции объявляются символами по разу, показы ссылаются через use.
 * Разметка собрана строкой, а не деревом элементов: Next сериализует дерево
 * серверных компонентов в JSON целиком, и без этого оно уезжает на страницу
 * дважды — разметкой и служебными данными.
 */
const DEFS =
  Object.entries(PATHS)
    .map(([id, p]) => `<path id="p-${id}" d="${p.d}"/>`)
    .join('') +
  Object.entries(ART)
    .map(([id, a]) => {
      const body = a.parts
        .map((pt) => {
          const fill = `fill="var(--c-${pt.role})"`;
          return pt.ref
            ? `<use href="#p-${pt.ref}" x="${pt.x ?? 0}" y="${pt.y ?? 0}" ${fill}/>`
            : `<path d="${pt.d}" ${fill}/>`;
        })
        .join('');
      return `<symbol id="a-${id}" viewBox="0 0 ${a.w} ${a.h}">${body}</symbol>`;
    })
    .join('');

function Defs() {
  return (
    <svg aria-hidden focusable="false" className="sr-only">
      <defs dangerouslySetInnerHTML={{ __html: DEFS }} />
    </svg>
  );
}

/**
 * Показы собираются СТРОКАМИ разметки, а не деревом элементов, и это не
 * небрежность. Next сериализует дерево серверных компонентов в JSON целиком,
 * со всеми атрибутами: то же дерево уезжает на страницу дважды — разметкой и
 * служебными данными. При восемнадцати отрисовках по двенадцать показов это
 * лишние сотни килобайт на странице выбора.
 */

/** Логотип нужного размера: по высоте прописных, по высоте рамки или в короб. */
function logo(id: string, size: { cap?: number; height?: number; fit?: { w: number; h: number } },
              cls = '') {
  const a: Art | undefined = ART[id];
  if (!a) return '';
  const k = size.cap != null ? size.cap / U
    : size.height != null ? size.height / a.h
    : Math.min(size.fit!.w / a.w, size.fit!.h / a.h);
  const r = (n: number) => Math.round(n * 100) / 100;
  /* viewBox обязателен: без него max-width сжимает коробку, а содержимое
     остаётся прежнего размера и обрезается. */
  return `<svg width="${r(a.w * k)}" height="${r(a.h * k)}" viewBox="0 0 ${a.w} ${a.h}"`
    + ` class="${cls}" aria-hidden="true" focusable="false">`
    + `<use href="#a-${id}" width="${a.w}" height="${a.h}"/></svg>`;
}

const style = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');

const paint = (p: Palette, negative = false) =>
  `--c-bg:${negative ? p.ink : p.bg};--c-ink:${negative ? p.bg : p.ink};--c-accent:${p.accent}`;

/* Краска лежит ВНУТРИ клетки, а не на всей карточке: подпись под тёмной
   заливкой и под фотографией иначе не читается вовсе. */
function cell(label: string, css: string, inner: string) {
  return `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4">`
    + `<div class="flex h-24 items-center justify-center rounded" style="${css}">${inner}</div>`
    + `<p class="mt-3 text-[12px] leading-snug text-ink-2">${label}</p></div>`;
}

function statesHtml(v: Variant, set: WordSet, p: Palette, short: boolean) {
  const id = `${v.id}-${set}`;
  const light = `${paint(p)};background:${p.bg}`;
  const head =
    `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">`
    + `<div class="flex items-center justify-center rounded p-4" style="${light}">`
    + `${logo(id, { cap: 92 }, 'h-auto max-w-full')}</div>`
    + `<p class="mt-3 text-[12px] leading-snug text-ink-2">1. Крупно, во всю ширину колонки</p></div>`
    // Геометрия шапки в натуральную величину: пилюля 60 px, логотип по высоте
    // прописных 14,28 px, соседи — настоящие пункты меню.
    + `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">`
    + `<div class="min-w-0 overflow-x-auto" data-lenis-prevent>`
    + `<div class="flex h-[60px] min-w-[540px] items-center gap-5 rounded-pill border border-line px-5" style="${light}">`
    + logo(id, { cap: HEADER_CAP }, 'shrink-0')
    + `<span class="text-t2" style="color:${p.ink}">Каталог&nbsp;&nbsp;&nbsp;Расчёт&nbsp;&nbsp;&nbsp;Условия</span>`
    + `<span class="ml-auto whitespace-nowrap text-t2 font-semibold" style="color:${p.ink}">+7&nbsp;(930)&nbsp;160-78-78</span>`
    + `</div></div><p class="mt-3 text-[12px] leading-snug text-ink-2">2. В размере шапки сайта</p></div>`;

  let rest = cell('3. Мелко: высота 20 px — проверка на визитку', light,
    logo(id, { height: 20 }, 'h-auto max-w-full'));
  if (!short) {
    rest += cell('4. Компактная форма: 96, 32 и 16 px', light,
      `<div class="flex items-end gap-3">` + [96, 32, 16].map((sz) =>
        `<span class="flex items-center justify-center" style="width:${sz}px;height:${sz}px">`
        + logo(`${v.id}-c`, { fit: { w: sz, h: sz } }) + `</span>`).join('') + `</div>`);
    rest += cell('5. На фотографии первого экрана',
      `${paint(p)};background-image:url(${HERO});background-size:cover;background-position:center`,
      logo(id, { cap: 30 }, 'h-auto max-w-full'));
    rest += cell('6. В негативе', `${paint(p, true)};background:${p.ink}`,
      logo(id, { cap: 40 }, 'h-auto max-w-full'));
  }
  return `<div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">`
    + `<div class="grid min-w-0 gap-4">${head}</div>`
    + `<div class="grid min-w-0 content-start gap-4${short ? '' : ' sm:grid-cols-2'}">${rest}</div></div>`;
}

function cardBody(v: Variant) {
  return SETS.map((s) =>
    `<div class="mt-6"><h4 class="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">`
    + `${s.label}</h4>${statesHtml(v, s.key, PALETTES[0], s.key === 'mixed')}</div>`).join('');
}

function VariantCard({ v }: { v: Variant }) {
  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card md:mt-10 md:p-8">
      <header className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <h3 className="flex gap-3 text-t3 font-black leading-none tracking-[-.02em]">
          <span className="text-ink-3">{v.dir.toUpperCase()}{v.no}</span>
          {v.name}
        </h3>
        <p className="max-w-[54ch] text-[15px] leading-snug text-ink-2">{v.diff}</p>
      </header>

      <div dangerouslySetInnerHTML={{ __html: cardBody(v) }} />

      <p className="mt-7 max-w-[70ch] border-t border-line pt-6 text-[15px] leading-relaxed">
        <span className="font-semibold text-warn">Слабое место. </span>
        <span className="text-ink-2">{v.weak}</span>
      </p>
    </section>
  );
}

export default function LogoPage() {
  return (
    <div>
      <Defs />
      {/* Шапка сайта — плавающая пилюля поверх содержимого, её нижняя кромка на
          70 px. Верхнее поле поднято до 96 и 112, иначе она накрывает крошку. */}
      <div className="shell py-8 pt-24 md:py-14 md:pt-28">
        <p className="text-[13px] text-ink-2">
          <Link href="/" className="rounded hover:text-accent">
            ← На главную
          </Link>
        </p>

        <h1 className="mt-5 max-w-[20ch] font-black text-[clamp(30px,5vw,46px)] leading-[1.06] tracking-[-.025em]">
          Логотип: три направления
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта стоит слово — логотип туда не ставится, пока не выбран.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Направления выбраны, придумывать новые не нужно. По каждому — шесть отрисовок, и
          отличаются они пропорциями, а не замыслом. Каждая показана в двух наборах слова, в трёх
          парах красок и в шести состояниях, включая проверку на фотографии первого экрана.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Все размеры — доли высоты прописных ({U} единиц шрифта). Ни одно число не подобрано на
          глаз, и главная работа здесь не в фигурах, а в наборе: межбуквенные интервалы выровнены
          не по метрикам шрифта, а по оптической площади просвета между соседями. Круглая Э и
          косая Л от этого подтягиваются к соседям, прямая Н отодвигается.
        </p>


        {DIRS.map((d) => (
          <section key={d.key} className="mt-12 md:mt-16">
            <h2 className="text-t4 font-black leading-[1.05] tracking-[-.025em]">{d.title}</h2>
            <p className="mt-4 max-w-[70ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
              {d.brief}
            </p>
            {VARIANTS.filter((v) => v.dir === d.key).map((v) => (
              <VariantCard key={v.id} v={v} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
