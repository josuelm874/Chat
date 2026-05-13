'use strict';

// ==================== CONSTANTS ====================

const ADMIN_USERNAME = 'adm';
const ADMIN_NAME = 'Administrador';
const ADMIN_PASSWORD_HASH = "fmAvLiwiJztcXVs/Pjw6fH17K18pKComXiUkI0AhNDA0eXRpcnVjZVNuaW1kQX5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAIW1ldHN5U2F0ZUJtdWluaW1vRH5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAITQyMDJnb3JQZXVzb0o9WVdiQlpIVHBkWGFLcEhkamhsVno5Q1VxZG5ObWhVTTNzVU00QTNTRDlXYllsV1ZybEVNQmhtVEVGRU1saGxVd05tYldwbVdXNVVkaGRWTXJGRlZ4b2xWeW8wUVh0R2FWTjJSU2xWV1ZSM2RUZGtVeEYyUjRkVlpxeEdSV2hsUnJKMmExUVhZR1psVE5OalRXUkZWU0pVVHg0VVJQWkZacGQxVjRobFZ1cDBjU1ZWTURGMlJ4VWxVWGQzZGFWRU40SlZNdmxIVnJSV2FSTkRhSWRGYnJGVFl5SVZWalpFWk9sbFZ3TkhWVlIzVE5aa1c1Rm1Sa2RWWXRKbGNXWkZjelpGYlpkbldFNWtWVFZFY1hsbE1vdG1VWFpWV1cxV01vTldNS0puVnN4V1lOZGtSd1JtUms5VVRGcEZkVngyWXhZbFZTWmpUSFIzVldabFN6WlZWTmhuVlZGRFVXcG1RVlpWTUtoVldXaDJhUzFtVmFkVmI0bDJVd1VUZFdabFdIVkdiRzltV0dabFRaZGxVelZsYmt0bVVXcFZXUnBtVFZWbE1TSlhWeFEyU1dGalNvRm1SYWRWWnRSR1NXRkRadkptUldsMFZzcDFVbFJFYTBaRk1rZFhUV0psY1I1R2NwNWtWd05YV1dSV1lpWmtWWWRWYjRkVlY2WkVTWkZEWmhaVmJLTlZZR2hHV090R2NYZDFWc2RsVlZGalNUcG1Sb1ZsTVJoM1ZZWjBWTmRsVVlwVlJXdDJVRnBGU1p0R2RURkdiYWgzVnRSWFZYeFdTNGxGVk9GV1RYWmtka1prVlZkRlJWZG5WVlZ6VlN4R2M2UlZieGMxVXlnMlZXTlRUeDBrUldWMVZ0UkhXWlpsV1hsbGJvSmxWc3BGTmlKRGVYWkZWV1JuVndnMlNTMW1Tb1ZsYUNwbFV4QTNjV0pEZWhKMVZLbGtZR3BsVGlOalUwWkZiYU5rVkhaRlZrZFVNWVJsZUZkWFZzcDBkaXhtV0hkRmJhcFZWeEEzY1dabFJQMUViSmhIVlVaa1ZrVjFiM2xWTXd0bVlHcFVVWDFHZVROMk1DVm5WWUoxVU5KalJ2UjJSeGdWWkdCM1ZVaEZaUGRsUlNkbFVySjFWWFJrVklsVk1rTmxVeDRVZGlWRWFYZDFSbmxuVnMxRWVpWlZXNE5WVmFkbFV5STFWWHRtVkxKbFZrZGxXRVprYU9aRWN6UlZWa2RrVUdwbGVqWmtXYUZHU29SblY2WjBjTlZWTUVSbGFHZDFVR2xGZWFaa1NYSm1SV0ZsVXNSMlVTMVdVNlpsVm9ObFlzcDFiWHRtV28xVVJ3aEVWVmxETk5aRWJHcFZSa14yVUlGa2VYUmxVUDFrVktGMlVySlZZbFZsUlpaVlZ4OFVZc0pWV2FSa1JUUkZNS1YxVnVwMFFUZGtUeU4xYVNsR1ZzbFVlWlZGWlRKR2JrVlhUV0pWVVNSRmJZbGxiQkZqVnlVRWVOZFZNU0ptUktsMVZXSjFjTkpUVDNaRmJrbFdZRlYwZFRkRmRXRm1Wb1JuWXc0RVRqUjBaNE5sZWpoM1VIbGxNa0pEY1J4ME1PZDFWSDVFTWx0R2N3Um1NczFFWnJaRWRhZFdQOW8wYnpWWFpRSjNibkpETXlRVElBTkNKbDRsSnFnU0tmdHllOXhuTzg0elBiMUZYN2NpSXM0eUxnNUhSdjFXYXVsV2R0SlVaMEYyVTVOSGRsMVdJQU5DSmw0bEpxZ1NLZnR5ZTl4bk84NHpQYjFGWDdjaUlzNHlMZzVYUWsxV2F1TlZaalZuY3BSWGUwQUROaEEwSWtVaVhtb0NLcDgxSzcxSGY2d2pQL3NWWGN0ekppd2lMdkFtZg==";

