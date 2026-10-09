/* Lógica de index.html (extraída da página) */
// "Manter conectado": quem já entrou vai direto para o playing.html
try{ const ss = JSON.parse(localStorage.getItem('ciee_session')); const sy = JSON.parse(localStorage.getItem('ciee_sistema') || '{}'); if (ss && ss.manterConectado && !sy.manutencao) location.replace('playing.html'); }catch(e){}

// ===== Visitas, acessos por usuário e presença em tempo real (lidos pelo painel admin) =====
// Observação: os dados ficam no localStorage do navegador. Para estatísticas de TODOS os aparelhos
// é necessário um servidor; aqui o painel mostra o que foi registrado neste navegador/domínio.
function cieeVisit() {
    try {
        if (sessionStorage.getItem('ciee_visit')) return;
        sessionStorage.setItem('ciee_visit', '1');
        let v; try { v = JSON.parse(localStorage.getItem('ciee_visitas')) || {}; } catch (e) { v = {}; }
        v.total = (v.total || 0) + 1;
        v.dias = v.dias || {};
        const hoje = new Date().toISOString().slice(0, 10);
        v.dias[hoje] = (v.dias[hoje] || 0) + 1;
        localStorage.setItem('ciee_visitas', JSON.stringify(v));
    } catch (e) {}
}
cieeVisit();

document.getElementById('current-year').textContent = new Date().getFullYear();

/* ===== CONFIGURAÇÃO DO E-MAIL (FormSubmit) =====
   Coloque abaixo o e-mail do CIEE que receberá cópia de cada cadastro.
   No primeiro envio, o FormSubmit manda um e-mail de ativação para esse endereço. */
const ADMIN_EMAIL = '';   // ex.: 'biblioteca@ciee-sc.org.br'
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/';


// Seletores de data (Dia / Mês / Ano): clicar OU digitar
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const Y0 = new Date().getFullYear();
const DATE_FIELDS = {
  dob: {hidden:'reg-nascimento', from:Y0,     to:Y0 - 100},
  ini: {hidden:'reg-inicio',     from:Y0 + 1, to:Y0 - 5}
};
const pad = n => String(n).padStart(2,'0');
const norm = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const partEl = (p, part) => document.getElementById(p + '-' + part);

function optionsFor(p, part){
  if (part === 'mes') return MESES.map((m,i) => ({value:pad(i+1), label:m}));
  if (part === 'ano'){
    const r = [], c = DATE_FIELDS[p];
    for (let a = c.from; a >= c.to; a--) r.push({value:String(a), label:String(a)});
    return r;
  }
  const mes = partEl(p,'mes').dataset.val, ano = partEl(p,'ano').dataset.val;
  const n = mes ? new Date(ano ? +ano : 2000, +mes, 0).getDate() : 31; // ano bissexto por padrão
  return Array.from({length:n}, (_,i) => ({value:pad(i+1), label:String(i+1)}));
}
function filterOptions(p, part, text){
  let t = norm(text);
  const all = optionsFor(p, part);
  if (!t) return all;
  if (/^\d+$/.test(t) && part !== 'ano') t = String(+t);
  return all.filter(o => part === 'mes' && /^\d+$/.test(t)
    ? String(+o.value).startsWith(t)
    : norm(o.label).startsWith(t));
}
function updateHidden(p){
  const d = partEl(p,'dia').dataset.val, m = partEl(p,'mes').dataset.val, a = partEl(p,'ano').dataset.val;
  document.getElementById(DATE_FIELDS[p].hidden).value = (d && m && a) ? `${a}-${m}-${d}` : '';
}
function closeList(input){ input.parentElement.querySelector('.cb-list').classList.remove('open'); }

function commitDate(p, part, input){
  const text = input.value.trim();
  let match = null;
  if (text){
    const list = filterOptions(p, part, text), t = norm(text);
    const exact = list.find(o => norm(o.label) === t || (part !== 'ano' && /^\d+$/.test(t) && +o.value === +t));
    match = exact || (part === 'mes' ? list[0] : (list.length === 1 ? list[0] : null)) || null;
  }
  input.dataset.val = match ? match.value : '';
  input.value = match ? match.label : '';
  closeList(input);
  if (part !== 'dia'){ // limpa dia que não existe mais (ex.: 31 em fevereiro)
    const d = partEl(p,'dia');
    if (d.dataset.val && +d.dataset.val > optionsFor(p,'dia').length){ d.dataset.val = ''; d.value = ''; }
  }
  updateHidden(p);
}
function pickDate(p, part, input, o){ input.value = o.label; commitDate(p, part, input); }

function renderList(p, part, input, showAll){
  const box = input.parentElement.querySelector('.cb-list');
  const opts = showAll ? optionsFor(p, part) : filterOptions(p, part, input.value);
  box.innerHTML = ''; box.dataset.idx = -1;
  opts.forEach(o => {
    const d = document.createElement('div');
    d.className = 'cb-opt' + (o.value === input.dataset.val ? ' sel' : '');
    d.textContent = o.label;
    d.addEventListener('mousedown', e => { e.preventDefault(); pickDate(p, part, input, o); });
    box.appendChild(d);
  });
  box.classList.toggle('open', opts.length > 0);
  const sel = box.querySelector('.sel');
  box.scrollTop = sel ? Math.max(0, sel.offsetTop - 60) : 0;
}
function moveHl(input, dir){
  const box = input.parentElement.querySelector('.cb-list'), items = box.querySelectorAll('.cb-opt');
  if (!items.length) return;
  let i = +box.dataset.idx + dir;
  i = Math.max(0, Math.min(items.length - 1, i));
  items.forEach(x => x.classList.remove('hl'));
  items[i].classList.add('hl'); items[i].scrollIntoView({block:'nearest'});
  box.dataset.idx = i;
}

Object.keys(DATE_FIELDS).forEach(p => {
  ['dia','mes','ano'].forEach(part => {
    const input = partEl(p, part);
    input.dataset.val = '';
    input.addEventListener('focus', () => { input.select(); renderList(p, part, input, true); });
    input.addEventListener('click', () => renderList(p, part, input, true));
    input.addEventListener('input', () => {
      if (part !== 'mes') input.value = input.value.replace(/\D/g, '');
      renderList(p, part, input, false);
    });
    input.addEventListener('keydown', e => {
      const box = input.parentElement.querySelector('.cb-list');
      if (e.key === 'ArrowDown'){ e.preventDefault(); if (!box.classList.contains('open')) renderList(p, part, input, true); moveHl(input, 1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); moveHl(input, -1); }
      else if (e.key === 'Enter'){
        e.preventDefault();
        const hl = box.querySelector('.hl');
        if (hl) input.value = hl.textContent;
        commitDate(p, part, input);
        advanceFrom(input.id);
      }
      else if (e.key === 'Escape' && box.classList.contains('open')){ e.preventDefault(); closeList(input); }
    });
    input.addEventListener('blur', () => commitDate(p, part, input));
  });
});

