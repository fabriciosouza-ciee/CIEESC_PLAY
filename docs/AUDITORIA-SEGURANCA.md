# CIEESC PLAY — Auditoria de segurança

**Escopo:** `index.html`, `playing.html`, `admin.html`, `404.html`, `politica-de-privacidade.html` e todos os scripts (`*.js`).

> Desde a v40 o código das páginas fica em `js/pages/` (index.js, playing.js, admin.js) e os estilos em `css/`. Onde este relatório cita `index.html`, `playing.html` ou `admin.html`, o código correspondente está no `js/pages/` de mesmo nome.
**Método:** leitura do código + testes de ataque num navegador real (Chromium): dados maliciosos gravados nos cadastros, livros, empréstimos, mural, calendário etc., e verificação se algum código executava.
**Contexto:** hoje o app não tem servidor. Tudo (login, cadastros, selos, moderação) roda e fica guardado no navegador de cada aparelho. Isso limita o que dá para proteger agora; o que depende de servidor está na parte 3, já pensado para o Supabase.

---

## 1. Resumo

| # | Problema | Gravidade | Situação |
|---|----------|-----------|----------|
| 1 | Login, níveis e permissões existem só no navegador | **Crítica** | Exige servidor (Supabase) |
| 2 | XSS armazenado (dados de aprendiz executando código no painel da equipe) | **Crítica** | **Corrigido** |
| 3 | Senha do aprendiz enviada em texto puro no e-mail de cadastro | **Alta** | **Corrigido** |
| 4 | Senha do Wi-Fi enviada a site de terceiros (gerador de QR Code) | **Alta** | **Corrigido** |
| 5 | Senhas ByPass de exemplo no código público e guardadas em texto puro | **Alta** | Ação manual + Supabase |
| 6 | Senhas com SHA-256 sem sal | **Alta** | **Corrigido** (PBKDF2) — e no Supabase vai para o servidor |
| 7 | Dados pessoais de todos os aprendizes guardados em cada navegador | **Alta** | Exige servidor (Supabase) |
| 8 | Login sem limite de tentativas | Média | **Corrigido** (no aparelho) |
| 9 | Recuperação de senha com código gerado no navegador | Média | Exige servidor (Supabase) |
| 10 | Moderação (chutar/banir) e modo manutenção contornáveis | Média | Exige servidor (Supabase) |
| 11 | E-mails enviados do navegador (FormSubmit) | Média | Exige servidor (Supabase) |
| 12 | Sem política de segurança de conteúdo (CSP) | Média | **Corrigido** |
| 13 | Links externos sem `rel="noopener"` e página podia ser aberta dentro de outro site | Baixa | **Corrigido** |
| 14 | Sessão "manter conectado" sem validade | Baixa | **Corrigido** |
| 15 | Pontos, selos e leituras podem ser alterados no próprio aparelho | Baixa | Exige servidor (Supabase) |
| — | Injeção de SQL | — | Não se aplica hoje (sem banco); regras para o Supabase na parte 3 |
| — | CSRF | — | Não se aplica hoje (sem cookies de sessão); regras para o Supabase na parte 3 |

---

## 2. Problemas encontrados e correções

### 1. Login, níveis e permissões só no navegador — CRÍTICA
**Onde:** `ciee_session` no `localStorage`/`sessionStorage` (todas as páginas); `ciee_codigos_acesso`; checagens `sessionData.nivel` no `admin.html`.
**Risco:** quem abre as ferramentas do navegador consegue escrever uma sessão com `nivel: 5` e entrar no painel como Webmaster, ou mudar dados de qualquer pessoa *naquele aparelho*.
**Correção prática:** só existe com servidor. No Supabase: login pelo **Supabase Auth**, o nível em uma tabela `perfis` que só a equipe altera, e **RLS** (Row Level Security) em todas as tabelas — o navegador nunca decide permissão (exemplos na parte 3).

### 2. XSS armazenado — CRÍTICA — **CORRIGIDO**
**Onde:** dezenas de pontos em `admin.html` e `playing.html` onde nome, e-mail, telefone, títulos de livros, avisos do mural etc. eram colocados no HTML sem tratamento. O pior caso: o botão **Contatar** do painel recebia nome/e-mail/telefone do aprendiz dentro de `onclick="abrirModalContato('…')"`.
**Risco:** um aprendiz cadastrava o nome `x');<código>//` e o código rodava **na sessão do orientador/webmaster** quando ele abrisse Empréstimos ou Solicitações (ex.: criar acessos ByPass, copiar todos os cadastros).
**Prova:** com os mesmos dados maliciosos, a versão anterior executou código **12 vezes no painel e 8 no portal**; a versão corrigida, **0**.
**O que foi feito:**
- 79 pontos passaram a usar as funções de escape (`escHtml` / `_esc`), definidas no topo de cada página.
- Botões com texto vindo de dados agora usam `data-*` + `this.dataset` (escape de HTML **não** protege dentro de `onclick='…'`).
- Imagens só aceitam `data:image/png|jpg|gif|webp;base64` ou `https:` (`imgOk`), bloqueando `javascript:` e SVG embutido.
**Regra daqui para frente:** nunca montar HTML com `${dado}` sem escape. Prefira `textContent` ou `escHtml(...)`; nunca coloque dado dentro de `onclick`.

