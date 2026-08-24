import type { Config } from 'tailwindcss';

/**
 * Цвета и кегли живут в CSS-переменных (app/globals.css) — здесь только имена.
 * Скругление по умолчанию нулевое: визуальный язык документа не терпит
 * скруглённых рамок. Радиус остался ровно у одного токена — `control`,
 * он стоит на кнопках.
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
        display: 'var(--font-display)',
        sans: 'var(--font-text)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        t1: ['var(--t1)', { lineHeight: '1.25' }],
        t2: ['var(--t2)', { lineHeight: '1.55' }],
        t3: ['var(--t3)', { lineHeight: '1.2' }],
        t4: ['var(--t4)', { lineHeight: '1.03' }],
        t5: ['var(--t5)', { lineHeight: '.9' }],
      },
      maxWidth: { shell: '1320px' },
      borderRadius: { none: '0', control: 'var(--r-control)' },
      transitionTimingFunction: { out: 'cubic-bezier(.22,1,.36,1)' },
    },
  },
  plugins: [],
};
export default config;
