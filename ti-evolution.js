/* Evolución TI: datos de origen, enlaces explícitos y subtotales trazables. */
(function(root){
'use strict';
const I=()=>root.SupportInsights||(typeof require==='function'?require('./support-insights.js'):null);
const Q=()=>root.SupportDataQuality||(typeof require==='function'?require('./support-demo-registry.js'):null);
const R=()=>root.NotebookRenewal||(typeof require==='function'?require('./notebook-renewal.js'):null);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='ti-asset-purchase-links-v1';
const executed=p=>['entregado','entregada','recibido','recibida','pagado','pagada','comprado','comprada','completado','completada','stock'].includes(norm(p.estado));
const closed=t=>['resuelto','cerrado'].includes(norm(t.estado));
const closure=t=>t.fecha_resolucion||t.resolved_at||t.closed_at;
function affected(t){if(t._affected_email_verified===false)return '';const email=norm(t.cliente_email||t.affected_email);return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?email:'';}
function clean(data){return {compras:Q().real(data.compras||[],'compras'),equipos:Q().real(data.equipos||[],'equipos'),tickets:Q().real(data.tickets||[],'tickets')};}
function category(p){
 const explicit={notebook:'Equipos',ram:'Repuestos y mejoras',ssd:'Repuestos y mejoras',monitor:'Periféricos y accesorios',cargador:'Periféricos y accesorios',perifericos:'Periféricos y accesorios',headset:'Periféricos y accesorios',impresora:'Periféricos y accesorios',red:'Periféricos y accesorios'};
 if(explicit[norm(p.categoria)])return explicit[norm(p.categoria)];
 if(/^(notebook|laptop|portatil|desktop|computador)\b/.test(norm(p.producto)))return 'Equipos';
 const text=norm([p.categoria,p.categoria_nombre,p.producto].join(' '));
 if(/\b(notebook|laptop|portatil|desktop|computador|computadores|equipos)\b/.test(text)&&!/\b(ram|ssd|memoria|repuesto)\b/.test(text))return 'Equipos';
 if(/\b(ram|ssd|hdd|memoria|bateria|pantalla|repuesto|repuestos|disco)\b/.test(text))return 'Repuestos y mejoras';
 if(/licencia|suscrip|software/.test(text))return 'Licencias y software';
 if(/servicio|reparacion|instalacion|mano de obra/.test(text))return 'Servicios';
 if(/mouse|teclado|monitor|periferico|cable|adaptador|dock|audifono/.test(text))return 'Periféricos y accesorios';
 return 'Otros / por clasificar';
}
function summarize(rows){const amounts=rows.map(p=>I().amount(p.valor_total));return {count:rows.length,known:amounts.filter(v=>v!==null).length,unknown:amounts.filter(v=>v===null).length,total:amounts.some(v=>v!==null)?amounts.reduce((n,v)=>n+(v??0),0):null};}
function build(data,{start,end,company='',asOf=I().today()}){
 const api=I(),d=clean(data),comp=api.company;
 if(!R().dateOnly(start)||!R().dateOnly(end)||start>end)throw Error('Selecciona un período válido.');
 const match=p=>!company||comp(p.empresa)===comp(company);
 const tickets=d.tickets.filter(match).filter(t=>api.date(t.created_at)&&api.civil(t.created_at)<=asOf);
 const purchases=d.compras.filter(match);
 const realized=purchases.filter(p=>executed(p)&&api.date(p.fecha)&&api.civil(p.fecha)<=asOf);
 const period=realized.filter(p=>api.inPeriod(p.fecha,start,end));
 const days=Math.round((R().dateOnly(end)-R().dateOnly(start))/86400000)+1;
 const prevEnd=api.shift(start,-1),prevStart=api.shift(start,-days);
 const previous=realized.filter(p=>api.inPeriod(p.fecha,prevStart,prevEnd));
 const summary=summarize(period),prior=summarize(previous);
 const variation=end<=asOf&&summary.count>0&&prior.count>0&&!summary.unknown&&!prior.unknown&&prior.total>0?(summary.total-prior.total)/prior.total*100:null;
 const months=[];let cursor=start.slice(0,7)+'-01';
 // Ventana acotada para evitar bloquear el navegador con entradas extremas.
 for(let n=0;cursor<=end&&n<120;n++){
  const key=cursor.slice(0,7),items=period.filter(p=>api.civil(p.fecha)?.startsWith(key));
  const received=tickets.filter(t=>api.inPeriod(t.created_at,start,end)&&api.civil(t.created_at)?.startsWith(key));
  const resolved=tickets.filter(t=>closed(t)&&api.date(closure(t))>=api.date(t.created_at)&&api.civil(closure(t))<=asOf&&api.inPeriod(closure(t),start,end)&&api.civil(closure(t))?.startsWith(key));
  const activity=[...new Set([...received,...resolved])];
  const emails=activity.map(t=>affected(t)).filter(Boolean);
  months.push({key,purchases:items,spend:summarize(items),received,resolved,people:new Set(emails).size,unidentified:activity.length-emails.length});
  const date=R().dateOnly(cursor);date.setUTCMonth(date.getUTCMonth()+1);cursor=date.toISOString().slice(0,10);
 }
 const categories=[...new Set(period.map(category))].map(label=>({label,rows:period.filter(p=>category(p)===label)}));
 const companies=[...new Set(period.map(p=>comp(p.empresa)))].map(label=>({label,rows:period.filter(p=>comp(p.empresa)===label)}));
 const recent=tickets.filter(t=>api.inPeriod(t.created_at,start,end));
 const problems=[...new Set(recent.map(t=>t.categoria||'Sin categoría'))].map(label=>({label,rows:recent.filter(t=>(t.categoria||'Sin categoría')===label)})).sort((a,b)=>b.rows.length-a.rows.length);
 const resolvedPeriod=tickets.filter(t=>closed(t)&&api.date(closure(t))>=api.date(t.created_at)&&api.civil(closure(t))<=asOf&&api.inPeriod(closure(t),start,end));
 const activeTickets=[...new Set([...recent,...resolvedPeriod])];
 return {start,end,company,asOf,problems,period,summary,prior,prevStart,prevEnd,variation,months,truncated:cursor<=end,categories,companies,received:recent.length,resolved:resolvedPeriod.length,people:new Set(activeTickets.map(t=>affected(t)).filter(Boolean)).size,unidentified:activeTickets.filter(t=>!affected(t)).length,pendingPurchases:purchases.filter(p=>api.inPeriod(p.fecha,start,end)&&api.civil(p.fecha)<=asOf&&!executed(p)).length};
}
function validateLink(input,links,data,events){
 const d=clean(data),api=I();const p=d.compras.find(p=>String(p.id)===String(input.purchaseId));
 const eq=d.equipos.find(eq=>String(eq.id)===String(input.equipmentId));
 const value=api.amount(input.amount);
 if(!p||!eq||!eq.serial||p.id==null||eq.id==null||!String(p.id).trim()||!String(eq.id).trim()||!input.id||!executed(p)||!api.date(p.fecha)||api.civil(p.fecha)>api.today())throw Error('Selecciona una compra realizada y un equipo con serie.');
 if(api.company(p.empresa)!==api.company(eq.empresa))throw Error('La compra y el equipo deben pertenecer a la misma empresa.');
 if(value===null||!Number.isInteger(value)||value<=0||api.amount(p.valor_total)===null)throw Error('Ingresa un monto entero positivo respaldado por la compra.');
 const others=links.filter(l=>l.id!==input.id&&String(l.purchaseId)===String(p.id));
 if(others.reduce((n,l)=>n+l.amount,0)+value>Number(p.valor_total))throw Error('Los montos repartidos superan el total de esta compra.');
 const event=input.eventId?events.find(e=>e.id===input.eventId&&norm(e.serial)===norm(eq.serial)&&api.company(e.company)===api.company(eq.empresa)):null;
 if(input.eventId&&!event)throw Error('La intervención seleccionada no corresponde a este equipo.');
 if(event&&(event.cost===null||event.cost<value+links.filter(l=>l.id!==input.id&&l.eventId===event.id).reduce((n,l)=>n+l.amount,0)))throw Error('Las piezas incluidas no pueden superar el costo conocido de la intervención.');
 return {id:String(input.id),purchaseId:String(p.id),equipmentId:String(eq.id),serial:String(eq.serial).trim(),company:api.company(eq.empresa),amount:value,eventId:event?.id||'',note:String(input.note||'').slice(0,500)};
}
function equipmentHistory(eq,data,events,links,movements=[],asOf=I().today()){
 const api=I(),d=clean(data),company=api.company(eq.empresa),serial=norm(eq.serial);
 const actions=serial?events.filter(e=>norm(e.serial)===serial&&api.company(e.company)===company&&e.date<=asOf):[];
 const relevant=links.filter(l=>String(l.equipmentId)===String(eq.id)&&norm(l.serial)===serial&&api.company(l.company)===company);
 const allocations=relevant.map(link=>({link,purchase:d.compras.find(p=>String(p.id)===link.purchaseId)}));
 // Invalidated purchase links stay visible but never contribute to the subtotal.
 const valid=allocations.filter(a=>a.purchase&&executed(a.purchase)&&api.date(a.purchase.fecha)&&api.civil(a.purchase.fecha)<=asOf&&api.company(a.purchase.empresa)===company&&api.amount(a.purchase.valor_total)!==null&&links.filter(l=>l.purchaseId===a.link.purchaseId).reduce((n,l)=>n+l.amount,0)<=Number(a.purchase.valor_total));
 const overlap=actions.reduce((n,e)=>n+(e.cost===null?0:Math.min(e.cost,valid.filter(a=>a.link.eventId===e.id).reduce((sum,a)=>sum+a.link.amount,0))),0);
 const purchaseCost=valid.reduce((n,a)=>n+a.link.amount,0),eventCosts=actions.filter(e=>e.cost!==null);
 const eventCost=eventCosts.reduce((n,e)=>n+e.cost,0);
 const tickets=d.tickets.filter(t=>api.company(t.empresa)===company&&((eq.id&&String(t.equipo_id||t.equipment_id||'')===String(eq.id))||(serial&&norm(t.equipo_serial||t.serial_equipo||t.serial)===serial))&&api.date(t.created_at)&&api.civil(t.created_at)<=asOf);
 const uniqueSerial=d.equipos.filter(e=>norm(e.serial)===serial).length===1;
 const history=serial?movements.filter(m=>norm(m.serial)===serial&&((m.empresa||m.company)?api.company(m.empresa||m.company)===company:uniqueSerial)&&api.date(m.date)&&api.civil(m.date)<=asOf):[];
 return {eq,actions,allocations,valid,purchaseCost:valid.length?purchaseCost:null,eventCost:eventCosts.length?eventCost:null,overlap,knownTotal:valid.length||eventCosts.length?purchaseCost+eventCost-overlap:null,unknown:actions.length-eventCosts.length,invalidLinks:allocations.length-valid.length,tickets,movements:history};
}
function csv(report){
 const cell=value=>'"'+(/^[\s]*[=+@-]/.test(String(value??''))?"'":'')+String(value??'').replace(/"/g,'""')+'"';
 const rows=[['Sección','Indicador / referencia','Valor','Detalle / calidad','Desde','Hasta']];
 for(const m of report.months)rows.push(['Evolución TI',m.key,m.spend.total??'Sin monto',`${m.spend.count} compras; ${m.spend.unknown} sin monto; recibidos=${m.received.length}; resueltos=${m.resolved.length}; personas=${m.people}; sin correo=${m.unidentified}`,report.start,report.end]);
 for(const p of report.period)rows.push(['Compras realizadas',p.id,I().amount(p.valor_total)??'Sin monto',`${I().company(p.empresa)}; ${p.producto||''}; ${p.proveedor||''}; ${p.factura||'Sin factura'}; ${category(p)}`,I().civil(p.fecha),I().civil(p.fecha)]);
 return rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
function init({getData,getRecords,getMovements,openEquipo,openTicket,openPurchase,getActiveEquipment,getReportContext=()=>null,getTicketScope=()=>null}){
 const api=I(),money=api.money;let links=[],storageProblem=false,active=null,lastDetail=null,originalSaved=null;
 try{originalSaved=localStorage.getItem(STORE);const saved=JSON.parse(originalSaved||'{"version":1,"links":[]}');if(saved.version!==1||!Array.isArray(saved.links)||saved.links.some(l=>!l.id||!l.purchaseId||!l.equipmentId||!l.serial||!l.company||!Number.isInteger(l.amount)||l.amount<=0))throw Error();links=saved.links;}catch(_){storageProblem=true;}
 let period={start:api.shift(api.today(),-89),end:api.today()};
 const views=[];
 const heading=(title,subtitle)=>`<div class="mg-section-heading"><div><span class="mg-eyebrow">Evolución de la gestión TI</span><h2>${title}</h2><p>${subtitle}</p></div></div>`;
 const kpi=(title,value,note)=>`<div><span>${esc(title)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
 for(const [page,kind,title,subtitle] of [['page-compras','purchases','Evolución de compras','Compras realizadas, distribución y detalle por período.'],['page-mis-tickets','tickets','Evolución de atenciones','Solicitudes recibidas, cierres y personas identificadas en atenciones del período.'],['management-report','report','Evolución de la gestión TI','Compras y atenciones en contexto, con acceso a los registros.']]){
  const host=document.getElementById(page);if(!host)continue;
  const card=document.createElement('section');card.className='mg-card ti-evolution';card.dataset.kind=kind;
  card.innerHTML=heading(title,subtitle)+(kind==='report'?'<p class="ti-period"></p>':`<form class="mg-filters ti-period-form"><label>Desde<input name="start" type="date" required value="${period.start}"></label><label>Hasta<input name="end" type="date" required value="${period.end}"></label><button type="submit">Consultar período</button></form>`)+`<p class="ti-message mg-note" role="status"></p><div class="ti-kpis mg-kpis"></div><div class="ti-content"></div>`;
  if(kind==='report')host.querySelector('#mg-investment')?.before(card);else if(kind==='tickets'){const details=document.createElement('details');details.className='ti-ticket-evolution-summary';details.innerHTML='<summary>Consultar evolución de atenciones por período</summary>';details.append(card);details.addEventListener('toggle',()=>{if(details.open)render();});host.querySelector('.tickets-pagination')?.after(details);}else host.querySelector('.tickets-page-header')?.after(card);
  card.querySelector('form')?.addEventListener('submit',event=>{event.preventDefault();const f=event.target;if(!R().dateOnly(f.start.value)||!R().dateOnly(f.end.value)||f.start.value>f.end.value){card.querySelector('.ti-message').textContent='Revisa las fechas del período.';return;}period={start:f.start.value,end:f.end.value};render();});
  views.push({card,kind});
 }
 const dialog=document.createElement('dialog');dialog.className='ti-detail-dialog';dialog.setAttribute('aria-label','Detalle de gestión TI');dialog.innerHTML='<header><h2>Detalle de gestión TI</h2><button type="button" data-close>Cerrar</button></header><div class="ti-detail-body"></div>';document.body.append(dialog);
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 function showDetail(title,body){dialog.querySelector('h2').textContent=title;dialog.querySelector('.ti-detail-body').innerHTML=body;if(!dialog.open)dialog.showModal();}
 const purchaseRows=rows=>`<div class="mg-table-scroll"><table><thead><tr><th>Fecha / producto</th><th>Empresa / proveedor</th><th>Respaldo</th><th>Monto</th></tr></thead><tbody>${rows.map((p,index)=>`<tr><td><button data-purchase="${index}">${esc(p.producto||'Sin producto')}</button><small>${esc(p.fecha)}</small></td><td>${esc(api.company(p.empresa))}<small>${esc(p.proveedor||'Sin proveedor')}</small></td><td>${esc(p.factura||'Sin factura registrada')}</td><td>${money(api.amount(p.valor_total))}</td></tr>`).join('')||'<tr><td colspan="4">Sin compras realizadas registradas.</td></tr>'}</tbody></table></div>`;
 function purchases(title,rows){lastDetail={type:'purchases',rows};showDetail(title,purchaseRows(rows));}
 function ticketDetail(title,rows){lastDetail={type:'tickets',rows};showDetail(title,`<p>Cada fila abre el ticket original.</p><div class="mg-table-scroll"><table><thead><tr><th>Ticket</th><th>Empresa</th><th>Creación</th><th>Cierre</th><th>Estado</th></tr></thead><tbody>${rows.map((t,index)=>`<tr><td><button data-ticket="${index}">${esc(t.codigo||t.id)} · ${esc(t.asunto)}</button></td><td>${esc(api.company(t.empresa))}</td><td>${esc(api.civil(t.created_at))}</td><td>${esc(api.civil(closure(t))||'Sin fecha')}</td><td>${esc(t.estado)}</td></tr>`).join('')||'<tr><td colspan="5">Sin registros.</td></tr>'}</tbody></table></div>`);}
 dialog.addEventListener('click',event=>{const p=event.target.closest('[data-purchase]'),t=event.target.closest('[data-ticket]');if(p&&lastDetail?.type==='purchases'){const item=lastDetail.rows[Number(p.dataset.purchase)];dialog.close();openPurchase(item);}if(t&&lastDetail?.type==='tickets'){const item=lastDetail.rows[Number(t.dataset.ticket)];dialog.close();openTicket(item);}});
 function renderView({card,kind}){
  if(!card.closest('.page-section')?.classList.contains('active-page'))return;
  if(kind==='tickets'&&!card.closest('.ti-ticket-evolution-summary')?.open)return;
  const selected=root.CompanyScope?.get()||'';const context=getReportContext();let dates=kind==='report'?{start:context?.start||period.start,end:context?.end||period.end}:period;
  const data={...getData()};if(kind==='tickets'){const scoped=getTicketScope();if(scoped)data.tickets=scoped;}
  let report;try{report=build(data,{...dates,company:selected});}catch(error){card.querySelector('.ti-message').textContent=error.message;return;}
  if(kind==='report')card.querySelector('.ti-period').textContent=`${dates.start} al ${dates.end} · ${selected||'Todas las empresas'}`;
  else {card.querySelector('form').elements.namedItem('start').value=period.start;card.querySelector('form').elements.namedItem('end').value=period.end;}
  card.querySelector('.ti-message').textContent=`${selected||'Todas las empresas'} · ${report.summary.unknown} compras realizadas sin monto · ${report.pendingPurchases} registros con otros estados (excluidos del gasto realizado). ${report.truncated?'Se muestran los primeros 120 meses. ':''}Cierres por fecha de resolución; pueden corresponder a solicitudes anteriores. Personas: correos distintos de tickets creados o cerrados en el período. Sin registros no equivale a ausencia de actividad.`;
  const change=report.variation===null?'Sin comparación suficiente':`${report.variation>0?'+':''}${report.variation.toFixed(1).replace('.',',')}%`;
  card.querySelector('.ti-kpis').innerHTML=kind==='tickets'?kpi('Solicitudes recibidas',report.received,'Creadas en el período')+kpi('Resueltas en el período',report.resolved,'Incluye solicitudes anteriores')+kpi('Personas identificadas',report.people,`${report.unidentified} solicitudes sin correo del afectado`):kpi('Compras realizadas',money(report.summary.total),`${report.summary.count} registros · subtotal conocido`)+kpi('Variación de gasto',change,`Comparación: ${report.prevStart} al ${report.prevEnd}`)+kpi('Solicitudes recibidas / resueltas',`${report.received} / ${report.resolved}`,'Conteos independientes por fecha');
  const table=kind==='tickets'?`<table><thead><tr><th>Mes</th><th>Recibidas</th><th>Resueltas</th><th>Personas con actividad</th></tr></thead><tbody>${report.months.map((m,index)=>`<tr><td>${m.key}</td><td><button data-month-received="${index}">${m.received.length}</button></td><td><button data-month-resolved="${index}">${m.resolved.length}</button></td><td>${m.people}<small>${m.unidentified} solicitudes sin correo</small></td></tr>`).join('')}</tbody></table>`:`<table><thead><tr><th>Mes</th><th>Compras realizadas</th><th>Monto conocido</th><th>Atenciones recibidas / resueltas</th></tr></thead><tbody>${report.months.map((m,index)=>`<tr><td>${m.key}</td><td><button data-month-purchase="${index}">${m.spend.count} registros</button></td><td>${money(m.spend.total)}<small>${m.spend.unknown} sin monto</small></td><td><button data-month-received="${index}">${m.received.length} recibidas</button> / <button data-month-resolved="${index}">${m.resolved.length} resueltas</button></td></tr>`).join('')}</tbody></table>`;
  const grouping=(title,groups,key)=>`<div><h3>${title}</h3>${groups.map((g,index)=>`<button type="button" class="ti-distribution" data-${key}="${index}"><span>${esc(g.label)}</span><strong>${money(summarize(g.rows).total)}</strong><small>${g.rows.length} compras · ${summarize(g.rows).unknown} sin monto</small></button>`).join('')||'<p>Sin compras realizadas registradas.</p>'}</div>`;
  const maxSpend=Math.max(1,...report.months.map(m=>m.spend.total??0));
  const chart=kind==='tickets'?'':`<div class="ti-monthly-chart" aria-label="Compras realizadas por mes">${report.months.map((m,index)=>`<button type="button" data-month-purchase="${index}"><span>${m.key}</span><i aria-hidden="true"><b style="width:${(m.spend.total??0)/maxSpend*100}%"></b></i><strong>${money(m.spend.total)}</strong></button>`).join('')}</div>`;
  card.querySelector('.ti-content').innerHTML=(kind!=='tickets'?'<div class="ti-distributions">'+grouping('Por destino',report.categories,'category')+grouping('Por empresa',report.companies,'company')+'</div>':'<h3>Problemas más frecuentes en solicitudes recibidas</h3><div class="ti-problems">'+report.problems.slice(0,5).map((g,index)=>`<button type="button" data-problem="${index}">${esc(g.label)} · ${g.rows.length} solicitudes</button>`).join('')+'</div>')+chart+`<details class="mg-details" ${kind==='report'?'':'open'}><summary>Evolución mensual y detalle de registros</summary><div class="mg-table-scroll">${table}</div></details>`;
  card.querySelector('.ti-content').onclick=event=>{
   const b=event.target.closest('button');if(!b)return;
   if(b.dataset.monthPurchase!==undefined){const m=report.months[Number(b.dataset.monthPurchase)];purchases('Compras · '+m.key,m.purchases);}
   if(b.dataset.monthReceived!==undefined){const m=report.months[Number(b.dataset.monthReceived)];ticketDetail('Solicitudes recibidas · '+m.key,m.received);}
   if(b.dataset.monthResolved!==undefined){const m=report.months[Number(b.dataset.monthResolved)];ticketDetail('Tickets resueltos · '+m.key,m.resolved);}
   if(b.dataset.problem!==undefined){const g=report.problems[Number(b.dataset.problem)];ticketDetail(g.label,g.rows);}
   if(b.dataset.category!==undefined){const g=report.categories[Number(b.dataset.category)];purchases(g.label,g.rows);}
   if(b.dataset.company!==undefined){const g=report.companies[Number(b.dataset.company)];purchases(g.label,g.rows);}
  };
 }
 function records(){return getRecords()||{events:[],quotes:[]};}
 function persist(next){if(storageProblem)throw Error('El respaldo local no se pudo leer. Conserva su archivo antes de reemplazarlo.');localStorage.setItem(STORE,JSON.stringify({version:1,links:next}));links=next;}
 function equipment(eq){
  active=eq;lastDetail=null;
  const data=getData(),events=records().events||[],history=equipmentHistory(eq,data,events,links,getMovements());
  const available=clean(data).compras.filter(p=>api.company(p.empresa)===api.company(eq.empresa)&&executed(p)&&api.date(p.fecha)&&api.civil(p.fecha)<=api.today()&&p.id!=null);
  const row=R().evaluate(eq,{},api.today()),h=R().upgradeHorizon(row);
  const actionLabels={ram:'Ampliación de RAM',ssd:'Instalación de SSD',reparacion:'Reparación completada',reasignacion:'Reasignación / reutilización',reemplazo:'Cambio de notebook'};
  const timeline=[...history.actions.map(e=>({date:e.date,title:actionLabels[e.type]||e.type,result:e.result||'Sin resultado detallado',ref:e.evidence,cost:e.cost})),...history.movements.map(m=>({date:api.civil(m.date),title:m.action,result:m.details,ref:m.tech,cost:null}))].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  showDetail('Historial y costos · '+(eq.nombre_codigo||eq.serial||'Equipo'),`<p>${esc(api.company(eq.empresa))} · Serie ${esc(eq.serial||'Sin serie')} · ${esc(eq.estado||'Sin estado')} · ${esc(eq.usuario_nombre||'Sin asignar')}</p><div class="mg-kpis">${kpi('Compras vinculadas',money(history.purchaseCost),`${history.valid.length} distribuciones válidas`)}${kpi('Intervenciones conocidas',money(history.eventCost),`${history.unknown} sin costo`)}${kpi('Costo acumulado conocido',money(history.knownTotal),`${money(history.overlap)} conciliado por piezas incluidas`)}</div><p class="mg-note">Subtotal de registros vinculados, no costo total certificado. No se deduce una compra por compartir usuario o modelo. Los costos de piezas incluidas en una intervención se descuentan una vez. ${history.invalidLinks} vínculos requieren revisar su compra original. ${storageProblem?'No se pudo leer el registro local de vínculos.':''}</p><details class="mg-details"><summary>Análisis de mejora y renovación</summary><p>${esc(eq.cpu||'CPU sin registrar')} · RAM ${esc(eq.ram||'Sin registrar')} · ${esc(eq.disco_duro||'Disco sin registrar')}</p><p>${esc(h.decision)} · Uso previsto tras una mejora compatible: ${esc(h.label)}</p><p>${esc(h.reason)}</p><p>Las alternativas de piezas y reemplazo se consultan en SLA → Costos aproximados e Informe gerencial → Inversión y alternativas.</p></details><h3>Compras asignadas a este equipo</h3><div class="mg-table-scroll"><table><thead><tr><th>Compra</th><th>Distribución</th><th>Conciliación</th><th>Vínculo</th></tr></thead><tbody>${history.allocations.map(a=>`<tr><td>${esc(a.purchase?.producto||'Compra no encontrada')}<small>${esc(a.purchase?.fecha||'')} · ${esc(a.purchase?.factura||'Sin factura')}</small></td><td>${money(a.link.amount)}</td><td>${a.link.eventId?'Incluida en '+esc(history.actions.find(e=>e.id===a.link.eventId)?.evidence||a.link.eventId):'Compra separada de las intervenciones'}<small>${esc(a.link.note)}</small></td><td><button type="button" data-unlink="${esc(a.link.id)}">Quitar vínculo</button></td></tr>`).join('')||'<tr><td colspan="4">Sin compras vinculadas. Puedes asociar los comprobantes abajo.</td></tr>'}</tbody></table></div><details class="mg-details"><summary>Vincular una compra realizada</summary><p>Asigna el importe de piezas o equipo que corresponde a esta serie. Para compras de varias unidades, distribuye solo el monto correspondiente. Si ese importe ya forma parte de una intervención, selecciónala para evitar duplicarlo.</p><form id="ti-link-form" class="mg-form"><label>Compra de ${esc(api.company(eq.empresa))}<select name="purchase" required><option value="">Selecciona compra</option>${available.map(p=>`<option value="${esc(p.id)}">${esc(p.fecha+' · '+p.producto+' · '+money(api.amount(p.valor_total)))}</option>`).join('')}</select></label><label>Monto que corresponde a este equipo (CLP)<input name="amount" type="number" min="1" step="1" required></label><label>¿El importe está incluido en una intervención?<select name="event"><option value="">No; es un gasto separado</option>${history.actions.filter(e=>e.cost!==null).map(e=>`<option value="${esc(e.id)}">${esc(e.date+' · '+e.type+' · '+money(e.cost)+' · '+e.evidence)}</option>`).join('')}</select></label><label>Referencia o explicación<input name="note" maxlength="500"></label><button type="submit">Guardar vínculo</button><p id="ti-link-status" role="status"></p></form></details><h3>Movimientos e intervenciones</h3><ol class="ti-timeline">${timeline.map(e=>`<li><strong>${esc(e.date)} · ${esc(e.title)}</strong><p>${esc(e.result)}</p><small>${esc(e.ref||'Sin referencia')} · ${e.cost===null?'Costo no registrado':money(e.cost)}</small></li>`).join('')||'<li>Sin movimientos o intervenciones registrados.</li>'}</ol><h3>Tickets asociados explícitamente al equipo</h3><p class="mg-note">${history.tickets.length} tickets con identificador o serie del equipo; no se atribuyen tickets por la persona actualmente asignada.</p><div>${history.tickets.map((t,index)=>`<button type="button" data-asset-ticket="${index}">${esc(t.codigo||t.id)} · ${esc(t.asunto)}</button>`).join('')}</div><details class="mg-details"><summary>Respaldo de vínculos de compras</summary><p>Los vínculos se guardan solo en este navegador. No se modifican las compras originales. El respaldo es independiente del de intervenciones.</p><button type="button" id="ti-links-backup">Descargar respaldo</button><label>Importar respaldo<input type="file" id="ti-links-import" accept="application/json,.json"></label><p id="ti-links-status" role="status"></p></details>`);
  dialog.querySelector('#ti-link-form').onsubmit=event=>{event.preventDefault();const f=event.target;try{const link=validateLink({id:crypto.randomUUID(),equipmentId:eq.id,purchaseId:f.purchase.value,amount:f.amount.value,eventId:f.event.value,note:f.note.value},links,getData(),records().events||[]);persist([...links,link]);assetList();equipment(eq);}catch(error){dialog.querySelector('#ti-link-status').textContent=error.message;}};
  dialog.querySelectorAll('[data-unlink]').forEach(button=>button.onclick=()=>{try{persist(links.filter(l=>l.id!==button.dataset.unlink));assetList();equipment(eq);}catch(error){dialog.querySelector('#ti-link-status').textContent=error.message;}});
  dialog.querySelectorAll('[data-asset-ticket]').forEach(button=>button.onclick=()=>{dialog.close();openTicket(history.tickets[Number(button.dataset.assetTicket)]);});
  dialog.querySelector('#ti-links-backup').onclick=()=>{const url=URL.createObjectURL(new Blob([storageProblem&&originalSaved?originalSaved:JSON.stringify({version:1,links},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vinculos-compras-equipos-'+api.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  dialog.querySelector('#ti-links-import').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>5000000)throw Error('Archivo demasiado grande.');const parsed=JSON.parse(await file.text());if(parsed.version!==1||!Array.isArray(parsed.links))throw Error('Respaldo no reconocido.');const ids=new Set();let next=[];for(const item of parsed.links){if(ids.has(item.id))throw Error('Hay identificadores duplicados.');ids.add(item.id);next.push(validateLink(item,next,getData(),records().events||[]));}if(storageProblem)throw Error('Revisa el registro local dañado antes de importar.');const merged=[...new Map([...links,...next].map(l=>[l.id,l])).values()];for(const item of merged)validateLink(item,merged,getData(),records().events||[]);persist(merged);equipment(eq);}catch(error){dialog.querySelector('#ti-links-status').textContent=error.message;}};
 }
 const inventory=document.getElementById('page-base-conocimientos');
 let assetCard=null;
 if(inventory){
  assetCard=document.createElement('section');assetCard.className='mg-card ti-evolution';
  assetCard.innerHTML=heading('Uso e historial de equipos','Consulta el destino de cada equipo y su costo acumulado conocido.')+'<details class="mg-details"><summary>Consultar costos e historial por equipo</summary><label>Buscar código, serie, persona o modelo<input type="search" class="ti-asset-search" placeholder="Buscar equipo"></label><p class="ti-asset-note mg-note"></p><div class="mg-table-scroll"><table><thead><tr><th>Equipo</th><th>Estado / asignación</th><th>Costo conocido</th><th>Registros</th><th>Detalle</th></tr></thead><tbody class="ti-asset-rows"></tbody></table></div></details>';
  inventory.querySelector('.tickets-page-header')?.after(assetCard);
  assetCard.querySelector('details').addEventListener('toggle',()=>{if(assetCard.querySelector('details').open)assetList();});
  assetCard.querySelector('input').oninput=assetList;
 }
 function assetList(){
  if(!assetCard||!assetCard.closest('.page-section')?.classList.contains('active-page')||!assetCard.querySelector('details').open)return;
  const data=getData(),query=norm(assetCard.querySelector('input').value),company=root.CompanyScope?.get()||'';
  const rows=clean(data).equipos.filter(eq=>(!company||api.company(eq.empresa)===api.company(company))&&(!query||norm([eq.nombre_codigo,eq.serial,eq.usuario_nombre,eq.modelo].join(' ')).includes(query))).map(eq=>equipmentHistory(eq,data,records().events||[],links,getMovements())).sort((a,b)=>(b.knownTotal??-1)-(a.knownTotal??-1));
  assetCard.querySelector('.ti-asset-note').textContent=`${rows.length} equipos · ${company||'Todas las empresas'} · Se muestran hasta 100, ordenados por costo conocido. Historial completo disponible por equipo; no se infieren compras por asignación actual.`;
  assetCard.querySelector('tbody').innerHTML=rows.slice(0,100).map((h,index)=>`<tr><td><strong>${esc(h.eq.nombre_codigo||h.eq.serial||'Sin código')}</strong><small>${esc(h.eq.serial||'Sin serie')} · ${esc(h.eq.modelo||'Sin modelo')}</small></td><td>${esc(h.eq.estado||'Sin estado')}<small>${esc(h.eq.usuario_nombre||'Sin asignar')} · ${esc(api.company(h.eq.empresa))}</small></td><td>${money(h.knownTotal)}<small>${h.unknown} intervenciones sin costo</small></td><td>${h.valid.length} compras vinculadas · ${h.actions.length} intervenciones</td><td><button type="button" data-asset-history="${index}">Historial y costos</button><button type="button" data-asset-sheet="${index}">Ficha</button></td></tr>`).join('')||'<tr><td colspan="5">Sin equipos que coincidan.</td></tr>';
  assetCard.querySelector('tbody').onclick=event=>{const history=event.target.closest('[data-asset-history]'),sheet=event.target.closest('[data-asset-sheet]');if(history)equipment(rows[Number(history.dataset.assetHistory)].eq);if(sheet)openEquipo(rows[Number(sheet.dataset.assetSheet)].eq);};
 }
 const equipmentButton=document.createElement('button');equipmentButton.type='button';equipmentButton.className='ti-equipment-history';equipmentButton.textContent='Ver historial y costos acumulados';
 document.querySelector('#equipo-detail-modal .modal-body')?.prepend(equipmentButton);equipmentButton.onclick=()=>{const eq=getActiveEquipment();if(eq)equipment(eq);};
 let renderQueued=false;
 function render(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;views.forEach(renderView);assetList();});}
 document.addEventListener('management-report-rendered',render);
 document.addEventListener('support-page-changed',render);
 render();return {render,equipment};
}
const api={build,csv,category,summarize,validateLink,equipmentHistory,executed,init};if(typeof module==='object'&&module.exports)module.exports=api;else root.TiEvolution=api;
})(typeof window!=='undefined'?window:globalThis);
