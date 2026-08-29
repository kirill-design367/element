import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { cofoSans } from '../type';
import report from '@/lib/font-check.json';
import { AVAILABILITY_LABEL, CATEGORIES, fractionLabel, MATERIALS, type Material, POSITIONS_TOTAL, priceFrom, pricePerM3 } from '@/lib/catalog';
import { calculate } from '@/lib/pricing';
import { num, plural, rub, typo, rubOr } from '@/lib/format';
import { FLEET_LEAD } from '@/lib/fleet-numbers';

export const metadata: Metadata = {
  title: 'Типографика: что выбрано и почему',
  description:
    'Гарнитуры сайта и два кандидата, которые не прошли, на реальных кусках лендинга и каталога. Кириллица и табличные цифры проверены по таблице cmap в бинарнике.',
  /* Страница служебная: открывается прямым адресом, ссылок на неё нет нигде.
     В выдачу ей не надо — как и витрине логотипа. Тот же запрет продублирован
     в robots.txt: мета-тег работает после скачивания, robots — до. */
  robots: { index: false, follow: false },
};

/**
 * Кандидаты подключаются ТОЛЬКО здесь. На лендинге и в каталоге стоит боевая
 * пара из app/type.ts, и до решения заказчика она не меняется.
 *
 * preload выключен намеренно: это страница сравнения, шесть приоритетных
 * запросов за шрифтами отобрали бы полосу у того, что человек читает первым.
 */
const golos = localFont({
  src: [{ path: '../../assets/fonts/GolosText.woff2', weight: '400 900', style: 'normal' }],
  display: 'swap',
  preload: false,
});

const unbounded = localFont({
  src: [{ path: '../../assets/fonts/Unbounded.woff2', weight: '200 900', style: 'normal' }],
  display: 'swap',
  preload: false,
});

const tektur = localFont({
  src: [{ path: '../../assets/fonts/Tektur.woff2', weight: '400 900', style: 'normal' }],
  display: 'swap',
  preload: false,
});

type Row = (typeof report)[number];
/* Строки отчёта тоже не берутся жёстко: нет строки — нет и её колонки, а не
   падение сборки. Отчёт собирает scripts/verify-fonts.py, и список файлов в
   нём меняется вместе со списком кандидатов. */
const byFile = (...files: string[]): Row[] =>
  files.map((f) => report.find((r) => r.file === f)).filter((r): r is Row => !!r);

/**
 * Данные для композиций берутся из тех же файлов, что и боевые страницы.
 *
 * Ни одна запись не берётся жёстко по идентификатору с восклицательным
 * знаком. Раньше стояло три таких обращения — позиция «granit-20-40», цифра
 * парка «та, у которой единица м³» и расчёт по ним, — и удаление любой из
 * записей роняло сборку ВСЕГО сайта, включая лендинг и каталог, ради
 * служебной страницы сравнения шрифтов.
 *
 * Теперь у каждой есть запасной путь, а если и он пуст — композиция просто
 * не рисуется. Пустое место вместо падения.
 */
const SAMPLE: Material | undefined =
  MATERIALS.find((m) => m.id === 'granit-20-40') ??
  /* Запасной образец: любая позиция, у которой есть всё, что показывает
     карточка, — цена, плотность и ГОСТ. */
  MATERIALS.find((m) => m.pricePerTon !== null && m.density !== undefined && m.gost) ??
  MATERIALS[0];
const FLEET_PEAK = FLEET_LEAD;
const CALC = SAMPLE
  ? calculate({ materialId: SAMPLE.id, amount: 20, unit: 'm3' })
  : null;

interface Pair {
  id: string;
  name: string;
  /** Роли: кто набирает заголовки и числа, кто — интерфейс. */
  role: string;
  heading: string;
  body: string;
  /** Ось ширины: заголовок поджимается, если гарнитура это умеет. */
  headingStretch?: string;
  license: string;
  price: string;
  buyLabel: string;
  buyHref: string;
  /** Набрано подменой: настоящего файла нет, оценивать можно только пропорции. */
  substitute?: string;
  checks: Row[];
  why: string;
  weak: string;
  baseline?: boolean;
}

