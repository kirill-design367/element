'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CATEGORIES, MATERIALS, materialsOf } from '@/lib/catalog';
import { DESTINATIONS, MAX_KM, MIN_ORDER_M3, calculate, type Unit } from '@/lib/pricing';
import { rides, rub, tons, volume } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';
import { ArrowIcon } from '@/components/site/Icons';
import { prefersReducedMotion } from '@/lib/motion';

const QUICK = [10, 20, 30, 60];

/**
 * Калькулятор стоит вторым блоком и считает на месте: цифры пересчитываются
 * при любом изменении, без кнопки «рассчитать» и без отправки на сервер.
 * Тарифы и формулы — в lib/pricing.ts, здесь только интерфейс.
 */
export function Calculator() {
  const uid = useId();
  const req = useRequest();

  const [materialId, setMaterialId] = useState(MATERIALS[0].id);
  const [amountText, setAmountText] = useState('20');
  const [unit, setUnit] = useState<Unit>('m3');
  const [destinationId, setDestinationId] = useState('mkad');
  const [km, setKm] = useState(0);
  const [address, setAddress] = useState('');
  const [sent, setSent] = useState(false);

  const amount = Number(amountText.replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0;

  const result = useMemo(
    () => (valid ? calculate({ materialId, amount, unit, km }) : null),
    [materialId, amount, unit, km, valid],
  );

  /**
   * Подсвет пересчитанной строки. Обратная связь, а не украшение: 0,2 с —
   * ровно столько, чтобы глаз заметил, какая цифра поехала, и не больше.
   * Первый расчёт не подсвечивается: подсвечивать нечего, строка только
   * появилась. В режиме покоя подсвет не запускается вовсе.
   */
  const flash = useRecalcFlash([result?.materialCost, result?.deliveryCost, result?.total]);

  const onDestination = (id: string) => {
    setDestinationId(id);
    const d = DESTINATIONS.find((x) => x.id === id);
    if (d) setKm(d.km);
  };

  const onKm = (value: string) => {
    const n = Math.max(0, Math.min(MAX_KM * 2, Number(value) || 0));
    setKm(n);
    const match = DESTINATIONS.find((d) => d.km === n && d.id !== 'other');
    setDestinationId(match ? match.id : 'other');
  };

  const toRequest = () => {
    if (!result) return;
    req.add(materialId, amount, unit);
    req.patchBrief({ address, km, destinationId });
    setSent(true);
    document.getElementById('zayavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const field =
    'h-12 w-full rounded-card border border-line-strong bg-surface px-3 text-t2 text-ink ' +
    'transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
  const label = 'mb-1.5 block text-t1 font-medium text-ink';

  return (
    /* Поля и результат встают во всю ширину экрана: поля слева на две трети,
       результат справа на треть, полей по краям нет. Левый край полей
       совпадает с линией контейнера — заголовок стоит над ним. */
    <div className="bleed-r grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ── Поля ─────────────────────────────────────────────────────────── */}
      <div className="pr-[var(--shell-x)] lg:col-span-8 lg:pr-0">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${uid}-material`}>
              Материал
            </label>
            <select
              id={`${uid}-material`}
              className={field}
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {materialsOf(c.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}, {m.fraction} — {rub(m.pricePerM3)}/м³
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor={`${uid}-amount`}>
              Объём
            </label>
            <div className="flex gap-2">
              <input
                id={`${uid}-amount`}
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                className={`${field} tnum flex-1`}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                aria-describedby={valid ? undefined : `${uid}-amount-hint`}
              />
              <fieldset className="flex shrink-0 rounded-card border border-line-strong bg-surface p-1">
                <legend className="sr-only">Единица измерения</legend>
                {(['m3', 't'] as Unit[]).map((u) => (
                  <label
                    key={u}
                    className={`flex h-10 cursor-pointer items-center justify-center rounded px-3 text-t2 font-medium transition-colors ${
                      unit === u ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${uid}-unit`}
                      className="sr-only"
                      checked={unit === u}
                      onChange={() => setUnit(u)}
                    />
                    {u === 'm3' ? 'м³' : 'т'}
                  </label>
                ))}
              </fieldset>
            </div>
            {!valid && (
              <p id={`${uid}-amount-hint`} className="mt-1.5 text-t1 text-warn">
                Укажите объём числом — например, 20
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmountText(String(q));
                    setUnit('m3');
                  }}
                  className="tnum inline-flex h-9 items-center rounded-pill border border-line px-3 text-t1 text-ink-2 transition-colors hover:border-accent hover:text-accent"
                >
                  {q} м³
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor={`${uid}-dest`}>
              Куда везём
            </label>
            <select
              id={`${uid}-dest`}
              className={field}
              value={destinationId}
              onChange={(e) => onDestination(e.target.value)}
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.km > 0 ? ` — ${d.km} км` : ''}
                </option>
              ))}
            </select>

            <label className={`${label} mt-4`} htmlFor={`${uid}-km`}>
              Расстояние от МКАД, км
            </label>
            <input
              id={`${uid}-km`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_KM * 2}
              className={`${field} tnum`}
              value={km}
              onChange={(e) => onKm(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${uid}-address`}>
              Адрес объекта <span className="font-normal text-ink-2">— необязательно</span>
            </label>
            <input
              id={`${uid}-address`}
              type="text"
              autoComplete="street-address"
              placeholder="Ногинский р-н, д. Тимохово, участок 14"
              className={field}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-describedby={`${uid}-address-hint`}
            />
            <p id={`${uid}-address-hint`} className="mt-1.5 text-t1 text-ink-2">
              Адрес уходит менеджеру вместе с заявкой. На расчёт влияет расстояние от МКАД —
              его можно поправить вручную.
            </p>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────────────────── */}
      <div className="lg:col-span-4">
        <div className="rounded-l-card border border-r-0 border-line bg-surface p-5 shadow-lift md:p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <h3 className="text-t2 font-black">
              Расчёт
            </h3>
            <span className="text-t1 text-ink-2">цены с НДС</span>
          </div>

          {/* Разбивка как в счёте: строка — статья — сумма. Итог отделён
              от строк и от полей ввода: он не продолжение формы, а ответ. */}
          <div className="mt-5 space-y-3 text-t2" aria-live="polite">
            <Row
              label="Объём"
              value={result ? `${volume(result.volumeM3)} · ${tons(result.massT)}` : '—'}
            />
            <Row
              label="Материал"
              value={result ? rub(result.materialCost) : '—'}
              flash={flash[0]}
            />
            <Row
              label="Доставка"
              value={result ? rub(result.deliveryCost) : '—'}
              flash={flash[1]}
              note={
                result
                  ? `${rides(result.rides)} · ${result.truck.name} · до ${volume(result.perRideM3)} за рейс`
                  : undefined
              }
            />
          </div>

          {/* Итог — самое крупное число на странице. Прижат к правому краю
              экрана и обрезается им, как вордмарк: цифра не помещается в
              карточку целиком, и это читается как масштаб, а не как ошибка. */}
          <div className="-mx-5 mt-5 overflow-hidden border-t border-line-strong bg-surface-2 px-5 pb-5 pt-4 md:-mx-6 md:px-6">
            <dt className="text-t1 font-medium text-ink-2">Итого</dt>
            <dl>
              <dd
                data-total
                className={`-mr-6 mt-1 whitespace-nowrap text-right font-black text-t5 leading-[.85] tracking-[-.04em] md:-mr-10 ${flash[2] ? 'recalc' : ''}`}
                key={result ? result.total : 'empty'}
              >
                {result ? rub(result.total) : '—'}
              </dd>
            </dl>
            {result && result.volumeM3 > 0 && (
              <p className="tnum mt-2 text-right text-t1 text-ink-2">
                {rub(result.totalPerM3)} за м³ с доставкой на объект
              </p>
            )}
          </div>

          {result?.belowMinimum && (
            <p className="mt-4 rounded border-l-2 border-warn bg-warn-soft px-3 py-2 text-t1 leading-snug text-ink">
              Меньше {MIN_ORDER_M3} м³ не возим: машина оплачивается целиком независимо от загрузки.
            </p>
          )}
          {result?.beyondRange && (
            <p className="mt-4 rounded border-l-2 border-line-strong bg-surface-2 px-3 py-2 text-t1 leading-snug text-ink">
              Дальше {MAX_KM} км от МКАД возим по согласованию — цена в расчёте ориентировочная.
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            onClick={toRequest}
            disabled={!result}
          >
            {sent ? 'Добавлено в заявку' : 'Отправить на просчёт'}
            <ArrowIcon className="h-4 w-4" />
          </Button>

          <p className="mt-3 text-t1 leading-snug text-ink-2">
            Расчёт ориентировочный: не учитывает простой под разгрузкой, ночную подачу и
            подъезд, недоступный для самосвала. Менеджер подтвердит цену письмом.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  flash,
}: {
  label: string;
  value: string;
  note?: string;
  flash?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-ink-2">{label}</span>
        {note && <p className="mt-0.5 text-t1 leading-snug text-ink-2">{note}</p>}
      </div>
      <span className={`tnum shrink-0 font-medium ${flash ? 'recalc' : ''}`}>{value}</span>
    </div>
  );
}

/**
 * Возвращает по флагу на каждое переданное значение: true в тот кадр, когда
 * значение изменилось. Флаг снимается таймером — иначе класс остаётся висеть
 * и следующая анимация не запускается.
 */
function useRecalcFlash(values: (number | undefined)[]) {
  const prev = useRef<(number | undefined)[]>(values);
  const [on, setOn] = useState<boolean[]>(() => values.map(() => false));
  const key = values.join('|');

  useEffect(() => {
    if (prefersReducedMotion()) {
      prev.current = values;
      return;
    }
    const changed = values.map((v, i) => prev.current[i] !== undefined && v !== prev.current[i]);
    prev.current = values;
    if (!changed.some(Boolean)) return;
    setOn(changed);
    const t = setTimeout(() => setOn(values.map(() => false)), 220);
    return () => clearTimeout(t);
    // values пересобирается каждый рендер — сравниваем по строковому ключу
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return on;
}
