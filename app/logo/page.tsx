import type { Metadata } from 'next';
import Link from 'next/link';
import { METRICS } from './art';

export const metadata: Metadata = {
  title: 'Логотип',
  description: 'Служебная страница выбора логотипа.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя.
     Ссылок на неё нет ни в меню, ни в подвале — открывается прямым адресом. */
  robots: { index: false, follow: false },
};

export default function LogoPage() {
  return (
    <div>
      {/* Шапка сайта — плавающая пилюля поверх содержимого, её нижняя кромка на
          70 px. Верхнее поле поднято до 96 и 112, иначе она накрывает крошку. */}
      <div className="shell py-8 pt-24 md:py-14 md:pt-28">
        <p className="text-[13px] text-ink-2">
          <Link href="/" className="rounded hover:text-accent">
            ← На главную
          </Link>
        </p>

        <h1 className="mt-5 max-w-[20ch] font-black text-[clamp(30px,5vw,46px)] leading-[1.06] tracking-[-.025em]">
          Логотип
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Три прошлых захода отклонены целиком: витрина знака, лок-апы на знаке «Скол» и три
          направления с насыпью и силуэтом слова. Направление выбрано, устройство одно, и
          собирается оно следующим коммитом.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Все размеры будут долями высоты прописных ({METRICS.cap} единиц шрифта). В шапке сайта
          стоит слово — логотип туда не ставится, пока не выбран.
        </p>
      </div>
    </div>
  );
}
