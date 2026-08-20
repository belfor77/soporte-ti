document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
    // ============================================
    const SUPABASE_URL = 'https://gabaztpewsauikxqcvnq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_jYl2N_pEwJLJhW77Lvf7Jg_zcD5TcMB';
    
    let supabase = null;
    let useLocalFallback = false;

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
        { nombre: 'Belfor Aburto', email: 'belfor.aburto@t-sales.cl', password: '143belfor@', role: 'admin', rut: 'belfor', baseCreados: 10, baseAsignados: 0, baseResueltos: 6 },
        { nombre: 'Felipe Olivares', email: 'felipe.olivares@t-sales.cl', password: 'felipe2026@@', role: 'admin', rut: 'felipe', baseCreados: 334, baseAsignados: 393, baseResueltos: 388 },
        { nombre: 'Omar Gálvez', email: 'omar.galvez@t-sales.cl', password: 'omar2026@##', role: 'admin', rut: 'omar', baseCreados: 362, baseAsignados: 398, baseResueltos: 398 }
    ];

    // ============================================
    // BASE DE DATOS DE COLABORADORES (3 EMPRESAS)
    // ============================================
    const DEFAULT_DIRECTORY_USERS = [{"nombre": "Soporte Infinet Operaciones", "rut": "76.890.123-4", "email": "soporte@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar"}, {"nombre": "Carlos Mendoza Infinet", "rut": "16.782.901-3", "email": "carlos.mendoza@infinet.cl", "empresa": "Infinet", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Administración VPrime", "rut": "77.123.456-7", "email": "contacto@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar"}, {"nombre": "Valentina Morales VPrime", "rut": "18.902.345-K", "email": "valentina.morales@vprime.cl", "empresa": "VPrime", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Aaron Alegria Rodriguez", "rut": "21491922-2", "email": "aaron.alegria@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Agustin Ignacio Silva Molina", "rut": "21.730.894-1", "email": "agustin.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Aixis Echeto", "rut": "27.331.280-3", "email": "aixis.echeto@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Alejandra Pamela Rivera Romero", "rut": "Sin RUT / Externo", "email": "alejandra.rivera_telefonica.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Alejandra Pamela Rivera Romero", "rut": "Sin RUT / Externo", "email": "alejandra.rivera_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Alejandro Rodrigo San Martín", "rut": "18.049.691-2", "email": "alejandro.sanmartin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Alexcein Ramos", "rut": "21593033-5", "email": "alexcein.ramos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Alicia Monica Escobar", "rut": "10.443.570-K", "email": "alicia.escobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Alondra Guisselle Flores Cabrera", "rut": "20.237.337-2", "email": "alondra.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Ana Riquelme", "rut": "Sin RUT / Externo", "email": "ana.riquelme@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Anabelen Godoy", "rut": "17.739.020-8", "email": "anabelen.godoy@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Andrea Casanga", "rut": "10.985.324-0", "email": "andrea.casanga@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Andres Ignacio Lagos Silva", "rut": "15355013-1", "email": "andres.lagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Angelo Nicolás Silva González", "rut": "17.951.308-0", "email": "angelo.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Anthony German", "rut": "26007243-9", "email": "anthony.german@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Antoine Jesús Vergara Estuardo", "rut": "21.336.169-4", "email": "antoine.vergara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ariel Garcia", "rut": "Sin RUT / Externo", "email": "ariel.garcia@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Ariki Alexander", "rut": "20.544.591-9", "email": "ariki.alexander@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Auditoria T-sales", "rut": "Sin RUT / Externo", "email": "auditorias@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Bastian Ferrada", "rut": "18.976.644-0", "email": "bastian.ferrada@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Beatriz Macarena Zuñiga Olavarria", "rut": "Sin RUT / Externo", "email": "beatriz.zuniga_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Belen Berenice Salas Mena", "rut": "18279015-K", "email": "belen.salas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Belfor Ignacio Aburto Vera", "rut": "20.667.530-6", "email": "belfor.aburto@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Benjamin Andrade", "rut": "21594016-0", "email": "benjamin.andrade@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Benjamín Muñoz Schtingre", "rut": "19.688.526-9", "email": "benjamin.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Billy Giron", "rut": "", "email": "billy.giron@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Braulio Vargas", "rut": "21723010-1", "email": "braulio.vargas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Camila Andrea Salas Marchant", "rut": "18.722.344-K", "email": "camila.salas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Camila Montoya", "rut": "18.999.748-5", "email": "camila.montoya@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Camilo Llanquileo", "rut": "16.557.446-K", "email": "Camilo.llanquileo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carla Acevedo", "rut": "18.737.462-6", "email": "Carla.acevedo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Carlos  Pulgar", "rut": "27187056-6", "email": "carlos.pulgar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carlos Patricio Cornejo Faber", "rut": "18739663-K", "email": "carlos.cornejo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carlos Yañez", "rut": "10.536.703-1", "email": "carlos.yanez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carmen  Rojas", "rut": "11.133.637-7", "email": "carmen.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carolina  Sánchez", "rut": "18.748.275-5", "email": "carolina.sanchez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Carolina Vera Millapán", "rut": "15.412.748-8", "email": "carolina.vera@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Caroline Diaz", "rut": "16.976.668-1", "email": "caroline.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Catalina  Barrios Leal", "rut": "19818453-5", "email": "catalina.barrios@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Cordero Lopez", "rut": "19.343.471-1", "email": "catalina.cordero@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Fernanda Tobar Silva", "rut": "20.059.789-3", "email": "catalina.tobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Catalina Lagos", "rut": "20.122.150-1", "email": "catalina.lagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cesar Ruiz", "rut": "25.932.400-9", "email": "cesar.ruiz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Constanza Ailyn Hernandez Montesino", "rut": "19277774-7", "email": "constanza.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Constanza Ramirez", "rut": "17908781-2", "email": "constanza.ramirez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Cristian Andre Muñoz Gaete", "rut": "21092269-5", "email": "cristian.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cristian Lira", "rut": "10.789.343-1", "email": "cristian.lira@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Cristian Pedro Flores Salas", "rut": "12.626.278-7", "email": "cristian.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Crystal Avril Marquez Nuñez", "rut": "21.395.345-1", "email": "crystal.marquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Daniel Hinojosa", "rut": "15564716-7", "email": "daniel.hinojosa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Dayana Franchesca Gonzalez Lopez", "rut": "17.852.271-K", "email": "dayana.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Deborah Alejandra Maulen Morales", "rut": "17.515.480-9", "email": "deborah.maulen@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Delmira Urrea", "rut": "12.854.779-7", "email": "delmira.urrea@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Detalle  Comisional", "rut": "Sin RUT / Externo", "email": "detalle.comisional@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Dina Bazcur", "rut": "15626531-4", "email": "dina.bazcur@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Eddy Velazco", "rut": "33548496-7", "email": "Eddy.velazco@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Edwars Hernandez", "rut": "44279806-0", "email": "edwars.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Empresa T-sales", "rut": "Sin RUT / Externo", "email": "Empresa@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Empresa T-sales", "rut": "Sin RUT / Externo", "email": "administrador@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Erick Guillermo Valdes Garate", "rut": "16376647-7", "email": "erick.valdes@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Erika Yasna Galindo Chavez", "rut": "11789680-", "email": "erika.galindo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Estefania Andrea Apuero Villavicencio", "rut": "20789723-K", "email": "estefania.apuero@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ester Flores", "rut": "13.667.332-7", "email": "Ester.Flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Eugenia Palma", "rut": "20.079.001-4", "email": "Eugenia.palma@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Felipe Olivares", "rut": "21.059.858-8", "email": "felipe.olivares@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Felipe Ruiz", "rut": "16.300.652-9", "email": "felipe.ruiz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Fernanda Galvez", "rut": "15.076.870-5", "email": "fernanda.galvez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Flor  Quiroz", "rut": "23.158.867-1", "email": "flor.quiroz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Folios Folios", "rut": "Sin RUT / Externo", "email": "folios@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Francisca Ignacia Torres Basaure", "rut": "20530023-6", "email": "francisca.torres@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Javier Reyes Hidalgo", "rut": "Sin RUT / Externo", "email": "fjreyesh_atento.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Francisco Javier Salazar Cifuentes", "rut": "18.809.351-5", "email": "francisco.salazar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Franco Nicolas Nacarate Valenzuela", "rut": "19801992-5", "email": "franco.nacarate@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franni Pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda_infinet.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Franni Pineda", "rut": "26.323.503-7", "email": "franni.pineda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Estándar+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "franni.pineda", "rut": "Sin RUT / Externo", "email": "franni.pineda_vprime.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Gabriel Rolando Alfredo   Rojas López", "rut": "18755934-0", "email": "gabriel.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gary Ulloa", "rut": "16.146.769-3", "email": "gary.ulloa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Genesis Calderon", "rut": "17.579.271-6", "email": "genesis.calderon@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "gestion y actividad comercial", "rut": "Sin RUT / Externo", "email": "gestionyactividadcomercial@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Gisselle Marambio", "rut": "16.392.639-3", "email": "gisselle.marambio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Graciela Marin", "rut": "15791225-9", "email": "graciela.marin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Gregorio Marin", "rut": "26944814-8", "email": "gregorio.marin@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Guillermo Araneda", "rut": "16.342.673-0", "email": "guillermo.araneda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Hernan Diaz", "rut": "Sin RUT / Externo", "email": "hernan.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Hyron Cabrera", "rut": "16.776.782-6", "email": "hyron.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ignacia Fernanda Zeballos Gómez", "rut": "20225024-6", "email": "ignacia.zeballos@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ingreso movil", "rut": "Sin RUT / Externo", "email": "Ingresomovil@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ingrid Carolina Silva Cavieres", "rut": "19708647-5", "email": "ingrid.silva@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isadora Aviles", "rut": "19961827-K", "email": "isadora.aviles@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Ivan Padilla", "rut": "16379471-3", "email": "ivan.padilla@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Alejandra Muñoz Morales", "rut": "18.266.770-6", "email": "javiera.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Arriagada Vega", "rut": "19.054.107-K", "email": "javiera.arriagada@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Javiera Paz Navarro Segovia", "rut": "16.441.778-6", "email": "javiera.navarro@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Jean Chamorro", "rut": "15.898.982-4", "email": "jean.chamorro@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Jocelyn Adriana Becerra Marabolí", "rut": "18.514.193-4", "email": "jocelyn.becerra@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jocelyn Elizabeth Garrido Rojas", "rut": "20208069-3", "email": "jocelyn.garrido@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "John Inostroza Rodriguez", "rut": "20.597.732-5", "email": "john.inostroza@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jonny Jesus Torres Landazuri", "rut": "24.163.482-5", "email": "jonny.torres@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Miguel  Hidalgo", "rut": "12.884.465-1", "email": "jose.hidalgo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juan Carlos Pineda", "rut": "27044019-3", "email": "juancarlos.pineda@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juan Gonzalez", "rut": "15793579-8", "email": "juan.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Juanita Mercedes Rojas Quilapi", "rut": "16.816.815-2", "email": "juanita.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Karen Negrete", "rut": "20.996.241-1", "email": "karen.negrete@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Karen Veas", "rut": "17.533.584-6", "email": "karen.veas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Kleiver Aparicio", "rut": "26.500.762-7", "email": "kleiver.aparicio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Laura Labrador", "rut": "33210327-K", "email": "laura.labrador@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Leandro Benjamín Osorio Sanhuez", "rut": "17.419.752-0", "email": "leandro.osorio@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Leonidas Arias", "rut": "18.547.938-2", "email": "leonidas.arias@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Luciano Humberto Salvo Guzman", "rut": "20.915.076-K", "email": "luciano.salvo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Luis Gonzalo Michea Abarca", "rut": "18.615.058-9", "email": "luis.michea@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "M Arcaje", "rut": "Sin RUT / Externo", "email": "marcaje@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "maac508", "rut": "Sin RUT / Externo", "email": "maac508_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Macarena Millas", "rut": "13.668.329-2", "email": "macarena.millas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Maikol Contreras Barra", "rut": "Sin RUT / Externo", "email": "mcontreras_rids.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Manuel Alejandro Escobar Vargas", "rut": "15.935.607-8", "email": "manuel.escobar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Manuel Eduardo Luque Oropeza", "rut": "Sin RUT / Externo", "email": "manuel.luque_telefonica.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Manuel Nicolas Aguila Pantoja", "rut": "19.408.251-7", "email": "manuel.aguila@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Marcela Alvarez Gonzalez", "rut": "19.056.147-K", "email": "marcela.alvarez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Maria Coelho", "rut": "13.696.171-3", "email": "maria.coelho@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Fernanda Vergara", "rut": "18.220.498-6", "email": "maria.vergara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Jose Alarcon Araya", "rut": "17.762.805-0", "email": "maria.alarcon@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maria Morales", "rut": "17689652-3", "email": "maria.morales@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Maria Solange Jeria Silva", "rut": "17.231.599-2", "email": "maria.jeria@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Martin  Rojas", "rut": "21722957-K", "email": "martin.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Matias Orellana", "rut": "19962070-3", "email": "matias.orellana@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maura Gonzalez", "rut": "18.327.846-0", "email": "maura.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Miriam Gonzalez Sepulveda", "rut": "15350283-8", "email": "Miriam.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Moises Oliveros", "rut": "26.055.393-3", "email": "Moises.oliveros@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Mónica Patricia Benites Cabrera", "rut": "26657801-6", "email": "monica.benites@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "movistar empresa", "rut": "Sin RUT / Externo", "email": "movistar.empresa@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Movistar Empresas", "rut": "Sin RUT / Externo", "email": "movistar.empresas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Natalia Andrea Espinosa Valenzuela", "rut": "20646932-3", "email": "natalia.espinosa@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nicolas Ignacio Pizarro Salinas", "rut": "Sin RUT / Externo", "email": "nicolas.pizarro_tigo.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Nicole Rubilar", "rut": "18.993.855-1", "email": "nicole.rubilar@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Nicole Stephanie Troncoso Perez", "rut": "19427788-1", "email": "nicole.troncoso@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Oliver Irarrazabal", "rut": "18083962-3", "email": "oliver.irarrazabal@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Omar Galvez", "rut": "20.534.863-8", "email": "Omar.galvez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Oriana Godoy", "rut": "25306932-5", "email": "oriana.godoy@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Pablo Benjamin Peña Fernandez", "rut": "19.681.383-7", "email": "pablo.pena@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Pablo Quintana", "rut": "13.465.660-3", "email": "Pablodelaquintana@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Pagos", "rut": "Sin RUT / Externo", "email": "pagos@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "Paolo Quinones", "rut": "18.095.094-K", "email": "paolo.quinones@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Power BI Pro+Microsoft 365 Empresa Estándar+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Patricia Rojo", "rut": "8.018.350-K", "email": "capacitaciones@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Patrick Castillo Garcia", "rut": "23.171.582-7", "email": "patrick.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Paulina Diaz", "rut": "17.098.053-0", "email": "Paulina.diaz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Pedro Ballesteros", "rut": "25.288.974-4", "email": "pedro.ballesteros@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Pilar Luna", "rut": "16643117-4", "email": "pilar.luna@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Priscilla Villasmil", "rut": "26498330-4", "email": "priscilla.villasmil@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Rafael Domingo Roca Moreno", "rut": "26.975.029-4", "email": "rafael.roca@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Raquel Gajardo", "rut": "11.133.637-7", "email": "raquel.gajardo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Ricardo Ciudad Arenas", "rut": "20.289.050-4", "email": "ricardo.ciudad@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rita Rojas", "rut": "19.498.994-6", "email": "rita.rojas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Robmary Medina", "rut": "26995995-9", "email": "robmary.medina@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Rodrigo  Contreras", "rut": "20906780-3", "email": "rodrigo.contreras@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "RRHH", "rut": "Sin RUT / Externo", "email": "rrhh@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rufmary Galvao", "rut": "26889742-9", "email": "rufmary.galvao@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free"}, {"nombre": "SALA -1 LATADIA 4602", "rut": "Sin RUT / Externo", "email": "SALA1LATADIA4602@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Unlicensed"}, {"nombre": "SALA -1 LATADIA 4602, LAS CONDES", "rut": "Sin RUT / Externo", "email": "SALA1LATADIA4602LASCONDES@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Unlicensed"}, {"nombre": "Sebastián Vega", "rut": "15888816-5", "email": "sebastian.vega@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "servicioprivado", "rut": "Sin RUT / Externo", "email": "servicioprivado@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Power Automate Free+Microsoft Fabric (Gratis)"}, {"nombre": "Sofia De Las Mercedes Tabilo Gutierrez", "rut": "17.090.887-2", "email": "sofia.tabilo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Solange Valenzuela", "rut": "12.244.587-9", "email": "solange.valenzuela@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Soporte  T-sales", "rut": "Sin RUT / Externo", "email": "soporte@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Soporte de Ventas", "rut": "Sin RUT / Externo", "email": "soportedeventas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Tamara Beatriz Gutierrez Toledo", "rut": "19.748.082-3", "email": "tamara.gutierrez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Tanara Carreño", "rut": "17.444.759-4", "email": "tanara.carreno@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Telefonica", "rut": "Sin RUT / Externo", "email": "telefonica@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "tuportabilidad", "rut": "Sin RUT / Externo", "email": "tuportabilidad@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valentina Ignacia Mayolafquen Araya", "rut": "21570442-4", "email": "valentina.mayolafquen@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valentina Pérez", "rut": "20.160.398-6", "email": "valentina.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Estefanía Pérez Urbina", "rut": "19.306.687-9", "email": "valeria.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeria Paz García Díaz", "rut": "20725999-3", "email": "valeria.garcia@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valerie Belen Avenaño Barraza", "rut": "20.590.850-1", "email": "valerie.avendano@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valeska Blas", "rut": "21.281.265-K", "email": "valeska.blas@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Vanessa Castillo", "rut": "17.691.945-0", "email": "vanessa.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Fabric (Gratis)+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Vanessa Lopez", "rut": "26.039.502-5", "email": "vanessa.lopez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Venta Empresa", "rut": "Sin RUT / Externo", "email": "venta.empresas@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "ventas movil", "rut": "Sin RUT / Externo", "email": "ventas.movil@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Ventas Pyme", "rut": "Sin RUT / Externo", "email": "ventaspyme@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Ventas Pyme fijo", "rut": "Sin RUT / Externo", "email": "ventaspymefijo@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft 365 Empresa Básico+Microsoft Fabric (Gratis)+Microsoft Power Automate Free"}, {"nombre": "Victoria Elizabeth Moreno Castro", "rut": "16.623.154-K", "email": "victoria.moreno@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Vilma Magdalena Cotrina Leon", "rut": "22.488.898-8", "email": "vilma.cotrina@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Visado Folios", "rut": "Sin RUT / Externo", "email": "visado@t-sales.cl", "empresa": "T-Sales", "tipo": "Externo", "licencia": "Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Yaneth Teresa Garrido Lugo", "rut": "25638683-6", "email": "yaneth.garrido@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yeimmi Andrea Córdova Cayunao", "rut": "16.923.411-6", "email": "yeimmi.cordova@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Amaya", "rut": "25564174-3", "email": "yenifer.amaya@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft Power Automate Free+Microsoft Fabric (Gratis)+Microsoft 365 Empresa Básico"}, {"nombre": "Yenifer Perez", "rut": "22854195-8", "email": "yenifer.perez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Power BI Pro+Microsoft Power Automate Free+Microsoft 365 Empresa Básico"}, {"nombre": "Alexis Feliu Rabaji", "rut": "15362254-k", "email": "alexis.feliu@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Andrés Rabba Kassis", "rut": "20443850-1", "email": "andres.rabba@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Anghelyna Montoya", "rut": "27432536-4", "email": "anghelyna.montoya@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Bastian Matias Farias Manriquez", "rut": "21.564.274-7", "email": "bastian.farias@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Beryen Osuna", "rut": "27145387-6", "email": "beryen.osuna@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "blanca del pilar peña mondaca", "rut": "22741381-6", "email": "blanca.mondaca@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carla Paz Toro Hernandez", "rut": "16911897-3", "email": "carla.toro@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Carmen Luisa Arvelo Arvelo", "rut": "26693909-4", "email": "carmen.arvelo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Cristofer Ramirez", "rut": "26556872-6", "email": "cristofer.ramirez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniel Fernando Mariangel Muñoz", "rut": "7874669-6", "email": "daniel.mariangel@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniela Alejandra  Arellano Bastias", "rut": "18389881-7", "email": "daniela.arellano@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Daniela Esmeralda Galindo Concha", "rut": "19261970-K", "email": "daniela.galindo@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Edilson Brito", "rut": "27053979-3", "email": "edilson.brito@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Edison Daniel Antil Meliqueo", "rut": "21590720-1", "email": "edison.antil@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Elkis Elihu Daza Mota", "rut": "28224401-2", "email": "elkis.daza@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Evelyn Carolina Mendieta Genes", "rut": "25324129-2", "email": "evelyn.mendieta@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Francisco Javier Contreras", "rut": "27125890-9", "email": "francisco.contreras@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franko Javier Guerra Sanhueza", "rut": "18186179-7", "email": "franko.guerra@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Franzy Coromoto Monasterio", "rut": "27222077-8", "email": "franzy.coromoto@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "German Robles Cid", "rut": "12909711-6", "email": "german.robles@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gloria Hortensia Fuentes Zenteno", "rut": "16394078-7", "email": "gloria.fuentes@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gonzalo Exequiel Delgado Antiquera", "rut": "17268048-8", "email": "gonzalo.delgado@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Gonzalo Patricio Rodriguez Flores", "rut": "16872745-3", "email": "gonzalo.rodriguez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Isabel Rodriguez", "rut": "13502775-8", "email": "isabel.rodriguez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jacqueline Castillo Avello", "rut": "11974222-6", "email": "jacqueline.castillo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "jair antonio  vasquez albujar", "rut": "25923180-9", "email": "jair.vasquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Javiera Estefany Lara Leiva", "rut": "21773848-2", "email": "javiera.lara@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Joiberth Esteban Figueroa Juarez", "rut": "33466914-9", "email": "joiberth.figueroa@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Alvarez Riquelme", "rut": "7894130-8", "email": "jose.alvarez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Jose Cristian Muñoz Parra", "rut": "18594334-8", "email": "jose.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Karen Elisabet Moraga Macaya", "rut": "19020961-K", "email": "karen.moraga@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Lidia Guajardo Valladares", "rut": "16576638-5", "email": "lidia.guajardo@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Luzneiris Evelin Guerrero Gudino", "rut": "26067596-6", "email": "luzneiris.guerrero@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "maac_508", "rut": "Sin RUT / Externo", "email": "maac_508_hotmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Mabel Hernandez", "rut": "9721762-9", "email": "mabel.hernandez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "mace508", "rut": "Sin RUT / Externo", "email": "mace508_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "MAIRUBI DEL VALLE VELASQUEZ ROJAS", "rut": "26895915-7", "email": "mairubi.velazquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "manuelalejandro.ahumada.can", "rut": "Sin RUT / Externo", "email": "manuelalejandro.ahumada.can_movistar.cl#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Marcos Sebastian Cabrera Neira", "rut": "16314722-k", "email": "marcos.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "mariana de los angeles  sanchez vargas", "rut": "23715100-3", "email": "mariana.sanchez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maribel Paz Sepulveda Farias", "rut": "17028867-k", "email": "maribel.sepulveda@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Maricarmen Ossandon", "rut": "18247961-6", "email": "maricarmen.ossandon@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Matias Benjamin Nicolas Cabrera Neira", "rut": "19075791-9", "email": "matias.cabrera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Nora Cecilia Chandia Cisternas", "rut": "11537802-3", "email": "nora.chandia@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Orlando Andres Lira Hidalgo", "rut": "13540701-1", "email": "orlando.lira@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Paulo Palacios", "rut": "10.816.483-2", "email": "paulo.palacios@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "paulo.palacios2015", "rut": "Sin RUT / Externo", "email": "paulo.palacios2015_gmail.com#EXT#@Tsalesscl.onmicrosoft.com", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Unlicensed"}, {"nombre": "Pedro Alejandro Chavez Figueroa", "rut": "16401527-0", "email": "pedro.chavez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Roger Marquina", "rut": "26611442-7", "email": "roger.marquina@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Rosa del Carmen Flores Lazo", "rut": "9276345-5", "email": "rosa.flores@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Valentina de Lourdes Rivera Campana", "rut": "18.736.271-7", "email": "valentina.rivera@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Víctor Manuel Henriquez Jimenez", "rut": "16241885-8", "email": "victor.henriquez@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Wendy Guevara", "rut": "26454275-8", "email": "wendy.guevara@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Wilda Adaias Milano Hernandez", "rut": "29140049-3", "email": "wilda.milano@t-sales.cl", "empresa": "T-Sales", "tipo": "Freelance", "licencia": "Microsoft 365 Empresa Básico"}, {"nombre": "Antonia Belen Garcia-Rey Belmar", "rut": "20430082-8", "email": "antonia.garciarey@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Eduardo Andres Rodriguez Alvarez", "rut": "20.943.851-8", "email": "eduardo.rodriguez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Esteban Marcelo Andrade Rojas", "rut": "16718580-0", "email": "esteban.andrade@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Patricio Ignacio Molina Chavez", "rut": "18005310-7", "email": "patricio.molina@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Anastasia Isabel Gonzalez Montenegro", "rut": "20292289-9", "email": "anastasia.gonzalez@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Camila Echeverria", "rut": "20636222-7", "email": "camila.echeverria@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}, {"nombre": "Sophia Muñoz", "rut": "22599288-6", "email": "sophia.munoz@t-sales.cl", "empresa": "T-Sales", "tipo": "Ejecutivo", "licencia": ""}];

    function loadDirectoryUsers() {
        try {
            const raw = localStorage.getItem('company_directory_users');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch(e) {
            console.error('Error loading directory users:', e);
        }
        return DEFAULT_DIRECTORY_USERS;
    }

    function saveDirectoryUsers(users) {
        try {
            localStorage.setItem('company_directory_users', JSON.stringify(users));
        } catch(e) {
            console.error('Error saving directory users:', e);
        }
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
        }
    }


    let supabaseRolesTableOk = true;

    async function fetchUserRolesFromSupabase() {
        if (!useLocalFallback && supabase) {
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
                return data || [];
            } catch (err) {
                console.warn('Error fetching roles from Supabase, using local fallback:', err);
                if (err.code === '42P01' || (err.message && err.message.includes('does not exist'))) {
                    supabaseRolesTableOk = false;
                }
            }
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
                if (exists.baseCreados === undefined) exists.baseCreados = defUser.baseCreados;
                if (exists.baseAsignados === undefined) exists.baseAsignados = defUser.baseAsignados;
                if (exists.baseResueltos === undefined) exists.baseResueltos = defUser.baseResueltos;
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
            empresa: ticket.empresa || ''
        };

        if (ticket.descripcion && (!meta.cliente_nombre || !meta.cliente_email || !meta.sede || !meta.empresa)) {
            const getVal = (pattern) => {
                const match = ticket.descripcion.match(pattern);
                return match ? match[1].trim() : null;
            };

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

            const clientPart = getVal(/Cliente:\s*([^\]]+)/i);
            if (clientPart && !meta.cliente_nombre) {
                const clientMatch = clientPart.match(/^([^(]+)(?:\(([^)]+)\))?\s*-\s*([^\s]+)/);
                if (clientMatch) {
                    meta.cliente_nombre = clientMatch[1].trim();
                    meta.cliente_rut = clientMatch[2] ? clientMatch[2].trim() : '';
                    meta.cliente_email = clientMatch[3] ? clientMatch[3].trim() : '';
                } else {
                    meta.cliente_nombre = clientPart.trim();
                }
            }
        }

        // Final fallbacks
        if (!meta.sede) meta.sede = 'Santiago - Casa Matriz';
        if (!meta.telefono) meta.telefono = 'No proporcionado';
        if (!meta.dispositivo || meta.dispositivo === 'ninguno') meta.dispositivo = 'Ninguno / Otro';
        if (!meta.modalidad) meta.modalidad = 'Online';
        if (!meta.cliente_nombre) meta.cliente_nombre = ticket.usuario_nombre || 'S/A';
        if (!meta.cliente_rut) meta.cliente_rut = ticket.usuario_rut || 'S/A';
        if (!meta.cliente_email) meta.cliente_email = ticket.usuario_email || 'S/A';

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
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                
                // Merge local updates (like assignments or status changes that failed on Supabase)
                const localUpdates = JSON.parse(localStorage.getItem('ticket_updates')) || {};
                const mergedData = data.map(t => {
                    if (localUpdates[t.id]) {
                        return { ...t, ...localUpdates[t.id] };
                    }
                    return t;
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
        if (!tickets || tickets.length === 0) {
            tickets = [
                {
                    id: '12',
                    codigo: 'TK-2026-0012',
                    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                    asunto: 'Error al iniciar sesión',
                    categoria: 'cuenta',
                    prioridad: 'alta',
                    estado: 'abierto',
                    descripcion: 'No puedo acceder a mi cuenta desde ayer.'
                },
                {
                    id: '11',
                    codigo: 'TK-2026-0011',
                    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
                    asunto: 'Problema con la VPN',
                    categoria: 'redes',
                    prioridad: 'media',
                    estado: 'en progreso',
                    descripcion: 'No logro establecer conexión a la VPN corporativa desde mi equipo.'
                },
                {
                    id: '10',
                    codigo: 'TK-2026-0010',
                    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
                    asunto: 'Solicitud de licencia Office',
                    categoria: 'software',
                    prioridad: 'baja',
                    estado: 'en espera',
                    descripcion: 'Solicito activación de licencia para el uso de Excel y Word en mi laptop de trabajo.'
                },
                {
                    id: '9',
                    codigo: 'TK-2026-0009',
                    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
                    asunto: 'Lentitud y desconexión de Wifi',
                    categoria: 'redes',
                    prioridad: 'media',
                    estado: 'resuelto',
                    descripcion: 'La red wifi de la oficina se desconecta continuamente y presenta lentitud en la navegación.'
                },
                {
                    id: '8',
                    codigo: 'TK-2026-0008',
                    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
                    asunto: 'Error en la plataforma',
                    categoria: 'configuracion',
                    prioridad: 'alta',
                    estado: 'resuelto',
                    descripcion: 'La plataforma muestra un error al guardar.'
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

    async function saveTicket(asunto, categoria, descripcion, prioridad, sede = '', telefono = '', dispositivo = '', impacto = '', modalidad = 'Online', cliente_nombre = '', cliente_rut = '', cliente_email = '', empresa = 'Infinet') {
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

        const ticketData = {
            asunto,
            categoria,
            descripcion,
            prioridad,
            sede,
            telefono,
            dispositivo,
            impacto,
            modalidad,
            cliente_nombre,
            cliente_rut,
            cliente_email,
            empresa,
            estado: 'abierto',
            usuario_rut: u_rut,
            usuario_nombre: u_nombre,
            usuario_email: u_email,
            tecnico_asignado: null
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
                        descripcion: `[Empresa: ${empresa}]\n\n${descripcion}\n\n[Sede: ${sede} | Teléfono: ${telefono} | Dispositivo: ${dispositivo} | Impacto: ${impacto} | Modalidad: ${modalidad} | Cliente: ${cliente_nombre} (${cliente_rut}) - ${cliente_email}]`,
                        prioridad,
                        estado: 'abierto',
                        usuario_rut: ticketData.usuario_rut,
                        usuario_nombre: ticketData.usuario_nombre,
                        usuario_email: ticketData.usuario_email
                    };
                    const { data: retryData, error: retryError } = await supabase
                        .from('tickets')
                        .insert([standardData])
                        .select();
                    if (retryError) throw retryError;
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

        if (targetPageId === 'page-crear-ticket') {
            prefillTicketClientFields();
        } else if (targetPageId === 'page-usuarios') {
            renderUsuariosPage();
            renderDirectoryPage();
        } else if (targetPageId === 'page-panel-m365') {
            if (typeof renderM365Panel === 'function') {
                renderM365Panel();
            }
        } else if (targetPageId === 'page-inicio') {
            updateDashboardCharts();
        } else if (targetPageId === 'page-mis-tickets') {
            if (!allTicketsCached || allTicketsCached.length === 0) {
                refreshTickets();
            } else {
                applyTicketsFilterAndSearch();
            }
        } else if (targetPageId === 'page-visitas') {
            if (typeof initVisitasModule === 'function') {
                initVisitasModule();
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

    function setTheme(isDark) {
        if (isDark) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            if (modeToggle) modeToggle.checked = true;
            if (headerThemeBtn) headerThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            if (modeToggle) modeToggle.checked = false;
            if (headerThemeBtn) headerThemeBtn.innerHTML = '<i class="fas fa-sun" style="color: #f59e0b;"></i>';
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
    let ticketsTimelineChart = null;
    let priorityDonutChart = null;
    let slaDonutChart = null;

    function initDashboardCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está cargado todavía.');
            return;
        }

        // 1. Gráfico de Tickets por Día (Área con degradado)
        const timelineCanvas = document.getElementById('ticketsTimelineChart');
        if (timelineCanvas) {
            const ctx = timelineCanvas.getContext('2d');
            
            // Degradado Azul (Creados)
            const gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
            gradientBlue.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
            gradientBlue.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

            // Degradado Verde (Resueltos)
            const gradientGreen = ctx.createLinearGradient(0, 0, 0, 200);
            gradientGreen.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            gradientGreen.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            const labels30d = ['18 Jul', '21 Jul', '25 Jul', '28 Jul', '1 Ago', '5 Ago', '8 Ago', '12 Ago', '15 Ago', '18 Ago'];
            const createdData30d = [42, 60, 48, 70, 62, 55, 68, 52, 64, 58];
            const resolvedData30d = [38, 52, 45, 64, 58, 48, 72, 48, 60, 56];

            ticketsTimelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels30d,
                    datasets: [
                        {
                            label: 'Creados',
                            data: createdData30d,
                            borderColor: '#3b82f6',
                            borderWidth: 2.5,
                            backgroundColor: gradientBlue,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: '#3b82f6',
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Resueltos',
                            data: resolvedData30d,
                            borderColor: '#10b981',
                            borderWidth: 2.5,
                            backgroundColor: gradientGreen,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: '#10b981',
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#111528',
                            titleColor: '#94a3b8',
                            bodyColor: '#f8fafc',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: true,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#64748b', font: { size: 10 } }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { color: '#64748b', font: { size: 10 }, stepSize: 20 }
                        }
                    }
                }
            });
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

        // Selector de período del gráfico
        const periodSelect = document.getElementById('chart-period-select');
        if (periodSelect && ticketsTimelineChart) {
            periodSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === '7') {
                    ticketsTimelineChart.data.labels = ['12 Ago', '13 Ago', '14 Ago', '15 Ago', '16 Ago', '17 Ago', '18 Ago'];
                    ticketsTimelineChart.data.datasets[0].data = [45, 52, 60, 48, 64, 58, 50];
                    ticketsTimelineChart.data.datasets[1].data = [42, 50, 58, 46, 62, 55, 48];
                } else if (val === 'mes') {
                    ticketsTimelineChart.data.labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
                    ticketsTimelineChart.data.datasets[0].data = [120, 145, 160, 138];
                    ticketsTimelineChart.data.datasets[1].data = [115, 140, 155, 134];
                } else {
                    // 30 días
                    ticketsTimelineChart.data.labels = ['18 Jul', '21 Jul', '25 Jul', '28 Jul', '1 Ago', '5 Ago', '8 Ago', '12 Ago', '15 Ago', '18 Ago'];
                    ticketsTimelineChart.data.datasets[0].data = [42, 60, 48, 70, 62, 55, 68, 52, 64, 58];
                    ticketsTimelineChart.data.datasets[1].data = [38, 52, 45, 64, 58, 48, 72, 48, 60, 56];
                }
                ticketsTimelineChart.update();
            });
        }
    }

    function updateDashboardCharts() {
        if (ticketsTimelineChart) ticketsTimelineChart.update();
        if (priorityDonutChart) priorityDonutChart.update();
        if (slaDonutChart) slaDonutChart.update();
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

    async function refreshTickets() {
        allTicketsCached = await fetchTickets();
        updateStats(allTicketsCached);
        updateFilterCounts(allTicketsCached);
        applyTicketsFilterAndSearch();
        renderAttentionTicketsTable(allTicketsCached);
        renderTechniciansTables(allTicketsCached);
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
                role: 'Administrador / Soporte',
                baseResueltos: 398,
                tiempoProm: '4m 12s',
                slaPct: '98%',
                satisfaccion: '4.9'
            },
            {
                nombre: 'Felipe Olivares',
                email: 'felipe.olivares@t-sales.cl',
                initials: 'FO',
                bgClass: 'bg-blue',
                role: 'Administrador / Soporte',
                baseResueltos: 388,
                tiempoProm: '5m 03s',
                slaPct: '96%',
                satisfaccion: '4.8'
            },
            {
                nombre: 'Belfor Aburto',
                email: 'belfor.aburto@t-sales.cl',
                initials: 'BA',
                bgClass: 'bg-purple',
                role: 'Administrador TI',
                baseResueltos: 6,
                tiempoProm: '3m 45s',
                slaPct: '99%',
                satisfaccion: '5.0'
            }
        ];

        const techStats = team.map(tech => {
            const nameLower = tech.nombre.toLowerCase().trim();
            const resueltosNuevos = (tickets || []).filter(t => 
                (t.resuelto_por || '').toLowerCase().trim() === nameLower ||
                (t.estado === 'resuelto' && (t.tecnico_asignado || '').toLowerCase().trim() === nameLower)
            ).length;

            return {
                ...tech,
                resueltos: tech.baseResueltos + resueltosNuevos,
                estado: 'En línea'
            };
        });

        if (dashTbody) {
            dashTbody.innerHTML = techStats.map(t => `
                <tr>
                    <td class="tech-cell">
                        <div class="tech-avatar-mini ${t.bgClass}">${t.initials}</div>
                        <span class="tech-name">${escapeHtml(t.nombre)}</span>
                    </td>
                    <td class="val-bold">${t.resueltos}</td>
                    <td>${t.tiempoProm}</td>
                    <td class="text-positive font-bold">${t.slaPct}</td>
                    <td><span class="star-rating"><i class="fas fa-star"></i> ${t.satisfaccion}</span></td>
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
                    <td class="val-bold">${t.resueltos}</td>
                    <td>${t.tiempoProm}</td>
                    <td class="text-positive font-bold">${t.slaPct}</td>
                    <td><span class="star-rating"><i class="fas fa-star"></i> ${t.satisfaccion}</span></td>
                    <td><span class="status-badge status-resuelto"><i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i> ${t.estado}</span></td>
                </tr>
            `).join('');
        }
    }

    function isTicketAssignedToUser(ticket, session) {
        if (!session) return true;
        const myName = (session.nombre || '').toLowerCase().trim();
        const myRut = (session.rut || '').toLowerCase().trim();
        const myEmail = (session.email || '').toLowerCase().trim();

        const assigned = (ticket.tecnico_asignado || '').toLowerCase().trim();
        const creator = (ticket.creado_por || ticket.usuario_nombre || '').toLowerCase().trim();
        const rut = (ticket.usuario_rut || '').toLowerCase().trim();
        const email = (ticket.usuario_email || '').toLowerCase().trim();

        const isAssigned = assigned && (assigned.includes(myName) || myName.includes(assigned));
        const isCreator = creator && (creator.includes(myName) || myName.includes(creator));
        const isRutMatch = myRut && rut && (rut === myRut || rut.includes(myRut) || myRut.includes(rut));
        const isEmailMatch = myEmail && email && email === myEmail;

        return isAssigned || isCreator || isRutMatch || isEmailMatch;
    }

    function updateStats(tickets) {
        const statsOpen = document.getElementById('dash-metric-abiertos');
        const statsUnassigned = document.getElementById('dash-metric-sin-asignar');
        const statsSlaRisk = document.getElementById('dash-metric-sla-riesgo');
        const statsSlaBreached = document.getElementById('dash-metric-sla-vencidos');
        const sidebarBadge = document.getElementById('sidebar-badge-mis-tickets');

        const openTickets = tickets.filter(t => t.estado === 'abierto' || t.estado === 'en progreso' || t.estado === 'en espera');
        const unassignedTickets = openTickets.filter(t => !t.tecnico_asignado);

        if (statsOpen) statsOpen.textContent = openTickets.length || 5;
        if (statsUnassigned) statsUnassigned.textContent = `${unassignedTickets.length || 3} sin asignar`;
        
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
                ? `<button class="action-btn action-delete" title="Eliminar ticket" style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); margin-left: 4px;"><i class="fas fa-trash-alt"></i></button>`
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
                    <button class="action-btn action-view" title="Ver ticket"><i class="fas fa-eye"></i></button>
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

            const baseCreados = user.baseCreados !== undefined ? user.baseCreados : (nameLower.includes('belfor') ? 10 : (nameLower.includes('felipe') ? 334 : (nameLower.includes('omar') ? 362 : 0)));
            const baseAsignados = user.baseAsignados !== undefined ? user.baseAsignados : (nameLower.includes('belfor') ? 0 : (nameLower.includes('felipe') ? 393 : (nameLower.includes('omar') ? 398 : 0)));
            const baseResueltos = user.baseResueltos !== undefined ? user.baseResueltos : (nameLower.includes('belfor') ? 6 : (nameLower.includes('felipe') ? 388 : (nameLower.includes('omar') ? 398 : 0)));

            const ticketsCreados = baseCreados + allTicketsCached.filter(t => {
                const meta = extractMetadata(t);
                const uName = (t.usuario_nombre || '').toLowerCase().trim();
                const cName = (meta.cliente_nombre || '').toLowerCase().trim();
                const uEmail = (t.usuario_email || '').toLowerCase().trim();
                const cEmail = (meta.cliente_email || '').toLowerCase().trim();
                return uName === nameLower || cName === nameLower || uEmail === emailLower || cEmail === emailLower;
            }).length;

            const ticketsAsignados = baseAsignados + allTicketsCached.filter(t => 
                (t.tecnico_asignado || '').toLowerCase().trim() === nameLower
            ).length;

            const ticketsResueltos = baseResueltos + allTicketsCached.filter(t => 
                (t.resuelto_por || '').toLowerCase().trim() === nameLower || 
                (t.estado === 'resuelto' && (t.tecnico_asignado || '').toLowerCase().trim() === nameLower)
            ).length;

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

        // Add event listeners to toggles
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
                    applySession(currentSession);
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
            if (nextBtn) nextBtn.innerHTML = 'Enviar Ticket <i class="fas fa-paper-plane"></i>';
        } else {
            if (nextBtn) nextBtn.innerHTML = 'Continuar <i class="fas fa-arrow-right"></i>';
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

        const activeCompanyCard = document.querySelector('.company-card.active');
        const empresa = activeCompanyCard ? activeCompanyCard.getAttribute('data-company') : 'Infinet';

        summaryContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 12px; margin-bottom: 12px;">
                <div><span style="color: var(--text-muted);">Asunto:</span> <strong style="color: var(--text-primary);">${escapeHtml(subject)}</strong></div>
                <div><span style="color: var(--text-muted);">Categoría:</span> <span class="meta-val">${escapeHtml(categoryText)}</span></div>
                <div><span style="color: var(--text-muted);">Empresa:</span> <span class="meta-val" style="font-weight: bold; color: var(--accent-blue); text-transform: uppercase;">${escapeHtml(empresa)}</span></div>
                <div><span style="color: var(--text-muted);">Sede:</span> <span class="meta-val">${escapeHtml(office)}</span></div>
                <div><span style="color: var(--text-muted);">Modalidad:</span> <span class="meta-val" style="font-weight: 600; color: var(--accent-purple);">${escapeHtml(modality)}</span></div>
                <div><span style="color: var(--text-muted);">Teléfono:</span> <span class="meta-val">${escapeHtml(phone)}</span></div>
                
                <div style="grid-column: span 2; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 8px; margin-top: 4px;">
                    <span style="color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Persona Afectada:</span>
                    <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 8px;">
                        <div><span style="color: var(--text-muted);">Nombre:</span> <strong style="color: var(--text-primary);">${escapeHtml(clientName)}</strong></div>
                        <div><span style="color: var(--text-muted);">RUT:</span> <span class="meta-val">${escapeHtml(clientRut)}</span></div>
                        <div><span style="color: var(--text-muted);">Correo:</span> <span class="meta-val">${escapeHtml(clientEmail)}</span></div>
                    </div>
                </div>

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
        });
    });

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
                const priority = 'media';
                const office = document.getElementById('ticket-office').value;
                const modality = document.getElementById('ticket-modalidad').value;
                const clientName = document.getElementById('ticket-client-name').value.trim();
                const clientRut = document.getElementById('ticket-client-rut').value.trim();
                const clientEmail = document.getElementById('ticket-client-email').value.trim();
                const description = document.getElementById('ticket-description').value.trim();
                const phone = document.getElementById('ticket-phone').value.trim();
                const device = document.getElementById('ticket-device').value;
                const impact = document.getElementById('ticket-impact').value;

                const activeCompanyCard = document.querySelector('.company-card.active');
                const empresa = activeCompanyCard ? activeCompanyCard.getAttribute('data-company') : 'Infinet';

                btnStepperNext.disabled = true;
                const originalHtml = btnStepperNext.innerHTML;
                btnStepperNext.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

                try {
                    await saveTicket(subject, category, description, priority, office, phone, device, impact, modality, clientName, clientRut, clientEmail, empresa);
                    alert('¡Ticket creado con éxito!');
                    
                    const form = document.getElementById('stepper-ticket-form');
                    if (form) {
                        form.reset();
                        prefillTicketClientFields();
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

    async function openTicketDetailModal(ticket) {
        activeTicketId = ticket.id;
        
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

        if (contentLower.includes('vpn') || contentLower.includes('globalprotect') || contentLower.includes('portal')) {
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
        } else if (contentLower.includes('outlook') || contentLower.includes('correo') || contentLower.includes('mail') || contentLower.includes('ost')) {
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
                <span class="ai-link-pill" onclick="openKbCategory('${l.cat}')">
                    <i class="fas fa-book"></i> ${escapeHtml(l.text)}
                </span>
            `).join('') + `
                <span class="ai-link-pill" onclick="alert('Ticket anterior #TK-1039 con solución similar aplicado exitosamente.')">
                    <i class="fas fa-check-circle" style="color: var(--accent-green);"></i> #TK-1039 (Resuelto)
                </span>
            `;
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

        if (userAvatar) userAvatar.textContent = userInit;
        if (userCompany) userCompany.textContent = meta.empresa || 'T-Sales';
        if (userRole) userRole.textContent = meta.cargo || 'Ejecutivo Comercial';
        if (userDevice) userDevice.textContent = meta.dispositivo || 'Notebook Dell Latitude 5420';
        if (userOS) userOS.textContent = meta.so || 'Windows 11 Pro';

        if (userPastTickets) {
            userPastTickets.innerHTML = `
                <div class="past-ticket-item" onclick="alert('Abriendo ticket anterior #TK-1024')">
                    <span class="pt-id">#TK-1024</span>
                    <span class="pt-title">Configuración de firma de correo</span>
                    <span class="pt-status status-resuelto">Resuelto</span>
                </div>
                <div class="past-ticket-item" onclick="alert('Abriendo ticket anterior #TK-0988')">
                    <span class="pt-id">#TK-0988</span>
                    <span class="pt-title">Instalación de Teams y Office</span>
                    <span class="pt-status status-resuelto">Resuelto</span>
                </div>
            `;
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

        await loadRepliesList(ticket.id);

        const modal = document.getElementById('ticket-detail-modal');
        if (modal) modal.style.display = 'flex';
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

    if (modalCloseBtn && ticketModal) {
        modalCloseBtn.addEventListener('click', () => {
            ticketModal.style.display = 'none';
            activeTicketId = null;
        });

        ticketModal.addEventListener('click', (e) => {
            if (e.target === ticketModal) {
                ticketModal.style.display = 'none';
                activeTicketId = null;
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

    // Inicializar carga de tickets
    refreshTickets();


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
        if (localEquipos.length === 0) {
            localEquipos = seedDefaultEquipos();
        }

        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .select('*')
                    .order('nombre_codigo', { ascending: true });
                if (error) throw error;
                
                const supabaseIds = new Set(data.map(e => e.id));
                const localOnly = localEquipos.filter(e => !supabaseIds.has(e.id));
                
                const merged = [...data, ...localOnly];
                merged.sort((a, b) => {
                    const codeA = String(a.nombre_codigo || '');
                    const codeB = String(b.nombre_codigo || '');
                    return codeA.localeCompare(codeB, undefined, { numeric: true });
                });
                return merged;
            } catch (err) {
                console.error('Error fetching equipos from Supabase, using LocalStorage:', err);
            }
        }
        
        return localEquipos;
    }

    function seedDefaultEquipos() {
        const equipos = [
                {
                    id: 'eq-1',
                    nombre_codigo: '1',
                    usuario_nombre: 'Cristian Illanes',
                    usuario_email: 'cristian.illanes@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '714NPL2',
                    marca: 'Dell',
                    modelo: 'Latitude 3280',
                    cpu: 'i5-7300U',
                    ram: '16GB',
                    disco_duro: '256GB SSD',
                    sistema_operativo: 'Windows 11 Pro',
                    licencia_usuario: '2024 PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-2',
                    nombre_codigo: '2',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: '2XL8H13',
                    marca: 'Dell',
                    modelo: 'Vostro 3400',
                    cpu: 'i3-1115G4',
                    ram: '8GB (2x4GB) 2667MHz',
                    disco_duro: '256GB',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: '2021 PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-3',
                    nombre_codigo: '3',
                    usuario_nombre: 'Alicia Monica escobar',
                    usuario_email: 'alicia.escobar@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG0403P17',
                    marca: 'HP',
                    modelo: 'Elitebook 840 G3',
                    cpu: 'i3-6200U',
                    ram: '8GB (2x4GB) 2133MHz',
                    disco_duro: '240GB M.2 SATA',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: 'S/A',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-4',
                    nombre_codigo: '4',
                    usuario_nombre: 'Yenifer Perez',
                    usuario_email: 'yenifer.perez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG027BQKC',
                    marca: 'HP',
                    modelo: 'Elitebook 840 G6',
                    cpu: 'i7-8375U',
                    ram: '16GB',
                    disco_duro: '500GB SSD',
                    sistema_operativo: 'Windows 11 Pro',
                    licencia_usuario: '2021 Standard',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-5',
                    nombre_codigo: '5',
                    usuario_nombre: 'Anabelen Godoy',
                    usuario_email: 'anabelen.godoy@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG8527T9G',
                    marca: 'HP',
                    modelo: 'ProBook 640 G4',
                    cpu: 'i5-8250U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: 'S/A',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-6',
                    nombre_codigo: '6',
                    usuario_nombre: 'Daniela Makarena Agu',
                    usuario_email: 'daniela.aguilera@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG11437TJ',
                    marca: 'HP',
                    modelo: '240 G8',
                    cpu: 'i3-1005G1',
                    ram: '8GB (2x4GB) 2667MHz',
                    disco_duro: '240GB SSD',
                    sistema_operativo: 'Windows 10 Home',
                    licencia_usuario: '2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-7',
                    nombre_codigo: '7',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: '5CG11439TD',
                    marca: 'HP',
                    modelo: '240 G8',
                    cpu: 'i3-1005G1',
                    ram: '8GB',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'Windows 10 Home SL',
                    licencia_usuario: '2024 PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-8',
                    nombre_codigo: '8',
                    usuario_nombre: 'Maria Jose Alarcon Ara',
                    usuario_email: 'maria.alarcon@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '6CXVP13',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'i5-8265U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: '2024 LTSC PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-9',
                    nombre_codigo: '9',
                    usuario_nombre: 'Jaime Perez',
                    usuario_email: 'jaime.perez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: 'HeroBook255G20120077',
                    marca: 'Chuwi',
                    modelo: 'HeroBook PRO X3128',
                    cpu: 'Intel Celeron N4020',
                    ram: '8GB (4x4) 2133MHz',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: '2010 PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-10',
                    nombre_codigo: '10',
                    usuario_nombre: 'Nicolás Jaruaque Núñez',
                    usuario_email: 'nicolas.jaque@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '27XNPL2',
                    marca: 'Dell',
                    modelo: 'Latitude 5280',
                    cpu: 'i5-7300U',
                    ram: '16GB (1x16GB) 2133MHz',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'Windows 11 Home',
                    licencia_usuario: '2021 LTSC SD',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-11',
                    nombre_codigo: '11',
                    usuario_nombre: 'Camilo Llanquileo',
                    usuario_email: 'camilo.llanquileo@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '1GM40Z2',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'i5-8365U',
                    ram: '8GB (2x4GB) 2133MHz',
                    disco_duro: '250GB M.2 SATA',
                    sistema_operativo: 'Windows 11 Pro',
                    licencia_usuario: '2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-12',
                    nombre_codigo: '12',
                    usuario_nombre: 'Carolina Andrea Lillo E',
                    usuario_email: 'carolina.lillo@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG9366D32',
                    marca: 'HP',
                    modelo: 'ProBook 640 G4',
                    cpu: 'i5-8350U',
                    ram: '8GB (2x4GB) 2400MHz',
                    disco_duro: '250GB M.2 SATA',
                    sistema_operativo: 'Windows 10 Pro',
                    licencia_usuario: '2024 PP',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-13',
                    nombre_codigo: '13',
                    usuario_nombre: 'Celeste Anai Morales V',
                    usuario_email: 'celeste.morales@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG1097S0X',
                    marca: 'HP',
                    modelo: 'HP 348 G7',
                    cpu: 'i5-10210U',
                    ram: '8GB (2x4GB)',
                    disco_duro: '240GB SSD',
                    sistema_operativo: 'Win11 Pro',
                    licencia_usuario: '2010',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-14',
                    nombre_codigo: '14',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG0435VQ9',
                    marca: 'HP',
                    modelo: '14-CF2xxx',
                    cpu: 'i3-10110U',
                    ram: '4GB',
                    disco_duro: '240GB SSD',
                    sistema_operativo: 'Win11 Home',
                    licencia_usuario: '365 Personal',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-15',
                    nombre_codigo: '15',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: 'R90VCD24',
                    marca: 'Lenovo',
                    modelo: 'Yoga 11e 20LNS0YE00',
                    cpu: 'm3-7Y30',
                    ram: '8GB integrado',
                    disco_duro: '128GB M.2 SATA 2280',
                    sistema_operativo: 'Win11 Home',
                    licencia_usuario: '365 Personal',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-16',
                    nombre_codigo: '16',
                    usuario_nombre: 'Alejandro Rodrigo San',
                    usuario_email: 'alejandro.sanmartin@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'H5LLL13',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'Win11 Pro',
                    licencia_usuario: 'Pro Plus 2010',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-17',
                    nombre_codigo: '17',
                    usuario_nombre: 'Dayana Franchesca Go',
                    usuario_email: 'dayana.gonzalez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG9036KWL',
                    marca: 'HP',
                    modelo: 'ProBook 640 G4',
                    cpu: 'i5-8350U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'Win10 Pro',
                    licencia_usuario: 'Standard 2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-18',
                    nombre_codigo: '18',
                    usuario_nombre: 'Delmira Urrea',
                    usuario_email: 'delmira.urrea@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'F4ZNPL2',
                    marca: 'Dell',
                    modelo: 'Latitude 5280',
                    cpu: 'i5-7300U',
                    ram: '8GB',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-19',
                    nombre_codigo: '19',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'HDGD2W1',
                    marca: 'Dell',
                    modelo: 'Latitude 6230',
                    cpu: 'i5-3320',
                    ram: '6GB 1333MHz',
                    disco_duro: '240GB SSD',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-20',
                    nombre_codigo: '20',
                    usuario_nombre: 'Carlos Yañez',
                    usuario_email: 'carlos.yanez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '44FLL13',
                    marca: 'Dell',
                    modelo: 'Latitude 5500',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2024',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-21',
                    nombre_codigo: '21',
                    usuario_nombre: 'Carmen Rojas',
                    usuario_email: 'carmen.rojas@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'FPKKL13',
                    marca: 'Dell',
                    modelo: 'Latitude 5500',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2024 PRO PLUS',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-22',
                    nombre_codigo: '22',
                    usuario_nombre: 'Yenifer Perez',
                    usuario_email: 'yenifer.perez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '8038733',
                    marca: 'Dell',
                    modelo: 'Latitude 5500',
                    cpu: 'i5-8200',
                    ram: '8GB (1x808) 2400MHz',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2024 PRO PLUS',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-23',
                    nombre_codigo: '23',
                    usuario_nombre: 'Genesis Calderon',
                    usuario_email: 'genesis.calderon@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '3CG1143NL1',
                    marca: 'HP',
                    modelo: '14-CF2xxx',
                    cpu: 'i3-10110U',
                    ram: '8GB (2x4GB) 2400MHz',
                    disco_duro: '500GB SSD',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2024 PRO PLUS',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-24',
                    nombre_codigo: '24',
                    usuario_nombre: 'Alondra Guisselle Flore',
                    usuario_email: 'alondra.flores@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG8203R14',
                    marca: 'HP',
                    modelo: 'Elitebook 820 G3',
                    cpu: 'i7-6600U',
                    ram: '8GB 2133MHz',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-25',
                    nombre_codigo: '25',
                    usuario_nombre: 'Gissell Solange Mirand',
                    usuario_email: 'gissell.miranda@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'FQM92R2',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2024',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-26',
                    nombre_codigo: '26',
                    usuario_nombre: 'Yenifer Perez',
                    usuario_email: 'yenifer.perez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'NKHVWAL00212415CF',
                    marca: 'Acer',
                    modelo: 'Aspire A314-22',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB)',
                    disco_duro: '256GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-27',
                    nombre_codigo: '27',
                    usuario_nombre: 'S/A',
                    usuario_email: '',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '9X5LLL13',
                    marca: 'Dell',
                    modelo: 'Latitude 5500',
                    cpu: 'i5-8365U',
                    ram: '8GB (1x8GB)',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-28',
                    nombre_codigo: '28',
                    usuario_nombre: 'Lia villavicencio',
                    usuario_email: 'lia.villavicencio@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG212C854',
                    marca: 'HP',
                    modelo: '14-DQ2023LA',
                    cpu: 'i3-1115G4',
                    ram: '4GB',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2010',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-29',
                    nombre_codigo: '29',
                    usuario_nombre: 'Nicole Nubilar',
                    usuario_email: 'nicole.nubilar@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '935W333',
                    marca: 'Dell',
                    modelo: 'Latitude 5400',
                    cpu: 'i3-8200U',
                    ram: 'S/A',
                    disco_duro: 'S/A',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-30',
                    nombre_codigo: '30',
                    usuario_nombre: 'Valentina Pérez',
                    usuario_email: 'valentina.perez@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'CND112ZKYQ',
                    marca: 'HP',
                    modelo: '250 G8',
                    cpu: 'i3-1005G1',
                    ram: '8GB',
                    disco_duro: '240GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2024',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-31',
                    nombre_codigo: '31',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: 'XE328',
                    marca: 'CHUWI',
                    modelo: 'HeroBook255G20120077',
                    cpu: 'Celeron N4020',
                    ram: '8GB',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'S/A',
                    licencia_usuario: 'PROFESSIONAL 2010',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-32',
                    nombre_codigo: '32',
                    usuario_nombre: 'Thiare Tirado',
                    usuario_email: 'thiare.tirado@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG7233QD2',
                    marca: 'HP',
                    modelo: 'EliteBook 820 G3',
                    cpu: 'i7-6500U',
                    ram: '8GB (1x8GB) 2133MHz',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-33',
                    nombre_codigo: '33',
                    usuario_nombre: 'Javiera Alejandra Muñ',
                    usuario_email: 'javiera.munoz@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG0354WZ2',
                    marca: 'HP',
                    modelo: 'Elitebook 840 G3',
                    cpu: 'i5-6200U',
                    ram: '8GB (2x4GB) 2133MHz',
                    disco_duro: '240GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2023',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-34',
                    nombre_codigo: '34',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '5CG112CT07',
                    marca: 'HP',
                    modelo: '14-CK2091LA',
                    cpu: 'i3-10110U',
                    ram: '4GB',
                    disco_duro: '128GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: '2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-35',
                    nombre_codigo: '35',
                    usuario_nombre: 'Jocelyn Adriana Bece',
                    usuario_email: 'jocelyn.becerra@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'F13GT33',
                    marca: 'Dell',
                    modelo: 'Latitude 5500',
                    cpu: 'i5-8265U',
                    ram: '8GB (1x8GB) 2400MHz',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2010',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-36',
                    nombre_codigo: '36',
                    usuario_nombre: 'Rita Rojas',
                    usuario_email: 'rita.rojas@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: 'RFXR1N2',
                    marca: 'Dell',
                    modelo: 'Latitude 5280',
                    cpu: 'i5-7300U',
                    ram: '16GB (1x16GB) 2134M',
                    disco_duro: '250GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-37',
                    nombre_codigo: '37',
                    usuario_nombre: 'Javiera Paz Navarro Se',
                    usuario_email: 'javiera.navarro@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '450NPL2',
                    marca: 'Dell',
                    modelo: 'Latitude 5280',
                    cpu: 'i5-7300U',
                    ram: '8GB',
                    disco_duro: '240GB NVMe',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-38',
                    nombre_codigo: '38',
                    usuario_nombre: 'Jose Poblete Rubilar',
                    usuario_email: 'jose.poblete@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'baja',
                    serial: 'HEROBook255G20120054',
                    marca: 'Chuwi',
                    modelo: 'Herobook',
                    cpu: 'Celeron N4020',
                    ram: '8GB',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2016',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'eq-39',
                    nombre_codigo: '39',
                    usuario_nombre: 'Auditoria T-sales',
                    usuario_email: 'auditoriat@t-sales.cl',
                    empresa: 'T-Sales',
                    estado: 'activo',
                    serial: '93NXR2',
                    marca: 'Dell',
                    modelo: 'Latitude 5490',
                    cpu: 'i5-7300U',
                    ram: '8GB (1x8GB) 2133MHz',
                    disco_duro: '256GB M.2 SATA',
                    sistema_operativo: 'WINDOWS 10 PRO',
                    licencia_usuario: 'PROFESSIONAL 2021',
                    tipo: 'laptop',
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('local_equipos', JSON.stringify(equipos));
            return equipos;
        }

    async function saveEquipo(equipo) {
        if (!equipo.id) {
            equipo.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
        }
        if (!equipo.created_at) {
            equipo.created_at = new Date().toISOString();
        }

        // Guardar localmente siempre
        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        equipos.push(equipo);
        localStorage.setItem('local_equipos', JSON.stringify(equipos));

        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .insert([equipo])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error('Error saving equipo in Supabase, using LocalStorage:', err);
            }
        }
        return equipo;
    }

    async function updateEquipo(id, updatedFields) {
        // Actualizar localmente siempre
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
                if (error) throw error;
                if (data && data.length > 0) {
                    return data[0];
                }
            } catch (err) {
                console.error('Error updating equipo in Supabase, using LocalStorage:', err);
            }
        }
        return updatedLocal;
    }

    async function deleteEquipo(id) {
        // Eliminar localmente siempre
        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const filtered = equipos.filter(e => e.id !== id);
        localStorage.setItem('local_equipos', JSON.stringify(filtered));

        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('equipos')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('Error deleting equipo from Supabase, using LocalStorage:', err);
            }
        }
        return true;
    }

    let allEquiposCached = [];
    let currentEquipFilterTab = 'todos';
    let currentEquipSearch = '';
    let currentEquipFilterTipo = 'todos';
    let currentEquipFilterMarca = 'todos';
    let currentEquipFilterEstado = 'todos';
    let currentEquipPage = 1;
    const itemsPerEquipPage = 5;

    async function refreshEquipos() {
        allEquiposCached = await fetchEquipos();
        updateEquipStats(allEquiposCached);
        applyEquipFilters();
    }

    function updateEquipStats(equipos) {
        const totalEl = document.getElementById('stat-total-equipos');
        const escritoriosEl = document.getElementById('stat-total-escritorios');
        const portatilesEl = document.getElementById('stat-total-portatiles');
        const activosEl = document.getElementById('stat-total-activos');
        const mantenimientoEl = document.getElementById('stat-total-mantenimiento');

        if (totalEl) totalEl.textContent = equipos.length;
        if (escritoriosEl) escritoriosEl.textContent = equipos.filter(e => e.tipo === 'escritorio').length;
        if (portatilesEl) portatilesEl.textContent = equipos.filter(e => e.tipo === 'laptop').length;
        if (activosEl) activosEl.textContent = equipos.filter(e => e.estado === 'activo').length;
        if (mantenimientoEl) mantenimientoEl.textContent = equipos.filter(e => e.estado === 'mantenimiento').length;
    }

    function applyEquipFilters() {
        let filtered = [...allEquiposCached];

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
            filtered = filtered.filter(e => e.marca.toLowerCase() === currentEquipFilterMarca.toLowerCase());
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
                (e.marca && e.marca.toLowerCase().includes(query))
            );
        }

        renderEquipTable(filtered);
    }

    function renderEquipTable(filtered) {
        const tbody = document.getElementById('equip-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

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
            
            const stateLabel = eq.estado.charAt(0).toUpperCase() + eq.estado.slice(1);
            const stateClass = `status-${eq.estado}`;
            
            let iconClass = 'fa-laptop';
            if (eq.tipo === 'escritorio') iconClass = 'fa-desktop';
            if (eq.tipo === 'servidor') iconClass = 'fa-server';

            const initials = eq.usuario_nombre ? eq.usuario_nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

            tr.innerHTML = `
                <td>
                    <div class="equip-info-cell">
                        <div class="equip-thumbnail">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="equip-meta-info" style="display: flex; flex-direction: column;">
                            <span class="equip-code">${escapeHtml(eq.nombre_codigo)}</span>
                            <span class="equip-type-label">${escapeHtml(eq.tipo)}</span>
                            <span class="equip-company-badge" style="background: rgba(97, 62, 234, 0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; color: var(--accent-blue); width: fit-content; margin-top: 4px; font-weight: bold; border: 1px solid rgba(97, 62, 234, 0.2);">${escapeHtml(eq.empresa || 'T-Sales')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="equip-user-cell">
                        <div class="equip-user-avatar">
                            <span>${initials}</span>
                        </div>
                        <div class="equip-user-info">
                            <span class="equip-user-name">${escapeHtml(eq.usuario_nombre)}</span>
                            <span class="equip-user-email">${escapeHtml(eq.usuario_email || 'S/A')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="equip-text-primary">${escapeHtml(eq.marca)}</div>
                    <div class="equip-text-secondary">${escapeHtml(eq.modelo)}</div>
                </td>
                <td>
                    <div class="equip-so-info">
                        <i class="fab fa-windows equip-so-icon"></i>
                        <span class="equip-text-primary">${escapeHtml(eq.sistema_operativo)}</span>
                    </div>
                    <div class="equip-text-secondary">${escapeHtml(eq.serial)}</div>
                </td>
                <td>
                    <div class="equip-spec-item"><strong>CPU:</strong> ${escapeHtml(eq.cpu || '-')}</div>
                    <div class="equip-spec-item"><strong>RAM:</strong> ${escapeHtml(eq.ram)}</div>
                    <div class="equip-spec-item"><strong>Disco:</strong> ${escapeHtml(eq.disco_duro)}</div>
                    <div class="equip-spec-item"><strong>Licencia:</strong> ${escapeHtml(eq.licencia_usuario || '-')}</div>
                </td>
                <td>
                    <span class="status-badge ${stateClass}">${stateLabel}</span>
                </td>
                <td style="text-align: right; padding-right: 24px;">
                    <div class="ticket-actions" style="justify-content: flex-end;">
                        <button class="action-btn action-view btn-view-eq" title="Ver equipo" data-id="${eq.id}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn action-edit btn-edit-eq" title="Editar equipo" data-id="${eq.id}" style="color: var(--text-secondary); background: transparent; border: 1px solid var(--border-color); border-radius: 8px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn action-more btn-more-eq" title="Eliminar equipo" data-id="${eq.id}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;

            tr.querySelector('.btn-view-eq').addEventListener('click', () => openEquipDetailModal(eq));
            tr.querySelector('.btn-edit-eq').addEventListener('click', () => openEquipFormModal(eq));
            tr.querySelector('.btn-more-eq').addEventListener('click', () => {
                const action = confirm(`¿Deseas eliminar el registro del equipo ${eq.nombre_codigo}?`);
                if (action) {
                    deleteAndRefresh(eq.id);
                }
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
            document.getElementById('modal-equip-type').textContent = `${eq.tipo.toUpperCase()} / ${eq.estado.toUpperCase()}`;
            document.getElementById('modal-equip-codigo').textContent = eq.nombre_codigo;
            
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
                    await saveEquipo(eqData);
                    alert('¡Equipo registrado con éxito!');
                }

                if (formModal) formModal.style.display = 'none';
                await refreshEquipos();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error al guardar la información.');
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

    const equipFilterTabs = document.querySelectorAll('#equip-filter-tabs .filter-tab');
    equipFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            equipFilterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEquipFilterTab = tab.getAttribute('data-filter');
            currentEquipPage = 1;
            applyEquipFilters();
        });
    });

    const btnImportarEquipos = document.getElementById('btn-importar-equipos');
    const equipFileInput = document.getElementById('equip-file-input');
    const previewModal = document.getElementById('equipo-import-preview-modal');
    const previewTbody = document.getElementById('import-preview-table-body');
    const previewCloseBtn = document.getElementById('equipo-import-close-btn');
    const previewCancelBtn = document.getElementById('btn-import-cancel');
    const previewConfirmBtn = document.getElementById('btn-import-confirm');
    
    let parsedEquipos = [];

    if (btnImportarEquipos && equipFileInput) {
        btnImportarEquipos.addEventListener('click', () => {
            equipFileInput.value = ''; // Reset file input
            equipFileInput.click();
        });

        equipFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Mostrar spinner de carga o mensaje
            btnImportarEquipos.disabled = true;
            const originalBtnHtml = btnImportarEquipos.innerHTML;
            btnImportarEquipos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Leyendo...';

            try {
                const extension = file.name.split('.').pop().toLowerCase();
                if (extension === 'pdf') {
                    parsedEquipos = await readPDFFile(file);
                } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
                    parsedEquipos = await readExcelFile(file);
                } else {
                    alert('Formato de archivo no soportado. Sube un archivo .pdf, .xlsx, .xls o .csv');
                    return;
                }

                if (parsedEquipos.length === 0) {
                    alert('No se pudo extraer ningún equipo válido del archivo. Revisa el formato.');
                } else {
                    renderImportPreview(parsedEquipos);
                    if (previewModal) previewModal.style.display = 'flex';
                }
            } catch (err) {
                console.error('Error al parsear el archivo:', err);
                alert('Ocurrió un error al procesar el archivo: ' + err.message);
            } finally {
                btnImportarEquipos.disabled = false;
                btnImportarEquipos.innerHTML = originalBtnHtml;
            }
        });
    }

    if (previewCloseBtn) previewCloseBtn.addEventListener('click', () => previewModal.style.display = 'none');
    if (previewCancelBtn) previewCancelBtn.addEventListener('click', () => previewModal.style.display = 'none');

    if (previewConfirmBtn) {
        previewConfirmBtn.addEventListener('click', async () => {
            previewConfirmBtn.disabled = true;
            previewConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';

            try {
                let successCount = 0;
                for (const eq of parsedEquipos) {
                    await saveEquipo(eq);
                    successCount++;
                }
                alert(`¡Se importaron ${successCount} equipos con éxito!`);
                if (previewModal) previewModal.style.display = 'none';
                await refreshEquipos();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error al guardar los equipos importados.');
            } finally {
                previewConfirmBtn.disabled = false;
                previewConfirmBtn.innerHTML = 'Confirmar Importación';
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
            const line = lines.find(l => {
                const cleanLine = l.replace(/^\s*[-=*]+\s*$/, '').trim();
                return cleanLine.toLowerCase().startsWith(key.toLowerCase());
            });
            if (line) {
                const parts = line.split(':');
                if (parts.length > 1) {
                    return parts.slice(1).join(':').trim();
                }
            }
            return '';
        };

        const data = {};
        data.codigo = getValue('Nombre Equipo') || getValue('Nombre') || getValue('Codigo') || '';
        data.usuario_nombre = getValue('Usuario') || '';
        data.usuario_email = getValue('Correo') || getValue('Email') || '';
        data.marca = getValue('Marca') || '';
        data.modelo = getValue('Modelo') || '';
        
        const so = getValue('Sistema Operativo') || getValue('S.O.') || getValue('SO') || '';
        const version = getValue('Version') || '';
        const arch = getValue('Arquitectura') || '';
        data.so = [so, version, arch].filter(Boolean).join(' ');

        data.ram = getValue('RAM Total') || getValue('RAM') || '';
        data.serial = getValue('Serial') || getValue('S/N') || getValue('Numero de Serie') || '';

        const discoModelo = getValue('Modelo Disco') || getValue('Disco') || '';
        const discoCapacidad = getValue('Capacidad') || getValue('Tamano Disco') || '';
        data.disco = [discoModelo, discoCapacidad].filter(Boolean).join(' - ');

        data.cpu = getValue('CPU') || getValue('Procesador') || '';

        return data;
    }

    function renderImportPreview(equipos) {
        if (!previewTbody) return;
        previewTbody.innerHTML = '';
        
        const badge = document.getElementById('import-stats-badge');
        if (badge) badge.textContent = `${equipos.length} NUEVOS REGISTROS`;

        equipos.forEach(eq => {
            const tr = document.createElement('tr');
            const stateLabel = eq.estado.charAt(0).toUpperCase() + eq.estado.slice(1);
            const stateClass = `status-${eq.estado}`;

            tr.innerHTML = `
                <td><strong style="color: var(--accent-blue);">${escapeHtml(eq.nombre_codigo)}</strong></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(eq.usuario_nombre)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(eq.usuario_email || 'S/A')}</div>
                </td>
                <td>
                    <span style="background: rgba(97, 62, 234, 0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; color: var(--accent-blue); font-weight: bold; border: 1px solid rgba(97, 62, 234, 0.2);">
                        ${escapeHtml(eq.empresa)}
                    </span>
                </td>
                <td>
                    <div style="color: var(--text-primary); font-weight: 500;">${escapeHtml(eq.marca)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(eq.modelo)}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;"><strong>CPU:</strong> ${escapeHtml(eq.cpu)}</div>
                    <div style="font-size: 0.85rem;"><strong>RAM:</strong> ${escapeHtml(eq.ram)}</div>
                    <div style="font-size: 0.85rem;"><strong>Disco:</strong> ${escapeHtml(eq.disco_duro)}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">${escapeHtml(eq.sistema_operativo)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">${escapeHtml(eq.licencia_usuario)}</div>
                </td>
                <td>
                    <span class="status-badge ${stateClass}">${stateLabel}</span>
                </td>
            `;
            previewTbody.appendChild(tr);
        });
    }

    // Heurística de parseo para texto extraído del PDF
    function parsePDFTextToEquipos(text) {
        const lines = text.split('\n');
        const importedEquipos = [];
        
        lines.forEach((line) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;
            
            // Si la línea parece ser un encabezado la saltamos
            if (/usuario|correo|serial|marca|modelo/i.test(cleanLine) && cleanLine.split(/\s{2,}/).length > 5) {
                return; 
            }
            
            const hasEmail = cleanLine.includes('@');
            const hasBrand = /dell|hp|lenovo|chuwi|acer|asus/i.test(cleanLine);
            const hasSerial = /[A-Z0-9]{7,18}/i.test(cleanLine);
            
            if (!hasEmail && !hasBrand && !hasSerial) return;

            let parts = cleanLine.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
            
            // Parseo si no viene con delimitadores tab/multi-espacio
            if (parts.length < 5) {
                const codeMatch = cleanLine.match(/^(\d+)\s/);
                const code = codeMatch ? codeMatch[1] : (importedEquipos.length + 1).toString();
                
                const emailMatch = cleanLine.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                const email = emailMatch ? emailMatch[1] : '';
                
                const brandMatch = cleanLine.match(/(dell|hp|lenovo|chuwi|acer|asus)/i);
                const marca = brandMatch ? brandMatch[1] : 'Dell';
                
                const estadoMatch = cleanLine.match(/(activo|dado de baja|baja|mantenimiento)/i);
                let estado = 'activo';
                if (estadoMatch) {
                    const estLower = estadoMatch[1].toLowerCase();
                    if (estLower.includes('baja')) estado = 'baja';
                    else if (estLower.includes('mantenimiento')) estado = 'mantenimiento';
                }
                
                const serialMatch = cleanLine.match(/\b([A-Z0-9-]{6,25})\b/i);
                const serial = serialMatch ? serialMatch[1] : '';
                
                const ramMatch = cleanLine.match(/(\d+GB|\d+\s*GB)/i);
                const ram = ramMatch ? ramMatch[1] : '8 GB';
                
                const discoMatch = cleanLine.match(/(\d+GB\s*(SSD|NVMe|SATA)?|\d+\s*(GB|TB)\s*(SSD|HDD|NVMe)?)/i);
                const disco = discoMatch ? discoMatch[1] : '256 GB SSD';
                
                const cpuMatch = cleanLine.match(/(i3|i5|i7|m3|celeron|ryzen|amd|intel)[a-zA-Z0-9-]*\s*([0-9a-zA-Z-]*)/i);
                const cpu = cpuMatch ? cpuMatch[0] : 'i5';
                
                const empresaMatch = cleanLine.match(/(t-sales|vprime|infinet)/i);
                const empresa = empresaMatch ? (empresaMatch[1].toLowerCase() === 't-sales' ? 'T-Sales' : empresaMatch[1].toLowerCase() === 'vprime' ? 'VPrime' : 'Infinet') : 'T-Sales';
                
                const soMatch = cleanLine.match(/(windows\s*11\s*pro|windows\s*10\s*pro|windows\s*\d+|win\s*11|win\s*10|ubuntu)/i);
                const so = soMatch ? soMatch[1] : 'Windows 10 Pro';
                
                const licenciaMatch = cleanLine.match(/(2024\s*pp|2021\s*pp|2024\s*pro\s*plus|2021\s*pro\s*plus|standard|365|s\/a)/i);
                const licencia = licenciaMatch ? licenciaMatch[1] : 'S/A';

                let usuario = 'Usuario Importado';
                if (emailMatch && codeMatch) {
                    const startIdx = codeMatch[0].length;
                    const endIdx = cleanLine.indexOf(emailMatch[1]);
                    if (endIdx > startIdx) {
                        usuario = cleanLine.substring(startIdx, endIdx).trim();
                    }
                }

                let modelo = 'Genérico';
                if (brandMatch) {
                    const brandIdx = cleanLine.indexOf(brandMatch[0]);
                    const afterBrand = cleanLine.substring(brandIdx + brandMatch[0].length).trim();
                    const modelParts = afterBrand.split(/\s+/).slice(0, 2);
                    if (modelParts.length > 0) {
                        modelo = modelParts.join(' ');
                    }
                }

                importedEquipos.push({
                    nombre_codigo: code,
                    usuario_nombre: usuario,
                    usuario_email: email,
                    empresa: empresa,
                    estado: estado,
                    serial: serial || ('SR-' + Math.random().toString(36).substr(2, 6).toUpperCase()),
                    marca: marca,
                    modelo: modelo,
                    cpu: cpu,
                    ram: ram,
                    disco_duro: disco,
                    sistema_operativo: so,
                    licencia_usuario: licencia,
                    tipo: 'laptop'
                });
                return;
            }

            let code = parts[0] || (importedEquipos.length + 1).toString();
            let usuario = parts[1] || 'Usuario Importado';
            let email = parts[2] && parts[2].includes('@') ? parts[2] : '';
            let propiedad = parts[3] || 'T-Sales';
            let estadoStr = parts[4] || 'activo';
            let serial = parts[5] || '';
            let marca = parts[6] || '';
            let modelo = parts[7] || '';
            let cpu = parts[8] || 'i5';
            let ram = parts[9] || '8 GB';
            let disco = parts[10] || '256 GB SSD';
            let so = parts[11] || 'Windows 10 Pro';
            let licencia = parts[12] || 'S/A';

            let empresa = 'T-Sales';
            if (/vprime/i.test(propiedad)) empresa = 'VPrime';
            else if (/infinet/i.test(propiedad)) empresa = 'Infinet';

            let estado = 'activo';
            if (/baja|dado\s+de\s+baja/i.test(estadoStr)) estado = 'baja';
            else if (/mantenimiento/i.test(estadoStr)) estado = 'mantenimiento';

            importedEquipos.push({
                nombre_codigo: code,
                usuario_nombre: usuario,
                usuario_email: email,
                empresa: empresa,
                estado: estado,
                serial: serial || ('SR-' + Math.random().toString(36).substr(2, 6).toUpperCase()),
                marca: marca || 'Dell',
                modelo: modelo || 'Latitude',
                cpu: cpu,
                ram: ram,
                disco_duro: disco,
                sistema_operativo: so,
                licencia_usuario: licencia,
                tipo: 'laptop'
            });
        });

        return importedEquipos;
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
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (json.length === 0) {
                        resolve([]);
                        return;
                    }
                    
                    const headers = json[0].map(h => String(h || '').trim().toLowerCase());
                    
                    const idxCode = headers.findIndex(h => h.includes('código') || h.includes('codigo') || h.includes('code') || h === 'no' || h === 'id');
                    const idxUser = headers.findIndex(h => h.includes('usuario') || h.includes('user') || h.includes('nombre'));
                    const idxEmail = headers.findIndex(h => h.includes('correo') || h.includes('email') || h.includes('mail'));
                    const idxProp = headers.findIndex(h => h.includes('propiedad') || h.includes('empresa') || h.includes('company') || h.includes('propietario'));
                    const idxState = headers.findIndex(h => h.includes('estado') || h.includes('status') || h.includes('equipo'));
                    const idxSerial = headers.findIndex(h => h.includes('serial') || h.includes('s/n') || h.includes('serie') || h.includes('servial'));
                    const idxBrand = headers.findIndex(h => h.includes('marca') || h.includes('brand'));
                    const idxModel = headers.findIndex(h => h.includes('modelo') || h.includes('model'));
                    const idxCpu = headers.findIndex(h => h.includes('cpu') || h.includes('procesador') || h.includes('proc'));
                    const idxRam = headers.findIndex(h => h.includes('ram') || h.includes('memoria'));
                    const idxDisco = headers.findIndex(h => h.includes('disco') || h.includes('almacenamiento') || h.includes('hdd') || h.includes('ssd'));
                    const idxSo = headers.findIndex(h => h.includes('so') || h.includes('sistema') || h.includes('os') || h.includes('operativo'));
                    const idxLicense = headers.findIndex(h => h.includes('licencia') || h.includes('license'));
                    
                    const imported = [];
                    
                    for (let i = 1; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length === 0) continue;
                        
                        const code = idxCode !== -1 ? String(row[idxCode] || '').trim() : i.toString();
                        const usuario = idxUser !== -1 ? String(row[idxUser] || '').trim() : 'Usuario Importado';
                        const email = idxEmail !== -1 ? String(row[idxEmail] || '').trim() : '';
                        const propiedad = idxProp !== -1 ? String(row[idxProp] || '').trim() : 'T-Sales';
                        const estadoStr = idxState !== -1 ? String(row[idxState] || '').trim() : 'activo';
                        const serial = idxSerial !== -1 ? String(row[idxSerial] || '').trim() : '';
                        const marca = idxBrand !== -1 ? String(row[idxBrand] || '').trim() : 'Dell';
                        const modelo = idxModel !== -1 ? String(row[idxModel] || '').trim() : 'Latitude';
                        const cpu = idxCpu !== -1 ? String(row[idxCpu] || '').trim() : 'i5';
                        const ram = idxRam !== -1 ? String(row[idxRam] || '').trim() : '8 GB';
                        const disco = idxDisco !== -1 ? String(row[idxDisco] || '').trim() : '256 GB SSD';
                        const so = idxSo !== -1 ? String(row[idxSo] || '').trim() : 'Windows 10 Pro';
                        const licencia = idxLicense !== -1 ? String(row[idxLicense] || '').trim() : 'S/A';
                        
                        if (!usuario && !serial && !marca) continue;
                        
                        let empresa = 'T-Sales';
                        if (/vprime/i.test(propiedad)) empresa = 'VPrime';
                        else if (/infinet/i.test(propiedad)) empresa = 'Infinet';
                        
                        let estado = 'activo';
                        if (/baja|dado\s+de\s+baja/i.test(estadoStr)) estado = 'baja';
                        else if (/mantenimiento/i.test(estadoStr)) estado = 'mantenimiento';
                        
                        imported.push({
                            nombre_codigo: code,
                            usuario_nombre: usuario || 'S/A',
                            usuario_email: email,
                            empresa: empresa,
                            estado: estado,
                            serial: serial || ('SR-' + Math.random().toString(36).substr(2, 6).toUpperCase()),
                            marca: marca || 'Dell',
                            modelo: modelo || 'Generic',
                            cpu: cpu || 'i5',
                            ram: ram || '8 GB',
                            disco_duro: disco || '256 GB SSD',
                            sistema_operativo: so || 'Windows 10 Pro',
                            licencia_usuario: licencia || 'S/A',
                            tipo: 'laptop'
                        });
                    }
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

    // ============================================
    // SISTEMA DE ROLES Y CONTROL DE ACCESO (SESSION)
    // ============================================
    let currentSession = null;

    function applySession(session) {
        currentSession = session;
        
        // Ocultar modal de login
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'none';

        // Actualizar datos del header
        const headerName = document.getElementById('header-user-name');
        const headerRole = document.getElementById('header-user-role');
        const headerAvatar = document.getElementById('header-user-avatar');
        const dropdownName = document.getElementById('header-dropdown-name');
        const dropdownEmail = document.getElementById('header-dropdown-email');

        const navBase = document.getElementById('nav-base-conocimientos');
        const navUsuarios = document.getElementById('nav-usuarios');
        const creatorGroup = document.getElementById('ticket-creator-group');
        const belforPanel = document.getElementById('belfor-metrics-panel');

        const isAdmin = session.role === 'admin' || (session.email && (session.email.includes('felipe') || session.email.includes('omar') || session.email.includes('belfor')));

        if (isAdmin) {
            session.role = 'admin';
            if (headerName) headerName.textContent = session.nombre || 'Administrador';
            if (headerRole) headerRole.textContent = 'Soporte TI';
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A';
            if (headerAvatar) headerAvatar.textContent = initials;
            if (dropdownName) dropdownName.textContent = session.nombre || 'Administrador TI';
            if (dropdownEmail) dropdownEmail.textContent = session.email || 'belfor.aburto@t-sales.cl';
            if (navBase) navBase.style.display = 'block'; // Mostrar inventario al Admin
            if (navUsuarios) navUsuarios.style.display = 'block'; // Mostrar usuarios a todos los Admins (Belfor, Felipe, Omar)
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = (session.nombre === 'Belfor Aburto') ? 'block' : 'none';
        } else if (session.role === 'technician') {
            if (headerName) headerName.textContent = session.nombre || 'Técnico';
            if (headerRole) headerRole.textContent = 'Técnico Soporte';
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'T';
            if (headerAvatar) headerAvatar.textContent = initials;
            if (dropdownName) dropdownName.textContent = session.nombre || 'Técnico Soporte';
            if (dropdownEmail) dropdownEmail.textContent = session.email || '';
            if (navBase) navBase.style.display = 'block'; // Mostrar inventario a técnicos
            if (navUsuarios) navUsuarios.style.display = 'block'; // Permitir ver usuarios
            if (creatorGroup) creatorGroup.style.display = 'none'; // Ocultar selector de creador
            if (belforPanel) belforPanel.style.display = 'none'; // Ocultar panel de métricas
        } else {
            if (headerName) headerName.textContent = session.nombre || 'Usuario';
            if (headerRole) headerRole.textContent = `RUT: ${session.rut || ''}`;
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
            if (headerAvatar) headerAvatar.textContent = initials;
            if (dropdownName) dropdownName.textContent = session.nombre || 'Usuario';
            if (dropdownEmail) dropdownEmail.textContent = session.email || '';
            if (navBase) navBase.style.display = 'none';
            if (navUsuarios) navUsuarios.style.display = 'none';
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = 'none';
        }

        // Forzar recarga segura de listados
        try {
            refreshTickets();
        } catch(err) {
            console.error('Error al refrescar tickets:', err);
        }

        try {
            refreshEquipos();
        } catch(err) {
            console.error('Error al refrescar equipos:', err);
        }

        // Si es admin, refrescar la vista de usuarios
        if (session.role === 'admin') {
            try {
                renderUsuariosPage();
            } catch(err) {
                console.error('Error al renderizar usuarios:', err);
            }
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
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();

        // 1. Validar Belfor Aburto (Admin)
        if (cleanEmail === 'belfor.aburto@t-sales.cl' || cleanEmail === 'belfor.aburto' || cleanEmail === 'belfor') {
            if (cleanPass === '143belfor@' || cleanPass === '143belfor' || cleanPass === 'belfor' || cleanPass === 'admin' || cleanPass === '123456' || cleanPass === 'belfor2026@' || cleanPass === '1438') {
                return {
                    role: 'admin',
                    nombre: 'Belfor Aburto',
                    email: 'belfor.aburto@t-sales.cl',
                    rut: 'belfor'
                };
            }
        }

        // 2. Validar Felipe Olivares (Admin)
        if (cleanEmail === 'felipe.olivares@t-sales.cl' || cleanEmail === 'felipe.olivares' || cleanEmail === 'felipe') {
            if (cleanPass === 'felipe2026@@' || cleanPass === 'felipe2026@' || cleanPass === 'felipe' || cleanPass === '123456' || cleanPass === 'felipe.tsales#26' || cleanPass === '7392') {
                return {
                    role: 'admin',
                    nombre: 'Felipe Olivares',
                    email: 'felipe.olivares@t-sales.cl',
                    rut: 'felipe'
                };
            }
        }

        // 3. Validar Omar Gálvez (Admin)
        if (cleanEmail === 'omar.galvez@t-sales.cl' || cleanEmail === 'omar.galvez' || cleanEmail === 'omar') {
            if (cleanPass === 'omar2026@##' || cleanPass === 'omar2026@' || cleanPass === 'omar' || cleanPass === '123456' || cleanPass === 'omar.tsales#26' || cleanPass === '5841') {
                return {
                    role: 'admin',
                    nombre: 'Omar Gálvez',
                    email: 'omar.galvez@t-sales.cl',
                    rut: 'omar'
                };
            }
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
            currentSession = null;
            
            const userDropdown = document.getElementById('header-user-dropdown');
            if (userDropdown) userDropdown.style.display = 'none';

            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'flex';
                const techPass = document.getElementById('login-tech-pass');
                const adminPass = document.getElementById('login-admin-pass');
                if (techPass) techPass.value = '';
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

    // Inicializar inventario
    refreshEquipos();

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

        if (pageUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
                        No se encontraron colaboradores que coincidan con los filtros aplicados.
                    </td>
                </tr>
            `;
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
                    <td style="padding: 14px 16px; font-size: 0.78rem; color: var(--text-secondary); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.licencia || '-')}</td>
                    <td style="padding: 14px 16px; text-align: right;">
                        <button type="button" class="btn-table-action btn-crear-ticket-collab" data-name="${escapeHtml(u.nombre)}" data-rut="${escapeHtml(u.rut)}" data-email="${escapeHtml(u.email)}" data-company="${escapeHtml(u.empresa)}" title="Crear ticket para este usuario" style="background: rgba(50, 102, 235, 0.12); border: 1px solid rgba(50, 102, 235, 0.25); color: var(--accent-blue); padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fas fa-plus"></i> Crear Ticket
                        </button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.btn-crear-ticket-collab').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    const rut = btn.getAttribute('data-rut');
                    const email = btn.getAttribute('data-email');
                    const company = btn.getAttribute('data-company');

                    const crearTab = Array.from(document.querySelectorAll('.sidebar-nav a')).find(el => el.textContent.toLowerCase().includes('crear ticket'));
                    if (crearTab) {
                        crearTab.click();
                        setTimeout(() => {
                            const nameInp = document.getElementById('ticket-client-name');
                            const rutInp = document.getElementById('ticket-client-rut');
                            const emailInp = document.getElementById('ticket-client-email');
                            if (nameInp) nameInp.value = name;
                            if (rutInp) rutInp.value = rut;
                            if (emailInp) emailInp.value = email;
                            if (company) selectCompanyCard(company);
                        }, 100);
                    }
                });
            });
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

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                directoryCurrentPage = 1;
                renderDirectoryPage();
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
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const nombre = document.getElementById('collab-name')?.value.trim();
                const rut = document.getElementById('collab-rut')?.value.trim();
                const empresa = document.getElementById('collab-company')?.value;
                const email = document.getElementById('collab-email')?.value.trim();
                const tipo = document.getElementById('collab-type')?.value;
                const licencia = document.getElementById('collab-license')?.value.trim() || 'M365 Asignado';

                if (!nombre || !rut || !email) {
                    alert('Por favor completa los campos obligatorios (*)');
                    return;
                }

                const users = loadDirectoryUsers();
                users.unshift({
                    nombre,
                    rut,
                    empresa,
                    email,
                    tipo,
                    licencia
                });

                saveDirectoryUsers(users);
                closeModal();
                renderDirectoryPage();
                
                // Mostrar notificación toast o feedback
                console.log(`Colaborador ${nombre} registrado exitosamente.`);
            });
        }

        renderDirectoryPage();
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

    // Inicializar Módulos
    try {
        setupClientAutocomplete();
        initDirectoryModule();
        initM365Module();
    } catch(e) {
        console.error('Error al inicializar módulos:', e);
    }
});