const PAIRS: Pair[] = [
  {
    id: 'unbounded-golos',
    name: 'Unbounded + Golos Text',
    role: 'Заголовки и числа — Unbounded. Интерфейс и текст — Golos Text.',
    heading: unbounded.style.fontFamily,
    body: golos.style.fontFamily,
    license: 'Обе — SIL Open Font License 1.1',
    price: 'Бесплатно, в том числе в коммерческом проекте',
    buyLabel: 'Unbounded и Golos Text на Google Fonts',
    buyHref: 'https://fonts.google.com/specimen/Unbounded',
    checks: byFile('Unbounded.ttf', 'GolosText.ttf'),
    why: 'Единственная из трёх, у которой цифра выглядит дорого. Unbounded построен на круге: у нуля, восьмёрки и шестёрки почти идеальные овалы, окончания срезаны горизонтально, и на кегле 120 пикселей «1 800» читается как выбитая в металле цифра, а не как набранный текст. Для сайта, где число — главный товар, это ровно то, что нужно: итог калькулятора и цифры парка получают вес, которого у нынешней пары нет. Ж, Ф и Щ нарисованы строго геометрически, без каллиграфических хвостов, так что заголовок остаётся деловым. Рядом Golos Text от «Паратайпа» — русская гарнитура, нарисованная под русский текст, а не адаптированная с латиницы: ритм абзаца ровный, шесть начертаний закрывают и подписи, и акценты, табличные цифры на месте.',
    weak: 'Unbounded широкий, и это стоит строк. В одной и той же колонке 780 пикселей заголовок первого экрана занимает у него три строки против двух у нынешней пары, а на телефоне — четыре против трёх. Первый экран становится длиннее, а кнопка «Запросить прайс» уезжает ниже: для сайта, где путь до просчёта меряют в действиях, это плата, которую надо признать. Файл тоже самый тяжёлый из проверенных: 60 КБ против 20–38 у остальных. И это не русская словолитня — кириллицу рисовало британское бюро NaN, она грамотная, но не родная.',
  },
  {
    id: 'tektur-golos',
    name: 'Tektur + Golos Text',
    role: 'Заголовки и числа — Tektur, с живой осью ширины. Интерфейс и текст — Golos Text.',
    heading: tektur.style.fontFamily,
    body: golos.style.fontFamily,
    headingStretch: '82%',
    license: 'Обе — SIL Open Font License 1.1',
    price: 'Бесплатно, в том числе в коммерческом проекте',
    buyLabel: 'Tektur и Golos Text на Google Fonts',
    buyHref: 'https://fonts.google.com/specimen/Tektur',
    checks: byFile('Tektur.ttf', 'GolosText.ttf'),
    why: 'Прямая ставка на характер отрасли. Tektur построен на прямоугольнике со срезанными углами — так рисуют шильдики на технике и трафареты на бортах самосвалов. У него единственного из проверенных есть перечёркнутый ноль (фича zero), а это ровно то, чем инженерная документация отличается от рекламной: ноль нельзя спутать с буквой «о» в марке прочности М1000. Живая ось ширины 75–100 решает главную беду русских заголовков. В колонке 780 пикселей заголовок первого экрана занимает две строки; на телефоне, в колонке 282 пикселя, поджатый до 82 процентов Tektur встаёт в две строки против трёх у самого себя при обычной ширине. На первом экране это выигранный экран прокрутки. Golos Text рядом работает молча: русская гарнитура «Паратайпа» с ровным ритмом абзаца и табличными цифрами.',
    weak: 'Квадратная основа тянет за собой ассоциацию с игровым интерфейсом и киберспортом — на грани, за которой B2B-поставщик начинает выглядеть несерьёзно. Кириллицу рисовал поляк Адам Ягош, она корректна, но Щ и Ж в квадратном скелете получаются заметно тяжелее остальных букв, и в крупном кегле заголовок местами комкается. Розничный покупатель, который просто строит дом, может прочитать это как «сложно и не для меня».',
  },
  {
    id: 'cofo-sans',
    name: 'CoFo Sans + CoFo Sans Mono',
    role: 'Принято и стоит на сайте. Sans — заголовки, интерфейс, текст и числа, Mono — только маркировка.',
    heading: 'var(--font-text)',
    body: 'var(--font-text)',
    license: 'Коммерческая лицензия Contrast Foundry (десктоп, веб, приложение — раздельно)',
    price: 'Файлы пробные (Trial). Для боевой выкладки нужна купленная веб-лицензия',
    buyLabel: 'CoFo Sans в Contrast Foundry',
    buyHref: 'https://contrastfoundry.com/ru/typeface/cofo-sans',
    checks: byFile('CoFoSans-Regular-Trial.otf', 'CoFoSansMono-Regular-Trial.otf'),
    baseline: true,
    why: 'Единственный вариант от русской словолитни в списке. Contrast Foundry — московское бюро, которое рисует кириллицу первой, а не подгоняет её под готовую латиницу, и CoFo Sans задуман как рациональный гротеск с характером: формы простые, но не безличные. Семь начертаний закрывают всё — от подписи под фракцией до заголовка первого экрана, — а одна семья на обе роли означает одну лицензию, один ритм и одинаковые цифры в заголовке и в таблице цен. Для прайса это важнее, чем кажется: когда «2 450 ₽» в карточке и «2 450 ₽» в калькуляторе набраны разными гарнитурами, глаз каждый раз перенастраивается.',
    weak: 'Платная, и файлы пока пробные: рисунок тот же, права на боевую публикацию нет — до выкладки нужна купленная веб-лицензия. Три гарнитуры вместо двух весят 103 КБ против 59 у прежней пары, и это плата за роль моноширинного. Peshka узкая и очень тяжёлая: мелким кеглем ей нельзя набрать ничего, на 15 пикселях она становится чёрной полосой — поэтому в интерфейсе её нет вовсе, только заголовки блоков и крупные числа.',
  },
];

