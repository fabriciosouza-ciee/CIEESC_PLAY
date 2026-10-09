# CIEESC PLAY — o que o servidor (backend) precisa fazer

> Para a integração com o **Supabase** (Auth, RLS, Storage, Edge Functions e biometria no servidor), veja o plano em `docs/AUDITORIA-SEGURANCA.md`, parte 3.

Hoje o app funciona **só no aparelho** (dados no `localStorage`). Para a troca de senha com confirmação por e-mail/SMS —
e para os dados ficarem iguais em todos os aparelhos — é preciso um servidor. Este arquivo descreve o que o app já espera.

## 1. Ligando o app ao servidor
Em `js/core/api.js`, preencha: `const CIEE_API_URL = 'https://api.seudominio.org.br';`
Enquanto estiver vazio, "Meu perfil › Senha" mostra o aviso de que o recurso será liberado com o servidor.

## 2. Endpoints usados pelo "Meu perfil" (JSON, sempre por HTTPS)
Todos recebem `Authorization: Bearer <token da sessão>`; o token vem do login feito **no servidor** (guardado em `ciee_session.token`).

**POST `/api/perfil/senha/codigo`** — pede o código
- corpo: `{ "canal": "email" | "sms" }`
- o servidor gera um código de 6 dígitos, guarda **só o hash**, validade de 10 minutos, e envia ao e-mail/telefone **cadastrados** (nunca a um destino informado pelo cliente)
- resposta: `{ "ok": true, "destino": "a•••••@gmail.com" }` (destino mascarado)
- erro: `{ "ok": false, "mensagem": "Texto para o usuário" }` com status 4xx/5xx

**POST `/api/perfil/senha`** — confirma e troca
- corpo: `{ "codigo": "123456", "novaSenha": "..." }`
- confere código (máx. 5 tentativas, uso único, não expirado) e as regras da senha (8+ caracteres, maiúscula, minúscula, número e caractere especial)
- grava com **argon2id ou bcrypt** (nunca o SHA-256 que o app usa hoje no aparelho) e encerra as outras sessões
- resposta: `{ "ok": true }`

## 3. Regras de segurança (obrigatórias)
- Limitar pedidos de código (ex.: 3 por hora por conta e por IP) e tentativas de confirmação.
- Não registrar códigos nem senhas em logs. Enviar aviso por e-mail quando a senha for trocada.
- E-mail/SMS: use um provedor (ex.: SES/SendGrid para e-mail; Zenvia/Twilio para SMS). Não envie por serviços sem autenticação.
- Trocar **e-mail e telefone** também deveria ser confirmado por código no novo contato (hoje o app salva direto, sem verificar).

## 4. O que muda no app quando o servidor existir
1. **Login e cadastro** passam a ser feitos no servidor (senha com hash forte e token de sessão). Hoje o hash fica no navegador.
2. **Dados** (aprendizes, empréstimos, selos, temas, moderação, ByPass) passam a ficar no banco de dados e valem em qualquer aparelho.
3. **Chutar e banir** passam a valer de verdade para todos; **selos** deixam de depender do relógio do aparelho.
4. **Selos de leitor** passam a ser contados pelo servidor a cada devolução registrada.

## 5. Modelo mínimo de dados
`usuarios(id, nome, email único, telefone único, senha_hash, foto_url, nivel, cidade, periodo, validade)`
`codigos_verificacao(id, usuario_id, canal, codigo_hash, expira_em, tentativas, usado_em)`
`conquistas(usuario_id, tipo, ano, concedido_em)` · `leituras(usuario_id, livro, devolvido_em)`
