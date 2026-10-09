/* Lógica de admin.html (extraída da página) */
        const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const imgOk = u => /^(data:image\/(png|jpe?g|gif|webp);base64,|https:\/\/|blob:)/i.test(String(u || '')) ? String(u) : '';   // só imagens seguras (sem javascript:, sem SVG embutido)
        const iniciais = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
        // Variáveis globais para suporte à Gestão de Turmas e Cidades
        let cidadesList = ['Tubarão', 'Imbituba', 'Braço do Norte'];

        // Variável global para upload de imagem no modal
        let tempImageBase64 = '';
        let tempFileName = '';
        window.handleImageUpload = function(input) {
            const file = input.files[0];
            if (!file) return;
            tempFileName = file.name;
            const reader = new FileReader();
            if (file.type.startsWith('image/')) {
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {   // reduz a imagem para caber no armazenamento do navegador
                        const k = Math.min(1, 900 / Math.max(img.width, img.height));
                        const c = document.createElement('canvas');
                        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
                        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
                        x.drawImage(img, 0, 0, c.width, c.height);
                        tempImageBase64 = c.toDataURL('image/jpeg', 0.8);
                    };
                    img.src = e.target.result;
                };
            } else {
                if (file.size > 2.5 * 1024 * 1024) { input.value = ''; tempImageBase64 = ''; alert('Arquivo maior que 2,5 MB. Use um link externo.'); return; }
                reader.onload = (e) => { tempImageBase64 = e.target.result; };
            }
            reader.readAsDataURL(file);
        };

        // ANO AUTOMÁTICO NO FOOTER
        document.getElementById('current-year').textContent = new Date().getFullYear();

        // TEMA E VISUAL
        function initTheme() {
            const savedDarkTheme = localStorage.getItem('ciee_theme') || 'light';
            const savedColorTheme = localStorage.getItem('ciee_color_theme') || 'blue';
            
            document.documentElement.setAttribute('data-theme', savedDarkTheme);
            document.documentElement.setAttribute('data-color-theme', savedColorTheme);
            
            updateThemeButton(savedDarkTheme);
        }

        function toggleDarkTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ciee_theme', newTheme);
            updateThemeButton(newTheme);
        }

        function setColorTheme(color) {
            document.documentElement.setAttribute('data-color-theme', color);
            localStorage.setItem('ciee_color_theme', color);
        }

        function updateThemeButton(theme) {
            const btn = document.getElementById('theme-toggle-btn');
            if (btn) btn.innerHTML = theme === 'dark' ? '' : '';
        }

        initTheme();

        // VALIDAÇÃO DE AUTENTICAÇÃO
        let sessionData = null;
        try { sessionData = JSON.parse(localStorage.getItem('ciee_session') || sessionStorage.getItem('ciee_session')); } catch (e) {}

        if (!sessionData || !sessionData.nivel || sessionData.nivel < 2) {
            document.getElementById('admin-main-wrapper').style.display = 'none';
            document.querySelector('.admin-footer').style.display = 'none';
            document.getElementById('access-denied-screen').style.display = 'flex';

            // Redireciona para a tela de login após 5 segundos (mesmo tempo das demais telas de aviso)
            let deniedSeconds = 5;
            const deniedEl = document.getElementById('denied-count');
            const deniedTimer = setInterval(() => {
                deniedSeconds--;
                deniedEl.textContent = deniedSeconds;
                if (deniedSeconds <= 0) { clearInterval(deniedTimer); location.href = 'index.html?acao=login'; }
            }, 1000);
        } else {
            document.getElementById('admin-name').innerText = sessionData.nome || 'Usuário';
            document.getElementById('admin-avatar').innerText = iniciais(sessionData.nome);
            if (sessionData.foto) document.getElementById('admin-avatar').innerHTML = `<img src="${escHtml(imgOk(sessionData.foto))}" class="thumb-avatar" alt="">`;
            
            const rolesMap = { 2: 'Representante (Nível 2)', 3: 'Monitor (Nível 3)', 4: 'Orientador (Nível 4)', 5: 'Webmaster (Nível 5)' };
            document.getElementById('admin-role').innerText = rolesMap[sessionData.nivel] || 'Gestor CIEE';

            const titulosPorNivel = {
                2: "CIEESC ▶︎ PLAY • Representantes",
                3: "CIEESC ▶︎ PLAY • Monitores",
                4: "CIEESC ▶︎ PLAY • Orientadores",
                5: "CIEESC ▶︎ PLAY • Administrador"
            };

            if (titulosPorNivel[sessionData.nivel]) {
                const tituloFormatado = titulosPorNivel[sessionData.nivel];
                document.title = tituloFormatado;
                const brandText = document.getElementById('brand-text');
                if (brandText) brandText.innerHTML = tituloFormatado.replace('▶︎', '<span class="play-cor play-svg"><svg viewBox=\"0 0 100 100\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M14 10L90 50 14 90Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linejoin=\"round\"/></svg></span>');
            }

            if (sessionData.nivel >= 4) {
                const excContainer = document.getElementById('solicitacoes-exclusao-container');
                if (excContainer) excContainer.style.display = 'block';
            }
        }

        // LOGOUT: encerra a sessão, mostra a tela de saída e redireciona para o portal
        function toggleUserMenu(e) { if (e) e.stopPropagation(); const m = $('user-menu'), on = !m.classList.contains('open'); m.classList.toggle('open', on); $('user-badge').setAttribute('aria-expanded', String(on)); }
        document.addEventListener('click', e => { const m = $('user-menu'); if (m && m.classList.contains('open') && !m.contains(e.target)) { m.classList.remove('open'); $('user-badge').setAttribute('aria-expanded', 'false'); } });
        document.addEventListener('keydown', e => { const m = $('user-menu'); if (e.key === 'Escape' && m && m.classList.contains('open')) { m.classList.remove('open'); $('user-badge').focus(); } });
        function logout() {
            localStorage.removeItem('ciee_session');
            sessionStorage.removeItem('ciee_session');
            document.getElementById('admin-main-wrapper').style.display = 'none';
            const footer = document.querySelector('.admin-footer');
            if (footer) footer.style.display = 'none';
            document.getElementById('access-denied-screen').style.display = 'none';
            document.getElementById('logout-screen').style.display = 'flex';
            let s = 5;
            const el = document.getElementById('logout-count');
            const iv = setInterval(() => {
                s--; el.textContent = s;
                if (s <= 0) { clearInterval(iv); location.href = 'index.html'; }
            }, 1000);
        }

        // POPUPS E MODAIS
        let callbackConfirmacaoModal = null;

        function abrirModalCustom(opcoes) {
            document.getElementById('modal-title').innerText = opcoes.titulo || 'Atenção';
            document.getElementById('modal-icon').innerText = '';   // sem emojis: o título já diz o que aconteceu
            document.getElementById('modal-body-content').innerText = opcoes.texto || '';

            const extraContainer = document.getElementById('modal-extra-content');
            if (opcoes.extraHTML) {
                extraContainer.innerHTML = opcoes.extraHTML;
                extraContainer.style.display = 'block';
            } else {
                extraContainer.innerHTML = '';
                extraContainer.style.display = 'none';
            }

            const inputContainer = document.getElementById('modal-input-container');
            const inputField = document.getElementById('modal-input-field');
            const dynamicContainer = document.getElementById('modal-dynamic-fields');

            dynamicContainer.innerHTML = '';
            dynamicContainer.style.display = 'none';

            if (opcoes.temInput) {
                inputContainer.style.display = 'block';
                inputField.value = opcoes.valorInicial !== undefined ? opcoes.valorInicial : '';
                document.getElementById('modal-input-label').innerText = opcoes.labelInput || 'Informe o valor:';
            } else {
                inputContainer.style.display = 'none';
            }

            if (opcoes.camposMultiplos && Array.isArray(opcoes.camposMultiplos)) {
                dynamicContainer.style.display = 'block';
                opcoes.camposMultiplos.forEach(campo => {
                    const div = document.createElement('div');
                    div.className = 'form-group';
                    div.style.marginBottom = '12px';
                    
                    if (campo.tipo === 'select') {
                        let optionsHTML = campo.opcoes.map(opt => 
                            `<option value="${escHtml(opt.value)}" ${opt.value === campo.valorInicial ? 'selected' : ''}>${escHtml(opt.label)}</option>`
                        ).join('');
                        div.innerHTML = `
                            <label style="font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">${campo.label}</label>
                            <select id="modal_field_${campo.id}" style="width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-dark);" ${campo.onChange ? `onchange="${campo.onChange}"` : ''}>
                                ${optionsHTML}
                            </select>
                        `;
                    } else if (campo.tipo === 'textarea') {
                        div.innerHTML = `
                            <label style="font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">${campo.label}</label>
                            <textarea id="modal_field_${campo.id}" rows="4" style="width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-dark); font-family: inherit;"></textarea>
                        `;
                        setTimeout(() => { const t = document.getElementById(`modal_field_${campo.id}`); if (t) t.value = campo.valorInicial ?? ''; }, 0);
                    } else if (campo.tipo === 'imagem') {
                        const v0 = campo.valorInicial || '';
                        div.innerHTML = `
                            <label style="font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">${campo.label}</label>
                            <div class="capa-campo"><div class="capa-prev" id="modal_prev_${campo.id}">${v0 ? `<img src="${escHtml(imgOk(v0))}" alt="Prévia da capa">` : '<span>Sem imagem</span>'}</div>
                            <div class="capa-btns"><button type="button" class="btn-action btn-primary" onclick="editarCapa('${campo.id}')">Escolher e formatar imagem</button><button type="button" class="btn-action btn-danger" id="modal_rem_${campo.id}" onclick="removerCapa('${campo.id}')" ${v0 ? '' : 'style="display:none"'}>Remover</button></div></div>
                            <input type="hidden" id="modal_field_${campo.id}" value="${escHtml(v0)}">`;
                    } else if (campo.tipo === 'file') {
                        div.innerHTML = `
                            <label style="font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">${campo.label}</label>
                            <input type="file" id="modal_field_${campo.id}" accept="${campo.accept || 'image/*'}" ${campo.accept ? '' : 'capture="environment"'} onchange="handleImageUpload(this)"
                                   style="width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-dark);">
                        `;
                    } else {
                        div.innerHTML = `
                            <label style="font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">${campo.label}</label>
                            <input type="${campo.tipo || 'text'}" id="modal_field_${campo.id}" value="${escHtml(campo.valorInicial ?? '')}" ${campo.readonly ? 'readonly' : ''}
                                   style="width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-dark);">
                        `;
                    }
                    dynamicContainer.appendChild(div);
                });
            }

            const emailContainer = document.getElementById('modal-email-container');
            if (opcoes.temEmailOption) {
                emailContainer.style.display = 'block';
                document.getElementById('modal-email-checkbox').checked = true;
            } else {
                emailContainer.style.display = 'none';
            }

            const btnConfirm = document.getElementById('modal-btn-confirm');
            const btnCancel = document.getElementById('modal-btn-cancel');

            if (opcoes.esconderBotoesPadrao || !opcoes.onConfirm) {
                btnConfirm.style.display = 'none';
                btnCancel.className = 'btn-action btn-primary';
                btnCancel.innerText = 'Entendido!';
            } else {
                btnCancel.className = 'btn-action btn-danger';
                btnConfirm.style.display = 'inline-flex';
                btnConfirm.innerText = opcoes.textoBtnConfirmar || 'Confirmar';
                btnCancel.innerText = 'Cancelar';
            }

            callbackConfirmacaoModal = () => {
                const enviarEmail = opcoes.temEmailOption ? document.getElementById('modal-email-checkbox').checked : false;
                const valorInput = inputField.value.trim();

                if (opcoes.temInput && opcoes.inputObrigatorio && !valorInput) {
                    inputField.style.borderColor = 'var(--red)';
                    return;
                }

                let valores = {};
                if (opcoes.camposMultiplos) {
                    let valido = true;
                    for (let campo of opcoes.camposMultiplos) {
                        const el = document.getElementById(`modal_field_${campo.id}`);
                        let val = '';
                        if (campo.tipo !== 'file') {
                            val = el ? el.value.trim() : '';
                        } else {
                            val = tempImageBase64 ? 'ok' : '';
                        }

                        if (campo.obrigatorio && !val) {
                            if (el) el.style.borderColor = 'var(--red)';
                            valido = false;
                        } else if (el) {
                            el.style.borderColor = 'var(--border-color)';
                        }
                        valores[campo.id] = val;
                    }
                    if (!valido) return;
                }

                fecharModalCustom();
                if (opcoes.onConfirm) {
                    opcoes.onConfirm({ enviarEmail, valorInput, valores });
                }
            };

            btnConfirm.onclick = callbackConfirmacaoModal;
            document.getElementById('custom-modal-overlay').style.display = 'flex';
        }

        // ----- imagem de capa (livros): escolher, formatar e remover -----
        function capaPrev(id, url) { const p = $('modal_prev_' + id); if (p) p.innerHTML = url ? `<img src="${escHtml(imgOk(url))}" alt="Prévia da capa">` : '<span>Sem imagem</span>'; const r = $('modal_rem_' + id); if (r) r.style.display = url ? '' : 'none'; }
        function editarCapa(id) { const el = $('modal_field_' + id); cieeImagem.editar({ titulo: 'Capa do livro', atual: el.value || '', onOk: u => { el.value = u; capaPrev(id, u); }, onRemover: el.value ? () => { el.value = ''; capaPrev(id, ''); } : null }); }
        function removerCapa(id) { $('modal_field_' + id).value = ''; capaPrev(id, ''); }
        function fecharModalCustom() {
            document.getElementById('custom-modal-overlay').style.display = 'none';
        }

        function abrirModalContato(nome, email, fone) {
            const rawFone = fone ? fone.replace(/\D/g, '') : '';
            const foneHref = rawFone ? `https://wa.me/55${rawFone}` : '#';

            abrirModalCustom({
                titulo: `Contato com ${nome}`,
                icone: '',
                texto: `Escolha como deseja se comunicar com o aprendiz:`,
                esconderBotoesPadrao: true,
                extraHTML: `
                    <div class="contact-choice-box">
                        <a href="mailto:${escHtml(email)}" target="_blank" rel="noopener noreferrer" class="contact-choice-btn email">Via e-mail</a>
                        <a href="${escHtml(foneHref)}" ${rawFone ? 'target="_blank" rel="noopener noreferrer"' : ''} class="contact-choice-btn phone" ${!rawFone ? 'onclick="alert(\'Telefone não cadastrado!\'); return false;"' : ''}>Via telefone / WhatsApp</a>
                    </div>
                `
            });
        }

        // TROCA DE ABAS E CONTROLE DOS QUADRINHOS (STATS GRID)


        // SISTEMA DE EXCLUSÕES CENTRALIZADO
        let solicitacoesExclusao = JSON.parse(localStorage.getItem('ciee_solicitacoes_exclusao')) || [];

        function solicitarOuExcluir(tipo, item, index, callbackExcluirDirect) {
            const ehMonitor = sessionData && sessionData.nivel <= 3;      // Representante e Monitor pedem aprovação

            if (ehMonitor) {
                abrirModalCustom({
                    titulo: 'Solicitar Exclusão',
                    icone: '',
                    texto: `Como ${sessionData.nivel === 2 ? 'Representante' : 'Monitor(a)'}, sua solicitação de exclusão para "${item}" precisa do envio do motivo e aprovação dos Orientadores/Administrador.`,
                    temInput: true,
                    inputObrigatorio: true,
                    labelInput: 'Motivo da Exclusão (Obrigatório):',
                    textoBtnConfirmar: 'Enviar Solicitação',
                    onConfirm: (res) => {
                        solicitacoesExclusao.push({
                            id: Date.now(),
                            solicitante: sessionData.nome,
                            tipo: tipo,
                            item: item,
                            index: index,
                            motivo: res.valorInput
                        });
                        localStorage.setItem('ciee_solicitacoes_exclusao', JSON.stringify(solicitacoesExclusao));
                        renderSolicitacoesExclusao();
                        
                        abrirModalCustom({
                            titulo: 'Solicitação Enviada',
                            icone: '',
                            texto: 'Sua solicitação de exclusão foi encaminhada aos Orientadores para validação.'
                        });
                    }
                });
            } else {
                abrirModalCustom({
                    titulo: 'Confirmar exclusão',
                    icone: '',
                    texto: `Tem certeza que deseja excluir "${item}"?`,
                    textoBtnConfirmar: 'Excluir',
                    onConfirm: () => {
                        callbackExcluirDirect();
                        registrarHistorico(item, 'Exclusão direta', `Item excluído por ${sessionData.nome}`);
                    }
                });
            }
        }

        function renderSolicitacoesExclusao() {
            const tbody = document.getElementById('table-solicitacoes-exclusao');
            if (!tbody || !sessionData || sessionData.nivel < 4) return;

            if (solicitacoesExclusao.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--muted-ok, #526071);">Nenhuma solicitação de exclusão pendente.</td></tr>`;
                return;
            }

            tbody.innerHTML = solicitacoesExclusao.map((s) => `
                <tr>
                    <td><strong>${escHtml(s.solicitante)}</strong></td>
                    <td>${escHtml(s.item)} (${String(s.tipo).replace(/^crud:[^:]*:/, '')})</td>
                    <td>${escHtml(s.motivo)}</td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-action btn-success" onclick="aceitarExclusao(${escHtml(s.id)})">Aceitar</button>
                            <button class="btn-action btn-danger" onclick="recusarExclusao(${escHtml(s.id)})">Recusar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function aceitarExclusao(id) {
            const s = solicitacoesExclusao.find(x => x.id === id);
            if (!s) return;

            if (s.tipo === 'Acervo' && acervo[s.index]) acervo.splice(s.index, 1);
            if (s.tipo === 'Categoria' && categorias[s.index]) categorias.splice(s.index, 1);
            if (s.tipo === 'Turma' && turmas[s.index]) turmas.splice(s.index, 1);
            if (s.tipo === 'Cidade' && cidadesList[s.index]) { cidadesList.splice(s.index, 1); persistirTudo(); renderCidades(); }
            if (String(s.tipo).startsWith('crud:')) {
                const cc = CRUDS[s.tipo.split(':')[1]];
                if (cc) { cc.data = cc.data.filter(x => x._id !== s.index); crudSave(cc.id); crudRender(cc.id); if (cc.aposSalvar) cc.aposSalvar(); }
            }
            if (s.tipo === 'Objeto' && objetosAchados[s.index]) {
                objetosAchados.splice(s.index, 1);
                localStorage.setItem('ciee_objetos_achados', JSON.stringify(objetosAchados));
            }

            solicitacoesExclusao = solicitacoesExclusao.filter(x => x.id !== id);
            localStorage.setItem('ciee_solicitacoes_exclusao', JSON.stringify(solicitacoesExclusao));
            
            registrarHistorico(s.item, 'Exclusão Aceita', `Aprovada por ${sessionData.nome}. Motivo: ${s.motivo}`);
            renderSolicitacoesExclusao();
            renderAcervo();
            renderCategorias();
            renderObjetos();
            renderTurmas(); renderCidades();

            abrirModalCustom({ titulo: 'Exclusão Aprovada', icone: '', texto: 'A exclusão do item foi confirmada.' });
        }

        function recusarExclusao(id) {
            const s = solicitacoesExclusao.find(x => x.id === id);
            if (!s) return;

            solicitacoesExclusao = solicitacoesExclusao.filter(x => x.id !== id);
            localStorage.setItem('ciee_solicitacoes_exclusao', JSON.stringify(solicitacoesExclusao));
            
            registrarHistorico(s.item, 'Exclusão recusada', `Recusada por ${sessionData.nome}`);
            renderSolicitacoesExclusao();

            abrirModalCustom({ titulo: 'Solicitação recusada', icone: '', texto: 'A solicitação de exclusão foi descartada.' });
        }

        // 1. SOLICITAÇÕES PENDENTES
        let solicitacoes = [
            { id: 1, aprendiz: 'João Silva', email: 'joao.silva@aprendiz.ciee.org.br', livro: 'Dom Casmurro (LIT-042)', tipo: 'Reserva', turma: 'ADM-01 / Tubarão', fone: '(48) 99888-7766' },
            { id: 2, aprendiz: 'Maria Souza', email: 'maria.souza@aprendiz.ciee.org.br', livro: 'O Poder do Hábito (ADM-012)', tipo: 'Troca', turma: 'LOG-02 / Imbituba', fone: '(48) 99111-2233' }
        ];

        let pageSolicitacoes = 1;
        let searchSolicitacoesText = '';

        function renderSolicitacoes() {
            const tbody = document.getElementById('table-solicitacoes');
            if (!tbody) return;

            const filtradas = solicitacoes.filter(s => (s.status || 'Aguardando') === 'Aguardando' && (
                String(s.aprendiz || '').toLowerCase().includes(searchSolicitacoesText.toLowerCase()) ||
                String(s.livro || '').toLowerCase().includes(searchSolicitacoesText.toLowerCase())
            ));

            const totalPages = Math.ceil(filtradas.length / 10) || 1;
            if (pageSolicitacoes > totalPages) pageSolicitacoes = totalPages;

            const inicio = (pageSolicitacoes - 1) * 10;
            const paginaAtual = filtradas.slice(inicio, inicio + 10);

            if (paginaAtual.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--muted-ok, #526071);">Nenhuma solicitação encontrada.</td></tr>`;
            } else {
                tbody.innerHTML = paginaAtual.map(s => `
                    <tr>
                        <td><strong>${escHtml(s.aprendiz)}</strong></td>
                        <td>${escHtml(s.livro)}</td>
                        <td><span class="badge ${s.tipo === 'Empréstimo' || s.tipo === 'Reserva' ? 'badge-blue' : s.tipo === 'Devolução' ? 'badge-green' : 'badge-yellow'}">${escHtml(s.tipo)}</span></td>
                        <td>${escHtml(s.turma)}</td>
                        <td><button class="btn-action btn-primary" data-nome="${escHtml(s.aprendiz)}" data-email="${escHtml(s.email)}" data-fone="${escHtml(s.fone)}" onclick="abrirModalContato(this.dataset.nome, this.dataset.email, this.dataset.fone)"> Contatar</button></td>
                        <td>
                            <div style="display: flex; gap: 4px;">
                                <button class="btn-action btn-success" onclick="aprovarSolicitacao(${escHtml(s.id)})">${s.tipo === 'Devolução' ? 'Confirmar devolução' : s.tipo === 'Renovação' ? 'Aprovar renovação' : 'Aprovar'}</button>
                                <button class="btn-action btn-danger" onclick="recusarSolicitacao(${escHtml(s.id)})">Recusar</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }

            document.getElementById('page-info-solicitacoes').innerText = `Página ${pageSolicitacoes} de ${totalPages}`;
            document.getElementById('btn-prev-solicitacoes').disabled = pageSolicitacoes === 1;
            document.getElementById('btn-next-solicitacoes').disabled = pageSolicitacoes === totalPages;

            atualizarEstatisticas();
            renderSolicitacoesExclusao();
        }

        function filtrarSolicitacoes() {
            searchSolicitacoesText = document.getElementById('search-solicitacoes').value;
            pageSolicitacoes = 1;
            renderSolicitacoes();
        }

        function mudarPaginaSolicitacoes(dir) {
            pageSolicitacoes += dir;
            renderSolicitacoes();
        }

        // AUDITORIA / HISTÓRICO DE REGISTROS
        let historicoDecisoes = JSON.parse(localStorage.getItem('ciee_historico_decisoes')) || [
            { data: '23/09/2026 14:30', responsavel: 'Orientador Fabrício', aprendiz: 'Carlos Eduardo', acao: 'Aprovado', motivo: 'Empréstimo liberado com envio de e-mail' }
        ];

        let pageHistorico = 1;
        let searchHistoricoText = '';



        function mudarPaginaHistorico(dir) {
            pageHistorico += dir;
            renderHistorico();
        }

        function registrarHistorico(aprendiz, acao, motivo) {
            const agora = new Date();
            const dataStr = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
            
            historicoDecisoes.unshift({
                data: dataStr,
                responsavel: sessionData ? sessionData.nome : 'Gestor',
                aprendiz: aprendiz,
                acao: acao,
                motivo: motivo
            });

            localStorage.setItem('ciee_historico_decisoes', JSON.stringify(historicoDecisoes));
            renderHistorico();
        }

        function aprovarSolicitacao(id) {
            const item = solicitacoes.find(s => s.id === id);
            if (!item) return;
            const tipo = item.tipo || 'Empréstimo', codigo = item.codigo || (String(item.livro).match(/\((.*?)\)\s*$/) || [])[1] || '';
            const idxEmp = emprestimos.findIndex(e => e.codigo === codigo && String(e.email || '').toLowerCase() === String(item.email || '').toLowerCase());
            const encerrar = () => { solicitacoes = solicitacoes.filter(s => s.id !== id); renderSolicitacoes(); renderEmprestimos(); };
            if (tipo === 'Devolução') {
                if (!cieeRecurso('devolucao')) return abrirModalCustom({ titulo: 'Devolução desativada', texto: 'A devolução de livros está desativada em Sistema › Configurações.' });
                if (idxEmp < 0) return abrirModalCustom({ titulo: 'Empréstimo não encontrado', texto: 'Este livro não consta mais como emprestado para o aprendiz. O pedido será encerrado.', textoBtnConfirmar: 'Encerrar pedido', onConfirm: encerrar });
                return abrirModalCustom({ titulo: 'Confirmar devolução', texto: `Conferiu o livro "${item.livro}" devolvido por ${item.aprendiz}? Se estiver tudo certo, confirme. Se houver problema, use Recusar e explique.`, temEmailOption: true, textoBtnConfirmar: 'Confirmar devolução',
                    onConfirm: res => { solicitacoes = solicitacoes.filter(s => s.id !== id); efetivarDevolucao(emprestimos.findIndex(e => e.codigo === codigo && String(e.email || '').toLowerCase() === String(item.email || '').toLowerCase()), res.enviarEmail); } });
            }
            if (tipo === 'Renovação') {
                if (!cieeRecurso('emprestimo')) return abrirModalCustom({ titulo: 'Empréstimos desativados', texto: 'Os empréstimos estão desativados em Sistema › Configurações.' });
                if (idxEmp < 0) return abrirModalCustom({ titulo: 'Empréstimo não encontrado', texto: 'Este livro não consta mais como emprestado para o aprendiz. O pedido será encerrado.', textoBtnConfirmar: 'Encerrar pedido', onConfirm: encerrar });
                if (emprestimos[idxEmp].renovacoesCount >= 1) return abrirModalCustom({ titulo: 'Renovação já usada', texto: 'Este empréstimo já foi renovado uma vez. Use Recusar e explique ao aprendiz.' });
                return abrirModalCustom({ titulo: 'Aprovar renovação', texto: `Renovar "${item.livro}" de ${item.aprendiz} por mais 30 dias?`, temEmailOption: true, textoBtnConfirmar: 'Aprovar renovação',
                    onConfirm: res => { const e = emprestimos[idxEmp]; e.devolucao = somaDiasBR(e.devolucao, 30); e.renovacoesCount = 1; e.status = 'Renovado (+30 dias)';
                        registrarHistorico(item.aprendiz, 'Renovação', `Livro ${item.livro} renovado por +30 dias (pedido do aprendiz).${res.enviarEmail ? ' E-mail enviado.' : ''}`); encerrar();
                        abrirModalCustom({ titulo: 'Renovação aprovada', texto: `Nova data de devolução: ${e.devolucao}.` }); } });
            }
            // Empréstimo / Reserva / Troca
            if (!cieeRecurso('emprestimo')) return abrirModalCustom({ titulo: 'Empréstimos desativados', texto: 'Os empréstimos estão desativados em Sistema › Configurações.' });
            if (livroEmprestado(codigo)) return abrirModalCustom({ titulo: 'Livro indisponível', texto: 'Este livro já está emprestado para outra pessoa. Recuse o pedido e explique o motivo.' });
            abrirModalCustom({
                titulo: 'Aprovar empréstimo',
                texto: `Aprovar o empréstimo de "${item.livro}" para ${item.aprendiz}? O prazo é de 30 dias.`,
                temEmailOption: true,
                textoBtnConfirmar: 'Aprovar',
                onConfirm: (res) => {
                    emprestimos.unshift({
                        codigo: codigo || 'LIT-000',
                        livro: String(item.livro).replace(/\s*\([^)]*\)\s*$/, '').trim(),
                        aprendiz: item.aprendiz, email: item.email, fone: item.fone || '',
                        dataRetirada: new Date().toLocaleDateString('pt-BR'), devolucao: somaDiasBR('', 30),
                        status: 'No prazo', renovacoesCount: 0, temOutrosPedidos: false
                    });
                    encerrar();
                    const emailMsg = res.enviarEmail ? ' (E-mail enviado ao aprendiz)' : '';
                    registrarHistorico(item.aprendiz, 'Aprovado', `Empréstimo de ${item.livro} aprovado por ${sessionData.nome}.${emailMsg}`);
                    abrirModalCustom({ titulo: 'Empréstimo aprovado', texto: `O livro foi emprestado por 30 dias.${emailMsg}` });
                }
            });
        }

        function recusarSolicitacao(id) {
            const item = solicitacoes.find(s => s.id === id);
            if (!item) return;
            abrirModalCustom({
                titulo: 'Recusar pedido', texto: `Pedido de ${String(item.tipo || 'empréstimo').toLowerCase()} de "${item.livro}" (${item.aprendiz}). O aprendiz verá o motivo no portal.`,
                camposMultiplos: [{ id: 'motivo', label: 'Motivo da recusa:', tipo: 'textarea', obrigatorio: true }],
                textoBtnConfirmar: 'Recusar pedido',
                onConfirm: res => {
                    Object.assign(item, { status: 'Recusada', motivo: res.valores.motivo.trim(), decididoPor: sessionData.nome, decididoEm: Date.now() });
                    renderSolicitacoes(); renderEmprestimos();
                    registrarHistorico(item.aprendiz, 'Recusado', `${item.tipo || 'Pedido'} de ${item.livro} recusado por ${sessionData.nome}. Motivo: ${item.motivo}`);
                }
            });
        }

        // datas dd/mm/aaaa: soma dias a partir de uma data (ou de hoje)
        function somaDiasBR(txt, dias) {
            const m = String(txt || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/), d = m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date();
            d.setDate(d.getDate() + dias); return d.toLocaleDateString('pt-BR');
        }
        function situacaoEmprestimo(e) {
            const m = String(e.devolucao || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) { const dias = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(+m[3], +m[2] - 1, +m[1])) / 86400000); if (dias > 0) return `Em atraso (+${dias} dia${dias > 1 ? 's' : ''})`; }
            return e.renovacoesCount ? 'Renovado (+30 dias)' : 'No prazo';
        }

        // 2. EMPRÉSTIMOS & RENOVAÇÃO ÚNICA
        let emprestimos = [
            { codigo: 'LIT-042', livro: 'Dom Casmurro', aprendiz: 'Lucas Mendes', email: 'lucas.mendes@aprendiz.ciee.org.br', fone: '(48) 99888-1122', dataRetirada: '10/09/2026', devolucao: '28/09/2026', status: 'No prazo', renovacoesCount: 0, temOutrosPedidos: false },
            { codigo: 'PSI-015', livro: 'O Homem em Busca de Sentido', aprendiz: 'Ana Clara', email: 'ana.clara@aprendiz.ciee.org.br', fone: '(48) 99111-4455', dataRetirada: '01/09/2026', devolucao: '20/09/2026', status: 'Em atraso (+4 dias)', renovacoesCount: 1, temOutrosPedidos: false }
        ];

        function renderEmprestimos() {
            const tbody = document.getElementById('table-emprestimos');
            if (!tbody) return;

            if (emprestimos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--muted-ok, #526071);">Nenhum empréstimo ativo no momento.</td></tr>`;
                atualizarEstatisticas();
                return;
            }

            tbody.innerHTML = emprestimos.map((e, index) => {
                const podeRenovar = e.renovacoesCount < 1 && !e.temOutrosPedidos;

                return `
                <tr>
                    <td><code>${escHtml(e.codigo)}</code></td>
                    <td><strong>${escHtml(e.livro)}</strong></td>
                    <td><strong>${escHtml(e.aprendiz)}</strong></td>
                    <td><button class="btn-action btn-primary" data-nome="${escHtml(e.aprendiz)}" data-email="${escHtml(e.email)}" data-fone="${escHtml(e.fone)}" onclick="abrirModalContato(this.dataset.nome, this.dataset.email, this.dataset.fone)"> Contatar</button></td>
                    <td><strong>${escHtml(e.dataRetirada)}</strong></td>
                    <td>${escHtml(e.devolucao)}</td>
                    <td><span class="badge ${/atraso/i.test(situacaoEmprestimo(e)) ? 'badge-red' : 'badge-green'}">${escHtml(situacaoEmprestimo(e))}</span></td>
                    <td>${escHtml(e.renovacoesCount)} / 1</td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-action btn-primary" ${!podeRenovar ? 'disabled title="Renovação bloqueada (15 dias ativas ou solicitações pendentes)"' : ''} onclick="renovarEmprestimo(${index})">Renovar</button>
                            <button class="btn-action btn-success" onclick="devolverEmprestimo(${index})">Devolver</button>
                        </div>
                    </td>
                </tr>
            `}).join('');

            atualizarEstatisticas();
        }

        function renovarEmprestimo(index) {
            const emp = emprestimos[index];
            if (emp.renovacoesCount >= 1) return;

            abrirModalCustom({
                titulo: 'Renovar empréstimo',
                icone: '',
                texto: `Renovar prazo por mais 30 dias para o livro "${emp.livro}" (${emp.aprendiz})?\nObs: só é permitida uma renovação por empréstimo.`,
                temEmailOption: true,
                textoBtnConfirmar: 'Renovar (+30 dias)',
                onConfirm: (res) => {
                    emp.devolucao = somaDiasBR(emp.devolucao, 30);
                    emp.renovacoesCount = 1;
                    emp.status = 'Renovado (+30 dias)';
                    registrarHistorico(emp.aprendiz, 'Renovação', `Livro ${emp.livro} renovado por +30 dias.`);
                    renderEmprestimos();

                    const emailMsg = res.enviarEmail ? ' E-mail enviado.' : '';
                    abrirModalCustom({ titulo: 'Empréstimo Renovado', icone: '', texto: `Renovado com sucesso! O botão ficará inativo até a devolução.${emailMsg}` });
                }
            });
        }

        function devolverEmprestimo(index) {
            if (!cieeRecurso('devolucao')) return abrirModalCustom({ titulo: 'Devolução desativada', texto: 'A devolução de livros está desativada em Sistema › Configurações. Ative para confirmar devoluções.' });
            const emp = emprestimos[index];
            abrirModalCustom({
                titulo: 'Devolução de livro',
                texto: `Confirmar a devolução de "${emp.livro}" por ${emp.aprendiz}?`,
                temEmailOption: true,
                textoBtnConfirmar: 'Confirmar devolução',
                onConfirm: (res) => efetivarDevolucao(index, res.enviarEmail)
            });
        }
        // conclui a devolução: tira o empréstimo, registra no histórico e deixa a leitura esperando a reflexão do aprendiz
        function efetivarDevolucao(index, enviarEmail) {
            const emp = emprestimos[index]; if (!emp) { renderSolicitacoes(); return; }
            emprestimos.splice(index, 1);
            // pedidos de devolução deste livro/aprendiz ficam resolvidos
            solicitacoes = solicitacoes.filter(s => !(s.tipo === 'Devolução' && s.codigo === emp.codigo && String(s.email || '').toLowerCase() === String(emp.email || '').toLowerCase()));
            renderEmprestimos(); renderSolicitacoes();
            registrarHistorico(emp.aprendiz, 'Devolução', `Livro ${emp.livro} devolvido ao acervo.${enviarEmail ? ' E-mail enviado.' : ''}`);
            let extra = '';
            try {                                         // critério 1 (leu): a leitura fica esperando a reflexão e a opinião do aprendiz
                const g = cieeSelos.registrarLeitura({ email: emp.email, nome: emp.aprendiz, livro: emp.livro, codigo: emp.codigo });
                extra = g.repetido ? ` ${emp.aprendiz} já ganhou ponto por este livro antes, então ele não gera novo ponto.`
                    : ` Para valer 1 ponto de leitura, ${emp.aprendiz} precisa responder à reflexão e compartilhar uma breve opinião no portal (Acervo › Minhas leituras).`;
            } catch (e) {}
            abrirModalCustom({ titulo: 'Devolução concluída', texto: 'Livro retornado com sucesso ao acervo!' + extra });
        }

        // 3. GESTÃO DO ACERVO DE LIVROS
        let acervo = [
            { id: 1, codigo: 'LIT-001', titulo: 'Dom Casmurro', autor: 'Machado de Assis', autorSec: 'N/A', categoria: 'LIT', ano: '1899' },
            { id: 2, codigo: 'ADM-001', titulo: 'O Poder do Hábito', autor: 'Charles Duhigg', autorSec: 'N/A', categoria: 'ADM', ano: '2012' }
        ];

        let pageAcervo = 1;
        let searchAcervoText = '';
        let filtroAcervoCat = '';


        function filtrarAcervo() {
            searchAcervoText = document.getElementById('search-acervo').value;
            filtroAcervoCat = document.getElementById('filtro-acervo-categoria').value;
            pageAcervo = 1;
            renderAcervo();
        }

        function mudarPaginaAcervo(dir) {
            pageAcervo += dir;
            renderAcervo();
        }

        function gerarProximoCodigo(prefixo) {
            const existentes = acervo.filter(a => a.categoria === prefixo);
            let maiorNum = 0;
            existentes.forEach(a => {
                const num = parseInt(a.codigo.split('-')[1]);
                if (!isNaN(num) && num > maiorNum) maiorNum = num;
            });
            const proximoNum = (maiorNum + 1).toString().padStart(3, '0');
            return `${prefixo}-${proximoNum}`;
        }


        function gerenciarMudancaCategoriaLivro(selectEl) {
            if (selectEl.value === 'NOVA_CAT') {
                const novaCatNome = prompt("Digite o nome da NOVA Categoria:");
                const novoPrefixo = prompt("Digite o PREFIXO (ex: LIT, ADM):")?.toUpperCase();

                if (novaCatNome && novoPrefixo) {
                    categorias.push({ prefixo: novoPrefixo, nome: novaCatNome, total: 0 });
                    renderCategorias();
                    
                    const elCodigo = document.getElementById('modal_field_codigo');
                    if (elCodigo) elCodigo.value = gerarProximoCodigo(novoPrefixo);
                }
            } else {
                const elCodigo = document.getElementById('modal_field_codigo');
                if (elCodigo) elCodigo.value = gerarProximoCodigo(selectEl.value);
            }
        }


        function excluirLivro(index) {
            const livro = acervo[index];
            solicitarOuExcluir('Acervo', livro.titulo, index, () => {
                acervo.splice(index, 1);
                renderAcervo();
            });
        }

        // 4. CATEGORIAS
        let categorias = [
            { prefixo: 'LIT', nome: 'Literatura Brasileira & Contos', total: 42 },
            { prefixo: 'ADM', nome: 'Administração & Negócios', total: 28 },
            { prefixo: 'DES', nome: 'Desenvolvimento Pessoal & Autoajuda', total: 35 },
            { prefixo: 'PSI', nome: 'Psicologia & Saúde Mental', total: 18 }
        ];

        function atualizarDropdownCategorias() {
            const select = document.getElementById('filtro-acervo-categoria');
            if (!select) return;

            const valAtual = select.value;
            select.innerHTML = `<option value="">Todas as categorias</option>` + 
                categorias.map(c => `<option value="${escHtml(c.prefixo)}">${escHtml(c.prefixo)} - ${escHtml(c.nome)}</option>`).join('');
            select.value = valAtual;
        }



        function editarCategoria(index) {
            const cat = categorias[index];

            abrirModalCustom({
                titulo: 'Editar categoria',
                icone: '',
                texto: `Categoria: "${cat.prefixo}"`,
                camposMultiplos: [
                    { id: 'nome', label: 'Nome da Categoria:', valorInicial: cat.nome, obrigatorio: true }
                ],
                textoBtnConfirmar: 'Salvar alteração',
                onConfirm: (res) => {
                    cat.nome = res.valores.nome.trim();
                    renderCategorias();
                    abrirModalCustom({ titulo: 'Categoria atualizada', icone: '', texto: 'Categoria alterada com sucesso!' });
                }
            });
        }

        function excluirCategoria(index) {
            const cat = categorias[index];
            solicitarOuExcluir('Categoria', cat.nome, index, () => {
                categorias.splice(index, 1);
                renderCategorias();
                renderAcervo();
            });
        }

        // 5. ETIQUETAS
        let listaEtiquetas = [
            { codigo: 'LIT-001', selecionada: true },
            { codigo: 'ADM-001', selecionada: true },
            { codigo: 'DES-105', selecionada: true },
            { codigo: 'PSI-015', selecionada: true }
        ];






        // 6. GESTÃO DE OBJETOS ACHADOS E PERDIDOS
        let objetosAchados = JSON.parse(localStorage.getItem('ciee_objetos_achados')) || [];

        function getCidadesDasTurmas() {
            return cidadesList.map(c => ({ value: c, label: c }));
        }

        function renderObjetos() {
            const tbody = document.getElementById('table-objetos');
            if (!tbody) return;

            if (objetosAchados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--muted-ok, #526071);">Nenhum objeto registrado.</td></tr>`;
                return;
            }

            tbody.innerHTML = objetosAchados.map((obj, index) => `
                <tr>
                    <td>
                        <img src="${escHtml(imgOk(obj.imagem)) || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect width=%2250%22 height=%2250%22 fill=%22%23e2e8f0%22/%3E%3Cpath d=%22M12 36l9-11 7 8 5-6 5 9z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E'}" alt="img" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                    </td>
                    <td><strong>${escHtml(obj.nome)}</strong></td>
                    <td>${escHtml(obj.data)}</td>
                    <td><span class="badge ${obj.periodo === 'Manhã' ? 'badge-yellow' : 'badge-blue'}">${escHtml(obj.periodo)}</span></td>
                    <td>${escHtml(obj.quem)}</td>
                    <td>${escHtml(obj.cidade)}</td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-action btn-warning" onclick="editarObjeto(${index})">Editar</button>
                            <button class="btn-action btn-danger" onclick="excluirObjeto(${index})">Excluir</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function cadastrarNovoObjeto() {
            tempImageBase64 = '';
            abrirModalCustom({
                titulo: 'Cadastrar Achado / Perdido',
                icone: '',
                texto: 'Preencha os dados do objeto encontrado:',
                camposMultiplos: [
                    { id: 'imagemFile', label: 'Foto do objeto (opcional):', tipo: 'file' },
                    { id: 'nome', label: 'Nome do objeto:', obrigatorio: true },
                    { id: 'data', label: 'Data encontrado:', tipo: 'date', obrigatorio: true },
                    { id: 'periodo', label: 'Período:', tipo: 'select', opcoes: [{value: 'Manhã', label: 'Manhã'}, {value: 'Tarde', label: 'Tarde'}], obrigatorio: true },
                    { id: 'quem', label: 'Quem encontrou:', valorInicial: sessionData ? sessionData.nome : '', obrigatorio: true },
                    { id: 'cidade', label: 'Local (Cidade):', tipo: 'select', opcoes: getCidadesDasTurmas(), obrigatorio: true }
                ],
                textoBtnConfirmar: 'Cadastrar objeto',
                onConfirm: (res) => {
                    const { nome, data, periodo, quem, cidade } = res.valores;
                    objetosAchados.push({
                        id: Date.now(),
                        imagem: tempImageBase64 || '',
                        nome: nome.trim(),
                        data,
                        periodo,
                        quem: quem.trim(),
                        cidade
                    });
                    localStorage.setItem('ciee_objetos_achados', JSON.stringify(objetosAchados));
                    renderObjetos();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Objeto registrado com sucesso e já disponível na página Achados & Perdidos!' });
                }
            });
        }

        function editarObjeto(index) {
            const obj = objetosAchados[index];
            tempImageBase64 = obj.imagem; 

            abrirModalCustom({
                titulo: 'Editar Objeto',
                icone: '',
                texto: `Editando: ${obj.nome}`,
                camposMultiplos: [
                    { id: 'imagemFile', label: 'Foto do objeto (opcional):', tipo: 'file' },
                    { id: 'nome', label: 'Nome do Objeto:', valorInicial: obj.nome, obrigatorio: true },
                    { id: 'data', label: 'Data Encontrado:', tipo: 'date', valorInicial: obj.data, obrigatorio: true },
                    { id: 'periodo', label: 'Período:', tipo: 'select', opcoes: [{value: 'Manhã', label: 'Manhã'}, {value: 'Tarde', label: 'Tarde'}], valorInicial: obj.periodo, obrigatorio: true },
                    { id: 'quem', label: 'Quem encontrou:', valorInicial: obj.quem, obrigatorio: true },
                    { id: 'cidade', label: 'Local (Cidade):', tipo: 'select', opcoes: getCidadesDasTurmas(), valorInicial: obj.cidade, obrigatorio: true }
                ],
                textoBtnConfirmar: 'Salvar alterações',
                onConfirm: (res) => {
                    obj.imagem = tempImageBase64; 
                    obj.nome = res.valores.nome.trim();
                    obj.data = res.valores.data;
                    obj.periodo = res.valores.periodo;
                    obj.quem = res.valores.quem.trim();
                    obj.cidade = res.valores.cidade;

                    localStorage.setItem('ciee_objetos_achados', JSON.stringify(objetosAchados));
                    renderObjetos();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Dados do objeto atualizados!' });
                }
            });
        }

        function excluirObjeto(index) {
            solicitarOuExcluir('Objeto', objetosAchados[index].nome, index, () => {
                objetosAchados.splice(index, 1);
                localStorage.setItem('ciee_objetos_achados', JSON.stringify(objetosAchados));
                renderObjetos();
            });
        }

        // 7. GERENCIAR TURMAS (WEBMASTER)
        let turmas = [
            { id: 1, responsavel: 'Orientador Fabrício', codId: 'TUB_TUB_QUA_VES_0', diaPeriodo: 'Quarta-feira - Tarde', cidade: 'Tubarão' },
            { id: 2, responsavel: 'Orientadora Sofia', codId: 'IMB_IMB_SEG_MAT_1', diaPeriodo: 'Segunda-feira - Manhã', cidade: 'Imbituba' }
        ];

        let pageTurmas = 1;
        const turmasPerPage = 10;

        const diasDaSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
        const periodos = ['Manhã', 'Tarde'];
        const diasPeriodosOptions = [];
        
        diasDaSemana.forEach(d => {
            periodos.forEach(p => {
                diasPeriodosOptions.push({ value: `${d} - ${p}`, label: `${d} - ${p}` });
            });
        });

        function getResponsaveisOptions() {
            return codigosAcesso
                .filter(c => parseInt(c.nivel, 10) >= 4)
                .map(c => ({ value: c.perfil, label: c.perfil }));
        }

        function getCidadesOptions() {
            let opts = cidadesList.map(c => ({ value: c, label: c }));
            opts.push({ value: 'NOVA_CIDADE', label: 'CADASTRAR NOVA CIDADE...' });
            return opts;
        }

        window.gerenciarMudancaCidade = function(selectEl) {
            if (selectEl.value === 'NOVA_CIDADE') {
                const nova = prompt("Digite o nome da nova cidade:");
                if (nova && nova.trim() !== '') {
                    const cityName = nova.trim();
                    cidadesList.push(cityName);
                    
                    const lastOpt = selectEl.lastElementChild;
                    selectEl.removeChild(lastOpt);
                    
                    const novaOpt = document.createElement('option');
                    novaOpt.value = cityName;
                    novaOpt.textContent = cityName;
                    selectEl.appendChild(novaOpt);
                    
                    selectEl.appendChild(lastOpt); 
                    selectEl.value = cityName;
                } else {
                    selectEl.value = cidadesList[0] || '';
                }
            }
        };

        function renderTurmas() {
            const container = document.getElementById('container-turmas');
            if (!container) return;

            let turmasSorted = [...turmas].sort((a, b) => a.cidade.localeCompare(b.cidade));

            const totalPages = Math.ceil(turmasSorted.length / turmasPerPage) || 1;
            if (pageTurmas > totalPages) pageTurmas = totalPages;

            const inicio = (pageTurmas - 1) * turmasPerPage;
            const paginaAtual = turmasSorted.slice(inicio, inicio + turmasPerPage);

            if (paginaAtual.length === 0) {
                container.innerHTML = `<p style="text-align:center; color: var(--muted-ok, #526071); padding: 20px;">Nenhuma turma cadastrada.</p>`;
            } else {
                let html = '';
                let currentCity = '';

                paginaAtual.forEach((t) => {
                    if (t.cidade !== currentCity) {
                        if (currentCity !== '') html += `</tbody></table></div>`;
                        currentCity = t.cidade;
                        html += `
                        <h3 class="city-group-header">${escHtml(currentCity)}</h3>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Responsável</th>
                                        <th>ID da Turma</th>
                                        <th>Dia e Período</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                    }
                    
                    const originalIndex = turmas.findIndex(x => x.id === t.id);
                    html += `
                        <tr>
                            <td><strong>${escHtml(t.responsavel)}</strong></td>
                            <td><code>${escHtml(t.codId)}</code></td>
                            <td>${escHtml(t.diaPeriodo)}</td>
                            <td>
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn-action btn-warning" onclick="editarTurma(${originalIndex})">Editar</button>
                                    <button class="btn-action btn-danger" onclick="excluirTurma(${originalIndex})">Excluir</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                if (currentCity !== '') html += `</tbody></table></div>`;
                container.innerHTML = html;
            }

            document.getElementById('page-info-turmas').innerText = `Página ${pageTurmas} de ${totalPages}`;
            document.getElementById('btn-prev-turmas').disabled = pageTurmas === 1;
            document.getElementById('btn-next-turmas').disabled = pageTurmas === totalPages;
        }

        function mudarPaginaTurmas(dir) {
            pageTurmas += dir;
            renderTurmas();
        }

        function cadastrarNovaTurma() {
            const responsaveisDisponiveis = getResponsaveisOptions();
            if (responsaveisDisponiveis.length === 0) {
                abrirModalCustom({ titulo: 'Erro', icone: '', texto: 'Não há Orientadores ou Webmasters cadastrados no ByPass. Cadastre um para continuar.' });
                return;
            }

            abrirModalCustom({
                titulo: 'Cadastrar nova turma',
                icone: '',
                texto: 'Informe os dados da turma:',
                camposMultiplos: [
                    { id: 'responsavel', label: 'Responsável:', tipo: 'select', opcoes: responsaveisDisponiveis, obrigatorio: true },
                    { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: getCidadesOptions(), obrigatorio: true, onChange: 'gerenciarMudancaCidade(this)' },
                    { id: 'diaPeriodo', label: 'Dia e período:', tipo: 'select', opcoes: diasPeriodosOptions, obrigatorio: true },
                    { id: 'codId', label: 'Código/ID da turma:', obrigatorio: true }
                ],
                textoBtnConfirmar: 'Cadastrar turma',
                onConfirm: (res) => {
                    const { responsavel, cidade, diaPeriodo, codId } = res.valores;
                    turmas.push({
                        id: Date.now(),
                        responsavel,
                        cidade,
                        diaPeriodo,
                        codId: codId.trim()
                    });
                    renderTurmas();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Turma cadastrada com sucesso!' });
                }
            });
        }

        function editarTurma(index) {
            const t = turmas[index];
            abrirModalCustom({
                titulo: 'Editar Turma',
                icone: '',
                texto: `Editando turma: ${t.codId}`,
                camposMultiplos: [
                    { id: 'responsavel', label: 'Responsável:', tipo: 'select', opcoes: getResponsaveisOptions(), valorInicial: t.responsavel, obrigatorio: true },
                    { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: getCidadesOptions(), valorInicial: t.cidade, obrigatorio: true, onChange: 'gerenciarMudancaCidade(this)' },
                    { id: 'diaPeriodo', label: 'Dia e Período:', tipo: 'select', opcoes: diasPeriodosOptions, valorInicial: t.diaPeriodo, obrigatorio: true },
                    { id: 'codId', label: 'Código/ID da Turma:', valorInicial: t.codId, obrigatorio: true }
                ],
                textoBtnConfirmar: 'Salvar alterações',
                onConfirm: (res) => {
                    t.responsavel = res.valores.responsavel;
                    t.cidade = res.valores.cidade;
                    t.diaPeriodo = res.valores.diaPeriodo;
                    t.codId = res.valores.codId.trim();
                    renderTurmas();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Turma atualizada com sucesso!' });
                }
            });
        }

        function excluirTurma(index) {
            solicitarOuExcluir('Turma', turmas[index].codId, index, () => {
                turmas.splice(index, 1);
                renderTurmas();
            });
        }

        // 8. CÓDIGOS DE ACESSO (WEBMASTER / BYPASS)
        let codigosAcesso = JSON.parse(localStorage.getItem('ciee_codigos_acesso')) || [
            { senha: '123', perfil: 'Orientador Fabrício', nivel: '4 (Orientador)' },
            { senha: '456', perfil: 'Webmaster Admin', nivel: '5 (Webmaster)' }
        ];

        function renderCodigos() {
            const tbody = document.getElementById('table-codigos');
            if (!tbody) return;

            if (codigosAcesso.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--muted-ok, #526071);">Nenhum código cadastrado.</td></tr>`;
                return;
            }

            tbody.innerHTML = codigosAcesso.map((c, index) => `
                <tr>
                    <td><code>${escHtml(c.senha)}</code></td>
                    <td>${c.foto ? `<img src="${escHtml(imgOk(c.foto))}" class="thumb-avatar" alt=""> ` : ''}<strong>${escHtml(c.perfil)}</strong>${c.foto ? '' : ''}</td>
                    <td><span class="badge badge-blue">${escHtml(c.nivel)}</span></td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-action btn-warning" onclick="editarAcesso(${index})">Editar</button>
                            <button class="btn-action btn-danger" onclick="excluirAcesso(${index})">Excluir</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function cadastrarNovoAcesso() {
            tempImageBase64 = ''; tempFileName = '';
            abrirModalCustom({
                titulo: 'Cadastrar novo acesso',
                icone: '',
                texto: 'Informe os dados do novo acesso:',
                camposMultiplos: [
                    { id: 'senha', label: 'Senha / código:', obrigatorio: true },
                    { id: 'perfil', label: 'Nome do usuário:', obrigatorio: true },
                    { id: 'nivel', label: 'Nível de acesso:', tipo: 'select', opcoes: [
                        { value: '2 (Representante)', label: 'Representante de Turma' },
                        { value: '3 (Monitor)', label: 'Monitor(a)' },
                        { value: '4 (Orientador)', label: 'Orientador(a)' },
                        { value: '5 (Webmaster)', label: 'Webmaster' }
                    ], obrigatorio: true },
                    { id: 'usarFoto', label: 'Usar foto (avatar) na carteirinha e em "Meu orientador(a)"?', tipo: 'select', opcoes: [{ value: 'Não', label: 'Não' }, { value: 'Sim', label: 'Sim' }], valorInicial: 'Não' },
                    { id: 'fotoFile', label: 'Foto / avatar (opcional):', tipo: 'file' }
                ],
                textoBtnConfirmar: 'Cadastrar acesso',
                onConfirm: (res) => {
                    if (codigosAcesso.some(o => String(o.senha).trim() === res.valores.senha.trim())) {
                        abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Já existe um acesso com esta senha. Use outra senha.' });
                        return;
                    }
                    codigosAcesso.push({
                        senha: res.valores.senha.trim(),
                        perfil: res.valores.perfil.trim(),
                        nivel: res.valores.nivel,
                        usarFoto: res.valores.usarFoto,
                        foto: res.valores.usarFoto === 'Sim' ? (tempImageBase64 || '') : ''
                    });
                    localStorage.setItem('ciee_codigos_acesso', JSON.stringify(codigosAcesso));
                    renderCodigos();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Novo acesso cadastrado com sucesso!' });
                }
            });
        }

        function editarAcesso(index) {
            const c = codigosAcesso[index]; tempImageBase64 = c.foto || ''; tempFileName = '';
            abrirModalCustom({
                titulo: 'Editar Acesso',
                icone: '',
                texto: `Editando acesso de: ${c.perfil}`,
                camposMultiplos: [
                    { id: 'senha', label: 'Senha / código:', valorInicial: c.senha, obrigatorio: true },
                    { id: 'perfil', label: 'Nome do usuário:', valorInicial: c.perfil, obrigatorio: true },
                    { id: 'nivel', label: 'Nível de acesso:', tipo: 'select', opcoes: [
                        { value: '2 (Representante)', label: 'Representante de Turma' },
                        { value: '3 (Monitor)', label: 'Monitor(a)' },
                        { value: '4 (Orientador)', label: 'Orientador(a)' },
                        { value: '5 (Webmaster)', label: 'Webmaster' }
                    ], valorInicial: c.nivel, obrigatorio: true },
                    { id: 'usarFoto', label: 'Usar foto (avatar) na carteirinha e em "Meu orientador(a)"?', tipo: 'select', opcoes: [{ value: 'Não', label: 'Não' }, { value: 'Sim', label: 'Sim' }], valorInicial: c.usarFoto || (c.foto ? 'Sim' : 'Não') },
                    { id: 'fotoFile', label: 'Foto / avatar (opcional):', tipo: 'file' }
                ],
                textoBtnConfirmar: 'Salvar alterações',
                onConfirm: (res) => {
                    if (codigosAcesso.some(o => o !== c && String(o.senha).trim() === res.valores.senha.trim())) {
                        abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Já existe um acesso com esta senha. Use outra senha.' });
                        return;
                    }
                    c.senha = res.valores.senha.trim();
                    c.perfil = res.valores.perfil.trim();
                    c.nivel = res.valores.nivel;
                    c.usarFoto = res.valores.usarFoto;
                    c.foto = res.valores.usarFoto === 'Sim' ? (tempImageBase64 || '') : '';
                    localStorage.setItem('ciee_codigos_acesso', JSON.stringify(codigosAcesso));
                    renderCodigos();
                    abrirModalCustom({ titulo: 'Sucesso', icone: '', texto: 'Acesso atualizado!' });
                }
            });
        }

        function excluirAcesso(index) {
            solicitarOuExcluir('Acesso', codigosAcesso[index].perfil, index, () => {
                codigosAcesso.splice(index, 1);
                localStorage.setItem('ciee_codigos_acesso', JSON.stringify(codigosAcesso));
                renderCodigos();
            });
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
        // NOVO MENU (DROPDOWN), DASHBOARD, GESTÃO DE LIVROS, EQUIPE, UTILIDADES E LOGINS
        // =====================================================================

        // ---------- 1. Menu e permissões por nível ----------
        // Hierarquia: quem tem acesso a um menu em um nível também o tem nos níveis acima (Monitor ⊂ Orientador ⊂ Admin)
        const N = min => [2, 3, 4, 5].filter(n => n >= min);
        const MENU = [
            { id: 'inicio', label: 'Painel', niveis: N(2) },
            { label: 'Acervo', itens: [
                { id: 'solicitacoes', label: 'Solicitações', niveis: N(2) },
                { id: 'emprestimos', label: 'Empréstimos', niveis: N(2) },
                { id: 'livros', label: 'Gestão de livros', niveis: N(2) },
                { id: 'categorias', label: 'Categorias e prefixos', niveis: N(2) },
                { id: 'etiquetas', label: 'Gerador de etiquetas', niveis: N(2) },
                { id: 'menuacervo', label: 'Menu Acervo (links do PLAY)', niveis: N(2), oculto: true }
            ]},
            { id: 'objetos', label: 'Gestão de objetos', niveis: N(2) },
            { label: 'Usuários', itens: [
                { id: 'turmas', label: 'Cidades e turmas', niveis: N(2) },
                { id: 'logins', label: 'Aprendizes', niveis: N(5) },
                { id: 'selos', label: 'Selos de conquista', niveis: N(4) },
                { id: 'representantes', label: 'Representantes de turma', niveis: N(3) },
                { id: 'monitores', label: 'Monitores', niveis: N(4) },
                { id: 'orientadores', label: 'Orientadores', niveis: N(5) },
                { id: 'adm', label: 'Administrativo CIEESC', niveis: N(2) },
                { id: 'webmaster-codes', label: 'ByPass', niveis: N(5) }
            ]},
            { label: 'Utilidades', itens: [
                { id: 'mural', label: 'Mural', niveis: N(2) },
                { id: 'calendario', label: 'Calendário', niveis: N(3) },
                { id: 'sugestoes', label: 'Sugestões dos aprendizes', niveis: N(3) },
                { id: 'artes', label: 'Artes em foco', niveis: N(2) },
                { id: 'wifi', label: 'Wi-fi', niveis: N(2) },
                { id: 'faq', label: 'Dúvidas frequentes', niveis: N(2) }
            ]},
            { label: 'Sistema', itens: [
                { id: 'configuracoes', label: 'Configurações', niveis: N(5) },
                { id: 'temas', label: 'Layout e temas', niveis: N(4) },
                { id: 'historico', label: 'Histórico geral', niveis: N(2) },
                { id: 'sistema-versoes', label: 'Versão', niveis: N(5) }
            ]}
        ];
        const MENU_FLAT = [];
        MENU.forEach(m => (m.itens || [m]).forEach(i => MENU_FLAT.push({ ...i, grupo: m.itens ? m.label : '' })));

        const NIVEIS_INFO = {
            1: { nome: 'Aprendiz', desc: 'Usa o CIEESC ▶︎ PLAY (mural, acervo, calendário, artes, achados e perdidos, carteirinha). Não acessa este painel.' },
            2: { nome: 'Representante', desc: 'Representante de Turma. Entra no painel: atendimento, acervo, conteúdos e histórico. Para excluir, envia solicitação com motivo.' },
            3: { nome: 'Monitor', desc: 'Tudo do representante + gerencia os representantes de turma. Para excluir, envia solicitação com motivo.' },
            4: { nome: 'Orientador', desc: 'Tudo do monitor + gerencia monitores, aprova ou recusa exclusões e exclui sem pedir aprovação.' },
            5: { nome: 'Webmaster', desc: 'Acesso total: aprendizes, representantes, monitores, orientadores, ByPass, manutenção, versões, chutar e banir por IP.' }
        };

        const $ = id => document.getElementById(id);
        const nivelAtual = () => (sessionData && sessionData.nivel) || 0;

        function buildNav() {
            const nv = nivelAtual(), nav = $('admin-nav');
            if (!nav) return;
            nav.innerHTML = '';
            MENU.forEach(m => {
                if (m.itens) {
                    const itens = m.itens.filter(i => i.niveis.includes(nv) && !i.oculto);
                    if (!itens.length) return;
                    const d = document.createElement('div');
                    d.className = 'nav-drop';
                    d.innerHTML = `<button class="nav-tab" type="button" onclick="toggleDrop(this.parentElement, event)">${m.label} <span class="caret">▾</span></button>
                        <div class="nav-menu">${itens.map(i => `<div class="nav-item" data-tab="${i.id}" onclick="switchAdminTab('${i.id}')">${i.label}</div>`).join('')}</div>`;
                    nav.appendChild(d);
                } else if (m.niveis.includes(nv)) {
                    const b = document.createElement('button');
                    b.className = 'nav-tab'; b.type = 'button'; b.dataset.tab = m.id; b.innerHTML = m.label;
                    b.onclick = () => switchAdminTab(m.id);
                    nav.appendChild(b);
                }
            });
            buildMobileBar();
        }
        // ===== Layout de celular: barra inferior + folhas (só aparecem em telas estreitas) =====
        const _mq = window.matchMedia('(max-width: 820px)');
        // Ícones de linha (SVG embutido: funcionam offline e seguem a cor do tema). Para trocar por outros, edite este objeto.
        const SV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
        const M_ICONES = {
            inicio: SV('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
            biblioteca: SV('<path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z"/><path d="M12 6.5v13"/>'),
            usuarios: SV('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.5 2.3 4.5 5"/>'),
            utilidades: SV('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'),
            mais: SV('<path d="M4 7h16M4 12h16M4 17h16"/>'),
            portal: SV('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3.2 3.4 3.2 14.6 0 18"/><path d="M12 3c-3.2 3.4-3.2 14.6 0 18"/>')
        };
        // Estrutura do menu: [id da página, texto]. Só aparece o que o nível do usuário pode acessar.
        const M_GRUPOS = [
            { k: 'biblioteca', lb: 'Acervo', secoes: [{ t: 'Acervo', itens: [['solicitacoes', 'Solicitações'], ['emprestimos', 'Empréstimos'], ['livros', 'Gestão de livros'], ['categorias', 'Categorias e prefixos'], ['etiquetas', 'Gerador de etiquetas']] }] },
            { k: 'usuarios', lb: 'Usuários', secoes: [{ itens: [['turmas', 'Gerir cidades e turmas'], ['logins', 'Gerir aprendizes'], ['selos', 'Selos de conquista'], ['representantes', 'Gerir representantes'], ['monitores', 'Gerir monitores'], ['orientadores', 'Gerir orientadores'], ['adm', 'Gerir administrativo'], ['webmaster-codes', 'Gerir ByPass']] }] },
            { k: 'utilidades', lb: 'Utilidades', secoes: [{ itens: [['objetos', 'Achados & perdidos'], ['mural', 'Gerir mural'], ['calendario', 'Calendário'], ['sugestoes', 'Sugestões'], ['artes', 'Artes em foco'], ['wifi', 'Wi-fi'], ['faq', 'Dúvidas frequentes']] }] },
            { k: 'mais', lb: 'Mais', secoes: [{ t: 'Auditoria', itens: [['historico', 'Histórico geral'], ['sistema-versoes', 'Versão']] }, { t: 'Sistema', itens: [['configuracoes', 'Configurações'], ['temas', 'Layout e temas']] }] }
        ];
        const closeSheet = () => document.body.classList.remove('m-sheet-open');
        const nivelM = () => { try { return sessionData.nivel; } catch (e) { return 0; } };
        const mRow = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'm-row'; b.textContent = label; b.onclick = () => { closeSheet(); fn(); }; return b; };
        function mItens(secoes) {
            const nodes = [];
            secoes.forEach(sec => {
                const itens = sec.itens.filter(([id]) => { const f = MENU_FLAT.find(i => i.id === id); return f && f.niveis.includes(nivelM()); });
                if (!itens.length) return;
                if (sec.t) { const h = document.createElement('div'); h.className = 'm-sub'; h.textContent = sec.t; nodes.push(h); }
                itens.forEach(([id, lb]) => nodes.push(mRow(lb, () => switchAdminTab(id))));
            });
            return nodes;
        }
        function mOpen(title, nodes) {
            $('m-sheet-title').textContent = title;
            const box = $('m-sheet-body'); box.innerHTML = ''; nodes.forEach(n => box.appendChild(n));
            document.body.classList.add('m-sheet-open');
        }
        function buildMobileBar() {
            const bar = $('m-tabbar'); if (!bar) return;
            bar.innerHTML = '';
            const add = (k, lb, fn) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.m = k; b.title = lb; b.setAttribute('aria-label', lb); b.innerHTML = '<span class="ic">' + M_ICONES[k] + '</span>'; b.onclick = fn; bar.appendChild(b); };
            add('inicio', 'Painel', () => { closeSheet(); switchAdminTab('inicio'); });
            M_GRUPOS.forEach(g => {
                const base = mItens(g.secoes);
                if (g.k !== 'mais' && !base.length) return;
                add(g.k, g.lb, () => {
                    const nodes = mItens(g.secoes);
                    if (g.k === 'mais') {
                        nodes.push(mRow('Aparência (no Portal › Meu perfil)', () => { location.href = 'playing.html#configuracoes'; }));
                        nodes.push(mRow('Desconectar', () => logout()));
                    }
                    mOpen(g.lb, nodes);
                });
            });
            mSync();
        }
        function mSync() {
            const bar = $('m-tabbar'); if (!bar) return;
            const sec = document.querySelector('.admin-section.active');
            const id = sec ? sec.id.replace(/^admin-/, '') : 'inicio';
            const f = MENU_FLAT.find(i => i.id === id);
            let k = 'mais';
            if (id === 'inicio') k = 'inicio';
            else if (id === 'menuacervo') k = 'biblioteca';
            else { const g = M_GRUPOS.find(x => x.secoes.some(sc => sc.itens.some(it => it[0] === id))); if (g) k = g.k; }
            bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === k));
            const bt = document.getElementById('brand-text'); if (!bt) return;
            let nv = 0, byp = false, nome = '';
            try { nv = sessionData.nivel; byp = !!sessionData.bypass; nome = sessionData.nome || ''; } catch (e) {}
            document.body.classList.toggle('is-bypass', byp);
            const un = document.getElementById('m-user'); if (un) un.textContent = nome;
            const AREA = { 2: 'Representante', 3: 'Monitor', 4: 'Orientador', 5: 'Admin' };
            const DESK = { 2: 'CIEESC ▶︎ PLAY • Representantes', 3: 'CIEESC ▶︎ PLAY • Monitores', 4: 'CIEESC ▶︎ PLAY • Orientadores', 5: 'CIEESC ▶︎ PLAY • Administrador' };
            // nome curto da página aberta, em minúsculas (ex.: "início", "solicitações", "calendário")
            const CURTO = { 'gestão de livros': 'livros', 'gestão de guias e manuais': 'guias e manuais', 'menu acervo (links do play)': 'menu acervo', 'gestão de objetos': 'objetos',
                'administrativo cieesc': 'administrativo', 'representantes de turma': 'representantes', 'dúvidas frequentes': 'dúvidas', 'histórico geral': 'histórico',
                'app em manutenção': 'manutenção', 'layout e temas': 'layout', 'selos de conquista': 'selos', 'sugestões dos aprendizes': 'sugestões', 'configurações': 'configurações', 'gerador de etiquetas': 'etiquetas', 'categorias e prefixos': 'categorias', 'histórico de versões': 'versões' };
            const rot = f ? f.label : ((sec && sec.querySelector('h2')) ? sec.querySelector('h2').textContent : 'início');
            let pg = rot.replace('▾', '').replace(/^[^A-Za-zÀ-ÿ]+/, '').trim().toLowerCase();
            pg = CURTO[pg] || pg || 'início';
            if (_mq.matches && AREA[nv]) bt.innerHTML = '<span class="play-cor play-svg"><svg viewBox=\"0 0 100 100\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M14 10L90 50 14 90Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linejoin=\"round\"/></svg></span>' + ' ' + AREA[nv] + ' <span class="sep">●</span> ' + pg;
            else if (DESK[nv]) bt.innerHTML = DESK[nv].replace('▶︎', '<span class="play-cor play-svg"><svg viewBox=\"0 0 100 100\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M14 10L90 50 14 90Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linejoin=\"round\"/></svg></span>');
        }
        $('m-backdrop').addEventListener('click', closeSheet);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('m-sheet-open')) { e.preventDefault(); closeSheet(); } });
        _mq.addEventListener('change', () => { mSync(); closeSheet(); });
        const _swa = switchAdminTab;
        switchAdminTab = function () { _swa.apply(this, arguments); mSync(); window.scrollTo(0, 0); };

        function toggleAdminNav() { document.body.classList.toggle('nav-open'); }
        function closeAdminNav() { document.body.classList.remove('nav-open'); }
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdminNav(); });
        window.addEventListener('resize', () => { if (innerWidth > 820) closeAdminNav(); });
        function closeDrops() { document.querySelectorAll('.nav-drop.open').forEach(x => x.classList.remove('open')); }
        function toggleDrop(el, ev) { ev.stopPropagation(); const was = el.classList.contains('open'); closeDrops(); if (!was) el.classList.add('open'); }
        document.addEventListener('click', closeDrops);

        function livrosAba(aba) {
            window._lvAba = aba;
            document.querySelectorAll('.lv-aba').forEach(b => { const on = b.dataset.aba === aba; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
            ['fisicos', 'digitais', 'guias'].forEach(k => { const p = $('lv-' + k); if (p) p.hidden = k !== aba; });
        }
        function switchAdminTab(tabId) {
            const alvo = MENU_FLAT.find(i => i.id === tabId);
            if (!alvo || !alvo.niveis.includes(nivelAtual())) tabId = 'inicio';
            document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
            const sec = $('admin-' + tabId);
            if (sec) sec.classList.add('active');
            document.querySelectorAll('#admin-nav .nav-tab, #admin-nav .nav-item').forEach(el => el.classList.remove('active'));
            const direto = document.querySelector(`#admin-nav > .nav-tab[data-tab="${tabId}"]`);
            if (direto) direto.classList.add('active');
            const item = document.querySelector(`#admin-nav .nav-item[data-tab="${tabId}"]`);
            if (item) { item.classList.add('active'); item.closest('.nav-drop').querySelector('.nav-tab').classList.add('active'); }
            closeDrops(); closeAdminNav();
            try { history.replaceState(null, '', '#' + tabId); } catch (e) {}

            if (tabId === 'inicio') renderDashboard();
            if (tabId === 'solicitacoes') renderSolicitacoes();
            if (tabId === 'emprestimos') renderEmprestimos();
            if (tabId === 'livros') { renderCategorias(); renderAcervo(); crudRender('digital'); crudRender('guias'); livrosAba(window._lvAba || 'fisicos'); }
            if (tabId === 'categorias') renderCategorias();
            if (tabId === 'etiquetas') { renderCategorias(); renderEtiquetas(); }
            if (tabId === 'turmas') { renderCidades(); renderTurmas(); }
            if (tabId === 'historico') renderHistorico();
            if (tabId === 'logins') renderLogins();
            if (tabId === 'wifi') wifiCarregar();
            if (tabId === 'configuracoes') renderConfiguracoes();
            if (tabId === 'sistema-versoes') renderVersoes();
            if (tabId === 'temas') renderTemas();
            if (tabId === 'selos') renderSelosAdmin();
            if (tabId === 'sugestoes') renderSugestoesAdmin();
            if (tabId === 'webmaster-codes') { renderCodigos(); renderNiveisLegenda(); }
            if (CRUDS[tabId] && !CRUDS[tabId].mount) crudRender(tabId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ---------- 2. Utilitários ----------
        const semEmoji = t => String(t == null ? '' : t).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]|[\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
        const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const fmtBR = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        function lsGet(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
        function lsSet(k, v, silencioso) {
            try { localStorage.setItem(k, JSON.stringify(v)); return true; }
            catch (e) {
                if (!silencioso) abrirModalCustom({ titulo: 'Armazenamento cheio', icone: '', texto: 'Não foi possível salvar: o armazenamento do navegador está cheio. Use links externos no lugar de arquivos grandes.' });
                return false;
            }
        }
        async function sha256(t) {
            try {
                const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
                return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
            } catch (e) { return ''; }
        }
        const NAME_LOWER = ['de', 'da', 'do', 'das', 'dos', 'e'];
        function formatName(str) {
            return String(str).trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').split(' ').map((w, i) => {
                if (i > 0 && NAME_LOWER.includes(w)) return w;
                return w.replace(/(^|[-'’])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase('pt-BR'));
            }).join(' ');
        }
        const nd = t => { t = String(t || '').replace(/\D/g, ''); return (t.length > 11 && t.startsWith('55')) ? t.slice(2) : t; };
        const opcoesCidades = () => cidadesList.map(c => ({ value: c, label: c }));
        const PERIODOS = ['Segunda/Quarta - Matutino', 'Segunda/Quarta - Vespertino', 'Terça/Quinta - Matutino', 'Terça/Quinta - Vespertino', 'Sexta-feira - Integral'];

        // Persistência de todos os módulos (acervo, categorias, etiquetas, turmas, etc.)
        function persistirTudo() {
            lsSet('ciee_acervo', acervo, true);
            lsSet('ciee_categorias', categorias, true);
            lsSet('ciee_etiquetas', listaEtiquetas, true);
            lsSet('ciee_etiquetas_cats', etiquetasCats, true);
            lsSet('ciee_turmas', turmas, true);
            lsSet('ciee_cidades', cidadesList, true);
            lsSet('ciee_solicitacoes', solicitacoes, true);
            lsSet('ciee_emprestimos', emprestimos, true);
        }

        // ---------- 3. Dashboard (Início) ----------
        function renderDashboard() {
            atualizarEstatisticas();
            const v = lsGet('ciee_visitas', { total: 0, dias: {} });
            const hoje = new Date().toISOString().slice(0, 10);
            $('visit-total').innerText = (v.total || 0).toLocaleString('pt-BR');
            $('visit-hoje').innerText = (v.dias || {})[hoje] || 0;
            let s7 = 0, sm = 0; const barras = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
                const n = (v.dias || {})[d] || 0; s7 += n; barras.push({ d, n });
            }
            Object.entries(v.dias || {}).forEach(([d, n]) => { if (d.slice(0, 7) === hoje.slice(0, 7)) sm += n; });
            $('visit-7d').innerText = s7; $('visit-mes').innerText = sm;
            const max = Math.max(1, ...barras.map(b => b.n));
            $('visit-chart').innerHTML = barras.map(b => `<div class="bar-col"><span class="bar-n">${escHtml(b.n)}</span><div class="bar" style="height:${Math.max(4, Math.round(b.n / max * 100))}%"></div><small>${b.d.slice(8)}/${b.d.slice(5, 7)}</small></div>`).join('');

            const top = Object.values(lsGet('ciee_acessos_usuarios', {})).sort((a, b) => b.count - a.count).slice(0, 3);
            $('top-users').innerHTML = top.length ? top.map((u, i) => `<li><span class="medal">${['', '', ''][i]}</span><div class="rank-info"><strong>${escHtml(u.nome)}</strong><small>${escHtml(u.email || NIVEIS_INFO[u.nivel]?.nome || '—')}</small></div><span class="badge badge-blue">${escHtml(u.count)} acesso(s)</span></li>`).join('')
                : '<li class="vazio">Ainda não há acessos registrados.</li>';

            const on = Object.values(lsGet('ciee_presenca', {})).filter(p => Date.now() - p.ts < 30000).sort((a, b) => b.ts - a.ts);
            $('online-count').innerText = on.length;
            const n4 = nivelAtual() === 5; window._onlineLista = on;
            $('th-online-acoes').style.display = n4 ? '' : 'none';
            $('table-online').innerHTML = on.length ? on.map((p, i) => `
                <tr><td><span class="dot-online"></span><strong>${escHtml(p.nome)}</strong><br><small>${escHtml(p.email || '')}</small></td>
                <td><span class="badge ${p.nivel >= 2 ? 'badge-yellow' : 'badge-blue'}">${escHtml(NIVEIS_INFO[p.nivel]?.nome || 'Aprendiz')}</span></td>
                <td><code>${escHtml(p.ip)}</code></td><td>${escHtml(p.pagina)}</td>
                <td><small>há ${Math.max(0, Math.round((Date.now() - p.ts) / 1000))}s</small></td>
                ${n4 ? `<td><div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn-action btn-danger" onclick="chutarUsuario(${i})">Chutar</button><button class="btn-action btn-danger" onclick="banirIp(${i})">Banir IP</button></div></td>` : ''}</tr>`).join('')
                : `<tr><td colspan="${n4 ? 6 : 5}" style="text-align:center;color: var(--muted-ok, #526071)">Ninguém conectado neste momento.</td></tr>`;
            renderBans();
        }


        // ---------- Configurações (somente Webmaster) ----------
        const RECURSOS = [
            { k: 'biometria', t: 'Entrada por biometria', d: 'Mostra “Entrar com biometria” na tela de acesso do celular e permite ativar em Meu perfil.' },
            { k: 'primeiroAcesso', t: 'Novos primeiros acessos', d: 'Permite novos cadastros pelo botão “Primeiro acesso”. Desligado, o botão fica indisponível.' },
            { k: 'emprestimo', t: 'Empréstimo de livros', d: 'Aprendizes podem emprestar e renovar livros no portal. Desligado, os botões ficam bloqueados.' },
            { k: 'devolucao', t: 'Devolução de livros', d: 'Libera a devolução de livros (pelo aprendiz no portal e a confirmação no painel).' },
            { k: 'sugestoes', t: 'Caixa de sugestões', d: 'Mostra a caixa de sugestões no portal. Desligado, o menu Sugestões some para os aprendizes.' }
        ];
        const RECURSOS_PADRAO = { biometria: true, primeiroAcesso: true, emprestimo: true, devolucao: true, sugestoes: true };
        const recursosGet = () => Object.assign({}, RECURSOS_PADRAO, sisGet().recursos || {});
        function renderConfiguracoes() {
            renderManutencao();
            const r = recursosGet();
            $('cfg-recursos').innerHTML = RECURSOS.map(x => `<div class="cfg-linha"><div><strong>${escHtml(x.t)}</strong><small>${escHtml(x.d)}</small></div>
                <label class="sw"><input type="checkbox" role="switch" data-k="${x.k}" ${r[x.k] ? 'checked' : ''} aria-label="${escHtml(x.t)}" onchange="cfgRecurso(this.dataset.k, this.checked, this)"><span class="sw-trilho"></span></label><span class="sw-txt" id="sw-${x.k}">${r[x.k] ? 'Ativado' : 'Desativado'}</span></div>`).join('');
            $('cfg-limpar').innerHTML = CFG_LIMPAR.map(x => `<div class="cfg-linha"><div><strong>${escHtml(x.t)}<span class="cfg-qtd">${x.ler().length}</span></strong><small>${escHtml(x.d)}</small></div><button class="btn-action btn-danger" data-id="${x.id}" onclick="cfgLimpar(this.dataset.id)">Limpar</button></div>`).join('');
            $('cfg-resetar').innerHTML = CFG_RESETAR.map(x => `<div class="cfg-linha"><div><strong>${escHtml(x.t)}<span class="cfg-qtd">${x.ler().length}</span></strong><small>${escHtml(x.d)}</small></div><button class="btn-action btn-danger" data-id="${x.id}" onclick="cfgResetar(this.dataset.id)">Resetar</button></div>`).join('');
            const on = Object.values(lsGet('ciee_presenca', {})).filter(p => Date.now() - p.ts < 30000).length;
            renderRestaurar();
            $('cfg-online-info').textContent = on ? on + (on === 1 ? ' usuário conectado agora.' : ' usuários conectados agora.') : 'Ninguém conectado neste momento.';
        }
        function cfgRecurso(k, on, el) {
            const def = RECURSOS.find(x => x.k === k), aplicar = () => { sisSet({ recursos: Object.assign(recursosGet(), { [k]: on }) }); registrarHistorico('Sistema', (on ? 'Recurso ativado' : 'Recurso desativado'), def.t + ' • por ' + sessionData.nome); renderConfiguracoes(); };
            aplicar();
        }
        // ----- quais dados cada botão mexe -----
        const arr = v => Array.isArray(v) ? v : [];
        const valObj = (o, ks) => ks.map(k => o[k] == null ? '' : o[k]);
        const CFG_LIMPAR = [
            { id: 'historico', t: 'Limpar histórico geral', d: 'Apaga todo o Histórico geral (aprovações, devoluções, chutes, mudanças de sistema...).', pdf: true, arquivo: 'historico-geral',
              ler: () => historicoDecisoes, colunas: ['Data', 'Responsável', 'Aprendiz / alvo', 'Ação', 'Detalhe'], linha: h => valObj(h, ['data', 'responsavel', 'aprendiz', 'acao', 'motivo']),
              apagar: () => { historicoDecisoes.length = 0; localStorage.setItem('ciee_historico_decisoes', '[]'); } },
            { id: 'mural', t: 'Limpar postagens do mural', d: 'Remove todas as postagens do Mural do portal.', pdf: false,
              ler: () => CRUDS.mural.data, apagar: () => { CRUDS.mural.data.length = 0; crudSave('mural'); } },
            { id: 'solicitacoes', t: 'Limpar histórico de solicitações', d: 'Apaga as solicitações de empréstimo/reserva e as solicitações de exclusão.', pdf: true, arquivo: 'solicitacoes',
              ler: () => solicitacoes.concat(solicitacoesExclusao), colunas: ['Aprendiz / solicitante', 'Tipo', 'Livro / item', 'Turma', 'E-mail', 'Motivo'],
              linha: s => [s.aprendiz || s.solicitante || '', s.tipo || '', s.livro || s.alvo || s.item || '', s.turma || '', s.email || '', s.motivo || ''],
              apagar: () => { solicitacoes.length = 0; solicitacoesExclusao.length = 0; lsSet('ciee_solicitacoes', solicitacoes, true); localStorage.setItem('ciee_solicitacoes_exclusao', '[]'); } },
            { id: 'emprestimos', t: 'Limpar histórico de empréstimos', d: 'Apaga todos os registros da página Empréstimos — inclusive os que ainda estão em andamento. Os pontos de leitura dos aprendizes não mudam.', pdf: true, arquivo: 'emprestimos',
              ler: () => emprestimos, colunas: ['Código', 'Livro', 'Aprendiz', 'Retirada', 'Devolução prevista', 'Situação'], linha: e => valObj(e, ['codigo', 'livro', 'aprendiz', 'dataRetirada', 'devolucao', 'status']),
              apagar: () => { emprestimos.length = 0; lsSet('ciee_emprestimos', emprestimos, true); } },
            { id: 'achados', t: 'Limpar histórico de achados e perdidos', d: 'Remove todos os objetos da Gestão de objetos (e as fotos deles).', pdf: true, arquivo: 'achados-e-perdidos',
              ler: () => objetosAchados, colunas: ['Objeto', 'Data', 'Período', 'Quem achou', 'Cidade'], linha: o => valObj(o, ['nome', 'data', 'periodo', 'quem', 'cidade']),
              apagar: () => { objetosAchados.length = 0; localStorage.setItem('ciee_objetos_achados', '[]'); } },
            { id: 'calendario', t: 'Limpar todos os eventos do calendário', d: 'Remove todos os eventos cadastrados (as datas especiais dos temas continuam).', pdf: false,
              ler: () => CRUDS.calendario.data, apagar: () => { CRUDS.calendario.data.length = 0; crudSave('calendario'); } }
        ];
        const crudPdf = (id, colunas, ks) => ({ ler: () => CRUDS[id].data, colunas, linha: o => valObj(o, ks), apagar: () => { CRUDS[id].data.length = 0; crudSave(id); } });
        const CFG_RESETAR = [
            Object.assign({ id: 'cidades', t: 'Resetar todos os cadastros de cidades', d: 'Remove todas as cidades. Sem cidades não dá para cadastrar turmas e equipe até criar de novo.', pdf: true, arquivo: 'cidades', colunas: ['Cidade'] },
                { ler: () => cidadesList, linha: c => [c], apagar: () => { cidadesList.length = 0; lsSet('ciee_cidades', cidadesList, true); } }),
            { id: 'turmas', t: 'Resetar todos os cadastros de turmas', d: 'Remove todas as turmas de todas as cidades.', pdf: true, arquivo: 'turmas',
              ler: () => turmas, colunas: ['Código', 'Dia / período', 'Cidade', 'Responsável'], linha: t => valObj(t, ['codId', 'diaPeriodo', 'cidade', 'responsavel']),
              apagar: () => { turmas.length = 0; lsSet('ciee_turmas', turmas, true); } },
            Object.assign({ id: 'orientadores', t: 'Resetar todos os cadastros de orientadores', d: 'Remove todos os orientadores (eles deixam de aparecer no portal e de receber sugestões por e-mail).', pdf: true, arquivo: 'orientadores', colunas: ['Nome', 'Cidade', 'E-mail', 'Contato'] }, crudPdf('orientadores', [], ['nome', 'cidade', 'email', 'fone'])),
            Object.assign({ id: 'monitores', t: 'Resetar todos os cadastros de monitores', d: 'Remove todos os monitores (eles deixam de aparecer no portal e de receber sugestões por e-mail).', pdf: true, arquivo: 'monitores', colunas: ['Nome', 'Cidade', 'E-mail', 'Contato'] }, crudPdf('monitores', [], ['nome', 'cidade', 'email', 'fone'])),
            Object.assign({ id: 'representantes', t: 'Resetar todos os cadastros de representantes', d: 'Remove todos os representantes de turma.', pdf: true, arquivo: 'representantes', colunas: ['Nome', 'Turma', 'Cidade', 'E-mail', 'Contato'] }, crudPdf('representantes', [], ['nome', 'turma', 'cidade', 'email', 'fone'])),
            { id: 'aprendizes', t: 'Resetar cadastros de aprendizes', d: 'Remove os aprendizes de uma cidade ou de todas. Você escolhe na próxima tela.', pdf: false, especial: true,
              ler: () => getUsuarios() }
        ];
        // ----- janela de confirmação própria (campo de confirmação, PDF e conteúdo extra) -----
        function cfgDialog(o) {
            let m = $('cfg-modal');
            if (!m) { m = document.createElement('div'); m.id = 'cfg-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) cfgFechar(); }); }
            const pal = o.palavra || '';
            m.innerHTML = `<div class="cfg-caixa"><h3>${escHtml(o.titulo)}</h3>${o.texto ? `<p>${escHtml(o.texto)}</p>` : ''}${o.aviso ? `<div class="cfg-aviso">${escHtml(o.aviso)}</div>` : ''}${o.corpo || ''}
                ${o.pdf ? `<label class="cfg-chk"><input type="checkbox" id="cfg-pdf" checked> <span>Baixar um PDF com ${o.qtd} registro(s) antes de apagar</span></label>` : ''}
                ${pal ? `<label for="cfg-palavra" style="font-weight:800;display:block;margin-top:6px">Para confirmar, digite <strong>${escHtml(pal)}</strong>:</label><input type="text" id="cfg-palavra" autocomplete="off" autocapitalize="characters" spellcheck="false">` : ''}
                <div class="cfg-acoes"><button type="button" class="btn-action btn-primary" id="cfg-cancelar">Cancelar</button><button type="button" class="btn-action btn-danger" id="cfg-ok" ${pal ? 'disabled' : ''}>${escHtml(o.botao || 'Confirmar')}</button></div></div>`;
            m.classList.add('on');
            const ok = $('cfg-ok'), campo = $('cfg-palavra');
            $('cfg-cancelar').onclick = cfgFechar;
            if (campo) campo.oninput = () => { ok.disabled = campo.value.trim().toUpperCase() !== pal; };
            ok.onclick = async () => {
                if (ok.disabled) return; ok.disabled = true; ok.textContent = 'Aguarde…';
                const pdfOn = $('cfg-pdf') && $('cfg-pdf').checked;
                try { await o.onConfirm({ pdf: !!pdfOn, ler: id => { const el = $(id); return el ? el.value : ''; } }); cfgFechar(); }
                catch (e) { ok.disabled = false; ok.textContent = o.botao || 'Confirmar'; const av = m.querySelector('.cfg-aviso') || document.createElement('div'); av.className = 'cfg-aviso'; av.textContent = (o.semPrefixo ? '' : 'Não foi possível concluir: ') + (e && e.message || e) + (o.erroSufixo === undefined ? ' Nada foi apagado.' : o.erroSufixo); m.querySelector('.cfg-caixa').insertBefore(av, m.querySelector('.cfg-acoes')); }
            };
            setTimeout(() => (campo || $('cfg-cancelar')).focus(), 30);
        }
        function cfgFechar() { const m = $('cfg-modal'); if (m) m.classList.remove('on'); }
        document.addEventListener('keydown', e => { const m = $('cfg-modal'); if (e.key === 'Escape' && m && m.classList.contains('on')) { e.preventDefault(); e.stopPropagation(); cfgFechar(); } }, true);
        async function cfgBaixarPdf(x) {
            await cieeRelatorio.pdf({ titulo: x.t.replace(/^(Limpar|Resetar) /, 'Backup: '), colunas: x.colunas, linhas: x.ler().map(x.linha), arquivo: x.arquivo || x.id, por: sessionData.nome });
        }
        function cfgFluxo(x, verbo, palavra) {
            const qtd = x.ler().length;
            if (!qtd) return cfgDialog({ titulo: x.t, texto: 'Não há nada para ' + (verbo === 'Limpar' ? 'limpar' : 'resetar') + ' aqui.', botao: 'Entendi', onConfirm: () => {} });
            cfgDialog({ titulo: x.t + '?', texto: x.d, aviso: `${qtd} registro(s) serão apagados. Uma cópia fica na lixeira por ${cieeLixeira.dias} dias (Configurações › Restaurar conteúdo).`, pdf: x.pdf, qtd, palavra, botao: verbo === 'Limpar' ? 'Apagar agora' : 'Resetar agora',
                onConfirm: async r => {
                    if (r.pdf) await cfgBaixarPdf(x);
                    persistirTudo(); ({ solicitacoes: ['ciee_solicitacoes', 'ciee_solicitacoes_exclusao'], emprestimos: ['ciee_emprestimos'] }[x.id] || []).forEach(k => cieeLixeira.guardar(k, 'Limpeza'));
                    x.apagar();
                    registrarHistorico('Sistema', verbo === 'Limpar' ? 'Dados limpos' : 'Cadastros resetados', `${x.t.replace(/^(Limpar|Resetar) /, '')} (${qtd}) • por ${sessionData.nome}${r.pdf ? ' • PDF baixado' : ''}`);
                    persistirTudo(); Object.keys(CRUDS).forEach(crudRender); try { renderSolicitacoes(); renderEmprestimos(); renderObjetos(); renderCidades(); renderTurmas(); renderHistorico(); } catch (e) {}
                    renderConfiguracoes();
                } });
        }
        function cfgLimpar(id) { cfgFluxo(CFG_LIMPAR.find(x => x.id === id), 'Limpar', 'APAGAR'); }
        function cfgResetar(id) {
            const x = CFG_RESETAR.find(v => v.id === id);
            if (!x.especial) return cfgFluxo(x, 'Resetar', 'RESETAR');
            // aprendizes: por cidade ou geral
            const us = getUsuarios(), cids = [...new Set(us.map(u => u.cidade).filter(Boolean))].sort();
            const corpo = `<label for="cfg-cid" style="font-weight:800;display:block;margin:6px 0 4px">Quais aprendizes?</label><select id="cfg-cid"><option value="">Todas as cidades (${us.length})</option>${cids.map(c => `<option value="${escHtml(c)}">${escHtml(c)} (${us.filter(u => u.cidade === c).length})</option>`).join('')}</select>
                <label class="cfg-chk"><input type="checkbox" id="cfg-dados" checked> <span>Apagar também os selos, leituras, indicações, sugestões e biometria desses aprendizes</span></label>`;
            if (!us.length) return cfgDialog({ titulo: x.t, texto: 'Não há aprendizes cadastrados neste aparelho.', botao: 'Entendi', onConfirm: () => {} });
            cfgDialog({ titulo: 'Resetar cadastros de aprendizes?', texto: 'Escolha a cidade e confirme. Quem for removido terá de fazer o “Primeiro acesso” de novo.', aviso: 'Esta ação não pode ser desfeita.', corpo, palavra: 'RESETAR', botao: 'Resetar agora',
                onConfirm: r => {
                    const cid = r.ler('cfg-cid'), dados = $('cfg-dados').checked, lista = getUsuarios(), alvo = lista.filter(u => !cid || u.cidade === cid), chaves = new Set(alvo.map(u => String(u.email || u.nome).toLowerCase()));
                    lsSet('ciee_users', lista.filter(u => !(!cid || u.cidade === cid)), true);
                    if (dados) {
                        const mapa = (k) => { const o = lsGet(k, {}); chaves.forEach(c => delete o[c]); lsSet(k, o, true); };
                        ['ciee_conquistas', 'ciee_sugestoes', 'ciee_acessos_usuarios'].forEach(mapa);
                        lsSet('ciee_leituras', lsGet('ciee_leituras', []).filter(l => !chaves.has(l.chave)), true);
                        lsSet('ciee_indicacoes', lsGet('ciee_indicacoes', []).filter(l => !chaves.has(l.de) && !chaves.has(l.para)), true);
                        lsSet('ciee_bio', lsGet('ciee_bio', []).filter(b => !chaves.has(b.email)), true);
                    }
                    registrarHistorico('Sistema', 'Cadastros resetados', `Aprendizes (${alvo.length}) • ${cid || 'todas as cidades'} • por ${sessionData.nome}`);
                    try { renderLogins(); renderSelosAdmin(); } catch (e) {} renderConfiguracoes();
                } });
        }
        // ----- deslogar usuários conectados (escolhendo quem) -----
        function cfgReconectar() {
            const on = Object.values(lsGet('ciee_presenca', {})).filter(p => Date.now() - p.ts < 30000).sort((p, q) => String(p.nome).localeCompare(String(q.nome)));
            const vistos = new Set(), lista = on.filter(p => { const k = chaveOnline(p); if (vistos.has(k)) return false; vistos.add(k); return true; });
            if (!lista.length) return cfgDialog({ titulo: 'Deslogar usuários', texto: 'Ninguém está conectado neste momento.', botao: 'Entendi', onConfirm: () => {} });
            window._cfgOnline = lista;
            const corpo = `<div style="display:flex;gap:8px;margin:6px 0"><button type="button" class="btn-action btn-primary" onclick="cfgMarcar(true)">Marcar todos</button><button type="button" class="btn-action btn-primary" onclick="cfgMarcar(false)">Desmarcar todos</button></div>
                <div class="cfg-online" id="cfg-online">${lista.map((p, i) => { const adm = p.nivel >= 5; return `<label class="${adm ? 'bloq' : ''}"><input type="checkbox" data-i="${i}" ${adm ? 'disabled' : 'checked'}><span><strong>${escHtml(p.nome)}</strong><small>${escHtml(NIVEIS_INFO[p.nivel]?.nome || 'Aprendiz')}${p.email ? ' • ' + escHtml(p.email) : ''}${adm ? ' • administrador não pode ser deslogado' : ''}</small></span></label>`; }).join('')}</div>
                <label for="cfg-motivo" style="font-weight:800;display:block;margin:8px 0 4px">Mensagem para quem for deslogado:</label><input type="text" id="cfg-motivo" value="Sessão encerrada pela administração. Entre novamente.">`;
            cfgDialog({ titulo: 'Deslogar usuários conectados', texto: lista.length + ' pessoa(s) conectada(s). Marque quem vai sair e desmarque quem fica.', corpo, botao: 'Deslogar selecionados',
                onConfirm: r => {
                    const marcados = [...document.querySelectorAll('#cfg-online input[data-i]:checked')].map(c => window._cfgOnline[+c.dataset.i]);
                    if (!marcados.length) throw new Error('Marque pelo menos uma pessoa.');
                    const motivo = (r.ler('cfg-motivo') || '').trim() || 'Sessão encerrada pela administração.';
                    marcados.forEach(p => ordemKick(p, motivo));
                    registrarHistorico('Sistema', 'Usuários deslogados', `${marcados.map(p => p.nome).join(', ')} • por ${sessionData.nome}`);
                    renderDashboard(); renderConfiguracoes();
                } });
        }
        function cfgMarcar(on) { document.querySelectorAll('#cfg-online input[data-i]:not(:disabled)').forEach(c => { c.checked = on; }); }


        // ---------- Restaurar conteúdo (somente Webmaster): lixeira e backup, sempre com a senha de administrador ----------
        const fmtQuando = t => { try { return new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return ''; } };
        const restLimit = 300;
        // confere a senha de administrador: conta de Webmaster → a própria senha; acesso ByPass → senha de um ByPass de Webmaster
        async function verificarSenhaAdmin(senha) {
            senha = String(senha || '');
            if (!senha) throw new Error('Digite a senha de administrador.');
            const conta = 'restaurar:' + String((sessionData && (sessionData.email || sessionData.nome)) || 'adm').toLowerCase();
            const espera = cieeTentativas.espera(conta);
            if (espera) throw new Error(`Muitas tentativas. Aguarde ${espera}s.`);
            let ok = false;
            if (sessionData && sessionData.bypass) {
                ok = codigosAcesso.some(c => (parseInt(c.nivel, 10) || 0) >= 5 && String(c.senha).trim() === senha.trim());
            } else {
                const mail = String((sessionData && sessionData.email) || '').toLowerCase();
                const u = mail && lsGet('ciee_users', []).find(x => String(x.email || '').toLowerCase() === mail);
                if (!u || !u.senhaHash) throw new Error('Esta conta não tem senha neste aparelho. Entre pelo ByPass de Webmaster.');
                ok = (await cieeSenha.conferir(senha, u.senhaHash)).ok;
            }
            if (!ok) { cieeTentativas.erro(conta); throw new Error('Senha incorreta.'); }
            cieeTentativas.acerto(conta);
        }
        const campoSenha = `<label for="rest-senha" style="font-weight:800;display:block;margin:10px 0 4px">Senha de administrador</label><input type="password" id="rest-senha" autocomplete="current-password" class="rest-senha">`;
        function renderRestaurar() {
            const msg = (() => { try { const m = sessionStorage.getItem('ciee_rest_msg'); sessionStorage.removeItem('ciee_rest_msg'); return m; } catch (e) { return null; } })();
            const av = $('rest-aviso'); if (msg) { av.textContent = msg; av.hidden = false; setTimeout(() => { try { $('cfg-restaurar').scrollIntoView({ block: 'start' }); } catch (e) {} }, 150); }
            const evs = cieeLixeira.eventos(), tipoSel = $('rest-tipo'), atual = tipoSel.value, q = ($('rest-busca').value || '').toLowerCase();
            const tipos = [...new Set(evs.map(e => e.k))].sort((a, b) => cieeLixeira.TIPOS[a].localeCompare(cieeLixeira.TIPOS[b]));
            tipoSel.innerHTML = '<option value="">Todos os tipos</option>' + tipos.map(k => `<option value="${k}">${escHtml(cieeLixeira.TIPOS[k])}</option>`).join('');
            tipoSel.value = tipos.includes(atual) ? atual : '';
            const lista = evs.filter(e => (!tipoSel.value || e.k === tipoSel.value) && (!q || (e.quem || '').toLowerCase().includes(q) || cieeLixeira.TIPOS[e.k].toLowerCase().includes(q) || e.itens.some(x => cieeLixeira.rotulo(e.k, x.i).toLowerCase().includes(q))));
            $('rest-tabela').innerHTML = lista.length ? lista.map(e => {
                const n = e.itens.length, nome = n === 1 ? cieeLixeira.rotulo(e.k, e.itens[0].i) : `${n} itens`;
                const sufixo = e.nota ? ` <span class="badge badge-yellow">${escHtml(e.nota)}</span>` : '';
                return `<tr><td>${escHtml(fmtQuando(e.quando))}</td><td><strong>${escHtml(cieeLixeira.TIPOS[e.k])}</strong><br>${escHtml(nome)}${sufixo}</td><td>${escHtml(e.quem || '')}${e.nivel ? `<br><small>${escHtml((NIVEIS_INFO[e.nivel] || {}).nome || '')}</small>` : ''}</td><td>${n}</td>
                    <td><button class="btn-action btn-success" data-ev="${escHtml(e.id)}" onclick="restEscolher(this.dataset.ev)">Escolher e restaurar</button></td></tr>`;
            }).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--muted-ok,#526071)">${evs.length ? 'Nada encontrado com esse filtro.' : 'A lixeira está vazia.'}</td></tr>`;
            $('rest-info').textContent = evs.length ? `${evs.length} exclusão(ões) guardada(s) • ficam ${cieeLixeira.dias} dias` : '';
            $('rest-esvaziar').hidden = !evs.length;
            const ub = cieeLixeira.ultimoBackup();
            $('rest-ultimo').textContent = ub ? `Último backup baixado neste aparelho: ${fmtQuando(ub.quando)}${ub.quem ? ' por ' + ub.quem : ''}.` : 'Nenhum backup baixado ainda neste aparelho.';
        }
        function restItensHtml(itens, k) {
            if (itens.length > restLimit) return `<p>Serão restaurados todos os <strong>${itens.length}</strong> itens.</p>`;
            return `${itens.length > 1 ? `<div style="display:flex;gap:8px;margin:6px 0"><button type="button" class="btn-action btn-primary" onclick="restMarcar(true)">Marcar todos</button><button type="button" class="btn-action btn-primary" onclick="restMarcar(false)">Desmarcar todos</button></div>` : ''}
                <div class="rest-itens" id="rest-itens">${itens.map((x, i) => `<label><input type="checkbox" data-i="${i}" checked><span>${escHtml(cieeLixeira.rotulo(k, x.i))}</span></label>`).join('')}</div>`;
        }
        function restMarcar(on) { document.querySelectorAll('#rest-itens input[data-i]').forEach(c => { c.checked = on; }); }
        function restSelecionados(itens) {
            const caixas = [...document.querySelectorAll('#rest-itens input[data-i]')];
            return caixas.length ? caixas.filter(c => c.checked).map(c => itens[+c.dataset.i]) : itens;
        }
        function restConcluir(texto) {
            try { sessionStorage.setItem('ciee_rest_msg', texto); } catch (e) {}
            location.reload();                                   // a página recarrega para ler os dados restaurados
        }
        function restEscolher(id) {
            const e = cieeLixeira.eventos().find(x => x.id === id); if (!e) return renderRestaurar();
            const tipo = cieeLixeira.TIPOS[e.k];
            cfgDialog({ titulo: 'Restaurar: ' + tipo, texto: `Excluído por ${e.quem || 'desconhecido'} em ${fmtQuando(e.quando)}. Marque o que voltar.${e.enxuto ? ' Atenção: fotos e arquivos grandes não foram guardados por falta de espaço.' : ''}`,
                aviso: 'A página será recarregada para mostrar o conteúdo restaurado. O que já existe não é alterado.', corpo: restItensHtml(e.itens, e.k) + campoSenha, botao: 'Restaurar', erroSufixo: '', semPrefixo: true,
                onConfirm: async r => {
                    await verificarSenhaAdmin(r.ler('rest-senha'));
                    const itens = restSelecionados(e.itens); if (!itens.length) throw new Error('Marque pelo menos um item.');
                    registrarHistorico('Sistema', 'Conteúdo restaurado', `${tipo} (${itens.length}) • por ${sessionData.nome}`);
                    const res = cieeLixeira.restaurar([{ k: e.k, itens, ev: e.id }]);
                    restConcluir(`${res.ok} item(ns) de “${tipo}” restaurado(s)${res.ignorados ? `; ${res.ignorados} já existia(m) e não mudou` : ''}.`);
                } });
        }
        function restEsvaziar() {
            const n = cieeLixeira.eventos().length; if (!n) return;
            cfgDialog({ titulo: 'Esvaziar a lixeira?', texto: `${n} exclusão(ões) guardada(s) serão apagadas de vez.`, aviso: 'Depois disso não dá mais para restaurar esses itens pela lixeira.', corpo: campoSenha, palavra: 'ESVAZIAR', botao: 'Esvaziar agora', erroSufixo: '', semPrefixo: true,
                onConfirm: async r => {
                    await verificarSenhaAdmin(r.ler('rest-senha'));
                    cieeLixeira.esvaziar(); registrarHistorico('Sistema', 'Lixeira esvaziada', `${n} exclusão(ões) • por ${sessionData.nome}`);
                    renderRestaurar();
                } });
        }
        function restBackupBaixar() {
            cfgDialog({ titulo: 'Baixar backup', texto: 'O arquivo guarda os cadastros e conteúdos deste aparelho, inclusive os dados de acesso. Guarde em lugar seguro.', corpo: campoSenha, botao: 'Baixar', erroSufixo: '', semPrefixo: true,
                onConfirm: async r => {
                    await verificarSenhaAdmin(r.ler('rest-senha'));
                    const bk = cieeLixeira.gerarBackup(), blob = new Blob([JSON.stringify(bk)], { type: 'application/json' });
                    const a = document.createElement('a'), d = new Date(), z = n => String(n).padStart(2, '0');
                    a.href = URL.createObjectURL(blob); a.download = `ciee-play-backup-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}.json`;
                    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
                    registrarHistorico('Sistema', 'Backup baixado', `por ${sessionData.nome}`); renderRestaurar();
                } });
        }
        function restBackupLer(input) {
            const f = input.files && input.files[0]; input.value = '';
            if (!f) return;
            if (f.size > 25 * 1024 * 1024) return abrirModalCustom({ titulo: 'Arquivo grande demais', icone: '', texto: 'O backup passa de 25 MB. Escolha outro arquivo.' });
            const rd = new FileReader();
            rd.onerror = () => abrirModalCustom({ titulo: 'Não foi possível ler', icone: '', texto: 'O arquivo não pôde ser lido.' });
            rd.onload = () => {
                let grupos;
                try { grupos = cieeLixeira.analisarBackup(JSON.parse(rd.result)); }
                catch (e) { return abrirModalCustom({ titulo: 'Backup inválido', icone: '', texto: (e && e.message && !/JSON/.test(e.message)) ? e.message : 'Este arquivo não é um backup do CIEESC PLAY.' }); }
                if (!grupos.length) return abrirModalCustom({ titulo: 'Nada a restaurar', icone: '', texto: 'Tudo o que está neste backup já existe aqui.' });
                const total = grupos.reduce((n, g) => n + g.itens.length, 0);
                const corpo = `<div class="rest-itens" id="rest-itens">${grupos.map((g, gi) => `<div class="rest-grupo">${escHtml(cieeLixeira.TIPOS[g.k])} (${g.itens.length})</div>` + g.itens.slice(0, restLimit).map((x, i) => `<label><input type="checkbox" data-g="${gi}" data-i="${i}" checked><span>${escHtml(cieeLixeira.rotulo(g.k, x.i))}</span></label>`).join('') + (g.itens.length > restLimit ? `<div class="rest-grupo" style="font-weight:700">…e mais ${g.itens.length - restLimit} (voltam junto)</div>` : '')).join('')}</div>`
                    + `<div style="display:flex;gap:8px;margin:8px 0 0"><button type="button" class="btn-action btn-primary" onclick="restMarcar(true)">Marcar todos</button><button type="button" class="btn-action btn-primary" onclick="restMarcar(false)">Desmarcar todos</button></div>` + campoSenha;
                cfgDialog({ titulo: 'Restaurar do backup', texto: `${total} item(ns) do backup não existem mais aqui. Marque o que voltar.`, aviso: 'A página será recarregada. O que já existe não é alterado.', corpo, botao: 'Restaurar', erroSufixo: '', semPrefixo: true,
                    onConfirm: async r => {
                        await verificarSenhaAdmin(r.ler('rest-senha'));
                        const marc = new Set([...document.querySelectorAll('#rest-itens input[data-g]:checked')].map(c => c.dataset.g + ':' + c.dataset.i));
                        const sel = grupos.map((g, gi) => ({ k: g.k, itens: g.itens.filter((x, i) => i >= restLimit || marc.has(gi + ':' + i)) })).filter(s => s.itens.length);
                        if (!marc.size) throw new Error('Marque pelo menos um item.');
                        registrarHistorico('Sistema', 'Conteúdo restaurado do backup', `${sel.reduce((n, s) => n + s.itens.length, 0)} item(ns) • por ${sessionData.nome}`);
                        const res = cieeLixeira.restaurar(sel);
                        restConcluir(`${res.ok} item(ns) restaurado(s) do backup${res.ignorados ? `; ${res.ignorados} já existia(m) e não mudou` : ''}.`);
                    } });
            };
            rd.readAsText(f);
        }

        // ---------- Moderação (somente nível 5): chutar e banir por IP ----------
        const chaveOnline = p => String(p.email || p.nome || 'anon').toLowerCase();
        const ipOk = ip => typeof ip === 'string' && /^[0-9a-f:.]{3,45}$/i.test(ip) && /[.:]/.test(ip);
        function avisoMod(texto) { abrirModalCustom({ titulo: 'Atenção', icone: '', texto }); }
        function ordemKick(p, motivo) {
            const k = lsGet('ciee_kicks', {});
            k[chaveOnline(p)] = { motivo, quando: Date.now(), por: sessionData.nome, nome: p.nome };
            lsSet('ciee_kicks', k);
        }
        function chutarUsuario(i) {
            const p = (window._onlineLista || [])[i];
            if (!p || nivelAtual() !== 5) return;
            if (p.nivel >= 5) return avisoMod('Administradores (nível 5) não podem ser chutados.');
            abrirModalCustom({
                titulo: 'Chutar usuário', icone: '', texto: `${p.nome} será desconectado agora e verá o motivo na tela.`,
                camposMultiplos: [{ id: 'motivo', label: 'Motivo:', tipo: 'textarea', obrigatorio: true }],
                textoBtnConfirmar: 'Chutar',
                onConfirm: res => {
                    const motivo = res.valores.motivo.trim();
                    ordemKick(p, motivo);
                    registrarHistorico(p.nome, 'Usuário chutado', `Motivo: ${motivo} • por ${sessionData.nome}`);
                    renderDashboard();
                }
            });
        }
        function banirIp(i) {
            const p = (window._onlineLista || [])[i];
            if (!p || nivelAtual() !== 5) return;
            if (p.nivel >= 5) return avisoMod('Administradores (nível 5) não podem ser banidos.');
            if (!ipOk(p.ip)) return avisoMod('O IP deste usuário ainda não foi identificado. Aguarde alguns segundos e tente de novo.');
            let meu = ''; try { meu = sessionStorage.getItem('ciee_ip') || ''; } catch (e) {}
            if (p.ip === meu) return avisoMod('Este é o seu próprio IP. Banir bloquearia outras pessoas na mesma rede e não é permitido para o seu endereço.');
            abrirModalCustom({
                titulo: 'Banir por IP', icone: '', texto: `O IP ${p.ip} (${p.nome}) será bloqueado, a sessão será encerrada e o motivo aparecerá na tela. Quem usa a mesma rede/internet também pode ser afetado.`,
                camposMultiplos: [{ id: 'motivo', label: 'Motivo:', tipo: 'textarea', obrigatorio: true }],
                textoBtnConfirmar: 'Banir',
                onConfirm: res => {
                    const motivo = res.valores.motivo.trim();
                    const bans = lsGet('ciee_bans', []).filter(b => b.ip !== p.ip);
                    bans.unshift({ ip: p.ip, motivo, quando: Date.now(), por: sessionData.nome, nome: p.nome });
                    lsSet('ciee_bans', bans);
                    ordemKick(p, motivo);
                    registrarHistorico(p.nome, 'IP banido', `IP ${p.ip} • Motivo: ${motivo} • por ${sessionData.nome}`);
                    renderDashboard();
                }
            });
        }
        function desbanirIp(i) {
            if (nivelAtual() !== 5) return;
            const bans = lsGet('ciee_bans', []), b = bans[i]; if (!b) return;
            abrirModalCustom({
                titulo: 'Desbanir IP', icone: '', texto: `Liberar o IP ${b.ip}?`, textoBtnConfirmar: 'Desbanir',
                onConfirm: () => { bans.splice(i, 1); lsSet('ciee_bans', bans); registrarHistorico(b.nome || b.ip, 'IP desbanido', `IP ${b.ip} • por ${sessionData.nome}`); renderDashboard(); }
            });
        }
        function renderBans() {
            const painel = $('panel-bans'); if (!painel) return;
            const n4 = nivelAtual() === 5; painel.style.display = n4 ? '' : 'none'; if (!n4) return;
            const bans = lsGet('ciee_bans', []); $('bans-count').innerText = bans.length;
            $('table-bans').innerHTML = bans.length ? bans.map((b, i) => `<tr><td><code>${escHtml(b.ip)}</code></td><td>${escHtml(b.nome || '—')}</td><td>${escHtml(b.motivo)}</td>
                <td><small>${new Date(b.quando).toLocaleString('pt-BR')}<br>por ${escHtml(b.por || '—')}</small></td>
                <td><button class="btn-action btn-success" onclick="desbanirIp(${i})">Desbanir</button></td></tr>`).join('')
                : '<tr><td colspan="5" style="text-align:center;color: var(--muted-ok, #526071)">Nenhum IP banido.</td></tr>';
        }
        setInterval(() => { if ($('admin-inicio') && $('admin-inicio').classList.contains('active')) renderDashboard(); }, 5000);
        window.addEventListener('storage', () => { if ($('admin-inicio') && $('admin-inicio').classList.contains('active')) renderDashboard(); });

        function atualizarEstatisticas() {
            const total = acervo.length;
            const emp = emprestimos.length;
            if ($('stat-total')) $('stat-total').innerText = total;
            if ($('stat-disp')) $('stat-disp').innerText = Math.max(0, total - emp);
            if ($('stat-emp')) $('stat-emp').innerText = emp;
            if ($('stat-pend')) $('stat-pend').innerText = solicitacoes.filter(s => (s.status || 'Aguardando') === 'Aguardando').length;
        }

        // ---------- 4. Gestão de Livros: acervo físico ----------
        const livroEmprestado = cod => emprestimos.some(e => e.codigo === cod);

        function renderAcervo() {
            const tbody = $('table-acervo');
            if (!tbody) return;
            atualizarDropdownCategorias();
            const q = searchAcervoText.toLowerCase();
            const filtrados = acervo.filter(a =>
                (a.titulo.toLowerCase().includes(q) || a.autor.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q) || (a.editora || '').toLowerCase().includes(q) || (a.isbn && q.replace(/[^0-9x]/g, '').length >= 4 && String(a.isbn).toLowerCase().includes(q.replace(/[^0-9x]/g, '')))) &&
                (filtroAcervoCat === '' || a.categoria === filtroAcervoCat));
            const totalPages = Math.ceil(filtrados.length / 10) || 1;
            if (pageAcervo > totalPages) pageAcervo = totalPages;
            const pagina = filtrados.slice((pageAcervo - 1) * 10, pageAcervo * 10);

            tbody.innerHTML = pagina.length ? pagina.map(item => {
                const i = acervo.findIndex(x => x.id === item.id);
                const emp = livroEmprestado(item.codigo);
                return `<tr>
                    <td><code>${escHtml(item.codigo)}</code></td>
                    <td>${item.capa ? `<img class="thumb-capa" src="${escHtml(imgOk(item.capa))}" alt="">` : ''}<strong>${escHtml(item.titulo)}</strong>${item.editora ? `<br><small>${escHtml(item.editora)}</small>` : ''}</td>
                    <td>${escHtml(item.autor)}${item.autorSec && item.autorSec !== 'N/A' ? `<br><small>${escHtml(item.autorSec)}</small>` : ''}</td>
                    <td><span class="badge badge-blue">${escHtml(item.categoria)}</span></td>
                    <td>${escHtml(item.ano || '-')}</td>
                    <td>${escHtml(item.local || '-')}</td>
                    <td><span class="badge ${emp ? 'badge-red' : 'badge-green'}">${emp ? 'Emprestado' : 'Disponível'}</span></td>
                    <td><div style="display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn-action btn-warning" onclick="editarLivro(${i})">Editar</button>
                        <button class="btn-action btn-primary btn-ico" onclick="gerarEtiquetaLivro(${i})" title="Adicionar às etiquetas" aria-label="Adicionar às etiquetas"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg></button>
                        <button class="btn-action btn-danger" onclick="excluirLivro(${i})">Excluir</button>
                    </div></td></tr>`;
            }).join('') : `<tr><td colspan="8" style="text-align:center;color: var(--muted-ok, #526071)">Nenhum livro físico encontrado.</td></tr>`;

            $('page-info-acervo').innerText = `Página ${pageAcervo} de ${totalPages} • ${filtrados.length} livro(s)`;
            $('btn-prev-acervo').disabled = pageAcervo === 1;
            $('btn-next-acervo').disabled = pageAcervo === totalPages;
            atualizarEstatisticas();
        }

        const camposLivro = (l) => [
            { id: 'isbn', label: 'ISBN (opcional — preenche os dados do livro):', valorInicial: l?.isbn || '' },
            { id: 'capa', label: 'Imagem da capa (opcional):', tipo: 'imagem', valorInicial: l?.capa || '' },
            { id: 'titulo', label: 'Título do Livro:', valorInicial: l?.titulo, obrigatorio: true },
            { id: 'autor', label: 'Autor(a) Principal:', valorInicial: l?.autor, obrigatorio: true },
            { id: 'autorSec', label: 'Autor(a) Secundário / Coautor (opcional):', valorInicial: l && l.autorSec !== 'N/A' ? l.autorSec : '' },
            { id: 'ano', label: 'Ano de publicação:', tipo: 'number', valorInicial: l?.ano || new Date().getFullYear() },
            { id: 'editora', label: 'Editora:', valorInicial: l?.editora },
            { id: 'local', label: 'Localização (estante / prateleira):', valorInicial: l?.local },
            { id: 'desc', label: 'Sinopse / observações:', tipo: 'textarea', valorInicial: l?.desc },
            { id: 'autorBR', label: 'Autor(a) brasileiro(a)? (desafio “Raízes Brasileiras”)', tipo: 'select', opcoes: [{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }], valorInicial: l?.autorBR || 'nao' },
            { id: 'profissao', label: 'Ligado à profissão / mundo do trabalho? (desafio “Leitura Profissional”)', tipo: 'select', opcoes: [{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }], valorInicial: l?.profissao || 'nao' }
        ];

        // ---------- busca de livro pelo ISBN ----------
        const isbnLimpo = t => String(t || '').toUpperCase().replace(/[^0-9X]/g, '');
        function isbnValido(t) {
            const s = isbnLimpo(t);
            if (/^\d{9}[\dX]$/.test(s)) { let n = 0; for (let i = 0; i < 10; i++) n += (s[i] === 'X' ? 10 : +s[i]) * (10 - i); return n % 11 === 0; }
            if (/^\d{13}$/.test(s)) { let n = 0; for (let i = 0; i < 13; i++) n += +s[i] * (i % 2 ? 3 : 1); return n % 10 === 0; }
            return false;
        }
        async function buscarISBN(isbn) {          // 1º BrasilAPI (bases brasileiras); se não achar, Google Livros
            try { const r = await fetch('https://brasilapi.com.br/api/isbn/v1/' + isbn); if (r.ok) { const j = await r.json(); if (j && j.title) return { titulo: [j.title, j.subtitle].filter(Boolean).join(': '), autor: (j.authors || [])[0] || '', autorSec: (j.authors || []).slice(1).join(', '), editora: j.publisher || '', ano: j.year || '', desc: j.synopsis || '' }; } } catch (e) {}
            try { const r = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn); if (r.ok) { const j = await r.json(), v = j.items && j.items[0] && j.items[0].volumeInfo; if (v) return { titulo: [v.title, v.subtitle].filter(Boolean).join(': '), autor: (v.authors || [])[0] || '', autorSec: (v.authors || []).slice(1).join(', '), editora: v.publisher || '', ano: String(v.publishedDate || '').slice(0, 4), desc: v.description || '' }; } } catch (e) {}
            return null;
        }
        function ligarISBN() {                     // botão "Buscar" ao lado do campo ISBN do formulário de livro
            const campo = document.getElementById('modal_field_isbn'); if (!campo || campo.dataset.ok) return; campo.dataset.ok = '1';
            campo.setAttribute('inputmode', 'numeric'); campo.placeholder = 'Ex.: 978-85-359-0277-1';
            const caixa = document.createElement('div'); caixa.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap';
            caixa.innerHTML = '<button type="button" class="btn-action btn-primary" id="btn-isbn">Buscar pelo ISBN</button><button type="button" class="btn-action btn-primary btn-ico" id="btn-isbn-scan" style="gap:6px"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>Escanear</button><small id="isbn-msg" role="status" style="font-weight:700"></small>';
            campo.insertAdjacentElement('afterend', caixa);
            const msg = t => { document.getElementById('isbn-msg').textContent = t; };
            const vai = async () => {
                const isbn = isbnLimpo(campo.value);
                if (!isbnValido(isbn)) return msg('ISBN inválido. Confira os 10 ou 13 dígitos.');
                msg('Buscando…'); const d = await buscarISBN(isbn);
                if (!d) return msg('Não encontramos este ISBN. Preencha os dados à mão.');
                const por = (id, v) => { const el = document.getElementById('modal_field_' + id); if (el && v && !el.readOnly) el.value = String(v).trim().slice(0, id === 'desc' ? 600 : 200); };
                por('titulo', d.titulo); por('autor', d.autor); por('autorSec', d.autorSec); por('editora', d.editora); por('ano', d.ano); por('desc', d.desc);
                msg('Dados preenchidos. Confira antes de salvar.');
            };
            document.getElementById('btn-isbn').onclick = vai;
            document.getElementById('btn-isbn-scan').onclick = () => window.cieeScanner && cieeScanner.abrir({ titulo: 'Escanear o ISBN do livro', dica: 'Aponte a câmera para o código de barras na contracapa (o que começa com 978 ou 979).',
                onLido: t => { campo.value = t; vai(); } });
            campo.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); vai(); } });
        }
        function cadastrarNovoLivro() {
            setTimeout(ligarISBN, 0);
            if (!categorias.length) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Cadastre ao menos uma categoria antes de incluir livros.' });
            const opcoes = categorias.map(c => ({ value: c.prefixo, label: `${c.prefixo} - ${c.nome}` }));
            opcoes.push({ value: 'NOVA_CAT', label: 'INSERIR NOVA CATEGORIA...' });
            const pref = categorias[0].prefixo;
            abrirModalCustom({
                titulo: 'Cadastrar novo livro físico', icone: '', texto: 'Preencha as informações da obra:',
                camposMultiplos: [
                    { id: 'categoria', label: '1. Categoria:', tipo: 'select', opcoes, valorInicial: pref, obrigatorio: true, onChange: 'gerenciarMudancaCategoriaLivro(this)' },
                    { id: 'codigo', label: '2. Código identificador:', valorInicial: gerarProximoCodigo(pref), obrigatorio: true, readonly: true },
                    ...camposLivro(null)
                ],
                textoBtnConfirmar: 'Cadastrar livro',
                onConfirm: (res) => {
                    const v = res.valores;
                    if (acervo.some(a => a.codigo === v.codigo)) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Já existe um livro com este código.' });
                    const novo = { id: Date.now(), codigo: v.codigo, titulo: v.titulo.trim(), autor: v.autor.trim(), autorSec: v.autorSec.trim() || 'N/A',
                        categoria: v.categoria, ano: String(v.ano || ''), editora: v.editora.trim(), local: v.local.trim(), desc: v.desc.trim(), autorBR: v.autorBR || 'nao', profissao: v.profissao || 'nao', isbn: isbnLimpo(v.isbn), capa: v.capa || '' };
                    acervo.push(novo);
                    listaEtiquetas.unshift({ codigo: novo.codigo, selecionada: true });
                    renderAcervo(); renderEtiquetas(); renderCategorias();
                    abrirModalCustom({ titulo: 'Livro Cadastrado', icone: '', texto: `"${novo.titulo}" (${novo.codigo}) cadastrado! A etiqueta já foi adicionada.` });
                }
            });
        }
        function editarLivro(index) {
            setTimeout(ligarISBN, 0);
            const l = acervo[index];
            abrirModalCustom({
                titulo: 'Editar Livro', icone: '', texto: `Editando: "${l.titulo}" (${l.codigo})`,
                camposMultiplos: camposLivro(l), textoBtnConfirmar: 'Salvar alterações',
                onConfirm: (res) => {
                    const v = res.valores;
                    Object.assign(l, { titulo: v.titulo.trim(), autor: v.autor.trim(), autorSec: v.autorSec.trim() || 'N/A', ano: String(v.ano || ''),
                        editora: v.editora.trim(), local: v.local.trim(), desc: v.desc.trim(), autorBR: v.autorBR || 'nao', profissao: v.profissao || 'nao', isbn: isbnLimpo(v.isbn), capa: v.capa || '' });
                    renderAcervo(); renderEtiquetas();
                    abrirModalCustom({ titulo: 'Livro atualizado', icone: '', texto: 'Informações atualizadas com sucesso!' });
                }
            });
        }
        function gerarEtiquetaLivro(index) {
            const l = acervo[index];
            const ex = listaEtiquetas.find(e => e.codigo === l.codigo);
            if (ex) ex.selecionada = true; else listaEtiquetas.unshift({ codigo: l.codigo, selecionada: true });
            etqTab = 'livros'; renderEtiquetas();
            abrirModalCustom({ titulo: 'Etiqueta pronta', icone: '', texto: `A etiqueta de "${l.titulo}" foi adicionada e marcada no gerador de etiquetas.` });
        }

        // ---------- 5. Categorias (com contagem real de físicos e digitais) ----------
        function renderCategorias() {
            const tbody = $('table-categorias');
            if (!tbody) return;
            const dig = (CRUDS.digital ? CRUDS.digital.data : []);
            tbody.innerHTML = categorias.length ? categorias.map((cat, i) => `
                <tr><td><strong style="color:var(--theme-primary)">${escHtml(cat.prefixo)}</strong></td>
                <td>${escHtml(cat.nome)}</td>
                <td>${acervo.filter(a => a.categoria === cat.prefixo).length}</td>
                <td>${dig.filter(d => d.categoria === cat.prefixo).length}</td>
                <td><div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button class="btn-action btn-warning" onclick="editarCategoria(${i})">Editar</button>
                    <button class="btn-action btn-danger" onclick="excluirCategoria(${i})">Excluir</button></div></td></tr>`).join('')
                : '<tr><td colspan="5" style="text-align:center;color: var(--muted-ok, #526071)">Nenhuma categoria.</td></tr>';
        }
        function abrirModalNovaCategoria() {
            abrirModalCustom({
                titulo: 'Criar nova categoria', icone: '', texto: 'Informe o prefixo (3 letras) e o nome da categoria:',
                camposMultiplos: [
                    { id: 'prefixo', label: 'Prefixo (Ex: DIR):', obrigatorio: true },
                    { id: 'nome', label: 'Nome da categoria:', obrigatorio: true }
                ],
                textoBtnConfirmar: 'Salvar categoria',
                onConfirm: (res) => {
                    const prefixo = res.valores.prefixo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
                    const nome = res.valores.nome.trim();
                    if (!prefixo) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Prefixo inválido.' });
                    if (categorias.some(c => c.prefixo === prefixo)) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Já existe uma categoria com este prefixo.' });
                    categorias.push({ prefixo, nome, total: 0 });
                    delete etiquetasCats[prefixo];
                    renderCategorias(); renderAcervo(); renderEtiquetas();
                    abrirModalCustom({ titulo: 'Categoria criada', icone: '', texto: `Categoria "${prefixo} - ${nome}" cadastrada! A etiqueta dela já está disponível.` });
                }
            });
        }

        // ---------- 6. Etiquetas de livros e de categorias ----------
        let etqTab = 'livros';
        let etiquetasCats = lsGet('ciee_etiquetas_cats', {});      // prefixo -> { sel: bool, off: bool }
        const etqCat = p => etiquetasCats[p] || (etiquetasCats[p] = { sel: true, off: false });
        function etqSetTab(t) { etqTab = t; renderEtiquetas(); }
        function etiquetasDeCats() { return categorias.filter(c => !etqCat(c.prefixo).off); }

        function renderEtiquetas() {
            const a = $('print-area'), b = $('print-area-cats');
            if (!a || !b) return;
            document.querySelectorAll('.etq-tab').forEach(x => x.classList.toggle('active', x.dataset.t === etqTab));
            a.style.display = etqTab === 'livros' ? 'flex' : 'none';
            b.style.display = etqTab === 'cats' ? 'flex' : 'none';

            a.innerHTML = listaEtiquetas.length ? listaEtiquetas.map((e, i) => {
                const l = acervo.find(x => x.codigo === e.codigo);
                return `<div class="label-card ${e.selecionada ? 'selected' : ''}" onclick="toggleEtiquetaIndex(${i})">
                    <input type="checkbox" class="label-card-checkbox" ${e.selecionada ? 'checked' : ''} onclick="event.stopPropagation();toggleEtiquetaIndex(${i})">
                    <span>${escHtml(e.codigo)}</span><em class="lbl-title">${escHtml(l ? l.titulo : '')}</em><small>CIEESC ▶︎ PLAY</small></div>`;
            }).join('') : '<p class="vazio">Nenhuma etiqueta de livro. Cadastre livros ou use "Sincronizar".</p>';

            const cs = etiquetasDeCats();
            b.innerHTML = cs.length ? cs.map(c => {
                const s = etqCat(c.prefixo).sel;
                return `<div class="label-card ${s ? 'selected' : ''}" data-p="${escHtml(c.prefixo)}" onclick="toggleEtiquetaCat(this.dataset.p)">
                    <input type="checkbox" class="label-card-checkbox" ${s ? 'checked' : ''} onclick="event.stopPropagation();toggleEtiquetaCat(this.closest('.label-card').dataset.p)">
                    <span class="lbl-only-name">${escHtml(c.nome)}</span></div>`;
            }).join('') : '<p class="vazio">Nenhuma etiqueta de categoria.</p>';

            const tot = etqTab === 'livros' ? listaEtiquetas.length : cs.length;
            const sel = etqTab === 'livros' ? listaEtiquetas.filter(e => e.selecionada).length : cs.filter(c => etqCat(c.prefixo).sel).length;
            $('contador-etiquetas-selecionadas').innerText = `${sel} de ${tot} selecionada(s)`;
        }
        function toggleEtiquetaIndex(i) { listaEtiquetas[i].selecionada = !listaEtiquetas[i].selecionada; renderEtiquetas(); }
        function toggleEtiquetaCat(p) { etqCat(p).sel = !etqCat(p).sel; renderEtiquetas(); }
        function selecionarTodasEtiquetas(status) {
            if (etqTab === 'livros') listaEtiquetas.forEach(e => e.selecionada = status);
            else categorias.forEach(c => etqCat(c.prefixo).sel = status);
            renderEtiquetas();
        }
        function sincronizarEtiquetas() {
            if (etqTab === 'livros') {
                let n = 0;
                acervo.forEach(a => { if (!listaEtiquetas.some(e => e.codigo === a.codigo)) { listaEtiquetas.push({ codigo: a.codigo, selecionada: true }); n++; } });
                listaEtiquetas = listaEtiquetas.filter(e => acervo.some(a => a.codigo === e.codigo));
                renderEtiquetas();
                abrirModalCustom({ titulo: 'Sincronizado', icone: '', texto: `${n} etiqueta(s) criada(s). Etiquetas de livros inexistentes foram removidas.` });
            } else {
                categorias.forEach(c => { etqCat(c.prefixo).off = false; });
                renderEtiquetas();
                abrirModalCustom({ titulo: 'Sincronizado', icone: '', texto: 'Todas as categorias voltaram à lista de etiquetas.' });
            }
        }
        function excluirEtiquetasSelecionadas() {
            const n = etqTab === 'livros' ? listaEtiquetas.filter(e => e.selecionada).length : etiquetasDeCats().filter(c => etqCat(c.prefixo).sel).length;
            if (!n) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Selecione ao menos uma etiqueta para remover.' });
            abrirModalCustom({
                titulo: 'Remover etiquetas', icone: '', texto: `Remover ${n} etiqueta(s) da lista de impressão? (Os livros/categorias não são apagados.)`,
                textoBtnConfirmar: 'Remover',
                onConfirm: () => {
                    if (etqTab === 'livros') listaEtiquetas = listaEtiquetas.filter(e => !e.selecionada);
                    else categorias.forEach(c => { if (etqCat(c.prefixo).sel) etqCat(c.prefixo).off = true; });
                    renderEtiquetas();
                }
            });
        }
        function imprimirEtiquetasSelecionadas() {
            const alvo = $(etqTab === 'livros' ? 'print-area' : 'print-area-cats');
            if (!alvo.querySelector('.label-card.selected')) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Selecione ao menos uma etiqueta para imprimir.' });
            alvo.classList.add('print-target');
            window.print();
            setTimeout(() => alvo.classList.remove('print-target'), 500);
        }

        // ---------- 7. Motor genérico de cadastros (CRUD com busca e paginação de 10 itens) ----------
        const CRUDS = {};
        function defCrud(id, cfg) {
            cfg.id = id; cfg.page = 1; cfg.q = '';
            const salvo = localStorage.getItem(cfg.key);
            cfg.data = salvo ? lsGet(cfg.key, []) : JSON.parse(JSON.stringify(cfg.def || []));
            if (!salvo && sessionData && sessionData.nivel >= 2) lsSet(cfg.key, cfg.data, true);       // grava o padrão para o playing.html enxergar
            CRUDS[id] = cfg;
        }
        const opcoesFonte = [{ value: 'Link externo', label: 'Link externo' }, { value: 'Arquivo PDF', label: 'Arquivo PDF (upload)' }];
        const camposFonte = [
            { id: 'tipoFonte', label: 'Tipo de conteúdo:', tipo: 'select', opcoes: opcoesFonte, obrigatorio: true, onChange: 'crudToggleFonte()' },
            { id: 'url', label: 'Link (https://...):' },
            { id: 'arquivo', label: 'Arquivo PDF (até 2,5 MB):', tipo: 'file', accept: 'application/pdf' }
        ];
        const badgeFonte = it => it.tipoFonte === 'Arquivo PDF'
            ? `<span class="badge badge-red">PDF</span> <small>${escHtml(it.arquivoNome || 'arquivo')}</small>`
            : `<span class="badge badge-blue">Link</span> <small>${escHtml((it.url || '').slice(0, 40))}</small>`;

        defCrud('orientadores', {
            key: 'ciee_orientadores', titulo: 'Orientadores', novo: 'orientador', icone: '',
            intro: 'Aparecem para os aprendizes em <strong>Aprendizagem › Meu Orientador</strong>.',
            def: [{ _id: 'o1', nome: 'Fabrício Santos', cargo: 'Orientador(a)', cidade: 'Tubarão', email: '', fone: '' }, { _id: 'o2', nome: 'Sofia Mohammad', cargo: 'Orientador(a)', cidade: 'Tubarão', email: '', fone: '' }],
            campos: [{ id: 'nome', label: 'Nome completo:', obrigatorio: true }, 
                { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: opcoesCidades, obrigatorio: true }, { id: 'email', label: 'E-mail:', tipo: 'email' }, { id: 'fone', label: 'WhatsApp / telefone:' }],
            cols: [{ t: 'Nome', k: 'nome' }, { t: 'Cidade', k: 'cidade' }, { t: 'E-mail', k: 'email' }, { t: 'Contato', k: 'fone' }], busca: ['nome', 'cidade', 'email']
        });
        defCrud('monitores', {
            key: 'ciee_monitores', titulo: 'Monitores', novo: 'monitor', icone: '',
            intro: 'Aparecem para os aprendizes em <strong>Aprendizagem › Monitoria</strong>.',
            def: [{ _id: 'm1', nome: 'Lucas Gabriel', cargo: 'Monitor(a)', cidade: 'Tubarão', email: '', fone: '' }, { _id: 'm2', nome: 'Ana Beatriz', cargo: 'Monitor(a)', cidade: 'Imbituba', email: '', fone: '' }],
            campos: [{ id: 'nome', label: 'Nome completo:', obrigatorio: true }, 
                { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: opcoesCidades, obrigatorio: true }, { id: 'email', label: 'E-mail:', tipo: 'email' }, { id: 'fone', label: 'WhatsApp / telefone:' }],
            cols: [{ t: 'Nome', k: 'nome' }, { t: 'Cidade', k: 'cidade' }, { t: 'E-mail', k: 'email' }, { t: 'Contato', k: 'fone' }], busca: ['nome', 'cidade', 'email']
        });
        defCrud('representantes', {
            key: 'ciee_representantes', titulo: 'Representantes de turma', novo: 'representante', icone: '',
            intro: 'Aparecem para os aprendizes em <strong>Aprendizagem › Monitoria</strong>, junto dos monitores.',
            def: [],
            campos: [{ id: 'nome', label: 'Nome completo:', obrigatorio: true }, { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: opcoesCidades, obrigatorio: true, onChange: 'filtrarTurmasRep()' },
                { id: 'turma', label: 'Turma:', tipo: 'select', opcoes: () => turmas.map(t => ({ value: t.diaPeriodo + ' (' + t.codId + ')', label: t.diaPeriodo + ' (' + t.codId + ')' })), obrigatorio: true }, { id: 'email', label: 'E-mail:', tipo: 'email' }, { id: 'fone', label: 'WhatsApp / telefone:' }],
            cols: [{ t: 'Nome', k: 'nome' }, { t: 'Turma', k: 'turma' }, { t: 'Cidade', k: 'cidade' }, { t: 'E-mail', k: 'email' }, { t: 'Contato', k: 'fone' }], busca: ['nome', 'turma', 'cidade', 'email']
        });
        defCrud('adm', {
            key: 'ciee_administrativo', titulo: 'Administrativo CIEESC', novo: 'contato', icone: '',
            intro: 'Aparecem para os aprendizes em <strong>Equipe Adm</strong>.',
            def: [{ _id: 'a1', setor: 'Coordenação', nome: 'Sylvia Figueiredo', email: 'sylvia.figueiredo@cieesc.org.br', fone: '' }, { _id: 'a2', setor: 'Assistência Social', nome: 'Juliana Honorato', email: 'juliana.honorato@cieesc.org.br', fone: '' }],
            campos: [{ id: 'setor', label: 'Setor:', obrigatorio: true }, { id: 'nome', label: 'Responsável:', obrigatorio: true }, { id: 'email', label: 'E-mail:', tipo: 'email', obrigatorio: true }, { id: 'fone', label: 'Telefone (opcional):' }],
            cols: [{ t: 'Setor', k: 'setor' }, { t: 'Responsável', k: 'nome' }, { t: 'E-mail', k: 'email' }, { t: 'Telefone', k: 'fone' }], busca: ['setor', 'nome', 'email']
        });
        defCrud('menuacervo', {
            key: 'ciee_menu_acervo', titulo: 'Menu Acervo (links do PLAY)', novo: 'link do menu', icone: '',
            intro: 'Links exibidos no menu <strong>Acervo</strong> do PLAY, depois de “Acervo físico” e “Acervo digital”.',
            def: [{ _id: 'ma1', titulo: 'MEC livros', link: 'https://meclivros.mec.gov.br/' }, { _id: 'ma2', titulo: 'Baixe livros', link: 'https://www.baixelivros.com.br/' }],
            campos: [{ id: 'titulo', label: 'Nome do item no menu:', obrigatorio: true }, { id: 'link', label: 'Link (https://...):', obrigatorio: true }],
            cols: [{ t: 'Item', f: it => `<strong>${escHtml(it.titulo)}</strong>` }, { t: 'Link', f: it => `<a href="${escHtml(it.link)}" target="_blank" rel="noopener">${escHtml((it.link || '').slice(0, 50))}</a>` }],
            busca: ['titulo', 'link'], validar: it => !/^https?:\/\//i.test(it.link || '') ? 'O link deve começar com http:// ou https://' : ''
        });
        defCrud('mural', {
            key: 'ciee_mural', titulo: 'Mural — recados e dicas', novo: 'postagem', icone: '',
            intro: 'Postagens exibidas no <strong>Mural</strong> do PLAY. Fixe as mais importantes e defina uma data para sair do ar.',
            def: [{ _id: 'mu1', tipo: 'Dica', titulo: 'Como organizar seus estudos', texto: 'Separe 30 minutos diários para revisar os manuais de aprendizagem. A constância é a chave!', fixado: 'Não', ate: '', autor: 'Monitoria', criadoEm: 1 },
                { _id: 'mu2', tipo: 'Notícia', titulo: 'Nova parceria CIEE', texto: 'Estamos com novos cursos disponíveis na plataforma online. Não perca!', fixado: 'Não', ate: '', autor: 'Coordenação', criadoEm: 2 }],
            campos: [{ id: 'tipo', label: 'Tipo:', tipo: 'select', opcoes: ['Recado', 'Dica', 'Notícia', 'Aviso', 'Evento'].map(v => ({ value: v, label: v })), obrigatorio: true },
                { id: 'titulo', label: 'Título:', obrigatorio: true }, { id: 'texto', label: 'Mensagem:', tipo: 'textarea', obrigatorio: true },
                { id: 'fixado', label: 'Fixar no topo?', tipo: 'select', opcoes: [{ value: 'Não', label: 'Não' }, { value: 'Sim', label: 'Sim, fixar' }] },
                { id: 'ate', label: 'Exibir até (opcional):', tipo: 'date' }],
            cols: [{ t: 'Tipo', f: it => `<span class="badge badge-blue">${escHtml(it.tipo)}</span>` }, { t: 'Título', f: it => `<strong>${escHtml(it.titulo)}</strong><br><small>${escHtml((it.texto || '').slice(0, 70))}</small>` },
                { t: 'Autor', k: 'autor' }, { t: 'Publicado', f: it => it.criadoEm > 1e6 ? new Date(it.criadoEm).toLocaleDateString('pt-BR') : '-' },
                { t: 'Fixado', f: it => it.fixado === 'Sim' ? 'Sim' : '—' }, { t: 'Até', f: it => fmtBR(it.ate) }],
            busca: ['titulo', 'texto', 'tipo', 'autor'], ordem: (a, b) => (b.fixado === 'Sim') - (a.fixado === 'Sim') || (b.criadoEm || 0) - (a.criadoEm || 0)
        });
        defCrud('calendario', {
            key: 'ciee_calendario', titulo: 'Calendário', novo: 'evento', icone: '',
            intro: 'Eventos exibidos no calendário do portal (<strong>Aprendizagem › Calendário</strong>), com as cores do tema. Cada aprendiz vê os eventos gerais e os da sua cidade.',
            def: [{ _id: 'c1', titulo: 'Comunicação Assertiva', categoria: 'Oficina Presencial', data: '2026-10-10', hi: '13:30', hf: '17:30', local: '', desc: '' }],
            campos: [{ id: 'titulo', label: 'Título:', obrigatorio: true },
                { id: 'categoria', label: 'Categoria:', tipo: 'select', opcoes: ['Oficina Presencial', 'Oficina Online', 'Atividade', 'Prova / Avaliação', 'Feriado', 'Evento', 'Outro'].map(v => ({ value: v, label: v })), obrigatorio: true },
                { id: 'data', label: 'Data:', tipo: 'date', obrigatorio: true }, { id: 'dataFim', label: 'Termina em (opcional, para eventos de vários dias):', tipo: 'date' },
                { id: 'hi', label: 'Horário de início:', tipo: 'time' }, { id: 'hf', label: 'Horário de término:', tipo: 'time' },
                { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: () => [{ value: 'Todas', label: 'Todas as cidades' }].concat((typeof opcoesCidades === 'function' ? opcoesCidades() : []).filter(o => o.value !== 'Todas')) },
                { id: 'local', label: 'Local (opcional):' }, { id: 'desc', label: 'Descrição (opcional):', tipo: 'textarea' }],
            cols: [{ t: 'Data', f: it => fmtBR(it.data) + (it.dataFim && it.dataFim > it.data ? ' a ' + fmtBR(it.dataFim) : '') }, { t: 'Cidade', f: it => escHtml(it.cidade || 'Todas') }, { t: 'Horário', f: it => it.hi ? `${escHtml(it.hi)}${it.hf ? ' às ' + escHtml(it.hf) : ''}` : 'Dia todo' }, { t: 'Título', k: 'titulo' }, { t: 'Categoria', f: it => `<span class="badge badge-yellow">${escHtml(it.categoria)}</span>` }, { t: 'Local', k: 'local' }],
            busca: ['titulo', 'categoria', 'local'], ordem: (a, b) => String(a.data).localeCompare(String(b.data))
        });
        defCrud('artes', {
            key: 'ciee_artes', titulo: 'Artes em foco', novo: 'card de arte', icone: '',
            intro: 'Cards exibidos na página <strong>Artes em Foco</strong> (inclui os antigos links de “Foco na arte”). O botão abre o link informado.',
            def: [{ _id: 'ar1', titulo: 'Galeria Virtual', desc: 'Uma prévia das exposições online que nossos jovens acompanham.', btn: 'Acessar Prévia', link: '', imagem: '' },
                { _id: 'ar2', titulo: 'Concurso de Desenhos', desc: 'Veja as artes vencedoras deste semestre.', btn: 'Ver Galeria', link: '', imagem: '' }, { _id: 'ar3', titulo: 'Museu do Louvre', desc: 'Tour virtual pelas galerias do Louvre.', btn: 'Visitar', link: 'https://www.louvre.fr/en/online-tours', imagem: '' }, { _id: 'ar4', titulo: 'Tarsila do Amaral', desc: 'Vida e obra de Tarsila do Amaral.', btn: 'Visitar', link: 'https://www.tarsiladoamaral.com.br/', imagem: '' }, { _id: 'ar5', titulo: 'Democrart', desc: 'Plataforma de democratização da arte.', btn: 'Visitar', link: 'https://www.democrart.com.br/', imagem: '' }, { _id: 'ar6', titulo: 'Brics Arts', desc: 'Plataforma de arte dos países BRICS.', btn: 'Visitar', link: 'https://bricsarts.com/', imagem: '' }, { _id: 'ar7', titulo: 'Brics Art Games', desc: 'Jogos e arte do BRICS.', btn: 'Visitar', link: 'https://bricsartgames.ru/en/', imagem: '' }],
            campos: [{ id: 'titulo', label: 'Título:', obrigatorio: true }, { id: 'desc', label: 'Descrição:', tipo: 'textarea', obrigatorio: true },
                { id: 'btn', label: 'Texto do botão:', obrigatorio: true }, { id: 'link', label: 'Link de destino (https://...):' }, { id: 'imagem', label: 'Imagem (opcional):', tipo: 'file' }],
            cols: [{ t: 'Imagem', f: it => it.imagem ? `<img src="${escHtml(imgOk(it.imagem))}" class="thumb">` : '—' }, { t: 'Título', f: it => `<strong>${escHtml(it.titulo)}</strong><br><small>${escHtml((it.desc || '').slice(0, 60))}</small>` }, { t: 'Botão', k: 'btn' }, { t: 'Link', f: it => it.link ? `<a href="${escHtml(it.link)}" target="_blank" rel="noopener">abrir</a>` : '—' }],
            busca: ['titulo', 'desc', 'btn'], arquivoCampo: 'imagem',
            validar: it => it.link && !/^https?:\/\//i.test(it.link) ? 'O link deve começar com http:// ou https://' : ''
        });
        defCrud('faq', {
            key: 'ciee_faq', titulo: 'Dúvidas frequentes (FAQ)', novo: 'pergunta', icone: '',
            intro: 'Perguntas e respostas exibidas em <strong>Aprendizagem › Dúvidas Frequentes</strong>, na ordem numérica.',
            def: [{ _id: 'f1', pergunta: 'Como funciona a renovação do acervo digital?', resposta: 'Você tem 30 dias de empréstimo. O botão de renovar aparecerá 7 dias antes do vencimento. Pode ser renovado múltiplas vezes!', ordem: 1 }],
            campos: [{ id: 'ordem', label: 'Ordem de exibição:', tipo: 'number', valorInicial: 1, obrigatorio: true }, { id: 'pergunta', label: 'Pergunta:', obrigatorio: true }, { id: 'resposta', label: 'Resposta:', tipo: 'textarea', obrigatorio: true }],
            cols: [{ t: '#', k: 'ordem' }, { t: 'Pergunta', f: it => `<strong>${escHtml(it.pergunta)}</strong>` }, { t: 'Resposta', f: it => escHtml((it.resposta || '').slice(0, 90)) + ((it.resposta || '').length > 90 ? '…' : '') }],
            busca: ['pergunta', 'resposta'], ordem: (a, b) => (a.ordem || 0) - (b.ordem || 0)
        });
        defCrud('guias', {
            key: 'ciee_guias', titulo: 'Guias e manuais', novo: 'guia / manual', icone: '', mount: 'guias-mount',
            intro: 'Materiais disponíveis em <strong>Aprendizagem › Guias e Manuais</strong>. Envie um PDF ou informe um link externo.',
            def: [{ _id: 'g1', titulo: 'Manual do jovem aprendiz', desc: '', tipoFonte: 'Link externo', url: '', arquivo: '' }, { _id: 'g2', titulo: 'Código de Conduta', desc: '', tipoFonte: 'Link externo', url: '', arquivo: '' }],
            campos: [{ id: 'titulo', label: 'Título:', obrigatorio: true }, { id: 'desc', label: 'Descrição (opcional):', tipo: 'textarea' }, ...camposFonte],
            cols: [{ t: 'Título', f: it => `<strong>${escHtml(it.titulo)}</strong><br><small>${escHtml(it.desc || '')}</small>` }, { t: 'Conteúdo', f: badgeFonte }],
            busca: ['titulo', 'desc'], fonte: true, arquivoCampo: 'arquivo'
        });
        defCrud('digital', {
            key: 'ciee_livros_digitais', titulo: 'Livros digitais (PDF e links externos)', novo: 'livro digital', icone: '', mount: 'digital-mount',
            intro: 'Exibidos em <strong>Acervo › Acervo Digital</strong> para leitura online ou download.',
            def: [],
            campos: [{ id: 'titulo', label: 'Título:', obrigatorio: true }, { id: 'autor', label: 'Autor(a):', obrigatorio: true },
                { id: 'categoria', label: 'Categoria:', tipo: 'select', opcoes: () => categorias.map(c => ({ value: c.prefixo, label: `${c.prefixo} - ${c.nome}` })), obrigatorio: true },
                { id: 'capa', label: 'Imagem da capa (opcional):', tipo: 'imagem' }, { id: 'desc', label: 'Sinopse (opcional):', tipo: 'textarea' }, ...camposFonte],
            cols: [{ t: 'Título', f: it => `${it.capa ? `<img class="thumb-capa" src="${escHtml(imgOk(it.capa))}" alt="">` : ''}<strong>${escHtml(it.titulo)}</strong><br><small>${escHtml(it.autor)}</small>` }, { t: 'Categoria', f: it => `<span class="badge badge-blue">${escHtml(it.categoria)}</span>` }, { t: 'Conteúdo', f: badgeFonte }],
            busca: ['titulo', 'autor', 'categoria'], fonte: true, arquivoCampo: 'arquivo',
            filtro: { k: 'categoria', label: 'Todas as categorias', opcoes: () => categorias.map(c => ({ value: c.prefixo, label: c.prefixo })) },
            vazio: 'Nenhum livro digital cadastrado.', aposSalvar: () => renderCategorias()
        });

        const crudNovo = c => ['postagem', 'pergunta'].includes(c.novo) ? 'Nova' : 'Novo';   // concordância: Nova postagem, Nova pergunta
        function crudBuild(id) {
            const c = CRUDS[id];
            const botao = `<button class="btn-action btn-success" onclick="crudNew('${id}')">${crudNovo(c)} ${c.novo}</button>`;
            const head = c.mount ? `<div class="sub-head"><h3>${c.titulo}</h3>${botao}</div>` : `<div class="section-header"><h2>${c.titulo}</h2>${botao}</div>`;
            const filtro = c.filtro ? `<select id="crud-filter-${id}" class="search-input" style="flex:0 0 200px" onchange="crudSearch('${id}')"></select>` : '';
            const html = `${head}${c.intro ? `<p class="sec-intro">${c.intro}</p>` : ''}
                <div class="search-bar-container">${filtro}<input id="crud-search-${id}" class="search-input" placeholder="Buscar..." oninput="crudSearch('${id}')"></div>
                <div class="table-responsive"><table class="admin-table"><thead><tr>${c.cols.map(x => `<th>${x.t}</th>`).join('')}<th>Ações</th></tr></thead><tbody id="crud-body-${id}"></tbody></table></div>
                <div class="pagination-bar"><span id="crud-info-${id}">Página 1 de 1</span><div class="pagination-controls">
                    <button class="btn-action btn-primary" id="crud-prev-${id}" onclick="crudPage('${id}',-1)">Anterior</button>
                    <button class="btn-action btn-primary" id="crud-next-${id}" onclick="crudPage('${id}',1)">Próxima</button></div></div>`;
            if (c.mount) $(c.mount).innerHTML = html;
            else { const s = document.createElement('section'); s.id = 'admin-' + id; s.className = 'admin-section'; s.innerHTML = html; $('dyn-sections').appendChild(s); }
        }
        function crudRender(id) {
            const c = CRUDS[id], body = $('crud-body-' + id);
            if (!body) return;
            if (c.filtro) {
                const sel = $('crud-filter-' + id), atual = sel.value;
                sel.innerHTML = `<option value="">${escHtml(c.filtro.label)}</option>` + c.filtro.opcoes().map(o => `<option value="${escHtml(o.value)}">${escHtml(o.label)}</option>`).join('');
                sel.value = atual;
            }
            const q = c.q.toLowerCase(), fv = c.filtro ? $('crud-filter-' + id).value : '';
            let lista = c.data.map((it, i) => ({ it, i })).filter(({ it }) =>
                (!q || (c.busca || []).some(k => String(it[k] ?? '').toLowerCase().includes(q))) && (!fv || it[c.filtro.k] === fv));
            if (c.ordem) lista.sort((a, b) => c.ordem(a.it, b.it));
            const paginas = Math.ceil(lista.length / 10) || 1;
            if (c.page > paginas) c.page = paginas;
            const fatia = lista.slice((c.page - 1) * 10, c.page * 10);
            body.innerHTML = fatia.length ? fatia.map(({ it, i }) => `<tr>${c.cols.map(x => `<td>${x.f ? x.f(it) : escHtml(it[x.k])}</td>`).join('')}
                <td><div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn-action btn-warning" onclick="crudEdit('${id}',${i})">Editar</button>
                <button class="btn-action btn-danger" onclick="crudDel('${id}',${i})">Excluir</button></div></td></tr>`).join('')
                : `<tr><td colspan="${c.cols.length + 1}" style="text-align:center;color: var(--muted-ok, #526071)">${c.vazio || 'Nenhum registro.'}</td></tr>`;
            $('crud-info-' + id).innerText = `Página ${c.page} de ${paginas} • ${lista.length} registro(s)`;
            $('crud-prev-' + id).disabled = c.page === 1;
            $('crud-next-' + id).disabled = c.page === paginas;
        }
        function crudSearch(id) { const c = CRUDS[id]; c.q = $('crud-search-' + id).value; c.page = 1; crudRender(id); }
        function crudPage(id, d) { CRUDS[id].page += d; crudRender(id); }
        function crudSave(id) { return lsSet(CRUDS[id].key, CRUDS[id].data); }
        function crudCampos(c, it) {
            return c.campos.map(f => ({ ...f, opcoes: typeof f.opcoes === 'function' ? f.opcoes() : f.opcoes, valorInicial: it ? it[f.id] : f.valorInicial }));
        }
        function crudToggleFonte() {
            const t = $('modal_field_tipoFonte'); if (!t) return;
            const pdf = t.value === 'Arquivo PDF';
            const u = $('modal_field_url'), a = $('modal_field_arquivo');
            if (u) u.parentElement.style.display = pdf ? 'none' : 'block';
            if (a) a.parentElement.style.display = pdf ? 'block' : 'none';
        }
        function crudNew(id) {
            if (id === 'representantes') setTimeout(filtrarTurmasRep, 0);
            const c = CRUDS[id]; tempImageBase64 = ''; tempFileName = '';
            abrirModalCustom({ titulo: crudNovo(c) + ' ' + c.novo, icone: c.icone || '', texto: 'Preencha as informações:', camposMultiplos: crudCampos(c, null),
                textoBtnConfirmar: 'Salvar', onConfirm: res => crudSalvar(id, null, res.valores) });
            if (c.fonte) setTimeout(crudToggleFonte, 30);
        }
        // representantes: a lista de turmas acompanha a cidade escolhida (turmas cadastradas em Cidades e turmas)
        function filtrarTurmasRep() {
            const c = document.getElementById('modal_field_cidade'), t = document.getElementById('modal_field_turma'); if (!c || !t) return;
            const atual = t.value, lista = turmas.filter(x => x.cidade === c.value).map(x => x.diaPeriodo + ' (' + x.codId + ')');
            t.innerHTML = lista.length ? lista.map(v => `<option value="${escHtml(v)}">${escHtml(v)}</option>`).join('') : '<option value="">Nenhuma turma cadastrada nesta cidade</option>';
            if (lista.includes(atual)) t.value = atual;
        }
        function crudEdit(id, i) {
            if (id === 'representantes') setTimeout(filtrarTurmasRep, 0);
            const c = CRUDS[id], it = c.data[i];
            tempImageBase64 = c.arquivoCampo ? (it[c.arquivoCampo] || '') : ''; tempFileName = it.arquivoNome || '';
            abrirModalCustom({ titulo: 'Editar ' + c.novo, icone: '', texto: 'Altere as informações e salve:', camposMultiplos: crudCampos(c, it),
                textoBtnConfirmar: 'Salvar alterações', onConfirm: res => crudSalvar(id, i, res.valores) });
            if (c.fonte) setTimeout(crudToggleFonte, 30);
        }
        function crudSalvar(id, i, v) {
            const c = CRUDS[id];
            const it = i == null ? { _id: uid(), criadoEm: Date.now(), autorPost: sessionData.nome } : c.data[i];
            const copia = JSON.parse(JSON.stringify(it));
            c.campos.forEach(f => { if (f.tipo !== 'file') it[f.id] = typeof v[f.id] === 'string' ? v[f.id].trim() : v[f.id]; });
            if (id === 'mural' && i == null) it.autor = sessionData.nome;
            if (c.arquivoCampo) {
                const pdf = !c.fonte || it.tipoFonte === 'Arquivo PDF';
                it[c.arquivoCampo] = pdf ? (tempImageBase64 || '') : '';
                it.arquivoNome = pdf ? (tempFileName || it.arquivoNome || '') : '';
            }
            const erro = (() => {
                if (c.fonte) {
                    if (it.tipoFonte === 'Link externo') { if (!/^https?:\/\//i.test(it.url || '')) return 'Informe um link válido começando com http:// ou https://'; }
                    else { it.url = ''; if (!it.arquivo) return 'Selecione o arquivo PDF (até 2,5 MB).'; }
                }
                return c.validar ? c.validar(it, v, i) : '';
            })();
            if (erro) { if (i != null) Object.assign(it, copia); return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: erro }); }
            if (i == null) c.data.unshift(it);
            if (!crudSave(id)) { if (i == null) c.data.shift(); else Object.assign(it, copia); return; }
            crudRender(id);
            if (c.aposSalvar) c.aposSalvar();
            abrirModalCustom({ titulo: 'Salvo', icone: '', texto: 'Registro salvo com sucesso!' });
        }
        function crudDel(id, i) {
            const c = CRUDS[id], it = c.data[i];
            const nome = it.titulo || it.nome || it.pergunta || it.setor || 'registro';
            solicitarOuExcluir(`crud:${id}:${c.novo}`, nome, it._id, () => {
                c.data.splice(i, 1); crudSave(id); crudRender(id); if (c.aposSalvar) c.aposSalvar();
            });
        }

        // ---------- 8. Wi-fi ----------
        const WIFI_PADRAO = { titulo: 'Conecta Wi-Fi CIEE', ssid: 'CIEE Alunos', senha: 'ciee#aprendizagem2023', tipo: 'WPA', texto: 'Aponte a câmera do seu celular para o QR Code abaixo para se conectar automaticamente:' };
        const wifiQrEsc = s => String(s).replace(/([\\;,:"])/g, '\\$1');
        const wifiQrUrl = w => (t => { try { const q = qrcode(0, 'M'); q.addData(t); q.make(); return q.createDataURL(5, 8); } catch (e) { return ''; } })(`WIFI:S:${wifiQrEsc(w.ssid)};T:${w.tipo};P:${wifiQrEsc(w.senha)};;`);   // gerado no aparelho
        function wifiCarregar() {
            const w = lsGet('ciee_wifi', WIFI_PADRAO);
            $('wifi-titulo').value = w.titulo; $('wifi-ssid').value = w.ssid; $('wifi-senha').value = w.senha; $('wifi-tipo').value = w.tipo; $('wifi-texto').value = w.texto;
            wifiPrevia();
        }
        function wifiAtual() { return { titulo: $('wifi-titulo').value.trim(), ssid: $('wifi-ssid').value.trim(), senha: $('wifi-senha').value, tipo: $('wifi-tipo').value, texto: $('wifi-texto').value.trim() }; }
        function wifiPrevia() {
            const w = wifiAtual();
            $('wifi-prev-titulo').innerText = w.titulo; $('wifi-prev-texto').innerText = w.texto; $('wifi-prev-rede').innerText = w.ssid;
            $('wifi-prev-qr').src = w.ssid ? wifiQrUrl(w) : '';
        }
        function wifiSalvar() {
            const w = wifiAtual();
            if (!w.titulo || !w.ssid) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Informe o título e o nome da rede.' });
            if (w.tipo !== 'nopass' && !w.senha) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Informe a senha da rede.' });
            if (lsSet('ciee_wifi', w)) abrirModalCustom({ titulo: 'Wi-fi atualizado', icone: '', texto: 'As informações já aparecem no PLAY.' });
        }
        function wifiRestaurar() { lsSet('ciee_wifi', WIFI_PADRAO); wifiCarregar(); }

        // ---------- 9. Cidades ----------
        function renderCidades() {
            const b = $('table-cidades'); if (!b) return;
            b.innerHTML = cidadesList.map((c, i) => `<tr><td><strong>${escHtml(c)}</strong></td><td>${turmas.filter(t => t.cidade === c).length}</td>
                <td>${lsGet('ciee_users', []).filter(u => u.cidade === c).length}</td>
                <td><div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn-action btn-warning" onclick="editarCidade(${i})">Renomear</button>
                <button class="btn-action btn-danger" onclick="excluirCidade(${i})">Excluir</button></div></td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color: var(--muted-ok, #526071)">Nenhuma cidade.</td></tr>';
        }
        function novaCidade() {
            abrirModalCustom({ titulo: 'Nova cidade', icone: '', texto: 'Ela aparecerá no cadastro dos aprendizes e nas turmas:', camposMultiplos: [{ id: 'nome', label: 'Nome da cidade:', obrigatorio: true }],
                textoBtnConfirmar: 'Adicionar', onConfirm: res => {
                    const n = formatName(res.valores.nome);
                    if (cidadesList.some(c => c.toLowerCase() === n.toLowerCase())) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Esta cidade já existe.' });
                    cidadesList.push(n); persistirTudo(); renderCidades();
                } });
        }
        function editarCidade(i) {
            const antigo = cidadesList[i];
            abrirModalCustom({ titulo: 'Renomear cidade', icone: '', texto: 'Turmas e cadastros dessa cidade serão atualizados:', camposMultiplos: [{ id: 'nome', label: 'Nome da cidade:', valorInicial: antigo, obrigatorio: true }],
                textoBtnConfirmar: 'Salvar', onConfirm: res => {
                    const n = formatName(res.valores.nome);
                    if (n !== antigo && cidadesList.some(c => c.toLowerCase() === n.toLowerCase())) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Esta cidade já existe.' });
                    cidadesList[i] = n; turmas.forEach(t => { if (t.cidade === antigo) t.cidade = n; });
                    const us = lsGet('ciee_users', []); us.forEach(u => { if (u.cidade === antigo) u.cidade = n; }); lsSet('ciee_users', us, true);
                    ['orientadores', 'monitores'].forEach(k => { CRUDS[k].data.forEach(p => { if (p.cidade === antigo) p.cidade = n; }); crudSave(k); });
                    persistirTudo(); renderCidades(); renderTurmas();
                } });
        }
        function excluirCidade(i) {
            const c = cidadesList[i];
            if (turmas.some(t => t.cidade === c)) return abrirModalCustom({ titulo: 'Não é possível excluir', icone: '', texto: 'Existem turmas nesta cidade. Remova ou mude as turmas primeiro.' });
            solicitarOuExcluir('Cidade', c, i, () => { cidadesList.splice(i, 1); persistirTudo(); renderCidades(); });
        }

        // ---------- 10. Histórico Geral (solicitações, empréstimos e exclusões) ----------
        let filtroHistTipo = '';
        function tipoHist(h) {
            const a = (h.acao || '').toLowerCase();
            if (a.includes('selo')) return 'Selos';
            if (a.includes('exclus')) return 'Exclusões';
            if (a.includes('devol') || a.includes('renov') || a.includes('empr')) return 'Empréstimos';
            return 'Solicitações';
        }
        function renderHistorico() {
            const tbody = $('table-historico'); if (!tbody) return;
            const q = searchHistoricoText.toLowerCase();
            const filtrados = historicoDecisoes.filter(h => (!filtroHistTipo || tipoHist(h) === filtroHistTipo) &&
                [h.aprendiz, h.motivo, h.responsavel, h.acao].some(x => String(x || '').toLowerCase().includes(q)));
            const paginas = Math.ceil(filtrados.length / 10) || 1;
            if (pageHistorico > paginas) pageHistorico = paginas;
            const fatia = filtrados.slice((pageHistorico - 1) * 10, pageHistorico * 10);
            tbody.innerHTML = fatia.length ? fatia.map(h => {
                const bom = /aprov|aceit|devol|renov|concedid/i.test(h.acao);
                return `<tr><td><small>${escHtml(h.data)}</small></td><td><span class="badge badge-blue">${tipoHist(h)}</span></td><td><strong>${escHtml(h.responsavel)}</strong></td>
                    <td>${escHtml(h.aprendiz)}</td><td><span class="badge ${bom ? 'badge-green' : 'badge-red'}">${escHtml(h.acao)}</span></td><td>${escHtml(h.motivo)}</td></tr>`;
            }).join('') : '<tr><td colspan="6" style="text-align:center;color: var(--muted-ok, #526071)">Nenhum registro encontrado.</td></tr>';
            $('page-info-historico').innerText = `Página ${pageHistorico} de ${paginas} • ${filtrados.length} registro(s)`;
            $('btn-prev-historico').disabled = pageHistorico === 1;
            $('btn-next-historico').disabled = pageHistorico === paginas;
        }
        function filtrarHistorico() {
            searchHistoricoText = $('search-historico').value; filtroHistTipo = $('filtro-historico-tipo').value;
            pageHistorico = 1; renderHistorico();
        }

        // ---------- 11. Gestão da equipe › Aprendizes ----------
        let pageLogins = 1, searchLogins = '';
        const getUsuarios = () => lsGet('ciee_users', []);
        const validadeStatus = v => !v ? '<span class="badge badge-yellow">Sem data</span>' : (new Date(v + 'T23:59:59') < new Date() ? '<span class="badge badge-red">Vencida</span>' : '<span class="badge badge-green">Vigente</span>');
        function renderLogins() {
            const b = $('table-logins'); if (!b) return;
            const us = getUsuarios(), ips = lsGet('ciee_ips', {});
            const q = searchLogins.toLowerCase().trim();
            const lista = us.map((u, i) => ({ u, i })).filter(({ u }) => !q || [u.nome, u.email, u.whats].some(x => String(x || '').toLowerCase().includes(q)) || nd(u.whats).includes(nd(q) || '§'));
            const paginas = Math.ceil(lista.length / 10) || 1;
            if (pageLogins > paginas) pageLogins = paginas;
            const fatia = lista.slice((pageLogins - 1) * 10, pageLogins * 10);
            b.innerHTML = fatia.length ? fatia.map(({ u, i }) => {
                const ip = ips[String(u.email || '').toLowerCase()];
                return `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px">${u.foto ? `<img src="${escHtml(imgOk(u.foto))}" class="thumb round">` : `<span class="thumb round ph ini-ava">${iniciais(u.nome)}</span>`}<div><strong>${escHtml(u.nome)}</strong><br><small>${escHtml(u.cidade || '')} • ${escHtml(u.periodo || '')}${u.turmaId ? ' • ID ' + escHtml(u.turmaId) : ''}</small></div></div></td>
                    <td>${escHtml(u.email)}</td><td>${escHtml(u.whats)}</td>
                    <td>${fmtBR(u.validade)} ${validadeStatus(u.validade)}</td>
                    <td>${ip ? `<code>${escHtml(ip.ip)}</code><br><small>${new Date(ip.ts).toLocaleString('pt-BR')}</small>` : '<small>—</small>'}</td>
                    <td><div style="display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn-action btn-warning" onclick="editarLogin(${i})">Editar</button>
                        <button class="btn-action btn-primary" onclick="editarDadosLogin(${i})">Foto e contato</button>
                        <button class="btn-action btn-primary" onclick="trocarSenhaLogin(${i})">Senha</button>
                        <button class="btn-action btn-success" onclick="alterarValidadeLogin(${i})">Validade</button>
                        <button class="btn-action btn-danger" onclick="excluirLogin(${i})">Excluir</button></div></td></tr>`;
            }).join('') : '<tr><td colspan="6" style="text-align:center;color: var(--muted-ok, #526071)">Nenhum usuário encontrado.</td></tr>';
            $('page-info-logins').innerText = `Página ${pageLogins} de ${paginas} • ${lista.length} usuário(s)`;
            $('btn-prev-logins').disabled = pageLogins === 1;
            $('btn-next-logins').disabled = pageLogins === paginas;
        }
        function filtrarLogins() { searchLogins = $('search-logins').value; pageLogins = 1; renderLogins(); }
        function mudarPaginaLogins(d) { pageLogins += d; renderLogins(); }
        const somaAnos = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setFullYear(x.getFullYear() + n); return x.toISOString().slice(0, 10); };
        // ----- turma do aprendiz: escolhida entre as turmas cadastradas na cidade (dia/período e ID vêm do cadastro) -----
        const rotuloTurma = t => `${t.diaPeriodo} (${t.codId})`;
        function turmaAtualLogin(u) {                           // valor da turma do aprendiz: ID cadastrado, ou a turma da cidade que tem o mesmo dia/período
            if (!u) return '';
            if (u.turmaId) return u.turmaId;
            const t = turmas.find(x => x.cidade === u.cidade && x.diaPeriodo === u.periodo);
            return t ? t.codId : (u.periodo ? 'antigo:' + u.periodo : '');
        }
        function opcoesTurmasLogin(cidade, u) {
            const lista = turmas.filter(t => t.cidade === cidade).map(t => ({ value: t.codId, label: rotuloTurma(t) }));
            if (u && u.periodo && !lista.some(o => o.value === turmaAtualLogin(u)) && u.cidade === cidade) lista.unshift({ value: 'antigo:' + u.periodo, label: u.periodo + ' (sem ID — escolha uma turma cadastrada)' });
            return lista.length ? lista : [{ value: '', label: 'Nenhuma turma cadastrada nesta cidade' }];
        }
        function filtrarTurmasLogin() {
            const c = $('modal_field_cidade'), t = $('modal_field_turma'); if (!c || !t) return;
            const ops = opcoesTurmasLogin(c.value, window._loginEditando || null);
            t.innerHTML = ops.map(o => `<option value="${escHtml(o.value)}">${escHtml(o.label)}</option>`).join('');
        }
        function resolverTurmaLogin(v) {                       // {periodo, turmaId} a partir da escolha, ou erro
            const t = turmas.find(x => x.codId === v.turma);
            if (t) return { periodo: t.diaPeriodo, turmaId: t.codId };
            if (String(v.turma).startsWith('antigo:')) return { periodo: String(v.turma).slice(7), turmaId: '' };
            return { erro: 'Escolha uma turma cadastrada. Se a cidade ainda não tem turmas, cadastre em Usuários › Cidades e turmas.' };
        }
        const camposLogin = (u) => [
            { id: 'nome', label: 'Nome completo:', valorInicial: u?.nome, obrigatorio: true },
            { id: 'email', label: 'E-mail:', tipo: 'email', valorInicial: u?.email, obrigatorio: true },
            { id: 'whats', label: 'WhatsApp:', valorInicial: u?.whats, obrigatorio: true },
            { id: 'nasc', label: 'Data de nascimento:', tipo: 'date', valorInicial: u?.nasc },
            { id: 'cidade', label: 'Cidade:', tipo: 'select', opcoes: opcoesCidades(), valorInicial: u?.cidade || cidadesList[0], obrigatorio: true, onChange: 'filtrarTurmasLogin()' },
            { id: 'turma', label: 'Turma (dia / período e ID — das turmas cadastradas na cidade):', tipo: 'select', opcoes: opcoesTurmasLogin(u?.cidade || cidadesList[0], u), valorInicial: turmaAtualLogin(u), obrigatorio: true },
            { id: 'inicio', label: 'Início do contrato:', tipo: 'date', valorInicial: u?.inicio, obrigatorio: true }
        ];
        function validarLogin(v, ignorar) {
            const email = v.email.trim().toLowerCase(), tel = nd(v.whats);
            if (tel.length < 10) return 'Informe um WhatsApp válido com DDD.';
            const out = getUsuarios().filter((_, i) => i !== ignorar);
            if (out.some(x => (x.email || '').toLowerCase() === email)) return 'Já existe um usuário com este e-mail.';
            if (out.some(x => nd(x.whats) === tel)) return 'Já existe um usuário com este WhatsApp.';
            return '';
        }
        function novoLogin() {
            window._loginEditando = null; tempImageBase64 = ''; tempFileName = '';
            abrirModalCustom({
                titulo: 'Novo usuário', icone: '', texto: 'A validade da carteirinha será 2 anos após o início do contrato.',
                camposMultiplos: [...camposLogin(null), { id: 'senha', label: 'Senha (sem exigências):', obrigatorio: true }, { id: 'dica', label: 'Dica de senha:', obrigatorio: true }, { id: 'foto', label: 'Foto (opcional):', tipo: 'file' }],
                textoBtnConfirmar: 'Criar usuário',
                onConfirm: async (res) => {
                    const v = res.valores, erro = validarLogin(v, -1), tm = resolverTurmaLogin(v);
                    if (erro || tm.erro) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: erro || tm.erro });
                    const us = getUsuarios();
                    us.push({ nome: formatName(v.nome), email: v.email.trim().toLowerCase(), whats: v.whats.trim(), nasc: v.nasc || '', cidade: v.cidade, periodo: tm.periodo, turmaId: tm.turmaId,
                        inicio: v.inicio, validade: somaAnos(v.inicio, 2), foto: tempImageBase64 || '', dica: v.dica.trim(), senhaHash: await cieeSenha.gerar(v.senha),
                        termosAssinadosEm: 'Cadastro pelo painel (' + new Date().toLocaleString('pt-BR') + ')' });
                    if (lsSet('ciee_users', us)) { renderLogins(); registrarHistorico(v.nome, 'Usuário criado', 'Cadastro criado pelo painel'); abrirModalCustom({ titulo: 'Usuário criado', icone: '', texto: 'O usuário já pode entrar com o e-mail ou WhatsApp e a senha definida.' }); }
                }
            });
        }
        function editarLogin(i) {
            const u = getUsuarios()[i]; window._loginEditando = u; tempImageBase64 = u.foto || ''; tempFileName = '';
            abrirModalCustom({
                titulo: 'Editar usuário', icone: '', texto: `Editando: ${u.nome}`,
                camposMultiplos: [...camposLogin(u), { id: 'validade', label: 'Validade da carteirinha:', tipo: 'date', valorInicial: u.validade }, { id: 'dica', label: 'Dica de senha:', valorInicial: u.dica }, { id: 'foto', label: 'Trocar foto (opcional):', tipo: 'file' }],
                textoBtnConfirmar: 'Salvar alterações',
                onConfirm: (res) => {
                    const v = res.valores, erro = validarLogin(v, i), tm = resolverTurmaLogin(v);
                    if (erro || tm.erro) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: erro || tm.erro });
                    const us = getUsuarios(), antigo = String(us[i].email || '').toLowerCase();
                    us[i] = { ...us[i], nome: formatName(v.nome), email: v.email.trim().toLowerCase(), whats: v.whats.trim(), nasc: v.nasc || '', cidade: v.cidade, periodo: tm.periodo, turmaId: tm.turmaId,
                        inicio: v.inicio, validade: v.validade || somaAnos(v.inicio, 2), dica: (v.dica || '').trim(), foto: tempImageBase64 || '' };
                    if (lsSet('ciee_users', us)) { if (antigo !== us[i].email) { try { cieePerfil.migrar(antigo, us[i].email, us[i].whats); } catch (e) {} } renderLogins(); abrirModalCustom({ titulo: 'Atualizado', icone: '', texto: 'Dados do usuário atualizados.' }); }
                }
            });
        }
        // Foto e contato do aprendiz (mesmo bloco do "Meu perfil"); os selos, leituras e empréstimos acompanham a troca de e-mail
        function editarDadosLogin(i) {
            const u = getUsuarios()[i]; let novaFoto = null;
            abrirModalCustom({
                titulo: 'Foto e contato', icone: '', texto: `Aprendiz: ${u.nome}`, extraHTML: cieePerfil.blocoAdmin(u),
                textoBtnConfirmar: 'Salvar dados',
                onConfirm: () => {
                    const email = document.getElementById('adm-pf-email').value.trim().toLowerCase(), tel = document.getElementById('adm-pf-fone').value;
                    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Informe um e-mail válido.' });
                    const erro = validarLogin({ email, whats: tel }, i);
                    if (erro) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: erro });
                    const us = getUsuarios(), antigo = String(us[i].email || '').toLowerCase(), fone = cieePerfil.fmtFone(tel);
                    us[i] = { ...us[i], email, whats: fone, ...(novaFoto ? { foto: novaFoto } : {}) };
                    if (lsSet('ciee_users', us)) {
                        try { cieePerfil.migrar(antigo, email, fone); } catch (e) {}
                        const mudou = [antigo !== email && 'e-mail', digitosIguais(u.whats, fone) ? null : 'telefone', novaFoto && 'foto'].filter(Boolean);
                        registrarHistorico(u.nome, 'Dados do aprendiz alterados', (mudou.join(', ') || 'sem mudanças') + ' • por ' + sessionData.nome);
                        renderLogins(); abrirModalCustom({ titulo: 'Atualizado', icone: '', texto: 'Dados do aprendiz atualizados.' + (antigo !== email ? ' O aprendiz deve usar o novo e-mail para entrar.' : '') });
                    }
                }
            });
            setTimeout(() => cieePerfil.ligarBlocoAdmin(f => { novaFoto = f; }), 0);
        }
        const digitosIguais = (a, b) => nd(a) === nd(b);
        function trocarSenhaLogin(i) {
            const u = getUsuarios()[i];
            abrirModalCustom({
                titulo: 'Trocar senha', icone: '', texto: `Defina a nova senha de ${u.nome}. Sem exigências de complexidade.`,
                camposMultiplos: [{ id: 'senha', label: 'Nova senha:', obrigatorio: true }],
                textoBtnConfirmar: 'Trocar senha',
                onConfirm: async (res) => {
                    const s = res.valores.senha;
                    if (s.length < 4) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Use ao menos 4 caracteres.' });
                    const us = getUsuarios(); us[i].senhaHash = await cieeSenha.gerar(s);
                    if (lsSet('ciee_users', us)) { registrarHistorico(u.nome, 'Senha alterada', 'Senha redefinida pelo painel'); abrirModalCustom({ titulo: 'Senha alterada', icone: '', texto: `A nova senha de ${u.nome} já está valendo.` }); }
                }
            });
        }
        function alterarValidadeLogin(i) {
            const u = getUsuarios()[i];
            abrirModalCustom({
                titulo: 'Validade da carteirinha', icone: '', texto: `Usuário: ${u.nome}`,
                camposMultiplos: [{ id: 'validade', label: 'Nova data de validade:', tipo: 'date', valorInicial: u.validade, obrigatorio: true }],
                textoBtnConfirmar: 'Salvar validade',
                onConfirm: (res) => {
                    const us = getUsuarios(); us[i].validade = res.valores.validade;
                    if (lsSet('ciee_users', us)) { renderLogins(); registrarHistorico(u.nome, 'Validade alterada', `Nova validade: ${fmtBR(res.valores.validade)}`); }
                }
            });
        }
        function excluirLogin(i) {
            const u = getUsuarios()[i];
            abrirModalCustom({
                titulo: 'Excluir usuário', icone: '', texto: `Excluir ${u.nome} (${u.email})? Essa pessoa não conseguirá mais entrar.`,
                textoBtnConfirmar: 'Excluir',
                onConfirm: () => { const us = getUsuarios(); us.splice(i, 1); if (lsSet('ciee_users', us)) { renderLogins(); registrarHistorico(u.nome, 'Usuário excluído', `Excluído por ${sessionData.nome}`); } }
            });
        }

        // ---------- 12. ByPass: legenda de níveis e permissões ----------
        function renderNiveisLegenda() {             // caixas clicáveis por nível, que se abrem mostrando o que cada um acessa
            const box = $('niveis-legenda'); if (!box) return;
            const OK = '<svg class="nv-ico ok" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
            const NAO = '<svg class="nv-ico nao" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
            const grupos = {}; MENU_FLAT.forEach(it => { (grupos[it.grupo || 'Geral'] = grupos[it.grupo || 'Geral'] || []).push(it); });
            const caixa = n => {
                const pode = MENU_FLAT.filter(it => it.niveis.includes(n)).length;
                const corpo = n === 1
                    ? `<p class="nv-txt">Usa o portal (mural, acervo, minhas leituras, calendário, artes, achados e perdidos, sugestões, carteirinha e selos). <strong>Não acessa este painel.</strong></p>`
                    : Object.keys(grupos).map(g => `<div class="nv-grupo"><h5>${escHtml(g)}</h5><ul>${grupos[g].map(it => `<li class="${it.niveis.includes(n) ? 'sim' : 'nao'}">${it.niveis.includes(n) ? OK : NAO}<span>${escHtml(it.label)}</span><em>${it.niveis.includes(n) ? 'Acessa' : 'Sem acesso'}</em></li>`).join('')}</ul></div>`).join('');
                return `<details class="nv-acc n${n}"${n === nivelAtual() ? ' open' : ''}><summary><span class="nv-num">${n}</span><span class="nv-tit"><strong>${escHtml(NIVEIS_INFO[n].nome)}</strong><small>${escHtml(NIVEIS_INFO[n].desc)}</small></span><span class="nv-qtd">${n === 1 ? 'Só o portal' : pode + ' áreas'}</span><svg class="nv-seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="nv-corpo">${corpo}</div></details>`;
            };
            box.innerHTML = `<p class="sec-intro" style="margin:0 0 10px">Toque em um nível para ver o que ele acessa no painel.</p><div class="nv-lista">${[1, 2, 3, 4, 5].map(caixa).join('')}</div>
                <p class="sec-intro" style="margin-top:10px">Regras extras: Representantes (nível 2) e Monitores (nível 3) só <em>solicitam</em> exclusões — Orientadores e Webmaster aprovam. Cada senha de ByPass identifica um único acesso.</p>`;
        }


        // ---------- Sugestões dos aprendizes ----------
        let pageSug = 1;
        const SUG_STATUS = ['Nova', 'Em análise', 'Respondida', 'Arquivada'];
        function sugTodas() {               // junta as sugestões de todos os aprendizes (deste aparelho) e garante um id
            const tudo = lsGet('ciee_sugestoes', {}) || {}, us = getUsuarios(); let mudou = false; const lista = [];
            Object.keys(tudo).forEach(k => (tudo[k] || []).forEach(x => {
                if (!x.id) { x.id = 's' + x.ts + Math.random().toString(36).slice(2, 5); mudou = true; }
                const u = us.find(v => String(v.email || '').toLowerCase() === k) || {};
                lista.push(Object.assign({ k, nomeU: x.nome || u.nome || k, cidadeU: x.cidade || u.cidade || '', status: x.status || 'Nova' }, x));
            }));
            if (mudou) lsSet('ciee_sugestoes', tudo, true);
            return lista.sort((p, q) => q.ts - p.ts);
        }
        function sugAlterar(id, fn) {
            const tudo = lsGet('ciee_sugestoes', {}) || {};
            Object.keys(tudo).forEach(k => { tudo[k] = (tudo[k] || []).filter(x => { if (x.id !== id) return true; return fn(x) !== false; }); });
            lsSet('ciee_sugestoes', tudo, true);
        }
        function renderSugestoesAdmin() {
            const b = $('table-sugestoes'); if (!b) return;
            const todas = sugTodas(), q = ($('sug-busca').value || '').toLowerCase().trim(), st = $('sug-filtro').value;
            $('sug-contas').innerHTML = [['Total', todas.length], ['Novas', todas.filter(x => x.status === 'Nova').length], ['Em análise', todas.filter(x => x.status === 'Em análise').length], ['Respondidas', todas.filter(x => x.status === 'Respondida').length]]
                .map(([t, n]) => `<div class="stat-card"><div class="stat-info"><h3>${t}</h3><p>${n}</p></div></div>`).join('');
            const lista = todas.filter(x => (!st || x.status === st) && (!q || [x.nomeU, x.assunto, x.texto, x.cidadeU].some(v => String(v || '').toLowerCase().includes(q))));
            const paginas = Math.ceil(lista.length / 10) || 1; if (pageSug > paginas) pageSug = paginas; if (pageSug < 1) pageSug = 1;
            const envio = x => x.envio === 'ativacao' ? 'Aguardando ativação' : (x.ok ? 'Enviada' : 'Não enviada');
            b.innerHTML = lista.length ? lista.slice((pageSug - 1) * 10, pageSug * 10).map(x => `<tr>
                <td>${escHtml(new Date(x.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</td>
                <td><strong>${escHtml(x.nomeU)}</strong><br><small>${escHtml(x.cidadeU)}</small></td>
                <td><strong>${escHtml(x.assunto)}</strong><br><span style="white-space:pre-wrap">${escHtml(x.texto)}</span></td>
                <td><span class="badge ${x.ok ? 'badge-green' : 'badge-yellow'}">${envio(x)}</span></td>
                <td><select data-id="${escHtml(x.id)}" onchange="sugStatus(this.dataset.id, this.value)" style="padding:8px;border-radius:10px;border:2px solid var(--border-color);background:var(--input-bg);color:var(--text-dark);font-weight:700">${SUG_STATUS.map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
                <td><div style="display:flex;gap:4px;flex-wrap:wrap">${/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.k) ? `<a class="btn-action btn-primary" style="text-decoration:none" href="mailto:${escHtml(x.k)}?subject=${encodeURIComponent('Sua sugestão no CIEESC PLAY: ' + x.assunto)}">Responder</a>` : ''}${nivelAtual() >= 4 ? `<button class="btn-action btn-danger" data-id="${escHtml(x.id)}" onclick="sugExcluir(this.dataset.id)">Excluir</button>` : ''}</div></td></tr>`).join('')
                : '<tr><td colspan="6" style="text-align:center;color: var(--muted-ok, #526071)">Nenhuma sugestão encontrada.</td></tr>';
            $('page-info-sug').innerText = `Página ${pageSug} de ${paginas} • ${lista.length} sugestão(ões)`;
            $('btn-prev-sug').disabled = pageSug === 1; $('btn-next-sug').disabled = pageSug === paginas;
        }
        function sugStatus(id, status) {
            let alvo = null; sugAlterar(id, x => { x.status = status; alvo = x; });
            if (alvo) registrarHistorico(alvo.nome || 'Aprendiz', 'Sugestão: ' + status, (alvo.assunto || '') + ' • por ' + sessionData.nome);
            renderSugestoesAdmin();
        }
        function sugExcluir(id) {
            if (nivelAtual() < 4) return;
            abrirModalCustom({ titulo: 'Excluir sugestão?', icone: '', texto: 'A sugestão sai da lista do painel e de "Minhas sugestões" do aprendiz.', textoBtnConfirmar: 'Excluir',
                onConfirm: () => { sugAlterar(id, () => false); registrarHistorico('Sugestão', 'Exclusão', 'por ' + sessionData.nome); renderSugestoesAdmin(); } });
        }

        // ---------- Selos de conquista (concedidos por orientadores e admins) ----------
        let pageSelos = 1, searchSelos = '';
        function renderSelosAdmin() {
            const b = $('table-selos'); if (!b) return;
            const q = searchSelos.toLowerCase().trim(), todos = cieeSelos.lerTudo();
            const lista = getUsuarios().map((u, i) => ({ u, i })).filter(({ u }) => !q || [u.nome, u.email].some(x => String(x || '').toLowerCase().includes(q)));
            const paginas = Math.ceil(lista.length / 10) || 1; if (pageSelos > paginas) pageSelos = paginas; if (pageSelos < 1) pageSelos = 1;
            const fatia = lista.slice((pageSelos - 1) * 10, pageSelos * 10);
            b.innerHTML = fatia.length ? fatia.map(({ u, i }) => {
                const mine = todos[String(u.email || '').toLowerCase()] || {};
                const chips = cieeSelos.MAN.map(t => { const an = Object.keys(mine).filter(k => mine[k].id === t.id).map(k => mine[k].ano).sort(); return an.length ? `<span class="badge badge-green" title="${escHtml(t.desc)}">${escHtml(t.nome)} · ${an.join(', ')}</span>` : ''; }).filter(Boolean).join(' ');
                return `<tr><td><div style="display:flex;align-items:center;gap:8px">${u.foto ? `<img src="${escHtml(imgOk(u.foto))}" class="thumb round">` : `<span class="thumb round ph ini-ava">${iniciais(u.nome)}</span>`}<div><strong>${escHtml(u.nome)}</strong><br><small>${escHtml(u.email)}</small></div></div></td>
                    <td>${escHtml(u.cidade || '')}<br><small>${escHtml(u.periodo || '')}</small></td><td><strong>${cieeSelos.pontos(String(u.email || '').toLowerCase())}</strong><br><small>${cieeSelos.pendentes(String(u.email || '').toLowerCase()).length} esperando reflexão</small></td><td>${chips || '<small>Nenhum ainda</small>'}</td>
                    <td><button class="btn-action btn-primary" onclick="gerirSelos(${i})">Gerenciar selos</button></td></tr>`;
            }).join('') : '<tr><td colspan="5" style="text-align:center;color: var(--muted-ok, #526071)">Nenhum aprendiz encontrado.</td></tr>';
            $('page-info-selos').innerText = `Página ${pageSelos} de ${paginas} • ${lista.length} aprendiz(es)`;
            $('btn-prev-selos').disabled = pageSelos === 1; $('btn-next-selos').disabled = pageSelos === paginas;
        }
        function gerirSelos(i) {
            if (!sessionData || sessionData.nivel < 4) return;
            const u = getUsuarios()[i], k = String(u.email || '').toLowerCase(), ano = new Date().getFullYear(), tem = cieeSelos.manuais(k);
            const linhas = cieeSelos.MAN.map(t => { const e = tem[t.id] || [], marcado = t.anual ? e.some(x => x.ano === ano) : e.length > 0;
                const quem = e.length ? `<small style="display:block;margin-left:26px;opacity:.75">${e.map(x => `${escHtml(x.ano)}${x.por ? ' • por ' + escHtml(x.por) : ''}`).join(' · ')}</small>` : '';
                return `<label style="display:flex;gap:10px;align-items:flex-start;padding:10px;border:2px solid var(--border-color);border-radius:12px;margin-bottom:8px;cursor:pointer">
                    <input type="checkbox" data-selo="${escHtml(t.id)}" ${marcado ? 'checked' : ''} style="margin-top:3px;width:18px;height:18px"><span><strong>${escHtml(t.nome)}</strong>${t.anual ? ` <small>(líder em ${ano})</small>` : ''}<small style="display:block;opacity:.8">${escHtml(t.desc)}</small>${quem}</span></label>`; }).join('');
            abrirModalCustom({
                titulo: 'Selos de conquista', icone: '', texto: `Aprendiz: ${u.nome}. Marque os selos que ele(a) conquistou.`, extraHTML: linhas,
                textoBtnConfirmar: 'Salvar selos',
                onConfirm: () => {
                    const marcados = {}; document.querySelectorAll('#modal-extra-content [data-selo]').forEach(c => { marcados[c.dataset.selo] = c.checked; });
                    const mudancas = [];
                    cieeSelos.MAN.forEach(t => { const e = tem[t.id] || [], tinha = t.anual ? e.some(x => x.ano === ano) : e.length > 0;
                        if (marcados[t.id] && !tinha) { const r = cieeSelos.concederManual(k, t.id, sessionData.nome); if (r.ok) { mudancas.push('+ ' + t.nome); registrarHistorico(u.nome, 'Selo concedido', `${t.nome} • por ${sessionData.nome}`); } }
                        if (!marcados[t.id] && tinha) { if (cieeSelos.retirarManual(k, t.id)) { mudancas.push('− ' + t.nome); registrarHistorico(u.nome, 'Selo removido', `${t.nome} • por ${sessionData.nome}`); } } });
                    renderSelosAdmin();
                    abrirModalCustom({ titulo: mudancas.length ? 'Selos atualizados' : 'Nada mudou', icone: '', texto: mudancas.length ? mudancas.join(' · ') + '. O aprendiz será avisado na próxima vez que entrar.' : 'Nenhuma alteração foi feita.' });
                }
            });
        }

        // ---------- Temas sazonais ----------
        function renderTemas() {
            const CT = cieeTemas, C = CT.cfg(), hoje = new Date(), at = CT.atual(), ord = CT.ORDEM.slice().sort((x, y) => CT.proxima(x, hoje)[0] - CT.proxima(y, hoje)[0]);
            let txt;
            if (C.modo === 'desligado') txt = 'Temas desligados. Nada é exibido e nenhum selo é concedido.';
            else if (at.id) txt = `Tema ativo agora: <strong>${CT.TEMAS[at.id].nome}</strong> (${at.origem === 'teste' ? 'teste manual — não gera selos; volte para Automático depois' : 'automático, pela data'}).`;
            else { const p = CT.proxima(ord[0], hoje); txt = `Nenhum tema ativo hoje. Próximo: <strong>${CT.TEMAS[ord[0]].nome}</strong> — ${CT.descPeriodo(p)} de ${p[0].getFullYear()}.`; }
            $('temas-status').innerHTML = txt;
            $('tema-modo').value = C.modo; $('tema-nivel').value = String(C.nivel || 2);
            $('tema-forcar').innerHTML = CT.ORDEM.map(id => `<option value="${id}">${CT.TEMAS[id].nome}</option>`).join('');
            $('tema-forcar').value = C.forcar || ord[0]; $('tema-forcar').disabled = C.modo !== 'forcar';
            $('tema-modo').onchange = () => { $('tema-forcar').disabled = $('tema-modo').value !== 'forcar'; };
            $('table-temas').innerHTML = ord.map(id => { const t = CT.TEMAS[id], p = CT.proxima(id, hoje);
                return `<tr><td><strong>${escHtml(t.nome)}</strong></td><td>${t.quando}</td><td>${CT.descPeriodo(p)} de ${p[1].getFullYear()}</td><td>${escHtml(t.selo.nome)}</td>
                <td><input type="checkbox" ${C.ativos[id] !== false ? 'checked' : ''} onchange="temaAuto('${id}', this.checked)" aria-label="Ativar ${escHtml(t.nome)} automaticamente"></td>
                <td><button class="btn-action btn-primary" onclick="testarTema('${id}')">Testar</button></td></tr>`; }).join('');
        }
        function salvarTemas(extra) {
            const C = Object.assign({}, cieeTemas.cfg(), { modo: $('tema-modo').value, forcar: $('tema-forcar').value, nivel: +$('tema-nivel').value }, extra || {});
            if (sisSet({ temas: C })) { cieeTemas.atualizar(); renderTemas(); registrarHistorico('Sistema', 'Temas sazonais', `Modo: ${C.modo}${C.modo === 'forcar' ? ' (' + C.forcar + ')' : ''} • por ${sessionData.nome}`); }
        }
        function temaAuto(id, on) { const C = cieeTemas.cfg(); C.ativos = Object.assign({}, C.ativos, { [id]: on }); if (sisSet({ temas: C })) { cieeTemas.atualizar(); renderTemas(); } }
        function testarTema(id) { salvarTemas({ modo: 'forcar', forcar: id }); }

        // ---------- Sistema: manutenção, versões e calendário Outlook ----------
        const sisGet = () => lsGet('ciee_sistema', {});
        const sisSet = p => lsSet('ciee_sistema', Object.assign(sisGet(), p));
        function renderManutencao() {
            const on = !!sisGet().manutencao;
            $('manut-status').className = 'badge ' + (on ? 'badge-red' : 'badge-green');
            $('manut-status').innerText = on ? 'Ativada (app em manutenção)' : 'Desativada (funcionamento normal)';
            $('btn-manut-on').disabled = on; $('btn-manut-off').disabled = !on;
        }
        function definirManutencao(on) {
            abrirModalCustom({
                titulo: on ? 'Ativar manutenção' : 'Desativar manutenção', icone: on ? '' : '',
                texto: on ? 'O botão “1º acesso” ficará indisponível e o login aceitará somente o ByPass. Confirmar?' : 'O portal volta a funcionar normalmente. Confirmar?',
                textoBtnConfirmar: on ? 'Ativar' : 'Desativar',
                onConfirm: () => { if (sisSet({ manutencao: on })) { renderManutencao(); registrarHistorico('Sistema', on ? 'Manutenção ativada' : 'Manutenção desativada', 'Por ' + sessionData.nome); } }
            });
        }
        const versoesGet = () => lsGet('ciee_versoes', [{ _id: 'v01', versao: '0.1', data: new Date().toISOString().slice(0, 10), notas: 'Versão inicial.' }]);
        function renderVersoes() {
            const l = versoesGet(), atual = sisGet().versao || '0.1';
            $('table-versoes').innerHTML = l.length ? l.map((v, i) => `<tr><td><strong>${escHtml(v.versao)}</strong></td><td>${fmtBR(v.data)}</td><td>${escHtml(v.notas || '')}</td>
                <td>${v.versao === atual ? '<span class="badge badge-green">Atual</span>' : '<span class="badge badge-yellow">Anterior</span>'}</td>
                <td><div style="display:flex;gap:4px;flex-wrap:wrap">${v.versao === atual ? '' : `<button class="btn-action btn-primary" onclick="versaoAtual(${i})">Tornar atual</button>`}
                <button class="btn-action btn-danger" onclick="excluirVersao(${i})">Excluir</button></div></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color: var(--muted-ok, #526071)">Nenhuma versão registrada.</td></tr>';
        }
        function novaVersao() {
            abrirModalCustom({
                titulo: 'Nova versão', icone: '', texto: 'Ao salvar, esta passa a ser a versão atual no rodapé do index.html.',
                camposMultiplos: [{ id: 'versao', label: 'Versão (ex.: 0.2):', obrigatorio: true }, { id: 'data', label: 'Data:', tipo: 'date', valorInicial: new Date().toISOString().slice(0, 10), obrigatorio: true }, { id: 'notas', label: 'O que mudou:', tipo: 'textarea' }],
                textoBtnConfirmar: 'Publicar versão',
                onConfirm: res => {
                    const v = res.valores, l = versoesGet();
                    if (l.some(x => x.versao === v.versao.trim())) return abrirModalCustom({ titulo: 'Atenção', icone: '', texto: 'Essa versão já existe.' });
                    l.unshift({ _id: uid(), versao: v.versao.trim(), data: v.data, notas: v.notas.trim() });
                    if (lsSet('ciee_versoes', l) && sisSet({ versao: v.versao.trim() })) { renderVersoes(); registrarHistorico('Sistema', 'Nova versão', 'Versão ' + v.versao.trim()); }
                }
            });
        }
        function versaoAtual(i) { const v = versoesGet()[i]; if (sisSet({ versao: v.versao })) renderVersoes(); }
        function excluirVersao(i) {
            const l = versoesGet(), v = l[i];
            abrirModalCustom({ titulo: 'Excluir versão', icone: '', texto: `Excluir a versão ${v.versao} do histórico?`, textoBtnConfirmar: 'Excluir',
                onConfirm: () => { l.splice(i, 1); lsSet('ciee_versoes', l); if (sisGet().versao === v.versao) sisSet({ versao: (l[0] && l[0].versao) || '0.1' }); renderVersoes(); } });
        }

        // Rótulos das colunas em cada célula (usados pelo layout em cartões no celular)
        function rotularTabelas() {
            document.querySelectorAll('table.admin-table').forEach(t => {
                const hs = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
                t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
                    if (td.hasAttribute('colspan')) return;
                    td.setAttribute('data-label', hs[i] || '');
                    if (_mq.matches && !(td.children.length === 1 && td.firstElementChild.classList.contains('cell'))) {   // agrupa o conteúdo para o layout em cartão
                        const w = document.createElement('div'); w.className = 'cell';
                        while (td.firstChild) w.appendChild(td.firstChild);
                        td.appendChild(w);
                    }
                }));
            });
        }
        let _rotT; new MutationObserver(() => { clearTimeout(_rotT); _rotT = setTimeout(rotularTabelas, 60); }).observe(document.body, { childList: true, subtree: true });

        // ESC fecha/cancela e ENTER confirma (OK) nas caixas de confirmação, edição, cadastro e exclusão
        document.addEventListener('keydown', e => {
            const ov = document.getElementById('custom-modal-overlay');
            if (!ov || ov.style.display !== 'flex' || e.repeat) return;
            if (e.key === 'Escape') { e.preventDefault(); fecharModalCustom(); return; }
            if (e.key === 'Enter') {
                if (['TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
                e.preventDefault();
                const c = document.getElementById('modal-btn-confirm');
                if (c.style.display !== 'none') c.click(); else fecharModalCustom();
            }
        });
        window.addEventListener('storage', e => {
            if (e.key === 'ciee_theme' || e.key === 'ciee_color_theme') initTheme();
            if (e.key === 'ciee_solicitacoes') { solicitacoes = lsGet('ciee_solicitacoes', []); try { renderSolicitacoes(); } catch (er) {} }       // novo pedido feito no portal
            if (e.key === 'ciee_emprestimos') { emprestimos = lsGet('ciee_emprestimos', []); try { renderEmprestimos(); } catch (er) {} }
        });

        // ---------- 13. Iniciação ----------
        function iniciarPainel() {
            acervo = lsGet('ciee_acervo', acervo).map(a => ({ editora: '', local: '', desc: '', ...a }));
            categorias = lsGet('ciee_categorias', categorias).map(c => Object.assign({}, c, { nome: semEmoji(c.nome) }));   // tira emojis de cadastros antigos
            listaEtiquetas = lsGet('ciee_etiquetas', listaEtiquetas);
            turmas = lsGet('ciee_turmas', turmas);
            cidadesList = lsGet('ciee_cidades', cidadesList);
            solicitacoes = lsGet('ciee_solicitacoes', solicitacoes);
            emprestimos = lsGet('ciee_emprestimos', emprestimos);
            ['renderAcervo', 'renderCategorias', 'renderEtiquetas', 'renderTurmas', 'renderSolicitacoes', 'renderEmprestimos'].forEach(n => {
                const f = window[n];
                window[n] = function () { const r = f.apply(this, arguments); persistirTudo(); return r; };
            });
            Object.keys(CRUDS).forEach(crudBuild);
            buildNav();
            renderSolicitacoes(); renderEmprestimos(); renderAcervo(); renderCategorias(); renderEtiquetas();
            renderObjetos(); renderTurmas(); renderCidades(); renderHistorico(); renderCodigos();
            Object.keys(CRUDS).forEach(crudRender);
            renderSolicitacoesExclusao();
            cieeTrack(sessionData, 'Painel admin');
            const h = location.hash.slice(1);
            switchAdminTab(h || 'inicio');
        }
        if (sessionData && sessionData.nivel >= 2) iniciarPainel();

    
