import localFont from 'next/font/local';

/**
 * Три гарнитуры CoFo от Contrast Foundry, у каждой одна роль. Пересечений нет:
 * если непонятно, чем набирать, значит это интерфейс — значит CoFo Sans.
 *
 * ⚠️ Файлы ПРОБНЫЕ (Trial). Пробная лицензия не покрывает боевую публикацию —
 * до выкладки на боевой домен нужна купленная веб-лицензия, иначе рисунок тот
 * же, а право на него отсутствует.
 *
 * Подмножества woff2 собираются скриптом scripts/build-fonts.py из OTF, которые
 * лежат рядом в assets/fonts. В public/ шрифты не кладём: оттуда они уезжают в
 * выдачу вторым экземпляром и сталкиваются с маршрутом /fonts/.
 *
 * Имена констант попадают в имя семейства, которое next/font регистрирует в
 * браузере, — в инспекторе видно, что реально применилось.
 */

/**
 * Заголовки блоков и крупные числа. Узкий тяжёлый гротеск, набирается
 * прописными. Мелким текстом им не набирают ничего: на кегле интерфейса он
 * превращается в чёрную полосу.
 */
export const cofoPeshka = localFont({
  src: [{ path: '../assets/fonts/CoFoPeshka-Black.woff2', weight: '900', style: 'normal' }],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/**
 * Весь интерфейс, весь текст, все табличные числа в таблицах и карточках.
 * Пять начертаний закрывают и подпись под фракцией, и акцент в строке итога.
 */
export const cofoSans = localFont({
  src: [
    { path: '../assets/fonts/CoFoSans-Light.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/CoFoSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/CoFoSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/CoFoSans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/CoFoSans-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-text',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/**
 * Только маркировка партии: фракции, ГОСТы, марки прочности, артикулы.
 * Мелко, с крупным трекингом, прописными — как штамп на бирке. Класс `.mark`
 * в globals.css включает ей перечёркнутый ноль: в марке М1000 ноль нельзя
 * спутать с буквой «о». Больше этой гарнитурой не набирается ничего.
 *
 * preload выключен: маркировка мелкая и переживает подмену шрифта без сдвига
 * вёрстки, а 11 КБ на критическом пути стоят дороже.
 */
export const cofoMono = localFont({
  src: [{ path: '../assets/fonts/CoFoSansMono-Regular.woff2', weight: '400', style: 'normal' }],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});
