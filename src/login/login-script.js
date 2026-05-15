'use strict';

// ==================== CONSTANTS ====================

const SOFTTECH_ID   = '__softtech__';
const SOFTTECH_NAME = 'SoftTech';

const ADMIN_USERNAME = 'adm';
const ADMIN_NAME     = 'Administrador';
const ADMIN_PASSWORD_HASH = "fmAvLiwiJztcXVs/Pjw6fH17K18pKComXiUkI0AhNDA0eXRpcnVjZVNuaW1kQX5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAIW1ldHN5U2F0ZUJtdWluaW1vRH5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAITQyMDJnb3JQZXVzb0o9WVdiQlpIVHBkWGFLcEhkamhsVno5Q1VxZG5ObWhVTTNzVU00QTNTRDlXYllsV1ZybEVNQmhtVEVGRU1saGxVd05tYldwbVdXNVVkaGRWTXJGRlZ4b2xWeW8wUVh0R2FWTjJSU2xWV1ZSM2RUZGtVeEYyUjRkVlpxeEdSV2hsUnJKMmExUVhZR1psVE5OalRXUkZWU0pVVHg0VVJQWkZacGQxVjRobFZ1cDBjU1ZWTURGMlJ4VWxVWGQzZGFWRU40SlZNdmxIVnJSV2FSTkRhSWRGYnJGVFl5SVZWalpFWk9sbFZ3TkhWVlIzVE5aa1c1Rm1Sa2RWWXRKbGNXWkZjelpGYlpkbldFNWtWVFZFY1hsbE1vdG1VWFpWV1cxV01vTldNS0puVnN4V1lOZGtSd1JtUms5VVRGcEZkVngyWXhZbFZTWmpUSFIzVldabFN6WlZWTmhuVlZGRFVXcG1RVlpWTUtoVldXaDJhUzFtVmFkVmI0bDJVd1VUZFdabFdIVkdiRzltV0dabFRaZGxVelZsYmt0bVVXcFZXUnBtVFZWbE1TSlhWeFEyU1dGalNvRm1SYWRWWnRSR1NXRkRadkptUldsMFZzcDFVbFJFYTBaRk1rZFhUV0psY1I1R2NwNWtWd05YV1dSV1lpWmtWWWRWYjRkVlY2WkVTWkZEWmhaVmJLTlZZR2hHV090R2NYZDFWc2RsVlZGalNUcG1Sb1ZsTVJoM1ZZWjBWTmRsVVlwVlJXdDJVRnBGU1p0R2RURkdiYWgzVnRSWFZYeFdTNGxGVk9GV1RYWmtka1prVlZkRlJWZG5WVlZ6VlN4R2M2UlZieGMxVXlnMlZXTlRUeDBrUldWMVZ0UkhXWlpsV1hsbGJvSmxWc3BGTmlKRGVYWkZWV1JuVndnMlNTMW1Tb1ZsYUNwbFV4QTNjV0pEZWhKMVZLbGtZR3BsVGlOalUwWkZiYU5rVkhaRlZrZFVNWVJsZUZkWFZzcDBkaXhtV0hkRmJhcFZWeEEzY1dabFJQMUViSmhIVlVaa1ZrVjFiM2xWTXd0bVlHcFVVWDFHZVROMk1DVm5WWUoxVU5KalJ2UjJSeGdWWkdCM1ZVaEZaUGRsUlNkbFVySjFWWFJrVklsVk1rTmxVeDRVZGlWRWFYZDFSbmxuVnMxRWVpWlZXNE5WVmFkbFV5STFWWHRtVkxKbFZrZGxXRVprYU9aRWN6UlZWa2RrVUdwbGVqWmtXYUZHU29SblY2WjBjTlZWTUVSbGFHZDFVR2xGZWFaa1NYSm1SV0ZsVXNSMlVTMVdVNlpsVm9ObFlzcDFiWHRtV28xVVJ3aEVWVmxETk5aRWJHcFZSa3htVklGa2VYUmxVUDFrVktGMlVySlZZbFZsUlpaVlZ4OFVZc0pWV2FSa1JUUkZNS1YxVnVwMFFUZGtUeU4xYVNsR1ZzbFVlWlZGWlRKR2JrVlhUV0pWVVNSRmJZbGxiQkZqVnlVRWVOZFZNU0ptUktsMVZXSjFjTkpUVDNaRmJrbFdZRlYwZFRkRmRXRm1Wb1JuWXc0RVRqUjBaNE5sZWpoM1VIbGxNa0pEY1J4ME1PZDFWSDVFTWx0R2N3Um1NczFFWnJaRWRhZFdQOW8wYnpWWFpRSjNibkpETXlRVElBTkNKbDRsSnFnU0tmdHllOXhuTzg0elBiMUZYN2NpSXM0eUxnNUhSdjFXYXVsV2R0SlVaMEYyVTVOSGRsMVdJQU5DSmw0bEpxZ1NLZnR5ZTl4bk84NHpQYjFGWDdjaUlzNHlMZzVYUWsxV2F1TlZaalZuY3BSWGUwQUROaEEwSWtVaVhtb0NLcDgxSzcxSGY2d2pQL3NWWGN0ekppd2lMdkFtZg==";

