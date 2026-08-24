import type { Config } from 'tailwindcss';

/**
 * Цвета живут в CSS-переменных (app/globals.css) — здесь только имена.
 * Правка палитры = правка одного блока :root, а не поиск по классам.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
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
      borderRadius: { card: '10px', pill: '999px' },
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
