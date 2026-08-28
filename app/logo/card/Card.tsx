import { ART, type Art } from '../art';
import { PATHS } from '../art';
import { asset } from '@/lib/assets';
import { CALL, CONTACTS, FACTS, LEGAL, LEGAL_NAME, OFFER, QR, SHIPPING } from './data';

/**
 * ВИЗИТКА, ТРИ ВАРИАНТА. Формат A4 книжной, 210×297 мм.
 *
 * Стили лежат строкой рядом, а не в globals.css: файл стилей встраивается в
 * КАЖДУЮ страницу сайта, и правила визитки утяжелили бы лендинг и каталог.
 * Здесь они приходят только на те страницы, где визитка показана.
 *
 * Логотип берётся тем же кодом, что и на витрине выше, — из ART, а не
 * картинкой.
 */

const U = 700; // высота прописных логотипной гарнитуры

export function logoSvg(id: string, heightMm: number, cls = '') {
  const a: Art | undefined = ART[id];
  if (!a) return '';
  return `<svg viewBox="0 0 ${a.w} ${a.h}" class="${cls}"`
    + ` style="height:${heightMm}mm;width:auto" aria-hidden="true" focusable="false">`
    + a.parts.map((p) => (p.d
      ? `<path d="${p.d}" fill="var(--c-${p.role})"/>`
      : `<use href="#p-${p.ref}" x="${p.x ?? 0}" y="${p.y ?? 0}" fill="var(--c-${p.role})"/>`))
      .join('')
    + `</svg>`;
}

/** Общие контуры логотипа. Нужны, когда визитка живёт отдельным маршрутом:
 *  на витрине они уже объявлены разделом defs. */
export const CARD_DEFS =
  '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
  + '<defs>'
  + Object.entries(PATHS).map(([k, d]) => `<path id="p-${k}" d="${d}"/>`).join('')
  + '</defs></svg>';

