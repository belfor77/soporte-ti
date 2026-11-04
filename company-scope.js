/* Un único ámbito de consulta; nunca modifica los registros de origen. */
(function(root){
'use strict';
const brands=[{name:'T-Sales',logo:'img/companies/tsales.png'},{name:'VPrime',logo:'img/companies/vprime.png'},{name:'Infinet',logo:'img/companies/infinet.png'}];
function canonical(value){
 const key=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(['','todas','todos','all'].includes(key))return '';
 return ({tsales:'T-Sales',vprime:'VPrime',infinet:'Infinet'})[key]||String(value).trim();
}
let selected='';
function filter(rows,getCompany=row=>row.empresa||row.company){return (Array.isArray(rows)?rows:[]).filter(row=>!selected||(canonical(getCompany(row))||'Sin empresa')===selected);}
function get(){return selected;}
function set(value){const next=canonical(value);if(next===selected){sync();return;}selected=next;sync();if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('company-scope-change',{detail:{company:selected}}));}
function sync(){
 if(typeof document==='undefined')return;
 document.querySelectorAll('[data-scope-company]').forEach(button=>{button.setAttribute('aria-pressed',String(canonical(button.dataset.scopeCompany)===selected));});
 document.querySelectorAll('.company-scope-status').forEach(node=>{node.textContent=selected?`Vista de ${selected}`:'Vista consolidada · Todas las empresas';});
 for(const id of ['mg-company','renewal-company','directory-company-filter','ingresos-filter-empresa','bajas-filter-empresa']){
  const select=document.getElementById(id);if(!select)continue;
  const option=[...select.options].find(o=>canonical(o.value)===selected);if(option)select.value=option.value;
 }
 for(const selector of ['#equip-company-tabs [data-company]','#compras-company-tabs [data-empresa]'])document.querySelectorAll(selector).forEach(button=>button.classList.toggle('active',canonical(button.dataset.company||button.dataset.empresa)===selected));
}
function brandMarkup(company){const brand=brands.find(b=>b.name===canonical(company));return brand?`<span class="company-logo"><img src="${brand.logo}" alt="${brand.name}"></span>`:'<span class="company-all-icon" aria-hidden="true">▦</span>';}
function mount(){
 const main=document.querySelector('main.main-content');if(!main)return;
 const nav=document.createElement('section');nav.className='company-scope';nav.setAttribute('aria-label','Consultar por empresa');
 nav.innerHTML=`<div class="company-scope-heading"><div><span class="company-scope-eyebrow">Centro de soporte · Empresas</span><h2>Una vista para cada empresa</h2></div><p class="company-scope-status" role="status" aria-live="polite"></p></div><div class="company-scope-options">${[{name:'',label:'Todas las empresas'},...brands].map(b=>`<button type="button" data-scope-company="${b.name}" aria-pressed="${!b.name}">${brandMarkup(b.name)}<span><strong>${b.label||b.name}</strong><small>${b.name?'Ver gestión de esta empresa':'Ver gestión consolidada'}</small></span></button>`).join('')}</div><p class="company-scope-help">Filtra Inicio, tickets, técnicos, equipos, usuarios, compras, visitas, SLA e informe gerencial. Se conserva al navegar. Los formularios de registro y paneles de administración mantienen su empresa propia.</p>`;
 main.querySelector('.main-header').after(nav);
 nav.addEventListener('click',event=>{const button=event.target.closest('[data-scope-company]');if(button)set(button.dataset.scopeCompany);});
 document.addEventListener('change',event=>{if(['mg-company','renewal-company','directory-company-filter','ingresos-filter-empresa','bajas-filter-empresa'].includes(event.target.id))set(event.target.value);});
 document.addEventListener('click',event=>{const button=event.target.closest('#equip-company-tabs [data-company],#compras-company-tabs [data-empresa]');if(button)set(button.dataset.company||button.dataset.empresa);});
 // Identidad visual en los selectores existentes, sin tocar tarjetas de formularios.
 document.querySelectorAll('#equip-company-tabs [data-company],#compras-company-tabs [data-empresa]').forEach(button=>{const value=button.dataset.company||button.dataset.empresa;if(canonical(value))button.insertAdjacentHTML('afterbegin',brandMarkup(value));});
 sync();
}
const api={brands,canonical,get,set,filter,sync,brandMarkup,mount};if(typeof module==='object'&&module.exports)module.exports=api;else root.CompanyScope=api;
})(typeof window!=='undefined'?window:globalThis);
