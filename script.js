// ==================== ESTADO GLOBAL ====================
let App = {
    usuarios: [
        { id: 1, username: 'admin', password: '1234', nombre: 'Dr. Administrador', rol: 'admin' },
        { id: 2, username: 'doctor', password: '1234', nombre: 'Dra. Martínez', rol: 'doctor' },
        { id: 3, username: 'recepcion', password: '1234', nombre: 'Ana Recepcionista', rol: 'recepcion' }
    ],
    currentUser: null,
    pacientes: [],
    citas: [],
    servicios: [
        { id: 1, nombre: 'Limpieza', duracion: 30, precio: 1500 },
        { id: 2, nombre: 'Blanqueamiento', duracion: 60, precio: 3500 },
        { id: 3, nombre: 'Ortodoncia', duracion: 45, precio: 2500 },
        { id: 4, nombre: 'Extracción', duracion: 30, precio: 2000 },
        { id: 5, nombre: 'Endodoncia', duracion: 90, precio: 5000 },
        { id: 6, nombre: 'Consulta', duracion: 20, precio: 800 }
    ],
    chartInstance: null,
    chartServicios: null,
    chartIngresos: null,
    itemToDelete: null
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    verificarSesion();
    inicializarEventos();
    iniciarReloj();
    if (App.currentUser) {
        actualizarInterfazPorRol();
        cambiarPage('dashboard');
    }
});

function guardarDatos() {
    localStorage.setItem('clinica_pacientes', JSON.stringify(App.pacientes));
    localStorage.setItem('clinica_citas', JSON.stringify(App.citas));
    localStorage.setItem('clinica_user', JSON.stringify(App.currentUser));
}

function cargarDatos() {
    const pacientesGuardados = localStorage.getItem('clinica_pacientes');
    if (pacientesGuardados) App.pacientes = JSON.parse(pacientesGuardados);
    const citasGuardadas = localStorage.getItem('clinica_citas');
    if (citasGuardadas) App.citas = JSON.parse(citasGuardadas);
    const userGuardado = localStorage.getItem('clinica_user');
    if (userGuardado) App.currentUser = JSON.parse(userGuardado);
    
    if (App.pacientes.length === 0) {
        App.pacientes = [
            { id: Date.now()-2000, nombre: 'María González', telefono: '809-555-1234', email: 'maria@gmail.com', nacimiento: '1985-06-15', direccion: 'Calle 1' },
            { id: Date.now()-3000, nombre: 'Carlos Pérez', telefono: '809-555-5678', email: 'carlos@gmail.com', nacimiento: '1978-03-22', direccion: 'Calle 2' }
        ];
        const hoy = new Date().toISOString().slice(0,10);
        App.citas = [
            { id: Date.now()-100, pacienteId: App.pacientes[0].id, pacienteNombre: App.pacientes[0].nombre, servicio: 'Limpieza', fecha: hoy, hora: '09:00', estado: 'confirmada', observaciones: '' },
            { id: Date.now()-200, pacienteId: App.pacientes[1].id, pacienteNombre: App.pacientes[1].nombre, servicio: 'Consulta', fecha: hoy, hora: '10:30', estado: 'pendiente', observaciones: '' }
        ];
        guardarDatos();
    }
}

// ==================== AUTENTICACIÓN ====================
function verificarSesion() {
    const modal = document.getElementById('loginModal');
    const logoutBtn = document.getElementById('logoutBtn');
    if (App.currentUser) {
        modal.style.display = 'none';
        logoutBtn.style.display = 'block';
        document.getElementById('userNameDisplay').textContent = App.currentUser.nombre;
        document.getElementById('userRoleDisplay').innerHTML = `Sistema Interno • <span>${App.currentUser.rol}</span>`;
    } else {
        modal.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }
}

