import type { Config } from 'tailwindcss';

/**
 * Цвета живут в CSS-переменных (app/globals.css) — здесь только имена.
 * Правка палитры = правка одного блока :root, а не поиск по классам.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* Цвета берутся ТРОЙКАМИ КАНАЛОВ, а не готовой записью цвета: иначе
         модификатор прозрачности («bg-ink/35») не работает вовсе — Tailwind
         подставляет альфу внутрь записи, а записи он не видит, и правило не
         генерируется. Девять классов на сайте так и не рисовались.

         У линий и мягких заливок альфа своя, из набора токенов: в .inv линия
         это белый с прозрачностью 0,14, и «border-line» обязан остаться
         прежним. Поэтому альфа читается из --*-a, а модификатор работает
         там, где своей альфы у набора нет. */
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2-rgb) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / var(--line-a, <alpha-value>))',
        'line-strong': 'rgb(var(--line-strong-rgb) / var(--line-strong-a, <alpha-value>))',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft-rgb) / var(--accent-soft-a, <alpha-value>))',
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        'warn-soft': 'rgb(var(--warn-soft-rgb) / var(--warn-soft-a, <alpha-value>))',
      },
      fontFamily: {
        display: 'var(--font-text)',
        sans: 'var(--font-text)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        t1: ['var(--t1)', { lineHeight: '1.3' }],
        t2: ['var(--t2)', { lineHeight: '1.55' }],
        t3: ['var(--t3)', { lineHeight: '1.25' }],
        t4: ['var(--t4)', { lineHeight: '1.02' }],
        t5: ['var(--t5)', { lineHeight: '.92' }],
      },
      maxWidth: { shell: '1320px' },
      /* panel — крупное скругление: панель результата расчёта и стеклянные
         блоки, которые должны читаться как отдельный предмет, а не как лист. */
      borderRadius: { card: '10px', panel: '24px', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(23,25,28,.05), 0 8px 24px -16px rgba(23,25,28,.18)',
        lift: '0 2px 4px rgba(23,25,28,.06), 0 18px 40px -22px rgba(23,25,28,.28)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.22,1,.36,1)' },
    },
  },
  plugins: [],
};
export default config;
