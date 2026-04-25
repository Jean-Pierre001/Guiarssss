<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

$text = $_POST['text'] ?? '';
$type = $_POST['type'] ?? 'plain';

function generateId() {
    return substr(md5(uniqid()), 0, 6);
}

if ($type === 'plain') {

    $qrContent = "TRISKEL|" . $text;

} else {

    $id = generateId();

    $dataFile = 'data.json';

    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, '{}');
    }

    $data = json_decode(file_get_contents($dataFile), true);

    $data[$id] = ["text" => $text];

    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));

    $qrContent = "https://guiar.infinityfree.me/qr.php?id=" . $id;
}

// 👉 GENERADOR QR SIN LIBRERÍAS
$qrContentEncoded = urlencode($qrContent);
$qrImage = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$qrContentEncoded";

?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>QR generado</title>
</head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;">

    <h3>QR generado:</h3>

    <img src="<?= $qrImage ?>" />

    <h4>Contenido:</h4>
    <pre><?= htmlspecialchars($qrContent) ?></pre>

    <br><br>
    <a href="index.php" style="color:#0f0;">Generar otro</a>

</body>
</html>