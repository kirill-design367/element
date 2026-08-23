import localFont from 'next/font/local';

/**
 * Шрифты самохостятся: подмножество woff2 с кириллицей собирается скриптом
 * scripts/build-fonts.py из variable-исходников Google Fonts.
 * Пара выбрана по проверке cmap — см. /fonts и CLAUDE.md.
 */

/** Geologica — заголовки и цифры. Технический гротеск, tnum в наличии. */
export const display = localFont({
  src: [{ path: '../assets/fonts/Geologica.woff2', weight: '200 800', style: 'normal' }],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/** Onest — интерфейс и текст. */
export const text = localFont({
  src: [{ path: '../assets/fonts/Onest.woff2', weight: '300 800', style: 'normal' }],
  variable: '--font-text',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});
