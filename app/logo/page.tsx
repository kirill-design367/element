import type { Metadata } from 'next';
import Link from 'next/link';
import { asset } from '@/lib/assets';
import { ART, METRICS, PATHS, type Art } from './art';
import { PALETTES, type Palette } from './palettes';
import { BRACE, FONT_CHECK, HEADER_CAP, VARIANTS, type Variant } from './variants';

export const metadata: Metadata = {
  title: 'Логотип: десять вариаций',
  description:
    'Служебная страница выбора: слово в плашке со скобой, набор TT Octosquares Expanded Black, десять вариаций.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

const U = METRICS.cap;
const HERO = asset('/img/hero-mobile-420.webp');

/**
 * Композиции объявляются символами по разу, показы ссылаются через use.
 * Next сериализует дерево серверных компонентов в JSON целиком, поэтому
 * разметка показов собрана строками.
 */
const DEFS =
  '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
  + '<defs>'
  + Object.entries(PATHS).map(([k, d]) => `<path id="p-${k}" d="${d}"/>`).join('')
  + Object.entries(ART).map(([k, a]) =>
    `<symbol id="a-${k}" viewBox="0 0 ${a.w} ${a.h}">`
    + a.parts.map((p) => (p.d
      ? `<path d="${p.d}" fill="var(--c-${p.role})"/>`
      : `<use href="#p-${p.ref}" x="${p.x ?? 0}" y="${p.y ?? 0}" fill="var(--c-${p.role})"/>`))
      .join('')
    + '</symbol>').join('')
  + '</defs></svg>';

function Defs() {
  return <div dangerouslySetInnerHTML={{ __html: DEFS }} />;
}

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

const paint = (p: Palette, negative = false) =>
  `--c-bg:${negative ? p.ink : p.bg};--c-ink:${negative ? p.bg : p.ink}`;

/* Краска лежит ВНУТРИ клетки показа, а не на всей карточке: подпись под
   тёмной заливкой и под фотографией иначе не читается вовсе. */
function cell(label: string, css: string, inner: string) {
  return `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4">`
    + `<div class="flex h-24 items-center justify-center rounded" style="${css}">${inner}</div>`
    + `<p class="mt-3 text-[12px] leading-snug text-ink-2">${label}</p></div>`;
}

function statesHtml(v: Variant, p: Palette) {
  const light = `${paint(p)};background:${p.bg}`;
  const head =
    `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">`
    + `<div class="flex items-center justify-center rounded p-4" style="${light}">`
    + `${logo(v.id, { cap: 78 }, 'h-auto max-w-full')}</div>`
    + `<p class="mt-3 text-[12px] leading-snug text-ink-2">1. Крупно, во всю ширину колонки</p></div>`
    // Геометрия шапки в натуральную величину: пилюля 60 px, логотип по высоте
    // прописных 14,28 px, соседи — настоящие пункты меню.
    + `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">`
    + `<div class="min-w-0 overflow-x-auto" data-lenis-prevent>`
    + `<div class="flex h-[60px] min-w-[520px] items-center gap-5 rounded-pill border border-line px-5" style="${light}">`
    + logo(v.id, { cap: HEADER_CAP }, 'shrink-0')
    + `<span class="text-t2" style="color:${p.ink}">Каталог&nbsp;&nbsp;&nbsp;Расчёт&nbsp;&nbsp;&nbsp;Условия</span>`
    + `<span class="ml-auto whitespace-nowrap text-t2 font-semibold" style="color:${p.ink}">+7&nbsp;(930)&nbsp;160-78-78</span>`
    + `</div></div><p class="mt-3 text-[12px] leading-snug text-ink-2">2. В размере шапки сайта</p></div>`;

  const rest =
    cell('3. Мелко: высота 20 px — проверка на визитку', light,
      logo(v.id, { height: 20 }, 'h-auto max-w-full'))
    + cell('4. Компактная форма: 96, 32 и 16 px. Четвёртый квадрат — отдельная версия под 16',
      light,
      `<div class="flex items-end gap-3">`
      + [96, 32, 16].map((sz) =>
        `<span class="flex items-center justify-center" style="width:${sz}px;height:${sz}px">`
        + logo(`${v.id}-c`, { fit: { w: sz, h: sz } }) + `</span>`).join('')
      + `<span class="flex items-center justify-center" style="width:16px;height:16px">`
      + logo('small', { fit: { w: 16, h: 16 } }) + `</span></div>`)
    + cell('5. На фотографии первого экрана',
      `${paint(p)};background-image:url(${HERO});background-size:cover;background-position:center`,
      logo(v.id, { height: 74 }, 'h-auto max-w-full'))
    + cell('6. В негативе', `${paint(p, true)};background:${p.ink}`,
      logo(v.id, { height: 74 }, 'h-auto max-w-full'));

  return `<div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">`
    + `<div class="grid min-w-0 gap-4">${head}</div>`
    + `<div class="grid min-w-0 content-start gap-4 sm:grid-cols-2">${rest}</div></div>`;
}

/** Три пары красок на опорном состоянии. */
function palettesHtml(v: Variant) {
  return `<div class="mt-6 grid gap-4 sm:grid-cols-3">` + PALETTES.map((p) =>
    `<div class="min-w-0 rounded-card border border-line bg-surface-2 p-4">`
    + `<div class="flex h-24 items-center justify-center rounded" style="${paint(p)};background:${p.bg}">`
    + logo(v.id, { height: 74 }, 'h-auto max-w-full') + `</div>`
    + `<p class="mt-3 text-[12px] leading-snug text-ink-2">${p.name}</p></div>`).join('') + `</div>`;
}

function VariantCard({ v }: { v: Variant }) {
  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card md:mt-10 md:p-8">
      <header className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div>
          <h3 className="flex gap-3 text-t3 font-black leading-none tracking-[-.02em]">
            <span className="text-ink-3">{v.no}</span>
            {v.name}
          </h3>
          <p className="mark mt-2 text-t1 text-ink-2">{v.spec}</p>
        </div>
        <p className="max-w-[54ch] text-[15px] leading-snug text-ink-2">{v.diff}</p>
      </header>

      <div
        dangerouslySetInnerHTML={{
          __html: palettesHtml(v) + statesHtml(v, PALETTES[0]),
        }}
      />

      <p className="mt-7 max-w-[70ch] border-t border-line pt-6 text-[15px] leading-relaxed">
        <span className="font-semibold text-warn">Слабое место. </span>
        <span className="text-ink-2">{v.weak}</span>
      </p>
    </section>
  );
}

