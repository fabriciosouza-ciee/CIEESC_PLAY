/* CIEESC PLAY — entrar com biometria no celular (Face ID, desbloqueio facial ou digital)
   Usa WebAuthn (a mesma tecnologia das chaves de acesso). O rosto/digital é conferido pelo próprio aparelho:
   o site NUNCA recebe imagem do rosto nem a digital — só a confirmação de que o dono do aparelho foi verificado.
   Ativação: Portal › Meu perfil › Configurações (pede a senha antes). Vale só para o aparelho onde foi ativada.
   Observação: sem servidor, a verificação é local. Com o Supabase, a chave pública vai para o servidor, que gera o
   desafio e confere a assinatura (ver docs/AUDITORIA-SEGURANCA.md). */
(function () {
  const KB = 'ciee_bio';
  const ler = () => { try { return JSON.parse(localStorage.getItem(KB)) || []; } catch (e) { return []; } };
  const gravar = l => { try { localStorage.setItem(KB, JSON.stringify(l)); } catch (e) {} };
  const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const deB64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
  const aleatorio = n => crypto.getRandomValues(new Uint8Array(n));
  // celular ou tablet: tela de toque (alguns aparelhos não informam o "pointer: coarse", por isso olha também o toque e o sistema)
  const celular = () => (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  window.cieeBio = {
    async disponivel() {
      if (window.cieeRecurso && !cieeRecurso('biometria')) return false;   // desligado pelo Webmaster
      if (!window.PublicKeyCredential || !navigator.credentials || !window.isSecureContext || !celular()) return false;
      try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch (e) { return false; }
    },
    lista: () => ler(),
    ativadoPara: email => ler().some(r => r.email === String(email || '').toLowerCase()),
    async ativar(u) {
      const email = String(u.email || '').toLowerCase(); if (!email) throw new Error('Cadastro sem e-mail.');
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: aleatorio(32), rp: { name: 'CIEESC PLAY', id: location.hostname },
        user: { id: aleatorio(16), name: email, displayName: u.nome || email },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000, attestation: 'none' } });
      if (!cred) throw new Error('A biometria não foi ativada.');
      const l = ler().filter(r => r.email !== email); l.push({ email, nome: u.nome || '', id: b64u(cred.rawId), criado: Date.now() }); gravar(l);
      return true;
    },
    desativar(email) { gravar(ler().filter(r => r.email !== String(email || '').toLowerCase())); },
    async entrar() {
      const l = ler(); if (!l.length) throw new Error('Nenhuma biometria ativada neste aparelho.');
      const desafio = aleatorio(32);
      const a = await navigator.credentials.get({ publicKey: { challenge: desafio, rpId: location.hostname, userVerification: 'required', timeout: 60000,
        allowCredentials: l.map(r => ({ type: 'public-key', id: deB64u(r.id), transports: ['internal'] })) } });
      if (!a) throw new Error('Biometria cancelada.');
      const reg = l.find(r => r.id === b64u(a.rawId)); if (!reg) throw new Error('Biometria não reconhecida neste aparelho.');
      const cd = JSON.parse(new TextDecoder().decode(a.response.clientDataJSON));
      const flags = new Uint8Array(a.response.authenticatorData)[32];
      if (cd.type !== 'webauthn.get' || cd.challenge !== b64u(desafio) || cd.origin !== location.origin || !(flags & 0x04)) throw new Error('Não foi possível confirmar a biometria.');
      return reg;          // { email, nome } — a tela de acesso monta a sessão a partir do cadastro
    }
  };
})();
