const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Q=require('../support-demo-registry.js');
const source=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');
function fixture({remote=[],local={},offline=false,failing=false}={}){
 const storage=new Map(Object.entries(local).map(([key,value])=>[key,JSON.stringify(value)]));const pages=[],writes=[];
 const supabase={from(table){return {select(){return this},order(){return this},async range(from,to){pages.push({table,from,to});return failing?{error:Error('sin conexión')}:{data:remote.slice(from,to+1),error:null}},insert(){throw Error('Una lectura no debe insertar registros')}}}};
 const context=vm.createContext({console:{warn(){},error(){}},useLocalFallback:offline,supabase,currentSession:null,realRecords:Q.real,supportDataSources:{},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){storage.set(k,v);writes.push(k)}},extractMetadata:t=>({cliente_email:t.usuario_email}),confirmedAffectedEmail:t=>t.cliente_email||'',renderComprasKPIs(){},renderComprasTable(){},renderManagementInsights(){},comprasData:[]});
 for(const [start,end] of [['    async function fetchTickets()','    async function saveTicket('],['    async function fetchEquipos()','    async function saveEquipo('],['    async function loadCompras()','    async function saveCompras(']])vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))),context);
 return {context,pages,storage,writes};
}
test('tickets carga más de 1000 sin truncar y no convierte al técnico en afectado confirmado',async()=>{
 const rows=Array.from({length:1002},(_,i)=>({id:'t'+i,usuario_email:'tecnico@example.com'}));const f=fixture({remote:rows});const got=await f.context.fetchTickets();assert.equal(got.length,1002);assert.equal(f.pages.length,2);assert.equal(got[0]._affected_email_verified,false);assert.equal(f.writes.length,0);
});
test('sin datos locales no se generan ni guardan tickets de ejemplo',async()=>{
 const f=fixture({offline:true});assert.equal((await f.context.fetchTickets()).length,0);assert.equal(f.writes.length,0);
});
test('cambios locales de estado se conservan cuando la nube no está disponible',async()=>{
 const f=fixture({failing:true,local:{local_tickets:[{id:'real',estado:'abierto'}],ticket_updates:{real:{estado:'resuelto',fecha_resolucion:'2026-10-15T12:00:00Z'}}}});const [row]=await f.context.fetchTickets();assert.equal(row.estado,'resuelto');assert.equal(row.fecha_resolucion,'2026-10-15T12:00:00Z');
});
test('inventario pagina, combina respaldo y no borra equipos por prefijo de ID',async()=>{
 const remote=Array.from({length:1001},(_,i)=>({id:'remote'+i,serial:'s'+i}));const f=fixture({remote,local:{local_equipos:[{id:'eq-12',serial:'REAL-LOCAL',empresa:'T-Sales'}]}});const got=await f.context.fetchEquipos();assert.equal(got.length,1002);assert.equal(got.some(e=>e.id==='eq-12'),true);assert.equal(f.pages.length,2);
});
test('compras vacías no insertan semillas ni descartan registros locales',async()=>{
 const f=fixture({remote:[],local:{compras_ti:[{id:'real-purchase',producto:'Compra registrada',valor_total:123456}]}});const got=await f.context.loadCompras();assert.equal(got.length,1);assert.equal(got[0].valor_total,123456);
});
test('compras carga todas las páginas y preserva respaldo ante error',async()=>{
 const remote=Array.from({length:1001},(_,i)=>({id:'c'+i}));const f=fixture({remote});assert.equal((await f.context.loadCompras()).length,1001);assert.equal(f.pages.length,2);
 const g=fixture({failing:true,local:{compras_ti:[{id:'local-real'}]}});assert.equal((await g.context.loadCompras()).length,1);
});
test('la consulta de nube conserva tickets locales únicos sin duplicar IDs',async()=>{
 const f=fixture({remote:[{id:'cloud',asunto:'En nube'}],local:{local_tickets:[{id:'local',asunto:'Local real'},{id:'cloud',asunto:'Copia antigua'}]}});
 const rows=await f.context.fetchTickets();assert.equal(rows.length,2);assert.equal(rows.find(t=>t.id==='cloud').asunto,'En nube');assert.equal(rows.find(t=>t.id==='local').asunto,'Local real');assert.equal(f.writes.length,0);
});
