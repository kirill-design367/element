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
  stacked,
}: {
  title: string;
  lead?: string;
  aside?: ReactNode;
  id?: string;
  /** Заголовок и пояснение столбиком, а не в строку с aside. */
  stacked?: boolean;
}) {
  return (
    <div
      className={
        stacked
          ? 'mb-8 md:mb-12'
          : 'mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between'
      }
    >
      <div className="max-w-[720px]">
        <h2 id={id} className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
          {title}
        </h2>
        {lead && (
          <p className="mt-3 max-w-[54ch] text-t2 leading-relaxed text-ink-2">{lead}</p>
        )}
      </div>
      {aside && <div className={stacked ? 'mt-6' : 'shrink-0'}>{aside}</div>}
    </div>
  );
}

/** Ширина секции. Подряд две одинаковых на странице не идут. */
export type SectionWidth = 'shell' | 'narrow' | 'narrow-left' | 'shift' | 'edge';

/** Вертикальный воздух. Разный у соседей — иначе лента снова становится ровной. */
export type SectionPad = 'none' | 'tight' | 'normal' | 'loose' | 'screen';

const WIDTH: Record<SectionWidth, string> = {
  shell: 'shell',
  narrow: 'narrow',
  'narrow-left': 'narrow narrow-left',
  shift: 'shell shift-r',
  edge: '',
};

const PAD: Record<SectionPad, string> = {
  none: '',
  tight: 'py-10 md:py-14',
  normal: 'py-14 md:py-24',
  loose: 'py-20 md:py-36',
  screen: 'py-24 md:py-40',
};

export function Section({
  id,
  children,
  className = '',
  tone = 'bg',
  width = 'shell',
  pad = 'normal',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'bg' | 'surface' | 'muted' | 'ink';
  width?: SectionWidth;
  pad?: SectionPad;
}) {
  const bg =
    tone === 'surface'
      ? 'bg-surface'
      : tone === 'muted'
        ? 'bg-surface-2'
        : tone === 'ink'
          ? 'inv'
          : '';
  return (
    <section id={id} className={`scroll-mt-20 ${PAD[pad]} ${bg} ${className}`}>
      {width === 'edge' ? children : <div className={WIDTH[width]}>{children}</div>}
    </section>
  );
}
