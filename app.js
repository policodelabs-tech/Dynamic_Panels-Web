/* ═══════════════════════════════════════════════════════════
   DYNAMIC PANELS — app.js  v2.0 (Local DB Edition)
   Policode Labs · Lógica completa 100% sin backend
═══════════════════════════════════════════════════════════ */
'use strict';

/* ──────────────────────────────────────
   CONFIGURACIÓN Y ESTADO GLOBAL
────────────────────────────────────── */
const STATE = {
  usuario:   null, 
  negocio:   null,
  darkMode:  localStorage.getItem('dp_dark') === 'true',
};

// Base de datos Local (Simulada, se guarda en localStorage)
let DB = {
  pedidos: [], empleados: [], tareas: [], productos: [], actividad: [],
  counters: { pedido: 100, empleado: 0, tarea: 0, producto: 0 }
};

const ROLES_CONFIG = [
  { nombre:'ADMINISTRADOR', label:'Administrador', color:'#A6094C', perms:{ pedidos:'yes', empleados:'yes', finanzas:'yes', inventario:'yes', metricas:'yes', repartos:'yes', config:'yes' } },
  { nombre:'SUPERVISOR',    label:'Supervisor',    color:'#FF8B00', perms:{ pedidos:'yes', empleados:'partial', finanzas:'yes', inventario:'yes', metricas:'yes', repartos:'yes', config:'no' } },
  { nombre:'CAJERO',        label:'Cajero',        color:'#00875A', perms:{ pedidos:'yes', empleados:'no', finanzas:'partial', inventario:'partial', metricas:'no', repartos:'no', config:'no' } },
  { nombre:'REPARTIDOR',    label:'Repartidor',    color:'#0052CC', perms:{ pedidos:'partial', empleados:'no', finanzas:'no', inventario:'no', metricas:'no', repartos:'yes', config:'no' } },
  { nombre:'ALMACENISTA',   label:'Almacenista',   color:'#6554C0', perms:{ pedidos:'no', empleados:'no', finanzas:'no', inventario:'yes', metricas:'partial', repartos:'no', config:'no' } },
];
const EMP_COLORS = ['#A6094C','#FF8B00','#0052CC','#00875A','#DE350B','#6554C0','#00B8D9'];
const CDMX = { lat: 19.4326, lng: -99.1332 };

/* ──────────────────────────────────────
   PERSISTENCIA LOCAL
────────────────────────────────────── */
function saveDB() {
  if (STATE.negocio) {
    localStorage.setItem(`dp_db_${STATE.negocio.id}`, JSON.stringify(DB));
  }
}

function loadDB() {
  if (!STATE.negocio) return;
  const stored = localStorage.getItem(`dp_db_${STATE.negocio.id}`);
  if (stored) {
    DB = JSON.parse(stored);
  } else { 
    // DB nueva, inicializamos con los valores por defecto y generamos data
    DB = { pedidos:[], empleados:[], tareas:[], productos:[], actividad:[], counters:{pedido:100, empleado:0, tarea:0, producto:0} }; 
    seedDemoData(); 
    saveDB(); 
  }
}

/* ──────────────────────────────────────
   CARRUSEL AUTH
────────────────────────────────────── */
let currentSlide = 0;
function setSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.auth-dots span');
  if(!slides.length) return;
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === index);
    dots[i].classList.toggle('active', i === index);
  });
  currentSlide = index;
}
setInterval(() => {
  const slides = document.querySelectorAll('.carousel-slide');
  if(slides.length) setSlide((currentSlide + 1) % slides.length);
}, 5000);

/* ──────────────────────────────────────
   AUTH
────────────────────────────────────── */
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('formLogin').classList.toggle('active', tab === 'login');
  document.getElementById('formRegister').classList.toggle('active', tab === 'register');
}

function doLogin() {
  const email = v('loginEmail');
  const pass = v('loginPass');
  if (!email || !pass) { showErr('loginError', 'Ingresa correo y contraseña.'); return; }
  
  // Login simulado: busca en localStorage o crea temporal
  let users = JSON.parse(localStorage.getItem('dp_users') || '[]');
  let u = users.find(x => x.email === email);
  if (!u) {
    u = { id: Date.now(), nombre: email.split('@')[0], apellidos: '', email: email, rolNombre: 'ADMINISTRADOR', initials: email[0].toUpperCase() };
    users.push(u); localStorage.setItem('dp_users', JSON.stringify(users));
  }
  
  STATE.usuario = u;
  sessionStorage.setItem('dp_user', JSON.stringify(u));
  goToNegocios();
}

function doRegister() {
  const nombre = v('regNombre'), apellidos = v('regApellidos'), email = v('regEmail'), pass = v('regPass'), pass2 = v('regPass2');
  if (!nombre || !email || !pass) { showErr('regError','Completa los campos.'); return; }
  if (pass !== pass2) { showErr('regError','Las contraseñas no coinciden.'); return; }

  let users = JSON.parse(localStorage.getItem('dp_users') || '[]');
  const u = { id: Date.now(), nombre, apellidos, email, rolNombre: 'ADMINISTRADOR', initials: nombre[0].toUpperCase() };
  users.push(u); localStorage.setItem('dp_users', JSON.stringify(users));
  
  STATE.usuario = u;
  sessionStorage.setItem('dp_user', JSON.stringify(u));
  goToNegocios();
}

function doLogout() {
  STATE.usuario = null; STATE.negocio = null;
  sessionStorage.clear(); 
  DB.pedidos = []; DB.empleados = []; DB.tareas = []; DB.productos = []; DB.actividad = [];
  mapInited = false;
  screen('auth');
}

/* ──────────────────────────────────────
   PANTALLA NEGOCIOS
────────────────────────────────────── */
function goToNegocios() {
  screen('negocios');
  document.getElementById('negUserName').textContent = STATE.usuario.nombre;
  document.getElementById('negUserEmail').textContent = STATE.usuario.email;
  // Actualizar logo basado en el tema actual
  document.getElementById('negociosTopLogo').src = STATE.darkMode ? 'logo-v2.jpeg' : 'logo-v1.jpeg';
  loadNegocios();
}

function loadNegocios() {
  const grid = document.getElementById('negociosGrid');
  const stored = JSON.parse(localStorage.getItem('dp_negocios') || '[]');
  const misNegocios = stored.filter(n => n.ownerEmail === STATE.usuario.email || n.members?.includes(STATE.usuario.email));

  if (!misNegocios.length) {
    grid.innerHTML = `<div class="negocio-empty"><div class="negocio-empty-icon">🏪</div><h3>Sin negocios</h3><p>Crea uno nuevo o únete con un código</p></div>`;
    return;
  }
  grid.innerHTML = misNegocios.map(n => `
    <div class="negocio-card" onclick='enterNegocio(${JSON.stringify(n).replace(/"/g,'&quot;')})'>
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
         ${n.logo ? `<img src="${n.logo}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">` : `<div class="negocio-card-icon" style="margin:0">🏢</div>`}
         <div>
            <div class="negocio-card-name">${esc(n.nombre)}</div>
            <div class="negocio-card-rol">Administrador</div>
         </div>
      </div>
    </div>
  `).join('');
}

