<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/publishbar.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * КАТЕГОРИИ: НАЗВАНИЕ, ОПИСАНИЕ, ПОРЯДОК.
 *
 * Их шесть, и правятся они редко — поэтому все на одной странице, одной
 * формой, без карточек. Порядок задаётся числом: по нему категории идут и
 * на лендинге, и в фильтре каталога.
 *
 * ХАРАКТЕРИСТИК КАТЕГОРИИ ЗДЕСЬ НЕТ, и это не забывчивость. Фракция, марка
 * прочности и модуль крупности считаются из позиций категории — написанные
 * руками, они однажды разошлись с каталогом: щебню приписывалась фракция,
 * которой у него нет ни в одной позиции. Править их негде, потому что они не
 * хранятся.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    $rows = $_POST['cat'] ?? [];
    $saved = 0;
    if (is_array($rows)) {
        foreach ($rows as $id => $row) {
            $id = (string) $id;
            if (q1('SELECT id FROM categories WHERE id = ?', [$id]) === null) {
                continue;
            }
            $name = mb_substr(trim(preg_replace('/\s+/u', ' ', (string) ($row['name'] ?? '')) ?? ''), 0, 120);
            $summary = mb_substr(trim((string) ($row['summary'] ?? '')), 0, 1000);
            $label = mb_substr(trim((string) ($row['group_label'] ?? '')), 0, 120);
            $sort = (int) ($row['sort'] ?? 0);
            if ($name === '') {
                continue;
            }
            ex('UPDATE categories SET name = ?, summary = ?, group_label = ?, sort = ? WHERE id = ?',
                [$name, $summary, $label !== '' ? $label : null, $sort, $id]);
            $saved++;
        }
    }
    flash('cat', $saved > 0
        ? "Сохранено категорий: {$saved}. Чтобы правка попала на сайт, нажмите «Опубликовать»."
        : 'Ничего не сохранилось — проверьте, что названия заполнены.', $saved > 0 ? 'ok' : 'err');
    header('Location: categories.php');
    exit;
}

$list = q('SELECT c.*, (SELECT COUNT(*) FROM materials m WHERE m.category_id = c.id) AS n
           FROM categories c ORDER BY c.sort, c.id');

page_head('Категории');
publish_bar();
show_flash('cat');
?>
<h1>Категории</h1>
<p class="lead">Порядок задаётся числом: чем меньше, тем выше категория на сайте.</p>

<form method="post">
  <?= csrf_field() ?>
  <?php foreach ($list as $c): ?>
    <div class="card">
      <div class="grid">
        <div>
          <label class="req">Название</label>
          <input type="text" name="cat[<?= h($c['id']) ?>][name]" value="<?= h($c['name']) ?>">
          <p class="hint">Адрес: <code><?= h($c['id']) ?></code> · позиций: <?= (int) $c['n'] ?>
            · считается в <?= $c['unit'] === 't' ? 'тоннах' : 'кубометрах' ?></p>
        </div>
        <div>
          <label>Порядок</label>
          <input type="text" inputmode="numeric" name="cat[<?= h($c['id']) ?>][sort]" value="<?= (int) $c['sort'] ?>">
        </div>
        <div>
          <label>Подпись фильтра по видам</label>
          <input type="text" name="cat[<?= h($c['id']) ?>][group_label]" value="<?= h((string) ($c['group_label'] ?? '')) ?>" placeholder="нет">
          <p class="hint">Только там, где внутри категории есть виды: «Вид проката».</p>
        </div>
      </div>
      <div style="margin-top:12px">
        <label>Описание для лендинга</label>
        <textarea name="cat[<?= h($c['id']) ?>][summary]" rows="2"><?= h($c['summary']) ?></textarea>
        <p class="hint">Два-три предложения под названием категории. Фракции и марки сюда
          писать не надо — сайт считает их из позиций сам.</p>
      </div>
    </div>
  <?php endforeach; ?>
  <div class="card"><button class="btn" type="submit">Сохранить категории</button></div>
</form>
<?php page_foot(); ?>
