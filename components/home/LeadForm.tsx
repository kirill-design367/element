'use client';

import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { CATEGORIES, fractionLabel, materialById, materialsOf, sellUnit, unitLabel } from '@/lib/catalog';
import { calculate } from '@/lib/pricing';
import { nbsp, ON_REQUEST, phoneDigits, phoneMask, rub, tons, volume } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';
import { COMPANY } from '@/lib/company';
import { CheckIcon, CloseIcon } from '@/components/site/Icons';

type Status = 'idle' | 'sending' | 'done';
type Errors = Partial<Record<'name' | 'phone' | 'amount', string>>;

/** Адрес приёмника. Файл лежит в public/api и уезжает вместе с выдачей. */
const ENDPOINT = '/api/lead.php';

/**
 * Форма заявки.
 *
 * ЗАЯВКА УХОДИТ ПИСЬМОМ НА САМОМ ДЕЛЕ. Раньше уйти ей было некуда: сайт
 * статический, и форма честно говорила, что приёма нет, — собирала текст и
 * предлагала позвонить. Теперь на хостинге есть PHP, и заявка отправляется
 * на адрес заказчика из lib/company.ts.
 *
 * Страница при этом не перезагружается: обычная отправка формы увела бы
 * человека на белый экран ответа скрипта, а список позиций заявки живёт
 * только в памяти страницы и не пережил бы перехода.
 *
 * ЧТО ОСТАЛОСЬ ОТ ПРЕЖНЕГО. Кнопка «Скопировать» — текст заявки по-прежнему
 * можно продиктовать по телефону, и это до сих пор самый быстрый путь.
 * Телефон рядом с ошибкой — тоже: если письмо не ушло, звонок остаётся.
 */
/**
 * @param hideItems — панель каталога уже показывает позиции со своими полями
 * объёма, и второй такой же список внутри формы только сбивает с толку.
 */
