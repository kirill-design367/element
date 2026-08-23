import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-card font-medium ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out ' +
  'select-none active:translate-y-px disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-[0_1px_0_rgba(0,0,0,.04)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:border-ink hover:bg-white',
  ghost: 'text-accent hover:bg-accent-soft',
};

// 48px — минимальная цель нажатия на телефоне.
const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-[52px] px-6 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: { variant?: Variant; size?: Size; children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: { variant?: Variant; size?: Size; children: ReactNode } & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
