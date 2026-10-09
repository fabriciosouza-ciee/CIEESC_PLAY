/* Lógica de playing.html (extraída da página) */
        const _esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const imgOk = u => /^(data:image\/(png|jpe?g|gif|webp);base64,|https:\/\/|blob:)/i.test(String(u || '')) ? String(u) : '';   // só imagens seguras (sem javascript:, sem SVG embutido)
        const iniciais = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
        // 1. Sincronização de Tema e Cores
        const COLORS = { blue: ['#0056b3', '#6f42c1', '#00b4d8'], purple: ['#6f42c1', '#d63384', '#0056b3'], pink: ['#d63384', '#6f42c1', '#ff8fab'] };
        function setThemeColor(color) {
            const name = { '#0056b3': 'blue', '#6f42c1': 'purple', '#d63384': 'pink' }[color] || 'blue';
            const c = COLORS[name], r = document.documentElement.style;
            r.setProperty('--theme-primary', c[0]); r.setProperty('--theme-secondary', c[1]); r.setProperty('--theme-accent', c[2]);
            localStorage.setItem('ciee_theme_color', color);
            localStorage.setItem('ciee_color_theme', name);   // compartilhado com index.html e admin.html
        }

        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('ciee_theme', isDark ? 'dark' : 'light');
            
        }

        const savedColor = ({ blue: '#0056b3', purple: '#6f42c1', pink: '#d63384' })[localStorage.getItem('ciee_color_theme')] || localStorage.getItem('ciee_theme_color') || '#0056b3';
        setThemeColor(savedColor);

        const savedMode = localStorage.getItem('ciee_theme') || localStorage.getItem('ciee_theme_mode');
        if (savedMode === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // 2. Sessão vinda do index.html
        const USERS_KEY = 'ciee_users';
        const $ = id => document.getElementById(id);
        function readSession() {
            try { return JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session')); }
            catch (e) { return null; }
        }
        function showStatus(screenId, countId, url, bodyClass) {
            document.body.classList.add(bodyClass);
            document.getElementById(screenId).classList.add('show');
            let s = 5;
            const el = document.getElementById(countId);
            const iv = setInterval(() => {
                s--; el.textContent = s;
                if (s <= 0) { clearInterval(iv); location.href = url; }
            }, 1000);
        }
        const sessionData = readSession();
        if (!sessionData || !sessionData.nome) {
            showStatus('login-required-screen', 'login-required-count', 'index.html?acao=login', 'no-session');
            throw new Error('Sem sessão'); // interrompe o restante da página
        }
        delete sessionData.senhaHash; delete sessionData.dica;
        const nivel = sessionData.nivel || 1;
        const rolesMap = { 1: 'Aprendiz', 2: 'Representante', 3: 'Monitor', 4: 'Orientador', 5: 'Webmaster' };
        const fmtBR = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

        function setPhoto(el, size, radius, border) {
            if (!sessionData.foto) return; // sem foto: mantém o emoji
            el.textContent = '';
            const img = document.createElement('img');
            img.src = sessionData.foto; img.alt = 'Foto';
            img.style.cssText = `width:${size}px;height:${size}px;object-fit:cover;border-radius:${radius};border:${border}px solid #fff;display:block;margin:0 auto`;
            el.appendChild(img);
        }

        const CARGOS = { 1: 'Jovem aprendiz CIEESC', 2: 'Representante de Turma', 3: 'Monitor(a) da Aprendizagem', 4: 'Orientador(a) de Aprendizagem', 5: 'Administrador(a)' };
        function refreshUserUI() {
            const first = sessionData.nome.split(' ')[0];
            $('user-name').innerText = sessionData.nome;
            $('user-role').innerText = rolesMap[nivel] || 'Aprendiz';
            $('card-name').innerText = sessionData.nome;
            $('welcome-title').innerText = `Olá, ${first}! Bem-vindo(a) ao CIEESC ▶︎ PLAY`;
            $('card-cargo').innerText = CARGOS[nivel] || CARGOS[1];
            setPhoto($('user-avatar'), 36, '50%', 2);
            setPhoto($('card-avatar'), 96, '20px', 3);
            if (!sessionData.foto) { $('user-avatar').innerText = iniciais(sessionData.nome); $('card-avatar').innerText = iniciais(sessionData.nome); }
            $('card-info').innerText = [sessionData.cidade && `${sessionData.cidade}`, sessionData.periodo].filter(Boolean).join(' • ');
            const vencida = sessionData.validade && new Date(sessionData.validade + 'T23:59:59') < new Date();
            $('card-validade').innerText = nivel >= 2 ? 'Validade: Vitalícia' : 'Validade: ' + fmtBR(sessionData.validade) + (vencida ? ' (vencida)' : '');
        }
        refreshUserUI();
        function aplicarPerfil(novo) { Object.assign(sessionData, novo); refreshUserUI(); }   // chamado por js/features/perfil.js

        if (nivel >= 2) $('menu-admin').style.display = 'flex';
        document.getElementById('current-year').innerText = new Date().getFullYear();

        function logout() {
            localStorage.removeItem('ciee_session');
            sessionStorage.removeItem('ciee_session');
            showStatus('logout-screen', 'logout-count', 'index.html', 'logging-out');
        }

        // Perfil: mesmas regras do cadastro (nome formatado, e-mail minúsculo, senha média/forte)
        const NAME_LOWER = ['de', 'da', 'do', 'das', 'dos', 'e'];
        function formatName(str) {
            return str.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').split(' ').map((w, i) => {
                if (i > 0 && NAME_LOWER.includes(w)) return w;
                return w.replace(/(^|[-'’])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase('pt-BR'));
            }).join(' ');
        }
        function passLevel(t) {
            if (t.length < 6) return 0;
            let s = 0;
            if (t.length >= 8) s++;
            if (t.length >= 12) s++;
            if (/[a-z]/.test(t) && /[A-Z]/.test(t)) s++;
            if (/\d/.test(t)) s++;
            if (/[^A-Za-z0-9]/.test(t)) s++;
            return s <= 2 ? 1 : (s === 3 ? 2 : 3);
        }
        function passOk(t) {
            return t.length >= 8 && /\p{Lu}/u.test(t) && /\p{Ll}/u.test(t) && /\d/.test(t) && /[^\p{L}\p{N}\s]/u.test(t);
        }
        async function sha256(t) {
            try {
                const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
                return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
            } catch (e) { return ''; }
        }
        function getUsers() {
            try { const l = JSON.parse(localStorage.getItem(USERS_KEY)); return Array.isArray(l) ? l : []; }
            catch (e) { return []; }
        }
        // 3. Base de Dados de Livros & NOVAS REGRAS DE ACERVO
        let books = [
            { id: 'LIT-042', title: 'Dom Casmurro', author: 'Machado de Assis', cat: 'LIT', status: 'disp', desc: 'Disponível para Empréstimo.' },
            // Simulando um livro emprestado para VOCÊ onde falta 8 dias (botão de renovar desativado, pois é liberado 7 dias antes)
            { id: 'DES-105', title: 'Atenção Plena', author: 'Mark Williams', cat: 'DES', status: 'emp_eu', daysLeft: 8, desc: 'Emprestado para você. Prazo total de 30 dias.' },
            // Simulando um livro emprestado para VOCÊ onde falta 5 dias (botão de renovar ATIVADO)
            { id: 'PSI-015', title: 'O Homem em Busca de Sentido', author: 'Viktor Frankl', cat: 'PSI', status: 'emp_eu', daysLeft: 5, desc: 'Emprestado para você. Renove para ganhar +30 dias.' },
            // Livro emprestado para OUTRO usuário. Botão de "Avise-me".
            { id: 'DIR-003', title: 'Constituição Ilustrada', author: 'CIEE SC', cat: 'DIR', status: 'emp_outro', desc: 'Emprestado para outro usuário.' }
        ];

        let currentCat = 'Todos';

        // ===== Cartões de livro com capa (acervo físico e digital) =====
        const bkHue = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
        function bkCapa(b, grande) {              // capa enviada pela equipe ou capa criada na hora (cor pela categoria)
            const alt = 'Capa do livro ' + b.title, url = imgOk(b.cover);
            if (url) return `<img class="bk-img" ${grande ? '' : 'loading="lazy"'} decoding="async" src="${_esc(url)}" alt="${_esc(alt)}">`;
            return `<div class="bk-gen" style="--h:${bkHue(b.cat || b.title)}" role="img" aria-label="${_esc(alt)}"><span class="bk-gen-cat">${_esc(b.cat || '')}</span><strong>${_esc(b.title)}</strong><em>${_esc(b.author)}</em></div>`;
        }
        let _bkLista = [], _bkIdx = -1;
        function bkAviso(msg) {
            let t = document.getElementById('bk-toast');
            if (!t) { t = document.createElement('div'); t.id = 'bk-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
            t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 3800);
        }
        function bkAcoes(b) {                     // botões conforme a situação do livro e os recursos ligados no painel
            if (b.tipo === 'digital') return `<button type="button" class="btn-action btn-reserve" onclick="event.stopPropagation(); abrirItem('d${_esc(b.key)}')">${b.fonte === 'Arquivo PDF' ? 'Baixar PDF' : 'Abrir link'}</button>`;
            const emp = cieeRecurso('emprestimo'), dev = cieeRecurso('devolucao');
            const off = (txt, motivo) => `<button type="button" class="btn-action bk-off" disabled title="${motivo}">${txt}</button>`;
            const id = _esc(b.id);
            if (b.status === 'disp') return emp ? `<button type="button" class="btn-action btn-reserve" onclick="event.stopPropagation(); bkAcao('emprestar', '${id}')">Pedir empréstimo (30 dias)</button>` : off('Empréstimos suspensos', 'A coordenação suspendeu os empréstimos por enquanto.');
            if (b.status === 'ped_eu') return off('Aguardando aprovação', 'A equipe ainda vai responder ao seu pedido.') + `<button type="button" class="btn-action btn-fila" onclick="event.stopPropagation(); bkAcao('cancelar', '${id}')">Cancelar pedido</button>`;
            if (b.status === 'ped_outro') return off('Em análise', 'Outro pedido está sendo avaliado pela equipe.');
            if (b.status === 'dev_eu') return off('Devolução em análise', 'A equipe vai conferir o livro.');
            if (b.status === 'emp_eu' || b.status === 'ren_eu') {
                const renova = b.daysLeft <= 7;     // renovar só nos últimos 7 dias; devolver a qualquer momento
                return (dev ? `<button type="button" class="btn-action btn-devolve" onclick="event.stopPropagation(); bkAcao('devolver', '${id}')">Devolver</button>` : off('Devolução suspensa', 'A coordenação suspendeu as devoluções por enquanto.')) +
                    (b.status === 'ren_eu' ? off('Renovação em análise', 'A equipe vai responder ao seu pedido.') : !emp ? off('Renovação suspensa', 'A coordenação suspendeu os empréstimos por enquanto.') : renova ? `<button type="button" class="btn-action btn-swap" onclick="event.stopPropagation(); bkAcao('renovar', '${id}')">Pedir renovação (+30 dias)</button>` : off(`Renovar em ${b.daysLeft - 7} dias`, 'A renovação abre 7 dias antes do vencimento.'));
            }
            return `<button type="button" class="btn-action btn-fila" onclick="event.stopPropagation(); bkAcao('avise', '${_esc(b.id)}')">Avise-me</button>`;
        }
        function bkAcao(tipo, id) {
            if ((tipo === 'emprestar' || tipo === 'renovar') && !cieeRecurso('emprestimo')) return bkAviso('Os empréstimos estão suspensos no momento.');
            if (tipo === 'devolver' && !cieeRecurso('devolucao')) return bkAviso('As devoluções estão suspensas no momento.');
            if (tipo === 'emprestar') return bkPedir('Empréstimo', id);
            if (tipo === 'renovar') return bkPedir('Renovação', id);
            if (tipo === 'devolver') return bkPedir('Devolução', id);
            if (tipo === 'cancelar') return bkCancelarPedido(id);
            bkAviso('Alerta configurado! Enviaremos um e-mail para seu endereço cadastrado assim que for devolvido.');
        }
        const bkRotulo = b => b.tipo === 'digital' ? ['Digital', 'disp'] : ({ disp: ['Disponível', 'disp'], emp_eu: ['Emprestado (seu)', 'action'], emp_outro: ['Emprestado', 'emp'], ped_eu: ['Aguardando aprovação', 'wait'], ped_outro: ['Em análise', 'emp'], dev_eu: ['Devolução em análise', 'wait'], ren_eu: ['Renovação em análise', 'wait'] })[b.status] || ['Disponível', 'disp'];
        function bkCartao(b, n) {
            const [rot, cls] = bkRotulo(b);
            return `<article class="book-card bk" style="--d:${Math.min(n, 12) * 45}ms" tabindex="0" role="button" aria-label="Ver detalhes de ${_esc(b.title)}" data-i="${n}" onclick="bkAbrir(${n}, '${b.tipo === 'digital' ? 'digital' : 'fisico'}')" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); bkAbrir(${n}, '${b.tipo === 'digital' ? 'digital' : 'fisico'}'); }">
                <div class="bk-capa">${bkCapa(b)}<span class="book-status status-${cls}">${_esc(rot)}</span><span class="bk-brilho" aria-hidden="true"></span><span class="bk-ver" aria-hidden="true">Ver detalhes</span></div>
                <div class="bk-info"><span class="book-code">${_esc(b.id)}</span><h3 class="book-title">${_esc(b.title)}</h3><p class="book-author">${_esc(b.author)}</p>
                    <p class="bk-desc">${_esc(b.desc || '')}</p>${b.tipo !== 'digital' && window.cieeLeituras ? cieeLeituras.botaoOpinioes(b.id, b.title) : ''}
                    <div class="bk-acoes">${bkAcoes(b)}</div></div></article>`;
        }
        let _bkTipo = 'fisico';
        function renderBooks(data) {
            const container = document.getElementById('books-container');
            data.forEach(b => { b.tipo = 'fisico'; });
            container.innerHTML = data.length ? data.map(bkCartao).join('') : _vazio('Nenhum livro encontrado. Tente outra busca ou categoria.');
            window._bkFis = data; _bkLista = data; _bkTipo = 'fisico';
        }
        // ----- janela de detalhes: capa grande, sinopse, ações e navegação entre os livros -----
        function bkAbrir(n, tipo) {
            _bkTipo = tipo || 'fisico';
            const lista = _bkTipo === 'digital' ? (window._bkDig || []) : (window._bkFis || []); if (!lista[n]) return;
            _bkLista = lista; _bkIdx = n;
            let m = document.getElementById('bk-modal');
            if (!m) { m = document.createElement('div'); m.id = 'bk-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) bkFechar(); }); }
            bkPintarModal(); m.classList.add('on'); document.body.style.overflow = 'hidden';
            setTimeout(() => { const f = m.querySelector('.bk-x'); if (f) f.focus(); }, 30);
        }
        function bkPintarModal() {
            const m = document.getElementById('bk-modal'), b = _bkLista[_bkIdx], [rot, cls] = bkRotulo(b);
            const meta = [['Autor(a)', b.author], ['Categoria', b.cat], ['Editora', b.editora], ['Ano', b.ano], ['Onde está', b.local], ['ISBN', b.isbn]].filter(x => x[1]);
            const ops = b.tipo !== 'digital' && window.cieeSelos ? cieeSelos.opinioes(b.id, b.title) : [];
            m.innerHTML = `<div class="bk-caixa"><button type="button" class="bk-x" aria-label="Fechar" onclick="bkFechar()">&times;</button>
                <div class="bk-m-capa"><button type="button" class="bk-zoom" aria-label="Ampliar capa" onclick="this.parentElement.classList.toggle('ampliada')">${bkCapa(b, true)}</button><span class="book-status status-${cls}">${_esc(rot)}</span></div>
                <div class="bk-m-info"><span class="book-code">${_esc(b.id)}</span><h2>${_esc(b.title)}</h2>
                    <dl>${meta.map(x => `<div><dt>${x[0]}</dt><dd>${_esc(x[1])}</dd></div>`).join('')}</dl>
                    ${(b.sinopse || b.desc) ? `<h4>Sobre o livro</h4><p class="bk-sin">${_esc(b.sinopse || b.desc)}</p>` : ''}
                    ${ops.length ? `<h4>O que os leitores acharam</h4>${ops.slice(0, 3).map(o => `<blockquote><strong>${_esc(o.nome)}</strong> ${_esc(o.opiniao)}</blockquote>`).join('')}` : ''}
                    <div class="bk-acoes bk-m-acoes">${bkAcoes(b)}</div>
                    <div class="bk-nav"><button type="button" onclick="bkVai(-1)" ${_bkIdx === 0 ? 'disabled' : ''} aria-label="Livro anterior">&lsaquo; Anterior</button><span>${_bkIdx + 1} de ${_bkLista.length}</span><button type="button" onclick="bkVai(1)" ${_bkIdx === _bkLista.length - 1 ? 'disabled' : ''} aria-label="Próximo livro">Próximo &rsaquo;</button></div></div></div>`;
        }
        function bkVai(d) { const n = _bkIdx + d; if (n < 0 || n >= _bkLista.length) return; _bkIdx = n; bkPintarModal(); const f = document.querySelector('#bk-modal .bk-nav button:not([disabled])'); }
        function bkFechar() { const m = document.getElementById('bk-modal'); if (m) m.classList.remove('on'); document.body.style.overflow = ''; }
        document.addEventListener('keydown', e => {
            const m = document.getElementById('bk-modal'); if (!m || !m.classList.contains('on')) return;
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); bkFechar(); }
            else if (e.key === 'ArrowRight') bkVai(1); else if (e.key === 'ArrowLeft') bkVai(-1);
        }, true);
        // inclinação 3D da capa seguindo o mouse (só com mouse; respeita "reduzir animações")
        (function () {
            if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            document.addEventListener('pointermove', e => {
                const c = e.target.closest && e.target.closest('.bk-capa'); if (!c) return;
                const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                c.style.setProperty('--ry', ((x - .5) * 16).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 16).toFixed(1) + 'deg');
                c.style.setProperty('--gx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
            });
            document.addEventListener('pointerout', e => { const c = e.target.closest && e.target.closest('.bk-capa'); if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); } });
        })();
        renderBooks(books);

        function filterCategory(val) { currentCat = val; applyFilters(); }
        function filterBooksText() { applyFilters(); }
        // escanear o código de barras (ISBN da contracapa ou código da etiqueta) e mostrar o livro
        function escanearAcervo() {
            if (!window.cieeScanner) return;
            cieeScanner.abrir({ titulo: 'Encontrar livro pelo código', onLido: t => {
                const s = document.getElementById('search-input'); s.value = t; currentCat = 'Todos'; const cs = document.getElementById('category-select'); if (cs) cs.value = 'Todos';
                applyFilters();
                if (!document.querySelector('#books-container .book-card')) alert('Nenhum livro com o código ' + t + ' no acervo desta unidade.');
            } });
        }
        function applyFilters() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const filtered = books.filter(b => 
                (currentCat === 'Todos' || b.cat === currentCat) &&
                (b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.id.toLowerCase().includes(query) || (b.isbn && query.replace(/[^0-9x]/g, '').length >= 4 && b.isbn.toLowerCase().includes(query.replace(/[^0-9x]/g, ''))))
            );
            renderBooks(filtered);
        }

        // 4. Base Pedagógico & Monitoria
        const teamMembers = [
            { name: 'Fabrício Santos', city: 'Tubarão', role: 'Orientador(a)' },
            { name: 'Sofia Mohammad', city: 'Tubarão', role: 'Orientador(a)' }
        ];
        document.getElementById('team-container').innerHTML = teamMembers.map(m => `
            <div class="team-card" style="align-items: center; text-align: center;">
                <div class="ini-ava ini-grande" style="margin:0 auto 6px">${iniciais(m.name)}</div>
                <h3 class="card-title">${_esc(m.name)}</h3>
                <p class="card-subtitle">${_esc(m.role)} • ${_esc(m.city)}</p>
                <span class="contact-line">E-mail não informado</span>
            </div>
        `).join('');

        const monitores = [
            { name: 'Lucas Gabriel', city: 'Tubarão', role: 'Monitor' },
            { name: 'Ana Beatriz', city: 'Imbituba', role: 'Monitora' }
        ];
        document.getElementById('monitoria-container').innerHTML = monitores.map(m => `
            <div class="team-card" style="align-items: center; text-align: center;">
                <div class="ini-ava ini-grande" style="margin:0 auto 6px">${iniciais(m.name)}</div>
                <h3 class="card-title">${_esc(m.name)}</h3>
                <p class="card-subtitle">${_esc(m.role)} • ${_esc(m.city)}</p>
            </div>
        `).join('');

        const defaultTurmas = [
            { codigo: 'TURMA-ADM01', nome: 'Serviços Administrativos', orientador: 'Fabrício Santos', cidade: 'Tubarão' },
            { codigo: 'TURMA-COM02', nome: 'Comércio e Vendas', orientador: 'Sofia Mohammad', cidade: 'Tubarão' }
        ];
        document.getElementById('turmas-container').innerHTML = defaultTurmas.map(t => `
            <div class="turma-card">
                <span class="book-code">${_esc(t.codigo)}</span>
                <h4 class="card-title" style="font-size: 1.1rem; margin-top: 5px;">${_esc(t.nome)}</h4>
                <p class="card-subtitle" style="margin-bottom: 8px;">Orientador(a): ${_esc(t.orientador)}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${_esc(t.cidade)}</p>
            </div>
        `).join('');

        // Achados e Perdidos, Equipe Adm...
        const lostAndFoundItems = [{ item: 'Fone Bluetooth', dia: '18/03', local: 'Sala 02' }];
        document.getElementById('lost-found-container').innerHTML = lostAndFoundItems.map(item => `
            <div class="lost-found-card">
                <div>
                    <h3 class="card-title" style="text-align: center;">${_esc(item.item)}</h3>
                    <div style="margin: 12px 0;">
                        <div class="badge-info">Encontrado em: ${_esc(item.dia)}</div>
                        <div class="badge-info">Local: ${_esc(item.local)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        const sectors = [
            { sector: 'Coordenação', name: 'Sylvia Figueiredo', email: 'sylvia.figueiredo@cieesc.org.br' },
            { sector: 'Assistência Social', name: 'Juliana Honorato', email: 'juliana.honorato@cieesc.org.br' }
        ];
        document.getElementById('sectors-container').innerHTML = sectors.map(s => `
            <div class="sector-card">
                <div>
                    <strong style="color: var(--theme-primary);">${_esc(s.sector)}</strong>
                    <div style="font-weight: 700; font-size: 0.95rem;">${_esc(s.name)}</div>
                </div>
                <a href="mailto:${_esc(s.email)}" style="color: var(--theme-primary); font-weight: 800; text-decoration: none;">E-mail</a>
            </div>
        `).join('');

        // Controle de Abas c/ suporte para Dropdowns
        function switchTab(tabId, element) {
            // Oculta todas as abas
            document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
            // Remove active de todos os botões no menu principal
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
            
            // Ativa a aba alvo
            const target = document.getElementById(`tab-${tabId}`);
            if (target) target.classList.add('active');

            // Gerencia ativação visual do Menu
            if (element) {
                if (element.classList.contains('dropdown-item')) {
                    // Se clicou num item do dropdown, ativa o botão pai do dropdown
                    const parentBtn = element.closest('.dropdown').querySelector('.nav-btn');
                    if (parentBtn) parentBtn.classList.add('active');
                } else {
                    element.classList.add('active');
                }
            }
        }

        // Modal de Frequências
        let redirectTimer; let countdownValue = 5;
        function openFrequenciaModal() {
            document.getElementById('freq-modal').classList.add('active');
            countdownValue = 5;
            document.getElementById('freq-countdown').innerText = countdownValue;
            redirectTimer = setInterval(() => {
                countdownValue--;
                document.getElementById('freq-countdown').innerText = countdownValue;
                if(countdownValue <= 0) forceRedirect();
            }, 1000);
        }
        function cancelRedirect() {
            clearInterval(redirectTimer);
            document.getElementById('freq-modal').classList.remove('active');
        }
        function forceRedirect() {
            clearInterval(redirectTimer);
            document.getElementById('freq-modal').classList.remove('active');
            window.open('https://atendimento.centralcieesc.org.br', '_blank');
        }

        document.addEventListener('keydown', e => {
            if (!$('freq-modal').classList.contains('active')) return;
            if (e.key === 'Escape') { e.preventDefault(); cancelRedirect(); }
            else if (e.key === 'Enter') { e.preventDefault(); forceRedirect(); }
        });

        // ===== Layout de celular: barra inferior + folhas (só aparecem em telas estreitas) =====
        (function () {
            const mq = window.matchMedia('(max-width: 820px)'), body = document.body;
            const brand = document.querySelector('header .brand-logo'), brandOrig = brand.innerHTML;
            const dd = txt => [...document.querySelectorAll('.main-nav .dropdown')].find(d => d.querySelector('.nav-btn').textContent.includes(txt));
            const direto = txt => [...document.querySelectorAll('.main-nav > .nav-btn')].find(b => b.textContent.includes(txt));
            const closeSheet = () => body.classList.remove('m-sheet-open');
            const row = (label, orig) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'm-row'; b.textContent = label.replace(/^[^A-Za-zÀ-ÿ0-9]+/, ''); b.onclick = () => { closeSheet(); orig.click(); }; return b; };
            function openSheet(title, rows, tools) {
                $('m-sheet-title').textContent = title;
                const box = $('m-sheet-body'); box.innerHTML = '';
                rows.forEach(r => box.appendChild(r));
                if (tools) box.appendChild(tools);
                body.classList.add('m-sheet-open');
            }
            const itens = d => d ? [...d.querySelectorAll('.dropdown-item')].map(i => row(i.textContent.trim(), i)) : [];
            function tools() {
                const t = document.createElement('div'); t.className = 'm-tools';
                t.innerHTML = `<div class="m-compact"><span>Tema</span><div class="color-picker"><span class="color-dot rosa" onclick="setThemeColor('#d63384')"></span><span class="color-dot roxo" onclick="setThemeColor('#6f42c1')"></span><span class="color-dot azul" onclick="setThemeColor('#0056b3')"></span></div><button class="m-pill" type="button" onclick="toggleTheme()">Claro / escuro</button></div>`;
                return t;
            }
            const abas = {
                mural: () => direto('Mural').click(),
                artes: () => direto('Artes').click(),
                acervo: () => openSheet('Acervo', itens(dd('Acervo'))),
                aprender: () => openSheet('Aprendizagem', itens(dd('Aprendizagem'))),
                mais: () => {
                    const r = [...document.querySelectorAll('.main-nav > .nav-btn')].filter(b => !/Mural|Artes/.test(b.textContent)).map(b => row(b.textContent.trim(), b));
                    r.push(...itens(dd('Meu perfil')));
                    const adm = $('menu-admin'); if (adm && adm.style.display !== 'none') r.push(row('Gerenciar', adm));
                    r.push(row('Desconectar', { click: () => logout() }));
                    openSheet('Mais', r);
                }
            };
            document.querySelectorAll('#m-tabbar button').forEach(b => b.addEventListener('click', () => abas[b.dataset.m]()));
            $('m-backdrop').addEventListener('click', closeSheet);
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('m-sheet-open')) { e.preventDefault(); closeSheet(); } });

            const grupo = { mural: 'mural', 'acervo-fisico': 'acervo', acervo: 'acervo', leituras: 'acervo', cronograma: 'aprender', guias: 'acervo', pedagogico: 'aprender', monitoria: 'aprender', turmas: 'aprender', wifi: 'aprender', faq: 'aprender', artes: 'artes' };
            window.mSync = function () {
                const sec = document.querySelector('.tab-section.active'); if (!sec) return;
                const id = sec.id.replace('tab-', ''), g = grupo[id] || 'mais';
                document.querySelectorAll('#m-tabbar button').forEach(b => b.classList.toggle('on', b.dataset.m === g));
                const t = sec.querySelector('.section-title');
                const PAG = { mural: 'mural', 'acervo-fisico': 'acervo físico', acervo: 'acervo digital', cronograma: 'calendário', guias: 'guias', pedagogico: 'pedagógico', monitoria: 'monitoria', turmas: 'turmas', faq: 'dúvidas', artes: 'artes em foco', achados: 'achados & perdidos', wifi: 'wi-fi', administrativo: 'equipe', carteirinha: 'carteirinha', selos: 'meus selos', configuracoes: 'configurações', sugestoes: 'sugestões', leituras: 'minhas leituras', configuracoes: 'configurações' };
                const pg = PAG[id] || (t ? t.textContent.trim().toLowerCase() : id);
                brand.innerHTML = mq.matches ? '<span class="play-cor play-svg"><svg viewBox=\"0 0 100 100\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M14 10L90 50 14 90Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linejoin=\"round\"/></svg></span>' + ' Portal <span class="sep">●</span> ' + pg : brandOrig;
                // sub-header: ícone de gestão (equipe) ou avatar, e o nome de quem está logado
                const nv = sessionData.nivel || 1, ad = $('m-admin'), av = $('m-ava'), un = $('m-user');
                if (un) un.textContent = sessionData.nome || '';
                if (ad) ad.style.display = nv >= 2 ? '' : 'none';
                if (av) {
                    av.style.display = nv >= 2 ? 'none' : '';
                    av.textContent = '';
                    if (sessionData.foto) { const im = document.createElement('img'); im.src = sessionData.foto; im.alt = ''; av.appendChild(im); } else av.textContent = iniciais(sessionData.nome);
                }
            };
            const _sw = switchTab;
            switchTab = function () { _sw.apply(this, arguments); window.mSync(); window.scrollTo(0, 0); };
            mq.addEventListener('change', () => { window.mSync(); closeSheet(); });
            window.mSync();
        })();

        // Menus suspensos por toque (celular): toque abre/fecha; toque fora ou numa opção fecha
        document.addEventListener('click', e => {
            const dd = e.target.closest('.dropdown');
            const trigger = dd && !e.target.closest('.dropdown-menu');
            const item = e.target.closest('.dropdown-item');
            document.querySelectorAll('.dropdown.open').forEach(d => { if (d !== dd || item) d.classList.remove('open'); });
            if (trigger) dd.classList.toggle('open');
        });

        function copyWifiPassword() {
            navigator.clipboard.writeText('ciee#aprendizagem2023');
            alert('Senha "ciee#aprendizagem2023" copiada com sucesso!');
        }

        // ===== Visitas, acessos por usuário e presença em tempo real (lidos pelo painel admin) =====
        // Observação: os dados ficam no localStorage do navegador. Para estatísticas de TODOS os aparelhos
        // é necessário um servidor; aqui o painel mostra o que foi registrado neste navegador/domínio.
        function cieeVisit() {
            try {
                if (sessionStorage.getItem('ciee_visit')) return;
                sessionStorage.setItem('ciee_visit', '1');
                let v; try { v = JSON.parse(localStorage.getItem('ciee_visitas')) || {}; } catch (e) { v = {}; }
                v.total = (v.total || 0) + 1;
                v.dias = v.dias || {};
                const hoje = new Date().toISOString().slice(0, 10);
                v.dias[hoje] = (v.dias[hoje] || 0) + 1;
                localStorage.setItem('ciee_visitas', JSON.stringify(v));
            } catch (e) {}
        }
        function cieeTrack(s, pagina) {
            try {
                cieeVisit();
                const LS = localStorage, SS = sessionStorage;
                const get = (k, d) => { try { const v = JSON.parse(LS.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
                const put = (k, v) => { try { LS.setItem(k, JSON.stringify(v)); } catch (e) {} };
                let sid = SS.getItem('ciee_sid');
                if (!sid) { sid = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); SS.setItem('ciee_sid', sid); }
                const chave = String(s.email || s.nome || 'anon').toLowerCase();
        
                if (!SS.getItem('ciee_acesso_user')) {           // conta 1 acesso por sessão do navegador
                    SS.setItem('ciee_acesso_user', '1');
                    const a = get('ciee_acessos_usuarios', {});
                    const u = a[chave] || { count: 0 };
                    a[chave] = { nome: s.nome, email: s.email || '', nivel: s.nivel || 1, count: u.count + 1, ultimo: Date.now() };
                    put('ciee_acessos_usuarios', a);
                }
                const beat = () => {
                    const p = get('ciee_presenca', {}), agora = Date.now();
                    Object.keys(p).forEach(k => { if (agora - p[k].ts > 120000) delete p[k]; });
                    p[sid] = { nome: s.nome, email: s.email || '', nivel: s.nivel || 1, ip: SS.getItem('ciee_ip') || 'consultando…', pagina: pagina, ts: agora };
                    put('ciee_presenca', p);
                };
                const comIp = ip => {
                    SS.setItem('ciee_ip', ip);
                    if (s.email) { const m = get('ciee_ips', {}); m[chave] = { ip: ip, ts: Date.now() }; put('ciee_ips', m); }
                    beat();
                };
                if (SS.getItem('ciee_ip')) comIp(SS.getItem('ciee_ip'));
                else fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => comIp(d.ip || 'indisponível')).catch(() => comIp('indisponível'));
                beat();
                setInterval(beat, 10000);
                window.addEventListener('pagehide', () => { const p = get('ciee_presenca', {}); delete p[sid]; put('ciee_presenca', p); });
            } catch (e) {}
        }
        

        // =====================================================================
        // INTEGRAÇÃO COM O PAINEL ADMIN (dados em localStorage; sem dados = conteúdo padrão da página)
        // =====================================================================
        const _ls = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
        const _seguro = u => /^https?:\/\//i.test(u || '') ? u : '';
        const _fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '';
        const _vazio = t => `<div style="grid-column:1/-1;text-align:center;padding:30px;border:2px dashed var(--border-color);border-radius:20px;font-weight:800;color:var(--text-muted)">${t}</div>`;

        // Abre PDF enviado pelo admin (data URL) ou link externo
        function abrirConteudo(origem, tipo, valor, nome) {
            if (tipo === 'Arquivo PDF' && valor) {
                try {
                    const b = atob(valor.split(',')[1]), arr = new Uint8Array(b.length);
                    for (let i = 0; i < b.length; i++) arr[i] = b.charCodeAt(i);
                    const url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
                    window.open(url, '_blank');
                    return;
                } catch (e) { alert('Não foi possível abrir o arquivo.'); return; }
            }
            const u = _seguro(valor);
            if (u) window.open(u, '_blank', 'noopener'); else alert('Conteúdo indisponível no momento.');
        }
        const _guardaConteudo = {};   // evita colocar data URLs enormes dentro do HTML
        function abrirItem(chave) { const c = _guardaConteudo[chave]; if (c) abrirConteudo('', c.tipo, c.valor); }

        // confetes ao tocar num aniversariante
        function anivConfete(bt) {
            const card = bt.closest('.aniv-card'), r = bt.getBoundingClientRect(), c = card.getBoundingClientRect(), cores = ['#ff8fab', '#ffd166', '#7c5cff', '#00b4d8', '#16a34a'];
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches) for (let i = 0; i < 26; i++) {
                const s = document.createElement('i'); s.className = 'aniv-boom';
                s.style.cssText = `left:${r.left - c.left + r.width / 2}px;top:${r.top - c.top + r.height / 2}px;background:${cores[i % 5]};--dx:${(Math.random() - .5) * 220}px;--dy:${-60 - Math.random() * 120}px;--rz:${Math.random() * 720}deg`;
                card.appendChild(s); setTimeout(() => s.remove(), 1300);
            }
            const m = $('aniv-msg'); m.textContent = 'Parabéns, ' + (bt.dataset.nome || 'colega') + '! Muitas felicidades!';
            clearTimeout(anivConfete.t); anivConfete.t = setTimeout(() => { m.textContent = 'Toque em um colega para mandar confetes!'; }, 3500);
        }
        function renderMural() {
            const hoje = new Date().toISOString().slice(0, 10), mes = new Date().getMonth();
            const us = (_ls('ciee_users') || []).filter(u => u.nasc && new Date(u.nasc + 'T00:00:00').getMonth() === mes)
                .sort((a, b) => new Date(a.nasc + 'T00:00:00').getDate() - new Date(b.nasc + 'T00:00:00').getDate());
            const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'], diaHoje = new Date().getDate();
            if ($('aniv-mes')) $('aniv-mes').textContent = 'Em ' + MESES[mes] + ' · ' + us.length + (us.length === 1 ? ' colega' : ' colegas');
            // até 5 por mês: primeiro quem faz aniversário hoje ou ainda vai fazer, depois os que já passaram
            const dia = u => new Date(u.nasc + 'T00:00:00').getDate();
            const mostrar = us.filter(u => dia(u) >= diaHoje).concat(us.filter(u => dia(u) < diaHoje)).slice(0, 5);
            const li = mostrar.map(u => { const d = new Date(u.nasc + 'T00:00:00'), eh = d.getDate() === diaHoje;
                return `<li${eh ? ' class="hoje"' : ''}><button type="button" class="aniv-pessoa" data-nome="${_esc(String(u.nome || '').split(' ')[0])}" onclick="anivConfete(this)"><span class="aniv-dia"><b>${String(d.getDate()).padStart(2, '0')}</b><small>${MESES[d.getMonth()].slice(0, 3)}</small></span><span class="ini-ava aniv-ava">${_esc(iniciais(u.nome))}</span><span class="aniv-nome">${_esc(u.nome)}<small>${_esc(u.periodo || '')}${u.cidade ? ' • ' + _esc(u.cidade) : ''}</small></span>${eh ? '<span class="aniv-tag">Hoje!</span>' : ''}</button></li>`; });
            const hojeL = us.filter(u => dia(u) === diaHoje);
            if ($('aniv-hoje')) { $('aniv-hoje').hidden = !hojeL.length; $('aniv-hoje').innerHTML = hojeL.length ? 'Hoje é aniversário de <strong>' + hojeL.map(u => _esc(String(u.nome || '').split(' ')[0])).join(', ') + '</strong>! Mande seus parabéns.' : ''; }
            const ul = $('aniv-list'), view = $('aniv-view');
            ul.style.animation = 'none'; ul.style.position = 'static'; view.classList.add('poucos');      // no máximo 5: a lista fica parada
            ul.innerHTML = li.length ? li.join('') + (us.length > 5 ? `<li class="aniv-mais">e mais ${us.length - 5} no mês</li>` : '') : '<li>Nenhum aniversariante cadastrado neste mês.</li>';
            const posts = _ls('ciee_mural');
            if (posts) {
                const lista = posts.filter(p => !p.ate || p.ate >= hoje).sort((a, b) => (b.fixado === 'Sim') - (a.fixado === 'Sim') || (b.criadoEm || 0) - (a.criadoEm || 0));
                const POR = 6, paginas = Math.max(1, Math.ceil(lista.length / POR)); if (window._muralPag > paginas || !window._muralPag) window._muralPag = 1;
                const fatia = lista.slice((window._muralPag - 1) * POR, window._muralPag * POR);
                let pag = '';
                if (paginas > 1) { pag = '<nav class="mural-pag" aria-label="Páginas do mural">'; for (let n = 1; n <= paginas; n++) pag += `<button type="button" onclick="muralPagina(${n})"${n === window._muralPag ? ' aria-current="page"' : ''}>${n}</button>`; pag += '</nav>'; }
                $('mural-posts').innerHTML = (fatia.map(p => `<div class="generic-card" ${p.fixado === 'Sim' ? 'style="border-color:var(--theme-primary)"' : ''}>
                        <span class="badge-info">${_esc(p.tipo)}</span>
                        <h3 class="card-title">${_esc(p.titulo)}</h3>
                        <p class="card-subtitle" style="white-space:pre-line">${_esc(p.texto)}</p>
                        <small style="color:var(--text-muted);font-weight:700">${_esc(p.autor || '')}${p.criadoEm > 1e6 ? ' • ' + new Date(p.criadoEm).toLocaleDateString('pt-BR') : ''}</small></div>`).join('') || _vazio('Nenhum aviso no momento.')) + pag;
            }
        }
        function muralPagina(n) { window._muralPag = n; renderMural(); const g = $('mural-posts'); if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' }); }

        // Acervo físico: livros com empréstimo (dados do admin; sem dados = exemplos da página)
        const _demoBooks = books.slice();
        function carregarFisicos() {
            const ac = _ls('ciee_acervo');
            if (!ac) { books = _demoBooks; return; }
            const emp = _ls('ciee_emprestimos') || [], meu = String(sessionData.email || '').toLowerCase();
            const pedidos = (_ls('ciee_solicitacoes') || []).filter(x => (x.status || 'Aguardando') === 'Aguardando');
            const meuPedido = x => String(x.email || '').toLowerCase() === meu;
            books = ac.map(b => {
                const e = emp.find(x => x.codigo === b.codigo), pend = pedidos.filter(x => x.codigo === b.codigo);
                const o = { id: b.codigo, isbn: String(b.isbn || ''), cover: b.capa || '', editora: b.editora || '', ano: b.ano || '', local: b.local || '', sinopse: b.desc || '', title: b.titulo, author: b.autor, cat: b.categoria, status: 'disp', desc: b.desc || [b.editora, b.ano, b.local && '' + b.local].filter(Boolean).join(' • ') || 'Disponível para empréstimo.' };
                if (e) {
                    if (meu && String(e.email || '').toLowerCase() === meu) {
                        const [d, m, a] = String(e.devolucao || '').split('/').map(Number);
                        const dias = a ? Math.ceil((new Date(a, m - 1, d) - new Date()) / 86400000) : 30;
                        Object.assign(o, { status: 'emp_eu', daysLeft: Math.max(0, dias), desc: 'Emprestado para você.', venceEm: e.devolucao });
                        if (pend.some(x => meuPedido(x) && x.tipo === 'Devolução')) o.status = 'dev_eu';
                        else if (pend.some(x => meuPedido(x) && x.tipo === 'Renovação')) o.status = 'ren_eu';
                    } else Object.assign(o, { status: 'emp_outro', desc: 'Emprestado para outro usuário.' });
                } else {
                    const pe = pend.find(x => x.tipo === 'Empréstimo' || x.tipo === 'Reserva');
                    if (pe) Object.assign(o, { status: meuPedido(pe) ? 'ped_eu' : 'ped_outro', desc: meuPedido(pe) ? 'Você pediu este livro. Aguarde a aprovação da equipe.' : 'Há um pedido em análise para este livro.' });
                }
                return o;
            });
        }
        // ----- pedidos do aprendiz: vão para Solicitações no painel (a equipe aprova ou recusa) -----
        function bkPedir(tipo, id) {
            const b = (books || []).find(x => x.id === id); if (!b) return;
            const meu = String(sessionData.email || '').toLowerCase(); if (!meu) return bkAviso('Entre com o seu login para fazer pedidos.');
            const lista = _ls('ciee_solicitacoes') || [];
            if (lista.some(x => x.codigo === id && String(x.email || '').toLowerCase() === meu && (x.status || 'Aguardando') === 'Aguardando')) return bkAviso('Você já tem um pedido para este livro aguardando a equipe.');
            lista.push({ id: Date.now(), tipo, aprendiz: sessionData.nome, email: meu, fone: sessionData.whats || '', livro: `${b.title} (${b.id})`, codigo: b.id, turma: [sessionData.cidade, sessionData.periodo].filter(Boolean).join(' / '), status: 'Aguardando', ts: Date.now() });
            try { localStorage.setItem('ciee_solicitacoes', JSON.stringify(lista)); } catch (e) { return bkAviso('Não foi possível enviar o pedido agora.'); }
            bkFechar(); renderIntegrado();
            bkAviso({ 'Empréstimo': 'Pedido enviado! A equipe vai avaliar e você verá a resposta aqui.', 'Devolução': 'Devolução enviada! A equipe vai conferir o livro.', 'Renovação': 'Pedido de renovação enviado! Aguarde a resposta da equipe.' }[tipo]);
        }
        function bkCancelarPedido(id) {
            const meu = String(sessionData.email || '').toLowerCase();
            const lista = (_ls('ciee_solicitacoes') || []).filter(x => !(x.codigo === id && String(x.email || '').toLowerCase() === meu && (x.status || 'Aguardando') === 'Aguardando' && x.tipo === 'Empréstimo'));
            localStorage.setItem('ciee_solicitacoes', JSON.stringify(lista)); bkFechar(); renderIntegrado(); bkAviso('Pedido cancelado.');
        }
        // respostas da equipe (pedidos recusados) aparecem no topo do acervo físico até o aprendiz marcar "Entendi"
        function renderAvisosPedidos() {
            const box = document.getElementById('bk-avisos'); if (!box) return;
            const meu = String(sessionData.email || '').toLowerCase();
            const rec = (_ls('ciee_solicitacoes') || []).filter(x => x.status === 'Recusada' && String(x.email || '').toLowerCase() === meu);
            box.innerHTML = rec.map(x => `<div class="bk-aviso" role="alert"><div><strong>Pedido de ${_esc(String(x.tipo || '').toLowerCase())} recusado</strong><span>${_esc(x.livro)}</span><em>Motivo: ${_esc(x.motivo || 'não informado')}</em></div><button type="button" class="btn-action btn-primary" data-id="${_esc(x.id)}" onclick="bkEntendi(this.dataset.id)">Entendi</button></div>`).join('');
        }
        function bkEntendi(id) { const l = (_ls('ciee_solicitacoes') || []).filter(x => String(x.id) !== String(id)); localStorage.setItem('ciee_solicitacoes', JSON.stringify(l)); renderAvisosPedidos(); }

        function renderCategoriasSelect() {
            const cats = _ls('ciee_categorias'); if (!cats) return;
            ['category-select', 'dig-cat'].forEach(id => {
                const sel = document.getElementById(id), v = sel.value || 'Todos';
                sel.innerHTML = '<option value="Todos">Todas as Categorias</option>' + cats.map(c => `<option value="${_esc(c.prefixo)}">${_esc(c.prefixo)} - ${_esc(c.nome)}</option>`).join('');
                sel.value = [...sel.options].some(o => o.value === v) ? v : 'Todos';
            });
        }

        // Acervo digital: cards com PDF/link (sem legenda de empréstimo nem disponibilidade)
        function renderDigitais() {
            const lista = _ls('ciee_livros_digitais') || [];
            const q = ($('dig-busca').value || '').toLowerCase(), cat = $('dig-cat').value || 'Todos';
            const f = lista.filter(b => (cat === 'Todos' || b.categoria === cat) && [b.titulo, b.autor, b.categoria].some(x => String(x || '').toLowerCase().includes(q)));
            const itens = f.map(b => { _guardaConteudo['d' + b._id] = { tipo: b.tipoFonte, valor: b.tipoFonte === 'Arquivo PDF' ? b.arquivo : b.url };
                return { tipo: 'digital', key: b._id, id: b.categoria, cat: b.categoria, title: b.titulo, author: b.autor, desc: b.desc || '', sinopse: b.desc || '', cover: b.capa || '', fonte: b.tipoFonte }; });
            window._bkDig = itens;
            $('digital-container').innerHTML = itens.length ? itens.map(bkCartao).join('') : _vazio('Nenhum livro digital encontrado.');
        }

        // Menu Acervo: links extras gerenciados no admin
        function renderMenuAcervo() {
            const l = _ls('ciee_menu_acervo'); if (!l) return;
            const m = $('menu-acervo');
            m.querySelectorAll('.extra-acervo').forEach(a => a.remove());
            l.forEach(x => { if (!_seguro(x.link)) return; const a = document.createElement('a'); a.className = 'dropdown-item extra-acervo'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.rel = 'noopener'; a.href = x.link; a.textContent = x.titulo + ''; m.appendChild(a); });
        }

        // Calendário do Outlook no celular: o iframe é renderizado numa largura "virtual" e reduzido para caber na tela (sem rolagem lateral)
        const CAL_LARGURAS = [1100, 960, 840, 720, 620, 520];
        let calIdx = 3; try { const z = parseInt(localStorage.getItem('ciee_cal_zoom'), 10); if (z >= 0 && z < CAL_LARGURAS.length) calIdx = z; } catch (e) {}
        function calFit() {
            const box = document.getElementById('cal-box'), fr = document.getElementById('cal-frame'); if (!box || !fr) return;
            if (!window.matchMedia('(max-width: 820px)').matches) { fr.style.width = ''; fr.style.height = ''; fr.style.transform = ''; return; }
            const w = box.clientWidth; if (!w) return;
            const virt = CAL_LARGURAS[calIdx], esc = Math.min(1, w / virt);
            fr.style.width = virt + 'px'; fr.style.height = Math.round(box.clientHeight / esc) + 'px'; fr.style.transform = 'scale(' + esc + ')';
        }
        function calZoom(d) { calIdx = Math.max(0, Math.min(CAL_LARGURAS.length - 1, calIdx + d)); try { localStorage.setItem('ciee_cal_zoom', calIdx); } catch (e) {} calFit(); }
        window.addEventListener('resize', calFit);

        function renderCalendario() { if (window.cieeCalendario) cieeCalendario.render(); }   // js/features/calendario.js (sem Outlook)

        function renderGuias() {
            const g = _ls('ciee_guias'); if (!g) return;
            document.querySelector('#tab-guias .mural-grid').innerHTML = g.length ? g.map(x => { _guardaConteudo['g' + x._id] = { tipo: x.tipoFonte, valor: x.tipoFonte === 'Arquivo PDF' ? x.arquivo : x.url };
                return `<div class="generic-card" style="align-items:center;text-align:center;"><h3 class="card-title" style="margin-bottom:${x.desc ? 6 : 15}px;">${_esc(x.titulo)}</h3>
                    ${x.desc ? `<p class="card-subtitle" style="margin-bottom:15px">${_esc(x.desc)}</p>` : ''}
                    <button class="btn-action btn-reserve" onclick="abrirItem('g${_esc(x._id)}')">${x.tipoFonte === 'Arquivo PDF' ? 'Baixar PDF' : 'Abrir'}</button></div>`; }).join('')
                : _vazio('Nenhum guia disponível no momento.');
        }

        function renderEquipe() {
            const o = _ls('ciee_orientadores'), m = _ls('ciee_monitores'), rp = _ls('ciee_representantes') || [], a = _ls('ciee_administrativo'), t = _ls('ciee_turmas');
            const cidade = (sessionData && sessionData.cidade) || '';
            const ord = (x, y) => (y.cidade === cidade) - (x.cidade === cidade);
            const nn = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const codigos = _ls('ciee_codigos_acesso') || [];
            const fotoDe = nome => { const c = codigos.find(x => x.foto && nn(x.perfil) === nn(nome)); return c ? c.foto : ''; };
            const card = (p, ico) => `<div class="team-card" style="align-items:center;text-align:center;">${fotoDe(p.nome) ? `<img src="${_esc(imgOk(fotoDe(p.nome)))}" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:50%;border:3px solid var(--theme-primary)">` : `<div class="ini-ava ini-grande" style="margin:0 auto 6px">${iniciais(p.nome)}</div>`}
                <h3 class="card-title">${_esc(p.nome)}</h3><p class="card-subtitle">${_esc('Monitor(a)')} • ${_esc(p.cidade)}</p>
                ${p.email ? `<a class="contact-line" href="mailto:${_esc(p.email)}">${_esc(p.email)}</a>` : '<span class="contact-line" style="opacity:.7">E-mail não informado</span>'}
                ${p.fone ? `<p style="font-size:.85rem;color:var(--text-muted);font-weight:700">${_esc(p.fone)}</p>` : ''}</div>`;
            if (o) document.getElementById('team-container').innerHTML = o.length ? [...o].sort(ord).map(p => card(p, '')).join('') : _vazio('Nenhum orientador cadastrado.');
            if (m) document.getElementById('monitoria-container').innerHTML = m.length ? [...m].sort(ord).map(p => card(p, '')).join('') : _vazio('Nenhum monitor cadastrado.');
            const rt = document.getElementById('rep-titulo'), rc = document.getElementById('representantes-container');
            if (rt && rc) { rt.style.display = rp.length ? '' : 'none'; rc.innerHTML = [...rp].sort(ord).map(p => card({ nome: p.nome, cargo: 'Representante • ' + (p.turma || ''), cidade: p.cidade, email: p.email, fone: p.fone }, '')).join(''); }
            if (a) document.getElementById('sectors-container').innerHTML = a.map(s => `<div class="sector-card"><div>
                <strong style="color:var(--theme-primary);">${_esc(s.setor)}</strong><div style="font-weight:700;font-size:0.95rem;">${_esc(s.nome)}</div>
                ${s.fone ? `<div style="font-size:.85rem;color:var(--text-muted);font-weight:700">${_esc(s.fone)}</div>` : ''}</div>
                <a href="mailto:${_esc(s.email)}" style="color:var(--theme-primary);font-weight:800;text-decoration:none;">E-mail</a></div>`).join('') || _vazio('Nenhum contato cadastrado.');
            if (t) document.getElementById('turmas-container').innerHTML = [...t].sort(ord).map(x => `<div class="turma-card"><span class="book-code">${_esc(x.codId)}</span>
                <h4 class="card-title" style="font-size:1.1rem;margin-top:5px;">${_esc(x.diaPeriodo)}</h4>
                <p class="card-subtitle" style="margin-bottom:8px;">Responsável: ${_esc(x.responsavel)}</p>
                <p style="font-size:0.85rem;color:var(--text-muted);">${_esc(x.cidade)}</p></div>`).join('') || _vazio('Nenhuma turma cadastrada.');
        }

        function renderFaq() {
            const f = _ls('ciee_faq'); if (!f) return;
            const sec = document.getElementById('tab-faq');
            sec.innerHTML = `<h2 class="section-title">Dúvidas Frequentes (FAQ)</h2><p class="section-desc">Respostas rápidas para as principais dúvidas.</p>` +
                ([...f].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(x => `<div class="generic-card" style="margin-bottom:14px"><h3 class="card-title">${_esc(x.pergunta)}</h3>
                    <p class="card-subtitle" style="margin:0;white-space:pre-line">${_esc(x.resposta)}</p></div>`).join('') || _vazio('Nenhuma pergunta cadastrada.'));
        }

        function renderArtes() {
            const ar = _ls('ciee_artes'); if (!ar) return;
            document.querySelector('#tab-artes .mural-grid').innerHTML = ar.map(x => `<div class="generic-card" style="text-align:center;">
                ${x.imagem ? `<img src="${_esc(imgOk(x.imagem))}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:14px;margin-bottom:10px">` : ''}
                <h3 class="card-title">${_esc(x.titulo)}</h3><p class="card-subtitle">${_esc(x.desc)}</p>
                ${_seguro(x.link) ? `<button class="btn-action btn-reserve" data-url="${_esc(_seguro(x.link))}" onclick="window.open(this.dataset.url,'_blank','noopener')">${_esc(x.btn || 'Abrir')}</button>` : ''}</div>`).join('') || _vazio('Nenhum conteúdo por enquanto.');
        }

        function renderAchados() {
            const ob = _ls('ciee_objetos_achados'); if (!ob) return;
            document.getElementById('lost-found-container').innerHTML = ob.length ? ob.map(x => `<div class="lost-found-card"><div>
                ${x.imagem ? `<img src="${_esc(imgOk(x.imagem))}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:14px;margin-bottom:10px">` : ''}
                <h3 class="card-title" style="text-align:center;">${_esc(x.nome)}</h3><div style="margin:12px 0;">
                <div class="badge-info">Encontrado em: ${_esc(x.data)}${x.periodo ? ' (' + _esc(x.periodo) + ')' : ''}</div>
                <div class="badge-info">Local: ${_esc(x.cidade)}</div></div></div></div>`).join('') : _vazio('Nenhum objeto registrado no momento.');
        }

        const WIFI_PAD = { titulo: 'Conecta Wi-Fi CIEE', ssid: 'CIEE Alunos', senha: 'ciee#aprendizagem2023', tipo: 'WPA', texto: 'Aponte a câmera do seu celular para o QR Code abaixo para se conectar automaticamente:' };
        function wifiAtualPlay() { return Object.assign({}, WIFI_PAD, _ls('ciee_wifi') || {}); }
        function renderWifi() {
            const w = wifiAtualPlay();
            const esc = s => String(s).replace(/([\\;,:"])/g, '\\$1');
            const qr = (t => { try { const q = qrcode(0, 'M'); q.addData(t); q.make(); return q.createDataURL(5, 8); } catch (e) { return ''; } })(`WIFI:S:${esc(w.ssid)};T:${w.tipo};P:${esc(w.senha)};;`);   // gerado no aparelho: a senha do Wi-Fi não sai para outro site
            const box = document.querySelector('#tab-wifi > div');
            box.querySelector('h2').textContent = w.titulo; box.querySelector('p').textContent = w.texto;
            box.querySelector('img').src = qr; box.querySelector('code').textContent = w.ssid;
            const bt = box.querySelector('button'); bt.style.display = w.tipo === 'nopass' ? 'none' : '';
        }
        copyWifiPassword = function () {
            const w = wifiAtualPlay();
            navigator.clipboard.writeText(w.senha).then(() => alert('Senha copiada com sucesso!'), () => alert('Senha do Wi-Fi: ' + w.senha));
        };

        function renderIntegrado() {
            renderMural(); carregarFisicos(); renderCategoriasSelect(); applyFilters(); renderAvisosPedidos(); renderDigitais(); renderMenuAcervo(); renderCalendario(); renderGuias();
            renderEquipe(); renderFaq(); renderArtes(); renderAchados(); renderWifi();
        }
        renderIntegrado();
        window.addEventListener('storage', renderIntegrado);       // atualiza ao vivo quando o admin altera
        cieeTrack(sessionData, 'PLAY');
    
