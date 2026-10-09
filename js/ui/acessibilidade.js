/* CIEESC PLAY — acessibilidade: tamanho da fonte, alto contraste, leitura em voz alta e menos animações */
(function () {
  const KEY = 'ciee_acess';
  const BASE = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;   // tamanho-base da própria página (px)
  const ESC = [0.85, 1, 1.15, 1.3, 1.5];                        // posição 1 = 100%
  let st = { i: 1, hc: false, sa: false };
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) st = Object.assign(st, v); } catch (e) {}
  if (!(st.i >= 0 && st.i < ESC.length)) st.i = 1;
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  const css = document.createElement('style');
  css.textContent = `
  #acb-btn{position:fixed;left:10px;bottom:calc(var(--acb-b,12px) + env(safe-area-inset-bottom,0px));z-index:9980;width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:#ea680c!important;color:#fff!important;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.9;box-shadow:0 4px 14px rgba(0,0,0,.3);padding:0;transition:opacity .2s,transform .2s}
  #acb-btn:hover,#acb-btn:focus-visible{opacity:1;transform:scale(1.08)}#acb-btn svg{width:22px;height:22px}
  #acb-panel{position:fixed;left:10px;bottom:calc(var(--acb-b,12px) + 52px + env(safe-area-inset-bottom,0px));max-height:calc(100vh - 90px);overflow:auto;z-index:9985;width:min(94vw,400px);box-sizing:border-box;background:#fff;color:#2d3748;border:2px solid #e2e8f0;border-radius:20px;box-shadow:0 16px 44px rgba(0,0,0,.4);padding:14px 14px 12px;font:700 .95rem/1.3 Nunito,system-ui,sans-serif}
  #acb-panel[hidden]{display:none}
  .acb-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
  .acb-title{display:flex;align-items:center;gap:8px;font:700 1.15rem Fredoka,Nunito,sans-serif;color:var(--theme-primary,#0056b3)}.acb-title svg{width:22px;height:22px;color:#ea680c}
  .acb-link{border:0;background:none;color:var(--theme-primary,#0056b3);font:800 .85rem Nunito,system-ui,sans-serif;text-decoration:underline;cursor:pointer;padding:4px}
  .acb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  .acb-grid button,.acb-extra button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:72px;background:#f7f4f1;border:2px solid #ece6e1;border-radius:14px;color:#2d3748;font:800 .78rem Nunito,system-ui,sans-serif;cursor:pointer;padding:6px 2px}
  .acb-grid button b{font:800 1.35rem Nunito,system-ui,sans-serif;line-height:1}.acb-grid svg{width:26px;height:26px}
  .acb-grid button[aria-pressed="true"],.acb-extra button[aria-pressed="true"]{background:color-mix(in srgb,var(--theme-primary,#0056b3) 18%,#fff);border-color:var(--theme-primary,#0056b3)}
  .acb-extra{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}.acb-extra[hidden]{display:none}
  .acb-extra button{min-height:48px;flex-direction:row;gap:8px;font-size:.85rem}
  .acb-foot{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;font-size:.8rem}.acb-foot a,.acb-foot button{color:var(--theme-primary,#0056b3);font:800 .8rem Nunito,system-ui,sans-serif;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
  @media (max-width:820px){html.acb-barra{--acb-b:78px}}
  body.m-sheet-open #acb-btn,body.m-sheet-open #acb-panel{display:none}
  /* alto contraste */
  html.acb-hc,html.acb-hc body{background:#000!important;color:#fff!important;animation:none!important}
  html.acb-hc *{color:#fff!important;border-color:#fff!important;text-shadow:none!important;box-shadow:none!important;background-image:none!important}
  html.acb-hc :where(*:not(button):not(input):not(select):not(textarea):not(img):not(svg):not(path):not(circle):not(polygon)){background-color:#000!important}
  html.acb-hc button *,html.acb-hc [role="button"] *,html.acb-hc input[type="button"] *{background-color:transparent!important}
  html.acb-hc a{color:#7ee0ff!important;text-decoration:underline!important}
  html.acb-hc button,html.acb-hc .btn-choice,html.acb-hc .btn-action,html.acb-hc .ck-btn,html.acb-hc .pill-btn{background:#ffe600!important;color:#000!important;border:2px solid #fff!important}
  html.acb-hc button *{color:#000!important}
  html.acb-hc input,html.acb-hc select,html.acb-hc textarea{background:#000!important;color:#fff!important;border:2px solid #fff!important}
  html.acb-hc .hex-shape,html.acb-hc .sh,html.acb-hc svg.hex{display:none!important}
  html.acb-hc #acb-btn{background:#ffe600!important;color:#000!important}html.acb-hc #acb-btn svg{stroke:#000}
  html.acb-hc .acb-grid button[aria-pressed="true"],html.acb-hc .acb-extra button[aria-pressed="true"]{outline:3px solid #7ee0ff}
  /* menos animações */
  html.acb-sa *,html.acb-sa *::before,html.acb-sa *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important;scroll-behavior:auto!important}`;
  document.head.appendChild(css);

  const root = document.documentElement;
  function aplicar() {
    root.style.fontSize = (BASE * ESC[st.i]) + 'px';
    root.classList.toggle('acb-hc', !!st.hc);
    root.classList.toggle('acb-sa', !!st.sa);
    const pct = document.getElementById('acb-pct'); if (pct) pct.textContent = Math.round(ESC[st.i] * 100) + '%';
    const set = (id, on) => { const e = document.getElementById(id); if (e) e.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    set('acb-hc', st.hc); set('acb-sa', st.sa);
    const mn = document.getElementById('acb-menos'), mx = document.getElementById('acb-mais');
    if (mn) mn.disabled = st.i === 0; if (mx) mx.disabled = st.i === ESC.length - 1;
  }

  // ---------- leitura em voz alta ----------
  const voz = 'speechSynthesis' in window;
  function textoVisivel() {
    const sel = String(window.getSelection ? window.getSelection() : '').trim(); if (sel) return sel;
    const modal = document.querySelector('#recover-modal.open, .rv-overlay.open, #ck-modal .box, #ck-banner'); if (modal) return modal.innerText;
    const sc = document.getElementById('scene');
    if (sc) { const lado = sc.dataset.side, f = document.querySelector(lado === 'login' ? '.card-left' : lado === 'register' ? '.card-right' : '.card-front'); if (f) return f.innerText; }
    const main = document.querySelector('main') || document.body; return main.innerText.slice(0, 4000);
  }
  function ler() {
    if (!voz) { alert('Este navegador não oferece leitura em voz alta.'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(textoVisivel().replace(/\s+/g, ' ').trim());
    u.lang = 'pt-BR'; u.rate = 1;
    const v = speechSynthesis.getVoices().find(x => /pt[-_]BR/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  const parar = () => { if (voz) speechSynthesis.cancel(); };

  // ---------- interface ----------
  const ICO_PESSOA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5c4.7 1.3 9.3 1.3 14 0"/><path d="M12 9v4.5"/><path d="M8.5 20.5 12 13.5l3.5 7"/></svg>';
  const btn = document.createElement('button');
  btn.id = 'acb-btn'; btn.type = 'button'; btn.title = 'Acessibilidade'; btn.setAttribute('aria-label', 'Abrir opções de acessibilidade'); btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = ICO_PESSOA;
  const pan = document.createElement('div');
  pan.id = 'acb-panel'; pan.hidden = true; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Acessibilidade');
  pan.innerHTML = `
    <div class="acb-head"><span class="acb-title">${ICO_PESSOA}Acessibilidade</span><button type="button" class="acb-link" id="acb-more" aria-expanded="false">Ver recursos</button></div>
    <div class="acb-grid">
      <button type="button" id="acb-hc" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg><span>Alto contraste</span></button>
      <button type="button" id="acb-menos"><b>A-</b><span>Menor</span></button>
      <button type="button" id="acb-reset"><b>A</b><span id="acb-pct">100%</span></button>
      <button type="button" id="acb-mais"><b>A+</b><span>Maior</span></button>
    </div>
    <div class="acb-extra" id="acb-extra" hidden>
      <button type="button" id="acb-ler">Ler a tela em voz alta</button>
      <button type="button" id="acb-parar">Parar leitura</button>
      <button type="button" id="acb-sa" aria-pressed="false">Reduzir animações</button>
      <button type="button" id="acb-zerar">Restaurar tudo</button>
    </div>
    <div class="acb-foot"><a href="politica-de-privacidade.html">Política de Privacidade</a><button type="button" id="acb-ck">Preferências de cookies</button></div>`;

  function abrir(v) { pan.hidden = !v; const ck = pan.querySelector('#acb-ck'); if (ck) ck.hidden = !window.cieeConsent; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); if (v) pan.querySelector('#acb-reset').focus(); }
  function montar() {
    if (document.getElementById('m-tabbar')) document.documentElement.classList.add('acb-barra');
    document.body.appendChild(btn); document.body.appendChild(pan);
    btn.onclick = () => abrir(pan.hidden);
    const $ = id => pan.querySelector('#' + id);
    $('acb-hc').onclick = () => { st.hc = !st.hc; salvar(); aplicar(); };
    $('acb-menos').onclick = () => { st.i = Math.max(0, st.i - 1); salvar(); aplicar(); };
    $('acb-mais').onclick = () => { st.i = Math.min(ESC.length - 1, st.i + 1); salvar(); aplicar(); };
    $('acb-reset').onclick = () => { st.i = 1; salvar(); aplicar(); };
    $('acb-sa').onclick = () => { st.sa = !st.sa; salvar(); aplicar(); };
    $('acb-zerar').onclick = () => { st = { i: 1, hc: false, sa: false }; parar(); salvar(); aplicar(); };
    $('acb-ler').onclick = ler; $('acb-parar').onclick = parar;
    $('acb-more').onclick = () => { const ex = $('acb-extra'); ex.hidden = !ex.hidden; $('acb-more').setAttribute('aria-expanded', ex.hidden ? 'false' : 'true'); };
    $('acb-ck').onclick = () => { abrir(false); if (window.cieeConsent) window.cieeConsent.abrir(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pan.hidden) { e.preventDefault(); abrir(false); btn.focus(); } });
    document.addEventListener('click', e => { if (!pan.hidden && !pan.contains(e.target) && !btn.contains(e.target)) abrir(false); });
    aplicar();
  }
  aplicar();                                                  // aplica na hora (fonte/contraste) antes do resto carregar
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
  document.addEventListener('ciee-consent', () => salvar());   // ao aceitar cookies, grava as escolhas já feitas
})();