// ==================== RATE LIMITING ====================

const RATE_LIMIT = {
  maxAttempts: 5,
  windowMs:    5 * 60 * 1000,
  lockoutMs:   10 * 60 * 1000
};
const RATE_LIMIT_KEY = '_login_rate';

function getRateLimitState() {
  try { return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}'); }
  catch (_) { return {}; }
}
function setRateLimitState(s) {
  try { localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(s)); } catch (_) {}
}
function checkRateLimit() {
  const now = Date.now(), s = getRateLimitState();
  if (s.lockedUntil && now < s.lockedUntil)
    return { blocked: true, remaining: Math.ceil((s.lockedUntil - now) / 1000) };
  if (!s.windowStart || (now - s.windowStart) > RATE_LIMIT.windowMs) {
    setRateLimitState({ windowStart: now, attempts: 0 });
    return { blocked: false };
  }
  if ((s.attempts || 0) >= RATE_LIMIT.maxAttempts) {
    const lockUntil = now + RATE_LIMIT.lockoutMs;
    setRateLimitState({ ...s, lockedUntil: lockUntil });
    return { blocked: true, remaining: Math.ceil(RATE_LIMIT.lockoutMs / 1000) };
  }
  return { blocked: false };
}
function recordFailedAttempt() {
  const now = Date.now(), s = getRateLimitState();
  const active = s.windowStart && (now - s.windowStart) < RATE_LIMIT.windowMs;
  setRateLimitState({ windowStart: active ? s.windowStart : now, attempts: active ? (s.attempts || 0) + 1 : 1 });
}
function clearRateLimit() {
  try { localStorage.removeItem(RATE_LIMIT_KEY); } catch (_) {}
}

// ==================== HASH FUNCTIONS ====================

function hashForOperador(input) {
  if (input == null) input = '';
  const s1 = "JosueProg2024!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  const s2 = "DominiumBetaSystem!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  const s3 = "AdminSecurity404!@#$%^&*()_+{}|:<>?[]\\;'\",./`~";
  let h = String(input);
  const layer = (v, salt) => btoa((v + salt).split('').reverse().join(''));
  h = layer(h, s1); h = layer(h, s2); h = layer(h, s3);
  h = layer(h, s1); h = layer(h, s2); h = layer(h, s3);
  h = layer(h, s1 + s2 + s3); h = layer(h, s1 + s2 + s3);
  return h;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(16);
}

function hashForCliente(input) {
  if (!input && input !== 0) return '';
  const str = String(input);
  let h = window.sha256 ? window.sha256(str) : simpleHash(str);
  const s1 = 'S3rC0n@2024!', s2 = 'D0m!n!uM#', s3 = 'H@$h++Adv@nced';
  const layer = (v, salt) => {
    const c = `${salt}${v}${salt.split('').reverse().join('')}`;
    return window.sha256 ? window.sha256(c) : simpleHash(c);
  };
  h = layer(h, s1); h = layer(h, s2); h = layer(h, s3);
  h = layer(h, s1); h = layer(h, s2); h = layer(h, s3);
  h = layer(h, s1 + s2 + s3); h = layer(h, s1 + s2 + s3);
  return h;
}

// ==================== UTILITIES ====================

function safeJsonParse(str, def) {
  try { if (!str || str === 'null') return def; const p = JSON.parse(str); return p !== null ? p : def; }
  catch (_) { return def; }
}

function normalizeStr(s) { return (s || '').trim().toLowerCase(); }

// ==================== DATA ACCESS ====================

