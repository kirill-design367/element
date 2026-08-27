'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, categoryById, categoryName, categorySpecLine, FRACTION_FILTERS, GOST_FILTERS, GROUPS, groupsOf, hasFraction, inFraction, isCategoryId, MATERIALS, POSITIONS_ON_REQUEST, POSITIONS_PRICED, POSITIONS_TOTAL } from '@/lib/catalog';
import { MaterialCard } from './MaterialCard';
import { RequestPanel } from './RequestPanel';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { categorySlot } from '@/lib/assets';
import { useFlipArrival } from '@/components/providers/FlipArrival';
import { captureSource } from '@/lib/flip-store';
import { prefersReducedMotion } from '@/lib/motion';
import { ArrowIcon } from '@/components/site/Icons';
import { ON_REQUEST, plural, typo } from '@/lib/format';
import { PREFILTER_KEYS } from '@/lib/prefilter';

const ALL = 'all';

const KEYS = ['category', 'fraction', 'gost', 'group'] as const;
type Filters = Record<(typeof KEYS)[number], string>;
const EMPTY: Filters = { category: ALL, fraction: ALL, gost: ALL, group: ALL };

function readUrl(): Filters {
  if (typeof window === 'undefined') return EMPTY;
  const sp = new URLSearchParams(window.location.search);
  return {
    /* Значение из адреса проверяется по данным. Неизвестная категория
       («?category=нет-такой») раньше проходила как есть: каталог пустел, ни
       один чип не подсвечивался — даже «Все», — а заголовок продолжал
       обещать 24 позиции. Теперь чужое значение читается как «все». */
    category: valid('category', sp.get('category')),
    fraction: valid('fraction', sp.get('fraction')),
    gost: valid('gost', sp.get('gost')),
    group: valid('group', sp.get('group')),
  };
}

/** Значение из адреса, если оно есть в данных; иначе «все». */
function valid(key: (typeof KEYS)[number], raw: string | null): string {
  if (!raw) return ALL;
  const ok =
    key === 'category'
      ? isCategoryId(raw)
      : key === 'fraction'
        ? FRACTION_FILTERS.some((f) => f.id === raw)
        : key === 'group'
          ? GROUPS.some((g) => g.id === raw)
          : GOST_FILTERS.includes(raw);
  return ok ? raw : ALL;
}

/**
 * Каталог. Фильтры работают без перезагрузки и живут в адресе страницы —
 * ссылку на выборку можно скинуть менеджеру, и он увидит ровно ту же выборку.
 *
 * Начальное состояние намеренно пустое, а не взятое из useSearchParams:
 * при статическом экспорте параметры адреса на сервере неизвестны, и хук
 * заставил бы отдать в HTML пустую заглушку вместо позиций. Здесь в сборку
 * попадает весь каталог до единой карточки, а фильтр из адреса применяется в
 * layout-эффекте — до первой отрисовки, поэтому мигания списка нет.
 */
