/* CIEESC PLAY — relatórios em PDF (usado antes de limpar/resetar dados no painel)
   cieeRelatorio.pdf({ titulo, colunas: ['A','B'], linhas: [['1','2']], arquivo: 'nome', info: 'texto extra' })
   Gera o arquivo no próprio navegador (jsPDF, MIT) e baixa. As bibliotecas só carregam na hora de usar. */
(function () {
  let carregando = null;
  const carregar = src => new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('Não foi possível carregar ' + src)); document.head.appendChild(s); });
  function bibliotecas() {
    if (window.jspdf && window.jspdf.jsPDF && (window.jspdf.jsPDF.API || {}).autoTable) return Promise.resolve();
    if (!carregando) carregando = carregar('js/vendor/jspdf.js?v=1').then(() => carregar('js/vendor/jspdf-autotable.js?v=1')).catch(e => { carregando = null; throw e; });
    return carregando;
  }
  const txt = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  async function pdf(op) {
    await bibliotecas();
    const { jsPDF } = window.jspdf, doc = new jsPDF({ orientation: (op.colunas || []).length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    const larg = doc.internal.pageSize.getWidth(), agora = new Date().toLocaleString('pt-BR');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(txt(op.titulo || 'Relatório'), 40, 44);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
    doc.text('CIEESC PLAY  •  gerado em ' + agora + (op.por ? '  •  por ' + txt(op.por) : '') + '  •  ' + (op.linhas || []).length + ' registro(s)', 40, 60);
    if (op.info) doc.text(txt(op.info), 40, 73);
    const rodape = () => { const n = doc.internal.getNumberOfPages(); for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120); doc.text('Página ' + i + ' de ' + n, larg - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' }); } };
    doc.autoTable({ startY: op.info ? 84 : 72, head: [(op.colunas || []).map(txt)], body: (op.linhas || []).map(l => l.map(txt)), theme: 'striped', styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, overflow: 'linebreak' }, headStyles: { fillColor: [0, 86, 179], textColor: 255 }, margin: { left: 40, right: 40, bottom: 36 } });
    if (!(op.linhas || []).length) { doc.setFontSize(10); doc.setTextColor(120); doc.text('Nenhum registro.', 40, 100); }
    rodape();
    const nome = (op.arquivo || 'relatorio') + '-' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(nome); return nome;
  }
  window.cieeRelatorio = { pdf };
})();
