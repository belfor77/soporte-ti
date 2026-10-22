const {test}=require('node:test');const assert=require('node:assert/strict');
const I=require('../support-insights.js'),R=require('../notebook-renewal.js'),Q=require('../support-demo-registry.js');
const at=new Date('2026-10-16T15:00:00Z');
const base={id:'real-1',created_at:'2026-09-01T12:00:00Z',estado:'resuelto',fecha_resolucion:'2026-09-01T14:00:00Z',first_response_at:'2026-09-01T12:10:00Z',empresa:'T-Sales',cliente_email:'persona@example.com',sla_deadline:'2026-09-01T15:00:00Z'};
const event={id:'e1',type:'reemplazo',date:'2026-09-01',serial:'SER-1',email:'persona@example.com',company:'T-Sales',coverage:true,coverageDays:30,evidence:'TK-REAL'};
const eq={id:'real-eq',tipo:'laptop',estado:'activo',serial:'SER-1',marca:'HP',modelo:'EliteBook 840 G3',cpu:'i5-6200U',ram:'8 GB',disco_duro:'SSD',sistema_operativo:'Windows 11 Pro',empresa:'T-Sales'};
const quote={id:'q1',company:'T-Sales',unit:700000,date:'2026-10-01',until:'2026-10-31',vendor:'Proveedor de prueba',reference:'COT-1'};

