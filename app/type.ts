import localFont from 'next/font/local';

/**
 * Шрифты самохостятся: подмножество woff2 с кириллицей собирается скриптом
 * scripts/build-fonts.py из variable-исходников Google Fonts.
 * Пара выбрана по проверке cmap — см. /fonts и CLAUDE.md.
 */

/**
 * Имена констант попадают в имя семейства, которое next/font регистрирует в
 * браузере: назовёшь их display и text — в инспекторе так и будет написано.
 */

/** Geologica — заголовки и цифры. Технический гротеск, tnum в наличии. */
export const geologica = localFont({
  src: [{ path: '../assets/fonts/Geologica.woff2', weight: '200 800', style: 'normal' }],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/** Onest — интерфейс и текст. */
export const onest = localFont({
  src: [{ path: '../assets/fonts/Onest.woff2', weight: '300 800', style: 'normal' }],
  variable: '--font-text',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});