async function submitCrearNegocio() {
  const nombre = v('cnNombre');
  if (!nombre) { showErr('cnError','El nombre es obligatorio.'); return; }
  
  const logoInput = document.getElementById('cnLogo');
  let logoData = null;
  if(logoInput.files && logoInput.files[0]) {
      logoData = await toBase64(logoInput.files[0]);
  }

  const negocio = {
    id: Date.now(), 
    nombre, 
    correo: v('cnCorreo'), 
    telefono: v('cnTelefono'),
    direccion: v('cnDireccion'),
    ciudad: v('cnCiudad'),
    logo: logoData, 
    ownerEmail: STATE.usuario.email, 
    members: [STATE.usuario.email]
  };
  
  const stored = JSON.parse(localStorage.getItem('dp_negocios') || '[]');
  stored.push(negocio); 
  localStorage.setItem('dp_negocios', JSON.stringify(stored));
  
  closeModal('modalCrearNegocio'); 
  toast('🏢 Negocio creado exitosamente', 'success');
  loadNegocios();
}

function submitUnirseNegocio() {
  const cod = v('unirCodigo').toUpperCase();
  const stored = JSON.parse(localStorage.getItem('dp_negocios') || '[]');
  const neg = stored.find(n => n.codigoInvitacion === cod);
  if (neg) {
    if (!neg.members) neg.members = [];
    if(!neg.members.includes(STATE.usuario.email)) { 
        neg.members.push(STATE.usuario.email); 
        localStorage.setItem('dp_negocios', JSON.stringify(stored)); 
    }
    closeModal('modalUnirseNegocio'); 
    toast('✅ Te has unido al negocio', 'success'); 
    loadNegocios();
  } else { 
    showErr('unirError', 'Código inválido o inexistente.'); 
  }
}

function enterNegocio(negocio) {
  if (typeof negocio === 'string') negocio = JSON.parse(negocio);
  STATE.negocio = negocio;
  sessionStorage.setItem('dp_negocio', JSON.stringify(negocio));
  loadDB();
  initApp();
}