test('tiempos solo usan respuesta y resolución explícitas, sin inventar desde updated_at',()=>{
 const m=I.ticketMetrics([base,{...base,id:'2',first_response_at:null,fecha_resolucion:null,updated_at:'2026-09-01T13:00:00Z'}],at);
 assert.equal(m.received,2);assert.equal(m.resolved,2);assert.equal(m.resolution,120);assert.equal(m.resolutionN,1);assert.equal(m.response,10);assert.equal(m.responseN,1);assert.equal(m.satisfaction,null);
});
test('SLA distingue falta de fechas, alertas pendientes y cumplimiento de cierres',()=>{
 assert.equal(I.ticketSla({...base,sla_deadline:null},at),'sin_medicion');
 assert.equal(I.ticketSla({...base,fecha_resolucion:null},at),'sin_medicion');
 assert.equal(I.ticketSla({...base,estado:'abierto'},at),'incumplido');
 assert.equal(I.ticketSla({...base,estado:'abierto',sla_deadline:'2026-10-16T15:20:00Z'},at),'riesgo');
 assert.equal(I.ticketSla({...base,sla_deadline:'2026-08-01T10:00:00Z'},at),'sin_medicion');
 const m=I.ticketMetrics([base,{...base,id:'2',estado:'abierto'},{...base,id:'3',sla_deadline:null}],at);assert.equal(m.compliance,100);assert.equal(m.complianceN,1);
});
test('SLA y medias rechazan cierres anteriores a creación o futuros',()=>{
 for(const end of ['2026-08-01T00:00:00Z','2027-01-01T00:00:00Z']){const t={...base,fecha_resolucion:end};assert.equal(I.ticketSla(t,at),'sin_medicion');assert.equal(I.ticketMetrics([t],at).resolutionN,0);}
});
test('satisfacción solo se obtiene de valor registrado en escala 1 a 5',()=>{
 const m=I.ticketMetrics([{...base,satisfaction_rating:4},{...base,satisfaction_rating:5},{...base,satisfaction_rating:98}],at);assert.equal(m.satisfaction,90);assert.equal(m.satisfactionN,2);
});
test('comparación por afectado y empresa, períodos iguales, excluye día del cambio',()=>{
 const tickets=[{...base,id:'before',created_at:'2026-08-10T12:00:00Z'},{...base,id:'after',created_at:'2026-09-15T12:00:00Z'},{...base,id:'same-day'},{...base,id:'creator',created_at:'2026-08-11T12:00:00Z',cliente_email:'otra@example.com',usuario_email:event.email},{...base,id:'other-co',created_at:'2026-08-12T12:00:00Z',empresa:'Infinet'}];
 const c=I.afterBefore(event,tickets,30,'2026-10-16');assert.equal(c.before,1);assert.equal(c.after,1);assert.equal(c.change,0);assert.equal(c.start,'2026-08-02');assert.equal(c.end,'2026-10-01');
});
test('porcentaje requiere período completo, cobertura suficiente y base mayor a cero',()=>{
 const tickets=[{...base,created_at:'2026-08-10T12:00:00Z'}];
 assert.equal(I.afterBefore(event,tickets,30,'2026-09-10').change,null);
 assert.equal(I.afterBefore({...event,coverage:false},tickets,30,'2026-10-16').change,null);
 assert.equal(I.afterBefore(event,tickets,60,'2026-12-16').change,null);
 assert.equal(I.afterBefore(event,[],30,'2026-10-16').change,null);
 assert.equal(I.afterBefore(event,tickets,30,'2026-10-16').change,-100);
});
test('separación de períodos usa calendario de Chile y valida días reales',()=>{
 assert.equal(I.civil('2026-07-01T01:00:00Z'),'2026-06-30');assert.equal(I.civil('2026-07-01'),'2026-07-01');
 assert.equal(I.date('2026-02-30'),null);assert.equal(I.date('mal dato'),null);
 assert.equal(I.inPeriod('2026-10-16T01:00:00Z','2026-10-16','2026-10-16'),false);
});
test('presupuesto no duplica horizontes y excluye cotizaciones vencidas o futuras',()=>{
 const rows=[{eq,months:0},{eq:{...eq,serial:'2'},months:6},{eq:{...eq,serial:'3'},months:12},{eq:{...eq,serial:'4'},months:13},{eq:{...eq,empresa:'Infinet'},months:0},{eq,months:null}];
 const p=I.plan(rows,[quote,{...quote,id:'expired',unit:1,date:'2026-10-10',until:'2026-10-11'},{...quote,id:'future',unit:2,date:'2026-11-01',until:'2026-12-01'}],'2026-10-16');
 assert.equal(p.count,4);assert.equal(p.knownTotal,2100000);assert.equal(p.unquoted,1);assert.equal(p.groups.length,4);
 assert.equal(I.plan(rows,[],'2026-10-16').knownTotal,null);
});
test('registros de trabajo conservan costo desconocido separado de cero real',()=>{
 assert.equal(I.normalizeEvent({...event,cost:''}).cost,null);assert.equal(I.normalizeEvent({...event,cost:'0'}).cost,0);
 assert.throws(()=>I.normalizeEvent({...event,cost:-10}));assert.throws(()=>I.normalizeEvent({...event,evidence:''}));
 assert.throws(()=>I.normalizeQuote({...quote,unit:0}));assert.throws(()=>I.normalizeQuote({...quote,until:'2026-09-01'}));
});
test('resumen cuenta equipos recuperados distintos y todas las intervenciones con sus costos',()=>{
 const events=[I.normalizeEvent({...event,type:'ram',cost:30000}),I.normalizeEvent({...event,id:'e2',type:'ssd',cost:null}),I.normalizeEvent({...event,id:'e3',type:'reemplazo',cost:700000})];
 const report=I.build({tickets:[base],equipos:[eq],compras:[]},{start:'2026-09-01',end:'2026-10-16',asOf:'2026-10-16'},{events,quotes:[]},R.DEFAULTS);
 assert.equal(report.recovered,1);assert.equal(report.recoveries.length,2);assert.equal(report.recoveryCost,30000);assert.equal(report.recoveryCostUnknown,1);assert.equal(report.buckets.urgente,1);
});
test('filtros por empresa y período no cambian el estado actual del inventario',()=>{
 const report=I.build({tickets:[base,{...base,id:'2',empresa:'Infinet'},{...base,id:'3',created_at:'2026-02-30'}],equipos:[eq,{...eq,id:'2',empresa:'Infinet'}],compras:[]},{start:'2026-09-01',end:'2026-10-16',asOf:'2026-10-16',company:'T-Sales'},{events:[],quotes:[]},R.DEFAULTS);
 assert.equal(report.periodTickets.length,1);assert.equal(report.renewal.length,1);assert.equal(report.invalidDates,1);
});
test('las huellas de demostración son específicas y conservan registros modificados',()=>{
 const demo={id:'eq-vp-1',nombre_codigo:'-VPRIME',usuario_nombre:'Nicolas Toledo Rojas',usuario_email:'nicolas.toledo@vprime.cl',empresa:'VPrime',estado:'activo',serial:'78F12Z2',marca:'Dell',modelo:'Latitude 5400',cpu:'Intel i5-8265U',ram:'7.85 GB',disco_duro:'295.37 GB SSD',sistema_operativo:'Windows 10 Pro (Build 19045)',build_windows:'19045',licencia_usuario:'M365',fecha_asignacion:'12/01/2024',tipo:'laptop',created_at:'2024-01-12T10:00:00.000Z'};
 assert.equal(Q.isDemo(demo,'equipos'),true);assert.equal(Q.isDemo({...demo,serial:'REAL-NEW'},'equipos'),false);
 assert.deepEqual(Q.real([null,undefined,{...eq,is_demo:true},eq],'equipos'),[eq]);
});
test('exportación incluye trazabilidad, datos desconocidos y neutralización de fórmulas',()=>{
 const report=I.build({tickets:[{...base,asunto:'=FORMULA()'}],equipos:[eq],compras:[]},{start:'2026-09-01',end:'2026-10-16',asOf:'2026-10-16'},{events:[],quotes:[]},R.DEFAULTS);
 const csv=I.reportCsv(report,[],{Tickets:'Respaldo local'});assert.match(csv,/Respaldo local/);assert.match(csv,/Sin cotización/);assert.match(csv,/Sin monto/);assert.match(csv,/2026-10-16/);
 assert.equal(I.amount(''),null);assert.equal(I.amount(0),0);
});
