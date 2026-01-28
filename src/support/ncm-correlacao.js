/**
 * NCM Correlação – Importar planilha, verificar produto × NCM, exportar resultado.
 * Depende: ncm-motor (correlacionar), Tabela_NCM. Opcional: SheetJS (XLSX).
 */

(function () {
  'use strict';

  var PRODUTO_KEYS = ['produto', 'descricao', 'descriçao', 'nome', 'item', 'produto descricao', 'descricao produto'];
  var NCM_KEYS = ['ncm', 'codigo ncm', 'cod ncm', 'ncm produto', 'codigo ncm produto', 'codigo'];

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    var d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function normalizeHeader(h) {
    return String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findColumnIndex(headers, keys) {
    var i, n, k;
    for (i = 0; i < headers.length; i++) {
      n = normalizeHeader(headers[i]);
      for (k = 0; k < keys.length; k++) {
        if (n === keys[k] || n.indexOf(keys[k]) === 0) return i;
      }
    }
    return -1;
  }

  function parseCSV(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    if (lines.length < 2) return { headers: [], rows: [] };
    var delim = lines[0].indexOf(';') !== -1 ? ';' : ',';
    var headers = lines[0].split(delim).map(function (c) { return c.trim().replace(/^"|"$/g, ''); });
    var rows = [];
    var i, parts, j;
    for (i = 1; i < lines.length; i++) {
      parts = lines[i].split(delim).map(function (c) { return c.trim().replace(/^"|"$/g, ''); });
      if (parts.some(function (p) { return p.length > 0; })) rows.push(parts);
    }
    return { headers: headers, rows: rows };
  }

  function parseXLSX(ab) {
    var X = typeof window !== 'undefined' && window.XLSX;
    if (!X) return { headers: [], rows: [], error: 'SheetJS não carregado. Use CSV ou adicione script XLSX.' };
    var wb = X.read(ab, { type: 'array' });
    var first = wb.SheetNames[0];
    var sh = wb.Sheets[first];
    var arr = X.utils.sheet_to_json(sh, { header: 1 });
    if (!arr || arr.length < 2) return { headers: [], rows: [] };
    var headers = arr[0].map(function (c) { return String(c || '').trim(); });
    var rows = [];
    var i, row, r;
    for (i = 1; i < arr.length; i++) {
      row = arr[i];
      if (!row) continue;
      r = headers.map(function (_, j) { return String((row[j] != null ? row[j] : '')).trim(); });
      if (r.some(function (p) { return p.length > 0; })) rows.push(r);
    }
    return { headers: headers, rows: rows };
  }

  async function runCorrelacao(rows, colProd, colNcm) {
    var motor = window.ncmMotor;
    var embeddings = typeof window !== 'undefined' && window.ncmEmbeddings;
    var wiki = typeof window !== 'undefined' && window.ncmWikipedia;
    if (!motor || typeof motor.correlacionar !== 'function') return [];
    var out = [];
    var i, r, produto, ncm, texto, res, sim, iaOpts, w;
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      produto = (r[colProd] != null ? String(r[colProd]) : '').trim();
      ncm = (r[colNcm] != null ? String(r[colNcm]) : '').trim();
      if (!produto && !ncm) continue;
      texto = produto;
      if (wiki && typeof wiki.enriquecerComWikipedia === 'function') {
        try {
          w = await wiki.enriquecerComWikipedia(produto);
          if (w.wikiUsado && w.textoEnriquecido) texto = w.textoEnriquecido;
        } catch (e) {}
      }
      res = motor.correlacionar(texto, ncm);
      if ((!res.sugestoes || res.sugestoes.length === 0) && embeddings && typeof embeddings.sugerirNCMEmbeddings === 'function') {
        iaOpts = {
          limit: 5,
          minSimilarity: 0.28,
          requireTokenOverlap: true,
          chapterHint: motor.getChapterHint ? motor.getChapterHint(texto) : null,
          tokens: motor.getExpandedTokensForProduct ? motor.getExpandedTokensForProduct(texto) : (motor.getTokensForProduct ? motor.getTokensForProduct(texto) : null)
        };
        try {
          sim = await embeddings.sugerirNCMEmbeddings(texto, iaOpts);
          if (sim && sim.length > 0) {
            res.sugestoes = sim;
            res.mensagem = 'NCM pode não corresponder. Sugestões por IA (similaridade + filtros).';
          }
        } catch (e) {}
      }
      out.push({
        index: i + 1,
        produto: produto,
        ncm: ncm,
        ok: res.ok,
        mensagem: res.mensagem || '',
        sugestoes: (res.sugestoes || []).slice(0, 5),
        ncmFormatado: res.ncmInformadoFormatado || ''
      });
    }
    return out;
  }

  function init() {
    var fileInput = document.getElementById('ncm-correlacao-file');
    var fileName = document.getElementById('ncm-correlacao-file-name');
    var verifyBtn = document.getElementById('ncm-correlacao-verify-btn');
    var resultsEl = document.getElementById('ncm-correlacao-results');
    var tbody = document.getElementById('ncm-correlacao-tbody');
    var exportBtn = document.getElementById('ncm-correlacao-export-btn');

    var lastFile = null;
    var lastResult = [];

    if (!fileInput || !verifyBtn || !tbody) return;

    function toast(msg, type) {
      if (typeof showToast === 'function') showToast(msg, type || 'info');
      else alert(msg);
    }

    function setBusy(b) {
      verifyBtn.disabled = b;
      verifyBtn.innerHTML = b
        ? '<i class="bx bx-loader-alt bx-spin"></i> Verificando...'
        : '<i class="bx bx-check-double"></i> Verificar correlação';
    }

    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      lastFile = f || null;
      if (fileName) fileName.textContent = f ? f.name : 'Nenhum arquivo selecionado';
      verifyBtn.disabled = !f;
    });

    verifyBtn.addEventListener('click', function () {
      if (!lastFile) {
        toast('Selecione uma planilha (CSV ou XLSX).', 'warning');
        return;
      }
      if (!window.ncmMotor || !window.ncmMotor.isReady()) {
        toast('Tabela NCM ainda não carregada. Aguarde.', 'error');
        return;
      }

      var ext = (lastFile.name || '').toLowerCase();
      var isCsv = ext.endsWith('.csv');
      var isXlsx = ext.endsWith('.xlsx') || ext.endsWith('.xls');

      if (!isCsv && !isXlsx) {
        toast('Use arquivo CSV ou XLSX.', 'warning');
        return;
      }

      setBusy(true);
      lastResult = [];

      async function onParsed(data) {
        var headers = data.headers || [];
        var rows = data.rows || [];
        if (data.error) {
          setBusy(false);
          toast(data.error, 'error');
          return;
        }
        var colProd = findColumnIndex(headers, PRODUTO_KEYS);
        var colNcm = findColumnIndex(headers, NCM_KEYS);
        if (colProd === -1 || colNcm === -1) {
          setBusy(false);
          toast('Planilha deve ter colunas "Produto" (ou Descrição/Nome) e "NCM" (ou Código NCM).', 'error');
          return;
        }
        lastResult = await runCorrelacao(rows, colProd, colNcm);
        renderTable(lastResult);
        resultsEl.style.display = 'block';
        setBusy(false);
        toast('Correlação concluída: ' + lastResult.length + ' linha(s) verificada(s).', 'success');
      }

      if (isCsv) {
        var reader = new FileReader();
        reader.onload = async function () {
          var text = (reader.result || '').replace(/\uFEFF/g, '');
          await onParsed(parseCSV(text));
        };
        reader.onerror = function () {
          setBusy(false);
          toast('Erro ao ler o arquivo.', 'error');
        };
        reader.readAsText(lastFile, 'UTF-8');
      } else {
        var r2 = new FileReader();
        r2.onload = async function () {
          await onParsed(parseXLSX(r2.result));
        };
        r2.onerror = function () {
          setBusy(false);
          toast('Erro ao ler o arquivo.', 'error');
        };
        r2.readAsArrayBuffer(lastFile);
      }
    });

    function renderTable(results) {
      var html = '';
      var i, r, statusClass, statusText, sugs;
      for (i = 0; i < results.length; i++) {
        r = results[i];
        statusClass = r.ok ? 'ncm-corr-ok' : 'ncm-corr-revisar';
        statusText = r.ok ? 'OK' : 'Revisar';
        sugs = (r.sugestoes || []).map(function (s) {
          return escapeHtml((s.codigoFormatado || s.codigo || '') + ' ' + (s.descricao || '').slice(0, 60));
        }).join(', ') || '—';
        html += '<tr class="' + statusClass + '">' +
          '<td>' + escapeHtml(r.index) + '</td>' +
          '<td>' + escapeHtml(r.produto) + '</td>' +
          '<td>' + escapeHtml(r.ncmFormatado || r.ncm) + '</td>' +
          '<td><span class="ncm-corr-badge ' + statusClass + '">' + statusText + '</span></td>' +
          '<td class="ncm-corr-sugestoes">' + sugs + '</td>' +
          '</tr>';
      }
      tbody.innerHTML = html || '<tr><td colspan="5">Nenhuma linha para exibir.</td></tr>';
    }

    exportBtn.addEventListener('click', function () {
      if (!lastResult.length) {
        toast('Execute a verificação antes de exportar.', 'warning');
        return;
      }
      var BOM = '\uFEFF';
      var lines = ['#;Produto;NCM na planilha;Status;Sugestões'];
      var i, r, sugs;
      for (i = 0; i < lastResult.length; i++) {
        r = lastResult[i];
        sugs = (r.sugestoes || []).map(function (s) {
          return (s.codigoFormatado || s.codigo || '') + ' ' + (s.descricao || '').slice(0, 80);
        }).join(' | ');
        lines.push([
          r.index,
          '"' + (r.produto || '').replace(/"/g, '""') + '"',
          r.ncmFormatado || r.ncm,
          r.ok ? 'OK' : 'Revisar',
          '"' + (sugs || '—').replace(/"/g, '""') + '"'
        ].join(';'));
      }
      var blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ncm-correlacao-resultado.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('CSV exportado.', 'success');
    });
  }

  ready(init);
})();
