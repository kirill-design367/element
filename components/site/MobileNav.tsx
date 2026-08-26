'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COMPANY } from '@/lib/company';
import { nbsp } from '@/lib/format';
import { ButtonLink } from '@/components/ui/Button';
import { CloseIcon, MenuIcon, PhoneIcon } from './Icons';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Навигация на телефоне.
 *
 * До 768 px меню в шапке скрыто, а нижняя липкая панель даёт только два
 * действия — позвонить и оставить заявку. Перейти в каталог, к расчёту или
 * к условиям было нельзя иначе как прокруткой всей страницы: навигации на
 * телефоне у сайта не было вовсе.
 *
 * Кнопка стоит в пилюле справа от телефона и живёт ровно там, где меню
 * скрыто, — тот же порог md, что у <nav>. Панель повторяет рецепт шапки:
 * то же матовое стекло, тот же радиус, те же токены.
 *
 * Разметка клиентская, а сама шапка остаётся серверной: состояние живёт
 * здесь, в отдельном острове на 1 КБ, и гидратация не растекается на весь
 * заголовок страницы.
 */

/** Те же пять разделов, что на десктопе. Список приходит из шапки. */
export type NavItem = { href: string; label: string };

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  /* mounted отделяет «панели нет в разметке» от «панель есть и закрыта»:
     без него первый кадр открытия проигрывался бы из конечного состояния,
     и появления не было бы видно вовсе. */
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  /* Escape и ловушка фокуса. Пока панель открыта, Tab не выпускает наружу:
     без этого обход уводил на подвал и на ссылку «К основному содержанию»,
     то есть на то, что человек в этот момент не видит. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const stops = [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
        (el) => el.offsetParent !== null,
      );
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  /* Прокрутка страницы под открытой панелью блокируется. Lenis, если он
     поднят, останавливается своим методом: overflow: hidden его не трогает,
     он ведёт прокрутку сам. Позиция запоминается и возвращается — без этого
     страница прыгала бы в начало на телефоне. */
  useEffect(() => {
    if (!open) return;
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      lenis?.start();
    };
  }, [open]);

  /* Фокус уходит в панель при открытии и возвращается на кнопку при
     закрытии — иначе после Escape он падал бы в BODY. */
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => closeRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    if (mounted) buttonRef.current?.focus();
    return;
  }, [open, mounted]);

  const dur = prefersReducedMotion() ? 0 : 0.35;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Меню разделов"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink transition-colors duration-300 hover:text-accent md:hidden"
      >
        <MenuIcon className="h-[22px] w-[22px]" />
      </button>

      {/* Портал в body обязателен. У .site-header стоит contain: layout,
          а это делает шапку содержащим блоком для потомков с
          position: fixed: наложение «на весь экран» оказывалось внутри
          пилюли, и клик вне панели до него не доходил. */}
      {mounted && createPortal(

        <div
          className="no-print fixed inset-0 z-[70] md:hidden"
          style={{
            pointerEvents: open ? 'auto' : 'none',
            visibility: open ? 'visible' : 'hidden',
            transition: `visibility ${dur}s`,
          }}
        >
          {/* Клик вне панели закрывает. Кнопка, а не div: до неё доходит
              клавиатура, и роль читается вслух. */}
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={close}
            className="absolute inset-0 bg-ink/35"
            style={{ opacity: open ? 1 : 0, transition: `opacity ${dur}s var(--ease-out)` }}
          />
          {/* Двигаются только transform и opacity — ни высота, ни размытие. */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Разделы сайта"
            className="glass nav-sheet absolute inset-x-[10px] top-[10px] rounded-panel p-4"
            style={{
              transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.985)',
              opacity: open ? 1 : 0,
              transition: `transform ${dur}s var(--ease-out), opacity ${dur}s var(--ease-out)`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-t3 font-black leading-none tracking-[-.02em]">Элемент</span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Закрыть меню"
                className="flex h-11 w-11 items-center justify-center rounded-pill text-ink transition-colors duration-300 hover:text-accent"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Разделы сайта" className="mt-2">
              <ul className="flex flex-col">
                {items.map((n) => (
                  <li key={n.href} className="border-t border-line first:border-t-0">
                    <Link
                      href={n.href}
                      onClick={close}
                      className="nav-zoom py-3.5 text-t3 font-medium text-ink"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href={`tel:${COMPANY.phone}`}
              onClick={close}
              className="mt-2 flex min-h-[44px] items-center gap-2 border-t border-line pt-3.5 text-t2 font-semibold tracking-[-.01em] text-ink"
            >
              <PhoneIcon className="h-[18px] w-[18px] text-ink-3" />
              <span className="whitespace-nowrap">{nbsp(COMPANY.phoneLabel)}</span>
            </a>

            <ButtonLink
              href="/#zayavka"
              size="md"
              shape="pill"
              onClick={close}
              className="mt-3 w-full justify-center"
            >
              Запросить прайс
            </ButtonLink>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
