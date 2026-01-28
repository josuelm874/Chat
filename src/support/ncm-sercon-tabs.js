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
  }

  ready(initTabs);
})();
