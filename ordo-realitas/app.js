(() => {
'use strict';
const D = window.ORDO_DADOS;
console.log('ORDO_DADOS carregado:', D);
const KEY = 'ordo-realitas-ficha-v1';
const STEPS = [ ['introducao','Introdução'], ['atributos','Atributos'], ['origem','Origem'], ['classe','Classe'], ['autenticacao','Autenticação'] ];
const freshState = () => ({step:'introducao', attrs:{FOR:1,AGI:1,INT:1,VIG:1,PRE:1},originId:'',originTab:'ordem',classId:'ocultista',classTab:'progressao',skillTab:'habilidades',trackId:'',custom:{origens:[],habilidades:[],rituais:[],trilhas:[],progressao:[]},profile:{nome:'',nex:'5%',aparencia:'',personalidade:'',historico:'',objetivo:'',assinatura:'',assinaturaImg:'',foto:''},options:{nex:false,municao:false,sanidade:false,patente:false},finalizado:false,initials:{},declass:false,attrPoints:4});
let state = freshState();
try {const saved=JSON.parse(localStorage.getItem(KEY)); if(saved&&typeof saved==='object'){
  state={...freshState(),...saved,attrs:{...freshState().attrs,...saved.attrs},profile:{...freshState().profile,...saved.profile},options:{...freshState().options,...saved.options},custom:{...freshState().custom,...saved.custom},attrPoints:saved.attrPoints||4};
  if(!STEPS.some(a=>a[0]===state.step))state.step='introducao';
  console.log('Estado carregado:',state);
}}catch(e){console.warn('Não foi possível ler o registro local',e);console.log('Usando estado fresco:',state);}
const $=sel=>document.querySelector(sel);
const e=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));const x=$('#save-status');if(x)x.textContent='REGISTRO LOCAL • SALVO AUTOMATICAMENTE';}catch(err){const x=$('#save-status');if(x)x.textContent='ARMAZENAMENTO CHEIO: EXPORTE SEUS DADOS';}};
const assets=name=>'assets/'+name;
const FX=window.FX;
const toast=m=>FX.toast(m);
const head=()=>`<header class="paper-head"><div><h1>ORDO REALITAS</h1><small>Documento oficial n: ${e(D.documento)}</small><small>-Termo de boas-vindas</small></div><img class="head-emblem" src="${assets('emblema-pequeno.png')}" alt="Símbolo da Ordem"></header>`;
const nav=()=>{$('#navigation').innerHTML=STEPS.map(([id,label],i)=>`<div class="nav-slot"><button class="nav-step ${state.step===id?'active':''}" type="button" data-go="${id}" ${state.step===id?'aria-current="step"':''}>${label}</button>${i<STEPS.length-1?'<span class="nav-rule" aria-hidden="true"></span>':''}</div>`).join('');};
function intro(){return `<article class="paper intro-cover">
<img src="${assets('emblema-grande.png')}" class="intro-emblem" alt="Emblema da Ordo Realitas">
<div class="wordmark">ORDO REALITAS</div>
<section class="intro-agent"><h2>Ficha do Agente</h2><p>Este documento é estritamente confidencial e não pode deixar a base sob nenhuma circunstância.</p></section>
<div class="doc-stamps"><span>Doc No: ${e(D.documento)}</span><span>Data: ${e(D.dataDocumento)}</span></div>
</article><article class="paper intro-terms">${head()}<h3>Bem-Vindo, Agente.</h3><p>A partir de agora, você faz parte da Ordo Realitas, uma organização dedicada a proteger a Membrana, a barreira que separa o nosso mundo do outro lado.</p><p>O que esperamos de você:</p>
${D.introducao.map((m,i)=>`<div class="mission"><span class="ink-label mission-number">${i+1}.</span><span class="ink-label">${e(m.titulo)}</span><p>${i===4?`<span class="redacted${state.declass?' open':''}" data-declass tabindex="0" role="button" aria-label="Trecho censurado. Clique para revelar.">${e(m.descricao)}</span>`:e(m.descricao)}</p></div>`).join('')}
<p style="margin-top:30px">Antes de terminarmos, precisamos apenas de algumas informações sobre você. Continue lendo o documento e insira as informações necessárias.</p><div class="sign-row"><div class="sign-slot">${FX.sigSVG('diretor','auto').replace('data-sig','data-auto="1" data-sig')}<small>Diretor da Ordo Realitas</small></div><div class="sign-slot">${FX.sigSVG('analista','auto').replace('data-sig','data-auto="1" data-sig')}<small>Análise de Campo</small></div></div><div class="last-note">*Não gravar o combate</div></article>`;}
const ATTR_POS=[{id:'FOR',x:135,y:170},{id:'AGI',x:270,y:70},{id:'INT',x:405,y:170},{id:'VIG',x:354,y:322},{id:'PRE',x:186,y:322}];
const CENTER={x:270,y:218};
const poly=(k)=> ATTR_POS.map(({x,y})=>`${(CENTER.x+(x-CENTER.x)*k).toFixed(1)},${(CENTER.y+(y-CENTER.y)*k).toFixed(1)}`).join(' ');
const remaining=()=>(state.attrPoints||4)+5-Object.values(state.attrs).reduce((a,b)=>a+Number(b||0),0);
function radar(editable=true){const lines=`<line x1="135" y1="170" x2="35" y2="170"/><line x1="270" y1="70" x2="343" y2="40"/><line x1="405" y1="170" x2="479" y2="205"/><line x1="354" y1="322" x2="413" y2="373"/><line x1="186" y1="322" x2="126" y2="373"/>`;
return `<div class="${editable?'attr-chart-wrap':'summary-chart'}">
<svg class="radar-svg" viewBox="0 0 540 414" aria-hidden="true" preserveAspectRatio="none">
<g class="spokes">${ATTR_POS.map(p=>`<line x1="${CENTER.x}" y1="${CENTER.y}" x2="${p.x}" y2="${p.y}"/>`).join('')}${lines}</g>
${[1,.8,.6,.4,.2].map(k=>`<polygon points="${poly(k)}"/>`).join('')}
<polygon class="radar-fill" points="${ATTR_POS.map(p=>{const k=Math.max(0,state.attrs[p.id])/5;return `${CENTER.x+(p.x-CENTER.x)*k},${CENTER.y+(p.y-CENTER.y)*k}`}).join(' ')}"/>
</svg>
${ATTR_POS.map(p=>`<div class="stat-node" style="left:${(100*p.x/540).toFixed(2)}%;top:${(100*p.y/414).toFixed(2)}%"><button type="button" class="stat-number" title="${editable?'Clique para aumentar '+p.id+'; clique com botão direito para reduzir':'Atributo '+p.id}" aria-label="${p.id}: ${state.attrs[p.id]}" ${editable?`data-stat-up="${p.id}"`:'disabled'}>${state.attrs[p.id]}</button>${editable?`<span class="stat-adjust"><button type="button" data-stat-down="${p.id}" aria-label="Diminuir ${p.id}">−</button><button type="button" data-stat-up="${p.id}" aria-label="Aumentar ${p.id}">+</button></span>`:''}</div>`).join('')}
<div class="stat-name for">FOR<small>força</small></div><div class="stat-name agi">AGI<small>agilidade</small></div><div class="stat-name int">INT<small>intelecto</small></div><div class="stat-name vig">VIG<small>vigor</small></div><div class="stat-name pre">PRE<small>presença</small></div>
</div>`;}
function attributes(){const points=state.attrPoints||4;return `<article class="paper">${head()}<h2 class="type-title attr-title">ATRIBUTOS</h2><div class="rule-dash"></div>${radar(true)}<div class="attribute-instructions"><p>Todos os seus atributos começam em 1 e você recebe ${points} pontos para distribuir entre eles como quiser.</p><p>Você também pode reduzir um atributo para 0 para receber 1 ponto adicional. O valor máximo inicial que você pode ter em cada atributo é 3.</p></div><p class="attr-remaining"><strong>Pontos disponíveis: ${remaining()}</strong> • Clique nos números para aumentar. Passe o cursor sobre eles para reduzir.</p><div class="attr-foot"></div></article>
<article class="paper attribute-details">${head()}<h2 class="type-title">Sobre ATRIBUTOS</h2><div class="rule-dash"></div>
${D.atributos.map((a,i)=>`<section class="attr-description"><img class="attr-icon" src="${assets(a.icone)}" alt=""><div><span class="ink-label">${i+1}. &nbsp;${e(a.nome)} (${a.id})</span><p>${e(a.descricao)}</p></div></section>`).join('')}</article>`;}
const allOrigins=()=>[...D.origens,...(state.custom.origens||[]).map(o=>({...o,id:'custom:'+o.id,pericias:o.skills||'A definir',poder:o.power||'A definir'}))];
function getOrigin(){return allOrigins().find(x=>x.id===state.originId);}
function origin(){const selected=getOrigin();const own=state.originTab==='propria';
const list=[...D.origens.filter(o=>o.id!=='propria'),...(state.custom.origens||[]).map(o=>({...o,id:'custom:'+o.id}))];
const polas=`<div class="polaroids"><figure class="polaroid"><img src="${assets('capa-ordem.jpg')}" alt="Ordem Paranormal"><figcaption>Ordem Paranormal</figcaption></figure><figure class="polaroid"><img src="${assets('capa-horror.jpg')}" alt="Sobrevivendo ao Horror"><figcaption>Sobrevivendo ao Horror</figcaption></figure></div>`;
let right;
if(own)right=`<h2 class="type-title">SUA ORIGEM</h2><div class="rule-dash"></div><p class="origin-note">Crie uma origem exclusiva. Você também pode cadastrar várias pelo botão ADENDOS.</p><div class="own-form"><label>Nome da origem<input type="text" data-profile="ownOriginName" value="${e(state.profile.ownOriginName||'')}" placeholder="Ex.: Ex-Investigador"></label><label>História<textarea rows="4" data-profile="ownOriginDesc" placeholder="Conte sua origem...">${e(state.profile.ownOriginDesc||'')}</textarea></label><label>Perícias treinadas<input type="text" data-profile="ownOriginSkills" value="${e(state.profile.ownOriginSkills||'')}" placeholder="Duas perícias"></label><label>Poder de origem<input type="text" data-profile="ownOriginPower" value="${e(state.profile.ownOriginPower||'')}" placeholder="Nome / efeito"></label><button type="button" class="finalize" data-save-own-origin="1">SALVAR ESTA ORIGEM</button></div>`;
else if(selected)right=`<h2 class="type-title">${e(selected.nome)}</h2><div class="rule-dash"></div><p class="origin-desc">${e(selected.descricao)}</p><div class="o-field"><span class="ink-label">PERÍCIAS TREINADAS</span><p>${e(selected.pericias)}</p></div><div class="o-field"><span class="ink-label">PODER DE ORIGEM</span><p>${e(selected.poder)}</p></div>`;
else right=`<h2 class="type-title">ORIGEM</h2><div class="rule-dash"></div><div class="origin-empty"><span>Marque sua origem na página ao lado<br>ou escreva uma você mesmo.</span></div>`;
return `<article class="paper origin-index">${head()}<h2 class="type-title">ORIGEM SELECIONADA: <span class="red">${selected&&!own?e(selected.nome):''}</span></h2><div class="rule-dash"></div>
<p class="origin-note">O que você fazia antes de se envolver com o paranormal e ingressar na Ordem? A origem rende duas perícias treinadas e um poder. Marque uma abaixo.</p>
<ul class="o-list">${list.map(o=>`<li><button type="button" class="o-entry${!own&&state.originId===o.id?' sel':''}" data-select-origin="${e(o.id)}" aria-pressed="${!own&&state.originId===o.id}"><span class="o-box"></span><span class="o-name">${e(o.nome)}</span></button></li>`).join('')}<li><button type="button" class="o-entry o-own${own?' sel':''}" data-origin-tab="propria" aria-pressed="${own}"><span class="o-box"></span><span class="o-name">Sua origem…</span></button></li></ul></article>
<article class="paper origin-detail">${head()}${right}${polas}</article>`;}
function originDetails(id){const found=allOrigins().find(o=>o.id===id);
if(id==='propria')return `<section class="confidential origin-info-box"><h2>SUA ORIGEM</h2><p>Crie uma origem exclusiva. Você também pode cadastrar mais origens no botão ADENDOS.</p><label>Nome da origem<input type="text" data-profile="ownOriginName" value="${e(state.profile.ownOriginName||'')}" placeholder="Ex.: Ex-Investigador"></label><label>História<textarea rows="4" data-profile="ownOriginDesc" placeholder="Conte sua origem...">${e(state.profile.ownOriginDesc||'')}</textarea></label><label>Perícias treinadas<input type="text" data-profile="ownOriginSkills" value="${e(state.profile.ownOriginSkills||'')}" placeholder="Duas perícias"></label><label>Poder de origem<input type="text" data-profile="ownOriginPower" value="${e(state.profile.ownOriginPower||'')}" placeholder="Nome / efeito"></label><button type="button" data-save-own-origin="1">SALVAR ESTA ORIGEM</button></section>`;
if(id==='ordem'){
  const ordemOrigins = D.origens.filter(o => o.id !== 'propria');
  return `<section class="confidential origin-info-box"><h2>ORIGENS DA ORDEM PARANORMAL</h2><div class="origin-list">${ordemOrigins.map(o=>`<div class="origin-item ${state.originId===o.id?'expanded':''}" data-origin-id="${e(o.id)}"><div class="origin-header" data-toggle-origin="${e(o.id)}"><span class="origin-header-title">${e(o.nome)}</span><div><button type="button" class="origin-header-choose" data-select-origin="${e(o.id)}">Escolher</button><span class="origin-header-chevron">▼</span></div></div><div class="origin-content"><div class="origin-content-inner"><p>${e(o.descricao)}</p><h4>PERÍCIAS TREINADAS</h4><p><span class="label">${e(o.pericias)}</span></p><h4>PODER DE ORIGEM</h4><p><span class="label">${e(o.poder)}</span></p></div></div></div>`).join('')}</div></section>`;
}
if(!state.originId || state.originId!==id)return `<section class="confidential"><div class="stamp">CONFIDENCIAL</div><p>${e((found?.estado)||'ARQUIVO RESTRITO')}</p><button type="button" class="secret-select" data-select-origin="${e(id)}" style="font-size:12px;background:#170e0f;color:#eac6ab;border:0;padding:11px;margin-top:15px">SELECIONAR ORIGEM</button></section>`;
return `<section class="confidential origin-info-box"><h2>${e(found?.nome)}</h2><p>${e(found?.descricao)}</p><h3>PERÍCIAS TREINADAS</h3><p>${e(found?.pericias)}</p><h3>PODER DE ORIGEM</h3><p>${e(found?.poder)}</p><button type="button" data-select-origin="${e(id)}">ORIGEM SELECIONADA ✓</button></section>`;}
const CLASSES=['combatente','especialista','ocultista'];
const currentClass=()=>state.classId?D.classes[state.classId]:{nome:'Sem Classe',pv:'8 + Vigor',pvNivel:'+Vigor',pe:'1 + Presença',peNivel:'+Presença',san:'8',sanNivel:'+2',pericias:'1 perícia à escolha',periciasExtrasBase:1,proficiencias:'Apenas armas simples',descricao:'Você não recebe treinamento específico da Ordo Realitas. Começa com NEX 0% e não tem acesso a habilidades, rituais ou trilhas de classe.',progressao:[],habilidades:[],rituais:[],trilhas:[]};
function progression(){const c=currentClass();const arr=c.progressao||[];
if(!state.classId)return `<div class="progress-grid"><p class="not-set">Sem classe selecionada — sem progressão definida.</p></div>`;
return `<div class="progress-grid"><div class="progress-th">NEX</div><div class="progress-th">PROGRESSÃO: ${e(c.nome.toUpperCase())}</div><div class="progress-th">PE</div>
${Array.from({length:20},(_,i)=>{const nex=i===19?'99%':(i+1)*5+'%';const override=(state.custom.progressao||[]).find(p=>p.classId===state.classId&&p.nex===nex);const label=override?.nome||arr[i];return `<div class="progress-row"><div class="progress-cell"><span class="progress-box">${nex}</span></div><div class="progress-cell center">${label?e(label):'<span class="not-set">A definir (adendo)</span>'}</div><div class="progress-cell"><span class="progress-box">${i+1}</span></div></div>`;}).join('')}</div>`;}
function libraryItems(type){const c=currentClass();const arr=c[type]||[];const extras=(state.custom[type]||[]).filter(a=>a.classId===state.classId);return [...arr,...extras];}
function abilities(){const key=state.skillTab==='rituais'?'rituais':'habilidades';const list=libraryItems(key);
if(!state.classId)return `<section class="library-content"><h2>${key==='rituais'?'RITUAIS':'HABILIDADES'}: SEM CLASSE</h2><p>Sem classe selecionada — sem habilidades ou rituais disponíveis.</p></section>`;
return `<section class="library-content"><h2>${key==='rituais'?'RITUAIS':'HABILIDADES'}: ${e(currentClass().nome.toUpperCase())}</h2><p>Consulte os registros da sua classe. Acrescente novas entradas em <b>ADENDOS</b>.</p><div class="library-subtabs"><button data-skill-tab="habilidades" class="${key==='habilidades'?'active':''}">HABILIDADES</button><button data-skill-tab="rituais" class="${key==='rituais'?'active':''}">RITUAIS</button></div>
${list.length?`<div class="trail-powers">${list.map((item,i)=>`<div class="trail-power-item" data-ability-index="${i}"><div class="trail-power-header" data-toggle-ability="${i}"><span class="trail-power-title">${e(item.nome||item.name)}</span><span class="trail-power-chevron">▼</span></div><div class="trail-power-content"><div class="trail-power-content-inner">${item.circle?`<small>${e(item.circle)}</small>`:''}<p>${e(item.descricao||item.description)}</p></div></div></div>`).join('')}</div>`:`<div class="ability-card"><h3>NENHUM ${key==='rituais'?'RITUAL':'REGISTRO'} CADASTRADO</h3><p>Este arquivo está livre para receber os seus adendos.</p></div>`}</section>`;}
function tracks(){const tracks=libraryItems('trilhas');const current=tracks.find(x=>(x.id||x.nome||x.name)===state.trackId)||tracks[0];
if(!state.classId)return `<section class="library-content"><h2>TRILHAS: SEM CLASSE</h2><p>Sem classe selecionada — sem trilhas disponíveis.</p></section>`;
const parseTrailPowers=(desc)=>{if(!desc)return{intro:'',powers:[]};const parts=desc.split('\n\n');const intro=parts[0]||'';const powers=[];for(let i=1;i<parts.length;i++){const part=parts[i].trim();if(part){const titleMatch=part.match(/^NEX \d+% - (.+?): /);const nexMatch=part.match(/^NEX \d+%/m);const nex=nexMatch?nexMatch[0]:'NEX ?%';const title=titleMatch?titleMatch[1]:part.split('\n')[0];const content=part.replace(/^NEX \d+% - .+?: /,'').trim();powers.push({nex,title,content});}}return{intro,powers};};
const parsed=parseTrailPowers(current?.descricao||current?.description);
return `<section class="library-content"><h2>TRILHAS: ${e(currentClass().nome.toUpperCase())}</h2><p>Escolha uma trilha para ver seus registros. Você pode adicionar ou detalhar as trilhas posteriormente.</p>${tracks.length?`<div class="trail-tabs">${tracks.map(t=>{const id=t.id||t.nome||t.name;return `<button data-track="${e(id)}" class="${id===(state.trackId||tracks[0]?.nome)?'active':''}">${e(t.nome||t.name)}</button>`;}).join('')}</div><div class="trail-detail"><h2>${e(current.nome||current.name)}</h2><p>${e(parsed.intro)}</p><div class="trail-powers">${parsed.powers.map((p,i)=>`<div class="trail-power-item" data-power-index="${i}"><div class="trail-power-header" data-toggle-power="${i}"><span class="trail-power-title">${e(p.nex)} - ${e(p.title)}</span><span class="trail-power-chevron">▼</span></div><div class="trail-power-content"><div class="trail-power-content-inner"><p>${e(p.content)}</p></div></div></div>`).join('')}</div></div>`:`<div class="ability-card"><h3>TRILHAS A DEFINIR</h3><p>Insira as trilhas desta classe pelo painel ADENDOS.</p></div>`}</section>`;}
function classPage(){const c=currentClass();return `<article class="paper class-intro">${head()}<h2 class="type-title">CLASSE SELECIONADA: <span class="red">${e(c.nome)}</span></h2><div class="rule-dash"></div>
<div class="origin-hint">Sua classe indica o treinamento que você deseja receber na Ordem para enfrentar os perigos do Outro Lado.</div>
<p>Essa será sua característica mais importante, pois define o que você faz e qual é o seu papel no grupo de investigadores.</p><p>Confira abaixo as perícias treinadas e as proficiências da classe. As escolhas específicas de perícias poderão ser configuradas em uma expansão futura.</p>
<div class="class-tabs"><button type="button" data-class="" class="${!state.classId?'active':''}">SEM CLASSE</button>${CLASSES.map(id=>`<button type="button" data-class="${id}" class="${state.classId===id?'active':''}">${e(D.classes[id].nome.toUpperCase())}</button>`).join('')}<button type="button" class="class-more" title="Ver habilidades" data-class-tab="habilidades">›</button></div>
${state.classId?`<div class="class-description" tabindex="0" aria-label="Características da classe. Role o painel para ver sanidade, perícias e proficiências."><p>${e(c.descricao)}</p><h3>CARACTERÍSTICAS <span class="class-scroll-cue">↓ ROLE PARA VER MAIS</span></h3><div class="rule-dash"></div>
<div class="class-stat-grid"><div>Pontos de<br>Vida Iniciais<br><strong>${e(c.pv)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.pvNivel)}</strong></div></div><div class="rule-dash" style="margin:5px 0 12px"></div>
<div class="class-stat-grid"><div>Pontos de<br>Esforço Iniciais<br><strong>${e(c.pe)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.peNivel)}</strong></div></div><div class="rule-dash" style="margin:5px 0 12px"></div>
<div class="class-stat-grid"><div>Sanidade<br>Inicial<br><strong>${e(c.san)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.sanNivel)}</strong></div></div><div class="rule-dash" style="margin:9px 0 12px"></div>
<h3>PERÍCIAS TREINADAS</h3><p class="class-rule-text">${e(c.pericias)}</p>
<p class="class-count">INTELECTO ATUAL: ${e(state.attrs.INT)} ${typeof c.periciasExtrasBase==='number'?`• PERÍCIAS À ESCOLHA: ${c.periciasExtrasBase+state.attrs.INT}`:''}</p>
<div class="rule-dash" style="margin:9px 0 12px"></div>
<h3>PROFICIÊNCIAS</h3><p class="class-rule-text">${e(c.proficiencias)}</p>
<p class="class-help">Os detalhes de perícias e as escolhas específicas de habilidades poderão ser acrescentados em novos adendos.</p></div>`:'<div class="class-description"><p>${e(c.descricao)}</p><h3>CARACTERÍSTICAS</h3><div class="rule-dash"></div>
<div class="class-stat-grid"><div>Pontos de<br>Vida Iniciais<br><strong>${e(c.pv)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.pvNivel)}</strong></div></div><div class="rule-dash" style="margin:5px 0 12px"></div>
<div class="class-stat-grid"><div>Pontos de<br>Esforço Iniciais<br><strong>${e(c.pe)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.peNivel)}</strong></div></div><div class="rule-dash" style="margin:5px 0 12px"></div>
<div class="class-stat-grid"><div>Sanidade<br>Inicial<br><strong>${e(c.san)}</strong></div><div>A cada novo<br>nível de exposição<br><strong>${e(c.sanNivel)}</strong></div></div><div class="rule-dash" style="margin:9px 0 12px"></div>
<h3>PERÍCIAS TREINADAS</h3><p class="class-rule-text">${e(c.pericias)}</p>
<p class="class-count">INTELECTO ATUAL: ${e(state.attrs.INT)} ${typeof c.periciasExtrasBase==='number'?`• PERÍCIAS À ESCOLHA: ${c.periciasExtrasBase+state.attrs.INT}`:''}</p>
<div class="rule-dash" style="margin:9px 0 12px"></div>
<h3>PROFICIÊNCIAS</h3><p class="class-rule-text">${e(c.proficiencias)}</p>
<p class="class-help">Os detalhes de perícias e as escolhas específicas de habilidades poderão ser acrescentados em novos adendos.</p></div>'}
</article><div class="class-library"><div class="library-tabs"><button type="button" data-class-tab="progressao" class="${state.classTab==='progressao'?'active':''}">PROGRESSÃO</button><button type="button" data-class-tab="habilidades" class="${state.classTab==='habilidades'?'active':''}">HABILIDADES</button><button type="button" data-class-tab="trilhas" class="${state.classTab==='trilhas'?'active':''}">TRILHAS</button></div><section class="library-paper">${state.classTab==='progressao'?progression():state.classTab==='habilidades'?abilities():tracks()}</section></div>`;}
function auth(){const origin=getOrigin();const foto=state.profile.foto;
return `<article class="paper auth-form">${head()}<h2 class="auth-section-title">REGRAS OPCIONAIS</h2><div class="auth-dash"></div>
<div class="options-grid">${[['nex','NEX & EXPERIÊNCIA'],['municao','CONTAGEM DE MUNIÇÃO'],['sanidade','JOGANDO SEM SANIDADE'],['patente','EVOLUÇÃO POR PATENTE']].map(([id,label])=>`<label class="option"><span>${label}</span><input type="checkbox" data-option="${id}" ${state.options[id]?'checked':''}></label>`).join('')}</div>
<h2 class="auth-section-title">SOBRE O AGENTE</h2><div class="auth-dash"></div>
${[['aparencia','Aparência'],['personalidade','Personalidade'],['historico','Histórico'],['objetivo','Objetivo']].map(([key,label])=>`<label class="profile-field">${label}<textarea data-profile="${key}" rows="4" placeholder="Escreva aqui.">${e(state.profile[key])}</textarea></label>`).join('')}</article>
<article class="paper auth-summary">${head()}<section class="agent-id"><label class="photo-slot" title="Clique para colocar uma foto">${foto?`<img src="${e(foto)}" alt="Foto do agente">`:'Sua foto aqui'}<input id="agent-photo" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="agent-fields"><label><b>NEX:</b><select data-profile="nex" aria-label="NEX">${['5%','10%','15%','20%'].map(n=>`<option value="${n}" ${state.profile.nex===n?'selected':''}>${n}</option>`).join('')}</select></label><label><b>Nome:</b><input data-profile="nome" value="${e(state.profile.nome)}" placeholder="Seu nome aqui."></label><label><b>Origem:</b><select data-origin-select="1"><option value="">Sua origem aqui.</option>${allOrigins().map(o=>`<option value="${e(o.id)}" ${state.originId===o.id?'selected':''}>${e(o.nome)}</option>`).join('')}</select></label><label><b>Classe:</b><select data-class-select="1"><option value="">Sem Classe</option>${CLASSES.map(id=>`<option value="${id}" ${state.classId===id?'selected':''}>${e(D.classes[id].nome)}</option>`).join('')}</select></label></div></section>
<h2 class="type-title agent-attr-title">SEUS ATRIBUTOS</h2><div class="rule-dash" style="margin-bottom:13px"></div>${radar(false)}
<div class="sig-block"><canvas class="sig-canvas" data-sigpad="1" aria-label="Assinatura do agente: desenhe com mouse, dedo ou caneta"></canvas><span class="sig-x">✕</span><button type="button" class="sig-clear" data-sig-clear="1">REFAZER</button></div><p class="signature-label">Assine aqui com a caneta para finalizar</p>
<div class="countersign" ${state.finalizado?'':'hidden'}>${FX.sigSVG('diretor').replace('data-sig','data-final="1" data-sig')}<small>Autorizado • Diretor da Ordo Realitas</small></div>
<button class="finalize" type="button" data-finalize="1">${state.finalizado?'DOCUMENTO AUTENTICADO ✓':'FINALIZAR DOCUMENTO'}</button>${state.finalizado?'<p class="finalize-msg">IDENTIDADE REGISTRADA NO ARQUIVO DA ORDEM.</p>':''}
</article>`;}
function render(opts={}){nav();const index=STEPS.findIndex(x=>x[0]===state.step);const views={introducao:intro,atributos:attributes,origem:origin,classe:classPage,autenticacao:auth};
console.log('Renderizando step:',state.step,'index:',index);
const stage=$('#stage');stage.innerHTML=views[state.step]()+`<button class="arrow-control prev" type="button" aria-label="Etapa anterior" data-go="${STEPS[Math.max(0,index-1)][0]}" ${index===0?'disabled':''}>❮</button><button class="arrow-control next" type="button" aria-label="Próxima etapa" data-go="${STEPS[Math.min(STEPS.length-1,index+1)][0]}" ${index===STEPS.length-1?'disabled':''}>❯</button>`;
stage.classList.toggle('fresh',!!opts.fresh&&!opts.defer);FX.decorate(stage,state,{save},!!opts.fresh);FX.updateCover({doc:D.documento,finalizado:state.finalizado,nome:state.profile.nome});
if(opts.fresh&&!opts.defer)FX.arrive(stage);}
function changeStat(id,amount){const next=state.attrs[id]+amount;if(next<0||next>3||(amount>0&&remaining()<=0))return;state.attrs[id]=next;render();}
function go(id){if(id===state.step||FX.isTurning())return;const order=STEPS.map(x=>x[0]);const dir=order.indexOf(id)>order.indexOf(state.step)?1:-1;window.scrollTo({top:0});FX.turn($('#stage'),dir,()=>{state.step=id;render({fresh:true,defer:true});});}
let finalizing=false;
async function finalize(){if(finalizing)return;if(!state.profile.nome.trim()){toast('Preencha o nome do agente antes de finalizar.');return;}if(!state.profile.assinaturaImg){toast('Assine o documento com a caneta antes de finalizar.');return;}
finalizing=true;const stage=$('#stage');const cs=stage.querySelector('.countersign');
await FX.authenticate(stage,state);state.finalizado=true;save();window.Mesa&&Mesa.log('Documento autenticado: agente '+state.profile.nome);const b=stage.querySelector('.finalize');if(b)b.textContent='DOCUMENTO AUTENTICADO ✓';
FX.updateCover({doc:D.documento,finalizado:true,nome:state.profile.nome});
await FX.finale(state,D,currentClass().nome,getOrigin()?.nome);finalizing=false;
window.Mesa&&Mesa.onClose();}
function selectOrigin(id){state.originId=id;state.originTab=id;render();const o=getOrigin();window.Mesa&&Mesa.log('Origem registrada: '+(o?o.nome:id));}
document.addEventListener('click',ev=>{const btn=ev.target.closest('button');if(!btn || btn.closest('#customizer'))return;
if(btn.dataset.go){go(btn.dataset.go);}
else if(btn.dataset.statUp)changeStat(btn.dataset.statUp,1);
else if(btn.dataset.statDown)changeStat(btn.dataset.statDown,-1);
else if(btn.dataset.originTab){state.originTab=btn.dataset.originTab;render();}
else if(btn.dataset.selectOrigin){selectOrigin(btn.dataset.selectOrigin);}
else if(btn.dataset.class!==undefined){state.classId=btn.dataset.class;state.attrPoints=btn.dataset.class?4:3;state.trackId='';render();window.Mesa&&Mesa.log('Classe selecionada: '+currentClass().nome);}
else if(btn.dataset.classTab){state.classTab=btn.dataset.classTab;render();}
else if(btn.dataset.skillTab){state.skillTab=btn.dataset.skillTab;render();}
else if(btn.dataset.track){state.trackId=btn.dataset.track;render();}
else if(btn.dataset.saveOwnOrigin){const name=(state.profile.ownOriginName||'').trim();if(!name){toast('Escreva o nome da sua origem.');return;}const existing=state.custom.origens.find(o=>o.id==='minha-origem');const custom={id:'minha-origem',nome:name,descricao:state.profile.ownOriginDesc||'',skills:state.profile.ownOriginSkills||'A definir',power:state.profile.ownOriginPower||'A definir'};if(existing)Object.assign(existing,custom);else state.custom.origens.push(custom);selectOrigin('custom:minha-origem');}
else if(btn.dataset.finalize){finalize();}
});
document.addEventListener('click',ev=>{const toggleHeader=ev.target.closest('[data-toggle-origin]');
if(toggleHeader && !ev.target.closest('.origin-header-choose')){const originId=toggleHeader.dataset.toggleOrigin;const item=toggleHeader.closest('.origin-item');item.classList.toggle('expanded');ev.stopPropagation();}
const togglePower=ev.target.closest('[data-toggle-power]');
if(togglePower){const item=togglePower.closest('.trail-power-item');item.classList.toggle('expanded');ev.stopPropagation();}
const toggleAbility=ev.target.closest('[data-toggle-ability]');
if(toggleAbility){const item=toggleAbility.closest('.trail-power-item');item.classList.toggle('expanded');ev.stopPropagation();}});
document.addEventListener('click',ev=>{const r=ev.target.closest('[data-declass]');if(r&&!r.classList.contains('open')){r.classList.add('open');state.declass=true;FX.sfx.declass();save();}});
document.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('[data-declass]')){ev.preventDefault();ev.target.click();}
if(!document.body.classList.contains('is-open')||ev.target.matches('input,textarea,select')||$('#customizer').open||!$('#finale').hidden)return;
const order=STEPS.map(x=>x[0]),i=order.indexOf(state.step);if(ev.key==='ArrowRight'&&i<order.length-1)go(order[i+1]);if(ev.key==='ArrowLeft'&&i>0)go(order[i-1]);});
document.addEventListener('contextmenu',ev=>{const el=ev.target.closest('[data-stat-up]');if(el){ev.preventDefault();changeStat(el.dataset.statUp,-1);}});
document.addEventListener('input',ev=>{const el=ev.target;if(el.dataset.profile){state.profile[el.dataset.profile]=el.value;state.finalizado=false;save();}});
document.addEventListener('change',ev=>{const el=ev.target;
if(el.dataset.option){state.options[el.dataset.option]=el.checked;save();}
if(el.dataset.originSelect){state.originId=el.value;state.originTab=el.value||'ordem';render();}
if(el.dataset.originSelectDropdown){state.originId=el.value;state.originTab=el.value||'ordem';render();}
if(el.dataset.classSelect){const newClass=el.value;if(!newClass){state.classId='';state.profile.nex='0%';state.attrPoints=3;}else{state.classId=newClass;if(state.profile.nex==='0%')state.profile.nex='5%';state.attrPoints=4;}state.trackId='';render();save();}
if(el.id==='agent-photo'&&el.files?.[0]){const file=el.files[0];if(file.size>3*1024*1024){toast('Escolha uma imagem menor que 3 MB.');return;}const reader=new FileReader();reader.onload=()=>{state.profile.foto=String(reader.result);render();};reader.readAsDataURL(file);}
});
// ADENDOS — dados personalizados sem alteração do layout base
const modal=$('#customizer'), form=$('#custom-form'), customType=$('#custom-type');
const randomId=()=>Date.now().toString(36)+'-'+Math.floor(Math.random()*10000).toString(36);
function updateCustomFields(){const t=customType.value;document.querySelectorAll('.origin-field').forEach(el=>el.hidden=t!=='origens');document.querySelectorAll('.ritual-field').forEach(el=>el.hidden=t!=='rituais');document.querySelectorAll('.progress-field').forEach(el=>el.hidden=t!=='progressao');document.querySelectorAll('.custom-class').forEach(el=>el.hidden=t==='origens');}
function showCustomList(){const types={origens:'ORIGEM',habilidades:'HABILIDADE',rituais:'RITUAL',trilhas:'TRILHA',progressao:'PROGRESSÃO'};let arr=[];
for(const [type,items]of Object.entries(state.custom))for(const item of items)arr.push(`<div class="custom-entry"><button type="button" data-delete-custom="${e(type)}:${e(item.id)}">EXCLUIR</button><strong>${e(item.nome||item.name)}</strong><span>${types[type]}${item.classId?' • '+e(D.classes[item.classId]?.nome||item.classId):''}</span></div>`);
$('#custom-list').innerHTML=arr.length?arr.join(''):'<p style="font-size:12px">Nenhum adendo cadastrado ainda.</p>';}
$('#open-customizer').onclick=()=>{updateCustomFields();showCustomList();modal.showModal();};
$('#close-customizer').onclick=()=>modal.close();modal.addEventListener('click',ev=>{if(ev.target===modal)modal.close();});
customType.onchange=updateCustomFields;
form.onsubmit=ev=>{ev.preventDefault();const fd=new FormData(form),type=String(fd.get('type')),name=String(fd.get('name')||'').trim();if(!name)return;
const item={id:randomId(),nome:name,descricao:String(fd.get('description')||'').trim(),classId:String(fd.get('classId')||'ocultista'),skills:String(fd.get('skills')||''),power:String(fd.get('power')||''),circle:String(fd.get('circle')||''),nex:String(fd.get('nex')||'5%')};
if(!Array.isArray(state.custom[type]))state.custom[type]=[];state.custom[type].push(item);save();showCustomList();form.reset();customType.value=type;updateCustomFields();render();};
$('#custom-list').addEventListener('click',ev=>{const btn=ev.target.closest('[data-delete-custom]');if(!btn)return;const [type,id]=btn.dataset.deleteCustom.split(':');state.custom[type]=state.custom[type].filter(x=>x.id!==id);if(state.originId==='custom:'+id)state.originId='';save();showCustomList();render();});
$('#export-data').onclick=()=>{const blob=new Blob([JSON.stringify({app:'ORDO REALITAS',versao:1,salvoEm:new Date().toISOString(),ficha:state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ordo-realitas-ficha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-data').onchange=async ev=>{const f=ev.target.files?.[0];if(!f)return;try{const content=JSON.parse(await f.text()),incoming=content.ficha||content;if(!incoming.attrs||!incoming.profile||!incoming.custom)throw new Error('Formato inválido.');state={...freshState(),...incoming,attrs:{...freshState().attrs,...incoming.attrs},profile:{...freshState().profile,...incoming.profile},options:{...freshState().options,...incoming.options},custom:{...freshState().custom,...incoming.custom}};save();render();showCustomList();toast('Ficha importada com sucesso.');}catch(err){toast('Arquivo de ficha inválido: '+err.message);}ev.target.value='';};
let resetArm=0;$('#reset-data').onclick=()=>{const b=$('#reset-data');if(!resetArm){b.textContent='CLIQUE DE NOVO PARA APAGAR TUDO';resetArm=setTimeout(()=>{resetArm=0;b.textContent='REDEFINIR';},4000);return;}clearTimeout(resetArm);resetArm=0;b.textContent='REDEFINIR';state=freshState();save();render();showCustomList();modal.close();};
window.OrdoApp={D,getState:()=>state,goto(step,o={}){if(o.originId){state.originId=o.originId;state.originTab=o.originId;}state.step=step;render({fresh:true});}};
FX.onOpen(first=>{render({fresh:true});if(first&&state.step==='introducao'&&!state.finalizado)FX.typewrite($('.intro-terms')||document.body);});
render();
})();
