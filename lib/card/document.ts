import { ART, PATHS, type Art } from '@/lib/logo-art';
import { asset } from '@/lib/assets';
import { nbsp } from '@/lib/format';
import {
  ADDRESSES, BANK, BRAND_NAME, CALL, CONTACTS, FACTS, LEGAL_NAME, OFFER, ORG, QR,
  type Row, SHIPPING,
} from './data';

/**
 * ДОКУМЕНТ НА ДВУХ СТРАНИЦАХ A4: ВИЗИТКА И КАРТОЧКА ОРГАНИЗАЦИИ.
 *
 * Первая страница — прежняя визитка, вернувшаяся из истории. Композиция,
 * кадр, кегли и состав блоков не тронуты: менялись только те места, которые
 * не переживают чёрно-белую печать, и нижняя строка. Вторая страница —
 * реквизиты тем же языком: те же карточки со скруглением 6 мм, та же шкала
 * кеглей, та же синяя грань выноски, та же нижняя линия содержимого 283 мм.
 *
 * ПОЧЕМУ ДВЕ СТРАНИЦЫ, А НЕ ОДНА. Это вычитание, а не вкус. На листе визитки
 * рабочая высота 190 мм, фиксированные блоки съедают 185,9, и свободного
 * хода остаётся 4,1 мм на четыре гибкие отбивки. Реквизиты в самом плотном
 * виде, при котором ещё соблюдены пороги печати, требуют 200,5 мм — в
 * пятьдесят раз больше, чем есть. Взять место негде: высоту кадра добирать
 * из самого кадра запрещено (его уже опускали до 64 мм, и он перестал
 * держать верх листа), состав визитки принят заказчиком, а уменьшать кегль
 * реквизитов нельзя — при 2,8 мм высота строчных 1,33 мм, а толщина штриха
 * 0,238 мм против ячейки растра 0,240, то есть цифра печатается чётками из
 * точек. Именно эти цифры переписывают в платёжку.
 *
 * ЧЕРНО-БЕЛАЯ ПЕЧАТЬ — НЕ ПОБОЧНОЕ УСЛОВИЕ, А ГЛАВНОЕ. Документ печатают и
 * отправляют почтой, значит он живёт в сером. Что из этого следует:
 *
 *   • СИНИЙ В СЕРОМ РАВЕН ЧЁРНОМУ. У `--vc-sin` светлота L* 20,7 при
 *     собственном чёрном лазера L* 20,4 — разница 1,00:1 на бумаге. Поэтому
 *     НИ ОДНА ВЕЛИЧИНА НЕ РАЗВЕДЕНА КРАСКОЙ: всё различается кеглем, весом,
 *     положением или линией. Два адреса — в первую очередь.
 *   • ВОЛОСЯНЫЕ ЛИНИИ — `--ink-3`, А НЕ `--line`. #deded8 это 18 % краски и
 *     1,20:1 к бумаге: при 0,3 мм линия ложится пунктиром из точек 0,1 мм, а
 *     на первой же ксерокопии тинты ниже 15 % отсекаются порогом копира.
 *     Вместе с линией исчезала бы и вся карточная форма — цементное поле в
 *     печати становится белым. `--ink-3` это 74 % и 3,11:1.
 *   • ТИНТА ВНУТРИ ВЫВОРОТКИ НЕТ. Адрес на синей плашке набирался `#dde3f8` —
 *     13 % краски, которые драйвер обязан положить внутрь штриха шириной
 *     0,32 мм: либо грязь внутри букв, либо округление до белого, и
 *     предсказать нельзя. На плашке весь текст чисто белый.
 *   • ФОН ЛИСТА В ПЕЧАТИ БЕЛЫЙ. `--bg` #f4f4f1 — 0–2 % краски, ниже
 *     устойчивой точки лазера: он либо не отпечатается, либо пойдёт крапом
 *     по 623 см². Это единственное расхождение экрана с бумагой, и оно
 *     снимает то, что и так не печатается.
 *
 * Стили лежат строкой рядом с разметкой, а не в `globals.css`: файл стилей
 * встраивается в КАЖДУЮ страницу сайта, и правила печатной вёрстки утяжелили
 * бы лендинг и каталог. Размеры инлайном и в миллиметрах по той же причине.
 */

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

