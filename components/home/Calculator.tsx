'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CATEGORIES, MATERIALS, materialsOf } from '@/lib/catalog';
import { DESTINATIONS, MAX_KM, MIN_ORDER_M3, calculate, type Unit } from '@/lib/pricing';
import { num, rides, rub, tons, volume } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';

const QUICK = [10, 20, 30, 60];

/**
 * Короткий подсвет пересчитанной строки. Это обратная связь, а не украшение:
 * когда меняешь расстояние, глаз должен увидеть, какая именно цифра поехала.
 * Двести миллисекунд линейно; в режиме покоя глобальное правило в globals.css
 * обнуляет длительность, и подсвет просто не появляется.
 */
function useRecalcFlash(value: string): string {
  const [on, setOn] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setOn(false);
    const raf = requestAnimationFrame(() => setOn(true));
    const timer = window.setTimeout(() => setOn(false), 260);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [value]);

  return on ? 'recalc' : '';
}

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

  const vVolume = result ? `${volume(result.volumeM3)} · ${tons(result.massT)}` : '—';
  const vMaterial = result ? rub(result.materialCost) : '—';
  const vDelivery = result ? rub(result.deliveryCost) : '—';
  const vTotal = result ? num(result.total) : '—';

  const fVolume = useRecalcFlash(vVolume);
  const fMaterial = useRecalcFlash(vMaterial);
  const fDelivery = useRecalcFlash(vDelivery);
  const fTotal = useRecalcFlash(vTotal);

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

  // Поля прямоугольные: рамка снизу, как в бланке, а не карточка.
  const field =
    'h-12 w-full border border-line-strong bg-transparent px-3 text-t2 text-ink ' +
    'transition-colors hover:border-ink-3 focus:border-accent focus:outline-none';
  const label = 'mark mb-2 block text-ink-2';

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-12">
      {/* ── Поля ─────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7">
        <div className="grid gap-7 sm:grid-cols-2">
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
              <fieldset className="flex shrink-0 border border-line-strong">
                <legend className="sr-only">Единица измерения</legend>
                {(['m3', 't'] as Unit[]).map((u) => (
                  <label
                    key={u}
                    className={`flex h-[46px] w-12 cursor-pointer items-center justify-center text-t2 transition-colors ${
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
              <p id={`${uid}-amount-hint`} className="mt-2 text-t2 text-warn">
                Укажите объём числом — например, 20
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmountText(String(q));
                    setUnit('m3');
                  }}
                  className="mark-value inline-flex h-9 items-center border border-line px-3 text-ink-2 transition-colors hover:border-ink hover:text-ink"
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

            <label className={`${label} mt-6`} htmlFor={`${uid}-km`}>
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
              Адрес объекта — необязательно
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
            <p id={`${uid}-address-hint`} className="mt-2 text-t2 text-ink-2">
              Адрес уходит менеджеру вместе с заявкой. На расчёт влияет расстояние от МКАД —
              его можно поправить вручную.
            </p>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────────────────
          Отделён от полей белым полем и жирной линейкой сверху: это уже
          не форма, а счёт. Итог набран самым крупным кеглем на сайте. */}
      <div className="lg:col-span-5">
        <div className="border-t-2 border-ink bg-surface p-5 md:p-6 lg:sticky lg:top-20">
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <p className="mark">Расчёт</p>
            <p className="mark text-ink-2">цены с НДС</p>
          </div>

          <dl className="mt-1" aria-live="polite">
            <Row label="Объём" value={vVolume} flash={fVolume} />
            <Row label="Материал" value={vMaterial} flash={fMaterial} />
            <Row
              label="Доставка"
              value={vDelivery}
              flash={fDelivery}
              note={
                result
                  ? `${rides(result.rides)} · ${result.truck.name} · до ${volume(result.perRideM3)} за рейс`
                  : undefined
              }
            />
          </dl>

          <div className="mt-5 border-t border-ink pt-4">
            <p className="mark text-ink-2">Итого</p>
            <p className={`figure mt-1 text-t5 font-semibold ${fTotal}`}>
              {vTotal}
              <span className="ml-2 align-baseline text-t3 font-medium text-ink-2">₽</span>
            </p>
            {result && result.volumeM3 > 0 && (
              <p className="mark-value mt-3 text-ink-2">
                {rub(result.totalPerM3)} за м³ с доставкой на объект
              </p>
            )}
          </div>

          {result?.belowMinimum && (
            <p className="mt-5 border-l-2 border-warn bg-warn-soft px-3 py-2 text-t2">
              Меньше {MIN_ORDER_M3} м³ не возим: машина оплачивается целиком независимо от загрузки.
            </p>
          )}
          {result?.beyondRange && (
            <p className="mt-5 border-l-2 border-ink px-3 py-2 text-t2">
              Дальше {MAX_KM} км от МКАД возим по согласованию — цена в расчёте ориентировочная.
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            onClick={toRequest}
            disabled={!result}
          >
            {sent ? 'Добавлено в заявку' : 'Отправить на просчёт'}
          </Button>

          <p className="mt-4 text-t2 text-ink-2">
            Расчёт ориентировочный: не учитывает простой под разгрузкой, ночную подачу и
            подъезд, недоступный для самосвала. Менеджер подтвердит цену письмом.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Строка счёта: метка слева, сумма справа, выравнивание по разряду. */
function Row({
  label,
  value,
  note,
  flash,
}: {
  label: string;
  value: string;
  note?: string;
  flash: string;
}) {
  return (
    <div className="border-b border-line py-3">
      <dt className="mark float-left text-ink-2">{label}</dt>
      <dd className={`figure tnum text-right text-t2 font-medium ${flash}`}>{value}</dd>
      {note && <dd className="mark-value clear-both block pt-1.5 text-ink-2">{note}</dd>}
    </div>
  );
}