function inicializarEventos() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const user = App.usuarios.find(u => u.username === username && u.password === password);
        if (user) {
            App.currentUser = { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol };
            guardarDatos();
            verificarSesion();
            actualizarInterfazPorRol();
            cambiarPage('dashboard');
            mostrarNotificacion(`Bienvenido ${user.nombre}`, 'success');
        } else {
            mostrarNotificacion('Usuario o contraseña incorrectos', 'error');
        }
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
        App.currentUser = null;
        localStorage.removeItem('clinica_user');
        verificarSesion();
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        mostrarNotificacion('Sesión cerrada', 'info');
    });
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!App.currentUser) { mostrarNotificacion('Inicia sesión', 'warning'); return; }
            cambiarPage(link.dataset.page);
        });
    });
    document.getElementById('buscarPaciente')?.addEventListener('input', (e) => filtrarPacientes(e.target.value));
    document.getElementById('filtroCitas')?.addEventListener('change', (e) => cargarTablaCitas(e.target.value));
    document.getElementById('formPaciente')?.addEventListener('submit', (e) => { e.preventDefault(); guardarPaciente(); });
    document.getElementById('formCita')?.addEventListener('submit', (e) => { e.preventDefault(); guardarCita(); });
}

function actualizarInterfazPorRol() { /* placeholder */ }

