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
 *
 * 5. АДРЕС НОВОЙ ПОЗИЦИИ ВЫДАЁТ СЕРВЕР, человек его не пишет. До 13.10 он
 *    брался из поля `id`, которого в форме не было никогда, — и ни одна новая
 *    позиция не сохранялась: баннер «посмотрите поля, отмеченные красным» при
 *    ни одном красном поле. Адрес выводится из названия, разновидности и
 *    размера (`slug_ru()`), занятый получает хвост -2, -3.
 *
 * 6. У МЕТАЛЛОПРОКАТА ФРАКЦИИ НЕТ — у категории, которая считается тоннами.
 *    Сохранённая с «фракцией в миллиметрах», позиция проката попала бы на
 *    сайте в фильтр фракций рядом с песком и в строку «фракция …» на плашке
 *    категории. Размер проката — обозначение партии: «⌀ 10 мм», «1,8–2,2 мм».
 *
 * 7. У ВСЕГО, ЧТО СЧИТАЕТСЯ КУБАМИ, ПЛОТНОСТЬ ОБЯЗАТЕЛЬНА. Без неё сайт
 *    показывает цену за м³ как «0 ₽», а калькулятор пишет «не число» в
 *    тоннах и рейсах. Пока новые позиции не сохранялись, дыры не было видно:
 *    у всех 25 существующих плотность стоит. Сборка (cms-apply) проверяет то же.
 *
 * 8. ОДНА ФОРМА — ОДНА НОВАЯ ПОЗИЦИЯ. Адрес выдаётся сервером и при
 *    совпадении получает хвост -2, поэтому двойное нажатие «Сохранить»
 *    создавало бы две одинаковые позиции. У формы новой позиции одноразовый
 *    ключ: повторная отправка той же формы ведёт в каталог, копии нет.
 */

/** Адрес для новой позиции: из названия и размера, свободный. */
function new_material_id(array $f, float|null|false $from, float|null|false $to, float|null|false $percent): string
{
    $size = match ($f['fraction_kind']) {
        'mm', 'mkr' => dec_label((float) $from) . ' ' . dec_label((float) $to),
        'gravel' => dec_label((float) $percent),
        default => (string) $f['fraction_label'],
    };
    /* Разновидность обычно повторяет слово из названия («Щебень гранитный»
       + «гранитный») — в адрес второй раз она не идёт. */
    $kind = mb_stripos($f['name'], $f['kind']) === false ? ' ' . $f['kind'] : '';
    $base = slug_ru($f['name'] . $kind . ' ' . $size);
    if ($base === '') {
        $base = 'pozitsiya';
    }
    $id = $base;
    for ($n = 2; q1('SELECT id FROM materials WHERE id = ?', [$id]) !== null; $n++) {
        $id = $base . '-' . $n;
    }
    return $id;
}

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

