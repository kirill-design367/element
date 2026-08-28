import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCKUPS, MARK, METRICS, type Art } from './lockups';

export const metadata: Metadata = {
  title: 'Логотип: лок-апы на знаке «Скол»',
  description:
    'Служебная страница выбора: одиннадцать вариантов логотипа — знак «Скол» плюс слово ЭЛЕМЕНТ, связанные между собой. Каждый в шести состояниях и в двух наборах.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

/** Кегль шапки сайта: t3 = 21 px, Black. Высота прописных в нём — 14,28 px. */
const HEADER_CAP = (21 * METRICS.cap) / METRICS.upem;

type Variant = {
  id: keyof typeof LOCKUPS;
  no: number;
  name: string;
  /** Одной строкой — то же, что уходит в отчёт. */
  tagline: string;
  done: string;
  strong: string;
  /** Обязательное поле: вариант без названного слабого места не показываем. */
  weak: string;
};

type Direction = { title: string; brief: string; variants: Variant[] };

const DIRECTIONS: Direction[] = [
  {
    title: 'Общая фаска',
    brief:
      'Срез скола под 45° повторяется в самом слове: у букв срезаны углы тем же углом и на ту же глубину. Слово переведено в кривые, срез вырезан из контура буквы — это не накладка поверх набора.',
    variants: [
      {
        id: 'faska-krajnie',
        no: 1,
        name: 'Только крайние',
        tagline: 'Срезаны Э и Т — первая и последняя буквы, на четверть высоты.',
        done: 'Знак стоит слева, слово справа. У Э срезано верхнее левое плечо, у Т — верхний правый угол. Срез — одна и та же полуплоскость под 45°, та же операция, что режет угол самого знака: угол физически не может разойтись между буквами, он записан в коде один раз. Глубина — четверть высоты прописных, 170 единиц из 680; в строчном наборе четверть высоты строчных, 124 из 495. Оба числа взяты из таблицы OS/2 шрифта.',
        strong:
          'Двух срезов хватает, чтобы знак и слово читались одной системой: фаска знака и фаска Т стоят по диагонали блока и замыкают его. Слово при этом остаётся словом — ни одна буква не потеряла узнаваемость, набор читается с любого размера.',
        weak: 'Э. У неё нет прямого угла, срез идёт по круглому плечу, и на мелком размере он читается не фаской, а обрезкой — будто букву подрезали при выводе. И между знаком и словом остаётся отбивка: это по-прежнему два объекта, просто с общим приёмом.',
      },
      {
        id: 'faska-s-e',
        no: 2,
        name: 'Крайние плюс Е',
        tagline: 'Добавлены обе Е; глубина уменьшена до шестой части высоты.',
        done: 'То же, плюс верхний правый угол у обеих Е. Глубина опущена до шестой части высоты — 113 единиц у прописных, 82,5 у строчных: срезов стало вчетверо больше, и на прежней глубине они съедали бы слово. В строчном наборе е круглые, прямого угла у них нет, и среза они не получают.',
        strong:
          'Приём перестаёт быть случайностью на двух буквах и становится правилом: четыре одинаковые фаски вдоль строки задают ритм, и глаз читает их как признак гарнитуры, а не как правку.',
        weak: 'В наборе «Элемент» правило рвётся: обе е круглые, срезать у них нечего, и от «крайних плюс Е» остаются только крайние. Два набора перестают быть одним лок-апом — прописной живёт по одному правилу, строчный по другому.',
      },
      {
        id: 'faska-vse',
        no: 3,
        name: 'Все буквы с прямыми углами',
        tagline: 'Срезан верхний правый угол у каждой прямоугольной буквы, на восьмую.',
        done: 'Верхний правый угол срезан у Л, Е, М, Е, Н, Т — у каждой буквы, у которой этот угол прямой. В строчном наборе это л, м, н, т. Э и е не тронуты: у круглых букв прямого угла нет, и придумывать его нечестно. Глубина — восьмая часть высоты, 85 единиц у прописных и 62 у строчных.',
        strong:
          'Самый цельный из трёх. Одинаковая фаска на шести буквах читается как рисунок гарнитуры, а не как правка двух букв: слово выглядит нарисованным под знак, а не подогнанным к нему задним числом.',
        weak: 'Э остаётся единственной нетронутой буквой — и это первая буква, с которой начинается чтение. И на 20 px фаска в 85 единиц (это 2,5% высоты строки) исчезает первой: мелкая версия возвращается к обычному набору, то есть связь со знаком там пропадает совсем.',
      },
    ],
  },
  {
    title: 'Скол как контейнер',
    brief:
      'Скол становится плашкой, Э внутри — вывороткой. Заливка одна, буква это дырка. Получается монограмма, работающая отдельно от слова; полная версия — монограмма плюс слово справа.',
    variants: [
      {
        id: 'mono-centr',
        no: 4,
        name: 'Э по центру',
        tagline: 'Буква в геометрическом центре плашки, высота 0,52 от фигуры.',
        done: 'Скол стал плашкой, Э вырезана в ней вывороткой — одна заливка с правилом чётности, буква это дырка, а не второй объект поверх. Высота Э — 0,52 высоты фигуры; центр буквы совпадает с геометрическим центром плашки.',
        strong:
          'Единственное направление, где есть настоящая компактная форма. В квадрате аватарки монограмма садится без потерь, и на 20 px она читается тогда, когда слово уже не читается.',
        weak: 'Э сказана дважды — в монограмме и первой буквой слова, а в наборе «Элемент» это заметно вдвойне. И геометрический центр восьмигранника со срезанным углом — не оптический: буква кажется сдвинутой вверх и влево, хотя стоит ровно по центру.',
      },
      {
        id: 'mono-gran',
        no: 5,
        name: 'Э по срезанной грани',
        tagline: 'Буква прижата к глубокой фаске на посчитанное расстояние.',
        done: 'То же, но буква прижата к глубокой фаске. Линия среза в координатах фигуры — x + y = 1,5 высоты прописных; буква поставлена так, чтобы её самая дальняя точка отстояла от этой линии ровно на 0,10 высоты по нормали. Смещение считается от линии, а не подбирается на глаз.',
        strong:
          'Связь буквы со срезом перестаёт быть случайной: видно, что Э стоит вдоль грани, а не просто внутри восьмиугольника. Оптически буква садится ровнее, чем по геометрическому центру.',
        weak: 'Снизу слева образуется пустой угол, которого нет сверху справа: монограмма перестаёт быть симметричной ни по одной оси. В негативе этот пустой угол читается как скол самой буквы, то есть приём начинает спорить сам с собой.',
      },
      {
        id: 'mono-naskvoz',
        no: 6,
        name: 'Э насквозь',
        tagline: 'Буква режет плашку: слева её контур разомкнут.',
        done: 'Э увеличена до 0,72 высоты фигуры и сдвинута так, что её левый край выходит за вертикальную грань плашки на 0,09 высоты. Буква режет плашку насквозь — слева контур разомкнут, заливки внутри буквы нет вовсе.',
        strong:
          'Буква и плашка перестают быть вложенными объектами: это одна фигура с одним разрезом. Из трёх монограмм эта дальше всех от «иконки с буквой внутри» — то есть от того, чем сегодня выглядит любой квадратный логотип.',
        weak: 'Разомкнутый слева контур на мелком размере читается как брак печати — будто плашка не пропечаталась с одной стороны. И в квадрате аватарки разрыв упирается в край квадрата: монограмма теряет охранное поле именно там, где оно нужнее всего.',
      },
    ],
  },
  {
    title: 'Скол на месте буквы',
    brief:
      'Первая Е заменяется знаком. Масштаб только равномерный: подгонка «под ширину и высоту» отдельно по осям превращает 45° в произвольный угол, а угол на всём логотипе один.',
    variants: [
      {
        id: 'bukva-vysota',
        no: 7,
        name: 'По высоте буквы',
        tagline: 'Знак ростом с букву: 680 единиц у прописной Е, 515 у строчной.',
        done: 'Первая Е заменена знаком. Высота знака равна высоте буквы — 680 единиц у прописной Е, 515 у строчной е вместе с выносом круглой формы. Соседние буквы раздвинуты на разницу ширин, чтобы набор не слипся. Неравномерная подгонка отвергнута сразу: она превращает 45° в произвольный угол.',
        strong:
          'Знак и слово перестают быть двумя объектами буквально: знак внутри слова, отбивки между ними нет вовсе. Это единственное направление, где лок-ап не распадается на «знак и слово» — распадаться нечему.',
        weak: 'Слово перестаёт читаться. Восьмигранник шире Е и не похож ни на одну букву, поэтому глаз видит «ЭЛ», паузу и «МЕНТ». На мелком размере это уже не слово, а «ЭЛ» с точкой посередине.',
      },
      {
        id: 'bukva-shirina',
        no: 8,
        name: 'По ширине буквы',
        tagline: 'Знак ростом с ширину буквы, посажен на базовую линию.',
        done: 'То же, но высота знака равна ширине буквы — 498 единиц у прописной Е, 460 у строчной е, — и знак садится на базовую линию, а не висит по центру блока. Знак получается заметно ниже строки.',
        strong:
          'Ширина строки почти не растёт, набор остаётся набором. Общая с буквами базовая линия делает знак частью строки: он меньше похож на разделитель, чем при посадке по центру блока.',
        weak: 'Знак ниже строки, и в ней появляется провал — читается «ЭЛ мент» с выпавшей буквой. И та же беда, что у соседнего варианта: восьмигранник не читается как Е ни при каком размере, сколько его ни сажай на линию.',
      },
    ],
  },
];

const SETS = [
  { key: 'caps' as const, label: 'Прописными: ЭЛЕМЕНТ' },
  { key: 'mixed' as const, label: 'Как в шапке сайта: Элемент' },
];

/** Ссылка на путь в общем наборе. Пути объявлены один раз — см. defs ниже. */
function ref(id: string, set: string, kind: 'full' | 'compact') {
  return `lk-${id}-${set}-${kind}`;
}

/** Отрисовка готового пути. Размер задаётся снаружи, цвет наследуется. */
function Draw({ art, href, style, className }: {
  art: Art; href: string; style?: React.CSSProperties; className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${art.w} ${art.h}`}
      style={style}
      className={className}
      aria-hidden
      focusable="false"
    >
      <use href={`#${href}`} />
    </svg>
  );
}

/** Клетка состояния с подписью — одинаковая у всех вариантов. */
function Cell({ label, dark, children }: {
  label: string; dark?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 rounded-card border border-line p-4 ${dark ? 'inv bg-surface' : 'bg-surface-2'}`}>
      <div className="flex h-24 items-center justify-center">{children}</div>
      <p className="mt-3 text-[12px] leading-snug text-ink-2">{label}</p>
    </div>
  );
}

/** Пять состояний одного набора слова. Шестое — знак — общее у набора. */
function SetStates({ v, set }: { v: Variant; set: 'caps' | 'mixed' }) {
  const lk = LOCKUPS[v.id][set];
  const full = lk.full;
  const square = lk.compact ?? full;
  const squareRef = ref(v.id, set, lk.compact ? 'compact' : 'full');
  const fullRef = ref(v.id, set, 'full');
  /* Крупно — по ширине колонки, но не крупнее, чем даёт высота прописных
     в 104 px: иначе двухстрочные варианты вырастают вдвое против однострочных
     и сравнивать их становится нечем. */
  const bigMax = (104 * full.w) / full.cap;
  const headerH = (HEADER_CAP * full.h) / full.cap;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* min-w-0 обязателен: элемент сетки по умолчанию не уже своего
          min-content, а внутри второй клетки лежит пилюля шапки в натуральную
          величину — без этого она распирала страницу на 242 px при 390. */}
      <div className="grid min-w-0 gap-4">
        <div className="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">
          <div className="flex items-center justify-center">
            <Draw art={full} href={fullRef} className="h-auto w-full"
              style={{ maxWidth: `${Math.round(bigMax)}px` }} />
          </div>
          <p className="mt-3 text-[12px] leading-snug text-ink-2">1. Крупно, во всю ширину колонки</p>
        </div>

        {/* 2. Геометрия шапки в натуральную величину: пилюля 60 px, лок-ап
            по высоте прописных 14,28 px, соседи — настоящие пункты меню. */}
        <div className="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">
          <div className="min-w-0 overflow-x-auto" data-lenis-prevent>
            <div className="flex h-[60px] min-w-[520px] items-center gap-5 rounded-pill border border-line bg-surface px-5">
              <Draw art={full} href={fullRef} className="shrink-0"
                style={{ height: `${headerH.toFixed(2)}px`, width: `${(headerH * full.w / full.h).toFixed(2)}px` }} />
              <ul className="flex items-center gap-4 text-t2 text-ink">
                <li>Каталог</li>
                <li>Расчёт</li>
                <li>Условия</li>
              </ul>
              <span className="ml-auto whitespace-nowrap text-t2 font-semibold">
                +7&nbsp;(930)&nbsp;160-78-78
              </span>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-ink-2">
            2. В размере шапки сайта, на её фоне
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Cell label="3. Мелко: высота 20 px — визитка и подпись письма">
          <Draw art={full} href={fullRef}
            style={{ height: '20px', width: `${(20 * full.w / full.h).toFixed(1)}px` }} />
        </Cell>

        <Cell label={lk.compact
          ? '4. Аватарка 96 px: компактная форма'
          : '4. Аватарка 96 px: компактной формы нет — весь лок-ап'}>
          <div className="inv flex h-24 w-24 items-center justify-center rounded-[20px] bg-surface">
            <Draw art={square} href={squareRef} className="max-h-[72px] max-w-[72px]"
              style={{ width: 'auto', height: 'auto', aspectRatio: `${square.w} / ${square.h}` }} />
          </div>
        </Cell>

        <Cell label="5. В негативе, светлым по тёмному" dark>
          <Draw art={full} href={fullRef} className="max-h-[72px] max-w-full"
            style={{ width: 'auto', height: 'auto', aspectRatio: `${full.w} / ${full.h}` }} />
        </Cell>

        <Cell label="6. Только знак, отдельно от слова">
          <Draw
            art={lk.compact ?? MARK}
            href={lk.compact ? squareRef : 'lk-mark'}
            className="max-h-[72px] max-w-[72px]"
            style={{ width: 'auto', height: 'auto', aspectRatio: `${(lk.compact ?? MARK).w} / ${(lk.compact ?? MARK).h}` }}
          />
        </Cell>
      </div>
    </div>
  );
}

function VariantCard({ v }: { v: Variant }) {
  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card md:mt-10 md:p-8">
      <header className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <h3 className="flex gap-3 text-t3 font-black leading-none tracking-[-.02em]">
          <span className="text-ink-3">{v.no}</span>
          {v.name}
        </h3>
        <p className="max-w-[52ch] text-[15px] leading-snug text-ink-2">{v.tagline}</p>
      </header>

      {SETS.map((s) => (
        <div key={s.key} className="mt-6">
          <h4 className="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">
            {s.label}
          </h4>
          <SetStates v={v} set={s.key} />
        </div>
      ))}

      <p className="mt-7 max-w-[70ch] border-t border-line pt-6 text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
        {v.done}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <h4 className="text-[14px] font-semibold">Чем хорош</h4>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{v.strong}</p>
        </div>
        <div>
          <h4 className="text-[14px] font-semibold text-warn">Слабое место</h4>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{v.weak}</p>
        </div>
      </div>
    </section>
  );
}

/** Все пути объявляются здесь по разу, дальше на них ссылается use. */
function Defs() {
  const paths: [string, string][] = [['lk-mark', MARK.d]];
  for (const id of Object.keys(LOCKUPS)) {
    for (const set of ['caps', 'mixed'] as const) {
      const lk = LOCKUPS[id][set];
      paths.push([ref(id, set, 'full'), lk.full.d]);
      if (lk.compact) paths.push([ref(id, set, 'compact'), lk.compact.d]);
    }
  }
  return (
    <svg aria-hidden focusable="false" className="sr-only">
      <defs>
        {paths.map(([id, d]) => (
          <path key={id} id={id} d={d} fill="currentColor" fillRule="evenodd" />
        ))}
      </defs>
    </svg>
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
          Логотип: знак плюс слово
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта пока стоит слово — логотип туда не ставится, пока не выбран.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Знак выбран — «Скол». Задача здесь другая: связать его со словом так, чтобы читалась одна
          система, а не два объекта по соседству. Одиннадцать вариантов по четырём направлениям;
          каждый показан в шести состояниях и в двух наборах слова — прописными и как в шапке.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Слово переведено в кривые прямо из бинарника CoFo&nbsp;Sans&nbsp;Black — с кернингом из
          GPOS и трекингом −0,02&nbsp;em, тем же, что в шапке. Там, где буква срезана, правлен сам
          контур буквы, а не положена накладка поверх. Угол среза везде один, 45°; глубина
          считается от высоты прописных ({METRICS.cap}) и высоты строчных ({METRICS.xHeight}) —
          обе из таблицы OS/2 шрифта, ни одна не подобрана на глаз.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Под каждым вариантом названо слабое место. Это не оговорка для порядка: логотип обязан
          работать и в 20&nbsp;px, и в квадрате аватарки, и в негативе, а такого варианта, который
          хорош во всех трёх ролях сразу, не бывает.
        </p>

        {DIRECTIONS.map((dir, di) => (
          <section key={dir.title} className="mt-12 md:mt-16">
            <h2 className="flex gap-4 text-t4 font-black leading-[1.05] tracking-[-.025em]">
              <span className="text-ink-3">{di + 1}</span>
              {dir.title}
            </h2>
            <p className="mt-4 max-w-[70ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
              {dir.brief}
            </p>
            {dir.variants.map((v) => (
              <VariantCard key={v.id} v={v} />
            ))}
          </section>
        ))}

        <section className="mt-12 rounded-card border border-line-strong border-dashed bg-surface p-5 shadow-card md:mt-16 md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Что дальше</h2>
          <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
            После выбора лок-апа понадобится ещё четыре вещи, и ни одна не выводится из этой
            страницы: охранное поле и минимальный размер; поведение на узком экране — знак один,
            без слова, или слово одно, без знака; отдельный квадратный файл под аватарку в
            мессенджерах; и приведение <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[14px]">app/icon.svg</code> —
            там сейчас свой знак, три полосы слоёв основания, и с выбранным он пока не сходится.
          </p>
          <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
            Отдельно про шрифт: контуры сняты с пробного файла CoFo&nbsp;Sans&nbsp;Black. Логотип —
            это буквы, вынесенные из шрифта навсегда, и до выкладки на боевой домен под них нужна
            купленная лицензия наравне с веб-версией.
          </p>
        </section>
      </div>
    </div>
  );
}