/* ──────────────────────────────────────
   INICIALIZAR APP PRINCIPAL & PERFIL
────────────────────────────────────── */
function initApp() {
  screen('app');
  document.getElementById('navBizName').textContent = STATE.negocio?.nombre || 'Mi Negocio';
  
  if(STATE.negocio.logo) {
      document.getElementById('navBizLogoImg').src = STATE.negocio.logo;
      document.getElementById('navBizLogoImg').style.display = 'block';
  } else { 
      document.getElementById('navBizLogoImg').style.display = 'none'; 
  }

  updateProfileUI();

  // Ocultar card de config del negocio si no es admin
  const isAdm = ['ADMINISTRADOR'].includes(STATE.usuario.rolNombre);
  const bizCard = document.getElementById('configBizCard');
  if(bizCard) bizCard.classList.toggle('hidden', !isAdm);

  document.querySelectorAll('#navMenu .nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  const now = new Date();
  document.getElementById('todayLabel').textContent = now.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  applyDarkMode(); 
  renderDashboard(); 
  renderOrders(); 
  renderEmployees(); 
  renderRoles(); 
  renderInventory();
  updateNavBadge();
}

function updateProfileUI() {
    document.getElementById('profileName').textContent = STATE.usuario.nombre;
    document.getElementById('profileRole').textContent = getRolLabel(STATE.usuario.rolNombre);
    document.getElementById('profileFullName').textContent = `${STATE.usuario.nombre} ${STATE.usuario.apellidos||''}`;
    document.getElementById('profileEmail').textContent = STATE.usuario.email;
    document.getElementById('profileRolFull').textContent = getRolLabel(STATE.usuario.rolNombre);
    document.getElementById('profileBizFull').textContent = STATE.negocio?.nombre;
    document.getElementById('profileTelTxt').textContent = STATE.usuario.tel || '—';
    document.getElementById('profileBio').textContent = STATE.usuario.bio || '';
    
    // Avatar
    const hasAvatar = !!STATE.usuario.avatar;
    const txtEls = [document.getElementById('profileAvatarText'), document.getElementById('profileAvatarTextBig')];
    const imgEls = [document.getElementById('navAvatarImg'), document.getElementById('profileAvatarBig')];
    
    txtEls.forEach(el => el && (el.style.display = hasAvatar ? 'none' : 'flex', el.textContent = STATE.usuario.initials));
    imgEls.forEach(el => el && (el.style.display = hasAvatar ? 'block' : 'none', el.src = STATE.usuario.avatar));
    
    // Config fields
    vSet('cfgNombre', STATE.usuario.nombre); 
    vSet('cfgApellidos', STATE.usuario.apellidos);
    vSet('cfgTel', STATE.usuario.tel); 
    vSet('cfgBio', STATE.usuario.bio);

    if(STATE.negocio) {
        vSet('cfgBizName', STATE.negocio.nombre); 
        vSet('cfgBizEmail', STATE.negocio.correo); 
        vSet('cfgBizTel', STATE.negocio.telefono);
    }
}

async function saveConfig() {
  STATE.usuario.nombre = v('cfgNombre'); 
  STATE.usuario.apellidos = v('cfgApellidos');
  STATE.usuario.tel = v('cfgTel'); 
  STATE.usuario.bio = v('cfgBio');
  STATE.usuario.initials = (STATE.usuario.nombre[0]+(STATE.usuario.apellidos?.[0]||'')).toUpperCase();
  
  const avaInput = document.getElementById('cfgAvatar');
  if(avaInput.files && avaInput.files[0]) {
      STATE.usuario.avatar = await toBase64(avaInput.files[0]);
  }

  if(['ADMINISTRADOR'].includes(STATE.usuario.rolNombre)) {
      STATE.negocio.nombre = v('cfgBizName'); 
      STATE.negocio.correo = v('cfgBizEmail'); 
      STATE.negocio.telefono = v('cfgBizTel');
      
      const logoInput = document.getElementById('cfgBizLogo');
      if(logoInput.files && logoInput.files[0]) {
          STATE.negocio.logo = await toBase64(logoInput.files[0]);
      }
      
      // Update global DB array
      const stored = JSON.parse(localStorage.getItem('dp_negocios') || '[]');
      const nIdx = stored.findIndex(x=>x.id===STATE.negocio.id);
      if(nIdx>=0) { 
          stored[nIdx]=STATE.negocio; 
          localStorage.setItem('dp_negocios', JSON.stringify(stored)); 
      }
      
      document.getElementById('navBizName').textContent = STATE.negocio.nombre;
      if(STATE.negocio.logo) { 
          document.getElementById('navBizLogoImg').src = STATE.negocio.logo; 
          document.getElementById('navBizLogoImg').style.display='block'; 
      }
  }
  
  sessionStorage.setItem('dp_user', JSON.stringify(STATE.usuario));
  let users = JSON.parse(localStorage.getItem('dp_users') || '[]');
  const uIdx = users.findIndex(x=>x.id === STATE.usuario.id);
  if(uIdx>=0) { 
      users[uIdx] = STATE.usuario; 
      localStorage.setItem('dp_users', JSON.stringify(users)); 
  }

  updateProfileUI();
  toast('⚙️ Configuración guardada', 'success');
}

/* ──────────────────────────────────────
   DATOS DEMO (CON LA CORRECCIÓN DE INITIALS)
────────────────────────────────────── */
function seedDemoData() {
  const empData = [
    { nombre:'Carlos', apellidos:'Ramírez', correo:'carlos@empresa.com', rolNombre:'ADMINISTRADOR', sueldo:15000 },
    { nombre:'Ana',    apellidos:'López',   correo:'ana@empresa.com',    rolNombre:'CAJERO',         sueldo:10000 },
    { nombre:'Luis',   apellidos:'Pérez',   correo:'luis@empresa.com',   rolNombre:'REPARTIDOR',     sueldo:8000 },
    { nombre:'María',  apellidos:'García',  correo:'maria@empresa.com',  rolNombre:'REPARTIDOR',     sueldo:8000 },
    { nombre:'Demo',   apellidos:'Operador',correo:'demo@empresa.com',   rolNombre:'ALMACENISTA',    sueldo:9000 },
  ];
  empData.forEach((e, i) => {
    DB.counters.empleado++;
    DB.empleados.push({ id: DB.counters.empleado, ...e, estatus:'activo',
      color: EMP_COLORS[i % EMP_COLORS.length],
      initials: (e.nombre[0] + (e.apellidos ? e.apellidos[0] : '')).toUpperCase(),
      lat: CDMX.lat + (Math.random()-.5)*.04, lng: CDMX.lng + (Math.random()-.5)*.04
    });
  });

  const pedData = [
    { cliente:'Sofía Martínez', direccion:'Av. Insurgentes 1234, Col. Del Valle', total:350, estatus:'ENTREGADO' },
    { cliente:'Roberto Cruz',   direccion:'Calle Madero 56, Col. Centro',         total:180, estatus:'EN_CAMINO' },
    { cliente:'Laura Hernández',direccion:'Blvd. Adolfo López Mateos 890',        total:520, estatus:'PENDIENTE' },
    { cliente:'Jorge Ríos',     direccion:'Av. Reforma 100, Col. Juárez',          total:760, estatus:'ENTREGADO' },
  ];
  pedData.forEach(p => {
    DB.counters.pedido++;
    const rep = DB.empleados.find(e => e.rolNombre === 'REPARTIDOR');
    DB.pedidos.push({ id: DB.counters.pedido,
      folio: `#PD-${String(DB.counters.pedido).padStart(4,'0')}`,
      ...p, telefono:'', notas:'', productoId: null,
      repartidorId: rep?.id || null,
      fechaHora: new Date().toISOString()
    });
  });

  DB.productos = [
    { id:1, nombre:'Refresco 600ml',  categoria:'Bebidas',   unidad:'pieza', stock:48, minimo:10, precio:18 },
    { id:2, nombre:'Agua 1.5L',       categoria:'Bebidas',   unidad:'pieza', stock:6,  minimo:20, precio:15 },
    { id:3, nombre:'Botana mixta',    categoria:'Snacks',    unidad:'bolsa', stock:30, minimo:8,  precio:25 },
    { id:4, nombre:'Galletas María',  categoria:'Snacks',    unidad:'paq',   stock:22, minimo:5,  precio:12 },
    { id:5, nombre:'Cigarros Marlboro',categoria:'Tabaco',   unidad:'cajetilla', stock:15, minimo:10, precio:75 },
  ];
  DB.counters.producto = 5;
  addActividad('Sistema iniciado localmente para este negocio.');
}

/* ──────────────────────────────────────
   NAVEGACIÓN Y VISTAS
────────────────────────────────────── */
function screen(name) {
  document.getElementById('authScreen').classList.toggle('hidden', name !== 'auth');
  document.getElementById('negociosScreen').classList.toggle('hidden', name !== 'negocios');
  document.getElementById('appScreen').classList.toggle('hidden', name !== 'app');
}

function switchView(viewId) {
  document.querySelectorAll('#navMenu .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + viewId));

  if (viewId === 'pedidos')    renderOrders();
  if (viewId === 'flota')      initOrRefreshMap();
  if (viewId === 'personal')   { renderEmployees(); renderRoles(); renderTaskBoard(); }
  if (viewId === 'inventario') renderInventory();
  if (viewId === 'metricas')   renderMetrics();
}

function switchPersTab(tab) {
  document.querySelectorAll('.pers-tab').forEach((t, i) =>
    t.classList.toggle('active', (i===0 && tab==='empleados') || (i===1 && tab==='roles') || (i===2 && tab==='tareas')));
  document.getElementById('persTabEmpleados').classList.toggle('hidden', tab !== 'empleados');
  document.getElementById('persTabRoles').classList.toggle('hidden', tab !== 'roles');
  document.getElementById('persTabTareas').classList.toggle('hidden', tab !== 'tareas');
  if (tab === 'tareas') renderTaskBoard();
}

function toggleDark() {
  STATE.darkMode = !STATE.darkMode;
  applyDarkMode();
}
function applyDarkMode() {
  document.documentElement.setAttribute('data-theme', STATE.darkMode ? 'dark' : 'light');
  localStorage.setItem('dp_dark', STATE.darkMode);
  const btn = document.getElementById('darkBtn');
  if (btn) btn.textContent = STATE.darkMode ? '☀️' : '🌙';
  const cb = document.getElementById('toggleDarkCfg');
  if (cb) cb.checked = STATE.darkMode;
  const logo = document.getElementById('negociosTopLogo'); 
  if(logo && !STATE.negocio) logo.src = STATE.darkMode ? 'logo-v2.jpeg' : 'logo-v1.jpeg';
}

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
  if (id === 'modalNuevoPedido')  { populateSelect('npProducto', DB.productos, 'nombre'); }
  if (id === 'modalNuevaTarea')   { populateEmpSelect('ntAsignado'); }
  if (id === 'modalEditPedido')   { populateEmpSelect('editRepartidor', 'REPARTIDOR'); }
  if (id === 'modalEntradaMerc')  { populateSelect('emProducto', DB.productos, 'nombre'); }
  document.querySelectorAll(`#${id} .form-error`).forEach(e => e.classList.add('hidden'));
  
  if(id === 'modalNuevoEmpleado') {
      document.getElementById('neInviteArea').classList.add('hidden');
  }
}
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function populateSelect(selectId, items, labelKey) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const first = sel.options[0];
  sel.innerHTML = ''; sel.appendChild(first);
  items.forEach(item => { sel.appendChild(new Option(item[labelKey], item.id)); });
}
function populateEmpSelect(selectId, rolFilter = null) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const first = sel.options[0];
  sel.innerHTML = ''; sel.appendChild(first);
  const list = rolFilter ? DB.empleados.filter(e => e.rolNombre === rolFilter) : DB.empleados;
  list.forEach(e => sel.appendChild(new Option(`${e.nombre} ${e.apellidos}`, e.id)));
}

