/* CIEESC PLAY — "x" para limpar o texto nos campos de busca (portal e painel)
   Aparece no canto do campo quando há texto. Funciona também nos campos criados depois (listas do painel).
   Não mexe no layout: o "x" é um desenho no fundo do próprio campo, e o toque nele limpa e refaz a busca. */
(function () {
  const SEL = 'input.search-bar, input.search-input';
  const ZONA = 42;                                              // largura (px) da área do "x", na borda direita do campo
  const css = document.createElement('style');
  const x = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#8a94a6"/><path d="M6.6 6.6l6.8 6.8M13.4 6.6l-6.8 6.8" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/></svg>');
  css.textContent = `input.search-bar:not(:placeholder-shown), input.search-input:not(:placeholder-shown) {
    background-image: url("data:image/svg+xml,${x}"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px 18px; padding-right: 42px !important; }
    input.search-bar::-webkit-search-cancel-button, input.search-input::-webkit-search-cancel-button { display: none; }`;
  document.head.appendChild(css);

  const dentro = (el, ev) => {
    if (!el.value) return false;
    const r = el.getBoundingClientRect(), rtl = getComputedStyle(el).direction === 'rtl';
    return rtl ? ev.clientX <= r.left + ZONA : ev.clientX >= r.right - ZONA;
  };
  function limpar(el) {
    el.value = '';
    ['input', 'keyup', 'change'].forEach(t => el.dispatchEvent(t === 'keyup' ? new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true }) : new Event(t, { bubbles: true })));
    el.focus();
  }
  document.addEventListener('pointerdown', ev => {
    const el = ev.target; if (!el || !el.matches || !el.matches(SEL) || !dentro(el, ev)) return;
    ev.preventDefault(); limpar(el);
  }, true);
  document.addEventListener('pointermove', ev => {
    const el = ev.target; if (!el || !el.matches || !el.matches(SEL)) return;
    el.style.cursor = dentro(el, ev) ? 'pointer' : '';
  }, true);
  document.addEventListener('keydown', ev => {                 // Esc também limpa (teclado)
    const el = ev.target; if (ev.key !== 'Escape' || !el || !el.matches || !el.matches(SEL) || !el.value) return;
    ev.preventDefault(); ev.stopPropagation(); limpar(el);
  }, true);
})();
