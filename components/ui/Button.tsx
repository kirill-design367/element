import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

/**
 * Единственное место на сайте, где остаётся скругление: кнопка обязана
 * читаться как орган управления, а не как фрагмент таблицы. Четыре
 * пикселя — ровно столько, чтобы отличаться от прямого угла документа.
 */
const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium ' +
  'transition-[background-color,color,border-color] duration-150 ease-out ' +
  'select-none active:translate-y-px disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-transparent text-ink border border-line-strong hover:border-ink',
  ghost: 'text-accent hover:bg-accent-soft',
};

// 48px и 56px — комфортные цели нажатия на телефоне.
const sizes: Record<Size, string> = {
  md: 'h-12 px-5 text-t2',
  lg: 'h-14 px-7 text-t2',
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
