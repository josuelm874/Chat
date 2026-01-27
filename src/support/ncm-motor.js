/**
 * Motor de Correlação Produto → NCM (estilo SEFAZ)
 * Normalização, busca na tabela, regras por capítulo, ranqueamento.
 * Depende de window.NCM_TABELA_DATA (Tabela_NCM.js).
 *
 * Estrutura e tomada de decisão (assimilação produto ↔ NCM):
 * - docs/NCM-ESTRUTURA-DECISAO.md: fluxo completo, filtros, score, ordenação, fallback, correlação.
 * - docs/NCM-RGI.md: Regras Gerais Interpretativas (3a, 3c, 4) aplicadas.
 * - docs/NCM-BUSCA.md: sinônimos, aliases, extensibilidade.
 */

(function () {
  'use strict';

  var INDEX = [];
  var INDEX_BUILT = false;

  var STOPWORDS = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'um', 'uma', 'uns', 'umas',
    'o', 'a', 'os', 'as', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para',
    'com', 'sem', 'ao', 'aos', 'aquelas', 'aqueles', 'essa', 'esse', 'esta', 'este'
  ]);

  /** Tokens de ruído em descrições de produto (promo, marca, modelo, etc.). Removidos na normalização. */
  var NOISE_TOKENS = new Set([
    'prom', 'bat', 'predilecta', 'pct', 'farmax', 'betakids', 'mod', 'concurso', 'cultural'
  ]);

  /** Tokens genéricos em descrições NCM: reduzir peso do match para evitar falsos positivos */
  var NCM_GENERIC = new Set([
    'outros', 'outras', 'outrem', 'demais', 'diversos', 'diversas', 'resto', 'restante',
    'nenhuma', 'nenhum', 'parte', 'exceto', 'outro', 'outra'
  ]);

  /** NCM (8 dígitos) → termos extras para busca. Usado quando a descrição oficial não contém a palavra (ex.: refrigerante → 2202). */
  var NCM_ALIASES = {
    '22021000': 'refrigerante refresco bebida gaseificada aromatizada coca cola',
    '22029900': 'refrigerante refresco bebida não alcoólica coca cola'
  };

  /**
   * Produto (termo de busca) → termos que costumam aparecer nas descrições NCM.
   * Usado no fallback quando 0 resultados: expande a busca só no capítulo sugerido.
   * Para adicionar: editar aqui ou usar ncmMotor.addQuerySynonym(...) (persiste em localStorage).
   */
  var QUERY_SYNONYMS = {
    'refrigerante': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes'],
    'refresco': ['gaseificada', 'aromatizada', 'bebida', 'nao alcoolica'],
    'coca': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes'],
    'cola': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes'],
    'sorvete': ['gelado', 'gelados', 'sorvetes', 'mantecados'],
    'detergente': ['tensioativos', 'surfactantes', 'detergentes', 'lavagem'],
    'sabonete': ['saboes', 'sabonetes', 'higiene', 'banho'],
    'abacaxi': ['ananases', 'abacaxis', 'fruta'],
    'calda': ['conserva', 'compota', 'edulcorada', 'xarope', 'agua edulcorada'],
    'caldas': ['conserva', 'compota', 'edulcorada', 'xarope', 'calda'],
    'acerola': ['fruta', 'polpa', 'suco', 'malpighia'],
    'achoc': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'achocolatado': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'acetona': ['cetona', 'quimico', 'acido'],
    'acetato': ['celulose', 'vinila', 'polimero', 'plastico'],
    'cabelo': ['cabelo', 'madeixa', 'peruca', 'obras'],
    'mechas': ['cabelo', 'madeixa', 'obras']
  };

  /** Palavras-chave → capítulo NCM (2 dígitos) para reforçar sugestões */
  var KEYWORD_CHAPTER = {
    '03': ['peixe', 'camarao', 'camarão', 'sardinha', 'atum', 'file', 'filé', 'pescado', 'marisco'],
    '04': ['leite', 'manteiga', 'creme', 'queijo', 'iogurte', 'laticinios', 'laticínio'],
    '08': ['castanha', 'amendoim', 'amêndoa', 'noz', 'avelä', 'avelã', 'coco', 'fruta', 'fruto', 'frutas', 'seco', 'abacate', 'abacaxi', 'acerola', 'goiaba', 'manga', 'tâmara', 'figo'],
    '09': ['cafe', 'café', 'cha', 'chá', 'mate', 'especiaria', 'canela', 'pimenta'],
    '10': ['arroz', 'feijao', 'feijão', 'cereal', 'cereais', 'trigo', 'milho', 'aveia', 'cevada', 'centeio'],
    '15': ['oleo', 'óleo', 'azeite', 'gordura', 'graxa', 'soja', 'milho', 'girassol', 'algodao', 'algodão'],
    '16': ['carne', 'linguica', 'linguiça', 'salsicha', 'presunto', 'bacon', 'embutido', 'fiambre'],
    '17': ['acucar', 'açúcar', 'confeito', 'chocolate', 'cacau', 'mel', 'achoc', 'achocolatado'],
    '19': ['bolacha', 'biscoito', 'bolo', 'pao', 'pão', 'macarrao', 'macarrão', 'farinha', 'massas', 'cookie'],
    '20': ['conserva', 'geleia', 'geléia', 'doce', 'compota', 'ketchup', 'molho', 'suco', 'polpa', 'calda', 'caldas', 'edulcorada', 'xarope', 'acerola'],
    '21': ['tempero', 'condimento', 'maionese', 'mostarda', 'caldo', 'extrato', 'levadura'],
    '22': ['refrigerante', 'bebida', 'cerveja', 'suco', 'agua', 'água', 'vinho', 'whisky', 'vodka', 'refresco', 'coca', 'cola', 'gaseificada', 'aromatizada', 'achoc', 'achocolatado', 'liquido'],
    '25': ['sal', 'enxofre', 'gesso', 'cal', 'argila', 'mineral'],
    '28': ['produto', 'quimico', 'químico', 'acido', 'ácido', 'fertilizante', 'inseticida', 'acetona', 'cetona'],
    '39': ['plastico', 'plástico', 'polimero', 'polímero', 'embalagem', 'tubo', 'folha', 'acetato'],
    '48': ['papel', 'cartão', 'carton', 'folha', 'embalagem'],
    '61': ['roupa', 'vestuario', 'vestuário', 'camiseta', 'calca', 'calça', 'terno', 'malha', 'tecido'],
    '67': ['cabelo', 'mechas', 'madeixa', 'peruca', 'pluma', 'acessorio'],
    '73': ['ferro', 'aco', 'aço', 'metal', 'parafuso', 'tubo', 'chapa', 'estrutura'],
    '84': ['maquina', 'máquina', 'motor', 'bomba', 'computador', 'impressora', 'equipamento', 'aparelho'],
    '85': ['eletrico', 'elétrico', 'eletronico', 'eletrônico', 'bateria', 'fio', 'lampada', 'lâmpada', 'celular'],
    '87': ['veiculo', 'veículo', 'carro', 'automovel', 'automóvel', 'moto', 'caminhao', 'caminhão', 'peca', 'peça', 'bike', 'bicicleta']
  };

  /**
   * Pré-processa descrição de produto: remove quantidade+unidade (2UN, 350ML, 400G, KG…),
   * blocos de promo (PROM+BAT) e decimais de preço (0,01); expande abreviações (LIQ→liquido).
   */
  function preprocessProductDescription(str) {
    if (typeof str !== 'string' || !str.trim()) return '';
    var s = str.trim();
    s = s.replace(/\d+[\d,.]*\s*(UN|UNID|ML|G|GR|KG|MG|LT|L|CM|MM)\b/gi, ' ');
    s = s.replace(/\d+[\d,.]*(UN|UNID|ML|G|GR|KG|MG|LT|L|CM|MM)\b/gi, ' ');
    s = s.replace(/\s+KG\b/gi, ' ');
    s = s.replace(/\bPROM\+BAT\b/gi, ' ');
    s = s.replace(/\b\d+,\d{2}\b/g, ' ');
    s = s.replace(/\bLIQ\b/gi, ' liquido ');
    s = s.replace(/\bACHOC\b/gi, ' achocolatado ');
    s = s.replace(/\b[A-Z]{2}\d{4,}[-]?[A-Z0-9]*\b/gi, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  function normalizeText(str) {
    if (typeof str !== 'string' || !str.trim()) return [];
    var s = str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return s.split(' ').filter(function (w) {
      return w.length >= 3 && !STOPWORDS.has(w) && !NOISE_TOKENS.has(w);
    });
  }

  function getChapterFromKeywords(tokens) {
    var score = {};
    var list;
    for (var cap in KEYWORD_CHAPTER) {
      if (!Object.prototype.hasOwnProperty.call(KEYWORD_CHAPTER, cap)) continue;
      list = KEYWORD_CHAPTER[cap];
      for (var i = 0; i < tokens.length; i++) {
        if (list.indexOf(tokens[i]) !== -1) {
          score[cap] = (score[cap] || 0) + 1;
        }
      }
    }
    var best = '';
    var max = 0;
    for (var k in score) {
      if (score[k] > max) { max = score[k]; best = k; }
    }
    return best;
  }

  var STORAGE_SYNONYMS_KEY = 'ncmQuerySynonyms';

  function getMergedSynonyms() {
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_SYNONYMS_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_SYNONYMS_KEY)) || {};
      }
    } catch (e) {}
    var out = {};
    for (var k in QUERY_SYNONYMS) { if (Object.prototype.hasOwnProperty.call(QUERY_SYNONYMS, k)) out[k] = QUERY_SYNONYMS[k].slice(); }
    for (var k in custom) { if (Object.prototype.hasOwnProperty.call(custom, k)) out[k] = (out[k] || []).concat(custom[k]); }
    return out;
  }

  function expandTokens(tokens) {
    var syn = getMergedSynonyms();
    var seen = {};
    var out = [];
    var i, t, list, j, s, parts, k, w;
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i];
      if (!seen[t]) { seen[t] = true; out.push(t); }
      list = syn[t];
      if (list && list.length) {
        for (j = 0; j < list.length; j++) {
          s = list[j].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          parts = s.split(' ');
          for (k = 0; k < parts.length; k++) {
            w = parts[k];
            if (w.length >= 3 && !STOPWORDS.has(w) && !seen[w]) { seen[w] = true; out.push(w); }
          }
        }
      }
    }
    return out;
  }

  function flattenNcmTable(data) {
    var out = [];
    if (!data || typeof data !== 'object') return out;

    var levelKey, root, caps, capKey, cap, ncms, ncmKey, n, c, c4, c6, d4, d6, full;
    for (levelKey in data) {
      if (!Object.prototype.hasOwnProperty.call(data, levelKey)) continue;
      root = data[levelKey];
      if (!root || !root.capitulos) continue;
      caps = root.capitulos;
      for (capKey in caps) {
        if (!Object.prototype.hasOwnProperty.call(caps, capKey)) continue;
        cap = caps[capKey];
        ncms = cap.ncms || {};
        for (ncmKey in ncms) {
          if (!Object.prototype.hasOwnProperty.call(ncms, ncmKey)) continue;
          n = ncms[ncmKey];
          if (!n || !n.codigo || !n.descricao) continue;
          c = String(n.codigo).replace(/\D/g, '');
          if (c.length !== 8) continue;

          c4 = c.slice(0, 4);
          c6 = c.slice(0, 6);
          d4 = (ncms[c4] && ncms[c4].descricao) ? ncms[c4].descricao : '';
          d6 = (ncms[c6] && ncms[c6].descricao) ? ncms[c6].descricao : '';
          full = [d4, d6, n.descricao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

          out.push({
            codigo: c,
            descricao: n.descricao,
            descricaoCompleta: full || n.descricao,
            descricao4: d4,
            descricao6: d6,
            capitulo: String(capKey).replace(/\D/g, '').slice(0, 2)
          });
        }
      }
    }
    return out;
  }

  function ensureIndex() {
    if (INDEX_BUILT && INDEX.length > 0) return;
    var data = typeof window !== 'undefined' && window.NCM_TABELA_DATA;
    if (!data) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('ncm-motor: NCM_TABELA_DATA não encontrado. Carregue Tabela_NCM.js antes.');
      }
      return;
    }
    INDEX = flattenNcmTable(data);
    INDEX_BUILT = true;
  }

  function formatNcm(codigo) {
    var c = String(codigo || '').replace(/\D/g, '');
    if (c.length >= 8) {
      return c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6, 8);
    }
    return c;
  }

  function matchToken(tok, norm) {
    if (!norm || !norm.length || (tok && tok.length < 3)) return false;
    return norm.some(function (d) {
      if (d.length < 3) return false;
      var idx = d.indexOf(tok);
      if (idx === -1) return false;
      var next = d[idx + tok.length];
      if (next === undefined) return true;
      if (next === 's' && idx + tok.length + 1 === d.length) return true;
      return !/[a-z0-9]/.test(next);
    });
  }

  function matchExact(tok, norm) {
    if (!norm || !norm.length || (tok && tok.length < 3)) return false;
    return norm.indexOf(tok) !== -1;
  }

  /**
   * Executa a busca interna. useTokens = tokens da query (ou expandidos); restrictChapter = cap. 2 dígitos ou null.
   */
  function runSearch(useTokens, restrictChapter) {
    var chapterHint = getChapterFromKeywords(useTokens);
    var results = [];
    var i, item, norm4, norm6, norm8, j, t, m4, m6, m8, w, tw, score, capMatch;
    var hits4, hits6, hits8, genericOnly;

    for (i = 0; i < INDEX.length; i++) {
      item = INDEX[i];
      if (restrictChapter && item.capitulo !== restrictChapter) continue;

      norm4 = normalizeText(item.descricao4 || '');
      norm6 = normalizeText(item.descricao6 || '');
      var desc8 = (item.descricao || '') + ' ' + (NCM_ALIASES[item.codigo] || '');
      norm8 = normalizeText(desc8);

      tw = 0;
      genericOnly = true;
      hits4 = 0;
      hits6 = 0;
      hits8 = 0;
      var tokensMatched = 0;
      for (j = 0; j < useTokens.length; j++) {
        t = useTokens[j];
        m4 = matchToken(t, norm4);
        m6 = matchToken(t, norm6);
        m8 = matchToken(t, norm8);
        if (m4) hits4++;
        if (m6) hits6++;
        if (m8) hits8++;
        if (!m4 && !m6 && !m8) continue;
        tokensMatched++;
        if (!NCM_GENERIC.has(t)) genericOnly = false;
        w = (m4 ? 0.15 : 0) + (m6 ? 0.25 : 0) + (m8 ? 0.6 : 0);
        if (m8 && matchExact(t, norm8)) w += 0.15;
        tw += w;
      }
      if (tw <= 0) continue;
      if (hits8 < 1) continue;
      if (genericOnly) tw *= 0.4;

      score = tw / useTokens.length;
      capMatch = chapterHint && item.capitulo === chapterHint ? 1.2 : 1;
      score *= capMatch;
      if (chapterHint && item.capitulo !== chapterHint) score *= 0.88;
      if (chapterHint === '22' && item.capitulo === '84') continue;
      if (score < 0.45) continue;

      results.push({
        codigo: item.codigo,
        descricao: item.descricao,
        descricaoCompleta: item.descricaoCompleta || item.descricao,
        descricao4: item.descricao4 || '',
        descricao6: item.descricao6 || '',
        capitulo: item.capitulo,
        score: Math.round(score * 1000) / 1000,
        codigoFormatado: formatNcm(item.codigo),
        _hits4: hits4,
        _hits6: hits6,
        _hits8: hits8,
        _genericOnly: genericOnly,
        _tokensMatched: tokensMatched,
        _tokenCoverage: useTokens.length ? Math.round((tokensMatched / useTokens.length) * 100) / 100 : 1
      });
    }

    /* RGI 3a: mais específica prevalece (descrição 8 díg. longer primeiro). RGI 3c: último na ordem numérica (código maior primeiro). */
    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var ah8 = a._hits8 || 0, bh8 = b._hits8 || 0;
      if (bh8 !== ah8) return bh8 - ah8;
      var acov = a._tokenCoverage || 0, bcov = b._tokenCoverage || 0;
      if (bcov !== acov) return bcov - acov;
      var alen = (a.descricao || '').length, blen = (b.descricao || '').length;
      if (blen !== alen) return blen - alen;
      return (b.codigo || '').localeCompare(a.codigo || '');
    });
    return results;
  }

  /**
   * Sugere NCM(s) para um produto a partir da descrição.
   * @param {string} descricaoProduto - Nome/descrição do produto
   * @param {object} opts - { limit: number, prefer8: boolean }
   * @returns {Array<{ codigo, descricao, capitulo, score, codigoFormatado }>}
   */
  function sugerirNCM(descricaoProduto, opts) {
    opts = opts || {};
    var limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 20), 50);

    ensureIndex();
    if (INDEX.length === 0) return [];

    var cleaned = preprocessProductDescription(descricaoProduto);
    var tokens = normalizeText(cleaned || descricaoProduto);
    if (tokens.length === 0) return [];

    var chapterHint = getChapterFromKeywords(tokens);
    var results = runSearch(tokens, null);

    if (results.length === 0 && chapterHint) {
      var expanded = expandTokens(tokens);
      if (expanded.length > tokens.length) {
        results = runSearch(expanded, chapterHint);
      }
    }

    return results.slice(0, limit).map(function (r) {
      delete r._hits4;
      delete r._hits6;
      delete r._hits8;
      delete r._genericOnly;
      delete r._tokensMatched;
      delete r._tokenCoverage;
      return r;
    });
  }

  /**
   * Correlaciona produto + NCM informado: verifica se o NCM faz sentido para o produto.
   * @param {string} descricaoProduto
   * @param {string} ncmInformado - Código (8 dígitos)
   * @returns {object} { ok, sugestoes, ncmInformadoFormatado, mensagem }
   */
  function correlacionar(descricaoProduto, ncmInformado) {
    var cod = String(ncmInformado || '').replace(/\D/g, '');
    var sugestoes = sugerirNCM(descricaoProduto, { limit: 10, prefer8: true });
    var encontrado = sugestoes.find(function (s) {
      return s.codigo === cod || (s.codigo.length >= 6 && cod.indexOf(s.codigo) === 0) || (cod.length >= 6 && s.codigo.indexOf(cod) === 0);
    });
    var mesmoCapitulo = cod.length >= 2 && sugestoes.some(function (s) { return s.capitulo === cod.slice(0, 2); });

    var ok = !!encontrado;
    var msg = ok
      ? 'NCM compatível com o produto.'
      : mesmoCapitulo
        ? 'NCM em capítulo relacionado. Confira a descrição.'
        : 'NCM pode não corresponder ao produto. Verifique as sugestões.';

    return {
      ok: ok,
      sugestoes: sugestoes,
      ncmInformadoFormatado: formatNcm(cod),
      mensagem: msg
    };
  }

  function addQuerySynonym(termo, termosExtras) {
    var key = (normalizeText(termo)[0] || termo.toLowerCase().replace(/\s+/, '')).trim();
    if (!key || key.length < 3) return;
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_SYNONYMS_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_SYNONYMS_KEY)) || {};
      }
    } catch (e) {}
    var list = Array.isArray(termosExtras) ? termosExtras : [].concat(termosExtras);
    custom[key] = (custom[key] || []).concat(list);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_SYNONYMS_KEY, JSON.stringify(custom));
    } catch (e) {}
  }

  function getQuerySynonyms() {
    return getMergedSynonyms();
  }

  window.ncmMotor = {
    sugerirNCM: sugerirNCM,
    correlacionar: correlacionar,
    normalizeText: normalizeText,
    formatNcm: formatNcm,
    ensureIndex: ensureIndex,
    addQuerySynonym: addQuerySynonym,
    getQuerySynonyms: getQuerySynonyms,
    isReady: function () {
      ensureIndex();
      return INDEX.length > 0;
    }
  };
})();
