/* CIEESC PLAY — atalhos de teclado em todas as páginas
   ESC   → fecha janelinhas e aciona Voltar / Cancelar / Desfazer / Fechar
   ENTER → aciona OK / Confirmar / Enviar / Concluir / Prosseguir / Continuar / Salvar... (janelinhas e formulários)
   Respeita os atalhos que a própria página já trata (não duplica) e nunca age sobre botões, links ou campos de texto longo. */
(function () {
  const CANCELAR = /(cancelar|fechar|voltar|desfazer|agora não|dispensar|não excluir|\bnão\b|✕|×)/i;
  const CANCELAR_PAGINA = /^(voltar|cancelar|desfazer|fechar)\b/i;
  const PRINCIPAL_PAGINA = /^(?:tudo certo!\s*)?(prosseguir|continuar|avançar|concluir|finalizar|enviar|salvar|confirmar|criar senha|ir para os termos|ok|cadastrar|criar)\b/i;
  const MODAIS = '#custom-modal-overlay, .modal-overlay, .rv-overlay, #recover-modal, #ck-modal, [role="dialog"], [role="alertdialog"]';
  const IGNORAR = '#m-sheet, #acb-panel';

  const limpa = s => String(s || '').replace(/^[^A-Za-zÀ-ÿ0-9✕×]+/, '').trim();
  const texto = b => limpa(b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || b.title || '');
  function visivel(el) {
    if (!el || el.disabled || el.hidden) return false;
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none' && parseFloat(cs.opacity || '1') > 0.05;
  }
  const botoes = raiz => [...raiz.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], a.btn')].filter(visivel);

  function modalAberto() {
    const abertos = [...document.querySelectorAll(MODAIS)].filter(e => !e.matches(IGNORAR) && visivel(e));
    if (!abertos.length) return null;
    return abertos.sort((a, b) => (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0)).pop();
  }
  const botaoCancelar = m => botoes(m).find(b => CANCELAR.test(texto(b)));
  function botaoOk(m) {
    const bs = botoes(m);
    const marcado = bs.find(b => b.id === 'modal-btn-confirm' || b.hasAttribute('data-confirm') || /\b(btn-primary|primary)\b/.test(b.className));
    if (marcado) return marcado;
    const nao = bs.filter(b => !CANCELAR.test(texto(b)));
    return nao.length ? nao[nao.length - 1] : null;
  }

  function contexto() {
    const sc = document.getElementById('scene');
    if (sc) {
      const lado = sc.dataset.side;
      const f = document.querySelector(lado === 'login' ? '.card-left' : lado === 'register' ? '.card-right' : '.card-front');
      if (f) return f;
    }
    return document.querySelector('.admin-section.active, .tab-section.active') || document.querySelector('main') || document.body;
  }

  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.isComposing || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== 'Escape' && e.key !== 'Enter') return;
    const t = e.target, tag = (t.tagName || '').toLowerCase();
    const m = modalAberto();

    // ---------- ESC ----------
    if (e.key === 'Escape') {
      if (m) {
        const c = botaoCancelar(m), todos = botoes(m);
        const alvo = c || (todos.length === 1 ? todos[0] : null);
        if (alvo) { e.preventDefault(); alvo.click(); }
        return;
      }
      const cand = botoes(contexto()).find(b => CANCELAR_PAGINA.test(texto(b)));
      if (cand) { e.preventDefault(); cand.click(); }
      return;
    }

    // ---------- ENTER ----------
    if (['textarea', 'button', 'a', 'select', 'summary'].includes(tag) || t.isContentEditable) return;
    if (m) {
      if (m.hasAttribute('data-sem-enter')) return;               // ex.: escolha de cookies (aceite sempre explícito)
      const ok = botaoOk(m);
      if (ok) { e.preventDefault(); ok.click(); }
      return;
    }
    if (tag !== 'input') return;
    const tipo = (t.type || 'text').toLowerCase();
    if (!['text', 'email', 'password', 'tel', 'number', 'date', 'search', 'url'].includes(tipo)) return;
    if (t.form && t.form.querySelector('button[type="submit"], input[type="submit"], button:not([type])')) return;   // o formulário envia sozinho
    const area = t.closest('form, .panel, .modal-box, .rv-card, .page, .step, .card-face, section') || contexto();
    const cand = botoes(area).filter(b => PRINCIPAL_PAGINA.test(texto(b)));
    if (cand.length === 1) { e.preventDefault(); cand[0].click(); }
  });
})();
