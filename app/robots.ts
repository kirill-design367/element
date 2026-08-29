import type { MetadataRoute } from 'next';
import { SERVICE_PATHS } from '@/lib/meta';

/**
 * ROBOTS.TXT.
 *
 * Служебные страницы закрыты дважды и это не перестраховка: мета-тег
 * `noindex` работает только после того, как робот страницу СКАЧАЛ, а
 * robots.txt останавливает его до запроса. Первое убирает страницу из
 * выдачи, второе бережёт краулинговый бюджет и снижает шанс, что служебный
 * адрес вообще куда-нибудь утечёт.
 *
 * Список путей один на оба механизма — `SERVICE_PATHS` в lib/meta.ts. Две
 * записи одного факта разошлись бы: страницу сняли бы с индексации и забыли
 * про robots.
 *
 * Sitemap здесь не объявляется: карты сайта у проекта нет. Появится — путь
 * добавляется полем `sitemap`, но абсолютным адресом, и тогда понадобится
 * `metadataBase`.
 */
/* При output: 'export' маршрут обязан быть статическим явно: без этого
   сборка падает с «force-static not configured on route /robots.txt». */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: SERVICE_PATHS,
    },
  };
}
