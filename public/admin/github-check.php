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

/**
 * ЗНАЧЕНИЕ ПОБАЙТНО.
 *
 * ЗАЧЕМ. Строка настроек может выглядеть правильной и не быть ею: `trim()` в
 * PHP снимает только обычные пробелы, перевод строки и табуляцию, а
 * неразрывный пробел, знак нулевой ширины и BOM остаются — и в редакторе
 * панели хостинга они не видны вовсе. Кириллические двойники латинских букв
 * («е» вместо «e») не видны даже при внимательном чтении.
 *
 * Поэтому здесь печатается не строка, а её длина и коды знаков. Всё, что за
 * пределами обычной латиницы, помечено — смотреть надо туда.
 */
function dump_value(string $v): string
{
    if ($v === '') {
        return '<span class="pill no">пусто</span>';
    }
    $out = '<div class="muted" style="font-size:13px;margin-top:4px">'
        . 'байт: <strong>' . strlen($v) . '</strong> · знаков: <strong>'
        . mb_strlen($v, 'UTF-8') . '</strong></div>'
        . '<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;'
        . 'line-height:1.9;margin-top:4px;word-break:break-all">';
    foreach (preg_split('//u', $v, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $ch) {
        $cp = mb_ord($ch, 'UTF-8');
        /* Обычная латиница, цифры, дефис, точка, слэш и подчёркивание — то,
           из чего состоит правильное значение. Всё остальное подозрительно. */
        $plain = $cp !== false && $cp < 128 && preg_match('~[A-Za-z0-9\-./_]~', $ch) === 1;
        $label = $cp === false ? '??' : sprintf('U+%04X', $cp);
        $shown = ($cp !== false && $cp > 32 && $cp !== 127) ? htmlspecialchars($ch, ENT_QUOTES) : '·';
        $out .= $plain
            ? '<span style="display:inline-block;padding:1px 4px;margin:1px;background:#f0f0ee;'
                . 'border-radius:3px">' . $shown . '</span>'
            : '<span style="display:inline-block;padding:1px 4px;margin:1px;background:#fbeceb;'
                . 'color:#b3261e;border-radius:3px" title="' . $label . '">' . $shown . ' '
                . $label . '</span>';
    }
    return $out . '</div>';
}

/** Ключи, которые код действительно читает. Всё прочее в файле — мимо. */
const KNOWN_KEYS = [
    'db_host', 'db_name', 'db_user', 'db_pass',
    'login', 'password_hash',
    'github_token', 'github_repo', 'github_ref', 'github_workflow',
    'export_key',
];

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
        $r,
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
        $r,
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
            $r,
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
            $r,
        ];
    }
}

page_head('Связь с GitHub');
?>
<h1>Связь с GitHub</h1>
<p class="lead">Сборка не запускается? Эта страница говорит, на каком шаге рвётся.
  Ничего не меняет и сборку не запускает — только смотрит.</p>

