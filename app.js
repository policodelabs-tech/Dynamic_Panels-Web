document.addEventListener('DOMContentLoaded', () => {

    /* ── TEMA OSCURO / CLARO ── */
    const btnTema    = document.getElementById('btn-tema');
    const body       = document.body;
    const logoNavbar = document.getElementById('navbar-logo-dp');

    const aplicarTema = (light) => {
        body.classList.toggle('light', light);
        if (btnTema)    btnTema.textContent = light ? '🌙' : '☀️';
        if (logoNavbar) logoNavbar.src = light
            ? 'web-Logo-Dynamic-Panels-v1.svg'
            : 'web-Logo-Dynamic-Panels-v2.svg';
    };

    aplicarTema(localStorage.getItem('dp-tema') === 'light');

    if (btnTema) btnTema.addEventListener('click', () => {
        const esLight = body.classList.contains('light');
        aplicarTema(!esLight);
        localStorage.setItem('dp-tema', !esLight ? 'light' : 'dark');
    });

    /* ── NAVBAR SCROLL SHADOW ── */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar) navbar.style.boxShadow = window.scrollY > 10
            ? '0 4px 24px rgba(0,0,0,0.18)'
            : 'none';
    });

    /* ── SCROLL REVEAL ANIMATIONS ── */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.revealDelay || 0, 10);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* ── FAQ ACCORDION ── */
    document.querySelectorAll('.faq-q').forEach(btn => {
        btn.addEventListener('click', () => {
            const item   = btn.parentElement;
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    /* ── CHATBOT ── */
    const btnChat   = document.getElementById('chatbot-toggle');
    const chatWin   = document.getElementById('chatbot-window');
    const closeChat = document.getElementById('close-chat');
    const chatBody  = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const btnEnviar = document.getElementById('btn-enviar-msg');

    if (btnChat)   btnChat.addEventListener('click', () => {
        if (chatWin) chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex';
    });
    if (closeChat) closeChat.addEventListener('click', () => {
        if (chatWin) chatWin.style.display = 'none';
    });

    const addMsg = (txt, tipo) => {
        if (!chatBody) return;
        const d = document.createElement('div');
        d.className = 'mensaje ' + (tipo === 'user' ? 'mensaje-user' : 'mensaje-bot');
        d.textContent = txt;
        chatBody.appendChild(d);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const intenciones = [
        { c: ['hola','buenas','saludos','hey','que tal','buenos dias','buenas tardes'],
          r: '¡Hola! Soy el asistente de Dynamic Panels. Puedo ayudarte con info sobre módulos, roles, planes, el equipo o cómo funciona el sistema. ¿Qué necesitas?' },
        { c: ['que es','dynamic panels','de que trata','para que sirve','sistema','plataforma'],
          r: 'Dynamic Panels es una plataforma SaaS de gestión operativa para negocios. Incluye 7 módulos: Dashboard, Pedidos (con Kanban), Flota con mapa en tiempo real, Personal, Inventario, Métricas y Reportes. Funciona 100% en el navegador, sin backend.' },
        { c: ['dashboard','panel principal','kpi','vista general','inicio'],
          r: 'El Dashboard muestra en tiempo real: KPIs (total pedidos, ventas del día, empleados activos y tasa de entregas), tabla de pedidos recientes, log de actividad del equipo y estado de los repartidores (en ruta vs disponible).' },
        { c: ['pedido','pedidos','kanban','folio','entrega','orden'],
          r: 'El módulo de Pedidos permite crear, asignar y rastrear cada pedido con folio automático #PD-XXXX. Tiene vista de tabla y vista Kanban con columnas: Pendiente → En Ruta → Entregado → Cancelado. La asignación de repartidor es automática.' },
        { c: ['flota','mapa','repartidor','ruta','leaflet','openstreetmap','ubicacion','tiempo real'],
          r: 'El módulo de Flota muestra un mapa interactivo (OpenStreetMap, gratuito) con los repartidores en tiempo real. Los marcadores se actualizan cada 4 segundos. Puedes ver quién está disponible, en ruta y qué pedido lleva cada uno.' },
        { c: ['personal','empleado','empleados','equipo','tareas','roles','invitacion','codigo'],
          r: 'El módulo Personal tiene 3 pestañas: (1) Empleados — cards con avatar, rol y sueldo; (2) Roles — tabla visual de permisos por cada rol; (3) Tareas — tablero Kanban (Por hacer / En progreso / Terminado). Para invitar empleados se genera un código DIT-XXXX-XXXX.' },
        { c: ['inventario','stock','producto','mercancia','almacen','entrada'],
          r: 'El módulo de Inventario controla productos con nombre, categoría, unidad, precio, stock actual y stock mínimo. Genera alertas de stock crítico. Registra entradas de mercancía con proveedor. Al entregar un pedido, el stock se descuenta automáticamente.' },
        { c: ['metricas','reportes','estadisticas','analitica','desempeno','ventas'],
          r: 'Los módulos de Métricas y Reportes analizan: volumen de pedidos por estado, tendencias de ventas, rendimiento por repartidor, productos más vendidos, niveles de inventario históricos y nómina estimada por rol.' },
        { c: ['config','configuracion','perfil','negocio','logo','editar'],
          r: 'Desde Configuración puedes editar tu perfil (nombre, apellidos, teléfono, bio, avatar) y, si eres Administrador, los datos del negocio (nombre, logo, correo, teléfono). Los cambios se guardan en localStorage.' },
        { c: ['administrador','supervisor','cajero','almacenista','permiso','acceso','rol'],
          r: 'El sistema tiene 5 roles:\n• Administrador: acceso total\n• Supervisor: sin config\n• Cajero: pedidos + inventario básico\n• Repartidor: solo sus pedidos\n• Almacenista: solo inventario\nCada rol ve únicamente su módulo.' },
        { c: ['backend','servidor','hosting','localstorage','tecnologia','como funciona','funciona sin'],
          r: 'Dynamic Panels funciona 100% en el navegador. No necesita servidor propio ni hosting. Los datos se guardan en localStorage del navegador. El mapa usa OpenStreetMap (gratuito). Puedes abrir el archivo HTML y empezar a operar de inmediato.' },
        { c: ['negocio','negocios','varios','multiples','sucursal'],
          r: 'Puedes crear varios negocios desde una sola cuenta (3 con el plan Crecimiento+, hasta 5 con Crecimiento PRO). Cada negocio tiene su propio equipo, inventario y datos completamente separados.' },
        { c: ['precio','costo','plan','planes','suscripcion','pago','mensual'],
          r: '3 planes disponibles:\n• Crecimiento+ — $499 MXN/mes: 3 negocios, 10 empleados c/u\n• Crecimiento PRO — $899 MXN/mes: 5 negocios, 20 empleados c/u, IA avanzada\n• Gestión Labs — $1,118 MXN/mes: Dynamic Panels PRO + Delivery In-Transit PRO con 20% de descuento' },
        { c: ['delivery','in-transit','reparto','delivery in transit'],
          r: 'Delivery In-Transit es el sistema hermano de Dynamic Panels, también de Policode Labs, enfocado en la logística de repartos. El plan Gestión Labs incluye ambos sistemas con 20% de descuento.' },
        { c: ['equipo','policode','policode labs','abraham','valentina','alexander','sebastian','creadores','desarrolladores'],
          r: 'Dynamic Panels fue desarrollado por Policode Labs:\n• Abraham Gutiérrez — Líder, arquitectura y lógica de negocio\n• María Valentina Islas — Diseño UX y frontend\n• Alexander Modesto — Componentes interactivos y mapa Leaflet\n• Sebastián Moreno — Módulos de métricas y gestión de estado' },
        { c: ['adios','bye','hasta luego','gracias','ok gracias'],
          r: '¡Con gusto! Si tienes más dudas sobre Dynamic Panels, aquí estaré. ¡Éxito con tu negocio! 🚀' },
    ];

    const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const responder = (msg) => {
        const t = normalizar(msg);
        for (const i of intenciones)
            for (const c of i.c)
                if (t.includes(normalizar(c))) return i.r;
        return 'Hmm, no tengo info sobre eso específicamente. Puedo ayudarte con: módulos del sistema, roles, planes y precios, el equipo, o cómo funciona. ¿Cuál te interesa?';
    };

    const enviar = () => {
        if (!chatInput) return;
        const txt = chatInput.value.trim();
        if (!txt) return;
        addMsg(txt, 'user');
        chatInput.value = '';
        setTimeout(() => addMsg(responder(txt), 'bot'), 650);
    };

    if (btnEnviar) btnEnviar.addEventListener('click', enviar);
    if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviar(); });
});
