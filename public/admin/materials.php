<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * ТАБЛИЦА ПОЗИЦИЙ.
 *
 * МАССОВАЯ ПРАВКА ЦЕН — САМОЕ ЧАСТОЕ ДЕЙСТВИЕ, и ради него вся страница
 * устроена как одна форма: цена каждой позиции стоит прямо в строке
 * таблицы, менять можно сколько угодно за раз, сохраняются все одним
 * нажатием. Открывать карточку ради одного числа не нужно — а прайс
 * приходит целиком и правится целиком.
 *
 * ПУСТОЕ ПОЛЕ ЦЕНЫ И НОЛЬ — РАЗНЫЕ ВЕЩИ. Пустое значит «цены в прайсе нет»,
 * и на сайте это «уточняйте у менеджера». Ноль значил бы «бесплатно». Форма
 * их различает, и подпись под таблицей об этом прямо говорит.
 */

$categories = q('SELECT id, name FROM categories ORDER BY sort, id');
$catName = [];
foreach ($categories as $c) {
    $catName[$c['id']] = $c['name'];
}

/* ── Сохранение цен пачкой ─────────────────────────────────────────── */
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($_POST['action'] ?? '') === 'prices') {
    csrf_check();
    $changed = 0;
    $bad = [];
    $prices = $_POST['price'] ?? [];
    if (is_array($prices)) {
        foreach ($prices as $id => $raw) {
            $id = (string) $id;
            $row = q1('SELECT price_per_ton FROM materials WHERE id = ?', [$id]);
            if ($row === null) {
                continue;
            }
            $raw = trim((string) $raw);
            if ($raw === '') {
                $value = null;
            } else {
                $bare = str_replace([' ', "\u{00A0}", ','], ['', '', '.'], $raw);
                if (!is_numeric($bare) || (float) $bare < 0) {
                    $bad[] = $id;
                    continue;
                }
                $value = (int) round((float) $bare);
            }
            $was = $row['price_per_ton'] === null ? null : (int) $row['price_per_ton'];
            if ($was !== $value) {
                ex('UPDATE materials SET price_per_ton = ? WHERE id = ?', [$value, $id]);
                $changed++;
            }
        }
    }
    if ($bad !== []) {
        flash('mat', 'Не приняты цены у позиций: ' . implode(', ', $bad)
            . '. Цена — число, например 3000 или 2 450. Пустое поле означает «цены нет».', 'err');
    } elseif ($changed === 0) {
        flash('mat', 'Ничего не изменилось — цены те же.', 'info');
    } else {
        flash('mat', "Сохранено цен: {$changed}. Чтобы правка попала на сайт, нажмите «Опубликовать».");
    }
    header('Location: materials.php?' . http_build_query([
        'q' => (string) ($_POST['q'] ?? ''),
        'cat' => (string) ($_POST['cat'] ?? ''),
    ]));
    exit;
}

/* ── Удаление ──────────────────────────────────────────────────────── */
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    csrf_check();
    $id = (string) ($_POST['id'] ?? '');
    $row = q1('SELECT name, is_default FROM materials WHERE id = ?', [$id]);
    if ($row === null) {
        flash('mat', 'Такой позиции уже нет.', 'info');
    } else {
        ex('DELETE FROM materials WHERE id = ?', [$id]);
        $note = '';
        /* УДАЛЕНИЕ ПОЗИЦИИ ПО УМОЛЧАНИЮ НЕ ДОЛЖНО ОСТАВИТЬ КАТАЛОГ БЕЗ НЕЁ.
           Сайт переживёт и отсутствие признака — там стоит запасной путь, —
           но калькулятор открывался бы на случайной позиции. Признак
           переезжает на первую оставшуюся сразу. */
        if ((int) $row['is_default'] === 1) {
            $first = q1('SELECT id FROM materials ORDER BY sort, id LIMIT 1');
            if ($first !== null) {
                ex('UPDATE materials SET is_default = 1 WHERE id = ?', [$first['id']]);
                $note = ' Позиция была выбрана в калькуляторе — признак перенесён на «'
                    . (string) (q1('SELECT name FROM materials WHERE id = ?', [$first['id']])['name'] ?? '') . '».';
            }
        }
        flash('mat', 'Позиция «' . (string) $row['name'] . '» удалена.' . $note);
    }
    header('Location: materials.php');
    exit;
}

/* ── Поиск и фильтр ────────────────────────────────────────────────── */
$search = trim((string) ($_GET['q'] ?? ''));
$cat = (string) ($_GET['cat'] ?? '');

