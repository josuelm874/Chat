/**
 * Módulo de Autenticação — Chat UI Soft Tech
 * ============================================
 * Gerencia sessões via Supabase Auth com migração automática
 * de usuários existentes (localStorage → Supabase Auth).
 *
 * Ordem de carregamento recomendada em cada página:
 *   1. /shared/config.js
 *   2. /shared/auth.js       ← este arquivo
 *   3. /shared/supabase-sync.js
 *   4. script da página
 *
 * Como criar usuários no Supabase Auth:
 *   Dashboard → Authentication → Users → Add User
 *   Use o formato: username@chatui.local (ex: adm@chatui.local)
 *   OU deixe o sistema criar automaticamente na primeira autenticação.
 *
 * PRÉ-REQUISITO: Desabilitar confirmação de e-mail:
 *   Dashboard → Authentication → Settings → Disable email confirmations ✓
 */

(function () {
  'use strict';

  // ── Constantes ───────────────────────────────────────────────────────────

  /** Tempo máximo de sessão sem atividade (8 horas). */
  var SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;

  /** Chave localStorage para timestamp da sessão. */
  var SESSION_TS_KEY = '_session_at';

  // ── Estado interno ───────────────────────────────────────────────────────

  var _client = null;
  var _scriptLoading = false;
  var _pendingResolvers = [];
  var _stateCallbacks = [];

  // ── Config ───────────────────────────────────────────────────────────────

  function _getConfig() {
    if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE) {
      return { url: CONFIG.SUPABASE.URL, anonKey: CONFIG.SUPABASE.ANON_KEY };
    }
    return { url: '', anonKey: '' };
  }

  function _isConfigured() {
    var cfg = _getConfig();
    return !!(
      cfg.url && cfg.anonKey &&
      cfg.url !== 'SUA_URL_DO_SUPABASE_AQUI' &&
      cfg.anonKey !== 'SUA_ANON_KEY_AQUI'
    );
  }

  // ── Carregamento do client ───────────────────────────────────────────────

  /**
   * Retorna Promise<SupabaseClient | null>.
   * Carrega a biblioteca Supabase JS v2 se ainda não estiver disponível.
   * Múltiplas chamadas simultâneas são enfileiradas — apenas um <script> é injetado.
   */
  function ensureClient() {
    return new Promise(function (resolve) {
      if (_client) return resolve(_client);
      if (!_isConfigured()) return resolve(null);

      var cfg = _getConfig();

      // Biblioteca já carregada por outro módulo (ex: supabase-sync.js)
      if (window.supabase && window.supabase.createClient) {
        _createClient(cfg, resolve);
        return;
      }

      // Enfileirar até o script carregar
      _pendingResolvers.push(resolve);
      if (_scriptLoading) return;

      _scriptLoading = true;
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = function () {
        _createClient(cfg, null);
        _pendingResolvers.forEach(function (r) { r(_client); });
        _pendingResolvers = [];
      };
      script.onerror = function () {
        console.error('[auth.js] Falha ao carregar Supabase JS');
        _pendingResolvers.forEach(function (r) { r(null); });
        _pendingResolvers = [];
      };
      document.head.appendChild(script);
    });
  }

  function _createClient(cfg, resolveCallback) {
    try {
      _client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'chatui_auth'
        }
      });
      // Propaga mudanças de estado para callbacks registrados
      _client.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          _markSessionTime();
        }
        _stateCallbacks.forEach(function (cb) {
          try { cb(event, session); } catch (e) {}
        });
      });
    } catch (e) {
      console.error('[auth.js] Erro ao criar cliente Supabase:', e);
      _client = null;
    }
    if (resolveCallback) resolveCallback(_client);
  }

  // ── Utilitários ──────────────────────────────────────────────────────────

  /**
   * Converte username para e-mail interno no formato username@chatui.local.
   * Remove caracteres inválidos para garantir e-mail válido.
   */
  function toEmail(username) {
    var slug = (username || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._+-]/g, '');
    return slug + '@chatui.local';
  }

  function _markSessionTime() {
    try { localStorage.setItem(SESSION_TS_KEY, Date.now().toString()); } catch (e) {}
  }

  function _clearSessionTime() {
    try { localStorage.removeItem(SESSION_TS_KEY); } catch (e) {}
  }

  // ── API pública ──────────────────────────────────────────────────────────

  /**
   * Autentica no Supabase com username + senha.
   * Internamente usa o e-mail formato: username@chatui.local
   *
   * @returns {Promise<{success, user?, session?, error?, code?}>}
   */
  async function signIn(username, password) {
    var client = await ensureClient();
    if (!client) return { success: false, error: 'Supabase não disponível' };

    var email = toEmail(username);
    try {
      var res = await client.auth.signInWithPassword({ email: email, password: password });
      if (res.error) {
        return { success: false, error: res.error.message, code: res.error.status };
      }
      _markSessionTime();
      return { success: true, user: res.data.user, session: res.data.session };
    } catch (e) {
      return { success: false, error: e && e.message ? e.message : String(e) };
    }
  }

  /**
   * Migração silenciosa: após auth local bem-sucedida, cria/acessa conta no Supabase.
   * Permite que usuários existentes migrem automaticamente na primeira autenticação.
   * NÃO bloqueia o fluxo — chamado em background (fire-and-forget).
   *
   * Requisito: "Disable email confirmations" habilitado no Dashboard Supabase.
   *
   * @returns {Promise<boolean>} true se sessão Supabase foi criada com sucesso.
   */
  async function migrateLocalUser(username, password) {
    var client = await ensureClient();
    if (!client) return false;

    var email = toEmail(username);
    try {
      // Tentativa 1: sign in (usuário já migrado)
      var r1 = await client.auth.signInWithPassword({ email: email, password: password });
      if (!r1.error) {
        _markSessionTime();
        return true;
      }

      // Código 400 = credenciais inválidas (usuário não existe ou senha errada no Supabase)
      var isNotFound = r1.error.status === 400 ||
        r1.error.message.toLowerCase().includes('invalid login credentials') ||
        r1.error.message.toLowerCase().includes('user not found');

      if (!isNotFound) return false; // outro erro — não tentar criar

      // Tentativa 2: criar conta (auto-migration)
      var r2 = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { username: username }
        }
      });

      if (r2.error) {
        // "User already registered" = conta existe mas senha diverge → não é possível migrar
        if (r2.error.message && r2.error.message.toLowerCase().includes('already registered')) {
          console.warn('[auth.js] Usuário já existe no Supabase com senha diferente:', username);
        } else {
          console.warn('[auth.js] Falha ao criar conta Supabase:', r2.error.message);
        }
        return false;
      }

      // Tentativa 3: sign in após registro
      var r3 = await client.auth.signInWithPassword({ email: email, password: password });
      if (!r3.error) {
        _markSessionTime();
        console.log('[auth.js] Usuário migrado para Supabase Auth:', username);
        return true;
      }

      // Se ainda falhou, provavelmente precisa de confirmação de e-mail
      console.warn('[auth.js] Conta criada mas sign in falhou (verificar se email confirmation está desativado)');
      return false;

    } catch (e) {
      // Não fatal — auth local já funcionou
      console.warn('[auth.js] migrateLocalUser (não-fatal):', e && e.message ? e.message : e);
      return false;
    }
  }

  /**
   * Encerra a sessão Supabase.
   */
  async function signOut() {
    var client = await ensureClient();
    if (client) {
      try { await client.auth.signOut(); } catch (e) {}
    }
    _clearSessionTime();
  }

  /**
   * Retorna a sessão Supabase atual ou null.
   * @returns {Promise<Session|null>}
   */
  async function getSession() {
    var client = await ensureClient();
    if (!client) return null;
    try {
      var res = await client.auth.getSession();
      return res.data && res.data.session ? res.data.session : null;
    } catch (e) { return null; }
  }

  /**
   * Retorna o usuário autenticado ou null.
   * @returns {Promise<User|null>}
   */
  async function getUser() {
    var client = await ensureClient();
    if (!client) return null;
    try {
      var res = await client.auth.getUser();
      return res.data && res.data.user ? res.data.user : null;
    } catch (e) { return null; }
  }

  /**
   * Verifica se a sessão local está dentro do período de atividade (SESSION_TIMEOUT_MS).
   * Usado nas páginas protegidas para expirar sessões inativas.
   */
  function isSessionFresh() {
    var at = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10);
    if (!at) return false;
    return (Date.now() - at) < SESSION_TIMEOUT_MS;
  }

  /**
   * Atualiza o timestamp de atividade.
   * Chamar em qualquer ação do usuário para evitar expiração prematura.
   */
  function touchSession() {
    if (localStorage.getItem(SESSION_TS_KEY)) {
      _markSessionTime();
    }
  }

  /**
   * Limpa TODA a sessão: localStorage + Supabase Auth.
   * Usar no logout completo.
   */
  async function clearAllSessions() {
    var keys = [
      'isAuthenticated', 'currentUser', 'clientName',
      'supportCurrentUser', 'chatId', 'supportLastRazaoSocial',
      SESSION_TS_KEY
    ];
    keys.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    await signOut();
  }

  /**
   * Registra callback chamado em toda mudança de estado de autenticação.
   * Eventos: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, etc.
   */
  function onAuthStateChange(callback) {
    _stateCallbacks.push(callback);
  }

  // ── Exposição global ─────────────────────────────────────────────────────

  window.supabaseAuth = {
    /** Autentica via Supabase Auth */
    signIn: signIn,
    /** Migração silenciosa após auth local — chame em background */
    migrateLocalUser: migrateLocalUser,
    /** Encerra sessão (localStorage + Supabase) */
    signOut: signOut,
    /** Limpa TUDO: todas as chaves de sessão + Supabase */
    clearAllSessions: clearAllSessions,
    /** Retorna sessão Supabase atual */
    getSession: getSession,
    /** Retorna usuário Supabase atual */
    getUser: getUser,
    /** true se sessão local não expirou por inatividade */
    isSessionFresh: isSessionFresh,
    /** Atualiza timestamp de atividade */
    touchSession: touchSession,
    /** Registra callback para mudanças de estado */
    onAuthStateChange: onAuthStateChange,
    /** true se Supabase está configurado */
    isConfigured: _isConfigured,
    /** @internal Converte username → e-mail interno */
    _toEmail: toEmail,
    /** Timeout de sessão em ms (padrão: 8h) */
    SESSION_TIMEOUT_MS: SESSION_TIMEOUT_MS
  };

  // Pré-inicializar o client assim que o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ensureClient(); });
  } else {
    ensureClient();
  }

})();
