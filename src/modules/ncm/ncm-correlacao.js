/**
 * NCM - Correlação produto × NCM (validação por regras de incompatibilidade + Ollama).
 * Depende de window.ncmMotor (descrição NCM) e carrega incompatibilidades.json.
 */
(function () {
  'use strict';

  var INCOMPATIBILIDADES = [];
  var INCOMPATIBILIDADES_URL = '../../docs/NCM/data/incompatibilidades.json';
  var OLLAMA_URL_DEFAULT = 'http://localhost:11434/api/generate';
  var OLLAMA_TIMEOUT_MS = 30000;

  function normalizarTexto(str) {
    if (str == null) return '';
    var s = String(str).toLowerCase()
      .replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c');
    return s;
  }

  /** Extrai palavras relevantes (mín. 4 caracteres, sem acento). */
  function extrairPalavras(texto) {
    if (!texto) return [];
    var norm = normalizarTexto(texto);
    var palavras = norm.split(/\s|[,.;/\\]/).filter(function (p) { return p.length >= 4; });
    var seen = {};
    return palavras.filter(function (p) {
      if (seen[p]) return false;
      seen[p] = true;
      return true;
    });
  }

  function palavraContidaEm(palavra, listaPalavras) {
    for (var i = 0; i < listaPalavras.length; i++) {
      var p = listaPalavras[i];
      if (p.indexOf(palavra) !== -1 || palavra.indexOf(p) !== -1) return true;
    }
    return false;
  }

  /** Verifica se produto e descrição NCM são incompatíveis pela regra. */
  function testarIncompatibilidade(produto, descricaoNcm) {
    if (!INCOMPATIBILIDADES.length) return false;
    var palavrasProduto = extrairPalavras(produto);
    var palavrasNcm = extrairPalavras(descricaoNcm);

    for (var r = 0; r < INCOMPATIBILIDADES.length; r++) {
      var regra = INCOMPATIBILIDADES[r];
      var ncmTemAlguma = false;
      var listNcm = regra.ncm_palavras || [];
      for (var i = 0; i < listNcm.length; i++) {
        if (palavraContidaEm(listNcm[i], palavrasNcm)) { ncmTemAlguma = true; break; }
      }
      var produtoTemAlguma = false;
      var listProd = regra.produto_palavras || [];
      for (var j = 0; j < listProd.length; j++) {
        if (palavraContidaEm(listProd[j], palavrasProduto)) { produtoTemAlguma = true; break; }
      }
      if (ncmTemAlguma && produtoTemAlguma) return true;
    }
    return false;
  }

  function interpretarResposta(texto) {
    var t = String(texto || '').replace(/\r?\n/g, ' ').trim().toUpperCase();
    var primeira = (t.split(/[\s,.]/).filter(Boolean))[0] || '';
    if (primeira === 'SIM') return 'SIM';
    if (primeira === 'NAO' || primeira === 'NÃO') return 'NAO';
    return 'REVISAR';
  }

  /**
   * Valida se o produto se enquadra na NCM: regra primeiro, depois Ollama.
   * @param {string} produto - Nome do produto
   * @param {string} ncm - Código NCM (8 dígitos)
   * @param {string} descricao - Descrição da NCM (pode ser vazia; será obtida do motor se possível)
   * @param {object} opts - { ollamaUrl?, timeoutMs? }
   * @returns {Promise<string>} 'SIM' | 'NAO' | 'REVISAR' | 'ERRO'
   */
  function validarNcm(produto, ncm, descricao, opts) {
    opts = opts || {};
    var desc = (descricao || '').trim();
    if (!desc && typeof window !== 'undefined' && window.ncmMotor) {
      var item = window.ncmMotor.buscarPorCodigo(ncm);
      if (item) desc = (item.descricaoCompleta || item.descricao || '').trim();
    }
    if (!desc) desc = 'NCM ' + String(ncm).replace(/\D/g, '').slice(0, 8);

    if (testarIncompatibilidade(produto, desc)) return Promise.resolve('NAO');

    var url = opts.ollamaUrl || OLLAMA_URL_DEFAULT;
    var timeout = opts.timeoutMs != null ? opts.timeoutMs : OLLAMA_TIMEOUT_MS;
    var prompt = 'Produto: ' + produto + '. NCM cadastrada: ' + ncm + ' - ' + desc + '. O produto pertence a esta categoria? Exemplos: Lapis nao e carne. Carne nao e fruta. Refrigerante e bebida gaseificada. Responda APENAS: SIM ou NAO';

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var id = controller ? setTimeout(function () { controller.abort(); }, timeout) : null;

    var init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3.5',
        prompt: prompt,
        stream: false,
        options: { num_predict: 10, temperature: 0.1 },
        stop: ['\n', ' ', 'A ', 'O ']
      })
    };
    if (controller && init.signal === undefined) init.signal = controller.signal;

    return fetch(url, init)
      .then(function (res) {
        if (id) clearTimeout(id);
        if (!res.ok) return 'ERRO';
        return res.json();
      })
      .then(function (data) {
        var text = (data && data.response) ? data.response : '';
        return interpretarResposta(text);
      })
      .catch(function () {
        if (id) clearTimeout(id);
        return 'ERRO';
      });
  }

  /**
   * Carrega incompatibilidades.json (fetch). URL relativa ao documento (Chat.html em src/client/).
   * @returns {Promise<void>}
   */
  function carregarIncompatibilidades() {
    return fetch(INCOMPATIBILIDADES_URL)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) { INCOMPATIBILIDADES = Array.isArray(arr) ? arr : []; })
      .catch(function () { INCOMPATIBILIDADES = []; });
  }

  window.ncmCorrelacao = {
    validarNcm: validarNcm,
    carregarIncompatibilidades: carregarIncompatibilidades,
    testarIncompatibilidade: testarIncompatibilidade,
    getIncompatibilidades: function () { return INCOMPATIBILIDADES.slice(); }
  };
})();
