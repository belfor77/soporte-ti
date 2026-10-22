const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../management-presentation.js'),I=require('../support-insights.js');
const eq={tipo:'laptop',estado:'activo',serial:'S1',cpu:'i5-8365U',ram:'8 GB',disco_duro:'SSD',sistema_operativo:'Windows 11',empresa:'T-Sales'};
const purchase={producto:'RAM DDR4 8 GB',cantidad:2,valor_total:40000,fecha:'2026-10-01',estado:'entregado',empresa:'T-Sales'};
function fixture(purchases=[purchase],quotes=[]){
 const data={equipos:[eq],compras:purchases,tickets:[{created_at:'2026-08-01T12:00:00Z',fecha_resolucion:'2026-10-02T12:00:00Z',estado:'resuelto',empresa:'T-Sales'}]};
 const records={events:[{date:'2026-10-03',type:'ram',serial:'S1',company:'T-Sales',cost:20000,evidence:'TK-1'}],quotes};
 const report=I.build(data,{start:'2026-10-01',end:'2026-10-21',asOf:'2026-10-21'},records,{});
 return P.build(report,data,quotes);
}
test('separa compras, intervenciones y escenarios sin sumar gasto duplicado',()=>{
 const m=fixture();assert.equal(m.purchaseTotal,40000);assert.equal(m.eventTotal,20000);assert.equal(m.upgradeTotal,20000);assert.equal(m.closures,1);assert.equal(m.alternatives[0].difference,null);
});
test('compara contra cotización vigente de la misma empresa',()=>{
 const quotes=[{company:'T-Sales',unit:700000,date:'2026-10-01',until:'2026-10-31'},{company:'T-Sales',unit:1,date:'2026-09-01',until:'2026-09-30'},{company:'VPrime',unit:2,date:'2026-10-01',until:'2026-10-31'}];
 assert.equal(fixture([purchase],quotes).alternatives[0].difference,680000);
});
test('no usa pendientes ni referencias de otras empresas para estimar inversión',()=>{
 const m=fixture([{...purchase,estado:'pendiente'},{...purchase,empresa:'VPrime',producto:'RAM DDR4 4 GB'}]);
 assert.equal(m.purchaseTotal,40000);assert.equal(m.unconfirmed,1);assert.equal(m.upgradeTotal,null);assert.equal(m.upgradeUnknown,1);
});
test('distingue costo desconocido de cero y excluye compras futuras del realizado',()=>{
 const m=fixture([{...purchase,valor_total:''},{...purchase,fecha:'2027-01-01',valor_total:2}]);
 assert.equal(m.purchaseTotal,null);assert.equal(m.purchaseUnknown,1);
 assert.equal(fixture([{...purchase,valor_total:0}]).purchaseTotal,0);
});