// ==================== RATE LIMITING ====================

const RATE_LIMIT = {
  maxAttempts: 5,       // máximo de tentativas
  windowMs: 5 * 60 * 1000,   // janela de 5 minutos
  lockoutMs: 10 * 60 * 1000  // bloqueio de 10 minutos após limite
};

const RATE_LIMIT_KEY = '_login_rate';

function getRateLimitState() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function setRateLimitState(state) {
  try { localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state)); } catch (_) {}
}

/**
 * Verifica se o login está bloqueado por rate limiting.
 * @returns {{ blocked: boolean, remaining?: number }} remaining em segundos
 */
function checkRateLimit() {
  const now = Date.now();
  const state = getRateLimitState();

  // Verificar lockout ativo
  if (state.lockedUntil && now < state.lockedUntil) {
    const remaining = Math.ceil((state.lockedUntil - now) / 1000);
    return { blocked: true, remaining };
  }

  // Limpar se janela expirou
  if (!state.windowStart || (now - state.windowStart) > RATE_LIMIT.windowMs) {
    setRateLimitState({ windowStart: now, attempts: 0 });
    return { blocked: false };
  }

  // Verificar número de tentativas
  if ((state.attempts || 0) >= RATE_LIMIT.maxAttempts) {
    const lockUntil = now + RATE_LIMIT.lockoutMs;
    setRateLimitState({ ...state, lockedUntil: lockUntil });
    return { blocked: true, remaining: Math.ceil(RATE_LIMIT.lockoutMs / 1000) };
  }

  return { blocked: false };
}

function recordFailedAttempt() {
  const now = Date.now();
  const state = getRateLimitState();
  const windowActive = state.windowStart && (now - state.windowStart) < RATE_LIMIT.windowMs;
  setRateLimitState({
    windowStart: windowActive ? state.windowStart : now,
    attempts: windowActive ? (state.attempts || 0) + 1 : 1
  });
}

function clearRateLimit() {
  try { localStorage.removeItem(RATE_LIMIT_KEY); } catch (_) {}
}

// ==================== HASH FUNCTIONS ====================

// Operador hash — btoa multi-layer (must match operador-script.js exactly)
function hashForOperador(input) {
  if (input == null) input = '';
  const salt1 = "JosueProg2024!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  const salt2 = "DominiumBetaSystem!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  const salt3 = "AdminSecurity404!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  let hash = String(input);
  const applyLayer = (value, salt) => {
    let result = value + salt;
    result = result.split('').reverse().join('');
    return btoa(result);
  };
  hash = applyLayer(hash, salt1);
  hash = applyLayer(hash, salt2);
  hash = applyLayer(hash, salt3);
  hash = applyLayer(hash, salt1);
  hash = applyLayer(hash, salt2);
  hash = applyLayer(hash, salt3);
  hash = applyLayer(hash, salt1 + salt2 + salt3);
  hash = applyLayer(hash, salt1 + salt2 + salt3);
  return hash;
}

// Contribuinte hash — simpleHash multi-layer (must match cliente-script.js exactly)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function hashForCliente(input) {
  if (!input && input !== 0) return '';
  const str = String(input);
  let hash = window.sha256 ? window.sha256(str) : simpleHash(str);
  const salt1 = 'S3rC0n@2024!';
  const salt2 = 'D0m!n!uM#';
  const salt3 = 'H@$h++Adv@nced';
  const applyLayer = (value, salt) => {
    const combined = `${salt}${value}${salt.split('').reverse().join('')}`;
    return window.sha256 ? window.sha256(combined) : simpleHash(combined);
  };
  hash = applyLayer(hash, salt1);
  hash = applyLayer(hash, salt2);
  hash = applyLayer(hash, salt3);
  hash = applyLayer(hash, salt1);
  hash = applyLayer(hash, salt2);
  hash = applyLayer(hash, salt3);
  hash = applyLayer(hash, salt1 + salt2 + salt3);
  hash = applyLayer(hash, salt1 + salt2 + salt3);
  return hash;
}

