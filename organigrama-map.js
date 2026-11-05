(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function layout(groups,companiesOpen,teamsOpen){
 const nodes=[],edges=[];let y=100;
 for(const company of [...new Set(groups.map(g=>g.company))]){
  const start=y,children=[];
  if(companiesOpen.has(company))for(const g of groups.filter(g=>g.company===company)){
   const expanded=teamsOpen.has(g.key),height=expanded?Math.max(190,Math.ceil(g.members.length/5)*170):190,cy=y+height/2;
   const id='team:'+g.key;nodes.push({id,type:'team',x:510,y:cy,group:g,expanded});children.push(id);
   if(expanded)g.members.forEach((p,i)=>{const memberId=g.key+':'+p.id;nodes.push({id:memberId,type:'person',x:850+(i%5)*190,y:y+85+Math.floor(i/5)*170,person:p});edges.push([id,memberId]);});
   y+=height+35;
  }
  const id='company:'+company;nodes.push({id,type:'company',x:170,y:children.length?(start+y-35)/2:y+80,company,expanded:companiesOpen.has(company),count:groups.filter(g=>g.company===company).reduce((n,g)=>n+g.members.length,0)});children.forEach(child=>edges.push([id,child]));
  if(!children.length)y+=210;y+=90;
 }
 return {nodes,edges,width:Math.max(750,...nodes.map(n=>n.x+130)),height:y};
}
function init({host,onPerson,deviceCount}){
 let groups=[],companies=new Set(),teams=new Set(),x=40,y=30,z=.8,graph,drag=null,moved=false,selected='';
 host.innerHTML=`<div class="org-map-tools"><span>MAPA DE PERSONAS</span><button type="button" data-map="out" aria-label="Alejar mapa">−</button><output class="org-map-zoom">80%</output><button type="button" data-map="in" aria-label="Acercar mapa">+</button><button type="button" data-map="fit">Ver todo</button><button type="button" data-map="reset">Solo empresas</button><button type="button" data-map="full">Pantalla completa</button></div><p class="org-map-hint">Empresa → supervisor → ejecutivos · Arrastra el fondo para moverte · Usa + y − o la rueda para acercarte</p><div class="org-map-viewport" tabindex="0" aria-label="Mapa del organigrama. Arrastra para desplazarte y usa los botones para ampliar."><div class="org-map-world"><svg class="org-map-lines" aria-hidden="true"></svg><div class="org-map-nodes"></div></div></div>`;
 const viewport=host.querySelector('.org-map-viewport'),world=host.querySelector('.org-map-world');
 function transform(){world.style.transform=`translate(${x}px,${y}px) scale(${z})`;host.querySelector('.org-map-zoom').textContent=Math.round(z*100)+'%';}
 function fit(){if(!graph?.nodes.length||!viewport.clientWidth||!viewport.clientHeight)return;z=Math.max(.08,Math.min(1,(viewport.clientWidth-80)/graph.width,(viewport.clientHeight-80)/graph.height));x=(viewport.clientWidth-graph.width*z)/2;y=(viewport.clientHeight-graph.height*z)/2;transform();}
 function zoom(factor){const next=Math.max(.08,Math.min(2,z*factor)),cx=viewport.clientWidth/2,cy=viewport.clientHeight/2;x=cx-(cx-x)*next/z;y=cy-(cy-y)*next/z;z=next;transform();}
 function draw(focus){
  graph=layout(groups,companies,teams);const lookup=new Map(graph.nodes.map(n=>[n.id,n]));
  const svg=host.querySelector('svg');svg.setAttribute('width',graph.width);svg.setAttribute('height',graph.height);
  svg.innerHTML=graph.edges.map(([a,b])=>{const p=lookup.get(a),q=lookup.get(b),r=p.type==='company'?85:74;return `<path d="M ${p.x+r} ${p.y} C ${p.x+r+90} ${p.y},${q.x-150} ${q.y},${q.x-65} ${q.y}"/>`;}).join('');
  host.querySelector('.org-map-nodes').innerHTML=graph.nodes.map((n,i)=>{let name,rut='',meta='',initials='',expanded='';if(n.type==='company'){name=n.company;meta=n.count+' personas';initials='▦';expanded=`aria-expanded="${n.expanded}"`;}else {const p=n.type==='team'?n.group.supervisor:n.person;name=p?.name||'Sin supervisor informado';rut=p?'RUT: '+(p.rut||'No informado'):'';initials=p?.name.split(' ').slice(0,2).map(v=>v[0]).join('')||'?';meta=n.type==='team'?n.group.members.length+' personas · '+(n.expanded?'Contraer':'Desplegar'):deviceCount(p)+' PC vinculados';if(n.type==='team')expanded=`aria-expanded="${n.expanded}"`;}
   return `<div class="org-map-node org-map-${n.type} ${n.id===selected?'is-selected':''}" style="left:${n.x}px;top:${n.y}px"><button type="button" data-map-node="${i}" ${expanded} aria-label="${esc(name+' · '+rut+' · '+meta)}"><span class="org-map-initials">${esc(initials)}</span><strong>${esc(name)}</strong><small>${esc(rut)}</small><span class="org-map-node-meta">${esc(meta)}</span></button>${n.type==='team'&&n.group.supervisor?`<button class="org-map-person-info" type="button" data-map-info="${i}">Ver RUT y PC</button>`:''}</div>`;
  }).join('');
  if(focus){const n=lookup.get(focus);if(n){z=Math.max(.5,z);x=Math.min(260,viewport.clientWidth*.3)-n.x*z;y=viewport.clientHeight/2-n.y*z;}}
  transform();
 }
 host.addEventListener('click',async e=>{
  if(moved){moved=false;return;}const index=e.target.closest('[data-map-node]')?.dataset.mapNode,info=e.target.closest('[data-map-info]')?.dataset.mapInfo;
  if(info!==undefined){onPerson(graph.nodes[Number(info)].group.supervisor);return;}
  if(index!==undefined){const n=graph.nodes[Number(index)];selected=n.id;if(n.type==='person'){onPerson(n.person);draw();return;}const set=n.type==='company'?companies:teams,key=n.type==='company'?n.company:n.group.key;set.has(key)?set.delete(key):set.add(key);const focus=n.type==='company'&&set.has(key)?'team:'+groups.find(g=>g.company===n.company).key:n.id;draw(focus);return;}
  const action=e.target.closest('[data-map]')?.dataset.map;if(action==='in')zoom(1.25);if(action==='out')zoom(.8);if(action==='fit')fit();if(action==='reset'){companies.clear();teams.clear();draw();fit();}if(action==='full'){try{if(document.fullscreenElement)await document.exitFullscreen();else await host.requestFullscreen();}catch(_){}setTimeout(fit,100);}
 });
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={px:e.clientX,py:e.clientY,x,y};moved=false;viewport.setPointerCapture(e.pointerId);});
 viewport.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.px,dy=e.clientY-drag.py;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;x=drag.x+dx;y=drag.y+dy;transform();});
 const release=()=>{drag=null;setTimeout(()=>moved=false,0);};viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
 viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?.9:1.1);},{passive:false});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const delta={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]}[e.key];if(delta){e.preventDefault();x+=delta[0];y+=delta[1];transform();}if(e.key==='+'||e.key==='=')zoom(1.25);if(e.key==='-')zoom(.8);});
 let previousWidth=0;new ResizeObserver(()=>{const width=viewport.clientWidth;if(width&&width!==previousWidth)fit();previousWidth=width;}).observe(viewport);
 let first=true;return {render(next,{search=false}={}){groups=next;if(search){groups.forEach(g=>{companies.add(g.company);teams.add(g.key);});}draw();if(first||search){fit();if(viewport.clientWidth)first=false;}},expand(){groups.forEach(g=>{companies.add(g.company);teams.add(g.key);});draw();fit();},collapse(){companies.clear();teams.clear();draw();fit();}};
}
const api={init,layout};if(typeof module==='object'&&module.exports)module.exports=api;else root.OrganigramaMap=api;
})(typeof window!=='undefined'?window:globalThis);
