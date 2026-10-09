/* CIEESC PLAY — consentimento de cookies e armazenamento local (LGPD)
   Categorias: essenciais (sempre), preferências (tema, cores, acessibilidade) e estatísticas (contadores e IP).
   Sem consentimento, as preferências valem só durante a sessão (não ficam gravadas no aparelho). */
(function () {
  const K = 'ciee_consent', VERSAO = 1;
  const PREF = ['ciee_theme', 'ciee_color_theme', 'ciee_theme_color', 'ciee_acess', 'ciee_cal_zoom'];
  const rawGet = Storage.prototype.getItem, rawSet = Storage.prototype.setItem, rawRem = Storage.prototype.removeItem;
  const ler = () => { try { const v = JSON.parse(rawGet.call(localStorage, K)); return v && v.v === VERSAO ? v : null; } catch (e) { return null; } };
  const pode = cat => cat === 'essenciais' ? true : !!(ler() && ler()[cat]);

  // Preferências só persistem com consentimento; sem ele ficam na sessão
  Storage.prototype.setItem = function (k, v) {
    if (this === localStorage && PREF.includes(k) && !pode('preferencias')) { try { sessionStorage.setItem(k, v); } catch (e) {} return; }
    return rawSet.call(this, k, v);
  };
  Storage.prototype.getItem = function (k) {
    if (this === localStorage && PREF.includes(k) && !pode('preferencias')) { const s = sessionStorage.getItem(k); if (s !== null) return s; }
    return rawGet.call(this, k);
  };

  function salvar(c) {
    const reg = { v: VERSAO, essenciais: true, preferencias: !!c.preferencias, estatisticas: !!c.estatisticas, quando: new Date().toISOString() };
    rawSet.call(localStorage, K, JSON.stringify(reg));
    PREF.forEach(k => {
      const atual = rawGet.call(localStorage, k), sess = sessionStorage.getItem(k);
      if (reg.preferencias) { if (sess !== null) rawSet.call(localStorage, k, sess); }
      else { if (atual !== null && sess === null) { try { sessionStorage.setItem(k, atual); } catch (e) {} } rawRem.call(localStorage, k); }
    });
    document.dispatchEvent(new CustomEvent('ciee-consent', { detail: reg }));
  }

  const css = document.createElement('style');
  css.textContent = `
  #ck-banner{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9990;width:min(96vw,720px);box-sizing:border-box;background:#fff;color:#2d3748;border:2px solid #e2e8f0;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.35);padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));font:600 .95rem/1.45 Nunito,system-ui,sans-serif}
  #ck-banner h3{margin:0 0 4px;font:700 1.1rem Fredoka,Nunito,sans-serif;color:var(--theme-primary,#0056b3)}
  #ck-banner p{margin:0 0 10px}#ck-banner a{color:var(--theme-primary,#0056b3);font-weight:800}
  .ck-row{display:flex;gap:8px;flex-wrap:wrap}
  .ck-btn{flex:1 1 140px;border:2px solid var(--theme-primary,#0056b3);background:#fff;color:var(--theme-primary,#0056b3);border-radius:12px;padding:10px 12px;font:800 .9rem Nunito,system-ui,sans-serif;cursor:pointer}
  .ck-btn.p{background:var(--theme-primary,#0056b3);color:#fff}
  #ck-modal{position:fixed;inset:0;z-index:9995;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:14px}
  #ck-modal .box{background:#fff;color:#2d3748;width:min(96vw,520px);max-height:92vh;overflow:auto;border-radius:20px;padding:18px;font:600 .95rem/1.45 Nunito,system-ui,sans-serif}
  #ck-modal h3{margin:0 0 10px;font:700 1.25rem Fredoka,Nunito,sans-serif;color:var(--theme-primary,#0056b3)}
  .ck-cat{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid #e2e8f0}
  .ck-cat b{display:block;font-weight:900}.ck-cat small{display:block;color:#718096;font-weight:600}
  .ck-cat input{width:22px;height:22px;margin-top:2px;accent-color:var(--theme-primary,#0056b3);flex:0 0 auto}`;
  document.head.appendChild(css);

  function fechar(id) { const e = document.getElementById(id); if (e) e.remove(); }

  function painel() {
    fechar('ck-modal');
    const c = ler() || {};
    const m = document.createElement('div'); m.id = 'ck-modal'; m.setAttribute('data-sem-enter', ''); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="box"><h3>Preferências de cookies</h3>
      <p style="margin:0 0 8px">Escolha o que podemos guardar no seu aparelho. Detalhes na <a href="politica-de-privacidade.html" style="color:var(--theme-primary,#0056b3);font-weight:800">Política de Privacidade</a>.</p>
      <label class="ck-cat"><input type="checkbox" checked disabled><span><b>Essenciais (sempre ativos)</b><small>Manter você conectado, segurança, validação de acesso e registro deste consentimento.</small></span></label>
      <label class="ck-cat"><input type="checkbox" id="ck-pref" ${c.preferencias ? 'checked' : ''}><span><b>Preferências</b><small>Tema claro/escuro, cor escolhida, tamanho da fonte e opções de acessibilidade.</small></span></label>
      <label class="ck-cat"><input type="checkbox" id="ck-est" ${c.estatisticas ? 'checked' : ''}><span><b>Estatísticas de uso</b><small>Contador de visitas, usuários conectados e endereço IP, usados para melhorar o portal e para segurança.</small></span></label>
      <div class="ck-row" style="margin-top:12px"><button type="button" class="ck-btn" id="ck-salvar">Salvar escolhas</button><button type="button" class="ck-btn p" id="ck-todos">Aceitar todos</button></div></div>`;
    document.body.appendChild(m);
    const ok = () => { salvar({ preferencias: m.querySelector('#ck-pref').checked, estatisticas: m.querySelector('#ck-est').checked }); fechar('ck-modal'); fechar('ck-banner'); };
    m.querySelector('#ck-salvar').onclick = ok;
    m.querySelector('#ck-todos').onclick = () => { salvar({ preferencias: true, estatisticas: true }); fechar('ck-modal'); fechar('ck-banner'); };
    m.addEventListener('click', e => { if (e.target === m) fechar('ck-modal'); });
    m.querySelector('#ck-salvar').focus();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('ck-modal')) { e.preventDefault(); fechar('ck-modal'); } });

  function banner() {
    if (ler() || document.getElementById('ck-banner')) return;
    const b = document.createElement('div'); b.id = 'ck-banner'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML = `<h3>Cookies e privacidade</h3>
      <p>Usamos cookies e armazenamento no seu aparelho para manter você conectado, lembrar o tema e a acessibilidade e entender o uso do portal. Você escolhe o que aceitar. Saiba mais na <a href="politica-de-privacidade.html">Política de Privacidade</a>.</p>
      <div class="ck-row"><button type="button" class="ck-btn p" id="ck-aceitar">Aceitar todos</button><button type="button" class="ck-btn" id="ck-essenciais">Somente essenciais</button><button type="button" class="ck-btn" id="ck-personalizar">Personalizar</button></div>`;
    document.body.appendChild(b);
    b.querySelector('#ck-aceitar').onclick = () => { salvar({ preferencias: true, estatisticas: true }); fechar('ck-banner'); };
    b.querySelector('#ck-essenciais').onclick = () => { salvar({ preferencias: false, estatisticas: false }); fechar('ck-banner'); };
    b.querySelector('#ck-personalizar').onclick = painel;
  }

  window.cieeConsent = { ler, pode, abrir: painel };

  window.addEventListener('load', () => {
    // espera a tela de carregamento terminar para não aparecer por cima dela
    const t = setInterval(() => { const sp = document.getElementById('splash-screen'); if (!sp || sp.style.display === 'none') { clearInterval(t); setTimeout(banner, 500); } }, 300);
  });
})();