// Nome: primeiras letras maiúsculas, exceto de, da, do, das, dos, e
const NAME_LOWER = ['de','da','do','das','dos','e'];
function formatName(str){
  return str.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').split(' ').map((w, i) => {
    if (i > 0 && NAME_LOWER.includes(w)) return w;
    return w.replace(/(^|[-'’])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase('pt-BR'));
  }).join(' ');
}
document.getElementById('reg-nome').addEventListener('blur', e => { e.target.value = formatName(e.target.value); });

// E-mail sempre em minúsculas (login e cadastro), mantendo a posição do cursor
['reg-email', 'login-id'].forEach(id => {
  const el = document.getElementById(id);
  el.setAttribute('autocapitalize', 'off');
  el.setAttribute('autocorrect', 'off');
  el.setAttribute('spellcheck', 'false');
  const lower = () => {
    const low = el.value.toLowerCase();
    if (low !== el.value){
      const a = el.selectionStart, b = el.selectionEnd;
      el.value = low;
      try{ el.setSelectionRange(a, b); }catch(e){}
    }
  };
  el.addEventListener('input', lower);
  el.addEventListener('blur', () => { lower(); el.value = el.value.trim(); });
});

// Enter avança: campo a campo e, com tudo correto, de página em página
const REG_FLOW = {
  1: {fields:['reg-nome','dob-dia','dob-mes','dob-ano'], go:() => nextPage(2)},
  2: {fields:['reg-email','reg-whatsapp'], go:() => nextPage(3)},
  3: {fields:['ini-dia','ini-mes','ini-ano','reg-cidade','reg-periodo'], go:() => verifyInformation()},
  5: {fields:['reg-pass','reg-pass2','reg-hint'], go:() => nextPage(6)}
};
const FOCUS_FIRST = {1:'reg-nome', 2:'reg-email', 3:'ini-dia', 5:'reg-pass'};
function focusFirst(n){
  const el = document.getElementById(FOCUS_FIRST[n] || '');
  if (el && !el.disabled) el.focus({preventScroll:true});
}
function currentRegPage(){
  for (let i = 1; i <= 6; i++) if (document.getElementById('page-'+i).style.display !== 'none') return i;
  return 1;
}
function advanceFrom(id){
  const flow = REG_FLOW[currentRegPage()];
  if (!flow || !flow.fields.includes(id)) return;
  // há campo vazio? vai para o primeiro que falta
  const empty = flow.fields.map(f => document.getElementById(f)).find(el => !el.disabled && !el.value.trim());
  if (empty){ empty.focus({preventScroll:true}); return; }
  flow.go(); // tudo preenchido: a validação da página decide se avança
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.defaultPrevented) return;
  if (document.getElementById('scene').dataset.side !== 'register') return;
  const t = e.target;
  if (t.tagName === 'BUTTON') return; // botões mantêm o comportamento normal
  const page = currentRegPage(), flow = REG_FLOW[page];
  if (flow && flow.fields.includes(t.id)){ e.preventDefault(); advanceFrom(t.id); return; }
  if (page === 3 && document.getElementById('review-container').style.display === 'block'){
    const b = document.getElementById('btn-confirm-review');
    if (!b.disabled){ e.preventDefault(); confirmReview(); }
    return;
  }
  if (page === 4){
    const b = document.getElementById('btn-p4-next');
    if (!b.disabled){ e.preventDefault(); confirmPhoto(); }
    return;
  }
  if (page === 6 && document.getElementById('terms-section').style.display !== 'none'){
    e.preventDefault();
    for (let i = 1; i <= TOTAL_TERMS; i++){
      const cb = document.getElementById('t'+i);
      if (!cb.checked && cb.closest('.term-item').classList.contains('visible')){ cb.click(); return; }
    }
    const b = document.getElementById('btn-accept-terms');
    if (!b.disabled) finalizeRegistration();
  }
});

// Tema claro/escuro do cadastro (lembra a escolha)
function applyRegTheme(dark){
  document.getElementById('scene').classList.toggle('dark-reg', dark);
  document.getElementById('recover-modal').classList.toggle('dark-reg', dark);
  document.querySelectorAll('.theme-toggle').forEach(b => b.textContent = dark ? 'Claro' : 'Escuro');
}
function toggleRegTheme(){
  const dark = !document.getElementById('scene').classList.contains('dark-reg');
  applyRegTheme(dark);
  try{ localStorage.setItem('ciee_theme', dark ? 'dark' : 'light'); }catch(e){}
}
try{ applyRegTheme(localStorage.getItem('ciee_theme') === 'dark'); }catch(e){}

// 1. Cores dinâmicas a cada acesso/navegação
const themeColors = [
  {bg:'#ffffff',btn:'#0056b3'},{bg:'#f4f0ff',btn:'#6f42c1'},{bg:'#e6f8ff',btn:'#00b4d8'},
  {bg:'#fff9e6',btn:'#d97706'},{bg:'#e6fcf5',btn:'#059669'}
];
function applyRandomColors(){
  const ch = chosenColor();
  const t = ch ? {bg:ch.tint, btn:ch.p} : themeColors[Math.floor(Math.random()*themeColors.length)];
  document.documentElement.style.setProperty('--card-dynamic-bg', t.bg);
  document.documentElement.style.setProperty('--btn-dynamic-bg', t.btn);
}

// 2. Altura da caixa acompanha a face ativa
const scene = document.getElementById('scene');
const card3d = document.getElementById('card3d');
const faces = {front:document.getElementById('face-front'),login:document.getElementById('face-login'),register:document.getElementById('face-register')};
let currentFace = 'front';
function syncHeight(){ card3d.style.height = faces[currentFace].offsetHeight + 'px'; }
const resizeObs = new ResizeObserver(syncHeight);
Object.values(faces).forEach(f => resizeObs.observe(f));
window.addEventListener('resize', syncHeight);
document.addEventListener('DOMContentLoaded', syncHeight);

