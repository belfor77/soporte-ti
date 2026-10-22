const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
test('los informes ocultos no recalculan; los cambios visibles se agrupan en un frame',()=>{
 let visible=false,frames=[],reports=0,operations=0;
 const context=vm.createContext({tiEvolutionPanel:{render(){}},managementSourcesLoading:false,managementRenderQueued:false,document:{getElementById:()=>({classList:{contains:()=>visible}})},requestAnimationFrame:f=>frames.push(f),supportInsightsPanel:{render(){reports++;}},tiOperationsPanel:{render(){operations++;}}});
 const a=source.indexOf('    function renderManagementInsights()'),b=source.indexOf('    // Los accesos rápidos',a);vm.runInContext(source.slice(a,b),context);
 context.renderManagementInsights();assert.equal(frames.length,0);
 visible=true;context.renderManagementInsights();context.renderManagementInsights();assert.equal(frames.length,1);frames.shift()();assert.equal(reports,1);assert.equal(operations,1);
 context.renderManagementInsights();visible=false;frames.shift()();assert.equal(reports,1);
 visible=true;context.managementSourcesLoading=true;context.renderManagementInsights();assert.equal(frames.length,0);
});
test('el índice del directorio mantiene coincidencias por correo, RUT y nombre e invalida al reemplazar datos',()=>{
 let users=[{nombre:'Primero',rut:'12.345.678-9',email:'uno@ejemplo.cl'},{nombre:'Segundo',rut:'98.765.432-1',email:'dos@ejemplo.cl'}];
 const context=vm.createContext({loadDirectoryUsers:()=>users,normalizeStr:s=>String(s||'').toLowerCase().trim()});
 const a=source.indexOf('    let directoryIdentityIndex = null;'),b=source.indexOf('    function loadDirectoryUsers()',a);vm.runInContext(source.slice(a,b),context);
 assert.equal(context.findDirectoryIdentity({cliente_email:'DOS@EJEMPLO.CL'}).nombre,'Segundo');
 assert.equal(context.findDirectoryIdentity({cliente_rut:'123456789'}).nombre,'Primero');
 assert.equal(context.findDirectoryIdentity({cliente_nombre:'Segundo'}).email,'dos@ejemplo.cl');
 assert.equal(context.findDirectoryIdentity({cliente_email:'dos@ejemplo.cl',cliente_nombre:'Primero'}).nombre,'Primero');
 users=[{nombre:'Reemplazo',email:'dos@ejemplo.cl'}];assert.equal(context.findDirectoryIdentity({cliente_email:'dos@ejemplo.cl'}).nombre,'Reemplazo');
 assert.equal(context.findDirectoryIdentity({cliente_nombre:'No existe'}),undefined);
});
