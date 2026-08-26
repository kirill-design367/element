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

export const metadata: Metadata = {
  title: {
    default: 'Строительный Дом Элемент — щебень, песок, ПГС, грунт с доставкой по Москве и области',
    template: '%s — Строительный Дом Элемент',
  },
  description:
    'Поставка инертных материалов на объект: щебень, песок, ПГС, отсев, чернозём. Отсрочка до 30 дней, договор поставки, закрывающие документы. Расчёт стоимости с доставкой за минуту.',
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
          {/* Отступ снизу — под липкую панель телефона на мобильной. */}
          <main id="main">
            {children}
          </main>
          <Footer />
          <MobileBar />
        </RequestProvider>
        <Motion />
      </body>
    </html>
  );
}
