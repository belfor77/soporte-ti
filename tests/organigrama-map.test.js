const {test}=require('node:test'),assert=require('node:assert/strict');
const {layout}=require('../organigrama-map.js');
const groups=[{key:'a',company:'T-Sales',members:Array.from({length:40},(_,i)=>({id:String(i)}))},{key:'b',company:'T-Sales',members:[{id:'other'}]},{key:'c',company:'VPrime',members:[]}];
test('mapa despliega exclusivamente las ramas seleccionadas con conexiones completas',()=>{
 assert.equal(layout(groups,new Set(),new Set()).nodes.length,2);
 const company=layout(groups,new Set(['T-Sales']),new Set());assert.equal(company.nodes.length,4);assert.equal(company.edges.length,2);
 const team=layout(groups,new Set(['T-Sales']),new Set(['a']));assert.equal(team.nodes.filter(n=>n.type==='person').length,40);assert.equal(team.edges.length,42);
 const positions=team.nodes.filter(n=>n.type==='person').map(n=>n.x+','+n.y);assert.equal(new Set(positions).size,40);
 assert.ok(team.nodes.filter(n=>n.type==='person').every(n=>n.x<team.width&&n.y<team.height));
});
