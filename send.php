<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$token = getenv('VENDSTORE_TELEGRAM_BOT_TOKEN') ?: getenv('TELEGRAM_BOT_TOKEN') ?: '';
$chat_id = getenv('VENDSTORE_TELEGRAM_CHAT_ID') ?: getenv('TELEGRAM_CHAT_ID') ?: '';

// Локально: скопіюйте TELEGRAM_* з кореневого send.php або задайте через env
if ($token === '' && is_readable(__DIR__ . '/../send.php')) {
    $parent = file_get_contents(__DIR__ . '/../send.php');
    if (preg_match("/getenv\('TELEGRAM_BOT_TOKEN'\)[^']*'([^']+)'/", $parent, $m)) {
        $token = $m[1];
    }
    if (preg_match("/getenv\('TELEGRAM_CHAT_ID'\)[^']*'([^']+)'/", $parent, $m)) {
        $chat_id = $m[1];
    }
}

if ($token === '' || $chat_id === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Telegram is not configured']);
    exit;
}

$phone = trim($_POST['phone'] ?? '');
$name = trim($_POST['name'] ?? '');
$address = trim($_POST['address'] ?? '');
$comment = trim($_POST['comment'] ?? '');
$form_type = trim($_POST['form_type'] ?? 'general');
$product = trim($_POST['product'] ?? '');

if ($phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Phone is required']);
    exit;
}

$labels = [
    'partner' => 'Партнерство B2B',
    'location' => 'Пропозиція локації',
    'callback' => 'Зворотний дзвінок',
    'general' => 'Загальна заявка',
];

$typeLabel = $labels[$form_type] ?? $form_type;

$lines = [
    "🆕 VendStore — нова заявка",
    "",
    "📋 Тип: {$typeLabel}",
    "📞 Телефон: {$phone}",
];

if ($name !== '') {
    $lines[] = "👤 Ім'я: {$name}";
}
if ($address !== '') {
    $lines[] = "📍 Локація: {$address}";
}
if ($product !== '') {
    $lines[] = "🤖 Продукт: {$product}";
}
$lines[] = "💬 Коментар: " . ($comment !== '' ? $comment : 'Не вказано');

$text = implode("\n", $lines);

$url = "https://api.telegram.org/bot{$token}/sendMessage";
$payload = json_encode([
    'chat_id' => $chat_id,
    'text' => $text,
]);

$context = stream_context_create([
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => $payload,
        'timeout' => 10,
    ],
]);

$result = @file_get_contents($url, false, $context);
$data = $result ? json_decode($result, true) : null;

if (!$data || empty($data['ok'])) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => $data['description'] ?? 'Telegram request failed',
    ]);
    exit;
}

echo json_encode(['ok' => true]);
