/* ORDO REALITAS — A MESA DO INVESTIGADOR
   Hub com os objetos da mesa e os módulos: Bestiário, Diário, Comunicador (chat local) e Arquivo (pesquisa + log).
   Dados editáveis do bestiário: BESTIARIO_BASE logo abaixo. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const FX = window.FX;
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmtDT = iso => { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
const fmtT = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const D = () => (window.OrdoApp && OrdoApp.D) || window.ORDO_DADOS || {};
const agente = () => { try { return (OrdoApp.getState().profile.nome || '').trim() || 'Agente'; } catch (e) { return 'Agente'; } };

/* ---------- criaturas base (nomes deduzidos dos arquivos; dados completos ficam como adendo) ---------- */
const BESTIARIO_BASE = [
  { id: 'zumbi-sangue', nome: 'Zumbi de Sangue', elemento: 'Sangue', img: 'criaturas/zumbisangue1.webp', descricao: '' },
  { id: 'bestial-sangue', nome: 'Bestial de Sangue', elemento: 'Sangue', img: 'criaturas/bestialsangue1.webp', descricao: '' },
  { id: 'existido-conhecimento', nome: 'Existido do Conhecimento', elemento: 'Conhecimento', img: 'criaturas/existidoconhe1.webp', descricao: '' }
];
const ELEMENTOS = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'];

/* ---------- armazenamento ---------- */
const KEY = 'ordo-realitas-mesa-v1';
const seed = () => ({
  notas: [{ id: 'n0', ts: new Date().toISOString(), title: 'Chegada à base', text: 'Registrar tudo. Não gravar o combate.\nAs ordens vêm da Central.', draw: '' }],
  bcustom: [], bnotes: {},
  chats: {
    central: [{ from: 'them', text: 'Agente, aqui é a Central. Seu dossiê foi recebido.', t: new Date().toISOString() }, { from: 'them', text: 'Complete a ficha e retorne a este canal.', t: new Date().toISOString() }],
    narrador: [{ from: 'them', text: 'A porta do depósito range ao abrir. Lá dentro, só escuridão.', t: new Date().toISOString() }],
    equipe: [{ from: 'them', text: 'Equipe Alfa: sem contato visual com o alvo. Aguardando ordens.', t: new Date().toISOString() }]
  },
  unread: { central: 2, narrador: 1, equipe: 0 }, log: [], sel: { nota: 'n0', cria: '', chat: '' }
});
let M;
try { M = { ...seed(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { M = seed(); }
M.sel = { nota: '', cria: '', chat: '', ...(M.sel || {}) };
let st;
const save = () => { clearTimeout(st); st = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) { FX.toast('Armazenamento cheio: apague imagens ou rabiscos antigos.'); } }, 250); };
function log(msg) { M.log.push({ t: new Date().toISOString(), msg }); if (M.log.length > 300) M.log.shift(); save(); }
if (!M.log.length) log('Sistema iniciado. Mesa do investigador carregada');
const totalUnread = () => Object.values(M.unread).reduce((a, b) => a + b, 0);
function badge() { const b = $('#chat-badge'); if (!b) return; const n = totalUnread(); b.textContent = n; b.hidden = !n; }
badge();