<div class="card">
  <h2 style="font-size:16px;margin:0 0 10px">Что уходит в запрос</h2>
  <p class="hint" style="margin-top:0">Значения показаны в том виде, в каком они уходят в
    запрос, — после того как сняты лишние пробелы, адрес целиком, «.git» и путь к файлу.
    Под каждым — длина и коды знаков: строка может выглядеть правильной и не быть ею.
    <strong>Красным помечено всё, что не обычная латиница, цифра или дефис.</strong></p>
  <table>
    <tbody>
      <tr>
        <td style="width:11rem"><strong>Репозиторий</strong><div class="hint">github_repo</div></td>
        <td><code><?= h($settings['repo']) ?></code><?= dump_value($settings['repo']) ?>
          <?php if ($settings['repo'] !== '' && !str_contains($settings['repo'], '/')): ?>
            <p class="err-text">Здесь должно быть <strong>владелец/репозиторий</strong> вместе,
              через косую черту, — например <code>kirill-design367/element</code>. Отдельного
              поля для владельца нет: код читает только <code>github_repo</code>.</p>
          <?php endif; ?>
        </td>
      </tr>
      <tr>
        <td><strong>Файл сборки</strong><div class="hint">github_workflow</div></td>
        <td><code><?= h($settings['workflow']) ?></code><?= dump_value($settings['workflow']) ?></td>
      </tr>
      <tr>
        <td><strong>Ветка</strong><div class="hint">github_ref</div></td>
        <td><code><?= h($settings['ref']) ?></code><?= dump_value($settings['ref']) ?></td>
      </tr>
      <tr>
        <td><strong>Ключ выгрузки</strong><div class="hint">export_key</div></td>
        <td>
          <?php $ek = trim((string) (cms_config()['export_key'] ?? '')); ?>
          <?php if ($ek === ''): ?>
            <span class="pill no">не заполнен</span>
            <p class="err-text">Без него сборка не сможет забрать данные и остановится.</p>
          <?php else: ?>
            <code><?= h(mb_substr($ek, 0, 4, 'UTF-8')) ?>…</code>
            <div class="muted" style="font-size:13px;margin-top:4px">
              байт: <strong><?= strlen($ek) ?></strong> ·
              знаков: <strong><?= mb_strlen($ek, 'UTF-8') ?></strong>
            </div>
            <?php /* ЭТО ТОТ САМЫЙ КЛЮЧ, ИЗ-ЗА КОТОРОГО 30.08 ПРАВКА НЕ ДОЕХАЛА.
                     Он должен совпадать с секретом CMS_EXPORT_KEY в репозитории
                     знак в знак. Сам ключ не показывается: сверять надо длину и
                     первые четыре знака — этого достаточно, чтобы поймать и
                     лишний пробел, и обрезанную при вставке строку. */ ?>
            <p class="hint">Ровно это же значение должно лежать в секрете
              <code>CMS_EXPORT_KEY</code> в настройках репозитория на GitHub.
              Сверьте длину и первые четыре знака: не сойдутся — сборка не заберёт
              данные и остановится с ошибкой. Сам ключ не показывается.</p>
          <?php endif; ?>
        </td>
      </tr>
      <tr>
        <td><strong>Токен</strong><div class="hint">github_token</div></td>
        <td>
          <?php if ($settings['token'] === ''): ?>
            <span class="pill no">не заполнен</span>
          <?php else: ?>
            <code><?= h(mb_substr($settings['token'], 0, 4, 'UTF-8')) ?>…</code>
            <div class="muted" style="font-size:13px;margin-top:4px">
              байт: <strong><?= strlen($settings['token']) ?></strong> ·
              знаков: <strong><?= mb_strlen($settings['token'], 'UTF-8') ?></strong>
            </div>
            <p class="hint">Первые четыре знака говорят вид токена:
              <code>ghp_</code> — классический, <code>gith</code> — тонко настроенный
              (<code>github_pat_</code>). Сам токен не показывается.</p>
          <?php endif; ?>
        </td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size:15px;margin:18px 0 8px">Полные адреса запросов</h3>
  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;
              line-height:1.8;word-break:break-all">
    <?php
    $paths = [
        'шаг 1' => '/user',
        'шаг 2' => '/repos/' . $settings['repo'],
        'шаг 3' => '/repos/' . $settings['repo'] . '/actions/workflows/' . rawurlencode($settings['workflow']),
        'шаг 4' => '/repos/' . $settings['repo'] . '/branches/' . rawurlencode($settings['ref']),
        'публикация' => '/repos/' . $settings['repo'] . '/actions/workflows/'
            . rawurlencode($settings['workflow']) . '/dispatches',
    ];
    foreach ($paths as $name => $path) {
        echo '<div><span class="muted">' . h($name) . ':</span> https://api.github.com'
            . h($path) . '</div>';
    }
    ?>
  </div>
  <p class="hint">Заголовки у всех запросов одни и те же:
    <code>Accept: application/vnd.github+json</code>,
    <code>Authorization: Bearer &lt;токен&gt;</code>,
    <code>X-GitHub-Api-Version: 2022-11-28</code>,
    <code>User-Agent: elementst-cms</code>. Тонко настроенные и классические токены
    посылаются одинаково — отдельной схемы для них не существует.</p>

  <?php
  /* НЕЗНАКОМЫЕ КЛЮЧИ. Ключ, которого код не читает, — это молчаливая
     поломка: значение вписано, выглядит осмысленно и не делает ничего.
     Печатаются только ИМЕНА, без значений: рядом лежат пароль от базы и
     токен. */
  $extra = array_values(array_diff(array_keys(cms_config()), KNOWN_KEYS));
  ?>
  <?php if ($extra !== []): ?>
    <div class="msg err" style="margin-top:16px">
      <strong>В настройках есть ключи, которых код не читает:</strong>
      <?= h(implode(', ', $extra)) ?>.<br>
      Значение в таком ключе никуда не идёт. Если владелец репозитория вписан отдельно —
      он не используется: <code>github_repo</code> должен содержать
      <strong>владелец/репозиторий</strong> целиком.
    </div>
  <?php else: ?>
    <p class="hint" style="margin-top:14px">Лишних ключей в настройках нет — код читает все.</p>
  <?php endif; ?>
</div>

<form method="post" class="card">
  <?= csrf_field() ?>
  <button class="btn" type="submit">Проверить связь</button>
</form>

<?php if ($steps !== []): ?>
  <div class="card">
    <table>
      <tbody>
      <?php foreach ($steps as [$name, $ok, $note, $warn, $raw]): ?>
        <tr>
          <td style="width:2rem"><?= $ok ? '✅' : ($warn ? '⚠️' : '❌') ?></td>
          <td>
            <strong><?= h($name) ?></strong>
            <div class="muted" style="font-size:14px"><?= h($note) ?></div>
            <?php /* Код и тело ответа целиком: пересказ уже дважды увёл не туда,
                     поэтому здесь стоит то, что GitHub ответил на самом деле. */ ?>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;
                        margin-top:6px;color:#5a5f66;word-break:break-all">
              код: <?= (int) $raw['code'] ?><?php if ($raw['error'] !== ''): ?>
                · связь: <?= h($raw['error']) ?><?php endif; ?>
              <?php if ($raw['body'] !== ''): ?>
                <br>тело: <?= h(mb_substr($raw['body'], 0, 300, 'UTF-8')) ?><?php
                  if (mb_strlen($raw['body'], 'UTF-8') > 300) echo '…'; ?>
              <?php endif; ?>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php
    $firstBad = null;
    foreach ($steps as [$name, $ok, , $warn, ]) {
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