function cambiarPage(pageId) {
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav__link[data-page="${pageId}"]`).classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    if (pageId === 'dashboard') actualizarDashboard();
    if (pageId === 'pacientes') cargarTablaPacientes();
    if (pageId === 'citas') cargarTablaCitas(document.getElementById('filtroCitas').value);
    if (pageId === 'servicios') cargarServicios();
    if (pageId === 'reportes') cargarReportes();
    cargarAside();
}

// ==================== DASHBOARD ====================
function actualizarDashboard() {
    const hoy = new Date().toISOString().slice(0,10);
    const citasHoy = App.citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada');
    document.getElementById('citasHoyCount').textContent = citasHoy.length;
    document.getElementById('totalPacientes').textContent = App.pacientes.length;
    const manana = new Date(); manana.setDate(manana.getDate()+1);
    const prox = App.citas.filter(c => c.fecha >= hoy && c.fecha <= manana.toISOString().slice(0,10) && c.estado !== 'cancelada');
    document.getElementById('proximasCitasCount').textContent = prox.length;
    const ingresos = citasHoy.reduce((sum, c) => sum + (App.servicios.find(s => s.nombre === c.servicio)?.precio || 800), 0);
    document.getElementById('ingresosHoy').textContent = `RD$ ${ingresos.toLocaleString()}`;
    
    const ctx = document.getElementById('citasChart').getContext('2d');
    const ultimas7 = [];
    const valores = [];
    for (let i=6; i>=0; i--) {
        let f = new Date(); f.setDate(f.getDate()-i);
        let fs = f.toISOString().slice(0,10);
        ultimas7.push(fs.slice(5));
        valores.push(App.citas.filter(c => c.fecha === fs).length);
    }
    if (App.chartInstance) App.chartInstance.destroy();
    App.chartInstance = new Chart(ctx, { type: 'line', data: { labels: ultimas7, datasets: [{ label: 'Citas', data: valores, borderColor: '#F68121', tension: 0.3, fill: true }] }, options: { responsive: true } });
    
    const lista = document.getElementById('proximasCitasLista');
    lista.innerHTML = '';
    prox.slice(0,4).forEach(c => {
        lista.innerHTML += `<div class="appointment-item"><div class="appointment-time">${c.hora}</div><div><strong>${c.pacienteNombre}</strong><br><small>${c.servicio}</small></div><span class="estado-badge estado-${c.estado}">${c.estado}</span></div>`;
    });
}

// ==================== PACIENTES ====================
function cargarTablaPacientes() {
    const tbody = document.getElementById('tablaPacientes');
    tbody.innerHTML = '';
    App.pacientes.forEach(p => {
        const ultima = App.citas.filter(c => c.pacienteId === p.id && c.estado === 'completada').sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
        tbody.innerHTML += `<tr><td>${p.id.toString().slice(-6)}</td><td><strong>${p.nombre}</strong></td><td>${p.telefono}</td><td>${p.email || '-'}</td><td>${p.nacimiento || '-'}</td><td>${ultima?.fecha || 'Nunca'}</td><td class="acciones"><button class="btn-icon" onclick="editarPaciente(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-icon" onclick="confirmarEliminarPaciente(${p.id})"><i class="fas fa-trash"></i></button><button class="btn-icon" onclick="abrirModalNuevaCitaConPaciente(${p.id})"><i class="fas fa-calendar-plus"></i></button></td></tr>`;
    });
}
function filtrarPacientes(texto) {
    const rows = document.querySelectorAll('#tablaPacientes tr');
    texto = texto.toLowerCase();
    rows.forEach(row => {
        const nombre = row.cells[1]?.textContent.toLowerCase() || '';
        const tel = row.cells[2]?.textContent.toLowerCase() || '';
        row.style.display = nombre.includes(texto) || tel.includes(texto) ? '' : 'none';
    });
}
function abrirModalNuevoPaciente() {
    document.getElementById('modalPacienteTitulo').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Paciente';
    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
    abrirModal('modalPaciente');
}
function editarPaciente(id) {
    const p = App.pacientes.find(p => p.id === id);
    if(!p) return;
    document.getElementById('modalPacienteTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar Paciente';
    document.getElementById('pacienteId').value = p.id;
    document.getElementById('pacienteNombre').value = p.nombre;
    document.getElementById('pacienteTelefono').value = p.telefono;
    document.getElementById('pacienteEmail').value = p.email || '';
    document.getElementById('pacienteNacimiento').value = p.nacimiento || '';
    document.getElementById('pacienteDireccion').value = p.direccion || '';
    abrirModal('modalPaciente');
}
function guardarPaciente() {
    const id = document.getElementById('pacienteId').value;
    const paciente = {
        id: id ? parseInt(id) : Date.now(),
        nombre: document.getElementById('pacienteNombre').value,
        telefono: document.getElementById('pacienteTelefono').value,
        email: document.getElementById('pacienteEmail').value,
        nacimiento: document.getElementById('pacienteNacimiento').value,
        direccion: document.getElementById('pacienteDireccion').value
    };
    if(!paciente.nombre || !paciente.telefono) { mostrarNotificacion('Nombre y teléfono son obligatorios', 'warning'); return; }
    if(id) {
        const idx = App.pacientes.findIndex(p => p.id == id);
        if(idx !== -1) App.pacientes[idx] = paciente;
    } else App.pacientes.push(paciente);
    guardarDatos();
    cargarTablaPacientes();
    actualizarDashboard();
    cerrarModal('modalPaciente');
    mostrarNotificacion('Paciente guardado', 'success');
}
function confirmarEliminarPaciente(id) {
    App.itemToDelete = { type: 'paciente', id };
    document.getElementById('confirmarMensaje').innerHTML = '¿Eliminar paciente y sus citas?';
    abrirModal('modalConfirmar');
    document.getElementById('confirmarEliminarBtn').onclick = () => {
        eliminarPaciente(id);
        cerrarModal('modalConfirmar');
    };
}
function eliminarPaciente(id) {
    App.citas = App.citas.filter(c => c.pacienteId !== id);
    App.pacientes = App.pacientes.filter(p => p.id !== id);
    guardarDatos();
    cargarTablaPacientes();
    cargarTablaCitas('hoy');
    actualizarDashboard();
    cargarAside();
    mostrarNotificacion('Paciente eliminado', 'info');
}

// ==================== CITAS ====================
function cargarTablaCitas(filtro = 'hoy') {
    const tbody = document.getElementById('tablaCitas');
    tbody.innerHTML = '';
    const hoy = new Date().toISOString().slice(0,10);
    let citasFiltradas = [...App.citas];
    if(filtro === 'hoy') citasFiltradas = citasFiltradas.filter(c => c.fecha === hoy);
    else if(filtro === 'semana') {
        const semana = [];
        for(let i=0;i<7;i++) { let d = new Date(); d.setDate(d.getDate()+i); semana.push(d.toISOString().slice(0,10)); }
        citasFiltradas = citasFiltradas.filter(c => semana.includes(c.fecha));
    }
    citasFiltradas.sort((a,b)=> a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
    citasFiltradas.forEach(c => {
        tbody.innerHTML += `<tr><td>${c.fecha}</td><td>${c.hora}</td><td>${c.pacienteNombre}</td><td>${c.servicio}</td><td><span class="estado-badge estado-${c.estado}">${c.estado}</span></td><td class="acciones"><button class="btn-icon" onclick="editarCita(${c.id})"><i class="fas fa-edit"></i></button><button class="btn-icon" onclick="confirmarEliminarCita(${c.id})"><i class="fas fa-times-circle"></i></button></td></tr>`;
    });
}
function abrirModalNuevaCita() {
    document.getElementById('modalCitaTitulo').innerHTML = '<i class="fas fa-calendar-plus"></i> Nueva Cita';
    document.getElementById('formCita').reset();
    document.getElementById('citaId').value = '';
    const selectPac = document.getElementById('citaPacienteId');
    selectPac.innerHTML = '<option value="">Seleccionar paciente...</option>';
    App.pacientes.forEach(p => selectPac.innerHTML += `<option value="${p.id}">${p.nombre}</option>`);
    document.getElementById('citaFecha').value = new Date().toISOString().slice(0,10);
    document.getElementById('citaEstado').value = 'pendiente';
    abrirModal('modalCita');
}
function abrirModalNuevaCitaConPaciente(pacienteId) {
    abrirModalNuevaCita();
    document.getElementById('citaPacienteId').value = pacienteId;
}
function editarCita(id) {
    const c = App.citas.find(c => c.id === id);
    if(!c) return;
    document.getElementById('modalCitaTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar Cita';
    document.getElementById('citaId').value = c.id;
    const selectPac = document.getElementById('citaPacienteId');
    selectPac.innerHTML = '<option value="">Seleccionar...</option>';
    App.pacientes.forEach(p => selectPac.innerHTML += `<option value="${p.id}" ${p.id === c.pacienteId ? 'selected' : ''}>${p.nombre}</option>`);
    document.getElementById('citaServicio').value = c.servicio;
    document.getElementById('citaFecha').value = c.fecha;
    document.getElementById('citaHora').value = c.hora;
    document.getElementById('citaEstado').value = c.estado;
    document.getElementById('citaObservaciones').value = c.observaciones || '';
    abrirModal('modalCita');
}
function guardarCita() {
    const id = document.getElementById('citaId').value;
    const pacienteId = parseInt(document.getElementById('citaPacienteId').value);
    const paciente = App.pacientes.find(p => p.id === pacienteId);
    if(!paciente) { mostrarNotificacion('Selecciona un paciente', 'error'); return; }
    const hora = document.getElementById('citaHora').value;
    const horaNum = parseInt(hora.split(':')[0]);
    if(horaNum < 8 || horaNum >= 17) { mostrarNotificacion('Horario 8:00-17:00', 'warning'); return; }
    const fecha = document.getElementById('citaFecha').value;
    const duplicada = App.citas.find(c => c.fecha === fecha && c.hora === hora && c.id != id && c.estado !== 'cancelada');
    if(duplicada) { mostrarNotificacion('Horario ocupado', 'error'); return; }
    const cita = {
        id: id ? parseInt(id) : Date.now(),
        pacienteId,
        pacienteNombre: paciente.nombre,
        servicio: document.getElementById('citaServicio').value,
        fecha,
        hora,
        estado: document.getElementById('citaEstado').value,
        observaciones: document.getElementById('citaObservaciones').value
    };
    if(id) {
        const idx = App.citas.findIndex(c => c.id == id);
        if(idx !== -1) App.citas[idx] = cita;
    } else App.citas.push(cita);
    guardarDatos();
    cargarTablaCitas(document.getElementById('filtroCitas')?.value || 'hoy');
    actualizarDashboard();
    cargarAside();
    cerrarModal('modalCita');
    mostrarNotificacion('Cita guardada', 'success');
}
function confirmarEliminarCita(id) {
    App.itemToDelete = { type: 'cita', id };
    document.getElementById('confirmarMensaje').innerHTML = '¿Cancelar esta cita?';
    abrirModal('modalConfirmar');
    document.getElementById('confirmarEliminarBtn').onclick = () => {
        App.citas = App.citas.filter(c => c.id !== id);
        guardarDatos();
        cargarTablaCitas(document.getElementById('filtroCitas')?.value || 'hoy');
        actualizarDashboard();
        cargarAside();
        cerrarModal('modalConfirmar');
        mostrarNotificacion('Cita cancelada', 'info');
    };
}

// ==================== SERVICIOS ====================
function cargarServicios() {
    const cont = document.getElementById('serviciosLista');
    cont.innerHTML = '';
    App.servicios.forEach(s => {
        cont.innerHTML += `<div class="servicio-card"><div class="servicio-icon">🦷</div><h3>${s.nombre}</h3><div class="servicio-detalles"><span>${s.duracion} min</span><span>RD$${s.precio}</span></div><button class="btn-small" onclick="abrirModalNuevaCita()">Agendar</button></div>`;
    });
}

// ==================== REPORTES ====================
function cargarReportes() {
    const ctxServ = document.getElementById('chartServicios')?.getContext('2d');
    if(ctxServ) {
        const counts = {};
        App.citas.forEach(c => counts[c.servicio] = (counts[c.servicio] || 0) + 1);
        if(App.chartServicios) App.chartServicios.destroy();
        App.chartServicios = new Chart(ctxServ, { type: 'pie', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#F68121','#0b1838','#34d399','#f59e0b','#6366f1'] }] } });
    }
    const ctxIng = document.getElementById('chartIngresos')?.getContext('2d');
    if(ctxIng) {
        const meses = ['Ene','Feb','Mar','Abr','May','Jun'];
        if(App.chartIngresos) App.chartIngresos.destroy();
        App.chartIngresos = new Chart(ctxIng, { type: 'bar', data: { labels: meses, datasets: [{ label: 'RD$', data: [45000,52000,48000,61000,58000,72000], backgroundColor: '#0b1838' }] } });
    }
}
function generarReporte() { cargarReportes(); }

// ==================== ASIDE ====================
function cargarAside() {
    const hoy = new Date().toISOString().slice(0,10);
    const citasHoy = App.citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada');
    const cont = document.getElementById('asideProximasCitas');
    cont.innerHTML = '';
    citasHoy.slice(0,3).forEach(c => cont.innerHTML += `<div class="aside-cita"><span class="aside-cita-hora">${c.hora}</span><span>${c.pacienteNombre}</span></div>`);
    if(citasHoy.length===0) cont.innerHTML = '<p class="muted">Sin citas hoy</p>';
    const alertas = document.getElementById('alertasContainer');
    alertas.innerHTML = '';
    const sinCita = App.pacientes.filter(p => !App.citas.some(c => c.pacienteId === p.id && c.fecha >= hoy));
    if(sinCita.length>2) alertas.innerHTML += `<div class="alerta"><i class="fas fa-info-circle"></i> ${sinCita.length} pacientes sin cita reciente</div>`;
    const completadas = App.citas.filter(c => c.fecha === hoy && c.estado === 'completada').length;
    const pendientes = App.citas.filter(c => c.fecha === hoy && c.estado === 'pendiente').length;
    document.getElementById('asideCitasHoy').textContent = citasHoy.length;
    document.getElementById('asideCompletadas').textContent = completadas;
    document.getElementById('asidePendientes').textContent = pendientes;
}

// ==================== UTILIDADES ====================
function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }
function iniciarReloj() {
    setInterval(() => {
        const ahora = new Date();
        document.getElementById('liveDatetime').textContent = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
}
function mostrarNotificacion(msg, tipo) {
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.innerHTML = `<i class="fas ${tipo==='success'?'fa-check-circle':'fa-info-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => { notif.classList.remove('show'); setTimeout(() => notif.remove(), 300); }, 3000);
}
function exportarDatos() {
    const data = { pacientes: App.pacientes, citas: App.citas, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clinica_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    mostrarNotificacion('Datos exportados', 'success');
}