// ==================== UTILITIES ====================

function safeJsonParse(str, def) {
  try {
    if (!str || str === 'null' || str === 'undefined') return def;
    const parsed = JSON.parse(str);
    return parsed !== null ? parsed : def;
  } catch (_) {
    return def;
  }
}

function normalizeStr(s) {
  return (s || '').trim().toLowerCase();
}

// ==================== DATA ACCESS ====================

function getOperadores() {
  const raw = safeJsonParse(localStorage.getItem('users'), []);
  const arr = Array.isArray(raw) ? raw : Object.values(raw || {}).filter(Boolean);
  // Always ensure the admin user is present with the correct hash
  const admin = {
    username: ADMIN_USERNAME,
    fullName: ADMIN_NAME,
    sector: 'Administrativo',
    role: 'admin',
    status: 'active',
    mustResetPassword: false,
    passwordHash: ADMIN_PASSWORD_HASH,
    profileImage: '../../assets/images/avatars/profile-1.png',
    createdAt: Date.now()
  };
  const others = arr.filter(u => normalizeStr(u.username) !== ADMIN_USERNAME && u.username);
  const existingAdmin = arr.find(u => normalizeStr(u.username) === ADMIN_USERNAME);
  const mergedAdmin = existingAdmin ? { ...admin, ...existingAdmin, passwordHash: ADMIN_PASSWORD_HASH, role: 'admin', status: 'active' } : admin;
  return [mergedAdmin, ...others];
}

function getContributors() {
  return safeJsonParse(localStorage.getItem('contributors'), []);
}

function getEmployees() {
  return safeJsonParse(localStorage.getItem('contributorEmployees'), []);
}

// ==================== AUTH LOGIC ====================

// Returns { success, user } or { success: false, error }
function tryOperadorAuth(username, password) {
  const users = getOperadores();
  const normalizedUsername = normalizeStr(username);
  const user = users.find(u => normalizeStr(u.username) === normalizedUsername);
  if (!user) return null; // not an operator — caller should try contributor

  const hashed = hashForOperador(password || '');
  if (user.passwordHash && hashed !== user.passwordHash) {
    return { success: false, error: 'Senha incorreta.' };
  }
  return { success: true, user };
}

// Returns array of match objects: { contributor, employee: null|object }
// For "adm": all contributors are candidates
// For other usernames: contributors that have an employee with that username
function findContributorMatches(username) {
  const normalizedUsername = normalizeStr(username);
  const contributors = getContributors();

  if (normalizedUsername === 'adm') {
    return contributors.map(c => ({ contributor: c, employee: null }));
  }

  const employees = getEmployees();
  const matches = [];
  for (const employee of employees) {
    if (normalizeStr(employee.username) !== normalizedUsername) continue;
    const contributor = contributors.find(c => c.id === employee.contributorId);
    if (contributor) matches.push({ contributor, employee });
  }
  return matches;
}

// Returns true if password is correct for the given match
function verifyContributorPassword(match, password) {
  const { contributor, employee } = match;
  const hashed = hashForCliente(password);

  if (employee) {
    // Employee: compare against employee.passwordHash
    if (!employee.passwordHash) return true; // no password set — allow
    return hashed === employee.passwordHash;
  } else {
    // Contributor "adm" login
    const defaultHash = hashForCliente('12345');
    const requiresDefault = contributor.mustResetPassword !== false;
    if (requiresDefault) {
      return hashed === defaultHash;
    }
    const expected = contributor.supportPasswordHash || defaultHash;
    return hashed === expected;
  }
}

// ==================== SUPABASE AUTH (migração silenciosa) ====================

/**
 * Após autenticação local bem-sucedida, migra o usuário para o Supabase Auth
 * de forma transparente em background (fire-and-forget).
 * Não bloqueia nem afeta o fluxo de login.
 */
