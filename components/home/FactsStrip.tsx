import { FACTS } from './Hero';
import { typo } from '@/lib/format';

/**
 * Перебивка между первым экраном и расчётом: три факта о поставке бегущей
 * строкой во всю ширину.
 *
 * Как это устроено. В ленте лежат две одинаковые копии фактов, и вся лента
 * едет влево ровно на половину своей ширины — в этот момент вторая копия
 * стоит там, где начинала первая, и цикл повторяется без стыка. Двигается
 * только transform, ни background-position, ни margin: строка идёт на
 * композиторе и не трогает вёрстку.
 *
 * Вторая копия — техническая: она помечена aria-hidden и показывается только
 * при классе `js` на <html>. Без скрипта и в режиме покоя остаётся один ряд
 * из трёх фактов, стоящий на месте, — ровно то, что было до бегущей строки.
 *
 * Скорость и торможение при наведении — в Motion.tsx: там лента получает
 * бесконечный tween, а наведение сбавляет ему timeScale до четверти. Менять
 * длительность CSS-анимации на лету нельзя — она перескакивает.
 */
export function FactsStrip() {
  const copy = (clone: boolean) => (
    <div
      key={clone ? 'clone' : 'main'}
      className="marquee-copy"
      data-marquee-clone={clone ? '' : undefined}
      aria-hidden={clone ? 'true' : undefined}
    >
      {FACTS.map((f) => (
        <div key={f.label} className="marquee-item">
          <span className="text-t1 text-ink-2">{f.label}</span>
          <span className="text-t2 font-medium leading-snug">{typo(f.value)}</span>
          <span className="marquee-dot" aria-hidden="true" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="inv marquee-strip" data-marquee>
      <div className="marquee-track" data-marquee-track>
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  );
}
