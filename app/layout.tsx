import type { Metadata, Viewport } from 'next';
import { cofoSans, cofoMono } from './type';
import './globals.css';
import { Header } from '@/components/site/Header';
import { MobileBar } from '@/components/site/MobileBar';
import { Footer } from '@/components/site/Footer';
import { RequestProvider } from '@/components/providers/RequestProvider';
import { Motion } from '@/components/providers/Motion';
import { PHOTO_SCRIPT } from '@/lib/photo-script';
import { COMPANY } from '@/lib/company';
import { META } from '@/lib/meta';

/* Тексты — в lib/meta.ts, рядом с прочими данными сайта. Здесь только
   сборка объекта, который ждёт Next. */
export const metadata: Metadata = {
  title: { default: META.home.title, template: META.titleTemplate },
  description: META.home.description,
  applicationName: COMPANY.shortName,
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Масштабирование не запрещаем: часть снабженцев смотрит прайс с увеличением.
  maximumScale: 5,
  themeColor: '#f4f4f1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cofoSans.variable} ${cofoMono.variable}`}>
      <body className="min-h-screen antialiased">
        {/* Снимает размытую подложку с кадра, когда он загрузился.
            Подробности — lib/photo-script.ts */}
        <script dangerouslySetInnerHTML={{ __html: PHOTO_SCRIPT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-card focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          К основному содержанию
        </a>
        <RequestProvider>
          <Header />
          {/* Нижняя панель стоит ДО содержимого, а не после подвала.
              Визуально это ничего не меняет — она fixed и лежит по нижней
              кромке независимо от места в разметке. Меняется момент, когда
              браузер её разбирает: в конце документа она приходила на 336 мс
              позже первого экрана (замер: панели на 399 мс, панель на 735),
              и первый экран собирался на глазах по частям. Теперь приходит
              вместе со всем остальным.

              Побочно это чинит и обход клавиатурой: панель была 51-й и 52-й
              остановкой из 52, то есть до постоянно видимых действий надо
              было пройти всю страницу. Теперь они идут сразу за шапкой —
              там же, где и живут на экране. */}
          <MobileBar />
          <main id="main">
            {children}
          </main>
          <Footer />
        </RequestProvider>
        <Motion />
      </body>
    </html>
  );
}
