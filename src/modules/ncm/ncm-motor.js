/**
 * Motor NCM - Consulta por código (Tabela NCM + TIPI).
 * Depende de window.NCM_TABELA_DATA (Tabela_NCM.js).
 * Mantém apenas: buscarPorCodigo, getNcmsByChapter, formatNcm.
 */
(function () {
  'use strict';

  var INDEX = [];
  var INDEX_BUILT = false;

  function flattenNcmTable(data) {
    var out = [];
    if (!data || typeof data !== 'object') return out;
    var levelKey, root, caps, capKey, cap, ncms, ncmKey, n, c, c4, c6, d4, d6;
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
          var d2 = (cap && cap.descricao) ? cap.descricao : '';
          d4 = (ncms[c4] && ncms[c4].descricao) ? ncms[c4].descricao : '';
          d6 = (ncms[c6] && ncms[c6].descricao) ? ncms[c6].descricao : '';
          if (!d6 && c.length > 4) {
            for (var k = 5; k >= 4; k--) {
              var pk = c.slice(0, k);
              if (ncms[pk] && ncms[pk].descricao) { d6 = ncms[pk].descricao; break; }
            }
          }
          var full = [d2, d4, d6, n.descricao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
          out.push({
            codigo: c,
            descricao: n.descricao,
            descricaoCompleta: full || n.descricao,
            descricao2: d2,
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

  /**
   * Busca NCM por código (8 dígitos). Usado na Consulta de NCM.
   * @param {string} codigo - Código NCM (aceita formatação 0000.00.00 ou 00000000)
   * @returns {{ codigo, descricao, descricao2, descricao4, descricao6, capitulo, codigoFormatado } | null}
   */
  function buscarPorCodigo(codigo) {
    ensureIndex();
    if (INDEX.length === 0) return null;
    var c = String(codigo || '').replace(/\D/g, '');
    if (c.length < 8) return null;
    if (c.length > 8) c = c.slice(0, 8);
    for (var i = 0; i < INDEX.length; i++) {
      if (INDEX[i].codigo === c) {
        var item = INDEX[i];
        return {
          codigo: item.codigo,
          descricao: item.descricao,
          descricao2: item.descricao2 || '',
          descricao4: item.descricao4 || '',
          descricao6: item.descricao6 || '',
          capitulo: item.capitulo,
          codigoFormatado: formatNcm(item.codigo)
        };
      }
    }
    return null;
  }

  /**
   * Retorna exemplos de NCMs vigentes de um capítulo (para sugestão quando NCM vencida).
   * @param {string} chapter - Capítulo (2 dígitos)
   * @param {number} limit - Máximo de NCMs a retornar
   * @returns {Array<{codigo, codigoFormatado}>}
   */
  function getNcmsByChapter(chapter, limit) {
    ensureIndex();
    if (INDEX.length === 0) return [];
    var ch = String(chapter || '').replace(/\D/g, '').slice(0, 2);
    if (!ch) return [];
    var out = [];
    var max = Math.min(limit || 5, 10);
    for (var i = 0; i < INDEX.length && out.length < max; i++) {
      if (INDEX[i].capitulo === ch) {
        out.push({ codigo: INDEX[i].codigo, codigoFormatado: formatNcm(INDEX[i].codigo) });
      }
    }
    return out;
  }

  window.ncmMotor = {
    buscarPorCodigo: buscarPorCodigo,
    getNcmsByChapter: getNcmsByChapter,
    formatNcm: formatNcm,
    ensureIndex: ensureIndex,
    isReady: function () {
      ensureIndex();
      return INDEX.length > 0;
    }
  };
})();