/* ---------- modo inicial: só a ficha; a mesa é liberada ao autenticar o documento ---------- */
const fichaConcluida = () => { try { return !!JSON.parse(localStorage.getItem('ordo-realitas-ficha-v1')).finalizado; } catch (e) { return false; } };
const concluida = () => { try { return !!OrdoApp.getState().finalizado; } catch (e) { return fichaConcluida(); } };
function syncModo() {
  const only = document.body.classList.contains('ficha-only');
  const hint = $('.cover-hint'); if (hint) hint.textContent = only ? 'Toque no dossiê para abri-lo' : 'Escolha um objeto sobre a mesa';
  const cb = $('#close-dossier'); if (cb) cb.textContent = only ? '▣ FECHAR DOSSIÊ' : '▣ VOLTAR À MESA';
  const fc = $('#finale-close'); if (fc) fc.textContent = only ? 'FECHAR O DOSSIÊ' : 'VOLTAR À MESA';
}
if (!fichaConcluida()) document.body.classList.add('ficha-only');
syncModo();
async function liberarMesa() {
  document.body.classList.remove('ficha-only'); syncModo();
  const cover = $('#cover'); await sleep(900);
  const lamp = $('#lamp'); FX.sfx.buzz();
  for (const d of [1, 0, 1, 0, 0, 1, 0]) { lamp.classList.toggle('dark', !!d); await sleep(60 + Math.random() * 90); }
  lamp.classList.remove('dark'); cover.classList.add('mesa-unlock'); FX.sfx.thump();
  FX.toast('Documento autenticado. A mesa do investigador foi liberada.'); log('Mesa do investigador liberada');
  setTimeout(() => cover.classList.remove('mesa-unlock'), 3500);
}

/* ---------- lâmpada apagada (volta de um agente já autenticado) ---------- */
const po = fichaConcluida() ? $('#poweron') : ($('#poweron') && $('#poweron').remove(), null);
async function powerOn() {
  if (!po || po.dataset.done) return; po.dataset.done = 1;
  FX.sfx.tick(); FX.sfx.buzz(); FX.sfx.startAmbient();
  document.body.classList.remove('lights-off'); po.classList.add('on'); const lamp = $('#lamp');
  for (const d of [0, 1, 0, 1, 1, 0, 1]) { lamp.classList.toggle('dark', !d); await sleep(70 + Math.random() * 90); }
  lamp.classList.remove('dark'); await sleep(250); po.remove();
}
if (po) { po.addEventListener('click', powerOn); po.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); powerOn(); } }); document.body.classList.add('lights-off'); $('#lamp').classList.add('dark'); }

/* ---------- troca de módulos ---------- */
const view = $('#view'), vbody = $('#view-body'), vtitle = $('#view-title');
let current = null;
const APPS = {
  bestiario: { title: 'BESTIÁRIO · ARQUIVO X-07', render: renderBestiario },
  notas: { title: 'DIÁRIO DE CAMPO', render: renderNotas },
  chats: { title: 'COMUNICADOR DA ORDEM', render: renderChats },
  arquivo: { title: 'ARQUIVO CENTRAL · PESQUISA E LOG', render: renderArquivo }
};
function openApp(id, from, opts = {}) {
  const app = APPS[id]; if (!app) return;
  const r = (from || document.body).getBoundingClientRect();
  view.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
  view.hidden = false; view.className = ''; void view.offsetWidth; view.classList.add('in', 'app-' + id);
  document.body.classList.add('in-view'); current = id; vtitle.textContent = app.title; vbody.scrollTop = 0;
  app.render(opts); FX.sfx.flip(); log('Módulo aberto: ' + app.title.split(' · ')[0]);
}
async function closeApp() {
  if (!current) return; const id = current; current = null;
  view.classList.remove('in'); view.classList.add('out'); document.body.classList.remove('in-view'); FX.sfx.tick();
  await sleep(480); if (!current) { view.hidden = true; view.className = ''; vbody.innerHTML = ''; } badge();
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { openApp(o.dataset.open, o); return; }
  const l = e.target.closest('.locked'); if (l) { FX.toast(l.dataset.locked + ': ainda não chegou à mesa. Em breve.'); FX.sfx.declass(); return; }
  if (e.target.closest('#view-back')) closeApp();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && current && !e.target.matches('input,textarea')) closeApp(); });

/* =====================================================================
   BESTIÁRIO
   ===================================================================== */
