-- ============================================
-- BASE DE DATOS: CLÍNICA ODONTOLÓGICA SONRISA
-- ============================================

CREATE DATABASE IF NOT EXISTS clinica_sonrisa;
USE clinica_sonrisa;

-- ===== TABLA DE USUARIOS =====
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hash de contraseña
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'doctor', 'recepcion') DEFAULT 'recepcion',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE PACIENTES =====
CREATE TABLE pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_nacimiento DATE,
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===== TABLA DE SERVICIOS =====
CREATE TABLE servicios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion INT,  -- minutos
    precio DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE
);

-- ===== TABLA DE CITAS =====
CREATE TABLE citas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada') DEFAULT 'pendiente',
    observaciones TEXT,
    created_by INT,  -- ID del usuario que creó la cita
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    UNIQUE KEY unique_cita (fecha, hora)  -- No dos citas misma hora
);

-- ===== DATOS INICIALES =====

-- Usuarios (contraseñas hasheadas con password_hash('1234', PASSWORD_DEFAULT))
-- Las contraseñas son '1234' para todos los usuarios
INSERT INTO usuarios (username, password, nombre, rol) VALUES
('admin', '$2y$10$YourHashHere', 'Dr. Administrador', 'admin'),
('doctor', '$2y$10$YourHashHere', 'Dra. Martínez', 'doctor'),
('recepcion', '$2y$10$YourHashHere', 'Ana Recepcionista', 'recepcion');

-- Servicios
INSERT INTO servicios (nombre, duracion, precio) VALUES
('Limpieza Dental', 30, 1500.00),
('Blanqueamiento', 60, 3500.00),
('Ortodoncia', 45, 2500.00),
('Extracción', 30, 2000.00),
('Endodoncia', 90, 5000.00),
('Consulta General', 20, 800.00);

-- Pacientes de ejemplo
INSERT INTO pacientes (nombre, telefono, email, fecha_nacimiento) VALUES
('María González', '809-555-1234', 'maria@gmail.com', '1985-06-15'),
('Carlos Pérez', '809-555-5678', 'carlos@gmail.com', '1978-03-22'),
('Ana Rodríguez', '829-555-9012', 'ana@gmail.com', '1990-11-30');

-- Citas de ejemplo
INSERT INTO citas (paciente_id, servicio_id, fecha, hora, estado) VALUES
(1, 1, CURDATE(), '09:00:00', 'confirmada'),
(2, 6, CURDATE(), '10:30:00', 'pendiente'),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 'confirmada');