function triggerSupabaseAuthMigration(username, password) {
  // Só executa se auth.js foi carregado e Supabase está configurado
  if (typeof supabaseAuth === 'undefined') return;
  if (!supabaseAuth.isConfigured()) return;

  // Fire-and-forget: executa em background
  supabaseAuth.migrateLocalUser(username, password).catch(function () {
    // Silencioso — falha aqui não afeta o login
  });
}

// ==================== SESSION WRITE ====================

function loginAsOperador(user, password) {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('clientName', user.fullName || user.username || '');
  localStorage.setItem('_session_at', Date.now().toString());
  clearRateLimit();

  // Migração para Supabase Auth em background
  if (password) triggerSupabaseAuthMigration(user.username, password);

  window.location.href = '../operador/';
}

function loginAsContributor(match, password) {
  const { contributor, employee } = match;

  let supportUser;
  if (employee) {
    supportUser = {
      username: employee.username,
      fullName: employee.fullName,
      role: 'employee',
      contributorId: contributor.id,
      employeeId: employee.id,
      mustResetPassword: false,
      status: contributor.status || 'active'
    };
  } else {
    supportUser = {
      username: 'adm',
      fullName: contributor.razaoSocial,
      role: 'contributor',
      contributorId: contributor.id,
      mustResetPassword: contributor.mustResetPassword !== false,
      status: contributor.status || 'pending'
    };
  }

  localStorage.setItem('supportCurrentUser', JSON.stringify(supportUser));
  if (contributor.chatId) localStorage.setItem('chatId', contributor.chatId);
  const razao = (contributor.razaoSocial || '').trim();
  if (razao) {
    localStorage.setItem('clientName', razao);
    localStorage.setItem('supportLastRazaoSocial', razao);
  }
  localStorage.setItem('_session_at', Date.now().toString());
  clearRateLimit();

  // Migração para Supabase Auth em background
  const loginUsername = employee ? employee.username : ('contrib_' + contributor.id);
  if (password) triggerSupabaseAuthMigration(loginUsername, password);

  window.location.href = '../cliente/';
}

// ==================== UI STATE ====================

let pendingMatches = null;
let pendingPassword = null;