export const CARD_CSS = `
.vc{position:relative;width:210mm;height:297mm;overflow:hidden;
  background:var(--bg);color:var(--ink);
  font-family:var(--font-text),system-ui,sans-serif;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.vc *{box-sizing:border-box}

/* СИНИЙ У ВИЗИТКИ СВОЙ, И ОН ТЕМНЕЕ КНОПОЧНОГО. Экранный --accent #173fa6
   на бумаге читается лёгким: сплошная заливка на принтере всегда выходит
   светлее экранной. Тон и насыщенность взяты у кнопки знак в знак — H 223,2°,
   S 75,7%, — опущена только светлота: 37,1% → 25,9%.
   Токен живёт ТОЛЬКО здесь и только на печатной вёрстке. Второго акцента в
   интерфейсе от этого не появляется: --accent сайта не трогается вовсе, и
   ни одна страница, кроме визитки, этих правил не видит. */
.vc{--vc-sin:#102c74}
/* Кадр лежит не от края до края, а КАРТОЧКОЙ: те же поля 14 мм, что у
   остального набора, и то же скругление 6 мм, что у карточек показателей и
   выноски. Прямоугольник встык к кромке листа читался обрезком. */
.vc-frame{margin:14mm 14mm 0;border-radius:6mm;overflow:hidden;background:var(--ink)}
.vc-photo{display:block;width:100%;height:100%;object-fit:cover}

/* Логотип сидит НА СТЫКЕ кадра и светлого поля: половина на фотографии,
   половина на бумаге. Стык от этого перестаёт быть линией разреза — знак
   держит обе половины листа вместе. */
.vc-seam{position:absolute;left:14mm;transform:translateY(-50%);z-index:2}

.vc-body{display:flex;flex-direction:column;padding:0 14mm 14mm}
.vc h2{font-weight:900;letter-spacing:-.03em;line-height:.95}
/* Ширина заголовка объявлена здесь, а не инлайном: 172 мм — это полоса
   набора (210 минус два поля по 14) плюс запас на выносной элемент. */
.vc-offer{font-size:12mm;font-weight:900;letter-spacing:-.035em;line-height:.94;
  max-width:172mm}
/* Строка про самовывоз набрана обычным текстом, а не служебной пометкой:
   прописными вразрядку бледно-серым она читалась подписью к чему-то, хотя
   это условие работы — то, ради чего к нам едут. Подчёркивание отбивает её
   от заголовка сверху и от карточек снизу без второго цвета и без линеек. */
.vc-kicker{font-size:4mm;line-height:1.4;color:var(--ink);text-decoration:underline;
  text-underline-offset:.24em;text-decoration-thickness:.055em}

/* Показатели — карточки, а не три колонки текста: белый лист поверх
   цементного поля, крупное скругление, тонкая обводка. Тот же рецепт, что у
   карточек на сайте, только радиус крупнее — на A4 6 мм читаются как 10 px
   на экране. Высота выравнивается сеткой, отбивки равные. */
.vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
.vc-card{display:flex;flex-direction:column;background:var(--surface);
  border:.3mm solid var(--line);border-radius:6mm;padding:4mm}
.vc-card-v{font-size:18mm;font-weight:900;letter-spacing:-.045em;line-height:.86;
  color:var(--vc-sin);font-variant-numeric:tabular-nums}
.vc-card-u{font-size:5mm;font-weight:700;letter-spacing:0;margin-left:2mm;
  display:inline-block}
/* Отбивка над линией ФИКСИРОВАННАЯ, а не margin-top:auto. С auto линия
   вставала по низу самой высокой карточки, и у соседей она оказывалась на
   разной высоте от числа — три линейки на трёх уровнях. */
.vc-card-l{margin-top:4mm;padding-top:3mm;border-top:.3mm solid var(--line);
  font-size:3.6mm;line-height:1.3;color:var(--ink-2)}

/* Призыв — ВЫНОСКА, отдельный объект: тот же белый лист со скруглением, что
   у карточек показателей, и синяя грань слева. Грань — псевдоэлемент, а не
   border: у border скругление коробки срезает ему концы, и вместо стойки
   получается запятая. */
.vc-call{display:flex;align-items:center;gap:6mm;background:var(--surface);
  border:.3mm solid var(--line);border-radius:6mm;padding:4mm}
/* СИНИЙ, ОБЪЕКТ ВТОРОЙ. Заливка призыва осталась белой: синей плашки на
   листе ровно одна, и она у контактов. */
.vc-call::before{content:'';align-self:stretch;width:2.5mm;border-radius:1.25mm;
  background:var(--vc-sin);flex:none}
.vc-call p{font-size:5.4mm;font-weight:700;line-height:1.25;letter-spacing:-.015em}

/* СИНИЙ, ОБЪЕКТ ТРЕТИЙ: контакты — единственная сплошная синяя плашка на
   листе. Телефон, адрес и часы отгрузки лежали тремя отдельными кусками
   текста внизу; теперь это один объект во всю ширину полосы набора. */
.vc-contacts{background:var(--vc-sin);color:#fff;border-radius:6mm;padding:6mm}
.vc-contacts-top{display:flex;align-items:flex-start;justify-content:space-between;
  gap:8mm}
/* С QR-КОДОМ ПЛАШКА ПЕРЕСТРАИВАЕТСЯ В ДВЕ КОЛОНКИ, и это не украшение.
   Втроём в одну строку телефон, адрес и код не помещаются: телефон при
   12 мм занимает 111,5 мм из 170, код 24, отбивки 16 — адресу оставалось
   24,9 мм, и он разваливался на пять строк. Теперь слева колонка «телефон,
   адрес, сайт», справа код. */
.vc-contacts--qr .vc-contacts-top{align-items:flex-start}
.vc-contacts--qr .vc-contacts-main{flex:1;min-width:0}
.vc-contacts--qr .vc-addr,.vc-contacts--qr .vc-site{text-align:left;margin-left:0}
.vc-contacts--qr .vc-addr{margin-top:3mm;max-width:96mm}
/* nowrap: номер с кодом города при 12 мм не влезал в свою колонку и рвался
   после «+7», а разорванный телефон читается двумя числами. */
.vc-phone{font-size:12mm;font-weight:900;letter-spacing:-.03em;line-height:1;
  color:#fff;text-decoration:none;display:block;white-space:nowrap}
.vc-addr{font-size:3.8mm;line-height:1.4;max-width:64mm;color:#dde3f8;text-align:right}
.vc-site{margin-top:2mm;font-size:4mm;color:#dde3f8;text-align:right}
/* Часы отгрузки — своей строкой под линией: это не адрес и не телефон, а
   условие работы площадки. */
.vc-hours{margin-top:5mm;padding-top:5mm;border-top:.3mm solid rgba(255,255,255,.28);
  font-size:4.4mm;font-weight:700;letter-spacing:-.01em}
/* QR лежит на белом квадрате: тёмные модули по светлому читает любой
   сканер, светлые по синему — не любой. */
.vc-qr-box{background:#fff;border-radius:3mm;padding:2.5mm;flex:none}
.vc-qr{display:block;width:24mm;height:24mm;color:var(--ink)}

/* Реквизиты стоят последней строкой листа без линии над ними: линия здесь
   отделяла бы их от плашки контактов, у которой и так есть свой край. */
.vc-legal{font-size:2.8mm;line-height:1.5;color:var(--ink-3)}
.vc-legal b{font-weight:400;color:var(--ink-2)}

@media print{
  @page{size:210mm 297mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  .vc{box-shadow:none!important;page-break-after:avoid;break-after:avoid}
}
`;

function facts() {
  return `<div class="vc-cards">` + FACTS.map((f) =>
    `<div class="vc-card"><div class="vc-card-v tnum">${f.value}`
    + `<span class="vc-card-u">${f.unit}</span></div>`
    + `<div class="vc-card-l">${f.label}</div></div>`).join('') + `</div>`;
}

/** Призыв — выноска: отдельный объект, а не абзац в потоке текста. */
function call() {
  return `<div class="vc-call"><p>${CALL}</p></div>`;
}

/** Контакты: телефон, адрес, адрес сайта и QR-код — последние два только
 *  когда поле сайта заполнено. */
