/* CIEESC PLAY — níveis de acesso (carregado no <head>, antes dos demais scripts)
   1 Aprendiz · 2 Representante de Turma · 3 Monitor(a) · 4 Orientador(a) · 5 Webmaster
   Na primeira vez, converte dados salvos no modelo antigo (2 Monitor, 3 Orientador, 4 Webmaster) para o novo. */
(function () {
  window.NIVEIS = {
    APRENDIZ: 1, REPRESENTANTE: 2, MONITOR: 3, ORIENTADOR: 4, WEBMASTER: 5,
    nome: { 1: 'Aprendiz', 2: 'Representante', 3: 'Monitor', 4: 'Orientador', 5: 'Webmaster' },
    cargo: { 1: 'Jovem aprendiz CIEESC', 2: 'Representante de Turma', 3: 'Monitor(a) da Aprendizagem', 4: 'Orientador(a) de Aprendizagem', 5: 'Administrador(a)' }
  };
  // sessão expira: "manter conectado" vale 30 dias; acesso da equipe (ByPass) vale 12 horas
  try {
    [localStorage, sessionStorage].forEach(st => {
      const s = JSON.parse(st.getItem('ciee_session') || 'null'); if (!s) return;
      const EXPIRA = s.bypass ? 12 * 3600e3 : (s.manterConectado ? 30 * 864e5 : 7 * 864e5);
      if (!s.criadoEm) { s.criadoEm = Date.now(); st.setItem('ciee_session', JSON.stringify(s)); }
      else if (Date.now() - s.criadoEm > EXPIRA) st.removeItem('ciee_session');
    });
  } catch (e) {}
  const FLAG = 'ciee_niveis_v';
  try {
    if (localStorage.getItem(FLAG) === '2') return;
    const sobe = n => (n >= 2 ? n + 1 : n);                       // 2→3, 3→4, 4→5 (aprendiz fica 1)
    const rot = { 3: 'Monitor', 4: 'Orientador', 5: 'Webmaster' };
    const lerJ = (st, k) => { try { return JSON.parse(st.getItem(k)); } catch (e) { return null; } };
    const gravar = (st, k, v) => { try { st.setItem(k, JSON.stringify(v)); } catch (e) {} };

    const codigos = lerJ(localStorage, 'ciee_codigos_acesso');          // acessos ByPass
    if (Array.isArray(codigos)) {
      codigos.forEach(c => { const n = parseInt(c.nivel, 10); if (n >= 2) { const m = sobe(n); c.nivel = m + ' (' + (rot[m] || '') + ')'; } });
      gravar(localStorage, 'ciee_codigos_acesso', codigos);
    }
    [localStorage, sessionStorage].forEach(st => {                       // sessão ativa
      const s = lerJ(st, 'ciee_session'); if (s && s.nivel >= 2) { s.nivel = sobe(s.nivel); gravar(st, 'ciee_session', s); }
    });
    ['ciee_acessos_usuarios', 'ciee_presenca'].forEach(k => {            // estatísticas e conectados
      const o = lerJ(localStorage, k);
      if (o && typeof o === 'object') { Object.keys(o).forEach(i => { if (o[i] && o[i].nivel >= 2) o[i].nivel = sobe(o[i].nivel); }); gravar(localStorage, k, o); }
    });
    localStorage.setItem(FLAG, '2');
  } catch (e) {}
})();
