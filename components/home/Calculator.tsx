'use client';

import { useId, useMemo, useState } from 'react';
import {
  CATEGORIES,
  DEFAULT_MATERIAL_ID,
  fractionLabel,
  materialById,
  MATERIALS,
  materialsOf,
  priceOf,
  sellUnit,
  unitLabel,
} from '@/lib/catalog';
import {
  AVG_SPEED_KMH,
  MAX_ORDER_M3,
  MAX_ORDER_T,
  MAX_TRIP_KM,
  MIN_ORDER_M3,
  calculate,
  estimateTrip,
  type Unit,
} from '@/lib/pricing';
import { duration, nbsp, num, ON_REQUEST, rides, rub, rubOr, tons, volume, typo } from '@/lib/format';
import { Counter } from './Counter';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';
import { ArrowIcon } from '@/components/site/Icons';

const QUICK = [10, 20, 30, 60];

/**
 * Калькулятор стоит вторым блоком и считает на месте: цифры пересчитываются
 * при любом изменении, без кнопки «рассчитать» и без отправки на сервер.
 * Формулы — в lib/pricing.ts, здесь только интерфейс.
 *
 * ДОСТАВКИ ЗДЕСЬ БОЛЬШЕ НЕТ. Заказчик работает только на самовывоз: направления,
 * тариф подачи и цена километра убраны вместе с расстоянием от МКАД. Расчёт
 * отвечает на другой вопрос — сколько это стоит, во сколько рейсов увозится и
 * на какой машине.
 */
