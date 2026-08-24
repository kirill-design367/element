'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { CATEGORIES, materialsOf, materialById } from '@/lib/catalog';
import { calculate, DESTINATIONS } from '@/lib/pricing';
import { rub, tons, volume } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRequest } from '@/components/providers/RequestProvider';
import { COMPANY } from '@/lib/company';
import { CheckIcon, CloseIcon } from '@/components/site/Icons';

type Status = 'idle' | 'sending' | 'done';
type Errors = Partial<Record<'name' | 'phone', string>>;

const DIGITS = /\d/g;

/**
 * Форма заявки.
 *
 * Сервера нет — сайт выгружается статикой. Поэтому форма не делает вид, что
 * что-то отправила: она собирает заявку, показывает её текст и даёт два
 * рабочих канала — письмо с уже заполненным телом и звонок. Обещаний, которых
 * сайт не выполняет, в интерфейсе нет.
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [comment, setComment] = useState('');

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
          km: req.brief.km,
        });
        const qty = item.unit === 'm3' ? volume(item.amount) : tons(item.amount);
        lines.push(
          `${i + 1}. ${material.name}, ${material.fraction} — ${qty}` +
            (calc ? ` · ориентировочно ${rub(calc.total)} с доставкой` : ''),
        );
      });
    } else {
      const m = materialById(materialId);
      lines.push(`Материал: ${m ? `${m.name}, ${m.fraction}` : '—'}`);
      lines.push(`Объём: ${amount ? `${amount} м³` : '—'}`);
    }

    lines.push('');
    const dest = DESTINATIONS.find((d) => d.id === req.brief.destinationId);
    lines.push(`Адрес объекта: ${req.brief.address || '—'}`);
    lines.push(
      `Расстояние от МКАД: ${req.brief.km} км${dest && dest.id !== 'other' ? ` (${dest.name})` : ''}`,
    );
    lines.push(`Срок поставки: ${deadline || '—'}`);
    if (comment) lines.push(`Комментарий: ${comment}`);
    return lines.join('\n');
  }, [name, phone, company, materialId, amount, deadline, comment, listMode, req.detailed, req.brief]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Как к вам обращаться?';
    const digits = (phone.match(DIGITS) || []).length;
    if (digits < 10) e.phone = 'Нужен номер из 10 цифр — на него перезвонит менеджер';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      document.getElementById(`${uid}-name`)?.focus();
      return;
    }
    setStatus('sending');
    // Заминка нужна не для вида: за неё успевает отрисоваться подтверждение.
    window.setTimeout(() => setStatus('done'), 850);
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

  const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent(
    `Заявка с сайта${company ? ` — ${company}` : ''}`,
  )}&body=${encodeURIComponent(summary)}`;

  const field =
    'h-12 w-full rounded-card border border-line-strong bg-surface px-3 text-[15px] text-ink ' +
    'transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
  const label = 'mb-1.5 block text-[13px] font-medium text-ink';

  if (status === 'done') {
    return (
      <div className="rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[21px] font-bold tracking-[-.015em]">
              Заявка собрана
            </h3>
            <p className="mt-1.5 max-w-[52ch] text-[14px] leading-relaxed text-ink-2">
              Приём заявок на сервере ещё не подключён — сайт выложен статикой. Чтобы заявка
              дошла сегодня, отправьте её письмом одной кнопкой или позвоните: текст уже готов.
            </p>
          </div>
        </div>

        <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-card border border-line bg-surface-2 p-4 text-[13px] leading-relaxed text-ink">
          {summary}
        </pre>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={mailto}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-card bg-accent px-5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Отправить письмом
          </a>
          <a
            href={`tel:${COMPANY.phone}`}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-card border border-line-strong bg-surface px-5 text-[15px] font-medium transition-colors hover:border-ink"
          >
            Позвонить {COMPANY.phoneLabel}
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-12 items-center justify-center rounded-card border border-line-strong bg-surface px-5 text-[15px] font-medium transition-colors hover:border-ink"
          >
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 rounded text-[14px] text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
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
      className="rounded-card border border-line bg-surface p-5 shadow-card md:p-7"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${uid}-name`}>
            Имя <span aria-hidden="true" className="text-accent">*</span>
          </label>
          <input
            id={`${uid}-name`}
            className={`${field} ${errors.name ? 'border-warn' : ''}`}
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
            <p id={`${uid}-name-err`} className="mt-1.5 text-[13px] text-warn">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className={label} htmlFor={`${uid}-phone`}>
            Телефон <span aria-hidden="true" className="text-accent">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            className={`${field} tnum ${errors.phone ? 'border-warn' : ''}`}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
          />
          {errors.phone && (
            <p id={`${uid}-phone-err`} className="mt-1.5 text-[13px] text-warn">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
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
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium">Позиции заявки</span>
              <button
                type="button"
                onClick={req.clear}
                className="rounded text-[13px] text-ink-2 underline-offset-4 hover:text-warn hover:underline"
              >
                Очистить список
              </button>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
              {req.detailed.map(({ item, material }) => (
                <li key={item.materialId} className="flex items-center gap-3 bg-surface-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{material.name}</p>
                    <p className="text-[12px] text-ink-2">
                      {material.fraction} · {material.gost}
                    </p>
                  </div>
                  <span className="tnum shrink-0 text-[14px]">
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
            <p className="mt-2 text-[13px] text-ink-2">
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
                        {m.name}, {m.fraction}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor={`${uid}-amount`}>
                Объём, м³
              </label>
              <input
                id={`${uid}-amount`}
                type="number"
                inputMode="decimal"
                min={1}
                className={`${field} tnum`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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
            placeholder="на этой неделе / к 15 сентября"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor={`${uid}-comment`}>
            Комментарий <span className="font-normal text-ink-2">— необязательно</span>
          </label>
          <textarea
            id={`${uid}-comment`}
            rows={3}
            className="w-full resize-y rounded-card border border-line-strong bg-surface px-3 py-2.5 text-[15px] transition-colors hover:border-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            placeholder="Подъезд для полуприцепа, разгрузка до 17:00, нужен паспорт качества заранее"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full sm:w-auto">
          {status === 'sending' ? 'Собираем заявку…' : 'Отправить заявку'}
        </Button>
        <p className="text-[13px] leading-snug text-ink-2">
          Обязательны только имя и телефон. Остальное уточним при звонке.
        </p>
      </div>

      {/* Полоска прогресса — единственная анимация формы. */}
      <div
        aria-hidden="true"
        className="mt-4 h-0.5 overflow-hidden rounded bg-line"
        style={{ opacity: status === 'sending' ? 1 : 0 }}
      >
        <div
          className="h-full bg-accent"
          style={{
            width: status === 'sending' ? '100%' : '0%',
            transition: 'width 800ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
    </form>
  );
}