/* ──────────────────────────────────────
   CRUD — PEDIDOS
────────────────────────────────────── */
function submitNuevoPedido() {
  const cliente   = v('npCliente');
  const direccion = v('npDireccion');
  const desc      = v('npDescripcion');
  const totalStr  = v('npTotal');

  if (!cliente || !direccion || !desc) { showErr('npError','Completa los campos obligatorios (*).'); return; }

  const total = parseFloat(totalStr) || 0;
  const productoId = document.getElementById('npProducto').value || null;

  const disponibles = DB.empleados.filter(e => e.rolNombre === 'REPARTIDOR' && e.estatus === 'activo' && !DB.pedidos.find(p => p.repartidorId === e.id && p.estatus === 'EN_CAMINO'));
  const rep = disponibles.length ? disponibles[Math.floor(Math.random() * disponibles.length)] : null;

  DB.counters.pedido++;
  const folio = `#PD-${String(DB.counters.pedido).padStart(4,'0')}`;
  const nuevo = {
    id: DB.counters.pedido, folio, cliente,
    telefono: v('npTelefono'), direccion, descripcion: desc,
    repartidorId: rep?.id || null, total, productoId,
    estatus: rep ? 'EN_CAMINO' : 'PENDIENTE',
    fechaHora: new Date().toISOString()
  };
  DB.pedidos.unshift(nuevo);

  addActividad(`Nuevo pedido ${folio} — ${cliente}${rep ? ' → ' + rep.nombre : ''}`);
  saveDB();
  
  closeModal('modalNuevoPedido');
  toast(`📦 ${folio} creado${rep ? '. Asignado a ' + rep.nombre : '. Sin repartidor disponible'}`, rep ? 'success' : 'default');
  renderDashboard(); renderOrders(); updateNavBadge();
}

function openEditPedido(id) {
  const p = DB.pedidos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editPedidoId').value = p.id;
  document.getElementById('editFolioLabel').textContent = p.folio;
  document.getElementById('editEstatus').value = p.estatus;
  openModal('modalEditPedido');
  setTimeout(() => { document.getElementById('editRepartidor').value = p.repartidorId || ''; }, 50);
}

function submitEditPedido() {
  const id     = parseInt(v('editPedidoId'));
  const estatus= document.getElementById('editEstatus').value;
  const repId  = document.getElementById('editRepartidor').value;
  const p = DB.pedidos.find(x => x.id === id);
  if (!p) return;

  const prevEstatus = p.estatus;
  p.estatus      = estatus;
  p.repartidorId = repId ? parseInt(repId) : p.repartidorId;

  if (estatus === 'ENTREGADO' && prevEstatus !== 'ENTREGADO' && p.productoId) {
    const prod = DB.productos.find(pr => pr.id == p.productoId);
    if (prod && prod.stock > 0) { prod.stock--; addActividad(`Stock de "${prod.nombre}" reducido a ${prod.stock}`); }
  }

  addActividad(`Pedido ${p.folio} → ${estatus}`);
  saveDB();
  
  closeModal('modalEditPedido');
  toast('✅ Pedido actualizado');
  renderDashboard(); renderOrders(); updateNavBadge();
}

/* ──────────────────────────────────────
   CRUD — EMPLEADOS
────────────────────────────────────── */
function submitNuevoEmpleado() {
  const correo = v('neCorreo'), rol = v('neRol'), sueldo = parseFloat(v('neSueldo'))||0;
  DB.counters.empleado++;
  const emp = {
    id: DB.counters.empleado, 
    nombre: correo ? correo.split('@')[0] : 'Nuevo', 
    apellidos: 'Usuario', 
    correo, 
    rolNombre: rol, 
    sueldo,
    estatus: 'activo', 
    color: EMP_COLORS[DB.counters.empleado % EMP_COLORS.length], 
    initials: 'NU',
    lat: CDMX.lat + (Math.random()-.5)*.04, 
    lng: CDMX.lng + (Math.random()-.5)*.04
  };
  DB.empleados.push(emp); 
  
  saveDB();
  addActividad(`Personal agregado: ${rol}`);
  closeModal('modalNuevoEmpleado'); 
  toast('👤 Personal registrado', 'success'); 
  renderEmployees(); updateMapMarkers();
}

function generateEmpleadoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const code = `DIT-${seg(4)}-${seg(4)}`;
  
  const stored = JSON.parse(localStorage.getItem('dp_negocios') || '[]');
  const neg = stored.find(n => n.id == STATE.negocio?.id);
  if (neg) { 
      neg.codigoInvitacion = code; 
      localStorage.setItem('dp_negocios', JSON.stringify(stored)); 
  }
  
  document.getElementById('neInviteArea').classList.remove('hidden');
  document.getElementById('neCodeDisplay').textContent = code;
}

function openEditEmpleado(id) {
    const e = DB.empleados.find(x => x.id === id);
    if(!e) return;
    document.getElementById('editEmpId').value = e.id;
    document.getElementById('editEmpName').textContent = `${e.nombre} ${e.apellidos} (${e.correo})`;
    vSet('editEmpRol', e.rolNombre); 
    vSet('editEmpSueldo', e.sueldo);
    openModal('modalEditEmpleado');
}

function submitEditEmpleado() {
    const id = parseInt(v('editEmpId'));
    const e = DB.empleados.find(x => x.id === id);
    if(!e) return;
    e.rolNombre = v('editEmpRol');
    e.sueldo = parseFloat(v('editEmpSueldo'))||0;
    
    saveDB();
    closeModal('modalEditEmpleado');
    toast(`🔔 Empleado notificado de sus nuevos permisos (${getRolLabel(e.rolNombre)})`, 'success');
    renderEmployees();
}

function deleteEmpleado(id) {
  if (!confirm('¿Eliminar este empleado del sistema?')) return;
  DB.empleados = DB.empleados.filter(e => e.id !== id);
  saveDB();
  renderEmployees(); renderDashboard();
  toast('Empleado eliminado');
}

/* ──────────────────────────────────────
   CRUD — TAREAS
────────────────────────────────────── */
function submitNuevaTarea() {
  const titulo = v('ntTitulo');
  if (!titulo) { showErr('ntError','Escribe el título de la tarea.'); return; }

  const rol = STATE.usuario.rolNombre;
  if (rol !== 'ADMINISTRADOR' && rol !== 'SUPERVISOR') {
    showErr('ntError','Solo Administradores y Supervisores pueden crear tareas.');
    return;
  }

  DB.counters.tarea++;
  DB.tareas.push({
    id: DB.counters.tarea, titulo, desc: v('ntDesc'),
    prioridad: document.getElementById('ntPrioridad').value,
    asignadoId: document.getElementById('ntAsignado').value || null,
    col: 0, fecha: new Date().toISOString().split('T')[0]
  });

  saveDB();
  closeModal('modalNuevaTarea'); toast('✅ Tarea creada');
  renderDashboard(); renderTaskBoard();
}

function moveTask(id, newCol) {
  const t = DB.tareas.find(x => x.id === id);
  if (t) { t.col = newCol; saveDB(); renderTaskBoard(); renderDashboard(); }
}

function deleteTask(id) {
  DB.tareas = DB.tareas.filter(t => t.id !== id);
  saveDB();
  renderTaskBoard(); renderDashboard();
}