$_SESSION['mat_once'] ??= [];
$_SESSION['mat_done'] ??= [];
$once = (string) ($_POST['once'] ?? '');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();

    /* Та же форма пришла второй раз — двойное нажатие или «назад» после
       успеха. Позиция уже есть: ведём в каталог, копию не создаём. */
    if ($isNew && isset($_SESSION['mat_done'][$once])) {
        flash('mat', 'Позиция уже добавлена — повторное нажатие копию не создало.', 'info');
        header('Location: materials.php');
        exit;
    }

    if ($isNew && !isset($_SESSION['mat_once'][$once])) {
        $errors['once'] = 'Форма устарела — проверьте данные и нажмите «Сохранить» ещё раз.';
    }

    $f = [
        /* У новой позиции адреса ещё нет: он выдаётся при записи, ниже. */
        'id' => $id,
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
        'fraction_label' => nbsp_units(clean('fraction_label', 120)),
    ];
    $unit = $f['category_id'] === ''
        ? null
        : (q1('SELECT unit FROM categories WHERE id = ?', [$f['category_id']])['unit'] ?? null);

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
    } elseif ($density === null && $unit === 'm3') {
        $errors['density'] = 'Нужна насыпная плотность: позиция считается кубами, и по плотности сайт '
            . 'считает цену за м³ и рейсы. Например 1,5.';
    }

    $from = num_or_null('fraction_from');
    $to = num_or_null('fraction_to');
    $percent = num_or_null('fraction_percent');

    if ($unit === 't' && $f['fraction_kind'] !== 'none') {
        /* Металлопрокат с фракцией. Если человек вписал размер в границы
           фракции — переносим его в обозначение партии сами и просим
           подтвердить: молча сохранить нельзя, это его данные. */
        if ($f['fraction_kind'] === 'mm' && is_float($from) && is_float($to) && $from < $to
            && $f['fraction_label'] === '') {
            $f['fraction_label'] = dec_label($from) . '–' . dec_label($to) . "\u{00A0}мм";
            $errors['fraction'] = 'У металлопроката фракции нет — «Чем нормируется» переключили на '
                . '«Фракции нет», а размер перенесли в «Обозначение партии»: «' . $f['fraction_label']
                . '». Проверьте и нажмите «Сохранить» ещё раз.';
        } elseif ($f['fraction_label'] !== '') {
            $errors['fraction'] = 'У металлопроката фракции нет — «Чем нормируется» переключили на '
                . '«Фракции нет»; размер берётся из «Обозначения партии»: «' . $f['fraction_label']
                . '». Проверьте и нажмите «Сохранить» ещё раз.';
        } else {
            $errors['fraction'] = 'У металлопроката фракции нет — «Чем нормируется» переключили на '
                . '«Фракции нет». Впишите размер в «Обозначение партии» — «⌀ 10 мм», «40×20×2 мм» — '
                . 'и нажмите «Сохранить» ещё раз.';
        }
        $f['fraction_kind'] = 'none';
    } elseif ($f['fraction_kind'] === 'mm' || $f['fraction_kind'] === 'mkr') {
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
            $f['id'] = new_material_id($f, $from, $to, $percent);
            /* МЕСТО — СРАЗУ ЗА СВОЕЙ КАТЕГОРИЕЙ, а не в конце всего каталога:
               каталог на сайте идёт одним списком в этом порядке, и новый
               песок с общим «последний + 1» встал бы после всего металла, а
               поля порядка у позиции в админке нет. */
            $last = q1('SELECT MAX(sort) AS s FROM materials WHERE category_id = ?', [$f['category_id']])['s'] ?? null;
            if ($last === null) {
                $sort = (int) (q1('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM materials')['n'] ?? 0);
            } else {
                ex('UPDATE materials SET sort = sort + 1 WHERE sort > ?', [(int) $last]);
                $sort = (int) $last + 1;
            }
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
        if ($isNew) {
            unset($_SESSION['mat_once'][$once]);
            $_SESSION['mat_done'][$once] = $f['id'];
            $_SESSION['mat_done'] = array_slice($_SESSION['mat_done'], -20, null, true);
        }

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

if ($isNew) {
    $once = bin2hex(random_bytes(16));
    $_SESSION['mat_once'][$once] = time();
    $_SESSION['mat_once'] = array_slice($_SESSION['mat_once'], -20, null, true);
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
  <?php /* ВСЕ ОШИБКИ ВИДНЫ ЗДЕСЬ СПИСКОМ, а не только под своими полями.
           Ошибка без поля в форме иначе не видна нигде: так до 13.10 висела
           ошибка про адрес позиции, и человек видел «посмотрите поля,
           отмеченные красным» при ни одном красном поле. */ ?>
  <div class="msg err">Не сохранили — поправьте и нажмите «Сохранить» ещё раз:
    <ul style="margin:6px 0 0;padding-left:20px">
      <?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?>
    </ul>
  </div>
<?php endif; ?>

<form method="post" class="card">
  <?= csrf_field() ?>
  <?php if ($isNew): ?><input type="hidden" name="once" value="<?= h($once) ?>"><?php endif; ?>

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
      <p class="hint">Только когда фракции нет: «просеянный», «⌀ 10 мм», «№ 14».
        У металлопроката это его размер.</p>
    </div>
  </div>

  <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">

  <div class="grid">
    <div>
      <label for="price_per_ton">Цена за тонну, ₽</label>
      <input id="price_per_ton" name="price_per_ton" type="text" inputmode="decimal"
             value="<?= ($m['price_per_ton'] ?? null) === null ? '' : $v('price_per_ton') ?>" placeholder="нет цены">
      <p class="hint">Пусто — цены нет, на сайте будет «уточняйте у менеджера».
        Ноль — это цена «0 ₽», а не отсутствие цены.</p>
      <?= $err('price_per_ton') ?>
    </div>
    <div>
      <label for="density">Насыпная плотность, т/м³</label>
      <input id="density" name="density" type="text" inputmode="decimal"
             value="<?= ($m['density'] ?? null) === null ? '' : $v('density') ?>" placeholder="нет">
      <p class="hint">Обязательна у всего, что считается кубами: по ней сайт считает
        цену за куб и загрузку машины. У металлопроката её нет — оставьте пустым.</p>
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
