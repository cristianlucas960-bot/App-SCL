// =================================================================
// --- UTILIDADES ---
// =================================================================

// Escapa texto para que no rompa el HTML al usar innerHTML
function esc(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

// Agrega un evento solo si el elemento existe
function on(id, eventName, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(eventName, handler);
}

function formatMoney(value) {
    return '$' + (Number(value) || 0).toLocaleString('es-AR');
}

// Devuelve el texto actual del buscador (o '' si no existe)
function getSearchValue() {
    const search = document.getElementById('search-input');
    return search ? search.value : '';
}

// =================================================================
// --- CONTROLADOR DE DATOS INTERNOS (LOCALSTORAGE) ---
// =================================================================
const DEFAULT_SERVICES = [
    { name: "Instalación de Windows 11", price: 20000 },
    { name: "Formateo + SO + Apps", price: 12000 },
    { name: "Limpieza + Pasta Térmica", price: 6000 },
    { name: "Instalación de Office", price: 3500 },
    { name: "Cambio Pantalla/Teclado", price: 5000 },
    { name: "Diagnóstico de Hardware", price: 2500 }
];

const AppData = {
    getJobs() {
        try {
            const data = JSON.parse(localStorage.getItem('lucas_tech_jobs'));
            return Array.isArray(data) ? data : [];
        } catch (err) {
            return [];
        }
    },
    saveJobs(jobs) {
        try {
            localStorage.setItem('lucas_tech_jobs', JSON.stringify(jobs));
        } catch (err) {
            alert('No se pudo guardar la información (almacenamiento lleno o bloqueado).');
        }
    },
    getServices() {
        try {
            const data = JSON.parse(localStorage.getItem('lucas_tech_services'));
            return Array.isArray(data) ? data : DEFAULT_SERVICES;
        } catch (err) {
            return DEFAULT_SERVICES;
        }
    },
    saveServices(services) {
        try {
            localStorage.setItem('lucas_tech_services', JSON.stringify(services));
        } catch (err) {
            alert('No se pudo guardar la información (almacenamiento lleno o bloqueado).');
        }
    }
};

let activeModalId = null;

// =================================================================
// --- WHATSAPP ---
// =================================================================
function buildWhatsAppUrl(phone, client, device) {
    let cleanPhone = String(phone).replace(/\D/g, '');

    // Normalización para Argentina: wa.me necesita código de país (54) y el 9 para celulares.
    // Si el número no empieza con 54, se asume local: se quita el 0 inicial y se antepone 549.
    if (!cleanPhone.startsWith('54')) {
        cleanPhone = '549' + cleanPhone.replace(/^0+/, '');
    }

    const message = `Hola *${client}*, te avisamos desde el taller que tu equipo *${device}* ya está listo. Podés pasar a retirarlo cuando gustes. 🛠️`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// =================================================================
// --- CALCULADORA ---
// =================================================================
function getCalcTotal() {
    const hwIn = document.getElementById('calc-hardware');
    const lbIn = document.getElementById('calc-labor');
    const hw = parseFloat(hwIn && hwIn.value) || 0;
    const lb = parseFloat(lbIn && lbIn.value) || 0;
    return hw + lb;
}

function updateCalculator() {
    const result = document.getElementById('calc-result');
    if (result) result.textContent = formatMoney(getCalcTotal());
}

// =================================================================
// --- RENDERIZADORES DE LA INTERFAZ ---
// =================================================================
function renderServices(editIndex = null) {
    const tbody = document.getElementById('prices-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    AppData.getServices().forEach((service, i) => {
        const tr = document.createElement('tr');

        if (i === editIndex) {
            // Fila en modo edición: nombre y precio editables
            tr.innerHTML = `
                <td><input type="text" class="edit-name" value="${esc(service.name)}" aria-label="Nombre del servicio"></td>
                <td><input type="number" class="edit-price" value="${Number(service.price) || 0}" min="0" step="any" aria-label="Precio del servicio"></td>
                <td><div class="svc-actions">
                    <button type="button" class="svc-btn btn-save-service" data-index="${i}" aria-label="Guardar cambios" title="Guardar">✔️</button>
                    <button type="button" class="svc-btn btn-cancel-service" aria-label="Cancelar" title="Cancelar">✖️</button>
                </div></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${esc(service.name)}</td>
                <td class="price-green">${formatMoney(service.price)}</td>
                <td><div class="svc-actions">
                    <button type="button" class="svc-btn btn-load-service" data-price="${Number(service.price) || 0}" aria-label="Cargar precio de ${esc(service.name)}" title="Cargar en el presupuesto">➕</button>
                    <button type="button" class="svc-btn btn-edit-service" data-index="${i}" aria-label="Editar ${esc(service.name)}" title="Editar">✏️</button>
                    <button type="button" class="svc-btn btn-delete-service" data-index="${i}" aria-label="Eliminar ${esc(service.name)}" title="Eliminar">🗑️</button>
                </div></td>
            `;
        }
        tbody.appendChild(tr);
    });

    if (editIndex !== null) {
        const input = tbody.querySelector('.edit-price');
        if (input) { input.focus(); input.select(); }
    }
}

// Guarda los cambios de la fila que se está editando
function guardarServicioEditado(index) {
    const tbody = document.getElementById('prices-body');
    const name = tbody.querySelector('.edit-name').value.trim();
    const price = parseFloat(tbody.querySelector('.edit-price').value);

    if (!name || isNaN(price) || price < 0) {
        alert('Ingresá un nombre y un precio válido (0 o más).');
        return;
    }

    const services = AppData.getServices().map(s => ({ ...s }));
    if (!services[index]) return;
    services[index] = { name, price };
    AppData.saveServices(services);
    renderServices();
}

function renderJobs(filter = '') {
    const list = document.getElementById('jobs-list');
    const table = document.getElementById('table-body');

    if (list) list.innerHTML = '';
    if (table) table.innerHTML = '';

    const jobs = AppData.getJobs();
    const query = String(filter).toLowerCase();

    // 1. Tarjetas activas (columna derecha)
    const activeJobs = jobs.filter(j =>
        String(j.client || '').toLowerCase().includes(query) ||
        String(j.device || '').toLowerCase().includes(query)
    );

    if (list) {
        if (activeJobs.length === 0) {
            list.innerHTML = `<li style="text-align:center; padding:20px; color:var(--text-muted);">${filter ? 'No se encontraron resultados' : 'Sin órdenes activas'}</li>`;
        } else {
            activeJobs.forEach(job => {
                const li = document.createElement('li');
                li.className = 'job-item';

                let waBtn = '';
                if (job.status === 'done') {
                    waBtn = `<a href="${buildWhatsAppUrl(job.phone, job.client, job.device)}" target="_blank" rel="noopener" class="btn-whatsapp-ready">📲 Notificar al Cliente</a>`;
                }

                li.innerHTML = `
                    <div class="job-header">
                        <span>Cliente: ${esc(job.client)}</span>
                        <button type="button" class="btn-delete-card" data-id="${esc(job.id)}" aria-label="Eliminar orden de ${esc(job.client)}" style="background:none; border:none; color:#f38ba8; cursor:pointer;">✕</button>
                    </div>
                    <div class="job-meta">Dispositivo: ${esc(job.device)}</div>
                    <div style="font-size:0.85rem; margin-bottom:8px; color:var(--text-muted);">${esc(job.fault)}</div>
                    <div class="status-footer">
                        <select class="status-select sel-${esc(job.status)}" data-id="${esc(job.id)}" aria-label="Estado de la orden">
                            <option value="pending" ${job.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="progress" ${job.status === 'progress' ? 'selected' : ''}>En Proceso</option>
                            <option value="done" ${job.status === 'done' ? 'selected' : ''}>Listo</option>
                        </select>
                        ${waBtn}
                    </div>
                `;
                list.appendChild(li);
            });
        }
    }

    // 2. Base de datos histórica (tabla inferior)
    if (table) {
        if (jobs.length === 0) {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Base de datos vacía</td></tr>`;
            return;
        }

        jobs.forEach(job => {
            const tr = document.createElement('tr');
            let badge = `<span class="badge badge-pending">Pendiente</span>`;
            if (job.status === 'progress') badge = `<span class="badge badge-progress">En Proceso</span>`;
            if (job.status === 'done') badge = `<span class="badge badge-done">Listo</span>`;

            tr.innerHTML = `
                <td style="font-weight:bold; color:#fff;">${esc(job.client)}</td>
                <td>${esc(job.device)}</td>
                <td>${esc(job.phone)}</td>
                <td>${esc(job.date || '—')}</td>
                <td>${badge}</td>
                <td class="price-green">${formatMoney(job.totalAmount)}</td>
                <td><button type="button" class="btn-table-action view-btn" data-id="${esc(job.id)}">⚙️ Ver</button></td>
            `;
            table.appendChild(tr);
        });
    }
}

// =================================================================
// --- MODAL DE FICHA TÉCNICA ---
// =================================================================
function closeModal() {
    const modal = document.getElementById('details-modal');
    if (modal) modal.classList.remove('active');
    activeModalId = null;
    renderJobs(getSearchValue());
}

// =================================================================
// --- LOGIN / ACTIVACIÓN ---
// =================================================================
// ---------------------------------------------------------------
// LICENCIA POR EQUIPO (firma digital ECDSA P-256)
// En el código solo está la clave PÚBLICA: sirve para verificar licencias pero no para crearlas.
// Las licencias se generan con generar_licencia.js (herramienta privada del dueño).
// ---------------------------------------------------------------
const LICENSE_PUBLIC_KEY = {"kty":"EC","crv":"P-256","x":"kzdnBcGMabKVPOQt7VrYI3Q-wK5kbEv3UP7T7ngkN1w","y":"5vVlHnWYjYYH4Ci2EgnJtNJktKKP_KIOE3iXkkcikjE"};

// ID único de este equipo/navegador (se genera una vez)
function getInstallId() {
    try {
        let id = localStorage.getItem('lkt_install_id');
        if (!id) {
            const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)))
                .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            id = `LKT-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
            localStorage.setItem('lkt_install_id', id);
        }
        return id;
    } catch (err) {
        return 'LKT-0000-0000-0000';
    }
}

function base64UrlToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// Verifica que "firma" haya sido emitida por el dueño para "mensaje"
async function verificarFirma(mensaje, firma) {
    try {
        if (!(window.crypto && crypto.subtle)) return false;
        const key = await crypto.subtle.importKey('jwk', LICENSE_PUBLIC_KEY,
            { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
        return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key,
            base64UrlToBytes(String(firma).trim()), new TextEncoder().encode(mensaje));
    } catch (err) {
        return false;
    }
}

function clienteTieneClave() {
    try { return !!localStorage.getItem('clave_taller_cliente'); } catch (err) { return false; }
}

function sesionClienteActiva() {
    try { return sessionStorage.getItem('cliente_sesion') === "SI"; } catch (err) { return false; }
}

function ocultarLogin() {
    const pantalla = document.getElementById('pantalla-login');
    if (pantalla) pantalla.style.display = "none";
}

function mostrarLoginCliente() {
    const pantalla = document.getElementById('pantalla-cliente');
    if (pantalla) pantalla.style.display = "flex";
    const input = document.getElementById('input-clave-cliente');
    if (input) { input.value = ""; input.focus(); }
}

function ocultarLoginCliente() {
    const pantalla = document.getElementById('pantalla-cliente');
    if (pantalla) pantalla.style.display = "none";
}

// Pide la contraseña del cliente solo si ya creó una y aún no ingresó en esta sesión
function verificarClienteAlIniciar() {
    if (clienteTieneClave() && !sesionClienteActiva()) mostrarLoginCliente();
    else ocultarLoginCliente();
}

function abrirConfig() {
    const modal = document.getElementById('modal-config-cliente');
    const input = document.getElementById('nueva-clave-input');
    if (modal) modal.style.display = "flex";
    const nombreInput = document.getElementById('nombre-taller-input');
    if (nombreInput) nombreInput.value = getNombreTaller();
    if (input) { input.value = ""; input.type = "password"; input.focus(); }
    const ojo = document.getElementById('btn-ver-nueva-clave');
    if (ojo) ojo.textContent = '👁️';
}

// Al iniciar: la licencia guardada se vuelve a verificar SIEMPRE (no alcanza con un "SI" guardado)
async function iniciarAcceso() {
    const input = document.getElementById('input-password');
    const hwId = document.getElementById('hardware-id-display');
    if (hwId) hwId.textContent = getInstallId();

    let licencia = null;
    try { licencia = localStorage.getItem('lkt_license'); } catch (err) { /* ignorar */ }

    if (licencia && await verificarFirma('LICENSE|' + getInstallId(), licencia)) {
        ocultarLogin();
        verificarClienteAlIniciar();
    } else {
        ocultarLoginCliente();
        if (input) input.focus();
    }
}

// ACTIVACIÓN: la clave ingresada debe ser una licencia firmada para ESTE equipo
async function validarAccesoTaller() {
    const input = document.getElementById('input-password');
    const errorMensaje = document.getElementById('error-login');
    if (!input) return;

    if (!(window.crypto && crypto.subtle)) {
        if (errorMensaje) {
            errorMensaje.textContent = 'Este navegador no permite verificar la licencia. Usá Chrome o Edge actualizado.';
            errorMensaje.style.display = "block";
        }
        return;
    }

    const clave = input.value.trim();
    if (clave && await verificarFirma('LICENSE|' + getInstallId(), clave)) {
        try { localStorage.setItem('lkt_license', clave); } catch (err) { /* ignorar */ }
        if (errorMensaje) errorMensaje.style.display = "none";
        ocultarLogin();

        // Primera activación: se invita al cliente a crear su propia contraseña
        if (!clienteTieneClave()) abrirConfig();
        else verificarClienteAlIniciar();
    } else {
        if (errorMensaje) {
            errorMensaje.textContent = clave.length < 80
                ? 'Eso no es una licencia. Pedila al soporte enviando el ID de este equipo.'
                : 'Licencia inválida para este equipo';
            errorMensaje.style.display = "block";
        }
        input.value = "";
        input.focus();
    }
}

// LOGIN DEL CLIENTE: contra la contraseña que él creó
function validarClienteLogin() {
    const input = document.getElementById('input-clave-cliente');
    const errorMensaje = document.getElementById('error-clave-cliente');
    if (!input) return;

    if (input.value === localStorage.getItem('clave_taller_cliente')) {
        try { sessionStorage.setItem('cliente_sesion', "SI"); } catch (err) { /* ignorar */ }
        if (errorMensaje) errorMensaje.style.display = "none";
        ocultarLoginCliente();
    } else {
        if (errorMensaje) errorMensaje.style.display = "block";
        input.value = "";
        input.focus();
    }
}

// Contraseña olvidada: el dueño genera un código de restablecimiento para ESTE equipo
async function olvidoClaveCliente() {
    const codigo = prompt('Ingresá el código de restablecimiento que te entregó el soporte técnico.\nID de este equipo: ' + getInstallId());
    if (codigo === null) return;

    if (await verificarFirma('RESET|' + getInstallId(), codigo)) {
        localStorage.removeItem('clave_taller_cliente');
        try { sessionStorage.setItem('cliente_sesion', "SI"); } catch (err) { /* ignorar */ }
        ocultarLoginCliente();
        alert('Contraseña restablecida. Creá una nueva desde el engranaje ⚙️.');
    } else {
        alert('Código de restablecimiento inválido para este equipo.');
    }
}

const NOMBRE_TALLER_DEFECTO = 'Lucas Tech Support';

function getNombreTaller() {
    try { return localStorage.getItem('nombre_taller') || NOMBRE_TALLER_DEFECTO; } catch (err) { return NOMBRE_TALLER_DEFECTO; }
}

// Muestra el nombre del taller en el título del panel, la pestaña y la pantalla de contraseña
function aplicarNombreTaller() {
    const nombre = getNombreTaller();
    const titulo = document.getElementById('nombre-taller');
    if (titulo) titulo.textContent = nombre;
    const login = document.getElementById('nombre-taller-login');
    if (login) login.textContent = nombre;
    document.title = nombre + ' - Panel de Control';
}

// Guarda el nombre del taller y/o la nueva contraseña (la contraseña vacía = no cambiarla)
function guardarConfiguracion() {
    const nombreInput = document.getElementById('nombre-taller-input');
    const claveInput = document.getElementById('nueva-clave-input');
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const clave = claveInput ? claveInput.value.trim() : '';
    const cambios = [];

    if (nombre && nombre !== getNombreTaller()) {
        localStorage.setItem('nombre_taller', nombre);
        aplicarNombreTaller();
        cambios.push('el nombre del taller');
    }
    if (clave) {
        localStorage.setItem('clave_taller_cliente', clave);
        try { sessionStorage.setItem('cliente_sesion', "SI"); } catch (err) { /* ignorar */ }
        cambios.push('la contraseña');
    }

    const modal = document.getElementById('modal-config-cliente');
    if (modal) modal.style.display = "none";
    if (cambios.length) alert('Se actualizó ' + cambios.join(' y ') + ' correctamente.');
}

// Alterna mostrar/ocultar en un campo de contraseña
function alternarVisibilidad(inputId, boton) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    boton.textContent = mostrar ? '🙈' : '👁️';
}

// =================================================================
// --- INICIALIZACIÓN (se ejecuta cuando el HTML ya está cargado) ---
// =================================================================
function init() {
    // --- Activación por licencia ---
    iniciarAcceso();

    on('btn-ingresar', 'click', validarAccesoTaller);
    on('input-password', 'keydown', function (e) {
        if (e.key === 'Enter') validarAccesoTaller();
    });
    on('btn-ver-password', 'click', function () {
        alternarVisibilidad('input-password', this);
    });

    // --- Login del cliente ---
    on('btn-entrar-cliente', 'click', validarClienteLogin);
    on('input-clave-cliente', 'keydown', function (e) {
        if (e.key === 'Enter') validarClienteLogin();
    });
    on('btn-ver-clave-cliente', 'click', function () {
        alternarVisibilidad('input-clave-cliente', this);
    });
    on('btn-olvide-clave', 'click', olvidoClaveCliente);

    // --- Configuración de contraseña del cliente ---
    on('btn-abrir-config', 'click', abrirConfig);
    on('btn-cancelar-config', 'click', () => {
        const modal = document.getElementById('modal-config-cliente');
        if (modal) modal.style.display = "none";
    });
    on('btn-guardar-config', 'click', guardarConfiguracion);
    on('btn-ver-nueva-clave', 'click', function () {
        alternarVisibilidad('nueva-clave-input', this);
    });
    on('nueva-clave-input', 'keydown', function (e) {
        if (e.key === 'Enter') guardarConfiguracion();
    });
    on('nombre-taller-input', 'keydown', function (e) {
        if (e.key === 'Enter') guardarConfiguracion();
    });

    // --- Calculadora ---
    on('calc-hardware', 'input', updateCalculator);
    on('calc-labor', 'input', updateCalculator);

    // --- Registrar nueva orden ---
    on('job-form', 'submit', function (e) {
        e.preventDefault();

        const client = document.getElementById('client').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const device = document.getElementById('device').value.trim();
        const fault = document.getElementById('fault').value.trim();

        if (!client || !phone || !device) {
            alert('Completá al menos cliente, teléfono y equipo.');
            return;
        }

        const jobs = AppData.getJobs();
        jobs.push({
            id: 'id_' + Date.now(),
            client,
            phone,
            device,
            fault,
            date: new Date().toLocaleDateString('es-AR'),
            status: 'pending',
            totalAmount: getCalcTotal(),
            notes: ''
        });
        AppData.saveJobs(jobs);
        this.reset();

        // Reiniciar también la calculadora
        const hwIn = document.getElementById('calc-hardware');
        const lbIn = document.getElementById('calc-labor');
        if (hwIn) hwIn.value = '';
        if (lbIn) lbIn.value = '';
        updateCalculator();

        renderJobs(getSearchValue());
    });

    // --- Añadir servicio a la lista de precios ---
    on('btn-add-price', 'click', function () {
        const nameInput = document.getElementById('new-service-name');
        const priceInput = document.getElementById('new-service-price');
        if (!nameInput || !priceInput) return;

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        if (!name || isNaN(price) || price < 0) return;

        const services = AppData.getServices().slice(); // copia, no modifica los valores por defecto
        services.push({ name, price });
        AppData.saveServices(services);

        nameInput.value = '';
        priceInput.value = '';
        renderServices();
    });

    // --- Cambio de estado en las tarjetas ---
    on('jobs-list', 'change', function (e) {
        if (e.target.classList.contains('status-select')) {
            const jobs = AppData.getJobs();
            const item = jobs.find(j => j.id === e.target.getAttribute('data-id'));
            if (item) {
                item.status = e.target.value;
                AppData.saveJobs(jobs);
            }
            renderJobs(getSearchValue());
        }
    });

    // --- Eliminar tarjeta (✕) ---
    on('jobs-list', 'click', function (e) {
        const btn = e.target.closest('.btn-delete-card');
        if (btn) {
            if (confirm('¿Estás seguro de eliminar este registro del panel activo?')) {
                const jobs = AppData.getJobs().filter(j => j.id !== btn.getAttribute('data-id'));
                AppData.saveJobs(jobs);
                renderJobs(getSearchValue());
            }
        }
    });

    // --- Lista de precios: cargar, editar, guardar, cancelar y eliminar ---
    on('prices-body', 'click', function (e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const index = parseInt(btn.getAttribute('data-index'), 10);

        if (btn.classList.contains('btn-load-service')) {
            const lbIn = document.getElementById('calc-labor');
            if (lbIn) lbIn.value = btn.getAttribute('data-price');
            updateCalculator();
        } else if (btn.classList.contains('btn-edit-service')) {
            renderServices(index);
        } else if (btn.classList.contains('btn-save-service')) {
            guardarServicioEditado(index);
        } else if (btn.classList.contains('btn-cancel-service')) {
            renderServices();
        } else if (btn.classList.contains('btn-delete-service')) {
            const services = AppData.getServices().map(s => ({ ...s }));
            if (services[index] && confirm(`¿Eliminar "${services[index].name}" de la lista de precios?`)) {
                services.splice(index, 1);
                AppData.saveServices(services);
                renderServices();
            }
        }
    });

    // Enter guarda y Escape cancela mientras se edita una fila
    on('prices-body', 'keydown', function (e) {
        const row = e.target.closest('tr');
        const saveBtn = row && row.querySelector('.btn-save-service');
        if (!saveBtn) return;
        if (e.key === 'Enter') { e.preventDefault(); guardarServicioEditado(parseInt(saveBtn.getAttribute('data-index'), 10)); }
        if (e.key === 'Escape') renderServices();
    });

    // --- Abrir ficha técnica ---
    on('table-body', 'click', function (e) {
        const btn = e.target.closest('.view-btn');
        if (btn) {
            const job = AppData.getJobs().find(j => j.id === btn.getAttribute('data-id'));
            if (job) {
                activeModalId = job.id;
                document.getElementById('modal-title').textContent = `Ficha Técnica: ${job.client}`;
                document.getElementById('modal-phone').textContent = job.phone;
                document.getElementById('modal-device').textContent = job.device;
                document.getElementById('modal-fault').textContent = job.fault;
                document.getElementById('modal-notes').value = job.notes || '';
                document.getElementById('details-modal').classList.add('active');
            }
        }
    });

    // Guardado automático de notas
    on('modal-notes', 'input', function (e) {
        if (activeModalId) {
            const jobs = AppData.getJobs();
            const job = jobs.find(j => j.id === activeModalId);
            if (job) {
                job.notes = e.target.value;
                AppData.saveJobs(jobs);
            }
        }
    });

    on('close-modal', 'click', closeModal);

    // Cerrar modal al hacer clic afuera o con Escape
    on('details-modal', 'click', function (e) {
        if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && activeModalId) closeModal();
    });

    // --- Buscador en tiempo real ---
    on('search-input', 'input', function (e) {
        renderJobs(e.target.value);
    });

    // --- Exportación a Excel (CSV) ---
    on('btn-export', 'click', function () {
        const jobs = AppData.getJobs();
        if (jobs.length === 0) {
            alert('No hay registros guardados para exportar.');
            return;
        }

        const estados = { pending: 'Pendiente', progress: 'En Proceso', done: 'Listo' };

        // Escapa comillas/saltos de línea y neutraliza fórmulas (=, +, -, @) para que Excel no las ejecute
        const q = v => {
            let s = String(v == null ? '' : v).replace(/\r?\n/g, ' ');
            if (/^[=+\-@]/.test(s)) s = "'" + s;
            return `"${s.replace(/"/g, '""')}"`;
        };

        // Separador ";" porque Excel en configuración regional es-AR lo usa por defecto
        let csv = "Cliente;Equipo;Telefono;Fecha;Estado;Monto;Falla;Notas\n";
        jobs.forEach(j => {
            csv += [
                q(j.client), q(j.device), q(j.phone), q(j.date),
                q(estados[j.status] || j.status), q(j.totalAmount || 0),
                q(j.fault), q(j.notes)
            ].join(";") + "\n";
        });

        // El \uFEFF hace que Excel muestre bien los acentos
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Reporte_Taller_Lucas_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // --- Imprimir la base de datos general ---
    on('btn-print', 'click', function () {
        if (AppData.getJobs().length === 0) {
            alert('No hay registros para imprimir.');
            return;
        }
        const titulo = document.getElementById('print-titulo');
        if (titulo) titulo.textContent = getNombreTaller() + ' - Base de datos general - ' + new Date().toLocaleDateString('es-AR');
        window.print();
    });

    aplicarNombreTaller();
    // --- Carga inicial ---
    renderServices();
    renderJobs();
    updateCalculator();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