function getOperadores() {
  const raw  = safeJsonParse(localStorage.getItem('users'), []);
  const arr  = Array.isArray(raw) ? raw : Object.values(raw || {}).filter(Boolean);
  const admin = {
    username: ADMIN_USERNAME, fullName: ADMIN_NAME, sector: 'Administração',
    role: 'admin', status: 'active', mustResetPassword: false,
    passwordHash: ADMIN_PASSWORD_HASH,
    profileImage: '../../assets/images/avatars/profile-1.png', createdAt: Date.now()
  };
  const others = arr.filter(u => normalizeStr(u.username) !== ADMIN_USERNAME && u.username);
  const existing = arr.find(u => normalizeStr(u.username) === ADMIN_USERNAME);
  const merged = existing
    ? { ...admin, ...existing, passwordHash: ADMIN_PASSWORD_HASH, role: 'admin', status: 'active' }
    : admin;
  return [merged, ...others];
}

function getContributors() { return safeJsonParse(localStorage.getItem('contributors'), []); }
function getEmployees()    { return safeJsonParse(localStorage.getItem('contributorEmployees'), []); }

// ==================== AUTH LOGIC ====================

function tryOperadorAuth(username, password) {
  const users = getOperadores();
  const user  = users.find(u => normalizeStr(u.username) === normalizeStr(username));
  if (!user) return null;
  const hashed = hashForOperador(password || '');
  if (user.passwordHash && hashed !== user.passwordHash) return { success: false, error: 'Senha incorreta.' };
  return { success: true, user };
}

/** Encontra o match do contribuinte/funcionário dentro de uma empresa específica */
function findMatchInContributor(contributor, username) {
  const normalizedUsername = normalizeStr(username);
  if (normalizedUsername === 'adm') {
    return { contributor, employee: null };
  }
  const employee = getEmployees().find(e =>
    e.contributorId === contributor.id &&
    normalizeStr(e.username) === normalizedUsername
  );
  return employee ? { contributor, employee } : null;
}

function verifyContributorPassword(match, password) {
  const { contributor, employee } = match;
  const hashed = hashForCliente(password);
  if (employee) {
    if (!employee.passwordHash) return true;
    return hashed === employee.passwordHash;
  }
  const defaultHash = hashForCliente('12345');
  if (contributor.mustResetPassword !== false) return hashed === defaultHash;
  return hashed === (contributor.supportPasswordHash || defaultHash);
}

// ==================== EMPRESA DROPDOWN ====================

/** Empresa selecionada pelo usuário — null até ser escolhida */
let _selectedEmpresa = null;

/** Lista de opções carregada do localStorage */
let _empresaOptions = [];

/** Monta a lista: SoftTech (topo) + todos os contribuintes ativos */
function buildEmpresaOptions() {
  const contributors = getContributors();
  const opts = [{ id: SOFTTECH_ID, label: SOFTTECH_NAME, type: 'softtech' }];
  contributors.forEach(c => {
    if (c.razaoSocial && c.status !== 'inactive') {
      opts.push({ id: c.id, label: c.razaoSocial, type: 'contributor' });
    }
  });
  _empresaOptions = opts;
}

/** Renderiza os itens do dropdown, filtrando pelo texto digitado */
function renderEmpresaDropdown(filter) {
  const dropdown = document.getElementById('empresaDropdown');
  if (!dropdown) return;

  const q = normalizeStr(filter || '');
  const filtered = _empresaOptions.filter(o => !q || normalizeStr(o.label).includes(q));

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="empresa-dropdown-empty">Nenhuma empresa encontrada</div>';
    return;
  }

  // Separa SoftTech dos contribuintes com um separador visual
  const hasBoth = filtered.some(o => o.type === 'softtech') && filtered.some(o => o.type === 'contributor');

  dropdown.innerHTML = filtered.map((o, idx) => {
    const sep = hasBoth && idx > 0 && filtered[idx - 1].type === 'softtech' && o.type === 'contributor'
      ? '<div class="empresa-dropdown-separator"></div>'
      : '';
    const icon   = o.type === 'softtech' ? 'bxs-briefcase' : 'bxs-buildings';
    const badge  = o.type === 'softtech' ? '<span class="empresa-tag">Operador</span>' : '';
    const sel    = _selectedEmpresa?.id === o.id ? ' selected' : '';
    return `${sep}<div class="empresa-dropdown-item${sel}" data-id="${o.id}" data-label="${o.label}" data-type="${o.type}">
      <i class="bx ${icon}"></i><span>${o.label}</span>${badge}
    </div>`;
  }).join('');

  dropdown.querySelectorAll('.empresa-dropdown-item').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.preventDefault(); // evita blur no input antes do click processar
      selectEmpresa({ id: el.dataset.id, label: el.dataset.label, type: el.dataset.type });
    });
  });
}

