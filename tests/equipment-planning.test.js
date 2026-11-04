'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),P=require('../presentaciones/equipment-planning.js'),R=require('../notebook-renewal.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../presentaciones/Equipos-Inventario-y-Renovacion-Interactiva.html'),'utf8');
const data=JSON.parse(source.match(/id="snapshot">([\s\S]*?)<\/script>/)[1]),rows=R.evaluateAll(data.equipos,{},data.meta.cutoff),urgent=rows.filter(r=>r.priority==='urgente');
assert.equal(rows.length,181);assert.equal(urgent.length,88);assert.equal(P.stages(rows).reduce((n,s)=>n+s.rows.length,0),rows.length);
const a=P.allocate(urgent,5000000,297980);assert.equal(a.selected.length,16);assert.equal(a.total,4767680);assert.equal(a.remainder,232320);assert.equal(a.pending.length,72);assert.equal(a.tax.net+a.tax.iva,a.total);assert.equal(new Set([...a.selected,...a.pending].map(r=>r.eq.id)).size,88);
assert.equal(P.allocate(urgent,0,297980).selected.length,0);assert.equal(P.allocate(urgent,297979,297980).selected.length,0);assert.equal(P.allocate(urgent,297980,297980).selected.length,1);assert.equal(P.allocate(urgent,5000000,297980,70000).selected.length,13);assert.equal(P.allocate([],5000000,297980).remainder,5000000);assert.equal(P.allocate(urgent,5000000,0).selected.length,0);
const lowRam=rows.find(r=>r.ram!==null&&r.ram<16);assert(lowRam);assert.equal(P.comparison(lowRam,R,{ram:'',ssd:'',labor:''},297980).total,null);const c=P.comparison(lowRam,R,{ram:40000,ssd:30000,labor:10000},297980);assert.equal(c.total,50000+(c.ssd?30000:0));assert.equal(P.quality(rows).find(x=>x.name.includes('batería')).count,0);
for(const company of ['T-Sales','Infinet','VPrime']){const r=rows.filter(r=>r.eq.empresa===company);const result=P.allocate(r,5000000,297980);assert(result.selected.every(x=>x.eq.empresa===company));}
for(const m of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('application/json'))new vm.Script(m[2]);
assert(source.includes("'Decisión propuesta'"));assert(source.includes('page<titles.length-1'));console.log('OK: 181 equipos; 4 etapas; simulador, impuestos, saldos, filtros, cotización pendiente y sintaxis.');
// Smoke-test all generated sections with a minimal document fixture (not a visual browser test).
class ElementFixture{
 constructor(){this.innerHTML='';this.textContent='';this.value='';this.dataset={};this.style={};this.open=false;}
 get firstElementChild(){return this.child||(this.child=new ElementFixture());}
 querySelector(){return new ElementFixture();} querySelectorAll(){return [];}
 append(){} after(){} remove(){} insertAdjacentHTML(position,html){this.innerHTML+=html;}
 setAttribute(){} removeAttribute(){} focus(){} setSelectionRange(){} click(){} showModal(){this.open=true;} close(){this.open=false;}
}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new ElementFixture());return elements.get(id);};get('snapshot').textContent=JSON.stringify(data);
const context={document:{getElementById:get,createElement:()=>new ElementFixture(),querySelectorAll:()=>[],documentElement:new ElementFixture()},Intl,Blob,URL,setTimeout,clearTimeout};context.window=context;context.globalThis=context;vm.createContext(context);
for(const m of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('application/json'))vm.runInContext(m[2],context);
for(const company of ['','T-Sales','Infinet','VPrime','Empresa sin registros'])for(let page=0;page<15;page++){vm.runInContext(`company=${JSON.stringify(company)};page=${page};render();`,context);assert.equal(get('counter').textContent,`${page+1} / 15`);}
vm.runInContext('company="";page=11;render()',context);assert(get('stage').firstElementChild.innerHTML.includes('16'));
console.log('OK: generación de las 15 secciones en consolidado, por empresa y sin registros.');
