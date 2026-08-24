import type { ReactNode } from 'react';

/**
 * Заголовок секции по образцу шапки документа: слева поле метки
 * моноширинным, справа название и пояснение. Метка несёт факт о секции
 * (число позиций, срок ответа, дата среза), а не порядковый номер —
 * нумерация оправдана только там, где порядок сам по себе информация.
 *
 * Колонка метки одинаковой ширины во всех секциях — за счёт этого
 * заголовки выравниваются по вертикали на всю длину страницы.
 */
export function SectionHead({
  label,
  title,
  lead,
  aside,
  id,
}: {
  label: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="doc-grid border-t border-line-strong pt-4 md:pt-5">
      <p className="mark pb-3 text-ink-2 md:pb-0">{label}</p>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-[760px]">
          <h2 id={id} className="text-t4 font-display font-semibold tracking-[-.03em]">
            {title}
          </h2>
          {lead && <p className="mt-4 max-w-[62ch] text-t2 text-ink-2">{lead}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}

/**
 * Секция. Светлые идут на одном фоне и делятся линейкой и воздухом:
 * промежуточных серых нет. Тёмная переключает токены классом `.inv`,
 * поэтому стык получается резким сам собой — фон меняется на границе.
 */
export function Section({
  id,
  children,
  className = '',
  tone = 'light',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 py-16 md:py-24 ${tone === 'dark' ? 'inv' : ''} ${className}`}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/** Строка спецификации: метка слева, значение справа, выравнивание по разряду. */
export function SpecRow({
  term,
  value,
  strong,
}: {
  term: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2">
      <dt className="mark text-ink-2">{term}</dt>
      <dd className={`tnum text-right ${strong ? 'font-display font-semibold' : 'mark-value'}`}>
        {value}
      </dd>
    </div>
  );
}