function contacts() {
  const site = CONTACTS.site
    ? `<p class="vc-site">${CONTACTS.site.replace(/^https?:\/\//, '')}</p>` : '';
  const qr = QR
    ? `<div class="vc-qr-box"><svg class="vc-qr" viewBox="0 0 ${QR.size} ${QR.size}"`
      + ` aria-hidden="true"><path d="${QR.path}" fill="currentColor"/></svg></div>` : '';
  const phone = `<a class="vc-phone" href="${CONTACTS.phoneHref}">${CONTACTS.phone}</a>`;
  /* Без кода — телефон слева, адрес справа: строка одна. С кодом строка не
     держит трёх колонок, и телефон с адресом уходят в общую левую. */
  const main = QR
    ? `<div class="vc-contacts-main">${phone}<p class="vc-addr">${CONTACTS.address}</p>`
      + `${site}</div>`
    : `${phone}<div><p class="vc-addr">${CONTACTS.address}</p>${site}</div>`;
  return `<div class="vc-contacts${QR ? ' vc-contacts--qr' : ''}">`
    + `<div class="vc-contacts-top">${main}${qr}</div>`
    + `<p class="vc-hours">${CONTACTS.hours}</p></div>`;
}

function legal() {
  /* tnum висит на самом числе, а не на строке: внутри .tnum обычных
     пробелов быть не должно, иначе межсловный интервал уезжает втрое. */
  return `<p class="vc-legal">${LEGAL_NAME} &nbsp; `
    + LEGAL.map(([k, v]) => `<b>${k}</b>&nbsp;<span class="tnum">${v}</span>`)
      .join(' &nbsp; ') + `</p>`;
}

/**
 * Визитка. Сверху кадр площадки, логотип на стыке кадра и бумаги, ниже —
 * заголовок, карточки показателей, выноска призыва и синий блок контактов.
 *
 * Логотип стоит НА СТЫКЕ: середина знака совпадает с нижней кромкой кадра,
 * верхняя половина лежит на фотографии, нижняя — на бумаге. Поэтому он вынут
 * из кадра в собственный слой поверх обоих (`.vc-seam`), а не лежит внутри
 * кадра, как раньше: изнутри кадра выйти за его границу нечем.
 *
 * РИТМ ЛИСТА. Между всеми пятью блоками стоит одна и та же гибкая отбивка
 * `margin-top:auto` с минимумом в 5-7 мм: свободная высота делится между
 * ними поровну, а не копится внизу одним провалом. Поэтому кадр и опущен с
 * 88 до 78 мм — на 88 свободного места оставалось меньше, чем нужно пяти
 * промежуткам, и блоки сбивались в верхние две трети.
 */
function photoCard() {
  const src = asset('/img/park-1920.webp');
  const PAD = 14;     // поле листа, мм — то же, что у всего набора
  const LOGO = 15;    // высота логотипа, мм — половина уходит на кадр
  /* СЧИТАЕТСЯ ОТ СТЫКА, А НЕ ОТ ВЫСОТЫ КАДРА. На стыке стоит логотип, и
     всё, что ниже, отмеряется от него: пока считали высотой кадра, поля
     сверху пришлось бы вычитать из каждого числа ниже. Кадр — это то, что
     осталось между верхним полем и стыком.
     Стык отдаёт высоту QR-коду: с кодом плашка контактов выше на 13 мм, а
     свободного места на листе всего 7. Число считается признаком, а не
     правится руками, когда заполнят домен. */
  const SEAM = QR ? 78 : 92;    // отметка стыка, мм от верхней кромки листа
  return `<div class="vc">`
    + `<div class="vc-frame" style="height:${SEAM - PAD}mm">`
    + `<img class="vc-photo" src="${src}" alt=""/></div>`
    + `<div class="vc-seam" style="top:${SEAM}mm;--c-bg:${'#f4f4f1'};`
    + `--c-ink:${'#17191c'}">${logoSvg('o1', LOGO)}</div>`
    /* Верхнее поле — половина знака плюс обычный воздух: текст не должен
       подходить к логотипу ближе, чем к краям листа. */
    + `<div class="vc-body" style="height:${297 - SEAM}mm;padding-top:${LOGO / 2 + 7}mm">`
    + `<h2 class="vc-offer">${OFFER}</h2>`
    + `<p class="vc-kicker" style="margin-top:4mm">${SHIPPING}</p>`
    + `<div style="margin-top:auto;padding-top:5mm">${facts()}</div>`
    + `<div style="margin-top:auto;padding-top:4mm">${call()}</div>`
    + `<div style="margin-top:auto;padding-top:4mm">${contacts()}</div>`
    + `<div style="margin-top:auto;padding-top:4mm">${legal()}</div>`
    + `</div></div>`;
}

export const CARDS = [
  { n: 1, name: 'Фотографический', html: photoCard,
    diff: 'Крупный кадр площадки во всю ширину, логотип на нём, вся типографика под ним.',
    weak: 'Кадр съедает треть высоты: всё, что ниже, живёт на оставшихся двух третях листа.' },
];
