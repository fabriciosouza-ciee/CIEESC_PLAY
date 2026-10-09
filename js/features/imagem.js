/* CIEESC PLAY — editor de imagem de capa (livros físicos e digitais)
   cieeImagem.editar({ titulo, atual, onOk(dataUrl), onRemover() })
   O usuário escolhe uma foto e formata: arrasta para enquadrar, zoom (controle, roda do mouse ou pinça), gira 90°,
   escolhe "Preencher" (corta as bordas) ou "Encaixar" (mostra a capa inteira com fundo) e ajusta o brilho.
   Saída: JPEG 300×450 (proporção 2:3) leve o bastante para ficar guardado no navegador. Tudo acontece no aparelho. */
(function () {
  const W = 300, H = 450, MAX_MB = 8;
  const css = document.createElement('style');
  css.textContent = `#img-ed{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(10,14,28,.78)}
  #img-ed .ie-caixa{width:min(620px,100%);max-height:96vh;overflow:auto;background:var(--white,var(--bg-card,#fff));color:var(--text-dark,#1f2937);border-radius:20px;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,.5)}
  #img-ed h3{margin:0 0 4px;font:700 1.2rem 'Fredoka',sans-serif}#img-ed p{margin:0 0 10px;font:700 .86rem/1.4 'Nunito',sans-serif;color:var(--text-muted,#64748b)}
  #img-ed .ie-corpo{display:grid;grid-template-columns:minmax(0,230px) 1fr;gap:16px;align-items:start}
  @media (max-width:560px){#img-ed .ie-corpo{grid-template-columns:1fr}#img-ed .ie-palco{margin:0 auto}}
  #img-ed .ie-palco{position:relative;width:min(230px,100%);aspect-ratio:2/3;border-radius:12px;overflow:hidden;background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/16px 16px;touch-action:none;cursor:grab;box-shadow:0 0 0 2px var(--border-color,#e2e8f0)}
  #img-ed .ie-palco.arrastando{cursor:grabbing}#img-ed canvas{width:100%;height:100%;display:block}
  #img-ed .ie-vazio{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:14px;font:800 .85rem 'Nunito',sans-serif;color:#64748b}
  #img-ed .ie-ctl{display:flex;flex-direction:column;gap:12px}
  #img-ed label.ie-l{display:block;font:800 .8rem 'Nunito',sans-serif;letter-spacing:.4px;text-transform:uppercase;color:var(--text-muted,#64748b);margin-bottom:4px}
  #img-ed input[type=range]{width:100%;accent-color:var(--theme-primary,#0056b3)}
  #img-ed .ie-seg{display:flex;border:1px solid var(--border-color,#e2e8f0);border-radius:999px;overflow:hidden}
  #img-ed .ie-seg button{flex:1;border:0;background:transparent;color:var(--text-dark,#1f2937);font:800 .85rem 'Nunito',sans-serif;padding:9px 6px;cursor:pointer}
  #img-ed .ie-seg button[aria-pressed="true"]{background:var(--theme-primary,#0056b3);color:#fff}
  #img-ed .ie-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:8px 14px;border-radius:12px;border:2px solid var(--border-color,#e2e8f0);background:transparent;color:var(--text-dark,#1f2937);font:800 .88rem 'Nunito',sans-serif;cursor:pointer}
  #img-ed .ie-b.pri{background:var(--theme-primary,#0056b3);border-color:var(--theme-primary,#0056b3);color:#fff}
  #img-ed .ie-b.perigo{color:#dc2626;border-color:#dc2626}#img-ed .ie-b[disabled]{opacity:.45;cursor:not-allowed}
  #img-ed .ie-linha{display:flex;gap:8px;flex-wrap:wrap}#img-ed .ie-linha .ie-b{flex:1 1 120px}
  #img-ed .ie-rod{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;justify-content:flex-end}#img-ed .ie-rod .ie-b{flex:1 1 130px;max-width:200px}
  #img-ed .ie-msg{min-height:1.2em;margin-top:8px;font:800 .85rem 'Nunito',sans-serif;color:#dc2626}`;
  document.head.appendChild(css);

  function editar(op) {
    op = op || {}; fechar();
    const box = document.createElement('div'); box.id = 'img-ed'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ie-tit');
    box.innerHTML = `<div class="ie-caixa"><h3 id="ie-tit">${op.titulo || 'Imagem do livro'}</h3><p>Escolha uma foto da capa e ajuste: arraste para enquadrar, use o zoom e gire se precisar.</p>
      <div class="ie-corpo"><div class="ie-palco" id="ie-palco"><canvas id="ie-cv" width="${W}" height="${H}" aria-label="Prévia da capa"></canvas><div class="ie-vazio" id="ie-vazio">Nenhuma imagem escolhida</div></div>
      <div class="ie-ctl">
        <div class="ie-linha"><label class="ie-b pri" for="ie-arq">Escolher imagem</label><input type="file" id="ie-arq" accept="image/*" hidden><label class="ie-b" for="ie-cam">Tirar foto</label><input type="file" id="ie-cam" accept="image/*" capture="environment" hidden></div>
        <div><label class="ie-l" for="ie-zoom">Zoom</label><input type="range" id="ie-zoom" min="1" max="4" step="0.01" value="1" disabled></div>
        <div><label class="ie-l" for="ie-bri">Brilho</label><input type="range" id="ie-bri" min="60" max="140" step="1" value="100" disabled></div>
        <div><span class="ie-l">Ajuste</span><div class="ie-seg" role="group" aria-label="Ajuste da imagem"><button type="button" id="ie-cobrir" aria-pressed="true">Preencher</button><button type="button" id="ie-conter" aria-pressed="false">Encaixar</button></div></div>
        <div class="ie-linha"><button type="button" class="ie-b" id="ie-girar" disabled>Girar 90°</button><button type="button" class="ie-b" id="ie-centro" disabled>Centralizar</button></div>
        <div class="ie-msg" id="ie-msg" role="status"></div>
      </div></div>
      <div class="ie-rod">${op.onRemover ? '<button type="button" class="ie-b perigo" id="ie-rem">Remover imagem</button>' : ''}<button type="button" class="ie-b" id="ie-canc">Cancelar</button><button type="button" class="ie-b pri" id="ie-ok" disabled>Usar imagem</button></div></div>`;
    document.body.appendChild(box);
    const $ = id => box.querySelector('#' + id), cv = $('ie-cv'), g = cv.getContext('2d'), palco = $('ie-palco');
    let img = null, rot = 0, zoom = 1, ox = 0, oy = 0, modo = 'cobrir', brilho = 100, fundo = '#ffffff';
    const msg = t => { $('ie-msg').textContent = t || ''; };
    const dims = () => (rot % 180 ? [img.height, img.width] : [img.width, img.height]);
    const base = () => { const [iw, ih] = dims(); return modo === 'cobrir' ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih); };
    function limitar() {
      const [iw, ih] = dims(), s = base() * zoom, w = iw * s, h = ih * s;
      const mx = Math.max(0, (w - W) / 2), my = Math.max(0, (h - H) / 2);
      ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy));
      if (w <= W) ox = 0; if (h <= H) oy = 0;
    }
    function desenhar() {
      g.clearRect(0, 0, W, H); g.fillStyle = fundo; g.fillRect(0, 0, W, H);
      if (!img) return; limitar();
      const s = base() * zoom; g.save(); g.filter = 'brightness(' + brilho + '%)';
      g.translate(W / 2 + ox, H / 2 + oy); g.rotate(rot * Math.PI / 180); g.scale(s, s); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
    }
    function carregar(src) {
      const i = new Image(); i.onload = () => {
        img = i; rot = 0; zoom = 1; ox = oy = 0; brilho = 100;
        // cor de fundo do modo "Encaixar" = cor média da borda da imagem
        try { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(i, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; fundo = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')'; } catch (e) { fundo = '#ffffff'; }
        ['ie-zoom', 'ie-bri', 'ie-girar', 'ie-centro', 'ie-ok'].forEach(id => { $(id).disabled = false; }); $('ie-zoom').value = 1; $('ie-bri').value = 100; $('ie-vazio').style.display = 'none'; msg(''); desenhar();
      };
      i.onerror = () => msg('Não foi possível abrir esta imagem.'); i.src = src;
    }
    function arquivo(f) {
      if (!f) return; if (!/^image\//.test(f.type)) return msg('Escolha um arquivo de imagem.');
      if (f.size > MAX_MB * 1048576) return msg('A imagem passa de ' + MAX_MB + ' MB. Escolha uma menor.');
      const r = new FileReader(); r.onload = () => carregar(r.result); r.onerror = () => msg('Não foi possível ler o arquivo.'); r.readAsDataURL(f);
    }
    $('ie-arq').onchange = e => arquivo(e.target.files[0]); $('ie-cam').onchange = e => arquivo(e.target.files[0]);
    $('ie-zoom').oninput = e => { zoom = +e.target.value; desenhar(); };
    $('ie-bri').oninput = e => { brilho = +e.target.value; desenhar(); };
    $('ie-girar').onclick = () => { rot = (rot + 90) % 360; ox = oy = 0; desenhar(); };
    $('ie-centro').onclick = () => { ox = oy = 0; zoom = 1; $('ie-zoom').value = 1; desenhar(); };
    const setModo = m => { modo = m; ox = oy = 0; $('ie-cobrir').setAttribute('aria-pressed', String(m === 'cobrir')); $('ie-conter').setAttribute('aria-pressed', String(m === 'conter')); desenhar(); };
    $('ie-cobrir').onclick = () => setModo('cobrir'); $('ie-conter').onclick = () => setModo('conter');
    // arrastar e pinça (mouse, toque e caneta)
    const pts = new Map(); let dist0 = 0, zoom0 = 1;
    palco.addEventListener('pointerdown', e => { if (!img) return; palco.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); palco.classList.add('arrastando'); if (pts.size === 2) { const [a, b] = [...pts.values()]; dist0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
    palco.addEventListener('pointermove', e => {
      if (!img || !pts.has(e.pointerId)) return; const ant = pts.get(e.pointerId), esc = W / palco.clientWidth;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (dist0) { zoom = Math.max(1, Math.min(4, zoom0 * d / dist0)); $('ie-zoom').value = zoom; } }
      else { ox += (e.clientX - ant.x) * esc; oy += (e.clientY - ant.y) * esc; }
      desenhar();
    });
    const solta = e => { pts.delete(e.pointerId); if (!pts.size) palco.classList.remove('arrastando'); dist0 = 0; };
    palco.addEventListener('pointerup', solta); palco.addEventListener('pointercancel', solta);
    palco.addEventListener('wheel', e => { if (!img) return; e.preventDefault(); zoom = Math.max(1, Math.min(4, zoom * (e.deltaY < 0 ? 1.08 : 0.92))); $('ie-zoom').value = zoom; desenhar(); }, { passive: false });
    palco.tabIndex = 0;
    palco.addEventListener('keydown', e => { if (!img) return; const p = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key]; if (p) { e.preventDefault(); ox += p[0]; oy += p[1]; desenhar(); } });
    $('ie-canc').onclick = fechar;
    box.addEventListener('mousedown', e => { if (e.target === box) fechar(); });
    if ($('ie-rem')) $('ie-rem').onclick = () => { fechar(); op.onRemover && op.onRemover(); };
    $('ie-ok').onclick = () => { if (!img) return; desenhar(); const url = cv.toDataURL('image/jpeg', 0.8); fechar(); op.onOk && op.onOk(url); };
    if (op.atual) carregar(op.atual);
    setTimeout(() => $('ie-canc').focus(), 40);
  }
  function fechar() { const b = document.getElementById('img-ed'); if (b) b.remove(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('img-ed')) { e.preventDefault(); e.stopPropagation(); fechar(); } }, true);
  window.cieeImagem = { editar, fechar };
})();
