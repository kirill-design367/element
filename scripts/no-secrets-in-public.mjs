/**
 * ДОСТУПОВ В КОРНЕ САЙТА БЫТЬ НЕ ДОЛЖНО — ПРОВЕРЯЕТСЯ СБОРКОЙ.
 *
 * Файл настроек с паролем от базы, токеном GitHub и ключом выгрузки лежит
 * ВНЕ корня сайта — по FTP это `/cms-config.php`, рядом с папкой `www`.
 * Внутрь корня ему нельзя по двум причинам сразу: браузер может запросить
 * файл напрямую, а выкладка с `--delete` стёрла бы его при первой же
 * публикации.
 *
 * Внутри `public/` остаётся только КОД, который этот файл находит и
 * подключает по абсолютному пути (`admin/lib/config.php`), и собранные при
 * сборке почтовые настройки (`api/config.php`) — там два открытых адреса и
 * ничего больше.
 *
 * Свойство «в корне нет доступов» верно сегодня, но само себя не стережёт:
 * достаточно одного `'db_pass' => '…'`, вписанного в спешке, и пароль уедет
 * на сервер и в историю. Поэтому оно проверяется, а не подразумевается.
 *
 * Ищем не упоминание имени поля — их в коде десятки, все читающие, — а
 * ПРИСВОЕНИЕ имени непустого значения. Плюс сами формы секретов: токены
 * GitHub и хеши bcrypt узнаются по виду, как бы поле ни называлось.
 *
 * Запускается шагом сборки. Отдельно:  node scripts/no-secrets-in-public.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'public';

/** Поля доступов. Беда — не упоминание, а присвоение непустой строки. */
const KEYS = [
  'db_pass', 'db_user', 'db_name', 'db_host',
  'github_token', 'export_key', 'password_hash',
];

/** Секреты, которые узнаются по собственному виду, без имени поля. */
const SHAPES = [
  [/\bghp_[A-Za-z0-9]{16,}/, 'классический токен GitHub'],
  [/\bgithub_pat_[A-Za-z0-9_]{16,}/, 'тонко настроенный токен GitHub'],
  [/\$2y\$\d{2}\$[./A-Za-z0-9]{20,}/, 'хеш пароля bcrypt'],
  [/\bmysql:host=(?!%s)[^;'"]+;\s*dbname=(?!%s)/, 'строка подключения с живыми значениями'],
];

/* Присвоение: 'db_pass' => 'значение'  либо  $db_pass = "значение".
   Пустая строка разрешена — это заглушка образца, а не доступ. */
const assigned = KEYS.map((k) => [
  new RegExp(`['"]${k}['"]\\s*=>\\s*['"]([^'"]+)['"]`),
  new RegExp(`\\$${k}\\s*=\\s*['"]([^'"]+)['"]`),
]);

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(php|js|mjs|json|txt|env)$/i.test(name)) files.push(path);
  }
})(ROOT);

const found = [];
for (const path of files) {
  const src = readFileSync(path, 'utf8');
  src.split('\n').forEach((line, i) => {
    const at = `${path}:${i + 1}`;
    KEYS.forEach((key, k) => {
      for (const re of assigned[k]) {
        const m = line.match(re);
        /* Значение из другой переменной или из массива — это чтение, а не
           доступ: `'token' => trim((string) ($c['github_token'] ?? ''))`. */
        if (m && !m[1].includes('$')) {
          found.push(`${at}  полю ${key} присвоено значение`);
        }
      }
    });
    for (const [re, what] of SHAPES) {
      if (re.test(line)) found.push(`${at}  ${what}`);
    }
  });
}

if (found.length > 0) {
  console.error('');
  console.error('В КОРНЕ САЙТА НАЙДЕНЫ ДОСТУПЫ — СБОРКА ОСТАНОВЛЕНА.');
  console.error('');
  console.error('Всё, что лежит в public/, уезжает на сервер и попадает в историю');
  console.error('репозитория. Доступам там не место: их файл живёт вне корня сайта,');
  console.error('рядом с папкой www, и подключается по абсолютному пути.');
  console.error('');
  for (const line of found) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}

console.log(`Доступов в ${ROOT}/ нет — проверено ${files.length} файлов.`);
