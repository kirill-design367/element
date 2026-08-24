import Link from 'next/link';
import { COMPANY } from '@/lib/company';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-2 py-10 md:py-14">
      <div className="shell">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-[34ch]">
            <div className="font-display text-t3 font-bold uppercase tracking-[.12em]">
              Элемент
            </div>
            <p className="mt-2 text-t2 leading-relaxed text-ink-2">
              {COMPANY.legalName}. {COMPANY.tagline} для Москвы и области.
            </p>
          </div>

          <div className="grid gap-6 text-t2 sm:grid-cols-2 md:gap-14">
            <div>
              <div className="mb-2 text-t1 uppercase tracking-[.08em] text-ink-2">Разделы</div>
              <ul className="-my-1 space-y-0.5">
                <li><Link href="/catalog/" className="inline-block rounded py-1.5 hover:text-accent">Каталог материалов</Link></li>
                <li><Link href="/#raschet" className="inline-block rounded py-1.5 hover:text-accent">Расчёт стоимости</Link></li>
                <li><Link href="/#usloviya" className="inline-block rounded py-1.5 hover:text-accent">Условия для юрлиц</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-2 text-t1 uppercase tracking-[.08em] text-ink-2">Связь</div>
              <ul className="-my-1 space-y-0.5">
                <li>
                  <a href={`tel:${COMPANY.phone}`} className="tnum rounded font-bold hover:text-accent">
                    {COMPANY.phoneLabel}
                  </a>
                </li>
                <li><a href={`mailto:${COMPANY.email}`} className="inline-block rounded py-1.5 hover:text-accent">{COMPANY.email}</a></li>
                <li className="text-ink-2">{COMPANY.hoursOffice}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-t1 text-ink-2 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {COMPANY.legalName}</span>
          <span>Цены на сайте не являются публичной офертой</span>
        </div>
      </div>
    </footer>
  );
}
