<?php
require_once 'database.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // READ - Obtener citas con JOIN para nombres
        $filtro = $_GET['filtro'] ?? 'hoy';
        $hoy = date('Y-m-d');
        
        $sql = "SELECT c.*, p.nombre as paciente_nombre, s.nombre as servicio_nombre 
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN servicios s ON c.servicio_id = s.id";
        
        switch ($filtro) {
            case 'hoy':
                $sql .= " WHERE c.fecha = ?";
                $params = [$hoy];
                break;
            case 'semana':
                $sql .= " WHERE c.fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)";
                $params = [$hoy, $hoy];
                break;
            default:
                $params = [];
        }
        
        $sql .= " ORDER BY c.fecha, c.hora";
        
        $result = $db->query($sql, $params ?? []);
        $citas = $result->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $citas]);
        break;
        
    case 'POST':
        // CREATE - Nueva cita
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar que no haya cita en mismo horario
        $checkSql = "SELECT id FROM citas 
                     WHERE fecha = ? AND hora = ? AND estado != 'cancelada'";
        $check = $db->query($checkSql, [$data['fecha'], $data['hora']]);
        
        if ($check->rowCount() > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe una cita en ese horario'
            ]);
            exit;
        }
        
        $sql = "INSERT INTO citas (paciente_id, servicio_id, fecha, hora, estado, observaciones) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        try {
            $db->query($sql, [
                $data['paciente_id'],
                $data['servicio_id'],
                $data['fecha'],
                $data['hora'],
                $data['estado'] ?? 'pendiente',
                $data['observaciones'] ?? null
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Cita creada con éxito'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear cita: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // UPDATE - Actualizar cita
        parse_str(file_get_contents('php://input'), $data);
        
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit;
        }
        
        $sql = "UPDATE citas 
                SET paciente_id = ?, servicio_id = ?, fecha = ?, 
                    hora = ?, estado = ?, observaciones = ? 
                WHERE id = ?";
        
        try {
            $db->query($sql, [
                $data['paciente_id'],
                $data['servicio_id'],
                $data['fecha'],
                $data['hora'],
                $data['estado'],
                $data['observaciones'] ?? null,
                $_GET['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Cita actualizada con éxito'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        // DELETE - Cancelar cita (soft delete o hard delete)
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            exit;
        }
        
        // Opción 1: Eliminar físicamente
        $sql = "DELETE FROM citas WHERE id = ?";
        
        // Opción 2: Soft delete (cambiar estado)
        // $sql = "UPDATE citas SET estado = 'cancelada' WHERE id = ?";
        
        try {
            $db->query($sql, [$_GET['id']]);
            echo json_encode([
                'success' => true,
                'message' => 'Cita cancelada con éxito'
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al cancelar: ' . $e->getMessage()
            ]);
        }
        break;
}
?>