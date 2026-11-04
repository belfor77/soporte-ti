// Verificación aislada: no accede a servicios, credenciales ni datos reales.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
const checks = [];
function context({remote = [], local = {}, offline = false, failing = false} = {}) {
  const storage = new Map(Object.entries(local).map(([k,v])=>[k,JSON.stringify(v)]));
  const ctx = vm.createContext({
    useLocalFallback:offline, currentSession:{role:'admin',nombre:'Auditoría',email:'audit@example.invalid'},
    console:{warn(){},error(){}}, supportDataSources:{}, realRecords:r=>r,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    supabase:{from(){const q={};for(const key of ['select','order','eq','delete','update','insert'])q[key]=()=>q;
      q.range=async()=>({data:remote,error:failing?{message:'Error sintético'}:null});
      q.then=resolve=>resolve({data:remote,error:failing?{message:'Error sintético'}:null});return q;}},
    normalizeStr:v=>String(v||'').toLowerCase(), extractMetadata:()=>({}), confirmedAffectedEmail:()=>'',
    loadPlatformUsers:async()=>[{email:'tech@example.invalid',password:'synthetic',role:'technician',nombre:'Prueba'}],
  });
  for(const [start,end] of [
    ['    async function fetchEquipos()', '    async function saveEquipo('],
    ['    async function updateEquipo(', '    async function deleteEquipo('],
    ['    async function deleteEquipo(', '    let allEquiposCached'],
    ['    async function fetchReplies(', '    async function saveReply('],
    ['    async function authenticateUser(', '    // Función unificada de Login'],
  ]) {
    const a=source.indexOf(start), b=source.indexOf(end,a);assert(a>=0&&b>a);
    vm.runInContext(source.slice(a,b),ctx);
  }
  return {ctx,storage};
}
(async()=>{
  const cloud={id:'eq-audit',serial:'AUDIT-SERIAL',empresa:'T-Sales',estado:'disponible'};
  const f=context({remote:[cloud],local:{local_equipos:[cloud]},offline:true});
  await f.ctx.updateEquipo(cloud.id,{estado:'en_preparacion'});
  assert.equal(JSON.parse(f.storage.get('local_equipos'))[0].estado,'en_preparacion');
  f.ctx.useLocalFallback=false;
  const refreshed=await f.ctx.fetchEquipos();
  assert.equal(refreshed[0].estado,'disponible');
  checks.push({id:'local-equipment-overwritten',confirmed:true,detail:'Una edición local pendiente vuelve al valor antiguo de la nube al consultar.'});
  const d=context({remote:[cloud],local:{local_equipos:[cloud]},failing:true});
  assert.equal(await d.ctx.deleteEquipo(cloud.id),true);
  assert.equal(JSON.parse(d.storage.get('local_equipos')).length,0);
  checks.push({id:'equipment-delete-success-on-error',confirmed:true,detail:'deleteEquipo devuelve true aunque Supabase responda con error.'});
  const r=context({remote:[],local:{local_replies:[{ticket_id:'ticket-audit',mensaje:'Respuesta local pendiente'}]}});
  assert.equal((await r.ctx.fetchReplies('ticket-audit')).length,0);
  checks.push({id:'offline-reply-hidden-online',confirmed:true,detail:'Una lectura remota exitosa vacía oculta la respuesta conservada en local_replies.'});
  const a=context();
  assert.equal((await a.ctx.authenticateUser('tech@example.invalid','synthetic','admin')).role,'technician');
  checks.push({id:'required-role-ignored',confirmed:true,detail:'authenticateUser devuelve un técnico aunque requiredRole sea admin.'});
  fs.writeFileSync(path.join(__dirname,'resultados-logica.json'),JSON.stringify({date:'2026-10-27',checks},null,2));
  console.log(JSON.stringify(checks,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
