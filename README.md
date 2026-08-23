# Строительный Дом Элемент

Сайт поставщика инертных и строительных материалов: щебень, песок, ПГС,
отсев, грунт. Москва и область.

**Боевой адрес:** https://kirill-design367.github.io/element/

Два маршрута — лендинг `/` и каталог `/catalog/`, плюс служебная страница
сравнения шрифтов `/fonts/`.

## Запуск

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # статика в out/
npx serve out -p 4173  # прогон собранного как в бою
```

## Где что менять

| Что | Файл |
|---|---|
| Номенклатура и цены материалов | `lib/catalog.ts` |
| Тарифы доставки, парк, формулы | `lib/pricing.ts` |
| Телефон, почта, адреса, реквизиты | `lib/company.ts` |
| Места под будущие фотографии | `lib/assets.ts` |
| Цвет, типографические токены | `app/globals.css` |
| Шрифтовая пара | `app/type.ts` |

Правила проекта, принятые решения и открытые вопросы — в [CLAUDE.md](./CLAUDE.md).

## Служебные скрипты

```bash
python3 scripts/verify-fonts.py assets/fonts/*.woff2   # проверка cmap и tnum
python3 scripts/build-fonts.py <папка-ttf> assets/fonts # пересборка подмножеств
node scripts/shots.mjs        # скриншоты блоков (нужен запущенный serve)
node scripts/qa.mjs           # клавиатура, цели нажатия, режим покоя
```

## Выкладка

Пуш в `main` запускает `.github/workflows/deploy.yml`: сборка с
`NEXT_PUBLIC_BASE_PATH=/element`, `.nojekyll` и публикация на GitHub Pages.
