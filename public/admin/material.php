<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * ПРАВКА ОДНОЙ ПОЗИЦИИ.
 *
 * ЧТО ЗДЕСЬ ВАЖНО ПОНЯТЬ.
 *
 * 1. У металла нет ни фракции, ни плотности, и форма их НЕ ТРЕБУЕТ. Вид
 *    зернового состава «нет фракции» это не пропущенное поле, а честный
 *    ответ: прокат по размеру зерна не сортируют. Плотность у него тоже не
 *    спрашивается — кубами прокат не возят.
 *
 * 2. Подпись фракции не набирается: «5–20 мм» выводится из чисел тем же
 *    хелпером, что и на сайте. Руками пишется только обозначение партии у
 *    вида «нет фракции» — «⌀ 10 мм», «просеянный».
 *
 * 3. Пустая цена и ноль — разные вещи, и форма их различает.
 *
 * 4. Признак «открывать в калькуляторе» ровно один на весь каталог:
 *    поставленный здесь снимается со всех остальных в той же транзакции.
 */

$id = (string) ($_GET['id'] ?? '');
$isNew = $id === '';
$m = $isNew ? null : q1('SELECT * FROM materials WHERE id = ?', [$id]);
if (!$isNew && $m === null) {
    flash('mat', 'Такой позиции нет — возможно, её удалили.', 'err');
    header('Location: materials.php');
    exit;
}

