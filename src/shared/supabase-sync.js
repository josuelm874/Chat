/**
 * Sistema de Sincronização com Supabase – Chat UI Soft Tech
 * Permite compartilhamento de dados entre múltiplos PCs.
 * Configuração em CONFIG.SUPABASE (config.js).
 */

(function () {
  'use strict';

  var TABLE_NAME = 'system_data';
  var DEFAULT_SYNC_KEYS = [
    'users', 'contributors', 'contributorContacts', 'contributorEmployees',
    'supportMessages', 'internalMessages', 'tasks', 'recruitmentRequests',
    'chatui_lembretes'
  ];

  var supabaseClient = null;
  var isSupabaseConfigured = false;
  var supabaseScriptAdded = false;
  var _readyCallbacks = [];

  function getConfig() {
    if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE) {
      return {
        url: CONFIG.SUPABASE.URL,
        anonKey: CONFIG.SUPABASE.ANON_KEY,
        table: (CONFIG.SUPABASE.TABLE_NAME || TABLE_NAME)
      };
    }
    return { url: '', anonKey: '', table: TABLE_NAME };
  }

  function initSupabase() {
    var cfg = getConfig();
    if (!cfg.url || !cfg.anonKey ||
        cfg.url === 'SUA_URL_DO_SUPABASE_AQUI' ||
        cfg.anonKey === 'SUA_ANON_KEY_AQUI') {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('⚠️ Supabase não configurado. Usando apenas localStorage.');
      }
      return false;
    }

    TABLE_NAME = cfg.table;

    try {
      if (typeof window.supabase === 'undefined') {
        if (!supabaseScriptAdded) {
          supabaseScriptAdded = true;
          var script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
          script.onload = function () {
            if (window.supabase) {
              supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
              isSupabaseConfigured = true;
              if (typeof console !== 'undefined' && console.log) {
                console.log('✅ Supabase (Chat UI) inicializado com sucesso!');
              }
              // Disparar callbacks de "pronto"
              _readyCallbacks.forEach(function(cb) { try { cb(); } catch(e) {} });
              _readyCallbacks = [];
            }
          };
          script.onerror = function () {
            if (typeof console !== 'undefined' && console.error) {
              console.error('❌ Erro ao carregar biblioteca Supabase');
            }
          };
          document.head.appendChild(script);
        }
        return true;
      }
      supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
      isSupabaseConfigured = true;
      if (typeof console !== 'undefined' && console.log) {
        console.log('✅ Supabase (Chat UI) inicializado com sucesso!');
      }
      return true;
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('❌ Erro ao inicializar Supabase:', e);
      }
      return false;
    }
  }

  async function saveToCloud(key, data) {
    var localSuccess = false;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(key + '_updated', Date.now().toString());
      localSuccess = true;
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }

    if (!isSupabaseConfigured) initSupabase();
    if (!isSupabaseConfigured || !supabaseClient) {
      // Retorna status real — false se localStorage falhou (QuotaExceededError, etc.)
      return { success: localSuccess, local: localSuccess };
    }

    try {
      var payload = {
        key: key,
        value: data,
        updated_at: new Date().toISOString()
      };
      var opts = { onConflict: 'key' };
      var res = await supabaseClient.from(TABLE_NAME).upsert(payload, opts);
      if (res.error) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('Erro ao salvar ' + key + ' no Supabase:', res.error);
        }
        return { success: false, error: res.error.message, local: true };
      }
      return { success: true, cloud: true, local: true };
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Erro ao salvar ' + key + ' no Supabase:', e);
      }
      return { success: false, error: (e && e.message) ? e.message : String(e), local: true };
    }
  }

  async function loadFromCloud(key, defaultValue) {
    if (defaultValue === undefined) defaultValue = null;

    if (!isSupabaseConfigured) initSupabase();
    if (isSupabaseConfigured && supabaseClient) {
      try {
        var q = await supabaseClient
          .from(TABLE_NAME)
          .select('value, updated_at')
          .eq('key', key)
          .maybeSingle();

        if (!q.error && q.data) {
          try {
            localStorage.setItem(key, JSON.stringify(q.data.value));
            localStorage.setItem(key + '_updated', new Date(q.data.updated_at).getTime().toString());
          } catch (e) {}
          return q.data.value;
        }
        if (q.error && q.error.code !== 'PGRST116') {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Aviso ao carregar ' + key + ' do Supabase:', q.error.message);
          }
        }
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('Erro ao carregar ' + key + ' do Supabase:', e);
        }
      }
    }

    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return defaultValue;
  }

  async function syncData(key) {
    if (!isSupabaseConfigured || !supabaseClient) {
      return { synced: false, reason: 'Supabase não configurado' };
    }

    try {
      var localUpdated = parseInt(localStorage.getItem(key + '_updated') || '0', 10);
      var q = await supabaseClient
        .from(TABLE_NAME)
        .select('value, updated_at')
        .eq('key', key)
        .maybeSingle();

      if (q.error) {
        return { synced: false, error: q.error.message };
      }
      if (!q.data) {
        var localRaw = localStorage.getItem(key);
        if (localRaw) {
          await saveToCloud(key, JSON.parse(localRaw));
          return { synced: true, action: 'uploaded' };
        }
        return { synced: false, reason: 'Sem dados locais' };
      }

      var cloudUpdated = new Date(q.data.updated_at).getTime();
      if (cloudUpdated > localUpdated) {
        try {
          localStorage.setItem(key, JSON.stringify(q.data.value));
          localStorage.setItem(key + '_updated', cloudUpdated.toString());
        } catch (e) {}
        return { synced: true, action: 'downloaded', data: q.data.value };
      }
      if (localUpdated > cloudUpdated) {
        var localRaw2 = localStorage.getItem(key);
        if (localRaw2) {
          await saveToCloud(key, JSON.parse(localRaw2));
          return { synced: true, action: 'uploaded' };
        }
      }
      return { synced: true, action: 'already_synced' };
    } catch (e) {
      return { synced: false, error: (e && e.message) ? e.message : String(e) };
    }
  }

  async function syncAllData(keys) {
    keys = keys || DEFAULT_SYNC_KEYS;
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = await syncData(keys[i]);
    }
    return out;
  }

  async function forceRefreshFromCloud(key) {
    if (!isSupabaseConfigured || !supabaseClient) return null;
    try {
      var q = await supabaseClient
        .from(TABLE_NAME)
        .select('value, updated_at')
        .eq('key', key)
        .maybeSingle();
      if (q.error || !q.data) return null;
      var t = new Date(q.data.updated_at).getTime();
      localStorage.setItem(key, JSON.stringify(q.data.value));
      localStorage.setItem(key + '_updated', t.toString());
      return q.data.value;
    } catch (e) {
      return null;
    }
  }

  /** Nome da tabela de validação NCM (produto×NCM). */
  function getValidacaoNcmTable() {
    return (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE && CONFIG.SUPABASE.VALIDACAO_NCM_TABLE)
      ? CONFIG.SUPABASE.VALIDACAO_NCM_TABLE
      : 'validacao_ncm';
  }

  /** Normaliza NCM para 8 dígitos (com zeros à esquerda). */
  function normalizarNcm8(ncm) {
    if (ncm == null) return '';
    var dig = String(ncm).replace(/\D/g, '');
    if (dig.length === 0 || dig.length > 8) return '';
    return dig.padStart(8, '0');
  }

  /**
   * Busca uma validação no banco por produto e NCM (tabela validacao_ncm).
   * Retorna { produto, ncm, resultado, detalhe } ou null.
   */
  async function loadValidacaoNcm(produto, ncm) {
    if (!isSupabaseConfigured || !supabaseClient) return null;
    produto = (produto || '').trim();
    ncm = normalizarNcm8(ncm);
    if (!produto || !ncm) return null;
    try {
      var table = getValidacaoNcmTable();
      var q = await supabaseClient
        .from(table)
        .select('produto, ncm, resultado, detalhe')
        .eq('produto', produto)
        .eq('ncm', ncm)
        .maybeSingle();
      if (q.error) {
        if (typeof console !== 'undefined' && console.warn) console.warn('Validacao NCM load:', q.error.message);
        return null;
      }
      return q.data;
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('loadValidacaoNcm:', e);
      return null;
    }
  }

  /**
   * Retorna as primeiras 2 palavras do texto (para match de produto).
   */
  function primeirasDuasPalavras(texto) {
    var palavras = String(texto || '').trim().split(/\s+/).filter(Boolean);
    if (palavras.length < 2) return '';
    return palavras.slice(0, 2).join(' ');
  }

  /**
   * Lista validações SIM do banco cujo produto começa com as 2 primeiras palavras do parâmetro.
   * Usado na conferência de planilha: só considera produtos validados como SIM.
   * Retorna array de { produto, ncm, resultado, detalhe }.
   */
  async function listValidacaoNcmSimByProduto(produto) {
    if (!isSupabaseConfigured || !supabaseClient) return [];
    var prefix = primeirasDuasPalavras(produto);
    if (!prefix) return [];
    try {
      var table = getValidacaoNcmTable();
      var q = await supabaseClient
        .from(table)
        .select('produto, ncm, resultado, detalhe')
        .ilike('produto', prefix + '%')
        .ilike('resultado', 'sim')
        .limit(50);
      if (q.error) {
        if (typeof console !== 'undefined' && console.warn) console.warn('listValidacaoNcmSimByProduto:', q.error.message);
        return [];
      }
      return q.data || [];
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('listValidacaoNcmSimByProduto:', e);
      return [];
    }
  }

  /**
   * Lista validações do banco por código NCM (para exibir "produtos já validados para este NCM").
   * Retorna array de { produto, ncm, resultado, detalhe }, no máximo limit itens.
   */
  async function listValidacaoNcmByNcm(ncm, limit) {
    if (!isSupabaseConfigured || !supabaseClient) return [];
    ncm = normalizarNcm8(ncm);
    if (!ncm) return [];
    limit = Math.min(Number(limit) || 50, 100);
    try {
      var table = getValidacaoNcmTable();
      var q = await supabaseClient
        .from(table)
        .select('produto, ncm, resultado, detalhe')
        .eq('ncm', ncm)
        .order('produto', { ascending: true })
        .limit(limit);
      if (q.error) {
        if (typeof console !== 'undefined' && console.warn) console.warn('listValidacaoNcmByNcm:', q.error.message);
        return [];
      }
      return q.data || [];
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('listValidacaoNcmByNcm:', e);
      return [];
    }
  }

  /**
   * Lista todas as validações do banco (para a aba "Banco cadastrado").
   * offset e limit para paginação (offset 0-based). Retorna array de { produto, ncm, resultado, detalhe }.
   */
  async function listValidacaoNcmAll(limit, offset) {
    if (!isSupabaseConfigured || !supabaseClient) return [];
    limit = Math.min(Number(limit) || 100, 500);
    offset = Math.max(0, Number(offset) || 0);
    try {
      var table = getValidacaoNcmTable();
      var q = await supabaseClient
        .from(table)
        .select('produto, ncm, resultado, detalhe')
        .order('produto', { ascending: true })
        .order('ncm', { ascending: true })
        .range(offset, offset + limit - 1);
      if (q.error) {
        if (typeof console !== 'undefined' && console.warn) console.warn('listValidacaoNcmAll:', q.error.message);
        return { data: [], error: q.error.message };
      }
      return q.data || [];
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('listValidacaoNcmAll:', e);
      return { data: [], error: (e && e.message) ? e.message : String(e) };
    }
  }

  /**
   * Assinar atualizações em tempo real de uma chave específica na tabela system_data.
   * callback(newValue) é chamado sempre que o valor da chave for atualizado no banco.
   */
  function subscribeToKey(key, callback) {
    if (!isSupabaseConfigured || !supabaseClient) return null;
    try {
      return supabaseClient
        .channel('system_data_' + key)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: TABLE_NAME,
          filter: 'key=eq.' + key
        }, function(payload) {
          if (payload.new && payload.new.value !== undefined) {
            try {
              localStorage.setItem(key, JSON.stringify(payload.new.value));
              localStorage.setItem(key + '_updated',
                new Date(payload.new.updated_at || Date.now()).getTime().toString());
            } catch (e) {}
            if (typeof callback === 'function') callback(payload.new.value);
          }
        })
        .subscribe();
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Erro ao assinar ' + key + ':', e);
      }
      return null;
    }
  }

  /**
   * Registrar um callback a ser chamado quando o Supabase estiver pronto.
   * Se já estiver configurado, chama imediatamente.
   */
  function onReady(callback) {
    if (isSupabaseConfigured) {
      try { callback(); } catch(e) {}
    } else {
      _readyCallbacks.push(callback);
    }
  }

  window.supabaseSync = {
    init: initSupabase,
    save: saveToCloud,
    load: loadFromCloud,
    sync: syncData,
    syncAll: syncAllData,
    refresh: forceRefreshFromCloud,
    isConfigured: function () { return isSupabaseConfigured; },
    subscribeToKey: subscribeToKey,
    onReady: onReady,
    /** Banco de validação NCM (tabela validacao_ncm) */
    loadValidacaoNcm: loadValidacaoNcm,
    listValidacaoNcmByNcm: listValidacaoNcmByNcm,
    listValidacaoNcmSimByProduto: listValidacaoNcmSimByProduto,
    listValidacaoNcmAll: listValidacaoNcmAll,
    normalizarNcm8: normalizarNcm8,
    primeirasDuasPalavras: primeirasDuasPalavras
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }
})();
