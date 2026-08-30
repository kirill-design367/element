<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/ui.php';
require_once __DIR__ . '/lib/snapshot.php';

require_login();

$counts = [
    'позиций в каталоге' => (int) (q1('SELECT COUNT(*) AS n FROM materials')['n'] ?? 0),
    'из них с ценой' => (int) (q1('SELECT COUNT(*) AS n FROM materials WHERE price_per_ton IS NOT NULL')['n'] ?? 0),
    'без цены' => (int) (q1('SELECT COUNT(*) AS n FROM materials WHERE price_per_ton IS NULL')['n'] ?? 0),
    'в наличии' => (int) (q1("SELECT COUNT(*) AS n FROM materials WHERE availability = 'in-stock'")['n'] ?? 0),
    'под заказ' => (int) (q1("SELECT COUNT(*) AS n FROM materials WHERE availability = 'on-order'")['n'] ?? 0),
    'категорий' => (int) (q1('SELECT COUNT(*) AS n FROM categories')['n'] ?? 0),
    'объектов' => (int) (q1('SELECT COUNT(*) AS n FROM objects')['n'] ?? 0),
];

page_head('Публикация');
show_flash('publish');
?>
<h1>Данные сайта</h1>
<p class="lead">Здесь правятся цены, номенклатура, контакты и объекты. Тексты блоков,
  композиция и фотографии сюда не входят — они в вёрстке.</p>

<div class="card">
  <table>
    <tbody>
    <?php foreach ($counts as $label => $n): ?>
      <tr>
        <td><?= h($label) ?></td>
        <td class="num" style="width:6rem"><strong><?= (int) $n ?></strong></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <p class="hint">Счётчики берутся из базы. На сайте они тоже считаются, а не набираются
    руками: правка каталога меняет их сама.</p>
</div>

<div class="card">
  <h2 style="font-size:17px;margin:0 0 10px">Что где править</h2>
  <table>
    <tbody>
      <tr><td><a href="materials.php">Каталог</a></td><td class="muted">позиции, цены, наличие, характеристики</td></tr>
      <tr><td><a href="categories.php">Категории</a></td><td class="muted">название, описание, порядок</td></tr>
      <tr><td><a href="company.php">Контакты</a></td><td class="muted">телефон, адрес, почта, реквизиты</td></tr>
      <tr><td><a href="objects.php">Объекты</a></td><td class="muted">что и куда поставляли</td></tr>
      <tr><td><a href="fleet.php">Парк</a></td><td class="muted">цифры блока «Парк и объёмы»</td></tr>
    </tbody>
  </table>
</div>
<?php page_foot(); ?>