export default function LogoPage() {
  const p = PALETTES[0];
  const skin = `${paint(p)};background:${p.bg}`;
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
          Логотип: десять вариаций
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта стоит слово — логотип туда не ставится, пока не выбран.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Слово набрано готовым шрифтом — TT&nbsp;Octosquares Expanded Black. Буквы не
          перерисованы и не правлены: контуры взяты как есть, руками правится только межбуквенный
          интервал. Гранёность даёт сам шрифт: у Э срезано плечо, у Л и М скошены углы, и углы эти
          идут под 39, 40 и 65 градусами — под собственными углами гарнитуры, а не под 45.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Своя геометрия здесь ровно одна — скоба и плашка. Углы скобы срезаны под 45° снаружи и
          изнутри, толщина в углу от этого остаётся равной штриху. Концы плеч — плоский
          вертикальный торец, у которого срезаны только два угла: длинных скосов и клиньев нет,
          плоская часть занимает бо́льшую часть высоты торца.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Вариаций десять, и отличаются они тремя вещами: длиной плеч, набором слова и глубиной
          фаски на торцах плеч. Версии без плашки приходят следующим коммитом.
        </p>

        <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Шрифт по бинарнику</h2>
          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            <dl className="grid content-start gap-3">
              {FONT_CHECK.map(([k, val]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt className="text-[14px] font-semibold">{k}</dt>
                  <dd className="mark mt-1 text-t1 leading-relaxed text-ink-2">{val}</dd>
                </div>
              ))}
            </dl>
            <dl className="grid content-start gap-3">
              {BRACE.map(([k, val]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt className="text-[14px] font-semibold">{k}</dt>
                  <dd className="mark mt-1 text-t1 leading-relaxed text-ink-2">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Конец плеча крупно</h2>
          <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
            Торец плоский и вертикальный, срезаны только два его угла. Плоская часть занимает
            бо́льшую часть высоты: при 0,08 штриха она 84% торца, при 0,15 — 70%, при 0,33 — ровно
            треть. Глубже трети срез превращается в клин, и торец перестаёт читаться плоским.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {(['end-08', 'end-15', 'end-33'] as const).map((k, i) => (
              <div key={k}>
                <div
                  className="flex items-center justify-center rounded-card p-5"
                  style={{ background: p.bg }}
                  dangerouslySetInnerHTML={{ __html: `<div style="${skin}">${logo(k, { height: 96 }, 'h-auto max-w-full')}</div>` }}
                />
                <p className="mark mt-3 text-t1 text-ink-2">
                  {['фаска 0,08 штриха — 18 единиц', 'фаска 0,15 штриха — 35 единиц',
                    'фаска 0,33 штриха — 76 единиц'][i]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Палитры</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {PALETTES.map((q) => (
              <div key={q.id}>
                <div className="flex gap-2">
                  {[q.bg, q.ink].map((c) => (
                    <span
                      key={c}
                      className="h-10 flex-1 rounded border border-line"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <h3 className="mt-3 text-[14px] font-semibold">{q.name}</h3>
                <p className="mark mt-1 text-t1 text-ink-3">Контраст {q.ratio}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{q.why}</p>
              </div>
            ))}
          </div>
        </section>

        {VARIANTS.map((v) => (
          <VariantCard key={v.id} v={v} />
        ))}
      </div>
    </div>
  );
}
