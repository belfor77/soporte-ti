const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const trace = require('../equipment-traceability');
const row = (extra={}) => ({id:'change-1',serial:'ABC123',recorded_at:'2026-11-04T15:00:00Z',actor:null,
    previous_data:{usuario_nombre:'Omar Gálvez',usuario_email:'omar@example.cl',empresa:'T-Sales'},
    current_data:{usuario_nombre:'Ana Pérez',usuario_email:'ana@example.cl',empresa:'VPrime',sede:'Eliodoro'},...extra});

test('muestra responsable anterior y nuevo, fecha y cambio de empresa', () => {
    const event=trace.fromDesktop(row());
    assert.equal(event.action,'Cambio de responsable');
    assert.match(event.details,/Omar Gálvez/);assert.match(event.details,/Ana Pérez/);
    assert.match(event.details,/Ubicación anterior: T-Sales/);assert.match(event.details,/Ubicación nueva: VPrime/);
    assert.equal(event.date,'2026-11-04T15:00:00Z');
    assert.match(event.tech,/sin sesión/);
});
test('escapa datos recibidos de nombres, correos y sedes', () => {
    const event=trace.fromDesktop(row({current_data:{usuario_nombre:'<img src=x onerror=alert(1)>',usuario_email:'<x>',sede:'<script>'}}));
    assert.doesNotMatch(event.details,/<img|<script>/);assert.match(event.details,/&lt;img/);
});
test('actualizar hardware sin cambiar responsable no inventa reasignación', () => {
    const event=trace.fromDesktop(row({current_data:{...row().previous_data,ram:'32 GB'}}));
    assert.equal(event.action,'Actualización de equipo');
});
test('combina historial compartido y local por serie, ordena y elimina duplicados', () => {
    const local=[{id:'local-1',serial:' abc123 ',date:'2026-11-03T12:00:00Z',action:'Ingreso',details:'Detalle'},
        {id:'other',serial:'OTHER',date:'2026-11-05T00:00:00Z',action:'Otro'}];
    const events=trace.combine(local,[row(),row()], 'ABC123');
    assert.equal(events.length,2);assert.equal(events[0].id,'desktop-change-1');
    assert.equal(events[1].id,'local-1');
});
test('reconoce movimientos antiguos del kiosko', () => {
    const [event]=trace.combine([{id:'kiosk',serial:'ABC123',fecha:'2026-11-01',tipo:'Reasignación',usuario_anterior:'Omar',usuario_nuevo:'Ana',tecnico:'Felipe'}],[],'ABC123');
    assert.match(event.details,/Omar/);assert.match(event.details,/Ana/);assert.equal(event.tech,'Felipe');
});
test('serie literal no permite comodines en consulta', () => {
    assert.equal(trace.serialPattern(' A%_\\B '),'A\\%\\_\\\\B');
});

const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
const section=source.slice(source.indexOf('    let serialHistoryRequest = 0;'),source.indexOf('    const btnCloseHistorial'));
function setup(results) {
    const nodes={};
    for (const id of ['modal-historial-serial','historial-serial-badge','historial-equipo-nombre','historial-equipo-specs','historial-equipo-estado-badge','equip-serial-timeline-list']) nodes[id]={style:{},innerHTML:'',textContent:''};
    const queries=[];
    const supabase={from(table){
        const q={table};queries.push(q);
        const builder={select(){return this;},ilike(column,value){q.serial=value;return this;},order(){return this;},range(from,to){q.from=from;q.to=to;return results(q);}};
        return builder;
    }};
    const ctx=vm.createContext({window:{EquipmentTraceability:trace},document:{getElementById:id=>nodes[id]},
        useLocalFallback:false,supabase,allEquiposCached:[],loadEquiposMovements:()=>[],
        getEquipStateClass:()=>'',getEquipStateLabel:()=>'',formatDate:String,
        escapeHtml:s=>String(s),console:{warn(){}},alert(){}});
    vm.runInContext(section,ctx);
    return {ctx,nodes,queries};
}
test('modal lee historial real desde base y muestra la reasignación ya registrada', async () => {
    const {ctx,nodes,queries}=setup(()=>Promise.resolve({data:[row()],error:null}));
    await ctx.openSerialHistoryModal('ABC123');
    assert.equal(queries[0].table,'desktop_inventory_history');
    assert.match(nodes['equip-serial-timeline-list'].innerHTML,/Omar Gálvez/);
    assert.match(nodes['equip-serial-timeline-list'].innerHTML,/Ana Pérez/);
});
test('fallo de conexión se informa y no se presenta como historial completo', async () => {
    const {ctx,nodes}=setup(()=>Promise.resolve({data:null,error:new Error('offline')}));
    await ctx.openSerialHistoryModal('ABC123');
    assert.match(nodes['equip-serial-timeline-list'].innerHTML,/No se pudo consultar el historial compartido/);
});
test('respuesta tardía de otro equipo no reemplaza el historial abierto', async () => {
    let resolveFirst;
    const {ctx,nodes}=setup(q=>q.serial==='FIRST' ? new Promise(resolve=>{resolveFirst=resolve;}) : Promise.resolve({data:[row({serial:'SECOND',current_data:{usuario_nombre:'Segunda persona'}})],error:null}));
    const first=ctx.openSerialHistoryModal('FIRST');
    await ctx.openSerialHistoryModal('SECOND');
    resolveFirst({data:[row({serial:'FIRST'})],error:null});await first;
    assert.match(nodes['equip-serial-timeline-list'].innerHTML,/Segunda persona/);
    assert.doesNotMatch(nodes['equip-serial-timeline-list'].innerHTML,/Ana Pérez/);
});
test('cerrar mientras carga no vuelve a abrir el modal al responder', async () => {
    let resolve;
    const {ctx,nodes}=setup(()=>new Promise(r=>{resolve=r;}));
    const pending=ctx.openSerialHistoryModal('ABC123');
    nodes['modal-historial-serial'].style.display='none';
    resolve({data:[row()],error:null});await pending;
    assert.equal(nodes['modal-historial-serial'].style.display,'none');
});
