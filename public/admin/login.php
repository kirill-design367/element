<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';

require_https();
send_headers();
start_session();

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = null;
/* Задержка после неудачных попыток считается ДО разбора формы: иначе
   перебор шёл бы на полной скорости, а задержка только показывалась. */
$wait = lock_seconds();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    if ($wait > 0) {
        $error = "Слишком много попыток. Подождите {$wait} с и попробуйте снова.";
    } elseif (login_ok((string) ($_POST['login'] ?? ''), (string) ($_POST['password'] ?? ''))) {
        clear_failures();
        do_login();
        header('Location: index.php');
        exit;
    } else {
        note_failure();
        $wait = lock_seconds();
        /* Не «неверный пароль» и не «нет такого пользователя»: разные
           формулировки подсказывают, что именно угадано. */
        $error = 'Логин или пароль не подходят.';
        if ($wait > 0) {
            $error .= " Следующая попытка через {$wait} с.";
        }
    }
}

page_head('Вход', false);
?>
<h1>Вход в админку</h1>
<p class="lead">Данные сайта «Строительный Дом Элемент».</p>

<?php if ($error !== null): ?>
  <div class="msg err"><?= h($error) ?></div>
<?php endif; ?>

<form method="post" class="card" style="max-width:26rem">
  <?= csrf_field() ?>
  <div style="margin-bottom:14px">
    <label class="req" for="login">Логин</label>
    <input id="login" name="login" type="text" autocomplete="username" autofocus
           value="<?= h((string) ($_POST['login'] ?? '')) ?>">
  </div>
  <div style="margin-bottom:18px">
    <label class="req" for="password">Пароль</label>
    <input id="password" name="password" type="password" autocomplete="current-password">
  </div>
  <button class="btn" type="submit" <?= $wait > 0 ? 'disabled' : '' ?>>Войти</button>
  <?php if ($wait > 0): ?>
    <p class="hint">Вход временно придержан на <?= (int) $wait ?> с — слишком много неудачных попыток.</p>
  <?php endif; ?>
</form>
<?php page_foot(); ?>
