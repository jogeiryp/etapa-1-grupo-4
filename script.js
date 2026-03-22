// ============================================
// CLÍNICA ODONTOLÓGICA - ETAPA 3 CORREGIDA
// ============================================

const API_URL = 'http://localhost/clinica-odontologica/backend/';

let App = {
    currentUser: null,
    token: null,
    pacientes: [],
    citas: [],
    servicios: []
};

// ===== FUNCIONES API =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = API_URL + endpoint;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    if (App.token) {
        options.headers['Authorization'] = 'Bearer ' + App.token;
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Error en la petición');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        mostrarNotificacion(error.message, 'error');
        throw error;
    }
}

// ===== AUTENTICACIÓN =====
async function login(username, password) {
    try {
        console.log('Intentando login con:', username);
        
        const response = await fetch(API_URL + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            App.currentUser = data.user;
            App.token = data.token;
            
            sessionStorage.setItem('token', App.token);
            sessionStorage.setItem('user', JSON.stringify(App.currentUser));
            
            mostrarNotificacion(`Bienvenido ${App.currentUser.nombre}`, 'success');
            return true;
        } else {
            mostrarNotificacion(data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        mostrarNotificacion('Error de conexión con el servidor', 'error');
        return false;
    }
}

function logout() {
    App.currentUser = null;
    App.token = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    location.reload();
}

function verificarSesion() {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    
    console.log('Verificando sesión - Token:', token ? 'Sí' : 'No', 'User:', user ? 'Sí' : 'No');
    
    if (token && user) {
        App.token = token;
        App.currentUser = JSON.parse(user);
        
        const modal = document.getElementById('loginModal');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (modal) modal.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const userNameSpan = document.getElementById('userNameDisplay');
        const userRoleSpan = document.getElementById('userRoleDisplay');
        
        if (userNameSpan) userNameSpan.textContent = App.currentUser.nombre;
        if (userRoleSpan) userRoleSpan.innerHTML = `Sistema Interno • <span>${App.currentUser.rol}</span>`;
        
        // Cargar datos
        cargarDatosIniciales();
    } else {
        const modal = document.getElementById('loginModal');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (modal) modal.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ===== PACIENTES =====
async function cargarPacientes(search = '') {
    try {
        const url = search ? `pacientes.php?search=${encodeURIComponent(search)}` : 'pacientes.php';
        const result = await apiRequest(url);
        App.pacientes = result.data || [];
        renderTablaPacientes();
        actualizarDashboard();
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        App.pacientes = [];
    }
}

async function guardarPaciente() {
    const id = document.getElementById('pacienteId').value;
    const paciente = {
        nombre: document.getElementById('pacienteNombre').value,
        telefono: document.getElementById('pacienteTelefono').value,
        email: document.getElementById('pacienteEmail').value,
        fecha_nacimiento: document.getElementById('pacienteNacimiento').value,
        direccion: document.getElementById('pacienteDireccion').value
    };
    
    if (!paciente.nombre) {
        mostrarNotificacion('El nombre es requerido', 'warning');
        return;
    }
    
    try {
        if (id) {
            await apiRequest(`pacientes.php?id=${id}`, 'PUT', paciente);
            mostrarNotificacion('Paciente actualizado', 'success');
        } else {
            await apiRequest('pacientes.php', 'POST', paciente);
            mostrarNotificacion('Paciente creado', 'success');
        }
        cargarPacientes();
        cerrarModal('modalPaciente');
    } catch (error) {
        console.error('Error guardando paciente:', error);
    }
}

async function eliminarPaciente(id) {
    try {
        await apiRequest(`pacientes.php?id=${id}`, 'DELETE');
        mostrarNotificacion('Paciente eliminado', 'info');
        cargarPacientes();
    } catch (error) {
        console.error('Error eliminando paciente:', error);
    }
}

// ===== CITAS =====
async function cargarCitas(filtro = 'hoy') {
    try {
        const result = await apiRequest(`citas.php?filtro=${filtro}`);
        App.citas = result.data || [];
        renderTablaCitas();
        actualizarDashboard();
        cargarAside();
    } catch (error) {
        console.error('Error cargando citas:', error);
        App.citas = [];
    }
}

async function guardarCita() {
    const id = document.getElementById('citaId').value;
    const cita = {
        paciente_id: parseInt(document.getElementById('citaPacienteId').value),
        servicio_id: parseInt(document.getElementById('citaServicio').value),
        fecha: document.getElementById('citaFecha').value,
        hora: document.getElementById('citaHora').value,
        estado: document.getElementById('citaEstado').value,
        observaciones: document.getElementById('citaObservaciones').value
    };
    
    if (!cita.paciente_id || !cita.servicio_id) {
        mostrarNotificacion('Selecciona paciente y servicio', 'warning');
        return;
    }
    
    try {
        if (id) {
            await apiRequest(`citas.php?id=${id}`, 'PUT', cita);
            mostrarNotificacion('Cita actualizada', 'success');
        } else {
            await apiRequest('citas.php', 'POST', cita);
            mostrarNotificacion('Cita creada', 'success');
        }
        cargarCitas(document.getElementById('filtroCitas')?.value || 'hoy');
        cerrarModal('modalCita');
    } catch (error) {
        console.error('Error guardando cita:', error);
    }
}

async function cancelarCita(id) {
    try {
        await apiRequest(`citas.php?id=${id}`, 'DELETE');
        mostrarNotificacion('Cita cancelada', 'info');
        cargarCitas(document.getElementById('filtroCitas')?.value || 'hoy');
    } catch (error) {
        console.error('Error cancelando cita:', error);
    }
}

// ===== SERVICIOS =====
async function cargarServicios() {
    try {
        const result = await apiRequest('servicios.php');
        App.servicios = result.data || [];
        renderServicios();
    } catch (error) {
        console.error('Error cargando servicios:', error);
        // Datos de ejemplo si falla
        App.servicios = [
            { id: 1, nombre: 'Limpieza Dental', duracion: 30, precio: 1500 },
            { id: 2, nombre: 'Blanqueamiento', duracion: 60, precio: 3500 },
            { id: 3, nombre: 'Ortodoncia', duracion: 45, precio: 2500 },
            { id: 4, nombre: 'Extracción', duracion: 30, precio: 2000 },
            { id: 5, nombre: 'Endodoncia', duracion: 90, precio: 5000 },
            { id: 6, nombre: 'Consulta General', duracion: 20, precio: 800 }
        ];
        renderServicios();
    }
}

// ===== RENDERIZADO =====
function renderTablaPacientes() {
    const tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!App.pacientes || App.pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay pacientes registrados</td></tr>';
        return;
    }
    
    App.pacientes.forEach(paciente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${paciente.id || '-'}</td>
            <td><strong>${paciente.nombre || '-'}</strong></td>
            <td>${paciente.telefono || '-'}</td>
            <td>${paciente.email || '-'}</td>
            <td>${paciente.fecha_nacimiento || '-'}</td>
            <td>-</td>
            <td class="acciones">
                <button class="btn-icon" onclick="editarPaciente(${paciente.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="confirmarEliminarPaciente(${paciente.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTablaCitas() {
    const tbody = document.getElementById('tablaCitas');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!App.citas || App.citas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay citas registradas</td></tr>';
        return;
    }
    
    App.citas.forEach(cita => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cita.fecha || '-'}</td>
            <td><strong>${cita.hora || '-'}</strong></td>
            <td>${cita.paciente_nombre || '-'}</td>
            <td>${cita.servicio_nombre || '-'}</td>
            <td><span class="estado-badge estado-${cita.estado}">${cita.estado || 'pendiente'}</span></td>
            <td class="acciones">
                <button class="btn-icon" onclick="editarCita(${cita.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="confirmarEliminarCita(${cita.id})" title="Cancelar">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderServicios() {
    const container = document.getElementById('serviciosLista');
    if (!container) return;
    
    container.innerHTML = '';
    
    App.servicios.forEach(servicio => {
        const card = document.createElement('div');
        card.className = 'servicio-card';
        card.innerHTML = `
            <div class="servicio-icon">🦷</div>
            <h3>${servicio.nombre}</h3>
            <div class="servicio-detalles">
                <span><i class="fas fa-clock"></i> ${servicio.duracion} min</span>
                <span><i class="fas fa-dollar-sign"></i> RD$ ${servicio.precio}</span>
            </div>
            <button class="btn-small" onclick="abrirModalNuevaCitaConServicio(${servicio.id})">
                Agendar <i class="fas fa-arrow-right"></i>
            </button>
        `;
        container.appendChild(card);
    });
}

function renderProximasCitas(citas) {
    const container = document.getElementById('proximasCitasLista');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!citas || citas.length === 0) {
        container.innerHTML = '<p class="muted">No hay citas próximas</p>';
        return;
    }
    
    citas.slice(0, 5).forEach(cita => {
        const item = document.createElement('div');
        item.className = 'appointment-item';
        item.innerHTML = `
            <div class="appointment-time">${cita.hora}</div>
            <div class="appointment-info">
                <strong>${cita.paciente_nombre}</strong>
                <span>${cita.servicio_nombre}</span>
            </div>
            <span class="estado-badge estado-${cita.estado}">${cita.estado}</span>
        `;
        container.appendChild(item);
    });
}

function actualizarDashboard() {
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = App.citas?.filter(c => c.fecha === hoy && c.estado !== 'cancelada') || [];
    
    document.getElementById('citasHoyCount').textContent = citasHoy.length;
    document.getElementById('totalPacientes').textContent = App.pacientes?.length || 0;
    
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];
    const proximas = App.citas?.filter(c => 
        c.fecha >= hoy && c.fecha <= mananaStr && c.estado !== 'cancelada'
    ) || [];
    
    document.getElementById('proximasCitasCount').textContent = proximas.length;
    
    const ingresos = citasHoy.reduce((total, cita) => {
        const servicio = App.servicios.find(s => s.nombre === cita.servicio_nombre);
        return total + (servicio?.precio || 800);
    }, 0);
    document.getElementById('ingresosHoy').textContent = `RD$ ${ingresos.toLocaleString()}`;
    
    renderProximasCitas(proximas);
}

function cargarAside() {
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = App.citas?.filter(c => c.fecha === hoy && c.estado !== 'cancelada') || [];
    
    const container = document.getElementById('asideProximasCitas');
    if (container) {
        container.innerHTML = '';
        citasHoy.slice(0, 3).forEach(cita => {
            container.innerHTML += `
                <div class="aside-cita">
                    <span class="aside-cita-hora">${cita.hora}</span>
                    <span class="aside-cita-paciente">${cita.paciente_nombre}</span>
                </div>
            `;
        });
        if (citasHoy.length === 0) {
            container.innerHTML = '<p class="muted">No hay citas hoy</p>';
        }
    }
    
    const completadas = App.citas?.filter(c => c.fecha === hoy && c.estado === 'completada').length || 0;
    const pendientes = App.citas?.filter(c => c.fecha === hoy && c.estado === 'pendiente').length || 0;
    
    document.getElementById('asideCitasHoy').textContent = citasHoy.length;
    document.getElementById('asideCompletadas').textContent = completadas;
    document.getElementById('asidePendientes').textContent = pendientes;
}

// ===== FUNCIONES AUXILIARES =====
async function cargarDatosIniciales() {
    await cargarPacientes();
    await cargarCitas('hoy');
    await cargarServicios();
}

function editarPaciente(id) {
    const paciente = App.pacientes.find(p => p.id == id);
    if (!paciente) return;
    
    document.getElementById('modalPacienteTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar Paciente';
    document.getElementById('pacienteId').value = paciente.id;
    document.getElementById('pacienteNombre').value = paciente.nombre || '';
    document.getElementById('pacienteTelefono').value = paciente.telefono || '';
    document.getElementById('pacienteEmail').value = paciente.email || '';
    document.getElementById('pacienteNacimiento').value = paciente.fecha_nacimiento || '';
    document.getElementById('pacienteDireccion').value = paciente.direccion || '';
    
    abrirModal('modalPaciente');
}

function editarCita(id) {
    const cita = App.citas.find(c => c.id == id);
    if (!cita) return;
    
    document.getElementById('modalCitaTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar Cita';
    document.getElementById('citaId').value = cita.id;
    
    const selectPaciente = document.getElementById('citaPacienteId');
    selectPaciente.innerHTML = '<option value="">Seleccionar paciente...</option>';
    App.pacientes.forEach(p => {
        selectPaciente.innerHTML += `<option value="${p.id}" ${p.id == cita.paciente_id ? 'selected' : ''}>${p.nombre}</option>`;
    });
    
    const selectServicio = document.getElementById('citaServicio');
    selectServicio.innerHTML = '<option value="">Seleccionar servicio...</option>';
    App.servicios.forEach(s => {
        selectServicio.innerHTML += `<option value="${s.id}" ${s.nombre == cita.servicio_nombre ? 'selected' : ''}>${s.nombre}</option>`;
    });
    
    document.getElementById('citaFecha').value = cita.fecha || '';
    document.getElementById('citaHora').value = cita.hora || '';
    document.getElementById('citaEstado').value = cita.estado || 'pendiente';
    document.getElementById('citaObservaciones').value = cita.observaciones || '';
    
    abrirModal('modalCita');
}

function abrirModalNuevoPaciente() {
    document.getElementById('modalPacienteTitulo').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Paciente';
    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
    abrirModal('modalPaciente');
}

function abrirModalNuevaCita() {
    document.getElementById('modalCitaTitulo').innerHTML = '<i class="fas fa-calendar-plus"></i> Nueva Cita';
    document.getElementById('formCita').reset();
    document.getElementById('citaId').value = '';
    
    const selectPaciente = document.getElementById('citaPacienteId');
    selectPaciente.innerHTML = '<option value="">Seleccionar paciente...</option>';
    App.pacientes.forEach(p => {
        selectPaciente.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
    
    const selectServicio = document.getElementById('citaServicio');
    selectServicio.innerHTML = '<option value="">Seleccionar servicio...</option>';
    App.servicios.forEach(s => {
        selectServicio.innerHTML += `<option value="${s.id}">${s.nombre}</option>`;
    });
    
    document.getElementById('citaFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('citaEstado').value = 'pendiente';
    
    abrirModal('modalCita');
}

function abrirModalNuevaCitaConServicio(servicioId) {
    abrirModalNuevaCita();
    document.getElementById('citaServicio').value = servicioId;
}

function confirmarEliminarPaciente(id) {
    if (confirm('¿Estás seguro de eliminar este paciente? Se eliminarán todas sus citas.')) {
        eliminarPaciente(id);
    }
}

function confirmarEliminarCita(id) {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
        cancelarCita(id);
    }
}

function cambiarPage(pageId) {
    document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) link.classList.add('active');
    });
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');
}

function exportarDatos() {
    const data = {
        pacientes: App.pacientes,
        citas: App.citas,
        exportado: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinica_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    mostrarNotificacion('Datos exportados con éxito', 'success');
}

function abrirModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function iniciarReloj() {
    function actualizar() {
        const ahora = new Date();
        const fechaStr = ahora.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const relojElement = document.getElementById('liveDatetime');
        if (relojElement) relojElement.textContent = fechaStr;
    }
    actualizar();
    setInterval(actualizar, 1000);
}

function iniciarEventos() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const success = await login(username, password);
            if (success) {
                verificarSesion();
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navegación
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (!App.currentUser) {
                mostrarNotificacion('Debes iniciar sesión', 'warning');
                return;
            }
            cambiarPage(this.dataset.page);
        });
    });
    
    // Formulario paciente
    const formPaciente = document.getElementById('formPaciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarPaciente();
        });
    }
    
    // Formulario cita
    const formCita = document.getElementById('formCita');
    if (formCita) {
        formCita.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCita();
        });
    }
    
    // Búsqueda
    const buscarInput = document.getElementById('buscarPaciente');
    if (buscarInput) {
        buscarInput.addEventListener('input', function() {
            cargarPacientes(this.value);
        });
    }
    
    // Filtro citas
    const filtroCitas = document.getElementById('filtroCitas');
    if (filtroCitas) {
        filtroCitas.addEventListener('change', function() {
            cargarCitas(this.value);
        });
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema iniciado - Etapa 3 con BD real');
    
    iniciarReloj();
    iniciarEventos();
    verificarSesion();
});