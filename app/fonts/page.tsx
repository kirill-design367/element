import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { geologica, onest } from '../type';
import report from '@/lib/font-check.json';
import { MATERIALS, pricePerTon } from '@/lib/catalog';
import { rub } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Типографика: три пары на выбор',
  description:
    'Три шрифтовые пары для сайта, проверенные по таблице cmap: полнота кириллицы, наличие табличных цифр, служебные знаки.',
};

// Пары 2 и 3 подключаются только здесь: на боевых страницах их нет.
// preload выключен намеренно — это страница сравнения, четыре лишних
// приоритетных запроса отбирают полосу у того, что человек читает первым.
const plexCond = localFont({
  src: [{ path: '../../assets/fonts/IBMPlexSansCond.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  preload: false,
  variable: '--f-plexcond',
});
const golos = localFont({
  src: [{ path: '../../assets/fonts/GolosText.woff2', weight: '400 900', style: 'normal' }],
  display: 'swap',
  preload: false,
  variable: '--f-golos',
});
const manrope = localFont({
  src: [{ path: '../../assets/fonts/Manrope.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  preload: false,
  variable: '--f-manrope',
});
const interTight = localFont({
  src: [{ path: '../../assets/fonts/InterTight.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  preload: false,
  variable: '--f-intertight',
});

type Row = (typeof report)[number];
const byFile = (f: string): Row => report.find((r) => r.file === f)!;

const PAIRS = [
  {
    id: 'geologica-onest',
    name: 'Geologica + Onest',
    role: 'Заголовки и цифры — Geologica. Интерфейс и текст — Onest.',
    headingVar: 'var(--font-display)',
    bodyVar: 'var(--font-text)',
    recommended: true,
    checks: [byFile('Geologica.ttf'), byFile('Onest.ttf')],
    rationale:
      'Geologica — технический гротеск с квадратной основой: цифры широкие, с плоскими окончаниями и почти одинаковым рисунком нуля и буквы «о», из-за чего строка цен читается как приборная шкала, а не как рекламный заголовок. Это ровно та интонация, которая нужна поставщику инертных материалов: сайт про кубометры и марки прочности, а не про образ жизни. Кириллица нарисована носителями языка, поэтому «ж», «щ» и «ы» не разваливаются в крупном кегле, а ось начертания от 200 до 800 закрывает и тонкие подписи, и плотные заголовки одним файлом в 25 КБ. Onest рядом ведёт себя тихо: широкая апертура и крупный рост строчных держат мелкий интерфейсный текст читаемым на телефоне, но собственного характера в него не подмешивают — в паре говорит только один голос, и это цифры.',
  },
  {
    id: 'plex-golos',
    name: 'IBM Plex Sans Condensed + Golos Text',
    role: 'Заголовки — узкий Plex. Текст — Golos Text.',
    headingVar: `${plexCond.style.fontFamily}`,
    bodyVar: `${golos.style.fontFamily}`,
    recommended: false,
    checks: [byFile('IBMPlexSans.ttf'), byFile('GolosText.ttf')],
    rationale:
      'IBM Plex рисовался как шрифт инженерной и технической документации, и это единственный кандидат из проверенных, у которого цифры табличные по умолчанию — без включения фичи tnum их ширины уже совпадают до единицы. Узкое начертание, взятое по оси ширины из того же файла, решает главную беду русских заголовков: «Щебень известняковый фракции 20–40» в узком виде помещается в строку там, где обычный гротеск переносится трижды. Golos Text от «Паратайпа» рисовался прежде всего под русский текст, а не адаптировался из латиницы, поэтому ритм абзаца ровнее. Пара уступает первой в характере — Plex узнаваем и тянет за собой ассоциацию с IBM, — но выигрывает в плотности и хороша, если каталог вырастет до сотен позиций.',
  },
  {
    id: 'manrope-inter',
    name: 'Manrope + Inter Tight',
    role: 'Заголовки — Manrope. Интерфейс — Inter Tight.',
    headingVar: `${manrope.style.fontFamily}`,
    bodyVar: `${interTight.style.fontFamily}`,
    recommended: false,
    checks: [byFile('Manrope.ttf'), byFile('InterTight.ttf')],
    rationale:
      'Самая безопасная из трёх и самая безликая. Manrope — геометрический гротеск с мягкими окончаниями, его цифры округлые и приветливые; Inter Tight — почти нейтральный интерфейсный шрифт с огромным набором знаков и предсказуемым поведением на любом экране. Пара не мешает и не запоминается: посетителю из розницы она будет привычна до незаметности, потому что примерно так выглядит половина современных сайтов. Держу её как запасной вариант на случай, если заказчик сочтёт Geologica слишком техничной для розничного покупателя — но осознанно ставлю третьей: сайт, который выглядит как все, не даёт повода запомнить поставщика.',
  },
];

const SAMPLE = MATERIALS.find((m) => m.id === 'granit-20-40')!;
const TABLE = MATERIALS.filter((m) => m.categoryId === 'shcheben').slice(0, 5);

export default function FontsPage() {
  return (
    <div
      className={`${geologica.variable} ${onest.variable} ${plexCond.variable} ${golos.variable} ${manrope.variable} ${interTight.variable}`}
    >
      <div className="shell py-8 md:py-14">
        <nav aria-label="Хлебные крошки" className="mb-5 text-[13px] text-ink-2">
          <Link href="/" className="rounded hover:text-accent">
            Главная
          </Link>
          <span className="mx-2 text-line-strong" aria-hidden="true">/</span>
          <span className="text-ink">Типографика</span>
        </nav>

        <h1 className="max-w-[22ch] font-display text-[clamp(30px,5.5vw,52px)] font-semibold leading-[1.04] tracking-[-.03em]">
          Три пары на выбор
        </h1>
        <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-ink-2">
          На этом сайте главное содержание — цифры: цены за куб и за тонну, фракции, марки
          прочности, километры. Поэтому шрифты отбирались не на глаз, а по бинарнику: скрипт{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[14px]">scripts/verify-fonts.py</code>{' '}
          читает таблицу cmap и проверяет полноту кириллицы, наличие знаков ₽ и №, ширины цифр и
          набор OpenType-фич. Проверка отсеяла трёх кандидатов — они внизу страницы.
        </p>
        <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink-2">
          Сейчас на сайте стоит первая пара. Скажите, какую оставить, — замена делается
          в одном файле <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[14px]">app/type.ts</code>.
        </p>

        <div className="mt-10 space-y-8 md:mt-14 md:space-y-14">
          {PAIRS.map((p, i) => (
            <section
              key={p.id}
              className="overflow-hidden rounded-card border border-line bg-surface"
              style={{ ['--h' as string]: p.headingVar, ['--b' as string]: p.bodyVar }}
            >
              <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-line bg-surface-2 px-5 py-4 md:px-7">
                <span className="tnum font-display text-[13px] font-semibold text-ink-2">
                  Пара {i + 1}
                </span>
                <h2 className="font-display text-[20px] font-semibold tracking-[-.015em] md:text-[23px]">
                  {p.name}
                </h2>
                {p.recommended && (
                  <span className="rounded-pill bg-accent px-2.5 py-1 text-[12px] font-medium text-white">
                    Стоит сейчас
                  </span>
                )}
                <span className="ml-auto text-[13px] text-ink-2">{p.role}</span>
              </header>

              <div className="px-5 py-6 md:px-7 md:py-8">
                {/* Композиция 1 — заголовок */}
                <p className="text-[11px] uppercase tracking-[.09em] text-ink-2">Заголовок</p>
                <p
                  className="mt-2 text-[clamp(28px,5vw,46px)] font-semibold leading-[1.05] tracking-[-.03em]"
                  style={{ fontFamily: 'var(--h)' }}
                >
                  Щебень, песок и грунт — на объект, а не на склад
                </p>
                <p
                  className="mt-3 max-w-[58ch] text-[16px] leading-relaxed text-ink-2"
                  style={{ fontFamily: 'var(--b)' }}
                >
                  Пять групп материалов, 24 позиции в наличии. Считаем стоимость с доставкой
                  на странице — до звонка.
                </p>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {/* Композиция 2 — карточка материала */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[.09em] text-ink-2">
                      Карточка материала
                    </p>
                    <div className="mt-2 rounded-card border border-line bg-surface p-4 shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3
                            className="text-[18px] font-semibold leading-snug tracking-[-.015em]"
                            style={{ fontFamily: 'var(--h)' }}
                          >
                            {SAMPLE.name}
                          </h3>
                          <p className="mt-1 text-[13px] text-ink-2" style={{ fontFamily: 'var(--b)' }}>
                            {SAMPLE.fraction} · {SAMPLE.gost}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-pill border border-accent/30 bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent">
                          В наличии
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
                        {[
                          ['за м³', rub(SAMPLE.pricePerM3)],
                          ['за тонну', rub(pricePerTon(SAMPLE))],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-surface-2 px-3 py-2.5">
                            <div className="text-[11px] uppercase tracking-[.07em] text-ink-2">{l}</div>
                            <div
                              className="tnum mt-0.5 text-[20px] font-semibold leading-none"
                              style={{ fontFamily: 'var(--h)' }}
                            >
                              {v}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p
                        className="tnum mt-3 text-[12px] text-ink-2"
                        style={{ fontFamily: 'var(--b)' }}
                      >
                        Марка {SAMPLE.strength} · Морозостойкость {SAMPLE.frost} · Плотность{' '}
                        {SAMPLE.density} т/м³
                      </p>
                    </div>
                  </div>

                  {/* Композиция 3 — таблица */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[.09em] text-ink-2">
                      Таблица цен, табличные цифры
                    </p>
                    <table className="mt-2 w-full border-collapse text-[14px]">
                      <thead>
                        <tr className="border-b border-line-strong text-left text-[12px] uppercase tracking-[.06em] text-ink-2">
                          <th className="py-2 font-medium" style={{ fontFamily: 'var(--b)' }}>
                            Позиция
                          </th>
                          <th className="py-2 text-right font-medium" style={{ fontFamily: 'var(--b)' }}>
                            ₽/м³
                          </th>
                          <th className="py-2 text-right font-medium" style={{ fontFamily: 'var(--b)' }}>
                            ₽/т
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE.map((m) => (
                          <tr key={m.id} className="border-b border-line">
                            <td className="py-2 pr-3" style={{ fontFamily: 'var(--b)' }}>
                              {m.kind}, {m.fraction}
                            </td>
                            <td
                              className="tnum py-2 text-right font-medium"
                              style={{ fontFamily: 'var(--h)' }}
                            >
                              {rub(m.pricePerM3)}
                            </td>
                            <td
                              className="tnum py-2 text-right font-medium"
                              style={{ fontFamily: 'var(--h)' }}
                            >
                              {rub(pricePerTon(m))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Проверка по бинарнику */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {p.checks.map((c) => (
                    <CheckCard key={c.file} c={c} />
                  ))}
                </div>

                <p
                  className="mt-6 max-w-[76ch] text-[15px] leading-relaxed"
                  style={{ fontFamily: 'var(--b)' }}
                >
                  {p.rationale}
                </p>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-card border border-line bg-surface p-5 md:mt-16 md:p-7">
          <h2 className="font-display text-[20px] font-semibold tracking-[-.015em]">
            Кого проверка отсеяла
          </h2>
          <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-ink-2">
            Эти кандидаты выглядели уместно, но не прошли по бинарнику. На сайте, где колонка
            цен обязана стоять ровно, отсутствие табличных цифр — не мелочь: строка «2 450 ₽»
            и строка «1 210 ₽» будут разной ширины, и глаз перестанет сравнивать их вертикально.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {report
              .filter((r) => !r.verdict)
              .map((r) => (
                <li key={r.file} className="rounded-card border border-warn/25 bg-warn-soft p-4">
                  <p className="font-display text-[16px] font-semibold">{r.family}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink">
                    {!r.cyrillicUpper
                      ? 'Кириллицы нет вообще — в cmap только латиница.'
                      : 'Нет фичи tnum, ширины цифр разные.'}
                  </p>
                  <p className="tnum mt-2 text-[12px] text-ink-2">
                    Ширины цифр: {r.digitWidths.length} разных значения
                  </p>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function CheckCard({ c }: { c: Row }) {
  const tabular = c.uniformDigitWidths || c.numericFeatures.includes('tnum');
  return (
    <div className="rounded-card border border-line bg-surface-2 p-4">
      <p className="font-display text-[15px] font-semibold">{c.family}</p>
      <dl className="tnum mt-2 space-y-1 text-[13px]">
        <Fact term="Глифов в cmap" value={String(c.glyphs)} />
        <Fact term="Кириллица А–Я, а–я, Ё" value={c.cyrillicUpper && c.cyrillicLower ? 'полная' : 'неполная'} ok={c.cyrillicUpper && c.cyrillicLower} />
        <Fact
          term="Табличные цифры"
          value={
            c.uniformDigitWidths ? 'по умолчанию' : c.numericFeatures.includes('tnum') ? 'фича tnum' : 'нет'
          }
          ok={tabular}
        />
        <Fact term="₽ и №" value={c.missingService.length === 0 ? 'есть' : 'частично'} ok={c.missingService.length === 0} />
        {c.axes.length > 0 && (
          <Fact term="Оси" value={c.axes.map((a) => `${a.tag} ${a.min}–${a.max}`).join(', ')} />
        )}
      </dl>
    </div>
  );
}

function Fact({ term, value, ok }: { term: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-2">{term}</dt>
      <dd className={`text-right font-medium ${ok === false ? 'text-warn' : ''}`}>{value}</dd>
    </div>
  );
}