/** Общие контуры знака: буквы объявлены по разу и переиспользуются. */
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

/* СИНИЙ У ДОКУМЕНТА СВОЙ, И ОН ТЕМНЕЕ КНОПОЧНОГО. Экранный --accent #173fa6
   на бумаге читается лёгким: сплошная заливка на принтере всегда выходит
   светлее экранной. Тон и насыщенность взяты у кнопки знак в знак — H 223,2°,
   S 75,7%, — опущена только светлота: 37,1% → 25,9%.
   Токен живёт ТОЛЬКО здесь и только на печатной вёрстке. Второго акцента в
   интерфейсе от этого не появляется: --accent сайта не трогается вовсе. */
.vc{--vc-sin:#102c74}

/* ── ПЕРВАЯ СТРАНИЦА: ВИЗИТКА ──────────────────────────────────────── */

/* КАДР ИДЁТ ВО ВСЮ ШИРИНУ ЛИСТА, поля только чтобы он не упирался в обрез:
   6 мм против 14 у набора. Скругление то же, что у карточек, — 6 мм. Полем
   набора его равнять нельзя: на 14 мм кадр читался утопленным. */
.vc-frame{position:relative;margin:6mm 6mm 0;border-radius:6mm;overflow:hidden;
  background:var(--ink)}
/* Кадр ОБРЕЗАЕТСЯ по рамке, а не ужимается: рамка шире исходного снимка по
   пропорции (2,54 против 1,79), поэтому cover масштабирует по ширине и
   срезает верх и низ. Точка кадрирования опущена на 2% ниже середины —
   иначе срез съедал колёса, а не пустое небо. */
.vc-photo{display:block;width:100%;height:100%;object-fit:cover;
  object-position:50% 52%}

/* ЛОГОТИП ЛЕЖИТ ВНУТРИ КАДРА, в его нижнем левом углу, с равными отступами
   11 мм. ПРИТЕМНЕНИЯ ПОД НИМ НЕТ, И ЭТО РЕЗУЛЬТАТ ЗАМЕРА: знак — тёмная
   плашка со светлыми буквами, и затемнять снимок под ним значит сажать его
   силуэт. В сером силуэт падает с 3,73 до 2,72:1, и добрать там нечем; но
   буквы по своей плашке остаются 11,4:1 — читается то, что и читают. */
.vc-mark{position:absolute;z-index:2}

.vc-body{display:flex;flex-direction:column;padding:0 14mm 14mm}
.vc h2{font-weight:900;letter-spacing:-.03em;line-height:.95}
/* 172 мм — полоса набора (210 минус два поля по 14) плюс запас на выносной. */
.vc-offer{font-size:12mm;font-weight:900;letter-spacing:-.035em;line-height:.94;
  max-width:172mm}
/* Строка про самовывоз набрана обычным текстом, а не служебной пометкой:
   прописными вразрядку бледно-серым она читалась подписью к чему-то, хотя
   это условие работы — то, ради чего к нам едут. */
.vc-kicker{font-size:4mm;line-height:1.4;color:var(--ink);text-decoration:underline;
  text-underline-offset:.24em;text-decoration-thickness:.055em}

/* Показатели — карточки: белый лист поверх цементного поля, крупное
   скругление, тонкая обводка. Обводка --ink-3, а не --line: см. шапку. */
.vc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
.vc-card{display:flex;flex-direction:column;background:var(--surface);
  border:.3mm solid var(--ink-3);border-radius:6mm;padding:3.5mm}
.vc-card-v{font-size:18mm;font-weight:900;letter-spacing:-.045em;line-height:.86;
  color:var(--vc-sin);font-variant-numeric:tabular-nums}
.vc-card-u{font-size:5mm;font-weight:700;letter-spacing:0;margin-left:2mm;
  display:inline-block}
/* Отбивка над линией ФИКСИРОВАННАЯ, а не margin-top:auto. С auto линия
   вставала по низу самой высокой карточки, и у соседей она оказывалась на
   разной высоте от числа — три линейки на трёх уровнях. */
.vc-card-l{margin-top:3mm;padding-top:2.5mm;border-top:.3mm solid var(--ink-3);
  font-size:3.6mm;line-height:1.3;color:var(--ink-2)}

/* Призыв — ВЫНОСКА: та же карточка и синяя грань слева. Грань —
   псевдоэлемент, а не border: у border скругление коробки срезает ему концы,
   и вместо стойки получается запятая. */
.vc-call{display:flex;align-items:center;gap:6mm;background:var(--surface);
  border:.3mm solid var(--ink-3);border-radius:6mm;padding:3.5mm}
.vc-call::before{content:'';align-self:stretch;width:2.5mm;border-radius:1.25mm;
  background:var(--vc-sin);flex:none}
.vc-call p{font-size:5.4mm;font-weight:700;line-height:1.25;letter-spacing:-.015em}

/* Контакты — единственная сплошная синяя плашка на листе. */
.vc-contacts{background:var(--vc-sin);color:#fff;border-radius:6mm;padding:5mm}
.vc-contacts-top{display:flex;align-items:flex-start;justify-content:space-between;
  gap:8mm}
/* С QR-КОДОМ ПЛАШКА ПЕРЕСТРАИВАЕТСЯ В ДВЕ КОЛОНКИ, и это не украшение.
   Втроём в одну строку телефон, адрес и код не помещаются: телефон при 12 мм
   занимает 111,5 мм из 170, код 24, отбивки 16 — адресу оставалось 24,9 мм,
   и он разваливался на пять строк. */
.vc-contacts--qr .vc-contacts-main{flex:1;min-width:0}
.vc-contacts--qr .vc-addr,.vc-contacts--qr .vc-site{text-align:left;margin-left:0}
.vc-contacts--qr .vc-addr{margin-top:3mm;max-width:96mm}
/* nowrap: номер с кодом города при 12 мм не влезал в свою колонку и рвался
   после «+7», а разорванный телефон читается двумя числами. */
.vc-phone{font-size:12mm;font-weight:900;letter-spacing:-.03em;line-height:1;
  color:#fff;text-decoration:none;display:block;white-space:nowrap}
/* ВЕСЬ ТЕКСТ НА ПЛАШКЕ ЧИСТО БЕЛЫЙ И ВЕСОМ НЕ НИЖЕ 500. Прежний #dde3f8 —
   13 % краски внутри выворотки; разбег тонера съедает 0,04–0,09 мм с каждой
   кромки штриха, и тинт внутри него непредсказуем. */
.vc-addr{font-size:3.8mm;font-weight:500;line-height:1.4;max-width:64mm;color:#fff;
  text-align:right}
.vc-email{margin-top:2mm;font-size:4mm;font-weight:500;color:#fff}
.vc-site{margin-top:2mm;font-size:4mm;font-weight:500;color:#fff;text-align:right}
/* Линия внутри выворотки — сплошная белая 0,4 мм: 0,3 мм при 28 % белого
   съедается разбегом тонера целиком. */
.vc-hours{margin-top:5mm;padding-top:5mm;border-top:.4mm solid #fff;
  font-size:4.4mm;font-weight:700;letter-spacing:-.01em}
/* QR лежит на белом квадрате: тёмные модули по светлому читает любой сканер,
   светлые по синему — не любой. Модуль 0,96 мм при 25 модулях на 24 мм. */
.vc-qr-box{background:#fff;border-radius:3mm;padding:2.5mm;flex:none}
.vc-qr{display:block;width:24mm;height:24mm;color:var(--ink)}

/* Нижняя строка визитки. Прежде здесь стояли все реквизиты одной строкой при
   2,8 мм цветом --ink-3: худший текст документа по печати — 74 % краски,
   контраст 3,11:1, стебель цифры 0,238 мм против ячейки растра 0,240. И
   переписывали в платёжку именно её. Теперь это указатель: наименование, ИНН
   и отсылка на вторую страницу, 3,5 мм сплошным чёрным.
   ИНН остался, КПП и ОГРН ушли: ИНН — единственное, что спрашивают с визитки
   на слух, остальное берут с листа реквизитов. */
.vc-legal{font-size:3.5mm;line-height:1.4;color:var(--ink)}
.vc-legal b{font-weight:500;color:var(--ink)}

/* ── ВТОРАЯ СТРАНИЦА: КАРТОЧКА ОРГАНИЗАЦИИ ─────────────────────────── */

.rq-body{display:flex;flex-direction:column;height:297mm;padding:14mm}
/* Шапка без карточки и без плашки: это первый блок листа, который кладут в
   копир, и лист обязан остаться малозаливным. Знак берётся в версии БЕЗ
   ПЛАШКИ («o1-n»): у неё обе части одной роли, поэтому весь знак — один
   цвет, и он ведёт себя как текст рядом. */
.rq-h{font-size:12mm;font-weight:900;letter-spacing:-.035em;line-height:.94;
  margin-top:6mm;color:var(--ink)}
.rq-sub{font-size:4mm;font-weight:500;line-height:1.4;margin-top:3mm;color:var(--ink)}

.rq-card{background:var(--surface);border:.3mm solid var(--ink-3);
  border-radius:6mm;padding:5mm}
.rq-t{font-size:3.6mm;font-weight:700;line-height:1.3;color:var(--ink);
  padding-bottom:3mm}
/* Строка реестра: ключ слева фиксированной ширины, значение справа. Ширины:
   полоса набора 182, поля карточки 2×5, ключ 46, зазор 6 — под значение
   остаётся 119,5 мм. Двадцатизначный счёт при 4 мм это 52 мм, то есть
   переноса нет с запасом вдвое, и проверено это замером, а не прикидкой. */
.rq-row{display:flex;align-items:baseline;gap:6mm;padding:1.6mm 0;
  border-top:.3mm solid var(--ink-3)}
.rq-row:first-of-type{border-top:0;padding-top:0}
.rq-k{flex:none;width:46mm;font-size:3.4mm;font-weight:500;line-height:1.3;
  color:var(--ink-2)}
/* 4 мм сплошным чёрным. Пол для значения — 3,5 мм: ниже высота строчных
   уходит под 1,4 мм, а штрих под ячейку растра. Здесь взято с запасом. */
.rq-v{flex:1;min-width:0;font-size:4mm;font-weight:700;line-height:1.3;
  color:var(--ink)}
.rq-v .tnum{font-variant-numeric:tabular-nums}

/* ДВА АДРЕСА СТОЯТ РЯДОМ, А НЕ В РАЗНЫХ УГЛАХ ЛИСТА, И ЭТО РЕШЕНИЕ ПО
   СУЩЕСТВУ. Человек путает адреса тогда, когда видит один и не знает,
   который; разнесённые по листу, они как раз и дают этот случай. Рядом
   различие видно до чтения. Разделительной линии между колонками нет —
   границу держит зазор 9 мм, тем же правилом, по которому в бегущей строке
   сайта нет разделительных точек. Асимметрия колонок намеренная:
   юридический адрес длиннее на 23 знака. */
.rq-addr{display:grid;grid-template-columns:1.07fr 1fr;gap:9mm}
.rq-ak{font-size:3.4mm;font-weight:500;line-height:1.3;color:var(--ink-2)}
.rq-av{font-size:4mm;font-weight:700;line-height:1.3;margin-top:1.5mm;color:var(--ink)}
/* Примечание — 100 % краски, не --ink-2 и не --ink-3. Строка, которая
   предупреждает, куда НЕ подавать самосвал, не может быть самым бледным
   текстом листа. */
.rq-an{font-size:3.2mm;font-weight:400;line-height:1.35;margin-top:2mm;color:var(--ink)}

/* Выноска платёжного блока — форма призыва с визитки: та же карточка, та же
   синяя грань 2,5 мм тем же псевдоэлементом. ЕДИНСТВЕННЫЙ синий объект
   листа: из всего документа в платёжное поручение переписывают именно его. */
.rq-call{position:relative;padding-left:9.5mm}
.rq-call::before{content:'';position:absolute;left:5mm;top:5mm;bottom:5mm;
  width:2.5mm;border-radius:1.25mm;background:var(--vc-sin)}
/* Без border-top: линия отделила бы примечание от блока, к которому оно
   относится. */
.rq-note{font-size:3.2mm;font-weight:400;line-height:1.35;margin-top:2mm;color:var(--ink)}

/* Подвал листа — одна строка на бумаге, без карточки и без линии. Три части
   разведены зазором, без разделительных знаков. Телефон НЕ берёт .tnum:
   колонки у номера нет, а tnum разгоняет заодно дефисы. */
.rq-foot{display:flex;gap:10mm;font-size:3.6mm;font-weight:400;line-height:1.3;
  color:var(--ink)}

@media print{
  @page{size:210mm 297mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  /* Фон листа белый: --bg это 0–2 % краски, ниже устойчивой точки лазера. */
  .vc{background:#fff!important;box-shadow:none!important;
    break-inside:avoid;page-break-inside:avoid;
    break-after:page;page-break-after:always}
  .vc:last-child{break-after:auto;page-break-after:auto}
}
`;

/* ── СБОРКА ПЕРВОЙ СТРАНИЦЫ ──────────────────────────────────────────── */

function facts() {
  return `<div class="vc-cards">` + FACTS.map((f) =>
    `<div class="vc-card"><div class="vc-card-v tnum">${f.value}`
    + `<span class="vc-card-u">${f.unit}</span></div>`
    + `<div class="vc-card-l">${f.label}</div></div>`).join('') + `</div>`;
}

function call() {
  return `<div class="vc-call"><p>${CALL}</p></div>`;
}

function contacts() {
  const site = CONTACTS.site
    ? `<p class="vc-site">${CONTACTS.site.replace(/^https?:\/\//, '')}</p>` : '';
  const qr = QR
    ? `<div class="vc-qr-box"><svg class="vc-qr" viewBox="0 0 ${QR.size} ${QR.size}"`
      + ` aria-hidden="true"><path d="${QR.path}" fill="currentColor"/></svg></div>` : '';
  const phone = `<a class="vc-phone" href="${CONTACTS.phoneHref}">${CONTACTS.phone}</a>`
    + `<p class="vc-email">${CONTACTS.email}</p>`;
  /* Слово «Площадка» перед адресом стоит ноль миллиметров и снимает вопрос,
     какого рода этот адрес, у человека, держащего одну визитку без второго
     листа. */
  const addr = `<p class="vc-addr">Площадка: ${CONTACTS.address}</p>`;
  const main = QR
    ? `<div class="vc-contacts-main">${phone}${addr}${site}</div>`
    : `${phone}<div>${addr}${site}</div>`;
  return `<div class="vc-contacts${QR ? ' vc-contacts--qr' : ''}">`
    + `<div class="vc-contacts-top">${main}${qr}</div>`
    + `<p class="vc-hours">${CONTACTS.hours}</p></div>`;
}

function page1() {
  /* Кадр 198 мм по ширине — на печати это 282 dpi у файла 2200 px. */
  const src = asset('/img/park-2200.webp');
  const PAD = 6;      // поле кадра от краёв листа, мм — только от обреза
  const LOGO = 15;    // высота знака, мм
  /* С QR-кодом плашка контактов выше на 18 мм, и такой высоты на листе нет:
     кадр отдаёт её признаком, а не правкой руками. */
  const SEAM = QR ? 84 : 102;   // нижняя кромка кадра, мм от верха листа
  const MARK = 11;    // отступ знака от нижней и левой кромки кадра, мм
  return `<div class="vc">`
    + `<div class="vc-frame" style="height:${SEAM - PAD}mm">`
    + `<img class="vc-photo" src="${src}" alt=""/>`
    + `<div class="vc-mark" style="bottom:${MARK}mm;left:${MARK}mm;`
    + `--c-bg:${'#f4f4f1'};--c-ink:${'#17191c'}">${logoSvg('o1', LOGO)}</div></div>`
    + `<div class="vc-body" style="height:${297 - SEAM}mm;padding-top:9mm">`
    + `<h2 class="vc-offer">${OFFER}</h2>`
    + `<p class="vc-kicker" style="margin-top:3.5mm">${SHIPPING}</p>`
    + `<div style="margin-top:auto;padding-top:4.5mm">${facts()}</div>`
    + `<div style="margin-top:auto;padding-top:3.5mm">${call()}</div>`
    + `<div style="margin-top:auto;padding-top:3.5mm">${contacts()}</div>`
    + `<div style="margin-top:auto;padding-top:3.5mm">`
    + `<p class="vc-legal"><b>${nbsp(LEGAL_NAME)}</b>&nbsp;&nbsp;`
    + `ИНН&nbsp;<span class="tnum">${ORG[0].value}</span>&nbsp;&nbsp;`
    /* «на второй странице», а не «на обороте»: печать односторонняя, лист
       реквизитов подшивают отдельно. */
    + `Реквизиты — на второй странице</p></div>`
    + `</div></div>`;
}

/* ── СБОРКА ВТОРОЙ СТРАНИЦЫ ──────────────────────────────────────────── */

function rows(list: Row[]) {
  return list.map((r) =>
    `<div class="rq-row"><div class="rq-k">${r.term}</div>`
    /* .tnum вешается на САМО число, а не на строку: в CoFo Sans фича
       подменяет заодно пробел широким табличным, и «ООО «СД ЭЛЕМЕНТ»»
       разъехалось бы тройной разрядкой. */
    + `<div class="rq-v">${r.digits ? `<span class="tnum">${r.value}</span>` : r.value}`
    + `</div></div>`).join('');
}

function page2() {
  const addr = ADDRESSES.map((a) =>
    `<div><div class="rq-ak">${a.term}</div>`
    + `<div class="rq-av">${a.value}</div>`
    + `<p class="rq-an">${a.note}</p></div>`).join('');

  return `<div class="vc"><div class="rq-body">`

    + `<div><div style="--c-bg:${'#17191c'};--c-ink:${'#17191c'}">`
    + `${logoSvg('o1-n', 10)}</div>`
    + `<h2 class="rq-h">${nbsp(LEGAL_NAME)}</h2>`
    + `<p class="rq-sub">${BRAND_NAME} — торговое наименование</p></div>`

    + `<div class="rq-card" style="margin-top:auto;padding-top:5mm">`
    + `<div class="rq-t">Организация</div>${rows(ORG)}</div>`

    + `<div class="rq-card" style="margin-top:auto;padding-top:5mm">`
    + `<div class="rq-t">Адреса</div><div class="rq-addr">${addr}</div></div>`

    + `<div class="rq-card rq-call" style="margin-top:auto;padding-top:5mm">`
    + `<div class="rq-t">Для платёжного поручения</div>${rows(BANK)}`
    + `<p class="rq-note">Две последние строки — реквизиты банка, а не наши. `
    + `Наши ИНН и КПП стоят выше, в блоке «Организация».</p></div>`

    + `<div class="rq-foot" style="margin-top:auto;padding-top:6mm">`
    + `<span>${CONTACTS.phone}</span><span>${CONTACTS.email}</span>`
    + `<span>${CONTACTS.site.replace(/^https?:\/\//, '')}</span></div>`

    + `</div></div>`;
}

/** Обе страницы подряд: печать разложит их по листам сама. */
export function documentHtml() {
  return page1() + page2();
}

export const PAGES = [
  { n: 1, name: 'Визитка', html: page1 },
  { n: 2, name: 'Карточка организации', html: page2 },
];
