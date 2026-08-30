-- СХЕМА БАЗЫ ДЛЯ АДМИНКИ «ЭЛЕМЕНТ».
--
-- Таблицы повторяют типы из lib/data/types.ts — тот файл договор между базой
-- и сайтом. Расходиться им нельзя: перед сборкой снимок из базы проверяется
-- на соответствие типам, и не сошедшаяся структура роняет сборку.
--
-- Кодировка utf8mb4 обязательна: в названиях позиций есть тире и кавычки-
-- ёлочки, а в утилите «уточняйте у менеджера» — обычная кириллица. utf8 в
-- MySQL это трёхбайтовый суррогат, на нём ломается всё за пределами BMP.
--
-- Разворачивается один раз через /admin/install.php.

CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  summary     TEXT         NOT NULL,
  -- В чём категория продаётся и показывается: инертные кубами, металл тоннами.
  unit        ENUM('m3','t') NOT NULL DEFAULT 'm3',
  -- Подпись строки фильтра по группам. Пусто — групп у категории нет.
  group_label VARCHAR(120) NULL,
  sort        INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Имя таблицы НЕ groups: GROUPS зарезервировано в MySQL 8 под оконные
-- функции, и запрос к ней падал бы с синтаксической ошибкой.
CREATE TABLE IF NOT EXISTS material_groups (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  category_id VARCHAR(64)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  sort        INT          NOT NULL DEFAULT 0,
  KEY idx_group_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  category_id   VARCHAR(64)  NOT NULL,
  name          VARCHAR(200) NOT NULL,
  -- Группа внутри категории. Есть только у металла.
  group_id      VARCHAR(64)  NULL,
  -- Разновидность: гранитный, известняковый, мытый.
  kind          VARCHAR(120) NOT NULL,

  -- ЗЕРНОВОЙ СОСТАВ. Четыре вида, потому что четыре разные вещи и
  -- нормируются. Подпись НЕ хранится: она выводится из чисел хелпером
  -- fractionLabel(). Хранится только у вида none — там это не размер зерна,
  -- а обработка («просеянный», «⌀ 10 мм»).
  fraction_kind ENUM('mm','mkr','gravel','none') NOT NULL DEFAULT 'mm',
  fraction_from DECIMAL(7,2) NULL,
  fraction_to   DECIMAL(7,2) NULL,
  fraction_percent DECIMAL(7,2) NULL,
  fraction_label   VARCHAR(120) NULL,

  gost          VARCHAR(120) NULL,
  strength      VARCHAR(40)  NULL,
  frost         VARCHAR(40)  NULL,
  -- Насыпная плотность, т/м³. У металла её нет: кубами прокат не возят.
  density       DECIMAL(7,3) NULL,

  -- ЦЕНА ЗА ТОННУ. NULL — цены нет, и это НЕ ноль: сайт пишет «уточняйте у
  -- менеджера», позиция не идёт ни в расчёт, ни в минимум по категории.
  -- Поэтому колонка обязана быть NULL-able, а форма обязана различать
  -- пустое поле и введённый ноль.
  price_per_ton INT          NULL,

  availability  ENUM('in-stock','on-order','out','unknown') NOT NULL DEFAULT 'in-stock',
  -- Позиция, с которой открывается калькулятор. Ровно одна на весь каталог:
  -- признак снимается со всех остальных в той же транзакции.
  is_default    TINYINT(1)   NOT NULL DEFAULT 0,
  -- Где применяется. По одному применению в строке.
  uses          TEXT         NOT NULL,
  note          TEXT         NULL,
  sort          INT          NOT NULL DEFAULT 0,
  KEY idx_material_category (category_id),
  KEY idx_material_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Реквизиты — ключ-значение, а не колонки. Поля здесь разнородные и
-- добавляются по одному; таблица в одну строку с полутора десятками колонок
-- требовала бы миграции на каждое новое поле.
CREATE TABLE IF NOT EXISTS company (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v TEXT        NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS objects (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(200) NOT NULL,
  place    VARCHAR(120) NOT NULL,
  supplied VARCHAR(400) NOT NULL,
  m3       INT          NOT NULL,
  period   VARCHAR(120) NOT NULL,
  sort     INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fleet_numbers (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  value    INT          NOT NULL,
  unit     VARCHAR(20)  NOT NULL DEFAULT '',
  label    VARCHAR(120) NOT NULL,
  note     VARCHAR(300) NOT NULL DEFAULT '',
  is_lead  TINYINT(1)   NOT NULL DEFAULT 0,
  -- Число считается из данных, а не набирается: '' — набирается,
  -- positions — сколько позиций в каталоге, years — лет на рынке.
  computed ENUM('','positions','years') NOT NULL DEFAULT '',
  sort     INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- СНИМКИ ПУБЛИКАЦИЙ. Сборка забирает не «то, что в базе сейчас», а снимок:
-- иначе правка, сделанная пока идёт сборка, уехала бы на сайт наполовину.
-- Здесь же берётся ответ на вопрос «есть ли несохранённые изменения»:
-- сравнивается отпечаток текущих данных с отпечатком последнего снимка.
CREATE TABLE IF NOT EXISTS snapshots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  payload    LONGTEXT    NOT NULL,
  digest     CHAR(64)    NOT NULL,
  created_at DATETIME    NOT NULL,
  -- Что ответил GitHub на запуск сборки. Пусто — ещё не отвечал.
  dispatch   VARCHAR(200) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Неудачные попытки входа. Адрес хранится хешем: список тех, кто стучался,
-- нам не нужен, нужен только счётчик.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash  CHAR(64) NOT NULL PRIMARY KEY,
  fails    INT      NOT NULL DEFAULT 0,
  last_at  DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
