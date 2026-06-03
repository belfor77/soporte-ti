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
            cliente_email: ticket.cliente_email || ''
        };

        if (ticket.descripcion && (!meta.cliente_nombre || !meta.cliente_email || !meta.sede)) {
            const getVal = (pattern) => {
                const match = ticket.descripcion.match(pattern);
                return match ? match[1].trim() : null;
            };

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

    const priorityBadges = {
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

    async function saveTicket(asunto, categoria, descripcion, prioridad, sede = '', telefono = '', dispositivo = '', impacto = '', modalidad = 'Online', cliente_nombre = '', cliente_rut = '', cliente_email = '') {
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
                        descripcion: `${descripcion}\n\n[Sede: ${sede} | Teléfono: ${telefono} | Dispositivo: ${dispositivo} | Impacto: ${impacto} | Modalidad: ${modalidad} | Cliente: ${cliente_nombre} (${cliente_rut}) - ${cliente_email}]`,
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

        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update(fields)
                    .eq('id', ticketId);
                if (error) throw error;
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
        'crear ticket': 'page-crear-ticket',
        'tutoriales': 'page-tutoriales',
        'base de conocimientos': 'page-base-conocimientos',
        'chat en vivo': 'page-chat',
        'estado del sistema': 'page-estado'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const linkText = link.textContent.trim().toLowerCase();
            
            let targetPageId = null;
            for (const [key, value] of Object.entries(pageMap)) {
                if (linkText.includes(key)) {
                    targetPageId = value;
                    break;
                }
            }

            if (!targetPageId) {
                targetPageId = 'page-inicio';
            }

            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            link.parentElement.classList.add('active');

            pageSections.forEach(section => section.classList.remove('active-page'));
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                void targetPage.offsetWidth;
                targetPage.classList.add('active-page');
            }

            if (targetPageId === 'page-crear-ticket') {
                prefillTicketClientFields();
            }
        });
    });

    // ============================================
    // 2. FUNCIONALIDAD DEL MODO OSCURO
    // ============================================
    const modeToggle = document.getElementById('mode-toggle');
    const body = document.body;

    modeToggle.addEventListener('change', () => {
        if (modeToggle.checked) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
        }
    });

    // ============================================
    // ESTADO LOCAL DE TICKETS (CACHE)
    // ============================================
    let allTicketsCached = [];
    let currentFilter = 'todos';
    let currentSearch = '';

    async function refreshTickets() {
        allTicketsCached = await fetchTickets();
        updateStats(allTicketsCached);
        updateFilterCounts(allTicketsCached);
        applyTicketsFilterAndSearch();
    }

    function updateStats(tickets) {
        const statsOpen = document.querySelector('.stat-blue .stat-number');
        const statsResolved = document.querySelector('.stat-green .stat-number');

        if (statsOpen) {
            const openCount = tickets.filter(t => t.estado === 'abierto' || t.estado === 'en progreso' || t.estado === 'en espera').length;
            statsOpen.textContent = openCount;
        }
        if (statsResolved) {
            const resolvedCount = tickets.filter(t => t.estado === 'resuelto').length;
            statsResolved.textContent = resolvedCount;
        }

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

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No se encontraron tickets.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(ticket => {
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
                        ${techStatusHtml}
                    </div>
                </td>
                <td><span class="status-badge ${stateClass}">${stateLabel}</span></td>
                <td>${priorityBadge}</td>
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
        const priority = document.getElementById('ticket-priority');
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
        if (!priority || !priority.value) {
            if (priority) priority.reportValidity();
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
        const priority = document.getElementById('ticket-priority')?.value || '';
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

        summaryContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 12px; margin-bottom: 12px;">
                <div><span style="color: var(--text-muted);">Asunto:</span> <strong style="color: var(--text-primary);">${escapeHtml(subject)}</strong></div>
                <div><span style="color: var(--text-muted);">Categoría:</span> <span class="meta-val">${escapeHtml(categoryText)}</span></div>
                <div><span style="color: var(--text-muted);">Prioridad:</span> <span class="priority-badge priority-${priority}">${priority.toUpperCase()}</span></div>
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
                const priority = document.getElementById('ticket-priority').value;
                const office = document.getElementById('ticket-office').value;
                const modality = document.getElementById('ticket-modalidad').value;
                const clientName = document.getElementById('ticket-client-name').value.trim();
                const clientRut = document.getElementById('ticket-client-rut').value.trim();
                const clientEmail = document.getElementById('ticket-client-email').value.trim();
                const description = document.getElementById('ticket-description').value.trim();
                const phone = document.getElementById('ticket-phone').value.trim();
                const device = document.getElementById('ticket-device').value;
                const impact = document.getElementById('ticket-impact').value;

                btnStepperNext.disabled = true;
                const originalHtml = btnStepperNext.innerHTML;
                btnStepperNext.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

                try {
                    await saveTicket(subject, category, description, priority, office, phone, device, impact, modality, clientName, clientRut, clientEmail);
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
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
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

        const priorityBadge = document.getElementById('modal-ticket-prioridad');
        if (priorityBadge) {
            const p = ticket.prioridad.toLowerCase();
            priorityBadge.className = `priority-badge priority-${p}`;
            priorityBadge.innerHTML = p === 'alta' ? '<i class="fas fa-arrow-up"></i> Alta' : 
                                      p === 'baja' ? '<i class="fas fa-arrow-down"></i> Baja' : 
                                      '<i class="fas fa-minus"></i> Media';
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
            const sidebarItems = document.querySelectorAll('.sidebar-nav li');
            sidebarItems.forEach(li => li.classList.remove('active'));
            if (sidebarItems[2]) sidebarItems[2].classList.add('active');

            pageSections.forEach(section => section.classList.remove('active-page'));
            const crearTicketPage = document.getElementById('page-crear-ticket');
            if (crearTicketPage) {
                crearTicketPage.classList.add('active-page');
            }
        });
    }

    // Paginación visual simple
    const pageButtons = document.querySelectorAll('.page-btn.page-number');
    pageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            pageButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

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
            pageSections.forEach(section => section.classList.remove('active-page'));
            const crearTicketPage = document.getElementById('page-crear-ticket');
            if (crearTicketPage) {
                crearTicketPage.classList.add('active-page');
                
                const sidebarItems = document.querySelectorAll('.sidebar-nav li');
                sidebarItems.forEach(li => li.classList.remove('active'));
                if (sidebarItems[2]) {
                    sidebarItems[2].classList.add('active');
                }
            }
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
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .select('*')
                    .order('nombre_codigo', { ascending: true });
                if (error) throw error;
                return data;
            } catch (err) {
                console.error('Error fetching equipos from Supabase, using LocalStorage:', err);
            }
        }
        
        let equipos = JSON.parse(localStorage.getItem('local_equipos'));
        if (!equipos || equipos.length === 0) {
            equipos = [
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
        }
        return equipos;
    }

    async function saveEquipo(equipo) {
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

        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        equipo.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
        equipo.created_at = new Date().toISOString();
        equipos.push(equipo);
        localStorage.setItem('local_equipos', JSON.stringify(equipos));
        return equipo;
    }

    async function updateEquipo(id, updatedFields) {
        if (!useLocalFallback && supabase) {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .update(updatedFields)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error('Error updating equipo in Supabase, using LocalStorage:', err);
            }
        }

        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const index = equipos.findIndex(e => e.id === id);
        if (index !== -1) {
            equipos[index] = { ...equipos[index], ...updatedFields };
            localStorage.setItem('local_equipos', JSON.stringify(equipos));
            return equipos[index];
        }
        return null;
    }

    async function deleteEquipo(id) {
        if (!useLocalFallback && supabase) {
            try {
                const { error } = await supabase
                    .from('equipos')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                return true;
            } catch (err) {
                console.error('Error deleting equipo from Supabase, using LocalStorage:', err);
            }
        }

        const equipos = JSON.parse(localStorage.getItem('local_equipos')) || [];
        const filtered = equipos.filter(e => e.id !== id);
        localStorage.setItem('local_equipos', JSON.stringify(filtered));
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
        const headerAvatar = document.querySelector('#header-user-avatar span');

        const navBase = document.getElementById('nav-base-conocimientos');
        const creatorGroup = document.getElementById('ticket-creator-group');
        const belforPanel = document.getElementById('belfor-metrics-panel');

        if (session.role === 'admin') {
            if (headerName) headerName.textContent = session.nombre || 'Administrador';
            if (headerRole) headerRole.textContent = 'Soporte TI';
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A';
            if (headerAvatar) headerAvatar.textContent = initials;
            if (navBase) navBase.style.display = 'block'; // Mostrar inventario al Admin
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = (session.nombre === 'Belfor Aburto') ? 'block' : 'none';
        } else if (session.role === 'technician') {
            if (headerName) headerName.textContent = session.nombre;
            if (headerRole) headerRole.textContent = 'Técnico Soporte';
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'T';
            if (headerAvatar) headerAvatar.textContent = initials;
            if (navBase) navBase.style.display = 'block'; // Mostrar inventario a técnicos
            if (creatorGroup) creatorGroup.style.display = 'none'; // Ocultar selector de creador
            if (belforPanel) belforPanel.style.display = 'none'; // Ocultar panel de métricas
        } else {
            if (headerName) headerName.textContent = session.nombre;
            if (headerRole) headerRole.textContent = `RUT: ${session.rut}`;
            
            const initials = session.nombre ? session.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
            if (headerAvatar) headerAvatar.textContent = initials;
            
            if (navBase) navBase.style.display = 'none'; // Ocultar inventario al usuario común
            if (creatorGroup) creatorGroup.style.display = 'none';
            if (belforPanel) belforPanel.style.display = 'none';
        }

        // Forzar recarga de listados de acuerdo al nuevo rol
        refreshTickets();
        refreshEquipos();

        // Configurar vista de Chat según rol
        const chatAdminContainer = document.getElementById('chat-admin-container');
        const chatUserContainer = document.getElementById('chat-user-container');
        if (session.role === 'admin' || session.role === 'technician') {
            if (chatAdminContainer) chatAdminContainer.style.display = 'block';
            if (chatUserContainer) chatUserContainer.style.display = 'none';
            if (typeof initAdminChat === 'function') initAdminChat();
        } else {
            if (chatAdminContainer) chatAdminContainer.style.display = 'none';
            if (chatUserContainer) chatUserContainer.style.display = 'block';
            if (typeof initUserChat === 'function') initUserChat();
        }
        prefillTicketClientFields();
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
                    // For admin or technician, prefill but keep it editable.
                    clientNameInput.value = currentSession.nombre || '';
                    clientRutInput.value = currentSession.rut || '';
                    clientEmailInput.value = currentSession.email || '';
                    
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
    const tabUser = document.getElementById('tab-login-user');
    const tabAdmin = document.getElementById('tab-login-admin');
    const formUser = document.getElementById('form-login-user');
    const formAdmin = document.getElementById('form-login-admin');

    if (tabUser && tabAdmin && formUser && formAdmin) {
        tabUser.addEventListener('click', () => {
            tabUser.style.backgroundColor = 'var(--accent-blue)';
            tabUser.style.color = 'white';
            tabAdmin.style.backgroundColor = 'transparent';
            tabAdmin.style.color = 'var(--text-secondary)';
            formUser.style.display = 'block';
            formAdmin.style.display = 'none';
        });

        tabAdmin.addEventListener('click', () => {
            tabAdmin.style.backgroundColor = 'var(--accent-blue)';
            tabAdmin.style.color = 'white';
            tabUser.style.backgroundColor = 'transparent';
            tabUser.style.color = 'var(--text-secondary)';
            formAdmin.style.display = 'block';
            formUser.style.display = 'none';
        });
    }

    // Submit de Login Técnico
    if (formUser) {
        formUser.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-tech-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-tech-pass').value.trim();

            if (!email || !pass) return;

            let session = null;
            if (email === 'felipe.olivares@t-sales.cl' && pass === 'felipe2026@@') {
                session = { 
                    role: 'technician', 
                    nombre: 'Felipe Olivares', 
                    email: 'felipe.olivares@t-sales.cl', 
                    rut: 'felipe' 
                };
            } else if (email === 'omar.galvez@t-sales.cl' && pass === 'omar2026@##') {
                session = { 
                    role: 'technician', 
                    nombre: 'Omar Gálvez', 
                    email: 'omar.galvez@t-sales.cl', 
                    rut: 'omar' 
                };
            }

            if (session) {
                localStorage.setItem('session_soporte', JSON.stringify(session));
                applySession(session);
            } else {
                alert('Correo o contraseña de Técnico incorrectos.');
            }
        });
    }

    // Submit de Login Administrador
    if (formAdmin) {
        formAdmin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-admin-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-admin-pass').value.trim();

            if (!email || !pass) return;

            let session = null;
            if (email === 'belfor.aburto@t-sales.cl' && pass === '143belfor@') {
                session = { 
                    role: 'admin', 
                    nombre: 'Belfor Aburto', 
                    email: 'belfor.aburto@t-sales.cl', 
                    rut: 'belfor' 
                };
            }

            if (session) {
                localStorage.setItem('session_soporte', JSON.stringify(session));
                applySession(session);
            } else {
                alert('Correo o contraseña de Administrador incorrectos.');
            }
        });
    }

    // Toggle Dropdown de Usuario en Header
    const userMenu = document.getElementById('header-user-menu');
    const userDropdown = document.getElementById('header-user-dropdown');
    
    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.display === 'block';
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            userDropdown.style.display = 'none';
        });
    }

    // Botón de Cerrar Sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.removeItem('session_soporte');
            location.reload(); // Recarga y forzará mostrar login modal de nuevo
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

    // Cargar sesión guardada o forzar login modal
    const savedSession = localStorage.getItem('session_soporte');
    if (savedSession) {
        applySession(JSON.parse(savedSession));
    } else {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'flex';
    }

});