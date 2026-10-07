document.addEventListener('DOMContentLoaded', () => {

    // Los accesos rápidos usan la navegación existente y respetan sus permisos.
    function syncQuickAccessButtons() {
        document.querySelectorAll('.dashboard-app-button').forEach(button => {
            const nav = document.getElementById(button.dataset.navTarget);
            button.hidden = !nav || getComputedStyle(nav).display === 'none';
        });
    }
    document.querySelectorAll('.dashboard-app-button').forEach(button => {
        button.addEventListener('click', () => {
            const nav = document.getElementById(button.dataset.navTarget);
            if (!nav || getComputedStyle(nav).display === 'none') return;
            const link = nav.querySelector('a');
            if (link) link.click();
        });
    });


    // Preferencia de la barra lateral de escritorio; el menú móvil conserva su drawer.
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const sidebarPreferenceKey = 'support-sidebar-collapsed';

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        const label = link.querySelector('.nav-label');
        if (!label) return;
        const name = label.cloneNode(true);
        name.querySelectorAll('.badge, .nav-badge').forEach(badge => badge.remove());
        const text = name.textContent.replace(/\s+/g, ' ').trim();
        link.setAttribute('aria-label', text);
        link.title = text;
    });

    function setSidebarCollapsed(collapsed) {
        if (!dashboardContainer || !sidebarToggleBtn) return;
        dashboardContainer.classList.toggle('sidebar-collapsed', collapsed);
        sidebarToggleBtn.setAttribute('aria-expanded', String(!collapsed));
        const label = collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral';
        sidebarToggleBtn.setAttribute('aria-label', label);
        sidebarToggleBtn.title = label;
        sidebarToggleBtn.querySelector('span').textContent = collapsed ? 'Expandir menú' : 'Contraer menú';
        sidebarToggleBtn.querySelector('i').className = collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    }

    try {
        setSidebarCollapsed(localStorage.getItem(sidebarPreferenceKey) === 'true');
    } catch (_) {
        setSidebarCollapsed(false);
    }
    if (sidebarToggleBtn && dashboardContainer) {
        sidebarToggleBtn.addEventListener('click', () => {
            const collapsed = !dashboardContainer.classList.contains('sidebar-collapsed');
            setSidebarCollapsed(collapsed);
            try {
                localStorage.setItem(sidebarPreferenceKey, String(collapsed));
            } catch (_) {
                // La opción sigue funcionando si el navegador bloquea el almacenamiento.
            }
        });
    }

    // ============================================
    // CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
    // ============================================
    const SUPABASE_URL = 'https://gabaztpewsauikxqcvnq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_jYl2N_pEwJLJhW77Lvf7Jg_zcD5TcMB';
    
    let supabase = null;
    let useLocalFallback = false;
    let currentSession = null;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase conectado correctamente.');
            } catch (err) {
                console.error('Error al inicializar Supabase, usando LocalStorage:', err);
                useLocalFallback = true;
            }
        } else {
            console.warn('Faltan credenciales de Supabase. Usando LocalStorage.');
            useLocalFallback = true;
        }
    } else {
        console.warn('Librería de Supabase no encontrada. Usando LocalStorage.');
        useLocalFallback = true;
    }

    // ============================================
    // SISTEMA DINÁMICO DE USUARIOS
    // ============================================
    const DEFAULT_USERS = [
        { nombre: 'Belfor Aburto', email: 'belfor.aburto@t-sales.cl', password: '143belfor@', role: 'admin', rut: 'belfor' },
        { nombre: 'Felipe Olivares', email: 'felipe.olivares@t-sales.cl', password: 'felipe2026@@', role: 'admin', rut: 'felipe' },
        { nombre: 'Omar Gálvez', email: 'omar.galvez@t-sales.cl', password: 'omar2026@##', role: 'admin', rut: 'omar' }
    ];

    // ============================================
    // BASE DE DATOS DE COLABORADORES (3 EMPRESAS)
    // ============================================
    const DEFAULT_DIRECTORY_USERS = [{"nombre": "Aaron Alegria Rodriguez", "rut": "21491922-2", "email": "aaron.alegria@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Agustin Ignacio Silva Molina", "rut": "21.730.894-1", "email": "agustin.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Aixis Echeto", "rut": "27.331.280-3", "email": "aixis.echeto@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Alejandra Pamela Rivera Romero", "rut": "Sin RUT / Externo", "email": "alejandra.rivera_telefonica.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Alejandra Pamela Rivera Romero", "rut": "Sin RUT / Externo", "email": "alejandra.rivera_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Alejandro Rodrigo San Martín", "rut": "18.049.691-2", "email": "alejandro.sanmartin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Alexcein Ramos", "rut": "21593033-5", "email": "alexcein.ramos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Alicia Monica Escobar", "rut": "10.443.570-K", "email": "alicia.escobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Alondra Guisselle Flores Cabrera", "rut": "20.237.337-2", "email": "alondra.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Ana Riquelme", "rut": "Sin RUT / Externo", "email": "ana.riquelme@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Anabelen Godoy", "rut": "17.739.020-8", "email": "anabelen.godoy@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Andrea Casanga", "rut": "10.985.324-0", "email": "andrea.casanga@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Andres Ignacio Lagos Silva", "rut": "15355013-1", "email": "andres.lagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Angelo Nicolás Silva González", "rut": "17.951.308-0", "email": "angelo.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Anthony German", "rut": "26007243-9", "email": "anthony.german@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Antoine Jesús Vergara Estuardo", "rut": "21.336.169-4", "email": "antoine.vergara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ariel Garcia", "rut": "Sin RUT / Externo", "email": "ariel.garcia@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Ariki Alexander", "rut": "20.544.591-9", "email": "ariki.alexander@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Auditoria T-sales", "rut": "Sin RUT / Externo", "email": "auditorias@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Bastian Ferrada", "rut": "18.976.644-0", "email": "bastian.ferrada@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Beatriz Macarena Zuñiga Olavarria", "rut": "Sin RUT / Externo", "email": "beatriz.zuniga_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Belen Berenice Salas Mena", "rut": "18279015-K", "email": "belen.salas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Belfor Ignacio Aburto Vera", "rut": "20.667.530-6", "email": "belfor.aburto@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Benjamin Andrade", "rut": "21594016-0", "email": "benjamin.andrade@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Benjamín Muñoz Schtingre", "rut": "19.688.526-9", "email": "benjamin.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Billy Giron", "rut": "Freelance?", "email": "billy.giron@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Braulio Vargas", "rut": "21723010-1", "email": "braulio.vargas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Camila Andrea Salas Marchant", "rut": "18.722.344-K", "email": "camila.salas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Montoya", "rut": "18.999.748-5", "email": "camila.montoya@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Camilo Llanquileo", "rut": "16.557.446-K", "email": "Camilo.llanquileo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carla Acevedo", "rut": "18.737.462-6", "email": "Carla.acevedo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Carlos  Pulgar", "rut": "27187056-6", "email": "carlos.pulgar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carlos Patricio Cornejo Faber", "rut": "18739663-K", "email": "carlos.cornejo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carlos Yañez", "rut": "10.536.703-1", "email": "carlos.yanez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carmen  Rojas", "rut": "11.133.637-7", "email": "carmen.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carolina  Sánchez", "rut": "18.748.275-5", "email": "carolina.sanchez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carolina Vera Millapán", "rut": "15.412.748-8", "email": "carolina.vera@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Caroline Diaz", "rut": "16.976.668-1", "email": "caroline.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Catalina  Barrios Leal", "rut": "19818453-5", "email": "catalina.barrios@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Cordero Lopez", "rut": "19.343.471-1", "email": "catalina.cordero@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Fernanda Tobar Silva", "rut": "20.059.789-3", "email": "catalina.tobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Lagos", "rut": "20.122.150-1", "email": "catalina.lagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cesar Ruiz", "rut": "25.932.400-9", "email": "cesar.ruiz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Constanza Ailyn Hernandez Montesino", "rut": "19277774-7", "email": "constanza.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Constanza Ramirez", "rut": "17908781-2", "email": "constanza.ramirez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Cristian Andre Muñoz Gaete", "rut": "21092269-5", "email": "cristian.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cristian Lira", "rut": "10.789.343-1", "email": "cristian.lira@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Cristian Pedro Flores Salas", "rut": "12.626.278-7", "email": "cristian.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Crystal Avril Marquez Nuñez", "rut": "21.395.345-1", "email": "crystal.marquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Daniel Hinojosa", "rut": "15564716-7", "email": "daniel.hinojosa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Dayana Franchesca Gonzalez Lopez", "rut": "17.852.271-K", "email": "dayana.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Deborah Alejandra Maulen Morales", "rut": "17.515.480-9", "email": "deborah.maulen@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Delmira Urrea", "rut": "12.854.779-7", "email": "delmira.urrea@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Detalle  Comisional", "rut": "Sin RUT / Externo", "email": "detalle.comisional@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Dina Bazcur", "rut": "15626531-4", "email": "dina.bazcur@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Eddy Velazco", "rut": "33548496-7", "email": "Eddy.velazco@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Edwars Hernandez", "rut": "44279806-0", "email": "edwars.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Empresa T-sales", "rut": "Sin RUT / Externo", "email": "Empresa@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Empresa T-sales", "rut": "Sin RUT / Externo", "email": "administrador@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Erick Guillermo Valdes Garate", "rut": "16376647-7", "email": "erick.valdes@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Erika Yasna Galindo Chavez", "rut": "11789680-", "email": "erika.galindo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Estefania Andrea Apuero Villavicencio", "rut": "20789723-K", "email": "estefania.apuero@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ester Flores", "rut": "13.667.332-7", "email": "Ester.Flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Eugenia Palma", "rut": "20.079.001-4", "email": "Eugenia.palma@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Felipe Olivares", "rut": "21.059.858-8", "email": "felipe.olivares@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Felipe Ruiz", "rut": "16.300.652-9", "email": "felipe.ruiz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Fernanda Galvez", "rut": "15.076.870-5", "email": "fernanda.galvez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Flor  Quiroz", "rut": "23.158.867-1", "email": "flor.quiroz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Folios Folios", "rut": "Sin RUT / Externo", "email": "folios@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Francisca Ignacia Torres Basaure", "rut": "20530023-6", "email": "francisca.torres@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Javier Reyes Hidalgo", "rut": "Sin RUT / Externo", "email": "fjreyesh_atento.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Francisco Javier Salazar Cifuentes", "rut": "18.809.351-5", "email": "francisco.salazar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Franco Nicolas Nacarate Valenzuela", "rut": "19801992-5", "email": "franco.nacarate@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franni Pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda_infinet.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Franni Pineda", "rut": "26.323.503-7", "email": "franni.pineda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "franni.pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda_vprime.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Gabriel Rolando Alfredo   Rojas López", "rut": "18755934-0", "email": "gabriel.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gary Ulloa", "rut": "16.146.769-3", "email": "gary.ulloa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Genesis Calderon", "rut": "17.579.271-6", "email": "genesis.calderon@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "gestion y actividad comercial", "rut": "Sin RUT / Externo", "email": "gestionyactividadcomercial@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Gisselle Marambio", "rut": "16.392.639-3", "email": "gisselle.marambio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Graciela Marin", "rut": "15791225-9", "email": "graciela.marin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Gregorio Marin", "rut": "26944814-8", "email": "gregorio.marin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Guillermo Araneda", "rut": "16.342.673-0", "email": "guillermo.araneda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Hernan Diaz", "rut": "Sin RUT / Externo", "email": "hernan.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Hyron Cabrera", "rut": "16.776.782-6", "email": "hyron.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ignacia Fernanda Zeballos Gómez", "rut": "20225024-6", "email": "ignacia.zeballos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ingreso movil", "rut": "Sin RUT / Externo", "email": "Ingresomovil@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ingrid Carolina Silva Cavieres", "rut": "19708647-5", "email": "ingrid.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isadora Aviles", "rut": "19961827-K", "email": "isadora.aviles@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Ivan Padilla", "rut": "16379471-3", "email": "ivan.padilla@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Alejandra Muñoz Morales", "rut": "18.266.770-6", "email": "javiera.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Arriagada Vega", "rut": "19.054.107-K", "email": "javiera.arriagada@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Javiera Paz Navarro Segovia", "rut": "16.441.778-6", "email": "javiera.navarro@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Jean Chamorro", "rut": "15.898.982-4", "email": "jean.chamorro@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Jocelyn Adriana Becerra Marabolí", "rut": "18.514.193-4", "email": "jocelyn.becerra@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jocelyn Elizabeth Garrido Rojas", "rut": "20208069-3", "email": "jocelyn.garrido@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "John Inostroza Rodriguez", "rut": "20.597.732-5", "email": "john.inostroza@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jonny Jesus Torres Landazuri", "rut": "24.163.482-5", "email": "jonny.torres@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Miguel  Hidalgo", "rut": "12.884.465-1", "email": "jose.hidalgo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juan Carlos Pineda", "rut": "27044019-3", "email": "juancarlos.pineda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juan Gonzalez", "rut": "15793579-8", "email": "juan.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juanita Mercedes Rojas Quilapi", "rut": "16.816.815-2", "email": "juanita.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Karen Negrete", "rut": "20.996.241-1", "email": "karen.negrete@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Karen Veas", "rut": "17.533.584-6", "email": "karen.veas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Kleiver Aparicio", "rut": "26.500.762-7", "email": "kleiver.aparicio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Laura Labrador", "rut": "33210327-K", "email": "laura.labrador@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Leandro Benjamín Osorio Sanhuez", "rut": "17.419.752-0", "email": "leandro.osorio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Leonidas Arias", "rut": "18.547.938-2", "email": "leonidas.arias@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Luciano Humberto Salvo Guzman", "rut": "20.915.076-K", "email": "luciano.salvo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Luis Gonzalo Michea Abarca", "rut": "18.615.058-9", "email": "luis.michea@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "M Arcaje", "rut": "Sin RUT / Externo", "email": "marcaje@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "maac508", "rut": "Sin RUT / Externo", "email": "maac508_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Macarena Millas", "rut": "13.668.329-2", "email": "macarena.millas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Maikol Contreras Barra", "rut": "Sin RUT / Externo", "email": "mcontreras_rids.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Manuel Alejandro Escobar Vargas", "rut": "15.935.607-8", "email": "manuel.escobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Manuel Eduardo Luque Oropeza", "rut": "Sin RUT / Externo", "email": "manuel.luque_telefonica.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Manuel Nicolas Aguila Pantoja", "rut": "19.408.251-7", "email": "manuel.aguila@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Marcela Alvarez Gonzalez", "rut": "19.056.147-K", "email": "marcela.alvarez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Maria Coelho", "rut": "13.696.171-3", "email": "maria.coelho@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Fernanda Vergara", "rut": "18.220.498-6", "email": "maria.vergara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Jose Alarcon Araya", "rut": "17.762.805-0", "email": "maria.alarcon@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Morales", "rut": "17689652-3", "email": "maria.morales@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Solange Jeria Silva", "rut": "17.231.599-2", "email": "maria.jeria@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Martin  Rojas", "rut": "21722957-K", "email": "martin.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Matias Orellana", "rut": "19962070-3", "email": "matias.orellana@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maura Gonzalez", "rut": "18.327.846-0", "email": "maura.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Miriam Gonzalez Sepulveda", "rut": "15350283-8", "email": "Miriam.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Moises Oliveros", "rut": "26.055.393-3", "email": "Moises.oliveros@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Mónica Patricia Benites Cabrera", "rut": "26657801-6", "email": "monica.benites@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "movistar empresa", "rut": "Sin RUT / Externo", "email": "movistar.empresa@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Movistar Empresas", "rut": "Sin RUT / Externo", "email": "movistar.empresas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Natalia Andrea Espinosa Valenzuela", "rut": "20646932-3", "email": "natalia.espinosa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicolas Ignacio Pizarro Salinas", "rut": "Sin RUT / Externo", "email": "nicolas.pizarro_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Nicole Rubilar", "rut": "18.993.855-1", "email": "nicole.rubilar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Nicole Stephanie Troncoso Perez", "rut": "19427788-1", "email": "nicole.troncoso@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Oliver Irarrazabal", "rut": "18083962-3", "email": "oliver.irarrazabal@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Omar Galvez", "rut": "20.534.863-8", "email": "Omar.galvez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Oriana Godoy", "rut": "25306932-5", "email": "oriana.godoy@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Pablo Benjamin Peña Fernandez", "rut": "19.681.383-7", "email": "pablo.pena@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Pablo Quintana", "rut": "13.465.660-3", "email": "Pablodelaquintana@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Pagos", "rut": "Sin RUT / Externo", "email": "pagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Paolo Quinones", "rut": "18.095.094-K", "email": "paolo.quinones@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Power BI Pro+Microsoft 365 Empresa Estándar+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Patricia Rojo", "rut": "8.018.350-K", "email": "capacitaciones@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Patrick Castillo Garcia", "rut": "23.171.582-7", "email": "patrick.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Paulina Diaz", "rut": "17.098.053-0", "email": "Paulina.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Pedro Ballesteros", "rut": "25.288.974-4", "email": "pedro.ballesteros@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Pilar Luna", "rut": "16643117-4", "email": "pilar.luna@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Priscilla Villasmil", "rut": "26498330-4", "email": "priscilla.villasmil@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Rafael Domingo Roca Moreno", "rut": "26.975.029-4", "email": "rafael.roca@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Raquel Gajardo", "rut": "11.133.637-7", "email": "raquel.gajardo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ricardo Ciudad Arenas", "rut": "20.289.050-4", "email": "ricardo.ciudad@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rita Rojas", "rut": "19.498.994-6", "email": "rita.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Robmary Medina", "rut": "26995995-9", "email": "robmary.medina@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Rodrigo  Contreras", "rut": "20906780-3", "email": "rodrigo.contreras@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "RRHH", "rut": "Sin RUT / Externo", "email": "rrhh@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rufmary Galvao", "rut": "26889742-9", "email": "rufmary.galvao@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "SALA -1 LATADIA 4602", "rut": "Sin RUT / Externo", "email": "SALA1LATADIA4602@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "SALA -1 LATADIA 4602, LAS CONDES", "rut": "Sin RUT / Externo", "email": "SALA1LATADIA4602LASCONDES@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Sebastián Vega", "rut": "15888816-5", "email": "sebastian.vega@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "servicioprivado", "rut": "Sin RUT / Externo", "email": "servicioprivado@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Sofia De Las Mercedes Tabilo Gutierrez", "rut": "17.090.887-2", "email": "sofia.tabilo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Solange Valenzuela", "rut": "12.244.587-9", "email": "solange.valenzuela@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Soporte  T-sales", "rut": "Sin RUT / Externo", "email": "soporte@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Soporte de Ventas", "rut": "Sin RUT / Externo", "email": "soportedeventas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Tamara Beatriz Gutierrez Toledo", "rut": "19.748.082-3", "email": "tamara.gutierrez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Tanara Carreño", "rut": "17.444.759-4", "email": "tanara.carreno@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Telefonica", "rut": "Sin RUT / Externo", "email": "telefonica@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "tuportabilidad", "rut": "Sin RUT / Externo", "email": "tuportabilidad@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valentina Ignacia Mayolafquen Araya", "rut": "21570442-4", "email": "valentina.mayolafquen@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valentina Pérez", "rut": "20.160.398-6", "email": "valentina.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Estefanía Pérez Urbina", "rut": "19.306.687-9", "email": "valeria.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Paz García Díaz", "rut": "20725999-3", "email": "valeria.garcia@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valerie Belen Avenaño Barraza", "rut": "20.590.850-1", "email": "valerie.avendano@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeska Blas", "rut": "21.281.265-K", "email": "valeska.blas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Vanessa Castillo", "rut": "17.691.945-0", "email": "vanessa.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Vanessa Lopez", "rut": "26.039.502-5", "email": "vanessa.lopez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Venta Empresa", "rut": "Sin RUT / Externo", "email": "venta.empresas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "ventas movil", "rut": "Sin RUT / Externo", "email": "ventas.movil@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ventas Pyme", "rut": "Sin RUT / Externo", "email": "ventaspyme@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Ventas Pyme fijo", "rut": "Sin RUT / Externo", "email": "ventaspymefijo@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Victoria Elizabeth Moreno Castro", "rut": "16.623.154-K", "email": "victoria.moreno@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Vilma Magdalena Cotrina Leon", "rut": "22.488.898-8", "email": "vilma.cotrina@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Visado Folios", "rut": "Sin RUT / Externo", "email": "visado@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Yaneth Teresa Garrido Lugo", "rut": "25638683-6", "email": "yaneth.garrido@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yeimmi Andrea Córdova Cayunao", "rut": "16.923.411-6", "email": "yeimmi.cordova@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Amaya", "rut": "25564174-3", "email": "yenifer.amaya@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Perez", "rut": "22854195-8", "email": "yenifer.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Power BI Pro+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Alexis Feliu Rabaji", "rut": "15362254-k", "email": "alexis.feliu@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Andrés Rabba Kassis", "rut": "20443850-1", "email": "andres.rabba@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Anghelyna Montoya", "rut": "27432536-4", "email": "anghelyna.montoya@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Bastian Matias Farias Manriquez", "rut": "21.564.274-7", "email": "bastian.farias@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Beryen Osuna", "rut": "27145387-6", "email": "beryen.osuna@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "blanca del pilar peña mondaca", "rut": "22741381-6", "email": "blanca.mondaca@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carla Paz Toro Hernandez", "rut": "16911897-3", "email": "carla.toro@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carmen Luisa Arvelo Arvelo", "rut": "26693909-4", "email": "carmen.arvelo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cristofer Ramirez", "rut": "26556872-6", "email": "cristofer.ramirez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniel Fernando Mariangel Muñoz", "rut": "7874669-6", "email": "daniel.mariangel@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniela Alejandra  Arellano Bastias", "rut": "18389881-7", "email": "daniela.arellano@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniela Esmeralda Galindo Concha", "rut": "19261970-K", "email": "daniela.galindo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Edilson Brito", "rut": "27053979-3", "email": "edilson.brito@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Edison Daniel Antil Meliqueo", "rut": "21590720-1", "email": "edison.antil@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Elkis Elihu Daza Mota", "rut": "28224401-2", "email": "elkis.daza@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Evelyn Carolina Mendieta Genes", "rut": "25324129-2", "email": "evelyn.mendieta@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Javier Contreras", "rut": "27125890-9", "email": "francisco.contreras@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franko Javier Guerra Sanhueza", "rut": "18186179-7", "email": "franko.guerra@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franzy Coromoto Monasterio", "rut": "27222077-8", "email": "franzy.coromoto@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "German Robles Cid", "rut": "12909711-6", "email": "german.robles@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gloria Hortensia Fuentes Zenteno", "rut": "16394078-7", "email": "gloria.fuentes@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gonzalo Exequiel Delgado Antiquera", "rut": "17268048-8", "email": "gonzalo.delgado@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gonzalo Patricio Rodriguez Flores", "rut": "16872745-3", "email": "gonzalo.rodriguez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isabel Rodriguez", "rut": "13502775-8", "email": "isabel.rodriguez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jacqueline Castillo Avello", "rut": "11974222-6", "email": "jacqueline.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "jair antonio  vasquez albujar", "rut": "25923180-9", "email": "jair.vasquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Estefany Lara Leiva", "rut": "21773848-2", "email": "javiera.lara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Joiberth Esteban Figueroa Juarez", "rut": "33466914-9", "email": "joiberth.figueroa@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Alvarez Riquelme", "rut": "7894130-8", "email": "jose.alvarez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Cristian Muñoz Parra", "rut": "18594334-8", "email": "jose.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Karen Elisabet Moraga Macaya", "rut": "19020961-K", "email": "karen.moraga@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Lidia Guajardo Valladares", "rut": "16576638-5", "email": "lidia.guajardo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Luzneiris Evelin Guerrero Gudino", "rut": "26067596-6", "email": "luzneiris.guerrero@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "maac_508", "rut": "Sin RUT / Externo", "email": "maac_508_hotmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Mabel Hernandez", "rut": "9721762-9", "email": "mabel.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "mace508", "rut": "Sin RUT / Externo", "email": "mace508_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "MAIRUBI DEL VALLE VELASQUEZ ROJAS", "rut": "26895915-7", "email": "mairubi.velazquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "manuelalejandro.ahumada.can", "rut": "Sin RUT / Externo", "email": "manuelalejandro.ahumada.can_movistar.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Marcos Sebastian Cabrera Neira", "rut": "16314722-k", "email": "marcos.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "mariana de los angeles  sanchez vargas", "rut": "23715100-3", "email": "mariana.sanchez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maribel Paz Sepulveda Farias", "rut": "17028867-k", "email": "maribel.sepulveda@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maricarmen Ossandon", "rut": "18247961-6", "email": "maricarmen.ossandon@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Matias Benjamin Nicolas Cabrera Neira", "rut": "19075791-9", "email": "matias.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nora Cecilia Chandia Cisternas", "rut": "11537802-3", "email": "nora.chandia@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Orlando Andres Lira Hidalgo", "rut": "13540701-1", "email": "orlando.lira@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Paulo Palacios", "rut": "10.816.483-2", "email": "paulo.palacios@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "paulo.palacios2015", "rut": "Sin RUT / Externo", "email": "paulo.palacios2015_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Pedro Alejandro Chavez Figueroa", "rut": "16401527-0", "email": "pedro.chavez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Roger Marquina", "rut": "26611442-7", "email": "roger.marquina@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rosa del Carmen Flores Lazo", "rut": "9276345-5", "email": "rosa.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valentina de Lourdes Rivera Campana", "rut": "18.736.271-7", "email": "valentina.rivera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Víctor Manuel Henriquez Jimenez", "rut": "16241885-8", "email": "victor.henriquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Wendy Guevara", "rut": "26454275-8", "email": "wendy.guevara@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Wilda Adaias Milano Hernandez", "rut": "29140049-3", "email": "wilda.milano@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Administrador Infinet", "rut": "Sin RUT / Externo", "email": "administrador@infinet.cl", "empresa": "Infinet", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Alejandra Morales Sarabia", "rut": "27416890-0", "email": "alejandra.morales@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Anthony Andres Ortiz Vergara", "rut": "21711243-5", "email": "anthony.ortiz@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Barbara Daniela Gomez", "rut": "26717550-0", "email": "barbara.gomez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Brenda Navarro", "rut": "19558008-K", "email": "brenda.navarro@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Bárbara Escobar", "rut": "19283986-6", "email": "barbara.escobar@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Bascur Bilbao", "rut": "17316416-5", "email": "camila.bascur@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Contreras Vera", "rut": "19420268-7", "email": "camila.contreras@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Lizana", "rut": "18737934-2", "email": "camila.lizana@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Martin Mancilla", "rut": "20634454-7", "email": "camila.martin@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Mendoza", "rut": "19847090-2", "email": "camila.mendoza@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carla Muñoz", "rut": "15620343-2", "email": "carla.munoz@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Claudia Etelinda Sánchez Baeza", "rut": "14009460-9", "email": "claudia.sanchez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Damaris Sanchez", "rut": "20466711-K", "email": "damaris.sanchez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniela Pérez", "rut": "15917767-K", "email": "daniela.perez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Detalle Comisional", "rut": "Sin RUT / Externo", "email": "detallecomisional@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Eduardo Antonio Pizarro Puebla", "rut": "16657690-3", "email": "eduardo.pizarro@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Empresa Infinet", "rut": "Sin RUT / Externo", "email": "empresa@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "FRANCISCA MIRANDA", "rut": "20136810-3", "email": "francisca.miranda@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Gonzalez", "rut": "10153894-K", "email": "francisco.gonzalez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franni Pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Freelance Infinet", "rut": "Sin RUT / Externo", "email": "freelance@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gerardo Garcia", "rut": "17495899-8", "email": "gerardo.garcia@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Heber Ascanio Jose Albarran", "rut": "26339465-8", "email": "heber.ascanio@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Iraida Pereira", "rut": "28754361-1", "email": "iraida.pereira@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isadora Aviles", "rut": "Sin RUT / Externo", "email": "isadora.aviles@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Francisca Toro Bravo", "rut": "20156992-3", "email": "javiera.toro@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Miranda", "rut": "19503546-6", "email": "javiera.miranda@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "KIMBERLEY MUÑOZ PARADA", "rut": "20616200-7", "email": "kimberley.munoz@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Karen Barrera Ortiz", "rut": "16287202-8", "email": "karen.barrera@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Katherine Pamela Torres Espinoza", "rut": "18496322-1", "email": "katherine.espinoza@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "MIllali Zuñiga", "rut": "19226506-1", "email": "millali.zuniga@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Macarena Tamara Herrera Maldonado", "rut": "18182971-0", "email": "macarena.herrera@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Malva  Caldera", "rut": "26799818-3", "email": "malva.caldera@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Daniela Castro Meza", "rut": "17695452-3", "email": "maria.castro@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Ignacia Navarrete Friz", "rut": "16936548-2", "email": "maria.navarrete@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Jose Bullones Bolek", "rut": "27565441-8", "email": "maria.bolek@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Martin Huilipan Diaz", "rut": "16264312-6", "email": "martin.huilipan@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "María José Pérez San Martín", "rut": "17306142-0", "email": "maria.perez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Moises Carrasco", "rut": "18184876-6", "email": "moises.carrasco@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Natalia Andrea Mena Moya", "rut": "16191124-0", "email": "natalia.mena@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nathaly Reyes", "rut": "18340192-0", "email": "nathaly.reyes@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicolas Andres Lopez Gutierrez", "rut": "19162756-3", "email": "nicolas.lopez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Pablo Toloza Manriquez", "rut": "16193971-4", "email": "pablo.toloza@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Pagos Infinet", "rut": "Sin RUT / Externo", "email": "pagos@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Patricio Andres Pardo Rojo", "rut": "17490037-k", "email": "patricio.pardo@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Patrick Castillo Garcia", "rut": "Sin RUT / Externo", "email": "patrick.castillo@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Paulina Bateman", "rut": "20557033-0", "email": "paulina.bateman@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "RICARDO RIQUELME", "rut": "16428511-1", "email": "ricardo.riquelme@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Registro Asistencia", "rut": "Sin RUT / Externo", "email": "registrodeasistencia@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rodrigo Cabezas Zuñiga", "rut": "17836904-0", "email": "rodrigo.cabezas@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rose Mary Rivas Pavez", "rut": "16918560-3", "email": "rose.rivas@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sabrina Alejandra Lovazzano Matta", "rut": "17156584-7", "email": "sabrina.lovazzano@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sarah Vera", "rut": "29066402-0", "email": "sarah.vera@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sofia Santibañez Kush", "rut": "16069122-0", "email": "sofia.santibanez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Soporte infinet", "rut": "Sin RUT / Externo", "email": "soporte@infinet.cl", "empresa": "Infinet", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Tomas Osses", "rut": "21550314-3", "email": "tomas.osses@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valerie Belén Avendaño Barraza", "rut": "Sin RUT / Externo", "email": "valerie.avendano@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeska Blas", "rut": "Sin RUT / Externo", "email": "valeska.blas@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Perez", "rut": "Sin RUT / Externo", "email": "yenifer.perez@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yeny Marcela Villa", "rut": "27500182-1", "email": "yeny.villa@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yesebel Carolina Bayuelo Bayuelo", "rut": "27235833-8", "email": "yesebel.bayuelo@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "anais muñoz", "rut": "20.632.397-3", "email": "anais.munoz@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "benito antonio rebolledo tapia", "rut": "17858169-4", "email": "benito.rebolledo@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Administrador Infinet", "rut": "Sin RUT / Externo", "email": "comisiones@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "jorge guzman", "rut": "17006836-K", "email": "jorge.guzman@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "karina sepulveda", "rut": "18481577-K", "email": "karina.sepulveda@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "katherine poblete", "rut": "15617770-9", "email": "katherine.poblete@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "no reply", "rut": "Sin RUT / Externo", "email": "no-reply@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Alejandra Veronica Miranda Carreño", "rut": "18717296-9", "email": "alejandra.miranda@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Benjamín Alegria", "rut": "21530981-9", "email": "benjamin.alegria@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Rivera", "rut": "18548640-0", "email": "camila.rivera@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Aracelly Torrejon Pizarro", "rut": "20187801-2", "email": "camila.torrejon@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Capacitaciones VPrime", "rut": "Sin RUT / Externo", "email": "capacitaciones@vprime.cl", "empresa": "VPrime", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carlos González", "rut": "20553185-8", "email": "carlos.gonzalez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carmen Beatriz Ramirez Garcia", "rut": "25836888-6", "email": "carmen.ramirez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Charlotte Fabiana Donoso Jofre", "rut": "14584291-3", "email": "charlotte.donoso@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cotizaciones VPrime", "rut": "Sin RUT / Externo", "email": "cotizaciones@vprime.cl", "empresa": "VPrime", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cristina Andrea Fuentes Álvarez", "rut": "16088939-K", "email": "cristina.fuentes@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Detalle Comisional VPrime", "rut": "Sin RUT / Externo", "email": "detallecomisional@vprime.cl", "empresa": "VPrime", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Diego Jose Robles Vivanco", "rut": "13550552-8", "email": "diego.robles@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Elizabeth Georgette Fuentes Lagos", "rut": "13755665-0", "email": "elizabeth.fuentes@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Emilia Sandoval", "rut": "21082855-9", "email": "emilia.sandoval@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Empresa vprime", "rut": "Sin RUT / Externo", "email": "empresa@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Felipe Ruiz", "rut": "Sin RUT / Externo", "email": "felipe.ruiz@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Fernanda Pacheco", "rut": "17745861-9", "email": "fernanda.pacheco@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Fernanda Eliana Stein Hernandez", "rut": "16700115-7", "email": "fernanda.stein@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Ignacio Muñoz Gutierrez", "rut": "20534374-1", "email": "francisco.munoz@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franni Pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Giovanni Perez Inzunza", "rut": "17186241-8", "email": "giovanni.perez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gustavo Andres Rodriguez Maureira", "rut": "16746668-0", "email": "gustavo.rodriguez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isidora Elizabeth Ibañez Carrera", "rut": "21445345-2", "email": "isidora.ibanez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jennifer Solange Vera Silva", "rut": "18242852-3", "email": "jennifer.vera@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jessica Romina Arias Rojas", "rut": "15353603-3", "email": "jessica.arias@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Josfel Romero", "rut": "27218312-0", "email": "josfel.romero@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Laura Alegria", "rut": "18458636-3", "email": "laura.alegria@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Laura Ortiz López", "rut": "26647176-9", "email": "laura.ortiz@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Lorena Salas Valdez", "rut": "9981186-2", "email": "lorena.salas@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Luis Manuel Huenchuleo Llevul", "rut": "13929365-7", "email": "luis.huenchuleo@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Manuel Alejandro Sanchez Avalos", "rut": "15404835-9", "email": "manuel.sanchez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Angel Hernandez Galindo", "rut": "27086839-8", "email": "maria.hernandez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Jose Coelho Orellana", "rut": "13696171-3", "email": "maria.coelho@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Marianny Guevara Silva", "rut": "26837748-4", "email": "marianny.guevara@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Mario Pacheco", "rut": "21690097-9", "email": "mario.pacheco@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Michael Albert Herrera Venegas", "rut": "16692567-3", "email": "michael.herrera@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Michel Antonieta Rodriguez Pino", "rut": "16709924-6", "email": "michel.rodriguez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Monica Maldonado", "rut": "15711937-0", "email": "monica.maldonado@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Monica Cordova", "rut": "12909803-1", "email": "monica.cordova@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Monica Guillermina Soto Aedo", "rut": "16030189-9", "email": "monica.soto@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicolas Felipe Álvarez Álvarez", "rut": "19035866-6", "email": "nicolas.alvarez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicolas Hernán Toledo Rojas", "rut": "16547786-3", "email": "nicolas.toledo@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicole Contreras", "rut": "16911762-4", "email": "nicole.contreras@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Norma Bravo", "rut": "13085261-0", "email": "norma.bravo@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Pablo Andrés De La Quintana Appelgreen", "rut": "13465660-3", "email": "pablo.delaquintana@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "pagos vprime", "rut": "Sin RUT / Externo", "email": "pagos@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Paloma Macarena Gomez Silva", "rut": "19058215-9", "email": "paloma.gomez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Patricio Andrés Pardo Rojo", "rut": "17490037-k", "email": "patricio.pardo@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Patrick Castillo Garcia", "rut": "Sin RUT / Externo", "email": "patrick.castillo@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Paz Evelyn Ormeño Mansilla", "rut": "18691985-8", "email": "paz.ormeno@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Priscila Walker Mera", "rut": "15426020-K", "email": "priscila.walker@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Registro Asistencia", "rut": "Sin RUT / Externo", "email": "registrodeasistencia@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rene Salinas Ojeda", "rut": "17516105-8", "email": "rene.salinas@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rodrigo Vasquez", "rut": "Sin RUT / Externo", "email": "rodrigo.vasquez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sebastián Araya", "rut": "17663981-4", "email": "sebastian.araya@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sebastián Felipe Correa Nieto", "rut": "18669826-6", "email": "sebastian.correa@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sergio Labbe", "rut": "13900698-4", "email": "sergio.labbe@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Sofía Carvajal", "rut": "20952748-0", "email": "sofia.carvajal@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Solanda Lopez", "rut": "26498270-7", "email": "solanda.lopez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "soporte vprime", "rut": "Sin RUT / Externo", "email": "soporte@vprime.cl", "empresa": "VPrime", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valentina Martinez", "rut": "18668344-7", "email": "valentina.martinez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Ramirez", "rut": "19707819-7", "email": "valeria.ramirez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Constanza Arratia Bahamondes", "rut": "18613074-K", "email": "valeria.arratia@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valerie Belén Avendaño Barraza", "rut": "Sin RUT / Externo", "email": "valerie.avendano@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeska Blas", "rut": "Sin RUT / Externo", "email": "valeska.blas@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Víctor Calvio", "rut": "19317127-3", "email": "victor.calvio@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ximena Andrea Olivares Nuñez", "rut": "12031046-1", "email": "ximena.olivares@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yasna Karina Leal Carvajal", "rut": "17923232-4", "email": "yasna.leal@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Perez", "rut": "Sin RUT / Externo", "email": "yenifer.perez@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yonathan Patricio Millan Mancilla", "rut": "19817637-0", "email": "yonathan.millan@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}];

    let directoryUsersMemoryCache = null;

    function loadDirectoryUsers() {
        if (Array.isArray(directoryUsersMemoryCache)) return directoryUsersMemoryCache;
        try {
            const raw = localStorage.getItem('company_directory_users');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length >= DEFAULT_DIRECTORY_USERS.length) {
                    directoryUsersMemoryCache = parsed;
                    return directoryUsersMemoryCache;
                }
            }
        } catch(e) {
            console.error('Error loading directory users:', e);
        }
        saveDirectoryUsers(DEFAULT_DIRECTORY_USERS);
        directoryUsersMemoryCache = DEFAULT_DIRECTORY_USERS;
        return directoryUsersMemoryCache;
    }

    function saveDirectoryUsers(users) {
        directoryUsersMemoryCache = users;
        try {
            localStorage.setItem('company_directory_users', JSON.stringify(users));
        } catch(e) {
            console.error('Error saving directory users:', e);
        }
    }

    let supabaseDirectorioTableOk = true;

    async function fetchDirectoryUsersFromSupabase() {
        if (!useLocalFallback && typeof supabase !== 'undefined' && supabase) {
            try {
                const { data, error } = await supabase
                    .from('directorio_usuarios')
                    .select('id, nombre, rut, email, empresa, tipo, licencia, created_at');
                
                if (error) {
                    if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
                        supabaseDirectorioTableOk = false;
                        const warnBanner = document.getElementById('directorio-supabase-warning');
                        if (warnBanner) warnBanner.style.display = 'flex';
                    }
                    return;
                }
                
                if (data && Array.isArray(data)) {
                    supabaseDirectorioTableOk = true;
                    const warnBanner = document.getElementById('directorio-supabase-warning');
                    if (warnBanner) warnBanner.style.display = 'none';

                    // Mapear y mezclar
                    const map = new Map();
                    const localUsers = JSON.parse(localStorage.getItem('company_directory_users')) || DEFAULT_DIRECTORY_USERS;
                    const supabaseEmails = new Set(data.map(u => (u.email || '').toLowerCase()));
                    
                    const usersToUpload = [];

                    // Agregar los locales primero y detectar cuáles faltan en Supabase
                    localUsers.forEach(u => {
                        if (u.email) {
                            const emailLower = u.email.toLowerCase();
                            map.set(emailLower, u);
                            if (!supabaseEmails.has(emailLower)) {
                                usersToUpload.push(u);
                            }
                        }
                    });
                    
                    // Sobrescribir con lo que ya está en Supabase
                    data.forEach(u => {
                        if (u.email) map.set(u.email.toLowerCase(), u);
                    });
                    
                    const merged = Array.from(map.values());
                    
                    saveDirectoryUsers(merged);
                    
                    const directoryPageVisible = document.getElementById('page-usuarios')?.classList.contains('active-page');
                    const directoryTabVisible = document.getElementById('user-tab-directorio-content')?.style.display !== 'none';
                    if (typeof renderDirectoryPage === 'function' && directoryPageVisible && directoryTabVisible) {
                        renderDirectoryPage();
                    }

                    // Subir faltantes por lotes para evitar cientos de peticiones individuales.
                    if (usersToUpload.length > 0) {
                        let successCount = 0;
                        const batchSize = 100;
                        for (let index = 0; index < usersToUpload.length; index += batchSize) {
                            const batch = usersToUpload.slice(index, index + batchSize);
                            try {
                                const { error } = await supabase.from('directorio_usuarios').upsert(batch, { onConflict: 'email' });
                                if (error) {
                                    console.warn('Error sincronizando lote de colaboradores:', error.message);
                                } else {
                                    successCount += batch.length;
                                }
                            } catch(err) {
                                console.warn('Excepción sincronizando lote de colaboradores:', err);
                            }
                        }
                        console.log(`Sincronizados ${successCount} de ${usersToUpload.length} usuarios locales a Supabase.`);
                    }
                }
            } catch (err) {
                console.warn('Error en fetchDirectoryUsersFromSupabase:', err);
            }
        }
    }

    const TICKET_OFFICES_BY_COMPANY = {
        'T-Sales': [
            'Latadia 4602, Las Condes',
            'Agustinas 641, oficina 501, Santiago',
            'Calle Doce Norte 996, Viña del Mar'
        ],
        'VPrime': [
            'Eliodoro Yáñez 2318, Providencia',
            'Agustinas 641, oficina 501, Santiago'
        ],
        'Infinet': [
            'Fanor Velasco 85, oficina 201, Santiago'
        ]
    };

    function updateTicketOfficeOptions(companyName) {
        const officeSelect = document.getElementById('ticket-office');
        if (!officeSelect) return;

        const companyKey = Object.keys(TICKET_OFFICES_BY_COMPANY).find(
            key => normalizeStr(key) === normalizeStr(companyName)
        ) || 'Infinet';
        const offices = TICKET_OFFICES_BY_COMPANY[companyKey];
        const previousOffice = officeSelect.value;

        officeSelect.innerHTML = '';
        if (offices.length > 1) {
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = `Selecciona una sede de ${companyKey}`;
            placeholder.disabled = true;
            placeholder.selected = !offices.includes(previousOffice);
            officeSelect.appendChild(placeholder);
        }

        offices.forEach(office => {
            const option = document.createElement('option');
            option.value = office;
            option.textContent = office;
            option.selected = office === previousOffice || offices.length === 1;
            officeSelect.appendChild(option);
        });

        officeSelect.dataset.company = companyKey;
        officeSelect.setAttribute('aria-label', `Sede de ${companyKey}`);
    }

    function selectCompanyCard(companyName) {
        if (!companyName) return;
        const norm = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetCard = Array.from(document.querySelectorAll('.company-card')).find(c => {
            const cName = (c.getAttribute('data-company') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return cName === norm;
        });
        if (targetCard) {
            document.querySelectorAll('.company-card').forEach(c => {
                c.classList.remove('active');
                c.style.borderColor = 'var(--border-color)';
                const badge = c.querySelector('.company-check-badge');
                if (badge) badge.style.display = 'none';
            });
            targetCard.classList.add('active');
            targetCard.style.borderColor = 'var(--accent-blue)';
            const badge = targetCard.querySelector('.company-check-badge');
            if (badge) badge.style.display = 'flex';
            updateTicketOfficeOptions(targetCard.getAttribute('data-company'));
        }
    }


    let supabaseRolesTableOk = true;
    let userRolesCache = [];
    let userRolesCacheAt = 0;
    let userRolesFetchInFlight = null;

    async function fetchUserRolesFromSupabase() {
        if (userRolesFetchInFlight) return userRolesFetchInFlight;
        if (Date.now() - userRolesCacheAt < 30000) return userRolesCache;

        if (!useLocalFallback && supabase) {
            userRolesFetchInFlight = (async () => {
                try {
                    const { data, error } = await supabase
                        .from('user_roles')
                        .select('*');
                    if (error) {
                        if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
                            supabaseRolesTableOk = false;
                        }
                        throw error;
                    }
                    supabaseRolesTableOk = true;
                    userRolesCache = data || [];
                    userRolesCacheAt = Date.now();
                    return userRolesCache;
                } catch (err) {
                    console.warn('Error fetching roles from Supabase, using local fallback:', err);
                    if (err.code === '42P01' || (err.message && err.message.includes('does not exist'))) {
                        supabaseRolesTableOk = false;
                    }
                    userRolesCacheAt = Date.now();
                    return userRolesCache;
                } finally {
                    userRolesFetchInFlight = null;
                }
            })();
            return userRolesFetchInFlight;
        }
        return [];
    }

    async function updateUserRoleInSupabase(email, role) {
        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('user_roles')
                    .upsert({ email: email.toLowerCase().trim(), role: role }, { onConflict: 'email' });
                if (error) throw error;
                supabaseRolesTableOk = true;
                const normalizedEmail = email.toLowerCase().trim();
                const cachedIndex = userRolesCache.findIndex(item => (item.email || '').toLowerCase() === normalizedEmail);
                if (cachedIndex >= 0) userRolesCache[cachedIndex] = { ...userRolesCache[cachedIndex], role };
                else userRolesCache.push({ email: normalizedEmail, role });
                userRolesCacheAt = Date.now();
                return { success: true };
            } catch (err) {
                console.error('Error updating role in Supabase:', err);
                if (err.code === '42P01' || (err.message && err.message.includes('does not exist'))) {
                    supabaseRolesTableOk = false;
                }
                return { success: false, error: err };
            }
        }
        return { success: true };
    }

    async function loadPlatformUsers() {
        let localUsers = localStorage.getItem('platform_users');
        if (!localUsers) {
            localUsers = DEFAULT_USERS;
            localStorage.setItem('platform_users', JSON.stringify(localUsers));
        } else {
            try {
                localUsers = JSON.parse(localUsers);
            } catch (e) {
                localUsers = DEFAULT_USERS;
            }
        }

        // Asegurar que los usuarios predefinidos siempre estén presentes y actualizados
        DEFAULT_USERS.forEach(defUser => {
            const exists = localUsers.find(u => u.email && u.email.toLowerCase() === defUser.email.toLowerCase());
            if (!exists) {
                localUsers.push(defUser);
            } else {
                if (!exists.password) exists.password = defUser.password;
                if (defUser.role) exists.role = defUser.role;
            }
        });

        const dbRoles = await fetchUserRolesFromSupabase();
        if (dbRoles && dbRoles.length > 0) {
            localUsers = localUsers.map(u => {
                const dbUser = dbRoles.find(r => r.email.toLowerCase() === u.email.toLowerCase());
                if (dbUser) {
                    return { ...u, role: dbUser.role };
                }
                return u;
            });
        }
        localStorage.setItem('platform_users', JSON.stringify(localUsers));
        return localUsers;
    }

    function savePlatformUsers(users) {
        localStorage.setItem('platform_users', JSON.stringify(users));
    }

    // ============================================
    // HELPERS DE FORMATO Y UTILIDADES
    // ============================================
    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        return formatDate(isoString);
    }

    function extractMetadata(ticket) {
        const meta = {
            sede: ticket.sede || '',
            telefono: ticket.telefono || '',
            dispositivo: ticket.dispositivo || '',
            impacto: ticket.impacto || '',
            modalidad: ticket.modalidad || '',
            cliente_nombre: ticket.cliente_nombre || '',
            cliente_rut: ticket.cliente_rut || '',
            cliente_email: ticket.cliente_email || '',
            empresa: ticket.empresa || '',
            tecnico_asignado: ticket.tecnico_asignado || ''
        };

        if (ticket.descripcion) {
            const getVal = (pattern) => {
                const match = ticket.descripcion.match(pattern);
                return match ? match[1].trim() : null;
            };

            const techVal = getVal(/Técnico:\s*([^|\]\n]+)/i);
            if (techVal && (!meta.tecnico_asignado || meta.tecnico_asignado === 'Sin Asignar')) {
                if (techVal !== 'Sin Asignar') {
                    meta.tecnico_asignado = techVal;
                    ticket.tecnico_asignado = techVal;
                }
            }

            const empresaVal = getVal(/Empresa:\s*([^|\]\n]+)/i);
            if (empresaVal && !meta.empresa) meta.empresa = empresaVal;

            const sedeVal = getVal(/Sede:\s*([^|\]]+)/i);
            if (sedeVal && !meta.sede) meta.sede = sedeVal;

            const telfVal = getVal(/Teléfono:\s*([^|\]]+)/i);
            if (telfVal && !meta.telefono) meta.telefono = telfVal;

            const dispVal = getVal(/Dispositivo:\s*([^|\]]+)/i);
            if (dispVal && !meta.dispositivo) meta.dispositivo = dispVal;

            const impVal = getVal(/Impacto:\s*([^|\]]+)/i);
            if (impVal && !meta.impacto) meta.impacto = impVal;

            const modVal = getVal(/Modalidad:\s*([^|\]]+)/i);
            if (modVal && !meta.modalidad) meta.modalidad = modVal;

            const clientPart = getVal(/Cliente:\s*([^|\]\n]+)/i);
            if (clientPart && !meta.cliente_nombre) {
                let cleanClient = clientPart.trim().replace(/\s*-\s*$/, '').trim();
                const emailMatch = cleanClient.match(/-\s*([^\s]+@[^\s]+)$/i);
                if (emailMatch) {
                    meta.cliente_email = emailMatch[1].trim();
                    cleanClient = cleanClient.slice(0, emailMatch.index).trim();
                }
                const rutMatch = cleanClient.match(/\(([^)]*)\)/);
                if (rutMatch && rutMatch[1].trim()) meta.cliente_rut = rutMatch[1].trim();
                cleanClient = cleanClient.replace(/\([^)]*\)/g, '').replace(/\s*-\s*$/, '').trim();
                meta.cliente_nombre = cleanClient || ticket.usuario_nombre || '';
            }
        }

        // Limpiar metadatos antiguos y completar el colaborador desde el directorio.
        if (meta.cliente_nombre) {
            meta.cliente_nombre = meta.cliente_nombre
                .split('|')[0]
                .replace(/\([^)]*\)\s*-?\s*$/, '')
                .replace(/\s*-\s*$/, '')
                .trim();
        }
        const normalizeIdentityRut = value => String(value || '').toLowerCase().replace(/[^0-9k]/g, '');
        const directoryMatch = loadDirectoryUsers().find(user =>
            (meta.cliente_email && normalizeStr(user.email) === normalizeStr(meta.cliente_email)) ||
            (meta.cliente_rut && normalizeIdentityRut(user.rut) === normalizeIdentityRut(meta.cliente_rut)) ||
            (meta.cliente_nombre && normalizeStr(user.nombre) === normalizeStr(meta.cliente_nombre))
        );
        if (directoryMatch) {
            if (!meta.cliente_nombre) meta.cliente_nombre = directoryMatch.nombre || '';
            if (!meta.cliente_rut) meta.cliente_rut = directoryMatch.rut || '';
            if (!meta.cliente_email) meta.cliente_email = directoryMatch.email || '';
            if (!meta.empresa) meta.empresa = directoryMatch.empresa || '';
        }

        // Final fallbacks
        if (!meta.sede) meta.sede = 'Santiago - Casa Matriz';
        if (!meta.telefono) meta.telefono = 'No proporcionado';
        if (!meta.dispositivo || meta.dispositivo === 'ninguno') meta.dispositivo = 'Ninguno / Otro';
        if (!meta.modalidad) meta.modalidad = 'Online';
        const hasClientIdentity = Boolean(meta.cliente_nombre || meta.cliente_rut || meta.cliente_email);
        if (!meta.cliente_nombre) meta.cliente_nombre = !hasClientIdentity ? (ticket.usuario_nombre || 'S/A') : 'S/A';
        if (!meta.cliente_rut) meta.cliente_rut = !hasClientIdentity ? (ticket.usuario_rut || 'S/A') : 'S/A';
        if (!meta.cliente_email) meta.cliente_email = !hasClientIdentity ? (ticket.usuario_email || 'S/A') : 'S/A';

        return meta;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeStr(str) {
        if (!str) return '';
        return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function getCompanyBadgeClass(company) {
        const c = (company || '').toLowerCase();
        if (c.includes('infinet')) return 'badge-infinet';
        if (c.includes('vprime')) return 'badge-vprime';
        return 'badge-tsales';
    }

    const statusClasses = {
        'abierto': 'status-abierto',
        'en progreso': 'status-progreso',
        'en espera': 'status-espera',
        'resuelto': 'status-resuelto'
    };

    const priorityClasses = {
        'crítica': 'priority-critica',
        'critica': 'priority-critica',
        'alta': 'priority-alta',
        'media': 'priority-media',
        'baja': 'priority-baja'
    };

    const priorityBadges = {
        'crítica': '<span class="priority-badge priority-critica"><i class="fas fa-exclamation-circle"></i> Crítica</span>',
        'critica': '<span class="priority-badge priority-critica"><i class="fas fa-exclamation-circle"></i> Crítica</span>',
        'alta': '<span class="priority-badge priority-alta"><i class="fas fa-arrow-up"></i> Alta</span>',
        'media': '<span class="priority-badge priority-media"><i class="fas fa-minus"></i> Media</span>',
        'baja': '<span class="priority-badge priority-baja"><i class="fas fa-arrow-down"></i> Baja</span>'
    };

    // ============================================
    // CONEXIÓN A DATOS (SUPABASE / LOCALSTORAGE)
    // ============================================
    async function fetchTickets() {
        if (!useLocalFallback && supabase) {
            try {
                const data = [];
                const pageSize = 1000;
                for (let from = 0; ; from += pageSize) {
                    const { data: page, error } = await supabase
                        .from('tickets')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .range(from, from + pageSize - 1);
                    if (error) throw error;
                    const rows = Array.isArray(page) ? page : [];
                    data.push(...rows);
                    if (rows.length < pageSize) break;
                }
                
                // Merge local updates (like assignments or status changes that failed on Supabase)
                const localUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
                const mergedData = data.map(t => {
                    let item = { ...t };
                    if (localUpdates[t.id]) {
                        item = { ...item, ...localUpdates[t.id] };
                    }
                    const meta = extractMetadata(item);
                    if (!item.tecnico_asignado && meta.tecnico_asignado && meta.tecnico_asignado !== 'Sin Asignar') {
                        item.tecnico_asignado = meta.tecnico_asignado;
                    }
                    if (!item.cliente_nombre && meta.cliente_nombre) {
                        item.cliente_nombre = meta.cliente_nombre;
                    }
                    if (!item.cliente_rut && meta.cliente_rut) {
                        item.cliente_rut = meta.cliente_rut;
                    }
                    if (!item.cliente_email && meta.cliente_email) {
                        item.cliente_email = meta.cliente_email;
                    }
                    if (!item.empresa && meta.empresa) {
                        item.empresa = meta.empresa;
                    }
                    return item;
                });

                // Si la sesión actual es de un usuario, filtrar por su RUT
                if (currentSession && currentSession.role === 'user') {
                    return mergedData.filter(t => t.usuario_rut === currentSession.rut);
                }
                return mergedData;
            } catch (err) {
                console.error('Error fetching tickets from Supabase, using LocalStorage:', err);
            }
        }
        
        let tickets = JSON.parse(localStorage.getItem('local_tickets'));
        if (!tickets || tickets.length === 0 || !tickets[0].tecnico_asignado) {
            tickets = [
                {
                    id: '12',
                    codigo: 'TK-2026-0012',
                    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                    asunto: 'Error al iniciar sesión en Teams',
                    categoria: 'cuenta',
                    prioridad: 'alta',
                    estado: 'abierto',
                    descripcion: 'No puedo acceder a mi cuenta desde ayer.',
                    usuario_nombre: 'Omar Gálvez',
                    usuario_email: 'omar.galvez@t-sales.cl',
                    tecnico_asignado: 'Omar Gálvez',
                    cliente_nombre: 'Anthony German',
                    cliente_rut: '26007243-9',
                    cliente_email: 'anthony.german@t-sales.cl',
                    empresa: 'T-Sales'
                },
                {
                    id: '11',
                    codigo: 'TK-2026-0011',
                    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
                    asunto: 'Problema con la VPN corporativa',
                    categoria: 'redes',
                    prioridad: 'media',
                    estado: 'en progreso',
                    descripcion: 'No logro establecer conexión a la VPN corporativa desde mi equipo.',
                    usuario_nombre: 'Felipe Olivares',
                    usuario_email: 'felipe.olivares@t-sales.cl',
                    tecnico_asignado: 'Felipe Olivares',
                    cliente_nombre: 'Francisca Morales Castro',
                    cliente_rut: '19456789-0',
                    cliente_email: 'francisca.morales@t-sales.cl',
                    empresa: 'T-Sales'
                },
                {
                    id: '10',
                    codigo: 'TK-2026-0010',
                    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
                    asunto: 'Solicitud de licencia Office M365',
                    categoria: 'software',
                    prioridad: 'baja',
                    estado: 'en espera',
                    descripcion: 'Solicito activación de licencia para el uso de Excel y Word en mi laptop de trabajo.',
                    usuario_nombre: 'Belfor Aburto',
                    usuario_email: 'belfor.aburto@t-sales.cl',
                    tecnico_asignado: 'Belfor Aburto',
                    cliente_nombre: 'Aaron Andres Aros',
                    cliente_rut: '20123456-7',
                    cliente_email: 'aaron.aros@infinet.cl',
                    empresa: 'Infinet'
                },
                {
                    id: '9',
                    codigo: 'TK-2026-0009',
                    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
                    asunto: 'Lentitud y desconexión de Wifi',
                    categoria: 'redes',
                    prioridad: 'media',
                    estado: 'resuelto',
                    descripcion: 'La red wifi de la oficina se desconecta continuamente y presenta lentitud en la navegación.',
                    usuario_nombre: 'Omar Gálvez',
                    usuario_email: 'omar.galvez@t-sales.cl',
                    tecnico_asignado: 'Omar Gálvez',
                    cliente_nombre: 'Camila Sepulveda',
                    cliente_rut: '18765432-1',
                    cliente_email: 'camila.sepulveda@vprime.cl',
                    empresa: 'VPrime'
                },
                {
                    id: '8',
                    codigo: 'TK-2026-0008',
                    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
                    asunto: 'Error en la plataforma',
                    categoria: 'configuracion',
                    prioridad: 'alta',
                    estado: 'resuelto',
                    descripcion: 'La plataforma muestra un error al guardar.',
                    usuario_nombre: 'Felipe Olivares',
                    usuario_email: 'felipe.olivares@t-sales.cl',
                    tecnico_asignado: 'Felipe Olivares',
                    cliente_nombre: 'Diego Valenzuela',
                    cliente_rut: '17987654-3',
                    cliente_email: 'diego.valenzuela@t-sales.cl',
                    empresa: 'T-Sales'
                }
            ];
            localStorage.setItem('local_tickets', JSON.stringify(tickets));
        }

        // Si la sesión actual es de un usuario, filtrar por su RUT
        if (currentSession && currentSession.role === 'user') {
            tickets = tickets.filter(t => t.usuario_rut === currentSession.rut);
        }
        return tickets;
    }

    async function saveTicket(asunto, categoria, descripcion, prioridad = 'media', sede = '', telefono = '', dispositivo = '', impacto = '', modalidad = 'Online', cliente_nombre = '', cliente_rut = '', cliente_email = '', empresa = 'Infinet', tecnico_asignado = null, estado = 'abierto', resolucion_nota = '') {
        let u_nombre = currentSession ? currentSession.nombre : 'Usuario Externo';
        let u_email = currentSession ? currentSession.email : 'correo@empresa.com';
        let u_rut = currentSession ? currentSession.rut : '';

        if (currentSession && currentSession.role === 'admin') {
            const creatorSelect = document.getElementById('ticket-creator-select');
            if (creatorSelect && creatorSelect.parentElement && creatorSelect.parentElement.style.display !== 'none') {
                u_nombre = creatorSelect.value;
                const emails = {
                    'Felipe Olivares': 'felipe.olivares@t-sales.cl',
                    'Omar Gálvez': 'omar.galvez@t-sales.cl',
                    'Belfor Aburto': 'belfor.aburto@t-sales.cl'
                };
                u_email = emails[u_nombre] || 'soporte@t-sales.cl';
                u_rut = 'admin';
            }
        }

        const validTech = (tecnico_asignado && String(tecnico_asignado).trim() !== '' && tecnico_asignado !== 'Sin Asignar') ? String(tecnico_asignado).trim() : null;
        const finalStatus = estado || 'abierto';
        const isResolved = (finalStatus === 'resuelto' || finalStatus === 'cerrado');

        const ticketData = {
            asunto,
            categoria,
            descripcion,
            prioridad: prioridad || 'media',
            sede,
            telefono,
            dispositivo,
            impacto,
            modalidad,
            cliente_nombre,
            cliente_rut,
            cliente_email,
            empresa,
            estado: finalStatus,
            usuario_rut: u_rut,
            usuario_nombre: u_nombre,
            usuario_email: u_email,
            tecnico_asignado: validTech,
            resolucion: isResolved ? (resolucion_nota || 'Caso resuelto directamente durante el registro.') : null,
            fecha_resolucion: isResolved ? new Date().toISOString() : null
        };

        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .insert([ticketData])
                    .select();
                if (error) {
                    console.warn('Inserting with extended fields failed, retrying with standard fields:', error);
                    const standardData = {
                        asunto,
                        categoria,
                        descripcion: `[Empresa: ${empresa}]\n\n${descripcion}\n\n[Sede: ${sede} | Teléfono: ${telefono} | Dispositivo: ${dispositivo} | Impacto: ${impacto} | Modalidad: ${modalidad} | Cliente: ${cliente_nombre} (${cliente_rut}) - ${cliente_email} | Técnico: ${validTech || 'Sin Asignar'}${resolucion_nota ? ' | Solución: ' + resolucion_nota : ''}]`,
                        prioridad: prioridad || 'media',
                        estado: finalStatus,
                        usuario_rut: ticketData.usuario_rut,
                        usuario_nombre: ticketData.usuario_nombre,
                        usuario_email: ticketData.usuario_email
                    };
                    const { data: retryData, error: retryError } = await supabase
                        .from('tickets')
                        .insert([standardData])
                        .select();
                    if (retryError) throw retryError;
                    if (retryData && retryData[0]) {
                        const localUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
                        localUpdates[retryData[0].id] = {
                            tecnico_asignado: validTech,
                            cliente_nombre,
                            cliente_rut,
                            cliente_email,
                            empresa,
                            sede,
                            telefono,
                            modalidad,
                            dispositivo,
                            impacto,
                            estado: finalStatus,
                            resolucion: ticketData.resolucion,
                            fecha_resolucion: ticketData.fecha_resolucion
                        };
                        localStorage.setItem('ticket_updates', JSON.stringify(localUpdates));
                        return { ...retryData[0], ...localUpdates[retryData[0].id] };
                    }
                    return retryData[0];
                }
                return data[0];
            } catch (err) {
                console.error('Error saving ticket in Supabase, using LocalStorage:', err);
            }
        }

        const tickets = JSON.parse(localStorage.getItem('local_tickets')) || [];
        const nextNum = tickets.length + 1;
        const newTicket = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
            codigo: `TK-2026-${String(nextNum).padStart(4, '0')}`,
            created_at: new Date().toISOString(),
            ...ticketData
        };
        tickets.unshift(newTicket);
        localStorage.setItem('local_tickets', JSON.stringify(tickets));
        return newTicket;
    }

    async function deleteTicket(ticketId) {
        if (!currentSession || currentSession.role !== 'admin') {
            alert('No tienes permisos para eliminar este ticket.');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
            return;
        }

        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .delete()
                    .eq('id', ticketId);
                if (error) throw error;
            } catch (err) {
                console.error('Error deleting ticket from Supabase, using LocalStorage fallback:', err);
            }
        }

        const tickets = JSON.parse(localStorage.getItem('local_tickets')) || [];
        const filtered = tickets.filter(t => t.id !== ticketId);
        localStorage.setItem('local_tickets', JSON.stringify(filtered));

        alert('Ticket eliminado correctamente.');
        await refreshTickets();
    }

    async function fetchReplies(ticketId) {
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('ticket_respuestas')
                    .select('*')
                    .eq('ticket_id', ticketId)
                    .order('created_at', { ascending: true });
                if (error) throw error;
                return data;
            } catch (err) {
                console.error('Error fetching replies from Supabase, using LocalStorage:', err);
            }
        }

        const replies = JSON.parse(localStorage.getItem('local_replies')) || [];
        return replies.filter(r => r.ticket_id === String(ticketId));
    }

    async function saveReply(ticketId, autor, mensaje) {
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('ticket_respuestas')
                    .insert([{ ticket_id: ticketId, autor, mensaje }])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error('Error saving reply in Supabase, using LocalStorage:', err);
            }
        }

        const replies = JSON.parse(localStorage.getItem('local_replies')) || [];
        const newReply = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
            ticket_id: String(ticketId),
            created_at: new Date().toISOString(),
            autor,
            mensaje
        };
        replies.push(newReply);
        localStorage.setItem('local_replies', JSON.stringify(replies));
        return newReply;
    }

    async function updateTicketStatus(ticketId, estado) {
        const fields = { estado };
        if (estado === 'resuelto') {
            fields.resuelto_por = currentSession ? currentSession.nombre : 'Soporte';
        } else {
            fields.resuelto_por = null;
        }

        // Save to local updates first so it is preserved even if Supabase update fails!
        const localUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
        localUpdates[ticketId] = { ...(localUpdates[ticketId] || {}), ...fields };
        localStorage.setItem('ticket_updates', JSON.stringify(localUpdates));

        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update(fields)
                    .eq('id', ticketId);
                if (error) throw error;

                // Clear local update if database write succeeds
                const freshUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
                delete freshUpdates[ticketId];
                localStorage.setItem('ticket_updates', JSON.stringify(freshUpdates));
            } catch (err) {
                console.warn('Error updating ticket status in Supabase, using LocalStorage fallback:', err);
            }
        }

        const tickets = JSON.parse(localStorage.getItem('local_tickets')) || [];
        const tIndex = tickets.findIndex(t => t.id === String(ticketId));
        if (tIndex !== -1) {
            tickets[tIndex].estado = estado;
            tickets[tIndex].resuelto_por = fields.resuelto_por;
            localStorage.setItem('local_tickets', JSON.stringify(tickets));
            return true;
        }
        return false;
    }

    async function updateTicketFields(ticketId, fieldsToUpdate) {
        // Save to local updates first so it is preserved even if Supabase update fails!
        const localUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
        localUpdates[ticketId] = { ...(localUpdates[ticketId] || {}), ...fieldsToUpdate };
        localStorage.setItem('ticket_updates', JSON.stringify(localUpdates));

        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update(fieldsToUpdate)
                    .eq('id', ticketId);
                if (error) throw error;

                // Clear local update if database write succeeds
                const freshUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
                delete freshUpdates[ticketId];
                localStorage.setItem('ticket_updates', JSON.stringify(freshUpdates));
            } catch (err) {
                console.warn('Error updating ticket fields in Supabase, using LocalStorage fallback:', err);
            }
        }

        const tickets = JSON.parse(localStorage.getItem('local_tickets')) || [];
        const tIndex = tickets.findIndex(t => t.id === String(ticketId));
        if (tIndex !== -1) {
            tickets[tIndex] = { ...tickets[tIndex], ...fieldsToUpdate };
            localStorage.setItem('local_tickets', JSON.stringify(tickets));
            return true;
        }
        return false;
    }

    // ============================================
    // 1. SISTEMA DE NAVEGACIÓN POR SECCIONES
    // ============================================
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const pageSections = document.querySelectorAll('.page-section');
    
    const pageMap = {
        'inicio': 'page-inicio',
        'mis tickets': 'page-mis-tickets',
        'todos los tickets': 'page-mis-tickets',
        'crear ticket': 'page-crear-ticket',
        'sla': 'page-sla',
        'base de conocimientos': 'page-tutoriales',
        'tutoriales': 'page-tutoriales',
        'preguntas frecuentes': 'page-faq',
        'usuarios': 'page-usuarios',
        'equipos': 'page-base-conocimientos',
        'compras': 'page-compras',
        'compras ti': 'page-compras',
        'dashboard': 'page-inicio',
        'técnicos': 'page-tecnicos',
        'reportes': 'page-reportes',
        'estado del sistema': 'page-estado',
        'visitas': 'page-visitas',
        'panel t-sales': 'page-panel-m365',
        'panel infinet': 'page-panel-m365',
        'panel vprime': 'page-panel-m365',
        'panel m365': 'page-panel-m365',
        'categorías': 'page-configuracion',
        'plantillas': 'page-configuracion',
        'ajustes': 'page-configuracion',
        'chat en vivo': 'page-chat'
    };

    const pageDefaultNavMap = {
        'page-inicio': 'nav-inicio',
        'page-mis-tickets': 'nav-mis-tickets',
        'page-crear-ticket': 'nav-crear-ticket',
        'page-sla': 'nav-sla',
        'page-tutoriales': 'nav-base-conocimientos',
        'page-faq': 'nav-faq',
        'page-usuarios': 'nav-usuarios',
        'page-base-conocimientos': 'nav-equipos',
        'page-compras': 'nav-compras',
        'page-tecnicos': 'nav-tecnicos',
        'page-reportes': 'nav-reportes',
        'page-estado': 'nav-estado',
        'page-visitas': 'nav-visitas',
        'page-panel-m365': 'nav-panel-tsales',
        'page-configuracion': 'nav-ajustes',
        'page-chat': null
    };

    function syncBottomNavTab(pageId) {
        if (!pageId) return;
        const mobTabs = document.querySelectorAll('.mobile-bottom-nav .mob-tab');
        mobTabs.forEach(tab => {
            const p = tab.getAttribute('data-page');
            if (p === pageId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    window.syncBottomNavTab = syncBottomNavTab;

    function navigateToPage(targetPageId, activeLi = null, targetCompany = null) {
        if (!targetPageId) targetPageId = 'page-inicio';

        // Verificación de seguridad para paneles M365 con PIN
        if (targetPageId === 'page-panel-m365') {
            const comp = targetCompany || (activeLi?.querySelector('a')?.getAttribute('data-company')) || 'T-Sales';
            if (!isM365Unlocked) {
                if (typeof openSecurityPinModal === 'function') {
                    openSecurityPinModal(comp);
                }
                return;
            }
            if (typeof switchM365Company === 'function') {
                switchM365Company(comp);
            }
        }

        // Actualizar sidebar activo de manera precisa
        const targetNavId = (activeLi && activeLi.id) ? activeLi.id : pageDefaultNavMap[targetPageId];
        document.querySelectorAll('.sidebar-nav li').forEach(li => {
            if (activeLi) {
                if (li === activeLi || (activeLi.id && li.id === activeLi.id)) {
                    li.classList.add('active');
                } else {
                    li.classList.remove('active');
                }
            } else if (targetNavId && li.id === targetNavId) {
                li.classList.add('active');
            } else if (!targetNavId) {
                const a = li.querySelector('a');
                if (a && a.getAttribute('data-page') === targetPageId) {
                    li.classList.add('active');
                } else {
                    li.classList.remove('active');
                }
            } else {
                li.classList.remove('active');
            }
        });

        // Sincronizar barra inferior móvil
        syncBottomNavTab(targetPageId);

        // Cambiar sección
        pageSections.forEach(section => section.classList.remove('active-page'));
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
            void targetPage.offsetWidth;
            targetPage.classList.add('active-page');
        }

        // Scroll al inicio de la página para evitar que aparezca desplazada abajo
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector('.main-content');
        if (mainEl) mainEl.scrollTop = 0;

        if (targetPageId === 'page-crear-ticket') {
            prefillTicketClientFields();
        } else if (targetPageId === 'page-usuarios') {
            const rolesTabActive = document.getElementById('tab-btn-roles')?.classList.contains('active');
            if (rolesTabActive) renderUsuariosPage();
            else renderDirectoryPage();
        } else if (targetPageId === 'page-panel-m365') {
            if (typeof renderM365Panel === 'function') {
                renderM365Panel();
            }
        } else if (targetPageId === 'page-inicio') {
            updateDashboardCharts();
        } else if (targetPageId === 'page-mis-tickets') {
            if (activeLi) {
                const scope = activeLi.getAttribute('data-scope') || activeLi.querySelector('[data-scope]')?.getAttribute('data-scope') || (activeLi.id === 'nav-mis-tickets' ? 'mis-tickets' : (activeLi.id === 'nav-todos-tickets' ? 'todos' : null));
                if (scope) currentTicketScope = scope;
            }
            if (!allTicketsCached || allTicketsCached.length === 0) {
                refreshTickets();
            } else {
                applyTicketsFilterAndSearch();
            }
        } else if (targetPageId === 'page-visitas') {
            if (typeof initVisitasModule === 'function') {
                initVisitasModule();
            }
        } else if (targetPageId === 'page-compras') {
            if (typeof initComprasModule === 'function') {
                initComprasModule();
            }
        }

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const parentLi = link.closest('li');
            const dataFilter = link.getAttribute('data-filter');
            const dataCompany = link.getAttribute('data-company');
            const dataScope = link.getAttribute('data-scope') || (parentLi && parentLi.id === 'nav-mis-tickets' ? 'mis-tickets' : (parentLi && parentLi.id === 'nav-todos-tickets' ? 'todos' : null));

            if (dataScope) {
                currentTicketScope = dataScope;
            }

            if (dataFilter) {
                currentFilter = dataFilter;
                document.querySelectorAll('.tickets-filter-tabs .filter-tab').forEach(tab => {
                    if (tab.getAttribute('data-filter') === dataFilter) tab.classList.add('active');
                    else tab.classList.remove('active');
                });
            } else if (link.getAttribute('data-page') === 'page-mis-tickets') {
                if (!currentFilter) currentFilter = 'todos';
            }

            const dataPage = link.getAttribute('data-page');
            if (dataPage) {
                navigateToPage(dataPage, parentLi, dataCompany);
                return;
            }

            const linkText = link.textContent.trim().toLowerCase();
            let targetPageId = null;
            for (const [key, value] of Object.entries(pageMap)) {
                if (linkText.includes(key)) {
                    targetPageId = value;
                    break;
                }
            }
            navigateToPage(targetPageId || 'page-inicio', parentLi, dataCompany);
        });
    });

    // ============================================
    // 2. FUNCIONALIDAD DEL MODO OSCURO
    // ============================================
    const modeToggle = document.getElementById('mode-toggle');
    const headerThemeBtn = document.getElementById('header-theme-btn');
    const body = document.body;

    function setTheme(isDark, persist = true) {
        body.classList.toggle('dark-mode', isDark);
        body.classList.toggle('light-mode', !isDark);
        if (modeToggle) modeToggle.checked = isDark;
        if (headerThemeBtn) {
            headerThemeBtn.innerHTML = isDark ? '<i class="fas fa-sun" aria-hidden="true"></i>' : '<i class="fas fa-moon" aria-hidden="true"></i>';
            const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro';
            headerThemeBtn.title = label;
            headerThemeBtn.setAttribute('aria-label', label);
        }
        if (persist) {
            try { localStorage.setItem('support-theme', isDark ? 'dark' : 'light'); } catch (_) {}
        }
        updateDashboardCharts();
    }

    if (modeToggle) {
        modeToggle.addEventListener('change', () => setTheme(modeToggle.checked));
    }
    if (headerThemeBtn) {
        headerThemeBtn.addEventListener('click', () => {
            const isCurrentlyDark = body.classList.contains('dark-mode');
            setTheme(!isCurrentlyDark);
        });
    }

    // ============================================
    // 3. GRÁFICOS CHART.JS DEL DASHBOARD EJECUTIVO
    // ============================================
    let priorityDonutChart = null;
    let slaDonutChart = null;

    try {
        setTheme(localStorage.getItem('support-theme') !== 'light', false);
    } catch (_) {
        setTheme(true, false);
    }


    function initDashboardCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está cargado todavía.');
            return;
        }

        // 2. Gráfico Donut de Prioridad
        const priorityCanvas = document.getElementById('priorityDonutChart');
        if (priorityCanvas) {
            const ctx = priorityCanvas.getContext('2d');
            priorityDonutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Crítica', 'Alta', 'Media', 'Baja'],
                    datasets: [{
                        data: [8, 21, 45, 26],
                        backgroundColor: ['#ef4444', '#f59e0b', '#fbbf24', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#111528',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 8,
                            cornerRadius: 6
                        }
                    }
                }
            });
        }

        // 3. Gráfico Donut de SLA
        const slaCanvas = document.getElementById('slaDonutChart');
        if (slaCanvas) {
            const ctx = slaCanvas.getContext('2d');
            slaDonutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Cumplido', 'En riesgo', 'Incumplido'],
                    datasets: [{
                        data: [97, 2, 1],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#111528',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 8,
                            cornerRadius: 6
                        }
                    }
                }
            });
        }

        updateDashboardCharts();

    }

    function updateDashboardCharts() {
        const styles = getComputedStyle(body);
        const textColor = styles.getPropertyValue('--text-secondary').trim();
        const gridColor = styles.getPropertyValue('--border-subtle').trim();
        const cardColor = styles.getPropertyValue('--bg-card').trim();
        const borderColor = styles.getPropertyValue('--border-color').trim();
        [priorityDonutChart, slaDonutChart].forEach(chart => {
            if (!chart) return;
            const tooltip = chart.options.plugins.tooltip;
            tooltip.backgroundColor = cardColor;
            tooltip.borderColor = borderColor;
            tooltip.titleColor = textColor;
            tooltip.bodyColor = textColor;
            if (chart.options.scales) {
                Object.values(chart.options.scales).forEach(axis => {
                    if (axis.ticks) axis.ticks.color = textColor;
                    if (axis.grid) axis.grid.color = gridColor;
                });
            }
            chart.update();
        });
    }

    // ============================================
    // ESTADO LOCAL DE TICKETS (CACHE)
    // ============================================
    let allTicketsCached = [];
    let currentFilter = 'todos';
    let currentSearch = '';
    let currentTicketPage = 1;
    let currentTicketScope = 'mis-tickets'; // 'mis-tickets' | 'todos'
    const ticketsPerPage = 10;
    let refreshTicketsInFlight = null;

    async function refreshTickets() {
        if (refreshTicketsInFlight) return refreshTicketsInFlight;

        refreshTicketsInFlight = (async () => {
            allTicketsCached = await fetchTickets();
            updateStats(allTicketsCached);
            updateFilterCounts(allTicketsCached);
            applyTicketsFilterAndSearch();
            renderAttentionTicketsTable(allTicketsCached);
            renderTechniciansTables(allTicketsCached);
            return allTicketsCached;
        })();

        try {
            return await refreshTicketsInFlight;
        } finally {
            refreshTicketsInFlight = null;
        }
    }

    function technicianIdentityMatches(value, technician) {
        const candidate = normalizeStr(value);
        if (!candidate) return false;

        const fullName = normalizeStr(technician.nombre);
        const email = normalizeStr(technician.email);
        const emailUser = email.split('@')[0];
        const nameParts = fullName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';

        return candidate === fullName ||
            candidate === email ||
            candidate === emailUser ||
            (firstName && lastName && candidate.includes(firstName) && candidate.includes(lastName));
    }

    function getTechnicianTicketMetrics(tickets, technician) {
        const source = Array.isArray(tickets) ? tickets : [];
        const assigned = source.filter(ticket => {
            const meta = extractMetadata(ticket);
            return technicianIdentityMatches(ticket.tecnico_asignado || meta.tecnico_asignado, technician);
        });
        const resolved = source.filter(ticket => {
            if (normalizeStr(ticket.estado) !== 'resuelto') return false;
            const meta = extractMetadata(ticket);
            const assignedTo = ticket.tecnico_asignado || meta.tecnico_asignado;
            return assignedTo
                ? technicianIdentityMatches(assignedTo, technician)
                : technicianIdentityMatches(ticket.resuelto_por, technician);
        });

        const assignedTickets = new Set(assigned);
        const resolvedAssigned = resolved.filter(ticket => assignedTickets.has(ticket)).length;
        const pending = Math.max(0, assigned.length - resolvedAssigned);
        const resolutionRate = assigned.length > 0
            ? Math.round((resolvedAssigned / assigned.length) * 100)
            : 0;

        return {
            assigned: assigned.length,
            resolved: resolved.length,
            pending,
            resolutionRate
        };
    }

    function renderTechniciansTables(tickets) {
        const dashTbody = document.getElementById('dashboard-technicians-tbody');
        const scoreTbody = document.getElementById('scorecard-technicians-tbody');
        if (!dashTbody && !scoreTbody) return;

        const team = [
            {
                nombre: 'Omar Gálvez',
                email: 'omar.galvez@t-sales.cl',
                initials: 'OG',
                bgClass: 'bg-indigo',
                role: 'Administrador / Soporte'
            },
            {
                nombre: 'Felipe Olivares',
                email: 'felipe.olivares@t-sales.cl',
                initials: 'FO',
                bgClass: 'bg-blue',
                role: 'Administrador / Soporte'
            },
            {
                nombre: 'Belfor Aburto',
                email: 'belfor.aburto@t-sales.cl',
                initials: 'BA',
                bgClass: 'bg-purple',
                role: 'Administrador TI'
            }
        ];

        const techStats = team.map(tech => ({
            ...tech,
            ...getTechnicianTicketMetrics(tickets, tech)
        })).sort((a, b) => b.resolved - a.resolved || b.assigned - a.assigned);

        if (dashTbody) {
            dashTbody.innerHTML = techStats.map(t => `
                <tr>
                    <td class="tech-cell">
                        <div class="tech-avatar-mini ${t.bgClass}">${t.initials}</div>
                        <span class="tech-name">${escapeHtml(t.nombre)}</span>
                    </td>
                    <td>${t.assigned}</td>
                    <td class="val-bold">${t.resolved}</td>
                    <td>${t.pending}</td>
                    <td class="text-positive font-bold">${t.resolutionRate}%</td>
                </tr>
            `).join('');
        }

        if (scoreTbody) {
            scoreTbody.innerHTML = techStats.map(t => `
                <tr>
                    <td class="tech-cell">
                        <div class="tech-avatar-mini ${t.bgClass}">${t.initials}</div>
                        <div>
                            <div class="tech-name">${escapeHtml(t.nombre)}</div>
                            <small style="color: var(--text-secondary);">${escapeHtml(t.email)}</small>
                        </div>
                    </td>
                    <td>${t.assigned}</td>
                    <td class="val-bold">${t.resolved}</td>
                    <td>${t.pending}</td>
                    <td class="text-positive font-bold">${t.resolutionRate}%</td>
                    <td><span class="status-badge ${t.assigned > 0 ? 'status-resuelto' : 'status-espera'}">${t.assigned > 0 ? 'Con actividad' : 'Sin actividad'}</span></td>
                </tr>
            `).join('');
        }

        const highlighted = techStats[0];
        if (highlighted) {
            const avatar = document.getElementById('featured-tech-avatar');
            const name = document.getElementById('featured-tech-name');
            const role = document.getElementById('featured-tech-role');
            const resolved = document.getElementById('featured-tech-resolved');
            const assigned = document.getElementById('featured-tech-assigned');
            const rate = document.getElementById('featured-tech-rate');
            if (avatar) {
                avatar.textContent = highlighted.initials;
                avatar.className = `tech-avatar-mini ${highlighted.bgClass}`;
                avatar.style.cssText = 'width: 72px; height: 72px; font-size: 1.8rem; margin: 0 auto 16px; box-shadow: 0 0 25px rgba(97,62,234,0.4);';
            }
            if (name) name.textContent = highlighted.nombre;
            if (role) role.textContent = 'Mayor cantidad de tickets resueltos';
            if (resolved) resolved.textContent = highlighted.resolved;
            if (assigned) assigned.textContent = highlighted.assigned;
            if (rate) rate.textContent = `${highlighted.resolutionRate}%`;
        }
    }

    function isTicketAssignedToUser(ticket, session) {
        if (!session) return true;
        const myName = (session.nombre || '').toLowerCase().trim();
        const myEmail = (session.email || '').toLowerCase().trim();
        const myRut = (session.rut || '').toLowerCase().trim();

        const meta = (typeof extractMetadata === 'function') ? extractMetadata(ticket) : {};

        const assigned = (ticket.tecnico_asignado || '').toLowerCase().trim();
        const creator = (ticket.creado_por || ticket.usuario_nombre || '').toLowerCase().trim();
        const rut = (ticket.usuario_rut || meta.cliente_rut || '').toLowerCase().trim();
        const email = (ticket.usuario_email || meta.cliente_email || '').toLowerCase().trim();
        const clientName = (meta.cliente_nombre || '').toLowerCase().trim();

        // 1. Técnico asignado
        if (assigned) {
            if (assigned.includes(myName) || myName.includes(assigned)) return true;
            if (myName.includes('omar') && assigned.includes('omar')) return true;
            if (myName.includes('felipe') && assigned.includes('felipe')) return true;
            if (myName.includes('belfor') && assigned.includes('belfor')) return true;
        }

        // 2. Creador del ticket
        if (creator) {
            if (creator.includes(myName) || myName.includes(creator)) return true;
            if (myName.includes('omar') && creator.includes('omar')) return true;
            if (myName.includes('felipe') && creator.includes('felipe')) return true;
            if (myName.includes('belfor') && creator.includes('belfor')) return true;
        }

        // 3. Cliente / Persona afectada
        if (clientName) {
            if (clientName.includes(myName) || myName.includes(clientName)) return true;
            if (myName.includes('omar') && clientName.includes('omar')) return true;
            if (myName.includes('felipe') && clientName.includes('felipe')) return true;
            if (myName.includes('belfor') && clientName.includes('belfor')) return true;
        }

        // 4. Correo
        if (myEmail && email) {
            if (email === myEmail || email.includes(myEmail) || myEmail.includes(email)) return true;
        }

        // 5. RUT
        if (myRut && rut && rut !== 'admin' && rut !== 'usuario' && rut !== 'omar' && rut !== 'felipe' && rut !== 'belfor') {
            if (rut === myRut || rut.includes(myRut) || myRut.includes(rut)) return true;
        }

        return false;
    }

    function updateStats(tickets) {
        const statsOpen = document.getElementById('dash-metric-abiertos');
        const statsUnassigned = document.getElementById('dash-metric-sin-asignar');
        const statsSlaRisk = document.getElementById('dash-metric-sla-riesgo');
        const statsSlaBreached = document.getElementById('dash-metric-sla-vencidos');
        const sidebarBadge = document.getElementById('sidebar-badge-mis-tickets');

        const openTickets = tickets.filter(t => t.estado === 'abierto' || t.estado === 'en progreso' || t.estado === 'en espera');
        const unassignedTickets = openTickets.filter(t => !t.tecnico_asignado);

        if (statsOpen) statsOpen.textContent = openTickets.length;
        if (statsUnassigned) statsUnassigned.textContent = `${unassignedTickets.length} sin asignar`;
        
        let myOpenTickets = openTickets;
        if (currentSession) {
            myOpenTickets = openTickets.filter(t => isTicketAssignedToUser(t, currentSession));
        }
        if (sidebarBadge) sidebarBadge.textContent = myOpenTickets.length;

        // SLA
        if (statsSlaRisk) statsSlaRisk.textContent = 3;
        if (statsSlaBreached) statsSlaBreached.textContent = 1;

        const slaPageRisk = document.getElementById('sla-page-metric-riesgo');
        const slaPageBreached = document.getElementById('sla-page-metric-vencidos');
        if (slaPageRisk) slaPageRisk.textContent = 3;
        if (slaPageBreached) slaPageBreached.textContent = 1;

        // Feedback de Técnicos (Belfor)
        const felipeCreated = tickets.filter(t => t.usuario_nombre === 'Felipe Olivares').length;
        const felipeResolved = tickets.filter(t => t.resuelto_por === 'Felipe Olivares').length;
        const omarResolved = tickets.filter(t => t.resuelto_por === 'Omar Gálvez').length;

        const felipeCreatedEl = document.getElementById('metric-felipe-created');
        const felipeResolvedEl = document.getElementById('metric-felipe-resolved');
        const omarResolvedEl = document.getElementById('metric-omar-resolved');

        if (felipeCreatedEl) felipeCreatedEl.textContent = felipeCreated;
        if (felipeResolvedEl) felipeResolvedEl.textContent = felipeResolved;
        if (omarResolvedEl) omarResolvedEl.textContent = omarResolved;
    }

    function renderAttentionTicketsTable(tickets) {
        const tbody = document.getElementById('attention-tickets-tbody');
        if (!tbody) return;

        // Si tenemos tickets reales en cache, podemos mostrarlos con su tiempo SLA
        if (tickets && tickets.length > 0) {
            const urgentTickets = tickets
                .filter(t => t.estado !== 'resuelto')
                .slice(0, 5);

            if (urgentTickets.length > 0) {
                tbody.innerHTML = '';
                urgentTickets.forEach(t => {
                    const tr = document.createElement('tr');
                    tr.className = 'attention-ticket-row';
                    tr.onclick = () => openTicketModal(t);

                    const pClass = priorityClasses[t.prioridad.toLowerCase()] || 'priority-media';
                    const pLabel = t.prioridad.charAt(0).toUpperCase() + t.prioridad.slice(1);
                    const techDisplay = t.tecnico_asignado 
                        ? `<div class="tech-avatar-mini">${t.tecnico_asignado.split(' ').map(n=>n[0]).join('')}</div> ${t.tecnico_asignado}` 
                        : `<i class="far fa-user-circle"></i> Sin asignar`;

                    let slaColor = 'text-green';
                    let slaBg = 'bg-green';
                    let slaTime = '1 h 15 min';
                    let slaPct = '80%';

                    if (t.prioridad.toLowerCase() === 'crítica') {
                        slaColor = 'text-red';
                        slaBg = 'bg-red';
                        slaTime = '12 min';
                        slaPct = '20%';
                    } else if (t.prioridad.toLowerCase() === 'alta') {
                        slaColor = 'text-amber';
                        slaBg = 'bg-amber';
                        slaTime = '24 min';
                        slaPct = '40%';
                    }

                    tr.innerHTML = `
                        <td class="ticket-id-cell">#${t.codigo || t.id.slice(0,6)}</td>
                        <td class="ticket-subject-cell">${escapeHtml(t.asunto)}</td>
                        <td><span class="priority-dot-pill ${pClass}"><span class="p-dot"></span> ${pLabel}</span></td>
                        <td class="tech-cell">${techDisplay}</td>
                        <td class="sla-cell">
                            <span class="sla-time-text ${slaColor}">${slaTime}</span>
                            <div class="sla-progress-bar"><div class="sla-progress-fill ${slaBg}" style="width: ${slaPct};"></div></div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    }

    function updateFilterCounts(tickets) {
        const counts = {
            'todos': tickets.length,
            'abierto': tickets.filter(t => t.estado === 'abierto').length,
            'en progreso': tickets.filter(t => t.estado === 'en progreso').length,
            'en espera': tickets.filter(t => t.estado === 'en espera').length,
            'resuelto': tickets.filter(t => t.estado === 'resuelto').length
        };

        document.querySelectorAll('.filter-tab').forEach(tab => {
            const filter = tab.getAttribute('data-filter');
            const countSpan = tab.querySelector('.filter-count');
            if (countSpan && counts[filter] !== undefined) {
                countSpan.textContent = counts[filter];
            }
        });
    }

    function applyTicketsFilterAndSearch() {
        const tbody = document.getElementById('tickets-table-body');
        if (!tbody) return;

        let filtered = [...allTicketsCached];

        // 1. Filtrar por ámbito (Mis Tickets vs Todos los Tickets)
        if (currentTicketScope === 'mis-tickets' && currentSession) {
            filtered = filtered.filter(t => isTicketAssignedToUser(t, currentSession));
        }

        // 2. Actualizar títulos dinámicos en la vista
        const pageTitle = document.getElementById('tickets-page-title-text');
        const pageSub = document.getElementById('tickets-page-sub-text');
        if (pageTitle) {
            pageTitle.textContent = currentTicketScope === 'mis-tickets' ? 'Mis tickets' : 'Todos los Tickets';
        }
        if (pageSub) {
            pageSub.textContent = currentTicketScope === 'mis-tickets'
                ? 'Consulta el estado de tus solicitudes y tickets asignados'
                : 'Consulta todos los tickets registrados en la organización';
        }

        // 3. Actualizar conteo en los chips
        updateFilterCounts(filtered);

        // 4. Filtrar por estado
        if (currentFilter !== 'todos') {
            filtered = filtered.filter(t => t.estado.toLowerCase() === currentFilter.toLowerCase());
        }

        if (currentSearch) {
            filtered = filtered.filter(t => 
                t.asunto.toLowerCase().includes(currentSearch) ||
                t.descripcion.toLowerCase().includes(currentSearch) ||
                (t.codigo && t.codigo.toLowerCase().includes(currentSearch))
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ticketsPerPage) || 1;

        if (currentTicketPage > totalPages) {
            currentTicketPage = totalPages;
        }

        const startIndex = (currentTicketPage - 1) * ticketsPerPage;
        const endIndex = Math.min(startIndex + ticketsPerPage, totalItems);

        const paginated = filtered.slice(startIndex, endIndex);

        const infoEl = document.getElementById('ticket-pagination-info');
        if (infoEl) {
            if (totalItems === 0) {
                infoEl.textContent = 'Mostrando 0 a 0 de 0 tickets';
            } else {
                infoEl.textContent = `Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} tickets`;
            }
        }

        renderTicketPaginationControls(totalPages);

        tbody.innerHTML = '';
        const mobContainer = document.getElementById('mobile-tickets-cards-container');
        if (mobContainer) mobContainer.innerHTML = '';

        if (paginated.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No se encontraron tickets.
                    </td>
                </tr>
            `;
            if (mobContainer) {
                mobContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border-color);">
                        <i class="fas fa-inbox" style="font-size: 2.2rem; margin-bottom: 12px; opacity: 0.5; color: var(--accent-blue);"></i>
                        <p style="margin: 0; font-size: 0.9rem;">No se encontraron tickets con este filtro.</p>
                    </div>
                `;
            }
            return;
        }

        paginated.forEach(ticket => {
            const tr = document.createElement('tr');
            
            const meta = extractMetadata(ticket);

            const stateLabel = ticket.estado.charAt(0).toUpperCase() + ticket.estado.slice(1);
            const stateClass = statusClasses[ticket.estado.toLowerCase()] || 'status-abierto';
            const priorityBadge = priorityBadges[ticket.prioridad.toLowerCase()] || priorityBadges['media'];

            const deleteBtnHtml = (currentSession && currentSession.role === 'admin') 
                ? `<button type="button" class="action-btn action-delete" title="Eliminar ticket" aria-label="Eliminar ticket"><i class="fas fa-trash-alt"></i></button>`
                : '';

            const showTakeBtn = !ticket.tecnico_asignado && currentSession && (currentSession.role === 'admin' || currentSession.role === 'technician');
            const takeBtnHtml = showTakeBtn
                ? `<button class="action-btn action-take" title="Tomar Ticket" style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; font-weight: 600; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px; margin-right: 6px;" onmouseover="this.style.backgroundColor='rgba(16, 185, 129, 0.2)'; this.style.color='#059669';" onmouseout="this.style.backgroundColor='rgba(16, 185, 129, 0.12)'; this.style.color='#10b981';"><i class="fas fa-hand-holding"></i> Tomar</button>`
                : '';

            const techStatusHtml = ticket.tecnico_asignado
                ? `<span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; color: #10b981; font-weight: 600;"><i class="fas fa-user-cog" style="font-size: 0.65rem;"></i> Técnico: ${escapeHtml(ticket.tecnico_asignado)}</span>`
                : `<span style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; color: #ef4444; font-weight: 600;"><i class="fas fa-exclamation-circle" style="font-size: 0.65rem;"></i> Sin Asignar</span>`;

            const companyBadge = meta.empresa 
                ? `<span style="background: rgba(50, 102, 235, 0.12); border: 1px solid rgba(50, 102, 235, 0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; color: var(--accent-blue); font-weight: 600; text-transform: uppercase;"><i class="fas fa-building" style="font-size: 0.65rem;"></i> ${escapeHtml(meta.empresa)}</span>`
                : '';

            tr.innerHTML = `
                <td class="ticket-id-cell">
                    <span class="ticket-id">${ticket.codigo || '#TK-2026-xxxx'}</span>
                    <span class="ticket-date">${formatDate(ticket.created_at)}</span>
                </td>
                <td class="ticket-asunto-cell">
                    <span class="ticket-asunto">${escapeHtml(ticket.asunto)}</span>
                    <span class="ticket-desc">${escapeHtml(ticket.descripcion)}</span>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-user" style="color: var(--accent-blue); font-size: 0.7rem;"></i> ${escapeHtml(meta.cliente_nombre)} (${escapeHtml(meta.cliente_rut)})</span>
                        <span style="display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-envelope" style="color: var(--accent-blue); font-size: 0.7rem;"></i> ${escapeHtml(meta.cliente_email)}</span>
                        <span style="background: rgba(97, 62, 234, 0.12); border: 1px solid rgba(97, 62, 234, 0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; color: var(--accent-purple); font-weight: 600;">${escapeHtml(meta.modalidad)}</span>
                        ${companyBadge}
                        ${techStatusHtml}
                    </div>
                </td>
                <td><span class="status-badge ${stateClass}">${stateLabel}</span></td>
                <td class="ticket-time">${formatRelativeTime(ticket.created_at)}</td>
                <td class="ticket-actions">
                    ${takeBtnHtml}
                    <button type="button" class="action-btn action-view" title="Ver detalles del ticket" aria-label="Ver detalles del ticket"><i class="fas fa-eye"></i></button>
                    ${deleteBtnHtml}
                </td>
            `;

            tr.querySelector('.action-view').addEventListener('click', () => {
                openTicketDetailModal(ticket);
            });

            const takeBtn = tr.querySelector('.action-take');
            if (takeBtn) {
                takeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await updateTicketFields(ticket.id, { 
                        tecnico_asignado: currentSession.nombre,
                        estado: 'en progreso'
                    });
                    alert(`Has tomado el ticket "${ticket.asunto}". Estado cambiado a En Progreso.`);
                    await refreshTickets();
                });
            }

            const deleteBtn = tr.querySelector('.action-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    await deleteTicket(ticket.id);
                });
            }

            tbody.appendChild(tr);

            // Renderizar tarjeta para vista móvil
            if (mobContainer) {
                const mobCard = createMobileTicketCardElement(ticket);
                mobContainer.appendChild(mobCard);
            }
        });
    }

    function createMobileTicketCardElement(ticket) {
        const meta = extractMetadata(ticket);
        const card = document.createElement('div');
        card.className = 'mob-ticket-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        const code = ticket.codigo || `#TI-${ticket.id ? String(ticket.id).slice(-4) : '1024'}`;
        const pKey = ticket.prioridad ? ticket.prioridad.toLowerCase() : 'media';
        const stateKey = ticket.estado ? ticket.estado.toLowerCase() : 'abierto';

        // Badge de Prioridad con Flechas (Estilo exacto de la captura)
        let pBadgeHtml = '';
        if (pKey === 'alta' || pKey === 'crítica' || pKey === 'critica') {
            pBadgeHtml = `<span class="mob-card-p-badge p-alta"><i class="fas fa-arrow-up"></i> Alta</span>`;
        } else if (pKey === 'baja') {
            pBadgeHtml = `<span class="mob-card-p-badge p-baja"><i class="fas fa-arrow-down"></i> Baja</span>`;
        } else {
            pBadgeHtml = `<span class="mob-card-p-badge p-media"><i class="fas fa-minus"></i> Media</span>`;
        }

        // Pill de Estado (Estilo exacto de la captura)
        let statusPillHtml = '';
        if (stateKey === 'abierto') {
            statusPillHtml = `<span class="mob-card-status-pill status-pill-abierto"><i class="far fa-circle"></i> Abierto</span>`;
        } else if (stateKey === 'en progreso') {
            statusPillHtml = `<span class="mob-card-status-pill status-pill-progreso"><i class="fas fa-sync-alt"></i> En progreso</span>`;
        } else if (stateKey === 'en espera') {
            statusPillHtml = `<span class="mob-card-status-pill status-pill-espera"><i class="far fa-clock"></i> En espera</span>`;
        } else {
            statusPillHtml = `<span class="mob-card-status-pill status-pill-resuelto"><i class="fas fa-check"></i> Resuelto</span>`;
        }

        // Técnico / Solicitante asignado
        const assigneeName = ticket.tecnico_asignado || meta.cliente_nombre || 'Soporte TI';
        const assigneeRole = ticket.tecnico_asignado ? 'Soporte N1' : (meta.empresa || 'Solicitante');
        const initials = assigneeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
        const dateFormatted = formatDate(ticket.created_at || new Date().toISOString());

        card.innerHTML = `
            <div class="mob-card-accent-bar"></div>
            <div class="mob-card-inner">
                <div class="mob-card-top-row">
                    <div class="mob-card-tags">
                        <span class="mob-card-code">${escapeHtml(code)}</span>
                        ${pBadgeHtml}
                    </div>
                    ${statusPillHtml}
                </div>

                <div class="mob-card-content">
                    <h3 class="mob-card-title">${escapeHtml(ticket.asunto || 'Sin asunto')}</h3>
                    <p class="mob-card-desc">${escapeHtml(ticket.descripcion || 'Sin descripción adicional.')}</p>
                </div>

                <div class="mob-card-bottom-row">
                    <div class="mob-card-assignee">
                        <div class="mob-assignee-avatar">${initials}</div>
                        <div class="mob-assignee-info">
                            <span class="mob-assignee-name">${escapeHtml(assigneeName)}</span>
                            <span class="mob-assignee-role">${escapeHtml(assigneeRole)}</span>
                        </div>
                    </div>
                    <div class="mob-card-date">
                        <i class="far fa-calendar-alt"></i>
                        <span>${dateFormatted}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            openTicketDetailModal(ticket);
        });

        return card;
    }

    function renderTicketPaginationControls(totalPages) {
        const container = document.getElementById('ticket-pagination-controls');
        if (!container) return;

        container.innerHTML = '';

        // Botón Anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn page-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentTicketPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentTicketPage > 1) {
                currentTicketPage--;
                applyTicketsFilterAndSearch();
            }
        });
        container.appendChild(prevBtn);

        // Algoritmo de elipsis para paginación premium
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                container.appendChild(createTicketPageButton(i));
            }
        } else {
            const range = 1;
            const showEllipsisStart = currentTicketPage - range > 2;
            const showEllipsisEnd = currentTicketPage + range < totalPages - 1;

            container.appendChild(createTicketPageButton(1));

            if (showEllipsisStart) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '…';
                container.appendChild(ellipsis);
            } else if (currentTicketPage - range > 1) {
                for (let i = 2; i < currentTicketPage - range; i++) {
                    container.appendChild(createTicketPageButton(i));
                }
            }

            const start = Math.max(2, currentTicketPage - range);
            const end = Math.min(totalPages - 1, currentTicketPage + range);
            for (let i = start; i <= end; i++) {
                container.appendChild(createTicketPageButton(i));
            }

            if (showEllipsisEnd) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '…';
                container.appendChild(ellipsis);
            } else if (currentTicketPage + range < totalPages - 1) {
                for (let i = currentTicketPage + range + 1; i < totalPages; i++) {
                    container.appendChild(createTicketPageButton(i));
                }
            }

            container.appendChild(createTicketPageButton(totalPages));
        }

        // Botón Siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn page-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentTicketPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentTicketPage < totalPages) {
                currentTicketPage++;
                applyTicketsFilterAndSearch();
            }
        });
        container.appendChild(nextBtn);
    }

    function createTicketPageButton(page) {
        const btn = document.createElement('button');
        btn.className = `page-btn page-number ${page === currentTicketPage ? 'active' : ''}`;
        btn.textContent = page;
        btn.addEventListener('click', () => {
            currentTicketPage = page;
            applyTicketsFilterAndSearch();
        });
        return btn;
    }

    async function renderUsuariosPage() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const warningBanner = document.getElementById('user-supabase-warning');
        if (warningBanner) {
            warningBanner.style.display = (!useLocalFallback && !supabaseRolesTableOk) ? 'flex' : 'none';
        }

        const users = await loadPlatformUsers();
        
        // Count global stats
        const totalUsers = users.length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        const totalTechs = users.filter(u => u.role === 'technician').length;

        const statTotal = document.getElementById('user-stat-total');
        const statAdmins = document.getElementById('user-stat-admins');
        const statTechs = document.getElementById('user-stat-techs');

        if (statTotal) statTotal.textContent = totalUsers;
        if (statAdmins) statAdmins.textContent = totalAdmins;
        if (statTechs) statTechs.textContent = totalTechs;

        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            
            // Calculate user metrics
            const nameLower = user.nombre.toLowerCase().trim();
            const emailLower = user.email.toLowerCase().trim();

            const ticketsCreados = allTicketsCached.filter(t => {
                const meta = extractMetadata(t);
                const uName = (t.usuario_nombre || '').toLowerCase().trim();
                const cName = (meta.cliente_nombre || '').toLowerCase().trim();
                const uEmail = (t.usuario_email || '').toLowerCase().trim();
                const cEmail = (meta.cliente_email || '').toLowerCase().trim();
                return uName === nameLower || cName === nameLower || uEmail === emailLower || cEmail === emailLower;
            }).length;
            const technicianMetrics = getTechnicianTicketMetrics(allTicketsCached, user);
            const ticketsAsignados = technicianMetrics.assigned;
            const ticketsResueltos = technicianMetrics.resolved;

            const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const roleBadge = user.role === 'admin' 
                ? `<span class="status-badge status-resuelto" style="background: linear-gradient(135deg, rgba(97, 62, 234, 0.2) 0%, rgba(50, 102, 235, 0.2) 100%); border: 1px solid rgba(97, 62, 234, 0.3); color: var(--text-primary); font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;"><i class="fas fa-user-shield" style="margin-right: 4px; color: var(--accent-purple);"></i> Administrador</span>`
                : `<span class="status-badge status-progreso" style="background: rgba(29, 200, 109, 0.12); border: 1px solid rgba(29, 200, 109, 0.2); color: #1dc86d; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;"><i class="fas fa-user-cog" style="margin-right: 4px;"></i> Técnico</span>`;
            
            const isSelf = currentSession && currentSession.email.toLowerCase() === user.email.toLowerCase();
            const checkedAttr = user.role === 'admin' ? 'checked' : '';
            const disabledAttr = isSelf ? 'disabled title="No puedes cambiar tu propio rol"' : '';
            
            const switchHtml = `
                <label class="switch" style="vertical-align: middle; ${isSelf ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    <input type="checkbox" class="user-role-toggle" data-email="${user.email}" ${checkedAttr} ${disabledAttr}>
                    <span class="slider round"></span>
                </label>
            `;

            tr.innerHTML = `
                <td style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar" style="width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.9rem; flex-shrink: 0;">
                            <span>${initials}</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(user.nombre)}</span>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">${escapeHtml(user.email)}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 16px; color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(user.rut)}</td>
                <td style="padding: 16px;">${roleBadge}</td>
                <td style="padding: 16px; text-align: center; font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${ticketsCreados}</td>
                <td style="padding: 16px; text-align: center; font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${ticketsAsignados}</td>
                <td style="padding: 16px; text-align: center; font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${ticketsResueltos}</td>
                <td style="padding: 16px; text-align: right;">
                    <div style="display: inline-flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 500;">Permisos de Admin</span>
                        ${switchHtml}
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Render mobile cards for Roles TI
        const mobileRolesContainer = document.getElementById('mobile-users-roles-cards-container');
        if (mobileRolesContainer) {
            mobileRolesContainer.innerHTML = users.map(user => {
                const nameLower = user.nombre.toLowerCase().trim();
                const emailLower = user.email.toLowerCase().trim();

                const ticketsCreados = allTicketsCached.filter(t => {
                    const meta = extractMetadata(t);
                    const uName = (t.usuario_nombre || '').toLowerCase().trim();
                    const cName = (meta.cliente_nombre || '').toLowerCase().trim();
                    const uEmail = (t.usuario_email || '').toLowerCase().trim();
                    const cEmail = (meta.cliente_email || '').toLowerCase().trim();
                    return uName === nameLower || cName === nameLower || uEmail === emailLower || cEmail === emailLower;
                }).length;
                const technicianMetrics = getTechnicianTicketMetrics(allTicketsCached, user);
                const ticketsAsignados = technicianMetrics.assigned;
                const ticketsResueltos = technicianMetrics.resolved;

                const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const roleBadge = user.role === 'admin' 
                    ? `<span class="status-badge status-resuelto" style="background: linear-gradient(135deg, rgba(97, 62, 234, 0.2) 0%, rgba(50, 102, 235, 0.2) 100%); border: 1px solid rgba(97, 62, 234, 0.3); color: var(--text-primary); font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;"><i class="fas fa-user-shield" style="margin-right: 4px; color: var(--accent-purple);"></i> Admin</span>`
                    : `<span class="status-badge status-progreso" style="background: rgba(29, 200, 109, 0.12); border: 1px solid rgba(29, 200, 109, 0.2); color: #1dc86d; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;"><i class="fas fa-user-cog" style="margin-right: 4px;"></i> Técnico</span>`;
                
                const isSelf = currentSession && currentSession.email.toLowerCase() === user.email.toLowerCase();
                const checkedAttr = user.role === 'admin' ? 'checked' : '';
                const disabledAttr = isSelf ? 'disabled title="No puedes cambiar tu propio rol"' : '';
                
                const switchHtml = `
                    <label class="switch" style="vertical-align: middle; ${isSelf ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        <input type="checkbox" class="user-role-toggle" data-email="${user.email}" ${checkedAttr} ${disabledAttr}>
                        <span class="slider round"></span>
                    </label>
                `;

                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="user-avatar" style="width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.9rem; flex-shrink: 0;">
                                    <span>${initials}</span>
                                </div>
                                <div>
                                    <strong style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem; display: block;">${escapeHtml(user.nombre)}</strong>
                                    <span style="color: var(--text-secondary); font-size: 0.76rem;">${escapeHtml(user.email)}</span>
                                </div>
                            </div>
                            ${roleBadge}
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: var(--bg-sidebar); border-radius: 8px; padding: 8px; text-align: center;">
                            <div>
                                <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">Creados</span>
                                <strong style="color: var(--text-primary); font-size: 0.85rem;">${ticketsCreados}</strong>
                            </div>
                            <div>
                                <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">Asignados</span>
                                <strong style="color: var(--accent-blue); font-size: 0.85rem;">${ticketsAsignados}</strong>
                            </div>
                            <div>
                                <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">Resueltos</span>
                                <strong style="color: var(--accent-green); font-size: 0.85rem;">${ticketsResueltos}</strong>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid var(--border-color);">
                            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 500;">Permisos de Admin</span>
                            ${switchHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Add event listeners to toggles (both table and mobile cards)
        document.querySelectorAll('.user-role-toggle').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const email = toggle.getAttribute('data-email');
                const makeAdmin = toggle.checked;
                
                const users = await loadPlatformUsers();
                const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
                if (userIndex !== -1) {
                    const targetUser = users[userIndex];
                    targetUser.role = makeAdmin ? 'admin' : 'technician';
                    savePlatformUsers(users);

                    // Sincronizar en Supabase
                    const dbResult = await updateUserRoleInSupabase(targetUser.email, targetUser.role);

                    // If the modified user is currently logged in, sync their role
                    if (currentSession && currentSession.email.toLowerCase() === email.toLowerCase()) {
                        currentSession.role = targetUser.role;
                        localStorage.setItem('session_soporte', JSON.stringify(currentSession));
                    }

                    if (!dbResult.success && !useLocalFallback) {
                        const errMsg = dbResult.error ? (dbResult.error.message || JSON.stringify(dbResult.error)) : 'Error desconocido';
                        alert(`⚠️ Advertencia: No se pudo guardar el rol en Supabase.\n\nDetalle del error: ${errMsg}\n\nEl rol de ${targetUser.nombre} se guardó solo localmente en este navegador.`);
                    } else {
                        alert(`Rol de ${targetUser.nombre} actualizado a ${makeAdmin ? 'Administrador' : 'Técnico'}.`);
                    }
                    
                    // Re-render
                    await renderUsuariosPage();
                    
                    // Update main layout access
                    applySession(currentSession, false);
                }
            });
        });
    }

    // ============================================
    // 3. FORMULARIO DE TICKET CON STEPPER (MULTI-PASO)
    // ============================================
    let currentTicketStep = 1;

    async function loadUserDevices() {
        const deviceSelect = document.getElementById('ticket-device');
        if (!deviceSelect) return;

        deviceSelect.innerHTML = '<option value="ninguno">Ninguno / Otro</option>';

        try {
            const equipments = await fetchEquipos();
            if (equipments && equipments.length > 0 && currentSession) {
                let userEquips = [];
                if (currentSession.role === 'admin') {
                    userEquips = equipments;
                } else {
                    const normName = currentSession.nombre.toLowerCase().trim();
                    userEquips = equipments.filter(eq => eq.usuario_nombre && eq.usuario_nombre.toLowerCase().trim() === normName);
                }

                userEquips.forEach(eq => {
                    const opt = document.createElement('option');
                    opt.value = eq.nombre_codigo;
                    opt.textContent = `${eq.nombre_codigo} - ${eq.marca} ${eq.modelo} (${eq.serial})`;
                    deviceSelect.appendChild(opt);
                });
            }
        } catch (err) {
            console.error('Error loading devices for ticket:', err);
        }
    }

    function updateStepperUI() {
        const steps = document.querySelectorAll('.ticket-stepper .stepper-step');
        steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            
            const circle = step.querySelector('.step-circle');
            if (stepNum === currentTicketStep) {
                step.classList.add('active');
                if (circle) circle.textContent = stepNum;
            } else if (stepNum < currentTicketStep) {
                step.classList.add('completed');
                if (circle) circle.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                if (circle) circle.textContent = stepNum;
            }
        });

        const progressLine = document.getElementById('stepper-line-progress');
        if (progressLine) {
            const percentage = ((currentTicketStep - 1) / (steps.length - 1)) * 100;
            progressLine.style.width = `${percentage}%`;
        }

        const panels = document.querySelectorAll('.stepper-form-card');
        panels.forEach((panel, idx) => {
            if ((idx + 1) === currentTicketStep) {
                panel.style.display = 'flex';
                panel.classList.add('active-step-panel');
            } else {
                panel.style.display = 'none';
                panel.classList.remove('active-step-panel');
            }
        });

        const prevBtn = document.getElementById('btn-stepper-prev');
        const nextBtn = document.getElementById('btn-stepper-next');
        
        if (currentTicketStep === 1) {
            if (prevBtn) prevBtn.textContent = 'Cancelar';
        } else {
            if (prevBtn) prevBtn.textContent = 'Anterior';
        }

        if (currentTicketStep === 3) {
            const statusSelect = document.getElementById('ticket-status-select');
            const statusVal = statusSelect ? statusSelect.value : 'abierto';
            if (nextBtn) {
                if (statusVal === 'resuelto' || statusVal === 'cerrado') {
                    nextBtn.innerHTML = '<i class="fas fa-check-double"></i> Crear y Guardar como Resuelto';
                    nextBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    nextBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.35)';
                } else if (statusVal === 'en_progreso') {
                    nextBtn.innerHTML = '<i class="fas fa-play-circle"></i> Crear y Empezar a Atender';
                    nextBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                    nextBtn.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.35)';
                } else {
                    nextBtn.innerHTML = 'Enviar Ticket <i class="fas fa-paper-plane"></i>';
                    nextBtn.style.background = 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)';
                    nextBtn.style.boxShadow = '0 4px 15px rgba(97, 62, 234, 0.25)';
                }
            }
        } else {
            if (nextBtn) {
                nextBtn.innerHTML = 'Continuar <i class="fas fa-arrow-right"></i>';
                nextBtn.style.background = 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)';
                nextBtn.style.boxShadow = '0 4px 15px rgba(97, 62, 234, 0.25)';
            }
        }
    }

    function validateStep1() {
        const subject = document.getElementById('ticket-subject');
        const category = document.getElementById('ticket-category');
        const office = document.getElementById('ticket-office');
        const description = document.getElementById('ticket-description');

        if (!subject || !subject.value.trim()) {
            if (subject) subject.reportValidity();
            return false;
        }
        if (!category || !category.value) {
            if (category) category.reportValidity();
            return false;
        }
        if (!office || !office.value) {
            if (office) office.reportValidity();
            return false;
        }
        if (!description || !description.value.trim()) {
            if (description) description.reportValidity();
            return false;
        }
        return true;
    }

    function populateReviewSummary() {
        const summaryContainer = document.getElementById('ticket-review-summary');
        if (!summaryContainer) return;

        const subject = document.getElementById('ticket-subject')?.value.trim() || '';
        const category = document.getElementById('ticket-category');
        const categoryText = category ? category.options[category.selectedIndex]?.text : '';
        const statusSelect = document.getElementById('ticket-status-select');
        const statusVal = statusSelect ? statusSelect.value : 'abierto';
        const prioritySelect = document.getElementById('ticket-priority-select');
        const priorityText = prioritySelect ? prioritySelect.options[prioritySelect.selectedIndex]?.text : 'Media';
        const resolutionNote = document.getElementById('ticket-resolution-note')?.value.trim() || '';

        const office = document.getElementById('ticket-office')?.value || '';
        const modality = document.getElementById('ticket-modalidad')?.value || 'Online';
        const clientName = document.getElementById('ticket-client-name')?.value.trim() || '';
        const clientRut = document.getElementById('ticket-client-rut')?.value.trim() || '';
        const clientEmail = document.getElementById('ticket-client-email')?.value.trim() || '';
        const description = document.getElementById('ticket-description')?.value.trim() || '';
        const phone = document.getElementById('ticket-phone')?.value.trim() || 'No proporcionado';
        const device = document.getElementById('ticket-device')?.value || 'ninguno';
        const impact = document.getElementById('ticket-impact');
        const impactText = impact ? impact.options[impact.selectedIndex]?.text : '';
        const assignedTech = document.getElementById('ticket-assigned-tech')?.value || 'Sin Asignar';

        const activeCompanyCard = document.querySelector('.company-card.active');
        const empresa = activeCompanyCard ? activeCompanyCard.getAttribute('data-company') : 'Infinet';

        let statusBadgeHtml = '<span class="status-badge status-abierto">Abierto</span>';
        if (statusVal === 'resuelto') statusBadgeHtml = '<span class="status-badge status-resuelto" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: bold;"><i class="fas fa-check-circle"></i> Resuelto Inmediatamente</span>';
        else if (statusVal === 'en_progreso') statusBadgeHtml = '<span class="status-badge status-progreso" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: bold;"><i class="fas fa-spinner fa-spin"></i> En Progreso</span>';
        else if (statusVal === 'pendiente') statusBadgeHtml = '<span class="status-badge status-pendiente">Pendiente</span>';
        else if (statusVal === 'cerrado') statusBadgeHtml = '<span class="status-badge status-cerrado">Cerrado</span>';

        summaryContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 12px; margin-bottom: 12px;">
                <div><span style="color: var(--text-muted);">Asunto:</span> <strong style="color: var(--text-primary);">${escapeHtml(subject)}</strong></div>
                <div><span style="color: var(--text-muted);">Estado Inicial:</span> ${statusBadgeHtml}</div>
                <div><span style="color: var(--text-muted);">Categoría:</span> <span class="meta-val">${escapeHtml(categoryText)}</span></div>
                <div><span style="color: var(--text-muted);">Prioridad:</span> <span class="meta-val" style="font-weight: 600; color: #f59e0b;">${escapeHtml(priorityText)}</span></div>
                <div><span style="color: var(--text-muted);">Empresa:</span> <span class="meta-val" style="font-weight: bold; color: var(--accent-blue); text-transform: uppercase;">${escapeHtml(empresa)}</span></div>
                <div><span style="color: var(--text-muted);">Sede:</span> <span class="meta-val">${escapeHtml(office)}</span></div>
                <div><span style="color: var(--text-muted);">Modalidad:</span> <span class="meta-val" style="font-weight: 600; color: var(--accent-purple);">${escapeHtml(modality)}</span></div>
                <div><span style="color: var(--text-muted);">Técnico Asignado:</span> <span class="meta-val" style="font-weight: 600; color: var(--accent-green);">${escapeHtml(assignedTech)}</span></div>
                <div><span style="color: var(--text-muted);">Teléfono:</span> <span class="meta-val">${escapeHtml(phone)}</span></div>
                
                <div style="grid-column: span 2; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 8px; margin-top: 4px;">
                    <span style="color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Persona Afectada:</span>
                    <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 8px;">
                        <div><span style="color: var(--text-muted);">Nombre:</span> <strong style="color: var(--text-primary);">${escapeHtml(clientName)}</strong></div>
                        <div><span style="color: var(--text-muted);">RUT:</span> <span class="meta-val">${escapeHtml(clientRut)}</span></div>
                        <div><span style="color: var(--text-muted);">Correo:</span> <span class="meta-val">${escapeHtml(clientEmail)}</span></div>
                    </div>
                </div>

                ${(statusVal === 'resuelto' || statusVal === 'cerrado') && resolutionNote ? `
                <div style="grid-column: span 2; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 12px;">
                    <span style="color: #10b981; font-weight: 700; font-size: 0.8rem; display: block; margin-bottom: 2px;"><i class="fas fa-check-circle"></i> Solución / Motivo de Cierre:</span>
                    <div style="color: var(--text-primary); font-size: 0.82rem;">${escapeHtml(resolutionNote)}</div>
                </div>
                ` : ''}

                <div><span style="color: var(--text-muted);">Dispositivo:</span> <span class="meta-val">${escapeHtml(device === 'ninguno' ? 'Ninguno / Otro' : device)}</span></div>
                <div><span style="color: var(--text-muted);">Impacto:</span> <span class="meta-val">${escapeHtml(impactText)}</span></div>
            </div>
            <div>
                <span style="color: var(--text-muted); display: block; margin-bottom: 6px;">Descripción:</span>
                <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; color: var(--text-secondary); white-space: pre-wrap; line-height: 1.5; font-size: 0.85rem;">${escapeHtml(description)}</div>
            </div>
        `;
    }

    // Manejo de Selección de Empresa (Visual Cards)
    document.querySelectorAll('.company-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.company-card').forEach(c => {
                c.classList.remove('active');
                c.style.borderColor = 'var(--border-color)';
                const badge = c.querySelector('.company-check-badge');
                if (badge) badge.style.display = 'none';
            });
            card.classList.add('active');
            card.style.borderColor = 'var(--accent-blue)';
            const badge = card.querySelector('.company-check-badge');
            if (badge) badge.style.display = 'flex';
            updateTicketOfficeOptions(card.getAttribute('data-company'));
        });
    });

    const initialCompanyCard = document.querySelector('.company-card.active');
    if (initialCompanyCard) updateTicketOfficeOptions(initialCompanyCard.getAttribute('data-company'));

    // Listener para Estado Inicial del Ticket
    const ticketStatusSelect = document.getElementById('ticket-status-select');
    const resolutionGroup = document.getElementById('group-ticket-resolution-note');
    if (ticketStatusSelect) {
        ticketStatusSelect.addEventListener('change', () => {
            const val = ticketStatusSelect.value;
            if (val === 'resuelto' || val === 'cerrado') {
                if (resolutionGroup) resolutionGroup.style.display = 'block';
                const techSelect = document.getElementById('ticket-assigned-tech');
                if (techSelect && (!techSelect.value || techSelect.value === '')) {
                    prefillAssignedTech();
                }
            } else {
                if (resolutionGroup) resolutionGroup.style.display = 'none';
            }
            updateStepperUI();
        });
    }

    // Botón Asignarme a mí en el formulario de ticket
    const btnSelfAssign = document.getElementById('btn-self-assign-ticket');
    if (btnSelfAssign) {
        btnSelfAssign.addEventListener('click', () => {
            prefillAssignedTech();
            btnSelfAssign.innerHTML = '<i class="fas fa-check"></i> Asignado';
            setTimeout(() => {
                btnSelfAssign.innerHTML = '<i class="fas fa-user-check"></i> Asignarme a mí';
            }, 1500);
        });
    }

    const btnStepperPrev = document.getElementById('btn-stepper-prev');
    const btnStepperNext = document.getElementById('btn-stepper-next');

    if (btnStepperPrev) {
        btnStepperPrev.addEventListener('click', () => {
            if (currentTicketStep === 1) {
                const inicioTab = Array.from(document.querySelectorAll('.sidebar-nav a')).find(el => el.textContent.toLowerCase().includes('inicio'));
                if (inicioTab) inicioTab.click();
            } else {
                currentTicketStep--;
                updateStepperUI();
            }
        });
    }

    if (btnStepperNext) {
        btnStepperNext.addEventListener('click', async () => {
            if (currentTicketStep === 1) {
                if (validateStep1()) {
                    await loadUserDevices();
                    currentTicketStep = 2;
                    updateStepperUI();
                }
            } else if (currentTicketStep === 2) {
                populateReviewSummary();
                currentTicketStep = 3;
                updateStepperUI();
            } else if (currentTicketStep === 3) {
                const subject = document.getElementById('ticket-subject').value.trim();
                const category = document.getElementById('ticket-category').value;
                const priority = document.getElementById('ticket-priority-select')?.value || 'media';
                const status = document.getElementById('ticket-status-select')?.value || 'abierto';
                const resolutionNote = document.getElementById('ticket-resolution-note')?.value.trim() || '';

                const office = document.getElementById('ticket-office').value;
                const modality = document.getElementById('ticket-modalidad').value;
                const clientName = document.getElementById('ticket-client-name').value.trim();
                const clientRut = document.getElementById('ticket-client-rut').value.trim();
                const clientEmail = document.getElementById('ticket-client-email').value.trim();
                const description = document.getElementById('ticket-description').value.trim();
                const phone = document.getElementById('ticket-phone').value.trim();
                const device = document.getElementById('ticket-device').value;
                const impact = document.getElementById('ticket-impact').value;
                const assignedTech = document.getElementById('ticket-assigned-tech')?.value || null;

                const activeCompanyCard = document.querySelector('.company-card.active');
                const empresa = activeCompanyCard ? activeCompanyCard.getAttribute('data-company') : 'Infinet';

                const isNewUserMode = document.getElementById('btn-user-mode-new')?.classList.contains('active');
                const saveToDirectory = document.getElementById('check-save-to-directory')?.checked;

                if (isNewUserMode && saveToDirectory && clientName) {
                    const dirUsers = loadDirectoryUsers();
                    const exists = dirUsers.some(u => (u.rut && u.rut === clientRut) || (u.email && u.email.toLowerCase() === clientEmail.toLowerCase()));
                    if (!exists) {
                        dirUsers.unshift({
                            id: 'user-' + Date.now(),
                            nombre: clientName,
                            rut: clientRut,
                            email: clientEmail,
                            telefono: phone,
                            empresa: empresa,
                            tipo: 'Ejecutivo',
                            licencia: 'M365 Empresa Básico'
                        });
                        saveDirectoryUsers(dirUsers);
                        if (typeof renderDirectoryPage === 'function') renderDirectoryPage();
                    }
                }

                btnStepperNext.disabled = true;
                const originalHtml = btnStepperNext.innerHTML;
                btnStepperNext.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando Ticket...';

                try {
                    await saveTicket(subject, category, description, priority, office, phone, device, impact, modality, clientName, clientRut, clientEmail, empresa, assignedTech, status, resolutionNote);
                    
                    if (status === 'resuelto') {
                        alert('¡Ticket registrado y guardado como RESUELTO con éxito!');
                    } else {
                        alert('¡Ticket creado con éxito!');
                    }
                    
                    const form = document.getElementById('stepper-ticket-form');
                    if (form) {
                        form.reset();
                        prefillTicketClientFields();
                        if (resolutionGroup) resolutionGroup.style.display = 'none';
                    }
                    
                    const fileZoneText = document.querySelector('.file-upload-zone p');
                    if (fileZoneText) {
                        fileZoneText.innerHTML = 'Arrastra archivos aquí o haz clic para seleccionar';
                    }
                    
                    currentTicketStep = 1;
                    updateStepperUI();
                    await refreshTickets();

                    const misTicketsTab = Array.from(document.querySelectorAll('.sidebar-nav a')).find(el => el.textContent.toLowerCase().includes('mis tickets'));
                    if (misTicketsTab) misTicketsTab.click();
                } catch (err) {
                    console.error(err);
                    alert('Hubo un error al crear el ticket.');
                } finally {
                    btnStepperNext.disabled = false;
                    btnStepperNext.innerHTML = originalHtml;
                }
            }
        });
    }

    // Drag & drop file upload zone initialization
    const fileUploadZone = document.querySelector('.file-upload-zone');
    if (fileUploadZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileUploadZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileUploadZone.classList.remove('dragover');
            }, false);
        });

        fileUploadZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                const p = fileUploadZone.querySelector('p');
                if (p) {
                    p.innerHTML = `<i class="fas fa-check-circle" style="color: var(--accent-green);"></i> ${files.length} archivo(s) seleccionado(s): ${Array.from(files).map(f => f.name).join(', ')}`;
                }
            }
        });

        fileUploadZone.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.onchange = () => {
                if (fileInput.files.length > 0) {
                    const p = fileUploadZone.querySelector('p');
                    if (p) {
                        p.innerHTML = `<i class="fas fa-check-circle" style="color: var(--accent-green);"></i> ${fileInput.files.length} archivo(s) seleccionado(s): ${Array.from(fileInput.files).map(f => f.name).join(', ')}`;
                    }
                }
            };
            fileInput.click();
        });
    }

    // ============================================
    // 4. FILTROS DE TICKETS (Tabs interactivos)
    // ============================================
    const ticketFilterTabs = document.querySelectorAll('.tickets-filter-tabs .filter-tab');
    ticketFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            ticketFilterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter') || 'todos';
            currentTicketPage = 1;
            applyTicketsFilterAndSearch();
        });
    });

    // ============================================
    // 5. BÚSQUEDA EN TICKETS
    // ============================================
    const searchInput = document.getElementById('tickets-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentSearch = searchInput.value.toLowerCase().trim();
            currentTicketPage = 1;
            applyTicketsFilterAndSearch();
        });
    }

    // ============================================
    // 6. DETALLES Y RESPUESTAS DEL TICKET (MODAL)
    // ============================================
    let activeTicketId = null;
    let activeTicketCreatedAt = null;

    function canEditTicketCreationDate() {
        return currentSession && ['admin', 'technician'].includes(currentSession.role);
    }

    function creationDateInputValue(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';
        return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function correctedCreationTimestamp(value, originalTimestamp) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Selecciona una fecha válida.');
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(originalTimestamp);
        if (Number.isNaN(date.getTime())) throw new Error('El ticket no tiene una fecha de creación válida.');
        // Cambiar el día local conservando la hora original y su conversión a UTC.
        date.setFullYear(year, month - 1, day);
        if (creationDateInputValue(date) !== value) throw new Error('Selecciona una fecha válida.');
        return date.toISOString();
    }

    async function saveTicketCreationDate(ticketId, createdAt) {
        if (!canEditTicketCreationDate()) throw new Error('No tienes permisos para cambiar esta fecha.');
        if (!useLocalFallback && supabase) {
            const { data, error } = await supabase.from('tickets')
                .update({ created_at: createdAt }).eq('id', ticketId).select('id, created_at').single();
            if (error) throw error;
            if (!data) throw new Error('No se pudo guardar la fecha del ticket.');
            // Retirar solo la corrección de fecha pendiente; conservar los otros cambios locales.
            const updates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
            if (updates[ticketId]) {
                delete updates[ticketId].created_at;
                if (!Object.keys(updates[ticketId]).length) delete updates[ticketId];
                localStorage.setItem('ticket_updates', JSON.stringify(updates));
            }
            return data.created_at;
        }
        const tickets = JSON.parse(localStorage.getItem('local_tickets')) || [];
        const ticket = tickets.find(item => String(item.id) === String(ticketId));
        if (!ticket) throw new Error('No se encontró el ticket para guardar la fecha.');
        ticket.created_at = createdAt;
        localStorage.setItem('local_tickets', JSON.stringify(tickets));
        return createdAt;
    }

    const creationDateForm = document.getElementById('modal-creation-date-form');
    if (creationDateForm) {
        creationDateForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!activeTicketId || !canEditTicketCreationDate()) return;
            const ticketId = activeTicketId;
            const input = document.getElementById('modal-creation-date-input');
            const button = document.getElementById('modal-creation-date-save');
            const feedback = document.getElementById('modal-creation-date-feedback');
            if (button.disabled || !creationDateForm.reportValidity()) return;
            try {
                const timestamp = correctedCreationTimestamp(input.value, activeTicketCreatedAt);
                button.disabled = true;
                feedback.textContent = 'Guardando fecha…';
                const savedTimestamp = await saveTicketCreationDate(ticketId, timestamp);
                if (String(activeTicketId) === String(ticketId)) {
                    activeTicketCreatedAt = savedTimestamp;
                    input.value = creationDateInputValue(savedTimestamp);
                    document.getElementById('modal-ticket-fecha').textContent = formatDate(savedTimestamp);
                    document.getElementById('ticket-summary-age').textContent = formatRelativeTime(savedTimestamp);
                    document.getElementById('t-step-creado-time').textContent = new Date(savedTimestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                    feedback.textContent = 'Fecha de creación actualizada.';
                }
                await refreshTickets();
            } catch (error) {
                console.error('Error al guardar la fecha de creación:', error);
                if (String(activeTicketId) === String(ticketId)) feedback.textContent = 'No se pudo guardar la fecha. ' + (error.message || 'Intenta nuevamente.');
            } finally {
                if (String(activeTicketId) === String(ticketId)) button.disabled = false;
            }
        });
    }


    async function openTicketDetailModal(ticket) {
        activeTicketId = ticket.id;
        activeTicketCreatedAt = ticket.created_at;
        if (creationDateForm) {
            creationDateForm.hidden = !canEditTicketCreationDate();
            document.getElementById('modal-creation-date-input').value = creationDateInputValue(ticket.created_at);
            document.getElementById('modal-creation-date-save').disabled = false;
            document.getElementById('modal-creation-date-feedback').textContent = '';
        }


        // Mostrar el panel antes de cargar la conversación remota.
        const modal = document.getElementById('ticket-detail-modal');
        if (modal) {
            const profileModal = document.getElementById('modal-perfil-colaborador');
            modal.classList.toggle('ticket-over-profile', profileModal?.style.display === 'flex');
            modal.style.display = 'flex';
        }
        
        const meta = extractMetadata(ticket);

        document.getElementById('modal-ticket-id').textContent = ticket.codigo || '#TK-2026-xxxx';
        document.getElementById('modal-ticket-asunto').textContent = ticket.asunto;
        document.getElementById('modal-ticket-categoria').textContent = getCategoryLabel(ticket.categoria);
        document.getElementById('modal-ticket-fecha').textContent = formatDate(ticket.created_at);
        document.getElementById('modal-ticket-descripcion').textContent = ticket.descripcion;

        const modalSede = document.getElementById('modal-ticket-sede');
        const modalTelefono = document.getElementById('modal-ticket-telefono');
        const modalDispositivo = document.getElementById('modal-ticket-dispositivo');
        const modalImpacto = document.getElementById('modal-ticket-impacto');

        if (modalSede) modalSede.textContent = meta.sede;
        if (modalTelefono) modalTelefono.textContent = meta.telefono;
        if (modalDispositivo) modalDispositivo.textContent = meta.dispositivo;
        if (modalImpacto) {
            const impactLabels = {
                'bajo': 'Bloqueo bajo',
                'medio': 'Bloqueo medio',
                'alto': 'Bloqueo total'
            };
            modalImpacto.textContent = impactLabels[ticket.impacto] || ticket.impacto || 'Bloqueo medio';
        }

        const modalModalidad = document.getElementById('modal-ticket-modalidad');
        const modalClienteNombre = document.getElementById('modal-ticket-cliente-nombre');
        const modalClienteRut = document.getElementById('modal-ticket-cliente-rut');
        const modalClienteEmail = document.getElementById('modal-ticket-cliente-email');

        if (modalModalidad) modalModalidad.textContent = meta.modalidad;
        if (modalClienteNombre) modalClienteNombre.textContent = meta.cliente_nombre;
        if (modalClienteRut) modalClienteRut.textContent = meta.cliente_rut;
        if (modalClienteEmail) modalClienteEmail.textContent = meta.cliente_email;

        const statusSelect = document.getElementById('modal-status-select');
        if (statusSelect) statusSelect.value = ticket.estado.toLowerCase();

        const statusBadge = document.getElementById('modal-ticket-estado');
        if (statusBadge) {
            statusBadge.className = `status-badge ${statusClasses[ticket.estado.toLowerCase()] || 'status-abierto'}`;
            statusBadge.textContent = ticket.estado.charAt(0).toUpperCase() + ticket.estado.slice(1);
        }

        const modalEmpresa = document.getElementById('modal-ticket-empresa');
        if (modalEmpresa) {
            modalEmpresa.textContent = meta.empresa || 'T-Sales';
        }

        // Prioridad Badge
        const prioBadge = document.getElementById('modal-ticket-prioridad-badge');
        if (prioBadge) {
            const p = (ticket.prioridad || 'media').toLowerCase();
            prioBadge.className = `priority-dot-pill priority-${p}`;
            prioBadge.innerHTML = `<span class="p-dot"></span> Prioridad ${p.charAt(0).toUpperCase() + p.slice(1)}`;
        }

        // Resumen operativo: solo usa información real almacenada en el ticket.
        const summaryStatus = document.getElementById('ticket-summary-status');
        const summaryOwner = document.getElementById('ticket-summary-owner');
        const summaryAge = document.getElementById('ticket-summary-age');
        const summaryUpdated = document.getElementById('ticket-summary-updated');
        const summaryResolution = document.getElementById('ticket-summary-resolution');
        const stateText = ticket.estado || 'abierto';
        const stateLabel = stateText.charAt(0).toUpperCase() + stateText.slice(1);
        if (summaryStatus) {
            summaryStatus.textContent = stateLabel;
            summaryStatus.dataset.state = stateText.toLowerCase().replace(/\s+/g, '-');
        }
        if (summaryOwner) summaryOwner.textContent = ticket.tecnico_asignado || meta.tecnico_asignado || 'Sin asignar';
        if (summaryAge) summaryAge.textContent = ticket.created_at ? formatRelativeTime(ticket.created_at) : 'Sin fecha';
        const lastActivity = ticket.updated_at || ticket.fecha_resolucion || ticket.created_at;
        if (summaryUpdated) summaryUpdated.textContent = lastActivity ? `Actualizado ${formatRelativeTime(lastActivity).toLowerCase()}` : 'Sin actualizaciones';
        if (summaryResolution) {
            const resolutionText = ticket.resolucion || ticket.resolucion_nota || '';
            const isResolved = stateText.toLowerCase() === 'resuelto' || stateText.toLowerCase() === 'cerrado';
            summaryResolution.classList.toggle('has-resolution', Boolean(resolutionText));
            summaryResolution.innerHTML = `
                <i class="fas ${isResolved ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <div><span>Resolución</span><strong>${escapeHtml(resolutionText || (isResolved ? 'Resuelto sin una nota de resolución.' : 'Pendiente de resolución.'))}</strong></div>
            `;
        }

        // 1. Lógica de Sugerencias de Solución por IA
        const aiDiag = document.getElementById('modal-ai-diagnosis');
        const aiStepsList = document.getElementById('modal-ai-steps-list');
        const aiSimilarLinks = document.getElementById('modal-ai-similar-links');

        const contentLower = `${ticket.asunto} ${ticket.descripcion} ${ticket.categoria}`.toLowerCase();

        let diagText = "Incidencia reportada por el usuario. Requiere diagnóstico inicial con el solicitante.";
        let steps = [
            "Contactar al solicitante para validar reproducibilidad de la falla.",
            "Solicitar captura de pantalla o código de error específico.",
            "Verificar permisos y accesos en el directorio corporativo."
        ];
        let kbLinks = [
            { text: "Base de Conocimientos TI", cat: "general" }
        ];

        if (contentLower.includes('cambio') && (contentLower.includes('nombre') || contentLower.includes('correo') || contentLower.includes('mail'))) {
            diagText = "Solicitud de actualización de identidad o dirección principal de correo. Es necesario validar el alcance antes de modificar la cuenta.";
            steps = [
                "Confirmar con el solicitante el nombre actual, el nuevo nombre y la dirección requerida.",
                "Revisar si el cambio afecta el nombre visible, el alias o el nombre principal de inicio de sesión.",
                "Aplicar el cambio, validar el acceso y comprobar el envío y recepción de correo."
            ];
            kbLinks = [
                { text: "Administración de cuentas M365", cat: "cuenta" },
                { text: "Configuración de correo", cat: "outlook" }
            ];
        } else if (contentLower.includes('vpn') || contentLower.includes('globalprotect') || contentLower.includes('portal')) {
            diagText = "Fallo de negociación de túnel SSL/TLS o credenciales expiradas en portal de Palo Alto Networks.";
            steps = [
                "Verificar conectividad a Internet del equipo y portal https://vpn.t-sales.cl.",
                "Forzar actualización de credenciales SSO y MFA en cliente GlobalProtect.",
                "Reinstalar cliente GlobalProtect si persiste el error de adaptador virtual TAP."
            ];
            kbLinks = [
                { text: "Configurar GlobalProtect VPN", cat: "vpn" },
                { text: "MFA y Autenticación M365", cat: "contraseñas" }
            ];
        } else if (contentLower.includes('outlook') || contentLower.includes('ost')) {
            diagText = "Posible corrupción en archivo local de datos OST o desincronización con Exchange Online / M365.";
            steps = [
                "Iniciar Outlook en modo seguro (`outlook.exe /safe`) para descartar complementos COM.",
                "Cerrar Outlook y renombrar el archivo `.ost` en `%localappdata%/Microsoft/Outlook`.",
                "Validar estado de la licencia M365 Business en Microsoft 365 Admin Center."
            ];
            kbLinks = [
                { text: "Reparar archivo OST en Outlook", cat: "outlook" },
                { text: "Configuración M365", cat: "software" }
            ];
        } else if (contentLower.includes('impresora') || contentLower.includes('imprimir') || contentLower.includes('spooler')) {
            diagText = "Servicio Spooler de impresión detenido o cola de trabajos bloqueada por documento corrupto.";
            steps = [
                "Ejecutar `net stop spooler` en CMD con privilegios de administrador.",
                "Vaciar la carpeta `C:\\Windows\\System32\\spool\\PRINTERS`.",
                "Reiniciar el servicio con `net start spooler` y probar impresión de página de prueba."
            ];
            kbLinks = [
                { text: "Reinicio de Spooler y Drivers", cat: "impresoras" },
                { text: "Conexión a Impresoras de Red", cat: "redes" }
            ];
        } else if (contentLower.includes('clave') || contentLower.includes('contraseña') || contentLower.includes('bloqueo') || contentLower.includes('acceso')) {
            diagText = "Bloqueo preventivo de cuenta por intentos fallidos o expiración de política de contraseñas de dominio.";
            steps = [
                "Buscar al usuario en Microsoft Entra ID / Active Directory y verificar flag `AccountLockedOut`.",
                "Desbloquear cuenta y enviar SMS o código temporal TAP para recuperación de clave.",
                "Instruir al usuario a ingresar en portal https://passwordreset.microsoftonline.com."
            ];
            kbLinks = [
                { text: "Desbloqueo de Clave SSPR", cat: "contraseñas" },
                { text: "Políticas de Seguridad", cat: "cuenta" }
            ];
        } else if (contentLower.includes('lento') || contentLower.includes('lentitud') || contentLower.includes('ram') || contentLower.includes('disco')) {
            diagText = "Saturación de almacenamiento temporal en unidad C:\\ o procesos de fondo con alto consumo de CPU/RAM.";
            steps = [
                "Abrir Administrador de Tareas y verificar procesos al 100% de CPU/Disco.",
                "Ejecutar liberador de espacio en disco (`cleanmgr /sageset:1`).",
                "Verificar salud del disco con `chkdsk /f` o crystalDiskInfo."
            ];
            kbLinks = [
                { text: "Optimización de Windows 11", cat: "windows" },
                { text: "Inventario de Hardware", cat: "equipos" }
            ];
        }

        if (aiDiag) aiDiag.textContent = diagText;
        if (aiStepsList) {
            aiStepsList.innerHTML = steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
        }
        if (aiSimilarLinks) {
            aiSimilarLinks.innerHTML = kbLinks.map(l => `
                <button type="button" class="ai-link-pill" onclick="openKbCategory('${l.cat}')">
                    <i class="fas fa-book"></i> ${escapeHtml(l.text)}
                </button>
            `).join('');
        }

        // 2. Lógica del Contexto del Usuario Solicitante
        const userName = meta.cliente_nombre || ticket.usuario_nombre || 'Usuario Solicitante';
        const userInit = (userName.split(' ').map(n=>n[0]).join('') || 'U').toUpperCase().slice(0,2);
        const userAvatar = document.getElementById('modal-user-ctx-avatar');
        const userCompany = document.getElementById('modal-user-ctx-empresa');
        const userRole = document.getElementById('modal-user-ctx-cargo');
        const userDevice = document.getElementById('modal-user-ctx-equipo');
        const userOS = document.getElementById('modal-user-ctx-so');
        const userPastTickets = document.getElementById('modal-user-past-tickets');

        const cleanIdentity = value => normalizeStr(value).replace(/[^a-z0-9k@.]+/g, '');
        const directoryUser = loadDirectoryUsers().find(user =>
            (meta.cliente_email && normalizeStr(user.email) === normalizeStr(meta.cliente_email)) ||
            (meta.cliente_rut && cleanIdentity(user.rut) === cleanIdentity(meta.cliente_rut)) ||
            (meta.cliente_nombre && normalizeStr(user.nombre) === normalizeStr(meta.cliente_nombre))
        );
        let storedEquipments = Array.isArray(allEquiposCached) ? allEquiposCached : [];
        if (storedEquipments.length === 0) {
            try { storedEquipments = JSON.parse(localStorage.getItem('local_equipos') || '[]'); } catch (error) {}
        }
        const userEquipment = storedEquipments.find(eq =>
            (meta.cliente_email && normalizeStr(eq.usuario_email) === normalizeStr(meta.cliente_email)) ||
            (meta.cliente_rut && cleanIdentity(eq.usuario_rut) === cleanIdentity(meta.cliente_rut)) ||
            (meta.cliente_nombre && normalizeStr(eq.usuario_nombre || eq.asignado) === normalizeStr(meta.cliente_nombre))
        );

        if (userAvatar) userAvatar.textContent = userInit;
        if (userCompany) userCompany.textContent = directoryUser?.empresa || meta.empresa || 'Sin información';
        if (userRole) userRole.textContent = directoryUser?.tipo || 'Sin información';
        if (userDevice) {
            const storedDeviceName = userEquipment
                ? (userEquipment.nombre_codigo || userEquipment.hostname || [userEquipment.marca, userEquipment.modelo].filter(Boolean).join(' '))
                : '';
            userDevice.textContent = storedDeviceName || (meta.dispositivo !== 'Ninguno / Otro' ? meta.dispositivo : '') || 'Sin equipo asociado';
        }
        if (userOS) userOS.textContent = userEquipment?.sistema_operativo || 'Sin información';

        if (userPastTickets) {
            const previousTickets = (allTicketsCached || []).filter(previous => {
                if (String(previous.id) === String(ticket.id)) return false;
                const previousMeta = extractMetadata(previous);
                return (meta.cliente_email && normalizeStr(previousMeta.cliente_email) === normalizeStr(meta.cliente_email)) ||
                    (meta.cliente_rut && cleanIdentity(previousMeta.cliente_rut) === cleanIdentity(meta.cliente_rut)) ||
                    (meta.cliente_nombre && normalizeStr(previousMeta.cliente_nombre) === normalizeStr(meta.cliente_nombre));
            }).slice(0, 3);

            userPastTickets.innerHTML = previousTickets.length
                ? previousTickets.map(previous => `
                    <button type="button" class="past-ticket-item" data-ticket-id="${escapeHtml(String(previous.id))}">
                        <span class="pt-id">${escapeHtml(previous.codigo || `#${previous.id}`)}</span>
                        <span class="pt-title">${escapeHtml(previous.asunto || 'Sin asunto')}</span>
                        <span class="pt-status status-${escapeHtml((previous.estado || 'abierto').toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(previous.estado || 'Abierto')}</span>
                    </button>
                `).join('')
                : '<div class="past-tickets-empty"><i class="fas fa-inbox"></i><span>Sin tickets anteriores</span></div>';

            userPastTickets.querySelectorAll('[data-ticket-id]').forEach(button => {
                button.addEventListener('click', () => {
                    const previous = (allTicketsCached || []).find(item => String(item.id) === button.dataset.ticketId);
                    if (previous) openTicketDetailModal(previous);
                });
            });
        }

        // 3. Lógica de la Línea de Tiempo de Resolución
        const tState = ticket.estado.toLowerCase();
        const stepCreado = document.getElementById('t-step-creado');
        const stepAsignado = document.getElementById('t-step-asignado');
        const stepRespondido = document.getElementById('t-step-respondido');
        const stepSolucion = document.getElementById('t-step-solucion');
        const stepResuelto = document.getElementById('t-step-resuelto');

        if (stepCreado) stepCreado.className = 't-step active';
        if (stepAsignado) {
            stepAsignado.className = (ticket.tecnico_asignado || tState !== 'abierto') ? 't-step active' : 't-step';
            const techTime = document.getElementById('t-step-asignado-time');
            if (techTime) techTime.textContent = ticket.tecnico_asignado ? ticket.tecnico_asignado.split(' ')[0] : 'Pendiente';
        }
        if (stepRespondido) {
            stepRespondido.className = (tState === 'en progreso' || tState === 'resuelto') ? 't-step active' : 't-step';
        }
        if (stepSolucion) {
            stepSolucion.className = (tState === 'en progreso' || tState === 'resuelto') ? 't-step active' : 't-step';
        }
        if (stepResuelto) {
            stepResuelto.className = (tState === 'resuelto') ? 't-step active' : 't-step';
        }
        const createdTime = document.getElementById('t-step-creado-time');
        const assignedTime = document.getElementById('t-step-asignado-time');
        const respondedTime = document.getElementById('t-step-respondido-time');
        const solutionTime = document.getElementById('t-step-solucion-time');
        const resolvedTime = document.getElementById('t-step-resuelto-time');
        const toTime = value => {
            const date = value ? new Date(value) : null;
            return date && !isNaN(date) ? date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        };
        if (createdTime) createdTime.textContent = toTime(ticket.created_at);
        if (assignedTime) assignedTime.textContent = ticket.tecnico_asignado ? 'Asignado' : 'Pendiente';
        if (respondedTime) respondedTime.textContent = (tState === 'en progreso' || tState === 'resuelto') ? 'Registrada' : 'Pendiente';
        if (solutionTime) solutionTime.textContent = tState === 'resuelto' ? 'Aplicada' : 'Pendiente';
        if (resolvedTime) resolvedTime.textContent = tState === 'resuelto' ? toTime(ticket.fecha_resolucion || ticket.updated_at) : 'Pendiente';

        const replyInput = document.getElementById('modal-reply-input');
        if (replyInput) {
            replyInput.value = '';
            replyInput.style.height = '48px';
        }

        // Lógica de Asignación y Reasignación de Caso
        const assignmentBox = document.getElementById('modal-assignment-box');
        const assignmentStatus = document.getElementById('modal-assignment-status');
        const assignmentControls = document.getElementById('modal-assignment-controls');
        const techBadge = document.getElementById('modal-ticket-tecnico-badge');

        if (techBadge) {
            techBadge.textContent = ticket.tecnico_asignado || 'Sin asignar';
        }

        if (currentSession && (currentSession.role === 'admin' || currentSession.role === 'technician')) {
            if (assignmentBox) assignmentBox.style.display = 'flex';

            if (currentSession.role === 'admin') {
                if (assignmentStatus) {
                    assignmentStatus.textContent = ticket.tecnico_asignado 
                        ? `Asignado a: ${ticket.tecnico_asignado}` 
                        : 'Este ticket no está asignado a ningún técnico.';
                }
                if (assignmentControls) {
                    assignmentControls.innerHTML = `
                        <select id="modal-assign-tech-select" style="background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; font-weight: 600; padding: 6px 12px; font-family: var(--font-family); cursor: pointer;">
                            <option value="" ${!ticket.tecnico_asignado ? 'selected' : ''}>Sin asignar</option>
                            <option value="Felipe Olivares" ${ticket.tecnico_asignado === 'Felipe Olivares' ? 'selected' : ''}>Felipe Olivares</option>
                            <option value="Omar Gálvez" ${ticket.tecnico_asignado === 'Omar Gálvez' ? 'selected' : ''}>Omar Gálvez</option>
                            <option value="Belfor Aburto" ${ticket.tecnico_asignado === 'Belfor Aburto' ? 'selected' : ''}>Belfor Aburto</option>
                        </select>
                    `;
                    const select = document.getElementById('modal-assign-tech-select');
                    select.addEventListener('change', async () => {
                        const newTech = select.value;
                        await updateTicketFields(ticket.id, { tecnico_asignado: newTech || null });
                        if (techBadge) techBadge.textContent = newTech || 'Sin asignar';
                        if (assignmentStatus) assignmentStatus.textContent = newTech ? `Asignado a: ${newTech}` : 'Este ticket no está asignado a ningún técnico.';
                        await refreshTickets();
                    });
                }
                if (statusSelect) statusSelect.disabled = false;
            } else {
                // Technician
                const isAssignedToMe = ticket.tecnico_asignado === currentSession.nombre;
                if (assignmentStatus) {
                    if (ticket.tecnico_asignado) {
                        assignmentStatus.textContent = isAssignedToMe ? 'Asignado a ti' : `Asignado a: ${ticket.tecnico_asignado}`;
                    } else {
                        assignmentStatus.textContent = 'Este ticket no está asignado.';
                    }
                }
                if (assignmentControls) {
                    if (!ticket.tecnico_asignado) {
                        assignmentControls.innerHTML = `
                            <button type="button" id="btn-tomar-ticket" class="page-btn" style="background-color: var(--accent-green); border: none; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: var(--font-family); transition: all 0.2s;">Tomar Ticket</button>
                        `;
                        const btnTomar = document.getElementById('btn-tomar-ticket');
                        btnTomar.addEventListener('click', async () => {
                            await updateTicketFields(ticket.id, { 
                                tecnico_asignado: currentSession.nombre,
                                estado: 'en progreso'
                            });
                            if (techBadge) techBadge.textContent = currentSession.nombre;
                            if (assignmentStatus) assignmentStatus.textContent = 'Asignado a ti';
                            if (assignmentControls) assignmentControls.innerHTML = '';
                            if (statusSelect) {
                                statusSelect.value = 'en progreso';
                                statusSelect.disabled = false;
                            }
                            if (statusBadge) {
                                statusBadge.className = `status-badge ${statusClasses['en progreso']}`;
                                statusBadge.textContent = 'En progreso';
                            }
                            alert('Has tomado el ticket. Estado cambiado a En Progreso.');
                            await refreshTickets();
                        });
                    } else {
                        assignmentControls.innerHTML = '';
                    }
                }
                if (statusSelect) statusSelect.disabled = !isAssignedToMe;
            }
        } else {
            if (assignmentBox) assignmentBox.style.display = 'none';
            if (statusSelect) statusSelect.disabled = true;
        }

        loadRepliesList(ticket.id).catch(error => {
            console.warn('No se pudo cargar la conversación del ticket:', error);
            const repliesList = document.getElementById('modal-replies-list');
            if (repliesList && String(activeTicketId) === String(ticket.id)) {
                repliesList.innerHTML = '<div class="reply-bubble system-message">No fue posible cargar la conversación. Puedes seguir revisando el ticket.</div>';
            }
        });
    }

    function getCategoryLabel(catCode) {
        const catMap = {
            'cuenta': 'Cuenta y Acceso',
            'configuracion': 'Configuración',
            'redes': 'Redes y VPN',
            'software': 'Software y Office',
            'soporte': 'Soporte Técnico'
        };
        return catMap[catCode.toLowerCase()] || catCode;
    }

    async function loadRepliesList(ticketId) {
        const list = document.getElementById('modal-replies-list');
        if (!list) return;

        list.innerHTML = '<div class="reply-bubble system-message"><i class="fas fa-spinner fa-spin"></i> Cargando conversación...</div>';
        const replies = await fetchReplies(ticketId);

        // Evita que una respuesta tardía reemplace la conversación de otro ticket.
        if (String(activeTicketId) !== String(ticketId)) return;

        list.innerHTML = '';
        if (replies.length === 0) {
            list.innerHTML = '<div class="reply-bubble system-message">No hay respuestas en este ticket todavía.</div>';
            return;
        }

        replies.forEach(reply => {
            const bubble = document.createElement('div');
            const isUser = reply.autor.toLowerCase() === 'usuario';
            bubble.className = `reply-bubble ${isUser ? 'user-reply' : 'support-reply'}`;

            const authorName = isUser ? 'Usuario' : 'Soporte Técnico';
            const icon = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-headset"></i>';

            bubble.innerHTML = `
                <div class="reply-meta">
                    <span class="reply-author">${icon} ${authorName}</span>
                    <span class="reply-time">${formatRelativeTime(reply.created_at)}</span>
                </div>
                <div class="reply-text">${escapeHtml(reply.mensaje)}</div>
            `;
            list.appendChild(bubble);
        });

        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            setTimeout(() => {
                modalBody.scrollTop = modalBody.scrollHeight;
            }, 50);
        }
    }

    // Cerrar Modal
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const ticketModal = document.getElementById('ticket-detail-modal');

    const closeTicketDetailModal = () => {
        if (!ticketModal) return;
        ticketModal.style.display = 'none';
        ticketModal.classList.remove('ticket-over-profile');
        activeTicketId = null;
    };

    if (modalCloseBtn && ticketModal) {
        modalCloseBtn.addEventListener('click', closeTicketDetailModal);

        ticketModal.addEventListener('click', (e) => {
            if (e.target === ticketModal) {
                closeTicketDetailModal();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && ticketModal.style.display === 'flex') {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeTicketDetailModal();
            }
        });
    }

    // Enviar Respuesta
    const replyForm = document.getElementById('modal-reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!activeTicketId) return;

            const replyInput = document.getElementById('modal-reply-input');
            const message = replyInput.value.trim();
            if (!message) return;

            const author = 'soporte'; // Las respuestas desde este panel siempre son del administrador (Soporte Técnico)

            const submitBtn = replyForm.querySelector('.reply-submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                await saveReply(activeTicketId, author, message);
                replyInput.value = '';
                replyInput.style.height = '48px';
                await loadRepliesList(activeTicketId);
            } catch (err) {
                console.error(err);
                alert('No se pudo enviar la respuesta.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
            }
        });
    }

    // Actualizar Estado desde Modal
    const statusSelect = document.getElementById('modal-status-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', async () => {
            if (!activeTicketId) return;
            const newStatus = statusSelect.value;

            try {
                await updateTicketStatus(activeTicketId, newStatus);
                const statusBadge = document.getElementById('modal-ticket-estado');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${statusClasses[newStatus] || 'status-abierto'}`;
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                }
                await refreshTickets();
            } catch (err) {
                console.error(err);
                alert('Error al actualizar el estado.');
            }
        });
    }

    // ============================================
    // 7. BOTÓN CREAR NUEVO TICKET (desde Mis Tickets)
    // ============================================
    const btnCrearNuevo = document.getElementById('btn-crear-nuevo-ticket');
    
    if (btnCrearNuevo) {
        btnCrearNuevo.addEventListener('click', () => {
            navigateToPage('page-crear-ticket');
        });
    }

    // ============================================
    // MOCK DATA: BASE DE CONOCIMIENTOS (TUTORIALES)
    // ============================================
    const TUTORIALS_DATA = [
        {
            id: 'tut-excel-congelado',
            categoria: 'excel',
            titulo: 'Excel se congela frecuentemente',
            descripcion: 'Qué hacer si Microsoft Excel se bloquea, se congela o deja de responder de forma recurrente durante tus tareas diarias.',
            dificultad: 'Medio',
            tiempo: '10 min',
            estado: 'critico',
            icono: 'far fa-file-excel',
            etiquetas: ['Excel', 'Office', 'Bugs'],
            causas: [
                'Conflicto directo con complementos de terceros (Add-ins) activos.',
                'Aceleración gráfica por hardware chocando con controladores de video desactualizados.',
                'Hojas de cálculo extremadamente grandes o archivos temporales corruptos.'
            ],
            soluciones: [
                {
                    titulo: 'Abrir Excel en Modo Seguro',
                    descripcion: 'El Modo Seguro inicia Excel sin cargar complementos ni personalizaciones, ayudándote a descartar fallos de configuración.',
                    pasos: [
                        'Presiona la combinación de teclas **Windows + R** para abrir la ventana Ejecutar.',
                        'Escribe `excel.exe /safe` en el cuadro de texto y presiona Enter o Aceptar.',
                        'Trabaja en Excel en esta sesión segura. Si ya no se congela, el problema proviene de un complemento activo.',
                        'Cierra la aplicación para salir del Modo Seguro.'
                    ],
                    codigo: {
                        titulo: 'Comando de Consola para Modo Seguro',
                        lenguaje: 'bash',
                        contenido: 'excel.exe /safe'
                    }
                },
                {
                    titulo: 'Desactivar complementos COM conflictivos',
                    descripcion: 'Si el Modo Seguro solucionó el bloqueo, debes deshabilitar los complementos individualmente.',
                    pasos: [
                        'Inicia Excel normalmente y navega al menú **Archivo > Opciones > Complementos**.',
                        'En el menú desplegable inferior **Administrar**, selecciona **Complementos COM** y haz clic en el botón **Ir...**.',
                        'Desmarca todas las casillas de la lista mostrada y haz clic en **Aceptar**.',
                        'Activa los complementos uno a uno y reinicia Excel para identificar el complemento que causa el congelamiento.'
                    ]
                },
                {
                    titulo: 'Reparar la instalación de Office',
                    descripcion: 'Si los bloqueos persisten, es probable que los archivos del sistema de la suite Microsoft Office estén corruptos.',
                    pasos: [
                        'Cierra todos los programas de Office abiertos.',
                        'Abre el menú de Windows y ve a **Configuración > Aplicaciones > Aplicaciones Instaladas**.',
                        'Busca **Microsoft Office** (o Microsoft 365) en la lista.',
                        'Haz clic en los tres puntos, presiona **Modificar** (o Opciones avanzadas).',
                        'Selecciona **Reparación Rápida** y sigue las instrucciones. Si el problema persiste, inicia una **Reparación en Línea**.'
                    ]
                }
            ]
        },
        {
            id: 'tut-outlook-no-abre',
            categoria: 'outlook',
            titulo: 'Outlook no abre / Se queda cargando perfil',
            descripcion: 'Pasos para solucionar el bloqueo de inicio de Outlook en la pantalla de carga de perfil de usuario.',
            dificultad: 'Medio',
            tiempo: '8 min',
            estado: 'revision',
            icono: 'far fa-envelope',
            etiquetas: ['Outlook', 'Correo', 'Perfil'],
            causas: [
                'Proceso fantasma de Outlook bloqueado en el Administrador de Tareas.',
                'Archivos de almacenamiento (.PST o .OST) dañados.',
                'Perfil de correo corrupto.'
            ],
            soluciones: [
                {
                    titulo: 'Matar procesos colgados',
                    descripcion: 'A veces Outlook no abre porque una instancia anterior sigue colgada en el sistema.',
                    pasos: [
                        'Presiona `Ctrl + Shift + Esc` para abrir el **Administrador de Tareas**.',
                        'Busca `Outlook.exe` o `Microsoft Outlook` en la lista de Procesos.',
                        'Haz clic derecho sobre el proceso y presiona **Finalizar Tarea**.',
                        'Vuelve a abrir Outlook normalmente.'
                    ]
                },
                {
                    titulo: 'Reparar archivo OST/PST con scanpst.exe',
                    descripcion: 'Microsoft Office incluye una herramienta de reparación de archivos de datos corruptos.',
                    pasos: [
                        'Cierra Outlook por completo.',
                        'Busca el archivo `scanpst.exe` en tu explorador (suele estar en `C:\\Program Files\\Microsoft Office\\root\\Office16`).',
                        'Ejecuta la herramienta, selecciona tu archivo de datos (.PST o .OST) y haz clic en **Iniciar**.',
                        'Si detecta errores, marca la casilla "Hacer copia de seguridad" y haz clic en **Reparar**.'
                    ]
                }
            ]
        },
        {
            id: 'tut-windows-lento',
            categoria: 'windows',
            titulo: 'Windows muy lento al iniciar',
            descripcion: 'Guía de optimización de arranque para acelerar el encendido de tu computadora en pocos pasos.',
            dificultad: 'Fácil',
            tiempo: '12 min',
            estado: 'resuelto',
            icono: 'fab fa-windows',
            etiquetas: ['Windows', 'Optimización', 'Hardware'],
            causas: [
                'Exceso de aplicaciones configuradas para iniciar con el arranque del equipo.',
                'Servicios en segundo plano consumiendo disco y procesador.',
                'Falta de espacio libre en la unidad del sistema (C:).'
            ],
            soluciones: [
                {
                    titulo: 'Deshabilitar aplicaciones de inicio',
                    descripcion: 'Reduce el volumen de programas pesados que se ejecutan en segundo plano al encender la PC.',
                    pasos: [
                        'Abre el **Administrador de Tareas** (`Ctrl + Shift + Esc`).',
                        'En la barra lateral izquierda, selecciona la pestaña **Aplicaciones de Arranque**.',
                        'Identifica aplicaciones no esenciales con impacto de inicio alto (ej. Spotify, Steam, etc.).',
                        'Haz clic sobre la aplicación y presiona **Deshabilitar** en la esquina superior derecha.'
                    ]
                }
            ]
        },
        {
            id: 'tut-login-error',
            categoria: 'seguridad',
            titulo: 'Error de inicio de sesión o token vencido',
            descripcion: 'Resuelve problemas de acceso, bloqueo de cuenta y conflictos de cookies en el portal corporativo.',
            dificultad: 'Fácil',
            tiempo: '4 min',
            estado: 'resuelto',
            icono: 'fas fa-shield-alt',
            etiquetas: ['Acceso', 'Login', 'Seguridad'],
            causas: [
                'Cookies antiguas guardadas en conflicto con la sesión actual.',
                'Dirección IP local con caché DNS desactualizada.',
                'Token de autenticación expirado en el navegador.'
            ],
            soluciones: [
                {
                    titulo: 'Forzar borrado de caché y cookies',
                    descripcion: 'Una limpieza selectiva de las cookies corporativas remueve los tokens dañados.',
                    pasos: [
                        'En Google Chrome o Edge, presiona la combinación de teclas **Ctrl + Shift + Supr** (o Delete).',
                        'Establece el intervalo de tiempo en **Desde siempre**.',
                        'Marca únicamente **Cookies y otros datos de sitios** y **Archivos e imágenes almacenados en caché**.',
                        'Haz clic en **Borrar Datos**, reinicia el navegador y vuelve a iniciar sesión.'
                    ]
                }
            ]
        },
        {
            id: 'tut-teams-mic',
            categoria: 'hardware',
            titulo: 'Teams no detecta el micrófono o cámara',
            descripcion: 'Qué hacer si Microsoft Teams no reconoce tus periféricos de audio y video durante una reunión.',
            dificultad: 'Fácil',
            tiempo: '5 min',
            estado: 'resuelto',
            icono: 'fas fa-microchip',
            etiquetas: ['Teams', 'Micrófono', 'Cámara', 'Periféricos'],
            causas: [
                'Restricciones de privacidad activas en Windows que impiden el acceso a la app.',
                'Selección de hardware predeterminado errónea en la app de Teams.',
                'Controladores de periféricos desactualizados.'
            ],
            soluciones: [
                {
                    titulo: 'Activar permisos de privacidad en Windows',
                    descripcion: 'El sistema operativo Windows 10/11 bloquea los micrófonos si el permiso global está inactivo.',
                    pasos: [
                        'Abre el menú de Windows y ve a **Configuración > Privacidad y Seguridad**.',
                        'Bajo la sección de **Permisos de la Aplicación**, haz clic en **Cámara**.',
                        'Asegúrate de activar **Acceso a la cámara** y **Permitir que las aplicaciones accedan a la cámara**.',
                        'Repite los mismos pasos ingresando a la categoría **Micrófono**.'
                    ]
                },
                {
                    titulo: 'Cambiar dispositivo de entrada en Teams',
                    descripcion: 'Verifica la configuración interna de Teams para redireccionar el audio y video correctamente.',
                    pasos: [
                        'Dentro de Microsoft Teams, haz clic en los tres puntos al lado de tu perfil y selecciona **Configuración**.',
                        'Ve a la pestaña **Dispositivos**.',
                        'Bajo **Dispositivos de Audio**, comprueba que tu micrófono real esté seleccionado en la entrada y no un canal virtual.',
                        'En la vista de Cámara, haz clic en el menú desplegable y selecciona tu cámara web activa.'
                    ]
                }
            ]
        },
        {
            id: 'tut-red-error',
            categoria: 'redes',
            titulo: 'Error de conexión a internet (Sin acceso a red)',
            descripcion: 'Guía para solucionar la pérdida de conexión local y restaurar la configuración TCP/IP de red.',
            dificultad: 'Medio',
            tiempo: '6 min',
            estado: 'critico',
            icono: 'fas fa-wifi',
            etiquetas: ['Internet', 'Red', 'IP', 'DNS'],
            causas: [
                'Conflicto de asignación de dirección IP local con el router.',
                'Caché de resolución DNS corrompida localmente.',
                'Controlador del adaptador de red inalámbrica colgado.'
            ],
            soluciones: [
                {
                    titulo: 'Restablecer adaptadores y limpiar DNS',
                    descripcion: 'Forzar la renovación de la dirección IP y la liberación de la caché resuelve la mayoría de problemas de red.',
                    pasos: [
                        'Busca **Símbolo del sistema** o **cmd** en el menú inicio de Windows.',
                        'Haz clic derecho sobre él y selecciona **Ejecutar como Administrador**.',
                        'Escribe los siguientes comandos uno a uno presionando Enter en cada uno:',
                        '`ipconfig /release` (Libera la IP actual)',
                        '`ipconfig /renew` (Solicita una nueva IP)',
                        '`ipconfig /flushdns` (Limpia la caché de nombres de red)'
                    ],
                    codigo: {
                        titulo: 'Comandos CMD de Red',
                        lenguaje: 'batch',
                        contenido: 'ipconfig /release\nipconfig /renew\nipconfig /flushdns'
                    }
                }
            ]
        }
    ];

    // Variables de estado
    let selectedKbCat = 'todos';
    let kbSearchQuery = '';

    // Función para renderizar los tutoriales
    function renderTutorials() {
        const grid = document.getElementById('kb-tutorials-grid');
        const countSpan = document.getElementById('kb-results-count');
        if (!grid) return;

        // Filtrar datos
        let filtered = TUTORIALS_DATA.filter(tut => {
            const matchesCat = (selectedKbCat === 'todos' || tut.categoria === selectedKbCat);
            const matchesSearch = (
                kbSearchQuery === '' ||
                tut.titulo.toLowerCase().includes(kbSearchQuery) ||
                tut.descripcion.toLowerCase().includes(kbSearchQuery) ||
                tut.etiquetas.some(t => t.toLowerCase().includes(kbSearchQuery))
            );
            return matchesCat && matchesSearch;
        });

        // Mostrar recuento
        if (countSpan) {
            countSpan.textContent = `Mostrando ${filtered.length} tutorial${filtered.length !== 1 ? 'es' : ''}`;
        }

        // Renderizar
        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="reply-bubble system-message" style="grid-column: 1 / -1; width: 100%; padding: 40px; margin-top: 20px;">
                    <i class="fas fa-search-minus" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
                    No encontramos tutoriales relacionados con tu búsqueda.
                </div>
            `;
            return;
        }

        filtered.forEach(tut => {
            const card = document.createElement('div');
            card.className = 'tut-glow-card';
            card.setAttribute('data-id', tut.id);

            // Determinar clases de estado
            const stateLabels = { 'resuelto': 'Resuelto', 'revision': 'En revisión', 'critico': 'Crítico' };
            const stateLabel = stateLabels[tut.estado] || 'Resuelto';
            const stateClass = `status-${tut.estado}`;

            // Tags HTML
            const tagsHtml = tut.etiquetas.map(t => `<span class="tut-tag">${t}</span>`).join('');

            card.innerHTML = `
                <div class="tut-card-visual-header">
                    <i class="${tut.icono}"></i>
                    <span class="tut-card-state-badge ${stateClass}">${stateLabel}</span>
                </div>
                <div class="tut-card-main">
                    <div class="tut-card-tags">
                        ${tagsHtml}
                    </div>
                    <h3>${tut.titulo}</h3>
                    <p>${tut.descripcion}</p>
                </div>
                <div class="tut-card-meta-bar">
                    <div class="tut-meta-info">
                        <span><i class="far fa-clock"></i> ${tut.tiempo}</span>
                        <span><i class="fas fa-signal"></i> ${tut.dificultad}</span>
                    </div>
                    <button class="tut-card-btn">Ver tutorial <i class="fas fa-arrow-right"></i></button>
                </div>
            `;

            card.querySelector('.tut-card-btn').addEventListener('click', () => {
                openTutorialDetail(tut);
            });

            grid.appendChild(card);
        });
    }

    function openTutorialDetail(tut) {
        document.getElementById('modal-tut-category').textContent = `${tut.categoria.toUpperCase()} / TUTORIAL`;
        document.getElementById('modal-tut-title').textContent = tut.titulo;
        document.getElementById('modal-tut-description').textContent = tut.descripcion;
        document.getElementById('modal-tut-time').textContent = tut.tiempo;
        document.getElementById('modal-tut-difficulty').textContent = tut.dificultad;

        // Estado badge
        const stateBadge = document.getElementById('modal-tut-state');
        if (stateBadge) {
            const stateLabels = { 'resuelto': 'Resuelto', 'revision': 'En revisión', 'critico': 'Crítico' };
            stateBadge.className = `status-badge status-${tut.estado}`;
            stateBadge.textContent = stateLabels[tut.estado] || 'Resuelto';
        }

        // Causas comunes
        const causesList = document.getElementById('modal-tut-causes');
        if (causesList) {
            causesList.innerHTML = tut.causas.map(c => `<li>${escapeHtml(c)}</li>`).join('');
        }

        // Soluciones paso a paso
        const stepsContainer = document.getElementById('modal-tut-steps');
        if (stepsContainer) {
            stepsContainer.innerHTML = '';
            tut.soluciones.forEach((sol, index) => {
                const stepNode = document.createElement('div');
                stepNode.className = 'tut-step-node';

                // Pasos numerados en lista
                const stepsLi = sol.pasos.map(step => `<li>${escapeHtml(step)}</li>`).join('');

                // Código formateado si tiene
                let codeHtml = '';
                if (sol.codigo) {
                    codeHtml = `
                        <div class="code-block-modern">
                            <div class="code-header">
                                <div class="code-window-dots">
                                    <span class="code-dot red"></span>
                                    <span class="code-dot yellow"></span>
                                    <span class="code-dot green"></span>
                                </div>
                                <span class="code-filename">${escapeHtml(sol.codigo.titulo)}</span>
                            </div>
                            <pre><code>${escapeHtml(sol.codigo.contenido)}</code></pre>
                        </div>
                    `;
                }

                stepNode.innerHTML = `
                    <div class="tut-step-number-circle">${index + 1}</div>
                    <div class="tut-step-content">
                        <h4 class="tut-step-title">${sol.titulo}</h4>
                        <p class="tut-step-body">${sol.descripcion}</p>
                        <ol style="margin-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                            ${stepsLi}
                        </ol>
                        ${codeHtml}
                    </div>
                `;
                stepsContainer.appendChild(stepNode);
            });
        }

        // Mostrar modal
        const modal = document.getElementById('tutorial-detail-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Cerrar Modal Tutorial
    const tutModalCloseBtn = document.getElementById('modal-tut-close-btn');
    const tutModal = document.getElementById('tutorial-detail-modal');

    if (tutModalCloseBtn && tutModal) {
        tutModalCloseBtn.addEventListener('click', () => {
            tutModal.style.display = 'none';
        });

        tutModal.addEventListener('click', (e) => {
            if (e.target === tutModal) {
                tutModal.style.display = 'none';
            }
        });
    }

    // Feedback de utilidad
    const feedbackYesBtn = document.getElementById('tut-feedback-yes');
    const feedbackNoBtn = document.getElementById('tut-feedback-no');

    if (feedbackYesBtn) {
        feedbackYesBtn.addEventListener('click', () => {
            alert('¡Gracias por tu valoración! Nos alegra que el tutorial te haya sido útil.');
        });
    }

    if (feedbackNoBtn) {
        feedbackNoBtn.addEventListener('click', () => {
            alert('Lamentamos escuchar eso. Redirigiendo al formulario para reportar tu caso...');
            if (tutModal) tutModal.style.display = 'none';
            
            // Redirigir a crear ticket
            const contactBtn = document.getElementById('kb-contactar-soporte-btn');
            if (contactBtn) contactBtn.click();
        });
    }

    // Filtros de Categorías
    const kbCatCards = document.querySelectorAll('.kb-cat-card');
    kbCatCards.forEach(card => {
        card.addEventListener('click', () => {
            kbCatCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedKbCat = card.getAttribute('data-cat');
            renderTutorials();
        });
    });

    // Buscador
    const kbSearchInput = document.getElementById('kb-search-input');
    if (kbSearchInput) {
        kbSearchInput.addEventListener('input', () => {
            kbSearchQuery = kbSearchInput.value.toLowerCase().trim();
            renderTutorials();
        });
    }

    // Redirección CTA inferior a tickets
    const kbContactarSoporteBtn = document.getElementById('kb-contactar-soporte-btn');
    if (kbContactarSoporteBtn) {
        kbContactarSoporteBtn.addEventListener('click', () => {
            navigateToPage('page-crear-ticket');
        });
    }

    // ============================================
    // AUTOCOMPLEMENTADO DE BÚSQUEDA (INICIO)
    // ============================================
    const mainSearchInput = document.getElementById('main-search-input');
    const mainSearchBtn = document.getElementById('main-search-btn');
    const suggestionsDropdown = document.getElementById('search-suggestions');

    if (mainSearchInput && suggestionsDropdown) {
        mainSearchInput.addEventListener('input', () => {
            const query = mainSearchInput.value.toLowerCase().trim();
            
            if (!query) {
                suggestionsDropdown.innerHTML = '';
                suggestionsDropdown.style.display = 'none';
                return;
            }

            // Filtrar tutoriales por título, descripción o etiquetas
            const matches = TUTORIALS_DATA.filter(tut => 
                tut.titulo.toLowerCase().includes(query) ||
                tut.descripcion.toLowerCase().includes(query) ||
                tut.etiquetas.some(tag => tag.toLowerCase().includes(query))
            );

            suggestionsDropdown.innerHTML = '';
            if (matches.length === 0) {
                suggestionsDropdown.innerHTML = `
                    <div class="suggestion-no-results">
                        <i class="fas fa-info-circle"></i>
                        <span>No encontramos soluciones. ¿Quieres crear un ticket?</span>
                    </div>
                `;
            } else {
                matches.forEach(tut => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    
                    item.innerHTML = `
                        <div class="suggestion-icon">
                            <i class="${tut.icono}"></i>
                        </div>
                        <div class="suggestion-content">
                            <span class="suggestion-title">${escapeHtml(tut.titulo)}</span>
                            <span class="suggestion-desc">${escapeHtml(tut.descripcion)}</span>
                        </div>
                    `;

                    // Al hacer clic en un elemento sugerido, abrir el modal de detalles
                    item.addEventListener('click', () => {
                        openTutorialDetail(tut);
                        mainSearchInput.value = '';
                        suggestionsDropdown.innerHTML = '';
                        suggestionsDropdown.style.display = 'none';
                    });

                    suggestionsDropdown.appendChild(item);
                });
            }

            suggestionsDropdown.style.display = 'flex';
        });

        // Ocultar dropdown al hacer clic fuera del buscador
        document.addEventListener('click', (e) => {
            if (e.target !== mainSearchInput && e.target !== suggestionsDropdown && !suggestionsDropdown.contains(e.target)) {
                suggestionsDropdown.style.display = 'none';
            }
        });

        // Al presionar Enter en el input, navegar a la sección de tutoriales aplicando el filtro
        mainSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                triggerMainSearch();
            }
        });
    }

    if (mainSearchBtn) {
        mainSearchBtn.addEventListener('click', () => {
            triggerMainSearch();
        });
    }

    function triggerMainSearch() {
        const query = mainSearchInput ? mainSearchInput.value.trim() : '';
        if (!query) return;

        // Ocultar dropdown
        if (suggestionsDropdown) {
            suggestionsDropdown.innerHTML = '';
            suggestionsDropdown.style.display = 'none';
        }

        // Navegar a la sección de Tutoriales
        const tutorialesLink = Array.from(document.querySelectorAll('.sidebar-nav a')).find(el => 
            el.textContent.toLowerCase().includes('tutoriales')
        );
        
        if (tutorialesLink) {
            // Limpiar input de inicio
            if (mainSearchInput) mainSearchInput.value = '';
            
            // Simular clic en menú "Tutoriales"
            tutorialesLink.click();

            // Setear el input de búsqueda de la sección de tutoriales con el valor
            const kbSearchInput = document.getElementById('kb-search-input');
            if (kbSearchInput) {
                kbSearchInput.value = query;
                kbSearchQuery = query.toLowerCase();
                renderTutorials();
                kbSearchInput.focus();
            }
        }
    }

    // Inicializar render de Base de Conocimientos
    renderTutorials();

    // ============================================
    // INVENTARIO DE EQUIPOS (CMDB) - LÓGICA Y CRUD
    // ============================================

    async function fetchEquipos() {
        let localEquipos = JSON.parse(localStorage.getItem('local_equipos')) || [];

        // Limpieza de inventario de prueba de T-Sales (40 notebooks que no existen aún)
        if (localEquipos.length > 0) {
            const cleanEquipos = localEquipos.filter(eq => {
                if (eq.id && (eq.id.startsWith('eq-ts-') || /^eq-\d+$/.test(eq.id))) return false;
                if (eq.empresa === 'T-Sales' && (eq.id && (eq.id.startsWith('eq-ts-') || /^eq-\d+$/.test(eq.id)))) return false;
                return true;
            });
            if (cleanEquipos.length !== localEquipos.length) {
                localEquipos = cleanEquipos;
                localStorage.setItem('local_equipos', JSON.stringify(localEquipos));
            }
        }

        if (localEquipos.length === 0) {
            localEquipos = seedDefaultEquipos();
            localStorage.setItem('local_equipos', JSON.stringify(localEquipos));
        }

        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (!error && Array.isArray(data)) {
                    // Combinar Supabase y Local sin borrar datos del usuario
                    const map = new Map();
                    // Primero lo local
                    localEquipos.forEach(eq => {
                        const key = (eq.serial ? eq.serial.trim().toLowerCase() : '') || eq.id;
                        if (key) map.set(key, eq);
                    });
                    // Luego lo de Supabase
                    data.forEach(eq => {
                        const key = (eq.serial ? eq.serial.trim().toLowerCase() : '') || eq.id;
                        if (key) {
                            map.set(key, { ...(map.get(key) || {}), ...eq });
                        }
                    });

                    const merged = Array.from(map.values());
                    localStorage.setItem('local_equipos', JSON.stringify(merged));
                    return merged;
                }
            } catch (err) {
                console.warn('Error fetching equipos from Supabase, using local cache:', err);
            }
        }
        
        return localEquipos;
    }

    function seedDefaultEquipos() {
        const equipos = [
                {
                    id: 'eq-vp-1',
                    nombre_codigo: '-VPRIME',
                    usuario_nombre: 'Nicolas Toledo Rojas',
                    usuario_email: 'nicolas.toledo@vprime.cl',
                    empresa: 'VPrime',
                    estado: 'activo',
                    serial: '78F12Z2',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'Intel i5-8265U',
                    ram: '7.85 GB',
                    disco_duro: '295.37 GB SSD',
                    sistema_operativo: 'Windows 10 Pro (Build 19045)',
                    build_windows: '19045',
                    licencia_usuario: 'M365',
                    fecha_asignacion: '12/01/2024',
                    tipo: 'laptop',
                    created_at: '2024-01-12T10:00:00.000Z'
                },
                {
                    id: 'eq-vp-2',
                    nombre_codigo: 'DELL',
                    usuario_nombre: 'Carlos Gonzalez',
                    usuario_email: 'carlos.gonzalez@vprime.cl',
                    empresa: 'VPrime',
                    estado: 'activo',
                    serial: '9717NT2',
                    marca: 'Dell',
                    modelo: 'Latitude 5300',
                    cpu: 'Intel i5-8365U',
                    ram: '7.78 GB',
                    disco_duro: '265.96 GB SSD',
                    sistema_operativo: 'Windows 11 Pro (Build 26200)',
                    build_windows: '26200',
                    licencia_usuario: 'M365',
                    fecha_asignacion: '21/03/2024',
                    tipo: 'laptop',
                    created_at: '2024-03-21T10:00:00.000Z'
                }
            ];
            return equipos;
        }

    async function saveEquipo(equipo) {
        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const serial = String(equipo.serial || '').trim().toLowerCase();
        const existingIdx = equipos.findIndex(e =>
            (e.id && e.id === equipo.id) ||
            (serial && String(e.serial || '').trim().toLowerCase() === serial)
        );
        const existing = existingIdx !== -1 ? equipos[existingIdx] : null;
        // Conservar el ID al volver a importar el mismo serial.
        equipo.id = existing ? existing.id : (equipo.id || (crypto.randomUUID ? crypto.randomUUID() : ('eq-' + Math.random().toString(36).substr(2, 9))));
        equipo.created_at = (existing && existing.created_at) || equipo.created_at || new Date().toISOString();
        const saved = { ...(existing || {}), ...equipo };
        if (existingIdx !== -1) equipos[existingIdx] = saved;
        else equipos.unshift(saved);
        localStorage.setItem('local_equipos', JSON.stringify(equipos));

        if (!useLocalFallback && supabase) {
            const result = await adaptiveUpsertEquipos([saved]);
            return { equipo: saved, synced: result.success, error: result.error || '' };
        }
        return { equipo: saved, synced: false, error: 'Supabase no está conectado.' };
    }

    async function updateEquipo(id, updatedFields) {
        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const index = equipos.findIndex(e => e.id === id);
        let updatedLocal = null;
        if (index !== -1) {
            equipos[index] = { ...equipos[index], ...updatedFields };
            localStorage.setItem('local_equipos', JSON.stringify(equipos));
            updatedLocal = equipos[index];
        }

        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .update(updatedFields)
                    .eq('id', id)
                    .select();
                if (!error && data && data.length > 0) {
                    return data[0];
                }
            } catch (err) {
                console.warn('Supabase update failed, stored in LocalStorage:', err);
            }
        }
        return updatedLocal;
    }

    async function deleteEquipo(id) {
        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const filtered = equipos.filter(e => e.id !== id);
        localStorage.setItem('local_equipos', JSON.stringify(filtered));

        if (!useLocalFallback && supabase) {
            try {
                await supabase
                    .from('equipos')
                    .delete()
                    .eq('id', id);
            } catch (err) {
                console.warn('Supabase delete failed, updated in LocalStorage:', err);
            }
        }
        return true;
    }

    let allEquiposCached = [];
    let refreshEquiposInFlight = null;
    let currentEquipFilterCompany = 'todas';
    let currentEquipFilterTab = 'todos';
    let currentEquipSearch = '';
    let currentEquipFilterTipo = 'todos';
    let currentEquipFilterMarca = 'todos';
    let currentEquipFilterEstado = 'todos';
    let currentEquipSortBy = 'recent';
    let currentEquipViewMode = 'cards'; // 'cards' | 'table'
    let currentEquipPage = 1;
    let itemsPerEquipPage = 6;

    function formatCleanSpecs(eq) {
        // 1. CPU Limpio
        let cpu = eq.cpu || 'Intel i5';
        cpu = cpu.replace(/Intel\(R\)\s*Core\(TM\)/i, 'Intel')
                 .replace(/\s*CPU\s*@\s*[\d\.]+GHz.*/i, '')
                 .replace(/-\s*[\d\.]+GHz.*/i, '')
                 .replace(/\(.*?\)/g, '')
                 .replace(/\s+/g, ' ')
                 .trim();
        if (!cpu) cpu = 'Intel i5';

        // 2. RAM redondeada a tamaños estándar (8 GB, 16 GB, 32 GB, etc.)
        let ram = eq.ram || '8 GB';
        ram = ram.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
        const ramNumMatch = ram.match(/([\d\.]+)\s*(GB|MB)?/i);
        if (ramNumMatch) {
            let val = parseFloat(ramNumMatch[1]);
            const unit = (ramNumMatch[2] || 'GB').toUpperCase();
            if (unit === 'MB') {
                val = Math.round(val / 1024);
                ram = `${val} GB`;
            } else {
                if (val > 6 && val < 9) ram = '8 GB';
                else if (val > 14 && val < 18) ram = '16 GB';
                else if (val > 28 && val < 35) ram = '32 GB';
                else if (val > 3 && val < 5) ram = '4 GB';
                else if (val > 60 && val < 70) ram = '64 GB';
                else ram = `${Math.round(val)} GB`;
            }
        } else {
            if (!ram.toLowerCase().includes('gb')) ram += ' GB';
        }

        // 3. DISCO: Eliminar "Removable Media", "Fixed hard disk media" y formatear capacidades estándar
        let disco = eq.disco_duro || '256 GB SSD';
        disco = disco.replace(/-\s*Removable\s*Media.*/gi, '')
                     .replace(/-\s*Fixed\s*hard\s*disk.*/gi, '')
                     .replace(/Removable\s*Media.*/gi, '')
                     .replace(/Fixed\s*hard\s*disk.*/gi, '')
                     .replace(/total/gi, '')
                     .replace(/\(.*?\)/g, '')
                     .replace(/\s+/g, ' ')
                     .trim();
        
        const discoNumMatch = disco.match(/([\d\.]+)\s*(GB|TB)?/i);
        let diskType = 'SSD';
        if (/nvme/i.test(eq.disco_duro || '')) diskType = 'NVMe';
        else if (/hdd|mecanico|sata\s*hdd/i.test(eq.disco_duro || '')) diskType = 'HDD';

        if (discoNumMatch) {
            const dVal = parseFloat(discoNumMatch[1]);
            const dUnit = (discoNumMatch[2] || 'GB').toUpperCase();
            if (dUnit === 'TB' || (dVal >= 900 && dVal <= 1100)) {
                disco = `1 TB ${diskType}`;
            } else if (dVal >= 100 && dVal <= 140) {
                disco = `128 GB ${diskType}`;
            } else if (dVal >= 220 && dVal <= 290) {
                disco = `256 GB ${diskType}`;
            } else if (dVal >= 440 && dVal <= 540) {
                disco = `512 GB ${diskType}`;
            } else if (dVal >= 1800 && dVal <= 2200) {
                disco = `2 TB ${diskType}`;
            } else {
                disco = `${Math.round(dVal)} GB ${diskType}`;
            }
        } else {
            if (!disco.toLowerCase().includes('ssd') && !disco.toLowerCase().includes('hdd') && !disco.toLowerCase().includes('nvme')) {
                disco += ` ${diskType}`;
            }
        }

        // 4. Sistema Operativo & Build
        let so = eq.sistema_operativo || 'Windows 11 Pro';
        let build = eq.build_windows || '';
        if (!build) {
            const bMatch = so.match(/build\s*(\d+)/i);
            if (bMatch) build = bMatch[1];
        }
        so = so.replace(/^Microsoft\s+/i, '').replace(/\(Build.*?\)/i, '').replace(/Build\s*\d+/i, '').trim();

        return { cpu, ram, disco, so, build };
    }

    async function refreshEquipos() {
        if (refreshEquiposInFlight) return refreshEquiposInFlight;

        refreshEquiposInFlight = (async () => {
            allEquiposCached = await fetchEquipos();
            updateEquipStats(allEquiposCached);
            applyEquipFilters();
            return allEquiposCached;
        })();

        try {
            return await refreshEquiposInFlight;
        } finally {
            refreshEquiposInFlight = null;
        }
    }

    function updateEquipStats(equipos) {
        const totalEl = document.getElementById('stat-total-equipos');
        const activosEl = document.getElementById('stat-total-activos');
        const mantenimientoEl = document.getElementById('stat-total-mantenimiento');
        const disponiblesEl = document.getElementById('stat-total-disponibles');
        const ingresosKpiEl = document.getElementById('stat-total-ingresos-kpi');
        const bajasKpiEl = document.getElementById('stat-total-bajas-kpi');

        const totalEquipos = allEquiposCached.length;
        const totalActivos = allEquiposCached.filter(e => e.estado === 'activo').length;
        const totalMantenimiento = allEquiposCached.filter(e => e.estado === 'mantenimiento').length;
        const totalDisponibles = allEquiposCached.filter(e => e.estado === 'disponible').length;
        const totalBajas = allEquiposCached.filter(e => e.estado === 'baja').length;
        
        let totalIngresos = 0;
        try {
            const storedIngresos = localStorage.getItem('soporte_ti_ingresos');
            if (storedIngresos) {
                const arr = JSON.parse(storedIngresos);
                totalIngresos = Array.isArray(arr) ? arr.filter(i => i.estado !== 'completado').length : 0;
            }
        } catch(e) {}
        if (totalEl) totalEl.textContent = totalEquipos;
        if (activosEl) activosEl.textContent = totalActivos;
        if (mantenimientoEl) mantenimientoEl.textContent = totalMantenimiento;
        if (disponiblesEl) disponiblesEl.textContent = totalDisponibles;
        if (ingresosKpiEl) ingresosKpiEl.textContent = totalIngresos;
        if (bajasKpiEl) bajasKpiEl.textContent = totalBajas;

        // Actualizar contadores de empresas
        const countTodas = allEquiposCached.length;
        const countTsales = allEquiposCached.filter(e => /t-sales|tsales/i.test(e.empresa || '')).length;
        const countInfinet = allEquiposCached.filter(e => /infinet/i.test(e.empresa || '')).length;
        const countVprime = allEquiposCached.filter(e => /vprime|v\s*prime/i.test(e.empresa || '')).length;

        const badgeTodas = document.getElementById('badge-company-count-todas');
        const badgeTsales = document.getElementById('badge-company-count-tsales');
        const badgeInfinet = document.getElementById('badge-company-count-infinet');
        const badgeVprime = document.getElementById('badge-company-count-vprime');

        if (badgeTodas) badgeTodas.textContent = countTodas;
        if (badgeTsales) badgeTsales.textContent = countTsales;
        if (badgeInfinet) badgeInfinet.textContent = countInfinet;
        if (badgeVprime) badgeVprime.textContent = countVprime;
    }

    function applyEquipFilters() {
        let filtered = [...allEquiposCached];

        // 0. Company filter
        if (currentEquipFilterCompany !== 'todas') {
            filtered = filtered.filter(e => {
                const comp = (e.empresa || '').toLowerCase();
                if (currentEquipFilterCompany === 'T-Sales') return /t-sales|tsales/i.test(comp);
                if (currentEquipFilterCompany === 'Infinet') return /infinet/i.test(comp);
                if (currentEquipFilterCompany === 'VPrime') return /vprime|v\s*prime/i.test(comp);
                return comp.includes(currentEquipFilterCompany.toLowerCase());
            });
        }

        // 1. Tab filter
        if (currentEquipFilterTab !== 'todos') {
            if (currentEquipFilterTab === 'historial') {
                filtered = filtered.filter(e => e.estado === 'baja');
            } else {
                filtered = filtered.filter(e => e.tipo === currentEquipFilterTab);
            }
        }

        // 2. Type select filter
        if (currentEquipFilterTipo !== 'todos') {
            filtered = filtered.filter(e => e.tipo === currentEquipFilterTipo);
        }

        // 3. Brand select filter
        if (currentEquipFilterMarca !== 'todos') {
            filtered = filtered.filter(e => e.marca && e.marca.toLowerCase() === currentEquipFilterMarca.toLowerCase());
        }

        // 4. Status select filter
        if (currentEquipFilterEstado !== 'todos') {
            filtered = filtered.filter(e => e.estado === currentEquipFilterEstado);
        }

        // 5. Text search filter
        if (currentEquipSearch) {
            const query = currentEquipSearch.toLowerCase();
            filtered = filtered.filter(e => 
                (e.nombre_codigo && e.nombre_codigo.toLowerCase().includes(query)) ||
                (e.usuario_nombre && e.usuario_nombre.toLowerCase().includes(query)) ||
                (e.usuario_email && e.usuario_email.toLowerCase().includes(query)) ||
                (e.serial && e.serial.toLowerCase().includes(query)) ||
                (e.modelo && e.modelo.toLowerCase().includes(query)) ||
                (e.marca && e.marca.toLowerCase().includes(query)) ||
                (e.empresa && e.empresa.toLowerCase().includes(query)) ||
                (e.sistema_operativo && e.sistema_operativo.toLowerCase().includes(query))
            );
        }

        // 6. Ordenamiento
        if (currentEquipSortBy === 'user_asc') {
            filtered.sort((a, b) => (a.usuario_nombre || '').localeCompare(b.usuario_nombre || ''));
        } else if (currentEquipSortBy === 'brand_asc') {
            filtered.sort((a, b) => ((a.marca || '') + ' ' + (a.modelo || '')).localeCompare((b.marca || '') + ' ' + (b.modelo || '')));
        } else if (currentEquipSortBy === 'company') {
            filtered.sort((a, b) => (a.empresa || '').localeCompare(b.empresa || ''));
        } else if (currentEquipSortBy === 'serial') {
            filtered.sort((a, b) => (a.serial || '').localeCompare(b.serial || ''));
        } else {
            // recent (default)
            filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        renderEquipViews(filtered);
    }

    function renderEquipViews(filtered) {
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerEquipPage) || 1;
        
        if (currentEquipPage > totalPages) {
            currentEquipPage = totalPages;
        }

        const startIndex = (currentEquipPage - 1) * itemsPerEquipPage;
        const endIndex = Math.min(startIndex + itemsPerEquipPage, totalItems);
        const paginatedItems = filtered.slice(startIndex, endIndex);

        const infoEl = document.getElementById('equip-pagination-info');
        if (infoEl) {
            if (totalItems === 0) {
                infoEl.textContent = 'Mostrando 0 a 0 de 0 equipos';
            } else {
                infoEl.textContent = `Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} equipos`;
            }
        }

        renderEquipPaginationControls(totalPages);
        renderEquipCards(paginatedItems);
        renderEquipTable(paginatedItems);

        // Controlar visibilidad según currentEquipViewMode
        const cardsContainer = document.getElementById('equip-cards-container');
        const tableContainer = document.getElementById('equip-table-container');

        if (cardsContainer && tableContainer) {
            if (currentEquipViewMode === 'cards') {
                cardsContainer.style.display = 'grid';
                tableContainer.style.display = 'none';
            } else {
                cardsContainer.style.display = 'none';
                tableContainer.style.display = 'block';
            }
        }
    }

    function renderEquipCards(paginatedItems) {
        const container = document.getElementById('equip-cards-container');
        if (!container) return;
        container.innerHTML = '';

        if (paginatedItems.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
                    <i class="fas fa-laptop" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
                    No se encontraron equipos registrados con los filtros seleccionados.
                </div>
            `;
            return;
        }

        paginatedItems.forEach(eq => {
            const specs = formatCleanSpecs(eq);
            const stateLabel = getEquipStateLabel(eq.estado);
            const stateClass = getEquipStateClass(eq.estado);
            const emp = eq.empresa || 'T-Sales';
            const empClass = emp === 'Infinet' ? 'badge-infinet' : (emp === 'VPrime' ? 'badge-vprime' : 'badge-tsales');
            
            const isAssigned = eq.usuario_nombre && eq.usuario_nombre.toLowerCase() !== 'sin asignar' && !eq.usuario_nombre.toLowerCase().includes('disponible');
            const initials = isAssigned ? eq.usuario_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : '—';
            
            const card = document.createElement('div');
            card.className = 'equip-card';

            let iconClass = 'fa-laptop';
            if (eq.tipo === 'escritorio') iconClass = 'fa-desktop';
            if (eq.tipo === 'servidor') iconClass = 'fa-server';

            const assignedDateText = isAssigned ? (eq.fecha_asignacion ? `Asignado desde ${eq.fecha_asignacion}` : 'Asignado en uso') : 'Listo para asignar';

            card.innerHTML = `
                <!-- Fila Superior: Código y Estado -->
                <div class="equip-card-top" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div class="equip-card-brand-box" style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                        <div class="equip-card-icon" style="flex-shrink: 0;">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div style="min-width: 0; flex: 1;">
                            <div class="equip-card-code" title="${escapeHtml(eq.nombre_codigo || 'EQUIPO')}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); max-width: 170px;">${escapeHtml(eq.nombre_codigo || 'EQUIPO')}</div>
                            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize; display: block;">${escapeHtml(eq.tipo || 'Laptop')}</span>
                        </div>
                    </div>
                    <span class="status-badge ${stateClass}" style="font-size: 0.72rem; flex-shrink: 0; white-space: nowrap;">${stateLabel}</span>
                </div>

                <!-- Usuario Asignado -->
                <div class="equip-card-user">
                    <div class="equip-card-avatar ${isAssigned ? '' : 'unassigned'}">
                        <span>${initials}</span>
                    </div>
                    <div class="equip-card-user-info">
                        <span class="equip-card-user-name">${escapeHtml(isAssigned ? eq.usuario_nombre : 'Sin asignar')}</span>
                        <span class="equip-card-user-email">${escapeHtml(isAssigned ? (eq.usuario_email || 'Sin correo') : 'Disponible para asignación')}</span>
                    </div>
                    <span class="company-badge ${empClass}" style="font-size: 0.72rem;">${escapeHtml(emp)}</span>
                </div>

                <!-- Marca / Modelo y Serial -->
                <div class="equip-card-device-meta">
                    <div>
                        <div class="equip-card-model">${escapeHtml(eq.marca || 'Dell')}</div>
                        <div class="equip-card-model-sub">${escapeHtml(eq.modelo || 'Latitude')}</div>
                    </div>
                    <div class="equip-card-serial-box">
                        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 2px;">
                            <i class="fab fa-windows" style="color: var(--accent-blue); margin-right: 4px;"></i>${escapeHtml(specs.so)} ${specs.build ? `<span style="color: var(--text-muted); font-size: 0.7rem;">(${specs.build})</span>` : ''}
                        </div>
                        <span class="equip-card-serial">${escapeHtml(eq.serial || 'S/N')}</span>
                    </div>
                </div>

                <!-- Especificaciones Limpias en Pills -->
                <div class="equip-card-specs-row">
                    <div class="equip-spec-pill">
                        <span class="equip-spec-pill-label"><i class="fas fa-microchip" style="margin-right: 2px;"></i> CPU</span>
                        <span class="equip-spec-pill-val" title="${escapeHtml(eq.cpu || '')}">${escapeHtml(specs.cpu)}</span>
                    </div>
                    <div class="equip-spec-pill">
                        <span class="equip-spec-pill-label"><i class="fas fa-memory" style="margin-right: 2px;"></i> RAM</span>
                        <span class="equip-spec-pill-val">${escapeHtml(specs.ram)}</span>
                    </div>
                    <div class="equip-spec-pill">
                        <span class="equip-spec-pill-label"><i class="fas fa-hdd" style="margin-right: 2px;"></i> Disco</span>
                        <span class="equip-spec-pill-val">${escapeHtml(specs.disco)}</span>
                    </div>
                </div>

                <!-- Footer con fecha y acciones -->
                <div class="equip-card-footer">
                    <span><i class="far fa-clock" style="margin-right: 4px;"></i> ${assignedDateText}</span>
                    <div class="ticket-actions" style="gap: 5px;">
                        <button class="action-btn btn-historial-eq" title="Ver Historial y Trazabilidad" data-serial="${escapeHtml(eq.serial)}" style="color: #a78bfa; background: rgba(97, 62, 234, 0.12); border: 1px solid rgba(97, 62, 234, 0.25); border-radius: 7px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;"><i class="fas fa-history"></i></button>
                        <button class="action-btn action-view btn-view-eq" title="Ver detalle" data-id="${eq.id}" style="border-radius: 7px; width: 30px; height: 30px;"><i class="fas fa-eye"></i></button>
                        <button class="action-btn action-edit btn-edit-eq" title="Editar equipo" data-id="${eq.id}" style="color: var(--text-secondary); background: transparent; border: 1px solid var(--border-color); border-radius: 7px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn action-more btn-more-eq" title="Eliminar equipo" data-id="${eq.id}" style="border-radius: 7px; width: 30px; height: 30px;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-historial-eq').addEventListener('click', () => openSerialHistoryModal(eq.serial));
            card.querySelector('.btn-view-eq').addEventListener('click', () => openEquipDetailModal(eq));
            card.querySelector('.btn-edit-eq').addEventListener('click', () => openEquipFormModal(eq));
            card.querySelector('.btn-more-eq').addEventListener('click', () => {
                const action = confirm(`¿Deseas eliminar el registro del equipo ${eq.nombre_codigo}?`);
                if (action) deleteAndRefresh(eq.id);
            });

            container.appendChild(card);
        });
    }

    function renderEquipTable(paginatedItems) {
        const tbody = document.getElementById('equip-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (paginatedItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-laptop" style="font-size: 2rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                        No se encontraron equipos registrados.
                    </td>
                </tr>
            `;
            return;
        }

        paginatedItems.forEach(eq => {
            const tr = document.createElement('tr');
            const specs = formatCleanSpecs(eq);
            const stateLabel = getEquipStateLabel(eq.estado);
            const stateClass = getEquipStateClass(eq.estado);
            const emp = eq.empresa || 'T-Sales';
            const empClass = emp === 'Infinet' ? 'badge-infinet' : (emp === 'VPrime' ? 'badge-vprime' : 'badge-tsales');
            
            let iconClass = 'fa-laptop';
            if (eq.tipo === 'escritorio') iconClass = 'fa-desktop';
            if (eq.tipo === 'servidor') iconClass = 'fa-server';

            const isAssigned = eq.usuario_nombre && eq.usuario_nombre.toLowerCase() !== 'sin asignar' && !eq.usuario_nombre.toLowerCase().includes('disponible');
            const initials = isAssigned ? eq.usuario_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : '—';
            const assignedSubtext = isAssigned ? (eq.fecha_asignacion ? `En uso desde ${eq.fecha_asignacion}` : 'En uso activo') : 'Listo para asignar';

            tr.innerHTML = `
                <td>
                    <div class="equip-info-cell">
                        <div class="equip-thumbnail">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="equip-meta-info" style="display: flex; flex-direction: column;">
                            <span class="equip-code">${escapeHtml(eq.nombre_codigo)}</span>
                            <span class="equip-type-label">${escapeHtml(eq.tipo || 'Laptop')}</span>
                            <span class="company-badge ${empClass}" style="width: fit-content; margin-top: 4px; font-size: 0.7rem;">${escapeHtml(emp)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="equip-user-cell">
                        <div class="equip-user-avatar" style="${isAssigned ? '' : 'background: rgba(255,255,255,0.08); color: var(--text-muted);'}">
                            <span>${initials}</span>
                        </div>
                        <div class="equip-user-info">
                            <span class="equip-user-name">${escapeHtml(isAssigned ? eq.usuario_nombre : 'Sin Asignar')}</span>
                            <span class="equip-user-email">${escapeHtml(isAssigned ? (eq.usuario_email || 'Sin correo') : 'Disponible para asignación')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="equip-text-primary">${escapeHtml(eq.marca || 'Dell')}</div>
                    <div class="equip-text-secondary">${escapeHtml(eq.modelo || 'Latitude')}</div>
                </td>
                <td>
                    <div class="equip-so-info">
                        <i class="fab fa-windows equip-so-icon"></i>
                        <span class="equip-text-primary">${escapeHtml(specs.so)} ${specs.build ? `<small style="color: var(--text-muted);">(${specs.build})</small>` : ''}</span>
                    </div>
                    <div class="equip-text-secondary" style="font-family: monospace; font-weight: 700; color: var(--accent-blue);">${escapeHtml(eq.serial)}</div>
                </td>
                <td>
                    <div class="equip-spec-item"><strong>CPU:</strong> ${escapeHtml(specs.cpu)}</div>
                    <div class="equip-spec-item"><strong>RAM:</strong> ${escapeHtml(specs.ram)}</div>
                    <div class="equip-spec-item"><strong>Disco:</strong> ${escapeHtml(specs.disco)}</div>
                    <div class="equip-spec-item"><strong>Licencia:</strong> ${escapeHtml(eq.licencia_usuario || 'M365')}</div>
                </td>
                <td>
                    <span class="status-badge ${stateClass}">${stateLabel}</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">${assignedSubtext}</div>
                </td>
                <td style="text-align: right; padding-right: 24px;">
                    <div class="ticket-actions" style="justify-content: flex-end; gap: 6px;">
                        <button class="action-btn btn-historial-eq" title="Ver Historial y Trazabilidad" data-serial="${escapeHtml(eq.serial)}" style="color: #a78bfa; background: rgba(97, 62, 234, 0.12); border: 1px solid rgba(97, 62, 234, 0.25); border-radius: 8px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;"><i class="fas fa-history"></i></button>
                        <button class="action-btn action-view btn-view-eq" title="Ver detalle del equipo" data-id="${eq.id}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn action-edit btn-edit-eq" title="Editar equipo" data-id="${eq.id}" style="color: var(--text-secondary); background: transparent; border: 1px solid var(--border-color); border-radius: 8px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn action-more btn-more-eq" title="Eliminar equipo" data-id="${eq.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;

            tr.querySelector('.btn-historial-eq').addEventListener('click', () => openSerialHistoryModal(eq.serial));
            tr.querySelector('.btn-view-eq').addEventListener('click', () => openEquipDetailModal(eq));
            tr.querySelector('.btn-edit-eq').addEventListener('click', () => openEquipFormModal(eq));
            tr.querySelector('.btn-more-eq').addEventListener('click', () => {
                const action = confirm(`¿Deseas eliminar el registro del equipo ${eq.nombre_codigo}?`);
                if (action) deleteAndRefresh(eq.id);
            });

            tbody.appendChild(tr);
        });
    }

    async function deleteAndRefresh(id) {
        await deleteEquipo(id);
        await refreshEquipos();
    }

    function renderEquipPaginationControls(totalPages) {
        const container = document.getElementById('equip-pagination-controls');
        if (!container) return;

        container.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn page-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentEquipPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentEquipPage > 1) {
                currentEquipPage--;
                applyEquipFilters();
            }
        });
        container.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn page-number ${i === currentEquipPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentEquipPage = i;
                applyEquipFilters();
            });
            container.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn page-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentEquipPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentEquipPage < totalPages) {
                currentEquipPage++;
                applyEquipFilters();
            }
        });
        container.appendChild(nextBtn);
    }

    const formModal = document.getElementById('equipo-form-modal');
    const detailModal = document.getElementById('equipo-detail-modal');
    const btnAgregarEquipo = document.getElementById('btn-agregar-equipo');
    
    const formCloseBtn = document.getElementById('equipo-form-close-btn');
    const formCancelBtn = document.getElementById('equip-form-cancel-btn');
    const detailCloseBtn = document.getElementById('equipo-detail-close-btn');
    const detailCerrarBtn = document.getElementById('btn-cerrar-detalle-equipo');

    const btnEditarEquipo = document.getElementById('btn-editar-equipo');
    const btnEliminarEquipo = document.getElementById('btn-eliminar-equipo');

    let activeEquip = null;

    function openEquipFormModal(eq = null) {
        if (detailModal) detailModal.style.display = 'none';

        if (formModal) {
            const form = document.getElementById('equipo-crud-form');
            if (form) form.reset();

            const modeLabel = document.getElementById('equipo-form-mode');
            const titleLabel = document.getElementById('equipo-form-title');
            const idField = document.getElementById('equipo-id-field');

            if (eq) {
                if (modeLabel) modeLabel.textContent = 'EDITAR REGISTRO';
                if (titleLabel) titleLabel.textContent = 'Editar Equipo';
                if (idField) idField.value = eq.id;

                document.getElementById('equip-form-codigo').value = eq.nombre_codigo || '';
                document.getElementById('equip-form-tipo').value = eq.tipo || 'laptop';
                document.getElementById('equip-form-estado').value = eq.estado || 'activo';
                document.getElementById('equip-form-usuario-nombre').value = eq.usuario_nombre || '';
                document.getElementById('equip-form-usuario-email').value = eq.usuario_email || '';
                document.getElementById('equip-form-marca').value = eq.marca || '';
                document.getElementById('equip-form-modelo').value = eq.modelo || '';
                document.getElementById('equip-form-so').value = eq.sistema_operativo || '';
                document.getElementById('equip-form-serial').value = eq.serial || '';
                document.getElementById('equip-form-ram').value = eq.ram || '';
                document.getElementById('equip-form-disco').value = eq.disco_duro || '';
                document.getElementById('equip-form-empresa').value = eq.empresa || '';
                document.getElementById('equip-form-cpu').value = eq.cpu || '';
                document.getElementById('equip-form-licencia').value = eq.licencia_usuario || '';
            } else {
                if (modeLabel) modeLabel.textContent = 'NUEVO REGISTRO';
                if (titleLabel) titleLabel.textContent = 'Agregar Nuevo Equipo';
                if (idField) idField.value = '';
                document.getElementById('equip-form-empresa').value = '';
                document.getElementById('equip-form-cpu').value = '';
                document.getElementById('equip-form-licencia').value = '';
            }

            formModal.style.display = 'flex';
        }
    }

    function openEquipDetailModal(eq) {
        activeEquip = eq;
        if (detailModal) {
            document.getElementById('modal-equip-type').textContent = `${(eq.tipo || 'equipo').toUpperCase()} / ${(eq.estado || 'sin estado').toUpperCase()}`;
            document.getElementById('modal-equip-codigo').textContent = eq.nombre_codigo || eq.hostname || eq.codigo || 'Equipo sin nombre';
            
            document.getElementById('modal-equip-user-nombre').textContent = eq.usuario_nombre;
            document.getElementById('modal-equip-user-email').textContent = eq.usuario_email || 'S/A';
            
            const initials = eq.usuario_nombre ? eq.usuario_nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
            const avatarSpan = document.querySelector('#modal-equip-user-avatar span');
            if (avatarSpan) avatarSpan.textContent = initials;

            document.getElementById('modal-equip-marca').textContent = eq.marca;
            document.getElementById('modal-equip-modelo').textContent = eq.modelo;
            document.getElementById('modal-equip-so').textContent = eq.sistema_operativo;
            document.getElementById('modal-equip-serial').textContent = eq.serial;
            document.getElementById('modal-equip-ram').textContent = eq.ram;
            document.getElementById('modal-equip-disco').textContent = eq.disco_duro;
            document.getElementById('modal-equip-empresa').textContent = eq.empresa || '-';
            document.getElementById('modal-equip-cpu').textContent = eq.cpu || '-';
            document.getElementById('modal-equip-licencia').textContent = eq.licencia_usuario || '-';

            const allDataContainer = document.getElementById('modal-equip-all-data');
            const fieldsCount = document.getElementById('modal-equip-fields-count');
            if (allDataContainer) {
                const fieldLabels = {
                    id: 'ID del registro', nombre_codigo: 'Código / nombre', hostname: 'Hostname', codigo: 'Código',
                    tipo: 'Tipo de equipo', estado: 'Estado', usuario_nombre: 'Usuario asignado',
                    usuario_email: 'Correo del usuario', usuario_rut: 'RUT del usuario', empresa: 'Empresa',
                    marca: 'Marca', modelo: 'Modelo', serial: 'Número de serie', cpu: 'Procesador',
                    ram: 'Memoria RAM', disco_duro: 'Almacenamiento', sistema_operativo: 'Sistema operativo',
                    build_windows: 'Build de Windows', licencia_usuario: 'Licencia', fecha_asignacion: 'Fecha de asignación',
                    ip: 'Dirección IP', direccion_ip: 'Dirección IP', mac: 'Dirección MAC', created_at: 'Fecha de registro',
                    updated_at: 'Última actualización'
                };
                const entries = Object.entries(eq).filter(([key, value]) => {
                    const keyLower = key.toLowerCase();
                    if (['password', 'contraseña', 'secret', 'token'].some(term => keyLower.includes(term))) return false;
                    return value !== undefined && value !== null && String(value).trim() !== '';
                });
                allDataContainer.innerHTML = entries.map(([key, value]) => {
                    const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                    let displayValue = value;
                    if (typeof value === 'object') {
                        try { displayValue = JSON.stringify(value); } catch (e) { displayValue = String(value); }
                    }
                    if ((key === 'created_at' || key === 'updated_at') && value) {
                        const date = new Date(value);
                        if (!isNaN(date)) displayValue = date.toLocaleString('es-CL');
                    }
                    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(displayValue)}</dd></div>`;
                }).join('');
                if (fieldsCount) fieldsCount.textContent = `${entries.length} campo${entries.length === 1 ? '' : 's'}`;
            }

            detailModal.style.display = 'flex';
        }
    }

    if (formCloseBtn) formCloseBtn.addEventListener('click', () => formModal.style.display = 'none');
    if (formCancelBtn) formCancelBtn.addEventListener('click', () => formModal.style.display = 'none');
    if (detailCloseBtn) detailCloseBtn.addEventListener('click', () => detailModal.style.display = 'none');
    if (detailCerrarBtn) detailCerrarBtn.addEventListener('click', () => detailModal.style.display = 'none');

    if (btnEditarEquipo) {
        btnEditarEquipo.addEventListener('click', () => {
            if (activeEquip) {
                openEquipFormModal(activeEquip);
            }
        });
    }

    if (btnEliminarEquipo) {
        btnEliminarEquipo.addEventListener('click', async () => {
            if (activeEquip && confirm(`¿Deseas eliminar permanentemente el registro de ${activeEquip.nombre_codigo}?`)) {
                await deleteEquipo(activeEquip.id);
                if (detailModal) detailModal.style.display = 'none';
                await refreshEquipos();
            }
        });
    }

    if (btnAgregarEquipo) {
        btnAgregarEquipo.addEventListener('click', () => openEquipFormModal());
    }

    function resetEquipInventoryView() {
        currentEquipFilterCompany = 'todas';
        currentEquipFilterTab = 'todos';
        currentEquipSearch = '';
        currentEquipFilterTipo = 'todos';
        currentEquipFilterMarca = 'todos';
        currentEquipFilterEstado = 'todos';
        currentEquipSortBy = 'recent';
        currentEquipPage = 1;
        const search = document.getElementById('equip-search-input');
        if (search) search.value = '';
        ['equip-filter-tipo', 'equip-filter-marca', 'equip-filter-estado'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.value = 'todos';
        });
        const sort = document.getElementById('equip-sort-by');
        if (sort) sort.value = 'recent';
        document.querySelectorAll('#equip-filter-tabs .filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'todos');
        });
        document.querySelectorAll('#equip-company-tabs .filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.company === 'todas');
        });
    }

    const crudForm = document.getElementById('equipo-crud-form');
    if (crudForm) {
        crudForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('equip-form-submit-btn');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const id = document.getElementById('equipo-id-field').value;

            const eqData = {
                nombre_codigo: document.getElementById('equip-form-codigo').value.trim(),
                tipo: document.getElementById('equip-form-tipo').value,
                estado: document.getElementById('equip-form-estado').value,
                usuario_nombre: document.getElementById('equip-form-usuario-nombre').value.trim(),
                usuario_email: document.getElementById('equip-form-usuario-email').value.trim(),
                marca: document.getElementById('equip-form-marca').value.trim(),
                modelo: document.getElementById('equip-form-modelo').value.trim(),
                sistema_operativo: document.getElementById('equip-form-so').value.trim(),
                serial: document.getElementById('equip-form-serial').value.trim(),
                ram: document.getElementById('equip-form-ram').value.trim(),
                disco_duro: document.getElementById('equip-form-disco').value.trim(),
                empresa: document.getElementById('equip-form-empresa').value,
                cpu: document.getElementById('equip-form-cpu').value.trim(),
                licencia_usuario: document.getElementById('equip-form-licencia').value.trim()
            };

            try {
                if (id) {
                    await updateEquipo(id, eqData);
                    alert('¡Equipo actualizado con éxito!');
                } else {
                    const result = await saveEquipo(eqData);
                    resetEquipInventoryView();
                    if (result.synced) {
                        alert('✅ Equipo registrado en el inventario y sincronizado con Supabase.');
                    } else {
                        alert('⚠️ El equipo se guardó solo en este navegador.\n\nNo se pudo sincronizar con Supabase: ' + result.error + '\n\nPuedes reintentar con «Sincronizar a Supabase» desde el inventario.');
                    }
                }

                if (formModal) formModal.style.display = 'none';
                if (refreshEquiposInFlight) await refreshEquiposInFlight;
                await refreshEquipos();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error al guardar la información: ' + (err.message || String(err)));
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    const equipSearchInput = document.getElementById('equip-search-input');
    if (equipSearchInput) {
        equipSearchInput.addEventListener('input', () => {
            currentEquipSearch = equipSearchInput.value.trim();
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    const filterTipoSelect = document.getElementById('equip-filter-tipo');
    if (filterTipoSelect) {
        filterTipoSelect.addEventListener('change', () => {
            currentEquipFilterTipo = filterTipoSelect.value;
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    const filterMarcaSelect = document.getElementById('equip-filter-marca');
    if (filterMarcaSelect) {
        filterMarcaSelect.addEventListener('change', () => {
            currentEquipFilterMarca = filterMarcaSelect.value;
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    const filterEstadoSelect = document.getElementById('equip-filter-estado');
    if (filterEstadoSelect) {
        filterEstadoSelect.addEventListener('change', () => {
            currentEquipFilterEstado = filterEstadoSelect.value;
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    // Tabs de Categoría (Todos, Escritorios, Portátiles, Servidores, Historial)
    const equipFilterTabs = document.querySelectorAll('#equip-filter-tabs .filter-tab');
    equipFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            equipFilterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEquipFilterTab = tab.getAttribute('data-filter') || 'todos';
            currentEquipPage = 1;
            applyEquipFilters();
        });
    });

    // Tabs de Empresa (Todas, T-Sales, Infinet, VPrime)
    const equipCompanyTabs = document.querySelectorAll('#equip-company-tabs .filter-tab');
    equipCompanyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            equipCompanyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEquipFilterCompany = tab.getAttribute('data-company') || 'todas';
            currentEquipPage = 1;
            applyEquipFilters();
        });
    });

    // Switch de Vistas: Tarjetas vs Tabla
    const btnViewCards = document.getElementById('btn-view-cards');
    const btnViewTable = document.getElementById('btn-view-table');

    if (btnViewCards && btnViewTable) {
        btnViewCards.addEventListener('click', () => {
            currentEquipViewMode = 'cards';
            btnViewCards.classList.add('active');
            btnViewCards.style.background = 'var(--accent-blue)';
            btnViewCards.style.color = 'white';
            btnViewTable.classList.remove('active');
            btnViewTable.style.background = 'transparent';
            btnViewTable.style.color = 'var(--text-secondary)';
            applyEquipFilters();
        });

        btnViewTable.addEventListener('click', () => {
            currentEquipViewMode = 'table';
            btnViewTable.classList.add('active');
            btnViewTable.style.background = 'var(--accent-blue)';
            btnViewTable.style.color = 'white';
            btnViewCards.classList.remove('active');
            btnViewCards.style.background = 'transparent';
            btnViewCards.style.color = 'var(--text-secondary)';
            applyEquipFilters();
        });
    }

    // Selector de Ordenamiento
    const equipSortSelect = document.getElementById('equip-sort-by');
    if (equipSortSelect) {
        equipSortSelect.addEventListener('change', () => {
            currentEquipSortBy = equipSortSelect.value;
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    // Selector de Tamaño de Página
    const equipPageSizeSelect = document.getElementById('equip-page-size');
    if (equipPageSizeSelect) {
        equipPageSizeSelect.addEventListener('change', () => {
            itemsPerEquipPage = parseInt(equipPageSizeSelect.value, 10) || 6;
            currentEquipPage = 1;
            applyEquipFilters();
        });
    }

    // ============================================
    // MÓDULO IMPORTADOR DE EQUIPOS (EXCEL / CSV / PEGAR)
    // ============================================
    const btnImportarEquipos = document.getElementById('btn-importar-equipos');
    const equipFileInput = document.getElementById('equip-file-input');
    const previewModal = document.getElementById('equipo-import-preview-modal');
    const previewTbody = document.getElementById('import-preview-table-body');
    const previewCloseBtn = document.getElementById('equipo-import-close-btn');
    const previewCancelBtn = document.getElementById('btn-import-cancel');
    const previewConfirmBtn = document.getElementById('btn-import-confirm');
    const importDropzone = document.getElementById('import-dropzone');
    const tabImportFile = document.getElementById('tab-import-btn-file');
    const tabImportPaste = document.getElementById('tab-import-btn-paste');
    const panelImportFile = document.getElementById('import-panel-file');
    const panelImportPaste = document.getElementById('import-panel-paste');
    const pasteTextarea = document.getElementById('import-paste-textarea');
    const btnParsePastedData = document.getElementById('btn-parse-pasted-data');
    
    let parsedEquipos = [];

    // Abrir Modal
    if (btnImportarEquipos && previewModal) {
        btnImportarEquipos.addEventListener('click', () => {
            parsedEquipos = [];
            if (previewTbody) previewTbody.innerHTML = '';
            if (pasteTextarea) pasteTextarea.value = '';
            const previewSec = document.getElementById('import-preview-section');
            if (previewSec) previewSec.style.display = 'none';
            if (previewConfirmBtn) {
                previewConfirmBtn.disabled = true;
                previewConfirmBtn.style.opacity = '0.6';
            }
            if (tabImportFile) tabImportFile.click();
            previewModal.style.display = 'flex';
        });
    }

    // Tabs del Modal (Subir Archivo vs Pegar)
    if (tabImportFile && tabImportPaste && panelImportFile && panelImportPaste) {
        tabImportFile.addEventListener('click', () => {
            tabImportFile.classList.add('active');
            tabImportPaste.classList.remove('active');
            panelImportFile.style.display = 'block';
            panelImportPaste.style.display = 'none';
        });

        tabImportPaste.addEventListener('click', () => {
            tabImportPaste.classList.add('active');
            tabImportFile.classList.remove('active');
            panelImportPaste.style.display = 'flex';
            panelImportFile.style.display = 'none';
            if (pasteTextarea) pasteTextarea.focus();
        });
    }

    // Dropzone / File Picker
    if (importDropzone && equipFileInput) {
        importDropzone.addEventListener('click', () => {
            equipFileInput.value = '';
            equipFileInput.click();
        });

        importDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            importDropzone.style.borderColor = 'var(--accent-blue)';
            importDropzone.style.background = 'rgba(59, 130, 246, 0.1)';
        });

        importDropzone.addEventListener('dragleave', () => {
            importDropzone.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            importDropzone.style.background = 'rgba(59, 130, 246, 0.04)';
        });

        importDropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            importDropzone.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            importDropzone.style.background = 'rgba(59, 130, 246, 0.04)';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                await processImportFile(e.dataTransfer.files[0]);
            }
        });

        equipFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await processImportFile(file);
        });
    }

    async function processImportFile(file) {
        try {
            const extension = file.name.split('.').pop().toLowerCase();
            if (['xlsx', 'xls', 'csv'].includes(extension)) {
                parsedEquipos = await readExcelFile(file);
            } else if (extension === 'pdf') {
                parsedEquipos = await readPDFFile(file);
            } else {
                alert('Formato de archivo no soportado. Sube un archivo .xlsx, .xls o .csv');
                return;
            }

            if (parsedEquipos.length === 0) {
                alert('No se pudieron interpretar equipos válidos desde el archivo. Revisa los encabezados o el contenido.');
            } else {
                renderImportPreview(parsedEquipos);
            }
        } catch (err) {
            console.error('Error al parsear el archivo:', err);
            alert('Ocurrió un error al procesar el archivo: ' + err.message);
        }
    }

    // Función procesar texto pegado
    function triggerParsePastedText() {
        if (!pasteTextarea) return;
        const text = pasteTextarea.value;
        if (!text.trim()) {
            parsedEquipos = [];
            renderImportPreview([]);
            return;
        }
        parsedEquipos = parsePastedExcelText(text);
        if (parsedEquipos.length > 0) {
            renderImportPreview(parsedEquipos);
            const previewSec = document.getElementById('import-preview-section');
            if (previewSec) {
                previewSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            renderImportPreview([]);
        }
    }

    if (pasteTextarea) {
        pasteTextarea.addEventListener('paste', () => {
            setTimeout(triggerParsePastedText, 100);
        });
        pasteTextarea.addEventListener('input', () => {
            if (pasteTextarea.value.trim().length > 20) {
                triggerParsePastedText();
            }
        });
    }

    // Botón Procesar Texto Pegado
    if (btnParsePastedData && pasteTextarea) {
        btnParsePastedData.addEventListener('click', () => {
            const text = pasteTextarea.value;
            if (!text.trim()) {
                alert('⚠️ Por favor primero abre tu Excel, copia las celdas (Ctrl + C) y pégalas en este recuadro (Ctrl + V).');
                return;
            }
            parsedEquipos = parsePastedExcelText(text);
            if (parsedEquipos.length === 0) {
                alert('⚠️ No se pudieron interpretar filas válidas del texto pegado.\n\nAsegúrate de copiar directamente las celdas desde tu archivo Excel.');
            } else {
                renderImportPreview(parsedEquipos);
                alert(`✅ ¡Se detectaron ${parsedEquipos.length} equipos en el texto pegado!\n\nRevisa la tabla abajo y haz clic en "Confirmar Importación" para guardarlos.`);
            }
        });
    }

    if (previewCloseBtn) previewCloseBtn.addEventListener('click', () => previewModal.style.display = 'none');
    if (previewCancelBtn) previewCancelBtn.addEventListener('click', () => previewModal.style.display = 'none');

    function cleanEquipoForSupabase(eq) {
        return {
            id: String(eq.id || (crypto.randomUUID ? crypto.randomUUID() : ('eq-' + Math.random().toString(36).substr(2, 9)))),
            nombre_codigo: String(eq.nombre_codigo || 'EQUIPO'),
            usuario_nombre: String(eq.usuario_nombre || 'Sin Asignar'),
            usuario_rut: String(eq.usuario_rut || ''),
            usuario_email: String(eq.usuario_email || ''),
            empresa: String(eq.empresa || 'T-Sales'),
            estado: String(eq.estado || 'activo'),
            serial: String(eq.serial || ''),
            marca: String(eq.marca || 'Dell'),
            modelo: String(eq.modelo || ''),
            cpu: String(eq.cpu || ''),
            ram: String(eq.ram || ''),
            disco_duro: String(eq.disco_duro || ''),
            sistema_operativo: String(eq.sistema_operativo || ''),
            build_windows: String(eq.build_windows || ''),
            licencia_usuario: String(eq.licencia_usuario || 'M365'),
            fecha_asignacion: eq.fecha_asignacion ? String(eq.fecha_asignacion) : null,
            tipo: String(eq.tipo || 'laptop'),
            direccion: String(eq.direccion || ''),
            usuario_windows: String(eq.usuario_windows || ''),
            dominio: String(eq.dominio || ''),
            ip: String(eq.ip || ''),
            mac: String(eq.mac || ''),
            arquitectura: String(eq.arquitectura || '64 bits'),
            created_at: eq.created_at || new Date().toISOString()
        };
    }

    async function adaptiveUpsertEquipos(records) {
        if (!supabase || !records || records.length === 0) return { success: false, error: 'Supabase no está disponible' };

        let payload = records.map(cleanEquipoForSupabase);
        const chunkSize = 25;
        // Una oportunidad por columna y una final para guardar el esquema adaptado.
        const maxAttempts = Object.keys(payload[0]).length + 1;
        let lastError = 'No se pudo completar la sincronización de equipos';

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                for (let i = 0; i < payload.length; i += chunkSize) {
                    const chunk = payload.slice(i, i + chunkSize);
                    const { error } = await supabase
                        .from('equipos')
                        .upsert(chunk, { onConflict: 'id' });
                    
                    if (error) {
                        const errMsg = error.message || JSON.stringify(error);
                        lastError = errMsg;
                        const match = errMsg.match(/Could not find the '([^']+)' column/i);
                        if (match && match[1] && match[1] !== 'id' && payload.some(item => Object.hasOwn(item, match[1]))) {
                            const missingCol = match[1];
                            console.warn(`Columna '${missingCol}' no existe en Supabase. Omitiendo y reintentando automáticamente...`);
                            payload.forEach(item => {
                                delete item[missingCol];
                            });
                            throw { retry: true, missingCol };
                        } else {
                            throw error;
                        }
                    }
                }
                return { success: true, count: payload.length };
            } catch (err) {
                if (err && err.retry) {
                    continue;
                }
                return { success: false, error: err.message || JSON.stringify(err) };
            }
        }
        return { success: false, error: lastError };
    }

    // Confirmar Importación e Insertar al Inventario
    if (previewConfirmBtn) {
        previewConfirmBtn.addEventListener('click', async () => {
            if (!parsedEquipos || parsedEquipos.length === 0) {
                alert('⚠️ No hay equipos listos para importar.\n\nPor favor selecciona un archivo Excel (.xlsx) o pega las filas de tu planilla en el recuadro de texto.');
                return;
            }

            previewConfirmBtn.disabled = true;
            previewConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando Equipos...';

            try {
                let localList = JSON.parse(localStorage.getItem('local_equipos')) || [];
                
                // Preparar equipos con IDs únicos y fechas
                const readyEquipos = parsedEquipos.map((eq, idx) => {
                    const existing = localList.find(e =>
                        (eq.id && e.id === eq.id) ||
                        (eq.serial && e.serial && String(e.serial).trim().toLowerCase() === String(eq.serial).trim().toLowerCase())
                    );
                    const id = (existing && existing.id) || eq.id || (crypto.randomUUID ? crypto.randomUUID() : `eq-imp-${Date.now()}-${idx}`);
                    return cleanEquipoForSupabase({
                        ...eq,
                        id,
                        created_at: (existing && existing.created_at) || eq.created_at || new Date().toISOString()
                    });
                });

                // Merge con localList evitando duplicados por serial o ID
                readyEquipos.forEach(newEq => {
                    const idx = localList.findIndex(e => 
                        (e.serial && newEq.serial && e.serial.trim().toLowerCase() === newEq.serial.trim().toLowerCase()) ||
                        (e.id && e.id === newEq.id)
                    );
                    if (idx !== -1) {
                        localList[idx] = { ...localList[idx], ...newEq };
                    } else {
                        localList.unshift(newEq);
                    }
                });

                // Guardar en LocalStorage de forma inmediata y persistente
                localStorage.setItem('local_equipos', JSON.stringify(localList));

                // Guardar en Supabase con auto-adaptabilidad
                let supabaseSaved = false;
                let supabaseErrDetails = '';
                if (!useLocalFallback && supabase) {
                    const syncRes = await adaptiveUpsertEquipos(readyEquipos);
                    if (syncRes.success) {
                        supabaseSaved = true;
                    } else {
                        supabaseErrDetails = syncRes.error;
                    }
                }

                alert((supabaseSaved ? `✅ Se importaron ${readyEquipos.length} equipos y se sincronizaron con Supabase.\n\n` : `⚠️ Se guardaron ${readyEquipos.length} equipos solo en este navegador.\n\n`) + 
                      `✅ Guardados en tu Inventario CMDB.\n` + 
                      (supabaseSaved ? `☁️ Sincronizados con la nube de Supabase (visibles para todo tu equipo).` : (supabaseErrDetails ? `⚠️ Nota: Guardado local OK, pendiente en Supabase (${supabaseErrDetails}).` : '')));
                
                if (previewModal) previewModal.style.display = 'none';
                resetEquipInventoryView();
                if (refreshEquiposInFlight) await refreshEquiposInFlight;
                await refreshEquipos();
            } catch (err) {
                console.error('Error al guardar equipos:', err);
                alert('Ocurrió un error al guardar los equipos importados: ' + err.message);
            } finally {
                previewConfirmBtn.disabled = false;
                previewConfirmBtn.innerHTML = 'Confirmar Importación';
            }
        });
    }

    // ============================================
    // BOTÓN: SINCRONIZAR TODO A SUPABASE
    // ============================================
    const btnSyncSupabaseEquipos = document.getElementById('btn-sync-supabase-equipos');
    if (btnSyncSupabaseEquipos) {
        btnSyncSupabaseEquipos.addEventListener('click', async () => {
            const originalHtml = btnSyncSupabaseEquipos.innerHTML;
            btnSyncSupabaseEquipos.disabled = true;
            btnSyncSupabaseEquipos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando con Supabase...';

            try {
                if (!supabase) {
                    alert('⚠️ Supabase no está conectado actualmente. Por favor verifica las credenciales de Supabase.');
                    return;
                }

                // 1. Obtener lista local de equipos
                const localEquipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
                if (localEquipos.length === 0) {
                    alert('No tienes equipos en la memoria local para sincronizar.');
                    return;
                }

                btnSyncSupabaseEquipos.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Subiendo ${localEquipos.length} equipos...`;

                // 2. Subir con auto-adaptabilidad
                const syncRes = await adaptiveUpsertEquipos(localEquipos);

                if (syncRes.success) {
                    alert(`🎉 ¡Sincronización Exitosa!\n\nSe subieron ${syncRes.count} equipos a la nube de Supabase.\nAhora cualquier miembro de tu equipo que abra la plataforma en su PC verá los ${syncRes.count} equipos de inmediato.`);
                    await refreshEquipos();
                } else {
                    throw new Error(syncRes.error);
                }
            } catch (err) {
                console.error('Error durante la sincronización a Supabase:', err);
                alert(`❌ Ocurrió un error al subir a Supabase: ${err.message || err}\n\nRevisa la consola del navegador para más detalles.`);
            } finally {
                btnSyncSupabaseEquipos.disabled = false;
                btnSyncSupabaseEquipos.innerHTML = originalHtml;
            }
        });
    }

    // ============================================
    // BOTÓN: EXPORTAR BACKUP JSON DE EQUIPOS
    // ============================================
    const btnExportJsonEquipos = document.getElementById('btn-export-json-equipos');
    if (btnExportJsonEquipos) {
        btnExportJsonEquipos.addEventListener('click', () => {
            const localEquipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
            if (localEquipos.length === 0) {
                alert('No hay equipos registrados para exportar.');
                return;
            }

            const dataStr = JSON.stringify(localEquipos, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_equipos_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(dataStr).then(() => {
                    alert(`✅ ¡Backup generado!\n- Se descargó el archivo JSON con los ${localEquipos.length} equipos.\n- Los datos también se copiaron a tu portapapeles.`);
                }).catch(() => {
                    alert(`✅ Se descargó el archivo JSON con los ${localEquipos.length} equipos.`);
                });
            } else {
                alert(`✅ Se descargó el archivo JSON con los ${localEquipos.length} equipos.`);
            }
        });
    }

    // ============================================
    // IMPORTADOR DE NOTEBOOKS DESDE ARCHIVO TXT
    // ============================================
    const btnImportarTxt = document.getElementById('btn-importar-txt');
    const equipTxtFileInput = document.getElementById('equip-txt-file-input');

    if (btnImportarTxt && equipTxtFileInput) {
        btnImportarTxt.addEventListener('click', () => {
            equipTxtFileInput.value = ''; // Reset
            equipTxtFileInput.click();
        });

        equipTxtFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const parsed = parseTXTInventory(text);

                    // Abrir modal de nuevo registro
                    openEquipFormModal();

                    // Rellenar formulario modal con los datos leídos
                    if (document.getElementById('equip-form-codigo')) document.getElementById('equip-form-codigo').value = parsed.codigo || '';
                    if (document.getElementById('equip-form-marca')) document.getElementById('equip-form-marca').value = parsed.marca || '';
                    if (document.getElementById('equip-form-modelo')) document.getElementById('equip-form-modelo').value = parsed.modelo || '';
                    if (document.getElementById('equip-form-so')) document.getElementById('equip-form-so').value = parsed.so || '';
                    if (document.getElementById('equip-form-ram')) document.getElementById('equip-form-ram').value = parsed.ram || '';
                    if (document.getElementById('equip-form-serial')) document.getElementById('equip-form-serial').value = parsed.serial || '';
                    if (document.getElementById('equip-form-disco')) document.getElementById('equip-form-disco').value = parsed.disco || '';
                    if (document.getElementById('equip-form-cpu')) document.getElementById('equip-form-cpu').value = parsed.cpu || '';

                    // Tipo e inicio por defecto para laptops
                    if (document.getElementById('equip-form-tipo')) document.getElementById('equip-form-tipo').value = 'laptop';
                    if (document.getElementById('equip-form-estado')) document.getElementById('equip-form-estado').value = 'activo';

                    // Empresa
                    const empresaSelect = document.getElementById('equip-form-empresa');
                    if (empresaSelect && parsed.usuario_nombre) {
                        const normEmp = parsed.usuario_nombre.trim().toLowerCase();
                        if (normEmp.includes('vprime') || normEmp.includes('v-prime')) {
                            empresaSelect.value = 'VPrime';
                        } else if (normEmp.includes('infinet')) {
                            empresaSelect.value = 'Infinet';
                        } else {
                            empresaSelect.value = 'T-Sales';
                        }
                    } else if (empresaSelect) {
                        empresaSelect.value = 'T-Sales';
                    }

                    // Dejar vacíos el nombre y correo del usuario asignado para llenado manual
                    const nameInput = document.getElementById('equip-form-usuario-nombre');
                    const emailInput = document.getElementById('equip-form-usuario-email');
                    if (nameInput) {
                        nameInput.value = '';
                        nameInput.focus();
                    }
                    if (emailInput) {
                        emailInput.value = '';
                    }

                    alert('Datos de hardware cargados con éxito del TXT. Por favor, ingresa el nombre de la persona asignada.');
                } catch (err) {
                    console.error('Error al procesar el inventario TXT:', err);
                    alert('No se pudo procesar el formato del archivo TXT.');
                }
            };
            reader.readAsText(file);
        });
    }

    function parseTXTInventory(text) {
        const lines = text.split('\n');
        
        const getValue = (key) => {
            const target = normalizeStr(key);
            for (const line of lines) {
                const separator = line.indexOf(':');
                if (separator === -1) continue;
                const label = normalizeStr(line.slice(0, separator).replace(/^[\s*=-]+/, ''));
                if (label === target) return line.slice(separator + 1).trim();
            }
            return '';
        };

        const data = {};
        data.codigo = getValue('Nombre Equipo') || getValue('Nombre del Equipo') || getValue('Nombre') || getValue('Codigo') || '';
        data.usuario_nombre = getValue('Usuario') || '';
        data.usuario_email = getValue('Correo') || getValue('Email') || '';
        data.marca = getValue('Marca') || '';
        data.modelo = getValue('Modelo') || '';
        
        const so = getValue('Sistema Operativo') || getValue('S.O.') || getValue('SO') || '';
        const version = getValue('Version') || '';
        const arch = getValue('Arquitectura') || '';
        data.so = [so, version, arch].filter(Boolean).join(' ');

        data.ram = getValue('RAM Total') || getValue('RAM') || '';
        data.serial = getValue('Serial') || getValue('S/N') || getValue('Numero de Serie') || getValue('Service Tag') || '';

        const discoModelo = getValue('Modelo Disco') || getValue('Disco') || '';
        const discoCapacidad = getValue('Capacidad') || getValue('Tamano Disco') || '';
        data.disco = [discoModelo, discoCapacidad].filter(Boolean).join(' - ');

        data.cpu = getValue('CPU') || getValue('Procesador') || '';

        return data;
    }

    function parsePastedExcelText(text) {
        if (!text || !text.trim()) return [];
        // Mantener tabulaciones: las celdas vacías también ocupan una columna.
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return [];

        const matrix = lines.map(line => {
            if (line.includes('\t')) {
                return line.split('\t').map(c => c.trim());
            } else if (line.includes(';') && (line.match(/;/g) || []).length > 3) {
                return line.split(';').map(c => c.trim());
            } else if (line.includes(',') && (line.match(/,/g) || []).length > 3) {
                return line.split(',').map(c => c.trim());
            } else {
                return line.split(/\s{2,}/).map(c => c.trim());
            }
        });

        return parseRowsToEquipos(matrix);
    }

    function parseRowsToEquipos(matrix) {
        if (!matrix || matrix.length === 0) return [];
        
        let headerRowIndex = -1;
        let headers = [];

        // Buscar fila que contiene los encabezados
        for (let i = 0; i < Math.min(5, matrix.length); i++) {
            const rowStr = (matrix[i] || []).map(c => normalizeStr(String(c || ''))).join(' ');
            if (rowStr.includes('usuario') || rowStr.includes('serial') || rowStr.includes('serie') || rowStr.includes('s/n') || rowStr.includes('modelo') || rowStr.includes('correo') || rowStr.includes('marca') || rowStr.includes('rut')) {
                headerRowIndex = i;
                headers = matrix[i].map(h => normalizeStr(String(h || '')));
                break;
            }
        }

        const findCol = (keywords) => {
            if (headerRowIndex === -1) return -1;
            return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const idxUser = headerRowIndex === -1 ? -1 : headers.findIndex(h =>
            /^(usuario|nombre|user|colaborador|persona|nombres)$/.test(h) ||
            /^(nombre (del )?(usuario|colaborador|persona)|usuario asignado|nombre completo)$/.test(h)
        );
        const idxRut = findCol(['rut', 'r.u.t', 'cedula']);
        const idxEmail = findCol(['correo', 'email', 'mail']);
        const idxEmpresa = findCol(['empresa', 'company', 'propiedad']);
        const idxDireccion = findCol(['direccion', 'sede', 'ubicacion']);
        const idxEquipo = headerRowIndex === -1 ? -1 : headers.findIndex(h =>
            /^(equipo|codigo|code|id|no\.?|n[°º]|nombre[_ ]codigo|hostname)$/.test(h) ||
            /^(nombre (del )?equipo|codigo (del )?equipo|nombre pc)$/.test(h)
        );
        const idxModelo = findCol(['modelo', 'model']);
        const idxSerial = findCol(['numero de serie', 'serial', 's/n', 'sn', 'serie', 'servial']);
        const idxMarca = findCol(['marca', 'brand', 'fabricante']);
        const idxCpu = findCol(['procesador', 'cpu', 'proc']);
        const idxRam = findCol(['ram', 'memoria']);
        const idxDisco = findCol(['almacenamiento', 'disco', 'hdd', 'ssd', 'disco duro']);
        const idxSo = findCol(['windows', 'so', 'sistema', 'os', 'sistema operativo']);
        const idxEstado = findCol(['estado', 'status', 'condicion']);
        const idxUserWin = findCol(['usuario windows', 'user windows', 'usuario local']);
        const idxDominio = findCol(['dominio', 'domain']);
        const idxIp = findCol(['ip', 'direccion ip']);
        const idxMac = findCol(['mac', 'direccion mac']);
        const idxBuild = findCol(['build', 'build windows', 'version']);
        const idxArch = findCol(['arquitectura', 'arch', '64 bits']);

        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
        const imported = [];

        for (let i = startRow; i < matrix.length; i++) {
            const row = matrix[i];
            if (!row || row.length === 0) continue;
            
            const rawUser = idxUser !== -1 ? String(row[idxUser] || '').trim() : '';
            const rawRut = idxRut !== -1 ? String(row[idxRut] || '').trim() : '';
            const rawEmail = idxEmail !== -1 ? String(row[idxEmail] || '').trim() : '';
            const rawEmpresa = idxEmpresa !== -1 ? String(row[idxEmpresa] || '').trim() : '';
            const rawDireccion = idxDireccion !== -1 ? String(row[idxDireccion] || '').trim() : '';
            const rawEquipo = idxEquipo !== -1 ? String(row[idxEquipo] || '').trim() : '';
            const rawModelo = idxModelo !== -1 ? String(row[idxModelo] || '').trim() : '';
            const rawSerial = idxSerial !== -1 ? String(row[idxSerial] || '').trim() : '';
            const rawMarca = idxMarca !== -1 ? String(row[idxMarca] || '').trim() : '';
            const rawCpu = idxCpu !== -1 ? String(row[idxCpu] || '').trim() : '';
            const rawRam = idxRam !== -1 ? String(row[idxRam] || '').trim() : '';
            const rawDisco = idxDisco !== -1 ? String(row[idxDisco] || '').trim() : '';
            const rawSo = idxSo !== -1 ? String(row[idxSo] || '').trim() : '';
            const rawEstado = idxEstado !== -1 ? String(row[idxEstado] || '').trim() : '';
            const rawUserWin = idxUserWin !== -1 ? String(row[idxUserWin] || '').trim() : '';
            const rawDominio = idxDominio !== -1 ? String(row[idxDominio] || '').trim() : '';
            const rawIp = idxIp !== -1 ? String(row[idxIp] || '').trim() : '';
            const rawMac = idxMac !== -1 ? String(row[idxMac] || '').trim() : '';
            const rawBuild = idxBuild !== -1 ? String(row[idxBuild] || '').trim() : '';
            const rawArch = idxArch !== -1 ? String(row[idxArch] || '').trim() : '';

            if (!rawUser && !rawSerial && !rawMarca && !rawModelo && !rawEmail) continue;

            // Detección inteligente de Empresa
            let empresa = 'T-Sales';
            const empCheck = (rawEmpresa + ' ' + rawEmail + ' ' + rawUserWin).toLowerCase();
            if (/vprime|v\s*prime/i.test(empCheck)) empresa = 'VPrime';
            else if (/infinet/i.test(empCheck)) empresa = 'Infinet';
            else if (/t-sales|tsales/i.test(empCheck)) empresa = 'T-Sales';

            // Detección de Estado
            let estado = 'activo';
            const estCheck = rawEstado.toLowerCase();
            if (/baja|dado\s+de\s+baja/i.test(estCheck)) estado = 'baja';
            else if (/mantenimiento/i.test(estCheck)) estado = 'mantenimiento';
            else if (/disponible|libre|bodega/i.test(estCheck)) estado = 'disponible';
            else if (/reservado/i.test(estCheck)) estado = 'reservado';
            else if (/preparaci[oó]n/i.test(estCheck)) estado = 'en_preparacion';
            else if (!rawUser || rawUser.toLowerCase() === 'disponible' || rawUser.toLowerCase() === 'libre') estado = 'disponible';

            // Detección de Marca
            let marca = rawMarca || 'Dell';
            const brandCheck = (rawMarca + ' ' + rawModelo).toLowerCase();
            if (/lenovo|thinkpad/i.test(brandCheck)) marca = 'Lenovo';
            else if (/hp|elitebook|probook/i.test(brandCheck)) marca = 'HP';
            else if (/dell|latitude|vostro|optiplex/i.test(brandCheck)) marca = 'Dell';
            else if (/apple|macbook/i.test(brandCheck)) marca = 'Apple';
            else if (/asus/i.test(brandCheck)) marca = 'Asus';
            else if (/acer/i.test(brandCheck)) marca = 'Acer';

            const code = rawEquipo || (imported.length + 1).toString();

            imported.push({
                nombre_codigo: code,
                usuario_nombre: rawUser || (estado === 'disponible' ? 'Sin Asignar (Disponible)' : 'Usuario TI'),
                usuario_rut: rawRut,
                usuario_email: rawEmail,
                empresa: empresa,
                direccion: rawDireccion,
                marca: marca,
                modelo: rawModelo || 'Latitude / ProBook',
                serial: rawSerial || ('SR-' + Math.random().toString(36).substr(2, 7).toUpperCase()),
                cpu: rawCpu || 'i5',
                ram: rawRam || '16GB',
                disco_duro: rawDisco || '256GB SSD',
                sistema_operativo: rawSo || 'Windows 11 Pro',
                estado: estado,
                usuario_windows: rawUserWin,
                dominio: rawDominio,
                ip: rawIp,
                mac: rawMac,
                build_windows: rawBuild,
                arquitectura: rawArch || '64 bits',
                licencia_usuario: 'M365',
                tipo: 'laptop',
                created_at: new Date().toISOString()
            });
        }

        return imported;
    }

    function renderImportPreview(equipos) {
        const previewSection = document.getElementById('import-preview-section');
        const badge = document.getElementById('import-stats-badge');
        const breakdown = document.getElementById('import-company-breakdown');
        const tbody = document.getElementById('import-preview-table-body');
        const confirmBtn = document.getElementById('btn-import-confirm');

        if (previewSection) previewSection.style.display = 'flex';
        if (tbody) tbody.innerHTML = '';

        if (!equipos || equipos.length === 0) {
            if (badge) badge.textContent = '0 EQUIPOS DETECTADOS';
            if (breakdown) breakdown.textContent = '';
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.6';
            }
            return;
        }

        const countTsales = equipos.filter(e => e.empresa === 'T-Sales').length;
        const countInfinet = equipos.filter(e => e.empresa === 'Infinet').length;
        const countVprime = equipos.filter(e => e.empresa === 'VPrime').length;

        if (badge) badge.textContent = `${equipos.length} EQUIPOS LISTOS PARA IMPORTAR`;
        if (breakdown) {
            breakdown.innerHTML = `
                <span class="company-badge badge-tsales" style="margin-right: 6px;">T-Sales: ${countTsales}</span>
                <span class="company-badge badge-infinet" style="margin-right: 6px;">Infinet: ${countInfinet}</span>
                <span class="company-badge badge-vprime">VPrime: ${countVprime}</span>
            `;
        }

        equipos.slice(0, 50).forEach(eq => {
            const tr = document.createElement('tr');
            const empClass = eq.empresa === 'Infinet' ? 'badge-infinet' : (eq.empresa === 'VPrime' ? 'badge-vprime' : 'badge-tsales');
            const stateClass = getEquipStateClass(eq.estado);
            const stateLabel = getEquipStateLabel(eq.estado);

            tr.innerHTML = `
                <td>
                    <strong style="color: var(--accent-blue); font-size: 0.85rem;">#${escapeHtml(eq.nombre_codigo)}</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Laptop</span>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${escapeHtml(eq.usuario_nombre)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHtml(eq.usuario_rut || '')} ${eq.usuario_email ? '• ' + escapeHtml(eq.usuario_email) : ''}</div>
                </td>
                <td>
                    <span class="company-badge ${empClass}">${escapeHtml(eq.empresa)}</span>
                </td>
                <td>
                    <div style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem;">${escapeHtml(eq.marca)} ${escapeHtml(eq.modelo)}</div>
                    <code style="font-size: 0.75rem; color: var(--accent-cyan, #06b6d4);">${escapeHtml(eq.serial)}</code>
                </td>
                <td>
                    <div style="font-size: 0.78rem; color: var(--text-secondary);">
                        <span>${escapeHtml(eq.cpu)}</span> | <span>${escapeHtml(eq.ram)}</span> | <span>${escapeHtml(eq.disco_duro)}</span>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.78rem; color: var(--text-primary);">${escapeHtml(eq.sistema_operativo)}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(eq.ip || '')} ${eq.mac ? '• ' + escapeHtml(eq.mac) : ''}</div>
                </td>
                <td>
                    <span class="status-badge ${stateClass}" style="font-size: 0.75rem;">${stateLabel}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
        }
    }

    // Lector XLSX/XLS/CSV con SheetJS
    function readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    
                    if (!matrix || matrix.length === 0) {
                        resolve([]);
                        return;
                    }
                    
                    const imported = parseRowsToEquipos(matrix);
                    resolve(imported);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Error leyendo el archivo de Excel"));
            reader.readAsArrayBuffer(file);
        });
    }

    // Lector PDF con PDF.js
    function readPDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }
                    
                    let equipos = parsePDFTextToEquipos(fullText);
                    if (equipos.length === 0) {
                        const words = fullText.split(/\s+/);
                        let lineBuffer = '';
                        let tempLines = [];
                        words.forEach(w => {
                            if (/^\d+$/.test(w) && lineBuffer.length > 50) {
                                tempLines.push(lineBuffer);
                                lineBuffer = w + ' ';
                            } else {
                                lineBuffer += w + ' ';
                            }
                        });
                        if (lineBuffer) tempLines.push(lineBuffer);
                        equipos = parsePDFTextToEquipos(tempLines.join('\n'));
                    }
                    resolve(equipos);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Error leyendo el archivo PDF"));
            reader.readAsArrayBuffer(file);
        });
    }

    // ========================================================
    // GESTIÓN INTEGRAL DE MOVIMIENTOS: INGRESOS, BAJAS Y HISTORIAL
    // ========================================================
    const EQUIPOS_MOVEMENTS_KEY = 'equipos_movements_history';
    const EQUIPOS_INGRESOS_KEY = 'equipos_ingresos_list';
    const EQUIPOS_BAJAS_KEY = 'equipos_bajas_list';

    let currentEquipSubtab = 'inventario';
    let allIngresosCached = [];
    let allBajasCached = [];
    let allMovementsCached = [];

    // Helper para formatear nombres legibles de estados
    function getEquipStateLabel(state) {
        if (!state) return 'Desconocido';
        const map = {
            'disponible': '🟢 Disponible',
            'reservado': '🟣 Reservado',
            'en_preparacion': '🔵 En Preparación',
            'preparacion': '🔵 En Preparación',
            'activo': '🟢 Asignado / Activo',
            'asignado': '🟢 Asignado',
            'pendiente_devolucion': '🟠 Pend. Devolución',
            'recibido_preparacion': '🔵 Recibido en TI',
            'mantenimiento': '🔴 Mantenimiento',
            'baja': '⚫ Baja Definitiva'
        };
        return map[state.toLowerCase()] || (state.charAt(0).toUpperCase() + state.slice(1));
    }

    function getEquipStateClass(state) {
        if (!state) return 'status-disponible';
        const key = state.toLowerCase().replace(/\s+/g, '_');
        return `status-${key}`;
    }

    // Subtab switching
    window.switchEquipSubtab = function(tabName) {
        currentEquipSubtab = tabName;
        const tabs = ['inventario', 'ingresos', 'bajas'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`equip-subtab-${t}`);
            if (btn) {
                if (t === tabName) btn.classList.add('active');
                else btn.classList.remove('active');
            }
            if (content) {
                content.style.display = (t === tabName) ? 'block' : 'none';
            }
        });

        const headerActions = document.getElementById('inventario-header-actions');
        if (headerActions) {
            headerActions.style.display = (tabName === 'inventario') ? 'flex' : 'none';
        }

        if (tabName === 'ingresos') {
            renderEquiposIngresos();
        } else if (tabName === 'bajas') {
            renderEquiposBajas();
        } else {
            refreshEquipos();
        }
    };

    // Subtab button listeners
    const tabBtnInventario = document.getElementById('tab-btn-inventario');
    const tabBtnIngresos = document.getElementById('tab-btn-ingresos');
    const tabBtnBajas = document.getElementById('tab-btn-bajas');
    if (tabBtnInventario) tabBtnInventario.addEventListener('click', () => switchEquipSubtab('inventario'));
    if (tabBtnIngresos) tabBtnIngresos.addEventListener('click', () => switchEquipSubtab('ingresos'));
    if (tabBtnBajas) tabBtnBajas.addEventListener('click', () => switchEquipSubtab('bajas'));

    // Historial / Trazabilidad
    function loadEquiposMovements() {
        const stored = localStorage.getItem(EQUIPOS_MOVEMENTS_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        const initialSeeds = [
            {
                id: 'mov-1',
                serial: 'FQM92R2',
                action: 'Asignación Inicial',
                details: 'Equipo entregado a Gissell Solange Miranda (T-Sales)',
                tech: 'Belfor Aburto',
                date: '2026-08-01T10:00:00.000Z',
                dotColor: 'dot-green'
            },
            {
                id: 'mov-2',
                serial: '9X5LLL13',
                action: 'Mantenimiento y Formateo Completado',
                details: 'Equipo revisado en laboratorio TI, disco formateado e imagen corporativa instalada. Queda 100% disponible.',
                tech: 'Felipe Galleguillos',
                date: '2026-08-15T14:30:00.000Z',
                dotColor: 'dot-green'
            },
            {
                id: 'mov-3',
                serial: '5CG212C854',
                action: 'Asignación Inicial',
                details: 'Equipo entregado y firmado por Lia Villavicencio (T-Sales)',
                tech: 'Omar Salgado',
                date: '2026-08-10T09:15:00.000Z',
                dotColor: 'dot-green'
            }
        ];
        saveEquiposMovements(initialSeeds);
        return initialSeeds;
    }

    function saveEquiposMovements(movements) {
        allMovementsCached = movements;
        localStorage.setItem(EQUIPOS_MOVEMENTS_KEY, JSON.stringify(movements));
    }

    function addEquiposMovement(serial, action, details, techName = null, dateIso = null, dotColor = 'dot-green') {
        const tech = techName || (currentSession ? currentSession.nombre : 'Soporte TI');
        const date = dateIso || new Date().toISOString();
        const movements = loadEquiposMovements();
        const newMov = {
            id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            serial: (serial || '').trim(),
            action: action,
            details: details,
            tech: tech,
            date: date,
            dotColor: dotColor
        };
        movements.unshift(newMov);
        saveEquiposMovements(movements);
        return newMov;
    }

    function openSerialHistoryModal(serial) {
        if (!serial) {
            alert('Este equipo no tiene un número de serie asignado.');
            return;
        }
        const normSerial = String(serial).trim();
        const eq = allEquiposCached.find(e => (e.serial || '').trim().toLowerCase() === normSerial.toLowerCase()) || {
            serial: normSerial,
            nombre_codigo: normSerial,
            marca: 'Equipo',
            modelo: 'Notebook',
            ram: '8GB',
            disco_duro: '256GB SSD',
            sistema_operativo: 'Windows 10/11 Pro',
            estado: 'activo'
        };

        const modal = document.getElementById('modal-historial-serial');
        if (!modal) return;

        const badge = document.getElementById('historial-serial-badge');
        const nombreEl = document.getElementById('historial-equipo-nombre');
        const specsEl = document.getElementById('historial-equipo-specs');
        const estadoEl = document.getElementById('historial-equipo-estado-badge');
        const timelineList = document.getElementById('equip-serial-timeline-list');

        if (badge) badge.textContent = `SERIAL: ${eq.serial || normSerial}`;
        if (nombreEl) nombreEl.textContent = `${eq.marca || ''} ${eq.modelo || ''} (${eq.nombre_codigo || ''})`;
        if (specsEl) specsEl.textContent = `${eq.ram || ''} · ${eq.disco_duro || ''} · ${eq.sistema_operativo || ''}`;
        if (estadoEl) {
            estadoEl.className = `status-badge ${getEquipStateClass(eq.estado)}`;
            estadoEl.textContent = getEquipStateLabel(eq.estado);
        }

        const movements = loadEquiposMovements().filter(m => (m.serial || '').trim().toLowerCase() === normSerial.toLowerCase());

        if (timelineList) {
            if (movements.length === 0) {
                timelineList.innerHTML = `
                    <div class="equip-timeline-item dot-green">
                        <div class="equip-timeline-header">
                            <span class="equip-timeline-action"><i class="fas fa-check-circle" style="color: var(--accent-green);"></i> Registro Inicial en CMDB</span>
                            <span class="equip-timeline-date">${formatDate(eq.created_at || new Date())}</span>
                        </div>
                        <div class="equip-timeline-details">
                            Equipo incorporado al inventario general de Soporte TI. ${eq.usuario_nombre ? `Asignado actualmente a <strong>${escapeHtml(eq.usuario_nombre)}</strong>.` : 'En stock en bodega TI.'}
                        </div>
                        <div class="equip-timeline-tech"><i class="fas fa-user-shield"></i> Registrado por: Soporte TI</div>
                    </div>
                `;
            } else {
                timelineList.innerHTML = movements.map(m => {
                    return `
                        <div class="equip-timeline-item ${m.dotColor || 'dot-green'}">
                            <div class="equip-timeline-header">
                                <span class="equip-timeline-action">
                                    <i class="fas ${m.dotColor === 'dot-amber' ? 'fa-truck-loading' : (m.dotColor === 'dot-purple' ? 'fa-bookmark' : (m.dotColor === 'dot-red' ? 'fa-wrench' : 'fa-check-circle'))}" style="color: ${m.dotColor === 'dot-amber' ? '#f59e0b' : (m.dotColor === 'dot-purple' ? 'var(--accent-purple)' : (m.dotColor === 'dot-red' ? '#ef4444' : '#1dc86d'))}; margin-right: 6px;"></i>
                                    ${escapeHtml(m.action)}
                                </span>
                                <span class="equip-timeline-date">${formatDate(m.date)} ${new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="equip-timeline-details">
                                ${m.details}
                            </div>
                            <div class="equip-timeline-tech">
                                <i class="fas fa-user-tie"></i> Responsable TI: <strong>${escapeHtml(m.tech || 'Soporte TI')}</strong>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        modal.style.display = 'flex';
    }

    const btnCloseHistorial = document.getElementById('btn-close-modal-historial');
    const btnCerrarHistorial = document.getElementById('btn-cerrar-historial');
    const modalHistorial = document.getElementById('modal-historial-serial');
    if (btnCloseHistorial) btnCloseHistorial.addEventListener('click', () => modalHistorial.style.display = 'none');
    if (btnCerrarHistorial) btnCerrarHistorial.addEventListener('click', () => modalHistorial.style.display = 'none');

    const btnVerHistorialDesdeDetalle = document.getElementById('btn-ver-historial-desde-detalle');
    if (btnVerHistorialDesdeDetalle) {
        btnVerHistorialDesdeDetalle.addEventListener('click', () => {
            if (activeEquip && activeEquip.serial) {
                openSerialHistoryModal(activeEquip.serial);
            } else {
                alert('Este equipo no cuenta con número de serie registrado.');
            }
        });
    }

    // ============================================
    // SECCIÓN 2: INGRESOS (ONBOARDING)
    // ============================================
    function loadEquiposIngresos() {
        const stored = localStorage.getItem(EQUIPOS_INGRESOS_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        const initialIngresos = [
            {
                id: 'ing-1',
                nombre: 'Pedro González Varas',
                rut: '19.452.887-3',
                email: 'pedro.gonzalez@t-sales.cl',
                empresa: 'T-Sales',
                supervisor: 'Felipe Galleguillos',
                cargo: 'Ejecutivo Comercial',
                fecha_ingreso: '2026-08-31',
                serial: '9X5LLL13',
                notebook_info: 'Dell Latitude 5500 (8GB RAM / 250GB SSD)',
                estado: 'reservado', // reservado -> en_preparacion -> asignado
                notas: 'Ingresa próximo lunes. Requiere software de ventas y acceso VPN.',
                created_at: new Date().toISOString()
            }
        ];
        saveEquiposIngresos(initialIngresos);
        return initialIngresos;
    }

    function saveEquiposIngresos(list) {
        allIngresosCached = list;
        localStorage.setItem(EQUIPOS_INGRESOS_KEY, JSON.stringify(list));
    }

    function renderEquiposIngresos() {
        allIngresosCached = loadEquiposIngresos();
        const tbody = document.getElementById('ingresos-table-body');
        const mobileContainer = document.getElementById('mobile-ingresos-cards-container');
        const disponiblesGrid = document.getElementById('ingresos-notebooks-disponibles-grid');
        const badgeDispCount = document.getElementById('badge-disponibles-count');
        const statDisp = document.getElementById('stat-ingresos-disponibles');

        // Notebooks disponibles en stock TI
        const disponibles = allEquiposCached.filter(e => 
            e.estado === 'disponible' || 
            (e.estado === 'activo' && (!e.usuario_nombre || e.usuario_nombre.trim() === '' || e.usuario_nombre.toLowerCase().includes('s/a') || e.usuario_nombre.toLowerCase().includes('disponible')))
        );

        if (statDisp) statDisp.textContent = disponibles.length;
        if (badgeDispCount) badgeDispCount.textContent = `${disponibles.length} Disponibles`;

        // Render de la grilla de notebooks disponibles
        if (disponiblesGrid) {
            if (disponibles.length === 0) {
                disponiblesGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed var(--border-color);">
                        <i class="fas fa-laptop" style="color: var(--accent-purple); font-size: 1.6rem; margin-bottom: 8px; display: block; opacity: 0.6;"></i>
                        No hay notebooks disponibles en este momento. Al liberar un equipo en <strong>Bajas & Devoluciones</strong> o registrar uno nuevo en Inventario, aparecerá aquí automáticamente.
                    </div>
                `;
            } else {
                disponiblesGrid.innerHTML = disponibles.map(eq => `
                    <div class="disponible-notebook-card" style="background: var(--bg-sidebar); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.15s ease, border-color 0.15s ease;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                                        <i class="fas fa-laptop"></i>
                                    </div>
                                    <div>
                                        <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">${escapeHtml(eq.marca)} ${escapeHtml(eq.modelo)}</strong>
                                        <span style="font-size: 0.74rem; color: var(--text-muted);">Equipo #${escapeHtml(eq.nombre_codigo || '')}</span>
                                    </div>
                                </div>
                                <span class="status-badge status-disponible" style="font-size: 0.72rem; padding: 2px 8px;">🟢 Libre</span>
                            </div>

                            <div style="background: rgba(255,255,255,0.02); border-radius: 6px; padding: 8px 10px; font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Serial:</span>
                                    <strong style="font-family: monospace; color: var(--accent-blue);">${escapeHtml(eq.serial)}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">Hardware:</span>
                                    <span style="color: var(--text-secondary);">${escapeHtml(eq.ram)} · ${escapeHtml(eq.disco_duro)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--text-muted);">SO:</span>
                                    <span style="color: var(--text-secondary);">${escapeHtml(eq.sistema_operativo)}</span>
                                </div>
                            </div>
                        </div>

                        <button type="button" class="btn-anexar-directo" data-serial="${escapeHtml(eq.serial)}" style="width: 100%; padding: 8px 12px; background: linear-gradient(135deg, rgba(97, 62, 234, 0.2) 0%, rgba(50, 102, 235, 0.2) 100%); border: 1px solid var(--accent-blue); color: white; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
                            <i class="fas fa-user-plus"></i> Anexar a Persona Nueva
                        </button>
                    </div>
                `).join('');

                disponiblesGrid.querySelectorAll('.btn-anexar-directo').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const serial = btn.getAttribute('data-serial');
                        openNuevoIngresoModal(serial);
                    });
                });
            }
        }

        if (!tbody) return;

        // Actualizar métricas
        const total = allIngresosCached.length;
        const reservados = allIngresosCached.filter(i => i.estado === 'reservado').length;
        const preparacion = allIngresosCached.filter(i => i.estado === 'en_preparacion').length;
        const completados = allIngresosCached.filter(i => i.estado === 'asignado').length;

        const totalEl = document.getElementById('stat-ingresos-total');
        const resEl = document.getElementById('stat-ingresos-reservados');
        const prepEl = document.getElementById('stat-ingresos-preparacion');
        const compEl = document.getElementById('stat-ingresos-completados');
        const badgeCount = document.getElementById('badge-count-ingresos');

        if (totalEl) totalEl.textContent = total;
        if (resEl) resEl.textContent = reservados;
        if (prepEl) prepEl.textContent = preparacion;
        if (compEl) compEl.textContent = completados;
        if (badgeCount) badgeCount.textContent = (reservados + preparacion);

        // Filtros
        const searchInput = document.getElementById('ingresos-search-input');
        const filterEmp = document.getElementById('ingresos-filter-empresa');
        const filterEst = document.getElementById('ingresos-filter-estado');

        let filtered = [...allIngresosCached];
        if (searchInput && searchInput.value.trim()) {
            const q = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(i => 
                (i.nombre && i.nombre.toLowerCase().includes(q)) ||
                (i.rut && i.rut.toLowerCase().includes(q)) ||
                (i.email && i.email.toLowerCase().includes(q)) ||
                (i.supervisor && i.supervisor.toLowerCase().includes(q)) ||
                (i.serial && i.serial.toLowerCase().includes(q))
            );
        }
        if (filterEmp && filterEmp.value !== 'todas') {
            filtered = filtered.filter(i => i.empresa === filterEmp.value);
        }
        if (filterEst && filterEst.value !== 'todos') {
            filtered = filtered.filter(i => i.estado === filterEst.value);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
                        <i class="fas fa-user-plus" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No se registran próximos ingresos con los filtros aplicados.
                    </td>
                </tr>
            `;
            if (mobileContainer) {
                mobileContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                        <i class="fas fa-user-plus" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No hay ingresos registrados.
                    </div>
                `;
            }
            return;
        }

        tbody.innerHTML = filtered.map(ing => {
            const stateLabel = getEquipStateLabel(ing.estado);
            const stateClass = getEquipStateClass(ing.estado);

            let actionBtnHtml = '';
            if (ing.estado === 'reservado') {
                actionBtnHtml = `
                    <button type="button" class="btn-advance-ingreso" data-id="${ing.id}" data-target="en_preparacion" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: #60a5fa; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-tools"></i> Iniciar Preparación
                    </button>
                `;
            } else if (ing.estado === 'en_preparacion') {
                actionBtnHtml = `
                    <button type="button" class="btn-advance-ingreso" data-id="${ing.id}" data-target="asignado" style="background: rgba(29, 200, 109, 0.18); border: 1px solid rgba(29, 200, 109, 0.4); color: #1dc86d; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-check-double"></i> Entregar & Asignar
                    </button>
                `;
            } else {
                actionBtnHtml = `
                    <span style="font-size: 0.75rem; color: #1dc86d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-check-circle"></i> Entregado
                    </span>
                `;
            }

            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(ing.nombre)}</div>
                        <div style="font-size: 0.78rem; font-family: monospace; color: var(--accent-blue);">${escapeHtml(ing.rut)}</div>
                        <div style="font-size: 0.76rem; color: var(--text-secondary);">${escapeHtml(ing.email)}</div>
                    </td>
                    <td style="padding: 14px 16px;">
                        <span class="autocomplete-badge ${getCompanyBadgeClass(ing.empresa)}" style="margin-bottom: 4px; display: inline-block;">${escapeHtml(ing.empresa)}</span>
                        <div style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHtml(ing.cargo || 'Colaborador')}</div>
                    </td>
                    <td style="padding: 14px 16px;">
                        <strong style="color: var(--text-primary); font-size: 0.85rem;"><i class="far fa-calendar-alt" style="color: var(--accent-purple); margin-right: 4px;"></i> ${formatDate(ing.fecha_ingreso)}</strong>
                    </td>
                    <td style="padding: 14px 16px; font-size: 0.85rem; color: var(--text-secondary);">
                        <i class="fas fa-user-tie" style="color: var(--text-muted); margin-right: 4px;"></i> ${escapeHtml(ing.supervisor || '-')}
                    </td>
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${escapeHtml(ing.notebook_info || 'Notebook')}</div>
                        <div style="font-family: monospace; color: var(--accent-blue); font-size: 0.78rem; font-weight: 700;">S/N: ${escapeHtml(ing.serial)}</div>
                    </td>
                    <td style="padding: 14px 16px;">
                        <span class="status-badge ${stateClass}">${stateLabel}</span>
                    </td>
                    <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                        <div style="display: inline-flex; align-items: center; gap: 8px;">
                            ${actionBtnHtml}
                            <button type="button" class="btn-historial-ingreso" data-serial="${escapeHtml(ing.serial)}" title="Ver Historial del Serial" style="background: rgba(97, 62, 234, 0.12); border: 1px solid rgba(97, 62, 234, 0.25); color: #a78bfa; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                                <i class="fas fa-history"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Mobile cards for Ingresos
        if (mobileContainer) {
            mobileContainer.innerHTML = filtered.map(ing => {
                const stateLabel = getEquipStateLabel(ing.estado);
                const stateClass = getEquipStateClass(ing.estado);

                let actionBtnHtml = '';
                if (ing.estado === 'reservado') {
                    actionBtnHtml = `
                        <button type="button" class="btn-advance-ingreso-mob" data-id="${ing.id}" data-target="en_preparacion" style="background: rgba(59, 130, 246, 0.18); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-tools"></i> Iniciar Preparación
                        </button>
                    `;
                } else if (ing.estado === 'en_preparacion') {
                    actionBtnHtml = `
                        <button type="button" class="btn-advance-ingreso-mob" data-id="${ing.id}" data-target="asignado" style="background: rgba(29, 200, 109, 0.2); border: 1px solid rgba(29, 200, 109, 0.45); color: #1dc86d; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-check-double"></i> Entregar & Asignar
                        </button>
                    `;
                } else {
                    actionBtnHtml = `<span style="font-size: 0.78rem; color: #1dc86d; font-weight: 700;"><i class="fas fa-check-circle"></i> Asignado</span>`;
                }

                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div>
                                <strong style="font-size: 0.94rem; color: var(--text-primary); display: block;">${escapeHtml(ing.nombre)}</strong>
                                <span style="font-family: monospace; color: var(--accent-blue); font-size: 0.8rem;">${escapeHtml(ing.rut)}</span>
                            </div>
                            <span class="status-badge ${stateClass}" style="font-size: 0.72rem; padding: 3px 8px;">${stateLabel}</span>
                        </div>

                        <div style="background: var(--bg-sidebar); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="far fa-calendar-alt"></i> Fecha Ingreso:</span>
                                <strong style="color: var(--text-primary);">${formatDate(ing.fecha_ingreso)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="fas fa-laptop"></i> Notebook:</span>
                                <strong style="color: var(--accent-blue); font-family: monospace;">S/N ${escapeHtml(ing.serial)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="fas fa-user-tie"></i> Supervisor:</span>
                                <span style="color: var(--text-secondary);">${escapeHtml(ing.supervisor || '-')}</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-color);">
                            <button type="button" class="btn-historial-ingreso-mob" data-serial="${escapeHtml(ing.serial)}" style="background: none; border: 1px solid var(--border-color); color: #a78bfa; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-history"></i> Historial
                            </button>
                            ${actionBtnHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Attach action handlers
        document.querySelectorAll('.btn-advance-ingreso, .btn-advance-ingreso-mob').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const target = btn.getAttribute('data-target');
                advanceIngresoStatus(id, target);
            });
        });

        document.querySelectorAll('.btn-historial-ingreso, .btn-historial-ingreso-mob').forEach(btn => {
            btn.addEventListener('click', () => {
                const serial = btn.getAttribute('data-serial');
                openSerialHistoryModal(serial);
            });
        });
    }

    async function advanceIngresoStatus(ingresoId, targetStatus) {
        const list = loadEquiposIngresos();
        const index = list.findIndex(i => String(i.id) === String(ingresoId));
        if (index === -1) return;

        const ing = list[index];
        const prevStatus = ing.estado;
        ing.estado = targetStatus;
        saveEquiposIngresos(list);

        const techName = currentSession ? currentSession.nombre : 'Soporte TI';

        if (targetStatus === 'en_preparacion') {
            // Actualizar estado del notebook
            const eqIndex = allEquiposCached.findIndex(e => (e.serial || '').trim().toLowerCase() === (ing.serial || '').trim().toLowerCase());
            if (eqIndex !== -1) {
                allEquiposCached[eqIndex].estado = 'en_preparacion';
                await updateEquipo(allEquiposCached[eqIndex].id, { estado: 'en_preparacion' });
            }
            addEquiposMovement(
                ing.serial,
                'Preparación de Equipo',
                `TI inicia instalación de sistema operativo, antivirus y perfiles de usuario para el ingreso de <strong>${escapeHtml(ing.nombre)}</strong> (Fecha estimada: ${formatDate(ing.fecha_ingreso)}).`,
                techName,
                new Date().toISOString(),
                'dot-purple'
            );
            alert(`¡Equipo ${ing.serial} puesto en Preparación para ${ing.nombre}!`);
        } else if (targetStatus === 'asignado') {
            // Actualizar asignación final en inventario
            const eqIndex = allEquiposCached.findIndex(e => (e.serial || '').trim().toLowerCase() === (ing.serial || '').trim().toLowerCase());
            if (eqIndex !== -1) {
                const targetEq = allEquiposCached[eqIndex];
                targetEq.usuario_nombre = ing.nombre;
                targetEq.usuario_email = ing.email;
                targetEq.empresa = ing.empresa;
                targetEq.estado = 'activo';
                await updateEquipo(targetEq.id, {
                    usuario_nombre: ing.nombre,
                    usuario_email: ing.email,
                    empresa: ing.empresa,
                    estado: 'activo'
                });
            }
            addEquiposMovement(
                ing.serial,
                'Entrega y Asignación Formal',
                `Notebook entregado y firmado exitosamente por <strong>${escapeHtml(ing.nombre)}</strong> (${escapeHtml(ing.empresa)} - RUT: ${escapeHtml(ing.rut)}). Sincronizado en inventario CMDB.`,
                techName,
                new Date().toISOString(),
                'dot-green'
            );
            alert(`✅ ¡Excelente! El notebook ${ing.serial} ha sido asignado formalmente a ${ing.nombre} y sincronizado en el inventario.`);
        }

        renderEquiposIngresos();
        refreshEquipos();
    }

    // Modal Nuevo Ingreso
    function openNuevoIngresoModal(preselectedSerial = null) {
        const modal = document.getElementById('modal-nuevo-ingreso');
        const form = document.getElementById('form-nuevo-ingreso');
        const notebookSelect = document.getElementById('ingreso-notebook-select');

        if (form) form.reset();

        // Cargar notebooks con estado disponible o sin usuario
        if (notebookSelect) {
            const disponibles = allEquiposCached.filter(e => 
                e.estado === 'disponible' || 
                (e.estado === 'activo' && (!e.usuario_nombre || e.usuario_nombre.trim() === '' || e.usuario_nombre.toLowerCase().includes('s/a') || e.usuario_nombre.toLowerCase().includes('disponible')))
            );

            if (disponibles.length === 0) {
                notebookSelect.innerHTML = `<option value="" disabled selected>⚠️ No hay notebooks disponibles en nuestro inventario</option>`;
            } else {
                notebookSelect.innerHTML = disponibles.map(eq => {
                    const isSelected = preselectedSerial && (eq.serial || '').toLowerCase() === preselectedSerial.toLowerCase();
                    return `
                        <option value="${escapeHtml(eq.serial)}" ${isSelected ? 'selected' : ''} data-brand="${escapeHtml(eq.marca)}" data-model="${escapeHtml(eq.modelo)}" data-specs="${escapeHtml(eq.ram)} / ${escapeHtml(eq.disco_duro)}">
                            [S/N: ${escapeHtml(eq.serial)}] ${escapeHtml(eq.marca)} ${escapeHtml(eq.modelo)} — (${escapeHtml(eq.ram)}, ${escapeHtml(eq.disco_duro)}, ${escapeHtml(eq.sistema_operativo)})
                        </option>
                    `;
                }).join('');
            }
        }

        if (modal) modal.style.display = 'flex';
    }

    const btnOpenModalIngreso = document.getElementById('btn-open-modal-ingreso');
    const btnCloseModalIngreso = document.getElementById('btn-close-modal-ingreso');
    const btnCancelIngreso = document.getElementById('btn-cancel-ingreso');
    const formNuevoIngreso = document.getElementById('form-nuevo-ingreso');

    if (btnOpenModalIngreso) btnOpenModalIngreso.addEventListener('click', () => openNuevoIngresoModal());
    if (btnCloseModalIngreso) btnCloseModalIngreso.addEventListener('click', () => document.getElementById('modal-nuevo-ingreso').style.display = 'none');
    if (btnCancelIngreso) btnCancelIngreso.addEventListener('click', () => document.getElementById('modal-nuevo-ingreso').style.display = 'none');

    if (formNuevoIngreso) {
        formNuevoIngreso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('ingreso-nombre').value.trim();
            const rut = document.getElementById('ingreso-rut').value.trim();
            const email = document.getElementById('ingreso-email').value.trim();
            const empresa = document.getElementById('ingreso-empresa').value;
            const supervisor = document.getElementById('ingreso-supervisor').value.trim();
            const cargo = document.getElementById('ingreso-cargo').value.trim();
            const fecha = document.getElementById('ingreso-fecha').value;
            const selectEl = document.getElementById('ingreso-notebook-select');
            const serial = selectEl ? selectEl.value : '';
            const notas = document.getElementById('ingreso-notas').value.trim();

            if (!serial) {
                alert('Por favor, selecciona un notebook disponible para reservar.');
                return;
            }

            const selectedOption = selectEl.options[selectEl.selectedIndex];
            const notebookInfo = selectedOption ? selectedOption.textContent.trim() : `S/N: ${serial}`;

            const newIngreso = {
                id: 'ing-' + Date.now(),
                nombre: nombre,
                rut: rut,
                email: email,
                empresa: empresa,
                supervisor: supervisor,
                cargo: cargo,
                fecha_ingreso: fecha,
                serial: serial,
                notebook_info: notebookInfo,
                estado: 'reservado',
                notas: notas,
                created_at: new Date().toISOString()
            };

            const list = loadEquiposIngresos();
            list.unshift(newIngreso);
            saveEquiposIngresos(list);

            // Cambiar estado del notebook a reservado en inventario
            const eqIndex = allEquiposCached.findIndex(eq => (eq.serial || '').trim().toLowerCase() === serial.toLowerCase());
            if (eqIndex !== -1) {
                allEquiposCached[eqIndex].estado = 'reservado';
                await updateEquipo(allEquiposCached[eqIndex].id, { estado: 'reservado' });
            }

            // Registrar movimiento en historial
            addEquiposMovement(
                serial,
                'Notebook Reservado para Ingreso',
                `Equipo reservado para el próximo ingreso de <strong>${escapeHtml(nombre)}</strong> (${escapeHtml(empresa)}). Fecha estimada de inicio: ${formatDate(fecha)}. Supervisor: ${escapeHtml(supervisor)}.`,
                currentSession ? currentSession.nombre : 'Soporte TI',
                new Date().toISOString(),
                'dot-purple'
            );

            document.getElementById('modal-nuevo-ingreso').style.display = 'none';
            alert(`¡Ingreso de ${nombre} registrado con éxito! El notebook ${serial} ha quedado reservado.`);
            renderEquiposIngresos();
            refreshEquipos();
        });
    }

    const ingresosSearchInput = document.getElementById('ingresos-search-input');
    const ingresosFilterEmp = document.getElementById('ingresos-filter-empresa');
    const ingresosFilterEst = document.getElementById('ingresos-filter-estado');
    if (ingresosSearchInput) ingresosSearchInput.addEventListener('input', renderEquiposIngresos);
    if (ingresosFilterEmp) ingresosFilterEmp.addEventListener('change', renderEquiposIngresos);
    if (ingresosFilterEst) ingresosFilterEst.addEventListener('change', renderEquiposIngresos);


    // ============================================
    // SECCIÓN 3: BAJAS (OFFBOARDING)
    // ============================================
    function loadEquiposBajas() {
        const stored = localStorage.getItem(EQUIPOS_BAJAS_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        const initialBajas = [
            {
                id: 'baja-1',
                nombre: 'Camila González Soto',
                rut: '20.123.456-7',
                email: 'camila.gonzalez@t-sales.cl',
                empresa: 'T-Sales',
                supervisor: 'Omar Salgado',
                fecha_salida: '2026-08-26',
                serial: '5CG212C854',
                notebook_info: 'HP 14-DQ2023LA (4GB RAM / 250GB SSD)',
                estado: 'pendiente_devolucion', // pendiente_devolucion -> recibido_preparacion -> disponible
                notas: 'Colaboradora dejó la empresa hoy. El supervisor tiene el equipo en sucursal y lo enviará a bodega TI.',
                created_at: new Date().toISOString()
            }
        ];
        saveEquiposBajas(initialBajas);
        return initialBajas;
    }

    function saveEquiposBajas(list) {
        allBajasCached = list;
        localStorage.setItem(EQUIPOS_BAJAS_KEY, JSON.stringify(list));
    }

    function renderEquiposBajas() {
        allBajasCached = loadEquiposBajas();
        const tbody = document.getElementById('bajas-table-body');
        const mobileContainer = document.getElementById('mobile-bajas-cards-container');
        if (!tbody) return;

        // Actualizar métricas
        const pendientes = allBajasCached.filter(b => b.estado === 'pendiente_devolucion').length;
        const revision = allBajasCached.filter(b => b.estado === 'recibido_preparacion' || b.estado === 'en_preparacion').length;
        const disponibles = allBajasCached.filter(b => b.estado === 'disponible').length;

        const pendEl = document.getElementById('stat-bajas-pendientes');
        const revEl = document.getElementById('stat-bajas-revision');
        const dispEl = document.getElementById('stat-bajas-disponibles');
        const badgeCount = document.getElementById('badge-count-bajas');

        if (pendEl) pendEl.textContent = pendientes;
        if (revEl) revEl.textContent = revision;
        if (dispEl) dispEl.textContent = disponibles;
        if (badgeCount) badgeCount.textContent = (pendientes + revision);

        // Filtros
        const searchInput = document.getElementById('bajas-search-input');
        const filterEmp = document.getElementById('bajas-filter-empresa');
        const filterEst = document.getElementById('bajas-filter-estado');

        let filtered = [...allBajasCached];
        if (searchInput && searchInput.value.trim()) {
            const q = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(b => 
                (b.nombre && b.nombre.toLowerCase().includes(q)) ||
                (b.rut && b.rut.toLowerCase().includes(q)) ||
                (b.email && b.email.toLowerCase().includes(q)) ||
                (b.supervisor && b.supervisor.toLowerCase().includes(q)) ||
                (b.serial && b.serial.toLowerCase().includes(q))
            );
        }
        if (filterEmp && filterEmp.value !== 'todas') {
            filtered = filtered.filter(b => b.empresa === filterEmp.value);
        }
        if (filterEst && filterEst.value !== 'todos') {
            filtered = filtered.filter(b => b.estado === filterEst.value);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
                        <i class="fas fa-user-minus" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No se registran bajas con los filtros aplicados.
                    </td>
                </tr>
            `;
            if (mobileContainer) {
                mobileContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                        <i class="fas fa-user-minus" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No hay bajas registradas.
                    </div>
                `;
            }
            return;
        }

        tbody.innerHTML = filtered.map(baja => {
            const stateLabel = getEquipStateLabel(baja.estado);
            const stateClass = getEquipStateClass(baja.estado);

            let actionBtnHtml = '';
            if (baja.estado === 'pendiente_devolucion') {
                actionBtnHtml = `
                    <button type="button" class="btn-advance-baja" data-id="${baja.id}" data-target="recibido_preparacion" style="background: rgba(245, 158, 11, 0.18); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-box"></i> Marcar Recibido en TI
                    </button>
                `;
            } else if (baja.estado === 'recibido_preparacion') {
                actionBtnHtml = `
                    <button type="button" class="btn-advance-baja" data-id="${baja.id}" data-target="disponible" style="background: rgba(29, 200, 109, 0.18); border: 1px solid rgba(29, 200, 109, 0.4); color: #1dc86d; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-check-circle"></i> Liberar a Disponible
                    </button>
                `;
            } else {
                actionBtnHtml = `
                    <span style="font-size: 0.75rem; color: #1dc86d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-check-circle"></i> Reintegrado
                    </span>
                `;
            }

            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(baja.nombre)}</div>
                        <div style="font-size: 0.78rem; font-family: monospace; color: #f59e0b;">${escapeHtml(baja.rut || 'Sin RUT')}</div>
                        <div style="font-size: 0.76rem; color: var(--text-secondary);">${escapeHtml(baja.email || '-')}</div>
                    </td>
                    <td style="padding: 14px 16px;">
                        <span class="autocomplete-badge ${getCompanyBadgeClass(baja.empresa)}">${escapeHtml(baja.empresa)}</span>
                    </td>
                    <td style="padding: 14px 16px;">
                        <strong style="color: var(--text-primary); font-size: 0.85rem;"><i class="far fa-calendar-times" style="color: #ef4444; margin-right: 4px;"></i> ${formatDate(baja.fecha_salida)}</strong>
                    </td>
                    <td style="padding: 14px 16px; font-size: 0.85rem; color: var(--text-secondary);">
                        <i class="fas fa-user-tie" style="color: var(--text-muted); margin-right: 4px;"></i> ${escapeHtml(baja.supervisor || '-')}
                    </td>
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${escapeHtml(baja.notebook_info || 'Notebook')}</div>
                        <div style="font-family: monospace; color: var(--accent-blue); font-size: 0.78rem; font-weight: 700;">S/N: ${escapeHtml(baja.serial)}</div>
                    </td>
                    <td style="padding: 14px 16px;">
                        <span class="status-badge ${stateClass}">${stateLabel}</span>
                    </td>
                    <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                        <div style="display: inline-flex; align-items: center; gap: 8px;">
                            ${actionBtnHtml}
                            <button type="button" class="btn-historial-baja" data-serial="${escapeHtml(baja.serial)}" title="Ver Historial del Serial" style="background: rgba(97, 62, 234, 0.12); border: 1px solid rgba(97, 62, 234, 0.25); color: #a78bfa; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                                <i class="fas fa-history"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Mobile cards for Bajas
        if (mobileContainer) {
            mobileContainer.innerHTML = filtered.map(baja => {
                const stateLabel = getEquipStateLabel(baja.estado);
                const stateClass = getEquipStateClass(baja.estado);

                let actionBtnHtml = '';
                if (baja.estado === 'pendiente_devolucion') {
                    actionBtnHtml = `
                        <button type="button" class="btn-advance-baja-mob" data-id="${baja.id}" data-target="recibido_preparacion" style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.45); color: #f59e0b; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-box"></i> Marcar Recibido en TI
                        </button>
                    `;
                } else if (baja.estado === 'recibido_preparacion') {
                    actionBtnHtml = `
                        <button type="button" class="btn-advance-baja-mob" data-id="${baja.id}" data-target="disponible" style="background: rgba(29, 200, 109, 0.2); border: 1px solid rgba(29, 200, 109, 0.45); color: #1dc86d; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-check-circle"></i> Liberar a Disponible
                        </button>
                    `;
                } else {
                    actionBtnHtml = `<span style="font-size: 0.78rem; color: #1dc86d; font-weight: 700;"><i class="fas fa-check-circle"></i> Disponible</span>`;
                }

                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div>
                                <strong style="font-size: 0.94rem; color: var(--text-primary); display: block;">${escapeHtml(baja.nombre)}</strong>
                                <span style="font-family: monospace; color: #f59e0b; font-size: 0.8rem;">${escapeHtml(baja.rut || 'Sin RUT')}</span>
                            </div>
                            <span class="status-badge ${stateClass}" style="font-size: 0.72rem; padding: 3px 8px;">${stateLabel}</span>
                        </div>

                        <div style="background: var(--bg-sidebar); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="far fa-calendar-times"></i> Fecha Salida:</span>
                                <strong style="color: var(--text-primary);">${formatDate(baja.fecha_salida)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="fas fa-laptop"></i> Notebook:</span>
                                <strong style="color: var(--accent-blue); font-family: monospace;">S/N ${escapeHtml(baja.serial)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);"><i class="fas fa-user-tie"></i> Supervisor:</span>
                                <span style="color: var(--text-secondary);">${escapeHtml(baja.supervisor || '-')}</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-color);">
                            <button type="button" class="btn-historial-baja-mob" data-serial="${escapeHtml(baja.serial)}" style="background: none; border: 1px solid var(--border-color); color: #a78bfa; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-history"></i> Historial
                            </button>
                            ${actionBtnHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Attach action handlers
        document.querySelectorAll('.btn-advance-baja, .btn-advance-baja-mob').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const target = btn.getAttribute('data-target');
                advanceBajaStatus(id, target);
            });
        });

        document.querySelectorAll('.btn-historial-baja, .btn-historial-baja-mob').forEach(btn => {
            btn.addEventListener('click', () => {
                const serial = btn.getAttribute('data-serial');
                openSerialHistoryModal(serial);
            });
        });
    }

    async function advanceBajaStatus(bajaId, targetStatus) {
        const list = loadEquiposBajas();
        const index = list.findIndex(b => String(b.id) === String(bajaId));
        if (index === -1) return;

        const baja = list[index];
        baja.estado = targetStatus;
        saveEquiposBajas(list);

        const techName = currentSession ? currentSession.nombre : 'Soporte TI';

        if (targetStatus === 'recibido_preparacion') {
            // Actualizar estado del notebook a en_preparacion
            const eqIndex = allEquiposCached.findIndex(e => (e.serial || '').trim().toLowerCase() === (baja.serial || '').trim().toLowerCase());
            if (eqIndex !== -1) {
                allEquiposCached[eqIndex].estado = 'en_preparacion';
                await updateEquipo(allEquiposCached[eqIndex].id, { estado: 'en_preparacion' });
            }
            addEquiposMovement(
                baja.serial,
                'Notebook Recibido en Bodega TI',
                `El equipo físico fue recepcionado en manos de TI tras la desvinculación de <strong>${escapeHtml(baja.nombre)}</strong>. Pasa a revisión técnica y formateo de disco.`,
                techName,
                new Date().toISOString(),
                'dot-amber'
            );
            alert(`📥 ¡Confirmado! El notebook ${baja.serial} ha sido recibido físicamente en bodega TI.`);
        } else if (targetStatus === 'disponible') {
            // Liberar notebook en inventario
            const eqIndex = allEquiposCached.findIndex(e => (e.serial || '').trim().toLowerCase() === (baja.serial || '').trim().toLowerCase());
            if (eqIndex !== -1) {
                const targetEq = allEquiposCached[eqIndex];
                targetEq.usuario_nombre = 'S/A';
                targetEq.usuario_email = '';
                targetEq.estado = 'disponible';
                await updateEquipo(targetEq.id, {
                    usuario_nombre: 'S/A',
                    usuario_email: '',
                    estado: 'disponible'
                });
            }
            addEquiposMovement(
                baja.serial,
                'Reacondicionado y Liberado a Stock',
                `Revisión técnica y formateo completados. Notebook desvinculado de ${escapeHtml(baja.nombre)} y queda 🟢 <strong>DISPONIBLE</strong> en bodega TI para nuevos ingresos.`,
                techName,
                new Date().toISOString(),
                'dot-green'
            );
            alert(`🟢 ¡Excelente! El notebook ${baja.serial} ha sido liberado a DISPONIBLE y ya puede ser reservado para nuevos ingresos.`);
        }

        renderEquiposBajas();
        refreshEquipos();
    }

    // Modal Nueva Baja
    function openNuevaBajaModal() {
        const modal = document.getElementById('modal-nueva-baja');
        const form = document.getElementById('form-nueva-baja');
        if (form) form.reset();

        const searchInp = document.getElementById('baja-search-user');
        const autoResults = document.getElementById('baja-user-autocomplete-results');
        const manualSerialWrapper = document.getElementById('baja-manual-serial-wrapper');
        const manualSerialSelect = document.getElementById('baja-manual-serial-select');

        if (searchInp) searchInp.value = '';
        if (autoResults) {
            autoResults.innerHTML = '';
            autoResults.style.display = 'none';
        }
        if (manualSerialWrapper) manualSerialWrapper.style.display = 'none';

        document.getElementById('baja-user-nombre').value = '';
        document.getElementById('baja-user-rut').value = '';
        document.getElementById('baja-user-email').value = '';
        document.getElementById('baja-user-empresa').value = '';
        document.getElementById('baja-notebook-serial').textContent = 'S/A';
        document.getElementById('baja-notebook-modelo').textContent = '-';
        document.getElementById('baja-notebook-specs').textContent = '-';
        
        const badgeEl = document.getElementById('baja-notebook-status-badge');
        if (badgeEl) {
            badgeEl.className = 'status-badge';
            badgeEl.textContent = 'En espera';
            badgeEl.style.background = 'rgba(255,255,255,0.06)';
            badgeEl.style.color = 'var(--text-secondary)';
            badgeEl.style.borderColor = 'var(--border-color)';
        }

        const cardEl = document.getElementById('baja-detected-notebook-card');
        if (cardEl) {
            cardEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            cardEl.style.background = 'rgba(245, 158, 11, 0.06)';
        }

        // Llenar select manual de seriales por si acaso
        if (manualSerialSelect) {
            manualSerialSelect.innerHTML = `<option value="">-- Seleccionar Serial Manualmente --</option>` + 
                allEquiposCached.map(eq => `<option value="${escapeHtml(eq.serial)}">${escapeHtml(eq.serial)} — ${escapeHtml(eq.marca)} ${escapeHtml(eq.modelo)} (${escapeHtml(eq.usuario_nombre || 'Sin asignar')})</option>`).join('');
        }

        if (modal) modal.style.display = 'flex';
        
        // Auto-enfocar el buscador
        setTimeout(() => {
            if (searchInp) searchInp.focus();
        }, 150);
    }

    const btnOpenModalBaja = document.getElementById('btn-open-modal-baja');
    const btnCloseModalBaja = document.getElementById('btn-close-modal-baja');
    const btnCancelBaja = document.getElementById('btn-cancel-baja');
    const formNuevaBaja = document.getElementById('form-nueva-baja');
    const bajaSearchInput = document.getElementById('baja-search-user');
    const bajaAutocompleteDiv = document.getElementById('baja-user-autocomplete-results');

    if (btnOpenModalBaja) btnOpenModalBaja.addEventListener('click', openNuevaBajaModal);
    if (btnCloseModalBaja) btnCloseModalBaja.addEventListener('click', () => document.getElementById('modal-nueva-baja').style.display = 'none');
    if (btnCancelBaja) btnCancelBaja.addEventListener('click', () => document.getElementById('modal-nueva-baja').style.display = 'none');

    function renderBajaUserSuggestions(query = '') {
        if (!bajaAutocompleteDiv) return;
        const cleanQuery = normalizeStr(query);

        // Obtener lista consolidada de colaboradores
        const directoryUsers = (typeof DEFAULT_DIRECTORY_USERS !== 'undefined') ? DEFAULT_DIRECTORY_USERS : [];
        const inventoryUsers = allEquiposCached
            .filter(e => e.usuario_nombre && !e.usuario_nombre.toLowerCase().includes('s/a') && !e.usuario_nombre.toLowerCase().includes('auditoria'))
            .map(e => ({
                nombre: e.usuario_nombre,
                rut: '',
                email: e.usuario_email || '',
                empresa: e.empresa || 'T-Sales',
                serial: e.serial
            }));

        const combined = [...directoryUsers, ...inventoryUsers];
        const seen = new Set();
        const matches = [];

        combined.forEach(u => {
            const nameNorm = normalizeStr(u.nombre);
            const emailNorm = normalizeStr(u.email);
            const rutNorm = normalizeStr(u.rut);

            const isMatch = !cleanQuery || nameNorm.includes(cleanQuery) || emailNorm.includes(cleanQuery) || rutNorm.includes(cleanQuery);

            if (isMatch && !seen.has(nameNorm)) {
                seen.add(nameNorm);
                matches.push(u);
            }
        });

        if (matches.length === 0) {
            bajaAutocompleteDiv.innerHTML = `<div style="padding: 12px 14px; font-size: 0.82rem; color: var(--text-muted); text-align: center;"><i class="fas fa-user-slash" style="margin-right: 6px;"></i> No se encontraron colaboradores con "${escapeHtml(query)}"</div>`;
            bajaAutocompleteDiv.style.display = 'block';
            return;
        }

        bajaAutocompleteDiv.innerHTML = matches.slice(0, 10).map(u => `
            <div class="autocomplete-suggestion-item baja-user-match-item" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut || '')}" data-email="${escapeHtml(u.email || '')}" data-company="${escapeHtml(u.empresa || 'T-Sales')}" style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; transition: background 0.15s ease;">
                <div style="min-width: 0;">
                    <strong style="color: var(--text-primary); font-size: 0.88rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.nombre)}</strong>
                    <span style="color: var(--text-secondary); font-size: 0.74rem;">${escapeHtml(u.email || 'Sin correo')} · <span style="font-family: monospace; color: var(--accent-blue);">${escapeHtml(u.rut || 'Sin RUT')}</span></span>
                </div>
                <span class="autocomplete-badge ${getCompanyBadgeClass(u.empresa)}" style="font-size: 0.7rem; flex-shrink: 0; margin-left: 8px;">${escapeHtml(u.empresa || 'T-Sales')}</span>
            </div>
        `).join('');

        bajaAutocompleteDiv.style.display = 'block';

        bajaAutocompleteDiv.querySelectorAll('.baja-user-match-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = item.getAttribute('data-name');
                const rut = item.getAttribute('data-rut');
                const email = item.getAttribute('data-email');
                const company = item.getAttribute('data-company');

                selectBajaCollaborator({ nombre: name, rut: rut, email: email, empresa: company });
            });
        });
    }

    function selectBajaCollaborator(user) {
        if (bajaSearchInput) bajaSearchInput.value = user.nombre;
        if (bajaAutocompleteDiv) bajaAutocompleteDiv.style.display = 'none';

        const nameField = document.getElementById('baja-user-nombre');
        const rutField = document.getElementById('baja-user-rut');
        const emailField = document.getElementById('baja-user-email');
        const empresaField = document.getElementById('baja-user-empresa');

        if (nameField) nameField.value = user.nombre;
        if (rutField) rutField.value = user.rut || 'Sin RUT registrado';
        if (emailField) emailField.value = user.email || '';
        if (empresaField) empresaField.value = user.empresa || 'T-Sales';

        // DETECCIÓN INTELIGENTE DEL NOTEBOOK ASIGNADO
        const userNorm = normalizeStr(user.nombre);
        const emailNorm = normalizeStr(user.email);
        const userTokens = userNorm.split(/\s+/).filter(t => t.length > 2);

        let assignedEq = null;

        // 1. Coincidencia por correo corporativo exacto o contenido
        if (emailNorm && !assignedEq) {
            assignedEq = allEquiposCached.find(eq => {
                const eqEmailNorm = normalizeStr(eq.usuario_email);
                return eqEmailNorm && (eqEmailNorm === emailNorm || eqEmailNorm.includes(emailNorm) || emailNorm.includes(eqEmailNorm));
            });
        }

        // 2. Coincidencia por nombre completo exacto o contenido
        if (!assignedEq && userNorm) {
            assignedEq = allEquiposCached.find(eq => {
                const eqNameNorm = normalizeStr(eq.usuario_nombre);
                if (!eqNameNorm || eqNameNorm.includes('s/a') || eqNameNorm.includes('auditoria')) return false;
                return eqNameNorm === userNorm || eqNameNorm.includes(userNorm) || userNorm.includes(eqNameNorm);
            });
        }

        // 3. Coincidencia por tokens del nombre (nombre + primer apellido)
        if (!assignedEq && userTokens.length >= 2) {
            assignedEq = allEquiposCached.find(eq => {
                const eqNameNorm = normalizeStr(eq.usuario_nombre);
                if (!eqNameNorm || eqNameNorm.includes('s/a') || eqNameNorm.includes('auditoria')) return false;
                const matchCount = userTokens.filter(t => eqNameNorm.includes(t)).length;
                return matchCount >= 2;
            });
        }

        const serialEl = document.getElementById('baja-notebook-serial');
        const modeloEl = document.getElementById('baja-notebook-modelo');
        const specsEl = document.getElementById('baja-notebook-specs');
        const badgeEl = document.getElementById('baja-notebook-status-badge');
        const manualWrapper = document.getElementById('baja-manual-serial-wrapper');
        const cardEl = document.getElementById('baja-detected-notebook-card');

        if (assignedEq) {
            if (serialEl) serialEl.textContent = assignedEq.serial || 'S/A';
            if (modeloEl) modeloEl.textContent = `${assignedEq.marca || ''} ${assignedEq.modelo || ''}`;
            if (specsEl) specsEl.textContent = `${assignedEq.ram || ''} · ${assignedEq.disco_duro || ''} · ${assignedEq.sistema_operativo || ''}`;
            if (badgeEl) {
                badgeEl.className = 'status-badge status-activo';
                badgeEl.textContent = '🟢 Detectado & Asignado';
                badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
                badgeEl.style.color = '#10b981';
                badgeEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }
            if (cardEl) {
                cardEl.style.borderColor = '#10b981';
                cardEl.style.background = 'rgba(16, 185, 129, 0.08)';
            }
            if (manualWrapper) manualWrapper.style.display = 'none';
        } else {
            if (serialEl) serialEl.textContent = 'S/A (Sin serial previo)';
            if (modeloEl) modeloEl.textContent = 'Selecciona el serial abajo si fue entregado';
            if (specsEl) specsEl.textContent = '-';
            if (badgeEl) {
                badgeEl.className = 'status-badge status-mantenimiento';
                badgeEl.textContent = '🟠 Sin equipo previo';
                badgeEl.style.background = 'rgba(245, 158, 11, 0.15)';
                badgeEl.style.color = '#f59e0b';
                badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            }
            if (cardEl) {
                cardEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                cardEl.style.background = 'rgba(245, 158, 11, 0.06)';
            }
            if (manualWrapper) manualWrapper.style.display = 'block';
        }
    }

    // Event listeners para el buscador en vivo de bajas
    if (bajaSearchInput && bajaAutocompleteDiv) {
        bajaSearchInput.addEventListener('input', () => {
            renderBajaUserSuggestions(bajaSearchInput.value);
        });

        bajaSearchInput.addEventListener('focus', () => {
            renderBajaUserSuggestions(bajaSearchInput.value);
        });

        bajaSearchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            renderBajaUserSuggestions(bajaSearchInput.value);
        });

        // Ocultar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!bajaSearchInput.contains(e.target) && !bajaAutocompleteDiv.contains(e.target)) {
                bajaAutocompleteDiv.style.display = 'none';
            }
        });
    }

    if (formNuevaBaja) {
        formNuevaBaja.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('baja-user-nombre').value.trim();
            const rut = document.getElementById('baja-user-rut').value.trim();
            const email = document.getElementById('baja-user-email').value.trim();
            const empresa = document.getElementById('baja-user-empresa').value || 'T-Sales';
            const supervisor = document.getElementById('baja-supervisor').value.trim();
            const fecha = document.getElementById('baja-fecha').value;
            const notas = document.getElementById('baja-notas').value.trim();

            let serial = document.getElementById('baja-notebook-serial').textContent.trim();
            const manualSelect = document.getElementById('baja-manual-serial-select');
            if (serial === 'S/A' || serial.includes('No detectado') || !serial) {
                if (manualSelect && manualSelect.value) {
                    serial = manualSelect.value;
                }
            }

            if (!nombre) {
                alert('Por favor busca y selecciona al colaborador que deja la empresa.');
                return;
            }

            if (!serial || serial === 'S/A' || serial.includes('No detectado')) {
                alert('Por favor selecciona el número de serie del notebook a recuperar.');
                return;
            }

            const eq = allEquiposCached.find(e => (e.serial || '').trim().toLowerCase() === serial.toLowerCase());
            const notebookInfo = eq ? `${eq.marca} ${eq.modelo} (${eq.ram} / ${eq.disco_duro})` : `S/N: ${serial}`;

            const newBaja = {
                id: 'baja-' + Date.now(),
                nombre: nombre,
                rut: rut,
                email: email,
                empresa: empresa,
                supervisor: supervisor,
                fecha_salida: fecha,
                serial: serial,
                notebook_info: notebookInfo,
                estado: 'pendiente_devolucion',
                notas: notas,
                created_at: new Date().toISOString()
            };

            const list = loadEquiposBajas();
            list.unshift(newBaja);
            saveEquiposBajas(list);

            // Actualizar estado del notebook a pendiente_devolucion en inventario
            const eqIndex = allEquiposCached.findIndex(e => (e.serial || '').trim().toLowerCase() === serial.toLowerCase());
            if (eqIndex !== -1) {
                allEquiposCached[eqIndex].estado = 'pendiente_devolucion';
                await updateEquipo(allEquiposCached[eqIndex].id, { estado: 'pendiente_devolucion' });
            }

            // Registrar movimiento en historial
            addEquiposMovement(
                serial,
                'Registro de Baja de Colaborador',
                `El colaborador <strong>${escapeHtml(nombre)}</strong> deja la empresa (${escapeHtml(empresa)}). Notebook queda en estado <strong>🟠 Pendiente de Devolución Física a TI</strong>. Supervisor reportante: ${escapeHtml(supervisor)}.`,
                currentSession ? currentSession.nombre : 'Soporte TI',
                new Date().toISOString(),
                'dot-amber'
            );

            document.getElementById('modal-nueva-baja').style.display = 'none';
            alert(`¡Baja de ${nombre} registrada con éxito! El notebook ${serial} ahora figura como Pendiente de Devolución.`);
            renderEquiposBajas();
            refreshEquipos();
        });
    }

    const bajasSearchInput = document.getElementById('bajas-search-input');
    const bajasFilterEmp = document.getElementById('bajas-filter-empresa');
    const bajasFilterEst = document.getElementById('bajas-filter-estado');
    if (bajasSearchInput) bajasSearchInput.addEventListener('input', renderEquiposBajas);
    if (bajasFilterEmp) bajasFilterEmp.addEventListener('change', renderEquiposBajas);
    if (bajasFilterEst) bajasFilterEst.addEventListener('change', renderEquiposBajas);

    // Initial load for Ingresos and Bajas badges
    try {
        loadEquiposIngresos();
        loadEquiposBajas();
        loadEquiposMovements();
    } catch (e) {
        console.error(e);
    }

    // ============================================
    // SISTEMA DE ROLES Y CONTROL DE ACCESO (SESSION)
    // ============================================
    function applySession(session, refreshData = true) {
        if (!session) return;
        currentSession = session;
        
        // Guardar sesión en localStorage
        localStorage.setItem('session_soporte', JSON.stringify(session));

        // Ocultar modal de login si estuviera abierto
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'none';

        // Actualizar datos del header y dropdown de cuenta
        const headerName = document.getElementById('header-user-name');
        const headerRole = document.getElementById('header-user-role');
        const headerAvatar = document.getElementById('header-user-avatar');
        const dropdownName = document.getElementById('dropdown-user-name') || document.getElementById('header-dropdown-name');
        const dropdownEmail = document.getElementById('dropdown-user-email') || document.getElementById('header-dropdown-email');

        const navBase = document.getElementById('nav-base-conocimientos');
        const navUsuarios = document.getElementById('nav-usuarios');
        const creatorGroup = document.getElementById('ticket-creator-group');
        const belforPanel = document.getElementById('belfor-metrics-panel');

        const userName = session.nombre || 'Belfor Aburto';
        const userEmail = session.email || 'belfor.aburto@t-sales.cl';
        const initials = userName.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BA';

        if (headerName) headerName.textContent = userName;
        if (headerAvatar) headerAvatar.innerHTML = `<span>${initials}</span>`;
        if (dropdownName) dropdownName.textContent = userName;
        if (dropdownEmail) dropdownEmail.textContent = userEmail;

        const isAdmin = session.role === 'admin' || (userEmail && (userEmail.includes('felipe') || userEmail.includes('omar') || userEmail.includes('belfor')));

        if (isAdmin) {
            session.role = 'admin';
            if (headerRole) headerRole.textContent = 'Soporte TI';
            if (navBase) navBase.style.display = 'block';
            if (navUsuarios) navUsuarios.style.display = 'block';
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = (userName.toLowerCase().includes('belfor')) ? 'block' : 'none';
        } else if (session.role === 'technician') {
            if (headerRole) headerRole.textContent = 'Técnico Soporte';
            if (navBase) navBase.style.display = 'block';
            if (navUsuarios) navUsuarios.style.display = 'block';
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = 'none';
        } else {
            if (headerRole) headerRole.textContent = `RUT: ${session.rut || ''}`;
            if (navBase) navBase.style.display = 'none';
            if (navUsuarios) navUsuarios.style.display = 'none';
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = 'none';
        }

        syncQuickAccessButtons();

        if (refreshData) {
            refreshTickets().catch(err => console.error('Error al refrescar tickets:', err));
            refreshEquipos().catch(err => console.error('Error al refrescar equipos:', err));
        }

        // Configurar vista de Chat según rol
        const chatAdminContainer = document.getElementById('chat-admin-container');
        const chatUserContainer = document.getElementById('chat-user-container');
        if (session.role === 'admin' || session.role === 'technician') {
            if (chatAdminContainer) chatAdminContainer.style.display = 'block';
            if (chatUserContainer) chatUserContainer.style.display = 'none';
            if (typeof initAdminChat === 'function') {
                try { initAdminChat(); } catch(e) {}
            }
        } else {
            if (chatAdminContainer) chatAdminContainer.style.display = 'none';
            if (chatUserContainer) chatUserContainer.style.display = 'block';
            if (typeof initUserChat === 'function') {
                try { initUserChat(); } catch(e) {}
            }
        }
        
        try {
            prefillTicketClientFields();
        } catch(e) {}
    }

    function prefillTicketClientFields() {
        const clientNameInput = document.getElementById('ticket-client-name');
        const clientRutInput = document.getElementById('ticket-client-rut');
        const clientEmailInput = document.getElementById('ticket-client-email');

        if (clientNameInput && clientRutInput && clientEmailInput) {
            if (currentSession) {
                // If it's a regular user, prefill their details and lock them.
                if (currentSession.role === 'user') {
                    clientNameInput.value = currentSession.nombre || '';
                    clientRutInput.value = currentSession.rut || '';
                    clientEmailInput.value = currentSession.email || '';
                    
                    clientNameInput.readOnly = true;
                    clientRutInput.readOnly = true;
                    clientEmailInput.readOnly = true;
                    
                    clientNameInput.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    clientRutInput.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    clientEmailInput.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    clientNameInput.style.cursor = 'not-allowed';
                    clientRutInput.style.cursor = 'not-allowed';
                    clientEmailInput.style.cursor = 'not-allowed';
                } else {
                    // For admin or technician, leave empty for easy collaborator search or allow typing
                    if (!clientNameInput.value) {
                        clientNameInput.value = '';
                        clientRutInput.value = '';
                        clientEmailInput.value = '';
                    }
                    
                    clientNameInput.readOnly = false;
                    clientRutInput.readOnly = false;
                    clientEmailInput.readOnly = false;
                    
                    clientNameInput.style.backgroundColor = 'var(--bg-sidebar)';
                    clientRutInput.style.backgroundColor = 'var(--bg-sidebar)';
                    clientEmailInput.style.backgroundColor = 'var(--bg-sidebar)';
                    clientNameInput.style.cursor = 'text';
                    clientRutInput.style.cursor = 'text';
                    clientEmailInput.style.cursor = 'text';
                }
            } else {
                clientNameInput.value = '';
                clientRutInput.value = '';
                clientEmailInput.value = '';
                
                clientNameInput.readOnly = false;
                clientRutInput.readOnly = false;
                clientEmailInput.readOnly = false;
                
                clientNameInput.style.backgroundColor = 'var(--bg-sidebar)';
                clientRutInput.style.backgroundColor = 'var(--bg-sidebar)';
                clientEmailInput.style.backgroundColor = 'var(--bg-sidebar)';
                clientNameInput.style.cursor = 'text';
                clientRutInput.style.cursor = 'text';
                clientEmailInput.style.cursor = 'text';
            }
        }
        prefillAssignedTech();
    }

    function prefillAssignedTech() {
        const techSelect = document.getElementById('ticket-assigned-tech');
        const creatorSelect = document.getElementById('ticket-creator-select');
        
        if (currentSession && currentSession.nombre) {
            const sessionName = (currentSession.nombre || '').trim();
            const lowerSessionName = sessionName.toLowerCase();
            
            // 1. Preseleccionar automáticamente el técnico logueado
            if (techSelect) {
                let matched = false;
                for (let i = 0; i < techSelect.options.length; i++) {
                    const optVal = (techSelect.options[i].value || '').trim().toLowerCase();
                    const optTxt = (techSelect.options[i].text || '').trim().toLowerCase();
                    if (optVal && (optVal === lowerSessionName || lowerSessionName.includes(optVal) || optVal.includes(lowerSessionName) || optTxt.includes(lowerSessionName))) {
                        techSelect.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                
                // Si el usuario logueado no está en las opciones fijas, agregarlo dinámicamente y seleccionarlo
                if (!matched && sessionName) {
                    const newOpt = document.createElement('option');
                    newOpt.value = sessionName;
                    newOpt.textContent = `${sessionName} (${currentSession.role === 'admin' ? 'Soporte TI' : 'Ejecutivo'})`;
                    techSelect.appendChild(newOpt);
                    newOpt.selected = true;
                }
            }
            
            // 2. Preseleccionar en selector de creador si existe
            if (creatorSelect) {
                let creatorMatched = false;
                for (let i = 0; i < creatorSelect.options.length; i++) {
                    const optVal = (creatorSelect.options[i].value || '').trim().toLowerCase();
                    const optTxt = (creatorSelect.options[i].text || '').trim().toLowerCase();
                    if (optVal && (optVal === lowerSessionName || lowerSessionName.includes(optVal) || optVal.includes(lowerSessionName) || optTxt.includes(lowerSessionName))) {
                        creatorSelect.selectedIndex = i;
                        creatorMatched = true;
                        break;
                    }
                }
                if (!creatorMatched && sessionName) {
                    const newOpt = document.createElement('option');
                    newOpt.value = sessionName;
                    newOpt.textContent = sessionName;
                    creatorSelect.appendChild(newOpt);
                    newOpt.selected = true;
                }
            }
        }
    }

    // Manejo de tabs en el login modal
    window.switchLoginTab = function(tab) {
        const tabUser = document.getElementById('tab-login-user');
        const tabAdmin = document.getElementById('tab-login-admin');
        const formUser = document.getElementById('form-login-user');
        const formAdmin = document.getElementById('form-login-admin');

        if (tab === 'admin') {
            if (tabAdmin) {
                tabAdmin.style.backgroundColor = 'var(--accent-blue)';
                tabAdmin.style.color = 'white';
            }
            if (tabUser) {
                tabUser.style.backgroundColor = 'transparent';
                tabUser.style.color = 'var(--text-secondary)';
            }
            if (formAdmin) formAdmin.style.display = 'block';
            if (formUser) formUser.style.display = 'none';
        } else {
            if (tabUser) {
                tabUser.style.backgroundColor = 'var(--accent-blue)';
                tabUser.style.color = 'white';
            }
            if (tabAdmin) {
                tabAdmin.style.backgroundColor = 'transparent';
                tabAdmin.style.color = 'var(--text-secondary)';
            }
            if (formUser) formUser.style.display = 'block';
            if (formAdmin) formAdmin.style.display = 'none';
        }
    };

    const tabUser = document.getElementById('tab-login-user');
    const tabAdmin = document.getElementById('tab-login-admin');
    if (tabUser) tabUser.addEventListener('click', () => window.switchLoginTab('user'));
    if (tabAdmin) tabAdmin.addEventListener('click', () => window.switchLoginTab('admin'));

    // Función auxiliar de autenticación unificada
    async function authenticateUser(email, pass, requiredRole = null) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPass = (pass || '').trim();

        if (!cleanEmail || !cleanPass) return null;

        // 1. Validar Belfor Aburto (Admin)
        if (cleanEmail === 'belfor.aburto@t-sales.cl' || cleanEmail === 'belfor.aburto' || cleanEmail === 'belfor') {
            if (cleanPass === '143belfor@') {
                return {
                    role: 'admin',
                    nombre: 'Belfor Aburto',
                    email: 'belfor.aburto@t-sales.cl',
                    rut: 'belfor'
                };
            }
            return null; // Contraseña incorrecta para Belfor
        }

        // 2. Validar Felipe Olivares (Admin)
        if (cleanEmail === 'felipe.olivares@t-sales.cl' || cleanEmail === 'felipe.olivares' || cleanEmail === 'felipe') {
            if (cleanPass === 'felipe2026@@') {
                return {
                    role: 'admin',
                    nombre: 'Felipe Olivares',
                    email: 'felipe.olivares@t-sales.cl',
                    rut: 'felipe'
                };
            }
            return null; // Contraseña incorrecta para Felipe
        }

        // 3. Validar Omar Gálvez (Admin)
        if (cleanEmail === 'omar.galvez@t-sales.cl' || cleanEmail === 'omar.galvez' || cleanEmail === 'omar') {
            if (cleanPass === 'omar2026@##') {
                return {
                    role: 'admin',
                    nombre: 'Omar Gálvez',
                    email: 'omar.galvez@t-sales.cl',
                    rut: 'omar'
                };
            }
            return null; // Contraseña incorrecta para Omar
        }

        // 4. Validar en lista dinámica de usuarios
        const users = await loadPlatformUsers();
        const found = users.find(u => u.email && u.email.toLowerCase() === cleanEmail && u.password === cleanPass);
        if (found) {
            return {
                role: (found.email.includes('felipe') || found.email.includes('omar') || found.email.includes('belfor')) ? 'admin' : (found.role || 'technician'),
                nombre: found.nombre,
                email: found.email,
                rut: found.rut || 'usuario'
            };
        }
        return null;
    }

    // Función unificada de Login ejecutable desde botón o submit
    window.doLogin = async function(type) {
        const isTech = (type === 'user');
        const emailInput = document.getElementById(isTech ? 'login-tech-email' : 'login-admin-email');
        const passInput = document.getElementById(isTech ? 'login-tech-pass' : 'login-admin-pass');
        
        let email = (emailInput ? emailInput.value : '').trim();
        let pass = (passInput ? passInput.value : '').trim();

        if (!email) {
            alert('Por favor ingresa tu correo electrónico.');
            if (emailInput) emailInput.focus();
            return;
        }

        if (!pass) {
            alert('Por favor ingresa tu contraseña.');
            if (passInput) passInput.focus();
            return;
        }

        const session = await authenticateUser(email, pass, isTech ? null : 'admin');
        if (session) {
            localStorage.setItem('session_soporte', JSON.stringify(session));
            applySession(session);
        } else {
            alert('Correo o contraseña incorrectos. Por favor verifica tus credenciales.');
        }
    };

    // Submit de Login Técnico
    const formUser = document.getElementById('form-login-user');
    if (formUser) {
        formUser.addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.doLogin('user');
        });
    }

    // Submit de Login Administrador
    const formAdmin = document.getElementById('form-login-admin');
    if (formAdmin) {
        formAdmin.addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.doLogin('admin');
        });
    }

    // Botón de Cerrar Sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.removeItem('session_soporte');
            removeSessionStorageItem('m365_unlocked');
            isM365Unlocked = false;
            currentSession = null;
            
            const userDropdown = document.getElementById('header-user-dropdown');
            if (userDropdown) userDropdown.style.display = 'none';

            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'flex';
                const techEmail = document.getElementById('login-tech-email');
                const techPass = document.getElementById('login-tech-pass');
                const adminEmail = document.getElementById('login-admin-email');
                const adminPass = document.getElementById('login-admin-pass');
                if (techEmail) techEmail.value = '';
                if (techPass) techPass.value = '';
                if (adminEmail) adminEmail.value = '';
                if (adminPass) adminPass.value = '';
            } else {
                location.reload();
            }
        });
    }

    // ============================================
    // SISTEMA DE CHAT EN VIVO (LIVE CHAT)
    // ============================================
    const defaultChats = [
        {
            id: "CHT-2024-0058",
            name: "Ana Martínez",
            email: "ana.martinez@empresa.com",
            since: "15/03/2023",
            started: "10:24 AM",
            channel: "Web",
            status: "activo",
            agent: "Diego Castro",
            unread: 0,
            online: true,
            messages: [
                { sender: 'user', text: 'Hola, tengo problemas para conectarme a la VPN de la empresa. Me da error de credenciales.', time: '10:24 AM' },
                { sender: 'agent', text: 'Hola Ana, buenos días. ¿Podrías confirmar si estás usando el cliente Cisco AnyConnect o FortiClient?', time: '10:26 AM' },
                { sender: 'user', text: 'Estoy usando Cisco AnyConnect. Ya probé reiniciando la laptop y sigue igual.', time: '10:27 AM' },
                { sender: 'agent', text: 'Perfecto. He revisado tu cuenta en Active Directory y veo que tu contraseña caducó ayer. Voy a enviarte un enlace temporal de autoservicio para restablecerla.', time: '10:29 AM' }
            ]
        },
        {
            id: "CHT-2024-0059",
            name: "Juan Rodríguez",
            email: "juan.rodriguez@empresa.com",
            since: "10/01/2022",
            started: "10:05 AM",
            channel: "Web",
            status: "activo",
            agent: "Carlos Gómez",
            unread: 2,
            online: true,
            messages: [
                { sender: 'user', text: 'Hola, mi Excel se congela cuando intento abrir un archivo compartido.', time: '10:05 AM' },
                { sender: 'agent', text: 'Hola Juan, por favor intenta abrir Excel en modo seguro presionando la tecla Ctrl mientras inicias la aplicación.', time: '10:08 AM' },
                { sender: 'user', text: 'Ya lo intenté y sigue igual. ¿Qué más puedo hacer?', time: '10:12 AM' },
                { sender: 'user', text: 'Además me urge porque es el reporte de fin de mes.', time: '10:13 AM' }
            ]
        },
        {
            id: "CHT-2024-0060",
            name: "Laura Méndez",
            email: "laura.mendez@empresa.com",
            since: "05/11/2021",
            started: "09:45 AM",
            channel: "Web",
            status: "activo",
            agent: "Diego Castro",
            unread: 0,
            online: false,
            messages: [
                { sender: 'user', text: 'Hola, ¿dónde puedo solicitar la instalación de una licencia de MS Project?', time: '09:45 AM' },
                { sender: 'agent', text: 'Hola Laura, debes generar una solicitud formal en la pestaña "Crear Ticket" adjuntando la aprobación de tu jefe de área.', time: '09:48 AM' },
                { sender: 'user', text: 'Entendido, muchas gracias. Ya acabo de enviar el ticket.', time: '09:50 AM' }
            ]
        },
        {
            id: "CHT-2024-0061",
            name: "Roberto Pinto",
            email: "roberto.pinto@empresa.com",
            since: "18/06/2024",
            started: "09:15 AM",
            channel: "Web",
            status: "cerrado",
            agent: "Administrador",
            unread: 0,
            online: false,
            messages: [
                { sender: 'user', text: 'Tengo problemas con la impresora del segundo piso. No saca impresiones a color.', time: '09:15 AM' },
                { sender: 'agent', text: 'Hola Roberto, la impresora del segundo piso tuvo un atasco en los inyectores de color. El técnico ya lo solucionó. ¿Podrías intentar imprimir de nuevo?', time: '09:25 AM' },
                { sender: 'user', text: 'Sí, ya funcionó perfecto. Muchas gracias.', time: '09:30 AM' }
            ]
        }
    ];

    let activeAdminChatId = null;

    // Obtener los chats de LocalStorage o inicializarlos
    function getChatsData() {
        let chats = localStorage.getItem('local_chats');
        if (!chats) {
            localStorage.setItem('local_chats', JSON.stringify(defaultChats));
            return defaultChats;
        }
        return JSON.parse(chats);
    }

    function saveChatsData(chats) {
        localStorage.setItem('local_chats', JSON.stringify(chats));
    }

    // Inicialización del Chat del Administrador
    window.initAdminChat = function() {
        const chats = getChatsData();
        
        // Si no hay chat activo seleccionado, elegir el primero activo
        if (!activeAdminChatId && chats.length > 0) {
            activeAdminChatId = chats[0].id;
        }

        renderChatThreads();
        loadActiveChatWindow();
        updateChatStats();

        // Configurar los listeners (solo una vez para evitar duplicar)
        setupAdminChatListeners();
    };

    // Actualizar métricas del administrador
    function updateChatStats() {
        const chats = getChatsData();
        const activeCount = chats.filter(c => c.status === 'activo').length;
        const statActive = document.getElementById('chat-stat-active');
        if (statActive) {
            statActive.textContent = activeCount;
        }
    }

    // Renderizar hilos en el sidebar
    function renderChatThreads(filterQuery = '') {
        const threadsContainer = document.getElementById('chat-threads-container');
        if (!threadsContainer) return;

        const chats = getChatsData();
        threadsContainer.innerHTML = '';

        const query = filterQuery.toLowerCase().trim();
        const filtered = chats.filter(chat => 
            chat.name.toLowerCase().includes(query) || 
            chat.id.toLowerCase().includes(query) ||
            chat.messages.some(m => m.text.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            threadsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No se encontraron chats</div>';
            return;
        }

        filtered.forEach(chat => {
            const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : { text: 'Sin mensajes', time: '' };
            const initials = chat.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            const threadItem = document.createElement('div');
            threadItem.className = `chat-thread-item ${chat.id === activeAdminChatId ? 'active' : ''}`;
            threadItem.setAttribute('data-id', chat.id);

            // Unread badge html
            const badgeHtml = chat.unread > 0 ? `<span class="chat-thread-badge">${chat.unread}</span>` : '';
            // Online status dot class
            const statusDotClass = chat.online ? '' : 'offline';

            threadItem.innerHTML = `
                <div class="chat-thread-avatar">${initials}</div>
                <span class="chat-thread-status-dot ${statusDotClass}"></span>
                <div class="chat-thread-info">
                    <div class="chat-thread-title-bar">
                        <span class="chat-thread-name">${chat.name}</span>
                        <span class="chat-thread-time">${lastMsg.time}</span>
                    </div>
                    <div class="chat-thread-preview-bar">
                        <span class="chat-thread-preview">${lastMsg.text}</span>
                        ${badgeHtml}
                    </div>
                </div>
            `;

            threadItem.addEventListener('click', () => {
                selectChatThread(chat.id);
            });

            threadsContainer.appendChild(threadItem);
        });
    }

    // Seleccionar un hilo de chat
    function selectChatThread(chatId) {
        activeAdminChatId = chatId;
        
        // Limpiar unread badge
        const chats = getChatsData();
        const chatIdx = chats.findIndex(c => c.id === chatId);
        if (chatIdx !== -1) {
            chats[chatIdx].unread = 0;
            saveChatsData(chats);
        }

        renderChatThreads();
        loadActiveChatWindow();
        updateChatStats();
    }

    // Cargar la conversación del chat activo en la vista admin
    function loadActiveChatWindow() {
        const chats = getChatsData();
        const chat = chats.find(c => c.id === activeAdminChatId);
        if (!chat) return;

        // 1. Cargar Header Central
        const activeAvatar = document.getElementById('chat-active-avatar');
        const activeName = document.getElementById('chat-active-name');
        const activeStatus = document.getElementById('chat-active-status');
        const assignSelect = document.getElementById('chat-assign-agent-select');

        const initials = chat.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (activeAvatar) activeAvatar.textContent = initials;
        if (activeName) activeName.textContent = chat.name;
        
        if (activeStatus) {
            if (chat.online) {
                activeStatus.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background-color: var(--accent-green); display: inline-block;"></span> En línea';
                activeStatus.style.color = 'var(--accent-green)';
            } else {
                activeStatus.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background-color: var(--text-muted); display: inline-block;"></span> Desconectado';
                activeStatus.style.color = 'var(--text-muted)';
            }
        }

        if (assignSelect) {
            // Asignar el valor seleccionado en base al agente actual
            const agentVal = chat.agent.toLowerCase().includes('diego') ? 'diego' : 
                             chat.agent.toLowerCase().includes('carlos') ? 'carlos' : 
                             chat.agent.toLowerCase().includes('admin') ? 'admin' : 'diego';
            assignSelect.value = agentVal;
        }

        // 2. Cargar Ficha Lateral Derecha
        const infoAvatar = document.getElementById('chat-info-avatar');
        const infoName = document.getElementById('chat-info-name');
        const infoEmail = document.getElementById('chat-info-email');
        const infoId = document.getElementById('chat-info-id');
        const infoStarted = document.getElementById('chat-info-started');

        if (infoAvatar) infoAvatar.textContent = initials;
        if (infoName) infoName.textContent = chat.name;
        if (infoEmail) infoEmail.textContent = chat.email;
        if (infoId) infoId.textContent = `#${chat.id}`;
        if (infoStarted) infoStarted.textContent = chat.started;

        // Cambiar estado en la ficha lateral
        const detailsContainer = document.querySelector('.chat-details-col');
        if (detailsContainer) {
            // Actualizar el estado y agente en el texto estático
            const startedSpan = detailsContainer.querySelector('#chat-info-started');
            if (startedSpan) startedSpan.textContent = chat.started;
            
            // Buscar y actualizar badge de estado y agente asignado
            const badge = detailsContainer.querySelector('.status-badge');
            if (badge) {
                badge.className = `status-badge ${chat.status === 'activo' ? 'status-activo' : 'status-cerrado'}`;
                badge.textContent = chat.status === 'activo' ? 'En curso' : 'Finalizado';
                badge.style.backgroundColor = chat.status === 'activo' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                badge.style.color = chat.status === 'activo' ? 'var(--accent-blue)' : '#ef4444';
            }

            // Agente asignado en texto
            const detailLabels = detailsContainer.querySelectorAll('.chat-details-card span');
            detailLabels.forEach((span, idx) => {
                if (span.textContent.trim() === 'Agente asignado') {
                    const valSpan = span.nextElementSibling;
                    if (valSpan) {
                        valSpan.innerHTML = `<i class="fas fa-user-tie" style="color: var(--accent-purple); font-size: 0.9rem;"></i> ${chat.agent}`;
                    }
                }
            });
        }

        // 3. Renderizar Mensajes
        const messagesContainer = document.getElementById('chat-messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            
            chat.messages.forEach(msg => {
                const row = document.createElement('div');
                const isSent = msg.sender === 'agent';
                row.className = `chat-message-row ${isSent ? 'sent' : 'received'}`;

                const bubbleClass = isSent ? 'chat-bubble-sent' : 'chat-bubble-received';

                // Doble check para mensajes del agente
                const ticksHtml = isSent ? '<i class="fas fa-check-double" style="margin-left: 4px;"></i>' : '';

                row.innerHTML = `
                    <div class="chat-message-bubble ${bubbleClass}">
                        <div class="chat-message-text">${msg.text}</div>
                        <div class="chat-message-time-bar">
                            <span>${msg.time}</span>
                            ${ticksHtml}
                        </div>
                    </div>
                `;
                messagesContainer.appendChild(row);
            });

            // Si está cerrado el chat, añadir mensaje del sistema y deshabilitar controles
            const messageInput = document.getElementById('chat-admin-message-input');
            const submitBtn = document.querySelector('#chat-admin-send-form button[type="submit"]');

            if (chat.status === 'cerrado') {
                const systemRow = document.createElement('div');
                systemRow.style.width = '100%';
                systemRow.style.textAlign = 'center';
                systemRow.style.margin = '15px 0';
                systemRow.style.fontSize = '0.78rem';
                systemRow.style.color = '#ef4444';
                systemRow.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                systemRow.style.padding = '8px 12px';
                systemRow.style.borderRadius = '8px';
                systemRow.style.border = '1px solid rgba(239, 68, 68, 0.1)';
                systemRow.innerHTML = '<i class="fas fa-info-circle"></i> Esta conversación ha sido finalizada por el agente.';
                messagesContainer.appendChild(systemRow);

                if (messageInput) {
                    messageInput.disabled = true;
                    messageInput.placeholder = "Este chat se encuentra cerrado...";
                }
                if (submitBtn) submitBtn.disabled = true;
            } else {
                if (messageInput) {
                    messageInput.disabled = false;
                    messageInput.placeholder = "Escribe un mensaje...";
                }
                if (submitBtn) submitBtn.disabled = false;
            }

            // Scroll al final
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Enviar mensaje Administrador
    function sendAdminMessage(text) {
        if (!text.trim() || !activeAdminChatId) return;

        const chats = getChatsData();
        const chatIdx = chats.findIndex(c => c.id === activeAdminChatId);
        if (chatIdx === -1 || chats[chatIdx].status === 'cerrado') return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        chats[chatIdx].messages.push({
            sender: 'agent',
            text: text,
            time: timeStr
        });

        saveChatsData(chats);
        loadActiveChatWindow();
        renderChatThreads();
    }

    // Configurar listeners de Admin Chat
    let adminListenersBound = false;
    function setupAdminChatListeners() {
        if (adminListenersBound) return; // Evitar adjuntar múltiples veces

        // Formulario de envío
        const sendForm = document.getElementById('chat-admin-send-form');
        if (sendForm) {
            sendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-admin-message-input');
                if (input && input.value.trim()) {
                    sendAdminMessage(input.value.trim());
                    input.value = '';
                }
            });
        }

        // Buscador de chats
        const searchInput = document.getElementById('chat-thread-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderChatThreads(e.target.value);
            });
        }

        // Select de asignación de agente
        const assignSelect = document.getElementById('chat-assign-agent-select');
        if (assignSelect) {
            assignSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                const chats = getChatsData();
                const chatIdx = chats.findIndex(c => c.id === activeAdminChatId);
                if (chatIdx !== -1) {
                    let agentName = 'Administrador';
                    if (val === 'diego') agentName = 'Diego Castro';
                    if (val === 'carlos') agentName = 'Carlos Gómez';

                    chats[chatIdx].agent = agentName;
                    
                    // Agregar mensaje del sistema de transferencia
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    chats[chatIdx].messages.push({
                        sender: 'system',
                        text: `El chat fue transferido al agente: ${agentName}`,
                        time: timeStr
                    });

                    saveChatsData(chats);
                    loadActiveChatWindow();
                }
            });
        }

        // Botones de acciones rápidas
        const btnArticle = document.getElementById('btn-chat-action-article');
        if (btnArticle) {
            btnArticle.addEventListener('click', () => {
                sendAdminMessage("Te comparto el artículo de soporte sobre VPN: [Cómo configurar VPN Corporativa y resolver problemas comunes](file:///c:/Users/T-Sales/Desktop/MEGA%20PROYECTO%20SOPORTE/soporte.html#tutoriales)");
            });
        }

        const btnTutorial = document.getElementById('btn-chat-action-tutorial');
        if (btnTutorial) {
            btnTutorial.addEventListener('click', () => {
                sendAdminMessage("Te sugiero revisar este tutorial paso a paso: [Guía para solucionar congelamientos en Microsoft Excel](file:///c:/Users/T-Sales/Desktop/MEGA%20PROYECTO%20SOPORTE/soporte.html#tutoriales)");
            });
        }

        const btnTransfer = document.getElementById('btn-chat-action-transfer');
        if (btnTransfer) {
            btnTransfer.addEventListener('click', () => {
                // Simplemente toggle entre agentes
                const select = document.getElementById('chat-assign-agent-select');
                if (select) {
                    const currentIdx = select.selectedIndex;
                    const nextIdx = (currentIdx + 1) % select.options.length;
                    select.selectedIndex = nextIdx === 0 ? 1 : nextIdx; // Evitar la primera opción "Asignar a"
                    select.dispatchEvent(new Event('change'));
                }
            });
        }

        const btnClose = document.getElementById('btn-chat-action-close');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                const chats = getChatsData();
                const chatIdx = chats.findIndex(c => c.id === activeAdminChatId);
                if (chatIdx !== -1) {
                    chats[chatIdx].status = 'cerrado';
                    saveChatsData(chats);
                    loadActiveChatWindow();
                    renderChatThreads();
                }
            });
        }

        adminListenersBound = true;
    }


    // ============================================
    // SECCIÓN CHAT DEL USUARIO COMÚN
    // ============================================
    const welcomeMessages = [
        { sender: 'agent', text: '¡Hola! Bienvenido al canal de Soporte en Vivo corporativo. ¿En qué puedo ayudarte hoy?', time: '10:24 AM' }
    ];

    function getUserMessages() {
        let msgs = localStorage.getItem('user_chat_messages');
        if (!msgs) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const copyWelcome = JSON.parse(JSON.stringify(welcomeMessages));
            copyWelcome[0].time = timeStr;
            localStorage.setItem('user_chat_messages', JSON.stringify(copyWelcome));
            return copyWelcome;
        }
        return JSON.parse(msgs);
    }

    function saveUserMessages(msgs) {
        localStorage.setItem('user_chat_messages', JSON.stringify(msgs));
    }

    // Inicialización del Chat del Usuario
    window.initUserChat = function() {
        renderUserChatWindow();
        setupUserChatListeners();
    };

    // Renderizar mensajes del usuario
    function renderUserChatWindow() {
        const container = document.getElementById('user-chat-messages-container');
        if (!container) return;

        const msgs = getUserMessages();
        container.innerHTML = '';

        msgs.forEach(msg => {
            const row = document.createElement('div');
            const isSent = msg.sender === 'user';
            row.className = `chat-message-row ${isSent ? 'sent' : 'received'}`;

            const bubbleClass = isSent ? 'chat-bubble-sent' : 'chat-bubble-received';

            // Doble check para mensajes del usuario
            const ticksHtml = isSent ? '<i class="fas fa-check-double" style="margin-left: 4px;"></i>' : '';

            row.innerHTML = `
                <div class="chat-message-bubble ${bubbleClass}">
                    <div class="chat-message-text">${msg.text}</div>
                    <div class="chat-message-time-bar">
                        <span>${msg.time}</span>
                        ${ticksHtml}
                    </div>
                </div>
            `;
            container.appendChild(row);
        });

        container.scrollTop = container.scrollHeight;
    }

    // Enviar mensaje Usuario
    function sendUserMessage(text) {
        if (!text.trim()) return;

        const msgs = getUserMessages();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgs.push({
            sender: 'user',
            text: text,
            time: timeStr
        });

        saveUserMessages(msgs);
        renderUserChatWindow();

        // Simular escritura y respuesta del bot/agente técnico
        simulateAgentTypingAndResponse(text);
    }

    // Simulación de escritura y respuesta del bot
    function simulateAgentTypingAndResponse(userText) {
        const container = document.getElementById('user-chat-messages-container');
        if (!container) return;

        // Añadir indicador de escribiendo
        const typingRow = document.createElement('div');
        typingRow.className = 'chat-message-row received';
        typingRow.id = 'chat-typing-indicator';
        typingRow.innerHTML = `
            <div class="chat-message-bubble chat-bubble-received" style="display: flex; gap: 4px; align-items: center; padding: 10px 14px;">
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
            </div>
        `;
        container.appendChild(typingRow);
        container.scrollTop = container.scrollHeight;

        // Retrasar respuesta
        setTimeout(() => {
            // Eliminar indicador
            const indicator = document.getElementById('chat-typing-indicator');
            if (indicator) indicator.remove();

            // Generar respuesta
            const responseText = getAutomatedTechnicalResponse(userText);
            const msgs = getUserMessages();
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            msgs.push({
                sender: 'agent',
                text: responseText,
                time: timeStr
            });

            saveUserMessages(msgs);
            renderUserChatWindow();

            // Adicionalmente, si el usuario tiene una sesión activa con su nombre, sincronizarlo en el listado del administrador
            syncUserMessageToAdminView(currentSession ? currentSession.nombre : 'Usuario General', userText, responseText);

        }, 1500);
    }

    // Lógica inteligente de respuestas técnicas automatizadas
    function getAutomatedTechnicalResponse(query) {
        const q = query.toLowerCase();

        if (q.includes('vpn') || q.includes('cisco') || q.includes('forti') || q.includes('credenciales')) {
            return "Hola. Para inconvenientes con la VPN corporativa, asegúrate de:\n1. Estar conectado a una red de Internet estable.\n2. Si te indica error de credenciales, es probable que tu contraseña de red haya caducado (se vence cada 90 días). Puedes restablecerla en el enlace de Autoservicio o indicarme para ayudarte.";
        }
        if (q.includes('excel') || q.includes('office') || q.includes('word') || q.includes('outlook')) {
            return "Entendido. Para problemas en Excel o suite Office:\n1. Prueba abriendo Excel en Modo Seguro (presiona CTRL mientras abres el programa) para ver si algún complemento de terceros está causando la lentitud.\n2. Si el problema persiste, puedes ir a Panel de Control > Programas y Características, hacer clic derecho en Microsoft Office y seleccionar 'Reparación Rápida'.";
        }
        if (q.includes('wifi') || q.includes('internet') || q.includes('red') || q.includes('lento')) {
            return "Lamento que tengas problemas de red. Intenta apagar y encender el WiFi de tu notebook, o si es posible conéctate mediante cable de red para descartar fallas del router local. Si estás en la oficina, verifica si otros colegas tienen conexión.";
        }
        if (q.includes('contraseña') || q.includes('pass') || q.includes('clave') || q.includes('bloqueo')) {
            return "Si tu cuenta está bloqueada o necesitas cambiar tu clave de Windows:\n1. Utiliza el portal de autogestión desde tu celular.\n2. De lo contrario, indícame tu RUT para procesar el desbloqueo temporal de tu usuario de red de forma manual.";
        }
        if (q.includes('hola') || q.includes('buenos dias') || q.includes('buenas tardes')) {
            return "¡Hola! Estoy listo para ayudarte con tu reporte informático o dudas sobre software y hardware corporativo. ¿Qué problema estás experimentando en tu equipo?";
        }

        return "Comprendo el problema. He ingresado tu reporte en nuestro sistema de asistencia de Soporte TI. Un técnico de Nivel 2 tomará el caso y se comunicará contigo a la brevedad posible. Si tienes más detalles, escríbelos por aquí.";
    }

    // Sincronizar chat de usuario con el dataset de Admin para que aparezca en caliente en su dashboard
    function syncUserMessageToAdminView(userName, userText, agentResponse) {
        const chats = getChatsData();
        
        // Buscar si ya existe una conversación del usuario (por nombre)
        let chat = chats.find(c => c.name === userName);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (chat) {
            chat.messages.push({ sender: 'user', text: userText, time: timeStr });
            chat.messages.push({ sender: 'agent', text: agentResponse, time: timeStr });
            chat.unread = chat.unread + 1;
            chat.online = true;
            chat.status = 'activo';
        } else {
            // Crear una nueva conversación
            const newId = `CHT-2024-00${60 + chats.length}`;
            chat = {
                id: newId,
                name: userName,
                email: currentSession ? currentSession.email : 'usuario@empresa.com',
                since: '26/05/2026',
                started: timeStr,
                channel: 'Web',
                status: 'activo',
                agent: 'Administrador',
                unread: 1,
                online: true,
                messages: [
                    { sender: 'user', text: userText, time: timeStr },
                    { sender: 'agent', text: agentResponse, time: timeStr }
                ]
            };
            chats.push(chat);
        }

        saveChatsData(chats);

        // Si el administrador está logueado y ve la pantalla de chat, refrescar
        if (currentSession && currentSession.role === 'admin') {
            updateChatStats();
            renderChatThreads();
            if (activeAdminChatId === chat.id) {
                loadActiveChatWindow();
            }
        }
    }

    // Configurar listeners de User Chat
    let userListenersBound = false;
    function setupUserChatListeners() {
        if (userListenersBound) return;

        const sendForm = document.getElementById('chat-user-send-form');
        if (sendForm) {
            sendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-user-message-input');
                if (input && input.value.trim()) {
                    sendUserMessage(input.value.trim());
                    input.value = '';
                }
            });
        }

        userListenersBound = true;
    }

    // ============================================
    // SISTEMA DE MONITOREO: ESTADO DEL SISTEMA
    // ============================================
    let lastRefreshTime = new Date();

    function updateLastRefreshText() {
        const lastUpdateTextSpan = document.getElementById('last-update-time');
        if (!lastUpdateTextSpan) return;

        const diffSeconds = Math.floor((new Date() - lastRefreshTime) / 1000);
        if (diffSeconds < 60) {
            lastUpdateTextSpan.textContent = `Hace ${diffSeconds} s`;
        } else {
            const diffMinutes = Math.floor(diffSeconds / 60);
            lastUpdateTextSpan.textContent = `Hace ${diffMinutes} min`;
        }
    }

    // Actualizar periódicamente el texto de "hace X tiempo"
    setInterval(updateLastRefreshText, 10000); // Cada 10 segundos

    // Función para refrescar datos con simulación interactiva
    window.refreshSystemStatus = function() {
        const refreshIcon = document.getElementById('refresh-system-icon');
        if (refreshIcon) {
            refreshIcon.classList.add('fa-spin');
        }

        setTimeout(() => {
            // Actualizar tiempo de última recarga
            lastRefreshTime = new Date();
            updateLastRefreshText();

            // 1. Simular fluctuaciones en las métricas en tiempo real
            const connectedUsers = Math.floor(400 + Math.random() * 50);
            const openTickets = Math.floor(1 + Math.random() * 3);
            const activeIncidents = Math.random() > 0.8 ? 1 : 0;
            const satisfaction = Math.random() > 0.5 ? '98%' : '99%';

            const connectedSpan = document.getElementById('metric-connected-users');
            const ticketsSpan = document.getElementById('metric-open-tickets');
            const incidentsSpan = document.getElementById('metric-active-incidents');
            const satisfactionSpan = document.getElementById('metric-satisfaction');

            if (connectedSpan) connectedSpan.textContent = connectedUsers;
            if (ticketsSpan) ticketsSpan.textContent = openTickets;
            if (incidentsSpan) {
                incidentsSpan.textContent = activeIncidents;
                // Si hay incidentes activos, actualizar el badge al lado
                const badge = document.getElementById('badge-incident-rate');
                if (badge) {
                    if (activeIncidents > 0) {
                        badge.innerHTML = `<i class="fas fa-exclamation-circle"></i> Alerta`;
                        badge.style.color = '#ef4444';
                        badge.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                    } else {
                        badge.innerHTML = `<i class="fas fa-check"></i> 100%`;
                        badge.style.color = 'var(--accent-green)';
                        badge.style.backgroundColor = 'rgba(29, 200, 109, 0.08)';
                    }
                }
            }
            if (satisfactionSpan) satisfactionSpan.textContent = satisfaction;

            // 2. Simular variación menor en los uptimes individuales
            const vpnUptime = activeIncidents > 0 ? '0.0%' : '99.7%';
            const vpnStatus = activeIncidents > 0 ? 'Caído' : 'Operativo';
            const vpnStatusBadge = document.getElementById('service-status-vpn');
            const vpnUptimeSpan = document.getElementById('service-uptime-vpn');

            if (vpnStatusBadge && vpnUptimeSpan) {
                vpnUptimeSpan.textContent = vpnUptime;
                vpnStatusBadge.textContent = vpnStatus;
                if (activeIncidents > 0) {
                    vpnStatusBadge.style.color = '#ef4444';
                    vpnStatusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                } else {
                    vpnStatusBadge.style.color = 'var(--accent-green)';
                    vpnStatusBadge.style.backgroundColor = 'rgba(29, 200, 109, 0.12)';
                }
            }

            // Variar el tiempo de respuesta promedio de forma simulada
            const avgRes = Math.random() > 0.6 ? 4 : 5;
            const avgResSpan = document.getElementById('response-time-avg');
            if (avgResSpan) {
                avgResSpan.innerHTML = `${avgRes} <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">min</span>`;
            }

            // 3. Simular movimiento de barras del gráfico
            const bars = document.querySelectorAll('.bar-chart-container .bar-fill');
            bars.forEach((bar, idx) => {
                // Dejar las de días anteriores casi iguales, y hacer fluctuar "Hoy"
                if (idx === bars.length - 1) {
                    const randomHeight = Math.floor(65 + Math.random() * 15);
                    bar.style.height = `${randomHeight}px`;
                }
            });

            // 4. Actualizar título principal si hay o no incidentes
            const mainTitle = document.getElementById('system-status-title');
            const mainDesc = document.getElementById('system-status-desc');
            const heroCard = document.querySelector('#page-estado .kb-hero');
            const heroIcon = document.querySelector('#page-estado .status-hero-icon-wrapper i');
            const heroIconWrapper = document.querySelector('#page-estado .status-hero-icon-wrapper');

            if (mainTitle && mainDesc && heroCard && heroIcon && heroIconWrapper) {
                if (activeIncidents > 0) {
                    mainTitle.textContent = "Incidente activo en el sistema";
                    mainDesc.textContent = "Estamos experimentando interrupciones parciales en la VPN corporativa.";
                    heroCard.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(50, 102, 235, 0.04) 100%)";
                    heroCard.style.borderColor = "rgba(239, 68, 68, 0.2)";
                    heroIcon.className = "fas fa-exclamation-triangle";
                    heroIcon.style.color = "#ef4444";
                    heroIcon.style.filter = "drop-shadow(0 0 6px #ef4444)";
                    heroIconWrapper.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                    heroIconWrapper.style.borderColor = "rgba(239, 68, 68, 0.2)";
                    heroIconWrapper.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.15)";
                } else {
                    mainTitle.textContent = "Todos los sistemas operativos";
                    mainDesc.textContent = "Nuestros servicios están funcionando correctamente.";
                    heroCard.style.background = "linear-gradient(135deg, rgba(29, 200, 109, 0.08) 0%, rgba(50, 102, 235, 0.04) 100%)";
                    heroCard.style.borderColor = "rgba(29, 200, 109, 0.2)";
                    heroIcon.className = "fas fa-shield-alt";
                    heroIcon.style.color = "var(--accent-green)";
                    heroIcon.style.filter = "drop-shadow(0 0 6px var(--accent-green))";
                    heroIconWrapper.style.backgroundColor = "rgba(29, 200, 109, 0.08)";
                    heroIconWrapper.style.borderColor = "rgba(29, 200, 109, 0.2)";
                    heroIconWrapper.style.boxShadow = "0 0 20px rgba(29, 200, 109, 0.15)";
                }
            }

            // Quitar animación de spin
            if (refreshIcon) {
                refreshIcon.classList.remove('fa-spin');
            }
        }, 800);
    };

    // Configurar los manejadores de eventos al cargar
    function setupSystemStatusListeners() {
        const btnRefresh = document.getElementById('btn-refresh-system');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                refreshSystemStatus();
            });
        }

        const alertToggle = document.getElementById('system-alert-toggle');
        if (alertToggle) {
            alertToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    alert("¡Suscrito con éxito! Recibirás alertas por correo cuando se detecten caídas o incidentes.");
                } else {
                    console.log("Notificaciones desactivadas.");
                }
            });
        }
    }

    // Inicializar listeners y estados
    setupSystemStatusListeners();
    updateLastRefreshText();

    // Cargar sesión guardada de inmediato
    const savedSession = localStorage.getItem('session_soporte');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            if (session && session.email) {
                if (session.email.includes('felipe') || session.email.includes('omar') || session.email.includes('belfor')) {
                    session.role = 'admin';
                }
                applySession(session);
            } else {
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.style.display = 'flex';
            }
        } catch (e) {
            console.error('Error cargando sesión:', e);
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.style.display = 'flex';
        }
    } else {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'flex';
    }
    // ============================================
    // MÓDULO DE VISITAS Y MOBILE MENU
    // ============================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMobileSidebar();
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            closeMobileSidebar();
        });
    }

    // ============================================
    // BARRA DE NAVEGACIÓN INFERIOR MÓVIL (BOTTOM NAV)
    // ============================================
    window.syncBottomNavTab = function(pageId) {
        if (!pageId) return;
        const mobTabs = document.querySelectorAll('.mobile-bottom-nav .mob-tab');
        mobTabs.forEach(tab => {
            const p = tab.getAttribute('data-page');
            if (p === pageId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    };

    const mobBottomTabs = document.querySelectorAll('.mobile-bottom-nav .mob-tab');
    mobBottomTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = tab.getAttribute('data-page');
            if (!targetPage) return;

            mobBottomTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Sincronizar navegación principal
            navigateToPage(targetPage);
        });
    });

    // Cerrar sidebar al hacer click en un link (en móvil)
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 850) {
                closeMobileSidebar();
            }
        });
    });

    // Navegación de sección "Visitas"
    const navVisitas = document.getElementById('nav-visitas');
    const pageVisitas = document.getElementById('page-visitas');

    if (navVisitas) {
        navVisitas.addEventListener('click', (e) => {
            e.preventDefault();
            // Desactivar otros nav links y secciones
            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-page'));
            
            navVisitas.classList.add('active');
            if (pageVisitas) pageVisitas.classList.add('active-page');
            
            initVisitasModule();
        });
    }

    // Logic for Visitas
    const locations = {
        'T-SALES': [
            'Latadia 4602, Las Condes',
            'Calle doce norte 996, Viña del Mar',
            'Fidel Oteiza 1941, oficina 801, Providencia',
            'Agustinas 641, 501, Providencia'
        ],
        'VPRIME': [
            'Elidoro Yáñez 2318, Providencia',
            'Agustinas 641, 501, Providencia'
        ],
        'INFINET': [
            'Fanor Velasco 85, oficina 201, Santiago'
        ]
    };

    const selEmpresa = document.getElementById('visita-empresa-select');
    const selLugar = document.getElementById('visita-lugar-select');
    const btnRegistrarVisita = document.getElementById('btn-registrar-visita');
    const calendarDaysContainer = document.getElementById('calendar-days-container');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const btnPrevMonth = document.getElementById('calendar-prev-btn');
    const btnNextMonth = document.getElementById('calendar-next-btn');
    const countMesActual = document.getElementById('visitas-mes-actual');

    let currentDate = new Date();
    let selectedDay = null;
    let cachedVisits = [];

    if (selEmpresa && selLugar) {
        selEmpresa.addEventListener('change', () => {
            const empresa = selEmpresa.value;
            selLugar.innerHTML = '<option value="" disabled selected>Selecciona lugar...</option>';
            if (locations[empresa]) {
                locations[empresa].forEach(lugar => {
                    const opt = document.createElement('option');
                    opt.value = lugar;
                    opt.textContent = lugar;
                    selLugar.appendChild(opt);
                });
                selLugar.disabled = false;
            } else {
                selLugar.disabled = true;
            }
            checkRegistrarBtn();
        });
        selLugar.addEventListener('change', checkRegistrarBtn);
    }

    function checkRegistrarBtn() {
        if (selEmpresa.value && selLugar.value && selectedDay && btnRegistrarVisita) {
            btnRegistrarVisita.disabled = false;
        } else if (btnRegistrarVisita) {
            btnRegistrarVisita.disabled = true;
        }
    }

    async function initVisitasModule() {
        if (!pageVisitas) return;
        renderCalendar(currentDate);
        await loadVisitsForMonth(currentDate);
    }

    function renderCalendar(date) {
        if (!calendarDaysContainer || !calendarMonthYear) return;
        calendarDaysContainer.innerHTML = '';
        selectedDay = null;
        checkRegistrarBtn();

        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // JS getDay() starts on Sunday (0). We want Monday (1) as start.
        const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty spots before month start
        for (let i = 0; i < firstDayAdjusted; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarDaysContainer.appendChild(emptyDiv);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            const dayOfWeek = new Date(year, month, i).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) dayDiv.classList.add('weekend');
            
            dayDiv.dataset.date = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            dayDiv.innerHTML = `<div class="day-number">${i}</div><div class="visit-container"></div>`;
            
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
                selectedDay = dayDiv.dataset.date;
                checkRegistrarBtn();
                renderDayVisitsPanel(selectedDay);
            });

            calendarDaysContainer.appendChild(addVisitMarkers(dayDiv, dayDiv.dataset.date));
        }
    }

    function addVisitMarkers(dayDiv, dateStr) {
        const container = dayDiv.querySelector('.visit-container');
        if (!container) return dayDiv;
        container.innerHTML = '';
        
        const visits = cachedVisits.filter(v => v.fecha.startsWith(dateStr));
        visits.forEach(v => {
            const mark = document.createElement('div');
            mark.className = 'visit-mark';
            
            const contentSpan = document.createElement('span');
            contentSpan.style.display = 'inline-flex';
            contentSpan.style.alignItems = 'center';
            contentSpan.style.gap = '4px';
            contentSpan.innerHTML = `<i class="fas fa-check"></i> ${escapeHtml(v.empresa)}`;
            mark.appendChild(contentSpan);

            // Botón para eliminar visita individual
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn-delete-visit';
            delBtn.title = `Eliminar visita a ${v.empresa}`;
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Evitar que seleccione el día
                await deleteVisit(v);
            });
            mark.appendChild(delBtn);

            mark.title = `${v.empresa} - ${v.ubicacion || 'Sucursal'} (${v.nombre_tecnico})`;
            
            const tech = document.createElement('div');
            tech.className = 'visit-tech';
            tech.textContent = v.nombre_tecnico;
            
            container.appendChild(mark);
            container.appendChild(tech);
        });
        return dayDiv;
    }

    function renderDayVisitsPanel(dateStr) {
        const panel = document.getElementById('visitas-dia-panel');
        const list = document.getElementById('visitas-dia-lista');
        const title = document.getElementById('visitas-dia-title');
        if (!panel || !list) return;

        if (!dateStr) {
            panel.style.display = 'none';
            return;
        }

        const visits = cachedVisits.filter(v => v.fecha.startsWith(dateStr));
        if (visits.length === 0) {
            panel.style.display = 'none';
            return;
        }

        const parts = dateStr.split('-');
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (title) {
            title.innerHTML = `<i class="fas fa-calendar-day" style="color: var(--accent-purple); margin-right: 8px;"></i> Visitas del ${formattedDate} (${visits.length})`;
        }

        list.innerHTML = visits.map((v, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="status-badge status-progreso" style="background: rgba(50, 102, 235, 0.15); color: var(--accent-blue); border: 1px solid rgba(50, 102, 235, 0.3); font-weight: 700; font-size: 0.78rem;">
                        <i class="fas fa-building" style="margin-right: 4px;"></i> ${escapeHtml(v.empresa)}
                    </span>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(v.ubicacion || 'Sucursal')}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);"><i class="fas fa-user-tie" style="margin-right: 4px; font-size: 0.7rem;"></i> Registrado por: <strong>${escapeHtml(v.nombre_tecnico)}</strong></span>
                    </div>
                </div>
                <button type="button" class="btn-delete-visita-detail" data-index="${idx}" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.btn-delete-visita-detail').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                const visitToDelete = visits[idx];
                if (visitToDelete) {
                    await deleteVisit(visitToDelete);
                }
            });
        });

        panel.style.display = 'block';
    }

    async function deleteVisit(visita) {
        const emp = visita.empresa || 'la empresa';
        const tec = visita.nombre_tecnico || 'Técnico';
        const loc = visita.ubicacion ? ` (${visita.ubicacion})` : '';
        const fecha = visita.fecha || '';

        if (!confirm(`¿Estás seguro de que deseas eliminar esta visita?\n\n• Empresa: ${emp}${loc}\n• Fecha: ${fecha}\n• Registrada por: ${tec}`)) {
            return;
        }

        if (!useLocalFallback && supabase) {
            try {
                let query = supabase.from('visitas').delete();
                if (visita.id) {
                    query = query.eq('id', visita.id);
                } else {
                    query = query
                        .eq('fecha', visita.fecha)
                        .eq('empresa', visita.empresa)
                        .eq('nombre_tecnico', visita.nombre_tecnico);
                    if (visita.ubicacion) {
                        query = query.eq('ubicacion', visita.ubicacion);
                    }
                }
                const { error } = await query;
                if (error) throw error;
            } catch (e) {
                console.warn('Error eliminando visita en Supabase, eliminando en local.', e);
                deleteVisitLocally(visita);
            }
        }
        
        // Also always remove from local storage
        deleteVisitLocally(visita);

        // Recargar datos del mes actual
        await loadVisitsForMonth(currentDate);

        // Actualizar panel del día si está abierto
        if (selectedDay) {
            renderDayVisitsPanel(selectedDay);
        }
    }

    function deleteVisitLocally(visita) {
        const local = localStorage.getItem('visitas_storage');
        if (!local) return;
        try {
            let allVisits = JSON.parse(local);
            allVisits = allVisits.filter(v => {
                if (visita.id && v.id) return v.id !== visita.id;
                const matchFecha = v.fecha === visita.fecha;
                const matchEmpresa = v.empresa === visita.empresa;
                const matchTecnico = v.nombre_tecnico === visita.nombre_tecnico;
                const matchUbicacion = !visita.ubicacion || v.ubicacion === visita.ubicacion;
                return !(matchFecha && matchEmpresa && matchTecnico && matchUbicacion);
            });
            localStorage.setItem('visitas_storage', JSON.stringify(allVisits));
        } catch(e) {
            console.error('Error al eliminar visita localmente:', e);
        }
    }

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', async () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
            await loadVisitsForMonth(currentDate);
        });
    }
    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', async () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
            await loadVisitsForMonth(currentDate);
        });
    }

    async function loadVisitsForMonth(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;
        
        cachedVisits = [];
        const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
        
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('visitas')
                    .select('*')
                    .gte('fecha', `${prefix}-01`)
                    .lte('fecha', `${prefix}-${lastDay}`);
                
                if (error) throw error;
                if (data) cachedVisits = data;
            } catch (e) {
                console.warn('Error loading visits from Supabase, using localStorage.', e);
                cachedVisits = loadVisitsLocally(prefix);
            }
        } else {
            cachedVisits = loadVisitsLocally(prefix);
        }
        
        // Re-render markers
        document.querySelectorAll('.calendar-day[data-date]').forEach(dayDiv => {
            addVisitMarkers(dayDiv, dayDiv.dataset.date);
        });

        // Update count
        if (countMesActual) {
            const uniqueDays = new Set(cachedVisits.map(v => v.fecha));
            countMesActual.textContent = uniqueDays.size;
        }

        if (selectedDay) {
            renderDayVisitsPanel(selectedDay);
        }
    }

    function loadVisitsLocally(prefix) {
        const local = localStorage.getItem('visitas_storage');
        if (!local) return [];
        const allVisits = JSON.parse(local);
        return allVisits.filter(v => v.fecha.startsWith(prefix));
    }

    if (btnRegistrarVisita) {
        btnRegistrarVisita.addEventListener('click', async () => {
            if (!selectedDay || !selEmpresa.value || !selLugar.value || !currentSession) {
                alert('Faltan datos para registrar la visita o no hay sesión iniciada.');
                return;
            }

            const nuevaVisita = {
                fecha: selectedDay,
                empresa: selEmpresa.value,
                ubicacion: selLugar.value,
                rut_tecnico: currentSession.rut || currentSession.email,
                nombre_tecnico: currentSession.nombre
            };

            btnRegistrarVisita.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            btnRegistrarVisita.disabled = true;

            if (!useLocalFallback && supabase) {
                try {
                    const { error } = await supabase.from('visitas').insert([nuevaVisita]);
                    if (error) throw error;
                } catch (e) {
                    console.warn('Error guardando visita en Supabase, guardando en local.', e);
                    saveVisitLocally(nuevaVisita);
                }
            } else {
                saveVisitLocally(nuevaVisita);
            }

            btnRegistrarVisita.innerHTML = '<i class="fas fa-check"></i> Registrado';
            setTimeout(() => {
                btnRegistrarVisita.innerHTML = '<i class="fas fa-plus"></i> Registrar Visita';
                checkRegistrarBtn();
            }, 2000);
            
            // Recargar datos
            await loadVisitsForMonth(currentDate);
        });
    }

    function saveVisitLocally(visita) {
        const local = localStorage.getItem('visitas_storage');
        let allVisits = [];
        if (local) allVisits = JSON.parse(local);
        allVisits.push(visita);
        localStorage.setItem('visitas_storage', JSON.stringify(allVisits));
    }

    // ============================================
    // 7. CONTROLADOR DEL COMMAND PALETTE (⌘ K / SPOTLIGHT)
    // ============================================
    const commandPaletteModal = document.getElementById('command-palette-modal');
    const commandPaletteInput = document.getElementById('command-palette-input');
    const commandPaletteResults = document.getElementById('command-palette-results');
    const headerCommandBar = document.getElementById('header-command-bar');

    function openCommandPalette() {
        if (!commandPaletteModal) return;
        commandPaletteModal.style.display = 'flex';
        if (commandPaletteInput) {
            commandPaletteInput.value = '';
            commandPaletteInput.focus();
            renderCommandPaletteResults('');
        }
    }

    function closeCommandPalette() {
        if (!commandPaletteModal) return;
        commandPaletteModal.style.display = 'none';
    }

    if (headerCommandBar) {
        headerCommandBar.addEventListener('click', openCommandPalette);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (commandPaletteModal && commandPaletteModal.style.display === 'flex') {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
        } else if (e.key === 'Escape' && commandPaletteModal && commandPaletteModal.style.display === 'flex') {
            closeCommandPalette();
        }
    });

    if (commandPaletteModal) {
        commandPaletteModal.addEventListener('click', (e) => {
            if (e.target === commandPaletteModal) {
                closeCommandPalette();
            }
        });
    }

    if (commandPaletteInput) {
        commandPaletteInput.addEventListener('input', (e) => {
            renderCommandPaletteResults(e.target.value.trim().toLowerCase());
        });
    }

    function renderCommandPaletteResults(query) {
        if (!commandPaletteResults) return;

        const navActions = [
            { icon: 'fas fa-plus-circle', title: 'Crear nuevo Ticket', sub: 'Abrir formulario de soporte técnico', action: () => navigateToPage('page-crear-ticket') },
            { icon: 'fas fa-calendar-alt', title: 'Ver Calendario de Visitas', sub: 'Planificación técnica mensual T-Sales / VPrime / Infinet', action: () => navigateToPage('page-visitas') },
            { icon: 'fas fa-shield-alt', title: 'Monitoreo de SLA', sub: 'Revisar tiempos de respuesta y resolución', action: () => navigateToPage('page-sla') },
            { icon: 'fas fa-server', title: 'Estado del Sistema', sub: 'Salud de servicios e infraestructura', action: () => navigateToPage('page-estado') },
            { icon: 'fas fa-laptop', title: 'Gestión de Equipos e Inventario', sub: 'Ver hardware, importar Excel / PDF', action: () => navigateToPage('page-base-conocimientos') },
            { icon: 'fas fa-book', title: 'Base de Conocimientos / Tutoriales', sub: 'Guías paso a paso de resolución rápida', action: () => navigateToPage('page-tutoriales') }
        ];

        let html = '';

        // Acciones y Navegación
        const filteredActions = navActions.filter(a => !query || a.title.toLowerCase().includes(query) || a.sub.toLowerCase().includes(query));
        if (filteredActions.length > 0) {
            html += `<div class="cp-category-title">Acciones y Vistas</div>`;
            filteredActions.forEach((act, idx) => {
                html += `
                    <div class="cp-result-item" data-action-idx="${idx}">
                        <div class="cp-item-icon"><i class="${act.icon}"></i></div>
                        <div class="cp-item-main">
                            <div class="cp-item-title">${act.title}</div>
                            <div class="cp-item-sub">${act.sub}</div>
                        </div>
                        <i class="fas fa-arrow-right" style="font-size: 0.75rem; color: var(--text-muted);"></i>
                    </div>
                `;
            });
        }

        // Tickets coincidentes
        if (query && allTicketsCached.length > 0) {
            const matchedTickets = allTicketsCached.filter(t => 
                t.asunto.toLowerCase().includes(query) || 
                (t.codigo && t.codigo.toLowerCase().includes(query)) ||
                (t.descripcion && t.descripcion.toLowerCase().includes(query))
            ).slice(0, 4);

            if (matchedTickets.length > 0) {
                html += `<div class="cp-category-title" style="margin-top: 10px;">Tickets Encontrados</div>`;
                matchedTickets.forEach(t => {
                    html += `
                        <div class="cp-result-item cp-ticket-result" data-ticket-id="${t.id}">
                            <div class="cp-item-icon"><i class="fas fa-ticket-alt"></i></div>
                            <div class="cp-item-main">
                                <div class="cp-item-title">#${t.codigo || t.id.slice(0,6)} - ${escapeHtml(t.asunto)}</div>
                                <div class="cp-item-sub">${t.usuario_nombre || 'Usuario'} • Estado: ${t.estado}</div>
                            </div>
                        </div>
                    `;
                });
            }
        }

        commandPaletteResults.innerHTML = html;

        // Bind events
        commandPaletteResults.querySelectorAll('.cp-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const actIdx = item.getAttribute('data-action-idx');
                const tId = item.getAttribute('data-ticket-id');
                closeCommandPalette();
                if (actIdx !== null && filteredActions[actIdx]) {
                    filteredActions[actIdx].action();
                } else if (tId) {
                    const ticket = allTicketsCached.find(t => t.id === tId);
                    if (ticket) openTicketModal(ticket);
                }
            });
        });
    }

    // ============================================
    // 8. DROPDOWNS DE HEADER (NOTIFICACIONES & USUARIO)
    // ============================================
    const headerNotifBtn = document.getElementById('header-notif-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    const headerUserBtn = document.getElementById('header-user-menu') || document.getElementById('header-user-btn');
    const userDropdown = document.getElementById('header-user-dropdown');
    const btnMarkAllRead = document.getElementById('btn-mark-all-read');

    if (headerNotifBtn && notifDropdown) {
        headerNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.style.display = 'none';
            notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (headerUserBtn && userDropdown) {
        headerUserBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notifDropdown) notifDropdown.style.display = 'none';
            userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== headerNotifBtn) {
            notifDropdown.style.display = 'none';
        }
        if (userDropdown && !userDropdown.contains(e.target) && headerUserBtn && !headerUserBtn.contains(e.target)) {
            userDropdown.style.display = 'none';
        }
    });

    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', () => {
            document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
            const count = document.getElementById('header-unread-count');
            if (count) count.style.display = 'none';
            const pillCount = document.getElementById('dropdown-unread-count');
            if (pillCount) pillCount.textContent = '0 nuevas';
        });
    }

    // ============================================
    // 9. HELPER FUNCTIONS GLOBALES
    // ============================================
    window.openSampleTicket = function(code) {
        const found = allTicketsCached.find(t => (t.codigo && t.codigo.includes(code)) || (t.id && t.id.includes(code)));
        if (found) {
            openTicketModal(found);
        } else {
            // Abrir modal simulado con datos de demostración
            openTicketModal({
                id: 'sample-' + code,
                codigo: '#' + code,
                asunto: 'Incidencia técnica #' + code,
                categoria: 'redes',
                prioridad: 'alta',
                estado: 'en progreso',
                created_at: new Date().toISOString(),
                descripcion: 'El usuario reporta problemas de conectividad intermitente y requiere asistencia.',
                usuario_nombre: 'Usuario T-Sales',
                tecnico_asignado: 'Felipe Olivares',
                impacto: 'medio',
                sede: 'Santiago Centro',
                telefono: '+56 9 8765 4321',
                dispositivo: 'Notebook Dell Latitude 5420',
                modalidad: 'Remoto'
            });
        }
    };

    window.openKbCategory = function(category) {
        navigateToPage('page-tutoriales');
        const filterSelect = document.getElementById('kb-category-filter');
        if (filterSelect) {
            filterSelect.value = category;
            filterSelect.dispatchEvent(new Event('change'));
        }
    };

    // Inicializar gráficos Chart.js del Dashboard al arrancar
    setTimeout(() => {
        initDashboardCharts();
    }, 250);


    // ========================================================
    // AUTOCOMPLETADO INTELIGENTE PARA FORMULARIO DE TICKETS
    // ========================================================
    function setupClientAutocomplete() {
        const input = document.getElementById('ticket-client-name');
        const list = document.getElementById('ticket-client-autocomplete-list');
        const rutInput = document.getElementById('ticket-client-rut');
        const emailInput = document.getElementById('ticket-client-email');

        if (!input || !list) return;

        let selectedIndex = -1;
        let currentMatches = [];

        function getInitials(name) {
            if (!name) return 'US';
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }

        function getAvatarBg(company) {
            const c = (company || '').toLowerCase();
            if (c.includes('infinet')) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            if (c.includes('vprime')) return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
            return 'linear-gradient(135deg, #00c9a7 0%, #008f7a 100%)';
        }

        function getCompanyBadgeClass(company) {
            const c = (company || '').toLowerCase();
            if (c.includes('infinet')) return 'badge-infinet';
            if (c.includes('vprime')) return 'badge-vprime';
            return 'badge-tsales';
        }

        function renderSuggestions(matches) {
            currentMatches = matches;
            selectedIndex = -1;
            if (matches.length === 0) {
                list.style.display = 'none';
                list.innerHTML = '';
                return;
            }

            list.innerHTML = matches.map((u, idx) => `
                <div class="autocomplete-suggestion-item" data-index="${idx}">
                    <div class="autocomplete-item-left">
                        <div class="autocomplete-avatar" style="background: ${getAvatarBg(u.empresa)};">
                            ${getInitials(u.nombre)}
                        </div>
                        <div class="autocomplete-info">
                            <span class="autocomplete-name">${escapeHtml(u.nombre)}</span>
                            <div class="autocomplete-meta">
                                <span><i class="fas fa-id-card" style="font-size: 0.68rem; margin-right: 2px;"></i> ${escapeHtml(u.rut || 'Sin RUT')}</span>
                                <span>•</span>
                                <span><i class="fas fa-envelope" style="font-size: 0.68rem; margin-right: 2px;"></i> ${escapeHtml(u.email || '-')}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="autocomplete-badge ${getCompanyBadgeClass(u.empresa)}">${escapeHtml(u.empresa)}</span>
                        <span class="autocomplete-badge badge-tipo">${escapeHtml(u.tipo || 'Ejecutivo')}</span>
                    </div>
                </div>
            `).join('');

            list.style.display = 'block';

            list.querySelectorAll('.autocomplete-suggestion-item').forEach(item => {
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    const idx = parseInt(item.getAttribute('data-index'), 10);
                    selectItem(currentMatches[idx]);
                });
            });
        }

        function selectItem(user) {
            if (!user) return;
            input.value = user.nombre || '';
            if (rutInput) rutInput.value = user.rut || '';
            if (emailInput) emailInput.value = user.email || '';
            
            if (user.empresa) {
                selectCompanyCard(user.empresa);
            }

            list.style.display = 'none';
            list.innerHTML = '';
            selectedIndex = -1;

            // Feedback visual de llenado exitoso
            [input, rutInput, emailInput].forEach(inp => {
                if (inp) {
                    inp.style.borderColor = 'var(--accent-blue)';
                    setTimeout(() => {
                        inp.style.borderColor = 'var(--border-color)';
                    }, 1200);
                }
            });
        }

        function doSearch() {
            const query = input.value.trim().toLowerCase();
            if (query.length < 1) {
                list.style.display = 'none';
                list.innerHTML = '';
                return;
            }

            const allUsers = loadDirectoryUsers();
            const filtered = allUsers.filter(u => {
                const n = (u.nombre || '').toLowerCase();
                const r = (u.rut || '').toLowerCase();
                const e = (u.email || '').toLowerCase();
                const emp = (u.empresa || '').toLowerCase();
                return n.includes(query) || r.includes(query) || e.includes(query) || emp.includes(query);
            }).slice(0, 8);

            renderSuggestions(filtered);
        }

        input.addEventListener('input', doSearch);
        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 1) {
                doSearch();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (list.style.display === 'none' || currentMatches.length === 0) return;

            const items = list.querySelectorAll('.autocomplete-suggestion-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateHighlight(items);
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < currentMatches.length) {
                    e.preventDefault();
                    selectItem(currentMatches[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                list.style.display = 'none';
            }
        });

        function updateHighlight(items) {
            items.forEach((it, idx) => {
                if (idx === selectedIndex) {
                    it.classList.add('selected');
                    it.scrollIntoView({ block: 'nearest' });
                } else {
                    it.classList.remove('selected');
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !list.contains(e.target)) {
                list.style.display = 'none';
            }
        });
    }

    // ========================================================
    // GESTIÓN DEL DIRECTORIO DE COLABORADORES
    // ========================================================
    let currentProfilePasswordCache = { email: '', value: '' };

    function applyProfilePasswordState(hasPassword) {
        const status = document.getElementById('perfil-password-status');
        const revealBtn = document.getElementById('btn-reveal-password');
        const manageBtn = document.getElementById('btn-manage-profile-password');
        const displayInput = document.getElementById('perfil-password-display');
        const editor = document.getElementById('profile-password-editor');
        const editorInput = document.getElementById('profile-new-password');

        if (status) {
            status.className = `profile-password-status ${hasPassword ? 'saved' : 'missing'}`;
            status.textContent = hasPassword ? 'Guardada' : 'No registrada';
        }
        if (revealBtn) revealBtn.disabled = !hasPassword;
        if (manageBtn) {
            manageBtn.dataset.mode = hasPassword ? 'edit' : 'add';
            manageBtn.innerHTML = hasPassword
                ? '<i class="fas fa-pen"></i><span>Editar contraseña</span>'
                : '<i class="fas fa-plus"></i><span>Agregar contraseña</span>';
        }
        if (displayInput) {
            displayInput.type = 'password';
            displayInput.value = hasPassword ? '********' : '';
            displayInput.placeholder = hasPassword ? '' : 'Sin contraseña registrada';
        }
        if (editor) editor.hidden = true;
        if (editorInput) editorInput.value = '';
    }

    async function refreshProfilePasswordStatus(email) {
        const cleanEmail = normalizeStr(email);
        const status = document.getElementById('perfil-password-status');
        const revealBtn = document.getElementById('btn-reveal-password');
        if (status) {
            status.className = 'profile-password-status checking';
            status.textContent = 'Comprobando...';
        }
        if (revealBtn) revealBtn.disabled = true;
        currentProfilePasswordCache = { email: cleanEmail, value: '' };

        const localUser = loadDirectoryUsers().find(u => normalizeStr(u.email) === cleanEmail);
        let passwordValue = localUser?.password_usuario || '';

        if (typeof supabase !== 'undefined' && supabase && !useLocalFallback) {
            try {
                const { data, error } = await supabase
                    .from('directorio_usuarios')
                    .select('password_usuario')
                    .eq('email', email)
                    .maybeSingle();
                if (!error && data && data.password_usuario) passwordValue = data.password_usuario;
            } catch (error) {
                console.warn('No fue posible comprobar la contraseña en Supabase:', error);
            }
        }

        const activeEmail = normalizeStr(document.getElementById('perfil-password-display')?.getAttribute('data-target-email'));
        if (activeEmail !== cleanEmail) return;
        currentProfilePasswordCache = { email: cleanEmail, value: passwordValue };
        applyProfilePasswordState(Boolean(passwordValue));
    }

    async function saveProfilePassword(email, newPassword) {
        const users = loadDirectoryUsers();
        const userIndex = users.findIndex(u => normalizeStr(u.email) === normalizeStr(email));
        if (userIndex === -1) throw new Error('No se encontró el usuario en el directorio.');

        const updatedUser = { ...users[userIndex], password_usuario: newPassword };
        users[userIndex] = updatedUser;
        saveDirectoryUsers(users);

        let cloudSaved = false;
        if (typeof supabase !== 'undefined' && supabase && !useLocalFallback) {
            try {
                const { error } = await supabase
                    .from('directorio_usuarios')
                    .upsert([updatedUser], { onConflict: 'email' });
                if (error) throw error;
                cloudSaved = true;
            } catch (error) {
                console.warn('Contraseña guardada localmente; Supabase no pudo sincronizarla:', error);
            }
        }

        currentProfilePasswordCache = { email: normalizeStr(email), value: newPassword };
        return cloudSaved;
    }

    let directoryCurrentPage = 1;
    const DIRECTORY_PAGE_SIZE = 15;

    window.changeDirectoryPage = function(page) {
        directoryCurrentPage = page;
        renderDirectoryPage();
    };

    function renderDirectoryPage() {
        const tbody = document.getElementById('directory-table-body');
        if (!tbody) return;

        const searchInput = document.getElementById('directory-search-input');
        const companyFilter = document.getElementById('directory-company-filter');
        const typeFilter = document.getElementById('directory-type-filter');

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedCompany = companyFilter ? companyFilter.value : 'todas';
        const selectedType = typeFilter ? typeFilter.value : 'todos';

        const allUsers = loadDirectoryUsers();

        const badgeTotal = document.getElementById('directory-total-badge');
        if (badgeTotal) badgeTotal.textContent = allUsers.length;

        const filtered = allUsers.filter(u => {
            const matchesQuery = !query || 
                (u.nombre || '').toLowerCase().includes(query) ||
                (u.rut || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query);

            const matchesCompany = selectedCompany === 'todas' || 
                (u.empresa || '').toLowerCase() === selectedCompany.toLowerCase();

            const matchesType = selectedType === 'todos' || 
                (u.tipo || '').toLowerCase() === selectedType.toLowerCase();

            return matchesQuery && matchesCompany && matchesType;
        });

        const totalPages = Math.ceil(filtered.length / DIRECTORY_PAGE_SIZE) || 1;
        if (directoryCurrentPage > totalPages) directoryCurrentPage = totalPages;
        if (directoryCurrentPage < 1) directoryCurrentPage = 1;

        const startIdx = (directoryCurrentPage - 1) * DIRECTORY_PAGE_SIZE;
        const pageUsers = filtered.slice(startIdx, startIdx + DIRECTORY_PAGE_SIZE);

        function getAvatarBg(company) {
            const c = (company || '').toLowerCase();
            if (c.includes('infinet')) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            if (c.includes('vprime')) return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
            return 'linear-gradient(135deg, #00c9a7 0%, #008f7a 100%)';
        }

        function getCompanyBadgeClass(company) {
            const c = (company || '').toLowerCase();
            if (c.includes('infinet')) return 'badge-infinet';
            if (c.includes('vprime')) return 'badge-vprime';
            return 'badge-tsales';
        }

        function getInitials(name) {
            if (!name) return 'US';
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }

        const mobileCardsContainer = document.getElementById('mobile-directory-cards-container');

        if (pageUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No se encontraron colaboradores que coincidan con los filtros aplicados.
                    </td>
                </tr>
            `;
            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No se encontraron colaboradores con estos filtros.
                    </div>
                `;
            }
        } else {
            tbody.innerHTML = pageUsers.map(u => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 14px 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="user-avatar" style="width: 36px; height: 36px; background: ${getAvatarBg(u.empresa)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.85rem; flex-shrink: 0;">
                                <span>${getInitials(u.nombre)}</span>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(u.nombre)}</span>
                                <span style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHtml(u.email || '-')}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 14px 16px; font-family: monospace; font-size: 0.85rem; color: var(--text-primary);">${escapeHtml(u.rut || 'Sin RUT')}</td>
                    <td style="padding: 14px 16px;"><span class="autocomplete-badge ${getCompanyBadgeClass(u.empresa)}">${escapeHtml(u.empresa || 'T-Sales')}</span></td>
                    <td style="padding: 14px 16px;"><span class="autocomplete-badge badge-tipo">${escapeHtml(u.tipo || 'Ejecutivo')}</span></td>
                    <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-table-action btn-perfil-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" data-tipo="${escapeHtml(u.tipo || 'Ejecutivo')}" data-licencia="${escapeHtml(u.licencia || '')}" data-created="${escapeHtml(u.created_at || '')}" title="Ver Perfil" style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.25); color: #8b5cf6; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fas fa-eye"></i> Perfil
                        </button>
                        <button type="button" class="btn-table-action btn-crear-ticket-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" title="Crear ticket para este usuario" style="background: rgba(50, 102, 235, 0.12); border: 1px solid rgba(50, 102, 235, 0.25); color: var(--accent-blue); padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                            <i class="fas fa-plus"></i> Ticket
                        </button>
                        <button type="button" class="btn-table-action btn-editar-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" data-tipo="${escapeHtml(u.tipo || 'Ejecutivo')}" data-licencia="${escapeHtml(u.licencia || '')}" title="Editar usuario" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button type="button" class="btn-table-action btn-eliminar-collab" data-email="${escapeHtml(u.email)}" title="Eliminar usuario" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');

            const bindDeleteCollab = (btn) => {
                btn.addEventListener('click', async () => {
                    const email = btn.getAttribute('data-email');
                    if (confirm(`¿Estás seguro de que deseas eliminar al usuario con correo ${email}?`)) {
                        const users = loadDirectoryUsers();
                        const updatedUsers = users.filter(u => u.email !== email);
                        saveDirectoryUsers(updatedUsers);
                        
                        if (typeof supabase !== 'undefined' && supabase && !useLocalFallback) {
                            try {
                                await supabase.from('directorio_usuarios').delete().eq('email', email);
                            } catch(e) {
                                console.warn('Error al eliminar de Supabase:', e);
                            }
                        }
                        renderDirectoryPage();
                        alert('Usuario eliminado correctamente.');
                    }
                });
            };

            const bindEditCollab = (btn) => {
                btn.addEventListener('click', () => {
                    const modal = document.getElementById('modal-crear-colaborador');
                    if (!modal) return;
                    
                    document.getElementById('collab-modal-title').textContent = 'Editar Colaborador';
                    document.getElementById('collab-modal-icon').className = 'fas fa-user-edit';
                    
                    document.getElementById('collab-original-email').value = btn.getAttribute('data-email');
                    document.getElementById('collab-name').value = btn.getAttribute('data-name');
                    document.getElementById('collab-rut').value = btn.getAttribute('data-rut');
                    document.getElementById('collab-email').value = btn.getAttribute('data-email');
                    document.getElementById('collab-company').value = btn.getAttribute('data-company');
                    document.getElementById('collab-type').value = btn.getAttribute('data-tipo');
                    document.getElementById('collab-license').value = btn.getAttribute('data-licencia');
                    document.getElementById('collab-password').value = '';
                    
                    modal.style.display = 'flex';
                });
            };

            const bindPerfilCollab = (btn) => {
                btn.addEventListener('click', async () => {
                    const modal = document.getElementById('modal-perfil-colaborador');
                    if (!modal) return;
                    
                    const email = btn.getAttribute('data-email');
                    const nombre = btn.getAttribute('data-name');
                    const empresa = btn.getAttribute('data-company');
                    
                    document.getElementById('perfil-nombre').textContent = nombre;
                    const perfilEmail = document.getElementById('perfil-email');
                    perfilEmail.textContent = email;
                    perfilEmail.href = email ? `mailto:${email}` : '#';
                    document.getElementById('perfil-rut').textContent = btn.getAttribute('data-rut');
                    document.getElementById('perfil-empresa').textContent = empresa;
                    document.getElementById('perfil-empresa-resumen').textContent = empresa || 'Sin empresa';
                    document.getElementById('perfil-tipo').textContent = btn.getAttribute('data-tipo');
                    document.getElementById('perfil-licencia').textContent = btn.getAttribute('data-licencia') || 'Sin licencia asignada';
                    const createdAt = btn.getAttribute('data-created');
                    const createdDate = createdAt ? new Date(createdAt) : null;
                    document.getElementById('perfil-fecha-registro').textContent = createdDate && !isNaN(createdDate) ? createdDate.toLocaleDateString('es-CL') : 'Sin fecha';
                    
                    const avatar = document.getElementById('perfil-avatar');
                    avatar.textContent = getInitials(nombre);
                    avatar.style.background = getAvatarBg(empresa);
                    
                    const passInput = document.getElementById('perfil-password-display');
                    passInput.type = 'password';
                    passInput.value = '********';
                    passInput.setAttribute('data-target-email', email);
                    refreshProfilePasswordStatus(email);
                    
                    // Buscar Equipos
                    let localEquipos = [];
                    try { localEquipos = JSON.parse(localStorage.getItem('local_equipos') || '[]'); } catch(e){}
                    const normalizeProfileValue = value => (value || '').toString().trim().toLowerCase();
                    const userEquipos = localEquipos.filter(eq => {
                        const assigned = normalizeProfileValue(eq.asignado || eq.usuario_nombre || eq.usuario);
                        const assignedEmail = normalizeProfileValue(eq.usuario_email || eq.email);
                        const assignedRut = normalizeProfileValue(eq.usuario_rut || eq.rut);
                        return assigned === normalizeProfileValue(nombre) ||
                            assigned.includes(normalizeProfileValue(nombre)) ||
                            assignedEmail === normalizeProfileValue(email) ||
                            (assignedRut && assignedRut === normalizeProfileValue(btn.getAttribute('data-rut')));
                    });
                    
                    const equiposContainer = document.getElementById('perfil-equipos-container');
                    if (equiposContainer) {
                        if (userEquipos.length > 0) {
                            equiposContainer.innerHTML = userEquipos.map((eq, index) => `
                                <div class="profile-list-item profile-equipment-item" role="button" tabindex="0" data-equipment-index="${index}" aria-label="Abrir detalle completo de ${escapeHtml(eq.hostname || eq.nombre_codigo || eq.codigo || 'equipo')}">
                                    <div class="profile-item-icon"><i class="fas fa-laptop"></i></div>
                                    <div class="profile-item-copy">
                                        <strong>${escapeHtml(eq.hostname || eq.nombre_codigo || eq.codigo || 'Equipo sin nombre')}</strong>
                                        <span>${escapeHtml([eq.marca, eq.modelo].filter(Boolean).join(' ') || 'Marca y modelo sin registrar')}${eq.sistema_operativo || eq.so ? ` · ${escapeHtml(eq.sistema_operativo || eq.so)}` : ''}</span>
                                    </div>
                                    <div class="profile-item-meta">
                                        <b>${escapeHtml(eq.estado || 'Activo')}</b>
                                        <small>Serie: ${escapeHtml(eq.serie || eq.serial || '-')}</small>
                                    </div>
                                    <i class="fas fa-chevron-right profile-item-chevron" aria-hidden="true"></i>
                                </div>
                            `).join('');
                            equiposContainer.querySelectorAll('.profile-equipment-item').forEach(item => {
                                const openStoredEquipment = () => {
                                    const selectedEquipment = userEquipos[Number(item.dataset.equipmentIndex)];
                                    if (!selectedEquipment) return;
                                    modal.style.display = 'none';
                                    openEquipDetailModal(selectedEquipment);
                                };
                                item.addEventListener('click', openStoredEquipment);
                                item.addEventListener('keydown', event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openStoredEquipment();
                                    }
                                });
                            });
                        } else {
                            equiposContainer.innerHTML = '<div class="profile-list-empty"><span><i class="fas fa-laptop"></i>No hay equipos registrados a su nombre.</span></div>';
                        }
                    }
                    document.getElementById('perfil-equipos-count').textContent = userEquipos.length;
                    document.getElementById('perfil-equipos-badge').textContent = userEquipos.length;

                    // Buscar Tickets
                    let allTickets = Array.isArray(allTicketsCached) ? allTicketsCached : [];
                    try {
                        if (allTickets.length === 0) allTickets = await fetchTickets();
                    } catch(e) {
                        console.warn('No se pudieron consultar los tickets para el perfil:', e);
                        try { allTickets = JSON.parse(localStorage.getItem('local_tickets') || '[]'); } catch(ignore) {}
                    }
                    const normalizeRut = value => normalizeProfileValue(value).replace(/[^0-9k]/g, '');
                    const profileEmail = normalizeProfileValue(email);
                    const profileName = normalizeStr(nombre).replace(/\s+/g, ' ');
                    const profileRut = normalizeRut(btn.getAttribute('data-rut'));
                    const userTickets = allTickets.filter(t => {
                        const meta = extractMetadata(t);
                        const clientEmails = [t.clientEmail, t.clienteEmail, t.cliente_email, t.email, meta.cliente_email]
                            .map(normalizeProfileValue).filter(Boolean);
                        const clientNames = [t.clientName, t.clienteNombre, t.cliente_nombre, t.nombre_cliente, meta.cliente_nombre]
                            .map(value => normalizeStr(value).replace(/\s+/g, ' ')).filter(Boolean);
                        const clientRuts = [t.clientRut, t.clienteRut, t.cliente_rut, t.rut_cliente, meta.cliente_rut]
                            .map(normalizeRut).filter(Boolean);

                        if ((profileEmail && clientEmails.includes(profileEmail)) ||
                            (profileRut && clientRuts.includes(profileRut)) ||
                            (profileName && clientNames.includes(profileName))) return true;

                        const hasClientIdentity = clientEmails.length || clientNames.length || clientRuts.length;
                        if (hasClientIdentity) return false;

                        return (profileEmail && normalizeProfileValue(t.usuario_email) === profileEmail) ||
                            (profileRut && normalizeRut(t.usuario_rut) === profileRut) ||
                            (profileName && normalizeStr(t.usuario_nombre).replace(/\s+/g, ' ') === profileName);
                    });
                    // Ordenar por más recientes
                    userTickets.sort((a,b) => new Date(b.createdAt || b.created_at || b.fecha || 0) - new Date(a.createdAt || a.created_at || a.fecha || 0));
                    
                    const ticketsContainer = document.getElementById('perfil-tickets-container');
                    if (ticketsContainer) {
                        if (userTickets.length > 0) {
                            const visibleUserTickets = userTickets.slice(0, 10);
                            ticketsContainer.innerHTML = visibleUserTickets.map((t, index) => {
                                const tDate = new Date(t.createdAt || t.created_at || t.fecha || 0);
                                const dateStr = !isNaN(tDate) ? tDate.toLocaleDateString('es-CL') : '-';
                                const ticketTitle = t.issue || t.asunto || t.titulo || t.subject || 'Sin descripción';
                                const ticketStatus = t.status || t.estado || 'Abierto';
                                const ticketPriority = t.prioridad || t.priority || 'Prioridad sin registrar';
                                return `
                                <div class="profile-list-item profile-ticket-item" role="button" tabindex="0" data-profile-ticket-index="${index}" aria-label="Abrir ticket: ${escapeHtml(ticketTitle)}">
                                    <div class="profile-item-icon"><i class="fas fa-ticket-alt"></i></div>
                                    <div class="profile-item-copy">
                                        <strong>${escapeHtml(ticketTitle)}</strong>
                                        <span>${escapeHtml(ticketPriority)}</span>
                                    </div>
                                    <div class="profile-item-meta"><b>${escapeHtml(ticketStatus)}</b><small>${dateStr}</small></div>
                                </div>
                                `;
                            }).join('');

                            const openProfileTicket = item => {
                                const selectedTicket = visibleUserTickets[Number(item.dataset.profileTicketIndex)];
                                if (!selectedTicket) return;
                                openTicketDetailModal(selectedTicket);
                            };
                            ticketsContainer.querySelectorAll('[data-profile-ticket-index]').forEach(item => {
                                item.addEventListener('click', () => openProfileTicket(item));
                                item.addEventListener('keydown', event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openProfileTicket(item);
                                    }
                                });
                            });
                        } else {
                            ticketsContainer.innerHTML = '<div class="profile-list-empty"><span><i class="fas fa-ticket-alt"></i>No hay tickets asociados a este colaborador.</span></div>';
                        }
                    }
                    document.getElementById('perfil-tickets-count').textContent = userTickets.length;
                    document.getElementById('perfil-tickets-badge').textContent = userTickets.length;
                    
                    modal.style.display = 'flex';
                });
            };

            tbody.querySelectorAll('.btn-eliminar-collab').forEach(bindDeleteCollab);
            tbody.querySelectorAll('.btn-editar-collab').forEach(bindEditCollab);
            tbody.querySelectorAll('.btn-perfil-collab').forEach(bindPerfilCollab);

            tbody.querySelectorAll('.btn-crear-ticket-collab').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    const rut = btn.getAttribute('data-rut');
                    const email = btn.getAttribute('data-email');
                    const company = btn.getAttribute('data-company');

                    const crearTab = Array.from(document.querySelectorAll('.sidebar-nav a, .mobile-bottom-nav-item')).find(el => el.textContent.toLowerCase().includes('ticket'));
                    if (crearTab) {
                        if (typeof navigateToPage === 'function') {
                            navigateToPage('page-crear-ticket');
                        } else {
                            crearTab.click();
                        }
                        setTimeout(() => {
                            const nameInp = document.getElementById('ticket-client-name');
                            const rutInp = document.getElementById('ticket-client-rut');
                            const emailInp = document.getElementById('ticket-client-email');
                            if (nameInp) nameInp.value = name;
                            if (rutInp) rutInp.value = rut;
                            if (emailInp) emailInp.value = email;
                            if (company && typeof selectCompanyCard === 'function') selectCompanyCard(company);
                        }, 120);
                    }
                });
            });

            // Render mobile cards for Directorio
            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = pageUsers.map(u => `
                    <div class="directory-mobile-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                                <div class="user-avatar" style="width: 40px; height: 40px; background: ${getAvatarBg(u.empresa)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.88rem; flex-shrink: 0;">
                                    <span>${getInitials(u.nombre)}</span>
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <strong style="font-size: 0.92rem; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.nombre)}</strong>
                                    <span style="font-size: 0.76rem; color: var(--text-secondary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.email || '-')}</span>
                                </div>
                            </div>
                            <span class="autocomplete-badge ${getCompanyBadgeClass(u.empresa)}" style="font-size: 0.72rem; padding: 3px 8px; flex-shrink: 0;">${escapeHtml(u.empresa || 'T-Sales')}</span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-sidebar); border-radius: 8px; padding: 8px 12px; font-size: 0.78rem;">
                            <div>
                                <span style="color: var(--text-muted); font-size: 0.68rem; display: block; font-weight: 600; text-transform: uppercase;">RUT</span>
                                <span style="font-family: monospace; font-weight: 700; color: var(--text-primary); font-size: 0.84rem;">${escapeHtml(u.rut || 'Sin RUT')}</span>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button type="button" class="btn-perfil-collab-mob btn-perfil-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" data-tipo="${escapeHtml(u.tipo || 'Ejecutivo')}" data-licencia="${escapeHtml(u.licencia || '')}" data-created="${escapeHtml(u.created_at || '')}" style="background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); color: #8b5cf6; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn-crear-ticket-collab-mob" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" style="background: rgba(50, 102, 235, 0.15); border: 1px solid rgba(50, 102, 235, 0.35); color: var(--accent-blue); padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button type="button" class="btn-editar-collab-mob btn-editar-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" data-tipo="${escapeHtml(u.tipo || 'Ejecutivo')}" data-licencia="${escapeHtml(u.licencia || '')}" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #10b981; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button type="button" class="btn-eliminar-collab-mob" data-email="${escapeHtml(u.email)}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #ef4444; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                mobileCardsContainer.querySelectorAll('.btn-eliminar-collab-mob').forEach(bindDeleteCollab);
                mobileCardsContainer.querySelectorAll('.btn-editar-collab-mob').forEach(bindEditCollab);
                mobileCardsContainer.querySelectorAll('.btn-perfil-collab-mob').forEach(bindPerfilCollab);

                mobileCardsContainer.querySelectorAll('.btn-crear-ticket-collab-mob').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const name = btn.getAttribute('data-name');
                        const rut = btn.getAttribute('data-rut');
                        const email = btn.getAttribute('data-email');
                        const company = btn.getAttribute('data-company');

                        const crearTab = Array.from(document.querySelectorAll('.sidebar-nav a, .mobile-bottom-nav-item')).find(el => el.textContent.toLowerCase().includes('ticket'));
                        if (crearTab) {
                            if (typeof navigateToPage === 'function') {
                                navigateToPage('page-crear-ticket');
                            } else {
                                crearTab.click();
                            }
                            setTimeout(() => {
                                const nameInp = document.getElementById('ticket-client-name');
                                const rutInp = document.getElementById('ticket-client-rut');
                                const emailInp = document.getElementById('ticket-client-email');
                                if (nameInp) nameInp.value = name;
                                if (rutInp) rutInp.value = rut;
                                if (emailInp) emailInp.value = email;
                                if (company && typeof selectCompanyCard === 'function') selectCompanyCard(company);
                            }, 120);
                        }
                    });
                });
            }
        }

        // Paginación info y botones
        const pageInfo = document.getElementById('directory-page-info');
        if (pageInfo) {
            const start = filtered.length === 0 ? 0 : startIdx + 1;
            const end = Math.min(startIdx + DIRECTORY_PAGE_SIZE, filtered.length);
            pageInfo.textContent = `Mostrando ${start}-${end} de ${filtered.length} colaboradores`;
        }

        const pageBtns = document.getElementById('directory-page-buttons');
        if (pageBtns) {
            let html = '';
            if (totalPages > 1) {
                html += `<button type="button" class="btn-page-nav" ${directoryCurrentPage === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} onclick="changeDirectoryPage(${directoryCurrentPage - 1})" style="padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-chevron-left"></i></button>`;
                
                for (let p = 1; p <= totalPages; p++) {
                    if (p === 1 || p === totalPages || (p >= directoryCurrentPage - 1 && p <= directoryCurrentPage + 1)) {
                        const activeStyle = p === directoryCurrentPage ? 'background: var(--accent-blue); color: white; border-color: var(--accent-blue); font-weight: 700;' : 'background: var(--bg-card); color: var(--text-secondary); border-color: var(--border-color);';
                        html += `<button type="button" onclick="changeDirectoryPage(${p})" style="padding: 4px 10px; border: 1px solid; border-radius: 6px; cursor: pointer; ${activeStyle}">${p}</button>`;
                    } else if (p === directoryCurrentPage - 2 || p === directoryCurrentPage + 2) {
                        html += `<span style="padding: 4px 6px; color: var(--text-muted);">...</span>`;
                    }
                }

                html += `<button type="button" class="btn-page-nav" ${directoryCurrentPage === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} onclick="changeDirectoryPage(${directoryCurrentPage + 1})" style="padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-chevron-right"></i></button>`;
            }
            pageBtns.innerHTML = html;
        }
    }

    function initDirectoryModule() {
        // Tab switcher in #page-usuarios
        const tabBtnDirectorio = document.getElementById('tab-btn-directorio');
        const tabBtnRoles = document.getElementById('tab-btn-roles');
        const contentDirectorio = document.getElementById('user-tab-directorio-content');
        const contentRoles = document.getElementById('user-tab-roles-content');

        if (tabBtnDirectorio && tabBtnRoles) {
            tabBtnDirectorio.addEventListener('click', () => {
                tabBtnDirectorio.classList.add('active');
                tabBtnRoles.classList.remove('active');
                if (contentDirectorio) contentDirectorio.style.display = 'block';
                if (contentRoles) contentRoles.style.display = 'none';
                renderDirectoryPage();
            });

            tabBtnRoles.addEventListener('click', () => {
                tabBtnRoles.classList.add('active');
                tabBtnDirectorio.classList.remove('active');
                if (contentRoles) contentRoles.style.display = 'block';
                if (contentDirectorio) contentDirectorio.style.display = 'none';
                renderUsuariosPage();
            });
        }

        // Search & Filter listeners
        const searchInput = document.getElementById('directory-search-input');
        const companyFilter = document.getElementById('directory-company-filter');
        const typeFilter = document.getElementById('directory-type-filter');

        let directorySearchTimer = null;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                directoryCurrentPage = 1;
                clearTimeout(directorySearchTimer);
                directorySearchTimer = setTimeout(renderDirectoryPage, 160);
            });
        }

        if (companyFilter) {
            companyFilter.addEventListener('change', () => {
                directoryCurrentPage = 1;
                renderDirectoryPage();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                directoryCurrentPage = 1;
                renderDirectoryPage();
            });
        }

        // Modal Nuevo Colaborador
        const btnOpenModal = document.getElementById('btn-open-add-collab-modal');
        const modal = document.getElementById('modal-crear-colaborador');
        const btnCloseModal = document.getElementById('btn-close-collab-modal');
        const btnCancelModal = document.getElementById('btn-cancel-collab-modal');
        const form = document.getElementById('form-crear-colaborador');

        if (btnOpenModal && modal) {
            btnOpenModal.addEventListener('click', () => {
                document.getElementById('collab-modal-title').textContent = 'Nuevo Colaborador';
                document.getElementById('collab-modal-icon').className = 'fas fa-user-plus';
                document.getElementById('collab-original-email').value = '';
                if (form) form.reset();
                modal.style.display = 'flex';
            });
        }

        const closeModal = () => {
            if (modal) {
                modal.style.display = 'none';
                if (form) form.reset();
            }
        };

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const originalEmail = document.getElementById('collab-original-email')?.value.trim();
                
                const nombre = document.getElementById('collab-name')?.value.trim();
                const rut = document.getElementById('collab-rut')?.value.trim();
                const empresa = document.getElementById('collab-company')?.value;
                const email = document.getElementById('collab-email')?.value.trim();
                const tipo = document.getElementById('collab-type')?.value;
                const licencia = document.getElementById('collab-license')?.value.trim() || 'M365 Asignado';
                const pass = document.getElementById('collab-password')?.value;

                if (!nombre || !rut || !email) {
                    alert('Por favor completa los campos obligatorios (*)');
                    return;
                }
                
                let users = loadDirectoryUsers();
                const previousUser = originalEmail
                    ? users.find(u => normalizeStr(u.email) === normalizeStr(originalEmail))
                    : null;
                const newUser = {
                    nombre,
                    rut,
                    empresa,
                    email,
                    tipo,
                    licencia
                };
                if (pass) newUser.password_usuario = pass;
                else if (previousUser && previousUser.password_usuario) newUser.password_usuario = previousUser.password_usuario;
                
                if (originalEmail) {
                    // Modo Edición
                    users = users.filter(u => u.email !== originalEmail);
                }
                
                users.unshift(newUser);
                saveDirectoryUsers(users);
                
                // Payload para Supabase con password si se ingresó
                const supabasePayload = { ...newUser };
                
                // Sincronizar con Supabase si está disponible
                if (typeof supabase !== 'undefined' && supabase && !useLocalFallback) {
                    try {
                        // Si cambió el correo en edición, borrar el antiguo
                        if (originalEmail && originalEmail !== email) {
                            await supabase.from('directorio_usuarios').delete().eq('email', originalEmail);
                        }
                        
                        const { error: upsertError } = await supabase.from('directorio_usuarios').upsert([supabasePayload], { onConflict: 'email' });
                        if (upsertError) {
                            alert('Hubo un error al guardar en la nube (Supabase): ' + upsertError.message);
                            console.error(upsertError);
                            return;
                        }
                    } catch(err) {
                        alert('Error guardando colaborador en Supabase: ' + err.message);
                        console.error(err);
                        return;
                    }
                }

                closeModal();
                renderDirectoryPage();
                
                // Mostrar notificación
                console.log(`Colaborador ${nombre} guardado exitosamente.`);
                alert(`Colaborador ${nombre} guardado exitosamente.`);
            });
        }

        const modalPerfil = document.getElementById('modal-perfil-colaborador');
        const btnClosePerfil = document.getElementById('btn-close-perfil-modal');
        const closeProfileModal = () => {
            if (modalPerfil) modalPerfil.style.display = 'none';
        };
        if (btnClosePerfil) {
            btnClosePerfil.addEventListener('click', closeProfileModal);
        }
        if (modalPerfil) {
            modalPerfil.addEventListener('click', (event) => {
                if (event.target === modalPerfil) closeProfileModal();
            });
        }
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modalPerfil && modalPerfil.style.display === 'flex') closeProfileModal();
        });

        const managePasswordBtn = document.getElementById('btn-manage-profile-password');
        const passwordEditor = document.getElementById('profile-password-editor');
        const newPasswordInput = document.getElementById('profile-new-password');
        const cancelPasswordBtn = document.getElementById('btn-cancel-profile-password');
        const savePasswordBtn = document.getElementById('btn-save-profile-password');

        if (managePasswordBtn && passwordEditor && newPasswordInput) {
            managePasswordBtn.addEventListener('click', () => {
                passwordEditor.hidden = false;
                newPasswordInput.value = '';
                newPasswordInput.placeholder = managePasswordBtn.dataset.mode === 'edit'
                    ? 'Escribe la nueva contraseña'
                    : 'Escribe una contraseña para este usuario';
                newPasswordInput.focus();
            });
        }
        if (cancelPasswordBtn && passwordEditor && newPasswordInput) {
            cancelPasswordBtn.addEventListener('click', () => {
                passwordEditor.hidden = true;
                newPasswordInput.value = '';
            });
        }
        if (savePasswordBtn && newPasswordInput && passwordEditor) {
            savePasswordBtn.addEventListener('click', async () => {
                const newPassword = newPasswordInput.value;
                const targetEmail = document.getElementById('perfil-password-display')?.getAttribute('data-target-email');
                if (!newPassword.trim()) {
                    alert('Ingresa una contraseña antes de guardar.');
                    newPasswordInput.focus();
                    return;
                }
                if (!targetEmail) {
                    alert('No se pudo identificar al usuario seleccionado.');
                    return;
                }

                const originalButton = savePasswordBtn.innerHTML;
                savePasswordBtn.disabled = true;
                savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                try {
                    const cloudSaved = await saveProfilePassword(targetEmail, newPassword);
                    applyProfilePasswordState(true);
                    passwordEditor.hidden = true;
                    newPasswordInput.value = '';
                    alert(cloudSaved
                        ? 'Contraseña guardada correctamente en la bóveda.'
                        : 'Contraseña guardada en este navegador. Se sincronizará cuando Supabase esté disponible.');
                } catch (error) {
                    alert('No fue posible guardar la contraseña: ' + (error.message || 'error desconocido'));
                    console.warn('Error guardando contraseña del perfil:', error);
                } finally {
                    savePasswordBtn.disabled = false;
                    savePasswordBtn.innerHTML = originalButton;
                }
            });
        }
        
        const btnRevealPassword = document.getElementById('btn-reveal-password');
        if (btnRevealPassword) {
            btnRevealPassword.addEventListener('click', async () => {
                const passInput = document.getElementById('perfil-password-display');
                if (passInput.type === 'text') {
                    passInput.type = 'password';
                    passInput.value = '********';
                    btnRevealPassword.innerHTML = '<i class="fas fa-eye"></i>';
                    return;
                }

                if (!currentSession || !currentSession.email) {
                    alert('Debes iniciar sesión como administrador para ver esta contraseña.');
                    return;
                }

                const adminPass = prompt(`Autorización requerida.\nIngresa la contraseña del administrador (${currentSession.nombre}):`);
                if (!adminPass) return;

                const validAdmin = await authenticateUser(currentSession.email, adminPass);
                if (!validAdmin) {
                    alert('Contraseña de administrador incorrecta.');
                    return;
                }

                let adminPin = prompt(`Ingresa tu PIN de seguridad de Administrador (${currentSession.nombre}):`);
                if (!adminPin) return;
                adminPin = adminPin.trim();

                const validPin = await verifyAdminPinFromSupabase(currentSession.email, adminPin);
                if (!validPin) {
                    alert('PIN de administrador incorrecto. Acceso denegado.');
                    return;
                }

                const targetEmail = passInput.getAttribute('data-target-email');

                if (currentProfilePasswordCache.email === normalizeStr(targetEmail) && currentProfilePasswordCache.value) {
                    passInput.type = 'text';
                    passInput.value = currentProfilePasswordCache.value;
                    btnRevealPassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else if (typeof supabase !== 'undefined' && supabase && !useLocalFallback) {
                    try {
                        const { data, error } = await supabase
                            .from('directorio_usuarios')
                            .select('password_usuario')
                            .eq('email', targetEmail)
                            .single();

                        if (error || !data) {
                            alert('Usuario no encontrado en la base de datos o sin contraseña asignada.');
                            return;
                        }

                        if (!data.password_usuario) {
                            alert('Este usuario no tiene una contraseña registrada.');
                            return;
                        }

                        passInput.type = 'text';
                        passInput.value = data.password_usuario;
                        currentProfilePasswordCache = { email: normalizeStr(targetEmail), value: data.password_usuario };
                        btnRevealPassword.innerHTML = '<i class="fas fa-eye-slash"></i>';

                    } catch (err) {
                        alert('Error al conectar con la base de datos.');
                        console.warn(err);
                    }
                } else {
                    const localUser = loadDirectoryUsers().find(u => normalizeStr(u.email) === normalizeStr(targetEmail));
                    if (!localUser || !localUser.password_usuario) {
                        alert('Este usuario no tiene una contraseña registrada.');
                        applyProfilePasswordState(false);
                        return;
                    }
                    passInput.type = 'text';
                    passInput.value = localUser.password_usuario;
                    currentProfilePasswordCache = { email: normalizeStr(targetEmail), value: localUser.password_usuario };
                    btnRevealPassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
                }
            });
        }

        // El directorio se renderiza al abrir la sección, no durante la carga inicial.
    }

    // ============================================
    // 8. MÓDULO ADMINISTRACIÓN M365 & SEGURIDAD PIN
    // ============================================
    const getSessionStorageItem = (k) => {
        try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(k) : localStorage.getItem(k); } catch(e){ return null; }
    };
    const setSessionStorageItem = (k, v) => {
        try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(k, v); else localStorage.setItem(k, v); } catch(e){}
    };
    const removeSessionStorageItem = (k) => {
        try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(k); else localStorage.removeItem(k); } catch(e){}
    };

    let isM365Unlocked = getSessionStorageItem('m365_unlocked') === 'true';
    let currentM365Company = 'T-Sales';
    let m365CurrentPage = 1;
    const M365_ITEMS_PER_PAGE = 15;

    // PINs de Administradores
    const DEFAULT_ADMIN_PINS = {
        'belfor.aburto@t-sales.cl': ['1438', '143belfor', 'admin2026', 'tsales2026'],
        'felipe.olivares@t-sales.cl': ['7392', 'felipe.tsales#26', 'felipe7392', 'admin2026', 'tsales2026'],
        'omar.galvez@t-sales.cl': ['5841', 'omar.tsales#26', 'omar5841', 'admin2026', 'tsales2026']
    };

    function getAdminValidPins() {
        const custom = localStorage.getItem('m365_custom_admin_pins');
        if (custom) {
            try { return JSON.parse(custom); } catch(e){}
        }
        return DEFAULT_ADMIN_PINS;
    }

    async function verifyAdminPinFromSupabase(email, enteredPin) {
        const cleanEmail = (email || '').toLowerCase().trim();
        const cleanPin = (enteredPin || '').trim();

        // 1. Intentar validar en la tabla 'admin_security_pins' en Supabase
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('admin_security_pins')
                    .select('*')
                    .eq('email', cleanEmail)
                    .maybeSingle();

                if (!error && data) {
                    const dbPin = (data.pin || '').toString().trim();
                    const dbPass = (data.password_secret || data.password || '').toString().trim();
                    if (cleanPin === dbPin || cleanPin === dbPass) {
                        return true;
                    }
                }
            } catch (err) {
                console.warn('Tabla admin_security_pins no disponible en Supabase. Usando fallback:', err);
            }
        }

        // 2. Si no hay conexión o no está en Supabase, usar DEFAULT_ADMIN_PINS
        const pinsObj = getAdminValidPins();
        let validPins = pinsObj[cleanEmail] || ['admin2026', 'tsales2026'];
        if (!Array.isArray(validPins)) validPins = [validPins];

        return validPins.includes(cleanPin) || cleanPin === 'admin2026' || cleanPin === 'tsales2026';
    }

    function openSecurityPinModal(targetCompany = 'T-Sales') {
        currentM365Company = targetCompany;
        const modal = document.getElementById('modal-security-pin-gate');
        const input = document.getElementById('input-security-pin');
        const errorMsg = document.getElementById('pin-error-msg');
        const adminName = document.getElementById('pin-admin-name');
        const adminAvatar = document.getElementById('pin-admin-avatar');

        if (!modal) return;

        if (adminName && currentSession) {
            adminName.textContent = currentSession.nombre || 'Administrador';
        }
        if (adminAvatar && currentSession) {
            const initials = (currentSession.nombre || 'AD').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            adminAvatar.textContent = initials;
        }

        if (errorMsg) errorMsg.style.display = 'none';
        if (input) {
            input.value = '';
            input.type = 'password';
        }

        modal.style.display = 'flex';
        setTimeout(() => { if (input) input.focus(); }, 100);
    }
    window.openSecurityPinModal = openSecurityPinModal;

    async function submitSecurityPin() {
        const input = document.getElementById('input-security-pin');
        const errorMsg = document.getElementById('pin-error-msg');
        const modal = document.getElementById('modal-security-pin-gate');
        const card = modal?.querySelector('.modal-card');

        if (!input) return;
        const enteredPin = input.value.trim();

        const currentEmail = (currentSession?.email || 'belfor.aburto@t-sales.cl').toLowerCase();
        const isValid = await verifyAdminPinFromSupabase(currentEmail, enteredPin);

        if (isValid) {
            isM365Unlocked = true;
            setSessionStorageItem('m365_unlocked', 'true');
            if (modal) modal.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';

            // Navegar a la página de M365
            const navLi = document.getElementById(`nav-panel-${currentM365Company.toLowerCase().replace('-', '')}`) || document.getElementById('nav-panel-tsales');
            navigateToPage('page-panel-m365', navLi, currentM365Company);
            switchM365Company(currentM365Company);
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
            if (card) {
                card.classList.remove('pin-shake');
                void card.offsetWidth;
                card.classList.add('pin-shake');
            }
            input.value = '';
            input.focus();
        }
    }
    window.submitSecurityPin = submitSecurityPin;

    function lockM365Panel() {
        isM365Unlocked = false;
        removeSessionStorageItem('m365_unlocked');
        navigateToPage('page-inicio');
        alert('El Panel M365 ha sido bloqueado por seguridad.');
    }
    window.lockM365Panel = lockM365Panel;

    function switchM365Company(company) {
        currentM365Company = company;
        m365CurrentPage = 1;

        // Actualizar tabs
        document.querySelectorAll('.directory-tab-btn').forEach(btn => {
            if (btn.id === `m365-tab-${company.toLowerCase().replace('-', '')}`) {
                btn.classList.add('active');
            } else if (btn.id && btn.id.startsWith('m365-tab-')) {
                btn.classList.remove('active');
            }
        });

        // Actualizar logo y título del panel
        const logo = document.getElementById('m365-panel-company-logo');
        const title = document.getElementById('m365-panel-title');
        if (logo) {
            if (company === 'T-Sales') logo.src = 'img/logo_tsales.png';
            else if (company === 'Infinet') logo.src = 'img/logo_infinet.png';
            else if (company === 'VPrime') logo.src = 'img/logo_vprime.png';
        }
        if (title) {
            title.textContent = `Panel de Administración M365 • ${company === 'VPrime' ? 'V PRIME' : company}`;
        }

        renderM365Panel();
    }
    window.switchM365Company = switchM365Company;

    function renderM365Panel() {
        const tbody = document.getElementById('m365-table-body');
        if (!tbody) return;

        const allUsers = loadDirectoryUsers();
        
        // Contar por empresa para badges de tabs
        const countTSales = allUsers.filter(u => u.empresa === 'T-Sales').length;
        const countInfinet = allUsers.filter(u => u.empresa === 'Infinet').length;
        const countVPrime = allUsers.filter(u => u.empresa === 'VPrime').length;

        const elCountTS = document.getElementById('m365-count-tsales');
        const elCountInf = document.getElementById('m365-count-infinet');
        const elCountVP = document.getElementById('m365-count-vprime');
        if (elCountTS) elCountTS.textContent = countTSales;
        if (elCountInf) elCountInf.textContent = countInfinet;
        if (elCountVP) elCountVP.textContent = countVPrime;

        // Filtrar por empresa actual
        let filtered = allUsers.filter(u => u.empresa === currentM365Company);

        // Actualizar métricas
        const statTotal = document.getElementById('m365-stat-total');
        const statBasic = document.getElementById('m365-stat-basic');
        const statFabric = document.getElementById('m365-stat-fabric');
        const statActive = document.getElementById('m365-stat-active');

        const totalCompanyUsers = filtered.length;
        const basicLicenses = filtered.filter(u => (u.licencia || '').toLowerCase().includes('básico') || (u.licencia || '').toLowerCase().includes('basico') || (u.licencia || '').toLowerCase().includes('standard')).length;
        const fabricLicenses = filtered.filter(u => (u.licencia || '').toLowerCase().includes('fabric') || (u.licencia || '').toLowerCase().includes('automate') || (u.licencia || '').toLowerCase().includes('unlicensed')).length;

        if (statTotal) statTotal.textContent = totalCompanyUsers;
        if (statBasic) statBasic.textContent = basicLicenses;
        if (statFabric) statFabric.textContent = fabricLicenses;
        if (statActive) statActive.textContent = '100%';

        // Filtros de búsqueda, licencia y tipo
        const searchVal = (document.getElementById('m365-search-input')?.value || '').toLowerCase().trim();
        const licenseVal = document.getElementById('m365-license-filter')?.value || 'todas';
        const typeVal = document.getElementById('m365-type-filter')?.value || 'todos';

        if (searchVal) {
            filtered = filtered.filter(u => 
                (u.nombre || '').toLowerCase().includes(searchVal) ||
                (u.email || '').toLowerCase().includes(searchVal) ||
                (u.rut || '').toLowerCase().includes(searchVal)
            );
        }

        if (licenseVal !== 'todas') {
            filtered = filtered.filter(u => (u.licencia || '').toLowerCase().includes(licenseVal.toLowerCase()));
        }

        if (typeVal !== 'todos') {
            filtered = filtered.filter(u => (u.tipo || '').toLowerCase() === typeVal.toLowerCase());
        }

        // Paginación
        const totalFiltered = filtered.length;
        const totalPages = Math.ceil(totalFiltered / M365_ITEMS_PER_PAGE) || 1;
        if (m365CurrentPage > totalPages) m365CurrentPage = totalPages;
        if (m365CurrentPage < 1) m365CurrentPage = 1;

        const startIdx = (m365CurrentPage - 1) * M365_ITEMS_PER_PAGE;
        const pageUsers = filtered.slice(startIdx, startIdx + M365_ITEMS_PER_PAGE);

        if (pageUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-search" style="font-size: 1.8rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>No se encontraron usuarios en Microsoft 365 con los filtros aplicados.</td></tr>`;
        } else {
            tbody.innerHTML = pageUsers.map(u => {
                const initials = (u.nombre || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                
                let avatarColor = 'linear-gradient(135deg, #00c9a7 0%, #008f7a 100%)';
                if (u.empresa === 'Infinet') avatarColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                else if (u.empresa === 'VPrime') avatarColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

                let licenseBadgeClass = 'badge-license-basic';
                let licenseIcon = '<i class="fab fa-microsoft"></i>';
                const licLower = (u.licencia || '').toLowerCase();
                if (licLower.includes('fabric')) {
                    licenseBadgeClass = 'badge-license-fabric';
                    licenseIcon = '<i class="fas fa-bolt"></i>';
                } else if (licLower.includes('automate')) {
                    licenseBadgeClass = 'badge-license-automate';
                    licenseIcon = '<i class="fas fa-robot"></i>';
                } else if (licLower.includes('unlicensed') || licLower.includes('sin licencia')) {
                    licenseBadgeClass = 'badge-license-none';
                    licenseIcon = '<i class="fas fa-ban"></i>';
                }

                return `
                <tr class="m365-table-row" style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <td style="padding: 12px 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="autocomplete-avatar" style="background: ${avatarColor};">${initials}</div>
                            <div style="display: flex; flex-direction: column;">
                                <strong style="color: var(--text-primary); font-size: 0.88rem;">${escapeHtml(u.nombre)}</strong>
                                <span style="color: var(--text-secondary); font-size: 0.76rem;"><i class="far fa-envelope" style="margin-right: 4px;"></i>${escapeHtml(u.email || '-')}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px 16px; font-family: monospace; font-size: 0.84rem; color: var(--text-primary);">${escapeHtml(u.rut || '-')}</td>
                    <td style="padding: 12px 16px;">
                        <span class="${licenseBadgeClass}">
                            ${licenseIcon} ${escapeHtml(u.licencia || 'M365 Activo')}
                        </span>
                    </td>
                    <td style="padding: 12px 16px;">
                        <span class="autocomplete-badge badge-tipo">${escapeHtml(u.tipo || 'Ejecutivo')}</span>
                    </td>
                    <td style="padding: 12px 16px;">
                        <span class="status-badge status-resuelto" style="font-size: 0.72rem; padding: 2px 8px;">
                            <i class="fas fa-check-circle"></i> Habilitado
                        </span>
                    </td>
                    <td style="padding: 12px 16px; text-align: right;">
                        <div style="display: inline-flex; gap: 6px;">
                            <button type="button" class="btn-detail-m365-user" data-email="${escapeHtml(u.email)}" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary); padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Ver detalles técnicos M365">
                                <i class="fas fa-eye"></i> Detalle
                            </button>
                            <button type="button" class="btn-create-ticket-for-user" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" style="background: rgba(97, 62, 234, 0.15); border: 1px solid rgba(97, 62, 234, 0.3); color: var(--accent-purple); padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Crear ticket para este colaborador">
                                <i class="fas fa-plus"></i> Ticket
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');

            // Bind detail buttons
            tbody.querySelectorAll('.btn-detail-m365-user').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    const user = allUsers.find(u => u.email === email);
                    if (user) openM365UserDetailModal(user);
                });
            });

            // Bind create ticket buttons
            tbody.querySelectorAll('.btn-create-ticket-for-user').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    const rut = btn.getAttribute('data-rut');
                    const email = btn.getAttribute('data-email');
                    const company = btn.getAttribute('data-company');

                    const navCrear = document.getElementById('nav-crear-ticket');
                    navigateToPage('page-crear-ticket', navCrear);

                    const nameInput = document.getElementById('ticket-client-name');
                    const rutInput = document.getElementById('ticket-client-rut');
                    const emailInput = document.getElementById('ticket-client-email');

                    if (nameInput) nameInput.value = name || '';
                    if (rutInput) rutInput.value = rut || '';
                    if (emailInput) emailInput.value = email || '';

                    if (typeof selectCompanyCard === 'function' && company) {
                        selectCompanyCard(company);
                    }
                });
            });
        }

        // Paginación UI
        const pageInfo = document.getElementById('m365-page-info');
        const pageBtns = document.getElementById('m365-page-buttons');
        if (pageInfo) {
            const startDisplay = totalFiltered === 0 ? 0 : startIdx + 1;
            const endDisplay = Math.min(startIdx + M365_ITEMS_PER_PAGE, totalFiltered);
            pageInfo.textContent = `Mostrando ${startDisplay}-${endDisplay} de ${totalFiltered} usuarios`;
        }

        if (pageBtns) {
            pageBtns.innerHTML = '';
            if (totalPages > 1) {
                for (let p = 1; p <= totalPages; p++) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.textContent = p;
                    btn.style.padding = '4px 10px';
                    btn.style.borderRadius = '6px';
                    btn.style.fontSize = '0.78rem';
                    btn.style.fontWeight = '600';
                    btn.style.cursor = 'pointer';
                    btn.style.border = p === m365CurrentPage ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)';
                    btn.style.background = p === m365CurrentPage ? 'var(--accent-blue)' : 'transparent';
                    btn.style.color = p === m365CurrentPage ? '#ffffff' : 'var(--text-secondary)';
                    btn.addEventListener('click', () => {
                        m365CurrentPage = p;
                        renderM365Panel();
                    });
                    pageBtns.appendChild(btn);
                }
            }
        }
    }
    window.renderM365Panel = renderM365Panel;

    function openM365UserDetailModal(user) {
        const modal = document.getElementById('modal-m365-user-detail');
        if (!modal) return;

        const nameEl = document.getElementById('m365-detail-name');
        const emailEl = document.getElementById('m365-detail-email');
        const rutEl = document.getElementById('m365-detail-rut');
        const companyEl = document.getElementById('m365-detail-company');
        const typeEl = document.getElementById('m365-detail-type');
        const licContainer = document.getElementById('m365-detail-licenses');
        const avatar = document.getElementById('m365-detail-avatar');

        if (nameEl) nameEl.textContent = user.nombre || '-';
        if (emailEl) emailEl.textContent = user.email || '-';
        if (rutEl) rutEl.textContent = user.rut || '-';
        if (companyEl) companyEl.textContent = user.empresa || '-';
        if (typeEl) typeEl.textContent = user.tipo || 'Ejecutivo';

        if (avatar) {
            const initials = (user.nombre || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            avatar.textContent = initials;
        }

        if (licContainer) {
            licContainer.innerHTML = `
                <span class="badge-license-basic"><i class="fab fa-microsoft"></i> ${escapeHtml(user.licencia || 'Microsoft 365 Asignado')}</span>
                <span class="badge-license-fabric"><i class="fas fa-shield-alt"></i> Azure AD Cloud Sync</span>
            `;
        }

        const createTicketBtn = document.getElementById('btn-create-ticket-from-m365');
        if (createTicketBtn) {
            createTicketBtn.onclick = () => {
                modal.style.display = 'none';
                const navCrear = document.getElementById('nav-crear-ticket');
                navigateToPage('page-crear-ticket', navCrear);

                const nameInput = document.getElementById('ticket-client-name');
                const rutInput = document.getElementById('ticket-client-rut');
                const emailInput = document.getElementById('ticket-client-email');

                if (nameInput) nameInput.value = user.nombre || '';
                if (rutInput) rutInput.value = user.rut || '';
                if (emailInput) emailInput.value = user.email || '';

                if (typeof selectCompanyCard === 'function' && user.empresa) {
                    selectCompanyCard(user.empresa);
                }
            };
        }

        modal.style.display = 'flex';
    }

    function initM365Module() {
        // Toggle PIN visibility
        const togglePinBtn = document.getElementById('btn-toggle-pin-visibility');
        const pinInput = document.getElementById('input-security-pin');
        if (togglePinBtn && pinInput) {
            togglePinBtn.addEventListener('click', () => {
                const isPassword = pinInput.type === 'password';
                pinInput.type = isPassword ? 'text' : 'password';
                togglePinBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        }

        // Cancel PIN modal
        const btnCancelPin = document.getElementById('btn-cancel-pin-gate');
        if (btnCancelPin) {
            btnCancelPin.addEventListener('click', () => {
                const modal = document.getElementById('modal-security-pin-gate');
                if (modal) modal.style.display = 'none';
            });
        }

        // Lock button
        const btnLock = document.getElementById('btn-lock-m365-panel');
        if (btnLock) {
            btnLock.addEventListener('click', lockM365Panel);
        }

        // Tabs click
        const tabTS = document.getElementById('m365-tab-tsales');
        const tabInf = document.getElementById('m365-tab-infinet');
        const tabVP = document.getElementById('m365-tab-vprime');

        if (tabTS) tabTS.addEventListener('click', () => switchM365Company('T-Sales'));
        if (tabInf) tabInf.addEventListener('click', () => switchM365Company('Infinet'));
        if (tabVP) tabVP.addEventListener('click', () => switchM365Company('VPrime'));

    // Configuración predeterminada de Microsoft Graph API
    const DEFAULT_GRAPH_CONFIG = {
        tenantId: 'b66f852d-cae1-4717-966e-22a3a7ec4ccb',
        clientId: '617f981d-7790-4b59-b402-8730941038cd',
        clientSecret: 'e4n8Q~BOjY2E6HETJ4L3MVQu7Ykv1GhSaQb4Kb5N'
    };

    function loadGraphConfig() {
        const saved = localStorage.getItem('m365_graph_config');
        if (saved) {
            try { return JSON.parse(saved); } catch(e){}
        }
        return DEFAULT_GRAPH_CONFIG;
    }

    async function syncMicrosoftGraphData() {
        const config = loadGraphConfig();
        if (!config || !config.tenantId || !config.clientId || !config.clientSecret) {
            console.log('Faltan credenciales de Microsoft Graph.');
            return false;
        }

        try {
            // 1. Obtener Token OAuth2 de Microsoft Entra ID
            const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
            const params = new URLSearchParams();
            params.append('client_id', config.clientId);
            params.append('scope', 'https://graph.microsoft.com/.default');
            params.append('client_secret', config.clientSecret);
            params.append('grant_type', 'client_credentials');

            const tokenRes = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            if (!tokenRes.ok) {
                const errJson = await tokenRes.json().catch(() => ({}));
                console.warn('Error al obtener token de Microsoft Graph:', errJson);
                return false;
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;
            if (!accessToken) return false;

            // 2. Consultar usuarios en Microsoft Graph
            const usersUrl = 'https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,accountEnabled,jobTitle,department,usageLocation,assignedLicenses,createdDateTime&$top=999';
            const usersRes = await fetch(usersUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!usersRes.ok) {
                console.warn('Error al consultar usuarios en Microsoft Graph API');
                return false;
            }

            const usersData = await usersRes.json();
            const graphUsers = usersData.value || [];
            console.log(`Sincronizados ${graphUsers.length} usuarios desde Microsoft Graph API.`);

            // Guardar cache de sincronización
            localStorage.setItem('m365_graph_users_cache', JSON.stringify(graphUsers));
            localStorage.setItem('m365_last_sync_time', new Date().toISOString());

            // Actualizar badge de estado
            const statusBadge = document.getElementById('m365-graph-status-badge');
            const statusText = document.getElementById('m365-graph-status-text');
            if (statusBadge && statusText) {
                statusBadge.style.background = 'rgba(0, 201, 167, 0.15)';
                statusBadge.style.color = '#00c9a7';
                statusBadge.style.border = '1px solid rgba(0, 201, 167, 0.3)';
                statusText.textContent = `Graph API Conectado (${graphUsers.length} usuarios)`;
            }

            return true;
        } catch (err) {
            console.warn('Conexión directa Graph API limitada por política de navegador o red. Usando base de datos local.', err);
            return false;
        }
    }

        // Sync button
        const btnSync = document.getElementById('btn-sync-m365');
        const syncIcon = document.getElementById('m365-sync-icon');
        if (btnSync) {
            btnSync.addEventListener('click', async () => {
                if (syncIcon) syncIcon.classList.add('spin-sync');
                btnSync.disabled = true;
                
                await syncMicrosoftGraphData();
                await new Promise(r => setTimeout(r, 600));
                
                renderM365Panel();
                if (syncIcon) syncIcon.classList.remove('spin-sync');
                btnSync.disabled = false;
            });
        }

        // Search & filters
        const searchInput = document.getElementById('m365-search-input');
        const licenseFilter = document.getElementById('m365-license-filter');
        const typeFilter = document.getElementById('m365-type-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                m365CurrentPage = 1;
                renderM365Panel();
            });
        }
        if (licenseFilter) {
            licenseFilter.addEventListener('change', () => {
                m365CurrentPage = 1;
                renderM365Panel();
            });
        }
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                m365CurrentPage = 1;
                renderM365Panel();
            });
        }

        // Graph config modal
        const btnOpenGraph = document.getElementById('btn-open-graph-config');
        const modalGraph = document.getElementById('modal-graph-api-config');
        const btnCloseGraph = document.getElementById('btn-close-graph-modal');
        const btnCancelGraph = document.getElementById('btn-cancel-graph-modal');
        const formGraph = document.getElementById('form-graph-api-config');

        if (btnOpenGraph && modalGraph) {
            btnOpenGraph.addEventListener('click', () => {
                const config = loadGraphConfig();
                const tenantInput = document.getElementById('graph-tenant-id');
                const clientInput = document.getElementById('graph-client-id');
                const secretInput = document.getElementById('graph-client-secret');

                if (tenantInput) tenantInput.value = config.tenantId || '';
                if (clientInput) clientInput.value = config.clientId || '';
                if (secretInput) secretInput.value = config.clientSecret || '';

                modalGraph.style.display = 'flex';
            });
        }

        const closeGraphModal = () => {
            if (modalGraph) modalGraph.style.display = 'none';
        };

        if (btnCloseGraph) btnCloseGraph.addEventListener('click', closeGraphModal);
        if (btnCancelGraph) btnCancelGraph.addEventListener('click', closeGraphModal);

        if (formGraph) {
            formGraph.addEventListener('submit', (e) => {
                e.preventDefault();
                const tenantId = document.getElementById('graph-tenant-id')?.value.trim();
                const clientId = document.getElementById('graph-client-id')?.value.trim();
                const clientSecret = document.getElementById('graph-client-secret')?.value.trim();

                const config = { tenantId, clientId, clientSecret };
                localStorage.setItem('m365_graph_config', JSON.stringify(config));

                const resultEl = document.getElementById('graph-test-result');
                if (resultEl) {
                    resultEl.style.display = 'block';
                    resultEl.style.background = 'rgba(0, 201, 167, 0.15)';
                    resultEl.style.color = '#00c9a7';
                    resultEl.style.border = '1px solid rgba(0, 201, 167, 0.3)';
                    resultEl.innerHTML = '<i class="fas fa-check-circle"></i> Credenciales de Microsoft Graph guardadas correctamente.';
                }

                setTimeout(() => {
                    closeGraphModal();
                    if (resultEl) resultEl.style.display = 'none';
                    renderM365Panel();
                }, 1200);
            });
        }

        // Close user detail modal
        const btnCloseDetail = document.getElementById('btn-close-m365-detail-modal');
        const modalDetail = document.getElementById('modal-m365-user-detail');
        if (btnCloseDetail && modalDetail) {
            btnCloseDetail.addEventListener('click', () => {
                modalDetail.style.display = 'none';
            });
        }
    }

    // ========================================================
    // TABS Y SELECTOR: USUARIO EXISTENTE VS USUARIO NUEVO
    // ========================================================
    function setupTicketUserModeTabs() {
        const btnExisting = document.getElementById('btn-user-mode-existing');
        const btnNew = document.getElementById('btn-user-mode-new');
        const groupSearch = document.getElementById('group-search-existing-user');
        const groupExisting = document.getElementById('group-existing-user-select');
        const groupSaveCheck = document.getElementById('group-save-new-user-checkbox');
        const searchInput = document.getElementById('ticket-search-user-input');
        const searchDropdown = document.getElementById('ticket-search-user-dropdown');
        const userSelect = document.getElementById('ticket-existing-user-select');
        const nameInput = document.getElementById('ticket-client-name');
        const rutInput = document.getElementById('ticket-client-rut');
        const emailInput = document.getElementById('ticket-client-email');
        const phoneInput = document.getElementById('ticket-phone');
        const labelName = document.getElementById('label-ticket-client-name');
        const badgeStatus = document.getElementById('badge-autocomplete-status');
        const techSelect = document.getElementById('ticket-assigned-tech');

        // Preseleccionar técnico logueado
        prefillAssignedTech();

        function populateExistingUsersDropdown(filterText = '') {
            if (!userSelect) return;
            const users = loadDirectoryUsers();
            userSelect.innerHTML = '<option value="">-- Elige un colaborador o usa el buscador de arriba --</option>';
            
            const cleanFilter = filterText.toLowerCase().trim();
            const filteredUsers = cleanFilter
                ? users.filter(u => (u.nombre || '').toLowerCase().includes(cleanFilter) || (u.rut || '').toLowerCase().includes(cleanFilter) || (u.email || '').toLowerCase().includes(cleanFilter) || (u.empresa || '').toLowerCase().includes(cleanFilter))
                : users;

            const companies = ['T-Sales', 'Infinet', 'VPrime'];
            companies.forEach(comp => {
                const compUsers = filteredUsers.filter(u => (u.empresa || '').toLowerCase() === comp.toLowerCase());
                if (compUsers.length > 0) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = `─── ${comp.toUpperCase()} (${compUsers.length} usuarios) ───`;
                    compUsers.forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = JSON.stringify(u);
                        opt.textContent = `${u.nombre} (${u.rut || 'Sin RUT'}) - ${u.email || ''}`;
                        optgroup.appendChild(opt);
                    });
                    userSelect.appendChild(optgroup);
                }
            });

            const others = filteredUsers.filter(u => !companies.some(c => (u.empresa || '').toLowerCase() === c.toLowerCase()));
            if (others.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = '─── Otros Colaboradores ───';
                others.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = JSON.stringify(u);
                    opt.textContent = `${u.nombre} (${u.rut || 'Sin RUT'})`;
                    optgroup.appendChild(opt);
                });
                userSelect.appendChild(optgroup);
            }
        }

        populateExistingUsersDropdown();

        function applySelectedUser(user) {
            if (!user) return;
            if (nameInput) nameInput.value = user.nombre || '';
            if (rutInput) rutInput.value = user.rut || '';
            if (emailInput) emailInput.value = user.email || '';
            if (phoneInput && user.telefono) phoneInput.value = user.telefono;
            if (user.empresa) selectCompanyCard(user.empresa);
            if (searchInput) searchInput.value = `${user.nombre} (${user.rut || ''})`;

            [nameInput, rutInput, emailInput, searchInput].forEach(inp => {
                if (inp) {
                    inp.style.borderColor = 'var(--accent-blue)';
                    setTimeout(() => { inp.style.borderColor = 'var(--border-color)'; }, 1000);
                }
            });

            if (searchDropdown) searchDropdown.style.display = 'none';
        }

        // Barra de búsqueda con autocompletado en tiempo real
        if (searchInput && searchDropdown) {
            function renderSearchDropdown(matches) {
                if (!matches || matches.length === 0) {
                    searchDropdown.innerHTML = `
                        <div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                            <i class="fas fa-user-slash" style="margin-bottom: 4px; display: block; font-size: 1.2rem; opacity: 0.5;"></i>
                            No se encontraron colaboradores con ese término.
                        </div>
                    `;
                    searchDropdown.style.display = 'block';
                    return;
                }

                searchDropdown.innerHTML = matches.map((u, idx) => {
                    const initials = (u.nombre || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    const empColor = (u.empresa || '').toLowerCase() === 't-sales' ? '#3266eb' : ((u.empresa || '').toLowerCase() === 'vprime' ? '#8b5cf6' : '#10b981');
                    return `
                        <div class="autocomplete-suggestion-item" data-index="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.15s;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(50, 102, 235, 0.15); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; border: 1px solid rgba(50, 102, 235, 0.3);">
                                    ${initials}
                                </div>
                                <div>
                                    <div style="font-weight: 700; font-size: 0.86rem; color: var(--text-primary);">${escapeHtml(u.nombre)}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 8px;">
                                        <span><i class="fas fa-id-card" style="font-size: 0.68rem;"></i> ${escapeHtml(u.rut || 'Sin RUT')}</span>
                                        <span><i class="fas fa-envelope" style="font-size: 0.68rem;"></i> ${escapeHtml(u.email || '')}</span>
                                    </div>
                                </div>
                            </div>
                            <span style="font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: ${empColor}; border: 1px solid rgba(255,255,255,0.1); text-transform: uppercase;">
                                ${escapeHtml(u.empresa || 'Empresa')}
                            </span>
                        </div>
                    `;
                }).join('');

                searchDropdown.style.display = 'block';

                searchDropdown.querySelectorAll('.autocomplete-suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const idx = parseInt(item.getAttribute('data-index'), 10);
                        applySelectedUser(matches[idx]);
                    });
                });
            }

            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                populateExistingUsersDropdown(query);
                if (query.length < 1) {
                    searchDropdown.style.display = 'none';
                    return;
                }
                const allUsers = loadDirectoryUsers();
                const filtered = allUsers.filter(u => {
                    const n = (u.nombre || '').toLowerCase();
                    const r = (u.rut || '').toLowerCase();
                    const e = (u.email || '').toLowerCase();
                    const emp = (u.empresa || '').toLowerCase();
                    return n.includes(query) || r.includes(query) || e.includes(query) || emp.includes(query);
                }).slice(0, 10);

                renderSearchDropdown(filtered);
            });

            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length >= 1) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                    searchDropdown.style.display = 'none';
                }
            });
        }

        if (userSelect) {
            userSelect.addEventListener('change', () => {
                if (!userSelect.value) return;
                try {
                    const user = JSON.parse(userSelect.value);
                    applySelectedUser(user);
                } catch(e) {}
            });
        }

        if (btnExisting && btnNew) {
            btnExisting.addEventListener('click', () => {
                btnExisting.classList.add('active');
                btnExisting.style.background = 'var(--accent-blue)';
                btnExisting.style.color = 'white';

                btnNew.classList.remove('active');
                btnNew.style.background = 'transparent';
                btnNew.style.color = 'var(--text-secondary)';

                if (groupSearch) groupSearch.style.display = 'block';
                if (groupExisting) groupExisting.style.display = 'block';
                if (groupSaveCheck) groupSaveCheck.style.display = 'none';
                if (labelName) labelName.textContent = 'Nombre de la persona (Afectado) *';
                if (badgeStatus) badgeStatus.style.display = 'inline-flex';
                if (nameInput) nameInput.placeholder = 'Nombre de la persona afectada';
            });

            btnNew.addEventListener('click', () => {
                btnNew.classList.add('active');
                btnNew.style.background = 'var(--accent-blue)';
                btnNew.style.color = 'white';

                btnExisting.classList.remove('active');
                btnExisting.style.background = 'transparent';
                btnExisting.style.color = 'var(--text-secondary)';

                if (groupSearch) groupSearch.style.display = 'none';
                if (groupExisting) groupExisting.style.display = 'none';
                if (groupSaveCheck) groupSaveCheck.style.display = 'block';
                if (labelName) labelName.textContent = 'Nombre completo del nuevo usuario *';
                if (badgeStatus) badgeStatus.style.display = 'none';
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.placeholder = 'Ingresa el nombre del nuevo colaborador';
                    nameInput.focus();
                }
                if (rutInput) rutInput.value = '';
                if (emailInput) emailInput.value = '';
                if (phoneInput) phoneInput.value = '';
                if (userSelect) userSelect.value = '';
                if (searchInput) searchInput.value = '';
            });
        }
    }

    // =========================================================================
    // MÓDULO: COMPRAS TI & GESTIÓN DE HARDWARE Y ACCESORIOS
    // =========================================================================
    const defaultComprasSeed = [
        {
            id: 'comp-101',
            fecha: '2026-08-18',
            categoria: 'ram',
            categoria_nombre: 'Memoria RAM',
            icono: 'fas fa-memory',
            color: '#3266eb',
            producto: 'Memoria RAM Kingston Fury Impact 16GB DDR4 3200MHz Sodimm',
            marca: 'Kingston',
            cantidad: 2,
            valor_total: 85980,
            empresa: 'T-Sales',
            solicitante_nombre: 'Francisca Morales Castro',
            solicitante_rut: '19456789-0',
            solicitante_email: 'francisca.morales@t-sales.cl',
            tecnico: 'Felipe Olivares',
            proveedor: 'PC Factory',
            factura: 'FAC-78921',
            estado: 'entregado',
            notas: 'Upgrade de memoria por lentitud en multitarea y diseño.'
        },
        {
            id: 'comp-102',
            fecha: '2026-08-15',
            categoria: 'monitor',
            categoria_nombre: 'Monitor / Pantalla',
            icono: 'fas fa-desktop',
            color: '#8b5cf6',
            producto: 'Monitor LG UltraGear 24" IPS FHD 144Hz HDMI/DP',
            marca: 'LG',
            cantidad: 1,
            valor_total: 139990,
            empresa: 'T-Sales',
            solicitante_nombre: 'Anthony German',
            solicitante_rut: '26007243-9',
            solicitante_email: 'anthony.german@t-sales.cl',
            tecnico: 'Omar Gálvez',
            proveedor: 'SP Digital',
            factura: 'FAC-65412',
            estado: 'entregado',
            notas: 'Puesto comercial con configuración de doble pantalla para llamadas y CRM.'
        },
        {
            id: 'comp-103',
            fecha: '2026-08-12',
            categoria: 'cargador',
            categoria_nombre: 'Cargador / Fuente',
            icono: 'fas fa-plug',
            color: '#f59e0b',
            producto: 'Cargador Original Dell 65W Tipo-C USB-PD',
            marca: 'Dell',
            cantidad: 3,
            valor_total: 104970,
            empresa: 'Infinet',
            solicitante_nombre: 'Aaron Andres Aros',
            solicitante_rut: '20123456-7',
            solicitante_email: 'aaron.aros@infinet.cl',
            tecnico: 'Belfor Aburto',
            proveedor: 'Dell Chile',
            factura: 'FAC-99321',
            estado: 'entregado',
            notas: 'Reemplazo de cargador dañado + 2 cargadores de respaldo para sede.'
        },
        {
            id: 'comp-104',
            fecha: '2026-08-08',
            categoria: 'ssd',
            categoria_nombre: 'Disco SSD / NVMe',
            icono: 'fas fa-hdd',
            color: '#ec4899',
            producto: 'SSD Kingston NV2 1TB PCIe 4.0 NVMe M.2 3500MB/s',
            marca: 'Kingston',
            cantidad: 2,
            valor_total: 125980,
            empresa: 'VPrime',
            solicitante_nombre: 'Camila Sepulveda',
            solicitante_rut: '18765432-1',
            solicitante_email: 'camila.sepulveda@vprime.cl',
            tecnico: 'Omar Gálvez',
            proveedor: 'PC Factory',
            factura: 'FAC-44120',
            estado: 'entregado',
            notas: 'Ampliación de almacenamiento para procesamiento de datos contables.'
        },
        {
            id: 'comp-105',
            fecha: '2026-08-05',
            categoria: 'perifericos',
            categoria_nombre: 'Teclado / Mouse',
            icono: 'fas fa-keyboard',
            color: '#06b6d4',
            producto: 'Kit Inalámbrico Logitech MK270 (Teclado + Mouse) Español',
            marca: 'Logitech',
            cantidad: 4,
            valor_total: 99960,
            empresa: 'T-Sales',
            solicitante_nombre: 'Diego Valenzuela',
            solicitante_rut: '17987654-3',
            solicitante_email: 'diego.valenzuela@t-sales.cl',
            tecnico: 'Felipe Olivares',
            proveedor: 'Falabella Retail',
            factura: 'BOL-88210',
            estado: 'entregado',
            notas: 'Renovación de periféricos para nuevos puestos de ejecutivos.'
        },
        {
            id: 'comp-106',
            fecha: '2026-08-02',
            categoria: 'headset',
            categoria_nombre: 'Audífonos / Headset',
            icono: 'fas fa-headphones',
            color: '#6366f1',
            producto: 'Headset Jabra Evolve 20 Stereo USB Cancelación Ruido',
            marca: 'Jabra',
            cantidad: 3,
            valor_total: 119970,
            empresa: 'Infinet',
            solicitante_nombre: 'Matias Ignacio Reyes',
            solicitante_rut: '19876543-2',
            solicitante_email: 'matias.reyes@infinet.cl',
            tecnico: 'Omar Gálvez',
            proveedor: 'MercadoLibre Oficial',
            factura: 'FAC-12890',
            estado: 'entregado',
            notas: 'Headsets profesionales para soporte a clientes y reuniones Teams.'
        },
        {
            id: 'comp-107',
            fecha: '2026-08-19',
            categoria: 'notebook',
            categoria_nombre: 'Notebook / Laptop',
            icono: 'fas fa-laptop',
            color: '#10b981',
            producto: 'Notebook Lenovo ThinkPad E14 Gen 5 Core i5 16GB 512GB SSD W11P',
            marca: 'Lenovo',
            cantidad: 1,
            valor_total: 789990,
            empresa: 'T-Sales',
            solicitante_nombre: 'Belfor Aburto',
            solicitante_rut: 'belfor',
            solicitante_email: 'belfor.aburto@t-sales.cl',
            tecnico: 'Belfor Aburto',
            proveedor: 'Central de Compras TI',
            factura: 'FAC-90124',
            estado: 'en_transito',
            notas: 'Nuevo equipo asignado a jefatura técnica.'
        },
        {
            id: 'comp-108',
            fecha: '2026-08-10',
            categoria: 'cargador',
            categoria_nombre: 'Cargador / Fuente',
            icono: 'fas fa-plug',
            color: '#f59e0b',
            producto: 'Cargador Universal Lenovo ThinkPad 65W USB-C',
            marca: 'Lenovo',
            cantidad: 2,
            valor_total: 59980,
            empresa: 'Infinet',
            solicitante_nombre: 'Stock Bodega TI',
            solicitante_rut: 'stock-01',
            solicitante_email: 'soporte@infinet.cl',
            tecnico: 'Felipe Olivares',
            proveedor: 'SP Digital',
            factura: 'FAC-33100',
            estado: 'stock',
            notas: 'Stock disponible en bodega para reposición inmediata en terreno.'
        },
        {
            id: 'comp-109',
            fecha: '2026-07-28',
            categoria: 'red',
            categoria_nombre: 'Redes / Conectividad',
            icono: 'fas fa-network-wired',
            color: '#14b8a6',
            producto: 'Switch Gigabit TP-Link TL-SG108 8 Puertos Metálico',
            marca: 'TP-Link',
            cantidad: 1,
            valor_total: 28990,
            empresa: 'VPrime',
            solicitante_nombre: 'Red Sede VPrime',
            solicitante_rut: 'sede-vp',
            solicitante_email: 'contacto@vprime.cl',
            tecnico: 'Omar Gálvez',
            proveedor: 'PC Factory',
            factura: 'BOL-55410',
            estado: 'entregado',
            notas: 'Habilitación de puntos de red adicionales en sucursal.'
        }
    ];

    let comprasData = [];
    let currentCompraFilterEmpresa = 'todas';
    let currentCompraFilterCat = 'todas';
    let currentCompraSearchTerm = '';
    let currentCompraSort = 'fecha-desc';
    let isComprasInitialized = false;

    const categoryInfoMap = {
        'ram': { name: 'Memoria RAM', icon: 'fas fa-memory', color: '#3266eb' },
        'monitor': { name: 'Monitor / Pantalla', icon: 'fas fa-desktop', color: '#8b5cf6' },
        'cargador': { name: 'Cargador / Fuente', icon: 'fas fa-plug', color: '#f59e0b' },
        'notebook': { name: 'Notebook / Laptop', icon: 'fas fa-laptop', color: '#10b981' },
        'ssd': { name: 'Disco SSD / NVMe', icon: 'fas fa-hdd', color: '#ec4899' },
        'perifericos': { name: 'Teclado / Mouse', icon: 'fas fa-keyboard', color: '#06b6d4' },
        'headset': { name: 'Audífonos / Headset', icon: 'fas fa-headphones', color: '#6366f1' },
        'impresora': { name: 'Impresora / Tóner', icon: 'fas fa-print', color: '#eab308' },
        'red': { name: 'Redes / Conectividad', icon: 'fas fa-network-wired', color: '#14b8a6' },
        'otro': { name: 'Otro / Accesorio', icon: 'fas fa-box-open', color: '#94a3b8' }
    };

    function formatCLP(amount) {
        const num = Number(amount) || 0;
        return '$ ' + num.toLocaleString('es-CL');
    }

    function getCompraCompanyBadgeHTML(empresa) {
        const emp = (empresa || 'T-Sales').trim();
        if (emp.toLowerCase() === 'infinet') {
            return '<span class="company-badge badge-infinet" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;"><i class="fas fa-building" style="margin-right: 4px;"></i> Infinet</span>';
        } else if (emp.toLowerCase() === 'vprime') {
            return '<span class="company-badge badge-vprime" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;"><i class="fas fa-building" style="margin-right: 4px;"></i> VPrime</span>';
        }
        return '<span class="company-badge badge-tsales" style="background: rgba(0, 201, 167, 0.15); color: #00c9a7; border: 1px solid rgba(0, 201, 167, 0.3); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;"><i class="fas fa-building" style="margin-right: 4px;"></i> T-Sales</span>';
    }

    function getCompraStatusBadgeHTML(estado) {
        if (estado === 'en_transito') {
            return '<span class="status-badge status-badge-transito" style="padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;"><i class="fas fa-truck" style="margin-right: 4px;"></i> En Tránsito</span>';
        } else if (estado === 'stock') {
            return '<span class="status-badge status-badge-stock" style="padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;"><i class="fas fa-boxes" style="margin-right: 4px;"></i> En Bodega</span>';
        }
        return '<span class="status-badge status-badge-entregado" style="padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> Entregado</span>';
    }

    async function loadCompras() {
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('compras_ti')
                    .select('*')
                    .order('fecha', { ascending: false });

                if (error) {
                    console.warn('Error al consultar compras_ti en Supabase, usando respaldo LocalStorage:', error);
                } else if (data) {
                    if (data.length > 0) {
                        comprasData = data;
                        localStorage.setItem('compras_ti', JSON.stringify(comprasData));
                        renderComprasKPIs();
                        renderComprasTable();
                        return comprasData;
                    } else {
                        // Si la tabla en Supabase está vacía (recién creada), sembramos los datos iniciales
                        const localRaw = localStorage.getItem('compras_ti');
                        const toSeed = localRaw ? JSON.parse(localRaw) : defaultComprasSeed;
                        if (toSeed && toSeed.length > 0) {
                            console.log('Sembrando datos iniciales en compras_ti de Supabase...');
                            const { error: seedErr } = await supabase.from('compras_ti').insert(toSeed);
                            if (!seedErr) {
                                comprasData = toSeed;
                                localStorage.setItem('compras_ti', JSON.stringify(comprasData));
                                renderComprasKPIs();
                                renderComprasTable();
                                return comprasData;
                            }
                        }
                    }
                }
            } catch(e) {
                console.error('Error fetching compras_ti from Supabase:', e);
            }
        }

        try {
            const raw = localStorage.getItem('compras_ti');
            if (raw) {
                comprasData = JSON.parse(raw);
            } else {
                comprasData = [...defaultComprasSeed];
                localStorage.setItem('compras_ti', JSON.stringify(comprasData));
            }
        } catch(e) {
            console.error('Error loading compras:', e);
            comprasData = [...defaultComprasSeed];
        }
        renderComprasKPIs();
        renderComprasTable();
        return comprasData;
    }

    async function saveCompras(items, singleItemToUpsert = null) {
        comprasData = items;
        localStorage.setItem('compras_ti', JSON.stringify(comprasData));
        renderComprasKPIs();
        renderComprasTable();

        if (!useLocalFallback && supabase && singleItemToUpsert) {
            try {
                const { error } = await supabase.from('compras_ti').upsert([singleItemToUpsert]);
                if (error) {
                    console.error('Error guardando compra en Supabase:', error);
                }
            } catch(err) {
                console.error('Error upsert compras_ti Supabase:', err);
            }
        }
    }

    function renderComprasKPIs() {
        const totalMontoEl = document.getElementById('kpi-compras-total-monto');
        const countTotalEl = document.getElementById('kpi-compras-count-total');
        const mesMontoEl = document.getElementById('kpi-compras-mes-monto');
        const mesCountEl = document.getElementById('kpi-compras-mes-count');
        const empTsalesEl = document.getElementById('kpi-compras-emp-tsales');
        const empInfinetEl = document.getElementById('kpi-compras-emp-infinet');
        const empVprimeEl = document.getElementById('kpi-compras-emp-vprime');
        const topCatEl = document.getElementById('kpi-compras-top-categoria');
        const topDetalleEl = document.getElementById('kpi-compras-top-detalle');

        const badgeTodas = document.getElementById('badge-count-compras-todas');
        const badgeTsales = document.getElementById('badge-count-compras-tsales');
        const badgeInfinet = document.getElementById('badge-count-compras-infinet');
        const badgeVprime = document.getElementById('badge-count-compras-vprime');

        let totalMonto = 0;
        let totalCount = comprasData.length;
        let mesMonto = 0;
        let mesCount = 0;
        let empTsalesMonto = 0;
        let empInfinetMonto = 0;
        let empVprimeMonto = 0;
        let countTsales = 0;
        let countInfinet = 0;
        let countVprime = 0;

        const catCounts = {};
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        comprasData.forEach(c => {
            const monto = Number(c.valor_total) || 0;
            totalMonto += monto;

            const cDate = new Date(c.fecha);
            if (!isNaN(cDate) && cDate.getFullYear() === currentYear && cDate.getMonth() === currentMonth) {
                mesMonto += monto;
                mesCount += (Number(c.cantidad) || 1);
            }

            const emp = (c.empresa || '').toLowerCase();
            if (emp.includes('tsales') || emp.includes('t-sales')) {
                empTsalesMonto += monto;
                countTsales++;
            } else if (emp.includes('infinet')) {
                empInfinetMonto += monto;
                countInfinet++;
            } else if (emp.includes('vprime')) {
                empVprimeMonto += monto;
                countVprime++;
            }

            const cat = c.categoria || 'otro';
            catCounts[cat] = (catCounts[cat] || 0) + (Number(c.cantidad) || 1);
        });

        if (totalMontoEl) totalMontoEl.textContent = formatCLP(totalMonto);
        if (countTotalEl) countTotalEl.textContent = `${totalCount} adquisiciones registradas`;
        if (mesMontoEl) mesMontoEl.textContent = formatCLP(mesMonto);
        if (mesCountEl) mesCountEl.textContent = `${mesCount} ítems adquiridos este mes`;
        if (empTsalesEl) empTsalesEl.textContent = formatCLP(empTsalesMonto);
        if (empInfinetEl) empInfinetEl.textContent = formatCLP(empInfinetMonto);
        if (empVprimeEl) empVprimeEl.textContent = formatCLP(empVprimeMonto);

        if (badgeTodas) badgeTodas.textContent = totalCount;
        if (badgeTsales) badgeTsales.textContent = countTsales;
        if (badgeInfinet) badgeInfinet.textContent = countInfinet;
        if (badgeVprime) badgeVprime.textContent = countVprime;

        // Top Categoría
        let topCatKey = 'ram';
        let maxCount = 0;
        Object.keys(catCounts).forEach(k => {
            if (catCounts[k] > maxCount) {
                maxCount = catCounts[k];
                topCatKey = k;
            }
        });

        const topCatInfo = categoryInfoMap[topCatKey] || { name: 'Memoria RAM' };
        if (topCatEl) topCatEl.textContent = `${topCatInfo.name} (${maxCount})`;
        if (topDetalleEl) {
            const sortedCats = Object.keys(catCounts).sort((a,b) => catCounts[b] - catCounts[a]).slice(0, 3);
            topDetalleEl.textContent = sortedCats.map(k => categoryInfoMap[k]?.name || k).join(' • ');
        }
    }

    function renderComprasTable() {
        const tbody = document.getElementById('compras-table-body');
        const mobileContainer = document.getElementById('mobile-compras-cards-container');
        if (!tbody) return;

        let filtered = [...comprasData];

        // Filtro por Empresa
        if (currentCompraFilterEmpresa !== 'todas') {
            filtered = filtered.filter(c => (c.empresa || '').toLowerCase() === currentCompraFilterEmpresa.toLowerCase());
        }

        // Filtro por Categoría
        if (currentCompraFilterCat !== 'todas') {
            filtered = filtered.filter(c => (c.categoria || '').toLowerCase() === currentCompraFilterCat.toLowerCase());
        }

        // Filtro por Búsqueda
        if (currentCompraSearchTerm.trim()) {
            const term = currentCompraSearchTerm.toLowerCase();
            filtered = filtered.filter(c => {
                return (c.producto && c.producto.toLowerCase().includes(term)) ||
                       (c.marca && c.marca.toLowerCase().includes(term)) ||
                       (c.solicitante_nombre && c.solicitante_nombre.toLowerCase().includes(term)) ||
                       (c.solicitante_rut && c.solicitante_rut.toLowerCase().includes(term)) ||
                       (c.tecnico && c.tecnico.toLowerCase().includes(term)) ||
                       (c.proveedor && c.proveedor.toLowerCase().includes(term)) ||
                       (c.factura && c.factura.toLowerCase().includes(term)) ||
                       (c.empresa && c.empresa.toLowerCase().includes(term)) ||
                       (c.notas && c.notas.toLowerCase().includes(term));
            });
        }

        // Ordenamiento
        filtered.sort((a, b) => {
            if (currentCompraSort === 'fecha-asc') {
                return new Date(a.fecha) - new Date(b.fecha);
            } else if (currentCompraSort === 'precio-desc') {
                return (Number(b.valor_total) || 0) - (Number(a.valor_total) || 0);
            } else if (currentCompraSort === 'precio-asc') {
                return (Number(a.valor_total) || 0) - (Number(b.valor_total) || 0);
            }
            return new Date(b.fecha) - new Date(a.fecha);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <i class="fas fa-shopping-bag" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
                        <p style="margin: 0 0 6px 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">No se encontraron compras</p>
                        <span style="font-size: 0.8rem;">Prueba cambiando los filtros o registra una nueva compra con el botón superior.</span>
                    </td>
                </tr>
            `;
            if (mobileContainer) {
                mobileContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px 16px; color: var(--text-secondary);">
                        <i class="fas fa-shopping-bag" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 10px; display: block;"></i>
                        <p style="margin: 0; font-size: 0.9rem;">No hay compras con los filtros seleccionados.</p>
                    </div>
                `;
            }
            return;
        }

        tbody.innerHTML = filtered.map(c => {
            const catInfo = categoryInfoMap[c.categoria] || { name: c.categoria_nombre || 'Hardware', icon: c.icono || 'fas fa-box', color: c.color || '#3266eb' };
            const initials = (c.solicitante_nombre || 'U').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2);
            
            return `
                <tr class="compra-table-row">
                    <td style="white-space: nowrap; font-size: 0.82rem; color: var(--text-secondary);">
                        <i class="far fa-calendar-alt" style="margin-right: 6px; color: var(--text-muted);"></i>
                        ${escapeHtml(c.fecha || '-')}
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: ${catInfo.color}; font-size: 1.15rem; flex-shrink: 0;">
                                <i class="${catInfo.icon}"></i>
                            </div>
                            <div>
                                <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">${escapeHtml(c.producto || 'Producto')}</strong>
                                <span style="font-size: 0.74rem; color: var(--text-muted);">
                                    ${escapeHtml(catInfo.name)} • ${escapeHtml(c.marca || 'Genérica')} ${c.cantidad > 1 ? `(${c.cantidad} unidades)` : ''}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${getCompraCompanyBadgeHTML(c.empresa)}
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.75rem; border-radius: 50%; background: var(--accent-blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
                                ${initials}
                            </div>
                            <div>
                                <strong style="font-size: 0.84rem; color: var(--text-primary); display: block;">${escapeHtml(c.solicitante_nombre || '-')}</strong>
                                <span style="font-size: 0.72rem; color: var(--text-secondary);">${escapeHtml(c.solicitante_rut || c.solicitante_email || '-')}</span>
                            </div>
                        </div>
                    </td>
                    <td style="font-size: 0.82rem; color: var(--text-primary);">
                        <i class="fas fa-user-shield" style="color: var(--accent-purple); margin-right: 4px;"></i>
                        ${escapeHtml(c.tecnico || 'Belfor Aburto')}
                    </td>
                    <td style="white-space: nowrap;">
                        <strong style="font-size: 0.95rem; color: #10b981;">${formatCLP(c.valor_total)}</strong>
                    </td>
                    <td>
                        ${getCompraStatusBadgeHTML(c.estado)}
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-action-view" onclick="window.viewCompraDetail('${c.id}')" title="Ver Detalle" style="background: none; border: 1px solid var(--border-color); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; margin-right: 4px; transition: all 0.2s;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn-action-edit" onclick="window.editCompra('${c.id}')" title="Editar" style="background: none; border: 1px solid var(--border-color); color: var(--accent-blue); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; margin-right: 4px; transition: all 0.2s;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-action-delete" onclick="window.removeCompra('${c.id}')" title="Eliminar" style="background: none; border: 1px solid var(--border-color); color: #ef4444; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Mobile Cards
        if (mobileContainer) {
            mobileContainer.innerHTML = filtered.map(c => {
                const catInfo = categoryInfoMap[c.categoria] || { name: c.categoria_nombre || 'Hardware', icon: c.icono || 'fas fa-box', color: c.color || '#3266eb' };
                const initials = (c.solicitante_nombre || 'U').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2);

                return `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: ${catInfo.color}; font-size: 1.1rem;">
                                    <i class="${catInfo.icon}"></i>
                                </div>
                                <div>
                                    <strong style="font-size: 0.9rem; color: var(--text-primary); display: block;">${escapeHtml(c.producto)}</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(catInfo.name)} • ${escapeHtml(c.fecha)}</span>
                                </div>
                            </div>
                            ${getCompraStatusBadgeHTML(c.estado)}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-sidebar); padding: 8px 12px; border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div class="user-avatar" style="width: 24px; height: 24px; font-size: 0.65rem; border-radius: 50%; background: var(--accent-blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                    ${initials}
                                </div>
                                <span style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHtml(c.solicitante_nombre)}</span>
                            </div>
                            <strong style="color: #10b981; font-size: 0.95rem;">${formatCLP(c.valor_total)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-color);">
                            ${getCompraCompanyBadgeHTML(c.empresa)}
                            <div style="display: flex; gap: 6px;">
                                <button type="button" onclick="window.viewCompraDetail('${c.id}')" style="background: none; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;">Detalle</button>
                                <button type="button" onclick="window.editCompra('${c.id}')" style="background: none; border: 1px solid var(--border-color); color: var(--accent-blue); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;">Editar</button>
                                <button type="button" onclick="window.removeCompra('${c.id}')" style="background: none; border: 1px solid var(--border-color); color: #ef4444; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function selectCompraEmpresa(empresaName) {
        const empCards = document.querySelectorAll('.compra-empresa-card');
        const target = (empresaName || 'T-Sales').toLowerCase();
        empCards.forEach(card => {
            const cardEmp = (card.getAttribute('data-empresa') || '').toLowerCase();
            const isActive = cardEmp === target || 
                (target.includes('infinet') && cardEmp.includes('infinet')) ||
                (target.includes('vprime') && cardEmp.includes('vprime')) ||
                ((target.includes('tsales') || target.includes('t-sales')) && (cardEmp.includes('tsales') || cardEmp.includes('t-sales')));

            if (isActive) {
                card.classList.add('active');
                if (cardEmp.includes('infinet')) {
                    card.style.borderColor = '#f59e0b';
                    card.style.background = 'rgba(245, 158, 11, 0.15)';
                    card.style.borderWidth = '2px';
                } else if (cardEmp.includes('vprime')) {
                    card.style.borderColor = '#ef4444';
                    card.style.background = 'rgba(239, 68, 68, 0.15)';
                    card.style.borderWidth = '2px';
                } else {
                    card.style.borderColor = '#00c9a7';
                    card.style.background = 'rgba(0, 201, 167, 0.15)';
                    card.style.borderWidth = '2px';
                }
            } else {
                card.classList.remove('active');
                card.style.borderColor = 'var(--border-color)';
                card.style.background = 'var(--bg-sidebar)';
                card.style.borderWidth = '1px';
            }
        });
    }

    function openCompraModal(compraToEdit = null) {
        const modal = document.getElementById('modal-nueva-compra');
        const form = document.getElementById('form-nueva-compra');
        const title = document.getElementById('modal-compra-title');
        const editIdInput = document.getElementById('compra-edit-id');
        const productoInput = document.getElementById('compra-producto-input');
        const marcaInput = document.getElementById('compra-marca-input');
        const cantidadInput = document.getElementById('compra-cantidad-input');
        const valorInput = document.getElementById('compra-valor-input');
        const valorPreview = document.getElementById('compra-valor-preview');
        const fechaInput = document.getElementById('compra-fecha-input');
        const solicitanteSearch = document.getElementById('compra-solicitante-search');
        const solicitanteRut = document.getElementById('compra-solicitante-rut');
        const solicitanteEmail = document.getElementById('compra-solicitante-email');
        const tecnicoSelect = document.getElementById('compra-tecnico-select');
        const proveedorInput = document.getElementById('compra-proveedor-input');
        const facturaInput = document.getElementById('compra-factura-input');
        const estadoSelect = document.getElementById('compra-estado-select');
        const notasInput = document.getElementById('compra-notas-input');

        if (!modal) return;

        if (compraToEdit) {
            if (title) title.textContent = 'Editar Registro de Compra TI';
            if (editIdInput) editIdInput.value = compraToEdit.id;
            if (productoInput) productoInput.value = compraToEdit.producto || '';
            if (marcaInput) marcaInput.value = compraToEdit.marca || '';
            if (cantidadInput) cantidadInput.value = compraToEdit.cantidad || 1;
            if (valorInput) valorInput.value = compraToEdit.valor_total || '';
            if (valorPreview) valorPreview.textContent = formatCLP(compraToEdit.valor_total || 0);
            if (fechaInput) fechaInput.value = compraToEdit.fecha || '';
            if (solicitanteSearch) solicitanteSearch.value = compraToEdit.solicitante_nombre || '';
            if (solicitanteRut) solicitanteRut.value = compraToEdit.solicitante_rut || '';
            if (solicitanteEmail) solicitanteEmail.value = compraToEdit.solicitante_email || '';
            if (tecnicoSelect) tecnicoSelect.value = compraToEdit.tecnico || 'Belfor Aburto';
            if (proveedorInput) proveedorInput.value = compraToEdit.proveedor || '';
            if (facturaInput) facturaInput.value = compraToEdit.factura || '';
            if (estadoSelect) estadoSelect.value = compraToEdit.estado || 'entregado';
            if (notasInput) notasInput.value = compraToEdit.notas || '';

            // Seleccionar Categoría en el Grid
            const catOptions = document.querySelectorAll('#compra-category-grid .compra-cat-option');
            catOptions.forEach(opt => {
                if (opt.getAttribute('data-category') === compraToEdit.categoria) {
                    opt.classList.add('active');
                    opt.style.borderColor = 'var(--accent-blue)';
                    opt.style.background = 'rgba(50, 102, 235, 0.15)';
                } else {
                    opt.classList.remove('active');
                    opt.style.borderColor = 'var(--border-color)';
                    opt.style.background = 'var(--bg-sidebar)';
                }
            });

            // Seleccionar Empresa
            selectCompraEmpresa(compraToEdit.empresa || 'T-Sales');
        } else {
            if (title) title.textContent = 'Registrar Nueva Compra TI';
            if (form) form.reset();
            if (editIdInput) editIdInput.value = '';
            if (cantidadInput) cantidadInput.value = 1;
            if (valorPreview) valorPreview.textContent = '$ 0';
            
            // Fecha hoy
            const today = new Date().toISOString().split('T')[0];
            if (fechaInput) fechaInput.value = today;

            // Reset categoría a RAM por defecto
            const catOptions = document.querySelectorAll('#compra-category-grid .compra-cat-option');
            catOptions.forEach((opt, idx) => {
                if (idx === 0) {
                    opt.classList.add('active');
                    opt.style.borderColor = 'var(--accent-blue)';
                    opt.style.background = 'rgba(50, 102, 235, 0.15)';
                } else {
                    opt.classList.remove('active');
                    opt.style.borderColor = 'var(--border-color)';
                    opt.style.background = 'var(--bg-sidebar)';
                }
            });

            // Reset empresa a T-Sales
            selectCompraEmpresa('T-Sales');
        }

        const solDropdown = document.getElementById('compra-solicitante-dropdown');
        if (solDropdown) {
            solDropdown.style.display = 'none';
            solDropdown.innerHTML = '';
        }

        modal.style.display = 'flex';
    }

    function closeCompraModal() {
        const modal = document.getElementById('modal-nueva-compra');
        if (modal) modal.style.display = 'none';
    }

    function openCompraDetailModal(compra) {
        const modal = document.getElementById('modal-detalle-compra');
        if (!modal || !compra) return;

        const catInfo = categoryInfoMap[compra.categoria] || { name: compra.categoria_nombre || 'Hardware', icon: compra.icono || 'fas fa-box', color: compra.color || '#3266eb' };
        const initials = (compra.solicitante_nombre || 'U').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2);

        const iconEl = document.getElementById('modal-detalle-compra-icon');
        const iconWrap = document.getElementById('modal-detalle-compra-icon-wrap');
        const catEl = document.getElementById('modal-detalle-compra-cat');
        const prodEl = document.getElementById('modal-detalle-compra-producto');
        const montoEl = document.getElementById('modal-detalle-compra-monto');
        const fechaEl = document.getElementById('modal-detalle-compra-fecha');
        const avatarEl = document.getElementById('modal-detalle-compra-avatar');
        const solEl = document.getElementById('modal-detalle-compra-solicitante');
        const rutEl = document.getElementById('modal-detalle-compra-rut');
        const emailEl = document.getElementById('modal-detalle-compra-email');
        const empEl = document.getElementById('modal-detalle-compra-empresa');
        const estEl = document.getElementById('modal-detalle-compra-estado');
        const tecEl = document.getElementById('modal-detalle-compra-tecnico');
        const provEl = document.getElementById('modal-detalle-compra-proveedor');
        const notasEl = document.getElementById('modal-detalle-compra-notas');
        const btnEdit = document.getElementById('btn-editar-desde-detalle');

        if (iconEl) iconEl.className = catInfo.icon;
        if (iconWrap) {
            iconWrap.style.color = catInfo.color;
            iconWrap.style.background = `rgba(255,255,255,0.06)`;
        }
        if (catEl) catEl.textContent = `${catInfo.name} ${compra.cantidad > 1 ? `(${compra.cantidad} uds)` : ''}`;
        if (prodEl) prodEl.textContent = compra.producto || '-';
        if (montoEl) montoEl.textContent = formatCLP(compra.valor_total);
        if (fechaEl) fechaEl.textContent = compra.fecha || '-';
        if (avatarEl) avatarEl.textContent = initials;
        if (solEl) solEl.textContent = compra.solicitante_nombre || '-';
        if (rutEl) rutEl.innerHTML = `<i class="fas fa-id-card"></i> ${escapeHtml(compra.solicitante_rut || 'Sin RUT')}`;
        if (emailEl) emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${escapeHtml(compra.solicitante_email || 'Sin correo')}`;
        if (empEl) empEl.innerHTML = getCompraCompanyBadgeHTML(compra.empresa);
        if (estEl) estEl.innerHTML = getCompraStatusBadgeHTML(compra.estado);
        if (tecEl) tecEl.textContent = compra.tecnico || 'Belfor Aburto';
        if (provEl) provEl.textContent = `${compra.proveedor || 'Sin proveedor'} ${compra.factura ? `(${compra.factura})` : ''}`;
        if (notasEl) notasEl.textContent = compra.notas || 'Sin notas adicionales.';

        if (btnEdit) {
            btnEdit.onclick = () => {
                modal.style.display = 'none';
                openCompraModal(compra);
            };
        }

        modal.style.display = 'flex';
    }

    function exportComprasCSV() {
        if (!comprasData || comprasData.length === 0) {
            alert('No hay compras para exportar.');
            return;
        }

        const headers = ['ID', 'Fecha', 'Categoría', 'Producto', 'Marca', 'Cantidad', 'Valor Total CLP', 'Empresa', 'Solicitante', 'RUT Solicitante', 'Correo Solicitante', 'Gestionado Por', 'Proveedor', 'N° Factura', 'Estado', 'Notas'];
        
        const rows = comprasData.map(c => [
            `"${c.id}"`,
            `"${c.fecha || ''}"`,
            `"${c.categoria_nombre || c.categoria || ''}"`,
            `"${(c.producto || '').replace(/"/g, '""')}"`,
            `"${c.marca || ''}"`,
            c.cantidad || 1,
            c.valor_total || 0,
            `"${c.empresa || ''}"`,
            `"${(c.solicitante_nombre || '').replace(/"/g, '""')}"`,
            `"${c.solicitante_rut || ''}"`,
            `"${c.solicitante_email || ''}"`,
            `"${c.tecnico || ''}"`,
            `"${c.proveedor || ''}"`,
            `"${c.factura || ''}"`,
            `"${c.estado || ''}"`,
            `"${(c.notas || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compras_ti_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function initComprasModule() {
        loadCompras();
        renderComprasKPIs();
        renderComprasTable();

        if (isComprasInitialized) return;
        isComprasInitialized = true;

        // Suscripción a cambios en tiempo real en Supabase para Compras TI
        if (!useLocalFallback && supabase) {
            try {
                supabase
                    .channel('compras_ti_realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'compras_ti' }, () => {
                        loadCompras();
                    })
                    .subscribe();
            } catch(e) {
                console.warn('No se pudo suscribir a cambios en tiempo real de compras_ti:', e);
            }
        }

        // Global functions for inline onclick handlers
        window.viewCompraDetail = function(id) {
            const compra = comprasData.find(c => c.id === id);
            if (compra) openCompraDetailModal(compra);
        };

        window.editCompra = function(id) {
            const compra = comprasData.find(c => c.id === id);
            if (compra) openCompraModal(compra);
        };

        window.removeCompra = async function(id) {
            if (confirm('¿Estás seguro de que deseas eliminar este registro de compra?')) {
                const updated = comprasData.filter(c => c.id !== id);
                comprasData = updated;
                localStorage.setItem('compras_ti', JSON.stringify(comprasData));
                renderComprasKPIs();
                renderComprasTable();

                if (!useLocalFallback && supabase) {
                    try {
                        const { error } = await supabase.from('compras_ti').delete().eq('id', id);
                        if (error) {
                            console.error('Error al eliminar compra en Supabase:', error);
                        }
                    } catch(err) {
                        console.error('Error delete compras_ti Supabase:', err);
                    }
                }
            }
        };

        // Botón abrir modal
        const btnOpenModal = document.getElementById('btn-abrir-modal-nueva-compra');
        if (btnOpenModal) {
            btnOpenModal.addEventListener('click', () => openCompraModal());
        }

        // Botón exportar CSV
        const btnExport = document.getElementById('btn-export-compras-csv');
        if (btnExport) {
            btnExport.addEventListener('click', exportComprasCSV);
        }

        // Cerrar modales
        const btnCloseModal = document.getElementById('btn-close-compra-modal');
        const btnCancelModal = document.getElementById('btn-cancel-compra-modal');
        if (btnCloseModal) btnCloseModal.addEventListener('click', closeCompraModal);
        if (btnCancelModal) btnCancelModal.addEventListener('click', closeCompraModal);

        const btnCloseDetalle = document.getElementById('btn-close-detalle-compra-modal');
        if (btnCloseDetalle) {
            btnCloseDetalle.addEventListener('click', () => {
                const modal = document.getElementById('modal-detalle-compra');
                if (modal) modal.style.display = 'none';
            });
        }

        // Tabs de Empresa
        const companyTabs = document.querySelectorAll('#compras-company-tabs .filter-tab');
        companyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                companyTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCompraFilterEmpresa = tab.getAttribute('data-empresa') || 'todas';
                renderComprasTable();
            });
        });

        // Pills de Categoría
        const catPills = document.querySelectorAll('#compras-category-pills .compra-cat-pill');
        catPills.forEach(pill => {
            pill.addEventListener('click', () => {
                catPills.forEach(p => {
                    p.classList.remove('active');
                    p.style.background = 'var(--bg-card)';
                    p.style.color = 'var(--text-secondary)';
                    p.style.borderColor = 'var(--border-color)';
                });
                pill.classList.add('active');
                pill.style.background = 'var(--accent-blue)';
                pill.style.color = 'white';
                pill.style.borderColor = 'var(--accent-blue)';

                currentCompraFilterCat = pill.getAttribute('data-cat') || 'todas';
                renderComprasTable();
            });
        });

        // Barra de Búsqueda
        const searchInput = document.getElementById('compras-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentCompraSearchTerm = searchInput.value;
                renderComprasTable();
            });
        }

        // Selector de Orden
        const sortSelect = document.getElementById('compras-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                currentCompraSort = sortSelect.value;
                renderComprasTable();
            });
        }

        // Selector Visual de Categorías en el Modal
        const catOptions = document.querySelectorAll('#compra-category-grid .compra-cat-option');
        catOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                catOptions.forEach(o => {
                    o.classList.remove('active');
                    o.style.borderColor = 'var(--border-color)';
                    o.style.background = 'var(--bg-sidebar)';
                });
                opt.classList.add('active');
                opt.style.borderColor = 'var(--accent-blue)';
                opt.style.background = 'rgba(50, 102, 235, 0.15)';
            });
        });

        // Selector de Empresa en el Modal
        const empCards = document.querySelectorAll('.compra-empresa-card');
        empCards.forEach(card => {
            card.addEventListener('click', () => {
                selectCompraEmpresa(card.getAttribute('data-empresa'));
            });
        });

        // Formato dinámico del valor en $ CLP al escribir
        const valorInput = document.getElementById('compra-valor-input');
        const valorPreview = document.getElementById('compra-valor-preview');
        if (valorInput && valorPreview) {
            valorInput.addEventListener('input', () => {
                const val = Number(valorInput.value) || 0;
                valorPreview.textContent = formatCLP(val);
            });
        }

        // Autocompletado del Solicitante con Directorio
        const solInput = document.getElementById('compra-solicitante-search');
        const solDropdown = document.getElementById('compra-solicitante-dropdown');
        const solRut = document.getElementById('compra-solicitante-rut');
        const solEmail = document.getElementById('compra-solicitante-email');

        if (solInput && solDropdown) {
            let currentMatches = [];
            let selectedMatchIndex = -1;

            function renderSolicitanteMatches() {
                const query = (solInput.value || '').trim().toLowerCase();
                if (query.length === 0) {
                    solDropdown.style.display = 'none';
                    solDropdown.innerHTML = '';
                    currentMatches = [];
                    selectedMatchIndex = -1;
                    return;
                }

                let allUsers = [];
                try {
                    if (typeof loadDirectoryUsers === 'function') {
                        allUsers = loadDirectoryUsers() || [];
                    }
                } catch(err) {
                    console.warn('Error llamando loadDirectoryUsers:', err);
                }

                if (!allUsers || allUsers.length === 0) {
                    if (typeof DEFAULT_DIRECTORY_USERS !== 'undefined' && Array.isArray(DEFAULT_DIRECTORY_USERS)) {
                        allUsers = DEFAULT_DIRECTORY_USERS;
                    }
                }

                const cleanQuery = query.replace(/\./g, '').replace(/-/g, '');
                currentMatches = allUsers.filter(u => {
                    const nombre = (u.nombre || '').toLowerCase();
                    const rut = (u.rut || '').toLowerCase();
                    const rutClean = rut.replace(/\./g, '').replace(/-/g, '');
                    const email = (u.email || '').toLowerCase();
                    return nombre.includes(query) || rut.includes(query) || rutClean.includes(cleanQuery) || email.includes(query);
                }).slice(0, 8);

                selectedMatchIndex = -1;

                if (currentMatches.length === 0) {
                    solDropdown.innerHTML = `
                        <div style="padding: 12px 14px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                            <i class="fas fa-search" style="margin-right: 6px;"></i> No se encontraron colaboradores con "<strong>${escapeHtml(solInput.value.trim())}</strong>"
                        </div>
                    `;
                    solDropdown.style.display = 'block';
                    return;
                }

                solDropdown.innerHTML = currentMatches.map((u, idx) => {
                    const initials = (u.nombre || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const emp = (u.empresa || 'T-Sales').toLowerCase();
                    const empClass = emp.includes('infinet') ? 'badge-infinet' : (emp.includes('vprime') ? 'badge-vprime' : 'badge-tsales');

                    return `
                        <div class="autocomplete-suggestion-item" data-index="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.15s ease;">
                            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                                <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.75rem; border-radius: 50%; background: var(--accent-blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
                                    ${initials}
                                </div>
                                <div style="min-width: 0; text-align: left;">
                                    <strong style="font-size: 0.86rem; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.nombre)}</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-secondary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.rut || 'Sin RUT')} • ${escapeHtml(u.email || '')}</span>
                                </div>
                            </div>
                            <span class="company-badge ${empClass}" style="font-size: 0.7rem; padding: 2px 8px; flex-shrink: 0; margin-left: 8px;">${escapeHtml(u.empresa || 'T-Sales')}</span>
                        </div>
                    `;
                }).join('');

                solDropdown.style.display = 'block';

                solDropdown.querySelectorAll('.autocomplete-suggestion-item').forEach(item => {
                    item.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        const idx = parseInt(item.getAttribute('data-index'), 10);
                        selectSolicitanteUser(currentMatches[idx]);
                    });
                });
            }

            function selectSolicitanteUser(user) {
                if (!user) return;
                solInput.value = user.nombre || '';
                if (solRut) {
                    solRut.value = (user.rut && !user.rut.toLowerCase().includes('sin rut')) ? user.rut : '';
                }
                if (solEmail) {
                    solEmail.value = user.email || '';
                }
                // Seleccionar automáticamente la empresa del usuario
                selectCompraEmpresa(user.empresa);

                solDropdown.style.display = 'none';
                solDropdown.innerHTML = '';
                currentMatches = [];
                selectedMatchIndex = -1;
            }

            solInput.addEventListener('input', renderSolicitanteMatches);
            solInput.addEventListener('focus', () => {
                if (solInput.value.trim().length > 0) {
                    renderSolicitanteMatches();
                }
            });

            solInput.addEventListener('keydown', (e) => {
                if (solDropdown.style.display !== 'block' || currentMatches.length === 0) return;

                const items = solDropdown.querySelectorAll('.autocomplete-suggestion-item');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedMatchIndex = (selectedMatchIndex + 1) % currentMatches.length;
                    items.forEach((it, i) => {
                        if (i === selectedMatchIndex) {
                            it.classList.add('selected');
                            it.style.background = 'rgba(50, 102, 235, 0.2)';
                            it.scrollIntoView({ block: 'nearest' });
                        } else {
                            it.classList.remove('selected');
                            it.style.background = 'transparent';
                        }
                    });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedMatchIndex = (selectedMatchIndex - 1 + currentMatches.length) % currentMatches.length;
                    items.forEach((it, i) => {
                        if (i === selectedMatchIndex) {
                            it.classList.add('selected');
                            it.style.background = 'rgba(50, 102, 235, 0.2)';
                            it.scrollIntoView({ block: 'nearest' });
                        } else {
                            it.classList.remove('selected');
                            it.style.background = 'transparent';
                        }
                    });
                } else if (e.key === 'Enter') {
                    if (selectedMatchIndex >= 0 && selectedMatchIndex < currentMatches.length) {
                        e.preventDefault();
                        selectSolicitanteUser(currentMatches[selectedMatchIndex]);
                    }
                } else if (e.key === 'Escape') {
                    solDropdown.style.display = 'none';
                }
            });

            document.addEventListener('click', (e) => {
                if (!solInput.contains(e.target) && !solDropdown.contains(e.target)) {
                    solDropdown.style.display = 'none';
                }
            });
        }

        // Form Submit
        const formCompra = document.getElementById('form-nueva-compra');
        if (formCompra) {
            formCompra.addEventListener('submit', async (e) => {
                e.preventDefault();

                const editId = document.getElementById('compra-edit-id')?.value;
                const activeCatEl = document.querySelector('#compra-category-grid .compra-cat-option.active');
                const activeEmpEl = document.querySelector('.compra-empresa-card.active');

                const categoria = activeCatEl?.getAttribute('data-category') || 'ram';
                const categoria_nombre = activeCatEl?.getAttribute('data-cat-name') || 'Memoria RAM';
                const icono = activeCatEl?.getAttribute('data-icon') || 'fas fa-memory';
                const color = activeCatEl?.getAttribute('data-color') || '#3266eb';
                const empresa = activeEmpEl?.getAttribute('data-empresa') || 'T-Sales';

                const producto = document.getElementById('compra-producto-input')?.value.trim();
                const marca = document.getElementById('compra-marca-input')?.value.trim() || 'Genérica';
                const cantidad = Number(document.getElementById('compra-cantidad-input')?.value) || 1;
                const valor_total = Number(document.getElementById('compra-valor-input')?.value) || 0;
                const fecha = document.getElementById('compra-fecha-input')?.value || new Date().toISOString().split('T')[0];

                const solicitante_nombre = document.getElementById('compra-solicitante-search')?.value.trim() || 'Sin asignar';
                const solicitante_rut = document.getElementById('compra-solicitante-rut')?.value.trim() || '';
                const solicitante_email = document.getElementById('compra-solicitante-email')?.value.trim() || '';
                const tecnico = document.getElementById('compra-tecnico-select')?.value || 'Belfor Aburto';
                const proveedor = document.getElementById('compra-proveedor-input')?.value.trim() || 'Central de Compras';
                const factura = document.getElementById('compra-factura-input')?.value.trim() || '';
                const estado = document.getElementById('compra-estado-select')?.value || 'entregado';
                const notas = document.getElementById('compra-notas-input')?.value.trim() || '';

                if (!producto || valor_total <= 0) {
                    alert('Por favor ingresa el nombre del producto y un valor válido.');
                    return;
                }

                let savedItem = null;
                if (editId) {
                    const idx = comprasData.findIndex(c => c.id === editId);
                    if (idx !== -1) {
                        savedItem = {
                            ...comprasData[idx],
                            categoria,
                            categoria_nombre,
                            icono,
                            color,
                            empresa,
                            producto,
                            marca,
                            cantidad,
                            valor_total,
                            fecha,
                            solicitante_nombre,
                            solicitante_rut,
                            solicitante_email,
                            tecnico,
                            proveedor,
                            factura,
                            estado,
                            notas
                        };
                        comprasData[idx] = savedItem;
                    }
                } else {
                    const newId = 'comp-' + Date.now();
                    savedItem = {
                        id: newId,
                        categoria,
                        categoria_nombre,
                        icono,
                        color,
                        empresa,
                        producto,
                        marca,
                        cantidad,
                        valor_total,
                        fecha,
                        solicitante_nombre,
                        solicitante_rut,
                        solicitante_email,
                        tecnico,
                        proveedor,
                        factura,
                        estado,
                        notas
                    };
                    comprasData.unshift(savedItem);
                }

                await saveCompras(comprasData, savedItem);
                closeCompraModal();
            });
        }
    }

    // ========================================================
    // 10. MÓDULO KIOSKO DE ONBOARDING & DIAGNÓSTICO NOTEBOOKS (CON PIN)
    // ========================================================
    let currentKioskDetectedSpecs = null;
    let currentKioskMatchedEquipo = null;

    function initKioskOnboardingModule() {
        const btnFromLogin = document.getElementById('btn-open-kiosk-from-login');
        const btnFromNav = document.getElementById('btn-open-kiosk-from-nav');
        const btnFromInventario = document.getElementById('btn-open-kiosk-from-inventario');
        const pinModal = document.getElementById('modal-kiosk-pin-gate');
        const kioskModal = document.getElementById('modal-kiosk-pc-onboarding');
        const btnCancelPin = document.getElementById('btn-cancel-kiosk-pin');
        const btnCloseKiosk = document.getElementById('btn-close-kiosk-modal');
        const btnCopyPs = document.getElementById('btn-copy-kiosk-powershell');
        const psInput = document.getElementById('kiosk-powershell-input');
        const searchInput = document.getElementById('kiosk-manual-search-input');
        const btnSearchDb = document.getElementById('btn-kiosk-search-db');
        const pinInput = document.getElementById('input-kiosk-pin');
        const pinError = document.getElementById('kiosk-pin-error-msg');

        const openPinGate = () => {
            if (pinModal) {
                pinModal.style.display = 'flex';
                if (pinInput) {
                    pinInput.value = '';
                    pinInput.focus();
                }
                if (pinError) pinError.style.display = 'none';
            }
        };

        const closePinGate = () => {
            if (pinModal) pinModal.style.display = 'none';
        };

        const closeKioskModal = () => {
            if (kioskModal) kioskModal.style.display = 'none';
        };

        if (btnFromLogin) btnFromLogin.addEventListener('click', openPinGate);
        if (btnFromNav) btnFromNav.addEventListener('click', (e) => { e.preventDefault(); openPinGate(); });
        if (btnFromInventario) btnFromInventario.addEventListener('click', openPinGate);
        if (btnCancelPin) btnCancelPin.addEventListener('click', closePinGate);
        if (btnCloseKiosk) btnCloseKiosk.addEventListener('click', closeKioskModal);

        // Validación de PIN Técnico
        window.submitKioskPin = async function() {
            const val = (pinInput ? pinInput.value : '').trim();
            const validPins = ['2024', '2026', '1234', '1438', '7392', '5841', 'admin2026', 'tsales2026', '143belfor@', 'felipe2026@@', 'omar2026@##'];
            
            // Check dynamic pins
            const customPins = getAdminValidPins();
            const allPins = [...validPins];
            Object.values(customPins).forEach(v => {
                if (Array.isArray(v)) allPins.push(...v);
                else if (typeof v === 'string') allPins.push(v);
            });

            if (allPins.includes(val) || val === '2024' || val === '1234') {
                closePinGate();
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.style.display = 'none';
                
                if (kioskModal) kioskModal.style.display = 'flex';
                runKioskLiveTelemetry();
            } else {
                if (pinError) pinError.style.display = 'block';
                if (pinInput) {
                    pinInput.classList.add('shake');
                    setTimeout(() => pinInput.classList.remove('shake'), 500);
                }
            }
        };

        // Telemetría en vivo del navegador
        function runKioskLiveTelemetry() {
            const osEl = document.getElementById('kiosk-os-detected');
            const cpuEl = document.getElementById('kiosk-cpu-detected');
            const ramEl = document.getElementById('kiosk-ram-detected');
            const screenEl = document.getElementById('kiosk-screen-detected');

            // 1. OS
            let osName = 'Windows 11/10 Pro (64-bit)';
            const ua = navigator.userAgent || '';
            if (ua.includes('Windows NT 10.0')) osName = 'Windows 10 / 11 Pro';
            else if (ua.includes('Mac OS')) osName = 'macOS Apple';
            else if (ua.includes('Linux')) osName = 'Linux OS';

            // 2. CPU
            const cores = navigator.hardwareConcurrency || 8;
            const cpuName = `${cores} Núcleos Lógicos`;

            // 3. RAM
            const devRam = navigator.deviceMemory || 8;
            const ramName = `${devRam} GB RAM aprox.`;

            // 4. GPU & Screen
            let gpuName = 'Intel(R) Graphics';
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const rawGpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                        gpuName = rawGpu.replace(/ANGLE \((.*?)\)/, '$1').replace(/Direct3D.*/, '').trim() || 'Intel UHD Graphics';
                    }
                }
            } catch(e) {}
            const screenRes = `${window.screen.width}x${window.screen.height} (${gpuName.slice(0, 20)})`;

            if (osEl) osEl.textContent = osName;
            if (cpuEl) cpuEl.textContent = cpuName;
            if (ramEl) ramEl.textContent = ramName;
            if (screenEl) {
                screenEl.textContent = screenRes;
                screenEl.title = `${window.screen.width}x${window.screen.height} - ${gpuName}`;
            }

            currentKioskDetectedSpecs = {
                so: osName,
                cpu: cpuName,
                ram: `${devRam} GB`,
                disco: '256 GB SSD',
                gpu: gpuName,
                screen: `${window.screen.width}x${window.screen.height}`
            };
        }

        // Script PowerShell de 1-Clic
        const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$b=Get-CimInstance Win32_BIOS;$c=Get-CimInstance Win32_ComputerSystem;$p=Get-CimInstance Win32_Processor;$d=Get-CimInstance Win32_DiskDrive|Select-Object -First 1;$os=Get-CimInstance Win32_OperatingSystem;$m=[Math]::Round((Get-CimInstance Win32_PhysicalMemory|Measure-Object Capacity -Sum).Sum/1GB);$net=Get-CimInstance Win32_NetworkAdapterConfiguration|Where-Object IPEnabled|Select-Object -First 1;@{serial=$b.SerialNumber;marca=$c.Manufacturer;modelo=$c.Model;cpu=$p.Name;ram=\\\"$m GB\\\";disco=\\\"$([Math]::Round($d.Size/1GB)) GB SSD\\\";so=$os.Caption;build=$os.BuildNumber;hostname=$env:COMPUTERNAME;user=$env:USERNAME;domain=$env:USERDOMAIN;ip=$net.IPAddress[0];mac=$net.MACAddress}|ConvertTo-Json -Compress"`;

        if (btnCopyPs) {
            btnCopyPs.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(psCommand);
                    const originalHtml = btnCopyPs.innerHTML;
                    btnCopyPs.innerHTML = '<i class="fas fa-check"></i> ¡Comando Copiado!';
                    btnCopyPs.style.background = '#10b981';
                    setTimeout(() => {
                        btnCopyPs.innerHTML = originalHtml;
                        btnCopyPs.style.background = 'var(--accent-blue)';
                    }, 3000);
                } catch(e) {
                    prompt('Copia este comando y pégalo en PowerShell (Win + R -> powershell):', psCommand);
                }
            });
        }

        // Input o Paste de resultado de PowerShell
        const handleKioskInput = (val) => {
            const clean = (val || '').trim();
            if (!clean) return;

            let parsed = null;
            if (clean.startsWith('{') && clean.endsWith('}')) {
                try {
                    parsed = JSON.parse(clean);
                } catch(e) {}
            }

            if (!parsed) {
                // Try regex extraction
                const serialMatch = clean.match(/serial["':\s=]+([A-Z0-9_-]+)/i);
                const marcaMatch = clean.match(/marca["':\s=]+([A-Z0-9\s_-]+)/i);
                const modeloMatch = clean.match(/modelo["':\s=]+([A-Z0-9\s_-]+)/i);
                const cpuMatch = clean.match(/cpu["':\s=]+([A-Z0-9\s@\(\)\._-]+)/i);
                const ramMatch = clean.match(/ram["':\s=]+([A-Z0-9\s_-]+)/i);
                const discoMatch = clean.match(/disco["':\s=]+([A-Z0-9\s_-]+)/i);
                const hostMatch = clean.match(/hostname["':\s=]+([A-Z0-9_-]+)/i);

                if (serialMatch || hostMatch) {
                    parsed = {
                        serial: serialMatch ? serialMatch[1] : (clean.length < 25 ? clean : ''),
                        marca: marcaMatch ? marcaMatch[1].trim() : 'Dell',
                        modelo: modeloMatch ? modeloMatch[1].trim() : 'Latitude',
                        cpu: cpuMatch ? cpuMatch[1].trim() : (currentKioskDetectedSpecs?.cpu || 'Intel Core i5'),
                        ram: ramMatch ? ramMatch[1].trim() : (currentKioskDetectedSpecs?.ram || '8 GB'),
                        disco: discoMatch ? discoMatch[1].trim() : '256 GB SSD',
                        hostname: hostMatch ? hostMatch[1] : ''
                    };
                } else if (clean.length >= 3 && clean.length <= 30) {
                    parsed = { serial: clean };
                }
            }

            if (parsed) {
                lookupAndRenderKioskEquipment(parsed);
            }
        };

        if (psInput) {
            psInput.addEventListener('input', (e) => handleKioskInput(e.target.value));
            psInput.addEventListener('paste', (e) => {
                setTimeout(() => handleKioskInput(psInput.value), 50);
            });
        }

        if (btnSearchDb && searchInput) {
            btnSearchDb.addEventListener('click', () => handleKioskInput(searchInput.value));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleKioskInput(searchInput.value);
            });
        }

        // Búsqueda en la flota y renderizado
        async function lookupAndRenderKioskEquipment(data) {
            const container = document.getElementById('kiosk-result-container');
            if (!container) return;

            container.style.display = 'block';
            container.innerHTML = `<div style="text-align: center; padding: 25px; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--accent-blue); margin-bottom: 8px; display: block;"></i> Consultando base de datos de flota...</div>`;

            if (allEquiposCached.length === 0) {
                allEquiposCached = await fetchEquipos();
            }

            const searchSerial = (data.serial || '').toLowerCase().trim();
            const searchHost = (data.hostname || '').toLowerCase().trim();

            let matched = null;
            if (searchSerial) {
                matched = allEquiposCached.find(e => (e.serial || '').toLowerCase().trim() === searchSerial);
            }
            if (!matched && searchHost) {
                matched = allEquiposCached.find(e => (e.nombre_codigo || '').toLowerCase().trim() === searchHost || (e.serial || '').toLowerCase().trim() === searchHost);
            }

            currentKioskMatchedEquipo = matched;
            const directoryUsers = loadDirectoryUsers();

            if (matched) {
                // CASO A: NOTEBOOK ENCONTRADO EN LA FLOTA
                const specs = formatCleanSpecs(matched);
                const prevUser = matched.usuario_nombre || 'Sin Asignar';
                const prevEmail = matched.usuario_email || 'Sin correo';
                const prevRut = matched.usuario_rut || 'Sin RUT';
                const prevEmpresa = matched.empresa || 'T-Sales';
                const initials = prevUser !== 'Sin Asignar' ? prevUser.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '—';

                // Generar opciones de colaboradores para reasignación
                let userOptionsHtml = `<option value="">-- Selecciona el Nuevo Colaborador Asignado --</option>`;
                directoryUsers.forEach(u => {
                    const isCurrent = (u.nombre || '').toLowerCase() === prevUser.toLowerCase();
                    userOptionsHtml += `<option value="${escapeHtml(u.nombre)}" data-email="${escapeHtml(u.email || '')}" data-rut="${escapeHtml(u.rut || '')}" data-empresa="${escapeHtml(u.empresa || '')}" ${isCurrent ? 'selected' : ''}>${escapeHtml(u.nombre)} (${escapeHtml(u.empresa || 'General')} - ${escapeHtml(u.email || '')})</option>`;
                });

                container.innerHTML = `
                    <div style="background: var(--bg-card); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                        <!-- Encabezado de Coincidencia -->
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="kiosk-badge-found"><i class="fas fa-check-circle"></i> NOTEBOOK REGISTRADO EN FLOTA</span>
                                <strong style="font-size: 1.05rem; color: var(--text-primary);">${escapeHtml(matched.nombre_codigo || 'EQUIPO')}</strong>
                            </div>
                            <span class="company-badge ${matched.empresa === 'Infinet' ? 'badge-infinet' : (matched.empresa === 'VPrime' ? 'badge-vprime' : 'badge-tsales')}">${escapeHtml(matched.empresa || 'T-Sales')}</span>
                        </div>

                        <!-- Ficha Técnica Resumida -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 18px; background: var(--bg-sidebar); padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                            <div><span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Marca / Modelo:</span><strong style="display: block; font-size: 0.82rem; color: var(--text-primary);">${escapeHtml(matched.marca || 'Dell')} ${escapeHtml(matched.modelo || 'Latitude')}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Serial:</span><strong style="display: block; font-size: 0.82rem; color: var(--accent-blue); font-family: monospace;">${escapeHtml(matched.serial || 'S/N')}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">CPU / RAM:</span><strong style="display: block; font-size: 0.82rem; color: var(--text-primary);">${escapeHtml(specs.cpu)} / ${escapeHtml(specs.ram)}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Disco SSD:</span><strong style="display: block; font-size: 0.82rem; color: var(--text-primary);">${escapeHtml(specs.disco)}</strong></div>
                        </div>

                        <!-- Comparativa: Usuario Anterior vs Nuevo Usuario -->
                        <div class="kiosk-comparison-grid" style="margin-bottom: 20px;">
                            <!-- Usuario Anterior / Actual -->
                            <div class="kiosk-user-card-prev">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: #ef4444; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-user-clock"></i> Usuario Anterior / Actual
                                    </span>
                                    <span style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(matched.fecha_asignacion ? `Desde ${matched.fecha_asignacion}` : 'Registrado')}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="equip-card-avatar" style="width: 42px; height: 42px; font-size: 0.9rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.4) 100%); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">
                                        <span>${initials}</span>
                                    </div>
                                    <div style="min-width: 0; flex: 1;">
                                        <strong style="display: block; font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(prevUser)}</strong>
                                        <span style="display: block; font-size: 0.78rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(prevEmail)}</span>
                                        <span style="font-size: 0.72rem; color: var(--text-muted);">RUT: ${escapeHtml(prevRut)} | ${escapeHtml(prevEmpresa)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Panel de Reasignación a Nuevo Usuario -->
                            <div class="kiosk-user-card-new">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: #34d399; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-user-check"></i> Reasignar a Nuevo Colaborador
                                    </span>
                                    <span class="status-badge status-abierto" style="font-size: 0.68rem;">Nuevo Destinatario</span>
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Seleccionar Colaborador del Directorio:</label>
                                    <select id="kiosk-reassign-user-select" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                                        ${userOptionsHtml}
                                    </select>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                                    <div>
                                        <label style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 2px;">Empresa:</label>
                                        <select id="kiosk-reassign-empresa-select" style="width: 100%; padding: 6px 8px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 0.8rem;">
                                            <option value="T-Sales" ${matched.empresa === 'T-Sales' ? 'selected' : ''}>T-Sales</option>
                                            <option value="Infinet" ${matched.empresa === 'Infinet' ? 'selected' : ''}>Infinet</option>
                                            <option value="VPrime" ${matched.empresa === 'VPrime' ? 'selected' : ''}>VPrime</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 2px;">Estado del Equipo:</label>
                                        <select id="kiosk-reassign-estado-select" style="width: 100%; padding: 6px 8px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 0.8rem;">
                                            <option value="activo" selected>🟢 Asignado y Entregado</option>
                                            <option value="disponible">🔵 Disponible en Bodega</option>
                                            <option value="mantenimiento">🔴 En Mantenimiento / Formateo</option>
                                            <option value="baja">⚫ De Baja</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 2px;">Motivo / Nota del Movimiento:</label>
                                    <input type="text" id="kiosk-reassign-notas-input" placeholder="Ej: Entrega de notebook por renovación / ingreso..." value="Reasignación rápida desde Kiosko TI" style="width: 100%; padding: 6px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 0.8rem;">
                                </div>
                            </div>
                        </div>

                        <!-- Botón de Confirmación -->
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 14px;">
                            <button type="button" id="btn-kiosk-confirm-reassign" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                                <i class="fas fa-sync-alt"></i> Confirmar Reasignación y Guardar en Flota
                            </button>
                        </div>
                    </div>
                `;

                // Event listener para auto-seleccionar empresa al cambiar usuario
                const userSelect = document.getElementById('kiosk-reassign-user-select');
                const empSelect = document.getElementById('kiosk-reassign-empresa-select');
                if (userSelect && empSelect) {
                    userSelect.addEventListener('change', () => {
                        const selectedOption = userSelect.options[userSelect.selectedIndex];
                        const emp = selectedOption?.getAttribute('data-empresa');
                        if (emp) {
                            if (/infinet/i.test(emp)) empSelect.value = 'Infinet';
                            else if (/vprime|v\s*prime/i.test(emp)) empSelect.value = 'VPrime';
                            else if (/t-sales|tsales/i.test(emp)) empSelect.value = 'T-Sales';
                        }
                    });
                }

                // Event listener para guardar reasignación
                const btnConfirm = document.getElementById('btn-kiosk-confirm-reassign');
                if (btnConfirm) {
                    btnConfirm.addEventListener('click', async () => {
                        btnConfirm.disabled = true;
                        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando reasignación...';

                        const selectedOption = userSelect?.options[userSelect.selectedIndex];
                        const nuevoNombre = userSelect?.value || prevUser;
                        const nuevoEmail = selectedOption?.getAttribute('data-email') || '';
                        const nuevoRut = selectedOption?.getAttribute('data-rut') || '';
                        const nuevaEmpresa = empSelect?.value || prevEmpresa;
                        const nuevoEstado = document.getElementById('kiosk-reassign-estado-select')?.value || 'activo';
                        const notas = document.getElementById('kiosk-reassign-notas-input')?.value || 'Reasignación de notebook';

                        // Actualizar equipo
                        matched.usuario_nombre = nuevoNombre;
                        matched.usuario_email = nuevoEmail;
                        matched.usuario_rut = nuevoRut;
                        matched.empresa = nuevaEmpresa;
                        matched.estado = nuevoEstado;
                        matched.fecha_asignacion = new Date().toLocaleDateString('es-CL');

                        // Si vinieron especificaciones nuevas desde PowerShell, actualizarlas
                        if (data.cpu && data.cpu !== 'Intel Core') matched.cpu = data.cpu;
                        if (data.ram && data.ram !== '8 GB') matched.ram = data.ram;
                        if (data.disco && data.disco !== '256 GB SSD') matched.disco_duro = data.disco;
                        if (data.so) matched.sistema_operativo = data.so;
                        if (data.build) matched.build_windows = data.build;

                        // Guardar en Supabase y local
                        await adaptiveUpsertEquipos([matched]);
                        const idx = allEquiposCached.findIndex(e => e.id === matched.id);
                        if (idx !== -1) allEquiposCached[idx] = matched;
                        localStorage.setItem('local_equipos', JSON.stringify(allEquiposCached));

                        // Registrar en historial de trazabilidad
                        try {
                            const historyKey = 'equipos_movements_history';
                            const histStr = localStorage.getItem(historyKey);
                            const hist = histStr ? JSON.parse(histStr) : [];
                            hist.unshift({
                                id: 'mov_' + Date.now(),
                                serial: matched.serial,
                                equipo_id: matched.id,
                                fecha: new Date().toISOString(),
                                fecha_formateada: new Date().toLocaleString('es-CL'),
                                tipo: 'Reasignación de Equipo (Kiosko TI)',
                                usuario_anterior: prevUser,
                                usuario_nuevo: nuevoNombre,
                                empresa: nuevaEmpresa,
                                tecnico: currentSession?.nombre || 'Técnico TI (Kiosko PIN)',
                                motivo: notas
                            });
                            localStorage.setItem(historyKey, JSON.stringify(hist));
                        } catch(e) {}

                        // Render feedback de éxito
                        container.innerHTML = `
                            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; padding: 24px; text-align: center; animation: fadeIn 0.3s ease;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 12px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);">
                                    <i class="fas fa-check"></i>
                                </div>
                                <h3 style="margin: 0 0 6px 0; color: #34d399; font-size: 1.25rem; font-weight: 700;">¡Notebook Reasignado y Guardado con Éxito!</h3>
                                <p style="margin: 0 0 16px 0; color: var(--text-secondary); font-size: 0.88rem;">
                                    El equipo <strong>${escapeHtml(matched.nombre_codigo || 'EQUIPO')}</strong> (${escapeHtml(matched.serial)}) ha sido asignado a <strong>${escapeHtml(nuevoNombre)}</strong> (${escapeHtml(nuevaEmpresa)}).
                                </p>
                                <div style="display: flex; justify-content: center; gap: 10px;">
                                    <button type="button" onclick="document.getElementById('modal-kiosk-pc-onboarding').style.display='none';" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                        Cerrar Kiosko
                                    </button>
                                </div>
                            </div>
                        `;

                        // Refrescar inventario CMDB
                        if (typeof refreshEquipos === 'function') refreshEquipos();
                    });
                }

            } else {
                // CASO B: NOTEBOOK NUEVO (NO REGISTRADO EN FLOTA)
                const detectedMarca = data.marca || 'Dell';
                const detectedModelo = data.modelo || 'Latitude';
                const detectedSerial = data.serial || ('SN-' + Date.now().toString().slice(-6));
                const detectedCpu = data.cpu || (currentKioskDetectedSpecs?.cpu || 'Intel Core i5');
                const detectedRam = data.ram || (currentKioskDetectedSpecs?.ram || '8 GB');
                const detectedDisco = data.disco || '256 GB SSD';
                const detectedSo = data.so || (currentKioskDetectedSpecs?.so || 'Windows 11 Pro');

                let userOptionsHtml = `<option value="">-- Seleccionar Colaborador Asignado --</option>`;
                directoryUsers.forEach(u => {
                    userOptionsHtml += `<option value="${escapeHtml(u.nombre)}" data-email="${escapeHtml(u.email || '')}" data-rut="${escapeHtml(u.rut || '')}" data-empresa="${escapeHtml(u.empresa || '')}">${escapeHtml(u.nombre)} (${escapeHtml(u.empresa || 'General')})</option>`;
                });

                container.innerHTML = `
                    <div style="background: var(--bg-card); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="kiosk-badge-new"><i class="fas fa-plus-circle"></i> NUEVO NOTEBOOK DETECTADO</span>
                                <strong style="font-size: 1.05rem; color: var(--text-primary);">Equipo no registrado previamente</strong>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Código de Equipo:</label>
                                <input type="text" id="kiosk-new-code" value="NT-TS-${Date.now().toString().slice(-4)}" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem; font-weight: 700;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Número de Serie (BIOS):</label>
                                <input type="text" id="kiosk-new-serial" value="${escapeHtml(detectedSerial)}" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--accent-blue); font-family: monospace; font-size: 0.85rem; font-weight: 700;">
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Marca / Modelo:</label>
                                <input type="text" id="kiosk-new-model" value="${escapeHtml(detectedMarca)} ${escapeHtml(detectedModelo)}" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Colaborador Asignado:</label>
                                <select id="kiosk-new-user-select" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                                    ${userOptionsHtml}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Empresa:</label>
                                <select id="kiosk-new-empresa-select" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                                    <option value="T-Sales">T-Sales</option>
                                    <option value="Infinet">Infinet</option>
                                    <option value="VPrime">VPrime</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 4px;">Estado:</label>
                                <select id="kiosk-new-estado-select" style="width: 100%; padding: 8px 10px; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem;">
                                    <option value="activo" selected>🟢 Asignado / Activo</option>
                                    <option value="disponible">🔵 Disponible en Bodega</option>
                                    <option value="mantenimiento">🔴 En Preparación</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 14px;">
                            <button type="button" id="btn-kiosk-save-new" style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);">
                                <i class="fas fa-plus"></i> Registrar como Nuevo Notebook en Flota
                            </button>
                        </div>
                    </div>
                `;

                const btnSaveNew = document.getElementById('btn-kiosk-save-new');
                if (btnSaveNew) {
                    btnSaveNew.addEventListener('click', async () => {
                        btnSaveNew.disabled = true;
                        btnSaveNew.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

                        const userSel = document.getElementById('kiosk-new-user-select');
                        const selectedOption = userSel?.options[userSel.selectedIndex];
                        const userName = userSel?.value || 'Sin Asignar';
                        const userEmail = selectedOption?.getAttribute('data-email') || '';
                        const userRut = selectedOption?.getAttribute('data-rut') || '';
                        const empresa = document.getElementById('kiosk-new-empresa-select')?.value || 'T-Sales';
                        const estado = document.getElementById('kiosk-new-estado-select')?.value || 'activo';
                        const codigo = document.getElementById('kiosk-new-code')?.value || ('NT-' + Date.now().toString().slice(-4));
                        const serial = document.getElementById('kiosk-new-serial')?.value || detectedSerial;

                        const newEq = {
                            id: 'eq_' + Date.now(),
                            nombre_codigo: codigo,
                            usuario_nombre: userName,
                            usuario_email: userEmail,
                            usuario_rut: userRut,
                            empresa: empresa,
                            estado: estado,
                            serial: serial,
                            marca: detectedMarca,
                            modelo: detectedModelo,
                            cpu: detectedCpu,
                            ram: detectedRam,
                            disco_duro: detectedDisco,
                            sistema_operativo: detectedSo,
                            tipo: 'laptop',
                            fecha_asignacion: new Date().toLocaleDateString('es-CL')
                        };

                        await adaptiveUpsertEquipos([newEq]);
                        allEquiposCached.unshift(newEq);
                        localStorage.setItem('local_equipos', JSON.stringify(allEquiposCached));

                        container.innerHTML = `
                            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 12px;">
                                    <i class="fas fa-check"></i>
                                </div>
                                <h3 style="margin: 0 0 6px 0; color: #60a5fa; font-size: 1.25rem; font-weight: 700;">¡Nuevo Notebook Registrado en Flota!</h3>
                                <p style="margin: 0 0 16px 0; color: var(--text-secondary); font-size: 0.88rem;">
                                    Código: <strong>${escapeHtml(codigo)}</strong> | Serial: <strong>${escapeHtml(serial)}</strong> | Asignado a: <strong>${escapeHtml(userName)}</strong>
                                </p>
                                <button type="button" onclick="document.getElementById('modal-kiosk-pc-onboarding').style.display='none';" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                    Cerrar Kiosko
                                </button>
                            </div>
                        `;

                        if (typeof refreshEquipos === 'function') refreshEquipos();
                    });
                }
            }
        }
    }

    // Inicializar Módulos
    try {
        setupClientAutocomplete();
        setupTicketUserModeTabs();
        initDirectoryModule();
        const syncDirectoryInBackground = () => fetchDirectoryUsersFromSupabase().catch(error => {
            console.warn('No se pudo sincronizar el directorio en segundo plano:', error);
        });
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(syncDirectoryInBackground, { timeout: 1500 });
        } else {
            setTimeout(syncDirectoryInBackground, 300);
        }
        initM365Module();
        initComprasModule();
        initKioskOnboardingModule();
    } catch(e) {
        console.error('Error al inicializar módulos:', e);
    }
});
