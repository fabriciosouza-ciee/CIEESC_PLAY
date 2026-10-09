/* CIEESC PLAY — "Minhas leituras" (Acervo › Minhas leituras)
   Cada livro devolvido aparece aqui. O ponto só vale depois de cumprir os 3 critérios:
   1. Leu (devolveu o livro — confirmado pela equipe)  2. Refletiu (resposta curta)  3. Compartilhou (breve opinião).
   Também mostra indicações de colegas e as opiniões dos leitores nos livros do acervo. */
(function () {
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const lerJ = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const dataBR = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const PERG1 = 'O que você achou mais interessante neste livro?';
  const PERG2 = 'Deixe uma breve opinião para outros jovens: você indicaria? Por quê?';

  const css = document.createElement('style');
  css.textContent = `#leituras-box{max-width:760px;margin:0 auto}
  @media (max-width:820px){#leituras-box{max-width:none;margin:0 var(--gut,18px)}}
  #leituras-box .generic-card{margin-left:0;margin-right:0}
  .lt-crit{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0 4px}
  @media (max-width:560px){.lt-crit{grid-template-columns:1fr}}
  .lt-crit div{border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:10px 12px;font:700 .85rem/1.35 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .lt-crit b{display:flex;align-items:center;gap:8px;font:700 1rem 'Fredoka',sans-serif;color:var(--text-dark,#2d3748);margin-bottom:2px}
  .lt-n{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--theme-primary,#0056b3);color:#fff;font:800 .8rem 'Nunito',sans-serif;flex:0 0 auto}
  .lt-sec{font:700 1.05rem 'Fredoka',sans-serif;margin:22px 0 8px;color:var(--text-dark,#2d3748)}
  .lt-item{border:1px solid var(--border-color,#e2e8f0);border-radius:14px;padding:12px 14px;margin-bottom:10px;background:var(--bg-card,#fff)}
  .lt-item h5{margin:0;font:700 1.05rem 'Fredoka',sans-serif;color:var(--text-dark,#2d3748)}
  .lt-item small{display:block;font:700 .78rem 'Nunito',sans-serif;color:var(--text-muted,#718096);margin-top:2px}
  .lt-passos{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
  .lt-passos span{font:800 .75rem 'Nunito',sans-serif;padding:4px 10px;border-radius:999px;border:1px solid var(--border-color,#e2e8f0);color:var(--text-muted,#718096)}
  .lt-passos span.ok{background:color-mix(in srgb,#16a34a 14%,transparent);border-color:#16a34a;color:#15803d}
  .lt-form label{display:block;font:800 .85rem 'Nunito',sans-serif;color:var(--text-dark,#2d3748);margin:12px 0 6px}
  .lt-form textarea,.lt-form select{width:100%;box-sizing:border-box;padding:11px;border-radius:12px;border:2px solid var(--border-color,#e2e8f0);background:var(--input-bg,#fff);color:var(--text-dark,#2d3748);font:700 .95rem 'Nunito',sans-serif}
  .lt-form textarea{min-height:90px;resize:vertical}
  .lt-msg{min-height:1.2em;font-weight:800;margin-top:8px}.lt-msg.erro{color:#dc2626}.lt-msg.ok{color:#15803d}
  .lt-pt{display:inline-block;margin-top:6px;font:800 .75rem 'Nunito',sans-serif;padding:3px 10px;border-radius:999px;background:var(--theme-primary,#0056b3);color:#fff}
  .lt-pt.sem{background:var(--border-color,#e2e8f0);color:var(--text-muted,#718096)}
  .lt-resp{margin-top:8px;font:700 .88rem/1.45 'Nunito',sans-serif;color:var(--text-dark,#2d3748)}.lt-resp p{margin:4px 0;white-space:pre-wrap;word-break:break-word}
  .lt-vazio{border:2px dashed var(--border-color,#cbd5e0);border-radius:12px;padding:12px 14px;font-weight:700;color:var(--text-muted,#718096)}
  .btn-op{background:none;border:0;padding:0;margin-top:8px;color:var(--theme-primary,#0056b3);font:800 .82rem 'Nunito',sans-serif;text-decoration:underline;cursor:pointer}
  #lt-modal{position:fixed;inset:0;z-index:2147482600;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55)}
  #lt-modal.on{display:flex}
  #lt-modal .lt-caixa{width:min(560px,100%);max-height:80vh;overflow:auto;background:var(--bg-card,#fff);color:var(--text-dark,#2d3748);border-radius:18px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.35)}
  #lt-modal h3{margin:0 0 10px;font:700 1.15rem 'Fredoka',sans-serif}
  #lt-aviso{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translate(-50%,180%);z-index:2600;width:min(92vw,420px);display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:var(--bg-card,#fff);color:var(--text-dark,#2d3748);border:1px solid var(--border-color,#e2e8f0);box-shadow:0 10px 30px rgba(0,0,0,.25);font:700 .9rem 'Nunito',sans-serif;transition:transform .45s}
  #lt-aviso.on{transform:translate(-50%,0)}
  @media (min-width:821px){#lt-aviso{bottom:20px}}
  #lt-aviso span{flex:1;min-width:0;line-height:1.35}
  #lt-aviso button{margin-left:auto;flex:0 0 auto;width:auto!important;padding:9px 16px;white-space:nowrap}`;
  document.head.appendChild(css);

  const k = () => { const s = sessao(); return s ? String(s.email || s.nome || 'anon').toLowerCase() : ''; };

  function colegas() {
    const eu = k(), s = sessao() || {};
    return (lerJ('ciee_users', []) || []).filter(u => u.email && String(u.email).toLowerCase() !== eu)
      .sort((a, b) => ((b.cidade === s.cidade) - (a.cidade === s.cidade)) || String(a.nome).localeCompare(String(b.nome)));
  }

  function render(msgTopo) {
    const box = document.getElementById('leituras-box'); if (!box || !window.cieeSelos) return;
    if (msgTopo) { const av = document.getElementById('lt-aviso'); if (av) av.remove(); }
    const s = sessao(); if (!s) return;
    const eu = k(), pend = cieeSelos.pendentes(eu), conc = cieeSelos.concluidas(eu), ind = cieeSelos.indicacoesPara(eu), pts = cieeSelos.pontos(eu);
    const prox = cieeSelos.LEIT.find(t => pts < t.n);
    let h = '<div class="generic-card"><div style="font:700 1.1rem Fredoka,sans-serif;color:var(--text-dark,#2d3748)">' + pts + (pts === 1 ? ' ponto' : ' pontos') + ' de leitura</div>' +
      '<small style="display:block;font-weight:700;color:var(--text-muted,#718096)">' + (prox ? 'Faltam ' + (prox.n - pts) + ' para o selo “' + esc(prox.nome) + '”.' : 'Você chegou ao nível máximo: Leitor Destaque.') + ' Cada livro vale 1 ponto, uma vez só.</small>' +
      '<div class="lt-crit"><div><b><span class="lt-n">1</span>Leu</b>Devolveu o livro (a equipe confirma).</div><div><b><span class="lt-n">2</span>Refletiu</b>Respondeu a uma pergunta curta.</div><div><b><span class="lt-n">3</span>Compartilhou</b>Deixou uma breve opinião.</div></div>' +
      (msgTopo ? '<div class="lt-msg ok" role="status">' + esc(msgTopo) + '</div>' : '') + '</div>';
    if (ind.length) h += '<div class="lt-sec">Indicações de colegas para você</div>' + ind.map(x => '<div class="lt-item"><h5>' + esc(x.livro) + '</h5><small>Indicado por ' + esc(x.deNome) + ' · ' + new Date(x.ts).toLocaleDateString('pt-BR') + '</small><small>Se você ler e concluir este livro, ganha o desafio “Escolha de Colega”.</small></div>').join('');
    h += '<div class="lt-sec">Para concluir</div>';
    h += pend.length ? pend.map(r => '<div class="lt-item" id="lt-' + r.id + '"><h5>' + esc(r.livro || r.codigo) + '</h5><small>Devolvido em ' + dataBR(r.devolvidoEm || r.data) + (r.repetido ? ' · você já ganhou ponto por este livro antes' : '') + '</small>' +
      '<div class="lt-passos"><span class="ok">1 · Leu</span><span>2 · Refletiu</span><span>3 · Compartilhou</span></div>' +
      '<button type="button" class="btn-action btn-reserve" data-abrir="' + r.id + '">Concluir leitura</button><div class="lt-form" id="ltf-' + r.id + '" hidden></div></div>').join('')
      : '<div class="lt-vazio">Nenhum livro esperando. Quando você devolver um livro, ele aparece aqui para você concluir.</div>';
    h += '<div class="lt-sec">Leituras concluídas</div>';
    h += conc.length ? conc.map(r => '<div class="lt-item"><h5>' + esc(r.livro || r.codigo) + '</h5><small>Concluído em ' + dataBR(r.concluidoEm) + (r.indicadoPara ? ' · indicado para ' + esc(r.indicadoPara) : '') + (r.indicadoPor ? ' · indicação de ' + esc(r.indicadoPor) : '') + '</small>' +
      '<span class="lt-pt' + (r.ponto ? '' : ' sem') + '">' + (r.ponto ? '1 ponto' : 'Sem ponto (livro já contado)') + '</span>' +
      '<details class="lt-resp"><summary style="cursor:pointer;font-weight:800">Ver minhas respostas</summary><p><strong>' + PERG1 + '</strong><br>' + esc(r.reflexao) + '</p><p><strong>Minha opinião:</strong><br>' + esc(r.opiniao) + '</p></details></div>').join('')
      : '<div class="lt-vazio">Você ainda não concluiu nenhuma leitura.</div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => abrirForm(b.dataset.abrir, b));
  }

  function abrirForm(id, botao) {
    const f = document.getElementById('ltf-' + id); if (!f) return;
    botao.hidden = true; f.hidden = false;
    f.innerHTML = '<label for="lt1-' + id + '"><span class="lt-n">2</span> Refletiu — ' + PERG1 + '</label><textarea id="lt1-' + id + '" maxlength="600" placeholder="Pode ser bem simples: uma ideia, uma cena, algo que você aprendeu."></textarea>' +
      '<label for="lt2-' + id + '"><span class="lt-n">3</span> Compartilhou — ' + PERG2 + '</label><textarea id="lt2-' + id + '" maxlength="600" placeholder="Sua opinião aparece para outros jovens no acervo, com o seu primeiro nome."></textarea>' +
      '<label for="lt3-' + id + '">Indicar este livro para um colega (opcional)</label><select id="lt3-' + id + '"><option value="">Não indicar agora</option>' + colegas().map(u => '<option value="' + esc(String(u.email).toLowerCase()) + '">' + esc(u.nome) + (u.cidade ? ' · ' + esc(u.cidade) : '') + '</option>').join('') + '</select>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn-action btn-reserve" id="lts-' + id + '">Concluir e validar ponto</button><button type="button" class="btn-action" id="ltc-' + id + '" style="background:transparent;color:var(--text-dark,#2d3748);border:1px solid var(--border-color,#e2e8f0)">Cancelar</button></div><div class="lt-msg" id="ltm-' + id + '" role="status"></div>';
    document.getElementById('lt1-' + id).focus();
    document.getElementById('ltc-' + id).onclick = () => render();
    document.getElementById('lts-' + id).onclick = () => {
      const r = cieeSelos.concluirLeitura(id, { reflexao: document.getElementById('lt1-' + id).value, opiniao: document.getElementById('lt2-' + id).value, indicarPara: document.getElementById('lt3-' + id).value });
      if (!r.ok) { const m = document.getElementById('ltm-' + id); m.textContent = r.motivo; m.className = 'lt-msg erro'; return; }
      render(r.ponto ? 'Leitura concluída! Você ganhou 1 ponto. Agora são ' + r.pontos + (r.pontos === 1 ? ' ponto.' : ' pontos.') : 'Leitura concluída! Este livro já tinha sido contado antes, então não gera novo ponto.');
      if (window.applyFilters) try { applyFilters(); } catch (e) {}
    };
  }

  /* opiniões dos leitores, nos cartões do acervo físico */
  function botaoOpinioes(codigo, titulo) {
    if (!window.cieeSelos) return ''; const n = cieeSelos.opinioes(codigo, titulo).length;
    return n ? '<button type="button" class="btn-op" onclick="event.stopPropagation(); cieeLeituras.verOpinioes(\'' + esc(codigo) + '\', this)">' + n + (n === 1 ? ' opinião de leitor' : ' opiniões de leitores') + '</button>' : '';
  }
  function verOpinioes(codigo, el) {
    const card = el && el.closest('.book-card'), titulo = card ? (card.querySelector('.book-title') || {}).textContent : '';
    const ops = cieeSelos.opinioes(codigo, titulo);
    let m = document.getElementById('lt-modal');
    if (!m) { m = document.createElement('div'); m.id = 'lt-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on'); }); }
    m.innerHTML = '<div class="lt-caixa"><h3>Opiniões de leitores' + (titulo ? ' · ' + esc(titulo) : '') + '</h3>' + ops.map(o => '<div class="lt-item"><b>' + esc(o.nome) + '</b><small>' + dataBR(o.data) + '</small><p style="margin:6px 0 0;white-space:pre-wrap">' + esc(o.opiniao) + '</p></div>').join('') + '<button type="button" class="btn-action" id="lt-fechar" style="width:100%;margin-top:6px">Fechar</button></div>';
    m.classList.add('on'); const f = document.getElementById('lt-fechar'); f.onclick = () => m.classList.remove('on'); f.focus();
  }
  document.addEventListener('keydown', e => { const m = document.getElementById('lt-modal'); if (e.key === 'Escape' && m && m.classList.contains('on')) { e.preventDefault(); m.classList.remove('on'); } });

  /* lembrete: livros esperando reflexão (uma vez por sessão) */
  function lembrete() {
    try { if (sessionStorage.getItem('ciee_lt_aviso')) return; } catch (e) {}
    const n = window.cieeSelos ? cieeSelos.pendentes(k()).length : 0; if (!n) return;
    try { sessionStorage.setItem('ciee_lt_aviso', '1'); } catch (e) {}
    const a = document.createElement('div'); a.id = 'lt-aviso'; a.setAttribute('role', 'status');
    a.innerHTML = '<span>' + (n === 1 ? 'Você tem 1 livro devolvido esperando sua reflexão.' : 'Você tem ' + n + ' livros devolvidos esperando sua reflexão.') + '</span><button type="button" class="btn-action btn-reserve">Concluir</button>';
    document.body.appendChild(a); requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add('on')));
    a.querySelector('button').onclick = () => { a.remove(); if (window.switchTab) switchTab('leituras'); };
    setTimeout(() => { a.classList.remove('on'); setTimeout(() => a.remove(), 600); }, 9000);
  }

  window.cieeLeituras = { render, botaoOpinioes, verOpinioes };
  const go = () => { render(); if (window.applyFilters) try { applyFilters(); } catch (e) {} setTimeout(lembrete, 1500); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
