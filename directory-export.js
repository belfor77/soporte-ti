/* Exportación del directorio completo: lista explícita de campos, sin credenciales. */
(function (root) {
    'use strict';
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const OPTIONS = { todas: 'todo junto', tsales: 'T-Sales', infinet: 'Infinet', vprime: 'VPrime' };
    function company(value) {
        const name = normalize(value).replace(/[^a-z0-9]/g, '');
        if (name.includes('tsales')) return 'T-Sales';
        if (name.includes('infinet')) return 'Infinet';
        if (name.includes('vprime')) return 'VPrime';
        return String(value || '').trim() || 'Sin empresa';
    }
    function today() {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const get = name => parts.find(part => part.type === name).value;
        return `${get('year')}-${get('month')}-${get('day')}`;
    }
    function day(value) {
        const text = String(value || '').trim();
        let match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
        if (!match) {
            const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
            if (local) match = [local[0], local[3], local[2].padStart(2, '0'), local[1].padStart(2, '0')];
        }
        if (!match) return null;
        const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
        return date.getUTCFullYear() === +match[1] && date.getUTCMonth() === +match[2] - 1 && date.getUTCDate() === +match[3] ? `${match[1]}-${match[2]}-${match[3]}` : null;
    }
    function disabled(value) { return value === false || value === 0 || ['false', '0', 'no', 'disabled', 'inactivo', 'inactiva'].includes(normalize(value)); }
    function isActive(user, offboardings = [], asOf = today()) {
        if (!user || typeof user !== 'object' || Array.isArray(user)) return false;
        if (['activo', 'active', 'habilitado', 'accountEnabled', 'account_enabled'].some(key => user[key] != null && disabled(user[key]))) return false;
        const status = normalize(user.estado || user.status).replace(/[\s_-]+/g, ' ');
        if (/^(inactiv[oa]|baja|dado de baja|desvinculad[oa]|eliminad[oa]|bloquead[oa]|suspendid[oa]|inactive|disabled|deleted|terminated)$/.test(status)) return false;
        const email = normalize(user.email);
        const rut = normalize(user.rut).replace(/[.\s-]/g, '');
        const validRut = /^\d{7,8}[0-9k]$/.test(rut);
        const reentry = day(user.fecha_reingreso || user.fecha_ingreso);
        return !offboardings.some(exit => {
            if (!exit || /^(cancelad[oa]|anulad[oa])$/.test(normalize(exit.estado))) return false;
            if (exit.empresa && company(exit.empresa) !== company(user.empresa)) return false;
            const sameEmail = email && normalize(exit.email) === email;
            const sameRut = validRut && normalize(exit.rut).replace(/[.\s-]/g, '') === rut;
            if (!sameEmail && !sameRut) return false;
            const departure = day(exit.fecha_salida);
            if (departure && departure > asOf) return false;
            if (departure && reentry && reentry > departure) return false;
            return true;
        });
    }
    function select(users, option = 'todas', offboardings = [], asOf = today()) {
        if (!Object.hasOwn(OPTIONS, option)) throw new Error('Opción de descarga no reconocida.');
        if (!Array.isArray(users) || !Array.isArray(offboardings)) throw new Error('El directorio o las bajas no tienen un formato válido.');
        const rows = new Map();
        for (const user of users) {
            if (!isActive(user, offboardings, asOf)) continue;
            const comp = company(user.empresa);
            if (option !== 'todas' && comp !== OPTIONS[option]) continue;
            const email = normalize(user.email);
            const identity = email || [normalize(user.rut), normalize(user.nombre)].join('|');
            if (!email && !normalize(user.nombre) && !normalize(user.rut)) continue;
            const key = `${normalize(comp)}|${identity}`;
            if (!rows.has(key)) rows.set(key, { empresa: comp, nombre: String(user.nombre || ''), rut: String(user.rut || ''), email: String(user.email || ''), tipo: String(user.tipo || ''), licencia: String(user.licencia || ''), estado: 'Activo en directorio' });
        }
        return [...rows.values()].sort((a, b) => a.empresa.localeCompare(b.empresa, 'es') || a.nombre.localeCompare(b.nombre, 'es') || a.email.localeCompare(b.email, 'es'));
    }
    function csvCell(value) {
        let text = String(value ?? '');
        if (/^\s*[=+@-]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }
    function build(users, option = 'todas', offboardings = [], asOf = today()) {
        const selected = select(users, option, offboardings, asOf);
        const rows = [['Empresa', 'Nombre', 'RUT', 'Correo electrónico', 'Tipo', 'Licencia', 'Estado'], ...selected.map(user => [user.empresa, user.nombre, user.rut, user.email, user.tipo, user.licencia, user.estado])];
        return { users: selected, filename: `usuarios-activos-${option === 'todas' ? 'todas-las-empresas' : option}-${asOf}.csv`, csv: '\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n') };
    }
    function init({ getUsers, getOffboardings }) {
        const menu = document.getElementById('directory-export');
        if (!menu) return;
        const summary = menu.querySelector('summary');
        const status = document.getElementById('directory-export-status');
        function counts() {
            try {
                const users = getUsers(), offboardings = getOffboardings();
                menu.querySelectorAll('[data-directory-export]').forEach(button => {
                    const total = select(users, button.dataset.directoryExport, offboardings).length;
                    button.querySelector('small').textContent = `${total} usuario${total === 1 ? '' : 's'}`;
                    button.disabled = total === 0;
                });
            } catch (_) { status.textContent = 'No se pudo leer el directorio o las bajas. Actualiza la página antes de descargar.'; }
        }
        menu.addEventListener('toggle', () => { if (menu.open) counts(); });
        menu.addEventListener('keydown', event => {
            if (event.key === 'Escape') { menu.open = false; summary.focus(); }
        });
        document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
        menu.querySelectorAll('[data-directory-export]').forEach(button => {
            button.addEventListener('click', () => {
                try {
                    const exported = build(getUsers(), button.dataset.directoryExport, getOffboardings());
                    if (!exported.users.length) { status.textContent = 'No hay usuarios activos para esta opción.'; return; }
                    const url = URL.createObjectURL(new Blob([exported.csv], { type: 'text/csv;charset=utf-8' }));
                    const link = document.createElement('a'); link.href = url; link.download = exported.filename; link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    status.textContent = `Descarga preparada: ${exported.users.length} usuario${exported.users.length === 1 ? '' : 's'} activo${exported.users.length === 1 ? '' : 's'} (${OPTIONS[button.dataset.directoryExport]}).`;
                    menu.open = false; summary.focus();
                } catch (_) { status.textContent = 'No se pudo preparar la descarga. Revisa el directorio y las bajas registradas.'; }
            });
        });
    }
    const api = { company, today, day, isActive, select, build, init };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.DirectoryExport = api;
})(typeof window !== 'undefined' ? window : globalThis);
