import type { ReactNode } from 'react';

/**
 * Заголовок секции. Нумерации блоков нет — только слово и подзаголовок:
 * снабженцу нужен смысл, а не порядковый номер.
 */
export function SectionHead({
  title,
  lead,
  aside,
  id,
}: {
  title: string;
  lead?: string;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[720px]">
        <h2
          id={id}
          className="font-display text-t4 uppercase leading-[1.05] tracking-[.005em]"
        >
          {title}
        </h2>
        {lead && <p className="mt-3 max-w-[58ch] text-t2 leading-relaxed text-ink-2 md:text-base">{lead}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export function Section({
  id,
  children,
  className = '',
  tone = 'bg',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'bg' | 'surface' | 'muted';
}) {
  const bg = tone === 'surface' ? 'bg-surface' : tone === 'muted' ? 'bg-surface-2' : '';
  return (
    <section id={id} className={`scroll-mt-20 py-14 md:py-24 ${bg} ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}
