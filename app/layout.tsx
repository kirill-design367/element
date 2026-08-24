import type { Metadata, Viewport } from 'next';
import { geologica, onest, plexMono } from './type';
import './globals.css';
import { Header } from '@/components/site/Header';
import { MobileBar } from '@/components/site/MobileBar';
import { Footer } from '@/components/site/Footer';
import { RequestProvider } from '@/components/providers/RequestProvider';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Reveal } from '@/components/providers/Reveal';
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
    <html lang="ru" className={`${geologica.variable} ${onest.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          К основному содержанию
        </a>
        <RequestProvider>
          <Header />
          {/* Отступ снизу — под липкую панель телефона на мобильной. */}
          <main id="main" className="pb-[76px] md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBar />
        </RequestProvider>
        <SmoothScroll />
        <Reveal />
      </body>
    </html>
  );
}