const criaturas = () => [...BESTIARIO_BASE, ...M.bcustom];
const COR_EL = { Sangue: '#9c1627', Morte: '#4b4b55', Conhecimento: '#8a6a10', Energia: '#3a2f8f', Medo: '#e0e0e0' };
function renderBestiario(opts = {}) {
  const list = criaturas(); if (opts.id) M.sel.cria = opts.id;
  const cur = list.find(c => c.id === M.sel.cria) || (M.sel.cria === '__novo' ? null : list[0]);
  if (cur) M.sel.cria = cur.id;
  const novo = M.sel.cria === '__novo';
  vbody.innerHTML = `<div class="bst">
  <section class="bst-board" aria-label="Fotos das criaturas">
    ${list.map((c, i) => `<button type="button" class="bst-pol ${cur && c.id === cur.id ? 'sel' : ''}" data-cria="${esc(c.id)}" style="--r:${[-4, 3, -2, 5, -5, 2][i % 6]}deg"><i class="pin"></i><span class="tape"></span><span class="ph"><img src="${esc(c.img)}" alt="${esc(c.nome)}"></span><b>${esc(c.nome)}</b></button>`).join('')}
    <button type="button" class="bst-pol bst-new ${novo ? 'sel' : ''}" data-cria="__novo" style="--r:3deg"><i class="pin"></i><span class="ph plus">+</span><b>Novo registro</b></button>
  </section>
  <section class="bst-record paper">${novo ? formNovaCriatura() : fichaCriatura(cur, list.indexOf(cur) + 1)}</section></div>`;
}
function fichaCriatura(c, n) {
  const doc = (D().documento || '');
  return `<header class="paper-head"><div><h1>REGISTRO Nº ${String(n).padStart(3, '0')}</h1><small>Documento ${esc(doc)} · Bestiário restrito</small><small>-Classificação: ${esc(c.elemento)}</small></div><img class="head-emblem" src="assets/emblema-pequeno.png" alt=""></header>
  <figure class="bst-photo"><span class="tape t1"></span><span class="tape t2"></span><img src="${esc(c.img)}" alt="${esc(c.nome)}"><i class="scan"></i></figure>
  <h2 class="type-title">${esc(c.nome)}</h2><div class="rule-dash"></div>
  <div class="bst-fields">
    <div><span class="ink-label">ELEMENTO</span><p>${esc(c.elemento)}</p></div>
    <div><span class="ink-label">NÍVEL DE AMEAÇA</span><p><span class="redacted" data-declass tabindex="0" role="button" aria-label="Trecho censurado. Clique para revelar.">VD A DEFINIR PELO MESTRE</span></p></div>
  </div>
  <div class="bst-block"><span class="ink-label">DESCRIÇÃO</span><p>${c.descricao ? esc(c.descricao) : 'Registro em análise. Os dados completos desta entidade aguardam adendo da Central.'}</p></div>
  <div class="bst-block"><span class="ink-label">OBSERVAÇÕES DE CAMPO</span><textarea class="hand" data-bnote="${esc(c.id)}" rows="5" placeholder="Escreva aqui o que você viu...">${esc(M.bnotes[c.id] || '')}</textarea></div>
  <span class="stamp-big stamped" style="color:${COR_EL[c.elemento] || '#9c1627'}"><b>${esc(c.elemento.toUpperCase())}</b><small>ARQUIVADO</small></span>
  ${c.custom ? `<button type="button" class="mini-del" data-cria-del="${esc(c.id)}">APAGAR REGISTRO</button>` : ''}`;
}
function formNovaCriatura() {
  return `<header class="paper-head"><div><h1>NOVO REGISTRO</h1><small>Documento ${esc(D().documento || '')} · Bestiário restrito</small></div><img class="head-emblem" src="assets/emblema-pequeno.png" alt=""></header>
  <form class="own-form" id="cria-form"><label>Nome da criatura<input name="nome" required maxlength="60" placeholder="Ex.: Dilacerador"></label>
  <label>Elemento<select name="elemento">${ELEMENTOS.map(e => `<option>${e}</option>`).join('')}</select></label>
  <label>Descrição<textarea name="descricao" rows="4" placeholder="O que se sabe sobre a entidade..."></textarea></label>
  <label>Foto<input type="file" name="foto" accept="image/png,image/jpeg,image/webp"></label>
  <button type="submit" class="finalize">ARQUIVAR REGISTRO</button></form>`;
}
function reduzirImagem(file, max = 640) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}
document.addEventListener('click', e => {
  const p = e.target.closest('[data-cria]'); if (p && current === 'bestiario') { M.sel.cria = p.dataset.cria; save(); renderBestiario(); FX.sfx.flip(); return; }
  const d = e.target.closest('[data-cria-del]'); if (d) { if (!d.dataset.arm) { d.dataset.arm = 1; d.textContent = 'CLIQUE DE NOVO PARA APAGAR'; setTimeout(() => { d.dataset.arm = ''; d.textContent = 'APAGAR REGISTRO'; }, 3500); return; } M.bcustom = M.bcustom.filter(c => c.id !== d.dataset.criaDel); M.sel.cria = ''; save(); renderBestiario(); }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'cria-form') return; e.preventDefault(); const fd = new FormData(e.target); let img = '';
  try { const f = fd.get('foto'); if (f && f.size) img = await reduzirImagem(f); } catch (err) { FX.toast('Não consegui ler essa imagem.'); return; }
  const c = { id: 'c' + Date.now().toString(36), nome: String(fd.get('nome')).trim(), elemento: String(fd.get('elemento')), descricao: String(fd.get('descricao') || '').trim(), img: img || 'assets/emblema-grande.png', custom: true };
  M.bcustom.push(c); M.sel.cria = c.id; save(); log('Registro de criatura arquivado: ' + c.nome); FX.sfx.stamp(); renderBestiario();
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.bnote) { M.bnotes[t.dataset.bnote] = t.value; save(); } });