$categories = q('SELECT id, name FROM categories ORDER BY sort, id');
$groups = q('SELECT id, category_id, name FROM material_groups ORDER BY sort, id');
$errors = [];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();

    $f = [
        'id' => $isNew ? clean_id('id') : $id,
        'category_id' => clean('category_id', 64),
        'name' => clean('name', 200),
        'group_id' => clean('group_id', 64),
        'kind' => clean('kind', 120),
        'fraction_kind' => one_of('fraction_kind', ['mm', 'mkr', 'gravel', 'none'], 'mm'),
        'gost' => clean('gost', 120),
        'strength' => clean('strength', 40),
        'frost' => clean('frost', 40),
        'availability' => one_of('availability', ['in-stock', 'on-order', 'out', 'unknown'], 'in-stock'),
        'uses' => clean_multi('uses', 2000),
        'note' => clean_multi('note', 2000),
        'fraction_label' => clean('fraction_label', 120),
    ];

    if ($f['id'] === '') {
        $errors['id'] = 'Нужен короткий адрес позиции: латиница, цифры и дефис. Например granit-5-20.';
    } elseif ($isNew && q1('SELECT id FROM materials WHERE id = ?', [$f['id']]) !== null) {
        $errors['id'] = 'Такой адрес уже занят другой позицией.';
    }
    if (mb_strlen($f['name']) < 2) {
        $errors['name'] = 'Как называется позиция?';
    }
    if ($f['category_id'] === '' || q1('SELECT id FROM categories WHERE id = ?', [$f['category_id']]) === null) {
        $errors['category_id'] = 'Выберите категорию из списка.';
    }
    if ($f['kind'] === '') {
        $errors['kind'] = 'Разновидность нужна: гранитный, мытый, рифлёная. Она показывается в карточке.';
    }
    if ($f['group_id'] !== '' && q1('SELECT id FROM material_groups WHERE id = ? AND category_id = ?',
            [$f['group_id'], $f['category_id']]) === null) {
        $errors['group_id'] = 'Такой группы у выбранной категории нет.';
    }

    /* Числа. Три исхода: пусто, число, мусор — и на каждый свой ответ. */
    $price = num_or_null('price_per_ton');
    if ($price === false) {
        $errors['price_per_ton'] = 'Цена — число, например 3000. Оставьте поле пустым, если цены нет.';
    } elseif ($price !== null && $price < 0) {
        $errors['price_per_ton'] = 'Цена не может быть отрицательной.';
    }
    $density = num_or_null('density');
    if ($density === false) {
        $errors['density'] = 'Плотность — число, например 1,37. Пусто — если позиция кубами не считается.';
    } elseif ($density !== null && ($density <= 0 || $density > 10)) {
        $errors['density'] = 'Насыпная плотность бывает от 0 до 10 т/м³.';
    }

    $from = num_or_null('fraction_from');
    $to = num_or_null('fraction_to');
    $percent = num_or_null('fraction_percent');
    if ($f['fraction_kind'] === 'mm' || $f['fraction_kind'] === 'mkr') {
        if ($from === false || $to === false || $from === null || $to === null) {
            $errors['fraction'] = 'Для этого вида нужны обе границы числами.';
        } elseif ($from < 0 || $to <= $from) {
            $errors['fraction'] = 'Верхняя граница должна быть больше нижней.';
        }
    } elseif ($f['fraction_kind'] === 'gravel') {
        if ($percent === false || $percent === null || $percent < 0 || $percent > 100) {
            $errors['fraction'] = 'Доля гравия — число от 0 до 100.';
        }
    } else {
        if ($f['fraction_label'] === '') {
            $errors['fraction'] = 'Напишите обозначение партии: «просеянный», «⌀ 10 мм», «№ 14».';
        }
    }

    if ($errors === []) {
        $args = [
            $f['category_id'], $f['name'],
            $f['group_id'] !== '' ? $f['group_id'] : null,
            $f['kind'], $f['fraction_kind'],
            in_array($f['fraction_kind'], ['mm', 'mkr'], true) ? $from : null,
            in_array($f['fraction_kind'], ['mm', 'mkr'], true) ? $to : null,
            $f['fraction_kind'] === 'gravel' ? $percent : null,
            $f['fraction_kind'] === 'none' ? $f['fraction_label'] : null,
            $f['gost'] !== '' ? $f['gost'] : null,
            $f['strength'] !== '' ? $f['strength'] : null,
            $f['frost'] !== '' ? $f['frost'] : null,
            $density,
            $price === null ? null : (int) round($price),
            $f['availability'], $f['uses'],
            $f['note'] !== '' ? $f['note'] : null,
        ];

        db()->beginTransaction();
        if ($isNew) {
            $sort = (int) (q1('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM materials')['n'] ?? 0);
            ex('INSERT INTO materials (category_id, name, group_id, kind, fraction_kind, fraction_from,
                fraction_to, fraction_percent, fraction_label, gost, strength, frost, density,
                price_per_ton, availability, uses, note, id, sort)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [...$args, $f['id'], $sort]);
        } else {
            ex('UPDATE materials SET category_id=?, name=?, group_id=?, kind=?, fraction_kind=?,
                fraction_from=?, fraction_to=?, fraction_percent=?, fraction_label=?, gost=?,
                strength=?, frost=?, density=?, price_per_ton=?, availability=?, uses=?, note=?
                WHERE id=?', [...$args, $f['id']]);
        }
        /* ПРИЗНАК «ОТКРЫВАТЬ В КАЛЬКУЛЯТОРЕ» РОВНО ОДИН. Снимается со всех и
           ставится этой — иначе на сайте выиграла бы та, что раньше в
           сортировке, то есть выбор молча зависел бы от порядка записей. */
        if (checkbox('is_default')) {
            ex('UPDATE materials SET is_default = 0');
            ex('UPDATE materials SET is_default = 1 WHERE id = ?', [$f['id']]);
        }
        db()->commit();

        flash('mat', ($isNew ? 'Позиция добавлена' : 'Позиция сохранена')
            . '. Чтобы правка попала на сайт, нажмите «Опубликовать».');
        header('Location: materials.php');
        exit;
    }
    /* Ошибка — показываем форму с тем, что человек набрал, а не с прежним. */
    $m = array_merge($m ?? [], $f, [
        'price_per_ton' => (string) ($_POST['price_per_ton'] ?? ''),
        'density' => (string) ($_POST['density'] ?? ''),
        'fraction_from' => (string) ($_POST['fraction_from'] ?? ''),
        'fraction_to' => (string) ($_POST['fraction_to'] ?? ''),
        'fraction_percent' => (string) ($_POST['fraction_percent'] ?? ''),
        'is_default' => checkbox('is_default') ? 1 : 0,
    ]);
}

