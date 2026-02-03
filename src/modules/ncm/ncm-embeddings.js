/**
 * NCM por similaridade (embeddings). Fallback quando o motor de regras retorna 0.
 * Usa Transformers.js (Xenova) + ncm-embeddings.json. Modelo: paraphrase-multilingual-MiniLM-L12-v2.
 * Ver docs/NCM-EMBEDDINGS-ML.md.
 */
(function () {
  'use strict';

  var MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  var EMBEDDINGS_JSON = '../../docs/NCM/data/ncm-embeddings.json';
  var pipelineFn = null;
  var extractor = null;
  var items = [];
  var initDone = false;
  var initPromise = null;

  function getJsonUrl() {
    var a = document.createElement('a');
    a.href = EMBEDDINGS_JSON;
    return a.href;
  }

  function cosineSimilarity(a, b) {
    var n = a.length;
    var sum = 0, na = 0, nb = 0;
    for (var i = 0; i < n; i++) {
      sum += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    var d = Math.sqrt(na) * Math.sqrt(nb);
    return d > 0 ? sum / d : 0;
  }

  function formatNcm(c) {
    c = String(c || '').replace(/\D/g, '');
    if (c.length >= 8) return c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6, 8);
    return c;
  }

  function init() {
    if (initPromise) return initPromise;
    initPromise = (async function () {
      if (initDone) return;
      try {
        var mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        if (mod.env) {
          mod.env.allowLocalModels = false;
          mod.env.localModelPath = '';
          mod.env.remoteHost = 'https://huggingface.co';
        }
        pipelineFn = mod.pipeline;
        extractor = await pipelineFn('feature-extraction', MODEL_ID, {
          pooling: 'mean',
          normalize: true,
        });
        var url = getJsonUrl();
        var res = await fetch(url);
        if (!res.ok) throw new Error('ncm-embeddings: fetch ' + url + ' failed ' + res.status);
        items = await res.json();
        if (!Array.isArray(items) || items.length === 0) throw new Error('ncm-embeddings: JSON vazio ou inválido');
        initDone = true;
      } catch (e) {
        initPromise = null;
        if (typeof console !== 'undefined' && console.warn) console.warn('ncm-embeddings: init falhou', e);
        throw e;
      }
    })();
    return initPromise;
  }

  /**
   * Sugere NCMs por similaridade de embedding, com filtros IA para evitar falhas absurdas.
   * Opções: limit, chapterHint, minSimilarity (0.28), requireTokenOverlap (true), tokens.
   * Se tokens não forem passados e o motor existir, usa getTokensForProduct(descricao).
   * Pré-processa a descrição (motor) antes de embedar quando o motor estiver disponível.
   *
   * @param {string} descricaoProduto
   * @param {object} opts - { limit, chapterHint, minSimilarity, requireTokenOverlap, tokens }
   * @returns {Promise<Array<{ codigo, descricao, descricao4, descricao6, capitulo, score, codigoFormatado }>>}
   */
  async function sugerirNCMEmbeddings(descricaoProduto, opts) {
    opts = opts || {};
    var limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 20), 100);
    var minSim = typeof opts.minSimilarity === 'number' ? opts.minSimilarity : 0.28;
    var requireOverlap = opts.requireTokenOverlap !== false;
    var chapterHint = opts.chapterHint || null;
    var tokens = opts.tokens;
    var motor = typeof window !== 'undefined' && window.ncmMotor;

    var str = typeof descricaoProduto === 'string' ? descricaoProduto.trim() : '';
    if (!str) return [];

    var toEmbed = str;
    if (motor && typeof motor.preprocessProductDescription === 'function') {
      toEmbed = (motor.preprocessProductDescription(str) || str).trim() || str;
    }
    if (!tokens && motor && typeof motor.getTokensForProduct === 'function') {
      tokens = motor.getTokensForProduct(str);
    }
    if (!tokens || !tokens.length) requireOverlap = false;

    try {
      await init();
    } catch (_) {
      return [];
    }
    if (!extractor || !items.length) return [];

    var t = await extractor(toEmbed, { pooling: 'mean', normalize: true });
    var dim = t.dims[t.dims.length - 1];
    var q = Array.from(t.data).slice(0, dim);

    var scored = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (chapterHint && (it.capitulo || '') !== chapterHint) continue;
      var emb = it.embedding;
      if (!emb || emb.length !== dim) continue;
      var sim = cosineSimilarity(q, emb);
      if (sim < minSim) continue;
      if (requireOverlap && tokens && tokens.length && motor && typeof motor.hasTokenOverlap === 'function') {
        if (!motor.hasTokenOverlap(tokens, it.descricao || '', it.codigo)) continue;
      }
      scored.push({
        codigo: it.codigo,
        descricao: it.descricao || '',
        descricao4: it.descricao4 || '',
        descricao6: it.descricao6 || '',
        capitulo: it.capitulo || '',
        score: Math.round(sim * 1000) / 1000,
        codigoFormatado: formatNcm(it.codigo),
      });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit);
  }

  function isReady() {
    return initDone && items.length > 0;
  }

  window.ncmEmbeddings = {
    init: init,
    sugerirNCMEmbeddings: sugerirNCMEmbeddings,
    isReady: isReady,
  };
})();
