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
/** Значение пункта «Металлопрокат» в списке материалов. Намеренно не
    идентификатор каталога: в каталоге металла нет. */
const METAL_OPTION = 'metal';

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
      if (materialId === METAL_OPTION) {
        lines.push('Материал: металлопрокат');
        lines.push(`Объём: ${amount ? `${amount} м³` : '—'}`);
      } else {
        const m = materialById(materialId);
        lines.push(`Материал: ${m ? `${m.name}, ${m.fraction}` : '—'}`);
        lines.push(`Объём: ${amount ? `${amount} м³` : '—'}`);
      }
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
    'field h-11 w-full rounded-card px-3 text-t2';
  const label = 'mb-1 block text-t1 font-medium text-ink';

  if (status === 'done') {
    return (
      <div className="rounded-panel bg-surface-2 p-5 md:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-t3 font-bold tracking-[-.015em]">
              Заявка собрана
            </h3>
            <p className="mt-1.5 max-w-[52ch] text-t2 leading-relaxed text-ink-2">
              Приём заявок на сервере ещё не подключён — сайт выложен статикой. Чтобы заявка
              дошла сегодня, отправьте её письмом одной кнопкой или позвоните: текст уже готов.
            </p>
          </div>
        </div>

        <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-card border border-line bg-surface-2 p-4 text-t1 leading-relaxed text-ink">
          {summary}
        </pre>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={mailto}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-card bg-accent px-5 text-t2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Отправить письмом
          </a>
          <a
            href={`tel:${COMPANY.phone}`}
            className="btn inline-flex h-12 flex-1 items-center justify-center rounded-card border border-line bg-surface px-5 text-t2 font-medium"
          >
            Позвонить {COMPANY.phoneLabel}
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
            className={`${field} tnum ${errors.phone ? 'is-error' : ''}`}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
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
                      {material.fraction} · {material.gost}
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
                        {m.name}, {m.fraction}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {/* Металлопрокат стоит отдельным пунктом, а не позицией
                    каталога: номенклатуры, марок и цен по нему ещё нет, и в
                    lib/catalog.ts его быть не должно — оттуда считается число
                    позиций, фильтры и калькулятор. Значение METAL_OPTION не
                    совпадает ни с одним идентификатором каталога, поэтому
                    materialById его не найдёт, и в письмо он уходит своей
                    веткой. */}
                <option value={METAL_OPTION}>Металлопрокат</option>
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

        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor={`${uid}-comment`}>
            Комментарий <span className="font-normal text-ink-2">— необязательно</span>
          </label>
          <textarea
            id={`${uid}-comment`}
            rows={2}
            className="field w-full resize-y rounded-card px-3 py-2.5 text-t2"
            placeholder="Подъезд для полуприцепа, разгрузка до 17:00, нужен паспорт качества заранее"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {/* Кнопка во всю ширину колонки: это последнее действие на
            странице, сужать его незачем. */}
        <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Собираем заявку…' : 'Отправить заявку'}
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
