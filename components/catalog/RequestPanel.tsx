'use client';

import { useEffect, useRef, useState } from 'react';
import { useRequest } from '@/components/providers/RequestProvider';
import { calculate, type Unit } from '@/lib/pricing';
import { plural, rub, tons, volume } from '@/lib/format';
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
            className="flex w-full items-center gap-3 rounded-card border border-ink bg-ink px-4 py-3 text-left text-white shadow-lift transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ListIcon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-t2 font-medium">
              Заявка · {req.count}{' '}
              {plural(req.count, 'позиция', 'позиции', 'позиций')}
            </span>
            <span className="hidden text-t2 text-white/75 sm:inline">
              ≈ <span className="tnum">{rub(estimate)}</span>
            </span>
            <span className="rounded bg-white/15 px-3 py-1 text-t2">Открыть</span>
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
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[14px] border-t border-line bg-bg md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[560px] md:rounded-none md:border-l md:border-t-0">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur md:px-6">
              <h2 className="text-t3 font-bold">
                Заявка · {req.count}{' '}
                {plural(req.count, 'позиция', 'позиции', 'позиций')}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => req.setOpen(false)}
                className="rounded p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Закрыть"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 md:px-6 md:py-6">
              <ul className="space-y-2">
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
                      className="rounded-card border border-line bg-surface p-3 md:p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-t2 font-medium leading-snug">{material.name}</p>
                          <p className="text-t1 text-ink-2">
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
                          /* type="text": числовое поле молча съедает
                             запятую, и «12,5» становилось «125». */
                          type="text"
                          inputMode="decimal"
                          value={item.amount}
                          onChange={(e) =>
                            req.setAmount(item.materialId, Math.max(0, Number(e.target.value.replace(',', '.')) || 0))
                          }
                          className="field tnum h-10 w-24 rounded-card px-2.5 text-t2"
                        />
                        <div className="field flex rounded-card p-0.5">
                          {(['m3', 't'] as Unit[]).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => req.setUnit(item.materialId, u)}
                              aria-pressed={item.unit === u}
                              className={`h-9 rounded px-3 text-t1 font-medium transition-colors ${
                                item.unit === u ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
                              }`}
                            >
                              {u === 'm3' ? 'м³' : 'т'}
                            </button>
                          ))}
                        </div>
                        <span className="ml-auto text-right text-t2 text-ink-2">
                          {calc ? (
                            <>
                              <span className="tnum">
                                {item.unit === 'm3' ? tons(calc.massT) : volume(calc.volumeM3)}
                              </span>
                              <span className="ml-2 font-medium text-ink">
                                ≈ <span className="tnum">{rub(calc.total)}</span>
                              </span>
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

              <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-t2">
                <span className="text-ink-2">Ориентировочно с доставкой</span>
                <span className="tnum text-t3 font-bold">{rub(estimate)}</span>
              </p>
              <p className="mt-1 text-t1 leading-snug text-ink-2">
                Доставку посчитали на {req.brief.km} км от МКАД. Точное расстояние уточним по адресу.
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
