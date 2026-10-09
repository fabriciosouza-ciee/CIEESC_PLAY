/* CIEESC PLAY — moderação: "chutar" (desconectar) e banir por IP
   O painel admin (nível 5) grava a ordem em ciee_kicks / ciee_bans; cada página confere e executa.
   ATENÇÃO: os dados ficam no localStorage do navegador. Sem servidor, a ordem só alcança quem usa
   o MESMO navegador/domínio em que ela foi dada. Para valer em todos os aparelhos é preciso um backend. */
(function () {
  const pagina = location.pathname.split('/').pop() || 'index.html';
  const protegida = /(playing|admin)\.html$/.test(pagina);
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const chaveDe = s => String(s.email || s.nome || 'anon').toLowerCase();
  const limparSessao = () => { try { localStorage.removeItem('ciee_session'); sessionStorage.removeItem('ciee_session'); } catch (e) {} };
  const ipValido = ip => typeof ip === 'string' && /^[0-9a-f:.]{3,45}$/i.test(ip) && /[.:]/.test(ip);
  let mostrando = false;

  // ---------- tela de aviso (fundo com degradê animado e hexágonos, igual às telas de saída) ----------
  function tela(tipo, motivo) {
    if (mostrando) return; mostrando = true;
    const ban = tipo === 'ban';
    const st = document.createElement('style');
    st.textContent = '@keyframes cmGrad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}@keyframes cmFlut{from{transform:translateY(0) rotate(0)}to{transform:translateY(-20px) rotate(5deg)}}';
    document.head.appendChild(st);
    const hex = (css) => '<svg viewBox="0 0 100 86.6" style="position:absolute;opacity:.45;animation:cmFlut 12s ease-in-out infinite alternate;' + css + '"><polygon points="25,2 75,2 98,43.3 75,84.6 25,84.6 2,43.3" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.6)" stroke-width="3.5"/></svg>';
    const box = document.createElement('div');
    box.setAttribute('role', 'alertdialog');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;overflow:hidden;' +
      'background:linear-gradient(135deg,#0056b3,#6f42c1,#00b4d8);background-size:400% 400%;animation:cmGrad 15s ease infinite;font-family:Nunito,system-ui,sans-serif;color:#fff;text-align:center';
    box.innerHTML = hex('width:120px;top:8%;left:4%') + hex('width:140px;top:12%;right:5%') + hex('width:90px;bottom:10%;left:5%') + hex('width:120px;bottom:12%;right:6%') +
      '<div style="position:relative;z-index:2;max-width:480px;width:100%;background:rgba(15,23,42,.55);border:2px solid rgba(255,255,255,.35);border-radius:24px;padding:26px 22px;backdrop-filter:blur(6px)">' +
      '<div style="line-height:0">' + (ban ? '<svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="18"/><path d="M11.3 11.3l25.4 25.4"/></svg>' : '<svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 8H10v32h10"/><path d="M30 15l9 9-9 9M39 24H19"/></svg>') + '</div>' +
      '<h2 style="font-family:Fredoka,Nunito,sans-serif;font-size:1.6rem;margin:10px 0 6px">' + (ban ? 'Acesso bloqueado' : 'Você foi desconectado') + '</h2>' +
      '<p style="margin:0 0 12px;opacity:.9">' + (ban ? 'O acesso a partir deste endereço foi bloqueado por um administrador.' : 'Um administrador encerrou a sua sessão.') + '</p>' +
      '<div style="text-align:left;background:rgba(255,255,255,.14);border-radius:14px;padding:12px 14px"><small style="font-weight:800;text-transform:uppercase;letter-spacing:.5px;opacity:.85">Motivo</small><div id="cm-motivo" style="font-weight:700;margin-top:4px;white-space:pre-line;word-break:break-word"></div></div>' +
      '<p style="margin:12px 0 0;font-size:.85rem;opacity:.85">Se acha que foi um engano, fale com um orientador.</p>' +
      (ban && !protegida ? '' : '<button type="button" id="cm-ok" style="margin-top:16px;border:none;border-radius:14px;padding:12px 28px;background:#fff;color:#0056b3;font:800 1rem Nunito,system-ui,sans-serif;cursor:pointer">OK</button>') +
      '</div>';
    document.body.appendChild(box);
    box.querySelector('#cm-motivo').textContent = motivo || 'Não informado.';
    document.documentElement.style.overflow = 'hidden';
    const ok = box.querySelector('#cm-ok');
    const sair = () => { location.href = 'index.html'; };
    if (ok) { ok.onclick = sair; ok.focus(); document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); sair(); } }); }
  }

  // ---------- IP deste aparelho ----------
  function meuIp() {
    return new Promise(res => {
      let c = ''; try { c = sessionStorage.getItem('ciee_ip') || ''; } catch (e) {}
      if (ipValido(c)) return res(c);
      fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => { try { sessionStorage.setItem('ciee_ip', d.ip); } catch (e) {} res(d.ip || ''); }).catch(() => res(''));
    });
  }

  // ---------- banimento por IP (todas as páginas; administradores nível 5 nunca são bloqueados) ----------
  async function verificarBan() {
    const bans = get('ciee_bans', []); if (!bans.length) return;
    const s = sessao(); if (s && s.nivel >= 5) return;
    const ip = await meuIp(); if (!ipValido(ip)) return;
    const b = bans.find(x => x.ip === ip); if (!b) return;
    if (protegida || s) limparSessao();
    tela('ban', b.motivo);
  }

  // ---------- chutar (desconectar) ----------
  const s0 = sessao();
  const chave0 = s0 ? chaveDe(s0) : null;
  function verificarKick() {
    if (!protegida || !chave0 || mostrando || (s0 && s0.nivel >= 5)) return;
    const k = get('ciee_kicks', {})[chave0]; if (!k) return;
    if (Date.now() - k.quando > 60000) return;                                   // ordens antigas expiram em 1 minuto
    let ack = 0; try { ack = Number(sessionStorage.getItem('ciee_kick_ok') || 0); } catch (e) {}
    if (k.quando <= ack) return;
    try { sessionStorage.setItem('ciee_kick_ok', String(k.quando)); } catch (e) {}
    limparSessao();
    tela('kick', k.motivo);
  }
  window.addEventListener('load', () => {
    verificarBan();
    if (protegida && chave0) {
      verificarKick();
      setInterval(verificarKick, 4000);
      window.addEventListener('storage', e => { if (e.key === 'ciee_kicks') verificarKick(); });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificarKick(); });
    }
  });
})();