export function LeadForm({ hideItems = false }: { hideItems?: boolean } = {}) {
  const uid = useId();
  const req = useRequest();

  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState(false);
  /** Текст отказа сервера или сети. Пустая строка — отказа не было. */
  const [failure, setFailure] = useState('');
  /* ЛОВУШКА ЧАСОВ. Время появления формы на странице: сервер не принимает
     заявку, отправленную быстрее двух секунд после загрузки, — человек
     столько не набирает даже с автозаполнением. Отсчёт ведётся от монтажа,
     а не от первого нажатия: форма стоит ниже сгиба, и к ней ещё надо
     доскроллить. useRef, а не useState: перерисовка от этого не нужна. */
  const mountedAt = useRef(Date.now());
  /* Ловушка-приманка. Поле с этим именем в форме есть, человеку не видно, и
     у настоящей заявки поля почты нет вовсе — заполнить его может только
     тот, кто заполняет всё подряд. */
  const [trap, setTrap] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [comment, setComment] = useState('');

  /* Единица поля количества — из категории выбранного материала. Металл
     считается тоннами, инертные кубами; пока выбор не сделан, куб. */
  const leadMaterial = materialById(materialId);
  const leadUnit = leadMaterial ? sellUnit(leadMaterial) : 'm3';

  const listMode = req.count > 0;
  const showItems = listMode && !hideItems;

  const summary = useMemo(() => {
    const lines: string[] = ['Заявка с сайта «Строительный Дом Элемент»', ''];
    lines.push(`Имя: ${name || '—'}`);
    lines.push(`Телефон: ${phone || '—'}`);
    if (company) lines.push(`Компания: ${company}`);
    lines.push('');

    if (listMode) {
      lines.push('Позиции:');
      req.detailed.forEach(({ item, material }, i) => {
        const calc = calculate({
          materialId: item.materialId,
          amount: item.amount,
          unit: item.unit,
        });
        const qty = item.unit === 'm3' ? volume(item.amount) : tons(item.amount);
        /* Позиция без цены уходит в письмо честно: той же формулировкой,
           что на сайте, а не нулём. */
        const money =
          calc === null
            ? ''
            : calc.materialCost === null
              ? ` · цена ${ON_REQUEST}`
              : ` · ориентировочно ${rub(calc.materialCost)}`;
        lines.push(
          `${i + 1}. ${material.name}, ${fractionLabel(material.fraction)} — ${qty}${money}`,
        );
      });
    } else {
      const m = materialById(materialId);
      /* Пустое значение — это не «поле не заполнили», а выбранный пункт
         «Подберём вместе». Прочерк на его месте читался в заявке так, будто
         человек просто пропустил вопрос.

         Отдельного пункта «Металлопрокат» здесь больше нет: металл заведён
         в каталог шестой категорией и приходит в этот список сам, своими
         позициями. Единица в письме — из категории: прокат меряется тоннами,
         и «м³» против арматуры было бы неправдой. */
      lines.push(
        `Материал: ${m ? `${m.name}, ${fractionLabel(m.fraction)}` : 'подберём вместе'}`,
      );
      const u = m ? unitLabel(sellUnit(m)) : 'м³';
      lines.push(`${m && sellUnit(m) === 't' ? 'Масса' : 'Объём'}: ${amount ? `${amount} ${u}` : '—'}`);
    }

    lines.push('');
    /* Адрес объекта в письме остался — менеджеру полезно понимать объект, —
       а расстояния от МКАД больше нет: доставки у нас нет, и километраж в
       заявке ни на что не влиял бы. */
    lines.push(`Адрес объекта: ${req.brief.address || '—'}`);
    lines.push(`Срок поставки: ${deadline || '—'}`);
    if (comment) lines.push(`Комментарий: ${comment}`);
    return lines.join('\n');
  }, [name, phone, company, materialId, amount, deadline, comment, listMode, req.detailed, req.brief]);

  /** Возвращает найденные ошибки, а не булево: они же нужны, чтобы увести
      фокус в первое сломанное поле. */
  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Как к вам обращаться?';
    if (phoneDigits(phone) < 10) e.phone = 'Нужен номер из 10 цифр — на него перезвоним';
    /* Объём проверяется здесь, а не браузером. Пока поле было type="number",
       нечисловое в него просто не вводилось; после перевода на type="text"
       ради запятой в дробях эта защита пропала, и «абвгд» уходило в заявку
       строкой «Объём: абвгд м³». */
    if (amount.trim()) {
      /* Пробелы выбрасываются той же логикой, что в калькуляторе: сайт сам
         печатает объёмы разрядкой («1 000 м³»), и скопированное из своей же
         строки поле не должно отвергаться. */
      const n = Number(amount.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) {
        e.amount = leadUnit === 't' ? 'Масса числом, например 20 или 12,5' : 'Объём числом, например 20 или 12,5';
      }
    }
    setErrors(e);
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    /* Повторное нажатие не проходит: кнопка на время отправки выключена, но
       Enter в поле обходит её вовсе, и без этой строки два одинаковых письма
       уходили бы одним движением. */
    if (status === 'sending') return;
    setFailure('');
    const found = validate();
    if (Object.keys(found).length > 0) {
      /* Фокус — в первое поле с ошибкой, а не всегда в «Имя». Иначе курсор
         прыгал в правильно заполненное поле, а текст ошибки, привязанный
         через aria-describedby к другому, скринридером не читался. */
      const first = (['name', 'phone', 'amount'] as const).find((k) => found[k]) ?? 'name';
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    /* Поля идут отдельными значениями, а не готовым текстом заявки: письмо
       собирает сервер из проверенных полей, а `summary` остаётся тем, чем и
       был, — текстом под кнопку «Скопировать», чтобы продиктовать по
       телефону. Это два разных документа для двух разных случаев. */
    const chosen = materialById(materialId);
    const body = new URLSearchParams();
    body.set('name', name.trim());
    body.set('phone', phone.trim());
    if (company.trim()) body.set('company', company.trim());
    if (listMode) {
      /* ПОЗИЦИИ ЗАЯВКИ УХОДЯТ СПИСКОМ, а не одной строкой «материал». Панель
         каталога — это та же форма, и заявка из неё обычно на несколько
         позиций: менеджеру нужны и количество по каждой, и цена, по которой
         человек считал.

         Каждое поле — уже готовая к чтению строка, собранная теми же
         хелперами, что и витрина: разойтись цене в письме и цене на экране
         не с чего. Позиция без цены уходит честно, той же формулировкой, что
         на сайте, а не нулём — ноль читался бы «бесплатно». */
      body.set(
        'items',
        JSON.stringify(
          req.detailed.map(({ item, material }) => {
            const calc = calculate({
              materialId: item.materialId,
              amount: item.amount,
              unit: item.unit,
            });
            return {
              name: `${material.name}, ${fractionLabel(material.fraction)}`,
              qty: item.unit === 'm3' ? volume(item.amount) : tons(item.amount),
              sum:
                calc === null || calc.materialCost === null
                  ? ON_REQUEST
                  : `≈ ${rub(calc.materialCost)}`,
            };
          }),
        ),
      );
    } else {
      body.set(
        'material',
        chosen ? `${chosen.name}, ${fractionLabel(chosen.fraction)}` : 'подберём вместе',
      );
      if (amount.trim()) {
        body.set('amount', `${amount.trim()} ${unitLabel(leadUnit)}`);
      }
    }
    if (req.brief.address.trim()) body.set('address', req.brief.address.trim());
    if (deadline.trim()) body.set('deadline', deadline.trim());
    if (comment.trim()) body.set('comment', comment.trim());
    body.set('source', hideItems ? 'панель заявки в каталоге' : 'форма на странице');
    body.set('elapsed', String(Date.now() - mountedAt.current));
    body.set('email', trap);

    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
      });
      /* Ответ разбирается ОСТОРОЖНО. Если PHP на сервере не включён, сюда
         придёт не JSON, а исходник скрипта с кодом 200 — и наивный
         res.ok показал бы подтверждение по заявке, которая никуда не ушла. */
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; errors?: Errors }
        | null;

      if (res.ok && data?.ok === true) {
        setStatus('done');
        return;
      }

      /* Сервер проверяет те же поля, что и форма. Разойтись они не должны,
         но если сервер всё же нашёл своё — показываем это у полей, а не
         общей строкой: человеку надо знать, что именно поправить. */
      if (res.status === 422 && data?.errors) {
        setErrors(data.errors);
        setStatus('idle');
        const first = (['name', 'phone', 'amount'] as const).find((k) => data.errors?.[k]);
        if (first) document.getElementById(`${uid}-${first}`)?.focus();
        return;
      }

      setStatus('idle');
      setFailure(
        data?.error
          ?? 'Не получилось отправить заявку — сервер ответил ошибкой.',
      );
    } catch {
      /* Сеть отвалилась или скрипта нет вовсе. Данные в полях остаются на
         месте: человек, набравший заявку, не должен набирать её заново. */
      setStatus('idle');
      setFailure('Не получилось отправить заявку — похоже, пропала связь.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const field =
    'field h-11 w-full rounded-card px-3 text-t2';
  const label = 'mb-1 block text-t1 font-medium text-ink';

  if (status === 'done') {
    return (
      /* role="status" и tabIndex={-1}: форма целиком заменяется этим блоком,
         кнопка, на которой стоял фокус, размонтируется, и фокус уходил в
         BODY. Человек с клавиатуры и со скринридером не узнавал, что заявка
         собрана, и продолжал Tab с начала страницы. */
      <div
        ref={(el) => el?.focus()}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="rounded-panel bg-surface-2 p-5 outline-none md:p-7"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-t3 font-bold tracking-[-.015em]">
              Заявка отправлена
            </h3>
            {/* Срок ответа здесь не назван и назван не будет: письмо дошло до
                почты, а когда его прочтут — не нам обещать. Правило 5. */}
            <p className="mt-1.5 max-w-[52ch] text-t2 leading-relaxed text-ink-2">
              Письмо ушло менеджеру. Если дело срочное, звоните: текст заявки ниже, его
              можно скопировать и продиктовать.
            </p>
          </div>
        </div>

        <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-card border border-line bg-surface-2 p-4 text-t1 leading-relaxed text-ink">
          {summary}
        </pre>

        {/* Звонок остаётся главным действием и на этом экране: письмо ушло,
            но прочтут его не мгновенно, а по телефону отвечают сразу. */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={`tel:${COMPANY.phone}`}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-card bg-accent px-5 text-t2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Позвонить {nbsp(COMPANY.phoneLabel)}
          </a>
          <button
            type="button"
            onClick={copy}
            className="btn inline-flex h-12 items-center justify-center rounded-card border border-line bg-surface px-5 text-t2 font-medium"
          >
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="link-underline mt-4 inline-block rounded text-t2 text-accent"
        >
          Составить ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-panel bg-surface-2 p-4 md:p-4"
    >
      {/* ЛОВУШКА ДЛЯ БОТА. Поле называется «email» неспроста: у настоящей
          заявки поля почты НЕТ вовсе, и заполнить это может только тот, кто
          заполняет всё подряд. Заполнено — сервер отвечает успехом и не шлёт
          ничего.

          Прячется вырезкой, а не display: none и не сдвигом за экран.
          display: none часть ботов пропускает как «выключенное поле», а
          left: -9999px у absolute-элемента раздвигает страницу влево — и
          горизонтальный вылет ловится потом обходом, но чинится долго.
          Здесь коробка 1×1 остаётся на своём месте в потоке, вне потока и
          без смещений.

          aria-hidden и tabIndex={-1}: до поля не дойти ни табом, ни
          скринридером — для человека его нет. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      >
        <label htmlFor={`${uid}-email`}>Не заполняйте это поле</label>
        <input
          id={`${uid}-email`}
          name="email"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      {/* Три колонки, но колонка формы расширена с 7 до 8 из 12 — поле стало
          шире, около 257 px против прежних 200.

          Четыре колонки пробовались и отклонены: они снимали ещё 78 px
          высоты, но поле сужалось до 172 px, и подпись выбранного материала
          переставала помещаться (нужно 128 px, оставалось 120). Плейсхолдер
          срока не помещался и до этого — 222 px против 172, — а на 257 px он
          помещается впервые. Высоту режем отступами, поля не трогаем.

          Ниже 1024 — две колонки, на телефоне одна. */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={label} htmlFor={`${uid}-name`}>
            Имя <span aria-hidden="true" className="text-ink-2">*</span>
          </label>
          <input
            id={`${uid}-name`}
            className={`${field} ${errors.name ? 'is-error' : ''}`}
            value={name}
            autoComplete="name"
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-name-err` : undefined}
          />
          {errors.name && (
            <p id={`${uid}-name-err`} className="mt-1.5 text-t1 text-warn">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className={label} htmlFor={`${uid}-phone`}>
            Телефон <span aria-hidden="true" className="text-ink-2">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            /* Без .tnum: у номера нет колонки, а фича разгоняет заодно дефисы —
               «160-78-78» превращается в «160 - 78 - 78». Правило 8. */
            className={`${field} ${errors.phone ? 'is-error' : ''}`}
            value={phone}
            /* Маска на вводе, а не только в плейсхолдере. Разбор идёт по
               цифрам, поэтому вставка из буфера в любом виде — «89991234567»,
               «8 999 123-45-67», «+7(999)1234567» — приводится к одному
               виду, а не отвергается. */
            onChange={(e) => {
              setPhone(phoneMask(e.target.value));
              if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
          />
          {errors.phone && (
            <p id={`${uid}-phone-err`} className="mt-1.5 text-t1 text-warn">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="lg:col-span-1">
          <label className={label} htmlFor={`${uid}-company`}>
            Компания <span className="font-normal text-ink-2">— необязательно</span>
          </label>
          <input
            id={`${uid}-company`}
            className={field}
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        {showItems ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-t1 font-medium">Позиции заявки</span>
              <button
                type="button"
                onClick={req.clear}
                className="rounded text-t1 text-ink-2 underline-offset-4 hover:text-warn hover:underline"
              >
                Очистить список
              </button>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
              {req.detailed.map(({ item, material }) => (
                <li key={item.materialId} className="flex items-center gap-3 bg-surface-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-t2 font-medium">{material.name}</p>
                    <p className="text-t1 text-ink-2">
                      {fractionLabel(material.fraction)} · {material.gost}
                    </p>
                  </div>
                  <span className="tnum shrink-0 text-t2">
                    {item.unit === 'm3' ? volume(item.amount) : tons(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => req.remove(item.materialId)}
                    className="shrink-0 rounded p-1.5 text-ink-2 transition-colors hover:bg-warn-soft hover:text-warn"
                    aria-label={`Убрать ${material.name} из заявки`}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-t1 text-ink-2">
              Объём по каждой позиции меняется в каталоге и в калькуляторе.
            </p>
          </div>
        ) : listMode ? null : (
          <>
            <div>
              <label className={label} htmlFor={`${uid}-material`}>
                Материал
              </label>
              <select
                id={`${uid}-material`}
                className={field}
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
              >
                <option value="">Подберём вместе</option>
                {CATEGORIES.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {materialsOf(c.id).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}, {fractionLabel(m.fraction)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor={`${uid}-amount`}>
                {/* Подпись и единица идут за выбранным материалом: металл
                    меряется тоннами, и «Объём, м³» против арматуры было бы
                    неправдой ещё до того, как заявка уйдёт. */}
                {leadUnit === 't' ? 'Масса, т' : 'Объём, м³'}
              </label>
              <input
                id={`${uid}-amount`}
                /* type="text" по той же причине, что в калькуляторе:
                   числовое поле молча съедает запятую. Проверку числа при
                   этом делает validate(): браузер её больше не делает. */
                type="text"
                inputMode="decimal"
                className={`${field} tnum ${errors.amount ? 'is-error' : ''}`}
                value={amount}
                aria-invalid={errors.amount ? true : undefined}
                aria-describedby={errors.amount ? `${uid}-amount-err` : undefined}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
                }}
              />
              {errors.amount && (
                <p id={`${uid}-amount-err`} className="mt-1.5 text-t1 text-warn">
                  {errors.amount}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className={label} htmlFor={`${uid}-address`}>
            Адрес объекта
          </label>
          <input
            id={`${uid}-address`}
            className={field}
            autoComplete="street-address"
            value={req.brief.address}
            onChange={(e) => req.patchBrief({ address: e.target.value })}
          />
        </div>

        <div>
          <label className={label} htmlFor={`${uid}-deadline`}>
            Срок поставки
          </label>
          <input
            id={`${uid}-deadline`}
            className={field}
            /* Короче прежнего «на этой неделе / к 15 сентября»: тот не
               помещался в поле — 222 px текста против 208 доступных на
               лендинге и 124 в панели заявки каталога, — и обрывался посреди
               слова. Поля здесь расширить нельзя: три колонки уже предел, а
               четыре пробовались и отклонены. */
            placeholder="к 15 сентября"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor={`${uid}-comment`}>
            Комментарий <span className="font-normal text-ink-2">— необязательно</span>
          </label>
          <textarea
            id={`${uid}-comment`}
            rows={2}
            className="field w-full resize-y rounded-card px-3 py-2.5 text-t2"
            /* Короче прежнего: тот занимал 582 px и на 390 раскладывался в
               три строки при двух видимых. */
            placeholder="Подъезд для полуприцепа, разгрузка до 17:00"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {/* ОТКАЗ ОТПРАВКИ. Стоит над кнопкой, а не под ней: человек смотрит
            туда, где только что нажал. role="alert" — экран не меняется, и
            без объявления со скринридером отказа было бы не узнать вовсе.

            Набранное при этом никуда не девается: состояние полей не
            сбрасывается ни в одной ветке отправки. */}
        {failure && (
          <div role="alert" className="rounded-card border border-warn/40 bg-warn-soft p-3">
            <p className="text-t2 leading-snug text-ink">{failure}</p>
            <p className="mt-1 text-t2 leading-snug text-ink-2">
              Заявка не потеряна — поля заполнены. Попробуйте ещё раз или позвоните:{' '}
              <a href={`tel:${COMPANY.phone}`} className="link-underline font-medium text-accent">
                {nbsp(COMPANY.phoneLabel)}
              </a>
            </p>
          </div>
        )}
        {/* Кнопка во всю ширину колонки: это последнее действие на
            странице, сужать его незачем. */}
        <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
        </Button>
        <p className="text-t1 leading-snug text-ink-2">
          Обязательны только имя и телефон. Остальное уточним при звонке.
        </p>
      </div>

      {/* Полоска прогресса — единственная анимация формы. */}
      <div
        aria-hidden="true"
        className="mt-3 h-0.5 overflow-hidden rounded bg-line"
        style={{ opacity: status === 'sending' ? 1 : 0 }}
      >
        <div
          className="h-full bg-ink"
          style={{
            width: status === 'sending' ? '100%' : '0%',
            transition: 'width 800ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
    </form>
  );
}