### 3. Senha em texto puro no e-mail de cadastro — ALTA — **CORRIGIDO**
**Onde:** `index.html`, e-mail ao aprendiz no fim do cadastro (`Senha: ${pass}` e `Dica de senha`).
**Risco:** a senha passava pelo FormSubmit (terceiro) e ficava para sempre na caixa de e-mail.
**Correção:** o e-mail agora diz apenas que a senha é a criada no cadastro e orienta a usar "Recuperar senha".

### 4. Senha do Wi-Fi enviada a terceiro — ALTA — **CORRIGIDO**
**Onde:** `playing.html` e `admin.html` montavam o QR Code em `api.qrserver.com/...&data=WIFI:...;P:<senha>`.
**Correção:** o QR Code passou a ser gerado no próprio aparelho, com `js/vendor/qrcode.js` (biblioteca MIT incluída no pacote). Teste: zero pedidos ao `qrserver`.

### 5. Senhas ByPass de exemplo — ALTA — **AÇÃO MANUAL**
**Onde:** `index.html` e `admin.html` (`DEFAULT_CODES`: 123 e 456); `ciee_codigos_acesso` guarda os códigos em texto puro e o painel os mostra.
**Correção agora:** trocar os códigos em *Gestão da equipe › ByPass* por códigos longos e não compartilhados.
**Correção definitiva:** no Supabase, **contas individuais** para a equipe (e-mail + senha + MFA) e o nível na tabela `perfis`. Apagar `DEFAULT_CODES` e o ByPass por código compartilhado.

### 6. Hash de senha fraco — ALTA — **CORRIGIDO** (`js/core/seguranca.js`)
**Antes:** SHA-256 sem sal (`sha256(senha)`), rápido de quebrar por força bruta e igual para senhas iguais.
**Agora:** **PBKDF2-SHA256 com sal aleatório de 16 bytes e 210.000 rodadas**, formato `pbkdf2$210000$sal$hash`, comparação em tempo constante. Hashes antigos continuam aceitos e são trocados automaticamente no próximo login (testado). Cadastro, recuperação e "Senha" do painel já gravam no formato novo.
**Limite:** o hash ainda fica no aparelho. No Supabase, a senha é tratada só no servidor (bcrypt) e o `ciee_users` deixa de existir.

### 7. Dados pessoais em todos os navegadores — ALTA
**Onde:** `ciee_users` (nome, e-mail, telefone, nascimento, foto, hash), `ciee_emprestimos`, `ciee_leituras`, `ciee_sugestoes`…
**Risco:** em computador compartilhado (laboratório), o próximo a usar pode ler os dados de outros jovens — muitos menores de idade (LGPD, dados de adolescentes).
**Correção:** mover para o Supabase com RLS (cada aprendiz lê só o seu; equipe lê o da sua cidade); fotos no **Supabase Storage** em bucket privado com URL assinada. Até lá: orientar a usar o portal em aparelho pessoal e "Desconectar" em aparelho compartilhado.

### 8. Força bruta no login — MÉDIA — **CORRIGIDO** (no aparelho)
**Agora:** 5 senhas erradas na mesma conta → espera de 1 minuto; 10 → 5 minutos; 15 ou mais → 15 minutos (testado). Contas sem senha não entram mais sem senha (antes entravam).
**Limite:** é por aparelho. No Supabase: limite de requisições do Auth + CAPTCHA (hCaptcha ou Turnstile) no login.

### 9. Recuperação de senha — MÉDIA
**Onde:** `index.html`: o código de 6 dígitos é gerado no navegador, guardado como SHA-256 (quebrável em segundos) e enviado pelo FormSubmit; a dica de senha aparece após erro.
**Correção (Supabase):** `supabase.auth.resetPasswordForEmail()` — o link/código é gerado e conferido no servidor. Remover a dica de senha.

### 10. Moderação e manutenção contornáveis — MÉDIA
**Onde:** `js/core/moderacao.js` (banimento por IP via ipify, guardado no aparelho) e `ciee_sistema.manutencao`.
**Correção (Supabase):** tabela `banimentos` conferida pela RLS ou por Edge Function; derrubar sessões pelo servidor (Admin API do Auth); manutenção como configuração no banco lida pelo servidor.

### 11. E-mails enviados do navegador — MÉDIA
**Onde:** `index.html` (cadastro, recuperação) e `js/features/sugestoes.js` usam o FormSubmit direto do navegador; os e-mails de destino aparecem no código e na rede.
**Risco:** spam/abuso usando o endpoint; terceiro recebe dados pessoais.
**Correção (Supabase):** **Edge Function** autenticada (JWT do usuário) que envia por um provedor (Resend, SES), com limite por usuário; os destinatários são lidos no servidor.

