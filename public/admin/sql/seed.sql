-- ПЕРВОНАЧАЛЬНОЕ НАПОЛНЕНИЕ. Собран scripts/build-cms-seed.mjs
-- из lib/data/*.data.ts — руками не править, правка потеряется.
--
-- Загружается один раз, при установке админки. Повторный запуск
-- ничего не испортит: install.php заливает seed только в пустую базу.

-- Категории
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('shcheben', 'Щебень', 'Подбираем под нагрузку на основание: марку берём по проекту.', 'm3', NULL, 0);
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('pesok', 'Песок', 'Карьерный на подсыпку и обратную засыпку, мытый — под кладочный и бетонный раствор.', 'm3', NULL, 1);
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('pgs', 'ПГС', 'Песчано-гравийная смесь: природная для отсыпки и планировки, обогащённая — с нормированным содержанием гравия под бетон.', 'm3', NULL, 2);
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('otsev', 'Отсев', 'Побочный продукт дробления. Дешевле песка на отсыпке, плотно трамбуется — берут под тротуарную плитку и дорожки.', 'm3', NULL, 3);
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('grunt', 'Грунт и чернозём', 'Плодородные грунты под озеленение и планировочный грунт под вертикальную планировку. Отбираем по агрохимическому анализу.', 'm3', NULL, 4);
INSERT INTO categories (id, name, summary, unit, group_label, sort) VALUES ('metall', 'Металлопрокат', 'Цены за тонну. Марку стали, наличие и срок называем по заявке.', 't', 'Вид проката', 5);

-- Группы внутри категории (пока только виды проката)
INSERT INTO material_groups (id, category_id, name, sort) VALUES ('armatura', 'metall', 'Арматура', 0);
INSERT INTO material_groups (id, category_id, name, sort) VALUES ('ugolok', 'metall', 'Уголок', 1);
INSERT INTO material_groups (id, category_id, name, sort) VALUES ('shveller', 'metall', 'Швеллер', 2);
INSERT INTO material_groups (id, category_id, name, sort) VALUES ('truba', 'metall', 'Труба профильная', 3);

-- Позиции каталога: 46
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('granit-5-20', 'shcheben', 'Щебень гранитный', NULL, 'гранитный', 'mm', 5, 20, NULL, NULL, 'ГОСТ 8267-93', 'М1200', 'F300', 1.37, 3000, 'in-stock', 1, 'товарный бетон
фундамент
ЖБИ', 'Лещадность I группы. Основная фракция под бетон.', 0);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('granit-20-40', 'shcheben', 'Щебень гранитный', NULL, 'гранитный', 'mm', 20, 40, NULL, NULL, 'ГОСТ 8267-93', 'М1200', 'F300', 1.35, NULL, 'in-stock', 0, 'основание дороги
дренаж
бетон крупных конструкций', NULL, 1);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('granit-40-70', 'shcheben', 'Щебень гранитный', NULL, 'гранитный', 'mm', 40, 70, NULL, NULL, 'ГОСТ 8267-93', 'М1200', 'F300', 1.33, NULL, 'in-stock', 0, 'подушка под дорогу
отсыпка слабых грунтов
габионы', NULL, 2);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('izvest-5-20', 'shcheben', 'Щебень известняковый', NULL, 'известняковый', 'mm', 5, 20, NULL, NULL, 'ГОСТ 8267-93', 'М600', 'F150', 1.3, 2400, 'in-stock', 0, 'бетон низких марок
подсыпка
ландшафт', 'Дешевле гранита, но не под нагруженные конструкции.', 3);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('izvest-20-40', 'shcheben', 'Щебень известняковый', NULL, 'известняковый', 'mm', 20, 40, NULL, NULL, 'ГОСТ 8267-93', 'М600', 'F150', 1.28, NULL, 'in-stock', 0, 'отсыпка дорог
основание площадок
дренаж', NULL, 4);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('izvest-40-70', 'shcheben', 'Щебень известняковый', NULL, 'известняковый', 'mm', 40, 70, NULL, NULL, 'ГОСТ 8267-93', 'М400', 'F150', 1.26, NULL, 'in-stock', 0, 'временные дороги
отсыпка котлована', NULL, 5);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('graviy-5-20', 'shcheben', 'Щебень гравийный', NULL, 'гравийный', 'mm', 5, 20, NULL, NULL, 'ГОСТ 8267-93', 'М1000', 'F200', 1.42, 2500, 'in-stock', 0, 'бетон
фундамент частного дома
дренаж', 'Компромисс между гранитом и известняком по цене и прочности.', 6);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('graviy-20-40', 'shcheben', 'Щебень гравийный', NULL, 'гравийный', 'mm', 20, 40, NULL, NULL, 'ГОСТ 8267-93', 'М1000', 'F200', 1.4, NULL, 'on-order', 0, 'основание дороги
отсыпка
дренажный слой', NULL, 7);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('graviy-40-70', 'shcheben', 'Щебень гравийный', NULL, 'гравийный', 'mm', 40, 70, NULL, NULL, NULL, NULL, NULL, 1.4, NULL, 'unknown', 0, 'основание дороги
отсыпка
дренажный слой', NULL, 8);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('vtor-20-40', 'shcheben', 'Щебень вторичный', NULL, 'вторичный', 'mm', 20, 40, NULL, NULL, 'ТУ 5711-006', 'М400', 'F50', 1.2, NULL, 'in-stock', 0, 'временные дороги
засыпка ям
подъездные пути', 'Дроблёный бетонный бой. Самый дешёвый вариант под технологический проезд.', 9);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('pesok-kar', 'pesok', 'Песок карьерный', NULL, 'карьерный', 'mkr', 1.8, 2.2, NULL, NULL, 'ГОСТ 8736-2014', NULL, NULL, 1.55, 1300, 'in-stock', 0, 'обратная засыпка
подсыпка
планировка', 'Содержит глинистые включения — не для кладочного раствора.', 10);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('pesok-seyan', 'pesok', 'Песок карьерный сеяный', NULL, 'сеяный', 'mkr', 2, 2.5, NULL, NULL, 'ГОСТ 8736-2014', NULL, NULL, 1.5, NULL, 'in-stock', 0, 'подушка под фундамент
подсыпка под плитку
штукатурный раствор', NULL, 11);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('pesok-mytyy', 'pesok', 'Песок мытый', NULL, 'мытый', 'mkr', 2, 2.5, NULL, NULL, 'ГОСТ 8736-2014', NULL, NULL, 1.5, NULL, 'in-stock', 0, 'товарный бетон
кладочный раствор
стяжка', 'Промыт от глины и пыли. Содержание пылевидных частиц до 2 %.', 12);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('pesok-rechnoy', 'pesok', 'Песок речной намывной', NULL, 'речной', 'mkr', 2.2, 2.8, NULL, NULL, 'ГОСТ 8736-2014', NULL, NULL, 1.48, NULL, 'on-order', 0, 'бетон высоких марок
дренаж
пескоструй', NULL, 13);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('pgs-prir', 'pgs', 'ПГС природная', NULL, 'природная', 'mm', 0, 70, NULL, NULL, 'ГОСТ 23735-2014', NULL, NULL, 1.65, NULL, 'in-stock', 0, 'отсыпка
планировка участка
подъездные пути', 'Содержание гравия 10–20 %, не нормируется.', 14);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('opgs-30', 'pgs', 'ПГС обогащённая', NULL, 'обогащённая', 'gravel', NULL, NULL, 30, NULL, 'ГОСТ 23735-2014', NULL, NULL, 1.7, NULL, 'in-stock', 0, 'подстилающий слой дороги
бетон
основание площадки', NULL, 15);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('opgs-50', 'pgs', 'ПГС обогащённая', NULL, 'обогащённая', 'gravel', NULL, NULL, 50, NULL, 'ГОСТ 23735-2014', NULL, NULL, 1.75, NULL, 'on-order', 0, 'несущее основание
бетон
дорожная одежда', NULL, 16);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('otsev-granit', 'otsev', 'Отсев гранитный', NULL, 'гранитный', 'mm', 0, 5, NULL, NULL, 'ГОСТ 31424-2010', 'М1200', NULL, 1.4, NULL, 'in-stock', 0, 'подсыпка под тротуарную плитку
дорожки
бетон', NULL, 17);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('otsev-izvest', 'otsev', 'Отсев известняковый', NULL, 'известняковый', 'mm', 0, 5, NULL, NULL, 'ГОСТ 31424-2010', 'М600', NULL, 1.32, NULL, 'in-stock', 0, 'отсыпка дорожек
подсыпка
благоустройство', NULL, 18);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('otsev-graviy', 'otsev', 'Отсев гравийный', NULL, 'гравийный', 'mm', 0, 10, NULL, NULL, 'ГОСТ 31424-2010', 'М1000', NULL, 1.45, NULL, 'on-order', 0, 'подсыпка
дренаж
отсыпка площадок', NULL, 19);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('chernozem', 'grunt', 'Чернозём', NULL, 'чернозём', 'none', NULL, NULL, NULL, 'просеянный', 'без ГОСТ, по агроанализу', NULL, NULL, 1.15, NULL, 'in-stock', 0, 'газон
клумбы
плодовые посадки', 'Содержание гумуса от 6 %. Паспорт агрохимического анализа по запросу.', 20);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('grunt-plodorod', 'grunt', 'Грунт плодородный', NULL, 'плодородный', 'none', NULL, NULL, NULL, 'просеянный', 'без ГОСТ, по агроанализу', NULL, NULL, 1.2, NULL, 'in-stock', 0, 'газон
озеленение территории
рекультивация', NULL, 21);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('grunt-rastit', 'grunt', 'Грунт растительный', NULL, 'растительный', 'none', NULL, NULL, NULL, 'непросеянный', 'без ГОСТ', NULL, NULL, 1.25, NULL, 'in-stock', 0, 'выравнивание участка
подсыпка под газон', NULL, 22);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('torfogrunt', 'grunt', 'Торфогрунт', NULL, 'торфяной', 'none', NULL, NULL, NULL, 'просеянный', 'без ГОСТ, по агроанализу', NULL, NULL, 0.9, NULL, 'on-order', 0, 'теплицы
клумбы
улучшение почвы', NULL, 23);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('grunt-planir', 'grunt', 'Грунт планировочный', NULL, 'планировочный', 'none', NULL, NULL, NULL, 'без сортировки', 'без ГОСТ', NULL, NULL, 1.6, NULL, 'out', 0, 'вертикальная планировка
засыпка котлована', 'Отгружаем с площадок в момент выемки — наличие уточняйте.', 24);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('arm-10', 'metall', 'Арматура рифлёная', 'armatura', 'арматура', 'none', NULL, NULL, NULL, '⌀ 10 мм', NULL, NULL, NULL, NULL, 78000, 'unknown', 0, 'армирование бетона
фундамент
монолит', NULL, 25);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('arm-12', 'metall', 'Арматура рифлёная', 'armatura', 'арматура', 'none', NULL, NULL, NULL, '⌀ 12 мм', NULL, NULL, NULL, NULL, 75000, 'unknown', 0, 'армирование бетона
фундамент
монолит', NULL, 26);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('arm-14', 'metall', 'Арматура рифлёная', 'armatura', 'арматура', 'none', NULL, NULL, NULL, '⌀ 14 мм', NULL, NULL, NULL, NULL, 74500, 'unknown', 0, 'армирование бетона
фундамент
монолит', NULL, 27);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('arm-16', 'metall', 'Арматура рифлёная', 'armatura', 'арматура', 'none', NULL, NULL, NULL, '⌀ 16 мм', NULL, NULL, NULL, NULL, 74500, 'unknown', 0, 'армирование бетона
фундамент
монолит', NULL, 28);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('ugol-40x40-4', 'metall', 'Уголок', 'ugolok', 'уголок', 'none', NULL, NULL, NULL, '40×40×4 мм', NULL, NULL, NULL, NULL, 101000, 'unknown', 0, 'металлоконструкции
обвязка', NULL, 29);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('ugol-50x50-5', 'metall', 'Уголок', 'ugolok', 'уголок', 'none', NULL, NULL, NULL, '50×50×5 мм', NULL, NULL, NULL, NULL, 85000, 'unknown', 0, 'металлоконструкции
обвязка', NULL, 30);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('ugol-63x63-6', 'metall', 'Уголок', 'ugolok', 'уголок', 'none', NULL, NULL, NULL, '63×63×6 мм', NULL, NULL, NULL, NULL, 81000, 'unknown', 0, 'металлоконструкции
обвязка', NULL, 31);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('ugol-75x75-6', 'metall', 'Уголок', 'ugolok', 'уголок', 'none', NULL, NULL, NULL, '75×75×6 мм', NULL, NULL, NULL, NULL, 92000, 'unknown', 0, 'металлоконструкции
обвязка', NULL, 32);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('shveller-10', 'metall', 'Швеллер', 'shveller', 'швеллер', 'none', NULL, NULL, NULL, '№ 10', NULL, NULL, NULL, NULL, 102000, 'unknown', 0, 'перемычки
балки
рамы', NULL, 33);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('shveller-12', 'metall', 'Швеллер', 'shveller', 'швеллер', 'none', NULL, NULL, NULL, '№ 12', NULL, NULL, NULL, NULL, 106000, 'unknown', 0, 'перемычки
балки
рамы', NULL, 34);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('shveller-14', 'metall', 'Швеллер', 'shveller', 'швеллер', 'none', NULL, NULL, NULL, '№ 14', NULL, NULL, NULL, NULL, 107000, 'unknown', 0, 'перемычки
балки
рамы', NULL, 35);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('shveller-16', 'metall', 'Швеллер', 'shveller', 'швеллер', 'none', NULL, NULL, NULL, '№ 16', NULL, NULL, NULL, NULL, 105000, 'unknown', 0, 'перемычки
балки
рамы', NULL, 36);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-40x20-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '40×20×2 мм', NULL, NULL, NULL, NULL, 70000, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 37);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-40x25-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '40×25×2 мм', NULL, NULL, NULL, NULL, 63000, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 38);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-40x40-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '40×40×2 мм', NULL, NULL, NULL, NULL, 62500, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 39);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-50x50-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '50×50×2 мм', NULL, NULL, NULL, NULL, 75000, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 40);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-60x40-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '60×40×2 мм', NULL, NULL, NULL, NULL, 69000, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 41);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-60x60-2', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '60×60×2 мм', NULL, NULL, NULL, NULL, 62500, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 42);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-80x40-3', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '80×40×3 мм', NULL, NULL, NULL, NULL, 60000, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 43);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-80x80-3', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '80×80×3 мм', NULL, NULL, NULL, NULL, 59500, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 44);
INSERT INTO materials (id, category_id, name, group_id, kind, fraction_kind, fraction_from, fraction_to, fraction_percent, fraction_label, gost, strength, frost, density, price_per_ton, availability, is_default, uses, note, sort) VALUES ('truba-100x100-3', 'metall', 'Труба профильная', 'truba', 'труба профильная', 'none', NULL, NULL, NULL, '100×100×3 мм', NULL, NULL, NULL, NULL, 59500, 'unknown', 0, 'каркасы
навесы
ограждения', NULL, 45);

-- Реквизиты и контакты
INSERT INTO company (k, v) VALUES ('legalName', 'ООО «Строительный Дом Элемент»');
INSERT INTO company (k, v) VALUES ('phone', '+79301607878');
INSERT INTO company (k, v) VALUES ('address', 'Московская область, город Люберцы, улица Транспортная, дом 6');
INSERT INTO company (k, v) VALUES ('email', 'st.dom@internet.ru');
INSERT INTO company (k, v) VALUES ('hoursOffice', 'Пн–Пт 8:00–19:00, Сб 9:00–15:00');
INSERT INTO company (k, v) VALUES ('hoursShippingShort', 'круглосуточно');
INSERT INTO company (k, v) VALUES ('inn', '5027294043');
INSERT INTO company (k, v) VALUES ('kpp', '771201001');
INSERT INTO company (k, v) VALUES ('ogrn', '1157746000000');
INSERT INTO company (k, v) VALUES ('bank', 'ПАО Сбербанк, г. Москва');
INSERT INTO company (k, v) VALUES ('account', '40702810000000000000');
INSERT INTO company (k, v) VALUES ('corr', '30101810400000000225');
INSERT INTO company (k, v) VALUES ('bik', '044525225');

-- Объекты
INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES ('ЖК «Лесная Гавань»', 'Красногорск', 'Щебень гранитный 20–40, песок карьерный сеяный', 4200, 'март — август 2025', 0);
INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES ('Логистический комплекс', 'Домодедово', 'ПГС обогащённая, щебень известняковый 40–70', 9600, 'май — ноябрь 2025', 1);
INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES ('Реконструкция подъездной дороги', 'Ногинский район', 'Щебень гранитный 40–70, отсев гранитный', 6100, 'июнь — сентябрь 2025', 2);
INSERT INTO objects (name, place, supplied, m3, period, sort) VALUES ('Благоустройство парка', 'Мытищи', 'Чернозём просеянный, грунт плодородный', 1450, 'апрель — май 2026', 3);

-- Цифры парка
INSERT INTO fleet_numbers (value, unit, label, note, is_lead, computed, sort) VALUES (24, '', 'единицы техники', 'самосвалы {самосвалы} м³, свои и партнёрские', 0, '', 0);
INSERT INTO fleet_numbers (value, unit, label, note, is_lead, computed, sort) VALUES (1800, 'м³', 'в сутки', 'пиковая отгрузка с трёх площадок', 1, '', 1);
INSERT INTO fleet_numbers (value, unit, label, note, is_lead, computed, sort) VALUES (46, '', 'позиций в каталоге', '{категорий} групп: инертные и металлопрокат', 0, 'positions', 2);
INSERT INTO fleet_numbers (value, unit, label, note, is_lead, computed, sort) VALUES (11, '', 'лет на рынке', 'с {год} года, более {объектов} объектов', 0, 'years', 3);
