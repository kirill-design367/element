import { COMPANY, CONTACTS_ARE_PLACEHOLDER } from '@/lib/company';
import { nbsp } from '@/lib/format';
import { PhoneIcon } from '@/components/site/Icons';

export function Contacts() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="h-full rounded-card border border-line bg-surface p-5 shadow-card md:p-6">
          <a
            href={`tel:${COMPANY.phone}`}
            className="flex items-center gap-2.5 rounded font-black text-t4 font-semibold leading-none tracking-[-.02em] transition-colors hover:text-accent"
          >
            <PhoneIcon className="h-6 w-6 shrink-0 text-ink-3" />
            {COMPANY.phoneLabel}
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="mt-3 inline-block rounded text-t2 text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
          >
            {COMPANY.email}
          </a>

          <dl className="mt-6 space-y-4 border-t border-line pt-5 text-t2">
            <Line term="Офис" value={COMPANY.officeAddress} />
            <Line term="Отгрузка" value={COMPANY.siteAddress} />
            <Line term="Часы работы" value={`${COMPANY.hoursOffice}. ${COMPANY.hoursShipping}`} />
            <Line term="География" value={COMPANY.geo} />
          </dl>
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="h-full rounded-card border border-line bg-surface p-5 shadow-card md:p-6">
          <h3 className="text-t2 font-black">
            Реквизиты
          </h3>
          {CONTACTS_ARE_PLACEHOLDER && (
            <p className="mt-2 text-t1 leading-snug text-ink-2">
              Реквизиты и контакты приведены для примера и заменяются перед запуском.
            </p>
          )}
          <dl className="mt-4 space-y-2.5 text-t1">
            <Line term="Наименование" value={COMPANY.legalName} tight />
            <Line term="ИНН / КПП" value={nbsp(`${COMPANY.inn} / ${COMPANY.kpp}`)} tight mono />
            <Line term="ОГРН" value={COMPANY.ogrn} tight mono />
            <Line term="Банк" value={COMPANY.bank} tight />
            <Line term="Р/с" value={COMPANY.account} tight mono />
            <Line term="К/с" value={COMPANY.corr} tight mono />
            <Line term="БИК" value={COMPANY.bik} tight mono />
          </dl>
        </div>
      </div>

      {/* Карта-заглушка: схема без чужих тайлов и без стоковой картинки. */}
      <div className="lg:col-span-3">
        <div
          className="relative h-full min-h-[220px] overflow-hidden rounded-card border border-line bg-surface-2"
          role="img"
          aria-label="Схема расположения площадки отгрузки. Интерактивная карта подключается при запуске."
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(115deg, transparent 46%, var(--line-strong) 46%, var(--line-strong) 48%, transparent 48%)',
            }}
          />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-ink ring-4 ring-ink/15" aria-hidden="true" />
            <span className="mt-2 rounded bg-surface px-2 py-1 text-t1 font-medium shadow-card">
              Площадка отгрузки
            </span>
          </div>
          <p className="absolute inset-x-0 bottom-0 bg-surface/85 px-3 py-2 text-t1 text-ink-2">
            Интерактивная карта подключается при запуске
          </p>
        </div>
      </div>
    </div>
  );
}

function Line({
  term,
  value,
  tight,
  mono,
}: {
  term: string;
  value: string;
  tight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={tight ? 'flex flex-wrap gap-x-2' : ''}>
      <dt className={`text-ink-2 ${tight ? 'min-w-[92px]' : 'text-t1'}`}>
        {term}
      </dt>
      <dd className={`${tight ? 'flex-1' : 'mt-1'} ${mono ? 'tnum' : ''}`}>{value}</dd>
    </div>
  );
}
