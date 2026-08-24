/** Форматирование чисел. Везде неразрывные пробелы, чтобы «₽» не отрывался. */

const NBSP = ' ';

export function rub(n: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/\s/g, NBSP)}${NBSP}₽`;
}

export function num(n: number, digits = 0): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(n)
    .replace(/\s/g, NBSP);
}

/** Кубы показываем без хвоста, когда он нулевой: 12 м³, но 12,5 м³. */
export function volume(n: number): string {
  const r = Math.round(n * 10) / 10;
  return `${num(r, Number.isInteger(r) ? 0 : 1)}${NBSP}м³`;
}

export function tons(n: number): string {
  const r = Math.round(n * 10) / 10;
  return `${num(r, Number.isInteger(r) ? 0 : 1)}${NBSP}т`;
}

/** «1 рейс», «2 рейса», «5 рейсов». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function rides(n: number): string {
  return `${num(n)}${NBSP}${plural(n, 'рейс', 'рейса', 'рейсов')}`;
}

/**
 * Типографские неразрывные пробелы. Текст не меняется — меняются только
 * места, где строке разрешено рваться:
 *   • короткое слово (предлог, союз, частица) не остаётся в конце строки;
 *   • число не отрывается от единицы измерения: «150 км», «20 м³»;
 *   • последнее слово не остаётся одно на новой строке.
 * Последнее и есть висячая строка, из-за которой «МКАД» уезжал один, а
 * «доставкой» стояло второй строкой заголовка.
 */
export function typo(s: string): string {
  return s
    .replace(/(^|[\s(«"])([а-яёa-z]{1,2})\s+/gi, '$1$2\u00A0')
    .replace(/(\d)\s+([а-яё]{1,3}[²³]?)\b/gi, '$1\u00A0$2')
    .replace(/\s+(\S+)$/, '\u00A0$1');
}

