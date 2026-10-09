/* CIEESC PLAY — temas sazonais automáticos (por data), com controle no painel admin
   Regras: Halloween 31/10 · Consciência Negra 20/11 · Natal 24 e 25/12 · Ano Novo 31/12 e 01/01 · Dia do Leitor 07/01
           Páscoa: 3 dias antes, domingo e 1 dia depois · Jovem Aprendiz 24/04 · Educação 28/04 · Escritor 25/07
   Config (painel admin › Sistema › Temas sazonais): ciee_sistema.temas = { modo:'auto'|'desligado'|'forcar', forcar, nivel, ativos } */
(function () {
  if (window.cieeTemas) return;
  const KEY = 'ciee_sistema';
  const lerSis = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const cfg = () => Object.assign({ modo: 'auto', forcar: null, nivel: 2, ativos: {} }, lerSis().temas || {});
  const reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = (a, b) => a + Math.random() * (b - a);
  const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ORDEM = ['consciencia', 'halloween', 'natal', 'anonovo', 'leitor', 'jovem', 'educacao', 'escritor', 'pascoa'];   // prioridade se datas coincidirem

  /* ---------------- calendário ---------------- */
  function pascoa(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mes - 1, dia); }
  const ymd = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  function ocorrencias(id, y) {
    const D = (m, d) => new Date(y, m - 1, d);
    switch (id) {
      case 'halloween': return [[D(10, 31), D(10, 31)]];
      case 'consciencia': return [[D(11, 20), D(11, 20)]];
      case 'natal': return [[D(12, 24), D(12, 25)]];
      case 'anonovo': return [[D(12, 31), D(12, 31)], [D(1, 1), D(1, 1)]];
      case 'leitor': return [[D(1, 7), D(1, 7)]];
      case 'pascoa': { const p = pascoa(y); return [[new Date(y, p.getMonth(), p.getDate() - 3), new Date(y, p.getMonth(), p.getDate() + 1)]]; }
      case 'jovem': return [[D(4, 24), D(4, 24)]];
      case 'educacao': return [[D(4, 28), D(4, 28)]];
      case 'escritor': return [[D(7, 25), D(7, 25)]];
    }
    return [];
  }
  function ativosPorData(d) { const h = ymd(d), y = d.getFullYear(); return ORDEM.filter(id => ocorrencias(id, y).some(([a, b]) => h >= ymd(a) && h <= ymd(b))); }
  const anoDoSelo = (id, d) => (id === 'anonovo' && d.getMonth() === 11) ? d.getFullYear() + 1 : d.getFullYear();
  function proxima(id, hoje) { const h = ymd(hoje), y = hoje.getFullYear(); let m = null; for (let a = y - 1; a <= y + 1; a++) ocorrencias(id, a).forEach(([i, f]) => { if (ymd(f) >= h && (!m || ymd(i) < ymd(m[0]))) m = [i, f]; }); return m; }
  const fmt = d => d.getDate() + ' de ' + MES[d.getMonth()];
  function descPeriodo(par) { const [i, f] = par; if (ymd(i) === ymd(f)) return fmt(i); return i.getMonth() === f.getMonth() ? i.getDate() + ' a ' + f.getDate() + ' de ' + MES[f.getMonth()] : fmt(i) + ' a ' + fmt(f); }

  /* ---------------- desenhos reutilizados ---------------- */
  const BAT = '<svg viewBox="0 0 64 32"><g fill="#14091f"><path d="M32 16C24 4 10 6 2 14c6-2 10 2 12 6 4-4 10-2 14 2 2-2 3-4 4-6z"/><path transform="matrix(-1 0 0 1 64 0)" d="M32 16C24 4 10 6 2 14c6-2 10 2 12 6 4-4 10-2 14 2 2-2 3-4 4-6z"/><ellipse cx="32" cy="19" rx="5" ry="7"/><circle cx="32" cy="12" r="4.2"/><path d="M28.5 10 27 4l4 3zM35.5 10 37 4l-4 3z"/></g><circle cx="30.4" cy="12" r="1" fill="#ff7a00"/><circle cx="33.6" cy="12" r="1" fill="#ff7a00"/></svg>';
  const GHOST = '<svg viewBox="0 0 80 100"><path d="M10 92V40C10 16 28 5 40 5s30 11 30 35v52l-10-10-10 10-10-10-10 10-10-10z" fill="#fff" fill-opacity=".9"/><ellipse cx="30" cy="40" rx="5" ry="8" fill="#1a0b2e"/><ellipse cx="50" cy="40" rx="5" ry="8" fill="#1a0b2e"/><ellipse cx="40" cy="60" rx="6" ry="8" fill="#1a0b2e"/></svg>';
  const ADK = ['<svg viewBox="0 0 100 100"><path d="M50 88C20 64 8 46 8 31 8 17 19 9 31 9c8 0 15 4 19 11 4-7 11-11 19-11 12 0 23 8 23 22 0 15-12 33-42 57z"/><path d="M34 30c-6-1-10 4-8 9s8 6 11 2M66 30c6-1 10 4 8 9s-8 6-11 2M50 22v52"/></svg>', '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="12"/><circle cx="50" cy="50" r="27"/><circle cx="50" cy="50" r="43"/></svg>', '<svg viewBox="0 0 100 100"><path d="M50 12v76M12 50h76"/><path d="M50 50c-10-24-34-22-38-6 4 14 24 14 28 2-2-8-12-8-12-2M50 50c10-24 34-22 38-6-4 14-24 14-28 2 2-8 12-8 12-2M50 50c-10 24-34 22-38 6 4-14 24-14 28-2-2 8-12 8-12 2M50 50c10 24 34 22 38 6-4-14-24-14-28-2 2 8 12 8 12 2"/></svg>', '<svg viewBox="0 0 100 100"><path d="M18 14c28 8 28 20 0 28s-28 20 0 28 28 20 0 28M58 14c28 8 28 20 0 28s-28 20 0 28 28 20 0 28" transform="translate(12 -8) scale(.85)"/></svg>'];
  const ESTRELA = '<svg viewBox="0 0 100 100"><polygon points="50,4 61,36 95,36 67,57 78,90 50,70 22,90 33,57 5,36 39,36" fill="#ffd166"/><polygon points="50,18 56,38 76,38 60,50 66,70 50,58 34,70 40,50 24,38 44,38" fill="#fff3c4"/></svg>';
  const LAMP = '<svg viewBox="0 0 40 70"><path d="M20 4C10 4 4 11 4 20c0 6 3 10 6 13 2 2 3 4 3 7h14c0-3 1-5 3-7 3-3 6-7 6-13C36 11 30 4 20 4z" stroke="#ffe9a8" stroke-width="2" fill="rgba(255,214,102,.35)"/><path d="M15 48h10M16 54h8M17.5 60h5" stroke="#ffe9a8" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const CAP = '<svg viewBox="0 0 60 44"><path d="M30 4L2 17l28 13 28-13z" fill="#0b2c4d" stroke="#ffe9a8" stroke-width="1.6"/><path d="M13 24v10c0 4 8 8 17 8s17-4 17-8V24l-17 8z" fill="#123f6a" stroke="#ffe9a8" stroke-width="1.4"/><path d="M54 18v16" stroke="#ffd166" stroke-width="2"/><circle cx="54" cy="36" r="3" fill="#ffd166"/></svg>';
  const ORN = '<svg viewBox="0 0 200 260"><path d="M100 6C50 6 14 90 14 160c0 56 40 94 86 94s86-38 86-94C186 90 150 6 100 6z"/><path d="M26 70q74-18 148 0M16 112q84-22 168 0M14 156q86-22 172 0M22 198q78-20 156 0"/><path d="M100 22v26M92 36h16M100 214v22M92 225h16"/><circle cx="100" cy="86" r="9"/><path d="M100 77v18M91 86h18M94 80l12 12M106 80L94 92"/></svg>';
  const PENA = '<svg viewBox="0 0 60 60"><path d="M2 58L10 46C24 40 44 26 56 4 48 26 40 40 30 46L12 52z" fill="#f6f1e4" stroke="#bfb494"/><path d="M2 58L52 8" stroke="#8a7a5a" stroke-width="1.4"/></svg>';
  const ASSIN = 'M10 110C50 20 90 20 100 80S140 150 180 70S230 10 250 70S290 140 330 80S380 20 410 75S450 130 490 70S540 30 590 60';
  const CRACHA = '<div class="fi"></div><div class="cl"></div><div class="cd"><svg viewBox="0 0 100 100"><defs><linearGradient id="gj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0056b3"/><stop offset="1" stop-color="#00b4d8"/></linearGradient></defs><polygon points="27,9 73,9 97,50 73,91 27,91 3,50" fill="url(#gj)"/><polygon points="42,31 42,69 72,50" fill="#fff"/></svg><b>APRENDIZ</b><small>CIEESC ▶︎ PLAY</small><i></i></div>';

  /* ---------------- temas: cores, textos, selo e efeitos ---------------- */
  const T = {
    halloween: { nome: 'Halloween', quando: 'Dia 31 de outubro', tg: ['#c25400','#7a2cd1','#b8330c'], kh: ['#ff9a2e','#c084fc','#7cff6b'], hd: '#22113a', c: { bg: 'linear-gradient(180deg,#0b0614,#220a3c 55%,#4a0f4f)', p: '#c25400', s: '#7a2cd1', a: '#3ddc84', card: '#fff6ec', btn: '#d96500' }, k: ['#ff9a2e', '#b46bff', '#7cff6b'], fita: () => ['Feliz Halloween!', '31 de outubro'],
      selo: { nome: 'Noite Assombrada', desc: 'Acessou o CIEESC PLAY no Halloween', sym: '<ellipse cx="20" cy="23" rx="13" ry="10.5" fill="#fff"/><path d="M19 13q1-6 7-7" stroke="#fff" stroke-width="2.6" fill="none"/><path d="M13 20l4 5h-8zM27 20l4 5h-8zM12 29q8 5 16 0l-3-2-3 2-2-2-3 2z" fill="rgba(0,0,0,.5)"/>' },
      fx(F) { const q = F.n; F.add('b', 'x-lua'); F.estrelas(40);
        for (let i = 0; i < q(5); i++) { const r = Math.random() < .4, d = R(12, 24); F.add('b', 't-voa' + (r ? ' r' : ''), '<div class="t-onda" style="--d2:' + R(1.8, 3.4).toFixed(1) + 's"><div class="t-bat" style="' + (r ? 'transform:scaleX(-1)' : '') + '">' + BAT + '</div></div>', 'top:' + R(4, 60) + 'vh;width:' + R(40, 86) + 'px;--d:' + d + 's;animation-delay:-' + R(0, d) + 's'); }
        for (let i = 0; i < q(3); i++) { const d = R(40, 70); F.add('b', 't-voa', '<div class="t-fant">' + GHOST + '</div>', 'top:' + R(14, 58) + 'vh;width:' + R(48, 74) + 'px;--d:' + d + 's;animation-delay:-' + R(0, d) + 's'); }
        F.rising(q(24), 'x-brasa', 6, 14); } },
    consciencia: { nome: 'Consciência Negra', quando: 'Dia 20 de novembro', tg: ['#a81d1d','#946500','#1a7f45'], kh: ['#ff6b6b','#5ee08f','#f2b705'], hd: '#1b0f08', c: { bg: 'linear-gradient(180deg,#0e0805,#1b0f08 55%,#2b140a)', p: '#946500', s: '#a81d1d', a: '#1a9850', card: '#fff8ea', btn: '#a81d1d' }, k: ['#e63946', '#2fbf6b', '#f2b705'], fita: () => ['Dia da Consciência Negra', '20 de novembro'],
      selo: { nome: 'Consciência e Orgulho', desc: 'Acessou o CIEESC PLAY no Dia da Consciência Negra', sym: '<path d="M20 34C8 25 5 18 5 13 5 9 8 6 12 6c3 0 6 2 8 5 2-3 5-5 8-5 4 0 7 3 7 7 0 5-3 12-15 21z" fill="#fff"/>' },
      fx(F) { const q = F.n; F.add('b', 'x-sol'); F.add('f', 'x-faixa t'); F.add('f', 'x-faixa b');
        for (let i = 0; i < q(5); i++) { const d = R(4, 8); F.add('b', 't-flut x-adk', ADK[i % 4], 'left:' + (6 + i * (86 / q(5)) + R(-3, 3)) + '%;top:' + R(10, 76) + '%;--t:' + R(38, 78) + 'px;--c:' + ['#f2b705', '#d62828', '#1a9850', '#f2b705'][i % 4] + ';--d:' + d + 's;animation-delay:-' + R(0, 6) + 's'); }
        F.rising(q(30), 'x-ouro', 8, 16); } },
    natal: { nome: 'Natal', quando: '24 e 25 de dezembro', tg: ['#c8102e','#1f8a4c','#a8800f'], kh: ['#ffffff','#7dffa8','#ffd166'], hd: '#a50d26', c: { bg: 'linear-gradient(180deg,#06162b,#0b2a4a 58%,#12506a)', p: '#c8102e', s: '#1f8a4c', a: '#ffd166', card: '#fffdf8', btn: '#c8102e' }, k: ['#c8102e', '#1f8a4c', '#e0a800'], fita: () => ['Feliz Natal!', '24 e 25 de dezembro'],
      selo: { nome: 'Espírito Natalino', desc: 'Acessou o CIEESC PLAY no Natal', sym: '<path d="M20 4l9 11h-5l7 9h-6l6 8H9l6-8H9l7-9h-5z" fill="#fff"/><rect x="18" y="32" width="4" height="5" fill="#fff"/>' },
      fx(F) { const q = F.n; F.estrelas(40); F.add('b', 'x-belem', ESTRELA); F.luzes(); F.falling(q(90), 'x-floco', 2, 7);
        for (let i = 0; i < q(10); i++) F.add(F.indice ? 'f' : 'b', 't-bri x-bri', '', 'left:' + R(2, 98) + '%;top:' + R(8, 80) + '%;--t:' + R(8, 18) + 'px;--d:' + R(2, 3.6) + 's;animation-delay:' + R(0, 2.6) + 's'); } },
    anonovo: { nome: 'Ano Novo', quando: '31 de dezembro e 1º de janeiro', tg: ['#3b2a8a','#86661c','#5b3fc4'], kh: ['#f6d98a','#e9eefc','#b9a6ff'], hd: '#0b1040', c: { bg: 'linear-gradient(180deg,#04050d,#0a0f2c 55%,#111a46)', p: '#86661c', s: '#3b2a8a', a: '#f9e4a6', card: '#fbf8f0', btn: '#3b2a8a' }, k: ['#d4a94a', '#e9eefc', '#7c5cff'], fita: d => ['Feliz ' + (d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear()), 'Virada do ano'],
      selo: { nome: 'Virada de Ano', desc: 'Acessou o CIEESC PLAY na virada do ano', sym: '<g stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M20 4v8M20 28v8M4 20h8M28 20h8M9 9l6 6M25 25l6 6M31 9l-6 6M15 25l-6 6"/></g><circle cx="20" cy="20" r="3" fill="#fff"/>' },
      fx(F) { const q = F.n; F.bokeh(q(10)); F.twinkle(q(60), '#fff3c8'); F.falling(q(26), 'x-polen', 1.5, 3.4, 9, 19); F.fogos(nivelF() < 1 ? 9000 : nivelF() > 1 ? 3200 : 6500); } },
    leitor: { nome: 'Dia do Leitor', quando: 'Dia 7 de janeiro', tg: ['#7b2d3b','#2f5d50','#8a6420'], kh: ['#ffd27a','#9fd8c4','#f8efdc'], hd: '#5e1f2c', c: { bg: 'linear-gradient(180deg,#101c1c,#1d1612 55%,#2e1b14)', p: '#7b2d3b', s: '#2f5d50', a: '#d9a441', card: '#f8efdc', btn: '#7b2d3b' }, k: ['#7b2d3b', '#2f5d50', '#d9a441'], fita: () => ['Dia do Leitor', '7 de janeiro'],
      selo: { nome: 'Leitor de Plantão', desc: 'Acessou o CIEESC PLAY no Dia do Leitor', sym: '<path d="M20 9C16 6 11 6 6 7v22c5-1 10-1 14 2 4-3 9-3 14-2V7c-5-1-10-1-14 2z" fill="#fff"/><path d="M20 9v22" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/>' },
      fx(F) { const q = F.n; F.add('b', 'x-feixe'); F.twinkle(q(30), '#ffe8b0', 0, 55);
        const cs = ['#7b2d3b', '#2f5d50', '#d9a441', '#3b5b7a', '#5a3b27', '#8f3646'];
        if (F.indice) for (let i = 0; i < q(6); i++) F.add('f', 't-pend x-marc', '', 'left:' + ((i + .5) * 100 / q(6) - 1) + '%;--w:' + R(13, 19) + 'px;--h:' + R(70, 150) + 'px;--c:' + cs[i % 6] + ';--d:' + R(2.6, 4.8) + 's;animation-delay:-' + R(0, 4) + 's');
        ['Histórias', 'Imaginação', 'Aventura', 'Poesia', 'Saber', 'Mundos', 'Sonhos'].slice(0, q(6)).forEach((p, i) => F.add('b', 't-sobe x-pal', p, 'left:' + R(4, 80) + '%;bottom:-40px;--o:.6;--f:' + R(1.1, 1.9) + 'rem;--dx:' + R(-20, 20) + 'vw;--rz:' + R(-12, 12) + 'deg;--d:' + R(14, 24) + 's;animation-delay:-' + R(0, 20) + 's'));
        for (let i = 0; i < q(8); i++) F.add('b', 't-sobe x-pag', '', 'left:' + (50 + R(-8, 8)) + '%;bottom:-30px;--w:' + R(20, 32) + 'px;--dx:' + R(-40, 40) + 'vw;--rz:' + R(-540, 540) + 'deg;--d:' + R(10, 18) + 's;animation-delay:-' + R(0, 18) + 's'); } },
    pascoa: { nome: 'Páscoa', quando: '3 dias antes, domingo e 1 dia depois', tg: ['#8a6420','#8d5a45','#4f3123'], kh: ['#e9c878','#f1c9c4','#c8dcb8'], hd: '#2c1a12', c: { bg: 'linear-gradient(180deg,#150c08,#26160f 55%,#3a2216)', p: '#8a6420', s: '#8d5a45', a: '#e9c878', card: '#fbf6ec', btn: '#4f3123' }, k: ['#c29a3a', '#c98a78', '#9bb08f'], fita: d => { const pr = proxima('pascoa', d), p = pr ? new Date(pr[0].getFullYear(), pr[0].getMonth(), pr[0].getDate() + 3) : pascoa(d.getFullYear()); return ['Feliz Páscoa', 'Domingo de Páscoa · ' + fmt(p)]; },
      selo: { nome: 'Renovação', desc: 'Acessou o CIEESC PLAY na Páscoa', sym: '<path d="M20 4C12 4 8 16 8 24c0 7 5 12 12 12s12-5 12-12C32 16 28 4 20 4z" fill="#fff"/><path d="M8 22q12 6 24 0M9 29q11 5 22 0" stroke="rgba(0,0,0,.3)" stroke-width="1.6" fill="none"/>' },
      fx(F) { const q = F.n; F.add('b', 'x-ovo', ORN); F.bokeh(q(10)); F.twinkle(q(55), '#fff1c4'); } },
    jovem: { nome: 'Dia do Jovem Aprendiz', quando: 'Dia 24 de abril', tg: ['#0056b3','#bd5f00','#0089a8'], kh: ['#ffc933','#ffffff','#7ee0ff'], hd: '#0a4aa8', c: { bg: 'linear-gradient(160deg,#0a3d91,#1a6fd1 48%,#00b4d8)', p: '#bd5f00', s: '#0056b3', a: '#00b4d8', card: '#ffffff', btn: '#0056b3' }, k: ['#fb8500', '#0056b3', '#00b4d8'], fita: () => ['Dia do Jovem Aprendiz', '24 de abril'],
      selo: { nome: 'Primeiros Passos', desc: 'Acessou o CIEESC PLAY no Dia do Jovem Aprendiz', sym: '<path d="M5 34h8v-6h6v-6h6v-6h6v-6h4v24z" fill="#fff"/>' },
      fx(F) { const q = F.n; if (F.indice) F.add('f', 'x-cracha', CRACHA);
        let h = ''; [34, 56, 78, 100, 122, 146].forEach((a, i) => { h += '<div style="--h:' + a + 'px;--i:' + i + '"></div>'; }); F.add('b', 'x-deg', h + '<svg class="star" viewBox="0 0 100 100"><polygon points="50,4 61,36 95,36 67,57 78,90 50,70 22,90 33,57 5,36 39,36" fill="#ffc933"/></svg>', '--top:146px');
        for (let i = 0; i < q(12); i++) F.add(F.indice ? 'f' : 'b', 't-bri x-bri', '', 'left:' + R(2, 98) + '%;top:' + R(8, 78) + '%;--t:' + R(9, 19) + 'px;--d:' + R(2, 3.6) + 's;animation-delay:' + R(0, 2.6) + 's'); } },
    educacao: { nome: 'Dia da Educação', quando: 'Dia 28 de abril', tg: ['#0e6f7a','#10305a','#946500'], kh: ['#ffd166','#7fe7ef','#ffffff'], hd: '#0b3556', c: { bg: 'linear-gradient(180deg,#051a33,#0a3556 52%,#12767f)', p: '#0e6f7a', s: '#10305a', a: '#ffd166', card: '#ffffff', btn: '#0e6f7a' }, k: ['#f2a900', '#0e6f7a', '#10305a'], fita: () => ['Dia da Educação', '28 de abril'],
      selo: { nome: 'Luz do Conhecimento', desc: 'Acessou o CIEESC PLAY no Dia da Educação', sym: '<path d="M20 7L3 15l17 8 17-8z" fill="#fff"/><path d="M10 20v7c0 3 5 6 10 6s10-3 10-6v-7l-10 5z" fill="#fff" opacity=".9"/>' },
      fx(F) { const q = F.n; F.estrelas(40); const S = ['A', 'B', 'C', 'π', '∑', '√', 'E = mc²', 'α', '+', '=', '{ }', '1 2 3', '?', 'x²', '∞'];
        for (let i = 0; i < q(14); i++) F.add('b', 't-sobe x-sim', S[i % S.length], 'left:' + R(2, 94) + '%;bottom:-50px;--o:.4;--f:' + R(1.5, 3) + 'rem;--c:' + ['#fff', '#ffd166', '#bfe9ec'][i % 3] + ';--dx:' + R(-60, 60) + 'px;--rz:' + R(-30, 30) + 'deg;--d:' + R(22, 40) + 's;animation-delay:-' + R(0, 30) + 's');
        for (let i = 0; i < q(5); i++) F.add('b', 't-sobe x-lamp', LAMP, 'left:' + R(3, 92) + '%;bottom:-80px;--o:.8;width:' + R(26, 44) + 'px;--dx:' + R(-30, 30) + 'px;--rz:0deg;--d:' + R(30, 50) + 's;animation-delay:-' + R(0, 40) + 's');
        for (let i = 0; i < q(3); i++) F.add('b', 't-sobe x-cap', CAP, 'left:' + R(3, 92) + '%;bottom:-70px;width:' + R(40, 64) + 'px;--dx:' + R(-40, 40) + 'px;--rz:' + R(-40, 40) + 'deg;--d:' + R(34, 56) + 's;animation-delay:-' + R(0, 40) + 's'); } },
    escritor: { nome: 'Dia do Escritor', quando: 'Dia 25 de julho', tg: ['#1d3a8a','#b8302c','#2c4fb0'], kh: ['#e9c878','#ff9c99','#9fb7ff'], hd: '#10183a', c: { bg: 'linear-gradient(180deg,#070a14,#0e1630 58%,#1a2750)', p: '#1d3a8a', s: '#d9534f', a: '#c9a24a', card: '#fbf7ee', btn: '#1d3a8a' }, k: ['#1d3a8a', '#d9534f', '#b8892a'], fita: () => ['Dia do Escritor', '25 de julho'],
      selo: { nome: 'Pena Afiada', desc: 'Acessou o CIEESC PLAY no Dia do Escritor', sym: '<path d="M6 34l5-9C19 21 29 14 35 4 31 15 26 22 20 26l-9 5z" fill="#fff"/><path d="M6 34L30 10" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/>' },
      fx(F) { const q = F.n; F.add('b', 'x-abajur'); F.twinkle(q(26), '#ffe8b0', 0, 50);
        ['Era uma vez', 'Capítulo I', 'Fim?', 'Rascunho', 'Prólogo', 'Epílogo'].slice(0, q(5)).forEach(p => { const d = R(10, 18); F.add('b', 't-man', p, 'left:' + R(2, 72) + '%;top:' + R(8, 78) + '%;--f:' + R(2.4, 4.6) + 'rem;--r:' + R(-12, 12) + 'deg;--d:' + d + 's;animation-delay:-' + R(0, d) + 's'); });
        F.add('b', 'x-assin', '<svg viewBox="0 0 600 160"><path pathLength="1" d="' + ASSIN + '"/></svg><div class="pena">' + PENA + '</div>', '--s:' + Math.min(1, (innerWidth - 24) / 620).toFixed(3)); } }
  };

  /* ---------------- CSS base (animações genéricas) ---------------- */
  const BASE = `#tema-fx,#tema-fx2{position:fixed;inset:0;pointer-events:none;overflow:hidden}#tema-fx{z-index:-1}#tema-fx2{z-index:900}.ti{position:absolute}
.t-cai{animation:t-cai var(--d) linear infinite}@keyframes t-cai{0%{transform:translate(0,-8vh) rotate(0);opacity:0}8%{opacity:var(--o,.9)}100%{transform:translate(var(--dx),112vh) rotate(var(--rz));opacity:.1}}
.t-sobe{animation:t-sobe var(--d) linear infinite}@keyframes t-sobe{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:var(--o,.9)}100%{transform:translate(var(--dx),-114vh) rotate(var(--rz));opacity:0}}
.t-pisca{animation:t-pisca var(--d) ease-in-out infinite}@keyframes t-pisca{0%,100%{opacity:.06;transform:scale(.5)}50%{opacity:var(--o,1);transform:scale(1)}}
.t-bri{animation:t-bri var(--d) ease-in-out infinite}@keyframes t-bri{0%,100%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1) rotate(90deg);opacity:1}}
.t-flut{animation:t-flut var(--d) ease-in-out infinite alternate}@keyframes t-flut{from{transform:translateY(-14px) rotate(-5deg)}to{transform:translateY(14px) rotate(5deg)}}
.t-pend{transform-origin:50% 0;animation:t-pend var(--d) ease-in-out infinite alternate}@keyframes t-pend{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
.t-voa{left:0;animation:t-voa var(--d) linear infinite}@keyframes t-voa{from{transform:translateX(-14vw)}to{transform:translateX(114vw)}}
.t-voa.r{animation-name:t-voa2}@keyframes t-voa2{from{transform:translateX(114vw)}to{transform:translateX(-14vw)}}
.t-onda{animation:t-onda var(--d2,3s) ease-in-out infinite alternate}@keyframes t-onda{from{transform:translateY(-30px)}to{transform:translateY(30px)}}
.t-bat svg{width:100%;display:block;filter:drop-shadow(0 0 6px rgba(255,122,0,.6));animation:t-bate .2s ease-in-out infinite alternate}@keyframes t-bate{from{transform:scaleY(1)}to{transform:scaleY(.5)}}
.t-fant svg{width:100%;display:block;filter:drop-shadow(0 0 12px rgba(255,255,255,.55));animation:t-fl 3s ease-in-out infinite alternate}@keyframes t-fl{from{transform:translateY(-14px);opacity:.5}to{transform:translateY(14px);opacity:.9}}
.t-luz{animation:t-luz 4s ease-in-out infinite alternate}@keyframes t-luz{0%{opacity:.7}35%{opacity:1}60%{opacity:.82}100%{opacity:1}}
.x-pt{border-radius:50%}
.x-lua{right:7vw;top:7vh;width:min(20vw,130px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe0,#ffe58f 60%,#f2c85a);box-shadow:0 0 70px 20px rgba(255,214,120,.4);position:absolute}
.x-brasa{background:#ff9a2e;box-shadow:0 0 8px 2px rgba(255,140,0,.8);border-radius:50%}
.x-sol{position:absolute;right:5vw;top:5vh;width:min(22vw,150px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 35%,#ffe27a,#f6a700 62%,#c76a00);box-shadow:0 0 60px 18px rgba(255,170,0,.5)}
.x-faixa{position:absolute;left:0;right:0;background:repeating-linear-gradient(90deg,#d62828 0 24px,#111 24px 34px,#f2b705 34px 58px,#111 58px 68px,#1a9850 68px 92px,#111 92px 102px);background-size:102px 100%;animation:t-tece 8s linear infinite}.x-faixa.t{top:0;height:8px}.x-faixa.b{bottom:0;height:10px;animation-direction:reverse}@keyframes t-tece{to{background-position-x:102px}}
.x-adk{width:var(--t);filter:drop-shadow(0 0 8px rgba(242,183,5,.7))}.x-adk svg{width:100%;display:block;fill:none;stroke:var(--c);stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}
.x-ouro{background:#ffd45a;box-shadow:0 0 8px 2px rgba(255,200,60,.7);border-radius:50%}
.x-floco{background:#fff;border-radius:50%;box-shadow:0 0 6px rgba(255,255,255,.7)}
.x-belem{position:absolute;right:8vw;top:10vh;width:min(12vw,80px);filter:drop-shadow(0 0 16px rgba(255,214,120,.9));animation:t-bel 3.4s ease-in-out infinite alternate}@keyframes t-bel{from{transform:scale(.92) rotate(-4deg);opacity:.8}to{transform:scale(1.06) rotate(4deg);opacity:1}}.x-belem svg{width:100%}
.x-bri{background:#ffe9a8;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);width:var(--t);height:var(--t)}
.x-luzes{position:absolute;left:0;top:0;width:100%;height:60px}.x-luzes .bulbo{animation:t-lz 1.8s ease-in-out infinite}@keyframes t-lz{0%,100%{opacity:1;filter:drop-shadow(0 0 7px var(--c))}50%{opacity:.3;filter:none}}
.x-bokeh{border-radius:50%;background:radial-gradient(circle,var(--c),rgba(255,236,170,0) 68%);filter:blur(var(--b));animation:t-bk var(--d) ease-in-out infinite alternate}@keyframes t-bk{from{transform:translate(0,0) scale(.9);opacity:var(--o1)}to{transform:translate(var(--dx),-60px) scale(1.15);opacity:var(--o2)}}
.x-polen{background:#ffe9a8;border-radius:50%;box-shadow:0 0 5px rgba(255,226,140,.8)}
.x-gl{border-radius:50%;box-shadow:0 0 6px 1px rgba(255,226,140,.7)}
.x-feixe{position:absolute;left:-12%;top:-12%;width:62%;height:125%;background:linear-gradient(112deg,rgba(255,222,150,.3),rgba(255,222,150,.06) 55%,transparent 75%);transform:skewX(-16deg);filter:blur(10px)}
.x-marc{width:var(--w);height:var(--h);background:var(--c);clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%);top:0}
.x-pal{font:italic 500 var(--f) Georgia,serif;color:#ffe9b0;white-space:nowrap;text-shadow:0 0 14px rgba(255,214,130,.6)}
.x-pag{width:var(--w);height:calc(var(--w)*1.3);background:repeating-linear-gradient(#f8efdc 0 5px,#e9dbbb 5px 6px);border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.35)}
.x-ovo{position:absolute;left:50%;top:50%;width:min(60vw,420px);transform:translate(-50%,-52%);opacity:.18;animation:t-ov 9s ease-in-out infinite alternate}.x-ovo svg{width:100%;fill:none;stroke:#e9c878;stroke-width:1.1}@keyframes t-ov{from{opacity:.08}to{opacity:.22}}
.x-cracha{position:absolute;top:-8px;left:4vw;transform-origin:50% 0;animation:t-pend 4.6s ease-in-out infinite alternate;--d:4.6s}
.x-cracha .fi{width:20px;height:88px;margin:0 auto;background:repeating-linear-gradient(135deg,#0056b3 0 8px,#fff 8px 12px,#ffb703 12px 20px)}.x-cracha .cl{width:26px;height:14px;margin:-2px auto 0;border-radius:3px;background:linear-gradient(#e6edf7,#9fb2cf)}
.x-cracha .cd{width:112px;margin:-2px auto 0;padding:14px 8px 10px;background:#fff;border-radius:12px;color:#0a3d91;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.4)}.x-cracha .cd svg{width:44px;display:block;margin:4px auto}.x-cracha .cd b{display:block;font:800 .8rem sans-serif;letter-spacing:2px}.x-cracha .cd small{display:block;font:700 .6rem sans-serif;color:#6b7c99}.x-cracha .cd i{display:block;height:5px;border-radius:3px;margin-top:8px;background:linear-gradient(90deg,#0056b3,#00b4d8,#ffb703)}
@media (max-width:560px){.x-cracha{scale:.62;transform-origin:0 0;left:1vw}}
@media (max-width:560px){.x-deg{scale:.62;transform-origin:100% 100%;right:2vw}}
.x-deg{position:absolute;bottom:0;right:3vw;display:flex;align-items:flex-end;gap:3px}.x-deg div{width:34px;height:var(--h);background:rgba(255,255,255,.16);border-top:3px solid rgba(255,255,255,.75);border-radius:4px 4px 0 0;animation:t-ac 6s ease-in-out infinite;animation-delay:calc(var(--i)*.5s)}@keyframes t-ac{0%,45%,100%{background:rgba(255,255,255,.16);box-shadow:none}15%{background:rgba(255,183,3,.75);box-shadow:0 0 18px rgba(255,183,3,.8)}}
.x-deg .star{position:absolute;right:-2px;bottom:calc(var(--top) + 6px);width:40px;animation:t-gr 6s linear infinite}@keyframes t-gr{to{transform:rotate(360deg)}}
.x-sim{font:600 var(--f) 'Caveat',cursive;color:var(--c);white-space:nowrap;text-shadow:0 0 12px rgba(255,214,120,.45)}
.x-lamp svg,.x-cap svg{width:100%;display:block;filter:drop-shadow(0 0 10px rgba(255,214,102,.7))}
.t-man{position:absolute;font:600 var(--f) 'Caveat',cursive;color:rgba(255,236,200,.9);white-space:nowrap;opacity:0;transform:rotate(var(--r));animation:t-mn var(--d) ease-in-out infinite}@keyframes t-mn{0%,100%{opacity:0}30%,65%{opacity:.16}}
.x-abajur{position:absolute;left:-10vw;bottom:-18vh;width:60vw;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,200,120,.4),transparent 62%);animation:t-luz 4.5s ease-in-out infinite alternate}
.x-assin{position:absolute;left:50%;bottom:9vh;width:600px;height:160px;margin-left:-300px;transform:scale(var(--s,1));transform-origin:50% 100%}.x-assin svg{width:100%;height:100%;overflow:visible}.x-assin path{fill:none;stroke:#e9c878;stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 0 6px rgba(233,200,120,.55));stroke-dasharray:1;stroke-dashoffset:1;animation:t-tr 11s linear infinite}@keyframes t-tr{0%{stroke-dashoffset:1;opacity:1}60%{stroke-dashoffset:0;opacity:1}88%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.x-assin .pena{position:absolute;left:0;top:0;width:46px;offset-path:path("${ASSIN}");offset-rotate:0deg;offset-anchor:0 100%;animation:t-es 11s linear infinite}@keyframes t-es{0%{offset-distance:0%;opacity:1}60%{offset-distance:100%;opacity:1}88%{offset-distance:100%;opacity:1}100%{offset-distance:100%;opacity:0}}
.tema-fita{text-align:center;margin:-4px 0 6px}.tema-fita b{display:block;font:700 1.35rem/1.15 'Fredoka',sans-serif;color:var(--theme-primary)}.tema-fita small{display:block;margin-top:2px;font:800 .72rem 'Nunito',sans-serif;letter-spacing:2.4px;text-transform:uppercase;color:#718096}`;

  /* ---------------- motor ---------------- */
  let B = null, Fr = null, raf = 0, ultimaId = null, cvFogos = null;
  const root = document.documentElement;
  const nivelF = () => ([0.55, 1, 1.8][(cfg().nivel || 2) - 1] || 1) * (innerWidth < 560 ? 0.7 : 1);   // menos efeitos no celular
  function F() {
    const lay = { b: B, f: Fr };
    const add = (l, cls, html, css) => { const d = document.createElement('div'); d.className = 'ti ' + cls; if (html) d.innerHTML = html; if (css) d.style.cssText = css; lay[l].appendChild(d); return d; };
    const n = base => Math.max(1, Math.round(base * nivelF()));
    const o = { add, n, indice: !!document.getElementById('scene') };
    o.estrelas = c => { for (let i = 0; i < n(c); i++) add('b', 't-pisca', '', 'left:' + R(0, 100) + '%;top:' + R(0, 55) + '%;width:2px;height:2px;border-radius:50%;background:#fff;--d:' + R(2, 4) + 's;animation-delay:' + R(0, 3) + 's;--o:' + R(.3, 1)); };
    o.twinkle = (c, cor, x0, x1) => { for (let i = 0; i < n(c); i++) add('b', 't-pisca x-gl', '', 'left:' + R(x0 || 0, x1 || 100) + '%;top:' + R(0, 92) + '%;width:' + R(1.4, 3) + 'px;height:' + R(1.4, 3) + 'px;background:' + cor + ';--d:' + R(2.2, 5.5) + 's;animation-delay:-' + R(0, 5) + 's'); };
    o.falling = (c, cls, s0, s1, d0, d1) => { for (let i = 0; i < c; i++) { const s = R(s0, s1); add(Math.random() < .3 && o.indice ? 'f' : 'b', 't-cai ' + cls, '', 'left:' + R(0, 100) + '%;width:' + s + 'px;height:' + s + 'px;--dx:' + R(-70, 70) + 'px;--rz:0deg;--d:' + R(d0 || (14 - s * 1.2), d1 || ((d0 || (14 - s * 1.2)) + 6)) + 's;animation-delay:-' + R(0, 16) + 's'); } };
    o.rising = (c, cls, s0, s1) => { for (let i = 0; i < c; i++) { const s = R(2, 5); add('b', 't-sobe ' + cls, '', 'left:' + R(0, 100) + '%;bottom:-10px;width:' + s + 'px;height:' + s + 'px;--dx:' + R(-60, 60) + 'px;--rz:0deg;--d:' + R(s0, s1) + 's;animation-delay:-' + R(0, 14) + 's'); } };
    o.bokeh = c => { for (let i = 0; i < n(c); i++) { const s = R(40, 150); add('b', 'x-bokeh', '', 'left:' + R(-2, 98) + '%;top:' + R(5, 95) + '%;width:' + s + 'px;height:' + s + 'px;--b:' + R(3, 14) + 'px;--c:' + (i % 3 ? 'rgba(255,230,160,.5)' : 'rgba(241,201,196,.5)') + ';--dx:' + R(-50, 50) + 'px;--o1:' + R(.08, .18) + ';--o2:' + R(.2, .42) + ';--d:' + R(9, 19) + 's;animation-delay:-' + R(0, 12) + 's'); } };
    o.luzes = () => {
      const W = innerWidth, sw = Math.max(150, Math.min(210, W / 5)), nn = Math.ceil(W / sw), cor = ['#ff3b3b', '#ffd166', '#4dff88', '#4db8ff']; let svg = '<svg class="x-luzes" viewBox="0 0 ' + W + ' 78" preserveAspectRatio="none"><g fill="none" stroke="#0b1d12" stroke-width="2">', b = '', k = 0;
      for (let i = 0; i < nn; i++) { const x0 = i * sw, x2 = x0 + sw, cx = x0 + sw / 2; svg += '<path d="M' + x0 + ' 4Q' + cx + ' 66 ' + x2 + ' 4"/>'; for (let j = 1; j <= 5; j++) { const t = j / 6, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2, y = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 66 + t * t * 4, c = cor[k % 4]; b += '<g class="bulbo" style="--c:' + c + ';animation-delay:' + (-k * .35).toFixed(2) + 's"><rect x="' + (x - 2) + '" y="' + (y - 1) + '" width="4" height="5" fill="#0b1d12"/><ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="4.6" ry="6.4" fill="' + c + '"/></g>'; k++; } }
      add('f', '', svg + '</g>' + b + '</svg>', 'left:0;top:0;width:100%;height:60px');
    };
    o.fogos = gap => {
      if (reduz) return; const cv = document.createElement('canvas'); B.appendChild(cv); const ctx = cv.getContext && cv.getContext('2d'); if (!ctx) return; cvFogos = cv;
      const D = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * D; cv.height = innerHeight * D; cv.style.cssText = 'position:absolute;left:0;top:0;width:' + innerWidth + 'px;height:' + innerHeight + 'px'; ctx.setTransform(D, 0, 0, D, 0, 0);
      const OURO = [['#f6d98a', '#fff1c9'], ['#e8c172', '#ffe9b0'], ['#ffffff', '#e6ecff']]; let fog = [], par = [], prox = 900, ult = 0;
      const lancar = () => fog.push({ x: R(.1, .9) * innerWidth, y: innerHeight * .8, vx: R(-.3, .3), vy: -R(7.5, 10) * (innerHeight / 800 + .4), alvo: R(.1, .42) * innerHeight });
      const explode = f => { const c = OURO[Math.floor(R(0, 3))], nn = Math.round(R(70, 110)); for (let i = 0; i < nn; i++) { const a = Math.PI * 2 * i / nn, v = R(1.2, 4.3); par.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: R(95, 150), c: Math.random() < .4 ? c[1] : c[0], s: R(.8, 1.5), g: .045 }); } };
      const q = t => { raf = requestAnimationFrame(q); const dt = Math.min(3, (t - (ult || t)) / 16.67 || 1); ult = t; ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,' + (.09 * dt).toFixed(3) + ')'; ctx.fillRect(0, 0, innerWidth, innerHeight); ctx.globalCompositeOperation = 'lighter';
        if (t > prox) { lancar(); prox = t + gap * R(.7, 1.3); }
        for (let i = fog.length - 1; i >= 0; i--) { const f = fog[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += .1 * dt; par.push({ x: f.x, y: f.y, vx: R(-.1, .1), vy: R(0, .3), l: 0, m: 20, c: '#fff1c9', s: .9, g: .01 }); if (f.vy > -1.2 || f.y < f.alvo) { explode(f); fog.splice(i, 1); } }
        for (let i = par.length - 1; i >= 0; i--) { const p = par[i]; p.l += dt; if (p.l > p.m) { par.splice(i, 1); continue; } p.vx *= .984; p.vy = p.vy * .984 + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, 1 - p.l / p.m) * .9; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); }
        ctx.globalAlpha = 1; if (par.length > 2200) par.splice(0, par.length - 2200); };
      raf = requestAnimationFrame(q);
    };
    return o;
  }

  /* ---------------- decisão: qual tema vale agora ---------------- */
  function atual(d) {
    d = d || new Date(); const c = cfg();
    if (c.modo === 'desligado') return { id: null };
    if (c.modo === 'forcar' && c.forcar && T[c.forcar]) return { id: c.forcar, origem: 'teste' };
    const l = ativosPorData(d).filter(id => c.ativos[id] !== false);
    return l.length ? { id: l[0], origem: 'data' } : { id: null };
  }
  // período de conquistas: só vale o tema entrando por DATA (nunca por teste manual)
  function periodoDe(d) { d = d || new Date(); const c = cfg(); if (c.modo !== 'auto') return null; const l = ativosPorData(d).filter(id => c.ativos[id] !== false); return l.length ? { id: l[0], ano: anoDoSelo(l[0], d) } : null; }

  function limpar() {
    cancelAnimationFrame(raf); raf = 0; cvFogos = null;
    ['tema-css', 'tema-fx', 'tema-fx2'].forEach(i => { const e = document.getElementById(i); if (e) e.remove(); });
    document.querySelectorAll('.tema-fita').forEach(e => e.remove()); root.removeAttribute('data-tema');
  }
  function aplicar() {
    limpar(); const a = atual(); ultimaId = a.id; if (!a.id) return;
    const t = T[a.id], c = t.c, d = new Date();
    root.setAttribute('data-tema', a.id);
    const st = document.createElement('style'); st.id = 'tema-css';
    st.textContent = 'html[data-tema]{--bg-gradient:' + c.bg + '!important;--theme-primary:' + c.p + '!important;--theme-secondary:' + c.s + '!important;--theme-accent:' + c.a + '!important;--card-dynamic-bg:' + c.card + '!important;--btn-dynamic-bg:' + c.btn + '!important}' +
      'html[data-tema] .play-cor{animation:t-corh 4s ease-in-out infinite alternate!important}@keyframes t-corh{0%,100%{color:' + t.kh[0] + '}33%{color:' + t.kh[1] + '}66%{color:' + t.kh[2] + '}}' +
      'html[data-tema] header{background:' + t.hd + '!important}' +
      'html[data-tema] .front-title .ft-a{background-image:linear-gradient(100deg,' + t.tg[0] + ' 0%,' + t.tg[1] + ' 45%,' + t.tg[2] + ' 70%,' + t.tg[0] + ' 100%)}' +
      'html[data-tema] .front-title .play-cor{animation:t-corc 4s ease-in-out infinite alternate!important}@keyframes t-corc{0%,100%{color:' + t.tg[0] + '}33%{color:' + t.tg[1] + '}66%{color:' + t.tg[2] + '}}' +
      'html[data-tema] .scene.dark-reg .front-title .play-cor{animation-name:t-corh!important}' + BASE;
    document.head.appendChild(st);
    const f = document.querySelector('.card-front h2');
    if (f && !document.querySelector('.tema-fita')) { const [x, y] = t.fita(d); f.insertAdjacentHTML('afterend', '<div class="tema-fita"><b>' + x + '</b><small>' + y + '</small></div>'); }
    if (reduz) return;
    B = document.createElement('div'); B.id = 'tema-fx'; Fr = document.createElement('div'); Fr.id = 'tema-fx2';
    document.body.appendChild(B); document.body.appendChild(Fr);
    try { t.fx(F()); } catch (e) { console.error('tema', e); }
  }

  window.cieeTemas = { TEMAS: T, ORDEM, atual, periodoDe, ativosPorData, proxima, descPeriodo, ocorrencias, anoDoSelo, pascoa, fmt, cfg, atualizar: aplicar };
  const iniciar = () => { aplicar(); setInterval(() => { const a = atual(); if (a.id !== ultimaId) aplicar(); }, 60000); };
  window.addEventListener('storage', e => { if (e.key === KEY) aplicar(); });
  let rs; window.addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { if (ultimaId && !cvFogos) aplicar(); }, 300); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (ultimaId) aplicar(); });
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