// 3. Splash
window.addEventListener('load', () => {
  applyRandomColors(); syncHeight();
  // animação completa só na 1ª vez de cada sessão; depois, entrada rápida
  // animação completa quando o app é aberto de novo (mais de 15 min desde a última vez); entrada rápida se acabou de ver
  let jaVisto = false; try { const ult = +localStorage.getItem('ciee_splash_ts') || 0; jaVisto = Date.now() - ult < 15 * 60 * 1000; localStorage.setItem('ciee_splash_ts', String(Date.now())); sessionStorage.setItem('ciee_splash', '1'); } catch (e) {}
  setTimeout(() => {
    const s = document.getElementById('splash-screen');
    s.style.opacity = '0'; s.style.transform = 'scale(1.05)';
    setTimeout(() => s.style.display = 'none', 600);
  }, jaVisto ? 500 : 5400);
});

// 4. Virada 3D: Login → esquerda | 1º Acesso → direita
function flipTo(side){
  if ((MANUT || !cieeRecurso('primeiroAcesso')) && side === 'register') return;   // primeiro acesso indisponível (manutenção ou desligado em Configurações)
  document.body.classList.add('flipping'); clearTimeout(window._flT); window._flT = setTimeout(() => document.body.classList.remove('flipping'), 950);
  applyRandomColors();
  scene.classList.remove('show-login','show-register');
  currentFace = side;
  if (side === 'login'){ scene.dataset.side = 'login'; scene.classList.add('show-login'); loginReset(); }
  else if (side === 'register'){ scene.dataset.side = 'register'; scene.classList.add('show-register'); photoTimeDone = false; nextPage(1, true); }
  else { scene.dataset.side = ''; }   // voltou para a tela inicial
  syncHeight();
}

// 5. Atalho de e-mail
function appendDomain(d){
  const el = document.getElementById('reg-email');
  let v = el.value.trim();
  if (v.includes('@')) v = v.split('@')[0];
  el.value = v ? v + d : d;
}

// 6. Período liberado após a cidade
const PERIODOS_PADRAO = ['Segunda/Quarta - Matutino','Segunda/Quarta - Vespertino','Terça/Quinta - Matutino','Terça/Quinta - Vespertino','Sexta-feira - Integral'];
const escH = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lerLS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
// cidades: as cadastradas no painel (Usuários › Cidades e turmas); se ainda não houver, as padrão
(function(){
  const lista = lerLS('ciee_cidades', []); const s = document.getElementById('reg-cidade');
  if (Array.isArray(lista) && lista.length && s){
    s.innerHTML = '<option value="" disabled selected>Selecione a cidade...</option>' + lista.map(c => '<option value="' + escH(c) + '">' + escH(c) + '</option>').join('');
  }
})();
// turmas: as cadastradas para a cidade escolhida (dia/período e ID); sem turmas cadastradas, usa a lista padrão de períodos
function unlockPeriodo(){
  const p = document.getElementById('reg-periodo'), cid = document.getElementById('reg-cidade').value;
  if (!cid) return;
  const turmas = lerLS('ciee_turmas', []).filter(t => t.cidade === cid);
  p.innerHTML = '<option value="" disabled selected>Selecione a turma...</option>' + (turmas.length
    ? turmas.map(t => '<option value="' + escH(t.codId) + '" data-periodo="' + escH(t.diaPeriodo) + '" data-turma="' + escH(t.codId) + '">' + escH(t.diaPeriodo) + ' (' + escH(t.codId) + ')</option>').join('')
    : PERIODOS_PADRAO.map(x => '<option value="' + escH(x) + '">' + escH(x) + '</option>').join(''));
  p.disabled = false;
}

// 7. Navegação entre as 6 páginas
let regData = {};
function passLevel(p){
  if (p.length < 6) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s <= 2 ? 1 : (s === 3 ? 2 : 3);
}
function nextPage(n, noFocus){
  applyRandomColors();
  const v = id => document.getElementById(id).value;
  if (n === 2){
    document.getElementById('reg-nome').value = formatName(v('reg-nome'));
    if (!v('reg-nome').trim()) return alert('Por favor, informe seu nome completo.');
    if (!v('reg-nascimento')) return alert('Por favor, selecione sua data de nascimento.');
  }
  if (n === 3){
    if (!v('reg-email') || !document.getElementById('reg-email').checkValidity()) return alert('Por favor, preencha um e-mail válido.');
    if (v('reg-whatsapp').replace(/\D/g,'').length < 10) return alert('Informe um WhatsApp válido com DDD.');
  }
  if (n === 6){
    const p = v('reg-pass');
    if (!passOk(p)) return alert('A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.');
    if (p !== v('reg-pass2')) return alert('As senhas não conferem.');
    const h = v('reg-hint').trim().toLowerCase();
    if (h.length < 3) return alert('A dica de senha é obrigatória (mínimo 3 caracteres).');
    if (h && h.includes(p.toLowerCase())) return alert('A dica não pode conter a própria senha.');
  }
  for (let i = 1; i <= 6; i++){
    document.getElementById('page-'+i).style.display = 'none';
    document.getElementById('dot-'+i).classList.remove('active');
  }
  document.getElementById('page-'+n).style.display = 'block';
  document.getElementById('dot-'+n).classList.add('active');
  syncHeight();
  if (!noFocus) setTimeout(() => focusFirst(n), 60);
  if (n === 4) startPhotoTimer(); else clearInterval(photoTimer);
}

