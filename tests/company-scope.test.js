const {test}=require('node:test');const assert=require('node:assert/strict');
const C=require('../company-scope.js');const I=require('../support-insights.js');
test('ámbito de empresa normaliza aliases sin atribuir registros desconocidos',()=>{
 for(const [value,want] of [['t-sales','T-Sales'],['T SALES','T-Sales'],['V PRIME','VPrime'],['v-prime','VPrime'],['INFINET','Infinet'],['todas',''],['',''],['Sin empresa','Sin empresa']])assert.equal(C.canonical(value),want);
 const rows=[{empresa:'T SALES'},{empresa:'V PRIME'},{empresa:'INFINET'},{empresa:''}];
 C.set('VPrime');assert.deepEqual(C.filter(rows),[rows[1]]);assert.equal(rows.length,4);
 C.set('todas');assert.deepEqual(C.filter(rows),rows);
});
test('selección vacía incluye registros sin empresa y selección sin datos devuelve vacío',()=>{
 C.set('Infinet');assert.deepEqual(C.filter([{empresa:'T-Sales'},{empresa:null}]),[]);
 C.set('');assert.equal(C.filter([{empresa:null}]).length,1);
});
test('selector filtra empresas declaradas en metadatos de tickets',()=>{
 C.set('T-Sales');const rows=[{meta:{empresa:'T SALES'}},{meta:{empresa:'VPrime'}}];
 assert.deepEqual(C.filter(rows,row=>row.meta.empresa),[rows[0]]);C.set('');
});
test('SLA y conteos cambian al seleccionar empresa y se recuperan en consolidado',()=>{
 const tickets=[{empresa:'T-Sales',estado:'abierto',created_at:'2026-10-01T12:00:00Z',sla_deadline:'2026-10-20T12:00:00Z'},{empresa:'V PRIME',estado:'resuelto',created_at:'2026-10-01T12:00:00Z',fecha_resolucion:'2026-10-01T13:00:00Z',sla_deadline:'2026-10-02T12:00:00Z'}];
 const at=new Date('2026-10-21T12:00:00Z');C.set('VPrime');let m=I.ticketMetrics(C.filter(tickets),at);assert.equal(m.received,1);assert.equal(m.compliance,100);assert.equal(m.pending,0);
 C.set('T-Sales');m=I.ticketMetrics(C.filter(tickets),at);assert.equal(m.sla.incumplido,1);assert.equal(m.pending,1);
 C.set('');assert.equal(I.ticketMetrics(C.filter(tickets),at).received,2);assert.equal(tickets.length,2);
});
