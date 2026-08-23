/** @type {import('next').NextConfig} */

// Пустой в dev, '/element' в сборке для GitHub Pages — значение приходит из
// workflow. Держим в одной переменной, чтобы basePath и assetPrefix не разъехались.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  // Pages отдаёт каталоги: /catalog/ → /catalog/index.html. Без слэша был бы 404.
  trailingSlash: true,
  reactStrictMode: true,
  // Стили встраиваются в HTML: на статике лишний запрос за CSS — это ещё один
  // круг до первой отрисовки, а весь файл всё равно меньше тридцати килобайт.
  experimental: { inlineCss: true },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