// 8. Verificação dos dados (página 3)
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
function verifyInformation(){
  const g = id => document.getElementById(id).value;
  const nome = formatName(g('reg-nome')), nasc = g('reg-nascimento'), email = g('reg-email').trim().toLowerCase(), whats = g('reg-whatsapp').trim();
  const inicio = g('reg-inicio'), cidade = g('reg-cidade'), selP = document.getElementById('reg-periodo'), opt = selP.options[selP.selectedIndex];
  const periodo = (opt && opt.dataset.periodo) || selP.value, turmaId = (opt && opt.dataset.turma) || '';
  if (!inicio || !cidade || !periodo) return alert('Preencha todos os campos do contrato antes de verificar.');
  Object.assign(regData, {nome, nasc, email, whats, inicio, cidade, periodo, turmaId});
  document.getElementById('review-content').innerHTML =
    `<strong>Nome:</strong> ${esc(nome)}<br><strong>Nascimento:</strong> ${fmtDate(nasc)}<br><strong>E-mail:</strong> ${esc(email)}<br>` +
    `<strong>WhatsApp:</strong> ${esc(whats)}<br><strong>Início Contrato:</strong> ${fmtDate(inicio)}<br>` +
    `<strong>Cidade:</strong> ${esc(cidade)}<br><strong>Período:</strong> ${esc(periodo)}`;
  document.getElementById('contract-inputs').style.display = 'none';
  document.getElementById('btn-back-p3').style.display = 'none';
  document.getElementById('review-container').style.display = 'block';
  startReviewTimer();
  syncHeight();
}
let reviewTimer = null;
function startReviewTimer(){
  const btn = document.getElementById('btn-confirm-review');
  const label = 'Tudo Certo! Prosseguir';
  let left = 10;
  clearInterval(reviewTimer);
  btn.disabled = true; btn.classList.add('btn-disabled');
  btn.textContent = `Confira os dados... (${left}s)`;
  reviewTimer = setInterval(() => {
    left--;
    if (left <= 0){
      clearInterval(reviewTimer);
      btn.disabled = false; btn.classList.remove('btn-disabled');
      btn.textContent = label;
    } else {
      btn.textContent = `Confira os dados... (${left}s)`;
    }
  }, 1000);
}
function editInformation(){
  clearInterval(reviewTimer);
  document.getElementById('contract-inputs').style.display = 'block';
  document.getElementById('btn-back-p3').style.display = 'block';
  document.getElementById('review-container').style.display = 'none';
  syncHeight();
}
function confirmReview(){ editInformation(); nextPage(4); }

// 9. Foto: upload, arrastar, zoom e recorte (página 4)
let zoomScale = 1, panX = 0, panY = 0, dragging = false, startX = 0, startY = 0;
const photoBox = document.getElementById('photo-container');
const photoImg = document.getElementById('photo-preview');
function applyPhotoTransform(){ photoImg.style.transform = `translate(${panX}px,${panY}px) scale(${zoomScale})`; }
photoBox.addEventListener('click', () => { if (photoImg.style.display === 'none') document.getElementById('photo-input').click(); });
photoBox.addEventListener('pointerdown', e => {
  if (photoImg.style.display === 'none') return;
  dragging = true; startX = e.clientX - panX; startY = e.clientY - panY;
  photoBox.setPointerCapture(e.pointerId);
});
photoBox.addEventListener('pointermove', e => { if (!dragging) return; panX = e.clientX - startX; panY = e.clientY - startY; applyPhotoTransform(); });
['pointerup','pointercancel'].forEach(ev => photoBox.addEventListener(ev, () => dragging = false));
// Botão "Criar Senha" só libera após 15 s (e com foto carregada)
const PHOTO_WAIT = 15;
let photoTimer = null, photoLeft = PHOTO_WAIT, photoTimeDone = false;
function updatePhotoBtn(){
  const b = document.getElementById('btn-p4-next');
  const hasPhoto = photoImg.style.display !== 'none' && !!photoImg.getAttribute('src');
  const ok = photoTimeDone && hasPhoto;
  b.disabled = !ok; b.classList.toggle('btn-disabled', !ok);
  b.textContent = photoTimeDone ? 'Criar Senha' : `Ajuste a foto... (${photoLeft}s)`;
}
function startPhotoTimer(){
  clearInterval(photoTimer);
  if (photoTimeDone){ updatePhotoBtn(); return; }
  photoLeft = PHOTO_WAIT; updatePhotoBtn();
  photoTimer = setInterval(() => {
    photoLeft--;
    if (photoLeft <= 0){ clearInterval(photoTimer); photoTimeDone = true; }
    updatePhotoBtn();
  }, 1000);
}
function loadPhoto(e){
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = evt => {
    photoImg.src = evt.target.result; photoImg.style.display = 'block';
    document.getElementById('photo-placeholder').style.display = 'none';
    document.getElementById('crop-controls').style.display = 'flex';
    resetZoom();
    updatePhotoBtn();
    syncHeight();
  };
  r.readAsDataURL(file);
}
function adjustZoom(d){ zoomScale = Math.max(0.8, Math.min(3, zoomScale + d)); applyPhotoTransform(); }
function resetZoom(){ zoomScale = 1; panX = 0; panY = 0; applyPhotoTransform(); }
function confirmPhoto(){
  const size = 240, ratio = size / photoBox.clientWidth;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0,0,size,size);
  const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight;
  const k = Math.max(size/iw, size/ih) * zoomScale, dw = iw*k, dh = ih*k;
  ctx.drawImage(photoImg, size/2 - dw/2 + panX*ratio, size/2 - dh/2 + panY*ratio, dw, dh);
  regData.foto = c.toDataURL('image/jpeg', 0.85);
  nextPage(5);
}

// 10. Força da senha (página 5)
function checkStrength(){
  const p = document.getElementById('reg-pass').value, p2 = document.getElementById('reg-pass2').value;
  const lvl = p ? Math.max(1, passLevel(p)) : 0;
  const colors = ['#e53e3e','#ecc94b','#38a169'], names = ['Fraca','Média','Forte'];
  for (let i = 1; i <= 3; i++) document.getElementById('sb'+i).style.background = (lvl >= i) ? colors[lvl-1] : '';
  const lab = document.getElementById('strength-label');
  lab.textContent = 'Nível da senha: ' + (lvl ? names[lvl-1] : '—');
  lab.style.color = lvl ? colors[lvl-1] : '#718096';
  const m = document.getElementById('pass-msg');
  if (!p2) m.textContent = '';
  else if (p === p2){ m.textContent = 'As senhas conferem'; m.style.color = '#38a169'; }
  else { m.textContent = 'As senhas não conferem'; m.style.color = '#e53e3e'; }
}

// 11. Termos: cada frase aparece só após marcar a anterior (página 6)
const TOTAL_TERMS = 4;
function onTermCheck(n){
  const cb = document.getElementById('t'+n);
  if (cb.checked){
    cb.disabled = true; // mantém a ordem de leitura
    const next = document.getElementById('t'+(n+1));
    if (next){ next.closest('.term-item').classList.add('visible'); next.closest('.term-item').scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }
  const all = Array.from({length:TOTAL_TERMS}, (_,i) => document.getElementById('t'+(i+1)).checked).every(Boolean);
  const b = document.getElementById('btn-accept-terms');
  b.disabled = !all; b.classList.toggle('btn-disabled', !all);
  syncHeight();
}

// 12. E-mails do cadastro: (1) aprendiz: carteirinha + termo + login e senha | (2) coordenação: cópia sem senha
async function postEmail(to, fields, files){
  const fd = new FormData();
  Object.entries({ _captcha:'false', _template:'box', ...fields }).forEach(([k, v]) => fd.append(k, v));
  (files || []).forEach(f => fd.append('attachment', f.blob, f.name));
  const res = await fetch(FORMSUBMIT_URL + encodeURIComponent(to), { method:'POST', headers:{'Accept':'application/json'}, body:fd });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || String(j.success) === 'false') throw new Error(j.message || ('HTTP ' + res.status));
}
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

