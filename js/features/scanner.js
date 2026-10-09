/* CIEESC PLAY — leitor de código de barras (ISBN do livro ou código da etiqueta)
   Funciona no celular e no computador (câmera traseira ou webcam).
   1) Usa o leitor nativo do navegador (BarcodeDetector) quando existe: Chrome no Android, Mac e Chromebook.
   2) Nos outros (iPhone, Windows, Linux), carrega a biblioteca ZXing (js/vendor/zxing.js, MIT) só na hora de ler.
   Sem câmera ou sem permissão: dá para enviar uma FOTO do código ou digitar o número.
   As imagens da câmera são lidas no próprio aparelho: nada é enviado para fora. */
(function () {
  const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
  let zx = null, carregandoZx = null;

  const css = document.createElement('style');
  css.textContent = `#scn{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(10,14,28,.78)}
  #scn .scn-caixa{color-scheme:light dark;width:min(560px,100%);max-height:96vh;overflow:auto;background:var(--bg-card,var(--white,#fff));color:var(--text-dark,#1f2937);border-radius:20px;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
  #scn h3{margin:0 0 4px;font:700 1.2rem 'Fredoka',sans-serif}#scn p{margin:0 0 10px;font:700 .88rem/1.4 'Nunito',sans-serif;color:var(--text-muted,#64748b)}
  #scn .scn-video{position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:4/3}
  #scn video{width:100%;height:100%;object-fit:cover;display:block}
  #scn .scn-mira{position:absolute;left:10%;right:10%;top:30%;bottom:30%;border:3px solid rgba(255,255,255,.9);border-radius:14px;box-shadow:0 0 0 999px rgba(0,0,0,.35)}
  #scn .scn-linha{position:absolute;left:12%;right:12%;top:50%;height:2px;background:#ff4d6d;box-shadow:0 0 10px #ff4d6d;animation:scnLinha 1.6s ease-in-out infinite alternate}
  @keyframes scnLinha{from{top:33%}to{top:67%}}
  #scn .scn-st{min-height:1.3em;margin:10px 0 0;font:800 .9rem 'Nunito',sans-serif;color:var(--text-dark,#1f2937)}#scn .scn-st.erro{color:#dc2626}#scn .scn-st.ok{color:#15803d}
  #scn .scn-acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  #scn .scn-acoes button,#scn .scn-acoes label{flex:1 1 150px;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:10px 12px;border-radius:12px;border:2px solid var(--border-color,#e2e8f0);background:transparent;color:var(--text-dark,#1f2937);font:800 .9rem 'Nunito',sans-serif;cursor:pointer}
  #scn .scn-acoes .pri{background:var(--theme-primary,#0056b3);border-color:var(--theme-primary,#0056b3);color:#fff}
  #scn .scn-dig{display:none;gap:8px;margin-top:10px}#scn .scn-dig.on{display:flex}
  #scn .scn-dig .btn-action{flex:0 0 auto;width:auto;padding:0 22px;min-height:46px}
  #scn .scn-dig input{flex:1 1 auto;width:auto;min-width:0;min-height:46px;box-sizing:border-box;padding:11px;border-radius:12px;border:2px solid var(--border-color,#e2e8f0);background:var(--input-bg,#fff);color:var(--text-dark,#1f2937);font:700 1rem 'Nunito',sans-serif}
  @media (prefers-reduced-motion:reduce){#scn .scn-linha{animation:none}}`;
  document.head.appendChild(css);

  // confere o dígito verificador de EAN-13 / EAN-8 / UPC-A (evita leituras erradas)
  function digitoOk(t) {
    if (!/^\d{8}$|^\d{12,13}$/.test(t)) return true;
    const d = t.split('').map(Number), chk = d.pop(); let s = 0;
    d.reverse().forEach((n, i) => { s += n * (i % 2 ? 1 : 3); });
    return (10 - s % 10) % 10 === chk;
  }
  function carregarZx() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (carregandoZx) return carregandoZx;
    carregandoZx = new Promise((ok, erro) => { const s = document.createElement('script'); s.src = 'js/vendor/zxing.js?v=1'; s.onload = () => ok(window.ZXing); s.onerror = () => { carregandoZx = null; erro(new Error('Não foi possível carregar o leitor.')); }; document.head.appendChild(s); });
    return carregandoZx;
  }
  async function leitorNativo() {
    if (!('BarcodeDetector' in window)) return null;
    try { const sup = await BarcodeDetector.getSupportedFormats(), f = FORMATOS.filter(x => sup.includes(x)); return f.length ? new BarcodeDetector({ formats: f }) : null; } catch (e) { return null; }
  }
  function leitorZx(Z) {
    const r = new Z.MultiFormatReader(), h = new Map();
    h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39, Z.BarcodeFormat.QR_CODE]);
    h.set(Z.DecodeHintType.TRY_HARDER, true); r.setHints(h);
    return canvas => { try { return r.decodeWithState(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(canvas)))).getText(); } catch (e) { return null; } };
  }
  // lê de uma imagem (foto enviada) — tenta também girada 90°
  async function lerImagem(img) {
    const nat = await leitorNativo();
    if (nat) { try { const r = await nat.detect(img); if (r[0]) return r[0].rawValue; } catch (e) {} }
    const Z = await carregarZx(), ler = leitorZx(Z);
    for (const giro of [0, 90]) {
      const c = document.createElement('canvas'), esc = Math.min(1, 1600 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const w = Math.round((img.naturalWidth || img.width) * esc), h = Math.round((img.naturalHeight || img.height) * esc);
      c.width = giro ? h : w; c.height = giro ? w : h; const g = c.getContext('2d');
      if (giro) { g.translate(c.width, 0); g.rotate(Math.PI / 2); } g.drawImage(img, 0, 0, w, h);
      const t = ler(c); if (t) return t;
    }
    return null;
  }

  function abrir(op) {
    op = op || {}; fechar();
    const box = document.createElement('div'); box.id = 'scn'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'scn-tit');
    box.innerHTML = '<div class="scn-caixa"><h3 id="scn-tit">' + (op.titulo || 'Escanear código de barras') + '</h3><p>' + (op.dica || 'Aponte a câmera para o código de barras do livro (ISBN), dentro do quadro.') + '</p>' +
      '<div class="scn-video"><video playsinline muted autoplay aria-label="Imagem da câmera"></video><div class="scn-mira" aria-hidden="true"></div><div class="scn-linha" aria-hidden="true"></div></div>' +
      '<div class="scn-st" role="status" id="scn-st">Abrindo a câmera…</div>' +
      '<div class="scn-dig" id="scn-dig"><input id="scn-num" inputmode="numeric" placeholder="Digite o número do código" aria-label="Número do código de barras"><button type="button" class="btn-action btn-reserve" id="scn-ok">Usar</button></div>' +
      '<div class="scn-acoes"><label class="pri" for="scn-foto">Usar foto do código</label><input type="file" id="scn-foto" accept="image/*" capture="environment" hidden>' +
      '<button type="button" id="scn-digitar">Digitar o número</button><button type="button" id="scn-fechar">Fechar</button></div></div>';
    document.body.appendChild(box);
    const st = (t, tipo) => { const e = document.getElementById('scn-st'); if (e) { e.textContent = t; e.className = 'scn-st ' + (tipo || ''); } };
    const video = box.querySelector('video');
    let stream = null, vivo = true, ultimo = '', iguais = 0;
    const terminar = (texto) => { vivo = false; if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) {} st('Lido: ' + texto, 'ok'); setTimeout(() => { fechar(); op.onLido && op.onLido(texto); }, 350); };
    const aceitar = texto => {
      texto = String(texto || '').trim(); if (!texto) return;
      if (/^\d{8}$|^\d{12,13}$/.test(texto)) { if (digitoOk(texto)) terminar(texto); return; }   // EAN/UPC: dígito verificador confere
      if (texto === ultimo) { if (++iguais >= 2) terminar(texto); } else { ultimo = texto; iguais = 1; }   // outros: precisa ler igual 2 vezes
    };
    box._parar = () => { vivo = false; if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    document.getElementById('scn-fechar').onclick = fechar;
    box.addEventListener('click', e => { if (e.target === box) fechar(); });
    document.getElementById('scn-digitar').onclick = () => { document.getElementById('scn-dig').classList.add('on'); document.getElementById('scn-num').focus(); };
    const usarDigitado = () => { const v = document.getElementById('scn-num').value.trim(); if (v) { vivo = false; fechar(); op.onLido && op.onLido(v.replace(/[\s-]/g, '')); } };
    document.getElementById('scn-ok').onclick = usarDigitado;
    document.getElementById('scn-num').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); usarDigitado(); } });
    document.getElementById('scn-foto').onchange = e => {
      const f = e.target.files && e.target.files[0]; if (!f) return; st('Lendo a foto…');
      const url = URL.createObjectURL(f), img = new Image();
      img.onload = async () => { let t = null; try { t = await lerImagem(img); } catch (er) {} URL.revokeObjectURL(url);
        if (t && (!/^\d{8}$|^\d{12,13}$/.test(t) || digitoOk(t))) terminar(t); else st('Não encontramos um código nesta foto. Tente mais perto e com boa luz.', 'erro'); };
      img.onerror = () => st('Não foi possível abrir a foto.', 'erro'); img.src = url;
    };
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) { st('Câmera indisponível aqui. Use uma foto do código ou digite o número.', 'erro'); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
      catch (e) { st(e && e.name === 'NotAllowedError' ? 'Permissão da câmera negada. Libere a câmera no navegador, ou use uma foto do código.' : 'Não foi possível abrir a câmera. Use uma foto do código ou digite o número.', 'erro'); return; }
      if (!vivo) return box._parar();
      video.srcObject = stream; try { await video.play(); } catch (e) {}
      st('Procurando o código…');
      const nat = await leitorNativo();
      if (nat) {
        const passo = async () => { if (!vivo) return; try { if (video.readyState >= 2) { const r = await nat.detect(video); if (r[0]) aceitar(r[0].rawValue); } } catch (e) {} if (vivo) setTimeout(passo, 150); };
        passo(); return;
      }
      let Z; try { Z = await carregarZx(); } catch (e) { st(e.message + ' Use uma foto ou digite o número.', 'erro'); return; }
      const ler = leitorZx(Z), c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
      const passo = () => {
        if (!vivo) return;
        if (video.readyState >= 2 && video.videoWidth) {
          const w = video.videoWidth, h = video.videoHeight, cw = Math.round(w * .85), ch = Math.round(h * .5);   // lê só a faixa do meio (mais rápido)
          c.width = cw; c.height = ch; g.drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
          const t = ler(c); if (t) aceitar(t);
        }
        if (vivo) setTimeout(passo, 220);
      };
      passo();
    })();
    setTimeout(() => { const b = document.getElementById('scn-fechar'); if (b) b.focus(); }, 50);
  }
  function fechar() { const b = document.getElementById('scn'); if (!b) return; if (b._parar) b._parar(); b.remove(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('scn')) { e.preventDefault(); e.stopPropagation(); fechar(); } }, true);

  window.cieeScanner = { abrir, fechar, lerImagem, digitoOk };
})();
