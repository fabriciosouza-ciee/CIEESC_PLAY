/* CIEESC PLAY — funções de segurança usadas na tela de acesso e no painel
   1) Senhas: PBKDF2-SHA256 com sal aleatório e 210.000 rodadas (formato "pbkdf2$rodadas$sal$hash").
      Hashes antigos (SHA-256 simples) continuam aceitos e são trocados pelo formato novo no próximo login.
   2) Limite de tentativas de login por conta (neste aparelho).
   Observação: enquanto não houver servidor, tudo roda no navegador. Com o Supabase, a senha passa a ser
   verificada só no servidor (Supabase Auth) e este arquivo fica apenas para compatibilidade. */
// recursos ligados/desligados pelo Webmaster em Painel › Sistema › Configurações (true quando nunca foi mexido)
window.cieeRecurso = k => { try { const r = (JSON.parse(localStorage.getItem('ciee_sistema') || '{}').recursos) || {}; return r[k] !== false; } catch (e) { return true; } };
(function () {
  // impede que outro site abra o portal escondido dentro de um quadro (clickjacking)
  if (window.top !== window.self) { try { window.top.location.replace(window.self.location.href); } catch (e) { document.documentElement.style.visibility = 'hidden'; } }
  const ROD = 210000;
  const b64 = u8 => btoa(String.fromCharCode(...u8));
  const deB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const enc = t => new TextEncoder().encode(String(t));
  async function pbkdf2(senha, sal, rod) {
    const k = await crypto.subtle.importKey('raw', enc(senha), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: rod }, k, 256));
  }
  async function sha256hex(t) { const b = await crypto.subtle.digest('SHA-256', enc(t)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
  const igual = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };   // comparação em tempo constante

  window.cieeSenha = {
    async gerar(senha) { const sal = crypto.getRandomValues(new Uint8Array(16)); return 'pbkdf2$' + ROD + '$' + b64(sal) + '$' + b64(await pbkdf2(senha, sal, ROD)); },
    async conferir(senha, guardado) {
      guardado = String(guardado || '');
      if (!guardado) return { ok: false };
      if (guardado.startsWith('pbkdf2$')) {
        const [, rod, sal, h] = guardado.split('$');
        return { ok: igual(b64(await pbkdf2(senha, deB64(sal), +rod)), h), atualizar: +rod < ROD };
      }
      if (/^[0-9a-f]{64}$/.test(guardado)) return { ok: igual(await sha256hex(senha), guardado), atualizar: true };   // formato antigo
      return { ok: false };
    }
  };

  // limite de tentativas: 5 erros → espera 1 min; 10 → 5 min; 15 ou mais → 15 min
  const KF = 'ciee_falhas';
  const ler = () => { try { return JSON.parse(localStorage.getItem(KF)) || {}; } catch (e) { return {}; } };
  const gravar = o => { try { localStorage.setItem(KF, JSON.stringify(o)); } catch (e) {} };
  window.cieeTentativas = {
    espera(conta) { const r = ler()[String(conta).toLowerCase()]; return r && r.ate > Date.now() ? Math.ceil((r.ate - Date.now()) / 1000) : 0; },
    erro(conta) {
      const o = ler(), k = String(conta).toLowerCase(), r = o[k] || { n: 0, ate: 0 }; r.n++;
      if (r.n % 5 === 0) r.ate = Date.now() + (r.n >= 15 ? 15 : r.n >= 10 ? 5 : 1) * 60000;
      o[k] = r; gravar(o); return r;
    },
    acerto(conta) { const o = ler(); delete o[String(conta).toLowerCase()]; gravar(o); }
  };
})();
