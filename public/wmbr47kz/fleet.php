<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/publishbar.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * ЦИФРЫ БЛОКА «ПАРК И ОБЪЁМЫ».
 *
 * ЧАСТЬ ЧИСЕЛ СЧИТАЕТСЯ, А НЕ НАБИРАЕТСЯ, и править их нельзя — поле стоит
 * только для чтения. «Позиций в каталоге» и «лет на рынке» выводятся из
 * данных: набери их руками, и витрина начнёт врать при первой же правке
 * прайса, причём молча. Такие строки помечены и объясняют себя.
 *
 * В уточнении работают подстановки: {самосвалы} — разброс объёмов машин,
 * {категорий} — сколько категорий в каталоге, {год} — год основания,
 * {объектов} — сколько объектов отгружено. Текст вокруг них пишется руками.
 *
 * ГЛАВНОЕ ЧИСЛО РОВНО ОДНО: оно стоит слева отдельной панелью и крупнее
 * остальных. Отмеченное здесь снимается с прежнего.
 *
 * ЭТО НЕ ПАРК РАСЧЁТА. Машины, по которым калькулятор подбирает рейсы,
 * лежат в коде (lib/pricing.ts) и сюда не приходят: там четыре ТИПА машин, а
 * здесь 24 — физические единицы техники. Величины разные.
 */

const COMPUTED_LABEL = [
    '' => 'набирается руками',
    'positions' => 'считается: сколько позиций в каталоге',
    'years' => 'считается: лет с года основания',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();

    if (isset($_POST['delete_id'])) {
        ex('DELETE FROM fleet_numbers WHERE id = ?', [(int) $_POST['delete_id']]);
        flash('fl', 'Цифра удалена.');
        header('Location: fleet.php');
        exit;
    }
    if (($_POST['action'] ?? '') === 'add') {
        $sort = (int) (q1('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM fleet_numbers')['n'] ?? 0);
        ex('INSERT INTO fleet_numbers (value, unit, label, note, sort) VALUES (0, "", "Новая цифра", "", ?)', [$sort]);
        flash('fl', 'Цифра добавлена — заполните и сохраните.');
        header('Location: fleet.php');
        exit;
    }

    $rows = $_POST['fn'] ?? [];
    $lead = (int) ($_POST['lead'] ?? 0);
    $saved = 0;
    $bad = [];
    if (is_array($rows)) {
        db()->beginTransaction();
        foreach ($rows as $id => $row) {
            $id = (int) $id;
            $cur = q1('SELECT computed FROM fleet_numbers WHERE id = ?', [$id]);
            if ($cur === null) {
                continue;
            }
            $label = mb_substr(trim((string) ($row['label'] ?? '')), 0, 120);
            $unit = mb_substr(trim((string) ($row['unit'] ?? '')), 0, 20);
            $note = mb_substr(trim((string) ($row['note'] ?? '')), 0, 300);
            $sort = (int) ($row['sort'] ?? 0);
            if ($label === '') {
                $bad[] = 'строка без подписи';
                continue;
            }
            /* Вычисляемое число из формы НЕ ПРИНИМАЕТСЯ ВОВСЕ: поле стоит
               только для чтения, и подмена его запросом мимо формы ничего не
               меняет. Прежнее значение остаётся запасным. */
            if ((string) $cur['computed'] === '') {
                $raw = trim((string) ($row['value'] ?? ''));
                $bare = str_replace([' ', "\u{00A0}"], '', $raw);
                if ($bare === '' || preg_match('/^\d+$/', $bare) !== 1) {
                    $bad[] = $label . ': число должно быть целым';
                    continue;
                }
                ex('UPDATE fleet_numbers SET value=?, unit=?, label=?, note=?, sort=? WHERE id=?',
                    [(int) $bare, $unit, $label, $note, $sort, $id]);
            } else {
                ex('UPDATE fleet_numbers SET unit=?, label=?, note=?, sort=? WHERE id=?',
                    [$unit, $label, $note, $sort, $id]);
            }
            $saved++;
        }
        /* ГЛАВНОЕ ЧИСЛО РОВНО ОДНО, и снимается оно только тогда, когда
           выбрано новое. Снимать со всех безусловно нельзя: форма, отправленная
           без выбранного переключателя, оставила бы блок вообще без главного
           числа — сайт это переживёт (возьмёт первое), но заказчик увидел бы
           не то, что выбирал, и не понял бы почему. */
        if ($lead > 0 && q1('SELECT id FROM fleet_numbers WHERE id = ?', [$lead]) !== null) {
            ex('UPDATE fleet_numbers SET is_lead = 0');
            ex('UPDATE fleet_numbers SET is_lead = 1 WHERE id = ?', [$lead]);
        }
        db()->commit();
    }
    flash('fl', $bad !== []
        ? 'Не сохранены: ' . implode('; ', $bad) . '. Остальное сохранено.'
        : "Сохранено цифр: {$saved}. Чтобы правка попала на сайт, нажмите «Опубликовать».",
        $bad !== [] ? 'err' : 'ok');
    header('Location: fleet.php');
    exit;
}

