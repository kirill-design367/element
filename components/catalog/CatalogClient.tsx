'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  categoryById,
  FRACTION_FILTERS,
  GOST_FILTERS,
  hasFraction,
  inFraction,
  MATERIALS,
  POSITIONS_TOTAL,
  type CategoryId,
} from '@/lib/catalog';
import { MaterialCard } from './MaterialCard';
import { RequestPanel } from './RequestPanel';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { categorySlot } from '@/lib/assets';
import { useFlipArrival } from '@/components/providers/FlipArrival';
import { captureSource } from '@/lib/flip-store';
import { prefersReducedMotion } from '@/lib/motion';
import { ArrowIcon } from '@/components/site/Icons';
import { plural, typo } from '@/lib/format';
import { PREFILTER_KEYS } from '@/lib/prefilter';

const ALL = 'all';

const KEYS = ['category', 'fraction', 'gost'] as const;
type Filters = Record<(typeof KEYS)[number], string>;
const EMPTY: Filters = { category: ALL, fraction: ALL, gost: ALL };

function readUrl(): Filters {
  if (typeof window === 'undefined') return EMPTY;
  const sp = new URLSearchParams(window.location.search);
  return {
    category: sp.get('category') ?? ALL,
    fraction: sp.get('fraction') ?? ALL,
    gost: sp.get('gost') ?? ALL,
  };
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

  // Кнопка «назад» в браузере меняет адрес — выборка обязана поехать следом.
  useEffect(() => {
    const onPop = () => setFilters(readUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const { category, fraction, gost } = filters;
  const active = category !== ALL || fraction !== ALL || gost !== ALL;
  const activeCategory =
    category !== ALL ? CATEGORIES.find((c) => c.id === (category as CategoryId)) : undefined;

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
        return true;
      }),
    [category, fraction, gost],
  );

  /* Сколько позиций выбранная категория скрывает не потому, что не подошли,
     а потому, что фракции не имеют. Показывается только при выбранной
     фракции: без неё они и так все на месте. */
  const withoutFraction = useMemo(() => {
    if (fraction === ALL) return 0;
    return MATERIALS.filter(
      (m) => !hasFraction(m) && (category === ALL || m.categoryId === category),
    ).length;
  }, [category, fraction]);

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
          <Link href="/#materialy" onClick={backHome} className="-my-2 rounded py-2 hover:text-accent">
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
                <p className="mt-2 max-w-[62ch] text-t2 text-ink-2">
                  {activeCategory.fractionsLine} · {activeCategory.summary}
                </p>
              </div>
            </PhotoSlot>
          ) : (
            <div className="rounded-card border border-line bg-surface p-5 md:p-7">
              <h1 className="font-black text-t4 leading-none tracking-[-.03em]">
                Каталог материалов
              </h1>
              <p className="mt-3 max-w-[64ch] text-t2 leading-relaxed text-ink-2">
                {POSITIONS_TOTAL} {plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')} в пяти группах. Цены за кубометр и за тонну, с НДС,
                на условиях самовывоза. Стоимость доставки считаем отдельно —{' '}
                <Link href="/#raschet" className="link-underline rounded text-accent">
                  в калькуляторе
                </Link>
                .
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
          {withoutFraction > 0 && (
            <p className="mt-3 text-t1 leading-snug text-ink-2">
              {typo(
                `Грунты в подборе по фракции не участвуют: по размеру зерна их не сортируют. Сейчас так скрыто ${withoutFraction} ${plural(withoutFraction, 'позиция', 'позиции', 'позиций')} —`,
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
            {active && (
              <button
                type="button"
                onClick={reset}
                className="link-underline rounded text-t2 text-accent"
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
              <p className="mx-auto mt-2 max-w-[48ch] text-t2 text-ink-2">
                Снимите фракцию или ГОСТ — либо позвоните: часть позиций возим под заказ
                и в каталог они не попадают.
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
          Не нашли нужную позицию — напишите нам
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
