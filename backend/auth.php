<?php
// auth.php - Versión LIMPIA (sin código extra)
error_reporting(0);
ini_set('display_errors', 0);

require_once 'database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit;
}

if (!isset($data['username']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    $sql = "SELECT id, username, nombre, rol, password 
            FROM usuarios 
            WHERE username = ? AND activo = 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($data['password'], $user['password'])) {
        unset($user['password']);
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'token' => $token
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>