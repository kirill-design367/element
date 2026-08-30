<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/github.php';

require_login();

/**
 * ПРОВЕРКА СВЯЗИ С GITHUB — ПО ШАГАМ.
 *
 * ЗАЧЕМ ОНА НУЖНА. Запуск сборки падает с кодом 404 сразу по четырём разным
 * причинам: не тот репозиторий в настройках, не то имя файла сборки, токен
 * не выпущен на этот репозиторий, у токена нет разрешения на Actions. Код
 * ответа у всех четырёх ОДИН И ТОТ ЖЕ — GitHub отвечает 404 на всё, чего
 * токен не видит, чтобы по ответу нельзя было узнать, существует ли
 * закрытый репозиторий.
 *
 * Значит по одному ответу причину не назвать, и гадать бесполезно. Здесь
 * запрос разбирается на четыре, от простого к сложному, и первый же
 * упавший шаг называет причину точно.
 *
 * Ничего не меняет и сборку не запускает: только читает.
 */

$settings = gh_settings();
$steps = [];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    csrf_check();
    $token = $settings['token'];
    $repo = $settings['repo'];

    /* Шаг 1. Токен вообще живой? Отвечает на самый безобидный запрос. */
    $r = gh_request('GET', '/user', $token);
    $who = json_decode($r['body'], true);
    $steps[] = [
        'Токен принят GitHub',
        $r['code'] === 200,
        $r['code'] === 200
            ? 'да, токен от пользователя ' . (string) ($who['login'] ?? '—')
            : ($r['code'] === 401
                ? 'нет: токен истёк, отозван или скопирован не целиком'
                : ($r['code'] === 403
                    ? 'токен живой, но не даёт читать профиль — это нормально для '
                        . 'тонко настроенного токена, идём дальше'
                    : 'GitHub ответил кодом ' . $r['code'] . ' ' . $r['error'])),
        /* Для fine-grained токена без права на профиль 403 — не приговор. */
        $r['code'] === 403,
    ];

    /* Шаг 2. Токен ВИДИТ этот репозиторий? Здесь отсеивается и опечатка в
       имени, и токен, выпущенный на другой репозиторий. */
    $r = gh_request('GET', '/repos/' . $repo, $token);
    $info = json_decode($r['body'], true);
    $repoOk = $r['code'] === 200;
    $steps[] = [
        'Токен видит репозиторий ' . $repo,
        $repoOk,
        $repoOk
            ? 'да, ветка по умолчанию — ' . (string) ($info['default_branch'] ?? '—')
            /* 404 и 403 здесь означают ОДНО И ТО ЖЕ с точки зрения человека:
               токен этот репозиторий не видит. Какой из двух кодов придёт,
               зависит от вида токена, и объяснять их по-разному значило бы
               гонять по двум ложным следам вместо одного верного. */
            : (in_array($r['code'], [403, 404], true)
                ? 'НЕТ. Либо имя репозитория в настройках написано с ошибкой, либо токен '
                    . 'выпущен не на этот репозиторий, либо у него нет разрешения на него. '
                    . 'Именно этот шаг чаще всего и падает.'
                : 'GitHub ответил кодом ' . $r['code']),
        false,
    ];

    /* Шаг 3. Файл сборки на месте и с нужным именем? */
    if ($repoOk) {
        $r = gh_request('GET', '/repos/' . $repo . '/actions/workflows/' . rawurlencode($settings['workflow']), $token);
        $wf = json_decode($r['body'], true);
        $steps[] = [
            'Сборка ' . $settings['workflow'] . ' найдена',
            $r['code'] === 200,
            $r['code'] === 200
                ? 'да, называется «' . (string) ($wf['name'] ?? '—') . '», состояние: '
                    . (string) ($wf['state'] ?? '—')
                : (in_array($r['code'], [403, 404], true)
                    ? 'НЕТ. Имя файла в настройках не совпадает с тем, что лежит в '
                        . '.github/workflows/, — либо у токена нет разрешения «Actions». '
                        . 'Репозиторий при этом виден, значит дело в одном из этих двух.'
                    : 'GitHub ответил кодом ' . $r['code']),
            false,
        ];
    }

    /* Шаг 4. Ветка, на которую шлём запуск, существует? */
    if ($repoOk) {
        $r = gh_request('GET', '/repos/' . $repo . '/branches/' . rawurlencode($settings['ref']), $token);
        $steps[] = [
            'Ветка ' . $settings['ref'] . ' существует',
            $r['code'] === 200,
            $r['code'] === 200
                ? 'да'
                : ($r['code'] === 301
                    ? 'нет: GitHub увёл запрос на другую ветку — обычно так бывает, когда в '
                        . 'настройках стоит старое имя (master вместо main).'
                    : 'нет, такой ветки в репозитории не нашлось (код ' . $r['code'] . ')'),
            false,
        ];
    }
}

