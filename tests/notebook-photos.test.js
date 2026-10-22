const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8');
const code = script.slice(script.indexOf('    // Coincidencias completas:'), script.indexOf('    function openEquipDetailModal(eq)'));
function setup(catalog = []) {
    const nodes = {};
    function node(id) {
        return { id, hidden: false, children: [], attributes: {}, textContent: '',
            removeAttribute(key) { delete this[key]; },
            setAttribute(key, value) { this.attributes[key] = value; },
            cloneNode() { return node(this.id); },
            replaceWith(value) { nodes[this.id] = value; },
            replaceChildren() { this.children = []; },
            appendChild(value) { this.children.push(value); },
            addEventListener(event, handler) { this[event] = handler; }
        };
    }
    for (const suffix of ['image', 'placeholder', 'status', 'model', 'source', 'views']) nodes['modal-equip-reference-' + suffix] = node('modal-equip-reference-' + suffix);
    const ctx = vm.createContext({ window: { NotebookPhotoCatalog: catalog }, document: { getElementById: id => nodes[id], createElement: () => node('') } });
    vm.runInContext(code, ctx);
    return { ctx, get: suffix => nodes['modal-equip-reference-' + suffix] };
}
test('prefiere fotos locales y permite cambiar superior/inferior sin cargas cruzadas', () => {
    const { ctx, get } = setup([{ brand: 'HP', model: 'EliteBook 840 G3', views: [{ label: 'Vista superior', image: 'img/notebooks/hp-840-g3/arriba.jpg' }, { label: 'Vista inferior', image: 'img/notebooks/hp-840-g3/abajo.jpg' }] }]);
    ctx.renderEquipModelReference({ marca: 'HP', modelo: 'HP EliteBook 840 G3' });
    assert.equal(get('views').children.length, 2);
    assert.equal(get('views').hidden, false);
    assert.equal(get('image').src, 'img/notebooks/hp-840-g3/arriba.jpg');
    const previous = get('image');
    get('views').children[1].click();
    assert.equal(get('image').src, 'img/notebooks/hp-840-g3/abajo.jpg');
    previous.onload();
    assert.equal(get('placeholder').hidden, false);
    get('image').onload();
    assert.equal(get('placeholder').hidden, true);
    assert.equal(get('views').children[1].attributes['aria-pressed'], 'true');
    ctx.renderEquipModelReference({ marca: 'HP', modelo: 'EliteBook 840 G4' });
    assert.equal(get('image').src, undefined);
    assert.equal(get('views').children.length, 0);
    assert.equal(get('views').hidden, true);
});
test('sin fotos locales conserva fabricante y maneja error sin imagen rota', () => {
    const { ctx, get } = setup();
    ctx.renderEquipModelReference({ marca: 'Dell Inc.', modelo: 'Latitude 5400' });
    assert.match(get('image').src, /^https:\/\/i\.dell\.com/);
    assert.equal(get('source').hidden, false);
    get('image').onerror();
    assert.equal(get('image').hidden, true);
    assert.match(get('status').textContent, /No se pudo cargar/);
});
test('rechaza rutas locales fuera de la carpeta de fotos', () => {
    const { ctx, get } = setup([{ brand: 'HP', model: 'EliteBook 840 G3', views: [{ image: 'img/notebooks/../../secret.png' }] }]);
    ctx.renderEquipModelReference({ marca: 'HP', modelo: 'EliteBook 840 G3' });
    assert.match(get('image').src, /^https:\/\/hp\.widen\.net/);
});
