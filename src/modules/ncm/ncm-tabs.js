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

  function normalizarNcm8Local(ncm) {
    if (ncm == null) return '';
    var dig = String(ncm).replace(/\D/g, '');
    if (dig.length === 0 || dig.length > 8) return '';
    return dig.length <= 8 ? dig.padStart(8, '0') : dig.slice(0, 8);
  }

  /** Normaliza nome de produto: maiúsculas, sem espaços duplicados. */
  function normalizeProductName(name) {
    return String(name || '').trim().toUpperCase().replace(/\s+/g, ' ');
  }

  /** Encontra índice da coluna de produto (cabeçalhos flexíveis). */
  function findColunaProdutoPlanilha(headers) {
    var aliases = ['produto', 'produtos', 'descrição', 'descricao',
      'descrição de produtos', 'descricao de produtos',
      'descrição do produto', 'descricao do produto', 'nome do produto'];
    for (var a = 0; a < aliases.length; a++) {
      var idx = headers.indexOf(aliases[a]);
      if (idx >= 0) return idx;
    }
    // Fallback: qualquer cabeçalho que contenha "produto" ou "descri"
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h.indexOf('produto') >= 0 || h.indexOf('descri') >= 0) return i;
    }
    return -1;
  }

  /** Encontra índice da coluna NCM. */
  function findColunaNcmPlanilha(headers) {
    var aliases = ['ncm', 'codigo ncm', 'código ncm', 'cod. ncm', 'cod ncm', 'codigo', 'código'];
    for (var a = 0; a < aliases.length; a++) {
      var idx = headers.indexOf(aliases[a]);
      if (idx >= 0) return idx;
    }
    // Fallback: qualquer cabeçalho que contenha "ncm"
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].indexOf('ncm') >= 0) return i;
    }
    return -1;
  }

  /**
   * Busca um produto no banco por prefixo (banco entry começa com queryNorm ou é igual).
   * Evita matches parciais de palavras exigindo que após o prefixo venha espaço ou fim.
   */
  function bancoPrefixMatch(queryNorm, bancoPrefixList) {
    for (var i = 0; i < bancoPrefixList.length; i++) {
      var e = bancoPrefixList[i];
      if (e.normalized === queryNorm || e.normalized.startsWith(queryNorm + ' ')) return e;
    }
    return null;
  }

  /**
   * Tenta encontrar um produto no banco:
   * 1. Match exato pelo nome normalizado.
   * 2. Se não encontrar, reduz palavras da direita até mínimo de 3,
   *    e verifica se alguma entrada do banco começa com esse prefixo.
   */
  function findProductInBanco(produto, bancoExact, bancoPrefixList) {
    var norm = normalizeProductName(produto);
    if (bancoExact[norm]) return { found: true, ncm: bancoExact[norm].ncm };

    var words = norm.split(' ').filter(Boolean);
    for (var i = words.length - 1; i >= 3; i--) {
      var partial = words.slice(0, i).join(' ');
      var hit = bancoPrefixMatch(partial, bancoPrefixList);
      if (hit) return { found: true, ncm: hit.ncm };
    }
    return { found: false };
  }

  /** Verifica se o arquivo é Excel (.xlsx, .xls, .xlsm, etc.) por extensão ou tipo. */
  function isExcelFile(file) {
    if (!file || !file.name) return false;
    var name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) return true;
    var t = (file.type || '').toLowerCase();
    return t.indexOf('spreadsheet') >= 0 || t.indexOf('excel') >= 0 || t === 'application/vnd.ms-excel' || t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || t.indexOf('macroenabled') >= 0;
  }

  /**
   * Lê um ArrayBuffer de arquivo Excel (XLSX/XLS) e retorna { headers, rows } no mesmo formato de parseCsv.
   * Usa a primeira aba; primeira linha = cabeçalhos (normalizados em minúsculas).
   */
  function parseExcelToHeadersRows(arrayBuffer) {
    if (typeof XLSX === 'undefined') return { headers: [], rows: [] };
    try {
      var workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, cellNF: false, cellStyles: false });
      var sheetName = workbook.SheetNames[0];
      if (!sheetName) return { headers: [], rows: [] };
      var sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet['!ref']) return { headers: [], rows: [] };
      var data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!data || data.length === 0) return { headers: [], rows: [] };
      var headerRow = data[0];
      var headers = [];
      for (var h = 0; h < headerRow.length; h++) {
        headers.push(String(headerRow[h] != null ? headerRow[h] : '').trim().toLowerCase());
      }
      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var line = data[i];
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          var key = headers[j] || 'col' + j;
          obj[key] = (line[j] != null ? String(line[j]).trim() : '');
        }
        rows.push(obj);
      }
      return { headers: headers, rows: rows };
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('parseExcelToHeadersRows:', e);
      return { headers: [], rows: [] };
    }
  }

  function initConferirPlanilha() {
    var bancoInput = document.getElementById('ncm-planilha-banco-file');
    var fileInput = document.getElementById('ncm-planilha-file');
    var runBtn = document.getElementById('ncm-planilha-run-btn');
    var bancoFileNameEl = document.getElementById('ncm-planilha-banco-file-name');
    var fileNameEl = document.getElementById('ncm-planilha-file-name');
    var loadingEl = document.getElementById('ncm-planilha-loading');
    var loadingText = document.getElementById('ncm-planilha-loading-text');
    var summaryEl = document.getElementById('ncm-planilha-summary');
    var reportWrap = document.getElementById('ncm-planilha-report-wrap');
    var reportTbody = document.getElementById('ncm-planilha-report-tbody');
    var emptyEl = document.getElementById('ncm-planilha-empty');
    var reportActionsEl = document.getElementById('ncm-planilha-report-actions');
    var gerarRelatorioBtn = document.getElementById('ncm-planilha-gerar-relatorio-btn');
    var lastAllResults = [];
    if (!bancoInput || !fileInput || !runBtn || !reportTbody) return;

    function updateRunButton() {
      var hasBanco = bancoInput.files && bancoInput.files[0];
      var hasPlanilha = fileInput.files && fileInput.files[0];
      runBtn.disabled = !(hasBanco && hasPlanilha);
    }

    function clearReports() {
      summaryEl.style.display = 'none';
      reportWrap.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'none';
      if (reportActionsEl) reportActionsEl.style.display = 'none';
      lastAllResults = [];
      reportTbody.innerHTML = '';
    }

    bancoInput.addEventListener('change', function () {
      var file = bancoInput.files && bancoInput.files[0];
      if (bancoFileNameEl) bancoFileNameEl.textContent = file ? file.name : '';
      clearReports();
      updateRunButton();
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (fileNameEl) fileNameEl.textContent = file ? file.name : '';
      clearReports();
      updateRunButton();
    });

    runBtn.addEventListener('click', function () {
      var bancoFile = bancoInput.files && bancoInput.files[0];
      var planilhaFile = fileInput.files && fileInput.files[0];
      if (!bancoFile || !planilhaFile) return;

      loadingEl.style.display = 'flex';
      loadingText.textContent = 'Lendo banco...';
      runBtn.disabled = true;
      reportWrap.style.display = 'none';
      emptyEl.style.display = 'none';
      summaryEl.style.display = 'none';
      reportTbody.innerHTML = '';

      // Banco é sempre CSV
      var readerBanco = new FileReader();
      readerBanco.onerror = function () {
        loadingEl.style.display = 'none';
        runBtn.disabled = false;
        if (typeof showToast === 'function') showToast('Erro ao ler o arquivo do banco.', 'error');
        else alert('Erro ao ler o arquivo do banco.');
      };
      readerBanco.onload = function () {
        var textBanco = (readerBanco.result || '').toString().replace(/^\uFEFF/, '');
        var parsedBanco = parseCsv(textBanco);
        var headersBanco = parsedBanco.headers || [];
        var idxProdBanco = findColunaProdutoPlanilha(headersBanco);
        var idxNcmBanco = findColunaNcmPlanilha(headersBanco);
        if (idxProdBanco < 0 || idxNcmBanco < 0) {
          loadingEl.style.display = 'none';
          runBtn.disabled = false;
          if (typeof showToast === 'function') showToast('O banco CSV deve ter colunas de produto (produto, descrição...) e ncm no cabeçalho.', 'warning');
          else alert('O banco CSV deve ter colunas de produto (produto, descrição...) e ncm no cabeçalho.');
          return;
        }

        var keyProdBanco = headersBanco[idxProdBanco];
        var keyNcmBanco = headersBanco[idxNcmBanco];

        // Montar índice do banco: exact map + lista de prefixos
        var bancoExact = {};
        var bancoPrefixList = [];
        for (var r = 0; r < parsedBanco.rows.length; r++) {
          var bRow = parsedBanco.rows[r];
          var bProd = (bRow[keyProdBanco] != null ? String(bRow[keyProdBanco]) : '').trim();
          var bNcm = (bRow[keyNcmBanco] != null ? String(bRow[keyNcmBanco]) : '').trim();
          if (!bProd || !bNcm) continue;
          if (bNcm.toUpperCase() === 'REVISAR') continue;
          var bNorm = normalizeProductName(bProd);
          bancoExact[bNorm] = { ncm: bNcm };
          bancoPrefixList.push({ normalized: bNorm, ncm: bNcm });
        }

        loadingText.textContent = 'Lendo planilha...';
        var readerPlanilha = new FileReader();
        readerPlanilha.onerror = function () {
          loadingEl.style.display = 'none';
          runBtn.disabled = false;
          if (typeof showToast === 'function') showToast('Erro ao ler a planilha.', 'error');
          else alert('Erro ao ler a planilha.');
        };
        readerPlanilha.onload = function () {
          var parsedPlanilha;
          if (isExcelFile(planilhaFile)) {
            parsedPlanilha = parseExcelToHeadersRows(readerPlanilha.result);
          } else {
            var textPlanilha = (readerPlanilha.result || '').toString().replace(/^\uFEFF/, '');
            parsedPlanilha = parseCsv(textPlanilha);
          }
          var headersPlanilha = parsedPlanilha.headers || [];
          var prodIdxPlanilha = findColunaProdutoPlanilha(headersPlanilha);
          var ncmIdxPlanilha = findColunaNcmPlanilha(headersPlanilha);
          if (prodIdxPlanilha < 0 || ncmIdxPlanilha < 0) {
            loadingEl.style.display = 'none';
            runBtn.disabled = false;
            if (typeof showToast === 'function') showToast('Planilha: não foi encontrada coluna de produto (produto, produtos, descrição...) ou coluna NCM.', 'warning');
            else alert('Planilha: não foi encontrada coluna de produto (produto, produtos, descrição...) ou coluna NCM.');
            return;
          }

          var keyProd = headersPlanilha[prodIdxPlanilha];
          var keyNcm = headersPlanilha[ncmIdxPlanilha];
          var rows = parsedPlanilha.rows || [];
          var totalLinhas = rows.length;
          var allResults = [];
          var i = 0;
          var CHUNK_SIZE = 500;

          function finish() {
            loadingEl.style.display = 'none';
            runBtn.disabled = false;
            lastAllResults = allResults.slice();

            var totalValidas = 0;
            var totalDivergentes = 0;
            for (var x = 0; x < allResults.length; x++) {
              if (allResults[x].situacao === 'Válida') totalValidas++;
              else totalDivergentes++;
            }

            if (summaryEl) {
              summaryEl.style.display = 'block';
              summaryEl.innerHTML =
                '<strong>Resumo:</strong> ' + allResults.length + ' produto(s) processado(s) — ' +
                '<strong style="color:#059669">' + totalValidas + ' válido(s)</strong>, ' +
                '<strong style="color:#d97706">' + totalDivergentes + ' divergente(s)</strong>.';
            }

            if (reportActionsEl) reportActionsEl.style.display = 'flex';

            if (allResults.length === 0) {
              if (emptyEl) {
                emptyEl.style.display = 'block';
                var p = emptyEl.querySelector('p');
                if (p) p.textContent = 'Nenhum produto encontrado na planilha.';
              }
              reportWrap.style.display = 'none';
            } else {
              if (emptyEl) emptyEl.style.display = 'none';
              reportWrap.style.display = 'block';
              for (var d = 0; d < allResults.length; d++) {
                var res = allResults[d];
                var isValida = res.situacao === 'Válida';
                var tr = document.createElement('tr');
                tr.className = isValida ? 'ncm-planilha-row-valida' : 'ncm-planilha-row-erro';
                var badgeClass = isValida ? 'ncm-situacao-valida' : 'ncm-situacao-divergente';
                var sugestaoHtml = isValida ? '' : escapeHtml(res.sugestao || '');
                tr.innerHTML =
                  '<td class="ncm-banco-cell-produto">' + escapeHtml(res.produto || '') + '</td>' +
                  '<td class="ncm-banco-cell-ncm">' + escapeHtml(res.ncmPlanilha || '') + '</td>' +
                  '<td class="ncm-banco-cell-resultado"><span class="ncm-situacao-badge ' + badgeClass + '">' + escapeHtml(res.situacao) + '</span></td>' +
                  '<td class="ncm-banco-cell-detalhe">' + sugestaoHtml + '</td>';
                reportTbody.appendChild(tr);
              }
            }
          }

          function processChunk() {
            var end = Math.min(i + CHUNK_SIZE, totalLinhas);
            for (; i < end; i++) {
              var row = rows[i];
              var produto = (row[keyProd] != null ? String(row[keyProd]) : '').trim();
              var ncmRaw = (row[keyNcm] != null ? String(row[keyNcm]) : '').trim();
              var ncm8 = normalizarNcm8Local(ncmRaw);
              if (!produto) continue;

              var hit = findProductInBanco(produto, bancoExact, bancoPrefixList);
              if (!hit.found) {
                allResults.push({ produto: produto, ncmPlanilha: ncmRaw || ncm8, situacao: 'Divergente', sugestao: 'Informação em Falta' });
              } else {
                var ncmBanco8 = normalizarNcm8Local(hit.ncm);
                if (ncm8 && ncm8 === ncmBanco8) {
                  allResults.push({ produto: produto, ncmPlanilha: ncmRaw || ncm8, situacao: 'Válida', sugestao: '' });
                } else {
                  allResults.push({ produto: produto, ncmPlanilha: ncmRaw || ncm8, situacao: 'Divergente', sugestao: hit.ncm });
                }
              }
            }

            if (loadingText) loadingText.textContent = 'Processando... ' + Math.min(i, totalLinhas) + '/' + totalLinhas;
            if (i >= totalLinhas) { finish(); return; }
            setTimeout(processChunk, 0);
          }

          processChunk();
        };
        if (isExcelFile(planilhaFile)) readerPlanilha.readAsArrayBuffer(planilhaFile);
        else readerPlanilha.readAsText(planilhaFile, 'UTF-8');
      };
      readerBanco.readAsText(bancoFile, 'UTF-8');
    });

    if (gerarRelatorioBtn) {
      gerarRelatorioBtn.addEventListener('click', function () {
        if (typeof XLSX === 'undefined') {
          if (typeof showToast === 'function') showToast('Biblioteca SheetJS não carregada. Não é possível gerar Excel.', 'error');
          else alert('Biblioteca SheetJS não carregada. Não é possível gerar Excel.');
          return;
        }
        if (lastAllResults.length === 0) {
          if (typeof showToast === 'function') showToast('Nenhum dado para exportar. Execute uma conferência primeiro.', 'warning');
          else alert('Nenhum dado para exportar. Execute uma conferência primeiro.');
          return;
        }
        try {
          var wb = XLSX.utils.book_new();
          var dados = [['Produto', 'NCM da planilha', 'Situação', 'Sugestão/Informação']];
          for (var d = 0; d < lastAllResults.length; d++) {
            var r = lastAllResults[d];
            dados.push([r.produto || '', r.ncmPlanilha || '', r.situacao || '', r.sugestao || '']);
          }
          var sheet = XLSX.utils.aoa_to_sheet(dados);
          XLSX.utils.book_append_sheet(wb, sheet, 'Conferencia NCM');
          var nomeArquivo = 'relatorio_conferencia_ncm_' + new Date().toISOString().slice(0, 10) + '.xlsx';
          XLSX.writeFile(wb, nomeArquivo);
          if (typeof showToast === 'function') showToast('Relatório gerado: ' + nomeArquivo, 'success');
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) console.error('Gerar relatório:', e);
          if (typeof showToast === 'function') showToast('Erro ao gerar relatório.', 'error');
          else alert('Erro ao gerar relatório.');
        }
      });
    }
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
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-ncm-tab');
        if (t) switchTab(t);
      });
    });

    initConsultaNcm();
    initConferirPlanilha();
  }

  ready(initTabs);
})();
