import { typo } from '@/lib/format';

const STEPS = [
  { title: 'Заявка', body: 'Материал, объём, адрес и срок. Через форму, по телефону или письмом.' },
  { title: 'Просчёт', body: 'Цена материала и доставки в письме в течение рабочего часа. Держим её 5 дней.' },
  { title: 'Договор', body: 'Спецификация на партию. Для повторных поставок — по рамочному договору.' },
  { title: 'Отгрузка', body: 'Машина в согласованном окне. Водитель на связи, вы видите номер и время.' },
  { title: 'Документы', body: 'УПД и паспорт качества с водителем, сканы — в день отгрузки на почту.' },
];

/**
 * Последовательность на всю ширину экрана.
 *
 * Номер шага очень крупно слева, название и описание справа, между ними
 * воздух — один шаг занимает экран. Раньше всё было ужато в левую треть, как
 * в невидимой рамке, и читалось плохо.
 *
 * Движение не жёсткое: закреплённый контейнер не стоит колом, а сползает
 * примерно на 15% от пройденной прокрутки, пока шаги внутри сменяются на
 * полной скорости. На пятом шаге секция отпускается, и страница листается
 * дальше без щелчка. По низу секции — линия прогресса.
 *
 * Разметка остаётся обычным списком в потоке: абсолютное позиционирование
 * включает класс is-pinned, который ставит Motion уже после сборки
 * таймлайна. Без скрипта и в режиме покоя это пять пунктов сверху вниз.
 *
 * Состав и тексты шагов прежние.
 */
export function Process() {
  return (
    <div data-process className="relative">
      <div data-process-stage className="relative flex min-h-[100svh] flex-col justify-center py-24">
        <div data-process-drift className="shell w-full">
          <h2 data-lines className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
            {typo('Как работаем')}
          </h2>
          <p className="mt-4 max-w-[46ch] text-t2 leading-relaxed text-ink-2">
            {typo(
              'От заявки до закрывающих документов — пять шагов и ни одного лишнего согласования.',
            )}
          </p>

          <ol data-process-steps className="process-steps mt-14 md:mt-20">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="process-step">
                <span
                  aria-hidden="true"
                  className="process-num tnum font-black leading-[.78] tracking-[-.04em] text-line-strong"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 max-w-[44ch]">
                  <h3 className="font-black text-t4 leading-[1.02] tracking-[-.025em]">
                    {typo(s.title)}
                  </h3>
                  <p className="mt-4 text-t2 leading-relaxed text-ink-2">{typo(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Линия прогресса по низу секции: заполняется по мере прохода. */}
        <div aria-hidden="true" className="process-line">
          <span data-process-bar />
        </div>
      </div>
    </div>
  );
}