function selectEmpresa(opt) {
  _selectedEmpresa = opt;
  const input = document.getElementById('inputEmpresa');
  if (input) input.value = opt.label;
  closeEmpresaDropdown();
  setTimeout(() => document.getElementById('inputUsername')?.focus(), 50);
}

function openEmpresaDropdown() {
  const dd  = document.getElementById('empresaDropdown');
  const ico = document.getElementById('empresaChevron');
  if (!dd) return;
  renderEmpresaDropdown(document.getElementById('inputEmpresa')?.value || '');
  dd.classList.remove('hidden');
  if (ico) ico.className = 'bx bx-chevron-up';
}

function closeEmpresaDropdown() {
  const dd  = document.getElementById('empresaDropdown');
  const ico = document.getElementById('empresaChevron');
  if (dd)  dd.classList.add('hidden');
  if (ico) ico.className = 'bx bx-chevron-down';
}

function initEmpresaDropdown() {
  buildEmpresaOptions();

  const input = document.getElementById('inputEmpresa');
  const btn   = document.getElementById('empresaDropdownBtn');
  const dd    = document.getElementById('empresaDropdown');

  btn?.addEventListener('click', e => {
    e.preventDefault();
    dd?.classList.contains('hidden') ? openEmpresaDropdown() : closeEmpresaDropdown();
  });

  input?.addEventListener('focus', () => {
    if (dd?.classList.contains('hidden')) openEmpresaDropdown();
  });

  input?.addEventListener('input', () => {
    _selectedEmpresa = null;
    renderEmpresaDropdown(input.value);
    if (dd?.classList.contains('hidden')) openEmpresaDropdown();
  });

  // Fecha ao clicar fora do grupo
  document.addEventListener('click', e => {
    const group = document.getElementById('empresaGroup');
    if (group && !group.contains(e.target)) closeEmpresaDropdown();
  });
}

/** Tenta resolver a empresa pelo texto digitado (usado se o usuário digitou sem selecionar) */
function resolveEmpresaByText(text) {
  const q = normalizeStr(text);
  if (!q) return null;
  if (q === normalizeStr(SOFTTECH_NAME) || q === 'softtech')
    return { id: SOFTTECH_ID, label: SOFTTECH_NAME, type: 'softtech' };
  const c = getContributors().find(c => normalizeStr(c.razaoSocial) === q);
  if (c) return { id: c.id, label: c.razaoSocial, type: 'contributor' };
  return null;
}

// ==================== SESSION WRITE ====================

function loginAsOperador(user, password) {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('clientName', user.fullName || user.username || '');
  localStorage.setItem('_session_at', Date.now().toString());
  clearRateLimit();
  if (password && typeof supabaseAuth !== 'undefined' && supabaseAuth.migrateLocalUser) {
    supabaseAuth.migrateLocalUser(user.username, password).catch(() => {});
  }
  window.location.href = '../operador/';
}

function loginAsContributor(match, password) {
  const { contributor, employee } = match;
  localStorage.setItem('_session_at', Date.now().toString());
  const supportUser = employee
    ? { username: employee.username, fullName: employee.fullName, role: 'employee',
        contributorId: contributor.id, employeeId: employee.id,
        mustResetPassword: false, status: contributor.status || 'active' }
    : { username: 'adm', fullName: contributor.razaoSocial, role: 'contributor',
        contributorId: contributor.id,
        mustResetPassword: contributor.mustResetPassword !== false,
        status: contributor.status || 'pending' };

  localStorage.setItem('supportCurrentUser', JSON.stringify(supportUser));
  if (contributor.chatId) localStorage.setItem('chatId', contributor.chatId);
  const razao = (contributor.razaoSocial || '').trim();
  if (razao) { localStorage.setItem('clientName', razao); localStorage.setItem('supportLastRazaoSocial', razao); }
  localStorage.setItem('_session_at', Date.now().toString());
  clearRateLimit();

  const loginUsername = employee ? employee.username : ('contrib_' + contributor.id);
  if (password && typeof supabaseAuth !== 'undefined' && supabaseAuth.migrateLocalUser) {
    supabaseAuth.migrateLocalUser(loginUsername, password).catch(() => {});
  }
  window.location.href = '../cliente/';
}

// ==================== UI STATE ====================

function showError(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  const span = el.querySelector('span');
  if (span) span.textContent = msg; else el.textContent = msg;
  el.classList.remove('hidden');
}
function clearError() {
  document.getElementById('loginError')?.classList.add('hidden');
}
function setLoading(v) {
  const btn     = document.getElementById('loginBtn');
  const spinner = document.getElementById('loginSpinner');
  if (!btn) return;
  btn.disabled = v;
  spinner?.classList.toggle('hidden', !v);
}

