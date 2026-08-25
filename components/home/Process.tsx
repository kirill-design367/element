import { typo } from '@/lib/format';

const STEPS = [
  { title: 'Заявка', body: 'Материал, объём, адрес и срок. Через форму, по телефону или письмом.' },
  { title: 'Просчёт', body: 'Цена материала и доставки в письме в течение рабочего часа. Держим её 5 дней.' },
  { title: 'Договор', body: 'Спецификация на партию. Для повторных поставок — по рамочному договору.' },
  { title: 'Отгрузка', body: 'Машина в согласованном окне. Водитель на связи, вы видите номер и время.' },
  { title: 'Документы', body: 'УПД и паспорт качества с водителем, сканы — в день отгрузки на почту.' },
];

/**
 * Последовательность, которой управляет прокрутка.
 *
 * Было пять узких колонок текста в ряд — на 1440 это 180 px на колонку, слова
 * налезали друг на друга и читать было нечем. Стало: секция залипает на
 * экране, шаги сменяют друг друга по мере прокрутки, номер шага очень
 * крупный, под ними точки прогресса.
 *
 * Разметка при этом остаётся обычным списком в потоке. Абсолютное
 * позиционирование и подмена шагов включаются классом is-pinned, который
 * ставит Motion, — то есть только когда скрипт жив и режим движения включён.
 * Без скрипта и в режиме покоя это по-прежнему список из пяти пунктов,
 * который просто читается сверху вниз.
 *
 * Состав и тексты шагов прежние.
 */
export function Process() {
  return (
    <div data-process className="relative">
      <div data-process-stage className="flex min-h-[100svh] flex-col justify-center py-24">
        <div className="shell">
          <h2 data-lines className="font-black text-t4 leading-[1.04] tracking-[-.02em]">
            {typo('Как работаем')}
          </h2>
          <p className="mt-4 max-w-[46ch] text-t2 leading-relaxed text-ink-2">
            {typo(
              'От заявки до закрывающих документов — пять шагов и ни одного лишнего согласования.',
            )}
          </p>

          <ol data-process-steps className="process-steps mt-12 md:mt-16">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="process-step">
                <span
                  aria-hidden="true"
                  className="tnum shrink-0 font-black text-t5 leading-[.8] tracking-[-.04em] text-line-strong"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 max-w-[46ch]">
                  <h3 className="font-black text-t4 leading-[1.05] tracking-[-.02em]">
                    {typo(s.title)}
                  </h3>
                  <p className="mt-3 text-t2 leading-relaxed text-ink-2">{typo(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Указатель прогресса: пять точек, активная шире остальных.
              Дублирует номер шага, поэтому от скринридера скрыт. */}
          <ol data-process-dots aria-hidden="true" className="mt-10 flex gap-2 md:mt-14">
            {STEPS.map((s) => (
              <li key={s.title} className="process-dot" />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