/* ──────────────────────────────────────
   CRUD — INVENTARIO
────────────────────────────────────── */
function submitNuevoProducto() {
  const nombre = v('prodNombre');
  if (!nombre) { showErr('prodError','El nombre es obligatorio.'); return; }

  DB.counters.producto++;
  const prod = {
    id: DB.counters.producto, nombre,
    categoria: v('prodCategoria') || 'General',
    unidad: v('prodUnidad') || 'pieza',
    stock: parseInt(v('prodStock')) || 0,
    minimo: parseInt(v('prodMinimo')) || 0,
    precio: parseFloat(v('prodPrecio')) || 0,
  };
  DB.productos.push(prod);

  addActividad(`Producto agregado: ${nombre}`);
  saveDB();
  
  closeModal('modalNuevoProducto'); toast('🧱 Producto agregado al inventario');
  renderInventory();
}

function submitEntradaMerc() {
  const prodId = document.getElementById('emProducto').value;
  const cant   = parseInt(v('emCantidad')) || 0;
  if (!prodId || cant < 1) { showErr('emError','Selecciona un producto y una cantidad válida.'); return; }
  const prod = DB.productos.find(p => p.id == prodId);
  if (!prod) { showErr('emError','Producto no encontrado.'); return; }
  
  prod.stock += cant;
  addActividad(`Entrada de ${cant} ${prod.unidad}(s) de "${prod.nombre}"`);
  saveDB();
  
  closeModal('modalEntradaMerc'); toast(`📥 +${cant} ${prod.unidad}(s) de ${prod.nombre}`, 'success');
  renderInventory();
}

function updateStockInline(id, delta) {
  const prod = DB.productos.find(p => p.id === id);
  if (!prod) return;
  prod.stock = Math.max(0, prod.stock + delta);
  saveDB();
  renderInventory();
}

/* ──────────────────────────────────────
   BADGE & ACTIVIDAD
────────────────────────────────────── */
function updateNavBadge() {
  const n = DB.pedidos.filter(p => p.estatus === 'PENDIENTE').length;
  const b = document.getElementById('navBadgePedidos');
  if (!b) return;
  b.textContent = n; b.classList.toggle('hidden', n === 0);
}

function addActividad(msg) {
  const now = new Date();
  DB.actividad.unshift({ msg, time: now.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) });
  if (DB.actividad.length > 30) DB.actividad.pop();
}

/* ──────────────────────────────────────
   RENDERS — DASHBOARD
────────────────────────────────────── */
function renderDashboard() {
  const entregados = DB.pedidos.filter(p => p.estatus === 'ENTREGADO').length;
  const ventas = DB.pedidos.filter(p => p.estatus === 'ENTREGADO').reduce((s,p) => s + (p.total||0), 0);
  const empActivos = DB.empleados.filter(e => e.estatus === 'activo').length;

  setEl('kpiPedidos',  DB.pedidos.length);
  setEl('kpiVentas',   '$' + ventas.toLocaleString('es-MX', {minimumFractionDigits:2}));
  setEl('kpiEmpleados', empActivos);
  setEl('kpiTasa',     DB.pedidos.length > 0 ? Math.round((entregados/DB.pedidos.length)*100)+'%' : '—');

  const wrap = document.getElementById('dashOrdersWrap');
  if (DB.pedidos.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">Sin registros recientes</div></div>';
  } else {
    wrap.innerHTML = `<table class="data-table"><thead><tr><th>Folio</th><th>Cliente</th><th>Repartidor</th><th>Total</th><th>Estado</th></tr></thead><tbody>
      ${DB.pedidos.slice(0,6).map(p => {
        const rep = DB.empleados.find(e => e.id === p.repartidorId);
        return `<tr><td><strong style="color:var(--primary)">${p.folio}</strong></td>
          <td>${esc(p.cliente)}</td>
          <td>${rep ? rep.nombre : '<span style="color:var(--muted)">—</span>'}</td>
          <td><strong>$${Number(p.total).toFixed(2)}</strong></td>
          <td>${pillEstatus(p.estatus)}</td></tr>`;
      }).join('')}</tbody></table>`;
  }

  const act = document.getElementById('dashActivity');
  act.innerHTML = DB.actividad.slice(0,8).map(a =>
    `<div style="padding:9px 0;border-bottom:1px solid var(--border);font-size:13px">
       <span style="font-weight:700;color:var(--muted);margin-right:6px">${a.time}</span>${esc(a.msg)}</div>`
  ).join('') || '<p class="text-muted">Sin actividad.</p>';

  const tasks = document.getElementById('dashTasks');
  const pendTareas = DB.tareas.filter(t => t.col < 2);
  const canManageTasks = ['ADMINISTRADOR','SUPERVISOR'].includes(STATE.usuario?.rolNombre);
  tasks.innerHTML = pendTareas.slice(0,5).map(t => {
    const dot = {baja:'🟢',media:'🟡',alta:'🔴'}[t.prioridad] || '⚪';
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border)">
      <span>${dot}</span><span style="font-size:13px;flex:1">${esc(t.titulo)}</span>
      ${canManageTasks ? `<button class="btn btn-ghost btn-sm" style="padding:2px 8px" onclick="deleteTask(${t.id})">✕</button>` : ''}
    </div>`;
  }).join('') || '<p class="text-muted">Todo al día.</p>';

  const driv = document.getElementById('dashDrivers');
  const reps = DB.empleados.filter(e => e.rolNombre === 'REPARTIDOR');
  driv.innerHTML = reps.length ? reps.slice(0,5).map(d => {
    const enRuta = DB.pedidos.find(p => p.repartidorId === d.id && p.estatus === 'EN_CAMINO');
    return `<div class="driver-item">
      <div class="driver-avatar" style="background:${d.color}">${d.initials}</div>
      <div class="driver-info">
        <div class="driver-name">${d.nombre} ${d.apellidos}</div>
        <div class="driver-status">${enRuta ? '🛵 En Ruta: '+enRuta.folio : '✅ Disponible'}</div>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state"><div class="es-icon">🛵</div><div class="es-title">Sin unidades de flota</div></div>';
}

/* ──────────────────────────────────────
   RENDERS — PEDIDOS
────────────────────────────────────── */
let orderView = 'table';
function setOrderView(mode) {
  orderView = mode;
  document.getElementById('btnTable').classList.toggle('active', mode === 'table');
  document.getElementById('btnBoard').classList.toggle('active', mode === 'board');
  document.getElementById('ordersTableView').classList.toggle('hidden', mode !== 'table');
  document.getElementById('ordersBoardView').classList.toggle('hidden', mode !== 'board');
  renderOrders();
}

function renderOrders() {
  const q = (v('searchOrders') || '').toLowerCase();
  const sf = document.getElementById('filterStatus')?.value || '';
  const list = DB.pedidos.filter(p =>
    (!q || p.cliente?.toLowerCase().includes(q) || p.folio?.toLowerCase().includes(q)) &&
    (!sf || p.estatus === sf));

  if (orderView === 'table') {
    const wrap = document.getElementById('ordersTableWrap');
    if (list.length === 0) {
      wrap.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">No hay pedidos que coincidan</div></div>';
      return;
    }
    wrap.innerHTML = `<table class="data-table"><thead>
      <tr><th>Folio</th><th>Cliente / Dirección</th><th>Repartidor</th><th>Total</th><th>Estado</th><th>Acción</th></tr>
      </thead><tbody>${list.map(p => {
        const rep = DB.empleados.find(e => e.id === p.repartidorId);
        return `<tr>
          <td><strong style="color:var(--primary)">${p.folio}</strong></td>
          <td><strong>${esc(p.cliente)}</strong><br><span style="font-size:12px;color:var(--muted)">${esc(p.direccion)}</span></td>
          <td>${rep ? `<span style="display:flex;align-items:center;gap:6px"><div class="driver-avatar" style="background:${rep.color};width:26px;height:26px;font-size:10px">${rep.initials}</div>${rep.nombre}</span>` : '<span style="color:var(--muted)">Sin asignar</span>'}</td>
          <td><strong>$${Number(p.total).toFixed(2)}</strong></td>
          <td>${pillEstatus(p.estatus)}</td>
          <td><button class="btn btn-ghost btn-sm" onclick="openEditPedido(${p.id})">✏️ Editar</button></td>
        </tr>`;
      }).join('')}</tbody></table>`;
  } else {
    const cols = [
      { key:'PENDIENTE',  label:'PENDIENTE',  color:'var(--accent)' },
      { key:'EN_CAMINO',  label:'EN RUTA',    color:'var(--blue)' },
      { key:'ENTREGADO',  label:'ENTREGADO',  color:'var(--green)' },
      { key:'CANCELADO',  label:'CANCELADO',  color:'var(--red)' },
    ];
    document.getElementById('ordersKanban').innerHTML = cols.map(col => {
      const items = list.filter(p => p.estatus === col.key);
      return `<div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-count">${items.length}</span>
        </div>
        <div class="kanban-items">${items.map(p =>
          `<div class="kanban-card" onclick="openEditPedido(${p.id})">
            <div class="kc-folio">${p.folio}</div>
            <div class="kc-client">${esc(p.cliente)}</div>
            <div class="kc-addr">${esc(p.direccion?.substring(0,40))}…</div>
            <div style="margin-top:8px;font-weight:700;color:var(--accent)">$${Number(p.total).toFixed(2)}</div>
           </div>`).join('') || '<p style="font-size:12px;color:var(--muted);padding:8px">Vacío</p>'}
        </div>
      </div>`;
    }).join('');
  }
}

/* ──────────────────────────────────────
   RENDERS — EMPLEADOS Y ROLES
────────────────────────────────────── */
function renderEmployees() {
  const grid = document.getElementById('employeesGrid');
  if(!grid) return;
  
  const q = (v('searchEmp') || '').toLowerCase();
  const rf = document.getElementById('filterRol')?.value || '';
  const isAdm = ['ADMINISTRADOR'].includes(STATE.usuario?.rolNombre);
  
  const list = DB.empleados.filter(e =>
    (!q || `${e.nombre} ${e.apellidos}`.toLowerCase().includes(q)) &&
    (!rf || e.rolNombre === rf));

  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">👥</div><div class="es-title">Sin empleados</div></div>';
    return;
  }

  grid.innerHTML = list.map(e => `
    <div class="emp-card">
      <div class="emp-avatar" style="background:${e.color}">${e.initials}</div>
      <div class="emp-name">${esc(e.nombre)} ${esc(e.apellidos)}</div>
      <div class="emp-role">${getRolLabel(e.rolNombre)}</div>
      <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Sueldo: $${e.sueldo}</div>
      ${isAdm ? `<div class="emp-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditEmpleado(${e.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEmpleado(${e.id})">✕</button>
      </div>` : ''}
    </div>
  `).join('');
}

