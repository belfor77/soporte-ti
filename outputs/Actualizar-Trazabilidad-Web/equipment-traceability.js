(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.EquipmentTraceability = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g,
        char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
    const normal = value => String(value || '').trim().toLowerCase();

    function fromDesktop(row) {
        const before = row.previous_data;
        const after = row.current_data || {};
        const changed = before && (normal(before.usuario_nombre) !== normal(after.usuario_nombre) ||
            normal(before.usuario_email) !== normal(after.usuario_email));
        const person = data => `<strong>${escape(data.usuario_nombre || 'Sin responsable')}</strong>${data.usuario_email ? ` (${escape(data.usuario_email)})` : ''}`;
        const details = before
            ? `${changed ? 'Responsable anterior' : 'Responsable registrado'}: ${person(before)}.<br>${changed ? 'Nuevo responsable' : 'Responsable después de actualizar'}: ${person(after)}.`
            : `Equipo incorporado al inventario. Responsable: ${person(after)}.`;
        const location = data => [data.empresa, data.sede].filter(Boolean).map(escape).join(' · ') || 'Sin ubicación registrada';
        let extra = '';
        if (before && (normal(before.empresa) !== normal(after.empresa) || normal(before.sede) !== normal(after.sede))) {
            extra = `<br>Ubicación anterior: ${location(before)}.<br>Ubicación nueva: ${location(after)}.`;
        } else if (after.empresa || after.sede) {
            extra = `<br>Ubicación: ${location(after)}.`;
        }
        return {id: `desktop-${row.id}`, serial: row.serial, date: row.recorded_at,
            action: !before ? 'Registro desde inventario Windows' : changed ? 'Cambio de responsable' : 'Actualización de equipo',
            details: details + extra, tech: row.actor ? 'Soporte TI · aplicación de inventario' : 'Aplicación de inventario (sin sesión)',
            dotColor: changed ? 'dot-amber' : 'dot-green'};
    }

    function combine(local, desktop, serial) {
        const found = new Map();
        for (const item of [...local, ...desktop.map(fromDesktop)]) {
            if (normal(item.serial) !== normal(serial)) continue;
            // Also support older kiosk movements stored with different field names.
            const movement = item.action ? item : {...item,
                action: item.tipo || 'Movimiento de equipo', date: item.fecha || item.date,
                tech: item.tecnico || item.tech,
                details: `Responsable anterior: <strong>${escape(item.usuario_anterior || 'Sin responsable')}</strong>.<br>Nuevo responsable: <strong>${escape(item.usuario_nuevo || 'Sin responsable')}</strong>.`,
                dotColor: 'dot-amber'};
            found.set(movement.id || `${movement.date}|${movement.action}|${movement.details}`, movement);
        }
        return [...found.values()].sort((a,b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    }
    // ilike treats % and _ as wildcards; series must match literally.
    function serialPattern(serial) { return String(serial || '').trim().replace(/[\\%_]/g, '\\$&'); }
    return {fromDesktop, combine, serialPattern};
});
