<?php

header('Content-Type: application/json');

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["error" => "ID requerido"]);
    exit;
}

$dataFile = 'data.json';

if (!file_exists($dataFile)) {
    echo json_encode(["error" => "No hay datos"]);
    exit;
}

$data = json_decode(file_get_contents($dataFile), true);

if (!isset($data[$id])) {
    echo json_encode(["error" => "QR no encontrado"]);
    exit;
}

echo json_encode([
    "text" => $data[$id]["text"]
]);