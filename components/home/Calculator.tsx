'use client';

import { useId, useMemo, useState } from 'react';
import { CATEGORIES, MATERIALS, materialsOf } from '@/lib/catalog';
import { DESTINATIONS, MAX_KM, MIN_ORDER_M3, calculate, type Unit } from '@/lib/pricing';
import { nbsp, num, rides, rub, tons, volume, typo } from '@/lib/format';
import { Counter } from './Counter';
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
  /* Отдельно от числа хранится набранный текст. Пока поле было привязано
     прямо к числу, пустая строка мгновенно превращалась в 0, React не
     переписывал значение обратно, и ноль прилипал: очистить поле было
     нельзя, а набранное после него читалось как «025» и «07». */
  const [kmText, setKmText] = useState('0');
  const [address, setAddress] = useState('');

  /* Разбор объёма терпит то, что человек реально набирает и вставляет.
     Пробелы — обычные, неразрывные и узкие — выбрасываются: сайт сам печатает
     объёмы разрядкой («1 000 м³»), и скопированное из своей же строки поле
     раньше отвергало. Запятая по-прежнему считается десятичным разделителем.
     Значение, которое после округления до сотых даёт ноль (0,001 и меньше),
     объёмом не считается: расчёт по нему выдавал панель «Итого 0 ₽ · 1 рейс»
     вместо сообщения. */
  const amount = Number(amountText.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.'));
  const valid = Number.isFinite(amount) && Math.round(amount * 100) / 100 > 0;

  /* Подпись «Добавлено в заявку» относится к тому расчёту, который добавили.
     Поменяли материал, объём или единицу — в заявке лежит уже не это, и
     подпись обязана вернуться к «Отправить на просчёт». Раньше флаг
     выставлялся один раз и не сбрасывался никогда. */
  const stamp = `${materialId}|${amountText}|${unit}`;
  const [sentStamp, setSentStamp] = useState('');
  const sent = sentStamp === stamp && sentStamp !== '';

  const result = useMemo(
    () => (valid ? calculate({ materialId, amount, unit, km }) : null),
    [materialId, amount, unit, km, valid],
  );

  const onDestination = (id: string) => {
    setDestinationId(id);
    const d = DESTINATIONS.find((x) => x.id === id);
    if (d) {
      setKm(d.km);
      setKmText(String(d.km));
    }
  };

  const onKm = (value: string) => {
    setKmText(value);
    const n = Math.max(0, Math.min(MAX_KM * 2, Number(value) || 0));
    setKm(n);
    const match = DESTINATIONS.find((d) => d.km === n && d.id !== 'other');
    setDestinationId(match ? match.id : 'other');
  };

  const toRequest = () => {
    if (!result) return;
    req.add(materialId, amount, unit);
    req.patchBrief({ address, km, destinationId });
    setSentStamp(stamp);
    document.getElementById('zayavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const field =
    'field h-12 w-full rounded-card px-3 text-t2';
  const label = 'mb-1.5 block text-t1 font-medium text-ink';

  return (
    /* Поля и результат стоят рядом, верхние кромки на одной высоте: ответ
       читается на уровне глаз, опускать взгляд не нужно. Вылет за правый край
       убран — обрезанное краем экрана число читалось как ошибка вёрстки. */
    <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
      {/* ── Поля ─────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-6">
        <div className="grid gap-4 sm:grid-cols-2">
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
                /* type="text", а не "number": в числовом поле браузер молча
                   выбрасывает запятую, и «12,5» превращалось в «125» — цена
                   выходила вдесятеро больше без единого признака ошибки.
                   inputMode="decimal" оставлен: на телефоне клавиатура
                   по-прежнему цифровая. Границы значения проверяет сам
                   калькулятор, а не атрибуты min и step. */
                type="text"
                inputMode="decimal"
                className={`${field} tnum flex-1`}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                aria-describedby={valid ? undefined : `${uid}-amount-hint`}
              />
              <fieldset className="field flex shrink-0 rounded-card p-1">
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
                  {`${q}\u00A0м³`}
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
              value={kmText}
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
              Адрес получим вместе с заявкой. На расчёт влияет расстояние от МКАД —
              его можно поправить вручную.
            </p>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────────────────
          Самый заметный предмет блока: тёмная панель с крупным скруглением,
          воздухом внутри и подъёмом тенью. Не обрезается ничем. */}
      <div className="lg:col-span-6">
        <div className="inv rounded-panel p-6 shadow-lift md:p-7">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-t2 font-black">Расчёт</h3>
            <span className="text-t1 text-ink-2">цены с НДС</span>
          </div>

          {/* Итог стоит первым, разбивка под ним. Раньше было наоборот —
              сначала из чего сложилось, потом сколько всего, — и крупное
              число оказывалось на 251 px ниже верхней кромки панели: чтобы
              увидеть цену, надо было опускать глаза с полей. Теперь панель
              и первое поле начинаются на одной горизонтали, и цифра попадает
              в кадр вместе с полями.

              Число не подменяется мгновенно: при правке любого поля оно
              добегает до нового значения за 0,6 с — видно, в какую сторону
              поехала цифра. Ширина ячейки не скачет, её держит невидимый
              двойник внутри Counter. */}
          <div className="mt-4">
            <dl>
              <dt className="text-t1 font-medium text-ink-2">Итого</dt>
              <dd data-total className="mt-1 flex items-baseline gap-2 font-black text-t5 leading-[.85] tracking-[-.04em]">
                {result ? (
                  <>
                    <Counter value={result.total} format={(n) => num(Math.round(n))} live />
                    <span className="text-t4">₽</span>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
            {/* tnum висит только на числе: в CoFo Sans фича подменяет заодно
                пробел широким, и фраза расходится разрядкой. */}
            {result && result.volumeM3 > 0 && (
              <p className="mt-2 text-t1 text-ink-2">
                <span className="tnum">{rub(result.totalPerM3)}</span> за м³ с доставкой на объект
              </p>
            )}
          </div>

          {/* Разбивка как в счёте: строка — статья — сумма. Под итогом: она
              объясняет цифру, а не подводит к ней. */}
          <div className="mt-5 space-y-3 border-t border-line pt-4 text-t2" aria-live="polite">
            <Row
              label="Объём"
              value={result ? nbsp(`${volume(result.volumeM3)} · ${tons(result.massT)}`) : '—'}
            />
            <Row label="Материал" value={result ? rub(result.materialCost) : '—'} />
            <Row
              label="Доставка"
              value={result ? rub(result.deliveryCost) : '—'}
              note={
                result
                  ? typo(`${rides(result.rides)} · ${result.truck.name} · до ${volume(result.perRideM3)} за рейс`)
                  : undefined
              }
            />
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
            <ArrowIcon className="arrow-slide h-4 w-4" />
          </Button>

          <p className="mt-3 text-t1 leading-snug text-ink-2">
            Расчёт ориентировочный: не учитывает простой под разгрузкой, ночную подачу и
            подъезд, недоступный для самосвала. Цену подтвердим письмом.
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
        {note && <p className="mt-0.5 text-t1 leading-snug text-ink-2">{note}</p>}
      </div>
      <span className="tnum shrink-0 font-medium">{value}</span>
    </div>
  );
}
