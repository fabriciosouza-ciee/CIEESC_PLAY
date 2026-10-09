/* CIEESC PLAY — lixeira e backup de conteúdo (carregado só no painel)
   Tudo o que é excluído dos cadastros e conteúdos fica guardado em uma lixeira por 90 dias. O Webmaster restaura em
   Painel › Sistema › Restaurar conteúdo (com a senha de administrador). Também gera e lê um arquivo de backup.
   Como funciona: a página continua gravando como sempre; este arquivo só observa a gravação, compara a lista de antes
   com a de depois e guarda uma cópia do que sumiu (e quem fez). Nada aqui apaga ou altera os dados do site. */
(function () {
  if (window.cieeLixeira) return;
  const P = Storage.prototype, nGet = P.getItem, nSet = P.setItem, nRem = P.removeItem;
  const LS = window.localStorage;
  const K = 'ciee_lixeira', K_BK = 'ciee_backup_ultimo';
  const DIAS = 90, MAX_EVENTOS = 300, GRANDE = 150000;

  // o que é vigiado (nome mostrado ao Webmaster)
  const TIPOS = {
    ciee_acervo: 'Livro do acervo', ciee_categorias: 'Categoria do acervo', ciee_livros_digitais: 'Livro digital', ciee_guias: 'Guia ou manual',
    ciee_mural: 'Postagem do mural', ciee_calendario: 'Evento do calendário', ciee_faq: 'Dúvida frequente', ciee_artes: 'Arte em foco',
    ciee_objetos_achados: 'Achados e perdidos', ciee_turmas: 'Turma', ciee_cidades: 'Cidade', ciee_representantes: 'Representante de turma',
    ciee_monitores: 'Monitor(a)', ciee_orientadores: 'Orientador(a)', ciee_administrativo: 'Contato administrativo', ciee_users: 'Cadastro de aprendiz',
    ciee_codigos_acesso: 'Acesso ByPass', ciee_versoes: 'Versão do sistema', ciee_historico_decisoes: 'Histórico geral'
  };
  // listas de trabalho do dia a dia (mudam o tempo todo): só entram na lixeira quando alguém usa "Limpar" nas Configurações
  const EXTRA = { ciee_emprestimos: 'Empréstimo', ciee_solicitacoes: 'Solicitação', ciee_solicitacoes_exclusao: 'Solicitação de exclusão' };
  const NOME = Object.assign({}, TIPOS, EXTRA);
  const BACKUP = Object.keys(TIPOS).concat(['ciee_emprestimos']);
  const IDF = { ciee_users: ['email'], ciee_categorias: ['prefixo'], ciee_codigos_acesso: ['id', 'senha'] };

  const lerJ = (k) => { try { const v = JSON.parse(nGet.call(LS, k)); return v == null ? null : v; } catch (e) { return null; } };
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).sort().map(x => JSON.stringify(x) + ':' + canon(v[x])).join(',') + '}';
  }
  function chave(k, it) {
    if (it && typeof it === 'object' && !Array.isArray(it)) {
      for (const c of (IDF[k] || ['_id', 'id'])) if (it[c] != null && it[c] !== '') return 'i:' + c + ':' + String(it[c]).toLowerCase();
      return 'j:' + canon(it);
    }
    return 's:' + String(it);
  }
  const temId = (k, it) => chave(k, it).charAt(0) === 'i';

  function sessao() {
    try { return JSON.parse(nGet.call(LS, 'ciee_session') || sessionStorage.getItem('ciee_session') || 'null') || {}; } catch (e) { return {}; }
  }
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- armazenamento da lixeira ----------
  function lista() {
    const a = lerJ(K); if (!Array.isArray(a)) return [];
    const limite = Date.now() - DIAS * 864e5;
    return a.filter(e => e && e.k && Array.isArray(e.itens) && e.itens.length && (e.quando || 0) > limite);
  }
  function enxuto(it) {                     // arquivos enormes (fotos, PDFs) saem só se faltar espaço
    if (typeof it === 'string') return it.length > GRANDE ? '' : it;
    if (!it || typeof it !== 'object') return it;
    const o = Array.isArray(it) ? [] : {};
    for (const x in it) o[x] = enxuto(it[x]);
    return o;
  }
  function gravar(a) {
    a = a.slice(0, MAX_EVENTOS);
    for (let t = 0; t < 400; t++) {
      try { nSet.call(LS, K, JSON.stringify(a)); return true; }
      catch (e) {
        if (a.length > 1) a.pop();                               // falta espaço: sai o evento mais antigo
        else if (a.length === 1 && !a[0].enxuto) { a[0] = Object.assign({}, a[0], { enxuto: true, itens: a[0].itens.map(i => ({ i: enxuto(i.i), p: i.p })) }); }
        else return false;
      }
    }
    return false;
  }
  function guardarEvento(k, itens, nota) {
    if (!itens.length) return;
    const s = sessao();
    const ev = { id: uid(), k, quando: Date.now(), quem: s.nome || 'Desconhecido', nivel: s.nivel || 0, nota: nota || '', itens };
    gravar([ev].concat(lista()));
  }

  // ---------- observação das gravações ----------
  function removidos(k, antes, depois) {
    const cont = new Map();
    depois.forEach(it => { const c = chave(k, it); cont.set(c, (cont.get(c) || 0) + 1); });
    const sai = [];
    antes.forEach((it, p) => { const c = chave(k, it), n = cont.get(c) || 0; if (n > 0) cont.set(c, n - 1); else sai.push({ i: it, p }); });
    return sai;
  }
  function observar(k, antesTxt, depoisTxt) {
    if (antesTxt === depoisTxt || antesTxt == null) return;
    let antes; try { antes = JSON.parse(antesTxt); } catch (e) { return; }
    if (!Array.isArray(antes) || !antes.length) return;
    let depois = []; if (depoisTxt != null) { try { depois = JSON.parse(depoisTxt); } catch (e) { return; } if (!Array.isArray(depois)) return; }
    const sai = removidos(k, antes, depois);
    if (!sai.length) return;
    // lista sem identificador: trocar 1 item por outro é uma edição — guarda como "versão anterior"
    const entrou = depois.length - (antes.length - sai.length);
    const nota = (entrou > 0 && entrou === sai.length && sai.length <= 3 && !sai.some(x => temId(k, x.i))) ? 'Versão anterior (editado)' : '';
    guardarEvento(k, sai, nota);
  }
  let pausa = 0;
  P.setItem = function (k, v) {
    if (this !== LS || pausa || !TIPOS[k]) return nSet.apply(this, arguments);
    const antes = nGet.call(LS, k);
    const r = nSet.apply(this, arguments);
    try { observar(k, antes, String(v)); } catch (e) {}
    return r;
  };
  P.removeItem = function (k) {
    if (this !== LS || pausa || !TIPOS[k]) return nRem.apply(this, arguments);
    const antes = nGet.call(LS, k);
    const r = nRem.apply(this, arguments);
    try { observar(k, antes, null); } catch (e) {}
    return r;
  };

  // ---------- rótulo legível ----------
  const CAMPOS = ['titulo', 'nome', 'pergunta', 'livro', 'assunto', 'acao', 'perfil', 'versao', 'texto', 'codigo', 'email'];
  function rotulo(k, it) {
    if (it == null) return '(vazio)';
    if (typeof it !== 'object') return String(it);
    const g = c => (it[c] == null ? '' : String(it[c]).trim());
    let r = '';
    if (k === 'ciee_categorias') r = (g('prefixo') + ' ' + g('nome')).trim();
    else if (k === 'ciee_turmas') r = [g('codId'), g('diaPeriodo'), g('cidade')].filter(Boolean).join(' · ');
    else if (k === 'ciee_users') r = [g('nome'), g('email')].filter(Boolean).join(' · ');
    else if (k === 'ciee_emprestimos') r = [g('livro'), g('aprendiz')].filter(Boolean).join(' — ');
    else if (k === 'ciee_historico_decisoes') r = [g('acao'), g('aprendiz'), g('data')].filter(Boolean).join(' · ');
    else if (k === 'ciee_calendario') r = [g('titulo') || g('nome'), g('data')].filter(Boolean).join(' · ');
    else if (k === 'ciee_acervo') r = [g('titulo'), g('autor')].filter(Boolean).join(' — ');
    if (!r) for (const c of CAMPOS) { if (g(c)) { r = g(c); break; } }
    return (r || 'Item sem nome').slice(0, 140);
  }

  // ---------- restaurar ----------
  // sel: [{ k, itens:[{i,p}], ev?: id do evento da lixeira }]  →  { ok, ignorados }
  function restaurar(sel) {
    let ok = 0, ignorados = 0;
    pausa++;
    try {
      const lix = lista(); let mexeu = false;
      sel.forEach(s => {
        if (!TIPOS[s.k] && !EXTRA[s.k]) return;
        const atual = lerJ(s.k); const arr = Array.isArray(atual) ? atual : [];
        const tem = new Set(arr.map(x => chave(s.k, x)));
        const feitos = new Set();
        s.itens.slice().sort((a, b) => (a.p || 0) - (b.p || 0)).forEach(x => {
          const c = chave(s.k, x.i);
          if (tem.has(c)) { ignorados++; feitos.add(x); return; }
          arr.splice(Math.max(0, Math.min(x.p == null ? arr.length : x.p, arr.length)), 0, x.i); tem.add(c); ok++; feitos.add(x);
        });
        nSet.call(LS, s.k, JSON.stringify(arr));
        if (s.ev) {
          const ev = lix.find(e => e.id === s.ev);
          if (ev) { ev.itens = ev.itens.filter(it => !s.itens.some(x => x.p === it.p && chave(s.k, x.i) === chave(s.k, it.i))); mexeu = true; }
        }
      });
      if (mexeu) gravar(lix.filter(e => e.itens.length));
    } finally { pausa--; }
    return { ok, ignorados };
  }

  // ---------- backup em arquivo ----------
  function gerarBackup() {
    const dados = {};
    BACKUP.forEach(k => { const v = lerJ(k); if (Array.isArray(v)) dados[k] = v; });
    const s = sessao();
    try { nSet.call(LS, K_BK, JSON.stringify({ quando: Date.now(), quem: s.nome || '' })); } catch (e) {}
    return { formato: 'ciee-play-backup', versao: 1, geradoEm: new Date().toISOString(), por: s.nome || '', dados };
  }
  // lê o arquivo e diz o que existe nele e não existe mais aqui
  function analisarBackup(obj) {
    if (!obj || obj.formato !== 'ciee-play-backup' || !obj.dados || typeof obj.dados !== 'object') throw new Error('Este arquivo não é um backup do CIEESC PLAY.');
    const grupos = [];
    BACKUP.forEach(k => {
      const arq = obj.dados[k]; if (!Array.isArray(arq)) return;
      const bons = arq.map((it, p) => ({ i: it, p })).filter(x => x.i != null && (typeof x.i !== 'object' || (!Array.isArray(x.i))));
      const atual = lerJ(k); const tem = new Set((Array.isArray(atual) ? atual : []).map(x => chave(k, x)));
      const falta = bons.filter(x => !tem.has(chave(k, x.i)));
      if (falta.length) grupos.push({ k, itens: falta });
    });
    return grupos;
  }
  const ultimoBackup = () => lerJ(K_BK);

  window.cieeLixeira = {
    TIPOS: NOME, rotulo, eventos: lista,
    guardar: (k, nota) => { const v = lerJ(k); if (Array.isArray(v) && v.length) guardarEvento(k, v.map((i, p) => ({ i, p })), nota || 'Limpeza'); },
    restaurar, gerarBackup, analisarBackup, ultimoBackup,
    esvaziar: () => { try { nRem.call(LS, K); } catch (e) {} },
    dias: DIAS
  };
  // limpeza dos itens com mais de 90 dias
  try { const a = lerJ(K); if (Array.isArray(a) && a.length !== lista().length) gravar(lista()); } catch (e) {}
})();