$sql = 'SELECT * FROM materials WHERE 1=1';
$args = [];
if ($cat !== '' && isset($catName[$cat])) {
    $sql .= ' AND category_id = ?';
    $args[] = $cat;
}
if ($search !== '') {
    /* Ищем по названию, разновидности и обозначению партии сразу: снабженец
       помнит то «гранитный», то «40–70», то «ГОСТ». */
    $sql .= ' AND (name LIKE ? OR kind LIKE ? OR gost LIKE ? OR fraction_label LIKE ? OR id LIKE ?)';
    $like = '%' . $search . '%';
    array_push($args, $like, $like, $like, $like, $like);
}
$sql .= ' ORDER BY sort, id';
$list = q($sql, $args);

const AVAIL = [
    'in-stock' => 'В наличии',
    'on-order' => 'Под заказ',
    'out' => 'Нет в наличии',
    'unknown' => 'Наличие уточняем',
];

page_head('Каталог');
show_flash('mat');
?>
<h1>Каталог — <?= count($list) ?> <?= plural_ru(count($list), 'позиция', 'позиции', 'позиций') ?></h1>
<p class="lead">Цены правятся прямо в таблице: измените сколько нужно и нажмите «Сохранить цены».
  Остальное — по кнопке «Открыть» в строке.</p>

<form method="get" class="card">
  <div class="row">
    <input type="text" name="q" value="<?= h($search) ?>" placeholder="Поиск: название, вид, ГОСТ" style="flex:1 1 16rem">
    <select name="cat" style="flex:0 1 14rem">
      <option value="">Все категории</option>
      <?php foreach ($categories as $c): ?>
        <option value="<?= h($c['id']) ?>" <?= $cat === $c['id'] ? 'selected' : '' ?>><?= h($c['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn ghost" type="submit">Показать</button>
    <?php if ($search !== '' || $cat !== ''): ?>
      <a class="btn ghost" href="materials.php">Сбросить</a>
    <?php endif; ?>
    <a class="btn" href="material.php">Добавить позицию</a>
  </div>
</form>

<form method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="prices">
  <input type="hidden" name="q" value="<?= h($search) ?>">
  <input type="hidden" name="cat" value="<?= h($cat) ?>">

  <table>
    <thead>
      <tr>
        <th>Позиция</th>
        <th class="hide-s">Категория</th>
        <th class="hide-s">Партия</th>
        <th style="width:9.5rem">Цена за тонну, ₽</th>
        <th class="hide-s">Наличие</th>
        <th style="width:6rem"></th>
      </tr>
    </thead>
    <tbody>
    <?php foreach ($list as $m): ?>
      <tr>
        <td data-l="Позиция">
          <strong><?= h($m['name']) ?></strong>
          <?php if ((int) $m['is_default'] === 1): ?>
            <span class="pill">в калькуляторе</span>
          <?php endif; ?>
          <div class="muted" style="font-size:13px"><?= h($m['kind']) ?></div>
        </td>
        <td data-l="Категория" class="hide-s muted"><?= h($catName[$m['category_id']] ?? '— нет такой —') ?></td>
        <td data-l="Партия" class="hide-s muted"><?= h(fraction_text($m)) ?></td>
        <td data-l="Цена за тонну, ₽">
          <input type="text" inputmode="decimal" class="num" name="price[<?= h($m['id']) ?>]"
                 value="<?= $m['price_per_ton'] === null ? '' : (int) $m['price_per_ton'] ?>"
                 placeholder="нет цены" aria-label="Цена за тонну, <?= h($m['name']) ?>">
        </td>
        <td data-l="Наличие" class="hide-s">
          <span class="pill <?= $m['availability'] === 'in-stock' ? 'on' : ($m['availability'] === 'out' ? 'no' : '') ?>">
            <?= h(AVAIL[$m['availability']] ?? $m['availability']) ?>
          </span>
        </td>
        <td data-l=""><a class="btn ghost" href="material.php?id=<?= h(urlencode($m['id'])) ?>">Открыть</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if ($list === []): ?>
      <tr><td colspan="6" class="muted">Ничего не нашлось. Попробуйте другой запрос или сбросьте фильтр.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>

  <div class="card" style="margin-top:16px">
    <div class="row">
      <button class="btn" type="submit">Сохранить цены</button>
      <span class="muted" style="font-size:14px">
        Пустое поле — цены нет, на сайте будет «уточняйте у менеджера».
        Ноль — это цена «0 ₽», а не отсутствие цены.
      </span>
    </div>
  </div>
</form>
<?php page_foot(); ?>
