import type { Metadata } from 'next';
import { CARD_CSS, CARD_DEFS, documentHtml } from '@/lib/card/document';

/**
 * СКРЫТАЯ СТРАНИЦА ВЫДАЧИ ДОКУМЕНТА. Отсюда заказчик забирает готовый PDF.
 *
 * ПОЧЕМУ АДРЕС ТАКОЙ. Он не угадывается и ниоткуда не связан ссылкой: ни с
 * подвала, ни с карты сайта, ни из `robots.txt`. Последнее — не забывчивость,
 * а правило проекта: `robots.txt` открыт всем, и строка `Disallow` для этого
 * пути опубликовала бы ровно тот адрес, который прячется. Так же спрятан
 * комплект логотипа `/brand/element-logo.zip`.
 *
 * ЗАКРЫТО ТРЕМЯ СЛОЯМИ, и ни один из них не полагается на два других:
 *   1. мета-тег `noindex, nofollow` в разметке — его робот читает всегда;
 *   2. заголовок `X-Robots-Tag` из корневого `.htaccess` — страница `.html`
 *      идёт через Apache, там наши правила работают (проверено прогоном);
 *   3. отсутствие ссылок — краулер находит адреса по ссылкам, а на этот
 *      путь не ссылается ничего.
 *
 * СТРАНИЦА ВРЕМЕННАЯ. Заказчик забирает PDF — и она удаляется отдельной
 * правкой вместе с файлом и правилом в `.htaccess`.
 */
export const metadata: Metadata = {
  title: 'Визитка и карточка организации',
  robots: { index: false, follow: false, nocache: true },
};

/** Имя файла на диске у заказчика: по нему документ и будут искать. */
const PDF = 'element-vizitka-i-rekvizity.pdf';

const PAGE_CSS = `
body{background:#e9e9e6}
.site-header,.mobile-bar,body>footer,footer{display:none!important}
main{padding:0!important}
.dl{max-width:210mm;margin:0 auto;padding:20px 12px 0}
.dl-card{background:#fff;border:1px solid var(--line);border-radius:12px;
  padding:18px 20px}
.dl-card h1{font-size:21px;font-weight:900;letter-spacing:-.02em;line-height:1.15}
.dl-card p{margin-top:8px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.dl-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.dl-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);
  color:#fff;text-decoration:none;font-weight:700;font-size:15px;
  padding:11px 18px;border-radius:999px}
.dl-btn--ghost{background:transparent;color:var(--ink);
  box-shadow:inset 0 0 0 1px var(--line-strong)}
.vc-stage{display:flex;flex-direction:column;align-items:center;gap:18px;
  padding:20px 12px 40px}
.vc-stage .vc{box-shadow:0 24px 60px -30px rgba(18,20,24,.5)}
@media print{
  body{background:#fff}
  .dl{display:none!important}
  .vc-stage{display:block;padding:0;gap:0}
}
`;

/* Печать вызывается только по якорю #print: без него страница просто
   открывается и документ можно посмотреть глазами. */
const PRINT_SCRIPT =
  "if(location.hash==='#print'){addEventListener('load',function(){"
  + "setTimeout(function(){print()},120)})}";

export default function DocPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS + PAGE_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: CARD_DEFS }} />
      <div className="dl">
        <div className="dl-card">
          <h1>Визитка и карточка организации</h1>
          <p>
            Две страницы A4: визитка и реквизиты. Готовый файл — по кнопке слева.
            Правая кнопка открывает диалог печати браузера, если удобнее
            распечатать прямо отсюда.
          </p>
          <div className="dl-row">
            <a className="dl-btn" href={PDF} download>Скачать PDF</a>
            <a className="dl-btn dl-btn--ghost" href="#print">Напечатать</a>
          </div>
        </div>
      </div>
      <div className="vc-stage" dangerouslySetInnerHTML={{ __html: documentHtml() }} />
      <script dangerouslySetInnerHTML={{ __html: PRINT_SCRIPT }} />
    </>
  );
}