export function Calculator() {
  const uid = useId();
  const req = useRequest();

  /* Начальное значение — из данных, а не из порядка записей: признак
     isDefault у позиции. MATERIALS[0] на его месте молча менялся бы от любой
     сортировки списка. */
  const [materialId, setMaterialId] = useState(DEFAULT_MATERIAL_ID);
  const [amountText, setAmountText] = useState('20');
  const [unit, setUnit] = useState<Unit>('m3');
  /* Единица не хранится дважды. У металла она не выбирается вовсе: прокат
     считают тоннами, и кубометр проката не значит ничего. Поэтому единица
     выводится из материала, а состояние держит только выбор человека для
     инертных — иначе пришлось бы синхронизировать их эффектом и ловить
     кадр, в котором они разошлись. */
  const material = materialById(materialId);
  const forcedUnit: Unit | null = material && sellUnit(material) === 't' ? 't' : null;
  const effUnit: Unit = forcedUnit ?? unit;
  const [address, setAddress] = useState('');
  /* Расстояние до объекта. На стоимость оно не влияет — доставки нет, — а
     влияет на время рейса: человек едет за материалом сам и планирует день.

     Отдельно от числа хранится набранный текст. Пока поле было привязано
     прямо к числу, пустая строка мгновенно превращалась в 0, React не
     переписывал значение обратно, и ноль прилипал: очистить поле было
     нельзя, а набранное после него читалось как «025» и «07». */
  const [kmText, setKmText] = useState('20');
  const km = Math.max(0, Math.min(MAX_TRIP_KM, Number(kmText.replace(',', '.')) || 0));
  const trip = estimateTrip(km);

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
  const stamp = `${materialId}|${amountText}|${effUnit}`;
  const [sentStamp, setSentStamp] = useState('');
  const sent = sentStamp === stamp && sentStamp !== '';

  const computed = useMemo(
    () => (valid ? calculate({ materialId, amount, unit: effUnit }) : null),
    [materialId, amount, effUnit, valid],
  );

  /* Потолок сравнивается с объёмом ПОСЛЕ приведения к кубам: в тоннах
     10 000 м³ это совсем другое число, и сырое поле сравнивать нельзя.
     Выше потолка расчёта нет вовсе — не число покрупнее, а другой разговор. */
  /* Потолок сравнивается в той единице, в которой товар считается: у
     инертных это кубы, у металла тонны. Сравнивать массу инертных с тем же
     числом нельзя — 10 000 м³ песка это 16 500 т, и расчёт обрывался бы
     раньше потолка. */
  const overCap =
    !!computed &&
    (computed.blocked === 'no-fleet'
      ? computed.massT > MAX_ORDER_T
      : computed.volumeM3 > MAX_ORDER_M3);
  const result = overCap ? null : computed;
  /* Позиция без цены: считать стоимость нечего, и подставлять ноль нельзя.
     Объём, масса и рейсы при этом считаются — они от цены не зависят. */
  const noPrice = result?.blocked === 'no-price';
  /* Металл: стоимость проката считается точно, а рейсы не подбираются —
     плотности у проката в данных нет, и самосвал ему не подходит. */
  const noFleet = result?.blocked === 'no-fleet';

  /* КРУПНЫМ ЧИСЛОМ — СТОИМОСТЬ, ЕСЛИ ОНА ИЗВЕСТНА, ИНАЧЕ КОЛИЧЕСТВО.
     Прочерк или ноль на месте главного числа читались бы как «бесплатно» и
     как ошибка вёрстки; количество известно всегда, и оно тоже ответ. */
  const priced = result?.materialCost ?? null;
  const headline =
    priced !== null ? priced : result ? (noFleet ? result.massT : result.volumeM3) : null;
  const headlineUnit = priced !== null ? '₽' : noFleet ? 'т' : 'м³';
  /** Разрядность крупного числа — по ней выбирается ступень кегля. */
  const totalDigits = headline != null ? String(Math.round(headline)).length : 0;

  const toRequest = () => {
    if (!result) return;
    req.add(materialId, amount, effUnit);
    req.patchBrief({ address });
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
                      {m.name}, {fractionLabel(m.fraction)} —{' '}
                      {priceOf(m) === null
                        ? ON_REQUEST
                        : `${rub(priceOf(m) as number)}/${unitLabel(c.unit)}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor={`${uid}-amount`}>
              {forcedUnit ? 'Масса' : 'Объём'}
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
                {/* У металла выбора нет: кубометр проката не значит ничего.
                    Кнопка «м³» при этом не исчезает, а гаснет — место под
                    переключатель не меняется ни на пиксель. */}
                {(['m3', 't'] as Unit[]).map((u) => {
                  const off = forcedUnit !== null && forcedUnit !== u;
                  return (
                    <label
                      key={u}
                      className={`flex h-10 items-center justify-center rounded px-3 text-t2 font-medium transition-colors ${
                        off
                          ? 'cursor-not-allowed text-ink-3 opacity-45'
                          : effUnit === u
                            ? 'cursor-pointer bg-accent text-white'
                            : 'cursor-pointer text-ink-2 hover:text-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${uid}-unit`}
                        className="sr-only"
                        disabled={off}
                        checked={effUnit === u}
                        onChange={() => setUnit(u)}
                      />
                      {u === 'm3' ? 'м³' : 'т'}
                    </label>
                  );
                })}
              </fieldset>
            </div>
            {!valid && (
              <p id={`${uid}-amount-hint`} className="mt-1.5 text-t1 text-warn">
                Укажите объём числом — например, 20
              </p>
            )}
            {/* Пилюля видимая — 36 px, и такой она и остаётся. Цель нажатия
                поднята до 44 прозрачным слоем поверх (.tap-over): полем её
                не поднять, у чипа задана высота и padding ушёл бы внутрь
                рамки. Раскладка не изменилась — слой абсолютный. */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmountText(String(q));
                    if (!forcedUnit) setUnit('m3');
                  }}
                  className="tap-over tnum inline-flex h-9 items-center rounded-pill border border-line px-3 text-t1 text-ink-2 transition-colors hover:border-accent hover:text-accent"
                >
                  {`${q}\u00A0${unitLabel(effUnit === 't' ? 't' : 'm3')}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor={`${uid}-km`}>
              Расстояние до объекта, км
            </label>
            <input
              id={`${uid}-km`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_TRIP_KM}
              className={`${field} tnum`}
              value={kmText}
              onChange={(e) => setKmText(e.target.value)}
              aria-describedby={`${uid}-km-hint`}
            />
            <p id={`${uid}-km-hint`} className="mt-1.5 text-t1 leading-snug text-ink-2">
              {typo('От площадки в Люберцах, в одну сторону. На стоимость не влияет — только на время рейса.')}
            </p>
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
            {/* Адрес на расчёт не влияет — доставки нет. Поле остаётся,
                потому что менеджеру полезно знать, куда пойдёт материал. */}
            <p id={`${uid}-address-hint`} className="mt-1.5 text-t1 text-ink-2">
              Нужен менеджеру, чтобы понимать объект.
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
              {/* У металла итога с доставкой не бывает — крупным числом
                  стоит стоимость проката, и подпись говорит об этом. */}
              {/* Подпись говорит, ЧТО за число стоит рядом: стоимость, если
                  она известна, иначе количество. */}
              <dt className="text-t1 font-medium text-ink-2">
                {priced !== null ? 'Материал' : noFleet ? 'Масса' : 'Объём'}
              </dt>
              {/* Кегль итога ступенчатый. Ступень t5 рассчитана на пять-шесть
                  разрядов; на семи число переставало помещаться в панель, а
                  на 1280 разгоняло всю сетку и страница ехала вбок на 36 px.
                  Ступеней две, обе из шкалы проекта: t5 до шести разрядов,
                  t4 дальше. Шестой ступени этим не заводится — берутся
                  существующие. min-w-0 на ячейке обязателен: у грид-колонки
                  min-width по умолчанию auto, и широкое число раздвигало
                  колонку изнутри, сколько бы кегль ни уменьшали. */}
              <dd
                data-total
                className={`mt-1 flex min-w-0 items-baseline gap-2 font-black leading-[.85] tracking-[-.04em] ${
                  totalDigits > 6 ? 'text-t4' : 'text-t5'
                }`}
              >
                {headline !== null ? (
                  <>
                    <Counter
                      value={headline}
                      format={(n) => num(priced !== null ? Math.round(n) : n, priced !== null || Number.isInteger(headline) ? 0 : 1)}
                      live
                    />
                    <span className={totalDigits > 6 ? 'text-t3' : 'text-t4'}>{headlineUnit}</span>
                  </>
                ) : (
                  /* Прочерк ступенью t5 — это чёрточка в 128 px кегля: на
                     тёмной панели она читается замазанной строкой, а не
                     отсутствием числа. Здесь он бывает только когда расчёта
                     нет вовсе — объём не набран или выше потолка. */
                  <span className="text-t4">—</span>
                )}
              </dd>
            </dl>
            {/* Отдельной строки «стоимость — уточняйте» здесь нет: ровно эту
                формулировку показывает строка «Материал» в разбивке двумя
                десятками пикселей ниже, и сказанное дважды подряд читается
                сбоем, а не заботой. */}
          </div>

          {/* Разбивка как в счёте: строка — статья — сумма. Под итогом: она
              объясняет цифру, а не подводит к ней. */}
          <div className="mt-5 space-y-3 border-t border-line pt-4 text-t2" aria-live="polite">
            <Row
              label={noFleet ? 'Масса' : 'Объём и масса'}
              value={
                result
                  ? noFleet
                    ? tons(result.massT)
                    : nbsp(`${volume(result.volumeM3)} · ${tons(result.massT)}`)
                  : '—'
              }
            />
            <Row label="Материал" value={result ? rubOr(result.materialCost) : '—'} />
            {/* Рейсы у металла не подбираются: плотности у проката в данных
                нет, и самосвал ему не подходит. Подставлять его ради числа
                в панели нельзя — это была бы выдумка про товар. */}
            <Row
              label="Рейсов"
              value={result ? (noFleet ? 'подбираем по вашей машине' : rides(result.rides)) : '—'}
              note={
                result && result.truck
                  ? typo(`${result.truck.name} · до ${volume(result.perRideM3)} за рейс`)
                  : undefined
              }
            />
            {/* Время считает estimateTrip — одна функция на весь сайт, и
                когда появится маршрутизатор, меняться будет только она. */}
            <Row
              label="Рейс в одну сторону"
              value={trip.km > 0 ? duration(trip.minutes) : '—'}
              note={
                trip.km > 0
                  ? typo(`${num(trip.km)} км, средняя ${AVG_SPEED_KMH} км/ч`)
                  : 'укажите расстояние'
              }
            />
          </div>

          {overCap && (
            <p className="mt-4 rounded border-l-2 border-accent bg-accent-soft px-3 py-2 text-t1 leading-snug text-ink">
              {typo(
                forcedUnit
                  ? `Больше ${num(MAX_ORDER_T)} т считаем отдельно: на таком объёме цену собираем под график отгрузки, а не берём по прайсу.`
                  : `Больше ${num(MAX_ORDER_M3)} м³ считаем отдельно: на таком объёме цену собираем под график отгрузки и под конкретный карьер, а не берём по прайсу.`,
              )}{' '}
              <a href="#zayavka" className="link-underline rounded font-medium text-accent">
                Оставьте заявку
              </a>
              {typo(' — ответим ценой и сроком.')}
            </p>
          )}

          {noFleet && (
            <p className="mt-4 rounded border-l-2 border-accent bg-accent-soft px-3 py-2 text-t1 leading-snug text-ink">
              {typo('Число рейсов у проката зависит от вашей машины: плотности и кузова.')}{' '}
              <a href="#zayavka" className="link-underline rounded font-medium text-accent">
                Оставьте заявку
              </a>
              {typo(' — назовём срок и подскажем по погрузке.')}
            </p>
          )}

          {noPrice && (
            <p className="mt-4 rounded border-l-2 border-accent bg-accent-soft px-3 py-2 text-t1 leading-snug text-ink">
              {typo(
                'Цену на эту позицию уточняем: в прайсе против неё числа нет. Объём и рейсы посчитали — они от цены не зависят.',
              )}{' '}
              <a href="#zayavka" className="link-underline rounded font-medium text-accent">
                Оставьте заявку
              </a>
              {typo(' — назовём цену и срок.')}
            </p>
          )}

          {result?.belowMinimum && (
            <p className="mt-4 rounded border-l-2 border-warn bg-warn-soft px-3 py-2 text-t1 leading-snug text-ink">
              Минимальная отгрузка — {MIN_ORDER_M3} м³, это одна машина.
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
            {noFleet
              ? 'Цена проката за тонну из прайса. Срок и погрузку называем по заявке.'
              : 'Расчёт ориентировочный: рейсы считаны по кузову и грузоподъёмности, фактическая загрузка зависит от влажности материала. Точную цену назовём по телефону.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  /* Табличные цифры вешаются только на значения с цифрами. В CoFo Sans фича
     tnum подменяет заодно пробел широким — «считаем отдельно» и «уточняйте»
     расходились разрядкой втрое шире нормальной. */
  const numeric = /\d/.test(value);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-ink-2">{label}</span>
        {note && <p className="mt-0.5 text-t1 leading-snug text-ink-2">{note}</p>}
      </div>
      <span className={`shrink-0 font-medium ${numeric ? 'tnum' : ''}`}>{value}</span>
    </div>
  );
}
