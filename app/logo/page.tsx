import type { Metadata } from 'next';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { MarkSkol, type MarkProps } from './marks';

export const metadata: Metadata = {
  title: 'Знак: варианты для логотипа',
  description:
    'Служебная страница выбора: девять вариантов графического знака, каждый в пяти состояниях — крупно, аватаркой, в шапке, рядом со словом и в негативе.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

type Variant = {
  id: string;
  name: string;
  /** Одной строкой — то же, что уходит в отчёт. */
  tagline: string;
  Mark: ComponentType<MarkProps>;
  idea: string;
  strong: string;
  /** Обязательное поле: вариант без названного слабого места не показываем. */
  weak: string;
};

const VARIANTS: Variant[] = [
  {
    id: 'skol',
    name: 'Скол',
    tagline: 'Кусок породы с отбитой гранью: восьмигранник, срезанный вдвое глубже.',
    Mark: MarkSkol,
    idea: 'Форма камня, доведённая до правильного многоугольника: восьмигранник, у которого одна фаска срезана вдвое глубже остальных. Шесть фасок по 10, седьмая — 20, все до одного углы кратны 45°, поэтому отбитая грань лежит в той же сетке, что и целые, и фигура читается не как обвод фотографии, а как чертёж. Это единственный знак, который говорит сразу про щебень, песок и грунт: они все — порода до сортировки.',
    strong: 'Сплошное пятно без единого просвета — самый твёрдый из девяти на маленьком размере и на печати в одну краску: ему нечему слипнуться и нечему пропасть. Асимметрия даёт силуэту примету, по которой знак отличается от правильного восьмиугольника, и в негативе она читается так же ясно, как в позитиве.',
    weak: 'Тяжесть и немота. Рядом со словом это самое чёрное пятно на всей шапке, и вес придётся снимать размером, то есть знак станет мельче слова. А при 24 px от него остаётся тёмный многоугольник со срезанным углом — примета есть, но она не рассказывает ничего: «скол» тут читается только после того, как его назвали. Плюс масса смещена влево-вниз, и в квадрате аватарки знак приходится сдвигать на глаз.',
  },
];

/** Подпись под каждым состоянием: одинаковая у всех вариантов. */
function StateLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[12px] leading-snug text-ink-2">{children}</p>;
}

function VariantCard({ v, index }: { v: Variant; index: number }) {
  const { Mark } = v;
  return (
    <section className="mt-9 rounded-card border border-line bg-surface p-5 shadow-card md:mt-12 md:p-8">
      <header className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <h2 className="flex gap-3 text-t3 font-black leading-none tracking-[-.02em]">
          <span className="text-ink-3">{index + 1}</span>
          {v.name}
        </h2>
        <p className="max-w-[52ch] text-[15px] leading-snug text-ink-2">{v.tagline}</p>
      </header>

      {/* Пять состояний, одинаковых у всех вариантов. Крупное стоит отдельной
          колонкой, четыре проверочных — сеткой рядом. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
        {/* 1. Крупно, 240 px, тёмным по светлому. */}
        <div className="rounded-card border border-line bg-surface-2 p-5">
          <div className="flex items-center justify-center">
            <Mark size={240} className="h-auto w-full max-w-[240px] text-ink" />
          </div>
          <StateLabel>Крупно, 240&nbsp;px, тёмным по светлому</StateLabel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 2. Аватарка: знак в скруглённом квадрате 96 px, светлым по тёмному. */}
          <div className="rounded-card border border-line bg-surface-2 p-4">
            <div className="mx-auto inv flex h-24 w-24 items-center justify-center rounded-[20px] bg-surface">
              <Mark size={56} className="text-ink" />
            </div>
            <StateLabel>Аватарка: квадрат 96&nbsp;px, светлым по тёмному</StateLabel>
          </div>

          {/* 3. Мелко, 24 px, рядом с текстом того же кегля — проверка шапки. */}
          <div className="rounded-card border border-line bg-surface-2 p-4">
            <div className="flex h-24 items-center gap-2">
              <Mark size={24} className="shrink-0 text-ink" />
              <span className="text-[24px] leading-none tracking-[-.02em]">Каталог</span>
            </div>
            <StateLabel>Мелко, 24&nbsp;px, рядом с текстом того же кегля</StateLabel>
          </div>

          {/* 4. Лок-ап: рядом со словом в размере шапки сайта (t3, Black). */}
          <div className="rounded-card border border-line bg-surface-2 p-4">
            <div className="flex h-24 items-center gap-2.5">
              <Mark size={28} className="shrink-0 text-ink" />
              <span className="text-t3 font-black leading-none tracking-[-.02em]">ЭЛЕМЕНТ</span>
            </div>
            <StateLabel>Рядом со словом, кегль шапки сайта</StateLabel>
          </div>

          {/* 5. Негатив: светлым по тёмному, 96 px. */}
          <div className="inv rounded-card border border-line bg-surface p-4">
            <div className="flex h-24 items-center justify-center">
              <Mark size={96} className="text-ink" />
            </div>
            <StateLabel>Негатив: светлым по тёмному, 96&nbsp;px</StateLabel>
          </div>
        </div>
      </div>

      <p className="mt-7 max-w-[70ch] border-t border-line pt-6 text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
        {v.idea}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <h3 className="text-[14px] font-semibold">Чем хорош</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{v.strong}</p>
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-warn">Слабое место</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{v.weak}</p>
        </div>
      </div>
    </section>
  );
}

export default function LogoPage() {
  return (
    <div>
      {/* Шапка сайта — плавающая пилюля поверх содержимого, её нижняя кромка на
          70 px. Верхнее поле поднято до 96 и 112, иначе она накрывает крошку. */}
      <div className="shell py-8 pt-24 md:py-14 md:pt-28">
        <p className="text-[13px] text-ink-2">
          <Link href="/" className="rounded hover:text-accent">
            ← На главную
          </Link>
        </p>

        <h1 className="mt-5 max-w-[20ch] font-black text-[clamp(30px,5vw,46px)] leading-[1.06] tracking-[-.025em]">
          Знак: выбран «Скол»
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта пока стоит слово — знак туда не ставится, пока не собран
          логотип целиком.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Выбор сделан: из девяти вариантов взят «Скол». Остальные восемь со страницы убраны —
          витрина свою работу выполнила, а держать отклонённое рядом с выбранным значит каждый
          раз выбирать заново. Их геометрия и разбор остались в истории репозитория.
        </p>

        {VARIANTS.map((v, i) => (
          <VariantCard key={v.id} v={v} index={i} />
        ))}

        <section className="mt-12 rounded-card border border-line-strong border-dashed bg-surface p-5 shadow-card md:mt-16 md:p-8">
          <h2 className="text-t3 font-black leading-none tracking-[-.02em]">Что дальше</h2>
          <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
            Знак выбран, логотипа ещё нет. Логотип — это знак плюс слово ЭЛЕМЕНТ, связанные между
            собой: пока это два объекта по соседству, и видно, что их собрали, а не нарисовали.
            Следующий шаг — лок-апы.
          </p>
        </section>
      </div>
    </div>
  );
}
