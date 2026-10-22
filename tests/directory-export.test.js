const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const D=require('../directory-export.js');
const AT='2026-10-16';
const users=[
 {nombre:'Ana',rut:'12345678-9',email:'ana@example.com',empresa:'T Sales',tipo:'Ejecutivo',licencia:'M365',password_usuario:'NO-EXPORTAR'},
 {nombre:'Bruno',rut:'11111111-1',email:'bruno@example.com',empresa:'INFINET TELECOM'},
 {nombre:'Carla',email:'carla@example.com',empresa:'V PRIME SPA'},
 {nombre:'Inactiva',email:'inactive@example.com',empresa:'T-Sales',estado:'inactivo'},
 {nombre:'Bloqueado',email:'blocked@example.com',empresa:'Infinet',accountEnabled:false}
];
test('cuatro opciones exportan todos o una empresa normalizando sus nombres',()=>{
 assert.equal(D.select(users,'todas',[],AT).length,3);
 for(const key of ['tsales','infinet','vprime'])assert.equal(D.select(users,key,[],AT).length,1);
 assert.throws(()=>D.select(users,'otra',[],AT));
});
test('excluye bajas vigentes y conserva salidas futuras o canceladas',()=>{
 const exit={email:'ana@example.com',empresa:'T-Sales',fecha_salida:'2026-10-15'};
 assert.equal(D.select(users,'tsales',[exit],AT).length,0);
 assert.equal(D.select(users,'tsales',[{...exit,fecha_salida:'2026-10-20'}],AT).length,1);
 assert.equal(D.select(users,'tsales',[{...exit,estado:'cancelado'}],AT).length,1);
 assert.equal(D.select(users,'tsales',[{...exit,empresa:'VPrime'}],AT).length,1);
});
test('bajas por RUT y reingresos explícitos, sin usar la fecha de importación',()=>{
 const exit={rut:'12.345.678-9',empresa:'T-Sales',fecha_salida:'15/10/2026'};
 assert.equal(D.isActive(users[0],[exit],AT),false);
 assert.equal(D.isActive({...users[0],created_at:'2026-10-16'},[exit],AT),false);
 assert.equal(D.isActive({...users[0],fecha_reingreso:'2026-10-16'},[exit],AT),true);
 assert.equal(D.isActive(users[0],[{...exit,fecha_salida:''}],AT),false);
});
test('no confunde externos sin RUT y deduplica por correo y empresa',()=>{
 const entries=[...users,{...users[0],email:'ANA@EXAMPLE.COM'},{...users[0],empresa:'VPrime'},{nombre:'Externo',rut:'Sin RUT',email:'external@example.com',empresa:'T-Sales'}];
 assert.equal(D.select(entries,'todas',[],AT).length,5);
 assert.equal(D.isActive(entries.at(-1),[{rut:'Sin RUT',email:'otro@example.com',fecha_salida:'2026-10-01'}],AT),true);
});
test('descarga más filas que una página y solo incluye columnas permitidas',()=>{
 const list=Array.from({length:125},(_,i)=>({...users[0],nombre:'Usuario '+i,email:'u'+i+'@example.com'}));
 const file=D.build(list,'todas',[],AT);
 assert.equal(file.users.length,125);assert.equal(file.csv.split('\r\n').length,126);assert.match(file.filename,/usuarios-activos-todas-las-empresas-2026-10-16\.csv/);
 assert.equal(file.csv.includes('NO-EXPORTAR'),false);assert.equal(file.csv.includes('password_usuario'),false);assert.equal(file.users[0].password_usuario,undefined);
});
test('CSV admite acentos, delimitadores y saltos de línea, neutralizando fórmulas',()=>{
 const data=D.build([{...users[0],nombre:'=FORMULA()',licencia:'Plan "A"; línea\nnueva'}],'tsales',[],AT);
 assert.ok(data.csv.startsWith('\ufeff'));assert.match(data.csv,/'=FORMULA/);assert.ok(data.csv.includes('Plan ""A""; línea\nnueva'));
 assert.equal(D.build([],'infinet',[],AT).users.length,0);
});
test('fechas y estados explícitos se validan sin inferir actividad desde la licencia',()=>{
 assert.equal(D.day('2026-02-30'),null);assert.equal(D.day('16/10/2026'),AT);
 for(const flag of [false,0,'false','0','no'])assert.equal(D.isActive({...users[0],activo:flag},[],AT),false);
 assert.equal(D.isActive({...users[0],licencia:'Unlicensed'},[],AT),true);
 assert.equal(D.isActive(null,[],AT),false);
});
test('cargar un directorio reducido o vacío no repone usuarios borrados',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');const start=source.indexOf('    function loadDirectoryUsers()'),end=source.indexOf('    function saveDirectoryUsers(',start);const code=source.slice(start,end);
 for(const records of [[],[users[0]]]){
  let writes=0;const context=vm.createContext({directoryUsersMemoryCache:null,DEFAULT_DIRECTORY_USERS:Array(50).fill(users[0]),localStorage:{getItem:()=>JSON.stringify(records)},saveDirectoryUsers:()=>writes++,console});vm.runInContext(code,context);assert.equal(context.loadDirectoryUsers().length,records.length);assert.equal(writes,0);
 }
});