function renderRoles() {
  const tbody = document.getElementById('rolesTableBody');
  if (!tbody) return;
  const permIcon = (v) =>
    v==='yes'     ? '<span class="perm-check perm-yes">✓</span>'     :
    v==='partial' ? '<span class="perm-check perm-partial">½</span>' :
                    '<span class="perm-check perm-no">—</span>';
  tbody.innerHTML = ROLES_CONFIG.map(r => `<tr>
    <td><span style="color:${r.color};font-weight:800">● ${r.label}</span></td>
    <td>${permIcon(r.perms.pedidos)}</td><td>${permIcon(r.perms.empleados)}</td>
    <td>${permIcon(r.perms.finanzas)}</td><td>${permIcon(r.perms.inventario)}</td>
    <td>${permIcon(r.perms.metricas)}</td><td>${permIcon(r.perms.repartos)}</td>
    <td>${permIcon(r.perms.config)}</td>
  </tr>`).join('');
}

function renderTaskBoard() {
  const wrap = document.getElementById('taskBoardWrap');
  if (!wrap) return;
  const canManage = ['ADMINISTRADOR','SUPERVISOR'].includes(STATE.usuario?.rolNombre);
  const cols = [{label:'POR HACER',idx:0},{label:'EN PROGRESO',idx:1},{label:'TERMINADO',idx:2}];

  wrap.innerHTML = `<div class="kanban-board" style="grid-template-columns:repeat(3,1fr)">${cols.map(col => {
    const items = DB.tareas.filter(t => t.col === col.idx);
    return `<div class="kanban-col">
      <div class="kanban-col-header">
        <span class="kanban-col-title">${col.label}</span>
        <span class="kanban-count">${items.length}</span>
      </div>
      <div class="kanban-items">${items.map(t => {
        const dot = {baja:'🟢',media:'🟡',alta:'🔴'}[t.prioridad]||'⚪';
        const emp = DB.empleados.find(e => e.id == t.asignadoId);
        return `<div class="kanban-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:12px;color:var(--muted)">${dot} ${t.prioridad}</span>
            ${canManage ? `<button class="btn btn-ghost btn-sm" style="padding:1px 6px;font-size:11px" onclick="deleteTask(${t.id})">✕</button>` : ''}
          </div>
          <div class="kc-folio" style="color:var(--text);margin-bottom:4px">${esc(t.titulo)}</div>
          ${emp ? `<div style="font-size:11px;color:var(--muted)">→ ${emp.nombre}</div>` : ''}
          ${canManage && col.idx < 2 ? `<button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" onclick="moveTask(${t.id},${col.idx+1})">Avanzar →</button>` : ''}
        </div>`;
      }).join('') || '<p style="font-size:12px;color:var(--muted);padding:8px">Vacío</p>'}
      </div>
    </div>`;
  }).join('')}</div>`;
}

/* ──────────────────────────────────────
   RENDERS — FLOTA / MAPA
────────────────────────────────────── */
let leafletMap = null, mapInited = false, mapMarkers = {};

function initOrRefreshMap() {
  if (!mapInited) {
    initMap();
  } else {
    setTimeout(() => leafletMap.invalidateSize(), 150);
    renderFlotaLists(); updateMapMarkers();
  }
}

function initMap() {
  if (mapInited) return;
  leafletMap = L.map('leafletMap', { zoomControl: true }).setView([CDMX.lat, CDMX.lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(leafletMap);

  L.marker([CDMX.lat, CDMX.lng], {
    icon: L.divIcon({
      html: `<div style="background:var(--primary);color:white;border-radius:8px;padding:4px 8px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3)">🏢 Base</div>`,
      className: '', iconAnchor:[28,16]
    })
  }).addTo(leafletMap).bindPopup('<strong>Base de Operaciones</strong>');

  mapInited = true;
  setTimeout(() => leafletMap.invalidateSize(), 300);
  updateMapMarkers(); renderFlotaLists();

  setInterval(() => {
    DB.empleados.filter(e => e.rolNombre === 'REPARTIDOR').forEach(e => {
      e.lat += (Math.random()-.5) * 0.0012; e.lng += (Math.random()-.5) * 0.0012;
      if (mapMarkers[e.id]) mapMarkers[e.id].setLatLng([e.lat, e.lng]);
    });
  }, 4000);
}

function updateMapMarkers() {
  if (!mapInited) return;
  DB.empleados.filter(e => e.rolNombre === 'REPARTIDOR').forEach(e => {
    const pedido = DB.pedidos.find(p => p.repartidorId === e.id && p.estatus === 'EN_CAMINO');
    const color  = e.estatus === 'activo' ? e.color : '#97A0AF';
    const icon   = L.divIcon({
      html: `<div style="background:${color};color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)">${e.initials}</div>`,
      className: '', iconSize:[34,34], iconAnchor:[17,17]
    });
    if (mapMarkers[e.id]) {
      mapMarkers[e.id].setLatLng([e.lat, e.lng]).setIcon(icon);
    } else {
      mapMarkers[e.id] = L.marker([e.lat, e.lng], { icon })
        .addTo(leafletMap)
        .bindPopup(`<strong>${e.nombre} ${e.apellidos}</strong><br>${pedido ? '🛵 Ruta: '+pedido.folio : '✅ Disponible'}`);
    }
  });
}

function renderFlotaLists() {
  const reps = DB.empleados.filter(e => e.rolNombre === 'REPARTIDOR');
  const disp  = reps.filter(r => r.estatus==='activo' && !DB.pedidos.find(p=>p.repartidorId===r.id&&p.estatus==='EN_CAMINO'));
  const ruta  = reps.filter(r => DB.pedidos.find(p=>p.repartidorId===r.id&&p.estatus==='EN_CAMINO'));
  const inact = reps.filter(r => r.estatus!=='activo');

  setEl('cntDisp', disp.length); setEl('cntRuta', ruta.length); setEl('cntInact', inact.length);

  const driverRow = (d) => {
    const p = DB.pedidos.find(pd => pd.repartidorId===d.id && pd.estatus==='EN_CAMINO');
    return `<div class="driver-item" onclick="if(mapMarkers[${d.id}]){mapMarkers[${d.id}].openPopup();if(leafletMap)leafletMap.setView([${d.lat},${d.lng}],15)}">
      <div class="driver-avatar" style="background:${d.color}">${d.initials}</div>
      <div class="driver-info">
        <div class="driver-name">${d.nombre} ${d.apellidos}</div>
        <div class="driver-status">${p ? '🛵 '+p.folio : '✅ Disponible'}</div>
      </div>
    </div>`;
  };

  document.getElementById('listDisp').innerHTML  = disp.map(driverRow).join('') || '<p style="padding:12px;font-size:13px;color:var(--muted)">Vacío</p>';
  document.getElementById('listRuta').innerHTML  = ruta.map(driverRow).join('') || '<p style="padding:12px;font-size:13px;color:var(--muted)">Vacío</p>';
  document.getElementById('listInact').innerHTML = inact.map(driverRow).join('') || '<p style="padding:12px;font-size:13px;color:var(--muted)">Vacío</p>';
}

/* ──────────────────────────────────────
   RENDERS — INVENTARIO
────────────────────────────────────── */
function renderInventory() {
  const total  = DB.productos.length;
  const critico = DB.productos.filter(p => p.stock <= p.minimo).length;
  const valor  = DB.productos.reduce((s,p) => s + (p.stock * (p.precio||0)), 0);

  setEl('invTotal',  total);
  setEl('invCritico', critico);
  setEl('invValor',  '$' + valor.toLocaleString('es-MX', {minimumFractionDigits:2}));

  const wrap = document.getElementById('inventoryWrap');
  if (DB.productos.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><div class="es-icon">🧱</div><div class="es-title">Almacén vacío</div></div>';
    return;
  }

  wrap.innerHTML = `<table class="data-table"><thead>
    <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Nivel</th><th>Precio unit.</th><th>Acciones</th></tr>
    </thead><tbody>${DB.productos.map(p => {
      const pct = p.minimo > 0 ? Math.min(100, Math.round((p.stock / (p.minimo*2)) * 100)) : 100;
      const cls = p.stock <= 0 ? 'stock-crit' : p.stock <= p.minimo ? 'stock-warn' : 'stock-ok';
      const pillCls = p.stock <= 0 ? 'pill-cancelado' : p.stock <= p.minimo ? 'pill-pendiente' : 'pill-ok';
      const pillLabel = p.stock <= 0 ? 'Agotado' : p.stock <= p.minimo ? 'Crítico' : 'OK';
      return `<tr>
        <td><strong>${esc(p.nombre)}</strong><div style="font-size:12px;color:var(--muted)">${esc(p.unidad)}</div></td>
        <td>${esc(p.categoria)}</td>
        <td><strong style="font-size:15px">${p.stock}</strong></td>
        <td>${p.minimo}</td>
        <td><span class="pill ${pillCls}">${pillLabel}</span><div class="stock-bar" style="margin-top:5px"><div class="stock-fill ${cls}" style="width:${pct}%"></div></div></td>
        <td>$${Number(p.precio||0).toFixed(2)}</td>
        <td><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" onclick="updateStockInline(${p.id},1)">+1</button><button class="btn btn-ghost btn-sm" onclick="updateStockInline(${p.id},-1)">-1</button></div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

/* ──────────────────────────────────────
   RENDERS — MÉTRICAS
────────────────────────────────────── */
function renderMetrics() {
  renderDonut('statusChartWrap', [
    { label:'Pendiente',  val: DB.pedidos.filter(p=>p.estatus==='PENDIENTE').length,  color:'#FF8B00' },
    { label:'En Ruta',    val: DB.pedidos.filter(p=>p.estatus==='EN_CAMINO').length,  color:'#0052CC' },
    { label:'Entregado',  val: DB.pedidos.filter(p=>p.estatus==='ENTREGADO').length,  color:'#00875A' },
    { label:'Cancelado',  val: DB.pedidos.filter(p=>p.estatus==='CANCELADO').length,  color:'#DE350B' },
  ]);

  const entregados = DB.pedidos.filter(p => p.estatus === 'ENTREGADO');
  if (entregados.length) {
    const avg = Math.floor(Math.random() * 25 + 15);
    setEl('avgTimeVal', avg); setEl('avgTimeUnit', ' min'); setEl('avgTimeNote', `Basado en ${entregados.length} entregas`);
  }

  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const dayVals = days.map(() => Math.floor(Math.random()*12));
  renderBars('weekChartWrap', days, dayVals, '#A6094C');

  const rolCounts = ROLES_CONFIG.map(r => ({
    label: r.label, val: DB.empleados.filter(e => e.rolNombre === r.nombre).length, color: r.color
  })).filter(x => x.val > 0);
  renderDonut('rolesChartWrap', rolCounts);

  const critProds = DB.productos.filter(p => p.stock <= p.minimo).slice(0,6);
  if (critProds.length) {
    renderBars('stockChartWrap', critProds.map(p=>p.nombre.substring(0,10)), critProds.map(p=>p.stock), '#DE350B');
  } else {
    document.getElementById('stockChartWrap').innerHTML = '<div class="empty-state"><div class="es-icon">✅</div><div class="es-title">Sin stock crítico</div></div>';
  }
}

function renderDonut(wrId, segments) {
  const wrap = document.getElementById(wrId);
  if (!wrap) return;
  const total = segments.reduce((s, x) => s + x.val, 0);
  if (total === 0) { wrap.innerHTML = '<div class="empty-state"><div class="es-icon">📊</div><div class="es-title">Sin datos</div></div>'; return; }

  let offset = 0, paths = '', legend = '';
  const r = 60, cx = 80, cy = 80, stroke = 28, circ = 2 * Math.PI * r;

  segments.forEach(s => {
    if (!s.val) return;
    const pct = s.val / total;
    const dash = pct * circ;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset * circ}" transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dasharray .4s ease"><title>${s.label}: ${s.val}</title></circle>`;
    legend += `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:5px"><div style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></div><span style="flex:1">${s.label}</span><strong>${s.val}</strong></div>`;
    offset += pct;
  });

  wrap.innerHTML = `<div style="display:flex;align-items:center;gap:20px;padding:10px"><svg width="160" height="160" viewBox="0 0 160 160">${paths}<text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text)">${total}</text><text x="${cx}" y="${cy+20}" text-anchor="middle" font-size="11" fill="var(--muted)">total</text></svg><div style="flex:1">${legend}</div></div>`;
}

function renderBars(wrId, labels, vals, color='#A6094C') {
  const wrap = document.getElementById(wrId);
  if (!wrap) return;
  const max = Math.max(...vals, 1);
  const W = 300, H = 120, barW = Math.floor(W / labels.length) - 6, pad = 16;

  const bars = labels.map((l, i) => {
    const bh = Math.round((vals[i] / max) * (H - 30));
    const x  = pad + i * (barW + 6);
    const y  = H - bh - 16;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="${color}" opacity="0.85"/><text class="bar-val" x="${x + barW/2}" y="${y - 3}" text-anchor="middle">${vals[i]}</text><text class="bar-label" x="${x + barW/2}" y="${H}" text-anchor="middle">${l}</text>`;
  }).join('');
  wrap.innerHTML = `<svg class="svg-chart" viewBox="0 0 ${W + pad} ${H + 4}" style="overflow:visible">${bars}</svg>`;
}

/* ──────────────────────────────────────
   EXPORT CSV
────────────────────────────────────── */
function exportCSV(type) {
  let rows = [], filename = 'reporte';
  if (type === 'pedidos') {
    filename = 'reporte_pedidos';
    rows = [['Folio','Cliente','Dirección','Total','Estado','Repartidor']];
    DB.pedidos.forEach(p => {
      const rep = DB.empleados.find(e => e.id === p.repartidorId);
      rows.push([p.folio, p.cliente, p.direccion, p.total, p.estatus, rep ? `${rep.nombre} ${rep.apellidos}` : '—']);
    });
  } else if (type === 'personal') {
    filename = 'reporte_personal';
    rows = [['Nombre','Apellidos','Correo','Rol','Estatus','Sueldo']];
    DB.empleados.forEach(e => rows.push([e.nombre, e.apellidos, e.correo, e.rolNombre, e.estatus, e.sueldo]));
  } else if (type === 'inventario') {
    filename = 'reporte_inventario';
    rows = [['Producto','Categoría','Stock','Mínimo','Precio']];
    DB.productos.forEach(p => rows.push([p.nombre, p.categoria, p.stock, p.minimo, p.precio]));
  } else if (type === 'ventas') {
    filename = 'reporte_ventas';
    rows = [['Folio','Cliente','Total','Fecha']];
    DB.pedidos.filter(p => p.estatus === 'ENTREGADO').forEach(p => rows.push([p.folio, p.cliente, p.total, p.fechaHora]));
  } else if (type === 'entregas') {
    filename = 'reporte_entregas';
    rows = [['Folio','Repartidor','Cliente','Dirección','Total']];
    DB.pedidos.filter(p => p.estatus === 'ENTREGADO').forEach(p => {
      const rep = DB.empleados.find(e => e.id === p.repartidorId);
      rows.push([p.folio, rep ? `${rep.nombre} ${rep.apellidos}` : '—', p.cliente, p.direccion, p.total]);
    });
  }

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast(`📊 ${filename}.csv descargado`, 'success');
}

/* ──────────────────────────────────────
   UTILIDADES / HELPERS
────────────────────────────────────── */
function v(id) { return (document.getElementById(id)?.value || '').trim(); }
function vSet(id, val) { const el=document.getElementById(id); if(el) el.value = val||''; }
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function getRolLabel(rol) { return ROLES_CONFIG.find(r=>r.nombre===rol)?.label||rol; }
function toBase64(file) { return new Promise((res,rej) => { const r=new FileReader(); r.readAsDataURL(file); r.onload=()=>res(r.result); r.onerror=e=>rej(e); }); }

function pillEstatus(e) {
  const map = { PENDIENTE: ['pill-pendiente','⏳ Pendiente'], EN_CAMINO: ['pill-en_camino','🛵 En Ruta'], ENTREGADO: ['pill-entregado','✅ Entregado'], CANCELADO: ['pill-cancelado','❌ Cancelado'] };
  const [cls, label] = map[e] || ['pill-pendiente', e];
  return `<span class="pill ${cls}">${label}</span>`;
}

function showErr(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; el.classList.remove('hidden'); } }

function globalSearchFn() {
  const q = document.getElementById('globalSearch').value.toLowerCase().trim();
  if (!q) return;
  const pedMatch = DB.pedidos.find(p => p.folio?.toLowerCase().includes(q) || p.cliente?.toLowerCase().includes(q));
  if (pedMatch) { switchView('pedidos'); document.getElementById('searchOrders').value = q; renderOrders(); }
}

let toastTimeout;
function toast(msg, type = 'default') {
  const existing = document.querySelector('.toast'); if (existing) existing.remove();
  clearTimeout(toastTimeout); const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg; document.body.appendChild(t);
  toastTimeout = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
}

function clearLocalData() {
    localStorage.clear(); sessionStorage.clear(); location.reload();
}

/* ──────────────────────────────────────
   INICIALIZACIÓN
────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (STATE.darkMode) applyDarkMode();
  const savedUser = sessionStorage.getItem('dp_user'), savedNeg = sessionStorage.getItem('dp_negocio');
  if (savedUser) { 
      STATE.usuario = JSON.parse(savedUser); 
      if(savedNeg) { enterNegocio(JSON.parse(savedNeg)); } 
      else goToNegocios(); 
  } else {
      screen('auth');
  }
});