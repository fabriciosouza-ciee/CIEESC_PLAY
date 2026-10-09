/* CIEESC PLAY — Calendário interativo (Aprendizagem › Calendário)
   Eventos cadastrados no painel (Utilidades › Calendário, por monitores, orientadores e webmaster) + datas especiais dos temas.
   Cores seguem o tema do portal (azul/roxo/rosa, claro/escuro e temas sazonais). */
(function () {
  const lerJ = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const COR = { 'Oficina Presencial': 'var(--theme-primary)', 'Oficina Online': 'var(--theme-secondary)', 'Atividade': '#0e7490', 'Prova / Avaliação': '#dc2626', 'Feriado': '#64748b', 'Evento': '#15803d', 'Outro': '#7e22ce', 'Data especial': '#b45309' };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let ano = hoje.getFullYear(), mes = hoje.getMonth(), sel = ymd(hoje), todasCidades = false, modo = 'mes';   // modo: 'mes' (perto) ou 'ano' (longe)

  const css = document.createElement('style');
  css.textContent = `.cal{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}
  @media (max-width:980px){.cal{grid-template-columns:1fr}}
  @media (max-width:820px){.cal{margin:0 var(--gut,18px)}}
  .cal-card{background:var(--bg-card,#fff);border:1px solid var(--border-color,#e2e8f0);border-radius:18px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.05)}
  .cal-topo{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  .cal-topo h3{margin:0 auto 0 4px;font:700 1.25rem 'Fredoka',cursive;color:var(--text-dark,#2d3748);order:0}
  .cal-nav{display:flex;gap:6px}
  .cal-btn{border:1px solid var(--border-color,#e2e8f0);background:transparent;color:var(--text-dark,#2d3748);border-radius:999px;min-width:38px;height:38px;padding:0 12px;font:800 .9rem 'Nunito',sans-serif;cursor:pointer}
  .cal-btn:hover{border-color:var(--theme-primary);color:var(--theme-primary)}
  .cal-filtro{display:flex;align-items:center;gap:6px;font:700 .8rem 'Nunito',sans-serif;color:var(--text-muted,#718096);width:100%}
  .cal-sem,.cal-grade{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
  .cal-sem div{text-align:center;font:800 .72rem 'Nunito',sans-serif;letter-spacing:.6px;text-transform:uppercase;color:var(--text-muted,#718096);padding:4px 0}
  .cal-dia{position:relative;min-height:92px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px;background:transparent;padding:6px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:3px;color:var(--text-dark,#2d3748);font:inherit}
  .cal-dia:hover{border-color:var(--theme-primary)}
  .cal-dia.fora{opacity:.72}
  .cal-dia .n{font:700 .9rem 'Fredoka',cursive}
  .cal-dia.hoje .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--theme-primary);color:#fff}
  .cal-dia.sel{box-shadow:0 0 0 2px var(--theme-primary) inset;background:color-mix(in srgb,var(--theme-primary) 8%,transparent)}
  .cal-chip{display:block;font:800 .68rem/1.25 'Nunito',sans-serif;color:#fff;border-radius:6px;padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-mais{font:800 .68rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .cal-pontos{display:none;gap:3px;flex-wrap:wrap}
  .cal-pontos i{width:7px;height:7px;border-radius:50%;display:block}
  @media (max-width:640px){.cal-dia{min-height:54px;padding:5px 4px;align-items:center}.cal-chip,.cal-mais{display:none}.cal-pontos{display:flex;justify-content:center}.cal-sem div{font-size:.65rem;letter-spacing:0}}
  .cal-lista h4{margin:0 0 10px;font:700 1.05rem 'Fredoka',cursive;color:var(--text-dark,#2d3748)}
  .cal-ev{border-left:5px solid var(--c);border-radius:10px;background:color-mix(in srgb,var(--c) 9%,transparent);padding:10px 12px;margin-bottom:8px}
  .cal-ev b{display:block;font:700 1rem 'Fredoka',cursive;color:var(--text-dark,#2d3748)}
  .cal-ev small{display:block;font:700 .78rem 'Nunito',sans-serif;color:var(--text-muted,#718096);margin-top:2px}
  .cal-ev p{margin:6px 0 0;font:700 .85rem/1.4 'Nunito',sans-serif;color:var(--text-dark,#2d3748)}
  .cal-tag{display:inline-block;font:800 .68rem 'Nunito',sans-serif;color:#fff;background:var(--c);border-radius:999px;padding:2px 8px;margin-bottom:4px}
  .cal-vazio{border:2px dashed var(--border-color,#cbd5e0);border-radius:12px;padding:12px;font-weight:700;color:var(--text-muted,#718096)}
  .cal-leg{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:12px;font:700 .75rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .cal-leg span{display:flex;align-items:center;gap:5px}.cal-leg i{width:10px;height:10px;border-radius:3px;display:block}`;
  document.head.appendChild(css);

  // eventos do painel + datas especiais (temas), com eventos de vários dias espalhados nos dias
  function eventosDoMes(a, m) {
    const s = sessao() || {}, cidade = s.cidade || '', ini = new Date(a, m, 1), fim = new Date(a, m + 1, 0), out = {};
    const add = (dia, ev) => { (out[dia] = out[dia] || []).push(ev); };
    (lerJ('ciee_calendario', []) || []).forEach(e => {
      if (!e.data) return;
      if (!todasCidades && e.cidade && e.cidade !== 'Todas' && cidade && e.cidade !== cidade) return;
      const d0 = new Date(e.data + 'T00:00:00'), d1 = new Date((e.dataFim && e.dataFim >= e.data ? e.dataFim : e.data) + 'T00:00:00');
      for (let d = new Date(Math.max(d0, ini)); d <= d1 && d <= fim; d.setDate(d.getDate() + 1)) add(ymd(d), e);
    });
    if (window.cieeTemas) cieeTemas.ORDEM.forEach(id => {
      const t = cieeTemas.TEMAS[id], cfg = cieeTemas.cfg(); if (cfg.ativos && cfg.ativos[id] === false) return;
      cieeTemas.ocorrencias(id, a).forEach(([i, f]) => { for (let d = new Date(i); d <= f; d.setDate(d.getDate() + 1)) if (d.getMonth() === m) add(ymd(d), { titulo: t.nome, categoria: 'Data especial', especial: true, data: ymd(i), dataFim: ymd(f) }); });
    });
    Object.values(out).forEach(l => l.sort((x, y) => (x.especial - y.especial) || String(x.hi || '').localeCompare(String(y.hi || ''))));
    return out;
  }
  const cor = c => COR[c] || COR.Outro;
  const horario = e => e.especial ? 'Data especial do portal' : (e.hi ? e.hi + (e.hf ? ' às ' + e.hf : '') : 'Dia todo');


  const css2 = document.createElement('style');
  css2.textContent = `.cal-modos{display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:100%;justify-content:space-between}
  .cal-seg{display:inline-flex;border:1px solid var(--border-color,#e2e8f0);border-radius:999px;overflow:hidden}
  .cal-seg button{border:0;background:transparent;color:var(--text-dark,#2d3748);font:800 .85rem 'Nunito',sans-serif;padding:0 14px;min-height:36px;cursor:pointer}
  .cal-seg button[aria-pressed="true"]{background:var(--theme-primary);color:#fff}
  .cal-zoom{display:inline-flex;gap:6px}
  .cal-zoom button{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--border-color,#e2e8f0);background:transparent;color:var(--text-dark,#2d3748);cursor:pointer}
  .cal-zoom button:disabled{opacity:.35;cursor:default}
  .cal-zoom svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
  .cal-dica{font:700 .74rem 'Nunito',sans-serif;color:var(--text-muted,#718096);margin:6px 0 0}
  .cal-palco{touch-action:pan-y;animation:calEntra .25s ease}
  .cal-palco.longe{animation-name:calAfasta}
  @keyframes calEntra{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
  @keyframes calAfasta{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
  .cal-ano{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  @media (max-width:1180px){.cal-ano{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (max-width:760px){.cal-ano{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}
  @media (max-width:340px){.cal-ano{grid-template-columns:1fr}}
  .cal-mini{border:1px solid var(--border-color,#e2e8f0);border-radius:14px;padding:8px}
  .cal-mini.atual{border-color:var(--theme-primary);box-shadow:0 0 0 1px var(--theme-primary) inset}
  .cal-mini-tit{display:flex;justify-content:space-between;align-items:center;width:100%;border:0;background:transparent;padding:2px 2px 6px;cursor:pointer;color:var(--text-dark,#2d3748);font:700 .95rem 'Fredoka',cursive;text-align:left}
  .cal-mini-tit small{font:800 .68rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .cal-mini-g{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;text-align:center}
  .cal-mini-g span{font:800 .58rem 'Nunito',sans-serif;color:var(--text-muted,#718096)}
  .cal-mini-g button{position:relative;aspect-ratio:1;border:0;border-radius:6px;background:transparent;color:var(--text-dark,#2d3748);font:700 .7rem 'Nunito',sans-serif;cursor:pointer;padding:0}
  .cal-mini-g button:hover{background:color-mix(in srgb,var(--theme-primary) 12%,transparent)}
  .cal-mini-g button.tem{background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--text-dark,#2d3748)}
  .cal-mini-g button.tem::after{content:"";position:absolute;left:50%;bottom:1px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--c)}
  .cal-mini-g button.hoje{background:var(--theme-primary);color:#fff}
  .cal-mini-g i{display:block}
  @media (max-width:760px){.cal-mini-g button{font-size:.66rem}.cal-mini-tit{font-size:.88rem}}`;
  document.head.appendChild(css2);

  const LUPA_MENOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/></svg>';
  const LUPA_MAIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/></svg>';
  const curta = d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const quando = (e, k) => (e.dataFim && e.data && e.dataFim > e.data) ? curta(e.data) + ' a ' + curta(e.dataFim) : new Date(k + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const item = (e, k) => '<div class="cal-ev" style="--c:' + cor(e.categoria) + '"><span class="cal-tag">' + esc(e.categoria) + '</span><b>' + esc(e.titulo) + '</b><small>' + (k ? quando(e, k) + ' · ' : (e.dataFim && e.dataFim > e.data ? curta(e.data) + ' a ' + curta(e.dataFim) + ' · ' : '')) + esc(horario(e)) + (e.local ? ' · ' + esc(e.local) : '') + (e.cidade && e.cidade !== 'Todas' ? ' · ' + esc(e.cidade) : '') + '</small>' + (e.desc ? '<p>' + esc(e.desc) + '</p>' : '') + '</div>';
  function unicos(mapa, desde) {               // lista de eventos sem repetir os de vários dias
    const vistos = new Set(), out = [];
    Object.keys(mapa).filter(k => !desde || k >= desde).sort().forEach(k => mapa[k].forEach(e => { const id = e._id || (e.titulo + '|' + (e.data || k)); if (!vistos.has(id)) { vistos.add(id); out.push([e, k]); } }));
    return out;
  }

  // ---------- visão do MÊS (perto) ----------
  function telaMes() {
    const ev = eventosDoMes(ano, mes), primeiro = new Date(ano, mes, 1), inicio = new Date(ano, mes, 1 - primeiro.getDay());
    let g = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio); d.setDate(inicio.getDate() + i);
      if (i >= 35 && d.getMonth() !== mes) break;
      const k = ymd(d), l = d.getMonth() === mes ? (ev[k] || []) : [];
      const rotulo = d.getDate() + ' de ' + MES[d.getMonth()].toLowerCase() + (l.length ? ', ' + l.length + (l.length === 1 ? ' evento' : ' eventos') : '');
      g += '<button type="button" class="cal-dia' + (d.getMonth() !== mes ? ' fora' : '') + (k === ymd(hoje) ? ' hoje' : '') + (k === sel ? ' sel' : '') + '" data-d="' + k + '" aria-label="' + rotulo + '"' + (k === sel ? ' aria-pressed="true"' : '') + '><span class="n">' + d.getDate() + '</span>' +
        l.slice(0, 2).map(e => '<span class="cal-chip" style="background:' + cor(e.categoria) + '">' + esc(e.titulo) + '</span>').join('') + (l.length > 2 ? '<span class="cal-mais">+' + (l.length - 2) + '</span>' : '') +
        (l.length ? '<span class="cal-pontos">' + l.slice(0, 4).map(e => '<i style="background:' + cor(e.categoria) + '"></i>').join('') + '</span>' : '') + '</button>';
    }
    const ds = new Date(sel + 'T00:00:00'), doDia = ds.getMonth() === mes ? (ev[sel] || []) : [], prox = unicos(ev, ymd(hoje)).slice(0, 8);
    const titDia = '<h4>' + ds.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</h4>';
    const lista = doDia.length ? titDia + doDia.map(e => item(e)).join('')
      : titDia + '<div class="cal-vazio">Nenhum evento neste dia.</div>' + (prox.length ? '<h4 style="margin-top:16px">Próximos em ' + MES[mes].toLowerCase() + '</h4>' + prox.map(([e, k]) => item(e, k)).join('') : '');
    return { titulo: MES[mes] + ' ' + ano, palco: '<div class="cal-sem">' + SEM.map(x => '<div>' + x + '</div>').join('') + '</div><div class="cal-grade">' + g + '</div>', lista };
  }

  // ---------- visão do ANO (longe): 12 meses pequenos ----------
  function telaAno() {
    let h = '', todos = {};
    for (let m = 0; m < 12; m++) {
      const ev = eventosDoMes(ano, m); Object.assign(todos, ev);
      const ini = new Date(ano, m, 1), dias = new Date(ano, m + 1, 0).getDate(), n = unicos(ev).length;
      let g = SEM.map(x => '<span>' + x[0] + '</span>').join('') + '<i></i>'.repeat(ini.getDay());
      for (let d = 1; d <= dias; d++) {
        const k = ymd(new Date(ano, m, d)), l = ev[k] || [];
        g += '<button type="button" data-d="' + k + '" class="' + (l.length ? 'tem' : '') + (k === ymd(hoje) ? ' hoje' : '') + '"' + (l.length ? ' style="--c:' + cor(l[0].categoria) + '"' : '') + ' aria-label="' + d + ' de ' + MES[m].toLowerCase() + (l.length ? ', ' + l.length + (l.length === 1 ? ' evento' : ' eventos') : '') + '">' + d + '</button>';
      }
      h += '<div class="cal-mini' + (m === hoje.getMonth() && ano === hoje.getFullYear() ? ' atual' : '') + '"><button type="button" class="cal-mini-tit" data-m="' + m + '" aria-label="Abrir ' + MES[m] + '">' + MES[m] + '<small>' + (n ? n + (n === 1 ? ' evento' : ' eventos') : '') + '</small></button><div class="cal-mini-g">' + g + '</div></div>';
    }
    const desde = ano === hoje.getFullYear() ? ymd(hoje) : '', prox = unicos(todos, desde).slice(0, 10);
    const lista = '<h4>' + (desde ? 'Próximos eventos de ' + ano : 'Eventos de ' + ano) + '</h4>' + (prox.length ? prox.map(([e, k]) => item(e, k)).join('') : '<div class="cal-vazio">Nenhum evento' + (desde ? ' daqui até o fim do ano' : ' neste ano') + '.</div>');
    return { titulo: String(ano), palco: '<div class="cal-ano">' + h + '</div>', lista };
  }

  function mudarModo(novo, foco) {
    if (novo === modo) return;
    modo = novo;
    if (foco) { const d = new Date(foco + 'T00:00:00'); ano = d.getFullYear(); mes = d.getMonth(); sel = foco; }
    render(true);
  }

  function render(trocouModo) {
    const sec = document.getElementById('tab-cronograma'); if (!sec) return;
    const t = modo === 'ano' ? telaAno() : telaMes(), s = sessao() || {};
    sec.innerHTML = '<h2 class="section-title">Calendário</h2><p class="section-desc">Oficinas, atividades, avaliações, feriados e datas especiais. Veja o mês ou o ano inteiro.</p>' +
      '<div class="cal"><div class="cal-card" id="cal-card"><div class="cal-topo"><h3 aria-live="polite">' + t.titulo + '</h3><div class="cal-nav"><button type="button" class="cal-btn" data-nav="-1" aria-label="' + (modo === 'ano' ? 'Ano anterior' : 'Mês anterior') + '">‹</button><button type="button" class="cal-btn" data-nav="0">Hoje</button><button type="button" class="cal-btn" data-nav="1" aria-label="' + (modo === 'ano' ? 'Próximo ano' : 'Próximo mês') + '">›</button></div>' +
      '<div class="cal-modos"><div class="cal-seg" role="group" aria-label="Visualização"><button type="button" data-modo="mes" aria-pressed="' + (modo === 'mes') + '">Mês</button><button type="button" data-modo="ano" aria-pressed="' + (modo === 'ano') + '">Ano</button></div>' +
      '<div class="cal-zoom"><button type="button" data-zoom="-1" aria-label="Afastar: ver o ano inteiro"' + (modo === 'ano' ? ' disabled' : '') + '>' + LUPA_MENOS + '</button><button type="button" data-zoom="1" aria-label="Aproximar: ver o mês"' + (modo === 'mes' ? ' disabled' : '') + '>' + LUPA_MAIS + '</button></div></div>' +
      (s.cidade ? '<label class="cal-filtro"><input type="checkbox" id="cal-todas"' + (todasCidades ? ' checked' : '') + '> Mostrar eventos de todas as cidades (você vê os de ' + esc(s.cidade) + ' e os gerais)</label>' : '') + '</div>' +
      '<div class="cal-palco' + (trocouModo && modo === 'ano' ? ' longe' : '') + '" id="cal-palco">' + t.palco + '</div>' +
      '<div class="cal-leg">' + Object.keys(COR).map(c => '<span><i style="background:' + COR[c] + '"></i>' + c + '</span>').join('') + '</div>' +
      '<p class="cal-dica">' + (modo === 'ano' ? 'Toque em um mês ou dia para aproximar.' : 'Para ver o ano inteiro: botão “Ano”, lupa, gesto de pinça no celular ou Ctrl + rolagem no computador.') + '</p></div>' +
      '<div class="cal-card cal-lista" aria-live="polite">' + t.lista + '</div></div>';
    ligar(sec);
  }

  function ligar(sec) {
    sec.querySelectorAll('.cal-dia[data-d]').forEach(b => b.onclick = () => { sel = b.dataset.d; const d = new Date(sel + 'T00:00:00'); if (d.getMonth() !== mes) { mes = d.getMonth(); ano = d.getFullYear(); } render(); const n = document.querySelector('.cal-dia[data-d="' + sel + '"]'); if (n) n.focus(); });
    sec.querySelectorAll('.cal-mini-g button[data-d]').forEach(b => b.onclick = () => mudarModo('mes', b.dataset.d));
    sec.querySelectorAll('.cal-mini-tit').forEach(b => b.onclick = () => mudarModo('mes', ymd(new Date(ano, +b.dataset.m, 1))));
    sec.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => mudarModo(b.dataset.modo, b.dataset.modo === 'mes' ? (new Date(sel + 'T00:00:00').getFullYear() === ano ? sel : ymd(new Date(ano, 0, 1))) : null));
    sec.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => mudarModo(+b.dataset.zoom < 0 ? 'ano' : 'mes', +b.dataset.zoom > 0 ? (new Date(sel + 'T00:00:00').getFullYear() === ano ? sel : ymd(new Date(ano, 0, 1))) : null));
    sec.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      const n = +b.dataset.nav;
      if (!n) { ano = hoje.getFullYear(); mes = hoje.getMonth(); sel = ymd(hoje); }
      else if (modo === 'ano') { ano += n; }
      else { mes += n; if (mes < 0) { mes = 11; ano--; } if (mes > 11) { mes = 0; ano++; } sel = ymd(new Date(ano, mes, 1)); }
      render();
    });
    const t = document.getElementById('cal-todas'); if (t) t.onchange = () => { todasCidades = t.checked; render(); };
    // zoom por gesto: pinça (dois dedos) no celular e Ctrl + rolagem (ou pinça no touchpad) no computador
    const card = document.getElementById('cal-card'); if (!card) return;
    card.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); if (e.deltaY > 4) mudarModo('ano'); else if (e.deltaY < -4) mudarModo('mes', alvoZoom(e.target)); }, { passive: false });
    let d0 = 0;
    const dist = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
    card.addEventListener('touchstart', e => { if (e.touches.length === 2) d0 = dist(e.touches); }, { passive: true });
    card.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !d0) return; const r = dist(e.touches) / d0;
      if (r < .78) { d0 = 0; mudarModo('ano'); } else if (r > 1.28) { d0 = 0; mudarModo('mes', alvoZoom(document.elementFromPoint((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2))); }
    }, { passive: true });
    card.addEventListener('touchend', () => { d0 = 0; }, { passive: true });
  }
  // ao aproximar no ano, abre o mês que estava embaixo do gesto
  function alvoZoom(el) {
    const b = el && el.closest && (el.closest('[data-d]') || el.closest('.cal-mini'));
    if (b && b.dataset && b.dataset.d) return b.dataset.d;
    const t = b && b.querySelector && b.querySelector('[data-m]'); if (t) return ymd(new Date(ano, +t.dataset.m, 1));
    return new Date(sel + 'T00:00:00').getFullYear() === ano ? sel : ymd(new Date(ano, 0, 1));
  }

  // setas do teclado mudam o dia selecionado (visão do mês)
  document.addEventListener('keydown', e => {
    const a = document.activeElement; if (!a || !a.classList || !a.classList.contains('cal-dia')) return;
    const passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!passo) return;
    e.preventDefault(); const d = new Date(a.dataset.d + 'T00:00:00'); d.setDate(d.getDate() + passo); sel = ymd(d); if (d.getMonth() !== mes) { mes = d.getMonth(); ano = d.getFullYear(); } render();
    const n = document.querySelector('.cal-dia[data-d="' + sel + '"]'); if (n) n.focus();
  });
  window.cieeCalendario = { render, modo: () => modo, mudarModo };
  window.addEventListener('storage', e => { if (e.key === 'ciee_calendario') render(); });
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', () => render());
})();
