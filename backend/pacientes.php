<?php
require_once 'database.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // READ - Obtener pacientes
        if (isset($_GET['id'])) {
            // Obtener un paciente específico
            $sql = "SELECT * FROM pacientes WHERE id = ?";
            $result = $db->query($sql, [$_GET['id']]);
            $paciente = $result->fetch();
            
            if ($paciente) {
                echo json_encode(['success' => true, 'data' => $paciente]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Paciente no encontrado']);
            }
        } else {
            // Obtener todos los pacientes (con búsqueda opcional)
            $search = $_GET['search'] ?? '';
            
            if ($search) {
                $sql = "SELECT * FROM pacientes 
                        WHERE nombre LIKE ? OR telefono LIKE ? OR email LIKE ?
                        ORDER BY nombre";
                $searchTerm = "%$search%";
                $result = $db->query($sql, [$searchTerm, $searchTerm, $searchTerm]);
            } else {
                $sql = "SELECT * FROM pacientes ORDER BY nombre";
                $result = $db->query($sql);
            }
            
            $pacientes = $result->fetchAll();
            echo json_encode(['success' => true, 'data' => $pacientes]);
        }
        break;
        
    case 'POST':
        // CREATE - Insertar nuevo paciente
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO pacientes (nombre, telefono, email, fecha_nacimiento, direccion) 
                VALUES (?, ?, ?, ?, ?)";
        
        try {
            $db->query($sql, [
                $data['nombre'],
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['fecha_nacimiento'] ?? null,
                $data['direccion'] ?? null
            ]);
            
            $id = $db->getConnection()->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Paciente creado con éxito',
                'id' => $id
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear paciente: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // UPDATE - Actualizar paciente
        parse_str(file_get_contents('php://input'), $data);
        
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit;
        }
        
        $sql = "UPDATE pacientes 
                SET nombre = ?, telefono = ?, email = ?, 
                    fecha_nacimiento = ?, direccion = ? 
                WHERE id = ?";
        
        try {
            $db->query($sql, [
                $data['nombre'],
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['fecha_nacimiento'] ?? null,
                $data['direccion'] ?? null,
                $_GET['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Paciente actualizado con éxito'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        // DELETE - Eliminar paciente
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit;
        }
        
        $sql = "DELETE FROM pacientes WHERE id = ?";
        
        try {
            $db->query($sql, [$_GET['id']]);
            echo json_encode([
                'success' => true,
                'message' => 'Paciente eliminado con éxito'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar: ' . $e->getMessage()
            ]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
?>