async function buildCardImage(d){
  const c = document.createElement('canvas'); c.width = 900; c.height = 540;
  const x = c.getContext('2d');
  const rr = (px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  const g = x.createLinearGradient(0, 0, 900, 540); g.addColorStop(0, '#0056b3'); g.addColorStop(1, '#6f42c1');
  rr(0, 0, 900, 540, 40); x.fillStyle = g; x.fill();
  x.fillStyle = '#fff'; x.font = '700 44px Fredoka, Nunito, sans-serif'; x.fillText('CIEESC PLAY', 50, 90);
  rr(590, 45, 260, 60, 16); x.fillStyle = '#ffd166'; x.fill();
  x.fillStyle = '#1a202c'; x.font = '600 23px Fredoka, Nunito, sans-serif'; x.fillText('BIBLIOTECA CIEE SC', 606, 85);
  x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(50, 125, 800, 3);
  const img = d.foto ? await loadImg(d.foto) : null;
  x.save(); rr(50, 165, 270, 290, 24); x.clip();
  if (img) x.drawImage(img, 50, 175, 270, 270); else { x.fillStyle = '#e2e8f0'; x.fillRect(50, 165, 270, 290); }
  x.restore(); rr(50, 165, 270, 290, 24); x.lineWidth = 6; x.strokeStyle = '#fff'; x.stroke();
  // nome (até 2 linhas)
  x.fillStyle = '#fff'; x.font = '700 40px Fredoka, Nunito, sans-serif';
  const words = d.nome.split(' '), lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > 500 && cur){ lines.push(cur); cur = w; } else cur = t; });
  lines.push(cur);
  lines.slice(0, 2).forEach((l, i) => x.fillText(l, 360, 210 + i * 46));
  const y0 = 210 + Math.min(lines.length, 2) * 46 + 14;
  x.font = '700 26px Nunito, sans-serif';
  x.fillText('Cidade: ' + d.cidade, 360, y0 + 30);
  x.fillText('Período: ' + d.periodo, 360, y0 + 70);
  rr(360, y0 + 95, 400, 56, 14); x.fillStyle = 'rgba(255,255,255,.2)'; x.fill();
  x.fillStyle = '#ffd166'; x.font = '800 28px Nunito, sans-serif'; x.fillText('Validade: ' + fmtDate(d.validade), 378, y0 + 133);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

async function sendRegistrationEmails(signedAt, pass){
  const status = document.getElementById('mail-status'), d = regData;
  const termo =
`TERMO DE RESPONSABILIDADE - CIEESC ▶︎ PLAY

Aprendiz: ${d.nome}
Nascimento: ${fmtDate(d.nasc)}
Cidade: ${d.cidade}
Período: ${d.periodo}
Início do contrato: ${fmtDate(d.inicio)}

Declaro que li e concordo com:
1. Comprometo-me a utilizar o site CIEESC ▶︎ PLAY com ética e responsabilidade.
2. Respeitarei todos os colegas e o acervo digital de aprendizagem.
3. Empréstimo de livros: manterei a integridade dos materiais físicos e virtuais.
4. Devolverei qualquer exemplar emprestado dentro do prazo acordado.

Assinado digitalmente em ${signedAt} por ${d.nome}.`;
  const files = [{ blob:new Blob([termo], { type:'text/plain;charset=utf-8' }), name:'termo-de-responsabilidade.txt' }];
  try{ const cb = await buildCardImage(d); if (cb) files.unshift({ blob:cb, name:'carteirinha-cieesc-play.png' }); }catch(e){}

  const userMsg =
`Olá, ${d.nome}!

Seu cadastro no CIEESC ▶︎ PLAY foi concluído.

SEUS DADOS DE ACESSO
Login (e-mail): ${d.email}
Login (WhatsApp): ${d.whats}
Senha: a que você criou no cadastro (por segurança, ela não é enviada por e-mail).
Se esquecer, use "Recuperar senha" na tela de acesso.

Em anexo: a cópia da sua carteirinha (válida até ${fmtDate(d.validade)}) e do termo de responsabilidade assinado.

Guarde este e-mail: ele tem a cópia da sua carteirinha e do termo assinado.`;
  const adminMsg =
`NOVO CADASTRO - CIEESC ▶︎ PLAY

Nome: ${d.nome}
Nascimento: ${fmtDate(d.nasc)}
E-mail: ${d.email}
WhatsApp: ${d.whats}
Início do contrato: ${fmtDate(d.inicio)}
Cidade: ${d.cidade}
Período: ${d.periodo}
Validade da carteirinha: ${fmtDate(d.validade)}
Termos assinados em: ${signedAt}

(Carteirinha e termo em anexo. A senha não é enviada à coordenação.)`;

  const jobs = [postEmail(d.email, { name:d.nome, email:d.email, _subject:'CIEESC ▶︎ PLAY - Sua carteirinha, termo assinado e dados de acesso', message:userMsg }, files)];
  if (ADMIN_EMAIL) jobs.push(postEmail(ADMIN_EMAIL, { name:d.nome, email:d.email, _subject:'CIEESC ▶︎ PLAY - Novo cadastro: ' + d.nome, message:adminMsg }, files));
  const [u] = await Promise.allSettled(jobs);
  status.textContent = u.status === 'fulfilled'
    ? 'Enviamos para o seu e-mail a carteirinha, o termo assinado e seus dados de acesso!'
    : 'Não foi possível enviar o e-mail agora. Procure a coordenação para receber sua cópia.';
}

async function sha256(t){
  try{
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('');
  }catch(e){ return ''; }
}