export function CatalogClient() {
  const router = useRouter();
  const plateRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY);

  useLayoutEffect(() => {
    setFilters(readUrl());
    // Правила дофильтрации отработали своё: дальше выборкой управляет React,
    // и если атрибуты оставить, CSS продолжит прятать карточки поверх него.
    PREFILTER_KEYS.forEach((k) => document.documentElement.removeAttribute(`data-f-${k}`));
  }, []);

  /* Адрес — источник правды для выборки, и сверка идёт на каждый проход.
     Кнопка «назад» ловится через popstate. А пункт «Каталог» в шапке ведёт
     на ТОТ ЖЕ маршрут: компонент не перемонтируется, useLayoutEffect выше
     больше не сработает, и параметры, прочитанные при монтаже, оставались в
     силе — адрес говорил «все», а на экране были четыре позиции.

     Эффект намеренно без списка зависимостей: Next перерисовывает сегмент на
     клиентском переходе, и эта сверка идёт следом. Зацикливания нет —
     состояние переписывается только когда действительно разошлось. */
  useEffect(() => {
    const sync = () => {
      const next = readUrl();
      setFilters((prev) =>
        KEYS.every((k) => prev[k] === next[k]) ? prev : next,
      );
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  });

  const { category, fraction, gost, group } = filters;
  const active = KEYS.some((k) => filters[k] !== ALL);
  /* Приведения типа больше нет: идентификатор категории — обычная строка,
     а проверку делает categoryById, возвращая undefined на незнакомой. */
  const activeCategory = category !== ALL ? categoryById(category) : undefined;

  // Прилёт карточки с главной. Пусто в хранилище — страница просто открывается.
  useFlipArrival('to-catalog', () => plateRef.current, { fadeIn: listRef });

  const apply = useCallback((next: Filters) => {
    setFilters(next);
    const sp = new URLSearchParams();
    KEYS.forEach((k) => {
      if (next[k] !== ALL) sp.set(k, next[k]);
    });
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, []);

  const setParam = useCallback(
    (key: (typeof KEYS)[number], value: string) => apply({ ...filters, [key]: value }),
    [apply, filters],
  );

  const reset = useCallback(() => apply(EMPTY), [apply]);

  const items = useMemo(
    () =>
      MATERIALS.filter((m) => {
        if (category !== ALL && m.categoryId !== category) return false;
        if (fraction !== ALL && !inFraction(m, fraction)) return false;
        if (gost !== ALL && m.gost !== gost) return false;
        if (group !== ALL && m.group !== group) return false;
        return true;
      }),
    [category, fraction, gost, group],
  );

  /* Сколько позиций выбранная категория скрывает не потому, что не подошли,
     а потому, что фракции не имеют. Показывается только при выбранной
     фракции: без неё они и так все на месте. */
  const withoutFraction = useMemo(() => {
    if (fraction === ALL) return { count: 0, names: '', many: false };
    const hidden = MATERIALS.filter(
      (m) => !hasFraction(m) && (category === ALL || m.categoryId === category),
    );
    /* Названия категорий берутся из тех позиций, что реально скрыты. Пока
       здесь стояло слово «Грунты», строка врала бы в тот же день, когда
       появилась вторая безфракционная категория, — металл. */
    /* Незнакомая категория даёт пустое имя и в перечисление не идёт: одна
       непонятная позиция не должна превращать строку в «Грунты, , Металл». */
    const names = [...new Set(hidden.map((m) => categoryName(m.categoryId)).filter(Boolean))];
    return { count: hidden.length, names: names.join(', '), many: names.length > 1 };
  }, [category, fraction]);

  /* Группы показываются только у выбранной категории: без неё в одной строке
     оказались бы виды проката рядом с ничем. */
  const groups = activeCategory ? groupsOf(activeCategory.id) : [];

  const backHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!activeCategory || prefersReducedMotion() || !plateRef.current) return;
    e.preventDefault();
    captureSource(plateRef.current, activeCategory.id, 'to-home');
    router.push('/#materialy');
  };

  return (
    <>
      {/* Верхний отступ под плавающую шапку: она вынута из потока. */}
      <div className="shell pb-6 pt-[calc(74px+1.5rem)] md:pb-10 md:pt-[calc(74px+2rem)]">
        <nav aria-label="Хлебные крошки" className="mb-5 flex flex-wrap items-center text-t1 text-ink-2">
          {/* Поле нажатия 44 px при кегле 12: отрицательное поле снимает
              прибавку из раскладки, строка крошек не растёт. */}
          <Link href="/#materialy" onClick={backHome} className="-my-3.5 rounded py-3.5 hover:text-accent">
            Главная
          </Link>
          <span className="mx-2 text-line-strong" aria-hidden="true">
            /
          </span>
          <span className="text-ink">Каталог</span>
          {activeCategory && (
            <>
              <span className="mx-2 text-line-strong" aria-hidden="true">
                /
              </span>
              <span className="text-ink">{activeCategory.name}</span>
            </>
          )}
        </nav>

        {/* Плашка категории — сюда прилетает карточка с главной. */}
        <div ref={plateRef} data-catalog-plate>
          {activeCategory ? (
            <PhotoSlot
              slot={categorySlot(activeCategory.id)}
              className="flex min-h-[132px] items-end rounded-card border border-line md:min-h-[168px]"
            >
              {/* relative z-10 обязателен. Внутри PhotoSlot кадр лежит
                  absolute inset-0, а этот блок — обычный поток: позиционированный
                  элемент рисуется ПОВЕРХ непозиционированного при равном
                  z-index, и фотография закрывала заголовок категории целиком.
                  На отфильтрованном каталоге страница открывалась без единого
                  видимого H1: elementFromPoint в точке заголовка возвращал IMG.
                  У карточек категорий на лендинге того же не было — там дети
                  сами absolute и стоят в разметке после кадра. */}
              <div className="relative z-10 w-full bg-gradient-to-t from-white/95 via-white/90 to-white/40 p-4 md:p-6">
                <h1 className="font-black text-t4 leading-none tracking-[-.03em]">
                  {activeCategory.name}
                </h1>
                {/* Строка характеристик набрана ОСНОВНЫМ цветом, а не
                    вторичным. Вторичный даёт 5,84:1 даже по чистому белому, а
                    здесь под ним кадр, пробивающийся сквозь градиент: замер по
                    маске глифов на 390 давал 3,86:1 у грунта и 4,13 у металла
                    — ниже порога. Уплотнять градиент ради этого нельзя,
                    иначе кадр под плашкой смывается в белое; иерархию тут и
                    так держат кегль и вес. */}
                <p className="mt-2 max-w-[62ch] text-t2 text-ink">
                  {categorySpecLine(activeCategory.id)} · {activeCategory.summary}
                </p>
              </div>
            </PhotoSlot>
          ) : (
            <div className="rounded-card border border-line bg-surface p-5 md:p-7">
              <h1 className="font-black text-t4 leading-none tracking-[-.03em]">
                Каталог материалов
              </h1>
              {/* Все числа считаются из данных: позиции, группы и то, у
                  скольких позиций цена есть. Набранные словом, они разошлись
                  бы с каталогом в тот же день, когда прайс дополнят. */}
              <p className="mt-3 max-w-[64ch] text-t2 leading-relaxed text-ink-2">
                {POSITIONS_TOTAL} {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')} в{' '}
                {CATEGORIES.length}{' '}
                {plural(CATEGORIES.length, 'группе', 'группах', 'группах')}. Цены с НДС, на условиях
                самовывоза; стоимость доставки считаем отдельно,{' '}
                <Link href="/#raschet" className="link-underline rounded text-accent">
                  в калькуляторе
                </Link>
                .
                {POSITIONS_ON_REQUEST > 0 && (
                  <>
                    {' '}
                    {typo(
                      `Цена из прайса стоит у ${POSITIONS_PRICED} ${plural(POSITIONS_PRICED, 'позиции', 'позиций', 'позиций')}, остальные ${POSITIONS_ON_REQUEST} ${ON_REQUEST}.`,
                    )}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── Фильтры ───────────────────────────────────────────────────────
            Открыты и на телефоне: прятать их за кнопкой — значит прятать
            главный инструмент выбора. */}
        <div className="mt-6 rounded-card border border-line bg-surface p-4 md:mt-8 md:p-5">
          <FilterRow label="Категория">
            <Chip chip="category:all" active={category === ALL} onClick={() => setParam('category', ALL)}>
              Все
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                chip={`category:${c.id}`}
                active={category === c.id}
                onClick={() => setParam('category', c.id)}
              >
                {c.name}
              </Chip>
            ))}
          </FilterRow>

          {/* Вид проката. Строка появляется только там, где делить есть на
              что: у инертных групп внутри категории нет. Это не «спрятанный
              за кнопку фильтр» — строки просто не существует, пока не
              выбрана категория с группами. */}
          {groups.length > 0 && (
            <FilterRow label={activeCategory?.groupLabel ?? 'Вид'}>
              <Chip chip="group:all" active={group === ALL} onClick={() => setParam('group', ALL)}>
                Любой
              </Chip>
              {groups.map((g) => (
                <Chip
                  key={g.id}
                  chip={`group:${g.id}`}
                  active={group === g.id}
                  onClick={() => setParam('group', g.id)}
                >
                  {g.name}
                </Chip>
              ))}
            </FilterRow>
          )}

          <FilterRow label="Фракция">
            <Chip chip="fraction:all" active={fraction === ALL} onClick={() => setParam('fraction', ALL)}>
              Любая
            </Chip>
            {FRACTION_FILTERS.map((f) => (
              <Chip
                key={f.id}
                chip={`fraction:${f.id}`}
                active={fraction === f.id}
                onClick={() => setParam('fraction', f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </FilterRow>

          {/* Честная оговорка вместо молчания. Грунты по размеру зерна не
              сортируют — фракции у них нет, и при выбранной фракции они
              пропадают не потому, что не подошли. Без этой строки человек
              решал бы, что нужного грунта у нас просто не бывает. */}
          {withoutFraction.count > 0 && (
            <p className="mt-3 text-t1 leading-snug text-ink-2">
              {typo(
                /* Число согласуется и в глаголе: «скрыта 21 позиция», но
                   «скрыто 26 позиций». Категорий может быть одна или
                   несколько — «Металлопрокат не участвует», «Грунт и
                   чернозём, Металлопрокат не участвуют». */
                `${withoutFraction.names} в подборе по фракции ${
                  withoutFraction.many ? 'не участвуют' : 'не участвует'
                }: по размеру зерна такой товар не сортируют. Сейчас так ${plural(
                  withoutFraction.count,
                  'скрыта',
                  'скрыто',
                  'скрыто',
                )} ${withoutFraction.count} ${plural(withoutFraction.count, 'позиция', 'позиции', 'позиций')} —`,
              )}{' '}
              <button
                type="button"
                onClick={() => setParam('fraction', ALL)}
                className="link-underline rounded text-accent"
              >
                снимите фракцию
              </button>
              , чтобы их увидеть.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <label htmlFor="gost" className="text-t1 font-medium">
              ГОСТ
            </label>
            <select
              id="gost"
              value={gost}
              onChange={(e) => setParam('gost', e.target.value)}
              className="field h-10 rounded-card px-2.5 text-t2"
            >
              <option value={ALL}>Любой</option>
              {GOST_FILTERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <p data-found className="ml-auto text-t2 text-ink-2" aria-live="polite">
              Найдено: <span className="tnum font-medium text-ink">{items.length}</span>
            </p>
            {/* Цель нажатия 44,8 px по высоте вместо 24,8. Подчёркивание
                осталось на нижней кромке текста: .link-underline::after
                вычитает поле цели из своего отступа. */}
            {active && (
              <button
                type="button"
                onClick={reset}
                className="link-underline tap-y tap-reset rounded text-t2 text-accent"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>

        {/* ── Список ────────────────────────────────────────────────────── */}
        <div ref={listRef} className="mt-6 md:mt-8">
          {/* Заголовок для читалок: без него от h1 сразу шёл бы h3 карточки. */}
          <h2 className="sr-only">Позиции каталога</h2>
          {items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-line bg-surface p-8 text-center">
              <p className="text-t3 font-bold">Под такой набор фильтров ничего нет</p>
              {/* Совет по тому, что реально выставлено. Раньше здесь всегда
                  предлагалось снять фракцию и ГОСТ — даже когда ни одна из
                  них не выбрана, а пусто из-за категории. */}
              <p className="mx-auto mt-2 max-w-[48ch] text-t2 text-ink-2">
                {typo(
                  `Снимите ${[
                    fraction !== ALL ? 'фракцию' : null,
                    gost !== ALL ? 'ГОСТ' : null,
                    category !== ALL ? 'категорию' : null,
                  ]
                    .filter(Boolean)
                    .join(' или ')} — либо позвоните: часть позиций возим под заказ и в каталог они не попадают.`,
                )}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex h-11 items-center rounded-card bg-accent px-5 text-t2 font-medium text-white hover:bg-accent-hover"
              >
                Показать все позиции
              </button>
            </div>
          )}
        </div>

        {/* Отступ, чтобы полоса заявки не накрывала последнюю карточку. */}
        <div className="h-24 md:h-20" aria-hidden="true" />

        <Link
          href="/#zayavka"
          className="link-underline mt-2 inline-flex items-center gap-2 rounded text-t2 text-accent"
        >
          Не нашли нужную позицию — оставьте заявку
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>

      <RequestPanel />
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 [&+&]:mt-3">
      <span className="mr-1 w-[74px] shrink-0 text-t1 font-medium">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  chip,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  chip: string;
}) {
  return (
    <button
      type="button"
      data-chip={chip}
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 rounded-pill border px-3.5 text-t2 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-transparent bg-[color:var(--field-bg)] text-ink-2 hover:bg-[color:var(--field-bg-hover)] hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
