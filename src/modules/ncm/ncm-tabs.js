/**
 * NCM - Consulta por código NCM (vigência + descrições + TIPI).
 * Usa Tabela_NCM e Tabela_TIPI para exibir NCMs válidas e dados tributários.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    var s = String(str);
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /** Verifica se o texto é um código NCM (8 dígitos, com ou sem pontos). */
  function isNcmCode(str) {
    var s = String(str || '').trim();
    var digits = s.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 12 && /^\d[\d.]*$/.test(s.replace(/\s/g, ''));
  }

  function initConsultaNcm() {
    var input = document.getElementById('ncm-produto-search');
    var inputProduto = document.getElementById('ncm-produto-nome');
    var btn = document.getElementById('ncm-produto-search-btn');
    var results = document.getElementById('ncm-produto-results');
    var grid = document.getElementById('ncm-produto-results-grid');
    if (!input || !btn || !results || !grid) return;

    function renderVencimento(ncm, tipi) {
      var d2 = (ncm.descricao2 || '').trim();
      var d4 = (ncm.descricao4 || '').trim();
      var d6 = (ncm.descricao6 || '').trim();
      var d8 = (ncm.descricao || '').trim();
      var boxes = '';
      if (d2) boxes += '<div class="ncm-desc-box ncm-desc-box-2"><span class="ncm-desc-label">2 díg.</span><span class="ncm-desc-text">' + escapeHtml(d2) + '</span></div>';
      if (d4) boxes += '<div class="ncm-desc-box ncm-desc-box-4"><span class="ncm-desc-label">4 díg.</span><span class="ncm-desc-text">' + escapeHtml(d4) + '</span></div>';
      if (d6) boxes += '<div class="ncm-desc-box ncm-desc-box-6"><span class="ncm-desc-label">6 díg.</span><span class="ncm-desc-text">' + escapeHtml(d6) + '</span></div>';
      if (d8) boxes += '<div class="ncm-desc-box ncm-desc-box-8"><span class="ncm-desc-label">8 díg.</span><span class="ncm-desc-text">' + escapeHtml(d8) + '</span></div>';

      var reducao = tipi ? tipi.reducao_aliquota : 0;
      var cst = tipi ? tipi.cst : '000';
      var classificacao = tipi ? tipi.classificacao_tributaria : '000001';
      var tipiHint = '';
      if (!tipi) {
        var tipiMsg = (typeof window !== 'undefined' && window.TIPI_TABELA_DATA)
          ? 'NCM não consta na Tabela TIPI; exibindo valores padrão.'
          : 'Tabela TIPI não carregada; exibindo valores padrão.';
        tipiHint = '<p class="ncm-tipi-default-hint">' + escapeHtml(tipiMsg) + '</p>';
      }
      var tipiHtml = '<div class="ncm-tipi-box">' +
        tipiHint +
        '<span class="ncm-tipi-item"><strong>Redução de Alíquota:</strong> ' + escapeHtml(String(reducao)) + '%</span>' +
        '<span class="ncm-tipi-item"><strong>CST:</strong> ' + escapeHtml(cst) + '</span>' +
        '<span class="ncm-tipi-item"><strong>Classificação Tributária:</strong> ' + escapeHtml(classificacao) + '</span>' +
        '</div>';

      return '<div class="ncm-produto-card ncm-venc-card">' +
        '<div class="ncm-produto-card-head">' +
        '<strong class="ncm-produto-code">' + escapeHtml(ncm.codigoFormatado) + '</strong>' +
        '<span class="ncm-venc-badge ncm-venc-vigente">Vigente</span>' +
        '</div>' +
        '<div class="ncm-venc-cap">Cap. ' + escapeHtml(ncm.capitulo) + '</div>' +
        '<div class="ncm-desc-boxes">' + boxes + '</div>' +
        tipiHtml +
        '</div>';
    }

    function doSearch() {
      var q = (input.value || '').trim();
      if (!q) {
        if (typeof showToast === 'function') showToast('Digite um código NCM (8 dígitos).', 'warning');
        else alert('Digite um código NCM (8 dígitos).');
        return;
      }
      if (!window.ncmMotor || !window.ncmMotor.isReady()) {
        if (typeof showToast === 'function') showToast('Tabela NCM ainda não carregada. Aguarde.', 'error');
        else alert('Tabela NCM ainda não carregada. Aguarde.');
        return;
      }
      if (!isNcmCode(q)) {
        if (typeof showToast === 'function') showToast('Informe um código NCM válido (8 dígitos). Ex: 22021000 ou 2202.10.00', 'warning');
        else alert('Informe um código NCM válido (8 dígitos).');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Buscando...';
      results.style.display = 'block';
      grid.innerHTML = '';

      var ncm = window.ncmMotor.buscarPorCodigo(q);
      if (!ncm) {
        var codFmt = q.replace(/\D/g, '');
        if (codFmt.length > 8) codFmt = codFmt.slice(0, 8);
        var chapter = codFmt.length >= 2 ? codFmt.slice(0, 2) : '';
        var sugestoes = [];
        if (chapter && window.ncmMotor && window.ncmMotor.getNcmsByChapter) {
          sugestoes = window.ncmMotor.getNcmsByChapter(chapter, 5);
        }
        var sugestaoHtml = '';
        if (sugestoes.length > 0) {
          sugestaoHtml = '<p class="ncm-venc-sugestao"><strong>Exemplos de NCMs vigentes no cap. ' + escapeHtml(chapter) + ':</strong> ' +
            sugestoes.map(function (s) { return '<code>' + escapeHtml(s.codigoFormatado) + '</code>'; }).join(', ') + '</p>';
        }
        grid.innerHTML = '<div class="ncm-venc-vencida">' +
          '<i class="bx bx-error-circle"></i>' +
          '<h3>NCM vencida</h3>' +
          '<p>A NCM <strong>' + escapeHtml(codFmt || q) + '</strong> não consta na Tabela NCM vigente. Ela pode estar desatualizada ou ter sido substituída.</p>' +
          sugestaoHtml +
          '<p class="ncm-venc-hint">Consulte a Tabela NCM vigente para encontrar o código correto.</p>' +
          '</div>';
      } else {
        var tipi = getTipiByCodigo(ncm.codigo);
        grid.innerHTML = renderVencimento(ncm, tipi);
      }

      var ncm8 = (window.supabaseSync && typeof window.supabaseSync.normalizarNcm8 === 'function')
        ? window.supabaseSync.normalizarNcm8(q)
        : (q.replace(/\D/g, '').padStart(8, '0').slice(0, 8));
      var produto = (inputProduto && inputProduto.value) ? inputProduto.value.trim() : '';
      if (window.supabaseSync && window.supabaseSync.isConfigured() && ncm8) {
        (async function () {
          var validacaoUnica = null;
          var listaPorNcm = [];
          if (produto) {
            validacaoUnica = await window.supabaseSync.loadValidacaoNcm(produto, ncm8);
          }
          listaPorNcm = await window.supabaseSync.listValidacaoNcmByNcm(ncm8, 20);
          var htmlValidacao = '';
          if (validacaoUnica) {
            var r = validacaoUnica.resultado || '';
            var d = validacaoUnica.detalhe || '';
            var cls = 'ncm-validacao-sim';
            if (r === 'NAO') cls = 'ncm-validacao-nao';
            else if (r === 'REVISAR' || r === 'ERRO') cls = 'ncm-validacao-revisar';
            htmlValidacao += '<div class="ncm-validacao-banco ' + cls + '">' +
              '<h4 class="ncm-validacao-titulo"><i class="bx bx-check-double"></i> Validação no banco</h4>' +
              '<p><strong>Produto:</strong> ' + escapeHtml(validacaoUnica.produto || '') + '</p>' +
              '<p><strong>Resultado:</strong> ' + escapeHtml(r) + '</p>' +
              (d ? '<p><strong>Detalhe:</strong> ' + escapeHtml(d) + '</p>' : '') +
              '</div>';
          }
          if (listaPorNcm.length > 0) {
            htmlValidacao += '<div class="ncm-validacao-lista">' +
              '<h4 class="ncm-validacao-titulo"><i class="bx bx-list-ul"></i> Produtos já validados para este NCM (' + escapeHtml(ncm8) + ')</h4>' +
              '<ul class="ncm-validacao-itens">';
            for (var i = 0; i < listaPorNcm.length; i++) {
              var row = listaPorNcm[i];
              var res = row.resultado || '';
              htmlValidacao += '<li><span class="ncm-v-res">' + escapeHtml(res) + '</span> ' + escapeHtml(row.produto || '') +
                (row.detalhe ? ' <span class="ncm-v-detalhe">' + escapeHtml(row.detalhe) + '</span>' : '') + '</li>';
            }
            htmlValidacao += '</ul></div>';
          }
          if (htmlValidacao) {
            var wrap = document.createElement('div');
            wrap.className = 'ncm-validacao-wrap';
            wrap.innerHTML = htmlValidacao;
            grid.appendChild(wrap);
          }
        })();
      }

      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-search"></i> Buscar';
    }

    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doSearch(); });
    btn.addEventListener('click', doSearch);
  }

  /**
   * Busca dados TIPI por código NCM (8 dígitos).
   * @returns {{ reducao_aliquota: number, cst: string, classificacao_tributaria: string } | null}
   */
  function getTipiByCodigo(codigo) {
    var data = typeof window !== 'undefined' && window.TIPI_TABELA_DATA;
    if (!data || typeof data !== 'object') return null;
    var c = String(codigo || '').replace(/\D/g, '');
    if (c.length < 8) return null;
    if (c.length > 8) c = c.slice(0, 8);
    var levelKey, root, caps, capKey, cap, ncms, n;
    for (levelKey in data) {
      if (!Object.prototype.hasOwnProperty.call(data, levelKey)) continue;
      root = data[levelKey];
      if (!root || !root.capitulos) continue;
      caps = root.capitulos;
      for (capKey in caps) {
        if (!Object.prototype.hasOwnProperty.call(caps, capKey)) continue;
        cap = caps[capKey];
        ncms = cap.ncms || {};
        n = ncms[c];
        if (!n || !n.codigo) {
          for (var _k in ncms) {
            if (!Object.prototype.hasOwnProperty.call(ncms, _k)) continue;
            var _n = ncms[_k];
            if (_n && String(_n.codigo || '').replace(/\D/g, '') === c) { n = _n; break; }
          }
        }
        if (n && n.codigo) {
          return {
            reducao_aliquota: typeof n.reducao_aliquota === 'number' ? n.reducao_aliquota : 0,
            cst: String(n.cst || '001').replace(/\D/g, '').padStart(3, '0').slice(-3),
            classificacao_tributaria: String(n.classificacao_tributaria || '000000').replace(/\D/g, '').padStart(6, '0').slice(-6)
          };
        }
      }
    }
    return null;
  }

  var BANCO_PAGE_SIZE = 200;

  function initBancoCadastrado() {
    var panel = document.getElementById('ncm-tab-banco-cadastrado');
    var refreshBtn = document.getElementById('ncm-banco-refresh-btn');
    var loadingEl = document.getElementById('ncm-banco-loading');
    var emptyEl = document.getElementById('ncm-banco-empty');
    var tableWrap = document.getElementById('ncm-banco-table-wrap');
    var tbody = document.getElementById('ncm-banco-tbody');
    var countEl = document.getElementById('ncm-banco-count');
    var moreWrap = document.getElementById('ncm-banco-more-wrap');
    var moreBtn = document.getElementById('ncm-banco-more-btn');
    if (!panel || !tbody) return;

    var offset = 0;

    function setLoading(loading) {
      if (loadingEl) loadingEl.style.display = loading ? 'flex' : 'none';
      if (refreshBtn) refreshBtn.disabled = loading;
    }

    function renderRows(rows) {
      if (!rows || rows.length === 0) return;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td class="ncm-banco-cell-produto">' + escapeHtml(r.produto || '') + '</td>' +
          '<td class="ncm-banco-cell-ncm">' + escapeHtml(r.ncm || '') + '</td>' +
          '<td class="ncm-banco-cell-resultado"><span class="ncm-v-res ncm-v-res-' + (r.resultado || '').toLowerCase() + '">' + escapeHtml(r.resultado || '') + '</span></td>' +
          '<td class="ncm-banco-cell-detalhe">' + escapeHtml(r.detalhe || '') + '</td>';
        tbody.appendChild(tr);
      }
    }

    function loadPage(append) {
      if (!window.supabaseSync || !window.supabaseSync.isConfigured()) {
        setLoading(false);
        if (emptyEl) { emptyEl.style.display = 'block'; var p = emptyEl.querySelector('p'); if (p) p.textContent = 'Supabase não configurado. Configure em config.js (SUPABASE.URL e ANON_KEY).'; }
        if (tableWrap) tableWrap.style.display = 'none';
        return;
      }
      setLoading(true);
      if (!append) {
        offset = 0;
        tbody.innerHTML = '';
      }
      window.supabaseSync.listValidacaoNcmAll(BANCO_PAGE_SIZE, offset).then(function (result) {
        setLoading(false);
        var rows = (result && result.data) ? result.data : (Array.isArray(result) ? result : null);
        var errMsg = (result && result.error) ? result.error : null;
        if (!append && errMsg) {
          if (emptyEl) {
            emptyEl.style.display = 'block';
            var p = emptyEl.querySelector('p');
            if (p) p.innerHTML = 'Não foi possível conectar ao banco. Verifique <strong>CONFIG.SUPABASE.URL</strong> e <strong>ANON_KEY</strong> em <code>config.js</code> (use a URL do seu projeto no Supabase; se ERR_NAME_NOT_RESOLVED, o ID do projeto está errado).';
          }
          if (tableWrap) tableWrap.style.display = 'none';
          if (countEl) countEl.textContent = '';
          return;
        }
        if (!append && (!rows || rows.length === 0)) {
          if (emptyEl) emptyEl.style.display = 'block';
          if (emptyEl) { var p2 = emptyEl.querySelector('p'); if (p2) p2.textContent = 'Nenhum registro no banco ou Supabase não configurado.'; }
          if (tableWrap) tableWrap.style.display = 'none';
          if (countEl) countEl.textContent = '0 registros';
          return;
        }
        if (emptyEl) emptyEl.style.display = 'none';
        if (tableWrap) tableWrap.style.display = 'block';
        if (rows && rows.length > 0) {
          renderRows(rows);
          offset += rows.length;
          var total = tbody.querySelectorAll('tr').length;
          if (countEl) countEl.textContent = total + ' registro(s)';
          if (moreWrap) moreWrap.style.display = rows.length >= BANCO_PAGE_SIZE ? 'block' : 'none';
        } else {
          if (moreWrap) moreWrap.style.display = 'none';
        }
      }).catch(function () {
        setLoading(false);
        if (!append) {
          if (emptyEl) { emptyEl.style.display = 'block'; var p = emptyEl.querySelector('p'); if (p) p.textContent = 'Erro ao carregar o banco.'; }
          if (tableWrap) tableWrap.style.display = 'none';
        }
      });
    }

    if (refreshBtn) refreshBtn.addEventListener('click', function () { loadPage(false); });
    if (moreBtn) moreBtn.addEventListener('click', function () { loadPage(true); });

    window._ncmLoadBancoCadastrado = loadPage;
  }

  /**
   * Parse CSV: primeira linha = cabeçalho; detecta separador ; ou ,; retorna { headers, rows }.
   * rows = array de objetos com chaves normalizadas (lowercase, trim).
   */
  function parseCsv(text) {
    var raw = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!raw) return { headers: [], rows: [] };
    var lines = raw.split('\n');
    var sep = raw.indexOf(';') >= 0 ? ';' : ',';
    var headerLine = lines[0];
    var headers = headerLine.split(sep).map(function (h) { return String(h || '').trim().toLowerCase(); });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      if (!line.trim()) continue;
      var parts = line.split(sep);
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j] || 'col' + j;
        obj[key] = (parts[j] != null ? String(parts[j]).trim() : '');
      }
      rows.push(obj);
    }
    return { headers: headers, rows: rows };
  }

  function initConferirPlanilha() {
    var fileInput = document.getElementById('ncm-planilha-file');
    var runBtn = document.getElementById('ncm-planilha-run-btn');
    var fileNameEl = document.getElementById('ncm-planilha-file-name');
    var loadingEl = document.getElementById('ncm-planilha-loading');
    var loadingText = document.getElementById('ncm-planilha-loading-text');
    var summaryEl = document.getElementById('ncm-planilha-summary');
    var reportWrap = document.getElementById('ncm-planilha-report-wrap');
    var reportTbody = document.getElementById('ncm-planilha-report-tbody');
    var emptyEl = document.getElementById('ncm-planilha-empty');
    if (!fileInput || !runBtn || !reportTbody) return;

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      runBtn.disabled = !file;
      fileNameEl.textContent = file ? file.name : '';
      summaryEl.style.display = 'none';
      reportWrap.style.display = 'none';
      emptyEl.style.display = 'none';
    });

    runBtn.addEventListener('click', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!window.supabaseSync || !window.supabaseSync.isConfigured()) {
        emptyEl.style.display = 'block';
        if (emptyEl.querySelector('p')) emptyEl.querySelector('p').textContent = 'Supabase não configurado. Configure em config.js (SUPABASE.URL e ANON_KEY).';
        reportWrap.style.display = 'none';
        summaryEl.style.display = 'none';
        return;
      }

      loadingEl.style.display = 'flex';
      loadingText.textContent = 'Lendo planilha...';
      runBtn.disabled = true;
      reportWrap.style.display = 'none';
      emptyEl.style.display = 'none';
      summaryEl.style.display = 'none';
      reportTbody.innerHTML = '';

      var reader = new FileReader();
      reader.onload = function () {
        var text = (reader.result || '').toString().replace(/^\uFEFF/, '');
        var parsed = parseCsv(text);
        var rows = parsed.rows || [];
        var prodIdx = parsed.headers.indexOf('produto');
        var ncmIdx = parsed.headers.indexOf('ncm');
        if (prodIdx < 0 || ncmIdx < 0) {
          loadingEl.style.display = 'none';
          runBtn.disabled = false;
          if (typeof showToast === 'function') showToast('CSV deve ter colunas "produto" e "ncm" no cabeçalho.', 'warning');
          else alert('CSV deve ter colunas "produto" e "ncm" no cabeçalho.');
          return;
        }

        var normalizarNcm8 = window.supabaseSync.normalizarNcm8;
        var loadValidacaoNcm = window.supabaseSync.loadValidacaoNcm;
        var divergencias = [];
        var totalLinhas = rows.length;
        var conferidas = 0;
        var i = 0;
        var BATCH_SIZE = 20;

        function finish() {
          loadingEl.style.display = 'none';
          runBtn.disabled = false;
          if (summaryEl) {
            summaryEl.style.display = 'block';
            summaryEl.innerHTML = '<strong>Resumo:</strong> ' + totalLinhas + ' linha(s) na planilha, ' + conferidas + ' conferida(s) no banco, <strong>' + divergencias.length + '</strong> com divergência (NAO/Revisar).';
          }
          if (divergencias.length === 0) {
            emptyEl.style.display = 'block';
            if (emptyEl.querySelector('p')) emptyEl.querySelector('p').textContent = 'Nenhuma divergência encontrada (todos os itens conferidos estão SIM no banco ou não constam no banco).';
            reportWrap.style.display = 'none';
          } else {
            emptyEl.style.display = 'none';
            reportWrap.style.display = 'block';
            for (var d = 0; d < divergencias.length; d++) {
              var r = divergencias[d];
              var tr = document.createElement('tr');
              tr.className = 'ncm-planilha-row-erro';
              tr.innerHTML = '<td class="ncm-banco-cell-produto">' + escapeHtml(r.produto || '') + '</td>' +
                '<td class="ncm-banco-cell-ncm">' + escapeHtml(r.ncmPlanilha || '') + '</td>' +
                '<td class="ncm-banco-cell-resultado"><span class="ncm-v-res ncm-v-res-' + (r.resultado || '').toLowerCase() + '">' + escapeHtml(r.resultado || '') + '</span></td>' +
                '<td class="ncm-banco-cell-detalhe">' + escapeHtml(r.detalhe || '') + '</td>';
              reportTbody.appendChild(tr);
            }
          }
        }

        function processBatch() {
          var batch = [];
          while (i < rows.length && batch.length < BATCH_SIZE) {
            var row = rows[i];
            var produto = (row.produto != null ? String(row.produto) : '').trim();
            var ncmRaw = (row.ncm != null ? String(row.ncm) : '').trim();
            var ncm8 = normalizarNcm8(ncmRaw);
            i += 1;
            if (produto && ncm8) {
              batch.push({ produto: produto, ncmRaw: ncmRaw, ncm8: ncm8 });
            }
          }
          if (loadingText) loadingText.textContent = 'Conferindo... ' + Math.min(i, totalLinhas) + '/' + totalLinhas;

          if (batch.length === 0) {
            finish();
            return;
          }

          var promises = batch.map(function (item) {
            return loadValidacaoNcm(item.produto, item.ncm8)
              .then(function (reg) {
                if (reg) {
                  conferidas += 1;
                  var res = (reg.resultado || '').toString().toUpperCase();
                  if (res === 'NAO' || res === 'REVISAR' || (reg.resultado || '').toLowerCase() === 'revisar') {
                    return {
                      produto: item.produto,
                      ncmPlanilha: item.ncmRaw || item.ncm8,
                      resultado: reg.resultado || '',
                      detalhe: reg.detalhe || ''
                    };
                  }
                }
                return null;
              })
              .catch(function () { return null; });
          });

          Promise.all(promises).then(function (results) {
            for (var r = 0; r < results.length; r++) {
              if (results[r]) divergencias.push(results[r]);
            }
            if (i >= rows.length) {
              finish();
            } else {
              processBatch();
            }
          });
        }

        processBatch();
      };
      reader.onerror = function () {
        loadingEl.style.display = 'none';
        runBtn.disabled = false;
        if (typeof showToast === 'function') showToast('Erro ao ler o arquivo.', 'error');
        else alert('Erro ao ler o arquivo.');
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  function initTabs() {
    var container = document.getElementById('ncmSection');
    if (!container) return;

    var tabBtns = container.querySelectorAll('.ncm-tab-btn');
    var tabPanels = container.querySelectorAll('.ncm-tab-content');

    function switchTab(tabId) {
      tabBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(function (p) {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      var btn = container.querySelector('.ncm-tab-btn[data-ncm-tab="' + tabId + '"]');
      var panel = document.getElementById('ncm-tab-' + tabId);
      if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
      if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
      if (tabId === 'banco-cadastrado' && typeof window._ncmLoadBancoCadastrado === 'function') {
        var bancoPanel = document.getElementById('ncm-tab-banco-cadastrado');
        if (bancoPanel && bancoPanel.querySelector('.ncm-banco-panel') && !bancoPanel.querySelector('.ncm-banco-panel').getAttribute('data-banco-loaded')) {
          bancoPanel.querySelector('.ncm-banco-panel').setAttribute('data-banco-loaded', '1');
          window._ncmLoadBancoCadastrado(false);
        }
      }
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-ncm-tab');
        if (t) switchTab(t);
      });
    });

    initConsultaNcm();
    initBancoCadastrado();
    initConferirPlanilha();
  }

  ready(initTabs);
})();
