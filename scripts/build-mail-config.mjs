/**
 * НАСТРОЙКИ ПРИЁМНИКА ЗАЯВКИ — СОБИРАЮТСЯ ПРИ СБОРКЕ.
 *
 * Адрес получателя не набирается в PHP руками. Он живёт там же, где все
 * остальные контакты, — в `lib/company.ts`, — и попадает в скрипт отсюда.
 * Иначе однажды поменяют почту в контактах, а заявки продолжат уходить на
 * старый адрес, и заметить это будет некому: письма просто перестанут
 * приходить, а форма будет показывать успех.
 *
 * Файл кладётся в `public/api/config.php`, то есть уезжает на хостинг
 * вместе с выдачей. В репозиторий он НЕ коммитится — стоит в .gitignore:
 * настройки почты не место в истории, а собрать их можно в любой момент.
 *
 * ОТПРАВИТЕЛЬ — С НАШЕГО ДОМЕНА. Shared-хостинг почти всегда отвергает или
 * помечает спамом письмо, у которого отправитель на чужом домене: почта
 * получателя видит письмо «от st.dom@internet.ru», отправленное сервером
 * elementst.ru, и не находит на это разрешения в SPF. Поэтому отправитель
 * собирается из домена сайта, а адрес заказчика стоит получателем.
 *
 * Запускается сам перед сборкой (npm run build → prebuild).
 * Отдельно:  node scripts/build-mail-config.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'lib/company.ts';
const OUT = 'public/api/config.php';
/** Ящик, от чьего имени уходит письмо. Заводится в панели хостинга. */
const SENDER = 'no-reply';

const src = readFileSync(SRC, 'utf8');
const field = (name) => {
  const m = src.match(new RegExp(`\\b${name}:\\s*'([^']+)'`));
  if (!m) throw new Error(`в ${SRC} не найдено поле ${name}`);
  return m[1];
};

const to = field('email');
/* Домен берётся из адреса сайта, а не пишется отдельной строкой: две записи
   одного факта разошлись бы при переезде. */
const domain = new URL(field('site')).hostname.replace(/^www\./, '');
const from = `${SENDER}@${domain}`;

mkdirSync('public/api', { recursive: true });
writeFileSync(
  OUT,
  `<?php
/* Файл собран scripts/build-mail-config.mjs из lib/company.ts.
   Руками не править: правка потеряется при следующей сборке.
   Получатель меняется в lib/company.ts, поле email. */
return [
    'to'     => ${JSON.stringify(to)},
    'from'   => ${JSON.stringify(from)},
    'domain' => ${JSON.stringify(domain)},
];
`,
);
console.log(`${OUT}: получатель ${to}, отправитель ${from}`);
