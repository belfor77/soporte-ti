const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
function fixture(legacy=false){
 const store=new Map([['ticket_updates',JSON.stringify({'1':{primera_respuesta_at:'2026-10-21T12:00:00Z'}})]]),writes=[];
 const context=vm.createContext({console:{warn(){}},Date,JSON,useLocalFallback:false,currentSession:{nombre:'Técnico'},normalizeStr:s=>String(s||'').toLowerCase(),allTicketsCached:[{id:'1',estado:'abierto'}],localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},supabase:{from(){return {update(fields){writes.push({...fields});return {eq:async()=>({error:legacy&&('tomado_at'in fields||'primera_respuesta_at'in fields)?{code:'PGRST204'}:null})}}}}}});
 const start=source.indexOf('    async function updateTicketStatus('),end=source.indexOf('    // ============================================',start);vm.runInContext(source.slice(start,end),context);return {context,store,writes};
}
test('esquema antiguo conserva la toma local y actualiza asignación en nube',async()=>{
 const f=fixture(true);await f.context.updateTicketFields('1',{tecnico_asignado:'Técnico',estado:'en progreso',tomado_at:'2026-10-22T12:00:00Z'});assert.equal(f.writes.length,2);assert.equal(f.writes[1].estado,'en progreso');assert.equal(f.writes[1].tomado_at,undefined);const pending=JSON.parse(f.store.get('ticket_updates'))['1'];assert.ok(pending.tomado_at);assert.ok(pending.primera_respuesta_at);assert.equal(pending.estado,undefined);
});
test('guardar estado no descarta fechas de atención aún pendientes',async()=>{
 const f=fixture();await f.context.updateTicketStatus('1','resuelto');assert.ok(JSON.parse(f.store.get('ticket_updates'))['1'].primera_respuesta_at);assert.ok(f.writes[0].fecha_resolucion);
});