/* =====================================================================
   DIÁRIO DE CAMPO
   ===================================================================== */
let nbMode = 'texto', nbPad = null;
const nota = () => M.notas.find(n => n.id === M.sel.nota) || M.notas[0];
function renderNotas(opts = {}) {
  if (!M.notas.length) M.notas.push({ id: 'n' + Date.now().toString(36), ts: new Date().toISOString(), title: 'Nova página', text: '', draw: '' });
  const cur = nota(); M.sel.nota = cur.id;
  vbody.innerHTML = `<div class="nb"><div class="nb-book">
  <section class="nb-pg nb-left"><h2>ÍNDICE</h2><ol>${M.notas.map((n, i) => `<li><button type="button" class="${n.id === cur.id ? 'on' : ''}" data-nota="${n.id}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(n.title || 'Sem título')}<small>${fmtDT(n.ts)}</small></button></li>`).join('')}</ol>
    <button type="button" class="nb-new" data-nota-new>+ NOVA PÁGINA</button></section>
  <section class="nb-pg nb-right ${opts.flip ? 'turn' : ''}" id="nb-right"><input class="nb-title" data-nota-title maxlength="60" value="${esc(cur.title)}" placeholder="Título da página" aria-label="Título da página">
    <div class="nb-sheet"><textarea class="nb-text" data-nota-text placeholder="Escreva com o teclado ou troque para a caneta...">${esc(cur.text)}</textarea><canvas class="nb-draw ${nbMode === 'rabisco' ? 'on' : ''}" aria-label="Área de rabisco"></canvas></div>
    <div class="nb-tools"><button type="button" data-nota-mode="texto" class="${nbMode === 'texto' ? 'on' : ''}">ESCREVER</button><button type="button" data-nota-mode="rabisco" class="${nbMode === 'rabisco' ? 'on' : ''}">RABISCAR</button><button type="button" data-nota-clear>LIMPAR RABISCO</button><button type="button" data-nota-del>APAGAR PÁGINA</button></div>
    <span class="nb-date">${fmtDT(cur.ts)} · pág. ${M.notas.indexOf(cur) + 1}/${M.notas.length}</span></section></div></div>`;
  const cv = $('.nb-draw'); nbPad = FX.pad(cv, { ink: '#14213f', min: 1, max: 3, initial: cur.draw, onChange: d => { cur.draw = d; save(); } });
}
document.addEventListener('click', e => {
  if (current !== 'notas') return; const cur = nota();
  const b = e.target.closest('[data-nota]'); if (b) { M.sel.nota = b.dataset.nota; save(); FX.sfx.flip(); renderNotas({ flip: true }); return; }
  if (e.target.closest('[data-nota-new]')) { const n = { id: 'n' + Date.now().toString(36), ts: new Date().toISOString(), title: 'Nova página', text: '', draw: '' }; M.notas.push(n); M.sel.nota = n.id; save(); log('Nova página no diário'); FX.sfx.flip(); renderNotas({ flip: true }); return; }
  const m = e.target.closest('[data-nota-mode]'); if (m) { nbMode = m.dataset.notaMode; document.querySelectorAll('[data-nota-mode]').forEach(x => x.classList.toggle('on', x === m)); $('.nb-draw').classList.toggle('on', nbMode === 'rabisco'); return; }
  if (e.target.closest('[data-nota-clear]')) { nbPad && nbPad.clear(); return; }
  const d = e.target.closest('[data-nota-del]'); if (d) { if (!d.dataset.arm) { d.dataset.arm = 1; d.textContent = 'CLIQUE DE NOVO'; setTimeout(() => { d.dataset.arm = ''; d.textContent = 'APAGAR PÁGINA'; }, 3000); return; } M.notas = M.notas.filter(n => n.id !== cur.id); M.sel.nota = M.notas[0] ? M.notas[0].id : ''; save(); log('Página do diário apagada'); renderNotas({ flip: true }); }
});
document.addEventListener('input', e => { if (current !== 'notas') return; const t = e.target, cur = nota(); if (t.matches('[data-nota-text]')) { cur.text = t.value; save(); } if (t.matches('[data-nota-title]')) { cur.title = t.value; save(); const li = document.querySelector(`[data-nota="${cur.id}"]`); if (li) li.firstChild.nextSibling.textContent = t.value || 'Sem título'; } });

/* =====================================================================
   COMUNICADOR (chat local e simulado)
   ===================================================================== */
const CONTATOS = {
  central: { nome: 'Central da Ordem', sub: 'Canal seguro', resp: [[/ficha|dossi/i, 'Sua ficha consta como em andamento. Finalize a autenticação para liberar acesso completo.'], [/criatura|besti|monstro/i, 'O Bestiário é restrito. Consulte os registros sobre a mesa e não grave o combate.'], [/ajuda|socorro|perigo/i, 'Mantenha a calma. Enviando equipe de apoio. Câmbio.'], [/miss|oper|ordem/i, 'Novas diretrizes serão emitidas pelo Mestre. Aguarde no canal.']], def: ['Entendido, agente.', 'Registrado. Mantenha o canal aberto.', 'Câmbio.', 'Informação anotada no arquivo.'] },
  narrador: { nome: 'Narrador', sub: 'Mesa de campanha', resp: [[/porta|abr/i, 'A madeira cede com um gemido. Do outro lado, algo respira.'], [/luz|lanterna/i, 'O feixe tremula e mostra marcas de garras no piso.']], def: ['Algo se move no corredor. Role Percepção.', 'O ar fica gelado. Você sente que não está sozinho.', 'Uma luz pisca duas vezes e apaga.', 'Você ouve o seu nome, sussurrado, vindo da parede.'] },
  equipe: { nome: 'Equipe Alfa', sub: 'Campo', resp: [[/onde|local|posi/i, 'Setor B, segundo andar. Sem sinal de luz.'], [/aten|cuidado/i, 'Recebido. Mantendo posição.']], def: ['Sem novidades por aqui.', 'Cobertura pronta quando você mandar.', 'Ouvi algo no andar de cima. Vou verificar.', 'Positivo.'] }
};
function rolar(txt) {
  const m = txt.match(/^\/(?:r|rolar)\s+(\d*)d(\d+)\s*([+-]\s*\d+)?/i); if (!m) return null;
  const n = Math.min(30, parseInt(m[1] || '1', 10)), f = Math.min(1000, parseInt(m[2], 10)), mod = parseInt((m[3] || '0').replace(/\s/g, ''), 10); if (!n || !f) return null;
  const dados = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * f)), total = dados.reduce((a, b) => a + b, 0) + mod;
  return `ROLAGEM ${n}d${f}${mod ? (mod > 0 ? '+' : '') + mod : ''}: [${dados.join(', ')}]${mod ? ' ' + (mod > 0 ? '+' : '−') + ' ' + Math.abs(mod) : ''} = ${total}`;
}
function renderChats() {
  const id = M.sel.chat;
  vbody.innerHTML = `<div class="ph-wrap"><div class="phone" role="application" aria-label="Comunicador da Ordem"><div class="ph-notch"></div><div class="ph-screen2" id="ph-screen">${id ? chatThread(id) : chatList()}</div></div></div>`;
  const msgs = $('.msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
}
function chatList() {
  return `<header class="ph-head"><b>COMUNICADOR</b><span>${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></header>
  <p class="ph-note">MODO LOCAL · mensagens simuladas</p>
  <ul class="ph-list">${Object.entries(CONTATOS).map(([k, c]) => { const last = M.chats[k][M.chats[k].length - 1]; return `<li><button type="button" data-chat="${k}"><span class="av">${esc(c.nome[0])}</span><span class="who"><b>${esc(c.nome)}</b><small>${esc(last ? last.text : c.sub)}</small></span>${M.unread[k] ? `<span class="un">${M.unread[k]}</span>` : ''}</button></li>`; }).join('')}</ul>
  <p class="ph-foot">Use <code>/r 2d6+3</code> para rolar dados em qualquer conversa.</p>`;
}
function bubble(m) { return m.from === 'sys' ? `<div class="b sys">${esc(m.text)}</div>` : `<div class="b ${m.from === 'me' ? 'me' : 'them'}"><p>${esc(m.text)}</p><time>${fmtT(m.t)}</time></div>`; }
function chatThread(k) {
  M.unread[k] = 0; save(); const c = CONTATOS[k];
  return `<header class="ph-head"><button type="button" data-chat-back aria-label="Voltar">◀</button><span class="who"><b>${esc(c.nome)}</b><small>${esc(c.sub)} · criptografado</small></span></header>
  <div class="msgs" id="msgs">${M.chats[k].map(bubble).join('')}</div>
  <form class="ph-send" id="chat-form"><input id="chat-in" autocomplete="off" maxlength="300" placeholder="Mensagem ou /r 1d20" aria-label="Mensagem"><button type="submit">ENVIAR</button></form>`;
}
function pushMsg(k, m) { M.chats[k].push(m); save(); if (current === 'chats' && M.sel.chat === k) { const box = $('#msgs'); if (box) { const t = $('.typing', box); if (t) t.remove(); box.insertAdjacentHTML('beforeend', bubble(m)); box.scrollTop = box.scrollHeight; } } }
async function responder(k, txt) {
  const c = CONTATOS[k], dice = rolar(txt);
  if (dice) { await sleep(350); pushMsg(k, { from: 'sys', text: dice, t: new Date().toISOString() }); FX.sfx.tick(); if (k !== 'narrador') return; }
  const box = () => $('#msgs'); await sleep(700);
  if (current === 'chats' && M.sel.chat === k && box()) { box().insertAdjacentHTML('beforeend', '<div class="b them typing"><i></i><i></i><i></i></div>'); box().scrollTop = box().scrollHeight; }
  await sleep(900 + Math.random() * 1400);
  const hit = c.resp.find(([re]) => re.test(txt)); const reply = hit ? hit[1] : pick(c.def);
  pushMsg(k, { from: 'them', text: reply, t: new Date().toISOString() }); FX.sfx.ping();
  if (!(current === 'chats' && M.sel.chat === k)) { M.unread[k] = (M.unread[k] || 0) + 1; save(); badge(); }
}
document.addEventListener('click', e => {
  if (current !== 'chats') return;
  const b = e.target.closest('[data-chat]'); if (b) { M.sel.chat = b.dataset.chat; renderChats(); FX.sfx.tick(); setTimeout(() => $('#chat-in') && $('#chat-in').focus(), 50); return; }
  if (e.target.closest('[data-chat-back]')) { M.sel.chat = ''; renderChats(); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'chat-form') return; e.preventDefault(); const inp = $('#chat-in'), txt = inp.value.trim(), k = M.sel.chat; if (!txt) return; inp.value = '';
  pushMsg(k, { from: 'me', text: txt, t: new Date().toISOString() }); FX.sfx.key(); responder(k, txt);
});
// mensagem espontânea enquanto a mesa está aberta
setTimeout(function spont() {
  if (!document.body.classList.contains('lights-off') && !document.body.classList.contains('is-open')) { const k = pick(['central', 'equipe', 'narrador']); const c = CONTATOS[k]; pushMsg(k, { from: 'them', text: pick(c.def), t: new Date().toISOString() }); if (!(current === 'chats' && M.sel.chat === k)) { M.unread[k] = (M.unread[k] || 0) + 1; save(); badge(); FX.sfx.ping(); } }
  setTimeout(spont, 45000 + Math.random() * 60000);
}, 40000);

/* =====================================================================
   ARQUIVO: pesquisa + log
   ===================================================================== */
let aTab = 'pesquisa', aQuery = '';
function corpus() {
  const out = [], d = D(); const add = (tipo, nome, texto, nav) => out.push({ tipo, nome: nome || '', texto: texto || '', nav });
  (d.origens || []).filter(o => o.id !== 'propria').forEach(o => add('ORIGEM', o.nome, [o.descricao, o.pericias, o.poder].join(' '), { app: 'ficha', step: 'origem', originId: o.id }));
  Object.values(d.classes || {}).forEach(c => { add('CLASSE', c.nome, c.descricao, { app: 'ficha', step: 'classe' }); ['habilidades', 'rituais', 'trilhas'].forEach(k => (c[k] || []).forEach(i => add(k === 'trilhas' ? 'TRILHA' : k === 'rituais' ? 'RITUAL' : 'HABILIDADE', i.nome || i.name, (c.nome + ' ' + (i.descricao || i.description || '')), { app: 'ficha', step: 'classe' }))); });
  criaturas().forEach(c => add('CRIATURA', c.nome, c.elemento + ' ' + c.descricao + ' ' + (M.bnotes[c.id] || ''), { app: 'bestiario', id: c.id }));
  M.notas.forEach(n => add('DIÁRIO', n.title, n.text, { app: 'notas', id: n.id }));
  return out;
}
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function renderArquivo() {
  vbody.innerHTML = `<div class="arq"><div class="arq-sheet paper"><header class="paper-head"><div><h1>ARQUIVO CENTRAL</h1><small>Documento ${esc(D().documento || '')} · Consulta interna</small></div><img class="head-emblem" src="assets/emblema-pequeno.png" alt=""></header>
  <div class="arq-tabs" role="tablist"><button type="button" role="tab" data-arq="pesquisa" class="${aTab === 'pesquisa' ? 'on' : ''}">PESQUISA</button><button type="button" role="tab" data-arq="log" class="${aTab === 'log' ? 'on' : ''}">LOG</button></div>
  <div id="arq-body">${aTab === 'pesquisa' ? pesquisaHTML() : logHTML()}</div></div></div>`;
  if (aTab === 'pesquisa') { const q = $('#arq-q'); q.value = aQuery; showResults(); q.focus(); }
}
const pesquisaHTML = () => `<label class="arq-q"><span class="ink-label">TERMO</span><input id="arq-q" autocomplete="off" placeholder="origem, habilidade, ritual, criatura, nota..." aria-label="Pesquisar no arquivo"></label><div id="arq-res" class="cards" aria-live="polite"></div>`;
function showResults() {
  const q = norm(aQuery.trim()), box = $('#arq-res'); if (!box) return;
  if (q.length < 2) { box.innerHTML = '<p class="arq-empty">Digite ao menos duas letras. A pesquisa cobre origens, classes, habilidades, trilhas, criaturas e as páginas do seu diário.</p>'; return; }
  const hits = corpus().map(c => ({ c, s: (norm(c.nome).includes(q) ? 3 : 0) + (norm(c.texto).includes(q) ? 1 : 0) })).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 40);
  if (!hits.length) { box.innerHTML = '<p class="arq-empty">Nenhum registro encontrado.</p>'; return; }
  box.innerHTML = hits.map(({ c }, i) => { const t = c.texto.replace(/\s+/g, ' '), at = norm(t).indexOf(q), snip = t.slice(Math.max(0, at - 40), Math.max(0, at - 40) + 130); return `<button type="button" class="card t-${norm(c.tipo).replace(/[^a-z]/g, '')}" data-go="${i}"><small>${c.tipo}</small><b>${esc(c.nome)}</b><span>${esc(snip)}${t.length > 130 ? '…' : ''}</span></button>`; }).join('');
  box._hits = hits.map(h => h.c);
}
function logHTML() {
  const rows = [...M.log].reverse();
  return `<div class="log-head"><span class="ink-label">REGISTRO DE ATIVIDADES</span><button type="button" data-log-clear>LIMPAR LOG</button></div><ol class="log">${rows.map(r => `<li><time>${fmtDT(r.t)}</time><span>${esc(r.msg)}</span></li>`).join('') || '<li><span>Sem registros.</span></li>'}</ol>`;
}
document.addEventListener('input', e => { if (e.target.id === 'arq-q') { aQuery = e.target.value; showResults(); } });
document.addEventListener('click', e => {
  if (current !== 'arquivo') return;
  const t = e.target.closest('[data-arq]'); if (t) { aTab = t.dataset.arq; renderArquivo(); FX.sfx.flip(); return; }
  const c = e.target.closest('.card[data-go]'); if (c) { const hit = $('#arq-res')._hits[+c.dataset.go].nav; navegar(hit); return; }
  const l = e.target.closest('[data-log-clear]'); if (l) { if (!l.dataset.arm) { l.dataset.arm = 1; l.textContent = 'CLIQUE DE NOVO'; setTimeout(() => { l.dataset.arm = ''; l.textContent = 'LIMPAR LOG'; }, 3000); return; } M.log = []; log('Log limpo'); renderArquivo(); }
});
async function navegar(n) {
  if (n.app === 'ficha') { await closeApp(); const cover = $('#cover'); if (!cover.hidden) { await FX.openDossier(); } OrdoApp.goto(n.step, { originId: n.originId }); }
  else if (n.app === 'bestiario') { M.sel.cria = n.id; save(); current = null; view.className = ''; openApp('bestiario', null, { id: n.id }); }
  else if (n.app === 'notas') { M.sel.nota = n.id; save(); current = null; view.className = ''; openApp('notas', null); }
}

/* ---------- volta à mesa a partir do dossiê ---------- */
window.Mesa = { log, open: openApp, close: closeApp, badge, onClose() { if (document.body.classList.contains('ficha-only') && concluida()) liberarMesa(); } };
})();
