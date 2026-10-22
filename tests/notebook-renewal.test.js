const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../notebook-renewal.js');
const AT = '2026-10-16';
const base = { tipo: 'laptop', estado: 'activo', nombre_codigo: 'NT-TEST', cpu: 'Intel(R) Core(TM) i5-8365U CPU @ 1.60GHz', ram: '7.88 GB (1 módulos)', disco_duro: '256 GB SSD', sistema_operativo: 'Windows 11 Pro', fecha_compra: '2023-03-01' };
const evaluate = (extra, config) => R.evaluate({ ...base, ...extra }, config, AT);

test('CPU antiguo confirmado supera el umbral y explica el cálculo', () => {
    const row = evaluate({ cpu: 'Intel(R) Core(TM) i5-6200U CPU @ 2.30GHz', fecha_compra: undefined });
    assert.equal(row.priority, 'urgente');
    assert.equal(row.cpu.yearLabel, '2015');
    assert.equal(row.target.date.toISOString().slice(0, 10), '2023-09-30');
    assert.equal(row.months, 0);
    assert.match(row.reasons.join(' '), /procesador/);
    assert.match(row.missing.join(' '), /compra/);
});
test('utilizables cercanos a RAM instalada no producen falsa alerta', () => {
    assert.equal(R.ramGB('7,85 GB'), 8);
    assert.equal(R.ramGB('15.8 GB (2 módulos)'), 16);
    assert.equal(R.ramGB('8192 MB'), 8);
    assert.equal(R.ramGB('Sin dato'), null);
    assert.equal(R.ramGB('0 GB'), null);
    assert.equal(evaluate({}).reasons.some(reason => /RAM inferior/.test(reason)), false);
});
test('umbral dentro de 12 meses y plazo por el primer criterio', () => {
    const row = evaluate({});
    assert.equal(row.priority, 'planificar');
    assert.equal(row.months, 9);
    assert.equal(row.target.date.toISOString().slice(0, 10), '2027-06-30');
});
test('criterios configurables cambian el resultado sin modificar datos del equipo', () => {
    const eq = { ...base };
    const row = R.evaluate(eq, { ...R.DEFAULTS, cpuYears: 12 }, AT);
    assert.equal(row.priority, 'mantener');
    assert.deepEqual(eq, base);
    assert.equal(R.config({ serviceYears: -1, minRam: 'texto' }).serviceYears, 5);
});
test('RAM y HDD recomiendan ampliación sin inventar fecha de falla', () => {
    const row = evaluate({ ram: '4 GB', disco_duro: '500 GB HDD' }, { ...R.DEFAULTS, cpuYears: 12 });
    assert.equal(row.priority, 'planificar');
    assert.match(row.action, /ampliación/);
    assert.match(row.reasons.join(' '), /SSD/);
    assert.equal(row.target.date.toISOString().slice(0, 10), '2028-03-01');
});
test('created_at y reasignación no se usan como antigüedad física', () => {
    const row = evaluate({ cpu: 'AMD Ryzen 5 7520U', fecha_compra: null, created_at: '2015-01-01', fecha_asignacion: '2016-01-01' });
    assert.equal(row.months, null);
    assert.equal(row.target, null);
    assert.equal(row.priority, 'revisar');
});
test('fechas locales válidas, inválidas y futuras', () => {
    assert.equal(R.dateOnly('31/02/2020'), null);
    assert.equal(R.dateOnly('2023-02-29'), null);
    assert.equal(R.dateOnly('2024-02-29').toISOString().slice(0, 10), '2024-02-29');
    const row = evaluate({ fecha_compra: '2030-01-01', cpu: 'Sin identificar' });
    assert.equal(row.months, null);
    assert.match(row.missing.join(' '), /futura/);
    assert.equal(evaluate({ fecha_puesta_servicio: '16/10/2021' }).priority, 'urgente');
});
test('variante CPU desconocida no hereda fecha de otro SKU', () => {
    assert.equal(R.cpuInfo('AMD Ryzen 5 7520U', R.dateOnly(AT)), null);
    assert.equal(R.cpuInfo('Intel Core Ultra 5 125U', R.dateOnly(AT)), null);
    assert.equal(R.cpuInfo('Intel i5-1035G1', R.dateOnly(AT)), null);
    const cpu = R.cpuInfo('Intel Core i7-8650U', R.dateOnly(AT));
    assert.equal(cpu.source, null);
    assert.match(cpu.precision, /Orientativa/);
    assert.match(cpu.yearLabel, /aprox/);
    assert.match(R.cpuInfo('Intel Core i5-1235U', R.dateOnly(AT)).precision, /12\.ª generación/);
});
test('Windows 10 sugiere revisar ESU y distingue LTSC', () => {
    const row = evaluate({ sistema_operativo: 'Windows 10 Pro' }, { ...R.DEFAULTS, cpuYears: 12 });
    assert.equal(row.priority, 'planificar');
    assert.match(row.reasons.join(' '), /ESU/);
    assert.match(evaluate({ sistema_operativo: 'Windows 10 Enterprise LTSC' }).reasons.join(' '), /edición exacta/);
    const before = R.evaluate({ ...base, sistema_operativo: 'Windows 10 Pro' }, R.DEFAULTS, '2025-01-01');
    assert.equal(before.reasons.some(reason => /ESU/.test(reason)), false);
});
test('incluye notebooks vigentes y excluye bajas y otros dispositivos', () => {
    const rows = R.evaluateAll([base, { ...base, estado: 'baja' }, { ...base, tipo: 'desktop' }, { ...base, tipo: 'Portátil' }, { modelo: 'HP EliteBook 840 G3', estado: 'activo' }], R.DEFAULTS, AT);
    assert.equal(rows.length, 3);
    assert.equal(R.isNotebook({ tipo: 'impresora' }), false);
    assert.equal(R.evaluateAll([], R.DEFAULTS, AT).length, 0);
});
test('prioridades se ordenan antes del plazo', () => {
    const rows = R.evaluateAll([{ ...base, cpu: 'Sin identificar', fecha_compra: null }, { ...base, cpu: 'i5-6200U' }, base], R.DEFAULTS, AT);
    assert.deepEqual(rows.map(row => row.priority), ['urgente', 'planificar', 'revisar']);
});
test('exportación incluye motivos, pendientes y neutraliza fórmulas de hoja de cálculo', () => {
    const output = R.csv([evaluate({ usuario_nombre: '=HYPERLINK("x")', serial: '+123', usuario_email: 'test@example.com' })]);
    assert.match(output, /Motivos/);
    assert.match(output, /Datos pendientes/);
    assert.match(output, /'\=HYPERLINK/);
    assert.match(output, /'\+123/);
    assert.match(output, /test@example.com/);
    assert.equal(R.csv([]).split('\r\n').length, 1);
});

test('presupuesto suma RAM y SSD con una sola mano de obra', () => {
    const row = { ram: 4, eq: { disco_duro: '500 GB HDD' } };
    assert.deepEqual(R.upgradeEstimate(row, { ram: 25000, ssd: 40000, labor: 15000 }), { ram: true, ssd: true, parts: 65000, total: 80000 });
    assert.equal(R.upgradeEstimate(row, { ram: 25000, ssd: '', labor: 0 }).total, null);
    assert.equal(R.upgradeEstimate(row, { ram: -1, ssd: 40000, labor: 0 }).total, null);
});
test('presupuesto respeta RAM objetivo, discos mixtos y precio cero explícito', () => {
    const row = { ram: 8, eq: { disco_duro: 'HDD + SSD' } };
    const result = R.upgradeEstimate(row, { ram: 0, labor: 0 }, 16);
    assert.equal(result.ram, true);
    assert.equal(result.ssd, false);
    assert.equal(result.total, 0);
    assert.equal(R.upgradeEstimate({ ram: null, eq: {} }, {}).ram, false);
});

test('referencias de RAM usan capacidad y promedio ponderado por unidades compradas', () => {
    const purchases = [
        { producto: 'RAM DDR4 8 GB', cantidad: 2, valor_total: 40000, fecha: '2026-10-01', estado: 'entregado' },
        { producto: 'RAM DDR4 8 GB', cantidad: 1, valor_total: 25000, fecha: '2026-10-02', estado: 'entregado' },
        { producto: 'RAM DDR4 16 GB', cantidad: 1, valor_total: 40000, fecha: '2026-10-02', estado: 'entregado' },
        { producto: 'RAM DDR4 8 GB', cantidad: 1, valor_total: 1, fecha: '2026-10-02', estado: 'cancelado' },
        { producto: 'RAM DDR4 8 GB', cantidad: 1, valor_total: 1, fecha: '2027-10-02', estado: 'entregado' }
    ];
    const ref = R.purchaseReference(purchases, 'ram', 8, '2026-10-21');
    assert.equal(ref.price, 21667);
    assert.equal(ref.units, 3);
    assert.equal(ref.capacity, 8);
    assert.equal(R.purchaseReference(purchases, 'ram', 16, '2026-10-21').price, 40000);
    assert.equal(R.purchaseReference(purchases, 'ram', 32, '2026-10-21'), null);
    assert.equal(R.purchaseReference([], 'ssd'), null);
});

test('horizonte tras mejora limita por CPU y fecha de servicio sin prometer supervivencia', () => {
    const row = { at: '2026-10-21', cpu: { launch: R.dateOnly('2019-06-30'), source: 'catalogo' }, service: R.dateOnly('2022-01-01'), eq: { sistema_operativo: 'Windows 11' } };
    const h = R.upgradeHorizon(row);
    assert.equal(h.rank, 0);
    assert.ok(h.months >= 24 && h.months < 36);
    assert.match(h.reason, /7 años/);
    assert.equal(R.upgradeHorizon({ ...row, service: R.dateOnly('2018-01-01') }).decision, 'Priorizar renovación');
    assert.equal(R.upgradeHorizon({ ...row, cpu: null }).months, null);
    assert.match(R.upgradeHorizon({ ...row, service: null }).reason, /evaluación parcial/);
    assert.match(R.upgradeHorizon({ ...row, eq: { sistema_operativo: 'Windows 10' } }).reason, /Validar soporte/);
});