$list = q('SELECT * FROM fleet_numbers ORDER BY sort, id');

page_head('Парк');
publish_bar();
show_flash('fl');
?>
<h1>Цифры блока «Парк и объёмы»</h1>
<p class="lead">Крупные числа на тёмной секции лендинга. Одно из них — главное:
  стоит слева и крупнее остальных.</p>

<div class="msg info">Подстановки в уточнении: <code>{самосвалы}</code> — разброс объёмов машин,
  <code>{категорий}</code> — сколько категорий, <code>{год}</code> — год основания,
  <code>{объектов}</code> — сколько объектов отгружено. Они подставляются при сборке,
  так что цифра не разойдётся с каталогом.</div>

<form method="post">
  <?= csrf_field() ?>
  <?php foreach ($list as $f): ?>
    <?php $isComputed = (string) $f['computed'] !== ''; ?>
    <div class="card">
      <div class="grid">
        <div>
          <label class="req">Число</label>
          <input type="text" inputmode="numeric" name="fn[<?= (int) $f['id'] ?>][value]"
                 value="<?= (int) $f['value'] ?>" <?= $isComputed ? 'readonly style="background:#f0f0ee"' : '' ?>>
          <p class="hint"><?= h(COMPUTED_LABEL[(string) $f['computed']] ?? '') ?><?php
            if ($isComputed): ?> — правится не здесь, а данными<?php endif; ?></p>
        </div>
        <div>
          <label>Единица</label>
          <input type="text" name="fn[<?= (int) $f['id'] ?>][unit]" value="<?= h($f['unit']) ?>" placeholder="нет">
        </div>
        <div>
          <label class="req">Подпись</label>
          <input type="text" name="fn[<?= (int) $f['id'] ?>][label]" value="<?= h($f['label']) ?>">
        </div>
        <div>
          <label>Порядок</label>
          <input type="text" inputmode="numeric" name="fn[<?= (int) $f['id'] ?>][sort]" value="<?= (int) $f['sort'] ?>">
        </div>
      </div>
      <div style="margin-top:12px">
        <label>Уточнение</label>
        <input type="text" name="fn[<?= (int) $f['id'] ?>][note]" value="<?= h($f['note']) ?>">
      </div>
      <div class="row" style="margin-top:12px">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer;margin:0">
          <input type="radio" name="lead" value="<?= (int) $f['id'] ?>" style="width:auto"
                 <?= ((int) $f['is_lead']) === 1 ? 'checked' : '' ?>>
          <span>главное число блока</span>
        </label>
        <button class="btn danger" type="submit" name="delete_id" value="<?= (int) $f['id'] ?>"
                onclick="return confirm('Удалить цифру «<?= h($f['label']) ?>»?')" style="margin-left:auto">Удалить</button>
      </div>
    </div>
  <?php endforeach; ?>

  <div class="card">
    <div class="row">
      <button class="btn" type="submit">Сохранить цифры</button>
      <button class="btn ghost" type="submit" name="action" value="add">Добавить цифру</button>
    </div>
  </div>
</form>
<?php page_foot(); ?>