// 13. Finalizar: carteirinha (+2 anos), e-mail e contador de 10 s
async function finalizeRegistration(){
  document.getElementById('terms-section').style.display = 'none';

  const exp = new Date(regData.inicio + 'T00:00:00');
  exp.setFullYear(exp.getFullYear() + 2);
  regData.validade = exp.toISOString().slice(0,10);
  regData.dica = document.getElementById('reg-hint').value.trim();
  const signedAt = new Date().toLocaleString('pt-BR');
  regData.termosAssinadosEm = signedAt;

  document.getElementById('card-name-display').textContent = regData.nome;
  document.getElementById('card-city-display').textContent = regData.cidade;
  document.getElementById('card-period-display').textContent = regData.periodo;
  document.getElementById('card-exp-display').textContent = exp.toLocaleDateString('pt-BR');
  document.getElementById('card-photo-display').src = regData.foto;
  document.getElementById('card-preview-section').style.display = 'block';
  syncHeight();

  // Senha nunca é guardada em texto puro nem enviada por e-mail
  const plainPass = document.getElementById('reg-pass').value;
  regData.senhaHash = await cieeSenha.gerar(plainPass);
  saveUser({...regData});
  const { senhaHash: _h, dica: _d, ...pubSession } = regData; // a sessão não leva o hash nem a dica
  localStorage.setItem('ciee_session', JSON.stringify(pubSession));
  sessionStorage.removeItem('ciee_session');

  sendRegistrationEmails(signedAt, plainPass);
  document.getElementById('reg-pass').value = ''; document.getElementById('reg-pass2').value = '';

  let s = 10;
  const el = document.getElementById('timer-count');
  const iv = setInterval(() => {
    s--; el.textContent = s;
    if (s <= 0){ clearInterval(iv); window.location.href = 'playing.html'; }
  }, 1000);
}

// 14. Login em etapas: identificar → confirmar o nome → senha
const USERS_KEY = 'ciee_users';
const $ = id => document.getElementById(id);
const nd = t => { t = String(t || '').replace(/\D/g, ''); return (t.length > 11 && t.startsWith('55')) ? t.slice(2) : t; };
function getUsers(){
  try{ const l = JSON.parse(localStorage.getItem(USERS_KEY)); return Array.isArray(l) ? l : []; }catch(e){ return []; }
}
function saveUser(u){
  try{
    const list = getUsers().filter(x => (x.email || '').toLowerCase() !== (u.email || '').toLowerCase() && nd(x.whats) !== nd(u.whats));
    list.push(u);
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }catch(e){}
}
function findUser(raw){
  const id = raw.trim().toLowerCase();
  if (id.includes('@')) return getUsers().find(u => (u.email || '').toLowerCase() === id);
  const d = nd(id);
  return d.length >= 10 ? getUsers().find(u => nd(u.whats) === d) : undefined;
}
let pendingUser = null;
function showLoginStep(step){
  ['id','confirm','pass','bypass'].forEach(x => { $('login-step-' + x).style.display = (x === step) ? 'block' : 'none'; });
}
function loginReset(){
  pendingUser = null;
  $('login-id').value = ''; $('login-pass').value = '';
  setMsg($('login-msg-id'), ''); setMsg($('login-msg-pass'), ''); setMsg($('login-msg-bypass'), '');
  $('bypass-code').value = '';
  document.querySelectorAll('.pass-legend').forEach(updateLegend);
  showLoginStep('id');
}
function handleIdentify(e){
  e.preventDefault();
  if (MANUT) return;
  const u = findUser($('login-id').value), msg = $('login-msg-id');
  if (!u){
    msg.className = 'login-msg';
    msg.innerHTML = `Não encontramos um cadastro com esses dados neste dispositivo. Confira o que digitou ou <a href="#" class="forgot-pass" onclick="flipTo('register');return false;">faça o 1º Acesso</a>.`;
    return;
  }
  msg.textContent = '';
  pendingUser = u;
  $('confirm-name').textContent = u.nome;
  const ph = $('confirm-photo');
  if (u.foto){ ph.src = u.foto; ph.style.display = 'block'; } else { ph.style.display = 'none'; }
  showLoginStep('confirm');
}
function confirmIdentity(){
  $('hello-name').textContent = (pendingUser.nome || '').split(' ')[0];
  showLoginStep('pass');
  setTimeout(() => $('login-pass').focus({preventScroll:true}), 60);
}
function denyIdentity(){
  loginReset();
  setTimeout(() => $('login-id').focus({preventScroll:true}), 60);
}
async function handleLoginSubmit(e){
  e.preventDefault();
  if (!pendingUser) return loginReset();
  const msg = $('login-msg-pass'), conta = pendingUser.email || pendingUser.whats || pendingUser.nome;
  const espera = cieeTentativas.espera(conta);
  if (espera) return setMsg(msg, `Muitas tentativas. Aguarde ${espera >= 60 ? Math.ceil(espera / 60) + ' min' : espera + 's'} e tente de novo.`);
  if (!pendingUser.senhaHash) return setMsg(msg, 'Este cadastro está sem senha. Use "Recuperar senha" para criar uma.');
  const conf = await cieeSenha.conferir($('login-pass').value, pendingUser.senhaHash);
  if (!conf.ok){
    const r = cieeTentativas.erro(conta);
    setMsg(msg, r.ate > Date.now() ? 'Muitas tentativas. Aguarde um pouco e tente de novo.' : 'Senha incorreta. Tente novamente.' + (pendingUser.dica ? ' Dica: ' + pendingUser.dica : ''));
    $('login-pass').select();
    return;
  }
  cieeTentativas.acerto(conta);
  if (conf.atualizar){   // troca o hash antigo (SHA-256 simples) pelo formato novo
    try { const us = JSON.parse(localStorage.getItem('ciee_users')) || []; const u = us.find(x => String(x.email || '').toLowerCase() === String(pendingUser.email || '').toLowerCase());
      if (u){ u.senhaHash = await cieeSenha.gerar($('login-pass').value); localStorage.setItem('ciee_users', JSON.stringify(us)); } } catch (e) {}
  }
  const keep = $('keep-connected').checked;
  const { senhaHash, dica, ...pub } = pendingUser;
  const session = { ...pub, manterConectado: keep, criadoEm: Date.now() };
  (keep ? localStorage : sessionStorage).setItem('ciee_session', JSON.stringify(session));
  (keep ? sessionStorage : localStorage).removeItem('ciee_session'); // evita sessão antiga no outro armazenamento
  window.location.href = 'playing.html';
}

