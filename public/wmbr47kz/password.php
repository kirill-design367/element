<?php
declare(strict_types=1);

/**
 * ХЕШ ПАРОЛЯ И КЛЮЧ ВЫГРУЗКИ — ПОСЧИТАТЬ И ВПИСАТЬ РУКАМИ.
 *
 * Страница НИЧЕГО НЕ СОХРАНЯЕТ. Она печатает строку, которую надо вписать в
 * файл настроек на хостинге. Так сделано нарочно: пароль, который админка
 * умеет менять сама, — это ещё одна дверь, а дверей должно быть ровно
 * столько, сколько нужно.
 *
 * Ни базы, ни сессии здесь не требуется: страница работает, даже когда
 * админка ещё не установлена, — иначе первый хеш взять было бы негде.
 */

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';

require_https();
send_headers();

$hash = null;
$key = null;
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $pass = (string) ($_POST['password'] ?? '');
    if (mb_strlen($pass) >= 10) {
        /* COST 12: на shared-хостинге это примерно четверть секунды. Дороже
           перебор, дешевле вход — размен в нужную сторону, вход бывает раз
           в день, а перебор идёт непрерывно. */
        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    } else {
        $hash = false;
    }
    $key = bin2hex(random_bytes(24));
}

page_head('Пароль и ключ', false);
?>
<h1>Хеш пароля и ключ выгрузки</h1>
<p class="lead">Страница ничего не сохраняет — она считает строки, которые нужно вписать
  в файл настроек <code>cms-config.php</code> на хостинге.</p>

<form method="post" class="card" style="max-width:34rem">
  <label class="req" for="password">Придумайте пароль (от 10 знаков)</label>
  <input id="password" name="password" type="text" autocomplete="off">
  <p class="hint">Он нигде не сохраняется. Запишите его себе — восстановить будет неоткуда.</p>
  <p style="margin-top:14px"><button class="btn" type="submit">Посчитать</button></p>
</form>

<?php if ($hash === false): ?>
  <div class="msg err">Пароль короче десяти знаков. Такой подбирается за вечер.</div>
<?php elseif ($hash !== null): ?>
  <div class="card">
    <p><strong>Впишите в <code>cms-config.php</code>:</strong></p>
    <p><label>password_hash</label>
      <input type="text" readonly onclick="this.select()" value="<?= h($hash) ?>"></p>
    <p><label>export_key — если ещё не задан</label>
      <input type="text" readonly onclick="this.select()" value="<?= h((string) $key) ?>"></p>
    <p class="hint">Тот же <code>export_key</code> положите в секреты репозитория на GitHub
      под именем <code>CMS_EXPORT_KEY</code> — по нему сборка забирает данные с хостинга.</p>
  </div>
<?php endif; ?>
<?php page_foot(); ?>
