import type { Metadata } from 'next';
import Link from 'next/link';
import { METRICS } from './logos';
import { Defs, GROUPS, Logo, VARIANTS, WORD, lookup, type Variant, type WordSet } from './variants';

export const metadata: Metadata = {
  title: 'Логотип: пятнадцать вариантов',
  description:
    'Служебная страница выбора: пятнадцать готовых логотипов «Элемента» по пяти группам, каждый в шести состояниях и в двух наборах слова.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

/** Кегль шапки сайта: t3 = 21 px, Black. Высота прописных в нём — 14,28 px. */
const HEADER_CAP = (21 * METRICS.cap) / METRICS.upem;

const SETS: { key: WordSet; label: string }[] = [
  { key: 'caps', label: `Прописными: ${WORD.caps}` },
  { key: 'mixed', label: `Как в шапке сайта: ${WORD.mixed}` },
];

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

function States({ v, set }: { v: Variant; set: WordSet }) {
  const build = lookup(v.id, set)!;
  const compact = v.compact ? lookup(v.id, 'c')! : null;
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-4">
        {/* 1. Крупно. Потолок по высоте прописных, а не по ширине колонки:
            иначе двухстрочные варианты выросли бы вдвое против однострочных
            и сравнивать их стало бы нечем. */}
        <div className="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">
          <div className="flex items-center justify-center">
            <Logo c={build} cap={104} className="h-auto max-w-full" />
          </div>
          <p className="mt-3 text-[12px] leading-snug text-ink-2">1. Крупно, во всю ширину колонки</p>
        </div>

        {/* 2. Геометрия шапки в натуральную величину: пилюля 60 px, логотип по
            высоте прописных 14,28 px, соседи — настоящие пункты меню. */}
        <div className="min-w-0 rounded-card border border-line bg-surface-2 p-4 md:p-5">
          <div className="min-w-0 overflow-x-auto" data-lenis-prevent>
            <div className="flex h-[60px] min-w-[520px] items-center gap-5 rounded-pill border border-line bg-surface px-5">
              <Logo c={build} cap={HEADER_CAP} className="shrink-0" />
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
          <p className="mt-3 text-[12px] leading-snug text-ink-2">2. В размере шапки сайта</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Cell label="3. Мелко: высота 20 px — проверка на визитку">
          <Logo c={build} height={20} className="h-auto max-w-full" />
        </Cell>

        <Cell label="4. В квадрате аватарки 96 px">
          <div className="inv flex h-24 w-24 items-center justify-center rounded-[20px] bg-surface">
            <Logo c={build} fit={{ w: 72, h: 72 }} />
          </div>
        </Cell>

        <Cell label="5. В негативе, светлым по тёмному" dark>
          <Logo c={build} fit={{ w: 320, h: 64 }} className="h-auto max-w-full" />
        </Cell>

        <Cell label={compact ? '6. Компактная форма отдельно' : '6. Компактной формы нет'}>
          {compact ? (
            <Logo c={compact} fit={{ w: 72, h: 72 }} />
          ) : (
            <span className="text-[13px] text-ink-3">—</span>
          )}
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
        <p className="max-w-[56ch] text-[15px] leading-snug text-ink-2">{v.idea}</p>
      </header>

      {SETS.map((s) => (
        <div key={s.key} className="mt-6">
          <h4 className="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">
            {s.label}
          </h4>
          <States v={v} set={s.key} />
        </div>
      ))}

      <div className="mt-7 grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-10">
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
          Логотип: пятнадцать вариантов
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта стоит слово — логотип туда не ставится, пока не выбран.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Каждый вариант — сразу целый логотип, а не эскиз знака, к которому потом приставили
          слово. Пять групп: знак плюс слово, чистый вордмарк, монограмма, слово в контейнере и
          то, чего в этих четырёх нет. Каждый показан в шести состояниях и в двух наборах слова.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Всё построено в одной системе координат — единицах шрифта при высоте прописных{' '}
          {METRICS.cap}. Любой размер здесь доля от неё, ни одно число не подобрано на глаз.
          Слово, которое не правится, остаётся живым текстом в CoFo&nbsp;Sans&nbsp;Black — той же
          гарнитуре, что набирает шапку; в кривые переведены только те варианты, где буквы режутся
          или выворачиваются из плашки.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Главная проверка — состояние 2: логотип в размере шапки. Примета, которая видна только
          крупно, приметой не считается. Слабое место названо у каждого варианта.
        </p>

        {GROUPS.map((g, gi) => {
          const list = VARIANTS.filter((v) => v.group === g.key);
          if (!list.length) return null;
          return (
            <section key={g.key} className="mt-12 md:mt-16">
              <h2 className="flex gap-4 text-t4 font-black leading-[1.05] tracking-[-.025em]">
                <span className="text-ink-3">{gi + 1}</span>
                {g.title}
              </h2>
              {list.map((v) => (
                <VariantCard key={v.id} v={v} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