// 14b. Entrar com biometria (só no celular, só se ativada neste aparelho em Meu perfil › Configurações)
async function prepararBiometria(){
  const b = $('btn-bio'); if (!b || !window.cieeBio) return;
  let manut = false; try { manut = !!(JSON.parse(localStorage.getItem('ciee_sistema') || '{}').manutencao); } catch (e) {}
  b.hidden = manut || !cieeRecurso('biometria') || !cieeBio.lista().length || !(await cieeBio.disponivel());
}
async function entrarComBiometria(){
  const msg = $('bio-msg'); setMsg(msg, 'Confirme com o rosto ou a digital…');
  try {
    const reg = await cieeBio.entrar();
    const us = JSON.parse(localStorage.getItem('ciee_users')) || [];
    const u = us.find(x => String(x.email || '').toLowerCase() === reg.email);
    if (!u){ cieeBio.desativar(reg.email); setMsg(msg, 'Cadastro não encontrado neste aparelho. Entre com a senha.'); prepararBiometria(); return; }
    const { senhaHash, dica, ...pub } = u;
    sessionStorage.setItem('ciee_session', JSON.stringify({ ...pub, manterConectado: false, via: 'biometria', criadoEm: Date.now() }));
    localStorage.removeItem('ciee_session');
    window.location.href = 'playing.html';
  } catch (e) { setMsg(msg, (e && e.name === 'NotAllowedError') ? 'Biometria cancelada. Você também pode entrar com a senha.' : (e.message || 'Não foi possível usar a biometria.')); }
}
prepararBiometria();

// 15. ByPass (Representantes, Monitores, Orientadores e Webmaster): só a senha; as senhas são gerenciadas no admin.html
const DEFAULT_CODES = [
  { senha:'123', perfil:'Orientador Fabrício', nivel:'4 (Orientador)' },
  { senha:'456', perfil:'Webmaster Admin',     nivel:'5 (Webmaster)' }
];
function getAccessCodes(){
  try{ const l = JSON.parse(localStorage.getItem('ciee_codigos_acesso')); if (Array.isArray(l)) return l; }catch(e){}
  return DEFAULT_CODES;
}
function openBypass(){ showLoginStep('bypass'); setTimeout(() => $('bypass-code').focus({preventScroll:true}), 60); }
let bypassFails = 0, bypassLockUntil = 0;
function handleBypass(e){
  e.preventDefault();
  const msg = $('login-msg-bypass');
  const wait = Math.ceil((bypassLockUntil - Date.now()) / 1000);
  if (wait > 0) return setMsg(msg, `Muitas tentativas. Aguarde ${wait}s.`);
  const code = $('bypass-code').value.trim();
  const c = getAccessCodes().find(x => String(x.senha).trim() === code);
  if (!c){
    if (++bypassFails >= 5){ bypassFails = 0; bypassLockUntil = Date.now() + 30000; return setMsg(msg, 'Muitas tentativas. Aguarde 30s.'); }
    setMsg(msg, 'Senha de acesso inválida.');
    $('bypass-code').select();
    return;
  }
  bypassFails = 0;
  const nivel = parseInt(c.nivel, 10) || 2;
    const session = { nome:c.perfil, nivel, foto:c.foto || '', bypass:true, manterConectado:false, criadoEm:Date.now() };
  localStorage.removeItem('ciee_session');                 // evita sessão de aprendiz antiga
  sessionStorage.setItem('ciee_session', JSON.stringify(session)); // acesso da equipe vale só nesta aba
  window.location.href = 'admin.html';
}

// 16. Legenda interativa da senha (fica verde conforme cada regra é cumprida)
const PASS_RULES = {
  len:     t => t.length >= 8,
  upper:   t => /\p{Lu}/u.test(t),
  lower:   t => /\p{Ll}/u.test(t),
  num:     t => /\d/.test(t),
  special: t => /[^\p{L}\p{N}\s]/u.test(t)
};
function passOk(t){ return Object.values(PASS_RULES).every(f => f(t)); }
function updateLegend(ul){
  const inp = document.getElementById(ul.dataset.for), v = inp ? inp.value : '';
  ul.querySelectorAll('li').forEach(li => li.classList.toggle('ok', PASS_RULES[li.dataset.r](v)));
}
document.querySelectorAll('.pass-legend').forEach(ul => {
  document.getElementById(ul.dataset.for).addEventListener('input', () => updateLegend(ul));
  updateLegend(ul);
});

// 17. Recuperar senha (card): e-mail + WhatsApp → confirma o nome → envia código por e-mail → nova senha
function setMsg(el, text, type){ el.className = 'login-msg' + (type ? ' ' + type : ''); el.textContent = text; }
const maskEmail = m => { const [l, d] = m.split('@'); return (l[0] || '') + '***@' + (d || ''); };
async function hashOrPlain(t){ return (await sha256(t)) || t; }
let lastRecoverySend = 0, recUser = null;

function openRecoverStep(step){
  ['id','confirm','reset'].forEach(x => { $('rv-step-' + x).style.display = (x === step) ? 'block' : 'none'; });
  if (step === 'id') recUser = null;
}
function openRecover(){
  if (MANUT) return;
  ['rv-email','rv-whats','rec-code','rec-pass','rec-pass2'].forEach(id => $(id).value = '');
  const typed = $('login-id').value.trim().toLowerCase();
  if (typed.includes('@')) $('rv-email').value = typed; // aproveita o que já foi digitado no login
  ['rv-msg-id','rv-msg-confirm','rv-msg-reset'].forEach(id => setMsg($(id), ''));
  document.querySelectorAll('.pass-legend').forEach(updateLegend);
  openRecoverStep('id');
  $('recover-modal').classList.add('open');
  setTimeout(() => $($('rv-email').value ? 'rv-whats' : 'rv-email').focus({preventScroll:true}), 60);
}
function closeRecover(){ $('recover-modal').classList.remove('open'); }

$('rv-email').addEventListener('input', e => { e.target.value = e.target.value.toLowerCase(); });

function handleRecoverLookup(e){
  e.preventDefault();
  const email = $('rv-email').value.trim().toLowerCase(), w = nd($('rv-whats').value);
  const u = getUsers().find(x => (x.email || '').toLowerCase() === email && nd(x.whats) === w);
  const msg = $('rv-msg-id');
  if (!u) return setMsg(msg, 'Não encontramos um cadastro com este e-mail e WhatsApp juntos. Confira os dados digitados.');
  setMsg(msg, '');
  recUser = u;
  $('rv-name').textContent = u.nome;
  $('rv-mail').textContent = maskEmail(u.email);
  const ph = $('rv-photo');
  if (u.foto){ ph.src = u.foto; ph.style.display = 'block'; } else { ph.style.display = 'none'; }
  setMsg($('rv-msg-confirm'), '');
  openRecoverStep('confirm');
}

