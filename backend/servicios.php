<?php
require_once 'database.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT id, nombre, duracion, precio FROM servicios WHERE activo = 1 ORDER BY nombre";
    $result = $db->query($sql);
    $servicios = $result->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $servicios
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>