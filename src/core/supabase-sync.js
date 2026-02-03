/**
 * Sistema de Sincronização com Supabase – Chat UI
 * Permite compartilhamento de dados entre múltiplos PCs.
 * Configuração em CONFIG.SUPABASE (config.js).
 */

(function () {
  'use strict';

  var TABLE_NAME = 'system_data';
  var DEFAULT_SYNC_KEYS = [
    'users', 'contributors', 'contributorContacts', 'contributorEmployees',
    'supportMessages', 'internalMessages', 'tasks', 'recruitmentRequests'
  ];

  var supabaseClient = null;
  var isSupabaseConfigured = false;
  var supabaseScriptAdded = false;

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
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(key + '_updated', Date.now().toString());
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }

    if (!isSupabaseConfigured) initSupabase();
    if (!isSupabaseConfigured || !supabaseClient) {
      return { success: true, local: true };
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
          .single();

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
        .single();

      if (q.error && q.error.code !== 'PGRST116') {
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
        .single();
      if (q.error || !q.data) return null;
      var t = new Date(q.data.updated_at).getTime();
      localStorage.setItem(key, JSON.stringify(q.data.value));
      localStorage.setItem(key + '_updated', t.toString());
      return q.data.value;
    } catch (e) {
      return null;
    }
  }

  window.supabaseSync = {
    init: initSupabase,
    save: saveToCloud,
    load: loadFromCloud,
    sync: syncData,
    syncAll: syncAllData,
    refresh: forceRefreshFromCloud,
    isConfigured: function () { return isSupabaseConfigured; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }
})();
