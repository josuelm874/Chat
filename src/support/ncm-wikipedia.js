/**
 * NCM + Wikipedia API (pt). Enriquece a descrição do produto com características da Wikipedia
 * para melhorar a busca NCM. Usado em Consulta e Correlação. Sempre em português.
 * API gratuita, sem chave.
 */
(function () {
  'use strict';

  var WIKI_API = 'https://pt.wikipedia.org/w/api.php';
  var MAX_WIKI_CHARS = 400;
  var MAX_SEARCH_TERM = 50;

  /**
   * Monta o termo de busca para a Wikipedia a partir do produto.
   * Usa pré-processamento do motor se disponível.
   */
  function buildSearchTerm(produto) {
    var s = (typeof produto === 'string' ? produto : '').trim();
    if (!s) return '';
    var motor = typeof window !== 'undefined' && window.ncmMotor;
    if (motor && typeof motor.preprocessProductDescription === 'function') {
      s = (motor.preprocessProductDescription(s) || s).trim() || s;
    }
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > MAX_SEARCH_TERM) {
      var parts = s.slice(0, MAX_SEARCH_TERM).split(' ');
      if (parts.length > 3) parts = parts.slice(0, 3);
      s = parts.join(' ');
    }
    return s;
  }

  /**
   * Chama a Wikipedia (Opensearch) e extrai títulos + descrições.
   * @param {string} searchTerm
   * @returns {Promise<string>} Texto extraído ou '' se falha.
   */
  async function fetchWikiText(searchTerm) {
    if (!searchTerm) return '';
    var url = WIKI_API + '?action=opensearch&search=' + encodeURIComponent(searchTerm) +
      '&limit=5&format=json&origin=*';
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    try {
      var res = await fetch(url, { signal: ctrl ? ctrl.signal : undefined });
      if (!res.ok) return '';
      var arr = await res.json();
      if (!Array.isArray(arr) || arr.length < 3) return '';
      var titles = arr[1] || [];
      var descriptions = arr[2] || [];
      var parts = [];
      for (var i = 0; i < Math.max(titles.length, descriptions.length); i++) {
        var tt = (titles[i] || '').trim();
        var d = (descriptions[i] || '').trim();
        if (tt && parts.indexOf(tt) === -1) parts.push(tt);
        if (d && parts.indexOf(d) === -1) parts.push(d);
      }
      var joined = parts.join('. ').replace(/\s+/g, ' ').trim();
      return joined.length > MAX_WIKI_CHARS ? joined.slice(0, MAX_WIKI_CHARS) + '...' : joined;
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('ncm-wikipedia: fetch', e);
      return '';
    } finally {
      if (t) clearTimeout(t);
    }
  }

  /**
   * Enriquece o produto com características da Wikipedia (pt).
   * @param {string} produto - Descrição do produto
   * @returns {Promise<{ textoEnriquecido: string, wikiUsado: boolean }>}
   */
  async function enriquecerComWikipedia(produto) {
    var original = (typeof produto === 'string' ? produto : '').trim();
    if (!original) return { textoEnriquecido: '', wikiUsado: false };

    var searchTerm = buildSearchTerm(original);
    var wikiText = await fetchWikiText(searchTerm);

    if (!wikiText) {
      return { textoEnriquecido: original, wikiUsado: false };
    }

    var textoEnriquecido = (original + ' ' + wikiText).replace(/\s+/g, ' ').trim();
    return { textoEnriquecido: textoEnriquecido, wikiUsado: true };
  }

  window.ncmWikipedia = {
    enriquecerComWikipedia: enriquecerComWikipedia,
    buildSearchTerm: buildSearchTerm
  };
})();
