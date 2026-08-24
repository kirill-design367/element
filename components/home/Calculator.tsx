'use client';

import { useId, useMemo, useState } from 'react';
import { CATEGORIES, MATERIALS, materialsOf } from '@/lib/catalog';
import { DESTINATIONS, MAX_KM, MIN_ORDER_M3, calculate, type Unit } from '@/lib/pricing';
import { rides, rub, tons, volume } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';
import { ArrowIcon } from '@/components/site/Icons';

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
    'h-12 w-full rounded-card border border-line-strong bg-surface px-3 text-[15px] text-ink ' +
    'transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
  const label = 'mb-1.5 block text-[13px] font-medium text-ink';

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      {/* ── Поля ─────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7">
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
                    className={`flex h-10 cursor-pointer items-center justify-center rounded px-3 text-[14px] font-medium transition-colors ${
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
              <p id={`${uid}-amount-hint`} className="mt-1.5 text-[13px] text-warn">
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
                  className="tnum inline-flex h-9 items-center rounded-pill border border-line px-3 text-[13px] text-ink-2 transition-colors hover:border-accent hover:text-accent"
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
            <p id={`${uid}-address-hint`} className="mt-1.5 text-[13px] text-ink-2">
              Адрес уходит менеджеру вместе с заявкой. На расчёт влияет расстояние от МКАД —
              его можно поправить вручную.
            </p>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card md:p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] font-bold uppercase tracking-[.07em]">
              Расчёт
            </h3>
            <span className="text-[12px] text-ink-2">цены с НДС</span>
          </div>

          <div className="mt-4 space-y-3 text-[15px]" aria-live="polite">
            <Row
              label="Объём"
              value={result ? `${volume(result.volumeM3)} · ${tons(result.massT)}` : '—'}
            />
            <Row label="Материал" value={result ? rub(result.materialCost) : '—'} />
            <Row
              label="Доставка"
              value={result ? rub(result.deliveryCost) : '—'}
              note={
                result
                  ? `${rides(result.rides)} · ${result.truck.name} · до ${volume(result.perRideM3)} за рейс`
                  : undefined
              }
            />

            <div className="rule pt-3">
              <div className="flex items-end justify-between gap-3">
                <span className="text-[13px] uppercase tracking-[.07em] text-ink-2">Итого</span>
                <span className="tnum font-display text-[clamp(26px,5vw,34px)] font-semibold leading-none tracking-[-.02em]">
                  {result ? rub(result.total) : '—'}
                </span>
              </div>
              {result && result.volumeM3 > 0 && (
                <p className="tnum mt-2 text-right text-[13px] text-ink-2">
                  {rub(result.totalPerM3)} за м³ с доставкой на объект
                </p>
              )}
            </div>
          </div>

          {result?.belowMinimum && (
            <p className="mt-4 rounded border-l-2 border-warn bg-warn-soft px-3 py-2 text-[13px] leading-snug text-ink">
              Меньше {MIN_ORDER_M3} м³ не возим: машина оплачивается целиком независимо от загрузки.
            </p>
          )}
          {result?.beyondRange && (
            <p className="mt-4 rounded border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px] leading-snug text-ink">
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

          <p className="mt-3 text-[12px] leading-snug text-ink-2">
            Расчёт ориентировочный: не учитывает простой под разгрузкой, ночную подачу и
            подъезд, недоступный для самосвала. Менеджер подтвердит цену письмом.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-ink-2">{label}</span>
        {note && <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{note}</p>}
      </div>
      <span className="tnum shrink-0 font-medium">{value}</span>
    </div>
  );
}
