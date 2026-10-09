/* CIEESC PLAY — "Meu perfil": o próprio aprendiz altera foto, e-mail, telefone e senha.
   Foto, e-mail e telefone: salvos na hora. Senha: só com código enviado ao e-mail ou telefone (precisa do servidor, ver js/core/api.js). */
(function () {
  const USERS = 'ciee_users';
  const lerJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  const store = () => localStorage.getItem('ciee_session') ? localStorage : sessionStorage;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ini = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
  const lc = t => String(t || '').trim().toLowerCase();
  const digitos = t => String(t || '').replace(/\D/g, '');
  const senhaOk = t => t.length >= 8 && /\p{Lu}/u.test(t) && /\p{Ll}/u.test(t) && /\d/.test(t) && /[^\p{L}\p{N}\s]/u.test(t);
  const maskEmail = e => { const [a, d] = String(e || '').split('@'); return a ? a[0] + '•••••@' + (d || '') : ''; };
  const maskFone = f => { const d = digitos(f); return d.length >= 10 ? '(' + d.slice(0, 2) + ') •••••-' + d.slice(-4) : ''; };
  const fmtFone = f => { const d = digitos(f).slice(0, 11); if (d.length <= 2) return d; if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2); if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6); return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7); };

  const css = document.createElement('style');
  css.textContent = `#meus-dados .pf-linha,.pf-bloco .pf-linha{display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap}
  #meus-dados .pf-foto,.pf-bloco .pf-foto{width:84px;height:84px;border-radius:22px;overflow:hidden;display:grid;place-items:center;font-size:2.4rem;background:color-mix(in srgb,var(--theme-primary,#0056b3) 14%,transparent);border:2px solid var(--theme-primary,#0056b3);flex:0 0 auto}
  #meus-dados .pf-foto img,.pf-bloco .pf-foto img{width:100%;height:100%;object-fit:cover}
  #meus-dados small,.pf-bloco small{display:block;margin-top:5px;font:700 .78rem 'Nunito',sans-serif;color:var(--text-muted,#718096);line-height:1.35}
  #meus-dados h4{font:700 1.05rem 'Fredoka',sans-serif;margin:22px 0 4px;padding-top:16px;border-top:1px solid var(--border-color,#e2e8f0);color:var(--text-dark,#2d3748)}
  #meus-dados{max-width:560px;margin-left:auto;margin-right:auto}
  @media (max-width:820px){#meus-dados{max-width:none;margin:0 var(--gut,18px) 12px}}
  #meus-dados .pf-linha .btn-action{width:auto}
  #meus-dados .pf-linha>div:last-child,.pf-bloco .pf-linha>div:last-child{flex:1 1 180px;min-width:0}
  .pf-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 6px}
  .pf-resumo div{padding:10px 12px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px}
  .pf-resumo dt{font:800 .7rem 'Nunito',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--text-muted,#718096)}
  .pf-resumo dd{margin:3px 0 0;font:700 .95rem 'Nunito',sans-serif;color:var(--text-dark,#2d3748)}
  .pf-apar{display:flex;flex-direction:column;gap:10px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:12px 14px}
  .pf-ap-l{display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:800;color:var(--text-dark,#2d3748)}
  .pf-dots{display:flex;gap:10px}.pf-dots button{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e0;cursor:pointer;padding:0}
  .pf-dots button[aria-checked="true"]{box-shadow:0 0 0 3px var(--text-dark,#2d3748)}
  .pf-modo{display:flex;border:1px solid var(--border-color,#e2e8f0);border-radius:999px;overflow:hidden}
  .pf-modo button{border:0;background:transparent;color:var(--text-dark,#2d3748);font:800 .85rem 'Nunito',sans-serif;padding:8px 16px;cursor:pointer;min-height:38px}
  .pf-modo button[aria-checked="true"]{background:var(--theme-primary,#0056b3);color:#fff}
  #meus-dados .pf-msg{min-height:1.2em;font-weight:800}#meus-dados .pf-msg.ok{color:#15803d}#meus-dados .pf-msg.erro{color:#dc2626}
  #meus-dados .pf-aviso,.pf-bloco .pf-aviso{border:2px dashed var(--border-color,#cbd5e0);border-radius:12px;padding:12px 14px;font:700 .85rem 'Nunito',sans-serif;color:var(--text-dark,#2d3748);line-height:1.45}
  #meus-dados .pf-canais{display:flex;flex-direction:column;gap:8px;margin:10px 0}
  #meus-dados .pf-canais label{display:flex;align-items:center;gap:10px;padding:10px 12px;border:2px solid var(--border-color,#e2e8f0);border-radius:12px;font-weight:800;cursor:pointer}
  #meus-dados .pf-canais input{accent-color:var(--theme-primary,#0056b3);width:18px;height:18px}
  #meus-dados .btn-action[disabled]{opacity:.55;cursor:not-allowed}`;
  document.head.appendChild(css);

  const caixa = () => document.getElementById('meus-dados');
  const msg = (t, tipo) => { const e = document.getElementById('pf-msg'); if (e) { e.textContent = t || ''; e.className = 'pf-msg ' + (tipo || ''); } };
  const ehAprendiz = s => s && !s.bypass && (s.nivel || 1) === 1;

  function achar(s) { const us = lerJ(USERS, []), i = us.findIndex(u => lc(u.email) === lc(s.email)); return { us, i }; }

  /* ---------- foto: recorta em quadrado e reduz (fica leve para guardar no aparelho) ---------- */
  function processarFoto(arq) {
    return new Promise((res, rej) => {
      if (!arq || !/^image\//.test(arq.type)) return rej(new Error('Escolha um arquivo de imagem.'));
      if (arq.size > 5 * 1024 * 1024) return rej(new Error('A imagem tem mais de 5 MB.'));
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('Não consegui ler a imagem.'));
      fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('Imagem inválida.'));
        im.onload = () => { const L = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 360;
          c.getContext('2d').drawImage(im, (im.width - L) / 2, (im.height - L) / 2, L, L, 0, 0, 360, 360); res(c.toDataURL('image/jpeg', .84)); };
        im.src = fr.result; };
      fr.readAsDataURL(arq);
    });
  }
  async function trocarFoto(arq) {
    const s = sessao(); msg('');
    try {
      const url = await processarFoto(arq), { us, i } = achar(s);
      if (i < 0) return msg('Cadastro não encontrado neste aparelho.', 'erro');
      us[i] = { ...us[i], foto: url }; if (!gravar(USERS, us)) return msg('Sem espaço para guardar a foto. Tente uma imagem menor.', 'erro');
      s.foto = url; store().setItem('ciee_session', JSON.stringify(s));
      if (window.aplicarPerfil) window.aplicarPerfil({ foto: url }); render('Foto atualizada!');
    } catch (e) { msg(e.message, 'erro'); }
  }

  /* ---------- e-mail e telefone: o e-mail é a "identidade" do aprendiz, então os registros acompanham a mudança ---------- */
  function migrar(antigo, novo, fone) {
    const ren = (k) => { const o = lerJ(k, null); if (o && typeof o === 'object' && !Array.isArray(o) && o[antigo]) { o[novo] = Object.assign({}, o[novo] || {}, o[antigo]); delete o[antigo]; gravar(k, o); } };
    ren('ciee_conquistas'); ren('ciee_acessos_usuarios');
    const L = lerJ('ciee_leituras', null); if (Array.isArray(L)) { L.forEach(x => { if (lc(x.chave) === antigo) x.chave = novo; }); gravar('ciee_leituras', L); }
    ['ciee_emprestimos', 'ciee_solicitacoes'].forEach(k => { const a = lerJ(k, null); if (Array.isArray(a)) { let m = false; a.forEach(x => { if (lc(x.email) === antigo) { x.email = novo; if (fone && 'fone' in x) x.fone = fone; m = true; } }); if (m) gravar(k, a); } });
  }
  function salvarDados() {
    const s = sessao(), email = lc(document.getElementById('pf-email').value), foneDig = digitos(document.getElementById('pf-fone').value);
    if (!email || !document.getElementById('pf-email').checkValidity()) return msg('Informe um e-mail válido.', 'erro');
    if (foneDig.length < 10) return msg('Informe um telefone válido, com DDD.', 'erro');
    const { us, i } = achar(s); if (i < 0) return msg('Cadastro não encontrado neste aparelho.', 'erro');
    const fone = fmtFone(foneDig), antigo = lc(s.email);
    if (us.some((u, j) => j !== i && lc(u.email) === email)) return msg('Este e-mail já está em uso por outro cadastro.', 'erro');
    if (us.some((u, j) => j !== i && digitos(u.whats) === foneDig)) return msg('Este telefone já está em uso por outro cadastro.', 'erro');
    us[i] = { ...us[i], email, whats: fone }; if (!gravar(USERS, us)) return msg('Não foi possível salvar.', 'erro');
    if (antigo !== email) migrar(antigo, email, fone); else migrar(antigo, antigo, fone);
    s.email = email; s.whats = fone; store().setItem('ciee_session', JSON.stringify(s));
    if (window.aplicarPerfil) window.aplicarPerfil({ email, whats: fone });
    render('Dados salvos!' + (antigo !== email ? ' Use o novo e-mail para entrar.' : ''));
  }

  /* ---------- senha: confirmação por código (e-mail e/ou telefone) — depende do servidor ---------- */
  function blocoSenha() {
    const a = document.getElementById('pf-senha'); if (!a) return; const s = sessao();
    if (!cieeAPI.disponivel()) {
      a.innerHTML = '<div class="pf-aviso">Para sua segurança, a senha só poderá ser trocada aqui com um <strong>código enviado ao seu e-mail ou telefone</strong>. Esse recurso será liberado quando o servidor do CIEESC PLAY estiver ativo.<br>Se você esqueceu a senha, use <strong>“Recuperar senha”</strong> na tela de acesso.</div><button class="btn-action" disabled style="margin-top:12px">Alterar senha</button>';
      return;
    }
    a.innerHTML = '<button class="btn-action" id="pf-sn-ini">Alterar senha</button><div id="pf-sn-passos"></div>';
    document.getElementById('pf-sn-ini').onclick = () => {
      const opc = []; if (s.email) opc.push(['email', 'E-mail: ' + maskEmail(s.email)]); if (digitos(s.whats).length >= 10) opc.push(['sms', 'Telefone (SMS): ' + maskFone(s.whats)]);
      document.getElementById('pf-sn-passos').innerHTML = '<p style="font-weight:700;margin:12px 0 0">Para onde enviamos o código de confirmação?</p><div class="pf-canais">' + opc.map((o, i) => '<label><input type="radio" name="pf-canal" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '>' + esc(o[1]) + '</label>').join('') + '</div><button class="btn-action btn-reserve" id="pf-sn-env">Enviar código</button>';
      document.getElementById('pf-sn-env').onclick = enviarCodigo;
    };
  }
  async function enviarCodigo() {
    const canal = (document.querySelector('input[name="pf-canal"]:checked') || {}).value, b = document.getElementById('pf-sn-env'); b.disabled = true; msg('Enviando código…');
    try {
      const r = await cieeAPI.solicitarCodigo({ canal }); msg('');
      document.getElementById('pf-sn-passos').innerHTML = '<p style="font-weight:700;margin:12px 0 8px">Enviamos um código de 6 dígitos para <strong>' + esc(r.destino || 'o seu contato') + '</strong>. Ele vale por poucos minutos.</p>' +
        '<div class="form-group"><label for="pf-cod">Código</label><input class="form-input" id="pf-cod" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>' +
        '<div class="form-group"><label for="pf-nova">Nova senha</label><input class="form-input" type="password" id="pf-nova" autocomplete="new-password"><small>Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.</small></div>' +
        '<div class="form-group"><label for="pf-conf">Repita a nova senha</label><input class="form-input" type="password" id="pf-conf" autocomplete="new-password"></div>' +
        '<button class="btn-action btn-reserve" id="pf-sn-ok">Confirmar troca</button> <button class="btn-action" id="pf-sn-cx" style="background:transparent;color:var(--text-dark);border:1px solid var(--border-color)">Cancelar</button>';
      document.getElementById('pf-sn-ok').onclick = confirmarTroca; document.getElementById('pf-sn-cx').onclick = () => { msg(''); blocoSenha(); };
    } catch (e) { b.disabled = false; msg(e.message, 'erro'); }
  }
  async function confirmarTroca() {
    const cod = document.getElementById('pf-cod').value.trim(), n = document.getElementById('pf-nova').value, c = document.getElementById('pf-conf').value;
    if (!/^\d{6}$/.test(cod)) return msg('Digite o código de 6 dígitos.', 'erro');
    if (!senhaOk(n)) return msg('A senha precisa de 8+ caracteres, com maiúscula, minúscula, número e caractere especial.', 'erro');
    if (n !== c) return msg('As senhas não conferem.', 'erro');
    const b = document.getElementById('pf-sn-ok'); b.disabled = true; msg('Confirmando…');
    try { await cieeAPI.trocarSenha({ codigo: cod, novaSenha: n }); render('Senha alterada com sucesso!'); }
    catch (e) { b.disabled = false; msg(e.message, 'erro'); }
  }

  /* ---------- entrada com biometria (Face ID / desbloqueio facial / digital) ---------- */
  async function blocoBio(m) {
    const a = document.getElementById('pf-bio'); if (!a) return; const s = sessao();
    if (window.cieeRecurso && !cieeRecurso('biometria')) { a.innerHTML = '<div class="pf-aviso">A entrada por biometria está desativada no momento pela coordenação.</div>'; return; }
    if (!window.cieeBio || !(await cieeBio.disponivel())) { a.innerHTML = '<div class="pf-aviso">Disponível no celular com reconhecimento facial ou digital ativado. Abra o portal pelo celular para ativar.</div>'; return; }
    const ativo = cieeBio.ativadoPara(s.email);
    a.innerHTML = '<div class="pf-aviso">' + (ativo ? 'Ativada neste aparelho. Na tela de acesso, toque em <strong>Entrar com biometria</strong>.' : 'Entre na próxima vez só com o rosto ou a digital deste celular. O portal não recebe a imagem do seu rosto: quem confere é o próprio aparelho.') + '</div>' +
      (ativo ? '<button type="button" class="btn-action" id="pf-bio-off" style="margin-top:10px">Desativar neste aparelho</button>'
             : '<label for="pf-bio-senha" style="display:block;font-weight:800;margin:10px 0 6px">Confirme sua senha para ativar</label><input class="form-input" type="password" id="pf-bio-senha" autocomplete="current-password"><button type="button" class="btn-action btn-reserve" id="pf-bio-on" style="margin-top:10px">Ativar biometria</button>') +
      '<small id="pf-bio-msg" class="pf-msg ' + (m && m[1] || '') + '" role="status">' + esc(m && m[0] || '') + '</small>';
    const off = document.getElementById('pf-bio-off'); if (off) off.onclick = () => { cieeBio.desativar(s.email); blocoBio(['Biometria desativada neste aparelho.', 'ok']); };
    const on = document.getElementById('pf-bio-on'); if (on) on.onclick = async () => {
      const bm = document.getElementById('pf-bio-msg'), senha = document.getElementById('pf-bio-senha').value, { us, i } = achar(s);
      if (i < 0) { bm.textContent = 'Cadastro não encontrado neste aparelho.'; bm.className = 'pf-msg erro'; return; }
      const c = window.cieeSenha ? await cieeSenha.conferir(senha, us[i].senhaHash) : { ok: false };
      if (!c.ok) { bm.textContent = 'Senha incorreta.'; bm.className = 'pf-msg erro'; return; }
      try { await cieeBio.ativar({ email: s.email, nome: s.nome }); blocoBio(['Biometria ativada! Na próxima vez, toque em "Entrar com biometria".', 'ok']); }
      catch (e) { bm.textContent = e && e.name === 'NotAllowedError' ? 'Ativação cancelada.' : 'Não foi possível ativar: ' + (e.message || e); bm.className = 'pf-msg erro'; }
    };
  }

  /* ---------- montagem ---------- */
  const fmtData = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
  function resumo(s) {                    // parte "ver": dados que o aprendiz só consulta
    const N = window.NIVEIS, nv = s.nivel || 1, linhas = [['Nome', s.nome], ['Cargo', N ? N.cargo[nv] : ''], ['Cidade', s.cidade], ['Dia / período', s.periodo]].concat(s.turmaId ? [['ID da turma', s.turmaId]] : []);
    if (nv === 1) linhas.push(['Início do contrato', fmtData(s.inicio)], ['Validade da carteirinha', fmtData(s.validade)]); else linhas.push(['Validade da carteirinha', 'Vitalícia']);
    return '<dl class="pf-resumo">' + linhas.filter(l => l[1]).map(l => '<div><dt>' + l[0] + '</dt><dd>' + esc(l[1]) + '</dd></div>').join('') + '</dl>';
  }
  /* ---------- Aparência: cor e claro/escuro (só aqui; vale também na tela de acesso e no painel) ---------- */
  const HEX = { blue: '#0056b3', purple: '#6f42c1', pink: '#d63384' };
  function aparencia() {
    let cor = 'blue', esc_ = false; try { cor = localStorage.getItem('ciee_color_theme') || 'blue'; esc_ = localStorage.getItem('ciee_theme') === 'dark'; } catch (e) {}
    return '<h4 style="border-top:0;padding-top:0;margin-top:14px">Aparência</h4><div class="pf-apar">' +
      '<div class="pf-ap-l"><span>Cor</span><div class="pf-dots" role="radiogroup" aria-label="Cor do portal">' + Object.keys(HEX).map(k => '<button type="button" role="radio" aria-checked="' + (k === cor) + '" data-cor="' + k + '" aria-label="' + ({ blue: 'Azul', purple: 'Roxo', pink: 'Rosa' })[k] + '" style="background:' + HEX[k] + '"></button>').join('') + '</div></div>' +
      '<div class="pf-ap-l"><span>Tema</span><div class="pf-modo" role="radiogroup" aria-label="Tema claro ou escuro"><button type="button" role="radio" data-modo="light" aria-checked="' + !esc_ + '">Claro</button><button type="button" role="radio" data-modo="dark" aria-checked="' + esc_ + '">Escuro</button></div></div></div>';
  }
  function ligarAparencia() {
    document.querySelectorAll('#meus-dados [data-cor]').forEach(b => b.onclick = () => {
      try { localStorage.setItem('ciee_color_theme', b.dataset.cor); } catch (e) {}
      if (window.setThemeColor) window.setThemeColor(HEX[b.dataset.cor]);
      document.querySelectorAll('#meus-dados [data-cor]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    });
    document.querySelectorAll('#meus-dados [data-modo]').forEach(b => b.onclick = () => {
      const quer = b.dataset.modo === 'dark';
      try { localStorage.setItem('ciee_theme', quer ? 'dark' : 'light'); } catch (e) {}
      if (window.toggleTheme && document.body.classList.contains('dark-mode') !== quer) window.toggleTheme();
      document.querySelectorAll('#meus-dados [data-modo]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    });
  }
  function render(aviso) {
    const box = caixa(); if (!box) return; const s = sessao(); if (!s) return;
    if (!ehAprendiz(s)) { box.innerHTML = resumo(s) + aparencia() + '<div class="pf-aviso" style="margin-top:14px">Seu acesso é da equipe (ByPass). Foto, nome e senha da equipe são gerenciados pelo administrador no painel.</div>'; ligarAparencia(); return; }
    const foto = s.foto ? '<img src="' + esc(s.foto) + '" alt="Sua foto">' : '<span style="font:700 1.9rem Fredoka,cursive;color:var(--theme-primary)">' + esc(ini(s.nome)) + '</span>';
    box.innerHTML = resumo(s) + aparencia() + '<h4>Editar meus dados</h4><div class="pf-linha"><div class="pf-foto">' + foto + '</div><div><button class="btn-action" id="pf-foto-btn" type="button">Alterar foto</button><input type="file" id="pf-foto-in" accept="image/*" hidden><small>JPG ou PNG, até 5 MB. A foto é recortada em quadrado e aparece na carteirinha.</small></div></div>' +
      '<div class="form-group"><label>Nome</label><input class="form-input" value="' + esc(s.nome) + '" readonly aria-readonly="true"><small>Para corrigir o nome, fale com a coordenação.</small></div>' +
      '<div class="form-group"><label for="pf-email">E-mail</label><input class="form-input" type="email" id="pf-email" value="' + esc(s.email) + '" autocapitalize="off" spellcheck="false" autocomplete="email"></div>' +
      '<div class="form-group"><label for="pf-fone">Telefone (WhatsApp)</label><input class="form-input" type="tel" id="pf-fone" value="' + esc(s.whats) + '" autocomplete="tel" placeholder="(48) 99999-9999"><small>O e-mail e o telefone também servem para entrar no portal.</small></div>' +
      '<button class="btn-action btn-reserve" id="pf-salvar" type="button">Salvar dados</button><small id="pf-msg" class="pf-msg" role="status"></small>' +
      '<h4>Senha</h4><div id="pf-senha"></div>' +
      '<h4>Entrada com biometria</h4><div id="pf-bio"></div>';
    document.getElementById('pf-foto-btn').onclick = () => document.getElementById('pf-foto-in').click();
    document.getElementById('pf-foto-in').onchange = e => { if (e.target.files[0]) trocarFoto(e.target.files[0]); e.target.value = ''; };
    document.getElementById('pf-fone').oninput = e => { e.target.value = fmtFone(e.target.value); };
    document.getElementById('pf-salvar').onclick = salvarDados;
    blocoSenha(); ligarAparencia(); blocoBio(); if (aviso) msg(aviso, 'ok');
  }


  /* ---------- bloco usado pelo painel admin (mesma foto, e-mail e telefone do "Meu perfil") ---------- */
  const campoAdm = 'width:100%;padding:10px;border-radius:10px;border:2px solid var(--border-color);background:var(--input-bg);color:var(--text-dark)';
  function blocoAdmin(u) {
    const foto = u.foto ? '<img src="' + esc(u.foto) + '" alt="Foto">' : '<span style="font:700 1.9rem Fredoka,cursive;color:var(--primary,#0056b3)">' + esc(ini(u.nome)) + '</span>';
    return '<div class="pf-bloco"><div class="pf-linha"><div class="pf-foto" id="adm-pf-prev">' + foto + '</div><div><button type="button" class="btn-action btn-primary" id="adm-pf-btn">Alterar foto</button><input type="file" id="adm-pf-in" accept="image/*" hidden><small id="adm-pf-msg">JPG ou PNG, até 5 MB. A foto é recortada em quadrado.</small></div></div>' +
      '<label style="font-weight:800;font-size:.85rem;display:block;margin:6px 0 4px" for="adm-pf-email">E-mail</label><input type="email" id="adm-pf-email" value="' + esc(u.email) + '" autocapitalize="off" spellcheck="false" style="' + campoAdm + '">' +
      '<label style="font-weight:800;font-size:.85rem;display:block;margin:10px 0 4px" for="adm-pf-fone">Telefone (WhatsApp)</label><input type="tel" id="adm-pf-fone" value="' + esc(u.whats) + '" placeholder="(48) 99999-9999" style="' + campoAdm + '">' +
      '<div class="pf-aviso" style="margin-top:12px">A <strong>senha</strong> só o próprio aprendiz troca, com um código enviado ao e-mail ou telefone (quando o servidor estiver ativo).</div></div>';
  }
  // liga os botões do bloco; aoFoto recebe a nova foto (data URL)
  function ligarBlocoAdmin(aoFoto) {
    const b = document.getElementById('adm-pf-btn'), inp = document.getElementById('adm-pf-in'), f = document.getElementById('adm-pf-fone'), m = document.getElementById('adm-pf-msg'); if (!b) return;
    b.onclick = () => inp.click();
    inp.onchange = async e => { const arq = e.target.files[0]; e.target.value = ''; if (!arq) return;
      try { const url = await processarFoto(arq); document.getElementById('adm-pf-prev').innerHTML = '<img src="' + url + '" alt="Foto">'; m.textContent = 'Foto pronta. Clique em “Salvar dados”.'; aoFoto(url); }
      catch (er) { m.textContent = er.message; } };
    f.oninput = e => { e.target.value = fmtFone(e.target.value); };
  }

  window.cieePerfil = { blocoAdmin, ligarBlocoAdmin, fmtFone, digitos, render, migrar, processarFoto, mascararEmail: maskEmail, mascararFone: maskFone };
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', () => render());
})();