$v = static fn(string $k, string $default = ''): string => h((string) ($m[$k] ?? $default));
$err = static function (string $k) use ($errors): string {
    return isset($errors[$k]) ? '<p class="err-text">' . h($errors[$k]) . '</p>' : '';
};

page_head($isNew ? 'Новая позиция' : 'Позиция');
?>
<h1><?= $isNew ? 'Новая позиция' : h((string) ($m['name'] ?? '')) ?></h1>
<p class="lead"><a href="materials.php">← ко всему каталогу</a></p>

<?php if ($errors !== []): ?>
  <div class="msg err">Не сохранили: посмотрите поля, отмеченные красным.</div>
<?php endif; ?>

<form method="post" class="card">
  <?= csrf_field() ?>

  <div class="grid">
    <div>
      <label class="req" for="name">Название</label>
      <input id="name" name="name" type="text" value="<?= $v('name') ?>">
      <p class="hint">Как в накладной: «Щебень гранитный».</p>
      <?= $err('name') ?>
    </div>
    <div>
      <label class="req" for="kind">Разновидность</label>
      <input id="kind" name="kind" type="text" value="<?= $v('kind') ?>">
      <p class="hint">Одно слово: гранитный, мытый, рифлёная.</p>
      <?= $err('kind') ?>
    </div>
    <div>
      <label class="req" for="category_id">Категория</label>
      <select id="category_id" name="category_id">
        <?php foreach ($categories as $c): ?>
          <option value="<?= h($c['id']) ?>" <?= ($m['category_id'] ?? '') === $c['id'] ? 'selected' : '' ?>><?= h($c['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <?= $err('category_id') ?>
    </div>
    <div>
      <label for="group_id">Вид проката</label>
      <select id="group_id" name="group_id">
        <option value="">— нет —</option>
        <?php foreach ($groups as $g): ?>
          <option value="<?= h($g['id']) ?>" <?= ($m['group_id'] ?? '') === $g['id'] ? 'selected' : '' ?>><?= h($g['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <p class="hint">Только у металлопроката. У инертных делить внутри категории нечего.</p>
      <?= $err('group_id') ?>
    </div>
  </div>

  <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">

  <h2 style="font-size:16px;margin:0 0 4px">Зерновой состав</h2>
  <p class="hint" style="margin-bottom:12px">Подпись в карточке («5–20 мм») сайт выводит из этих чисел
    сам — писать её отдельно не нужно и нельзя: две записи одного факта разошлись бы.</p>
  <div class="grid">
    <div>
      <label class="req" for="fraction_kind">Чем нормируется</label>
      <select id="fraction_kind" name="fraction_kind">
        <option value="mm" <?= ($m['fraction_kind'] ?? 'mm') === 'mm' ? 'selected' : '' ?>>Фракция в миллиметрах — щебень, отсев, ПГС</option>
        <option value="mkr" <?= ($m['fraction_kind'] ?? '') === 'mkr' ? 'selected' : '' ?>>Модуль крупности — песок</option>
        <option value="gravel" <?= ($m['fraction_kind'] ?? '') === 'gravel' ? 'selected' : '' ?>>Доля гравия — обогащённая ПГС</option>
        <option value="none" <?= ($m['fraction_kind'] ?? '') === 'none' ? 'selected' : '' ?>>Фракции нет — грунты и металлопрокат</option>
      </select>
      <?= $err('fraction') ?>
    </div>
    <div>
      <label for="fraction_from">Нижняя граница</label>
      <input id="fraction_from" name="fraction_from" type="text" inputmode="decimal" value="<?= $v('fraction_from') ?>">
    </div>
    <div>
      <label for="fraction_to">Верхняя граница</label>
      <input id="fraction_to" name="fraction_to" type="text" inputmode="decimal" value="<?= $v('fraction_to') ?>">
    </div>
    <div>
      <label for="fraction_percent">Доля гравия, %</label>
      <input id="fraction_percent" name="fraction_percent" type="text" inputmode="decimal" value="<?= $v('fraction_percent') ?>">
    </div>
    <div>
      <label for="fraction_label">Обозначение партии</label>
      <input id="fraction_label" name="fraction_label" type="text" value="<?= $v('fraction_label') ?>">
      <p class="hint">Только когда фракции нет: «просеянный», «⌀ 10 мм», «№ 14».</p>
    </div>
  </div>

  <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">

  <div class="grid">
    <div>
      <label for="price_per_ton">Цена за тонну, ₽</label>
      <input id="price_per_ton" name="price_per_ton" type="text" inputmode="decimal"
             value="<?= $m['price_per_ton'] === null ? '' : $v('price_per_ton') ?>" placeholder="нет цены">
      <p class="hint">Пусто — цены нет, на сайте будет «уточняйте у менеджера».
        Ноль — это цена «0 ₽», а не отсутствие цены.</p>
      <?= $err('price_per_ton') ?>
    </div>
    <div>
      <label for="density">Насыпная плотность, т/м³</label>
      <input id="density" name="density" type="text" inputmode="decimal"
             value="<?= $m['density'] === null ? '' : $v('density') ?>" placeholder="нет">
      <p class="hint">По ней считается цена за куб и загрузка машины.
        У металлопроката её нет — оставьте пустым.</p>
      <?= $err('density') ?>
    </div>
    <div>
      <label for="availability">Наличие</label>
      <select id="availability" name="availability">
        <option value="in-stock" <?= ($m['availability'] ?? 'in-stock') === 'in-stock' ? 'selected' : '' ?>>В наличии</option>
        <option value="on-order" <?= ($m['availability'] ?? '') === 'on-order' ? 'selected' : '' ?>>Под заказ</option>
        <option value="out" <?= ($m['availability'] ?? '') === 'out' ? 'selected' : '' ?>>Нет в наличии</option>
        <option value="unknown" <?= ($m['availability'] ?? '') === 'unknown' ? 'selected' : '' ?>>Наличие уточняем</option>
      </select>
    </div>
    <div>
      <label for="gost">ГОСТ или ТУ</label>
      <input id="gost" name="gost" type="text" value="<?= $v('gost') ?>" placeholder="нет">
      <p class="hint">У металлопроката в прайсе его нет — оставьте пустым.</p>
    </div>
    <div>
      <label for="strength">Марка прочности</label>
      <input id="strength" name="strength" type="text" value="<?= $v('strength') ?>" placeholder="нет">
      <p class="hint">Например М1200. Из марок всех позиций сайт считает разброс по категории.</p>
    </div>
    <div>
      <label for="frost">Морозостойкость</label>
      <input id="frost" name="frost" type="text" value="<?= $v('frost') ?>" placeholder="нет">
    </div>
  </div>

  <div style="margin-top:16px">
    <label for="uses">Где применяется</label>
    <textarea id="uses" name="uses" rows="3"><?= $v('uses') ?></textarea>
    <p class="hint">По одному применению в строке. Показывается в карточке каталога.</p>
  </div>

  <div style="margin-top:14px">
    <label for="note">Примечание</label>
    <textarea id="note" name="note" rows="2"><?= $v('note') ?></textarea>
    <p class="hint">Одна фраза под характеристиками. Необязательно.</p>
  </div>

  <div style="margin-top:16px">
    <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer">
      <input type="checkbox" name="is_default" value="1" style="width:auto;margin-top:3px"
             <?= ((int) ($m['is_default'] ?? 0)) === 1 ? 'checked' : '' ?>>
      <span>Открывать эту позицию в калькуляторе на сайте
        <span class="hint" style="display:block">Такая позиция ровно одна: поставите здесь — снимется у прежней.</span></span>
    </label>
  </div>

  <div class="row" style="margin-top:20px">
    <button class="btn" type="submit">Сохранить</button>
    <a class="btn ghost" href="materials.php">Отмена</a>
  </div>
</form>

<?php if (!$isNew): ?>
<form method="post" action="materials.php" class="card"
      onsubmit="return confirm('Удалить позицию? Она исчезнет с сайта после следующей публикации.')">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="delete">
  <input type="hidden" name="id" value="<?= h((string) $m['id']) ?>">
  <div class="row">
    <button class="btn danger" type="submit">Удалить позицию</button>
    <span class="muted" style="font-size:14px">Счётчики на сайте пересчитаются сами.</span>
  </div>
</form>
<?php endif; ?>
<?php page_foot(); ?>
