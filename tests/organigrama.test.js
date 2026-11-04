const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const O=require('../organigrama.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/organigrama-bnovus.js'),'utf8'),context);
const people=context.window.OrganigramaSource.people;
test('conserva los 312 colaboradores y las jefaturas pendientes sin duplicar personas',()=>{
 const groups=O.groupsFor(people);const members=groups.flatMap(g=>g.members);
 assert.equal(members.length,312);assert.equal(new Set(members.map(p=>p.id)).size,312);
 assert.equal(groups.filter(g=>!g.supervisor).flatMap(g=>g.members).length,6);
 assert.ok(O.groupsFor(people,'VPrime','gisselle').length);
 assert.ok(O.groupsFor(people,'Infinet').every(g=>g.company==='Infinet'));
});
test('vincula RUT normalizado y rechaza identidades contradictorias o nombres ambiguos',()=>{
 const p={name:'Ana Pérez',rut:'12.345.678-9',company:'T-Sales SpA'};
 assert.equal(O.equipmentFor(p,[{usuario_rut:'12345678-9',empresa:'T-Sales'}],[p]).length,1);
 assert.equal(O.equipmentFor(p,[{usuario_nombre:p.name,usuario_rut:'99999999-9',empresa:'T-Sales'}],[p]).length,0);
 assert.equal(O.equipmentFor(p,[{usuario_nombre:p.name,empresa:'VPrime'}],[p]).length,0);
 assert.equal(O.equipmentFor(p,[{usuario_nombre:'ANA PEREZ',empresa:'T-Sales'}],[p]).length,1);
 assert.equal(O.equipmentFor(p,[{usuario_nombre:p.name,empresa:'T-Sales'}],[p,{...p,id:'otro'}]).length,0);
});
