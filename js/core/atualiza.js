/* CIEESC PLAY — aviso automático de atualização
   Compara a "assinatura" (ETag/Last-Modified) das páginas publicadas com a última vista neste aparelho.
   Se mudou, mostra: "CIEESC PLAY atualizado!". Não precisa editar nada a cada atualização.
   Para ver como fica: abra qualquer página com ?teste-aviso=1 no final do endereço. */
(function () {
  // A versão do app é o número do cache em sw.js (ex.: ciee-play-v38). Só muda quando uma atualização é publicada,
  // então o aviso não repete por causa de diferenças de ETag/horário entre servidores.
  const CHAVE = 'ciee_versao_vista';
  let mostrando = false, ultimaChecagem = 0;

  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };

  async function assinatura() {
    try {
      const r = await fetch('sw.js?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      const m = (await r.text()).match(/ciee-play-v(\d+)/);
      return m ? m[1] : null;
    } catch (e) { return null; }       // sem internet: não avisa nada
  }

  function aviso(novaAssinatura) {
    if (mostrando) return; mostrando = true;
    const css = getComputedStyle(document.documentElement);
    const c1 = css.getPropertyValue('--theme-primary').trim() || '#0056b3';
    const c2 = css.getPropertyValue('--theme-secondary').trim() || '#6f42c1';
    const box = document.createElement('div');
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.style.cssText = 'position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);z-index:99999;' +
      'width:min(92vw,420px);box-sizing:border-box;padding:12px 14px;border-radius:16px;color:#fff;font:700 .95rem Nunito,system-ui,sans-serif;' +
      'background:linear-gradient(135deg,' + c1 + ',' + c2 + ');box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px;' +
      'transition:transform .45s cubic-bezier(.2,.9,.3,1.2)';
    box.innerHTML = 
      '<span style="flex:1;line-height:1.25">CIEESC PLAY atualizado!<br><small style="font-weight:600;opacity:.9">Há novidades disponíveis.</small></span>' +
      '<button type="button" id="aviso-ok" style="border:none;border-radius:12px;padding:8px 12px;background:#fff;color:' + c1 + ';font:800 .85rem Nunito,system-ui,sans-serif;cursor:pointer">Atualizar</button>' +
      '<button type="button" id="aviso-x" aria-label="Fechar" style="border:none;background:transparent;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px">×</button>';
    document.body.appendChild(box);
    requestAnimationFrame(() => { box.style.transform = 'translate(-50%,0)'; });
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
    const fechar = () => { box.style.transform = 'translate(-50%,-140%)'; setTimeout(() => box.remove(), 500); mostrando = false; };
    box.querySelector('#aviso-x').onclick = () => { if (novaAssinatura) gravar(novaAssinatura); fechar(); };
    box.querySelector('#aviso-ok').onclick = async () => {
      if (novaAssinatura) gravar(novaAssinatura);
      try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) {}
      location.reload();
    };
  }

  async function verificar() {
    if (mostrando || Date.now() - ultimaChecagem < 5 * 60 * 1000) return;     // no máximo uma checagem a cada 5 minutos
    ultimaChecagem = Date.now();
    const atual = await assinatura();
    if (!atual) return;
    const vista = ler();
    if (!vista) { gravar(atual); return; }                 // primeiro acesso neste aparelho: só memoriza
    if (+atual > +vista) aviso(atual);                      // só se a versão publicada é MAIS NOVA que a última vista
    else if (+atual < +vista) gravar(atual);
  }

  window.addEventListener('load', () => {
    if (/[?&]teste-aviso=1/.test(location.search)) { setTimeout(() => aviso(null), 800); return; }
    setTimeout(verificar, 4000);
    setInterval(() => { ultimaChecagem = 0; verificar(); }, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar(); });
  });
})();
