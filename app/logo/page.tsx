import type { Metadata } from 'next';
import Link from 'next/link';
import { asset } from '@/lib/assets';
import { ART, METRICS, PATHS, type Art } from './art';
import { PALETTES, type Palette } from './palettes';
import { FONT_CHECK } from './variants';

export const metadata: Metadata = {
  title: 'Логотип: шрифт подключён',
  description:
    'Служебная страница выбора: слово набрано TT Octosquares Expanded Black.',
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
          Логотип: шрифт подключён
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
          Скоба, плашка и вариации приходят следующим коммитом. Здесь — сам шрифт и набор.
        </p>

        <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Шрифт по бинарнику</h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
            {FONT_CHECK.map(([k, val]) => (
              <div key={k} className="border-t border-line pt-3">
                <dt className="text-[14px] font-semibold">{k}</dt>
                <dd className="mark mt-1 text-t1 leading-relaxed text-ink-2">{val}</dd>
              </div>
            ))}
</dl>
        </section>

        <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Слово в наборе</h2>
          <div
            className="mt-5 flex items-center justify-center overflow-x-auto rounded-card p-5"
            data-lenis-prevent
            style={{ background: p.bg }}
            dangerouslySetInnerHTML={{ __html: `<div style="${skin}">${logo('word', { cap: 96 }, 'h-auto')}</div>` }}
          />
          <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-ink-2">
            Буквы взяты из шрифта как есть. Правится только межбуквенный интервал: метрики шрифта
            не используются, интервалы выровнены по оптической площади просвета между соседями.
          </p>
        </section>
      </div>
    </div>
  );
}
