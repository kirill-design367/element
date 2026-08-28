import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Логотип: варианты',
  description:
    'Служебная страница выбора логотипа для «Элемента». Ссылок из меню и подвала нет, в поиск не отдаётся.',
  /* В поиск страницу не отдаём: она для заказчика, а не для покупателя. */
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
          Логотип: варианты
        </h1>
        <p className="mt-4 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Служебная страница выбора: ссылки на неё нет ни в меню, ни в подвале, в поиск она не
          отдаётся. В шапке сайта стоит слово — логотип туда не ставится, пока не выбран.
        </p>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
          Страница очищена: знак «Скол» и одиннадцать лок-апов на его основе отклонены заказчиком.
          Их геометрия и разбор остались в истории репозитория. Новые варианты собираются заново —
          каждый сразу целым логотипом, а не знаком, к которому потом приставили слово.
        </p>
      </div>
    </div>
  );
}
