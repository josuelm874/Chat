/**
 * NCM Tabs - Troca de abas + Consulta de NCM (produto → NCM ou código → vigência + TIPI).
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

  /** Verifica se o texto é principalmente um código NCM (8 dígitos, com ou sem pontos). */
  function isNcmCode(str) {
    var s = String(str || '').trim();
    var digits = s.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 12 && /^\d[\d.]*$/.test(s.replace(/\s/g, ''));
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

    async function doSearch() {
      var q = (input.value || '').trim();
      if (!q) {
        if (typeof showToast === 'function') showToast('Digite o produto ou código NCM.', 'warning');
        else alert('Digite o produto ou código NCM.');
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

      /* Pesquisa por código NCM (8 dígitos): vigência + TIPI */
      if (isNcmCode(q)) {
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
            '<p class="ncm-venc-hint">Pesquise pelo <strong>nome do produto</strong> nesta mesma consulta para obter sugestões de NCM vigente.</p>' +
            '</div>';
        } else {
          var tipi = getTipiByCodigo(ncm.codigo);
          grid.innerHTML = renderVencimento(ncm, tipi);
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="bx bx-search"></i> Buscar';
        return;
      }

      /* Pesquisa por nome do produto: API (Wikipedia) para enriquecer, depois busca hierárquica */
      var texto = q;
      if (window.ncmWikipedia && typeof window.ncmWikipedia.enriquecerComWikipedia === 'function') {
        try {
          var wiki = await window.ncmWikipedia.enriquecerComWikipedia(q);
          if (wiki.wikiUsado && wiki.textoEnriquecido) texto = wiki.textoEnriquecido;
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) console.warn('ncm wikipedia', e);
        }
      }

      var list = [];
      if (window.ncmMotor.sugerirNCMHierarquico) {
        list = window.ncmMotor.sugerirNCMHierarquico(texto, { limit: 20 });
        if (list.length < 5 && window.ncmMotor.sugerirNCM) {
          var rulesList = window.ncmMotor.sugerirNCM(texto, { limit: 20, prefer8: true });
          var seen = {};
          list.forEach(function (x) { seen[x.codigo] = true; });
          rulesList.forEach(function (x) {
            if (!seen[x.codigo]) { seen[x.codigo] = true; list.push(x); }
          });
          list.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
          list = list.slice(0, 20);
        }
      } else {
        list = window.ncmMotor.sugerirNCM(texto, { limit: 20, prefer8: true });
      }

      if (window.ncmMotor.filtrarResultadosPorProduto) {
        list = window.ncmMotor.filtrarResultadosPorProduto(list, q);
      }

      if (list && list.length > 0) {
        grid.innerHTML = renderCards(list, 'rules');
      } else {
        var emptyHtml = function (produto) {
          return '<div class="ncm-empty">' +
            '<i class="bx bx-info-circle"></i>' +
            '<p>Nenhuma NCM encontrada para &quot;' + escapeHtml(produto) + '&quot;. Tente termos mais genéricos.</p>' +
            '<div class="ncm-learn-block" data-product="' + escapeHtml(produto) + '">' +
            '<p class="ncm-learn-hint">Se você conhece a NCM correta, informe abaixo para que o sistema aprenda nas próximas buscas:</p>' +
            '<div class="ncm-learn-form">' +
            '<input type="text" class="ncm-learn-input" placeholder="Ex: 07143000" maxlength="12" inputmode="numeric" autocomplete="off">' +
            '<button type="button" class="ncm-learn-btn"><i class="bx bx-book-add"></i> Salvar e aprender</button>' +
            '</div>' +
            '</div>';
        };
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
              if (window.ncmMotor.filtrarResultadosPorProduto) {
                sim = window.ncmMotor.filtrarResultadosPorProduto(sim, q);
              }
              if (sim.length > 0) {
                grid.innerHTML = '<p class="ncm-fallback-label"><i class="bx bx-brain"></i> Sugestões por <strong>IA</strong> (similaridade + filtros):</p>' +
                  renderCards(sim, 'embedding');
              } else {
                grid.innerHTML = emptyHtml(q);
              }
            } else {
              grid.innerHTML = emptyHtml(q);
            }
          } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('ncm embeddings fallback', e);
            grid.innerHTML = emptyHtml(q);
          }
        } else {
          grid.innerHTML = emptyHtml(q);
        }
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-search"></i> Buscar';
    }

    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doSearch(); });
    btn.addEventListener('click', doSearch);

    results.addEventListener('click', function (e) {
      var btnEl = e.target && (e.target.classList.contains('ncm-learn-btn') ? e.target : e.target.closest('.ncm-learn-btn'));
      if (!btnEl) return;
      var block = btnEl.closest('.ncm-learn-block');
      if (!block) return;
      var produto = (block.getAttribute('data-product') || '').trim();
      if (!produto) return;
      var inputEl = block.querySelector('.ncm-learn-input');
      var codigo = inputEl ? String(inputEl.value || '').replace(/\D/g, '').slice(0, 8) : '';
      if (codigo.length !== 8) {
        if (typeof showToast === 'function') showToast('Informe um código NCM válido (8 dígitos).', 'warning');
        else alert('Informe um código NCM válido (8 dígitos).');
        return;
      }
      var ncm = window.ncmMotor && window.ncmMotor.buscarPorCodigo ? window.ncmMotor.buscarPorCodigo(codigo) : null;
      if (!ncm) {
        if (typeof showToast === 'function') showToast('NCM não encontrada na tabela vigente. Verifique o código.', 'error');
        else alert('NCM não encontrada na tabela vigente. Verifique o código.');
        return;
      }
      var termosNcm = [ncm.descricao2 || '', ncm.descricao4 || '', ncm.descricao6 || '', ncm.descricao || ''].filter(Boolean).join(' ');
      var termosProduto = produto.replace(/\s+/g, ' ');
      if (window.ncmMotor.addNcmAlias) window.ncmMotor.addNcmAlias(codigo, termosProduto + ' ' + termosNcm);
      if (window.ncmMotor.addQuerySynonym) {
        var tokens = (termosNcm + ' ' + termosProduto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 3; });
        var firstWord = (produto.split(/\s+/)[0] || '').trim();
        if (firstWord.length >= 3 && tokens.length) window.ncmMotor.addQuerySynonym(firstWord, tokens.slice(0, 12));
      }
      if (typeof showToast === 'function') showToast('NCM ' + (ncm.codigoFormatado || codigo) + ' associada. Na próxima busca o sistema usará essa associação.', 'success');
      else alert('Salvo! Na próxima busca o sistema considerará essa associação.');
      input.value = produto;
      doSearch();
    });
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
