'use client';

import { useEffect, useRef, useState } from 'react';
import { useRequest } from '@/components/providers/RequestProvider';
import { calculate, type Unit } from '@/lib/pricing';
import { rub, tons, volume } from '@/lib/format';
import { LeadForm } from '@/components/home/LeadForm';
import { CloseIcon, ListIcon } from '@/components/site/Icons';

/**
 * Заявка-список. Внизу висит полоса со счётчиком, она раскрывается в панель
 * с позициями и той же формой, что на лендинге — компонент буквально один и
 * тот же, поля разойтись не могут.
 *
 * Список хранится только в памяти страницы: sessionStorage не используем.
 */
export function RequestPanel() {
  const req = useRequest();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!req.open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') req.setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [req.open, req]);

  if (!mounted || req.count === 0) return null;

  const estimate = req.detailed.reduce((sum, { item }) => {
    const c = calculate({
      materialId: item.materialId,
      amount: item.amount,
      unit: item.unit,
      km: req.brief.km,
    });
    return sum + (c?.total ?? 0);
  }, 0);

  return (
    <>
      {/* Полоса-счётчик. Над мобильной панелью телефона, чтобы не перекрывать её. */}
      <div className="no-print fixed inset-x-0 bottom-[68px] z-40 md:bottom-0">
        <div className="shell pb-3 md:pb-4">
          <button
            type="button"
            onClick={() => req.setOpen(true)}
            className="flex w-full items-center gap-3 border border-ink bg-ink px-4 py-3.5 text-left text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ListIcon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-t2 font-medium">
              Заявка · {req.count}{' '}
              {req.count === 1 ? 'позиция' : req.count < 5 ? 'позиции' : 'позиций'}
            </span>
            <span className="figure hidden text-t2 text-white/75 sm:inline">
              ≈ {rub(estimate)}
            </span>
            <span className="mark bg-white/15 px-3 py-1.5">Открыть</span>
          </button>
        </div>
      </div>

      {req.open && (
        <div className="no-print fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Заявка">
          <button
            type="button"
            aria-label="Закрыть заявку"
            onClick={() => req.setOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto border-t-2 border-ink bg-bg md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[580px] md:border-l-2 md:border-t-0">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg px-4 py-3 md:px-6">
              <h2 className="text-t2 font-display font-semibold">
                Заявка · {req.count}{' '}
                {req.count === 1 ? 'позиция' : req.count < 5 ? 'позиции' : 'позиций'}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => req.setOpen(false)}
                className="p-2 text-ink-2 transition-colors hover:text-ink"
                aria-label="Закрыть"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 md:px-6 md:py-6">
              <ul className="border-t border-ink">
                {req.detailed.map(({ item, material }) => {
                  const calc = calculate({
                    materialId: item.materialId,
                    amount: item.amount,
                    unit: item.unit,
                    km: req.brief.km,
                  });
                  return (
                    <li
                      key={item.materialId}
                      className="border-b border-line py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-t2 font-medium leading-snug">{material.name}</p>
                          <p className="mark-value mt-1 text-ink-2">
                            {material.fraction} · {rub(material.pricePerM3)}/м³
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => req.remove(item.materialId)}
                          className="shrink-0 rounded p-1.5 text-ink-2 transition-colors hover:bg-warn-soft hover:text-warn"
                          aria-label={`Убрать ${material.name}`}
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <label className="sr-only" htmlFor={`amt-${item.materialId}`}>
                          Объём, {material.name}
                        </label>
                        <input
                          id={`amt-${item.materialId}`}
                          type="number"
                          min={1}
                          step="any"
                          inputMode="decimal"
                          value={item.amount}
                          onChange={(e) =>
                            req.setAmount(item.materialId, Math.max(0, Number(e.target.value) || 0))
                          }
                          className="tnum h-10 w-24 border border-line-strong bg-transparent px-2.5 text-t2 focus:border-accent focus:outline-none"
                        />
                        <div className="flex border border-line-strong">
                          {(['m3', 't'] as Unit[]).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => req.setUnit(item.materialId, u)}
                              aria-pressed={item.unit === u}
                              className={`h-[38px] w-11 text-t2 transition-colors ${
                                item.unit === u ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                              }`}
                            >
                              {u === 'm3' ? 'м³' : 'т'}
                            </button>
                          ))}
                        </div>
                        <span className="figure ml-auto text-right text-t2 text-ink-2">
                          {calc ? (
                            <>
                              {item.unit === 'm3' ? tons(calc.massT) : volume(calc.volumeM3)}
                              <span className="ml-2 font-semibold text-ink">≈ {rub(calc.total)}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-5 flex items-baseline justify-between border-t border-ink pt-4 text-t2">
                <span className="text-ink-2">Ориентировочно с доставкой</span>
                <span className="figure text-t3 font-semibold">{rub(estimate)}</span>
              </p>
              <p className="mark-value mt-2 text-ink-2">
                Доставка посчитана на {req.brief.km} км от МКАД. Точное расстояние уточним по адресу.
              </p>

              <div className="mt-6">
                <LeadForm hideItems />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
