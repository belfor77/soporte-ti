const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('/Users/belfor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
// Ejecutar desde cualquier carpeta. Usa Chrome instalado y bloquea todos los servicios externos.
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'auditoria-soporte-2026-10-27');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
  if (!p.startsWith(root + '/') || p.includes('/.git/')) {res.writeHead(403);res.end();return;}
  fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(data);});
});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const sampleTickets = [
  {id:'audit-a',codigo:'AUDIT-001',asunto:'Correo de prueba',descripcion:'Registro sintético de auditoría',empresa:'T-Sales',categoria:'software',estado:'abierto',prioridad:'media',cliente_nombre:'Persona Prueba',cliente_email:'persona@example.invalid',created_at:'2026-10-26T14:00:00Z'},
  {id:'audit-b',codigo:'AUDIT-002',asunto:'Red de prueba',descripcion:'Registro sintético',empresa:'Infinet',categoria:'red',estado:'en_progreso',prioridad:'alta',tecnico_asignado:'Técnico Prueba',cliente_nombre:'Otra Persona',cliente_email:'otra@example.invalid',created_at:'2026-10-26T15:00:00Z'},
  {id:'audit-c',codigo:'AUDIT-003',asunto:'Equipo de prueba',descripcion:'Registro sintético',empresa:'VPrime',categoria:'hardware',estado:'resuelto',prioridad:'baja',tecnico_asignado:'Técnico Prueba',created_at:'2026-10-25T15:00:00Z',fecha_resolucion:'2026-10-26T16:00:00Z'}
];
const sampleEquipment = [{id:'audit-eq',nombre_codigo:'AUD-EQ',tipo:'Notebook',serial:'AUDIT-SERIAL',marca:'Lenovo',modelo:'Prueba',empresa:'T-Sales',estado:'disponible',ram:'16 GB',cpu:'Intel Core i5-10210U',disco:'256 GB SSD',so:'Windows 11',created_at:'2026-10-20T14:00:00Z'}];
const result={date:'2026-10-27',mode:'Aislado, datos sintéticos, sin llamadas a Supabase/Graph',scenarios:[]};
let browser;
async function scenario(name,session=null,extra={},mobile=false,stub=false) {
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,locale:'es-CL',timezoneId:'America/Santiago',serviceWorkers:'block'});
  const blocked=[], errors=[], dialogs=[];
  context.setDefaultTimeout(4000);
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(url.startsWith(base))return route.continue();
    blocked.push({host:new URL(url).host,method:route.request().method()});
    if(stub && url.includes('@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:`window.__auditCalls=[];window.supabase={createClient(){return {from(table){let operation='select';const q=new Proxy({}, {get(o,k){if(k==='then')return resolve=>{window.__auditCalls.push({table,operation});resolve({data:[],error:null});};return (...args)=>{if(['insert','update','upsert','delete'].includes(k))operation=k;return q;};}});return q;},channel(){return {on(){return this},subscribe(){return this}}}}}};`});
    if(url.endsWith('.css'))return route.fulfill({contentType:'text/css',body:''});
    return route.abort();
  });
  await context.addInitScript(({session,extra,tickets,equipment})=>{
    localStorage.setItem('company_directory_users',JSON.stringify([]));
    localStorage.setItem('local_tickets',JSON.stringify(tickets));
    localStorage.setItem('local_equipos',JSON.stringify(equipment));
    if(session)localStorage.setItem('session_soporte',JSON.stringify(session));
    for(const [k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));
  },{session,extra,tickets:sampleTickets,equipment:sampleEquipment});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});
  await page.goto(base,{waitUntil:'load'});
  await sleep(400);
  const snapshot=async()=>page.evaluate(()=>{
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const scope=document.querySelector('.page-section.active-page');
    return {activePage:scope?.id,loginVisible:visible(document.getElementById('login-modal')),role:document.getElementById('header-user-role')?.textContent,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,unlabelledButtons:[...(scope||document).querySelectorAll('button')].filter(visible).filter(e=>!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.title).map(e=>e.id||e.className).slice(0,15),unlabelledInputs:[...(scope||document).querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.id).slice(0,20)};
  });
  const row={name,initial:await snapshot(),pages:[],errors,dialogs,blocked};result.scenarios.push(row);
  return {context,page,row,snapshot};
}
let base;
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const login=await scenario('Inicio sin sesión');
  const row=login.row;
  row.firstFocus=await login.page.evaluate(()=>document.activeElement.id||document.activeElement.tagName);
  await login.page.keyboard.press('Tab');
  row.firstTab=await login.page.evaluate(()=>({id:document.activeElement.id,insideLogin:!!document.activeElement.closest('#login-modal')}));
  await login.page.screenshot({path:path.join(out,'01-login.png')});
  await login.context.close();
  const forged=await scenario('Sesión local con correo que contiene nombre de administrador',{role:'user',nombre:'Auditoría local',email:'omar.auditoria@example.invalid'});
  forged.row.savedRole=await forged.page.evaluate(()=>JSON.parse(localStorage.getItem('session_soporte')).role);
  await forged.context.close();
  const regular=await scenario('Rol ejecutivo simulado',{role:'user',nombre:'Ejecutivo Prueba',email:'ejecutivo@example.invalid'});
  regular.row.visibleNavigation=await regular.page.locator('.sidebar-nav li:visible').evaluateAll(es=>es.map(e=>({id:e.id,label:e.innerText.trim()})));
  await regular.context.close();
  const tech=await scenario('Técnico escritorio sin CDN',{role:'technician',nombre:'Técnico Prueba',email:'tecnico@example.invalid'});
  const navIds=['nav-inicio','nav-mis-tickets','nav-todos-tickets','nav-crear-ticket','nav-sla','nav-base-conocimientos','nav-faq','nav-usuarios','nav-equipos','nav-compras','nav-tecnicos','nav-reportes','nav-estado','nav-visitas','nav-categorias','nav-plantillas','nav-ajustes'];
  for(const id of navIds){try{await tech.page.locator('#'+id+' a').click({timeout:2500});await sleep(90);tech.row.pages.push({nav:id,...await tech.snapshot()});}catch(e){tech.row.pages.push({nav:id,error:e.message.split('\n')[0]});}}
  await tech.page.locator('#nav-crear-ticket a').click();
  await tech.page.locator('#ticket-subject').fill('Auditoría local, sin envío a producción');
  await tech.page.locator('#ticket-category').selectOption({index:1});
  await tech.page.locator('.company-card[data-company="T-Sales"]').click();
  await tech.page.locator('#ticket-office').selectOption({index:1});
  await tech.page.locator('#ticket-description').fill('Descripción de prueba, sin datos reales.');
  const chooserPromise=tech.page.waitForEvent('filechooser');
  await tech.page.locator('.file-upload-zone').click();
  const chooser=await chooserPromise;
  await chooser.setFiles({name:'evidencia-auditoria.txt',mimeType:'text/plain',buffer:Buffer.from('Archivo sintético de auditoría')});
  await tech.page.locator('#btn-stepper-next').click();
  await tech.page.locator('#btn-user-mode-new').click();
  await tech.page.locator('#ticket-client-name').fill('');
  await tech.page.locator('#ticket-client-rut').fill('');
  await tech.page.locator('#ticket-client-email').fill('');
  await tech.page.locator('#btn-stepper-next').click();
  tech.row.missingPersonCanReachReview=await tech.page.locator('#step-panel-3').isVisible();
  await tech.page.locator('#btn-stepper-next').click();await sleep(200);
  tech.row.createdLocalTicket=await tech.page.evaluate(()=>{const ts=JSON.parse(localStorage.getItem('local_tickets'));return ts.find(t=>t.asunto.includes('Auditoría local'));});
  tech.row.attachmentsStored=JSON.stringify(tech.row.createdLocalTicket).includes('evidencia-auditoria.txt');
  await tech.page.locator('#nav-inicio a').click();
  await sleep(850);
  await tech.page.screenshot({path:path.join(out,'02-inicio-escritorio.png')});
  await tech.context.close();
  const mobile=await scenario('Técnico móvil 390 px',{role:'technician',nombre:'Técnico Prueba',email:'tecnico@example.invalid'},{},true);
  const mobTargets=['page-inicio','page-mis-tickets','page-crear-ticket','page-base-conocimientos','page-compras','page-reportes','page-sla'];
  for(const id of mobTargets){await mobile.page.evaluate(id=>document.querySelector(`.sidebar-nav a[data-page="${id}"]`)?.click(),id);await sleep(100);mobile.row.pages.push(await mobile.snapshot());}
  await mobile.page.evaluate(()=>document.querySelector('#nav-crear-ticket a').click());
  await sleep(850);
  mobile.row.createFormVisibleInFirstViewport=await mobile.page.locator('#ticket-subject').evaluate(e=>e.getBoundingClientRect().top<innerHeight);
  mobile.row.companySelectorHeight=await mobile.page.locator('.company-scope').evaluate(e=>Math.round(e.getBoundingClientRect().height));
  await mobile.page.screenshot({path:path.join(out,'03-crear-ticket-movil.png')});
  await mobile.context.close();
  const stub=await scenario('Inicio sin sesión con Supabase simulado sin registros',null,{'company_directory_users':[{nombre:'Registro antiguo',email:'antiguo@example.invalid',empresa:'T-Sales'}]},false,true);
  stub.row.calls=await stub.page.evaluate(()=>window.__auditCalls);
  await stub.context.close();
  const xss=await scenario('Texto de estado interpretado como HTML, solo marcador local',{role:'technician',nombre:'Técnico Prueba',email:'tecnico@example.invalid'},{local_tickets:[{...sampleTickets[0],estado:'<img src="/audit-image-missing" onerror="window.__auditHtmlExecuted=true">'}]});
  await xss.page.locator('#nav-todos-tickets a').click();await sleep(200);
  xss.row.htmlExecuted=await xss.page.evaluate(()=>window.__auditHtmlExecuted===true);
  await xss.context.close();
  const states=await scenario('Filtro de estado con valor creado por el formulario',{role:'technician',nombre:'Técnico Prueba',email:'tecnico@example.invalid'});
  await states.page.locator('#nav-todos-tickets a').click();
  states.row.allRows=await states.page.locator('#tickets-table-body tr').count();
  await states.page.locator('.tickets-filter-tabs [data-filter="en progreso"]').click();
  states.row.progressFilterText=await states.page.locator('#tickets-table-body').innerText();
  await states.page.evaluate(()=>document.querySelector('#nav-todos-tickets a').click());
  await states.page.locator('#tickets-table-body tr').filter({hasText:'Red de prueba'}).locator('.action-view').click();await sleep(100);
  states.row.detailStateValue=await states.page.locator('#modal-ticket-status-select').count()?await states.page.locator('#modal-ticket-status-select').inputValue():null;
  states.row.respondedStepText=await states.page.locator('#t-step-respondido-time').innerText();
  await states.context.close();
  fs.writeFileSync(path.join(out,'resultados-navegador.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result.scenarios.map(s=>({name:s.name,errors:s.errors,pages:s.pages?.length,htmlExecuted:s.htmlExecuted,progressFilterText:s.progressFilterText,companySelectorHeight:s.companySelectorHeight,createFormVisibleInFirstViewport:s.createFormVisibleInFirstViewport})),null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
