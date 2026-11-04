const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
function fixture(company=''){
 const nodes={'visitas-dia-panel':{style:{}},'visitas-dia-lista':{innerHTML:'',querySelectorAll:()=>[]},'visitas-dia-title':{innerHTML:'',textContent:''}};
 const visits=Array.from({length:12},(_,i)=>({fecha:'2026-10-15',empresa:i%2?'Infinet':'T-Sales',nombre_tecnico:`Técnico ${i+1}`,ubicacion:'Sucursal de prueba'}));
 visits.push({fecha:'2026-10-16',empresa:'T-Sales',nombre_tecnico:'Otro día'});
 const ctx=vm.createContext({cachedVisits:visits,companyRows:rows=>rows.filter(r=>!company||r.empresa===company),escapeHtml:s=>String(s).replace(/[<>]/g,c=>c==='<'?'&lt;':'&gt;'),document:{getElementById:id=>nodes[id]}});
 const start=source.indexOf('    function renderDayVisitsPanel('),end=source.indexOf('    async function deleteVisit(',start);vm.runInContext(source.slice(start,end),ctx);return {ctx,nodes};
}
test('día seleccionado muestra todos los técnicos, sin límite ni filas de otro día',()=>{const {ctx,nodes}=fixture();ctx.renderDayVisitsPanel('2026-10-15');const html=nodes['visitas-dia-lista'].innerHTML;for(let i=1;i<=12;i++)assert(html.includes(`Técnico ${i}</strong>`));assert(!html.includes('Otro día'));assert(nodes['visitas-dia-title'].innerHTML.includes('(12)'));assert.equal(nodes['visitas-dia-panel'].style.display,'block');});
test('detalle del día respeta la empresa seleccionada',()=>{const {ctx,nodes}=fixture('Infinet');ctx.renderDayVisitsPanel('2026-10-15');assert(nodes['visitas-dia-title'].innerHTML.includes('(6)'));assert(!nodes['visitas-dia-lista'].innerHTML.includes('T-Sales'));});
test('día vacío e inicio limpian el detalle anterior y explican qué hacer',()=>{const {ctx,nodes}=fixture();ctx.renderDayVisitsPanel('2026-10-15');ctx.renderDayVisitsPanel('2026-10-18');assert(nodes['visitas-dia-lista'].innerHTML.includes('No hay visitas'));assert(!nodes['visitas-dia-lista'].innerHTML.includes('Técnico 1'));ctx.renderDayVisitsPanel(null);assert(nodes['visitas-dia-lista'].innerHTML.includes('Toca un día'));});
