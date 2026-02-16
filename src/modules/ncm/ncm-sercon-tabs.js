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
    initCorrelacao();
  }

  function initCorrelacao() {
    var inputProduto = document.getElementById('ncm-correlacao-produto');
    var inputNcm = document.getElementById('ncm-correlacao-ncm');
    var btn = document.getElementById('ncm-correlacao-btn');
    var resultArea = document.getElementById('ncm-correlacao-result');
    var resultBox = document.getElementById('ncm-correlacao-result-box');
    if (!inputProduto || !inputNcm || !btn || !resultBox) return;

    if (window.ncmCorrelacao && typeof window.ncmCorrelacao.carregarIncompatibilidades === 'function') {
      window.ncmCorrelacao.carregarIncompatibilidades();
    }

    function isNcmCode(str) {
      var s = String(str || '').trim();
      var digits = s.replace(/\D/g, '');
      return digits.length >= 8 && digits.length <= 12 && /^\d[\d.]*$/.test(s.replace(/\s/g, ''));
    }

    function doValidar() {
      var produto = (inputProduto.value || '').trim();
      var ncm = (inputNcm.value || '').trim();
      if (!produto) {
        if (typeof showToast === 'function') showToast('Informe o nome do produto.', 'warning');
        else alert('Informe o nome do produto.');
        return;
      }
      if (!ncm) {
        if (typeof showToast === 'function') showToast('Informe o código NCM (8 dígitos).', 'warning');
        else alert('Informe o código NCM (8 dígitos).');
        return;
      }
      if (!isNcmCode(ncm)) {
        if (typeof showToast === 'function') showToast('Código NCM inválido. Use 8 dígitos (ex: 22021000 ou 2202.10.00).', 'warning');
        else alert('Código NCM inválido.');
        return;
      }

      resultArea.style.display = 'block';
      resultBox.innerHTML = '<p class="ncm-correlacao-loading"><i class="bx bx-loader-alt bx-spin"></i> Validando...</p>';
      btn.disabled = true;
      btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Validando...';

      var descricao = '';
      if (window.ncmMotor && window.ncmMotor.buscarPorCodigo) {
        var item = window.ncmMotor.buscarPorCodigo(ncm);
        if (item) descricao = (item.descricaoCompleta || item.descricao || '').trim();
      }

      var prom = window.ncmCorrelacao && typeof window.ncmCorrelacao.validarNcm === 'function'
        ? window.ncmCorrelacao.validarNcm(produto, ncm, descricao)
        : Promise.resolve('ERRO');

      prom.then(function (resultado) {
        var cls = 'ncm-correlacao-sim';
        if (resultado === 'NAO') cls = 'ncm-correlacao-nao';
        else if (resultado === 'REVISAR' || resultado === 'ERRO') cls = 'ncm-correlacao-revisar';
        var msg = resultado;
        if (resultado === 'REVISAR') msg = 'Revisar manualmente';
        if (resultado === 'ERRO') msg = 'Erro (Ollama indisponível ou timeout)';
        resultBox.innerHTML = '<div class="ncm-correlacao-result-item ' + cls + '">' +
          '<span class="ncm-correlacao-label">' + escapeHtml(msg) + '</span></div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bx bx-check-circle"></i> Validar';
      }).catch(function () {
        resultBox.innerHTML = '<div class="ncm-correlacao-result-item ncm-correlacao-revisar">' +
          '<span class="ncm-correlacao-label">Erro ao validar.</span></div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bx bx-check-circle"></i> Validar';
      });
    }

    btn.addEventListener('click', doValidar);
    inputNcm.addEventListener('keypress', function (e) { if (e.key === 'Enter') doValidar(); });
    inputProduto.addEventListener('keypress', function (e) { if (e.key === 'Enter') doValidar(); });
  }

  ready(initTabs);
})();
