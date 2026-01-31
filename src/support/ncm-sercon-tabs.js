/**
 * NCM Tabs - Troca de abas + Consulta de Produto (motor correlação produto → NCM).
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

  function initConsultaProduto() {
    var input = document.getElementById('ncm-produto-search');
    var btn = document.getElementById('ncm-produto-search-btn');
    var results = document.getElementById('ncm-produto-results');
    var grid = document.getElementById('ncm-produto-results-grid');
    if (!input || !btn || !results || !grid) return;

    function renderCards(list, kind) {
      var label = kind === 'embedding' ? ' similaridade ' : ' relevância ';
      return list.map(function (item) {
        var d4 = (item.descricao4 || '').trim();
        var d6 = (item.descricao6 || '').trim();
        var d8 = (item.descricao || '').trim();
        var boxes = '';
        if (d4) boxes += '<div class="ncm-desc-box ncm-desc-box-4"><span class="ncm-desc-label">4 díg.</span><span class="ncm-desc-text">' + escapeHtml(d4) + '</span></div>';
        if (d6) boxes += '<div class="ncm-desc-box ncm-desc-box-6"><span class="ncm-desc-label">6 díg.</span><span class="ncm-desc-text">' + escapeHtml(d6) + '</span></div>';
        if (d8) boxes += '<div class="ncm-desc-box ncm-desc-box-8"><span class="ncm-desc-label">8 díg.</span><span class="ncm-desc-text">' + escapeHtml(d8) + '</span></div>';
        return '<div class="ncm-produto-card">' +
          '<div class="ncm-produto-card-head">' +
          '<strong class="ncm-produto-code">' + escapeHtml(item.codigoFormatado) + '</strong>' +
          '<span class="ncm-produto-score">Cap. ' + escapeHtml(item.capitulo) + ' &bull;' + label + (item.score || 0).toFixed(2) + '</span>' +
          '</div>' +
          '<div class="ncm-desc-boxes">' + boxes + '</div>' +
          '</div>';
      }).join('');
    }

    async function doSearch() {
      var q = (input.value || '').trim();
      if (!q) {
        if (typeof showToast === 'function') showToast('Digite o nome do produto.', 'warning');
        else alert('Digite o nome do produto.');
        return;
      }
      if (!window.ncmMotor || !window.ncmMotor.isReady()) {
        if (typeof showToast === 'function') showToast('Tabela NCM ainda não carregada. Aguarde.', 'error');
        else alert('Tabela NCM ainda não carregada. Aguarde.');
        return;
      }
      btn.disabled = true;
      btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Buscando...';
      results.style.display = 'block';
      grid.innerHTML = '';

      var texto = q;
      if (window.ncmWikipedia && typeof window.ncmWikipedia.enriquecerComWikipedia === 'function') {
        try {
          var wiki = await window.ncmWikipedia.enriquecerComWikipedia(q);
          if (wiki.wikiUsado && wiki.textoEnriquecido) texto = wiki.textoEnriquecido;
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) console.warn('ncm wikipedia', e);
        }
      }

      var list = window.ncmMotor.sugerirNCM(texto, { limit: 20, prefer8: true });

      if (list && list.length > 0) {
        grid.innerHTML = renderCards(list, 'rules');
      } else {
        grid.innerHTML = '<div class="ncm-empty"><i class="bx bx-info-circle"></i><p>Nenhuma NCM por regras para &quot;' + escapeHtml(q) + '&quot;.</p></div>';
        if (window.ncmEmbeddings && typeof window.ncmEmbeddings.sugerirNCMEmbeddings === 'function') {
          try {
            var motor = window.ncmMotor;
            var iaOpts = {
              limit: 20,
              minSimilarity: 0.28,
              requireTokenOverlap: true,
              chapterHint: motor && motor.getChapterHint ? motor.getChapterHint(texto) : null,
              tokens: motor && motor.getExpandedTokensForProduct ? motor.getExpandedTokensForProduct(texto) : (motor && motor.getTokensForProduct ? motor.getTokensForProduct(texto) : null)
            };
            var sim = await window.ncmEmbeddings.sugerirNCMEmbeddings(texto, iaOpts);
            if (sim && sim.length > 0) {
              grid.innerHTML = '<p class="ncm-fallback-label"><i class="bx bx-brain"></i> Sugestões por <strong>IA</strong> (similaridade + filtros):</p>' +
                renderCards(sim, 'embedding');
            } else {
              grid.innerHTML = '<div class="ncm-empty"><i class="bx bx-info-circle"></i><p>Nenhuma NCM encontrada para &quot;' + escapeHtml(q) + '&quot;. Tente termos mais genéricos.</p></div>';
            }
          } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('ncm embeddings fallback', e);
            grid.innerHTML = '<div class="ncm-empty"><i class="bx bx-info-circle"></i><p>Nenhuma NCM encontrada para &quot;' + escapeHtml(q) + '&quot;. Tente termos mais genéricos.</p></div>';
          }
        } else {
          grid.innerHTML = '<div class="ncm-empty"><i class="bx bx-info-circle"></i><p>Nenhuma NCM encontrada para &quot;' + escapeHtml(q) + '&quot;. Tente termos mais genéricos.</p></div>';
        }
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-search"></i> Buscar NCM';
    }

    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doSearch(); });
    btn.addEventListener('click', doSearch);
  }

  /**
   * Busca dados TIPI por código NCM (8 dígitos). Estrutura: Level -> capitulos -> ncms[codigo].
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

  function initControleVencimentos() {
    var input = document.getElementById('ncm-venc-input');
    var btn = document.getElementById('ncm-venc-btn');
    var results = document.getElementById('ncm-venc-results');
    var inner = document.getElementById('ncm-venc-results-inner');
    if (!input || !btn || !results || !inner) return;

    function renderVencimento(ncm, tipi) {
      var d4 = (ncm.descricao4 || '').trim();
      var d6 = (ncm.descricao6 || '').trim();
      var d8 = (ncm.descricao || '').trim();
      var boxes = '';
      if (d4) boxes += '<div class="ncm-desc-box ncm-desc-box-4"><span class="ncm-desc-label">4 díg.</span><span class="ncm-desc-text">' + escapeHtml(d4) + '</span></div>';
      if (d6) boxes += '<div class="ncm-desc-box ncm-desc-box-6"><span class="ncm-desc-label">6 díg.</span><span class="ncm-desc-text">' + escapeHtml(d6) + '</span></div>';
      if (d8) boxes += '<div class="ncm-desc-box ncm-desc-box-8"><span class="ncm-desc-label">8 díg.</span><span class="ncm-desc-text">' + escapeHtml(d8) + '</span></div>';

      var reducao = tipi ? tipi.reducao_aliquota : 0;
      var cst = tipi ? tipi.cst : '001';
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

    function doVerify() {
      var raw = (input.value || '').trim();
      if (!raw) {
        if (typeof showToast === 'function') showToast('Digite o código NCM.', 'warning');
        else alert('Digite o código NCM.');
        return;
      }
      if (!window.ncmMotor || !window.ncmMotor.isReady()) {
        if (typeof showToast === 'function') showToast('Tabela NCM ainda não carregada. Aguarde.', 'error');
        else alert('Tabela NCM ainda não carregada. Aguarde.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verificando...';
      results.style.display = 'block';
      inner.innerHTML = '';

      var ncm = window.ncmMotor.buscarPorCodigo(raw);

      if (!ncm) {
        var codFmt = raw.replace(/\D/g, '');
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
        inner.innerHTML = '<div class="ncm-venc-vencida">' +
          '<i class="bx bx-error-circle"></i>' +
          '<h3>NCM vencida</h3>' +
          '<p>A NCM <strong>' + escapeHtml(codFmt || raw) + '</strong> não consta na Tabela NCM vigente. Ela pode estar desatualizada ou ter sido substituída.</p>' +
          sugestaoHtml +
          '<p class="ncm-venc-hint">Consulte a tabela vigente ou utilize a aba &quot;Consulta de Produto&quot; para obter a NCM correta.</p>' +
          '</div>';
      } else {
        var tipi = getTipiByCodigo(ncm.codigo);
        inner.innerHTML = renderVencimento(ncm, tipi);
      }

      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-search"></i> Verificar vencimento';
    }

    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doVerify(); });
    btn.addEventListener('click', doVerify);
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

    initConsultaProduto();
    initControleVencimentos();
  }

  ready(initTabs);
})();
