import type { MetadataRoute } from 'next';

/**
 * ROBOTS.TXT.
 *
 * ЗАПРЕЩАТЬ БОЛЬШЕ НЕЧЕГО. Строки `Disallow` стояли здесь ради двух
 * служебных страниц — сравнения шрифтовых пар и витрины логотипа, — и обе
 * удалены 30.08. Пустой список не оставляем: `Disallow:` без значения
 * означает «можно всё» и только выглядит правилом.
 *
 * Комплект логотипа `/brand/element-logo.zip` в запрет НЕ вписан, и это не
 * забывчивость. robots.txt открыт всем, и строка `Disallow` опубликовала бы
 * ровно тот путь, который прячется. Краулер находит адреса по ссылкам, а на
 * архив не ссылается ни одна страница; вторая линия — `X-Robots-Tag` на
 * `.zip` в `.htaccess`.
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
    },
  };
}
