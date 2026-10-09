/* CIEESC PLAY — Sugestões do aprendiz
   A sugestão vai por e-mail (FormSubmit, o mesmo serviço do cadastro) para TODOS os orientadores e monitores
   cadastrados no painel com e-mail. O primeiro destinatário recebe, no primeiro envio, um e-mail de ativação do FormSubmit. */
(function () {
  const ENDPOINT = 'https://formsubmit.co/ajax/';
  const INTERVALO = 2 * 60 * 1000;            // espera mínima entre dois envios (2 minutos)
  const lerJ = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const emailOk = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim());
  // turma do jovem: a turma cadastrada na cidade e no dia/período dele (ex.: "Quarta-feira - Tarde (TUB_TUB_QUA_VES_0)")
  function turmaDe(s) {
    if (s.turma) return s.turma;
    const t = (lerJ('ciee_turmas', []) || []).find(x => x.cidade === s.cidade && x.diaPeriodo === s.periodo);
    return t ? t.diaPeriodo + ' (' + t.codId + ')' : (s.periodo || 'Não informada');
  }
  const ASSUNTOS = ['Acervo e empréstimos', 'Portal e aplicativo', 'Aprendizagem e cursos', 'Atendimento', 'Outro assunto'];

  const css = document.createElement('style');
  css.textContent = `#sugestoes-box{max-width:640px;margin:0 auto}
  @media (max-width:820px){#sugestoes-box{max-width:none;margin:0 var(--gut,18px)}}
  #sugestoes-box .generic-card{margin-left:0;margin-right:0}
  #sugestoes-box .sg-para{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 14px}
  #sugestoes-box .sg-para span{font:800 .78rem 'Nunito',sans-serif;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--theme-primary,#0056b3) 12%,transparent);color:var(--text-dark,#2d3748)}
  #sugestoes-box label{display:block;font:800 .8rem 'Nunito',sans-serif;letter-spacing:.6px;text-transform:uppercase;color:var(--text-muted,#718096);margin:12px 0 6px}
  #sugestoes-box select option{background:var(--input-bg,#fff);color:var(--text-dark,#2d3748)}
  #sugestoes-box select,#sugestoes-box textarea{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:2px solid var(--border-color,#e2e8f0);background:var(--input-bg,#fff);color:var(--text-dark,#2d3748);font:700 1rem 'Nunito',sans-serif}
  #sugestoes-box ::placeholder{color:var(--text-muted,#718096);opacity:.9}
  #sugestoes-box textarea{min-height:150px;resize:vertical;line-height:1.45}
  #sugestoes-box .sg-cont{display:block;text-align:right;font:700 .75rem 'Nunito',sans-serif;color:var(--text-muted,#718096);margin-top:4px}
  #sugestoes-box .sg-msg{min-height:1.3em;font-weight:800;margin-top:10px}#sugestoes-box .sg-msg.ok{color:#15803d}#sugestoes-box .sg-msg.erro{color:#dc2626}
  #sugestoes-box .sg-aviso{border:2px dashed var(--border-color,#cbd5e0);border-radius:12px;padding:12px 14px;font-weight:700;line-height:1.45}
  #sugestoes-box .btn-action[disabled]{opacity:.55;cursor:not-allowed}
  #sugestoes-box .sg-hist{margin-top:22px}#sugestoes-box .sg-hist h4{font:700 1.02rem 'Fredoka',sans-serif;margin:0 0 8px;color:var(--text-dark,#2d3748)}
  #sugestoes-box .sg-item{border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:10px 12px;margin-bottom:8px}
  #sugestoes-box .sg-item b{font:700 .95rem 'Nunito',sans-serif;color:var(--text-dark,#2d3748)}
  #sugestoes-box .sg-item small{display:block;font-weight:700;color:var(--text-muted,#718096);margin-top:2px}
  #sugestoes-box .sg-st{font:800 .72rem 'Nunito',sans-serif;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--theme-primary,#0056b3) 12%,transparent);color:var(--theme-primary,#0056b3);white-space:nowrap}
  #sugestoes-box .sg-st.sg-respondida{background:color-mix(in srgb,#16a34a 15%,transparent);color:#15803d}
  #sugestoes-box .sg-st.sg-em-analise{background:color-mix(in srgb,#d97706 15%,transparent);color:#b45309}
  #sugestoes-box .sg-st.sg-arquivada{background:var(--border-color,#e2e8f0);color:var(--text-muted,#718096)}
  #sugestoes-box .sg-tentar{margin-top:8px;background:none;border:0;padding:0;color:var(--theme-primary,#0056b3);font:800 .82rem 'Nunito',sans-serif;text-decoration:underline;cursor:pointer}
  #sugestoes-box .sg-pag{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:6px}
  #sugestoes-box .sg-pag button{min-width:38px;height:38px;border-radius:999px;border:1px solid var(--border-color,#e2e8f0);background:transparent;color:var(--text-dark,#2d3748);font:800 .9rem 'Nunito',sans-serif;cursor:pointer}
  #sugestoes-box .sg-pag button[aria-current="page"]{background:var(--theme-primary,#0056b3);border-color:var(--theme-primary,#0056b3);color:#fff}
  #sugestoes-box .sg-item p{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:var(--text-dark,#2d3748)}`;
  document.head.appendChild(css);

  // destinatários: orientadores e monitores cadastrados no painel que tenham e-mail
  function destinatarios() {
    const lista = [];
    [['ciee_orientadores', 'Orientador(a)'], ['ciee_monitores', 'Monitor(a)']].forEach(([k, papel]) => {
      (lerJ(k, []) || []).forEach(p => { if (emailOk(p.email)) lista.push({ nome: p.nome || p.email, email: String(p.email).trim().toLowerCase(), papel, cidade: p.cidade || '' }); });
    });
    const vistos = new Set(); return lista.filter(d => !vistos.has(d.email) && vistos.add(d.email));
  }
  const historico = k => (lerJ('ciee_sugestoes', {})[k] || []);

  function render(msgTxt, tipo) {
    const box = document.getElementById('sugestoes-box'); if (!box) return;
    const s = sessao(); if (!s) return;
    if (window.cieeRecurso && !cieeRecurso('sugestoes')) { box.innerHTML = '<div class="generic-card"><div class="sg-aviso">A caixa de sugestões está fechada no momento. Volte em breve.</div></div>'; return; }
    const d = destinatarios(), k = String(s.email || s.nome || 'anon').toLowerCase();
    if (!d.length) { box.innerHTML = '<div class="generic-card"><div class="sg-aviso">Ainda não há orientadores ou monitores com e-mail cadastrado. Assim que a coordenação cadastrar, você poderá enviar sua sugestão por aqui.</div></div>' + hist(k); ligarHist(d); return; }
    box.innerHTML = '<div class="generic-card">' +
      '<div style="font-weight:800;color:var(--text-dark,#2d3748)">Sua sugestão vai para ' + d.length + (d.length === 1 ? ' pessoa' : ' pessoas') + ':</div>' +
      '<div class="sg-para">' + d.map(x => '<span title="' + esc(x.email) + '">' + esc(x.nome) + ' · ' + esc(x.papel) + '</span>').join('') + '</div>' +
      '<label for="sg-assunto">Assunto</label><select id="sg-assunto">' + ASSUNTOS.map(a => '<option>' + a + '</option>').join('') + '</select>' +
      '<label for="sg-texto">Sua sugestão</label><textarea id="sg-texto" maxlength="1000" placeholder="Conte sua ideia: o que pode melhorar no portal, no acervo ou na aprendizagem?"></textarea><span class="sg-cont" id="sg-cont">0 / 1000</span>' +
      '<p style="font-size:.85rem;font-weight:700;color:var(--text-muted,#718096);margin:8px 0 14px">Seu nome e e-mail vão junto, para que possam responder a você.</p>' +
      '<button type="button" class="btn-action btn-reserve" id="sg-enviar" style="width:100%">Enviar sugestão</button>' +
      '<div class="sg-msg ' + (tipo || '') + '" id="sg-msg" role="status">' + esc(msgTxt || '') + '</div></div>' + hist(k);
    const ta = document.getElementById('sg-texto'), ct = document.getElementById('sg-cont');
    ta.oninput = () => { ct.textContent = ta.value.length + ' / 1000'; };
    document.getElementById('sg-enviar').onclick = () => enviar(d);
    ligarHist(d);
  }
  function ligarHist(d) {
    document.querySelectorAll('#sugestoes-box .sg-pag [data-p]').forEach(b => b.onclick = () => { pagina = +b.dataset.p; render(); const h = document.querySelector('#sugestoes-box .sg-hist'); if (h) h.scrollIntoView({ block: 'nearest' }); });
    document.querySelectorAll('#sugestoes-box .sg-tentar').forEach(b => b.onclick = () => {
      const s = sessao(), k = String(s.email || s.nome || 'anon').toLowerCase(), x = historico(k).find(v => String(v.id || v.ts) === b.dataset.id); if (!x) return;
      document.getElementById('sg-assunto').value = x.assunto; document.getElementById('sg-texto').value = x.texto; document.getElementById('sg-cont').textContent = x.texto.length + ' / 1000';
      const tudo = lerJ('ciee_sugestoes', {}); tudo[k] = (tudo[k] || []).filter(v => v !== x && String(v.id || v.ts) !== b.dataset.id); gravar('ciee_sugestoes', tudo);
      enviar(d);
    });
  }
  // "Minhas sugestões": 2 por página, com o andamento marcado pela equipe no painel
  let pagina = 1;
  const POR = 2;
  function hist(k) {
    const h = historico(k).slice().reverse(); if (!h.length) return '';
    const total = Math.ceil(h.length / POR); if (pagina > total) pagina = total; if (pagina < 1) pagina = 1;
    const env = x => x.envio === 'ativacao' ? 'Aguardando ativação do e-mail da coordenação' : (x.ok ? 'Enviada para ' + x.n + (x.n === 1 ? ' pessoa' : ' pessoas') : 'Não foi enviada');
    const itens = h.slice((pagina - 1) * POR, pagina * POR).map(x => '<div class="sg-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><b>' + esc(x.assunto) + '</b><span class="sg-st sg-' + esc(String(x.status || 'Nova').toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')) + '">' + esc(x.status || 'Nova') + '</span></div><small>' +
      new Date(x.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + env(x) + '</small><p>' + esc(x.texto) + '</p>' +
      (!x.ok && x.envio !== 'ativacao' ? '<button type="button" class="sg-tentar" data-id="' + esc(x.id || x.ts) + '">Tentar enviar de novo</button>' : '') + '</div>').join('');
    let pag = '';
    if (total > 1) { pag = '<nav class="sg-pag" aria-label="Páginas de Minhas sugestões">'; for (let n = 1; n <= total; n++) pag += '<button type="button" data-p="' + n + '"' + (n === pagina ? ' aria-current="page"' : '') + '>' + n + '</button>'; pag += '</nav>'; }
    return '<div class="sg-hist"><h4>Minhas sugestões</h4>' + itens + pag + '</div>';
  }
  const msg = (t, tipo) => { const e = document.getElementById('sg-msg'); if (e) { e.textContent = t; e.className = 'sg-msg ' + (tipo || ''); } };

  async function enviar(d) {
    const s = sessao(); if (!s) return;
    const texto = document.getElementById('sg-texto').value.trim(), assunto = document.getElementById('sg-assunto').value, k = String(s.email || s.nome || 'anon').toLowerCase();
    if (texto.length < 10) return msg('Escreva pelo menos 10 caracteres.', 'erro');
    const ult = lerJ('ciee_sug_ultimo', 0); if (Date.now() - ult < INTERVALO) return msg('Aguarde ' + Math.ceil((INTERVALO - (Date.now() - ult)) / 1000) + ' segundos para enviar outra sugestão.', 'erro');
    const b = document.getElementById('sg-enviar'); b.disabled = true; msg('Enviando…');
    const [primeiro, ...resto] = d.map(x => x.email);
    const fd = new FormData();
    Object.entries({
      _subject: 'Sugestão no CIEESC PLAY — ' + assunto + ' (' + (s.nome || 'aprendiz') + ')', _template: 'table', _captcha: 'false', _cc: resto.join(','),
      'Nome do jovem': s.nome || '', 'Cidade': s.cidade || '', 'Turma': turmaDe(s), 'Assunto': assunto, 'Descrição da sugestão': texto,
      email: emailOk(s.email) ? s.email : '', 'Enviada em': new Date().toLocaleString('pt-BR')
    }).forEach(([kk, v]) => { if (v !== '') fd.append(kk, v); });
    let ok = false, erro = '', envio = 'falhou';
    try {
      const r = await fetch(ENDPOINT + encodeURIComponent(primeiro), { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd });
      const j = await r.json().catch(() => ({})); ok = r.ok && String(j.success) !== 'false'; if (!ok) erro = j.message || ('HTTP ' + r.status);
      if (ok) envio = 'enviada'; else if (/activat/i.test(erro)) envio = 'ativacao';   // 1º envio do FormSubmit: falta o destinatário ativar
    } catch (e) { erro = e.message; }
    const tudo = lerJ('ciee_sugestoes', {}); (tudo[k] = tudo[k] || []).push({ id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: Date.now(), assunto, texto, ok, envio, n: d.length, status: 'Nova', nome: s.nome || '', cidade: s.cidade || '', periodo: s.periodo || '' }); gravar('ciee_sugestoes', tudo);
    pagina = 1;
    if (ok) { gravar('ciee_sug_ultimo', Date.now()); render('Sugestão enviada! Obrigado por ajudar a melhorar o CIEESC PLAY.', 'ok'); }
    else if (envio === 'ativacao') { gravar('ciee_sug_ultimo', Date.now()); render('Sugestão registrada. O e-mail da coordenação ainda precisa ser ativado no FormSubmit; avise a equipe.', 'erro'); }
    else { b.disabled = false; render('Não foi possível enviar agora. Verifique a internet e tente de novo.', 'erro'); document.getElementById('sg-texto').value = texto; document.getElementById('sg-cont').textContent = texto.length + ' / 1000'; console.warn('sugestão:', erro); }
  }

  window.cieeSugestoes = { render, destinatarios };
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', () => render());
})();
