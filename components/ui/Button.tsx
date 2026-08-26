import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';
type Shape = 'card' | 'pill';

/* Переходы и увеличение на наведении описаны классом .btn в globals.css:
   там же они выключаются в режиме покоя. */
const base =
  'btn inline-flex items-center justify-center gap-2 font-medium ' +
  'select-none disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  /* На тёмных подложках акцент поднят по светлоте, и белым по нему писать
     нельзя: контраст падает до 2:1. Там текст кнопки берёт тёмный --surface.
     Подложек две — .inv (парк, панель расчёта) и .hero-panel (тёмное стекло
     первого экрана). Блок заявки из этого списка вышел: он стал светлой
     карточкой с обычными токенами, и кнопка в нём белая по глубокому
     акценту, как на всей остальной странице. */
  primary:
    'bg-accent text-white [.inv_&]:text-surface ' +
    '[.hero-panel_&]:text-surface hover:bg-accent-hover shadow-[0_1px_0_rgba(0,0,0,.04)]',
  secondary:
    'btn-secondary bg-surface text-ink border border-line-strong hover:border-ink hover:bg-white',
  ghost: 'text-accent hover:bg-accent-soft',
};

// 48px — минимальная цель нажатия на телефоне.
const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-t2',
  lg: 'h-[52px] px-6 text-base',
};

const shapes: Record<Shape, string> = { card: 'rounded-card', pill: 'rounded-pill' };

export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  extra = '',
  shape: Shape = 'card',
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${shapes[shape]} ${extra}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'card',
  className = '',
  children,
  ...rest
}: { variant?: Variant; size?: Size; shape?: Shape; children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button className={buttonClass(variant, size, className, shape)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  shape = 'card',
  className = '',
  children,
  ...rest
}: { variant?: Variant; size?: Size; shape?: Shape; children: ReactNode } & ComponentProps<
  typeof Link
>) {
  return (
    <Link className={buttonClass(variant, size, className, shape)} {...rest}>
      {children}
    </Link>
  );
}
