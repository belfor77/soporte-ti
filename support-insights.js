/* Gestión TI: mediciones, registros y proyecciones con trazabilidad explícita. */
(function(root){
'use strict';
const Renewal = root.NotebookRenewal || (typeof require === 'function' ? require('./notebook-renewal.js') : null);
const Quality = root.SupportDataQuality || (typeof require === 'function' ? require('./support-demo-registry.js') : null);
// Las fechas de tickets no dependen de la carga del módulo de inventario.
function dateOnly(value){
 if(!value)return null;
 const match=String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
 if(!match)return null;
 const d=new Date(Date.UTC(+match[1],+match[2]-1,+match[3]));
 return d.getUTCFullYear()===+match[1]&&d.getUTCMonth()===+match[2]-1&&d.getUTCDate()===+match[3]?d:null;
}
const STORE='support-management-evidence-v1';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayMs=86400000;
const chileDateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'});
const keyDate=d=>chileDateFormatter.formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]).reduce((a,[k,v])=>(a[k]=v,a),{});
function today(){const p=keyDate(new Date());return `${p.year}-${p.month}-${p.day}`;}
function date(v){if(!v)return null;if(typeof v==='string'&&(!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v)||!dateOnly(v.slice(0,10))))return null;const d=new Date(v);return Number.isFinite(+d)?d:null;}
const civilCache=new Map();
function uncachedCivil(v){if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v))return validDay(v);const d=date(v);if(!d)return null;const p=keyDate(d);return `${p.year}-${p.month}-${p.day}`;}
function civil(v){if(typeof v!=='string')return uncachedCivil(v);if(civilCache.has(v))return civilCache.get(v);const result=uncachedCivil(v);if(civilCache.size>=10000)civilCache.clear();civilCache.set(v,result);return result;}
function civilDay(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:civil(v);}
function validDay(v){return dateOnly(v)?v:null;}
function shift(v,n){const d=dateOnly(v);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function inPeriod(v,start,end){const d=civilDay(v);return !!d&&d>=start&&d<=end;}
function company(v){const n=norm(v).replace(/[^a-z0-9]/g,'');return n.includes('tsales')?'T-Sales':n.includes('vprime')?'VPrime':n.includes('infinet')?'Infinet':String(v||'Sin empresa').trim();}
const money=v=>v===null||v===undefined?'Sin monto':new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(v);
function amount(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
const mean=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
const duration=n=>n===null?'Sin medición':n<60?`${Math.round(n)} min`:`${(n/60).toFixed(1).replace('.',',')} h`;
const resolved=t=>['resuelto','cerrado'].includes(norm(t.estado));
const resolvedDate=t=>date(t.fecha_resolucion||t.resolved_at||t.closed_at);
const responseDate=t=>date(t.primera_respuesta_at||t.first_response_at||t.fecha_primera_respuesta);
const deadline=t=>date(t.sla_resolucion_limite||t.resolution_due_at||t.sla_deadline);
function ticketSla(t,at=new Date()){
 const due=deadline(t),start=date(t.created_at);if(!due||!start||due<start||start>at)return 'sin_medicion';
 const ended=resolved(t)?resolvedDate(t):at;if(!ended||ended<start||ended>at)return 'sin_medicion';
 return +ended>+due?'incumplido':resolved(t)?'cumplido':+due-+at<=30*60000?'riesgo':'en_plazo';
}
function ticketMetrics(tickets,at=new Date()){
 const times=[],responses=[],ratings=[],sla={cumplido:0,incumplido:0,riesgo:0,en_plazo:0,sin_medicion:0};let closed=0,old=0;
 for(const t of tickets){
  const start=date(t.created_at),end=resolvedDate(t),response=responseDate(t);
  if(resolved(t)){closed++;if(start&&end&&end>=start&&end<=at)times.push((end-start)/60000);}
  else if(start&&(+at-start)/dayMs>=7)old++;
  if(start&&response&&response>=start&&response<=at)responses.push((response-start)/60000);
  const r=amount(t.satisfaction_rating??t.satisfaccion);if(r!==null&&r>=1&&r<=5)ratings.push(r);
  sla[ticketSla(t,at)]++;
 }
 const measured=sla.cumplido+sla.incumplido;
 // Incumplimientos de pendientes se muestran como alertas, no en cumplimiento de cerrados.
 const closedMeasured=tickets.filter(t=>resolved(t)&&ticketSla(t,at)!=='sin_medicion');
 const closedMet=closedMeasured.filter(t=>ticketSla(t,at)==='cumplido').length;
 return {received:tickets.length,resolved:closed,pending:tickets.length-closed,old,resolution:mean(times),resolutionN:times.length,response:mean(responses),responseN:responses.length,satisfaction:ratings.length?mean(ratings)/5*100:null,satisfactionN:ratings.length,sla,compliance:closedMeasured.length?closedMet/closedMeasured.length*100:null,complianceN:closedMeasured.length};
}
function afterBefore(event,tickets,days=30,asOf=today()){
 const eventDay=validDay(event.date),email=norm(event.email);if(!eventDay||!email)return {status:'Falta fecha o correo del ejecutivo',before:null,after:null,change:null};
 const start=shift(eventDay,-days),beforeEnd=shift(eventDay,-1),afterStart=shift(eventDay,1),end=shift(eventDay,days);
 // La persona afectada es diferente del técnico que creó el ticket.
 const matched=tickets.filter(t=>norm(t.cliente_email||t.affected_email)===email&&company(t.empresa)===company(event.company));
 const before=matched.filter(t=>inPeriod(t.created_at,start,beforeEnd));
 const after=matched.filter(t=>inPeriod(t.created_at,afterStart,end));
 const full=asOf>=end;
 const covered=event.coverage===true && (event.coverageDays || 30)>=days;
 const change=full&&covered&&before.length>0?(after.length-before.length)/before.length*100:null;
 const status=!full?'Período posterior en curso':!covered?'Cobertura del historial sin confirmar':before.length===0?'Sin base previa para calcular variación':'Comparación descriptiva disponible';
 return {status,before:before.length,after:after.length,change,start,beforeEnd,afterStart,end,full,covered,idsBefore:before.map(t=>t.id),idsAfter:after.map(t=>t.id)};
}
function normalizeEvent(e){
 if(!e||typeof e!=='object'||!validDay(e.date)||!['reemplazo','ram','ssd','reparacion','reasignacion'].includes(e.type)||!String(e.serial||'').trim()||!String(e.evidence||'').trim())throw Error('La intervención requiere fecha válida, tipo, serial y referencia de respaldo.');
 const cost=amount(e.cost);if(e.cost!==null&&e.cost!==undefined&&e.cost!==''&&cost===null)throw Error('El costo debe ser un monto CLP válido.');
 return {id:String(e.id||''),date:e.date,type:e.type,serial:String(e.serial).trim(),email:norm(e.email),company:company(e.company),cost,evidence:String(e.evidence).trim(),result:String(e.result||'').trim(),coverage:e.coverage===true,coverageDays:[30,60,90].includes(Number(e.coverageDays))?Number(e.coverageDays):30,actor:String(e.actor||''),source:e.source||'Registro manual local'};
}
function normalizeQuote(q){
 if(!q||typeof q!=='object'||!validDay(q.date)||!validDay(q.until)||q.until<q.date||amount(q.unit)===null||Number(q.unit)<=0||!String(q.reference||'').trim()||!String(q.vendor||'').trim())throw Error('La cotización requiere monto unitario positivo, proveedor, referencia y fechas válidas.');
 return {id:String(q.id||''),company:company(q.company),unit:Number(q.unit),date:q.date,until:q.until,vendor:String(q.vendor).trim(),reference:String(q.reference).trim(),scope:String(q.scope||'').trim()};
}
function plan(rows,quotes,asOf=today()){
 const buckets={ahora:[],seis:[],doce:[]};
 for(const row of rows){if(row.months===null||row.months>12)continue;const bucket=row.months===0?'ahora':row.months<=6?'seis':'doce';buckets[bucket].push(row);}
 const groups=[];
 for(const [bucket,items] of Object.entries(buckets)){
  const companies=[...new Set(items.map(r=>company(r.eq.empresa)))];
  for(const comp of companies){const members=items.filter(r=>company(r.eq.empresa)===comp);const quote=quotes.filter(q=>q.company===comp&&q.date<=asOf&&q.until>=asOf&&q.unit>0).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;groups.push({bucket,company:comp,count:members.length,quote,total:quote?quote.unit*members.length:null,rows:members});}
 }
 return {groups,knownTotal:groups.some(g=>g.total!==null)?groups.reduce((n,g)=>n+(g.total||0),0):null,unquoted:groups.filter(g=>g.total===null).reduce((n,g)=>n+g.count,0),count:groups.reduce((n,g)=>n+g.count,0)};
}
function grouped(items,key){const m=new Map();items.forEach(v=>{const k=key(v)||'Sin dato';m.set(k,(m.get(k)||0)+1);});return [...m].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));}
function build(data,filter,records,policy){
 const asOf=filter.asOf||today(),start=filter.start,end=filter.end,comp=filter.company||'';
 const rawTickets=Array.isArray(data.tickets)?data.tickets:[],rawEq=Array.isArray(data.equipos)?data.equipos:[],rawPurchases=Array.isArray(data.compras)?data.compras:[];
 const tickets=Quality.real(rawTickets,'tickets').filter(t=>!comp||company(t.empresa)===comp);
 const periodTickets=tickets.filter(t=>inPeriod(t.created_at,start,end)&&civil(t.created_at)<=asOf);
 const eqs=Quality.real(rawEq,'equipos').filter(e=>!comp||company(e.empresa)===comp);
 const renewal=Renewal.evaluateAll(eqs,policy,asOf);
 const purchases=Quality.real(rawPurchases,'compras').filter(c=>(!comp||company(c.empresa)===comp)&&inPeriod(c.fecha,start,end)&&!['cancelado','cancelada','anulado','anulada'].includes(norm(c.estado)));
 const events=records.events.filter(e=>(!comp||e.company===comp)&&inPeriod(e.date,start,end)&&e.date<=asOf);
 const recoveries=events.filter(e=>e.type!=='reemplazo');
 const costs=recoveries.map(e=>e.cost).filter(v=>v!==null);
 const buckets={urgente:0,planificar:0,mantener:0,revisar:0};renewal.forEach(r=>buckets[r.priority]++);
 const at=asOf===today()?new Date():date(asOf+'T23:59:59Z');
 const monthly=grouped(periodTickets,t=>civil(t.created_at)?.slice(0,7));monthly.sort((a,b)=>a.label.localeCompare(b.label));
 const invalidDates=tickets.filter(t=>!date(t.created_at)||civil(t.created_at)>asOf).length;
 return {asOf,start,end,company:comp,renewal,buckets,tickets,periodTickets,purchases,events,recoveries,recovered:new Set(recoveries.map(e=>norm(e.serial))).size,recoveryCost:costs.length?costs.reduce((a,b)=>a+b,0):null,recoveryCostUnknown:recoveries.length-costs.length,metrics:ticketMetrics(periodTickets,at),companyCases:grouped(periodTickets,t=>company(t.empresa)),categories:grouped(periodTickets,t=>t.categoria),monthly,plan:plan(renewal,records.quotes,asOf),excluded:rawTickets.length-Quality.real(rawTickets,'tickets').length+rawEq.length-Quality.real(rawEq,'equipos').length+rawPurchases.length-Quality.real(rawPurchases,'compras').length,invalidDates};
}
function csvCell(v){let t=String(v??'');if(/^\s*[=+@-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}
function reportCsv(report,comparisons,sources){
 const rows=[['Sección','Indicador / referencia','Valor','Detalle / calidad','Desde','Hasta'],['Contexto','Empresa',report.company||'Todas','Inventario al '+report.asOf,report.start,report.end]];
 for(const [key,value] of Object.entries(sources||{}))rows.push(['Fuentes',key,value,'Estado de carga','','']);
 const m=report.metrics;
 for(const [key,value] of Object.entries({Recibidos:m.received,Resueltos:m.resolved,Pendientes:m.pending,'Pendientes >=7 días':m.old,'Respuesta promedio':duration(m.response),'Resolución promedio':duration(m.resolution),'Notebooks recuperados / reutilizados':report.recovered,'Costos de intervenciones conocidos':report.recoveryCost===null?'Sin monto':report.recoveryCost}))rows.push(['Resumen',key,value,`Respuesta: n=${m.responseN}; resolución: n=${m.resolutionN}`,report.start,report.end]);
 for(const r of report.renewal)rows.push(['Inventario',r.eq.serial||r.eq.nombre_codigo,r.priority,`${r.eq.modelo||''}; ${r.months===null?'Sin estimación':r.months+' meses'}; ${r.reasons.join(' ')}; Pendientes: ${r.missing.join('; ')}`,report.asOf,report.asOf]);
 for(const g of report.plan.groups)rows.push(['Presupuesto',g.company+' / '+g.bucket,g.total===null?'Sin cotización':g.total,`${g.count} equipos; ${g.quote?g.quote.vendor+' / '+g.quote.reference+' / válido hasta '+g.quote.until:'Monto pendiente'}`,report.asOf,'']);
 for(const e of report.events)rows.push(['Intervención',e.serial,e.type,`${e.company}; costo=${e.cost===null?'sin monto':e.cost}; respaldo=${e.evidence}; resultado=${e.result}; fuente=${e.source}`,e.date,e.date]);
 for(const {event,comparison:c} of comparisons)rows.push(['Antes / después',event.serial,c.change===null?'Sin variación concluyente':c.change.toFixed(1)+'%',`Antes=${c.before}; después=${c.after}; ${c.status}; asociación por correo del afectado; no prueba causalidad`,c.start,c.end]);
 for(const t of report.periodTickets)rows.push(['Tickets',t.codigo||t.id,t.estado,`${company(t.empresa)}; ${t.categoria||'Sin categoría'}; ${t.asunto||''}`,civil(t.created_at),civil(resolvedDate(t))]);
 return '\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');
}
const TYPES={reemplazo:'Cambio de notebook',ram:'Ampliación de RAM',ssd:'Instalación de SSD',reparacion:'Reparación completada',reasignacion:'Reasignación / reutilización'};
const PRIORITIES={urgente:'Renovar ahora',planificar:'Planificar / ampliar',mantener:'Dentro de criterios',revisar:'Completar evaluación'};
function init({getData,getSources,refresh,openEquipo,openTicket,getActor}){
 const host=document.getElementById('management-report');if(!host)return null;
 const el=id=>document.getElementById('mg-'+id);
 let records={events:[],quotes:[]},report=null,comparisons=[],activePriority='',activeTicketGroup=null,editingEvent='',editingQuote='';
 const executive = root.ManagementPresentation?.init({host,getReport:()=>report,getData,getQuotes:()=>records.quotes,getSources});
 let storageProblem=false,rawSaved=null;
 try{rawSaved=localStorage.getItem(STORE);const saved=JSON.parse(rawSaved||'{"events":[],"quotes":[]}');records={events:(saved.events||[]).map(normalizeEvent),quotes:(saved.quotes||[]).map(normalizeQuote)};}catch(_){storageProblem=true;}
 const start=shift(today(),-89);el('start').value=start;el('end').value=today();el('event-date').max=today();el('event-date').value=today();el('quote-date').value=today();el('quote-until').value=shift(today(),30);
 function message(text){el('message').textContent=text;}
 function save(next,repair=false){if(storageProblem&&!repair){message('El registro local no se pudo leer. Descarga su respaldo original e importa un archivo válido antes de guardar cambios.');return false;}try{localStorage.setItem(STORE,JSON.stringify(next));records=next;storageProblem=false;return true;}catch(_){message('No se pudo guardar el registro. Descarga un respaldo y revisa el almacenamiento del navegador.');return false;}}
 function policy(){try{return Renewal.config(JSON.parse(localStorage.getItem('notebook-renewal-policy-v1')||'{}'));}catch(_){return Renewal.config();}}
 function bars(target,items,onClick){
  const max=Math.max(1,...items.map(i=>i.count));
  el(target).innerHTML=items.length?items.map((i,index)=>`<button type="button" class="mg-bar" data-bar-index="${index}"><span>${esc(i.label)}</span><span class="mg-bar-track"><span style="width:${i.count/max*100}%"></span></span><strong>${i.count}</strong></button>`).join(''):'<p class="mg-empty">Sin registros en este período.</p>';
  el(target).onclick=event=>{const button=event.target.closest('[data-bar-index]');if(button&&onClick)onClick(items[Number(button.dataset.barIndex)]);};
 }
 function equipmentTable(){
  const rows=report.renewal.filter(r=>!activePriority||r.priority===activePriority);
  el('inventory-filter').textContent=activePriority?PRIORITIES[activePriority]:'Todos los notebooks vigentes';
  el('inventory-rows').innerHTML=rows.slice(0,150).map(r=>`<tr><td><strong>${esc(r.eq.nombre_codigo||r.eq.serial)}</strong><small>${esc(r.eq.serial)} · ${esc(r.eq.usuario_nombre||'Sin asignar')}</small></td><td>${esc(company(r.eq.empresa))}<small>${esc(r.eq.modelo||'Sin modelo')}</small></td><td><span class="mg-tag mg-${r.priority}">${PRIORITIES[r.priority]}</span><small>${r.months===null?'Sin plazo calculable':r.months===0?'Umbral alcanzado':r.months+' meses hasta umbral'}</small></td><td>${esc(r.reasons.join(' '))}<small>${esc(r.missing.join(' · '))}</small></td><td><button type="button" data-eq="${report.renewal.indexOf(r)}">Ver ficha</button></td></tr>`).join('')||'<tr><td colspan="5">Sin equipos que coincidan.</td></tr>';
  el('inventory-limit').textContent=rows.length>150?`Se muestran 150 de ${rows.length}. La exportación incluye todos.`:`${rows.length} equipos · Criterios: ${policy().serviceYears} años de uso y ${policy().cpuYears} años de CPU. RAM mínima: ${policy().minRam} GB. Ajustables en SLA.`;
 }
 function ticketsTable(){
  const selected=report.periodTickets.filter(t=>{if(!activeTicketGroup)return true;if(activeTicketGroup.kind==='company')return company(t.empresa)===activeTicketGroup.value;if(activeTicketGroup.kind==='month')return civil(t.created_at)?.startsWith(activeTicketGroup.value);return String(t.categoria||'Sin dato')===activeTicketGroup.value;});
  el('ticket-filter').textContent=activeTicketGroup?`Filtro: ${activeTicketGroup.value}`:'Todos los tickets del período';
  el('ticket-rows').innerHTML=selected.slice(0,100).map(t=>`<tr><td><button type="button" data-ticket="${report.periodTickets.indexOf(t)}">${esc(t.codigo||t.id)}</button></td><td>${esc(t.asunto||'Sin asunto')}<small>${esc(t.cliente_nombre||'Afectado sin registrar')}</small></td><td>${esc(company(t.empresa))}<small>${esc(t.categoria||'Sin categoría')}</small></td><td>${esc(t.estado)}<small>Creado: ${esc(civil(t.created_at))}</small></td><td>${resolvedDate(t)?esc(civil(resolvedDate(t))):'Sin cierre medido'}</td></tr>`).join('')||'<tr><td colspan="5">Sin tickets que coincidan.</td></tr>';
  el('ticket-limit').textContent=`${selected.length} tickets; se muestran hasta 100. La exportación contiene el período completo.`;
 }
 function comparisonView(){
  const id=el('comparison-event').value,days=Number(el('comparison-days').value);
  const events=report.events;
  el('comparison-event').innerHTML='<option value="">Selecciona una intervención</option>'+events.map(e=>`<option value="${esc(e.id)}">${esc(e.date+' · '+e.serial+' · '+TYPES[e.type])}</option>`).join('');
  el('comparison-event').value=events.some(e=>e.id===id)?id:events[0]?.id||'';
  comparisons=events.map(event=>({event,comparison:afterBefore(event,report.tickets,days,report.asOf)}));
  const selected=comparisons.find(c=>c.event.id===el('comparison-event').value);
  if(!selected){el('comparison-output').innerHTML='<p class="mg-empty">Registra una intervención con fecha y correo del ejecutivo para comparar su historial. No se deduce un cambio desde la fecha de importación del inventario.</p>';return;}
  const {event,comparison:c}=selected,max=Math.max(1,c.before||0,c.after||0);
  el('comparison-output').innerHTML=`<div class="mg-comparison"><div><span>Antes · ${days} días</span><strong>${c.before??'—'}</strong><div class="mg-compare-track"><i style="width:${(c.before||0)/max*100}%"></i></div><small>${esc(c.start||'Sin fecha')} a ${esc(c.beforeEnd||'Sin fecha')}</small></div><div><span>Después · ${days} días</span><strong>${c.after??'—'}</strong><div class="mg-compare-track after"><i style="width:${(c.after||0)/max*100}%"></i></div><small>${esc(c.afterStart||'Sin fecha')} a ${esc(c.end||'Sin fecha')}</small></div></div><p><strong>${esc(c.status)}</strong>${c.change===null?'':` · Variación de tickets: ${c.change>0?'+':''}${c.change.toFixed(1).replace('.',',')}%`}</p><p class="mg-note">${esc(event.email||'Correo del afectado pendiente')} · ${esc(event.company)} · Respaldo: ${esc(event.evidence)}. Asociación por correo del afectado, no por técnico creador. Incluye todas las categorías; la diferencia no prueba que el equipo haya causado el cambio. El día de intervención queda excluido.</p>`;
 }
 function render(){
  if(!validDay(el('start').value)||!validDay(el('end').value)||el('start').value>el('end').value){message('Selecciona un período válido: la fecha inicial debe ser anterior o igual a la final.');return;}
  const data=getData();const selectedCompany=root.CompanyScope ? root.CompanyScope.get() : el('company').value;
  const companies=[...new Set([...(root.CompanyScope?.brands.map(b=>b.name)||[]),...data.equipos.map(e=>company(e.empresa)),...data.tickets.map(t=>company(t.empresa)),...records.events.map(e=>e.company),...records.quotes.map(q=>q.company)])].sort();
  if(selectedCompany&&!companies.includes(selectedCompany))companies.push(selectedCompany);
  el('company').innerHTML='<option value="">Todas las empresas</option>'+companies.map(c=>`<option>${esc(c)}</option>`).join('');el('company').value=companies.includes(selectedCompany)?selectedCompany:'';
  report=build(data,{start:el('start').value,end:el('end').value,company:el('company').value},records,policy());
  const sources=getSources();el('sources').textContent=`Actualizado: ${new Date().toLocaleString('es-CL',{timeZone:'America/Santiago'})} · ${Object.entries(sources).map(([k,v])=>k+': '+v).join(' · ')}`;
  el('quality').textContent=`Inventario vigente al ${report.asOf}; tickets y acciones del ${report.start} al ${report.end}. ${report.invalidDates} tickets con fecha inválida o futura excluidos del período. Los registros identificados como demostración se excluyen del informe. ${storageProblem?'No se pudo leer el registro local; los datos guardados se conservaron. ':''}Intervenciones y cotizaciones se guardan en este navegador: exporta su respaldo para trasladarlas o conservarlas. No hay monitoreo de hardware ni encuestas conectadas.`;
  el('inventory-total').textContent=report.renewal.length;
  for(const k of Object.keys(PRIORITIES))el('count-'+k).textContent=report.buckets[k];
  const m=report.metrics;
  for(const [id,value] of Object.entries({received:m.received,resolved:m.resolved,pending:m.pending,old:m.old,response:duration(m.response),resolution:duration(m.resolution),recovered:report.recovered,'recovery-cost':money(report.recoveryCost),'plan-cost':money(report.plan.knownTotal)}))el(id).textContent=value;
  el('sample').textContent=`Cohorte: tickets creados en el período; estado actual al ${report.asOf}. Respuesta: ${m.responseN}/${m.received} con fecha medible. Resolución: ${m.resolutionN}/${m.resolved} resueltos con fecha medible. Pendientes antiguos: 7 días corridos o más. Los tiempos son corridos; no se infieren desde la última edición.`;
  el('recovery-note').textContent=`${report.recoveries.length} intervenciones completadas; ${report.recovered} seriales distintos. ${report.recoveryCostUnknown} intervención${report.recoveryCostUnknown === 1 ? '' : 'es'} sin costo registrado. Un costo desconocido no se toma como cero. No se calcula ahorro supuesto.`;
  bars('renewal-chart',Object.keys(PRIORITIES).map(key=>({label:PRIORITIES[key],count:report.buckets[key],key})),item=>{activePriority=item.key;equipmentTable();el('inventory-details').open=true;el('inventory-details').scrollIntoView({block:'start',behavior:'smooth'});});
  for(const [id,items,kind] of [['company-chart',report.companyCases,'company'],['category-chart',report.categories,'category'],['trend-chart',report.monthly,'month']])bars(id,items,item=>{activeTicketGroup={kind,value:item.label};ticketsTable();el('tickets-details').open=true;el('tickets-details').scrollIntoView({block:'start',behavior:'smooth'});});
  equipmentTable();ticketsTable();comparisonView();
  el('events-rows').innerHTML=report.events.map(e=>`<tr><td>${esc(e.date)}<small>${esc(e.serial)}</small></td><td>${TYPES[e.type]}<small>${esc(e.company)} · ${esc(e.email||'Correo pendiente')}</small></td><td>${money(e.cost)}</td><td>${esc(e.result||'Resultado no detallado')}<small>Respaldo: ${esc(e.evidence)} · ${esc(e.actor||'Responsable sin registrar')}</small></td><td><button type="button" data-edit-event="${esc(e.id)}">Editar</button></td></tr>`).join('')||'<tr><td colspan="5">Sin intervenciones registradas en el período.</td></tr>';
  el('budget-rows').innerHTML=report.plan.groups.map(g=>`<tr><td>${esc(g.company)}</td><td>${{ahora:'Ahora: umbral alcanzado',seis:'Próximos 1–6 meses',doce:'Entre 7 y 12 meses'}[g.bucket]}</td><td>${g.count}</td><td>${g.quote?money(g.quote.unit):'Sin cotización vigente'}</td><td>${money(g.total)}</td><td>${g.quote?esc(g.quote.vendor+' · '+g.quote.reference)+'<small>Válida hasta '+esc(g.quote.until)+'</small>':'Registrar cotización para esta empresa'}</td></tr>`).join('')||'<tr><td colspan="6">No hay equipos con umbral calculado dentro de 12 meses.</td></tr>';
  el('budget-note').textContent=`Proyección parcial: ${report.plan.count} notebooks con umbral en 12 meses; ${report.plan.unquoted} sin cotización vigente. Se usa la cotización más reciente vigente por empresa, con precio unitario final en CLP. Incluye 1 reemplazo por equipo al primer umbral; no cuenta ampliaciones como compras de notebook. Requiere validación técnica antes de aprobar gasto.`;
  el('quotes-rows').innerHTML=records.quotes.filter(q=>!report.company||q.company===report.company).map(q=>`<tr><td>${esc(q.company)}</td><td>${money(q.unit)}<small>${esc(q.scope||'Sin configuración detallada')}</small></td><td>${esc(q.vendor)} · ${esc(q.reference)}</td><td>${esc(q.date)} a ${esc(q.until)}<small>${q.date>report.asOf?'Aún no vigente':q.until<report.asOf?'Vencida':'Vigente'}</small></td><td><button type="button" data-edit-quote="${esc(q.id)}">Editar</button></td></tr>`).join('')||'<tr><td colspan="5">Sin cotizaciones registradas.</td></tr>';
  const select=el('event-equipo'),selected=select.value;
  select.innerHTML='<option value="">Selecciona equipo del inventario</option>'+Quality.real(data.equipos,'equipos').filter(e=>e.serial).map(e=>`<option value="${esc(e.serial)}">${esc((e.nombre_codigo||e.serial)+' · '+e.modelo+' · '+(e.usuario_nombre||'Sin asignar'))}</option>`).join('');select.value=selected;
  executive?.render();
  root.CompanyScope?.sync();
  document.dispatchEvent(new CustomEvent('management-report-rendered'));
 }
 let slaTickets=[],slaFilter='';
 const slaLabels={cumplido:'Cumplido',riesgo:'En riesgo',incumplido:'Incumplido',en_plazo:'En plazo',sin_medicion:'Sin medición'};
 function slaTable(){
  const body=document.getElementById('sla-live-rows');if(!body)return;
  const filtered=slaTickets.filter(t=>!slaFilter||(slaFilter==='riesgo'||slaFilter==='incumplido'? !resolved(t)&&ticketSla(t)===slaFilter : ticketSla(t)===slaFilter));
  document.getElementById('sla-live-filter').textContent=`${root.CompanyScope?.get()||'Todas las empresas'} · ${slaFilter?slaLabels[slaFilter]:'Todos los estados'} · ${filtered.length} tickets; se muestran hasta 100.`;
  body.innerHTML=filtered.slice(0,100).map(t=>`<tr><td><button type="button" data-sla-ticket="${slaTickets.indexOf(t)}">${esc(t.codigo||t.id)}</button></td><td>${esc(company(t.empresa))}</td><td>${esc(t.asunto)}</td><td>${slaLabels[ticketSla(t)]}</td><td>${esc(t.estado)}</td></tr>`).join('')||'<tr><td colspan="5">Sin tickets que coincidan en esta vista.</td></tr>';
 }
 document.getElementById('sla-live-rows')?.addEventListener('click',event=>{const b=event.target.closest('[data-sla-ticket]');if(b)openTicket(slaTickets[Number(b.dataset.slaTicket)]);});
 for(const [id,state] of [['sla-page-metric-riesgo','riesgo'],['sla-page-metric-vencidos','incumplido'],['sla-page-compliance','cumplido']]){
  const card=document.getElementById(id)?.closest('.kpi-card');if(!card)continue;
  card.setAttribute('role','button');card.tabIndex=0;card.title='Consultar tickets que respaldan este indicador';
  const open=()=>{slaFilter=state;slaTable();const details=document.getElementById('sla-live-details');details.open=true;details.scrollIntoView({block:'start',behavior:'smooth'});};
  card.addEventListener('click',open);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
 }
 function legacy(tickets,charts={}){
  const clean=Quality.real(tickets,'tickets'),m=ticketMetrics(clean);
  slaTickets=clean;slaTable();
  const text=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value;};
  const liveDeadlines=clean.filter(t=>!resolved(t)&&ticketSla(t)!=='sin_medicion');const risk=liveDeadlines.filter(t=>ticketSla(t)==='riesgo').length,breached=liveDeadlines.filter(t=>ticketSla(t)==='incumplido').length;
  for(const id of ['dash-metric-sla-riesgo','sla-page-metric-riesgo'])text(id,liveDeadlines.length?risk:'Sin medición');
  for(const id of ['dash-metric-sla-vencidos','sla-page-metric-vencidos'])text(id,liveDeadlines.length?breached:'Sin medición');
  for(const id of ['dash-metric-satisfaccion','metric-satisfaction'])text(id,m.satisfaction===null?'Sin medición':Math.round(m.satisfaction)+'%');
  for(const id of ['dash-metric-tiempo-resp','response-time-avg'])text(id,duration(m.response));
  text('sla-page-compliance',m.compliance===null?'Sin medición':m.compliance.toFixed(1)+'%');text('sla-page-resolution',duration(m.resolution));text('sla-page-coverage',`${m.complianceN} cierres con fecha y vencimiento; ${m.sla.sin_medicion} tickets sin SLA medible.`);
  text('metric-open-tickets',m.pending);text('metric-connected-users','Sin monitoreo');text('metric-active-incidents','Sin monitoreo');
  const priority=grouped(clean,t=>norm(t.prioridad));const pcounts=['critica','alta','media','baja'].map(p=>priority.find(v=>v.label===p)?.count||0);
  if(charts.priority){charts.priority.data.datasets[0].data=pcounts;charts.priority.update();}
  const pLegend=document.getElementById('priority-legend-list');if(pLegend)pLegend.innerHTML=['Crítica','Alta','Media','Baja'].map((p,i)=>`<div class="donut-legend-item"><span class="legend-text">${p}</span><span class="legend-val">${pcounts[i]}</span></div>`).join('');
  if(charts.sla){charts.sla.data.labels=['Cumplido','En riesgo','Incumplido','En plazo','Sin medición'];charts.sla.data.datasets[0].data=[m.sla.cumplido,m.sla.riesgo,m.sla.incumplido,m.sla.en_plazo,m.sla.sin_medicion];charts.sla.data.datasets[0].backgroundColor=['#10b981','#f59e0b','#ef4444','#3b82f6','#64748b'];charts.sla.update();}
  const sLegend=document.getElementById('sla-live-legend');if(sLegend)sLegend.innerHTML=[['Cumplido',m.sla.cumplido],['En riesgo',m.sla.riesgo],['Incumplido',m.sla.incumplido],['En plazo',m.sla.en_plazo],['Sin medición',m.sla.sin_medicion]].map(([label,value])=>`<div class="donut-legend-item"><span class="legend-text">${label}</span><span class="legend-val">${value}</span></div>`).join('');
  const activity=document.getElementById('dash-activity-feed');if(activity)activity.innerHTML=clean.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5).map(t=>`<div class="activity-feed-item"><div class="activity-feed-body"><div class="activity-feed-title">${esc(t.codigo||t.id)} · ${esc(t.asunto)}</div><div class="activity-feed-meta">${esc(t.estado)} · ${esc(civil(t.created_at)||'Sin fecha')}</div></div></div>`).join('')||'<p class="mg-empty">Sin tickets registrados.</p>';
  const distribution=document.getElementById('dashboard-live-company');if(distribution)distribution.innerHTML=grouped(clean,t=>company(t.empresa)).map(v=>`<div class="distribution-item"><div class="distrib-label-row"><span>${esc(v.label)}</span><strong>${v.count} tickets</strong></div></div>`).join('')||'<p class="mg-empty">Sin tickets registrados.</p>';
 }
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 el('filters').addEventListener('submit',event=>{event.preventDefault();activePriority='';activeTicketGroup=null;render();});
 el('clear-inventory').onclick=()=>{activePriority='';equipmentTable();};el('clear-tickets').onclick=()=>{activeTicketGroup=null;ticketsTable();};
 el('comparison-event').onchange=comparisonView;el('comparison-days').onchange=comparisonView;
 el('inventory-rows').onclick=event=>{const b=event.target.closest('[data-eq]');if(b)openEquipo(report.renewal[Number(b.dataset.eq)].eq);};
 el('ticket-rows').onclick=event=>{const b=event.target.closest('[data-ticket]');if(b)openTicket(report.periodTickets[Number(b.dataset.ticket)]);};
 el('event-equipo').onchange=()=>{const eq=getData().equipos.find(e=>norm(e.serial)===norm(el('event-equipo').value));if(eq){el('event-email').value=eq.usuario_email||'';el('event-company').value=company(eq.empresa);}};
 function eventForm(e){editingEvent=e?.id||'';el('event-equipo').value=e?.serial||'';el('event-date').value=e?.date||today();el('event-type').value=e?.type||'ram';el('event-email').value=e?.email||'';el('event-company').value=e?.company||'T-Sales';el('event-cost').value=e?.cost??'';el('event-evidence').value=e?.evidence||'';el('event-result').value=e?.result||'';el('event-coverage').checked=e?.coverage===true;el('event-coverage-days').value=e?.coverageDays||30;el('event-mode').textContent=e?'Editar intervención':'Registrar intervención completada';}
 el('event-form').onsubmit=event=>{event.preventDefault();try{const entry=normalizeEvent({id:editingEvent||crypto.randomUUID(),serial:el('event-equipo').value,date:el('event-date').value,type:el('event-type').value,email:el('event-email').value,company:el('event-company').value,cost:el('event-cost').value,evidence:el('event-evidence').value,result:el('event-result').value,coverage:el('event-coverage').checked,coverageDays:Number(el('event-coverage-days').value),actor:getActor()});if(entry.date>today())throw Error('Una intervención completada no puede tener fecha futura.');const events=records.events.filter(e=>e.id!==entry.id);events.push(entry);if(save({...records,events})){eventForm(null);render();message('Intervención guardada en este navegador. Puedes descargar un respaldo.');}}catch(error){message(error.message);}};
 el('event-reset').onclick=()=>eventForm(null);
 el('events-rows').onclick=event=>{const b=event.target.closest('[data-edit-event]');if(b){eventForm(records.events.find(e=>e.id===b.dataset.editEvent));el('event-editor').open=true;el('event-editor').scrollIntoView({block:'start'});}};
 function quoteForm(q){editingQuote=q?.id||'';el('quote-company').value=q?.company||'T-Sales';el('quote-unit').value=q?.unit??'';el('quote-date').value=q?.date||today();el('quote-until').value=q?.until||shift(today(),30);el('quote-vendor').value=q?.vendor||'';el('quote-reference').value=q?.reference||'';el('quote-scope').value=q?.scope||'';el('quote-mode').textContent=q?'Editar cotización':'Registrar cotización';}
 el('quote-form').onsubmit=event=>{event.preventDefault();try{const q=normalizeQuote({id:editingQuote||crypto.randomUUID(),company:el('quote-company').value,unit:el('quote-unit').value,date:el('quote-date').value,until:el('quote-until').value,vendor:el('quote-vendor').value,reference:el('quote-reference').value,scope:el('quote-scope').value});const quotes=records.quotes.filter(item=>item.id!==q.id);quotes.push(q);if(save({...records,quotes})){quoteForm(null);render();message('Cotización guardada. Presupuesto actualizado con precios vigentes.');}}catch(error){message(error.message);}};
 el('quote-reset').onclick=()=>quoteForm(null);
 el('quotes-rows').onclick=event=>{const b=event.target.closest('[data-edit-quote]');if(b){quoteForm(records.quotes.find(q=>q.id===b.dataset.editQuote));el('quote-editor').open=true;el('quote-editor').scrollIntoView({block:'start'});}};
 el('export').onclick=()=>{let output=reportCsv(report,comparisons,getSources());if(root.TiEvolution){const evolution=root.TiEvolution.build(getData(),{start:report.start,end:report.end,company:report.company,asOf:report.asOf});output+='\r\n'+root.TiEvolution.csv(evolution).split('\r\n').slice(1).join('\r\n');}download(`informe-gestion-ti-${today()}.csv`,output,'text/csv;charset=utf-8');};
 el('backup').onclick=()=>download(`respaldo-gestion-ti-${today()}.json`,storageProblem&&rawSaved?rawSaved:JSON.stringify({version:1,exportedAt:new Date().toISOString(),...records},null,2),'application/json');
 el('import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('El respaldo supera el tamaño máximo de 5 MB.');const parsed=JSON.parse(await file.text());if(parsed.version!==1||!Array.isArray(parsed.events)||!Array.isArray(parsed.quotes))throw Error('Formato de respaldo no reconocido.');const events=parsed.events.map(normalizeEvent),quotes=parsed.quotes.map(normalizeQuote);if([...events,...quotes].some(v=>!v.id))throw Error('El respaldo contiene registros sin identificador.');const merge=(current,items)=>[...new Map([...current,...items].map(item=>[item.id,item])).values()];if(save({events:merge(records.events,events),quotes:merge(records.quotes,quotes)},true)){render();message('Respaldo incorporado. Los identificadores existentes se actualizaron con el archivo.');}}catch(error){message('No se pudo importar: '+error.message);}finally{event.target.value='';}};
 el('print').onclick=()=>window.print();
 el('refresh').onclick=async()=>{el('refresh').disabled=true;try{await refresh();render();message('Informe actualizado con las fuentes disponibles.');}catch(error){message('Actualización parcial: '+error.message);}finally{el('refresh').disabled=false;}};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 render();return {render,legacy,getRecords:()=>records,getReport:()=>report};
}
const api={today,shift,company,date,civil,inPeriod,amount,ticketSla,ticketMetrics,afterBefore,normalizeEvent,normalizeQuote,plan,build,reportCsv,init,money,duration};
if(typeof module==='object'&&module.exports)module.exports=api;else root.SupportInsights=api;
})(typeof window!=='undefined'?window:globalThis);
