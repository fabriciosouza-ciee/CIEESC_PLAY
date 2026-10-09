/* CIEESC PLAY — tela "Falha na conexão de rede"
   Quando o aparelho fica sem rede (ou sem internet de verdade), uma estante cobre a tela, os livros caem,
   tudo fica cinza e aparece "Verifique sua conexão com a internet!" enquanto o app tenta reconectar.
   Ao voltar a rede, os livros sobem, as cores retornam e a tela some sozinha. */
(function () {
  if (location.protocol === 'file:' || window.__cieeOffline) return;
  window.__cieeOffline = true;

  const INTERVALO_TENTATIVA = 4000;    // tentativas de reconexão enquanto a tela está aberta (ms)
  const INTERVALO_CHECAGEM = 20000;    // checagem silenciosa com a rede "normal" (ms)
  const FALHAS_PARA_CAIR = 2;          // falhas seguidas (com o aparelho dizendo que tem rede) para mostrar a tela
  const CORES = ['#d63384', '#6f42c1', '#00b4d8', '#ffd166', '#0056b3', '#ff8fab', '#7c5cff', '#2ec4b6'];
  const reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ov = null, est = null, chao = null, livros = [], anims = [];
  let off = false, tent = 0, falhas = 0, tTent = null, tCheca = null, ocupado = false;
  const sorte = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- estilos (todos com prefixo co- para não misturar com a página) ----------
  const css = document.createElement('style');
  css.textContent = `
  #ciee-off{--chao:min(5vh,38px);position:fixed;inset:0;z-index:2147483000;opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s linear .4s;overscroll-behavior:none;touch-action:none}
  #ciee-off.co-show{opacity:1;visibility:visible;transition:opacity .4s ease}
  #co-app{position:absolute;inset:0;overflow:hidden;font-family:'Nunito',system-ui,sans-serif;color:#fff;text-align:center;background:#0056b3 linear-gradient(135deg,#0056b3,#6f42c1,#00b4d8);background-size:400% 400%;animation:co-grad 15s ease infinite;display:flex;flex-direction:column;align-items:center;gap:min(1.4vh,12px);padding:calc(1.2vh + env(safe-area-inset-top,0px)) 4vw 0;transition:filter 1.6s ease}
  @keyframes co-grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  #ciee-off.co-gray #co-app{filter:grayscale(1) brightness(.88);animation-play-state:paused}
  #ciee-off.co-gray .co-hex{animation-duration:30s}
  .co-hex{position:absolute;pointer-events:none;opacity:.4;animation:co-flut 12s ease-in-out infinite alternate}
  .co-h1{width:min(14vw,150px);top:9%;left:4%}.co-h2{width:min(16vw,180px);top:14%;right:5%;animation-delay:-4s}.co-h3{width:min(9vw,100px);top:44%;left:5%;animation-delay:-7s}.co-h4{width:min(12vw,130px);top:40%;right:6%;animation-delay:-2s}
  @keyframes co-flut{from{transform:translateY(0) rotate(0)}to{transform:translateY(-20px) rotate(6deg)}}
  .co-marca{position:relative;z-index:2;font:700 clamp(.95rem,2.6vh,1.3rem) 'Fredoka',sans-serif;opacity:.95}
  .co-marca i{font-style:normal;display:inline-block;animation:co-cor 6s ease-in-out infinite}
  @keyframes co-cor{0%,100%{color:#ff7eb6}33%{color:#c9b6ff}66%{color:#8fd3ff}}
  /* grupo Wi-Fi + mensagem colado em cima da estante */
  .co-grupo{position:relative;z-index:2;margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:min(1.3vh,11px);max-width:100%}
  #co-wifi{width:min(15vw,12vh,92px);height:auto;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
  #co-wifi .arco{fill:none;stroke:#fff;stroke-width:6;stroke-linecap:round;animation:co-sinal 2.4s ease-in-out infinite}
  #co-wifi .a2{animation-delay:.2s}#co-wifi .a3{animation-delay:.4s}
  @keyframes co-sinal{0%,100%{opacity:1}50%{opacity:.45}}
  #co-wifi .corte{stroke:#ffd166;stroke-width:7;stroke-linecap:round;stroke-dasharray:70;stroke-dashoffset:70;transition:stroke-dashoffset .5s ease .5s}
  #ciee-off.co-gray #co-wifi .corte{stroke-dashoffset:0}
  #ciee-off.co-gray #co-wifi .arco{animation:none;opacity:.5}
  #ciee-off.co-gray #co-wifi{animation:co-treme .5s ease .4s 2}
  @keyframes co-treme{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  #co-msg{margin:0;font:700 clamp(1.25rem,4.2vh,2.3rem)/1.2 'Fredoka',sans-serif;max-width:min(92vw,700px);opacity:0;transform:translateY(12px);transition:opacity .6s ease,transform .6s ease}
  #co-status{display:flex;align-items:center;gap:10px;font-weight:800;font-size:clamp(.85rem,2.2vh,1.05rem);opacity:0;transition:opacity .6s ease}
  #ciee-off.co-gray #co-msg{opacity:1;transform:none;transition-delay:.9s}
  #ciee-off.co-gray #co-status{opacity:.95;transition-delay:1.3s}
  .co-spin{width:1.1em;height:1.1em;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:co-gira 1s linear infinite}
  @keyframes co-gira{to{transform:rotate(360deg)}}
  /* estante apoiada no chão */
  #co-base{position:relative;z-index:2;width:100%;display:flex;justify-content:center;padding-bottom:var(--chao);margin-top:min(.8vh,8px)}
  #co-est{position:relative;width:min(88vw,560px);height:min(38vh,330px);display:flex;flex-direction:column;border:min(1.6vh,12px) solid #4c2a85;border-bottom:0;border-radius:12px 12px 0 0;background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12);overflow:visible}
  .co-prat{flex:1;display:flex;align-items:flex-end;gap:3px;padding:0 8px;border-bottom:min(1.2vh,9px) solid #6b43b0;min-height:0}
  .co-prat:last-child{border-bottom:0}
  .co-livro{flex:0 0 auto;border-radius:4px 4px 2px 2px;position:relative;box-shadow:inset -4px 0 0 rgba(0,0,0,.2),inset 0 7px 0 rgba(255,255,255,.2);will-change:transform;z-index:3}
  .co-livro::after{content:"";position:absolute;left:18%;right:18%;top:20%;height:3px;border-radius:2px;background:rgba(255,255,255,.75);box-shadow:0 8px 0 rgba(255,255,255,.45)}
  #co-chao{position:absolute;left:0;right:0;bottom:0;height:var(--chao);background:linear-gradient(#2a1a4a,#1d1233);border-top:3px solid rgba(255,255,255,.18);z-index:1}
  @media (prefers-reduced-motion:reduce){#co-app *{animation-duration:.001s!important}}`;
  document.head.appendChild(css);

  const hex = n => '<svg class="co-hex co-h' + n + '" viewBox="0 0 100 86.6" aria-hidden="true"><polygon points="25,2 75,2 98,43.3 75,84.6 25,84.6 2,43.3" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="3.5"/></svg>';

  function criar() {
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'ciee-off';
    ov.innerHTML = '<div id="co-app">' + hex(1) + hex(2) + hex(3) + hex(4) +
      '<div class="co-marca">CIEESC <i>▶︎</i> PLAY</div>' +
      '<div class="co-grupo">' +
        '<svg id="co-wifi" viewBox="0 0 100 80" aria-hidden="true"><path class="arco a1" d="M12 30q38-32 76 0"/><path class="arco a2" d="M27 45q23-19 46 0"/><path class="arco a3" d="M40 59q10-8 20 0"/><circle cx="50" cy="70" r="6" fill="#fff"/><line class="corte" x1="16" y1="10" x2="84" y2="76"/></svg>' +
        '<h1 id="co-msg" role="alert">Verifique sua conexão com a internet!</h1>' +
        '<div id="co-status" aria-live="polite"><span class="co-spin"></span><span id="co-tent">Tentando reconectar…</span></div>' +
      '</div>' +
      '<div id="co-base"><div id="co-est" aria-hidden="true"></div><div id="co-chao"></div></div></div>';
    document.documentElement.appendChild(ov);                  // fora do <body>, para poder "congelar" a página por baixo
    est = ov.querySelector('#co-est'); chao = ov.querySelector('#co-chao');
  }

  // 3 prateleiras cheias de livros (sorteio fixo)
  function montarLivros() {
    est.innerHTML = ''; livros = [];
    for (let r = 0; r < 3; r++) { const p = document.createElement('div'); p.className = 'co-prat'; est.appendChild(p); }
    const larg = est.clientWidth - 16 - 8; let k = 0;
    est.querySelectorAll('.co-prat').forEach((p, r) => {
      let soma = 0; const altP = p.clientHeight || 80;
      while (soma < larg - 26) {
        const w = Math.round(20 + sorte(k + r * 40) * 18), h = Math.round(altP * (.55 + sorte(k + 7 + r * 13) * .37));
        if (soma + w > larg) break;
        const l = document.createElement('div'); l.className = 'co-livro';
        l.style.width = w + 'px'; l.style.height = h + 'px'; l.style.background = CORES[(k * 3 + r) % CORES.length];
        p.appendChild(l); livros.push(l); soma += w + 3; k++;
      }
    });
  }

  // ---------- mostrar: livros caem (devagar) e a tela fica cinza ----------
  function mostrar() {
    if (off) return; off = true; tent = 0;
    criar();
    ov.querySelector('#co-tent').textContent = 'Tentando reconectar…';
    try { document.body.inert = true; } catch (e) {}
    ov.classList.remove('co-gray'); ov.classList.add('co-show');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!off) return;
      montarLivros();
      const topoChao = chao.getBoundingClientRect().top + 4;
      if (!reduz) est.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 520, delay: 500, iterations: 2 });
      anims = [];
      livros.forEach((b, i) => {
        const r = b.getBoundingClientRect(), w = r.width, h = r.height;
        const rot = (Math.random() < .5 ? -1 : 1) * (15 + Math.random() * 85), rad = Math.abs(rot) * Math.PI / 180;
        const ext = Math.abs(h * Math.cos(rad)) + Math.abs(w * Math.sin(rad));
        const dy = (topoChao - ext / 2) - (r.top + h / 2);
        const cx = r.left + w / 2; let dx = (Math.random() - .5) * Math.min(innerWidth * .8, 620);
        dx = Math.max(-cx + w, Math.min(innerWidth - cx - w, dx));
        // queda mais lenta: início depois de ~0,9 s, um livro a cada ~60 ms, cada queda leva 1,1 a 1,7 s
        const delay = reduz ? 0 : 900 + i * 60 + Math.random() * 250, dur = reduz ? 1 : 1100 + Math.random() * 600;
        anims.push(b.animate([
          { transform: 'translate(0,0) rotate(0deg)', easing: 'cubic-bezier(.35,0,.8,.55)' },
          { transform: 'translate(' + dx * .7 + 'px,' + dy + 'px) rotate(' + rot + 'deg)', offset: .78, easing: 'ease-out' },
          { transform: 'translate(' + dx * .74 + 'px,' + (dy - 14) + 'px) rotate(' + rot * 1.05 + 'deg)', offset: .88, easing: 'ease-in' },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)' }
        ], { duration: dur, delay: delay, fill: 'forwards' }));
      });
      ov.classList.add('co-gray');
    }));
    agendarTentativa();
  }

  // ---------- esconder: livros sobem, cores voltam e a tela some ----------
  function esconder() {
    if (!off) return; off = false; clearTimeout(tTent);
    const lote = anims; anims = [];
    ov.classList.remove('co-gray');
    lote.forEach((a, i) => setTimeout(() => { try { a.updatePlaybackRate(-1.2); a.play(); } catch (e) {} }, i * 16));
    const terminar = () => {
      if (off) return;                                          // caiu de novo no meio do caminho
      lote.forEach(a => { try { a.cancel(); } catch (e) {} });
      ov.classList.remove('co-show');
      try { document.body.inert = false; } catch (e) {}
    };
    let feito = false; const fim = () => { if (!feito) { feito = true; setTimeout(terminar, 500); } };
    // espera cada livro terminar de subir (a promessa "finished" é renovada quando a animação toca ao contrário)
    setTimeout(() => Promise.all(lote.map(a => a.finished.catch(() => 0))).then(fim), lote.length * 16 + 120);
    setTimeout(fim, 12000);                                     // garantia
    if (!lote.length) { try { document.body.inert = false; } catch (e) {} ov.classList.remove('co-show'); }
  }

  // ---------- detecção da rede ----------
  // HEAD não passa pelo service worker, então só dá certo se a internet estiver de fato funcionando
  function ping() {
    return new Promise(res => {
      const c = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = setTimeout(() => { if (c) c.abort(); res(false); }, 5000);
      fetch('manifest.json?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: c ? c.signal : undefined })
        .then(() => { clearTimeout(t); res(true); }).catch(() => { clearTimeout(t); res(false); });
    });
  }

  function agendarTentativa() {
    clearTimeout(tTent);
    tTent = setTimeout(async () => {
      if (!off) return;
      tent++; const el = ov.querySelector('#co-tent'); if (el) el.textContent = 'Tentando reconectar… (tentativa ' + tent + ')';
      if (await ping()) { falhas = 0; esconder(); return; }
      agendarTentativa();
    }, INTERVALO_TENTATIVA);
  }

  async function checar() {
    if (off || ocupado || document.visibilityState === 'hidden') return;
    ocupado = true;
    try {
      if (navigator.onLine === false) { mostrar(); return; }
      if (await ping()) falhas = 0; else if (++falhas >= FALHAS_PARA_CAIR) mostrar();
    } finally { ocupado = false; }
  }

  window.addEventListener('offline', mostrar);
  window.addEventListener('online', async () => { if (off && await ping()) { falhas = 0; esconder(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (navigator.onLine === false) mostrar(); else checar(); } });
  tCheca = setInterval(checar, INTERVALO_CHECAGEM);
  window.addEventListener('load', () => { if (navigator.onLine === false) mostrar(); });
  window.cieeOffline = { mostrar, esconder };                   // útil para testar: cieeOffline.mostrar() no console
})();
