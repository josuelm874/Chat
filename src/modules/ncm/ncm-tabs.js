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

  var MATCH_MIN_CONFIDENCE = 0.81;
  var MATCH_AMBIGUITY_DELTA = 0.02;
  var PRODUCT_TOKEN_STOPWORDS = {
    DE: true, DA: true, DO: true, DAS: true, DOS: true,
    COM: true, SEM: true, PARA: true, POR: true, E: true
  };
  var PRODUCT_NOISE_TOKENS = {
    ML: true, M: true, KG: true, G: true, L: true, LT: true, LITRO: true, LITROS: true,
    UN: true, UND: true, UNID: true, UNIDADE: true, UNIDADES: true,
    CX: true, CXA: true, CAIXA: true, PCT: true, PACOTE: true, PCTE: true,
    FD: true, FARDO: true, C: true
  };
  var PRODUCT_ANCHOR_TOKENS = {
    ALISAMENTO: true, CAPILAR: true, CONDICIONADOR: true, CREME: true,
    DESCOLORANTE: true, ACUCAR: true, CRISTAL: true
  };
  var PRODUCT_ABBREVIATIONS = {
    ABS: 'ABSORVENTE',
    ABSV: 'ABSORVENTE',
    ABSORV: 'ABSORVENTE',
    ALIS: 'ALISAMENTO',
    CAP: 'CAPILAR',
    CONDIC: 'CONDICIONADOR',
    COND: 'CONDICIONADOR',
    CR: 'CREME',
    CREM: 'CREME',
    LIQ: 'LIQUIDO',
    LIQD: 'LIQUIDO',
    LQ: 'LIQUIDO',
    ACUC: 'ACUCAR',
    ACUCR: 'ACUCAR',
    CUCAR: 'ACUCAR',
    UCAR: 'ACUCAR',
    CRIST: 'CRISTAL',
    DESINF: 'DESINFETANTE',
    DES: 'DESCOLORANTE',
    DETERG: 'DETERGENTE',
    DET: 'DETERGENTE',
    SAB: 'SABONETE',
    SABON: 'SABONETE',
    FRALD: 'FRALDA',
    FR: 'FRALDA',
    ALIM: 'ALIMENTO',
    BISC: 'BISCOITO',
    REFRI: 'REFRIGERANTE'
  };
  var PRODUCT_SYNONYMS_URL = '../../data/produto-sinonimos-template.json';
  var productSynonymsLoadPromise = null;

  /** Remove acentos e normaliza espaços/símbolos do texto. */
  function normalizeProductNameAdvanced(name) {
    var raw = String(name || '').trim().toUpperCase();
    if (!raw) return '';
    var semAcento = raw;
    try {
      semAcento = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (e) { semAcento = raw; }
    return semAcento
      .replace(/[�?]/g, 'C')
      .replace(/[^\w\s]/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toProductTokens(text) {
    var norm = normalizeProductNameAdvanced(text);
    if (!norm) return [];
    var parts = norm.split(' ');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var tk = parts[i];
      if (!tk) continue;
      if (tk.length < 2) continue;
      if (/^\d+$/.test(tk)) continue;
      if (/^\d+(ML|M|KG|G|L|LT)$/.test(tk)) continue;
      if (tk.length > 4 && tk.endsWith('S')) tk = tk.slice(0, -1);
      if (PRODUCT_TOKEN_STOPWORDS[tk]) continue;
      if (PRODUCT_NOISE_TOKENS[tk]) continue;
      out.push(tk);
    }
    return out;
  }

  function expandAbbreviations(tokens) {
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      out.push(PRODUCT_ABBREVIATIONS[tk] || tk);
    }
    return out;
  }

  function canonicalProductName(name) {
    return expandAbbreviations(toProductTokens(name)).join(' ');
  }

  function normalizeSynonymToken(token) {
    var norm = normalizeProductNameAdvanced(token || '');
    if (!norm) return '';
    if (norm.indexOf(' ') >= 0) return '';
    return norm;
  }

  function applySynonymPair(canonicalWord, variantWord) {
    var canonical = normalizeSynonymToken(canonicalWord);
    var variant = normalizeSynonymToken(variantWord);
    if (!canonical || !variant) return false;
    PRODUCT_ABBREVIATIONS[variant] = canonical;
    PRODUCT_ANCHOR_TOKENS[canonical] = true;
    return true;
  }

  function loadExternalSynonyms() {
    if (typeof fetch !== 'function') return Promise.resolve(0);
    return fetch(PRODUCT_SYNONYMS_URL, { cache: 'no-store' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function (data) {
        if (!data || typeof data !== 'object') return 0;
        var total = 0;
        var categoryNames = Object.keys(data);
        for (var c = 0; c < categoryNames.length; c++) {
          var categoryName = categoryNames[c];
          if (categoryName.indexOf('_') === 0) continue;
          var category = data[categoryName];
          if (!category || typeof category !== 'object' || Array.isArray(category)) continue;
          var canonicalWords = Object.keys(category);
          for (var i = 0; i < canonicalWords.length; i++) {
            var canonical = canonicalWords[i];
            var variants = category[canonical];
            if (!Array.isArray(variants)) continue;
            // Garante que a forma canônica também seja conhecida como âncora.
            applySynonymPair(canonical, canonical);
            for (var v = 0; v < variants.length; v++) {
              if (applySynonymPair(canonical, variants[v])) total++;
            }
          }
        }
        return total;
      });
  }

  function ensureProductSynonymsLoaded() {
    if (!productSynonymsLoadPromise) {
      productSynonymsLoadPromise = loadExternalSynonyms().catch(function (e) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('ncm-tabs: nao foi possivel carregar dicionario externo de sinonimos:', e);
        }
        return 0;
      });
    }
    return productSynonymsLoadPromise;
  }

  function tokenSet(tokens) {
    var set = {};
    for (var i = 0; i < tokens.length; i++) set[tokens[i]] = true;
    return set;
  }

  function computeTokenSimilarity(queryTokens, targetTokens) {
    if (!queryTokens.length || !targetTokens.length) return 0;
    var qSet = tokenSet(queryTokens);
    var tSet = tokenSet(targetTokens);
    var inter = 0;
    var uq = 0;
    var ut = 0;
    var k;
    for (k in qSet) { if (!Object.prototype.hasOwnProperty.call(qSet, k)) continue; uq++; if (tSet[k]) inter++; }
    for (k in tSet) { if (!Object.prototype.hasOwnProperty.call(tSet, k)) continue; ut++; }
    var union = uq + ut - inter;
    if (union <= 0 || uq <= 0) return 0;
    var coverageQuery = inter / uq;
    var jaccard = inter / union;
    var score = (coverageQuery * 0.75) + (jaccard * 0.25);
    var anchorMatches = 0;
    for (k in qSet) {
      if (!Object.prototype.hasOwnProperty.call(qSet, k)) continue;
      if (PRODUCT_ANCHOR_TOKENS[k] && tSet[k]) anchorMatches++;
    }
    if (anchorMatches > 0) score += Math.min(0.06, anchorMatches * 0.02);
    if (queryTokens[0] && targetTokens[0] && queryTokens[0] === targetTokens[0]) score += 0.03;
    return Math.max(0, Math.min(1, score));
  }

  function findTopCandidates(queryTokens, bancoEntries, limit) {
    var out = [];
    var max = Math.max(1, limit || 3);
    for (var i = 0; i < bancoEntries.length; i++) {
      var entry = bancoEntries[i];
      var score = computeTokenSimilarity(queryTokens, entry.tokens);
      if (score <= 0) continue;
      out.push({ entry: entry, score: score });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, max);
  }

  function makeMatchResult(entry, strategy, confidence) {
    return {
      found: true,
      ncm: entry.ncm,
      matchedProduct: entry.original,
      strategy: strategy,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  function formatMatchMeta(hit) {
    if (!hit || !hit.found) return '';
    var conf = Number(hit.confidence || 0);
    var confTxt = conf.toFixed(2);
    var strat = hit.strategy || 'desconhecido';
    var prod = hit.matchedProduct ? (' em "' + hit.matchedProduct + '"') : '';
    return 'Match: ' + strat + ' (' + confTxt + ')' + prod;
  }

  function buildBancoMatcherIndex(rows, keyProdBanco, keyNcmBanco) {
    var exact = {};
    var canonical = {};
    var entries = [];

    for (var r = 0; r < rows.length; r++) {
      var bRow = rows[r];
      var bProd = (bRow[keyProdBanco] != null ? String(bRow[keyProdBanco]) : '').trim();
      var bNcm = (bRow[keyNcmBanco] != null ? String(bRow[keyNcmBanco]) : '').trim();
      if (!bProd || !bNcm) continue;
      if (bNcm.toUpperCase() === 'REVISAR') continue;

      var norm = normalizeProductNameAdvanced(bProd);
      var canonicalName = canonicalProductName(bProd);
      var tokens = canonicalName ? canonicalName.split(' ').filter(Boolean) : [];
      if (!norm) continue;

      var entry = {
        original: bProd,
        normalized: norm,
        canonical: canonicalName,
        tokens: tokens,
        ncm: bNcm
      };
      entries.push(entry);
      if (!exact[norm]) exact[norm] = entry;
      if (canonicalName && !canonical[canonicalName]) canonical[canonicalName] = entry;
    }

    return { exact: exact, canonical: canonical, entries: entries };
  }

  /**
   * Match de produto em camadas:
   * 1) Exato normalizado
   * 2) Exato por abreviações/sinônimos (canônico)
   * 3) Prefixo canônico
   * 4) Similaridade de tokens (limiar conservador)
   */
  function findProductInBanco(produto, bancoIndex) {
    var norm = normalizeProductNameAdvanced(produto);
    if (!norm) return { found: false };

    var byExact = bancoIndex.exact[norm];
    if (byExact) return makeMatchResult(byExact, 'exato', 1);

    var queryCanonical = canonicalProductName(produto);
    if (!queryCanonical) return { found: false };

    var byCanonical = bancoIndex.canonical[queryCanonical];
    if (byCanonical) return makeMatchResult(byCanonical, 'abreviacao/sinonimo', 0.99);

    var queryTokens = queryCanonical.split(' ').filter(Boolean);
    for (var i = queryTokens.length; i >= 2; i--) {
      var prefix = queryTokens.slice(0, i).join(' ');
      for (var p = 0; p < bancoIndex.entries.length; p++) {
        var entryPrefix = bancoIndex.entries[p];
        if (entryPrefix.canonical === prefix || entryPrefix.canonical.indexOf(prefix + ' ') === 0) {
          var confPrefix = i >= 3 ? 0.93 : 0.88;
          return makeMatchResult(entryPrefix, 'prefixo-canonico', confPrefix);
        }
      }
    }

    var ranked = findTopCandidates(queryTokens, bancoIndex.entries, 3);
    var best = ranked.length > 0 ? ranked[0] : null;
    var second = ranked.length > 1 ? ranked[1] : null;

    if (!best || best.score < MATCH_MIN_CONFIDENCE) {
      return {
        found: false,
        candidates: ranked.map(function (r) {
          return { produto: r.entry.original, ncm: r.entry.ncm, confidence: Number(r.score.toFixed(2)) };
        })
      };
    }
    if (
      second &&
      (best.score - second.score) <= MATCH_AMBIGUITY_DELTA &&
      second.entry &&
      second.entry.ncm !== best.entry.ncm
    ) {
      return {
        found: false,
        candidates: ranked.map(function (r2) {
          return { produto: r2.entry.original, ncm: r2.entry.ncm, confidence: Number(r2.score.toFixed(2)) };
        })
      };
    }

    return makeMatchResult(best.entry, 'similaridade', best.score);
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
    var lastExtraHeaders = [];
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
      lastExtraHeaders = [];
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

    runBtn.addEventListener('click', async function () {
      var bancoFile = bancoInput.files && bancoInput.files[0];
      var planilhaFile = fileInput.files && fileInput.files[0];
      if (!bancoFile || !planilhaFile) return;

      loadingEl.style.display = 'flex';
      loadingText.textContent = 'Carregando dicionario...';
      runBtn.disabled = true;
      reportWrap.style.display = 'none';
      emptyEl.style.display = 'none';
      summaryEl.style.display = 'none';
      reportTbody.innerHTML = '';
      await ensureProductSynonymsLoaded();
      loadingText.textContent = 'Lendo banco...';

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

        // Montar índice do banco para matching em camadas
        var bancoIndex = buildBancoMatcherIndex(parsedBanco.rows, keyProdBanco, keyNcmBanco);

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

          lastExtraHeaders = [];
          for (var eh = 0; eh < headersPlanilha.length; eh++) {
            if (eh !== prodIdxPlanilha && eh !== ncmIdxPlanilha) {
              lastExtraHeaders.push(headersPlanilha[eh]);
            }
          }

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
            var totalNaoEncontrados = 0;
            for (var x = 0; x < allResults.length; x++) {
              if (allResults[x].situacao === 'Válida') totalValidas++;
              else if (allResults[x].situacao === 'Não encontrado') totalNaoEncontrados++;
              else totalDivergentes++;
            }

            if (summaryEl) {
              summaryEl.style.display = 'block';
              summaryEl.innerHTML =
                '<strong>Resumo:</strong> ' + allResults.length + ' produto(s) processado(s) — ' +
                '<strong style="color:#059669">' + totalValidas + ' válido(s)</strong>, ' +
                '<strong style="color:#d97706">' + totalDivergentes + ' divergente(s)</strong>, ' +
                '<strong style="color:#64748b">' + totalNaoEncontrados + ' não encontrado(s)</strong>.';
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
                var isNaoEncontrado = res.situacao === 'Não encontrado';
                var tr = document.createElement('tr');
                tr.className = isValida ? 'ncm-planilha-row-valida' : (isNaoEncontrado ? 'ncm-planilha-row-nao-encontrado' : 'ncm-planilha-row-erro');
                var badgeClass = isValida ? 'ncm-situacao-valida' : (isNaoEncontrado ? 'ncm-situacao-nao-encontrado' : 'ncm-situacao-divergente');
                var sugestaoHtml = escapeHtml(res.sugestao || '');
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

              var extraCols = {};
              for (var ec = 0; ec < lastExtraHeaders.length; ec++) {
                var ecKey = lastExtraHeaders[ec];
                extraCols[ecKey] = row[ecKey] != null ? String(row[ecKey]).trim() : '';
              }

              var hit = findProductInBanco(produto, bancoIndex);
              if (!hit.found) {
                var sugestaoNaoEncontrado = 'Sem correspondência confiável no Banco_Dados.';
                if (hit.candidates && hit.candidates.length > 0) {
                  var cands = [];
                  for (var c = 0; c < hit.candidates.length; c++) {
                    var cand = hit.candidates[c];
                    cands.push(cand.produto + ' [' + cand.ncm + '] (' + Number(cand.confidence || 0).toFixed(2) + ')');
                  }
                  sugestaoNaoEncontrado = 'Candidatos: ' + cands.join(' | ');
                }
                allResults.push({
                  produto: produto,
                  ncmPlanilha: ncmRaw || ncm8,
                  situacao: 'Não encontrado',
                  sugestao: sugestaoNaoEncontrado,
                  extraCols: extraCols
                });
              } else {
                var ncmBanco8 = normalizarNcm8Local(hit.ncm);
                var rastreio = formatMatchMeta(hit);
                if (ncm8 && ncm8 === ncmBanco8) {
                  allResults.push({
                    produto: produto,
                    ncmPlanilha: ncmRaw || ncm8,
                    situacao: 'Válida',
                    sugestao: rastreio,
                    extraCols: extraCols
                  });
                } else {
                  allResults.push({
                    produto: produto,
                    ncmPlanilha: ncmRaw || ncm8,
                    situacao: 'Divergente',
                    sugestao: 'NCM banco: ' + hit.ncm + (rastreio ? ' | ' + rastreio : ''),
                    extraCols: extraCols
                  });
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

    // Colunas fixas — sempre incluídas, apenas reordenáveis
    var FIXED_COLS = [
      { key: 'produto',     label: 'Produto' },
      { key: 'ncmPlanilha', label: 'NCM da planilha' },
      { key: 'situacao',    label: 'Situação' },
      { key: 'sugestao',    label: 'Sugestão/Informação' }
    ];

    function _criarItemLista(key, label, isFixed) {
      var li = document.createElement('li');
      li.className = 'ncm-relatorio-modal-col-item' + (isFixed ? ' ncm-relatorio-col-fixed' : '');
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-key', key);
      li.setAttribute('data-type', isFixed ? 'fixed' : 'extra');

      var cb = isFixed
        ? '<input type="checkbox" checked disabled class="ncm-relatorio-cb">'
        : '<input type="checkbox" checked class="ncm-relatorio-cb ncm-relatorio-extra-cb">';

      var badge = isFixed
        ? '<span class="ncm-relatorio-badge-fixed">fixo</span>'
        : '';

      li.innerHTML =
        '<span class="ncm-relatorio-drag-handle"><i class="bx bx-grid-vertical"></i></span>' +
        cb +
        '<span class="ncm-relatorio-col-name">' + escapeHtml(label) + '</span>' +
        badge;
      return li;
    }

    function _initDragDrop(list) {
      var dragging = null;

      list.addEventListener('dragstart', function(e) {
        dragging = e.target.closest('li');
        if (!dragging) return;
        dragging.classList.add('ncm-relatorio-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      list.addEventListener('dragover', function(e) {
        e.preventDefault();
        var target = e.target.closest('li');
        if (!target || target === dragging) return;
        var rect = target.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        list.querySelectorAll('li').forEach(function(li) {
          li.classList.remove('ncm-relatorio-drop-above', 'ncm-relatorio-drop-below');
        });
        target.classList.add(after ? 'ncm-relatorio-drop-below' : 'ncm-relatorio-drop-above');
      });

      list.addEventListener('dragleave', function(e) {
        if (!list.contains(e.relatedTarget)) {
          list.querySelectorAll('li').forEach(function(li) {
            li.classList.remove('ncm-relatorio-drop-above', 'ncm-relatorio-drop-below');
          });
        }
      });

      list.addEventListener('drop', function(e) {
        e.preventDefault();
        var target = e.target.closest('li');
        list.querySelectorAll('li').forEach(function(li) {
          li.classList.remove('ncm-relatorio-drop-above', 'ncm-relatorio-drop-below');
        });
        if (!target || target === dragging) return;
        var rect = target.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        if (after) {
          list.insertBefore(dragging, target.nextSibling);
        } else {
          list.insertBefore(dragging, target);
        }
      });

      list.addEventListener('dragend', function() {
        if (dragging) dragging.classList.remove('ncm-relatorio-dragging');
        dragging = null;
        list.querySelectorAll('li').forEach(function(li) {
          li.classList.remove('ncm-relatorio-drop-above', 'ncm-relatorio-drop-below');
        });
      });
    }

    function showRelatorioModal() {
      var modal = document.getElementById('ncmRelatorioModal');
      if (!modal) return;
      var list = document.getElementById('ncmRelatorioColList');
      if (!list) return;
      list.innerHTML = '';

      // Colunas fixas
      for (var f = 0; f < FIXED_COLS.length; f++) {
        list.appendChild(_criarItemLista(FIXED_COLS[f].key, FIXED_COLS[f].label, true));
      }
      // Colunas extras da planilha
      for (var x = 0; x < lastExtraHeaders.length; x++) {
        list.appendChild(_criarItemLista(lastExtraHeaders[x], lastExtraHeaders[x], false));
      }

      _initDragDrop(list);
      modal.classList.remove('hidden');
    }

    function hideRelatorioModal() {
      var modal = document.getElementById('ncmRelatorioModal');
      if (modal) modal.classList.add('hidden');
    }

    function gerarRelatorioComColunas() {
      if (typeof XLSX === 'undefined') {
        if (typeof showToast === 'function') showToast('Biblioteca SheetJS não carregada. Não é possível gerar Excel.', 'error');
        else alert('Biblioteca SheetJS não carregada. Não é possível gerar Excel.');
        return;
      }
      // Lê a ordem e seleção direto do DOM
      var list = document.getElementById('ncmRelatorioColList');
      var items = list ? list.querySelectorAll('li') : [];
      var cols = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var cb = item.querySelector('.ncm-relatorio-cb');
        if (cb && !cb.checked) continue;
        cols.push({
          key:   item.getAttribute('data-key'),
          type:  item.getAttribute('data-type'),
          label: item.querySelector('.ncm-relatorio-col-name').textContent
        });
      }
      if (cols.length === 0) {
        if (typeof showToast === 'function') showToast('Selecione ao menos uma coluna.', 'warning');
        return;
      }
      try {
        var wb = XLSX.utils.book_new();
        var headerRow = cols.map(function(c) { return c.label; });
        var dados = [headerRow];
        var fixedGetters = {
          produto:     function(r) { return r.produto || ''; },
          ncmPlanilha: function(r) { return r.ncmPlanilha || ''; },
          situacao:    function(r) { return r.situacao || ''; },
          sugestao:    function(r) { return r.sugestao || ''; }
        };
        for (var d = 0; d < lastAllResults.length; d++) {
          var r = lastAllResults[d];
          var dataRow = cols.map(function(c) {
            if (c.type === 'fixed') return fixedGetters[c.key](r);
            return r.extraCols && r.extraCols[c.key] != null ? r.extraCols[c.key] : '';
          });
          dados.push(dataRow);
        }
        var sheet = XLSX.utils.aoa_to_sheet(dados);
        XLSX.utils.book_append_sheet(wb, sheet, 'Conferencia NCM');
        var nomeArquivo = 'relatorio_conferencia_ncm_' + new Date().toISOString().slice(0, 10) + '.xlsx';
        XLSX.writeFile(wb, nomeArquivo);
        if (typeof showToast === 'function') showToast('Relatório gerado: ' + nomeArquivo, 'success');
        hideRelatorioModal();
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('Gerar relatório:', e);
        if (typeof showToast === 'function') showToast('Erro ao gerar relatório.', 'error');
        else alert('Erro ao gerar relatório.');
      }
    }

    if (gerarRelatorioBtn) {
      gerarRelatorioBtn.addEventListener('click', function () {
        if (lastAllResults.length === 0) {
          if (typeof showToast === 'function') showToast('Nenhum dado para exportar. Execute uma conferência primeiro.', 'warning');
          else alert('Nenhum dado para exportar. Execute uma conferência primeiro.');
          return;
        }
        showRelatorioModal();
      });
    }

    var modalConfirmBtn = document.getElementById('ncmRelatorioConfirmBtn');
    var modalCloseBtns  = document.querySelectorAll('.ncm-relatorio-close-btn');
    var modalOverlay    = document.getElementById('ncmRelatorioModal');

    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', gerarRelatorioComColunas);
    modalCloseBtns.forEach(function(btn) { btn.addEventListener('click', hideRelatorioModal); });
    if (modalOverlay) modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) hideRelatorioModal(); });
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

    ensureProductSynonymsLoaded();
    initConsultaNcm();
    initConferirPlanilha();
  }

  ready(initTabs);
})();
