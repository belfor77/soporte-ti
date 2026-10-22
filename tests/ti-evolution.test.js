const {test}=require('node:test');const assert=require('node:assert/strict');
const E=require('../ti-evolution.js');
const eq={id:'e1',serial:'SER1',empresa:'T-Sales',ram:'8 GB',cpu:'i5-8365U',tipo:'laptop'};
const p={id:'p1',producto:'RAM DDR4 8 GB',cantidad:2,valor_total:40000,estado:'entregado',fecha:'2026-10-01',empresa:'T-Sales'};
const action={id:'a1',serial:'SER1',company:'T-Sales',type:'ram',date:'2026-10-02',cost:30000,evidence:'TK1'};
const ticket={id:'t1',empresa:'T-Sales',created_at:'2026-09-01T12:00:00Z',fecha_resolucion:'2026-10-02T12:00:00Z',estado:'resuelto',cliente_email:'persona@example.com'};
const data={equipos:[eq],compras:[p],tickets:[ticket]};
const filter={start:'2026-10-01',end:'2026-10-21',asOf:'2026-10-21'};
test('evolución separa fecha de creación de fecha de cierre e identifica personas',()=>{
 const m=E.build(data,filter);assert.equal(m.received,0);assert.equal(m.resolved,1);assert.equal(m.months[0].resolved.length,1);assert.equal(m.summary.total,40000);
 const t={...ticket,id:'t2',created_at:'2026-10-03T12:00:00Z',fecha_resolucion:null,estado:'abierto'};
 const n=E.build({...data,tickets:[t,{...t,id:'t3',cliente_email:''}]},filter);assert.equal(n.people,1);assert.equal(n.unidentified,1);
});
test('comparación usa ventanas iguales y no transforma falta de datos en cero',()=>{
 const prior={...p,id:'prior',fecha:'2026-09-20',valor_total:20000};
 const m=E.build({...data,compras:[p,prior]},filter);assert.equal(m.prevStart,'2026-09-10');assert.equal(m.prevEnd,'2026-09-30');assert.equal(m.variation,100);
 assert.equal(E.build({...data,compras:[{...p,valor_total:''},prior]},filter).variation,null);
 assert.equal(E.build({...data,compras:[{...p,valor_total:0},prior]},filter).variation,-100);
 assert.equal(E.build(data,filter).variation,null);
});
test('no suma pendientes, compras futuras ni otra empresa y clasifica repuestos',()=>{
 const m=E.build({...data,compras:[p,{...p,id:'v',empresa:'VPrime'},{...p,id:'f',fecha:'2027-01-01'},{...p,id:'pending',estado:'en_transito'}]}, {...filter,company:'T-Sales'});
 assert.equal(m.summary.total,40000);assert.equal(m.pendingPurchases,1);assert.equal(m.categories[0].label,'Repuestos y mejoras');
 assert.equal(E.category({producto:'Notebook 16 GB SSD'}),'Equipos');
 assert.equal(E.category({categoria:'ram',producto:'Memoria para notebook'}),'Repuestos y mejoras');
});
test('vínculos explícitos reparten una compra sin superar su total',()=>{
 const l=E.validateLink({id:'l1',purchaseId:'p1',equipmentId:'e1',amount:20000,eventId:'a1'},[],data,[action]);
 assert.equal(l.amount,20000);assert.equal(l.serial,'SER1');
 assert.throws(()=>E.validateLink({...l,id:'l2',amount:25000},[l],data,[action]),/superan/);
 assert.throws(()=>E.validateLink({...l,id:'l2',amount:15000},[l],data,[action]),/costo conocido/);
 assert.throws(()=>E.validateLink({...l,amount:-1},[],data,[action]),/positivo/);
 assert.throws(()=>E.validateLink(l,[],{...data,compras:[{...p,empresa:'VPrime'}]},[action]),/misma empresa/);
});
test('historial concilia piezas incluidas y conserva gastos separados',()=>{
 const l={id:'l1',purchaseId:'p1',equipmentId:'e1',serial:'SER1',company:'T-Sales',amount:20000,eventId:'a1'};
 const h=E.equipmentHistory(eq,data,[action],[l],[],'2026-10-21');assert.equal(h.purchaseCost,20000);assert.equal(h.eventCost,30000);assert.equal(h.overlap,20000);assert.equal(h.knownTotal,30000);
 assert.equal(E.equipmentHistory(eq,data,[action],[{...l,eventId:''}],[],'2026-10-21').knownTotal,50000);
});
test('historial no asocia por usuario ni suma vínculos invalidados por cambios de compra',()=>{
 const l={id:'l1',purchaseId:'p1',equipmentId:'e1',serial:'SER1',company:'T-Sales',amount:20000,eventId:''};
 const d={...data,tickets:[ticket,{...ticket,id:'t2',equipo_serial:'SER1'}]};
 assert.equal(E.equipmentHistory(eq,d,[],[l],[],'2026-10-21').tickets.length,1);
 const h=E.equipmentHistory(eq,{...d,compras:[{...p,valor_total:10000}]},[{...action,cost:null}],[l],[],'2026-10-21');assert.equal(h.knownTotal,null);assert.equal(h.invalidLinks,1);assert.equal(h.unknown,1);
});
test('movimientos sin empresa solo se atribuyen con serie única y fechas válidas',()=>{
 const movements=[{serial:'SER1',date:'2026-10-02',action:'Entrega'},{serial:'SER1',date:'2027-01-01'}];
 assert.equal(E.equipmentHistory(eq,data,[],[],movements,'2026-10-21').movements.length,1);
 assert.equal(E.equipmentHistory(eq,{...data,equipos:[eq,{...eq,id:'e2',empresa:'VPrime'}]},[],[],movements,'2026-10-21').movements.length,0);
});
test('personas con actividad incluye cierres de solicitudes anteriores y no atribuye correos no verificados',()=>{
 const m=E.build(data,filter);assert.equal(m.people,1);
 const n=E.build({...data,tickets:[{...ticket,_affected_email_verified:false}]},filter);assert.equal(n.people,0);assert.equal(n.unidentified,1);
});
test('CSV de evolución incluye trazabilidad y neutraliza fórmulas',()=>{
 const output=E.csv(E.build({...data,compras:[{...p,id:'=formula'}]},filter));assert.match(output,/Compras realizadas/);assert.match(output,/'=formula/);assert.match(output,/40000/);
});
test('resoluciones inválidas o futuras no inflan atenciones',()=>{
 const m=E.build({...data,tickets:[{...ticket,fecha_resolucion:'2026-06-01T12:00:00Z'},{...ticket,id:'future',fecha_resolucion:'2027-01-01T12:00:00Z'}]},filter);assert.equal(m.resolved,0);assert.equal(m.people,0);
});
