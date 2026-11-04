/* Estimaciones de planificación: no predicen fallas ni certifican compatibilidad. */
(function (root) {
    'use strict';
    const DEFAULTS = Object.freeze({ serviceYears: 5, cpuYears: 8, minRam: 8, planningMonths: 12 });
    const SOURCES = {
        intel6: 'https://www.intel.com/content/www/us/en/ark/products/codename/37572/products-formerly-skylake.html',
        intel7: 'https://www.intel.com/content/www/us/en/ark/products/codename/82879/products-formerly-kaby-lake.html',
        intel8: 'https://www.intel.com/content/www/us/en/ark/products/series/122597/8th-generation-intel-core-i5-processors.html',
        windows: 'https://learn.microsoft.com/en-us/lifecycle/announcements/windows-10-end-of-support',
        requirements: 'https://www.microsoft.com/windows/windows-11-specifications'
    };
    // Fechas del catálogo Intel ARK. Se usa el último día del trimestre publicado.
    const CPU_CATALOG = {
        'i5-6200u': ['2015-09-30', SOURCES.intel6],
        'i5-6300u': ['2015-09-30', SOURCES.intel6],
        'i5-7300u': ['2017-03-31', SOURCES.intel7],
        'i5-8265u': ['2018-09-30', SOURCES.intel8],
        'i5-8365u': ['2019-06-30', SOURCES.intel8]
    };
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function today() {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const get = type => parts.find(part => part.type === type).value;
        return `${get('year')}-${get('month')}-${get('day')}`;
    }
    function dateOnly(value) {
        if (!value) return null;
        const text = String(value).trim();
        let match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
        if (!match) {
            const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
            if (local) match = [local[0], local[3], local[2].padStart(2, '0'), local[1].padStart(2, '0')];
        }
        if (!match) return null;
        const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
        return date.getUTCFullYear() === +match[1] && date.getUTCMonth() === +match[2] - 1 && date.getUTCDate() === +match[3] ? date : null;
    }
    function yearsBetween(start, end) { return (end - start) / (365.2425 * 86400000); }
    function addYears(date, years) {
        const result = new Date(date);
        result.setUTCFullYear(result.getUTCFullYear() + years);
        return result;
    }
    function config(input = {}) {
        const result = {};
        const bounds = { serviceYears: [1, 15], cpuYears: [2, 20], minRam: [4, 64], planningMonths: [1, 36] };
        for (const [key, [min, max]] of Object.entries(bounds)) {
            const value = Number(input[key]);
            result[key] = Number.isInteger(value) && value >= min && value <= max ? value : DEFAULTS[key];
        }
        return result;
    }
    function ramGB(value) {
        const match = String(value || '').match(/(\d+(?:[.,]\d+)?)\s*(TB|GB|GIB|MB|MIB)\b/i);
        if (!match) return null;
        let amount = Number(match[1].replace(',', '.'));
        if (/^M/i.test(match[2])) amount /= 1024;
        if (/^T/i.test(match[2])) amount *= 1024;
        if (!Number.isFinite(amount) || amount <= 0) return null;
        // 7,88 GB utilizables corresponden normalmente a 8 GB instalados.
        return [4, 8, 16, 32, 64].find(size => amount >= size * 0.95 && amount <= size) || amount;
    }
    function cpuInfo(value, now) {
        const cpu = normalize(value).replace(/\(r\)|\(tm\)|®|™/g, '');
        const match = cpu.match(/\bi[3579]\s*[- ]\s*(\d{4,5})([a-z]{0,3})\b/i);
        if (!match) return null;
        const id = `${cpu.match(/\bi[3579]/)[0]}-${match[1]}${match[2]}`;
        const exact = CPU_CATALOG[id];
        if (exact) {
            const launch = dateOnly(exact[0]);
            return { id, launch, yearLabel: String(launch.getUTCFullYear()), precision: 'Trimestre publicado por Intel', source: exact[1] };
        }
        // La generación identifica la familia, no la fecha exacta de cada SKU.
        // Rangos deliberadamente amplios: la estimación usa el extremo más reciente.
        const generation = Number(match[1].length === 5 || /^1[0-4]/.test(match[1]) ? match[1].slice(0, 2) : match[1].slice(0, 1));
        const ranges = { 2: [2011, 2013], 3: [2012, 2014], 4: [2013, 2015], 5: [2014, 2016], 6: [2015, 2017], 7: [2016, 2018], 8: [2017, 2019], 9: [2018, 2020], 10: [2019, 2021], 11: [2020, 2022], 12: [2021, 2023], 13: [2022, 2024], 14: [2023, 2025] };
        // Intel también usa nombres de cuatro cifras (p.ej. 1065G7): no inferirlos.
        if (!ranges[generation] || /g\d/i.test(cpu)) return null;
        const [first, last] = ranges[generation];
        if (last > now.getUTCFullYear()) return null;
        return { id, launch: dateOnly(`${last}-12-31`), yearLabel: `${first}–${last} aprox.`, precision: `Orientativa: Intel Core de ${generation}.ª generación; confirmar SKU`, source: null };
    }
    function isNotebook(eq) {
        const type = normalize(eq.tipo);
        const status = normalize(eq.estado);
        return !/^(baja|retirado|retirada|dado de baja)$/.test(status) && (/^(laptop|notebook|portatil|portátil|ultrabook)$/.test(type) || (!type && /notebook|laptop|elitebook|probook|latitude|thinkpad|vostro|inspiron|macbook|ideapad|aspire|vivobook/i.test(eq.modelo || '')));
    }
    function evaluate(eq, options = DEFAULTS, at = today()) {
        const policy = config(options);
        const now = dateOnly(at);
        if (!now) throw new Error('Fecha de evaluación inválida');
        const reasons = [], missing = [], candidates = [];
        const cpu = cpuInfo(eq.cpu, now);
        if (cpu) candidates.push({ date: addYears(cpu.launch, policy.cpuYears), basis: 'antigüedad tecnológica del procesador' });
        else missing.push('Procesador sin fecha identificable en el catálogo');
        // La asignación puede ser una reasignación. created_at es la fecha de registro.
        const dateFields = [['fecha_puesta_servicio', 'Puesta en servicio'], ['fecha_inicio_uso', 'Inicio de uso'], ['fecha_compra', 'Compra'], ['purchase_date', 'Compra']];
        let service = null, serviceLabel = '';
        for (const [field, label] of dateFields) {
            if (!eq[field]) continue;
            const parsed = dateOnly(eq[field]);
            if (parsed && parsed <= now) { service = parsed; serviceLabel = label; break; }
            missing.push(`${label}: fecha inválida o futura`);
        }
        if (service) candidates.push({ date: addYears(service, policy.serviceYears), basis: `${policy.serviceYears} años desde ${serviceLabel.toLowerCase()}` });
        else missing.push('Falta fecha de compra o puesta en servicio');
        const ram = ramGB(eq.ram);
        const disk = String(eq.disco_duro || '').trim();
        const os = String(eq.sistema_operativo || '').trim();
        if (ram === null) missing.push('Memoria RAM sin capacidad identificable');
        if (!disk) missing.push('Almacenamiento sin registrar');
        if (!os) missing.push('Sistema operativo sin registrar');
        candidates.sort((a, b) => a.date - b.date);
        const target = candidates[0] || null;
        const months = target ? Math.max(0, Math.ceil((target.date - now) / (365.2425 / 12 * 86400000))) : null;
        let priority = 'mantener';
        if (target && target.date <= now) {
            priority = 'urgente';
            reasons.push(`Umbral de renovación alcanzado por ${target.basis}.`);
        } else if (months !== null && months <= policy.planningMonths) {
            priority = 'planificar';
            reasons.push(`Se alcanza el umbral de ${target.basis} dentro de ${months} meses.`);
        }
        let upgrade = false;
        if (ram !== null && ram < policy.minRam) {
            upgrade = true;
            reasons.push(`RAM inferior al criterio de ${policy.minRam} GB: revisar ampliación antes de reemplazar.`);
        }
        if (/\b(hdd|mecanico|sata rotational)\b/i.test(normalize(disk)) && !/\b(ssd|nvme)\b/i.test(disk)) {
            upgrade = true;
            reasons.push('Disco mecánico: evaluar cambio a SSD.');
        }
        const windows10 = /windows\s*10\b/i.test(os);
        const specialEdition = /\b(ltsc|ltsb|iot)\b/i.test(os);
        const osReview = windows10 && now >= dateOnly('2025-10-14');
        if (osReview) reasons.push(specialEdition ? 'Windows 10 LTSC/LTSB/IoT: verificar el ciclo de soporte de la edición exacta.' : 'Windows 10: verificar cobertura ESU y plan de migración; el soporte general terminó el 14/10/2025.');
        if ((upgrade || osReview) && priority === 'mantener') priority = 'planificar';
        if (priority === 'mantener' && (!target || missing.length)) priority = 'revisar';
        if (!reasons.length) reasons.push(priority === 'revisar' ? 'Completar datos para confirmar el horizonte de renovación.' : 'Dentro de los criterios configurados; mantener seguimiento.');
        const action = priority === 'urgente' ? 'Validar estado y presupuestar renovación prioritaria.' : upgrade ? 'Evaluar ampliación de RAM o SSD y reevaluar.' : osReview ? 'Validar soporte y compatibilidad antes de decidir una renovación.' : priority === 'revisar' ? 'Completar la ficha y confirmar el modelo del procesador.' : priority === 'planificar' ? 'Incluir en el próximo plan de renovación.' : 'Continuar uso y revisar periódicamente.';
        return { eq, priority, reasons, missing, cpu, service, serviceLabel, ram, months, target, action, at, confidence: !target ? 'Sin estimación' : missing.length || (cpu && !cpu.source) ? 'Orientativa / datos por completar' : 'Basada en datos registrados y catálogo' };
    }
    const LABELS = { urgente: 'Renovar ahora', planificar: 'Planificar', mantener: 'Mantener', revisar: 'Completar evaluación' };
    const RANK = { urgente: 0, planificar: 1, revisar: 2, mantener: 3 };
    function evaluateAll(equipos, options, at = today()) {
        return equipos.filter(isNotebook).map(eq => evaluate(eq, options, at)).sort((a, b) => RANK[a.priority] - RANK[b.priority] || (a.months ?? Infinity) - (b.months ?? Infinity) || String(a.eq.nombre_codigo || '').localeCompare(String(b.eq.nombre_codigo || '')));
    }
    const fmtDate = date => date ? date.toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'Sin fecha';
    const age = (date, at) => `${Math.max(0, yearsBetween(date, dateOnly(at))).toFixed(1).replace('.', ',')} años aprox.`;
    function horizon(row) { return row.months === null ? 'Sin estimación' : row.months === 0 ? 'Umbral alcanzado' : `Hasta ${row.months} meses según criterios`; }
    function csvCell(value) {
        const text = String(value ?? '');
        return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
    }
    function csv(rows) {
        const headers = ['Código', 'Serial', 'Ejecutivo', 'Correo', 'Empresa', 'Marca', 'Modelo', 'Estado', 'Prioridad', 'Horizonte estimado', 'Fecha objetivo según criterios', 'Base del cálculo', 'Procesador', 'Lanzamiento CPU', 'Precisión CPU', 'Fuente CPU', 'RAM', 'Disco', 'Sistema operativo', 'Fecha compra / uso', 'Origen fecha', 'Calidad de estimación', 'Motivos', 'Acción sugerida', 'Datos pendientes', 'Evaluado el'];
        return '\ufeff' + [headers, ...rows.map(r => [r.eq.nombre_codigo || r.eq.hostname, r.eq.serial, r.eq.usuario_nombre, r.eq.usuario_email, r.eq.empresa, r.eq.marca, r.eq.modelo, r.eq.estado, LABELS[r.priority], horizon(r), r.target ? fmtDate(r.target.date) : '', r.target?.basis, r.eq.cpu, r.cpu?.yearLabel, r.cpu?.precision, r.cpu?.source, r.eq.ram, r.eq.disco_duro, r.eq.sistema_operativo, r.service ? fmtDate(r.service) : '', r.serviceLabel, r.confidence, r.reasons.join(' '), r.action, r.missing.join('; '), r.at])].map(row => row.map(csvCell).join(';')).join('\r\n');
    }
    function upgradeEstimate(row, prices = {}, minRam = DEFAULTS.minRam) {
        const ram = row.ram !== null && row.ram < minRam;
        const disk = normalize(row.eq.disco_duro);
        const ssd = /\b(hdd|mecanico|sata rotational)\b/.test(disk) && !/\b(ssd|nvme)\b/.test(disk);
        const valid = key => prices[key] !== '' && prices[key] != null && Number.isInteger(Number(prices[key])) && Number(prices[key]) >= 0 && Number(prices[key]) <= 100000000;
        const complete = (!ram || valid('ram')) && (!ssd || valid('ssd')) && valid('labor');
        const parts = complete ? (ram ? Number(prices.ram) : 0) + (ssd ? Number(prices.ssd) : 0) : null;
        return { ram, ssd, parts, total: complete ? parts + Number(prices.labor) : null };
    }
    // Horizonte presupuestario interno; no es una predicción de supervivencia física.
    function upgradeHorizon(row) {
        if (!row.cpu) return { label: 'Por evaluar', rank: 3, decision: 'Identificar procesador', reason: 'No hay fecha identificable del CPU para estimar un horizonte.', months: null };
        const now = dateOnly(row.at);
        if (!now) return { label: 'Por evaluar', rank: 3, decision: 'Revisar fecha', reason: 'Falta una fecha válida de evaluación.', months: null };
        const limits = [{ date: addYears(row.cpu.launch, 10), name: '10 años desde lanzamiento del CPU' }];
        if (row.service) limits.push({ date: addYears(row.service, 7), name: '7 años desde compra / puesta en servicio' });
        limits.sort((a, b) => a.date - b.date);
        const months = Math.max(0, Math.min(36, Math.floor((limits[0].date - now) / (365.2425 / 12 * 86400000))));
        const label = months >= 6 ? `${Math.max(3, months - 12)}–${months} meses` : 'Sin extensión aconsejada';
        const decision = months >= 12 ? 'Evaluar mejora' : months >= 6 ? 'Mejora de corto plazo' : 'Priorizar renovación';
        const os = normalize(row.eq.sistema_operativo);
        const reviewOS = !os || /windows\s*10\b/.test(os);
        return { label, months, rank: months >= 12 ? 0 : months >= 6 ? 1 : 2, decision,
            reason: `Criterio limitante: ${limits[0].name}. ${row.service ? '' : 'Sin fecha de compra: evaluación parcial. '}${row.cpu.source ? '' : 'Fecha del CPU orientativa. '}${reviewOS ? 'Validar soporte del sistema operativo antes de invertir. ' : ''}Condicionado a compatibilidad de piezas, batería, disco y estado general. No mide meses ganados frente a no mejorar.` };
    }
    function purchaseReference(purchases, kind, needed = 0, at = today()) {
        const matches = purchases.filter(p => {
            const text = normalize(p.producto);
            return (kind === 'ram' ? /\b(ram|sodimm|so-dimm|ddr[345])\b/.test(text) : /\bssd\b/.test(text)) &&
                !/cancel|anulad|pendiente|solicit|rechaz/.test(normalize(p.estado)) &&
                dateOnly(p.fecha) && p.fecha <= at && Number(p.valor_total) > 0 && Number.isInteger(Number(p.cantidad)) && Number(p.cantidad) > 0;
        }).map(p => ({ p, capacity: ramGB(p.producto) }));
        const capacities = matches.filter(m => m.capacity !== null && m.capacity >= needed).map(m => m.capacity);
        const capacity = kind === 'ram' && capacities.length ? Math.min(...capacities) : null;
        const selected = matches.filter(m => kind !== 'ram' || (capacity !== null && m.capacity === capacity));
        if (!selected.length) return null;
        const units = selected.reduce((n, m) => n + Number(m.p.cantidad), 0);
        return { price: Math.round(selected.reduce((n, m) => n + Number(m.p.valor_total), 0) / units), capacity, label: selected.map(m => `${m.p.producto} · ${m.p.fecha} · ${m.p.proveedor || 'Sin proveedor'}`).join('; '), units };
    }
    function init({ getEquipos, openEquipo, refresh, getCompras = () => [] }) {
        const section = document.getElementById('notebook-renewal');
        if (!section) return null;
        const get = id => document.getElementById('renewal-' + id);
        let policy = config(), page = 1, rows = [], filtered = [];
        const pageSize = 20;
        try { policy = config(JSON.parse(localStorage.getItem('notebook-renewal-policy-v1') || '{}')); } catch (_) { /* Preferencias locales dañadas: usar criterios iniciales. */ }
        const targetSelect = document.getElementById('upgrade-target');
        if (targetSelect) targetSelect.addEventListener('change', () => renderUpgrades());
        const costSection = document.getElementById('upgrade-section');
        const ticketHeading = document.querySelector('#page-sla .renewal-ticket-heading');
        const ticketNodes = [];
        if (ticketHeading) { let node = ticketHeading; while (node) { ticketNodes.push(node); node = node.nextElementSibling; } }
        function showView(view) {
            section.hidden = view !== 'renewal';
            if (costSection) costSection.hidden = view !== 'costs';
            ticketNodes.forEach(node => { node.hidden = view !== 'tickets'; });
            document.querySelectorAll('[data-sla-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.slaView === view)); });
        }
        document.querySelectorAll('[data-sla-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.slaView)));
        showView('renewal');
        for (const [id, filterValue] of [['upgrade-candidates', ''], ['upgrade-budget', 'priced'], ['upgrade-pending', 'pending'], ['upgrade-longer', '0']]) {
            const card = document.getElementById(id)?.parentElement;
            if (!card) continue;
            card.setAttribute('role', 'button'); card.tabIndex = 0; card.title = 'Consultar equipos del resumen';
            const show = () => { document.getElementById('upgrade-filter').value = filterValue; renderUpgrades(); document.getElementById('upgrade-rows').closest('.renewal-table-scroll').scrollIntoView({block:'start',behavior:'smooth'}); };
            card.addEventListener('click', show); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); } });
        }
        ['upgrade-search', 'upgrade-filter'].forEach(id => document.getElementById(id)?.addEventListener(id === 'upgrade-search' ? 'input' : 'change', renderUpgrades));
        document.getElementById('upgrade-rows')?.addEventListener('click', event => {
            const button = event.target.closest('[data-upgrade-index]');
            if (button && rows[button.dataset.upgradeIndex]) openEquipo(rows[button.dataset.upgradeIndex].eq);
        });
        function renderUpgrades() {
            const body = document.getElementById('upgrade-rows');
            if (!body) return;
            const money = value => value === null ? 'Pendiente de precio' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
            const target = Number(targetSelect?.value || 16);
            const purchases = getCompras();
            const upgrades = rows.map(row => {
                const history = purchases.filter(p => (root.CompanyScope ? root.CompanyScope.canonical(p.empresa) === root.CompanyScope.canonical(row.eq.empresa) : normalize(p.empresa) === normalize(row.eq.empresa)));
                const ramRef = purchaseReference(history, 'ram', Math.max(0, target - (row.ram ?? target)));
                const ssdRef = purchaseReference(history, 'ssd');
                const prices = { ram: ramRef?.price, ssd: ssdRef?.price, labor: 0 };
                return { row, estimate: upgradeEstimate(row, prices, target), ramRef, ssdRef, horizon: upgradeHorizon(row) };
            }).filter(item => item.estimate.ram || item.estimate.ssd).sort((a, b) => a.horizon.rank - b.horizon.rank || (b.horizon.months ?? -1) - (a.horizon.months ?? -1));
            const pending = upgrades.filter(item => item.estimate.total === null).length;
            const total = upgrades.reduce((sum, item) => sum + (item.estimate.total ?? 0), 0);
            document.getElementById('upgrade-total').textContent = `${upgrades.length} equipos con mejoras sugeridas · ${pending ? 'Subtotal con precio' : 'Total estimado'}: ${money(total)}${pending ? ` · ${pending} equipos pendientes de precio` : ''}`;
            document.getElementById('upgrade-candidates').textContent = upgrades.length;
            document.getElementById('upgrade-budget').textContent = money(total);
            document.getElementById('upgrade-pending').textContent = pending;
            document.getElementById('upgrade-longer').textContent = upgrades.filter(item => item.horizon.months >= 12).length;
            const search = normalize(document.getElementById('upgrade-search')?.value);
            const view = document.getElementById('upgrade-filter')?.value || '';
            const visible = upgrades.filter(item => (!search || normalize([item.row.eq.nombre_codigo, item.row.eq.serial, item.row.eq.usuario_nombre, item.row.eq.empresa, item.row.eq.modelo].join(' ')).includes(search)) && (!view || (view === 'pending' ? item.estimate.total === null : view === 'priced' ? item.estimate.total !== null : String(item.horizon.rank) === view)));
            document.getElementById('upgrade-total').textContent = `${visible.length} de ${upgrades.length} candidatos · Resumen de todos los candidatos · ${pending ? 'Presupuesto parcial: faltan precios' : 'Presupuesto de piezas'} · No incluye instalación`;
            body.innerHTML = visible.map(({ row: r, estimate: e, ramRef, ssdRef, horizon: h }) => {
                const reference = (ref, title) => ref ? `<details class="renewal-pending"><summary>${title}: ${money(ref.price)} por unidad</summary><p>${escape(ref.label)}</p><p>${ref.units} unidades compradas · promedio ponderado</p></details>` : `<span>${title}: sin precio de referencia</span>`;
                return `<tr><td><strong>${escape(r.eq.nombre_codigo || r.eq.hostname || r.eq.serial || 'Sin código')}</strong><span>${escape([r.eq.marca, r.eq.modelo].filter(Boolean).join(' '))}</span><span>${escape(r.eq.usuario_nombre || 'Sin asignar')}</span><span>${escape(r.eq.empresa || 'Sin empresa')}</span><button type="button" class="renewal-view" data-upgrade-index="${rows.indexOf(r)}">Ver equipo</button></td>
                <td><strong>${escape(r.eq.cpu || 'CPU sin registrar')}</strong><span>${r.cpu ? `CPU: ${age(r.cpu.launch, r.at)} desde lanzamiento` : 'CPU sin fecha identificable'}</span><span>RAM: ${escape(r.eq.ram || 'Sin registrar')}</span><span>Disco: ${escape(r.eq.disco_duro || 'Sin registrar')}</span><span>${escape(r.eq.sistema_operativo || 'SO sin registrar')}</span></td>
                <td>${e.ram ? `<strong>RAM → ${target} GB</strong><span>Referencia: ${ramRef ? `1 módulo de ${ramRef.capacity} GB` : 'Pendiente de compra comparable'}</span>` : ''}${e.ssd ? '<strong>HDD → SSD</strong>' : ''}<span>Verificar ranuras y compatibilidad</span></td>
                <td><strong class="upgrade-horizon">${h.label}</strong><span>De uso previsto desde la mejora</span><details class="renewal-pending"><summary>Ver cálculo y condiciones</summary><p>${escape(h.reason)}</p></details></td>
                <td><strong>${money(e.total)}</strong><span>Solo piezas · CLP</span>${e.ram ? reference(ramRef, 'RAM') : ''}${e.ssd ? reference(ssdRef, 'SSD') : ''}</td>
                <td><span class="upgrade-decision upgrade-rank-${h.rank}">${h.decision}</span><span>${r.missing.length ? 'Datos por completar: ' + r.missing.length : 'Requiere diagnóstico físico'}</span></td></tr>`;
            }).join('') || '<tr><td colspan="6">No hay equipos candidatos que coincidan con estos filtros.</td></tr>';

        }
        function fillSettings() { Object.keys(DEFAULTS).forEach(key => { get(key).value = policy[key]; }); }
        function render() {
            rows = evaluateAll(getEquipos(), policy);
            renderUpgrades();
            const counts = { urgente: 0, planificar: 0, mantener: 0, revisar: 0 };
            rows.forEach(row => counts[row.priority]++);
            Object.keys(counts).forEach(key => { get('count-' + key).textContent = counts[key]; });
            get('updated').textContent = `${rows.length} notebooks vigentes · Evaluación al ${fmtDate(dateOnly(today()))} · Excluye equipos dados de baja`;
            const companySelect = get('company'), selected = root.CompanyScope ? root.CompanyScope.get() : companySelect.value;
            const companies = [...new Set([...(root.CompanyScope?.brands.map(b => b.name) || []), ...rows.map(row => root.CompanyScope ? root.CompanyScope.canonical(row.eq.empresa) : row.eq.empresa).filter(Boolean)])].sort();
            companySelect.innerHTML = '<option value="">Todas las empresas</option>' + companies.map(company => `<option value="${escape(company)}">${escape(company)}</option>`).join('');
            companySelect.value = companies.includes(selected) ? selected : '';
            const query = normalize(get('search').value), priority = get('priority').value, company = companySelect.value;
            filtered = rows.filter(row => (!priority || row.priority === priority) && (!company || (root.CompanyScope ? root.CompanyScope.canonical(row.eq.empresa) === company : row.eq.empresa === company)) && (!query || normalize([row.eq.nombre_codigo, row.eq.hostname, row.eq.serial, row.eq.usuario_nombre, row.eq.usuario_email, row.eq.empresa, row.eq.modelo, row.eq.cpu].join(' ')).includes(query)));
            const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
            page = Math.min(page, pages);
            get('result-count').textContent = `${filtered.length} de ${rows.length} notebooks`;
            get('pagination-label').textContent = `Página ${page} de ${pages}`;
            get('prev').disabled = page === 1;
            get('next').disabled = page === pages;
            get('export').disabled = !filtered.length;
            get('rows').innerHTML = filtered.slice((page - 1) * pageSize, page * pageSize).map(row => {
                const eq = row.eq, index = rows.indexOf(row);
                const pending = row.missing.length ? `<details class="renewal-pending"><summary>${row.missing.length} dato${row.missing.length === 1 ? '' : 's'} por completar</summary><ul>${row.missing.map(value => `<li>${escape(value)}</li>`).join('')}</ul></details>` : '';
                return `<tr><td><strong>${escape(eq.nombre_codigo || eq.hostname || 'Sin código')}</strong><span>${escape([eq.marca, eq.modelo].filter(Boolean).join(' · ') || 'Sin modelo')}</span><span>Serie: ${escape(eq.serial || 'Sin registrar')}</span><strong class="renewal-person">${escape(eq.usuario_nombre || 'Sin asignar')}</strong><span>${escape(eq.empresa || 'Sin empresa')} · ${escape(eq.estado || 'Sin estado')}</span></td>
                    <td><span class="renewal-badge renewal-${row.priority}">${LABELS[row.priority]}</span><span>${escape(row.confidence)}</span></td>
                    <td><strong>${escape(horizon(row))}</strong><span>${row.target ? `Objetivo: ${fmtDate(row.target.date)}` : 'Registrar fecha de compra/uso o identificar CPU'}</span><span>${escape(row.target?.basis || '')}</span></td>
                    <td><strong>${escape(eq.cpu || 'Sin procesador')}</strong><span>${row.cpu ? `Lanzamiento: ${escape(row.cpu.yearLabel)} · ${age(row.cpu.launch, row.at)}` : 'Antigüedad tecnológica sin identificar'}</span><span>${escape(row.cpu?.precision || '')}</span>${row.cpu?.source ? `<a href="${escape(row.cpu.source)}" target="_blank" rel="noopener noreferrer">Consultar Intel</a>` : ''}</td>
                    <td><span>RAM: ${escape(eq.ram || 'Sin registrar')}</span><span>Disco: ${escape(eq.disco_duro || 'Sin registrar')}</span><span>SO: ${escape(eq.sistema_operativo || 'Sin registrar')}</span><span>Compatibilidad Windows 11: por verificar</span><span>${row.service ? `${escape(row.serviceLabel)}: ${fmtDate(row.service)} · ${age(row.service, row.at)}` : 'Compra / puesta en servicio: sin fecha'}</span></td>
                    <td><ul>${row.reasons.map(reason => `<li>${escape(reason)}</li>`).join('')}</ul><p class="renewal-action">${escape(row.action)}</p>${pending}</td>
                    <td><button type="button" class="renewal-view" data-renewal-index="${index}" aria-label="Ver equipo ${escape(eq.nombre_codigo || eq.serial || eq.modelo || '')}">Ver equipo</button></td></tr>`;
            }).join('') || '<tr><td colspan="7" class="renewal-empty">' + (rows.length ? 'No hay notebooks que coincidan con estos filtros.' : 'No hay notebooks vigentes en el inventario. Registra o importa equipos para evaluarlos.') + '</td></tr>';
        }
        section.querySelectorAll('.renewal-summary > div').forEach(card => {
            const key = Object.keys(LABELS).find(priority => card.classList.contains('renewal-summary-' + priority));
            if (!key) return;
            card.setAttribute('role', 'button'); card.tabIndex = 0; card.title = 'Ver equipos de esta prioridad';
            const show = () => { get('priority').value = key; page = 1; render(); get('rows').closest('.renewal-table-scroll').scrollIntoView({block:'start',behavior:'smooth'}); };
            card.addEventListener('click', show); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); } });
        });
        fillSettings();
        ['search', 'priority', 'company'].forEach(id => get(id).addEventListener(id === 'search' ? 'input' : 'change', () => { page = 1; render(); }));
        get('prev').addEventListener('click', () => { page--; render(); });
        get('next').addEventListener('click', () => { page++; render(); });
        get('rows').addEventListener('click', event => {
            const button = event.target.closest('[data-renewal-index]');
            if (button && rows[button.dataset.renewalIndex]) openEquipo(rows[button.dataset.renewalIndex].eq);
        });
        get('settings').addEventListener('submit', event => {
            event.preventDefault();
            if (!get('settings').reportValidity()) return;
            policy = config(Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, get(key).value])));
            try { localStorage.setItem('notebook-renewal-policy-v1', JSON.stringify(policy)); get('settings-message').textContent = 'Criterios guardados en este navegador. Evaluación actualizada.'; }
            catch (_) { get('settings-message').textContent = 'Criterios aplicados; no se pudieron guardar en este navegador.'; }
            fillSettings(); page = 1; render();
        });
        get('reset').addEventListener('click', () => { policy = config(); fillSettings(); get('settings').requestSubmit(); });
        get('refresh').addEventListener('click', async () => {
            get('refresh').disabled = true;
            try { await refresh(); render(); get('settings-message').textContent = 'Evaluación recalculada con los datos disponibles del inventario.'; }
            catch (_) { get('settings-message').textContent = 'No se pudo actualizar el inventario. Se conserva la última evaluación.'; }
            finally { get('refresh').disabled = false; }
        });
        get('export').addEventListener('click', () => {
            const url = URL.createObjectURL(new Blob([csv(filtered)], { type: 'text/csv;charset=utf-8' }));
            const link = document.createElement('a'); link.href = url; link.download = `renovacion-notebooks-${today()}.csv`; link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
        // Refrescar al cambiar de día también si la página permaneció abierta.
        let lastDay = today();
        document.addEventListener('visibilitychange', () => { if (!document.hidden && lastDay !== today()) { lastDay = today(); render(); } });
        render();
        return { render };
    }
    const api = { upgradeHorizon, purchaseReference, upgradeEstimate, DEFAULTS, SOURCES, config, dateOnly, ramGB, cpuInfo, isNotebook, evaluate, evaluateAll, csv, init };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NotebookRenewal = api;
})(typeof window !== 'undefined' ? window : globalThis);
