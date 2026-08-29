/**
 * СОДЕРЖИМОЕ ВИЗИТКИ. Собирается из тех же файлов данных, что и сайт: ни
 * одного числа и ни одной характеристики здесь не набрано руками.
 *
 * Категории и характеристики — lib/catalog.ts, пороги и сроки —
 * lib/pricing.ts, документы — lib/workflow.ts, контакты и реквизиты —
 * lib/company.ts.
 */

import { COMPANY, SHIPPING_HOURS_SHORT } from '@/lib/company';
import { num, typo } from '@/lib/format';
import { DEFERRAL_DAYS, MIN_ORDER_M3, PRICE_HOLD_DAYS } from '@/lib/pricing';
import { qrMatrix, qrPath } from '@/lib/qr';

/** Три ключевых факта: число, единица и подпись. */
export type Fact = { value: string; unit: string; label: string };

/**
 * Три показателя — теперь главный блок визитки вместо таблицы товара.
 * Подписи звучат условиями работы, а не справкой: «минимальная партия
 * отгрузки», а не «минимальная отгрузка».
 */
export const FACTS: Fact[] = [
  { value: num(MIN_ORDER_M3), unit: 'м³', label: 'минимальная партия отгрузки' },
  { value: num(DEFERRAL_DAYS), unit: 'дней', label: 'отсрочка платежа для юрлиц' },
  { value: num(PRICE_HOLD_DAYS), unit: 'дней', label: 'держим названную цену' },
];

/** Условия отгрузки одной строкой — то же, что в контактах сайта. */
export const SHIPPING = COMPANY.shipping;

/**
 * Призыв к действию. Обещает ровно то, что компания и делает по шагам
 * работы: цену обсуждают по телефону, время погрузки согласуют.
 */
export const CALL = typo('Звоните с объёмом и сроками — обсудим цену и согласуем время погрузки');

/**
 * Заголовок-предложение. Это не данные, а тот же текст, что в заголовке
 * первого экрана: держать его в двух местах нельзя, поэтому он объявлен
 * здесь один раз и отсюда идёт во все три варианта.
 */
export const OFFER = typo('Щебень, песок, грунт и металлопрокат с отгрузкой без очереди');

export const CONTACTS = {
  phone: COMPANY.phoneLabel,
  phoneHref: `tel:${COMPANY.phone}`,
  address: COMPANY.address,
  /** Короткая форма для футера: «Отгрузка круглосуточно». */
  hours: `Отгрузка ${SHIPPING_HOURS_SHORT}`,
  /** Адрес сайта. Пусто — на визитке не рисуется ни строка, ни QR-код. */
  site: COMPANY.site,
};

/**
 * QR-код на сайт. Считается ПРИ СБОРКЕ: сайт статический, адрес известен
 * заранее, и клиентского кода для этого не нужно вовсе — в бандл не уезжает
 * ни байта. Пустой адрес даёт пустую матрицу, и код не рисуется.
 */
const QR_MATRIX = qrMatrix(COMPANY.site);
export const QR = QR_MATRIX.length
  ? { size: QR_MATRIX.length, path: qrPath(QR_MATRIX) }
  : null;

/**
 * Реквизиты. Почты здесь нет: поля email в lib/company.ts не существует —
 * почта убрана со всего сайта решением заказчика, и заводить её обратно
 * запрещено правилом проекта. Каналов связи два: телефон и заявка.
 */
export const LEGAL: [string, string][] = [
  ['ИНН', COMPANY.inn],
  ['КПП', COMPANY.kpp],
  ['ОГРН', COMPANY.ogrn],
];

export const LEGAL_NAME = COMPANY.legalName;
