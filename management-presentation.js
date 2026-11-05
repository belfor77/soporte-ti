/* Informe ejecutivo: importes realizados y escenarios sin sumar gastos duplicados. */
(function(root){
'use strict';
const R=root.NotebookRenewal||(typeof require==='function'?require('./notebook-renewal.js'):null);
const I=()=>root.SupportInsights||(typeof require==='function'?require('./support-insights.js'):null);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function build(report,data,quotes){
 const api=I();
 const executed=report.purchases.filter(p=>['entregado','entregada','recibido','recibida','pagado','pagada','comprado','comprada','completado','completada','stock'].includes(norm(p.estado))&&api.civil(p.fecha)<=report.asOf);
 const known=executed.filter(p=>api.amount(p.valor_total)!==null);
 const events=report.events.filter(e=>e.cost!==null);
 const realPurchases=(root.SupportDataQuality||(typeof require==='function'?require('./support-demo-registry.js'):null)).real(data.compras||[],'compras');
 const alternatives=report.renewal.map(row=>{
  const history=realPurchases.filter(p=>api.company(p.empresa)===api.company(row.eq.empresa));
  const ramRef=R.purchaseReference(history,'ram',Math.max(0,16-(row.ram??16)),report.asOf);
  const ssdRef=R.purchaseReference(history,'ssd',0,report.asOf);
  const upgrade=R.upgradeEstimate(row,{ram:ramRef?.price,ssd:ssdRef?.price,labor:0},16);
  const quote=quotes.filter(q=>api.company(q.company)===api.company(row.eq.empresa)&&q.date<=report.asOf&&q.until>=report.asOf&&q.unit>0).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
  return {row,upgrade,ramRef,ssdRef,quote,horizon:R.upgradeHorizon(row),difference:upgrade.total!==null&&quote?quote.unit-upgrade.total:null};
 }).filter(a=>a.upgrade.ram||a.upgrade.ssd||a.row.priority==='urgente').sort((a,b)=>a.horizon.rank-b.horizon.rank);
 const closures=report.tickets.filter(t=>['resuelto','cerrado'].includes(norm(t.estado))&&api.date(t.created_at)&&api.date(t.fecha_resolucion||t.resolved_at||t.closed_at)>=api.date(t.created_at)&&api.inPeriod(t.fecha_resolucion||t.resolved_at||t.closed_at,report.start,report.end)&&api.civil(t.fecha_resolucion||t.resolved_at||t.closed_at)<=report.asOf);
 const candidates=alternatives.filter(a=>a.upgrade.ram||a.upgrade.ssd);
 return {executed,purchaseTotal:known.length?known.reduce((sum,p)=>sum+api.amount(p.valor_total),0):null,purchaseUnknown:executed.length-known.length,unconfirmed:report.purchases.length-executed.length,eventTotal:events.length?events.reduce((sum,e)=>sum+e.cost,0):null,eventUnknown:report.events.length-events.length,alternatives,candidates,upgradeTotal:candidates.some(a=>a.upgrade.total!==null)?candidates.reduce((sum,a)=>sum+(a.upgrade.total??0),0):null,upgradeUnknown:candidates.filter(a=>a.upgrade.total===null).length,closures:closures.length};
}
function init({host,getReport,getData,getQuotes,getSources}){
 const api=I(),money=api.money;
 const section=document.createElement('section');section.className='mg-card';section.id='mg-investment';
 section.innerHTML='<span class="mg-eyebrow">Gasto registrado y escenarios futuros</span><h2>Inversión y alternativas</h2><p>Compras e intervenciones del período, separadas de las opciones para mejorar o renovar el inventario actual.</p><div id="investment-summary" class="mg-kpis"></div><p class="mg-note" id="investment-note"></p><details class="mg-details"><summary>Ver compras que respaldan la inversión</summary><div class="mg-table-scroll"><table><thead><tr><th>Fecha / producto</th><th>Empresa / proveedor</th><th>Estado / respaldo</th><th>Total registrado</th></tr></thead><tbody id="investment-purchases"></tbody></table></div></details><div class="mg-section-heading"><h3>Mejorar o reemplazar: comparación por equipo</h3><label>Buscar equipo<input type="search" id="investment-search" placeholder="Código, persona, empresa o modelo"></label></div><p class="mg-note">Objetivo de RAM: 16 GB. Precios históricos de la misma empresa. La diferencia compara piezas con un notebook completo; no es ahorro realizado. Validar configuración, impuestos, instalación y compatibilidad. Los candidatos no son una solicitud automática de compra.</p><div class="mg-table-scroll"><table><thead><tr><th>Equipo / responsable</th><th>Mejora propuesta</th><th>Piezas estimadas</th><th>Uso previsto tras mejora</th><th>Notebook nuevo</th><th>Diferencia de alternativas</th><th>Orientación</th></tr></thead><tbody id="investment-alternatives"></tbody></table></div><p id="investment-count" class="mg-note"></p>';
 host.querySelector('.mg-backup').before(section);
 const get=id=>document.getElementById(id);
 let model=null,lastContext='',updated='',page=0,opener=null;
 const dialog=document.createElement('dialog');dialog.id='management-presentation';dialog.setAttribute('aria-labelledby','presentation-title');
 dialog.innerHTML='<header class="presentation-toolbar"><strong id="presentation-title">Gestión de soporte TI</strong><div><button type="button" id="presentation-print">Imprimir / guardar PDF</button><button type="button" id="presentation-close">Salir de presentación</button></div></header><p id="presentation-context"></p><div id="presentation-slides"></div><footer class="presentation-controls"><button type="button" id="presentation-prev">← Anterior</button><span id="presentation-position" role="status" aria-live="polite"></span><button type="button" id="presentation-next">Siguiente →</button></footer>';
 document.body.append(dialog);
 const button=document.createElement('button');button.type='button';button.id='mg-present';button.textContent='Presentar a gerencia';host.querySelector('.mg-heading .mg-actions').prepend(button);
 const reference=(ref,title)=>ref?`<details><summary>${title}: ${money(ref.price)} por unidad</summary><p>${esc(ref.label)}</p></details>`:`<small>${title}: sin compra comparable</small>`;
 function alternatives(){
  if(!model)return;
  const query=norm(get('investment-search').value);
  const rows=model.alternatives.filter(a=>!query||norm([a.row.eq.nombre_codigo,a.row.eq.serial,a.row.eq.usuario_nombre,a.row.eq.modelo,a.row.eq.empresa].join(' ')).includes(query));
  get('investment-alternatives').innerHTML=rows.map(a=>{
   const eq=a.row.eq,has=a.upgrade.ram||a.upgrade.ssd;
   return `<tr><td><strong>${esc(eq.nombre_codigo||eq.serial||'Sin código')}</strong><small>${esc(eq.usuario_nombre||'Sin asignar')} · ${esc(api.company(eq.empresa))}</small><small>${esc(eq.modelo||'Sin modelo')}</small></td><td>${has?[a.upgrade.ram?'RAM a 16 GB':'',a.upgrade.ssd?'HDD → SSD':''].filter(Boolean).join(' + '):'Diagnóstico antes de proponer piezas'}</td><td>${has?money(a.upgrade.total):'Sin mejora identificada'}${a.upgrade.ram?reference(a.ramRef,'RAM'):''}${a.upgrade.ssd?reference(a.ssdRef,'SSD'):''}</td><td>${has?esc(a.horizon.label):'Por evaluar'}<details><summary>Criterios y condiciones</summary><p>${esc(a.horizon.reason)}</p></details></td><td>${a.quote?money(a.quote.unit)+`<small>${esc(a.quote.vendor)} · ${esc(a.quote.reference)}</small><small>${esc(a.quote.scope||'Configuración sin detallar')} · vence ${esc(a.quote.until)}</small>`:'Pendiente de cotización'}</td><td>${has&&a.difference!==null?money(a.difference):'Comparación pendiente'}<small>${a.difference!==null&&a.difference<0?'Las piezas superan el precio cotizado':'Nuevo menos piezas; instalación excluida'}</small></td><td>${has?esc(a.horizon.decision):'Evaluar renovación'}<small>Validación técnica pendiente</small></td></tr>`;
  }).join('')||'<tr><td colspan="7">Sin equipos que coincidan.</td></tr>';
  get('investment-count').textContent=`${rows.length} de ${model.alternatives.length} equipos · Horizonte orientativo: tope de 36 meses, hasta 10 años desde lanzamiento del CPU o 7 desde compra/uso, lo que ocurra primero; no predice fallas.`;
 }
 const kpis=items=>'<div class="mg-kpis">'+items.map(([label,value,note])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note||'')}</small></div>`).join('')+'</div>';
 function slides(report){
  const m=model;
  const recovered=report.recoveries.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const renewalCount=report.buckets.urgente;
  const short=m.candidates.filter(a=>a.horizon.rank>=2).length;
  const evolution=root.TiEvolution?.build(getData(),{start:report.start,end:report.end,company:report.company,asOf:report.asOf});
  const evolutionNote=evolution?`<p class="mg-note">Evolución de compras: ${evolution.variation===null?'sin comparación suficiente':(evolution.variation>0?'+':'')+evolution.variation.toFixed(1)+'%'} respecto del ${esc(evolution.prevStart)} al ${esc(evolution.prevEnd)}. ${evolution.summary.unknown} compras sin monto conocido.</p>`:'';
  const sources=Object.entries(getSources()||{}).map(([key,value])=>key+': '+value).join(' · ');
  const brandView=root.CompanyScope ? '<div class="presentation-brands">'+(report.company ? root.CompanyScope.brandMarkup(report.company) : root.CompanyScope.brands.map(b=>root.CompanyScope.brandMarkup(b.name)).join(''))+'</div>' : '';
  const content=[
   ['Resultados de soporte',kpis([['Solicitudes recibidas',report.metrics.received,'Creadas en el período'],['Tickets resueltos en el período',m.closures,'Por fecha de cierre; incluye solicitudes anteriores'],['Pendientes de la cohorte',report.metrics.pending,'Solicitudes del período aún abiertas'],['Equipos recuperados',report.recovered,'Seriales distintos con intervención registrada']])+`<h3>Problemas más frecuentes</h3>${report.categories.length?'<ul>'+report.categories.slice(0,5).map(c=>`<li>${esc(c.label)}: <strong>${c.count}</strong> tickets</li>`).join('')+'</ul>':'<p>Sin categorías registradas para este período.</p>'}<p class="mg-note">Respuesta promedio: ${api.duration(report.metrics.response)} (${report.metrics.responseN} registros medibles). Los cierres dependen de fechas de resolución válidas.</p>`],
   ['Trabajo realizado y equipos recuperados',kpis([['Acciones completadas',report.events.length,'Registradas con respaldo'],['Recuperados / reutilizados',report.recovered,'No incluye cambios de notebook'],['Costo de intervenciones',money(m.eventTotal),`${m.eventUnknown} acciones sin costo registrado`]])+`<h3>Intervenciones recientes</h3>${recovered.length?'<ul>'+recovered.slice(0,5).map(e=>`<li><strong>${esc(e.serial)}</strong> · ${esc(e.date)} · ${esc(e.result||'Resultado pendiente de detallar')}<small>Respaldo: ${esc(e.evidence)}</small></li>`).join('')+'</ul>':'<p>No hay recuperaciones registradas en el período. Completa las intervenciones y su respaldo en el informe.</p>'}<p class="mg-note">Se muestran hasta cinco recuperaciones recientes; el informe conserva el detalle completo.</p>`],
   ['Inversión y alternativas',kpis([['Compras realizadas',money(m.purchaseTotal),`${m.executed.length} registros; ${m.purchaseUnknown} sin monto`],['Mejorar equipos actuales',money(m.upgradeTotal),`${m.candidates.length} candidatos; ${m.upgradeUnknown} sin precio completo`],['Renovación en 12 meses',money(report.plan.knownTotal),`${report.plan.count} equipos; ${report.plan.unquoted} sin cotización`]])+`<p class="presentation-callout">Gasto realizado y presupuestos futuros son cifras separadas. Las opciones de mejora y renovación pueden corresponder a los mismos equipos: no se suman.</p><p>Costos de intervenciones: <strong>${money(m.eventTotal)}</strong>. Se muestran aparte porque pueden incluir piezas ya registradas en Compras.</p><p class="mg-note">RAM objetivo: 16 GB. Mejoras: solo piezas según historial de la misma empresa. Renovación: cotizaciones vigentes. No se declara ahorro realizado.</p>${evolutionNote}`],
   ['Decisiones y próximos pasos',`<ul class="presentation-decisions"><li><strong>Validar ${m.candidates.length} candidatos a mejora.</strong> Confirmar ranuras, memoria, disco y diagnóstico antes de comprar; ${short} requieren identificación o revisión prioritaria de renovación.</li><li><strong>Revisar ${renewalCount} equipos con umbral de renovación alcanzado.</strong> El umbral orienta la planificación; requiere validación técnica.</li><li><strong>Completar precios y cotizaciones.</strong> ${m.upgradeUnknown} candidatos sin precio completo de mejora; ${report.plan.unquoted} equipos sin cotización de renovación en 12 meses.</li><li><strong>Conciliar gasto y respaldos.</strong> ${m.unconfirmed} compras del período sin estado de realización confirmado; ${m.eventUnknown} intervenciones sin costo. No sumar compras e intervenciones sin revisar duplicaciones.</li></ul><p class="presentation-callout">Propuesta para revisión de jefatura. Estos registros no representan aprobaciones ni órdenes de compra.</p>`]
  ];
  get('presentation-slides').innerHTML=content.map(([title,body],index)=>`<section class="presentation-slide" data-slide="${index}" aria-label="${index+1}. ${esc(title)}"><span class="mg-eyebrow">Informe gerencial · ${index+1} / 4</span><h2>${title}</h2>${brandView}<p class="presentation-slide-context">${esc(lastContext)} · ${esc(updated)}</p>${body}<p class="mg-note presentation-sources">Fuentes: ${esc(sources||'Cobertura pendiente de verificar')}. Intervenciones y cotizaciones locales a este navegador.</p></section>`).join('');
  get('presentation-context').textContent=lastContext+' · '+updated;
  show(page);
 }
 function show(index){
  page=Math.max(0,Math.min(3,index));dialog.querySelectorAll('[data-slide]').forEach((node,i)=>{node.hidden=i!==page;});
  get('presentation-position').textContent=`${page+1} de 4`;get('presentation-prev').disabled=page===0;get('presentation-next').disabled=page===3;
  dialog.scrollTop=0;
 }
 function render(){
  const report=getReport();if(!report)return;
  model=build(report,getData(),getQuotes());lastContext=`${report.company||'Todas las empresas'} · ${report.start} al ${report.end} · Inventario al ${report.asOf}`;
  updated='Vista preparada '+new Date().toLocaleString('es-CL',{timeZone:'America/Santiago'});
  get('investment-summary').innerHTML=kpis([['Compras realizadas',money(model.purchaseTotal),`${model.executed.length} compras con estado confirmado`],['Intervenciones registradas',money(model.eventTotal),'Separadas: pueden incluir compras ya registradas'],['Mejoras propuestas',money(model.upgradeTotal),`${model.upgradeUnknown} candidatos pendientes de precio`]]);
  get('investment-note').textContent=`${lastContext}. ${model.purchaseUnknown} compras realizadas sin monto; ${model.unconfirmed} compras sin realización confirmada; ${model.eventUnknown} intervenciones sin costo. Importes parciales si faltan datos. No sumar compras e intervenciones sin conciliarlas. Las proyecciones no son gasto ejecutado.`;
  get('investment-purchases').innerHTML=model.executed.map(p=>`<tr><td>${esc(p.fecha)}<small>${esc(p.producto)}</small></td><td>${esc(api.company(p.empresa))}<small>${esc(p.proveedor||'Sin proveedor')}</small></td><td>${esc(p.estado)}<small>${esc(p.factura||'Sin factura registrada')}</small></td><td>${money(api.amount(p.valor_total))}</td></tr>`).join('')||'<tr><td colspan="4">Sin compras con realización confirmada en el período.</td></tr>';
  alternatives();if(dialog.open)slides(report);
 }
 button.onclick=()=>{render();if(!model)return;opener=document.activeElement;page=0;slides(getReport());dialog.showModal();document.body.classList.add('management-presenting');get('presentation-close').focus();};
 get('investment-search').oninput=alternatives;
 get('presentation-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{document.body.classList.remove('management-presenting');opener?.focus();});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(page+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(page-1);}});
 get('presentation-prev').onclick=()=>show(page-1);get('presentation-next').onclick=()=>show(page+1);get('presentation-print').onclick=()=>window.print();
 return {render};
}
const api={build,init};if(typeof module==='object'&&module.exports)module.exports=api;else root.ManagementPresentation=api;
})(typeof window!=='undefined'?window:globalThis);
