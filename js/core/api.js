/* CIEESC PLAY — ligação com o servidor (backend)
   Enquanto CIEE_API_URL estiver vazio, o app funciona só no aparelho (modo local) e os recursos que exigem
   confirmação por e-mail/SMS (como trocar a senha) ficam bloqueados. Contrato dos endpoints: veja docs/BACKEND.md. */
const CIEE_API_URL = '';          // ex.: 'https://api.cieesc.org.br'  ← preencher quando o servidor existir

(function () {
  const sessao = () => { try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session') || 'null'); } catch (e) { return null; } };
  async function req(caminho, corpo) {
    const s = sessao();
    const r = await fetch(CIEE_API_URL.replace(/\/$/, '') + caminho, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ((s && s.token) || '') }, body: JSON.stringify(corpo) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok || j.ok === false) throw new Error(j.mensagem || 'Não foi possível concluir agora. Tente novamente.');
    return j;
  }
  window.cieeAPI = {
    disponivel: () => !!CIEE_API_URL,
    // pede ao servidor que envie um código de 6 dígitos ao e-mail ou telefone cadastrados → { ok, destino:"a•••@x.com" }
    solicitarCodigo: ({ canal }) => req('/api/perfil/senha/codigo', { canal }),
    // confirma o código e troca a senha (o servidor guarda só o hash) → { ok }
    trocarSenha: ({ codigo, novaSenha }) => req('/api/perfil/senha', { codigo, novaSenha })
  };
})();
