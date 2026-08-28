import type { Metadata } from 'next';
import { CARDS, CARD_CSS, CARD_DEFS } from '../Card';

export const metadata: Metadata = {
  title: 'Визитка',
  /* Служебный маршрут: в поиск не отдаём, как и саму витрину. */
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return CARDS.map((c) => ({ n: String(c.n) }));
}

/**
 * Отдельный маршрут под печать: здесь лежит ТОЛЬКО визитка.
 *
 * Шапку, нижнюю панель и подвал даёт корневой layout, и убрать их оттуда
 * нельзя, не тронув все остальные страницы, — поэтому они гасятся стилем
 * прямо здесь. Способ грубый, но касается ровно этого маршрута.
 *
 * Печать вызывается встроенным скриптом и только по якорю #print: без него
 * маршрут просто открывается и его можно посмотреть. Так кнопка на витрине
 * открывает готовый диалог печати, а прямой заход по адресу — нет.
 */
const PAGE_CSS = `
body{background:#e9e9e6}
.site-header,.mobile-bar,body>footer,footer{display:none!important}
main{padding:0!important}
.vc-stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;
  padding:24px 12px}
.vc-stage .vc{box-shadow:0 24px 60px -30px rgba(18,20,24,.5)}
@media print{
  body{background:#fff}
  .vc-stage{display:block;min-height:0;padding:0}
}
`;

const PRINT_SCRIPT =
  "if(location.hash==='#print'){addEventListener('load',function(){setTimeout(function(){print()},120)})}";

export default async function CardPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const card = CARDS.find((c) => String(c.n) === n) ?? CARDS[0];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS + PAGE_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: CARD_DEFS }} />
      <div className="vc-stage" dangerouslySetInnerHTML={{ __html: card.html() }} />
      <script dangerouslySetInnerHTML={{ __html: PRINT_SCRIPT }} />
    </>
  );
}