### 12. Sem CSP — MÉDIA — **CORRIGIDO**
**Agora:** todas as páginas têm `Content-Security-Policy` (via `<meta>`) e `referrer` restrito. Scripts só do próprio site; conexões só para o próprio site, FormSubmit e ipify; nada de `<object>`/script de fora. Teste: envio de dados para domínio desconhecido **bloqueado**; script externo **recusado**; nenhuma função legítima bloqueada.
**Limite:** ainda precisa de `'unsafe-inline'` porque o código usa `onclick="…"`. Próximo passo: trocar por `addEventListener` e remover `'unsafe-inline'`. Ao integrar o Supabase, acrescentar `https://SEU-PROJETO.supabase.co wss://SEU-PROJETO.supabase.co` ao `connect-src`.

### 13. Tabnabbing e clickjacking — BAIXA — **CORRIGIDO**
- Todos os links `target="_blank"` com `rel="noopener noreferrer"`.
- `js/core/seguranca.js` impede que outro site abra o portal escondido num quadro. (O GitHub Pages não permite cabeçalhos; ao trocar de hospedagem, usar `frame-ancestors 'none'`, HSTS e `X-Content-Type-Options: nosniff`.)

### 14. Sessão sem validade — BAIXA — **CORRIGIDO** (`js/core/niveis.js`)
"Manter conectado": 30 dias. Sessão comum: 7 dias. Equipe (ByPass): 12 horas.

### 15. Pontos, selos e leituras alteráveis no aparelho — BAIXA
**Correção (Supabase):** tabelas com RLS de **só leitura** para o aprendiz; a conclusão de leitura vira uma função no servidor (RPC) que confere se a devolução existe e se o livro já foi contado.

---

## 3. Plano para o Supabase

### 3.1 Injeção de SQL
- Use o `supabase-js` (`.from().select().eq()`): as consultas são parametrizadas.
- **Nunca** monte SQL concatenando texto em funções/RPC. Em PL/pgSQL use parâmetros ou `format('%I / %L', …)`.
- Funções `security definer` sempre com `set search_path = public` e checagem de permissão dentro da função.
- A chave **`service_role`** nunca vai para o navegador nem para o GitHub — só em Edge Functions (variáveis de ambiente). No front, só a `anon key` (pública e protegida pela RLS).

### 3.2 CSRF
O `supabase-js` envia o JWT no cabeçalho `Authorization` (não em cookie), então CSRF não se aplica. Se algum dia usar cookies (renderização no servidor), use `SameSite=Lax/Strict` e token anti-CSRF.

### 3.3 Autenticação e níveis (exemplo de RLS)
```sql
create table perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text not null, cidade text, nivel int not null default 1 check (nivel between 1 and 5)
);
alter table perfis enable row level security;

-- cada um lê o próprio perfil; equipe (nível >= 2) lê os da sua cidade
create policy "ler_proprio" on perfis for select using (id = auth.uid());
create policy "equipe_le_cidade" on perfis for select using (
  exists (select 1 from perfis p where p.id = auth.uid() and p.nivel >= 2 and p.cidade = perfis.cidade));
-- ninguém muda o próprio nível; só webmaster (5) altera níveis
create policy "webmaster_altera" on perfis for update using (
  exists (select 1 from perfis p where p.id = auth.uid() and p.nivel = 5));
```
Regra geral: **toda tabela com RLS ligada** (`alter table … enable row level security`) antes de ir para produção.

### 3.4 Biometria (WebAuthn / chaves de acesso) no servidor
Hoje a biometria (`js/features/biometria.js`) é um **desbloqueio local**: o aparelho confere o rosto/digital e o portal abre a sessão daquele aparelho. Com o Supabase:
1. Tabela `credenciais_webauthn (user_id, credential_id, public_key, sign_count, criado_em)` com RLS.
2. Edge Functions `webauthn-registro` e `webauthn-login` (biblioteca `@simplewebauthn/server`): o **desafio é gerado no servidor**, a assinatura é conferida com a chave pública e o `sign_count` é validado.
3. Com a assinatura válida, a função cria a sessão do Supabase para o usuário.
O front (`js/features/biometria.js`) já usa `navigator.credentials.create/get` — basta trocar o desafio local pelo do servidor e enviar a resposta para a função.

### 3.5 Outros itens da migração
- Fotos e PDFs → **Supabase Storage**, bucket privado, URL assinada de curta duração.
- E-mails → Edge Function (item 11). Wi-Fi: guardar a senha só para a equipe (RLS).
- `ciee_users`, `ciee_codigos_acesso`, `ciee_session` e demais chaves do `localStorage` deixam de existir (só preferências visuais ficam no aparelho).
- Logs de auditoria (quem fez o quê) numa tabela só de inserção (`insert` permitido, `update/delete` negados pela RLS).

---

## 4. Checklist antes de usar com dados reais
- [ ] Trocar os códigos ByPass de exemplo (123 / 456).
- [ ] Usar o portal em aparelho pessoal; em aparelho compartilhado, sempre "Desconectar".
- [ ] Revisar a política de privacidade (campos entre colchetes) com o jurídico.
- [ ] Migrar login, dados e e-mails para o Supabase com RLS antes de abrir para todas as turmas.
