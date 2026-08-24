import { CheckIcon } from '@/components/site/Icons';

const TERMS = [
  {
    title: 'Отсрочка платежа до 30 дней',
    body: 'Для постоянных заказчиков после первой оплаченной поставки. Лимит согласуем под объём объекта.',
  },
  {
    title: 'Договор поставки',
    body: 'Рамочный договор с приложением спецификаций на каждую партию. Правки от вашего юриста принимаем.',
  },
  {
    title: 'Закрывающие документы, УПД',
    body: 'УПД, транспортная накладная и счёт-фактура. Оригиналы — с водителем, сканы — в день отгрузки.',
  },
  {
    title: 'Паспорта качества и сертификаты',
    body: 'Паспорт карьера на каждую партию: марка прочности, лещадность, морозостойкость, радиологический класс.',
  },
  {
    title: 'Персональный менеджер',
    body: 'Один человек ведёт объект от первого просчёта до последней машины. Телефон прямой, без колл-центра.',
  },
  {
    title: 'Отгрузка по графику под объект',
    body: 'Согласуем окна подачи на неделю вперёд и держим их. Сдвинулись работы — переносим без штрафа.',
  },
];

export function Terms() {
  return (
    <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {TERMS.map((t) => (
        <li key={t.title} data-reveal className="bg-surface p-5 md:p-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-ink">
            <CheckIcon className="h-4 w-4" />
          </span>
          <h3 className="mt-4 text-t3 font-bold leading-snug tracking-[-.01em]">
            {t.title}
          </h3>
          <p className="mt-2 text-t2 leading-relaxed text-ink-2">{t.body}</p>
        </li>
      ))}
    </ul>
  );
}
