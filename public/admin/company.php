<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/publishbar.php';
require_once __DIR__ . '/lib/validate.php';

require_login();

/**
 * КОНТАКТЫ И РЕКВИЗИТЫ.
 *
 * Поля хранятся ключ-значение и здесь же перечислены с подписями: список
 * закрытый, чужой ключ из формы не сохранится. Сайт читает ровно эти
 * тринадцать полей, и все они описаны в lib/data/types.ts.
 *
 * ЧЕГО ЗДЕСЬ НЕТ. Названия бренда, слогана, адреса сайта и строки про
 * самовывоз: это тексты и настройки, а не реквизиты. Год основания и число
 * отгруженных объектов — тоже: из них считаются витринные цифры, и меняются
 * они раз в жизни компании.
 *
 * ТЕЛЕФОН ХРАНИТСЯ ЦИФРАМИ. Показ на сайте собирается маской — той же, что
 * в поле ввода формы заявки. Две записи одного номера разошлись бы.
 */

/** Что можно править. Ключ — как в базе и в типах, дальше подпись и подсказка. */
const FIELDS = [
    'legalName' => ['Юридическое наименование', 'Как в выписке, вместе с формой: ООО «…».', 200],
    'phone' => ['Телефон', 'Только цифры и плюс: +79301607878. Показ соберётся маской сам.', 32],
    'address' => ['Адрес', 'Офис и площадка отгрузки — адрес один.', 300],
    'email' => ['Почта', 'На неё же уходят заявки с сайта. Меняете здесь — меняется и получатель писем.', 120],
    'hoursOffice' => ['Часы работы офиса', 'Пн–Пт 8:00–19:00, Сб 9:00–15:00', 120],
    'hoursShippingShort' => ['Часы отгрузки', 'Коротко, без слова «отгрузка»: круглосуточно.', 80],
    'inn' => ['ИНН', '', 20],
    'kpp' => ['КПП', '⚠️ Сейчас здесь заглушка — настоящего КПП не было.', 20],
    'ogrn' => ['ОГРН', '⚠️ Сейчас здесь заглушка — настоящего ОГРН не было.', 20],
    'bank' => ['Банк', '⚠️ Заглушка. На сайте банковские данные нигде не показываются.', 200],
    'account' => ['Расчётный счёт', '⚠️ Заглушка.', 34],
    'corr' => ['Корреспондентский счёт', '⚠️ Заглушка.', 34],
    'bik' => ['БИК', '⚠️ Заглушка.', 12],
];

$errors = [];
$values = [];
foreach (q('SELECT k, v FROM company') as $row) {
    $values[(string) $row['k']] = (string) $row['v'];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    $next = [];
    foreach (FIELDS as $key => [$label, , $limit]) {
        $next[$key] = clean($key, $limit);
    }

    if ($next['legalName'] === '') {
        $errors['legalName'] = 'Наименование нужно: оно стоит в реквизитах и в подвале сайта.';
    }
    /* Телефон проверяется по ЦИФРАМ, а не по виду: вставить его могут как
       угодно, а нужен он один. */
    if (preg_match_all('/\d/u', $next['phone']) < 11) {
        $errors['phone'] = 'В номере должно быть 11 цифр: +7 и десять.';
    }
    if ($next['address'] === '') {
        $errors['address'] = 'Адрес нужен: по нему работает ссылка на карту.';
    }
    if ($next['email'] !== '' && !filter_var($next['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Это не похоже на адрес почты.';
    }
    if ($next['email'] === '') {
        $errors['email'] = 'Без почты заявки с сайта будет некуда отправлять.';
    }
    foreach (['inn' => 'ИНН', 'kpp' => 'КПП', 'ogrn' => 'ОГРН', 'bik' => 'БИК'] as $key => $label) {
        if ($next[$key] !== '' && preg_match('/^\d+$/', $next[$key]) !== 1) {
            $errors[$key] = "{$label} состоит только из цифр.";
        }
    }

    if ($errors === []) {
        db()->beginTransaction();
        foreach ($next as $key => $value) {
            ex('INSERT INTO company (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [$key, $value]);
        }
        db()->commit();
        flash('co', 'Реквизиты сохранены. Чтобы правка попала на сайт, нажмите «Опубликовать».');
        header('Location: company.php');
        exit;
    }
    $values = array_merge($values, $next);
}

page_head('Контакты');
publish_bar();
show_flash('co');
?>
<h1>Контакты и реквизиты</h1>
<p class="lead">Телефон и почта показываются на сайте. Банковские данные хранятся здесь,
  но нигде не выводятся — они на случай документов.</p>

<?php if ($errors !== []): ?>
  <div class="msg err">Не сохранили: посмотрите поля, отмеченные красным.</div>
<?php endif; ?>

<form method="post" class="card">
  <?= csrf_field() ?>
  <div class="grid">
    <?php foreach (FIELDS as $key => [$label, $hint, $limit]): ?>
      <div>
        <label for="<?= h($key) ?>"><?= h($label) ?></label>
        <input id="<?= h($key) ?>" name="<?= h($key) ?>" type="text"
               value="<?= h((string) ($values[$key] ?? '')) ?>" maxlength="<?= (int) $limit ?>">
        <?php if ($hint !== ''): ?><p class="hint"><?= h($hint) ?></p><?php endif; ?>
        <?php if (isset($errors[$key])): ?><p class="err-text"><?= h($errors[$key]) ?></p><?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
  <div class="row" style="margin-top:20px">
    <button class="btn" type="submit">Сохранить реквизиты</button>
  </div>
</form>
<?php page_foot(); ?>