function togglePasswordVisibility() {
  const input = document.getElementById('inputPassword');
  const icon  = document.getElementById('togglePasswordIcon');
  if (!input || !icon) return;
  const hide = input.type === 'password';
  input.type = hide ? 'text' : 'password';
  icon.className = hide ? 'bx bx-show' : 'bx bx-hide';
}

// ==================== FORM SUBMIT ====================

function handleFormSubmit(e) {
  e.preventDefault();
  clearError();

  // Rate limit
  const rl = checkRateLimit();
  if (rl.blocked) {
    const min = Math.ceil(rl.remaining / 60);
    showError(`Muitas tentativas. Aguarde ${min} minuto${min !== 1 ? 's' : ''} e tente novamente.`);
    return;
  }

  const empresaText = (document.getElementById('inputEmpresa')?.value || '').trim();
  const username    = (document.getElementById('inputUsername')?.value  || '').trim();
  const password    = document.getElementById('inputPassword')?.value   || '';

  if (!empresaText) {
    showError('Selecione ou informe a empresa.');
    document.getElementById('inputEmpresa')?.focus();
    return;
  }
  if (!username || !password) {
    showError('Preencha o usuário e a senha.');
    return;
  }

  // Resolver empresa: prioriza seleção via dropdown, fallback para texto digitado
  const empresa = _selectedEmpresa || resolveEmpresaByText(empresaText);
  if (!empresa) {
    showError('Empresa não encontrada. Selecione da lista.');
    openEmpresaDropdown();
    return;
  }

  setLoading(true);

  setTimeout(() => {
    try {
      if (empresa.type === 'softtech') {
        // ── Caminho OPERADOR ──
        const result = tryOperadorAuth(username, password);
        if (result === null) {
          recordFailedAttempt();
          showError('Usuário não encontrado na SoftTech.');
          setLoading(false);
          return;
        }
        if (!result.success) {
          recordFailedAttempt();
          showError(result.error);
          setLoading(false);
          return;
        }
        loginAsOperador(result.user, password);

      } else {
        // ── Caminho CONTRIBUINTE ──
        const contributor = getContributors().find(c => c.id === empresa.id);
        if (!contributor) {
          showError('Empresa não encontrada no sistema.');
          setLoading(false);
          return;
        }
        const match = findMatchInContributor(contributor, username);
        if (!match) {
          recordFailedAttempt();
          showError('Usuário não encontrado nesta empresa.');
          setLoading(false);
          return;
        }
        if (!verifyContributorPassword(match, password)) {
          recordFailedAttempt();
          showError('Senha incorreta.');
          setLoading(false);
          return;
        }
        loginAsContributor(match, password);
      }
    } catch (err) {
      showError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  }, 50);
}

// ==================== THEME ====================

function applyTheme() {
  const saved = localStorage.getItem('operador-theme');
  const dark  = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeToggleIcon');
  const btn  = document.getElementById('themeToggleBtn');
  if (icon) icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
  if (btn)  btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('operador-theme', next);
  const icon = document.getElementById('themeToggleIcon');
  const btn  = document.getElementById('themeToggleBtn');
  if (icon) icon.className = next === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
  if (btn)  btn.title = next === 'dark' ? 'Modo claro' : 'Modo escuro';
}

// ==================== SESSION TIMEOUT ====================

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;

function checkSessionExpiry() {
  const at = parseInt(localStorage.getItem('_session_at') || '0', 10);
  if (!at) return false;
  if ((Date.now() - at) > SESSION_TIMEOUT_MS) {
    ['isAuthenticated','currentUser','clientName','supportCurrentUser',
     'chatId','supportLastRazaoSocial','_session_at'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    if (typeof supabaseAuth !== 'undefined') supabaseAuth.signOut?.().catch(() => {});
    return true;
  }
  return false;
}

// ==================== ALREADY LOGGED IN CHECK ====================

function checkAlreadyLoggedIn() {
  if (checkSessionExpiry()) return false;
  if (localStorage.getItem('isAuthenticated') === 'true' && localStorage.getItem('currentUser')) {
    window.location.href = '../operador/';
    return true;
  }
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

  initEmpresaDropdown();

  document.getElementById('loginForm')?.addEventListener('submit', handleFormSubmit);
  document.getElementById('togglePasswordBtn')?.addEventListener('click', togglePasswordVisibility);
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleT