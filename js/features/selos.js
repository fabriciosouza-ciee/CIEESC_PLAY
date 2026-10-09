/* CIEESC PLAY — selos de conquista
   1) Datas especiais: quem entra com o login durante o período de um tema sazonal (pela data) ganha o selo, uma vez por ano.
   2) Leitura: 1 PONTO por livro concluído — o livro só conta depois de (1) devolvido, (2) refletido (resposta curta)
      e (3) compartilhado (breve opinião). Níveis: 10, 20 e 30 pontos. Ler mais rápido não dá mais ponto, e o mesmo
      livro só conta uma vez por pessoa. Desafios de leitura dão selos extras.
   Os selos aparecem em "Meu perfil". Teste manual de tema pelo admin NÃO gera selo. */
(function () {
  if (window.cieeSelos) return;
  const KEY = 'ciee_conquistas', KL = 'ciee_leituras', KI = 'ciee_indicacoes';
  const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const mesmoLivro = (x, d) => (x.codigo && d.codigo && x.codigo === d.codigo) || (!!norm(x.livro) && norm(x.livro) === norm(d.livro));
  const lerJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const chave = s => String(s.email || s.nome || 'anon').toLowerCase();
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LEIT = [
    { id: 'leitor10', n: 10, nome: 'Explorador da Leitura', desc: 'Chegou a 10 pontos de leitura', c: { p: '#cf8f55', s: '#7a4318', a: '#f3d19a' } },
    { id: 'leitor20', n: 20, nome: 'Leitor em Ação', desc: 'Chegou a 20 pontos de leitura', c: { p: '#d9dfe9', s: '#7f8ba0', a: '#ffffff' } },
    { id: 'leitor30', n: 30, nome: 'Leitor Destaque', desc: 'Chegou a 30 pontos de leitura', c: { p: '#ffd978', s: '#c9902a', a: '#fff3c4' } }];
  // selos de aprendizagem: concedidos manualmente por orientadores e admins (nível 4 e 5)
  const PASTA = '<path d="M6 12h10l3 3h15v17H6z" fill="#fff"/><path d="M14 24l5 5 8-9" stroke="rgba(0,0,0,.45)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  const MAN = [
    { id: 'representante', nome: 'Representante de Turma', desc: 'Foi escolhido(a) líder de sala', como: 'Concedido quando vira líder de sala', anual: true, c: { p: '#3b6fd8', s: '#4b2a9a', a: '#ffd166' },
      sym: '<circle cx="20" cy="13" r="6" fill="#fff"/><path d="M8 33c0-8 5-12 12-12s12 4 12 12z" fill="#fff"/><path d="M31 5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffd166"/>' },
    { id: 'capricho1', nome: 'Capricho I', desc: 'Entregou todo o portfólio do 1º ano', como: 'Concedido por entregar todo o portfólio do 1º ano', rom: 'I', c: { p: '#22b184', s: '#0b6b52', a: '#c8f5e4' }, sym: PASTA },
    { id: 'capricho2', nome: 'Capricho II', desc: 'Entregou todo o portfólio do 1º e do 2º ano', como: 'Concedido por entregar todo o portfólio do 1º e do 2º ano', rom: 'II', c: { p: '#ffd978', s: '#c27a12', a: '#fff3c4' }, sym: PASTA }];
  // desafios de leitura (selos extras). "Voz da Leitura" é concedido pela equipe; os outros saem sozinhos.
  const DES = [
    { id: 'des_genero', nome: 'Novos Horizontes', desc: 'Leu um gênero diferente do habitual', como: 'Conclua um livro de um gênero diferente do que você mais lê', c: { p: '#7c5cff', s: '#3b2a8a', a: '#d9ccff' },
      sym: '<circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="3"/><path d="M27 13l-4.5 11L13 27l4.5-11z" fill="#fff"/>' },
    { id: 'des_brasil', nome: 'Raízes Brasileiras', desc: 'Leu um livro de autor(a) brasileiro(a)', como: 'Conclua um livro de autor(a) brasileiro(a)', c: { p: '#20a35a', s: '#0b6b3a', a: '#ffd84d' },
      sym: '<path d="M20 5L36 20 20 35 4 20z" fill="#ffd84d"/><circle cx="20" cy="20" r="7.5" fill="#1d4ed8"/><path d="M13.3 18.6q6.7-2.6 13.4 1" stroke="#fff" stroke-width="1.6" fill="none"/>' },
    { id: 'des_profissao', nome: 'Leitura Profissional', desc: 'Leu um livro ligado à profissão', como: 'Conclua um livro marcado como ligado à profissão', c: { p: '#0e7490', s: '#0b3f5c', a: '#a5f3fc' },
      sym: '<rect x="6" y="13" width="28" height="19" rx="3" fill="#fff"/><path d="M15 13v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="#fff" stroke-width="2.6" fill="none"/><path d="M6 21h28" stroke="rgba(0,0,0,.3)" stroke-width="2"/>' },
    { id: 'des_indicou', nome: 'Boa Indicação', desc: 'Indicou um livro para outro jovem', como: 'Ao concluir uma leitura, indique o livro a um colega', c: { p: '#e2477a', s: '#9d174d', a: '#ffd1e0' },
      sym: '<path d="M20 33C9 25 6 19 6 14c0-4 3-7 7-7 3 0 5 2 7 4 2-2 4-4 7-4 4 0 7 3 7 7 0 5-3 11-14 19z" fill="#fff"/>' },
    { id: 'des_colega', nome: 'Escolha de Colega', desc: 'Leu um livro indicado por um colega', como: 'Conclua um livro que um colega indicou para você', c: { p: '#f59e0b', s: '#b45309', a: '#fff1c2' },
      sym: '<circle cx="14" cy="13" r="5" fill="#fff"/><circle cx="27" cy="14" r="4.2" fill="#fff" opacity=".85"/><path d="M4 32c0-7 4-11 10-11s10 4 10 11z" fill="#fff"/><path d="M22 23c1.5-1 3-1.5 5-1.5 5 0 9 3.5 9 10.5H25" fill="#fff" opacity=".85"/>' },
    { id: 'des_voz', nome: 'Voz da Leitura', desc: 'Apresentou uma recomendação de 1 minuto', como: 'Concedido pela equipe depois da sua apresentação', manual: true, c: { p: '#2563eb', s: '#1e3a8a', a: '#bfdbfe' },
      sym: '<rect x="14" y="5" width="12" height="19" rx="6" fill="#fff"/><path d="M9 19a11 11 0 0 0 22 0M20 30v6M14 36h12" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>' }];
  const VOZ = DES.find(d => d.id === 'des_voz'); MAN.push(Object.assign({ grupo: 'desafio' }, VOZ));
  const LIVRO = '<path d="M20 9C16 6 11 6 6 7v22c5-1 10-1 14 2 4-3 9-3 14-2V7c-5-1-10-1-14 2z" fill="#fff"/><path d="M20 9v22" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/>';

  const css = document.createElement('style');
  css.textContent = `.selos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:12px;margin-top:10px}
  .selo{position:relative;text-align:center;padding:12px 8px 10px;border:1px solid var(--border-color,#e2e8f0);border-radius:14px;background:var(--bg-card,#fff)}
  .selo svg{width:76px;height:84px;display:block;margin:0 auto 6px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}
  .selo b{display:block;font:700 .9rem 'Fredoka',sans-serif;color:var(--text-dark,#2d3748);line-height:1.2}
  .selo small{display:block;margin-top:3px;font:700 .72rem 'Nunito',sans-serif;color:var(--text-muted,#718096);line-height:1.3}
  .selo .anos{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:6px}
  .selo .anos i{font:800 .7rem 'Nunito',sans-serif;font-style:normal;padding:2px 8px;border-radius:999px;background:var(--theme-primary,#0056b3);color:#fff}
  .selo.bloq svg{opacity:.6;filter:grayscale(1) brightness(.9)}
  .selos-topo span{font:800 .85rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .selos-sec h4{font:700 1.02rem 'Fredoka',sans-serif;margin:20px 0 4px;color:var(--text-dark,#2d3748)}
  .prog .bar{height:10px;border-radius:999px;background:var(--border-color,#e2e8f0);overflow:hidden;margin:8px 0 6px}.prog .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#cf8f55,#ffd978);transition:width .8s}
  .prog span{font:700 .85rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .sel-nota{margin:2px 0 4px;font:700 .82rem/1.45 'Nunito',sans-serif;color:var(--text-muted,#718096)}.sel-nota a{color:var(--theme-primary,#0056b3)}
  @media (max-width:820px){.selos-box{margin:0 var(--gut,18px)}}
  #selo-toast{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-160%);z-index:99990;width:min(92vw,400px);display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--theme-primary,#0056b3),var(--theme-secondary,#6f42c1));box-shadow:0 10px 30px rgba(0,0,0,.4);font:700 .92rem 'Nunito',sans-serif;transition:transform .5s cubic-bezier(.2,.9,.3,1.2)}
  #selo-toast.on{transform:translate(-50%,0)}#selo-toast svg{width:44px;height:48px;flex:0 0 auto}#selo-toast small{display:block;font-weight:700;opacity:.9}`;
  document.head.appendChild(css);

  // definição de um selo (tema sazonal ou leitura)
  function def(id) {
    const l = LEIT.find(t => t.id === id); if (l) return { nome: l.nome, desc: l.desc, c: l.c, n: l.n };
    const m = MAN.find(t => t.id === id) || DES.find(t => t.id === id); if (m) return { nome: m.nome, desc: m.desc, c: m.c, sym: m.sym, rom: m.rom, como: m.como };
    const t = cieeTemas.TEMAS[id]; return t ? { nome: t.selo.nome, desc: t.selo.desc, c: t.c, sym: t.selo.sym } : null;
  }
  function seloSVG(id, i) {
    const d = def(id), c = d.c, g = 'sg' + id + (i || '');
    const miolo = d.rom ? '<g transform="translate(32 20) scale(.9)">' + d.sym + '</g><text x="50" y="80" text-anchor="middle" font-family="Fredoka,Nunito,sans-serif" font-weight="700" font-size="20" fill="#fff" stroke="rgba(0,0,0,.4)" stroke-width=".9" paint-order="stroke">' + d.rom + '</text>' : d.n ? '<g transform="translate(34 20) scale(.8)">' + LIVRO + '</g><text x="50" y="76" text-anchor="middle" font-family="Fredoka,Nunito,sans-serif" font-weight="700" font-size="24" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width=".9" paint-order="stroke">' + d.n + '</text>' : '<g transform="translate(30 30)">' + d.sym + '</g>';
    return '<svg viewBox="0 0 100 108" role="img" aria-label="Selo ' + esc(d.nome) + '"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.p + '"/><stop offset="1" stop-color="' + c.s + '"/></linearGradient></defs>' +
      '<polygon points="25,6 75,6 98,50 75,94 25,94 2,50" fill="url(#' + g + ')" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><polygon points="29,14 71,14 90,50 71,86 29,86 10,50" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.4"/>' + miolo +
      '<path d="M32 98l-4 10 10-4 4-8zM68 98l4 10-10-4-4-8z" fill="' + c.a + '" opacity=".95"/></svg>';
  }
  const meus = () => { const s = sessao(); return s ? (lerJ(KEY, {})[chave(s)] || {}) : {}; };

  let fila = [], mostrando = false;
  function toast(id, ano) {
    fila.push([id, ano]); if (mostrando) return; mostrando = true;
    (function prox() {
      const it = fila.shift(); if (!it) { mostrando = false; return; }
      let e = document.getElementById('selo-toast');
      if (!e) { e = document.createElement('div'); e.id = 'selo-toast'; e.setAttribute('role', 'status'); document.body.appendChild(e); }
      e.classList.remove('on'); e.innerHTML = seloSVG(it[0], 't') + '<span>Conquista desbloqueada!<small>' + esc(def(it[0]).nome) + ' · ' + it[1] + '</small></span>';
      requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add('on')));
      setTimeout(() => { e.classList.remove('on'); setTimeout(prox, 600); }, 5200);
    })();
  }

  // 1) selo da data especial (ao entrar com o login no período)
  function conceder(data) {
    const s = sessao(); if (!s) return null; const p = cieeTemas.periodoDe(data); if (!p) return null;
    const tudo = lerJ(KEY, {}), k = chave(s), mine = tudo[k] || {}, id = p.id + '-' + p.ano;
    if (mine[id]) return null;
    mine[id] = { ts: Date.now(), id: p.id, ano: p.ano }; tudo[k] = mine; if (!gravar(KEY, tudo)) return null;
    toast(p.id, p.ano); renderizar(); return { id: p.id, ano: p.ano };
  }

  // 2) leitura em 3 critérios: (1) devolveu [admin]  (2) refletiu  (3) compartilhou [aprendiz, no portal]
  const leituras = () => lerJ(KL, []);
  const acervoInfo = codigo => (lerJ('ciee_acervo', []) || []).find(b => b.codigo === codigo) || {};
  const pontos = k => leituras().filter(x => x.chave === k && x.concluidoEm && x.ponto).length;
  const pendentes = k => leituras().filter(x => x.chave === k && !x.concluidoEm);
  const concluidas = k => leituras().filter(x => x.chave === k && x.concluidoEm).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  function registrarLeitura(d) {              // chamado pelo admin ao confirmar a devolução
    const k = String(d.email || d.nome || 'anon').toLowerCase(), L = leituras(), info = acervoInfo(d.codigo);
    const reg = { id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), chave: k, nome: d.nome || '', livro: d.livro || info.titulo || '', codigo: d.codigo || '',
      categoria: info.categoria || '', autorBR: info.autorBR === 'sim', profissao: info.profissao === 'sim', devolvidoEm: hojeISO(), data: hojeISO(), ano: new Date().getFullYear() };
    reg.repetido = L.some(x => x.chave === k && x.concluidoEm && x.ponto && mesmoLivro(x, reg));
    L.push(reg); gravar(KL, L);
    return { pendente: true, repetido: reg.repetido, pontos: pontos(k), registro: reg };
  }
  function concluirLeitura(id, resp) {        // chamado pelo aprendiz em "Minhas leituras"
    const s = sessao(); if (!s) return { ok: false, motivo: 'Entre com o seu login.' };
    const k = chave(s), L = leituras(), r = L.find(x => x.id === id && x.chave === k);
    if (!r || r.concluidoEm) return { ok: false, motivo: 'Esta leitura já foi concluída.' };
    const refl = String(resp.reflexao || '').trim(), opi = String(resp.opiniao || '').trim();
    if (refl.length < 10 || opi.length < 10) return { ok: false, motivo: 'Escreva pelo menos 10 caracteres em cada resposta.' };
    const anteriores = L.filter(x => x.chave === k && x.concluidoEm && x.ponto);
    r.repetido = r.repetido || anteriores.some(x => mesmoLivro(x, r));
    Object.assign(r, { reflexao: refl.slice(0, 600), opiniao: opi.slice(0, 600), concluidoEm: hojeISO(), ts: Date.now(), ponto: !r.repetido });
    const ano = new Date().getFullYear(), tudo = lerJ(KEY, {}), mine = tudo[k] || {}, novos = [];
    const dar = sid => { if (!Object.values(mine).some(x => x.id === sid)) { mine[sid + '-' + ano] = { ts: Date.now(), id: sid, ano }; novos.push(sid); } };
    if (r.ponto) {
      const total = anteriores.length + 1;
      LEIT.forEach(t => { if (total >= t.n) dar(t.id); });
      if (r.autorBR) dar('des_brasil');
      if (r.profissao) dar('des_profissao');
      if (anteriores.length >= 2 && r.categoria) {          // gênero diferente do que a pessoa mais lê
        const cont = {}; anteriores.forEach(x => { if (x.categoria) cont[x.categoria] = (cont[x.categoria] || 0) + 1; });
        const top = Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0]; if (top && top !== r.categoria) dar('des_genero');
      }
      const I = lerJ(KI, []), ind = I.find(x => x.para === k && !x.lidoEm && mesmoLivro(x, r));
      if (ind) { ind.lidoEm = hojeISO(); gravar(KI, I); r.indicadoPor = ind.deNome; dar('des_colega'); }
    }
    const para = String(resp.indicarPara || '').toLowerCase();
    if (para && para !== k) {
      const dest = (lerJ('ciee_users', []) || []).find(u => String(u.email || '').toLowerCase() === para);
      if (dest) { const I = lerJ(KI, []); I.push({ de: k, deNome: s.nome || '', para, paraNome: dest.nome || '', codigo: r.codigo, livro: r.livro, ts: Date.now() }); gravar(KI, I); r.indicadoPara = dest.nome || ''; dar('des_indicou'); }
    }
    gravar(KL, L); if (novos.length) { tudo[k] = mine; gravar(KEY, tudo); }
    novos.forEach(n => toast(n, ano)); renderizar();
    return { ok: true, ponto: r.ponto, pontos: pontos(k), novos };
  }
  const indicacoesPara = k => lerJ(KI, []).filter(x => x.para === k && !x.lidoEm);
  const opinioes = (codigo, livro) => leituras().filter(x => x.concluidoEm && x.opiniao && mesmoLivro(x, { codigo, livro })).sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .map(x => ({ nome: String(x.nome || '').split(' ')[0] || 'Leitor', opiniao: x.opiniao, data: x.concluidoEm }));
  // 3) selos de aprendizagem: concedidos/retirados por orientadores e admins
  const manuais = k => { const mine = lerJ(KEY, {})[k] || {}; const o = {}; MAN.forEach(t => { const e = Object.keys(mine).filter(x => mine[x].id === t.id).map(x => mine[x]); if (e.length) o[t.id] = e; }); return o; };
  function concederManual(k, id, por) {
    const t = MAN.find(x => x.id === id); if (!t) return { ok: false, motivo: 'Selo desconhecido.' };
    const ano = new Date().getFullYear(), tudo = lerJ(KEY, {}), mine = tudo[k] || {};
    if (Object.keys(mine).some(x => mine[x].id === id && (!t.anual || mine[x].ano === ano))) return { ok: false, motivo: 'Já possui este selo.' };
    mine[id + '-' + ano] = { ts: Date.now(), id, ano, por: por || '', manual: true, novo: true }; tudo[k] = mine; gravar(KEY, tudo);
    return { ok: true, ano };
  }
  function retirarManual(k, id) {
    const t = MAN.find(x => x.id === id); if (!t) return false; const ano = new Date().getFullYear(), tudo = lerJ(KEY, {}), mine = tudo[k] || {}; let n = 0;
    Object.keys(mine).forEach(x => { if (mine[x].id === id && (!t.anual || mine[x].ano === ano)) { delete mine[x]; n++; } });
    if (n) { tudo[k] = mine; gravar(KEY, tudo); } return n > 0;
  }

  // aviso na próxima vez que a pessoa entrar (selos de leitura concedidos pelo admin)
  function avisarNovos() {
    const s = sessao(); if (!s) return; const tudo = lerJ(KEY, {}), mine = tudo[chave(s)]; if (!mine) return; let mudou = false;
    Object.keys(mine).forEach(k => { if (mine[k].novo) { toast(mine[k].id, mine[k].ano); delete mine[k].novo; mudou = true; } });
    if (mudou) gravar(KEY, tudo);
  }

  function card(id, anos, extra) {
    const d = def(id);
    return '<div class="selo' + (anos.length ? '' : ' bloq') + '">' + seloSVG(id) + '<b>' + esc(d.nome) + '</b>' + (anos.length ? '<div class="anos">' + anos.map(a => '<i>' + a + '</i>').join('') + '</div>' : '') + (extra ? '<small>' + extra + '</small>' : '') + '<small>' + esc(d.desc) + '</small></div>';
  }
  function renderizar() {
    const box = document.getElementById('selos-perfil'); if (!box) return;
    const s = sessao(), mine = meus(), hoje = new Date(), k = s ? chave(s) : '', pts = k ? pontos(k) : 0;
    const anosDe = id => Object.keys(mine).filter(x => mine[x].id === id).map(x => mine[x].ano).sort();
    let ganhos = 0;
    const sec = (titulo, lista, extra) => { let h = ''; lista.forEach(t => { const an = anosDe(t.id); if (an.length) ganhos++; h += card(t.id, an, an.length ? '' : extra(t)); }); return '<div class="selos-sec"><h4>' + titulo + '</h4>' + (sec.pre || '') + '<div class="selos-grid">' + h + '</div></div>'; };
    const htM = sec('Conquistas da aprendizagem', MAN.filter(t => !t.grupo), t => t.como);
    const prox = LEIT.find(t => pts < t.n), base = prox ? (LEIT[LEIT.indexOf(prox) - 1] || { n: 0 }).n : 30, pct = prox ? Math.round((pts - base) / (prox.n - base) * 100) : 100;
    sec.pre = '<div class="prog"><div class="bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div><span>' + pts + (pts === 1 ? ' ponto' : ' pontos') + ' de leitura' + (prox ? ' · faltam ' + (prox.n - pts) + ' para “' + esc(prox.nome) + '”' : ' · nível máximo alcançado') + '</span></div>' +
      '<p class="sel-nota">Cada livro vale 1 ponto quando você <strong>devolve</strong>, <strong>reflete</strong> (responde a uma pergunta curta) e <strong>compartilha</strong> uma breve opinião, em <a href="#" onclick="window.switchTab&&switchTab(\'leituras\');return false;">Acervo › Minhas leituras</a>. O mesmo livro conta uma vez só.</p>';
    const htL = sec('Leitura', LEIT, t => 'Faltam ' + Math.max(0, t.n - pts) + (t.n - pts === 1 ? ' ponto' : ' pontos'));
    sec.pre = '';
    const htD = sec('Desafios de leitura', DES, t => t.como);
    let htT = '';
    cieeTemas.ORDEM.slice().sort((a, b) => (cieeTemas.proxima(a, hoje)[0] - cieeTemas.proxima(b, hoje)[0])).forEach(id => {
      const an = anosDe(id), p = cieeTemas.proxima(id, hoje); if (an.length) ganhos++;
      htT += card(id, an, an.length ? '' : (p ? 'Disponível em ' + cieeTemas.descPeriodo(p) : ''));
    });
    const total = MAN.filter(t => !t.grupo).length + LEIT.length + DES.length + cieeTemas.ORDEM.length;
    box.innerHTML = '<div class="selos-topo"><span>' + ganhos + ' de ' + total + ' selos conquistados</span></div>' + htM + htL + htD +
      '<div class="selos-sec"><h4>Datas especiais</h4><div class="selos-grid">' + htT + '</div></div>';
  }

  window.cieeSelos = { conceder, registrarLeitura, concluirLeitura, pendentes, concluidas, pontos, indicacoesPara, opinioes, concederManual, retirarManual, manuais, MAN, DES, LEIT, renderizar, avisarNovos, meus, chave, seloSVG, lerTudo: () => lerJ(KEY, {}) };
  const go = () => { renderizar(); conceder(); avisarNovos(); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
