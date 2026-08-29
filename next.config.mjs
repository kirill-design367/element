/** @type {import('next').NextConfig} */

// ПО УМОЛЧАНИЮ САЙТ СОБИРАЕТСЯ ПОД КОРЕНЬ ДОМЕНА. Так он и живёт на
// elementst.ru: подпапки там нет. Раньше здесь стояло '/element' — адрес на
// GitHub Pages, — и значение приходило из workflow.
//
// Возможность собрать под подпапку осталась: NEXT_PUBLIC_BASE_PATH=/что-угодно
// перед сборкой. Держим в одной переменной, чтобы basePath, assetPrefix и
// хелпер asset() не разъехались: путь к шрифту или кадру мимо базы — это
// битая ссылка, которую видно только в бою.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  // Каталоги отдаются с завершающим слэшем: /catalog/ → /catalog/index.html.
  // Apache делает это сам через DirectoryIndex, Pages делал тоже. Без слэша
  // был бы 404.
  trailingSlash: true,
  reactStrictMode: true,
  // Стили встраиваются в HTML: на статике лишний запрос за CSS — это ещё один
  // круг до первой отрисовки, а весь файл всё равно меньше тридцати килобайт.
  experimental: { inlineCss: true },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