page_head('Связь с GitHub');
?>
<h1>Связь с GitHub</h1>
<p class="lead">Сборка не запускается? Эта страница говорит, на каком шаге рвётся.
  Ничего не меняет и сборку не запускает — только смотрит.</p>

<div class="card">
  <h2 style="font-size:16px;margin:0 0 10px">Что стоит в настройках на хостинге</h2>
  <table>
    <tbody>
      <tr><td>Репозиторий</td><td><code><?= h($settings['repo']) ?></code></td></tr>
      <tr><td>Файл сборки</td><td><code><?= h($settings['workflow']) ?></code></td></tr>
      <tr><td>Ветка</td><td><code><?= h($settings['ref']) ?></code></td></tr>
      <tr><td>Токен</td><td><?= $settings['token'] === ''
        ? '<span class="pill no">не заполнен</span>'
        : '<span class="pill on">заполнен, ' . (int) mb_strlen($settings['token']) . ' знаков</span>' ?></td></tr>
    </tbody>
  </table>
  <p class="hint">Значения показаны в том виде, в каком уходят в запрос: лишние пробелы,
    адрес целиком вместо «владелец/репозиторий» и путь вместо имени файла приводятся
    к нужному виду автоматически. Сам токен не показывается — только его длина.</p>
</div>

<form method="post" class="card">
  <?= csrf_field() ?>
  <button class="btn" type="submit">Проверить связь</button>
</form>

<?php if ($steps !== []): ?>
  <div class="card">
    <table>
      <tbody>
      <?php foreach ($steps as [$name, $ok, $note, $warn]): ?>
        <tr>
          <td style="width:2rem"><?= $ok ? '✅' : ($warn ? '⚠️' : '❌') ?></td>
          <td><strong><?= h($name) ?></strong><div class="muted" style="font-size:14px"><?= h($note) ?></div></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php
    $firstBad = null;
    foreach ($steps as [$name, $ok, , $warn]) {
        if (!$ok && !$warn) { $firstBad = $name; break; }
    }
    ?>
    <?php if ($firstBad === null): ?>
      <p class="msg ok" style="margin-top:14px">Всё сходится — «Опубликовать» должно работать.</p>
    <?php else: ?>
      <p class="msg err" style="margin-top:14px">Рвётся на шаге: <?= h($firstBad) ?>.
        Чинить надо его — остальное проверять смысла нет.</p>
    <?php endif; ?>
  </div>
<?php endif; ?>

<div class="card">
  <h2 style="font-size:16px;margin:0 0 10px">Каким должен быть токен</h2>
  <p>Fine-grained personal access token, у него:</p>
  <table>
    <tbody>
      <tr><td>Repository access</td><td>именно этот репозиторий, а не «все» и не «none»</td></tr>
      <tr><td>Actions</td><td><strong>Read and write</strong> — без этого запуск сборки недоступен</td></tr>
      <tr><td>Metadata</td><td>Read — GitHub ставит его сам, но проверьте</td></tr>
      <tr><td>Срок</td><td>не истёк</td></tr>
    </tbody>
  </table>
  <p class="hint">Классический токен тоже подойдёт, но ему нужна область <code>workflow</code>.
    На токен без нужного разрешения GitHub отвечает 404, а не 403, — поэтому «не найдено»
    почти всегда означает токен, а не опечатку в пути.</p>
</div>
<?php page_foot(); ?>