function showError(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  const span = el.querySelector('span');
  if (span) span.textContent = msg;
  else el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError() {
  const el = document.getElementById('loginError');
  if (el) el.classList.add('hidden');
}

function setLoading(loading) {
  const btn = document.getElementById('loginBtn');
  const spinner = document.getElementById('loginSpinner');
  if (!btn) return;
  btn.disabled = loading;
  if (spinner) spinner.classList.toggle('hidden', !loading);
}

function showStep(step) {
  const formStep = document.getElementById('stepForm');
  const selectorStep = document.getElementById('stepSelector');
  if (formStep) formStep.classList.toggle('hidden', step !== 'form');
  if (selectorStep) selectorStep.classList.toggle('hidden', step !== 'selector');
  clearError();
}

function renderCompanySelector(matches) {
  const list = document.getElementById('companyList');
  if (!list) return;
  list.innerHTML = '';
  matches.forEach((match, idx) => {
    const label = document.createElement('label');
    label.className = 'company-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'company';
    input.value = String(idx);
    if (idx === 0) input.checked = true;
    const span = document.createElement('span');
    span.textContent = match.contributor.razaoSocial || `Empresa ${idx + 1}`;
    label.appendChild(input);
    label.appendChild(span);
    list.appendChild(label);
  });
}

// ==================== EVENT HANDLERS ====================

function handleFormSubmit(e) {
  e.preventDefault();
  clearError();

  // Verificar rate limit ANTES de qualquer processamento
  const rateCheck = checkRateLimit();
  if (rateCheck.blocked) {
    const min = Math.ceil(rateCheck.remaining / 60);
    showError(`Muitas tentativas. Aguarde ${min} minuto${min !== 1 ? 's' : ''} e tente novamente.`);
    return;
  }

  const username = (document.getElementById('inputUsername')?.value || '').trim();
  const password = document.getElementById('inputPassword')?.value || '';

  if (!username || !password) {
    showError('Preencha o usuário e a senha.');
    return;
  }

  setLoading(true);

  // Small delay so the spinner renders before synchronous work
  setTimeout(() => {
    try {
      // 1. Try operator auth first
      const opResult = tryOperadorAuth(username, password);

      if (opResult !== null) {
        // Username exists in operator store
        if (!opResult.success) {
          recordFailedAttempt();
          showError(opResult.error);
          setLoading(false);
          return;
        }
        loginAsOperador(opResult.user, password);
        return; // redirect in progress
      }

      // 2. Try contributor / employee auth
      const matches = findContributorMatches(username);

      if (matches.length === 0) {
        recordFailedAttempt();
        showError('Usuário não encontrado.');
        setLoading(false);
        return;
      }

      if (matches.length === 1) {
        // Single match — verify password directly
        if (!verifyContributorPassword(matches[0], password)) {
          recordFailedAttempt();
          showError('Senha incorreta.');
          setLoading(false);
          return;
        }
        loginAsContributor(matches[0], password);
        return; // redirect in progress
      }

      // Multiple matches — show company selector
      // Don't verify password yet; verify after selection
      pendingMatches = matches;
      pendingPassword = password;
      renderCompanySelector(matches);
      setLoading(false);
      showStep('selector');

    } catch (err) {
      showError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  }, 50);
}

function handleSelectorConfirm() {
  if (!pendingMatches || pendingPassword === null) return;

  const selected = document.querySelector('input[name="company"]:checked');
  if (!selected) {
    showError('Selecione uma empresa.');
    return;
  }

  const idx = parseInt(selected.value, 10);
  const match = pendingMatches[idx];

  if (!verifyContributorPassword(match, pendingPassword)) {
    recordFailedAttempt();
    showError('Senha incorreta para a empresa selecionada.');
    return;
  }

  loginAsContributor(match, pendingPassword);
}

function handleSelectorBack() {
  pendingMatches = null;
  pendingPassword = null;
  showStep('form');
}

function togglePasswordVisibility() {
  const input = document.getElementById('inputPassword');
  const icon = document.getElementById('togglePasswordIcon');
  if (!input || !icon) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  icon.className = isHidden ? 'bx bx-show' : 'bx bx-hide';
}

// ==================== THEME ====================

function applyTheme() {
  const saved = localStorage.getItem('operador-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  const btn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeToggleIcon');
  if (icon) icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
  if (btn) btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('operador-theme', next);

  const icon = document.getElementById('themeToggleIcon');
  if (icon) icon.className = next === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.title = next === 'dark' ? 'Modo claro' : 'Modo escuro';
}

// ==================== SESSION TIMEOUT ====================

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * Verifica se a sessão expirou por inatividade.
 * Retorna true se a sessão expirou (e já limpou os dados).
 */
function checkSessionExpiry() {
  const at = parseInt(localStorage.getItem('_session_at') || '0', 10);
  if (!at) return false; // sem timestamp = sem sessão

  if ((Date.now() - at) > SESSION_TIMEOUT_MS) {
    // Sessão expirada — limpar tudo
    clearExpiredSession();
    return true;
  }
  return false;
}

function clearExpiredSession() {
  const keys = [
    'isAuthenticated', 'currentUser', 'clientName',
    'supportCurrentUser', 'chatId', 'supportLastRazaoSocial', '_session_at'
  ];
  keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });

  // Encerrar sessão Supabase também (não-bloqueante)
  if (typeof supabaseAuth !== 'undefined' && supabaseAuth.signOut) {
    supabaseAuth.signOut().catch(() => {});
  }
}

// ==================== ALREADY LOGGED IN CHECK ====================

function checkAlreadyLoggedIn() {
  // Verificar expiração antes de tudo
  if (checkSessionExpiry()) return false;

  // If operador session exists → go to operador
  if (localStorage.getItem('isAuthenticated') === 'true' && localStorage.getItem('currentUser')) {
    window.location.href = '../operador/';
    return true;
  }
  // If cliente session exists → go to cliente
  if (localStorage.getItem('supportCurrentUser')) {
    window.location.href = '../cliente/';
    return true;
  }
  return false;
}

// ==================== INIT ====================

function init() {
  applyTheme();
  if (checkAlreadyLoggedIn()) return;

  document.getElementById('loginForm')?.addEventListener('submit', handleFormSubmit);
  document.getElementById('togglePasswordBtn')?.addEventListener('click', togglePasswordVisibility);
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('selectorConfirmBtn')?.addEventListener('click', handleSelectorConfirm);
  document.getElementById('selectorBackBtn')?.addEventListener('click', handleSelectorBack);
}

document.addEventListener('DOMContentLoaded', init);
