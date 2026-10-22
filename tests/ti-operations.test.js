const {test}=require('node:test'),assert=require('node:assert/strict');
const O=require('../ti-operations.js');
const now='2026-10-22T20:00:00Z';
const tickets=[{id:'1',empresa:'T-Sales',created_at:'2026-10-20T12:00:00Z',tomado_at:'2026-10-20T12:10:00Z',primera_respuesta_at:'2026-10-20T12:30:00Z',fecha_resolucion:'2026-10-21T12:00:00Z',estado:'resuelto'},
{id:'2',empresa:'Infinet',created_at:'2026-10-20T12:00:00Z',tomado_at:'2026-10-19T12:00:00Z',fecha_resolucion:'2026-10-25T12:00:00Z',estado:'resuelto'},
{id:'3',empresa:'T-Sales',created_at:'2026-10-18T12:00:00Z',estado:'abierto',updated_at:'2026-10-20T12:00:00Z'},
{id:'4',empresa:'T-Sales',created_at:'2026-10-22T12:00:00Z',estado:'abierto'}];
test('toma, respuesta, resolución y trabajo efectivo son mediciones independientes',()=>{
 const r=O.build({tickets},{start:'2026-10-20',end:'2026-10-22',asOf:now,company:'T-Sales'},{work:[{ticketId:'3',company:'T-Sales',date:'2026-10-21',minutes:15},{ticketId:'1',company:'Infinet',date:'2026-10-21',minutes:999}],projects:[]});
 assert.equal(r.take,10);assert.equal(r.takeN,1);assert.equal(r.metrics.response,30);assert.equal(r.metrics.resolution,1440);assert.equal(r.workMinutes,15);assert.equal(r.daily.find(d=>d.date==='2026-10-21').resolved,1);
});
test('no infiere tomas desde asignaciones, ni cierres futuros o anteriores',()=>{
 const r=O.build({tickets},{start:'2026-10-20',end:'2026-10-22',asOf:now});assert.equal(r.takeN,1);assert.equal(r.metrics.resolutionN,1);assert.equal(r.workMinutes,null);assert.equal(r.daily.reduce((n,d)=>n+d.resolved,0),1);
});
test('horas de Chile agrupan los eventos por día local',()=>assert.equal(O.civil('2026-10-21T01:30:00Z'),'2026-10-20'));
test('avance deriva de entregables, producción exige evidencia y finalización',()=>{
 const p={id:'p',title:'Proyecto de prueba',owner:'Responsable',objective:'Objetivo registrado',next:'Validación',company:'T-Sales',status:'en desarrollo',milestones:'[x] Primero\n[ ] Segundo'};
 assert.equal(O.normalizeProject(p).progress,50);assert.throws(()=>O.normalizeProject({...p,status:'en producción'}));assert.throws(()=>O.normalizeProject({...p,milestones:'80%'}));
 assert.equal(O.normalizeProject({...p,status:'en producción',milestones:'[x] Primero',evidence:'Acta de aceptación'}).progress,100);
});
test('filtro técnico separa asignación actual y autor del trabajo registrado',()=>{
 const data={tickets:[{...tickets[0],tecnico_asignado:'Técnico A'}]};
 const records={work:[{ticketId:'1',company:'T-Sales',date:'2026-10-21',minutes:20,actor:'Técnico B'}],projects:[]};
 const a=O.build(data,{start:'2026-10-20',end:'2026-10-22',asOf:now,technician:'Técnico A'},records);
 assert.equal(a.cohort.length,1);assert.equal(a.workMinutes,null);
 const b=O.build(data,{start:'2026-10-20',end:'2026-10-22',asOf:now,technician:'Técnico B'},records);
 assert.equal(b.cohort.length,0);assert.equal(b.workMinutes,20);
});
