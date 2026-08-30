<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * ОБРАЩЕНИЕ К GITHUB: РАЗБОР НАСТРОЕК И ЗАПРОСЫ.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Настройки заполняет человек, руками, в текстовом
 * редакторе панели хостинга — и заполняет он их так, как понял вопрос.
 * «Репозиторий» превращается в `https://github.com/kirill-design367/element`,
 * «имя файла сборки» — в `.github/workflows/deploy.yml`, а в конце строки
 * остаётся пробел, потому что редактор его не показывает.
 *
 * Каждый из этих случаев даёт ОДНУ И ТУ ЖЕ ошибку — 404, — и по ней не
 * отличить опечатку в пути от токена без прав. Поэтому значения приводятся
 * к нужному виду здесь, до запроса, а не проверяются глазами после.
 */

/**
 * ЧТО ИМЕННО ПРИВОДИТСЯ К ВИДУ.
 *
 * Репозиторий: снимается схема и хост, `.git` на конце, слэши по краям и
 * любые пробелы. `https://github.com/kirill-design367/element.git/` и
 * `kirill-design367/element` дают одно и то же.
 *
 * Файл сборки: снимается путь `.github/workflows/`, если его написали
 * целиком, и пробелы. Остаётся имя файла — именно его ждёт API.
 *
 * Ветка и токен: снимаются пробелы и переводы строк. Токен с переводом
 * строки на конце ломает заголовок целиком, и curl отвергает такой запрос
 * ещё до отправки.
 *
 * @return array{repo:string,workflow:string,ref:string,token:string}
 */
function gh_settings(): array
{
    $c = cms_config();

    $repo = trim((string) ($c['github_repo'] ?? ''));
    $repo = preg_replace('~^\s*https?://(www\.)?github\.com/~i', '', $repo) ?? $repo;
    /* ПОРЯДОК ЗДЕСЬ ЗНАЧИМ, И ОН ВЫБРАН ЗАМЕРОМ. Пока `.git` снимался до
       слэшей, адрес вида «…/element.git/» проходил мимо: на конце стоял
       слэш, выражение не срабатывало, а следующий trim оставлял «.git» в
       имени репозитория — и запрос уходил на несуществующий путь. Сперва
       края, потом расширение. */
    $repo = trim($repo, " \t\n\r/");
    $repo = preg_replace('~\.git$~i', '', $repo) ?? $repo;
    $repo = trim($repo, " \t\n\r/");

    $workflow = trim((string) ($c['github_workflow'] ?? 'deploy.yml'));
    /* Написали путь целиком — берём последний кусок. */
    $workflow = trim(basename(str_replace('\\', '/', $workflow)));

    $ref = trim((string) ($c['github_ref'] ?? 'main'));
    /* «refs/heads/main» тоже встречается: API ждёт голое имя ветки. */
    $ref = preg_replace('~^refs/heads/~', '', $ref) ?? $ref;

    return [
        'repo' => $repo,
        'workflow' => $workflow !== '' ? $workflow : 'deploy.yml',
        'ref' => $ref !== '' ? $ref : 'main',
        'token' => trim((string) ($c['github_token'] ?? '')),
    ];
}

/**
 * Запрос к API. Возвращает код ответа, тело и ошибку связи.
 *
 * @return array{code:int,body:string,error:string}
 */
function gh_request(string $method, string $path, string $token, ?array $payload = null): array
{
    $ch = curl_init('https://api.github.com' . $path);
    $headers = [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
        'X-GitHub-Api-Version: 2022-11-28',
        /* GitHub отвергает запросы без User-Agent — это не рекомендация, а
           требование их API. */
        'User-Agent: elementst-cms',
    ];
    $options = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ];
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        $options[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_SLASHES);
    }
    $options[CURLOPT_HTTPHEADER] = $headers;
    curl_setopt_array($ch, $options);
    $body = curl_exec($ch);
    $out = [
        'code' => (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE),
        'body' => $body === false ? '' : (string) $body,
        'error' => curl_error($ch),
    ];
    curl_close($ch);
    return $out;
}

/**
 * ОТВЕТ ПЕРЕСКАЗЫВАЕТСЯ СЛОВАМИ, А НЕ КОДОМ.
 *
 * ПРО 404 ОТДЕЛЬНО, И ЭТО ГЛАВНОЕ ЗДЕСЬ. GitHub отвечает 404 не только
 * когда пути нет, но и когда ТОКЕН НЕ ВИДИТ РЕПОЗИТОРИЙ, — так сделано
 * нарочно, чтобы по ответу нельзя было узнать, существует ли закрытый
 * репозиторий. То есть один и тот же код означает и «опечатка в пути», и
 * «у токена нет доступа».
 *
 * Раньше здесь стояло «проверьте имя репозитория и файла сборки» — и это
 * отправляло человека искать опечатку там, где всё написано верно. Токены
 * истекают, создаются без нужного разрешения и выпускаются не на тот
 * репозиторий постоянно, а имя файла пишется один раз. Поэтому первым
 * назван токен, а рядом стоит кнопка проверки, которая говорит точно.
 */
function gh_explain(int $code, string $error): string
{
    return match (true) {
        $code === 0 => 'Не получилось достучаться до GitHub: '
            . ($error !== '' ? $error : 'нет ответа')
            . '. Данные сохранены — попробуйте ещё раз через минуту.',
        $code === 204 => '',
        $code === 401 => 'GitHub не принял токен: он истёк, отозван или скопирован не целиком. '
            . 'Нужен новый в настройках на хостинге.',
        $code === 403 => 'GitHub отказал: токен есть, но прав на запуск сборки у него нет. '
            . 'Нужно разрешение «Actions: Read and write».',
        $code === 404 => 'GitHub ответил «не найдено». Чаще всего это НЕ опечатка в пути, '
            . 'а токен: он не выпущен на этот репозиторий или у него нет разрешения '
            . '«Actions: Read and write» — на такой токен GitHub отвечает 404, а не 403. '
            . 'Нажмите «Проверить связь с GitHub» — там будет видно точно.',
        $code === 422 => 'GitHub принял запрос, но не смог запустить сборку: обычно это '
            . 'значит, что ветка указана неверно или в ней нет файла сборки.',
        default => "GitHub ответил кодом {$code}. Данные сохранены, сборку можно запустить "
            . 'вручную на GitHub.',
    };
}