async function sendRecovery(){
  const msg = $('rv-msg-confirm'), btn = $('rv-send');
  if (!recUser) return openRecoverStep('id');
  const wait = Math.ceil((lastRecoverySend + 60000 - Date.now()) / 1000);
  if (wait > 0) return setMsg(msg, `Aguarde ${wait}s para pedir um novo código.`);
  setMsg(msg, 'Enviando e-mail de recuperação...', 'info');
  btn.disabled = true;
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  try{
    await postEmail(recUser.email, {
      name: recUser.nome, email: recUser.email,
      _subject: 'CIEESC ▶︎ PLAY - Código para redefinir sua senha',
      message: `Olá, ${recUser.nome}!\n\nSeu código para redefinir a senha do CIEESC ▶︎ PLAY é: ${code}\n\nEle vale por 15 minutos. Se você não pediu a recuperação, ignore este e-mail.`
    });
    lastRecoverySend = Date.now();
    localStorage.setItem('ciee_recovery', JSON.stringify({ email:recUser.email, hash:await hashOrPlain(code), exp:Date.now() + 15*60000, tries:0 }));
    $('rv-mail2').textContent = maskEmail(recUser.email);
    ['rec-code','rec-pass','rec-pass2'].forEach(id => $(id).value = '');
    document.querySelectorAll('.pass-legend').forEach(updateLegend);
    setMsg(msg, ''); setMsg($('rv-msg-reset'), '');
    openRecoverStep('reset');
    setTimeout(() => $('rec-code').focus({preventScroll:true}), 60);
  }catch(err){
    setMsg(msg, 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
  }finally{
    btn.disabled = false;
  }
}

async function handleReset(e){
  e.preventDefault();
  const msg = $('rv-msg-reset');
  let rec = null;
  try{ rec = JSON.parse(localStorage.getItem('ciee_recovery')); }catch(_){}
  if (!rec || !recUser || rec.email !== recUser.email || Date.now() > rec.exp) return setMsg(msg, 'Código expirado. Volte e peça um novo.');
  if (rec.tries >= 5) return setMsg(msg, 'Muitas tentativas. Cancele e peça um novo código.');
  const code = $('rec-code').value.trim(), p = $('rec-pass').value, p2 = $('rec-pass2').value;
  if ((await hashOrPlain(code)) !== rec.hash){
    rec.tries++; localStorage.setItem('ciee_recovery', JSON.stringify(rec));
    return setMsg(msg, 'Código incorreto.');
  }
  if (!passOk(p)) return setMsg(msg, 'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.');
  if (p !== p2) return setMsg(msg, 'As senhas não conferem.');
  const updated = { ...recUser, senhaHash: await cieeSenha.gerar(p) };
  saveUser(updated);
  localStorage.removeItem('ciee_recovery');
  pendingUser = updated; recUser = null;
  closeRecover();
  $('login-id').value = updated.email; $('login-pass').value = '';
  $('hello-name').textContent = (updated.nome || '').split(' ')[0];
  document.querySelectorAll('.pass-legend').forEach(updateLegend);
  showLoginStep('pass');
  setMsg($('login-msg-pass'), 'Senha redefinida! Entre com a nova senha.', 'ok');
}

// 18. Vindo do playing.html sem login: abre direto a tela de login (?acao=login)
window.addEventListener('load', () => {
  if (new URLSearchParams(location.search).get('acao') === 'login') setTimeout(() => flipTo('login'), 2500);
});

// ===== Sistema: cor do tema, manutenção, versão e atalhos ESC / ENTER =====
const COLOR_THEMES = {
  blue:  {p:'#0056b3', s:'#6f42c1', a:'#00b4d8', tint:'#ffffff'},
  purple:{p:'#6f42c1', s:'#d63384', a:'#0056b3', tint:'#f4f0ff'},
  pink:  {p:'#d63384', s:'#6f42c1', a:'#ff8fab', tint:'#fff0f6'}
};
function chosenColor(){ try{ return COLOR_THEMES[localStorage.getItem('ciee_color_theme')] || null; }catch(e){ return null; } }
function paintColor(){
  const c = chosenColor(); if (!c) return;
  const r = document.documentElement.style;
  r.setProperty('--theme-primary', c.p); r.setProperty('--theme-secondary', c.s); r.setProperty('--theme-accent', c.a);
  r.setProperty('--bg-gradient', `linear-gradient(135deg,${c.p},${c.s},${c.a})`);
  r.setProperty('--btn-dynamic-bg', c.p); r.setProperty('--card-dynamic-bg', c.tint);
}
function setColorTheme(n){ try{ localStorage.setItem('ciee_color_theme', n); }catch(e){} paintColor(); }
paintColor();

let SIS = {}; try{ SIS = JSON.parse(localStorage.getItem('ciee_sistema')) || {}; }catch(e){}
const MANUT = !!SIS.manutencao;
$('app-version').textContent = SIS.versao || '0.1';
if (MANUT){
  document.body.classList.add('maint-on');
  const b = $('btn-first'); b.disabled = true; b.classList.add('btn-disabled'); b.textContent = 'Primeiro acesso (indisponível)';
  $('login-id').disabled = true; $('login-id').placeholder = 'Indisponível em manutenção';
  $('btn-continue').disabled = true;
  $('link-recover').classList.add('link-off');
  document.querySelectorAll('#login-step-pass .forgot-pass').forEach(a => a.classList.add('link-off'));
  $('keep-connected').disabled = true;
}

// recursos desligados pelo Webmaster (Painel › Sistema › Configurações)
if (!cieeRecurso('primeiroAcesso') && !MANUT){ const b = $('btn-first'); b.disabled = true; b.classList.add('btn-disabled'); b.textContent = 'Primeiro acesso (indisponível)'; }
// ESC cancela / ENTER confirma nas caixas de confirmação
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  if ($('recover-modal').classList.contains('open')){
    if (e.key === 'Escape'){ e.preventDefault(); closeRecover(); }
    else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && $('rv-step-confirm').style.display !== 'none'){ e.preventDefault(); sendRecovery(); }
    return;
  }
  if ($('scene').dataset.side === 'login' && $('login-step-confirm').style.display !== 'none'){
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON'){ e.preventDefault(); confirmIdentity(); }
    else if (e.key === 'Escape'){ e.preventDefault(); denyIdentity(); }
  }
});
