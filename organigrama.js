(function(root){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const rut=v=>norm(v).replace(/[^0-9k]/g,'');
const company=v=>({'t-sales spa':'T-Sales','v-prime spa':'VPrime','infinet spa':'Infinet'}[norm(v)]||v||'Sin empresa');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function equipmentFor(person,equipment,people){
 return equipment.filter(e=>{
  if(rut(person.rut)&&rut(e.usuario_rut))return rut(person.rut)===rut(e.usuario_rut);
  if(norm(person.email)&&norm(e.usuario_email))return norm(person.email)===norm(e.usuario_email);
  // Full names are used only when unique and within the same company.
  return !!norm(person.name)&&norm(person.name)===norm(e.usuario_nombre)&&company(person.company)===company(e.empresa)&&people.filter(p=>norm(p.name)===norm(person.name)&&company(p.company)===company(person.company)).length===1;
 });
}
function groupsFor(people,scope='',query=''){
 const byId=new Map(people.map(p=>[p.id,p])),groups=new Map(),q=norm(query);
 people.filter(p=>p.type==='Colaborador Bnovus'&&(!scope||company(p.company)===scope)).forEach(p=>{
  const key=company(p.company)+'|'+(p.parentId||'none');
  if(!groups.has(key))groups.set(key,{key,company:company(p.company),supervisor:byId.get(p.parentId),members:[]});
  groups.get(key).members.push(p);
 });
 return [...groups.values()].map(g=>({...g,members:g.members.filter(p=>!q||norm([p.name,p.rut,p.area,g.supervisor?.name,g.supervisor?.rut,g.company].join(' ')).includes(q))})).filter(g=>g.members.length).sort((a,b)=>a.company.localeCompare(b.company)||String(a.supervisor?.name||'ZZZ').localeCompare(b.supervisor?.name||'ZZZ'));
}
function init({getEquipos,openEquipo,refresh}){
 const host=document.getElementById('page-organigrama');if(!host)return null;
 const source=root.OrganigramaSource,people=source?.people||[];let view='map'; let query='',scope=root.CompanyScope?.get()||'',open=new Set(),eqs=[],status='Inventario aún no actualizado en esta vista.';
 host.innerHTML=`<header class="org-hero"><span class="org-eyebrow">PERSONAS · EQUIPOS · EMPRESAS</span><h1>Organigrama</h1><p>Descubre quién lidera cada equipo y la tecnología que acompaña a sus personas.</p><small>Nómina Bnovus · Corte 28 de octubre de 2026</small></header><div class="org-toolbar"><label>Buscar persona, supervisor, RUT o área<input id="org-search" type="search" placeholder="Ej.: Gisselle" autocomplete="off"></label><label>Empresa<select id="org-company"><option value="">Todas las empresas</option>${[...new Set(people.filter(p=>p.company).map(p=>company(p.company)))].sort().map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><button type="button" data-org-action="refresh">Actualizar equipos</button><button type="button" data-org-action="expand">Expandir equipos</button><button type="button" data-org-action="collapse">Contraer</button></div><p class="org-status" role="status"></p><div class="org-kpis"></div><p class="org-help">Pulsa una jefatura para desplegar sus colaboradores; pulsa una persona para ver sus PC. Una jefatura puede aparecer en más de una empresa. La estructura corresponde al Excel; los equipos se consultan en el inventario actual.</p><div class="org-view-switch"><button type="button" data-org-view="map" aria-pressed="true">Mapa interactivo</button><button type="button" data-org-view="list" aria-pressed="false">Vista de tarjetas</button></div><div class="org-map"></div><div class="org-tree" hidden></div><dialog class="org-person-dialog"><button type="button" class="org-dialog-close" aria-label="Cerrar ficha">✕</button><div class="org-dialog-content"></div></dialog>`;
 const $=s=>host.querySelector(s);
 function deviceMarkup(p){const devices=equipmentFor(p,eqs,people);return devices.length?devices.map(e=>`<div class="org-device"><span aria-hidden="true">▣</span><div><strong>${esc(e.nombre_codigo||e.hostname||'PC sin código')}</strong><p>${esc([e.marca,e.modelo].filter(Boolean).join(' ')||'Modelo sin registrar')}</p><small>Serie: ${esc(e.serial||'Sin registrar')} · ${esc(e.estado||'Sin estado')}</small><p>${esc([e.cpu,e.ram&&'RAM '+e.ram,e.disco_duro].filter(Boolean).join(' · '))}</p><button type="button" data-org-device="${eqs.indexOf(e)}">Ver ficha del equipo</button></div></div>`).join(''):'<p class="org-no-device">Sin equipo vinculado en el inventario disponible.</p>';}
 function personMarkup(p){const count=equipmentFor(p,eqs,people).length;return `<details class="org-person"><summary><span class="org-avatar">${esc(p.name.split(' ').slice(0,2).map(n=>n[0]).join(''))}</span><span><strong>${esc(p.name)}</strong><small class="org-rut">RUT: ${esc(p.rut||'No informado en la nómina')}</small><small>${esc(p.area||'Sin área')} · ${count} PC vinculados</small></span><span class="org-chevron">⌄</span></summary><div class="org-person-body"><p>RUT: ${esc(p.rut||'Pendiente')}<br>${esc(p.email||'Correo no informado')}</p>${p.note?`<p>${esc(p.note)}</p>`:''}${deviceMarkup(p)}</div></details>`;}
 const dialog=$('.org-person-dialog');
 $('.org-dialog-close').onclick=()=>dialog.close();
 const map=root.OrganigramaMap?.init({host:$('.org-map'),deviceCount:p=>equipmentFor(p,eqs,people).length,onPerson:p=>{ $('.org-dialog-content').innerHTML=`<span class="org-eyebrow">PERSONA Y EQUIPOS</span><h2>${esc(p.name)}</h2><p>RUT: ${esc(p.rut||'No informado en la nómina')}</p><p>${esc(p.email||'Correo no informado')}</p><p>${esc(p.area||'')}</p>${p.note?`<p>${esc(p.note)}</p>`:''}${deviceMarkup(p)}`;dialog.showModal();}});
 function render(){
  eqs=getEquipos()||[];const groups=groupsFor(people,scope,query),members=groups.flatMap(g=>g.members),linked=members.filter(p=>equipmentFor(p,eqs,people).length).length;
  $('#org-company').value=scope;$('.org-status').textContent=status;
  $('.org-kpis').innerHTML=[['Personas',members.length],['Jefaturas',new Set(groups.map(g=>g.supervisor?.id).filter(Boolean)).size],['Con PC vinculado',linked],['Sin PC vinculado',members.length-linked]].map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('');
  map?.render(groups,{search:!!query});
  const companies=[...new Set(groups.map(g=>g.company))];
  $('.org-tree').innerHTML=companies.map(c=>`<section class="org-company-branch"><h2><span aria-hidden="true">▦</span> ${esc(c)} <small>${groups.filter(g=>g.company===c).reduce((n,g)=>n+g.members.length,0)} personas</small></h2><div class="org-supervisors">${groups.filter(g=>g.company===c).map(g=>`<details class="org-supervisor" data-org-group="${esc(g.key)}" ${open.has(g.key)||query?'open':''}><summary><span class="org-avatar org-leader">${g.supervisor?'◈':'?'}</span><span><small>${g.supervisor?'SUPERVISOR / JEFATURA':'POR COMPLETAR'}</small><strong>${esc(g.supervisor?.name||'Sin supervisor informado')}</strong>${g.supervisor?`<small class="org-rut">RUT: ${esc(g.supervisor.rut||'No informado en la nómina')}</small>`:''}<small>${g.members.length} personas a cargo en esta empresa</small></span><span class="org-chevron">⌄</span></summary>${g.supervisor?`<details class="org-leader-info"><summary>Datos y PC de la jefatura</summary><p>${esc(g.supervisor.email||'Correo no informado')} · RUT ${esc(g.supervisor.rut||'pendiente')}</p>${deviceMarkup(g.supervisor)}</details>`:''}<div class="org-members">${g.members.map(personMarkup).join('')}</div></details>`).join('')}</div></section>`).join('')||'<p class="org-empty">No hay personas para esta búsqueda o empresa.</p>';
  host.querySelectorAll('[data-org-group]').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)open.add(d.dataset.orgGroup);else open.delete(d.dataset.orgGroup);}));
 }
 async function update(){status='Actualizando inventario…';render();try{await refresh();status='Inventario actualizado · '+new Date().toLocaleTimeString('es-CL');}catch(_){status='No se pudo actualizar el inventario. Se muestra la información disponible.';}render();}
 $('#org-search').addEventListener('input',e=>{query=e.target.value;render();});
 $('#org-company').addEventListener('change',e=>{scope=e.target.value;if(root.CompanyScope)root.CompanyScope.set(scope);render();});
 host.addEventListener('click',e=>{const mode=e.target.closest('[data-org-view]')?.dataset.orgView;if(mode){view=mode;$('.org-map').hidden=view!=='map';$('.org-tree').hidden=view!=='list';host.querySelectorAll('[data-org-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.orgView===view)));}const d=e.target.closest('[data-org-device]');if(d){if(dialog.open)dialog.close();openEquipo(eqs[Number(d.dataset.orgDevice)]);}const action=e.target.closest('[data-org-action]')?.dataset.orgAction;if(action==='refresh')update();if(action==='expand'){map?.expand();groupsFor(people,scope,query).forEach(g=>open.add(g.key));render();}if(action==='collapse'){query='';$('#org-search').value='';open.clear();render();map?.collapse();}});
 document.addEventListener('company-scope-change',()=>{scope=root.CompanyScope.get();render();});
 document.addEventListener('support-page-changed',e=>{if(e.detail.page==='page-organigrama')update();});render();return {render};
}
const api={init,equipmentFor,groupsFor,company};if(typeof module==='object'&&module.exports)module.exports=api;else root.Organigrama=api;
})(typeof window!=='undefined'?window:globalThis);