export default function FontsPage() {
  return (
    <div>
      <div className="shell py-8 md:py-14">
        <p className="text-[13px] text-ink-2">
          <Link href="/" className="rounded hover:text-accent">
            ← На главную
          </Link>
        </p>

        <h1 className="mt-5 max-w-[20ch] font-black text-[clamp(30px,5vw,46px)] font-semibold leading-[1.06] tracking-[-.025em]">
          Типографика: что выбрано и почему
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница: ссылки на неё в подвале нет. Каждая пара набрана
          настоящими кусками сайта — тот же заголовок, те же цены из{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[14px]">lib/catalog.ts</code>, тот
          же итог калькулятора. Композиции одинаковые у всех, чтобы сравнивать было честно.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Выбран третий вариант — две гарнитуры CoFo от Contrast Foundry: CoFo&nbsp;Sans в четырёх
          начертаниях и CoFo&nbsp;Sans&nbsp;Mono на маркировку. Он стоит на сайте и набран здесь
          собой. Первые два оставлены как отвергнутые кандидаты: они грузятся только этим
          маршрутом и в общий бандл не попадают.
        </p>

        <Criteria />

        <div className="mt-12 space-y-12 md:mt-16 md:space-y-16">
          {PAIRS.map((p, i) => (
            <PairSection key={p.id} pair={p} index={i} />
          ))}
        </div>

        <FullTable />
      </div>
    </div>
  );
}

function Criteria() {
  const ITEMS: [string, string][] = [
    ['Кириллица', 'полный диапазон А–Я, а–я и Ё в таблице cmap самого файла, а не в описании на сайте'],
    ['Табличные цифры', 'одинаковая ширина знаков или фича tnum в GSUB — иначе колонка цен пляшет'],
    ['Начертания', 'не меньше пяти у текстовой гарнитуры'],
    ['Крупный кегль', 'заголовочная держит форму на 120 пикселях'],
    ['Рисунок Ж, Ф, Щ', 'нейтральный, без каллиграфических хвостов'],
  ];
  return (
    <section className="mt-9 rounded-card border border-line bg-surface p-5 shadow-card md:mt-12 md:p-7">
      <h2 className="font-black text-[19px] font-semibold md:text-[21px]">По каким критериям отбирал</h2>
      <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {ITEMS.map(([term, value]) => (
          <div key={term} className="border-t border-line pt-2.5">
            <dt className="text-[14px] font-semibold">{term}</dt>
            <dd className="mt-0.5 text-[14px] leading-snug text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
        Проверка — <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">scripts/verify-fonts.py</code>:
        читает cmap, hmtx и GSUB и печатает вердикт. Результат лежит в{' '}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">lib/font-check.json</code> и
        выводится ниже — чтобы описание не разошлось с фактом. Вариант выбран, остаётся купить
        лицензию: файлы в проекте пробные.
      </p>
    </section>
  );
}

function PairSection({ pair, index }: { pair: Pair; index: number }) {
  return (
    <section
      id={pair.id}
      className={`rounded-card border bg-surface p-5 shadow-card md:p-8 ${
        pair.baseline ? 'border-line-strong border-dashed' : 'border-line'
      }`}
    >
      <header className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="max-w-[52ch]">
          <p className="text-[12px] uppercase tracking-[.08em] text-ink-2">
            {pair.baseline ? 'Принято, стоит на сайте' : `Отвергнутый кандидат ${index + 1}`}
          </p>
          <h2 className="mt-1.5 font-black text-[24px] font-semibold tracking-[-.02em] md:text-[28px]">
            {pair.name}
          </h2>
          <p className="mt-2 text-[15px] leading-snug text-ink-2">{pair.role}</p>
        </div>
        <div className="shrink-0 md:max-w-[38ch] md:text-right">
          <p className="text-[14px] font-medium">{pair.license}</p>
          <p className="mt-1 text-[14px] text-ink-2">{pair.price}</p>
          {/* Ссылка ведёт наружу — в новую вкладку: страница сравнения нужна
              открытой, пока смотришь словолитню. */}
          <a
            href={pair.buyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded text-[14px] text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {pair.buyLabel}
          </a>
        </div>
      </header>

      {pair.substitute && (
        <p className="mt-6 rounded-card border border-warn/30 bg-warn-soft px-4 py-3 text-[14px] leading-snug text-warn">
          <strong className="font-semibold">Набрано подменой.</strong> Настоящего файла {pair.name} в
          проекте нет — гарнитура платная. Ниже всё набрано шрифтом {pair.substitute}: он того же
          класса и близок по пропорциям, но это не {pair.name}. Оценивайте плотность и композицию,
          не рисунок букв.
        </p>
      )}

      <Specimen pair={pair} />

      <div className="mt-8 grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-10">
        <div>
          <h3 className="text-[14px] font-semibold">Почему эта пара</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{pair.why}</p>
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-warn">Слабое место</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{pair.weak}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {pair.checks.map((c) => (
          <CheckCard key={c.file} c={c} />
        ))}
      </div>
    </section>
  );
}

/**
 * Пять композиций, одинаковых у всех пар. Заголовочная и текстовая гарнитуры
 * приходят строкой семейства — так одна и та же разметка набирается четырьмя
 * парами без единой копии.
 */
function Specimen({ pair }: { pair: Pair }) {
  const head = { fontFamily: pair.heading, fontStretch: pair.headingStretch };
  const body = { fontFamily: pair.body };

  return (
    <div className="mt-6 space-y-4">
      {/* 1 — H1 лендинга на финальном кегле */}
      <Composition n="1" title="Заголовок первого экрана">
        {/* Ширина колонки одна и та же у всех пар и задана в пикселях: в `ch`
            каждая гарнитура мерила бы себя своей меркой, и число строк
            перестало бы что-либо значить. */}
        <p
          style={head}
          className="max-w-[780px] text-[clamp(30px,5.4vw,60px)] font-semibold leading-[1.02] tracking-[-.035em]"
        >
          Щебень, песок и грунт&nbsp;— <span className="text-accent">на объект</span>, а не на склад
        </p>
      </Composition>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 2 — карточка цен из hero */}
        <Composition n="2" title="Карточка цен на первом экране">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between" style={body}>
              <span style={head} className="text-[13px] font-semibold uppercase tracking-[.08em]">
                Цены на площадке
              </span>
              <span className="text-[12px] text-ink-2">₽/м³, с НДС</span>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span style={body} className="text-[15px]">
                    {c.name}
                  </span>
                  <span style={head} className="tnum text-[16px] font-semibold">
                    от {rubOr(priceFrom(c.id))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Composition>

        {/* 3 — карточка материала из каталога */}
        {SAMPLE && (
        <Composition n="3" title="Карточка материала в каталоге">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              {/* Не заголовок документа, а образец набора: <h4> здесь ломал бы
                  порядок заголовков — до него на странице нет ни одного <h3>. */}
              <p style={head} className="text-[17px] font-semibold leading-snug">
                {SAMPLE.name}
              </p>
              <span
                style={body}
                className="shrink-0 rounded-pill border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-accent"
              >
                {AVAILABILITY_LABEL[SAMPLE.availability]}
              </span>
            </div>
            <p style={body} className="mt-1 text-[13px] text-ink-2">
              {fractionLabel(SAMPLE.fraction)} · {SAMPLE.gost}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
              {(
                [
                  ['За м³', rubOr(pricePerM3(SAMPLE))],
                  ['За тонну', rubOr(SAMPLE.pricePerTon)],
                ] as [string, string][]
              ).map(([term, value]) => (
                <div key={term} className="bg-surface-2 px-3 py-2">
                  <div style={body} className="text-[11px] uppercase tracking-[.06em] text-ink-2">
                    {term}
                  </div>
                  <div style={head} className="tnum text-[19px] font-semibold">
                    {value}
                  </div>
                </div>
              ))}
            </div>
            {SAMPLE.density !== undefined && (
              <p style={body} className="mt-3 text-[13px] text-ink-2">
                Насыпная плотность{' '}
                <span style={head} className="tnum font-semibold text-ink">
                  {String(SAMPLE.density).replace('.', ',')} т/м³
                </span>
              </p>
            )}
          </div>
        </Composition>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 4 — крупное число из «Парк и объёмы» */}
        {FLEET_PEAK && (
        <Composition n="4" title="Цифра из блока «Парк и объёмы»">
          <div className="rounded-card border border-line bg-surface p-5">
            <div
              style={head}
              className="tnum text-[clamp(52px,9vw,92px)] font-semibold leading-none tracking-[-.035em]"
            >
              {num(FLEET_PEAK.value)}
              <span className="ml-2 text-[.36em] font-medium text-ink-2">{FLEET_PEAK.unit}</span>
            </div>
            <p style={body} className="mt-3 text-[15px] font-medium">
              {FLEET_PEAK.label}
            </p>
            <p style={body} className="mt-1 text-[13px] leading-snug text-ink-2">
              {FLEET_PEAK.note}
            </p>
          </div>
        </Composition>
        )}

        {/* 5 — строка калькулятора: итог крупно, разбивка мелко */}
        {CALC && (
        <Composition n="5" title="Итог калькулятора">
          <div className="rounded-card border border-line bg-surface p-5">
            <p style={body} className="text-[13px] text-ink-2">
              {CALC.material.name} · {num(CALC.volumeM3)} м³ · самовывоз
            </p>
            <div
              style={head}
              className="tnum mt-1.5 text-[clamp(40px,7.5vw,72px)] font-semibold leading-none tracking-[-.035em]"
            >
              {rubOr(CALC.materialCost)}
            </div>
            <dl style={body} className="mt-4 space-y-1.5 text-[13px]">
              {(
                [
                  ['Материал', rubOr(CALC.materialCost)],
                  [
                    typo(`Рейсы · ${CALC.truck?.name ?? ''}`),
                    `${CALC.rides} ${plural(CALC.rides, 'рейс', 'рейса', 'рейсов')}`,
                  ],
                  ['Масса', `${num(CALC.massT, 1)} т`],
                ] as [string, string][]
              ).map(([term, value]) => (
                <div key={term} className="flex items-baseline justify-between gap-4 border-b border-line pb-1.5">
                  <dt className="text-ink-2">{term}</dt>
                  <dd style={head} className="tnum shrink-0 font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Composition>
        )}
      </div>
    </div>
  );
}

function Composition({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface-2 p-4 md:p-5">
      <p className="mb-3 text-[11px] uppercase tracking-[.08em] text-ink-2">
        Композиция {n} · {title}
      </p>
      {children}
    </div>
  );
}

function CheckCard({ c }: { c: Row }) {
  const cyr = c.cyrillicUpper && c.cyrillicLower;
  const tab = c.uniformDigitWidths || c.numericFeatures.includes('tnum');
  return (
    <div className="rounded-card border border-line bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[14px] font-semibold">{c.family}</h4>
        <span className={`text-[12px] font-medium ${c.verdict ? 'text-accent' : 'text-warn'}`}>
          {c.verdict ? 'годен' : 'не годен'}
        </span>
      </div>
      <dl className="mt-2 space-y-1">
        <Fact term="Глифов в cmap" value={String(c.glyphs)} />
        <Fact term="Кириллица А–Я, а–я, Ё" value={cyr ? 'полная' : 'неполная'} ok={cyr} />
        <Fact
          term="Табличные цифры"
          value={
            c.uniformDigitWidths
              ? 'по умолчанию, ширины совпадают'
              : c.numericFeatures.includes('tnum')
                ? 'по фиче tnum'
                : 'нет'
          }
          ok={tab}
        />
        <Fact term="₽ и №" value={c.missingService.length === 0 ? 'есть' : 'частично'} ok={c.missingService.length === 0} />
        {c.numericFeatures.length > 0 && (
          <Fact term="Фичи цифр" value={c.numericFeatures.join(', ')} />
        )}
        {c.axes.length > 0 && (
          <Fact term="Оси" value={c.axes.map((a) => `${a.tag} ${a.min}–${a.max}`).join(', ')} />
        )}
      </dl>
    </div>
  );
}

function Fact({ term, value, ok }: { term: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <dt className="text-ink-2">{term}</dt>
      <dd className={`text-right ${ok === false ? 'text-warn' : ''}`}>{value}</dd>
    </div>
  );
}

/** Полная выдача проверки: и то, что взял, и то, что отсеял. */
function FullTable() {
  return (
    <section className="mt-12 rounded-card border border-line bg-surface p-5 shadow-card md:mt-16 md:p-7">
      <h2 className="font-black text-[19px] font-semibold md:text-[21px]">
        Проверка по бинарнику: все {report.length}{' '}
        {plural(report.length, 'файл', 'файла', 'файлов')}
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
        Отсеянные оставлены в таблице нарочно: видно, по какому именно признаку кандидат не прошёл.
        В каталоге сайта {POSITIONS_TOTAL} {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')},
        и колонка цен обязана стоять ровно — гарнитура без табличных цифр не проходит, каким бы
        красивым ни был заголовок.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-strong text-left text-ink-2">
              <th className="py-2 pr-3 font-medium">Гарнитура</th>
              <th className="py-2 pr-3 font-medium">Кириллица</th>
              <th className="py-2 pr-3 font-medium">Цифры</th>
              <th className="py-2 pr-3 font-medium">Ширины цифр</th>
              <th className="py-2 font-medium">Вердикт</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => {
              const cyr = r.cyrillicUpper && r.cyrillicLower;
              return (
                <tr key={r.file} className="border-b border-line">
                  <td className="py-2 pr-3 font-medium">{r.family}</td>
                  <td className={`py-2 pr-3 ${cyr ? '' : 'text-warn'}`}>{cyr ? 'полная' : 'неполная'}</td>
                  <td className="py-2 pr-3">
                    {r.uniformDigitWidths ? 'табличные' : r.numericFeatures.includes('tnum') ? 'tnum' : '—'}
                  </td>
                  <td className="tnum py-2 pr-3 text-ink-2">
                    {r.digitWidths.length === 1 ? `одна, ${r.digitWidths[0]}` : `${r.digitWidths.length} разных`}
                  </td>
                  <td className={`py-2 font-medium ${r.verdict ? 'text-accent' : 'text-warn'}`}>
                    {r.verdict ? 'годен' : 'не годен'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
