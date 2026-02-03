// ==================== FUNÇÕES UTILITÁRIAS ====================



function generateUniqueId() {

  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

}



function getCurrentTime() {

  const now = new Date();

  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

}



// Função para obter data relativa ou formatada

function getRelativeDate(date) {

  try {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    

    const yesterday = new Date(today);

    yesterday.setDate(today.getDate() - 1);

    

    const messageDate = new Date(date);

    

    // Verificar se a data é válida

    if (isNaN(messageDate.getTime())) {

      return 'Hoje'; // Fallback para hoje se data inválida

    }

    

    messageDate.setHours(0, 0, 0, 0);

    

    if (messageDate.getTime() === today.getTime()) {

      return 'Hoje';

    } else if (messageDate.getTime() === yesterday.getTime()) {

      return 'Ontem';

    } else {

      // Formato DD/MM/AAAA

      const day = String(messageDate.getDate()).padStart(2, '0');

      const month = String(messageDate.getMonth() + 1).padStart(2, '0');

      const year = messageDate.getFullYear();

      return `${day}/${month}/${year}`;

    }

  } catch (error) {

    console.error('Erro ao obter data relativa:', error);

    return 'Hoje';

  }

}



// Função para criar indicador de data

function createDateDivider(dateText) {

  const divider = document.createElement('div');

  divider.classList.add('date-divider');

  divider.innerHTML = `<div class="date-divider-box">${dateText}</div>`;

  return divider;

}



// Função para detectar se a mensagem contém apenas emojis

function isOnlyEmojis(text) {

  if (!text || !text.trim()) return false;

  

  // Regex para detectar emojis (incluindo sequências complexas)

  const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\s]+$/u;

  

  // Remove espaços e verifica

  const trimmed = text.trim();

  const result = emojiRegex.test(trimmed);

  

  if (result) {

    console.log(`✨ Detectado: Mensagem só com emojis! "${trimmed}"`);

  }

  

  return result;

}



// Função para extrair emojis de uma string (melhorada para todos os tipos)

function extractEmojis(text) {

  // Regex avançada que captura emojis simples e complexos (incluindo ZWJ sequences)

  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

  const matches = text.match(emojiRegex) || [];

  

  console.log(`🔎 Extraindo emojis de: "${text}"`);

  console.log(`   Encontrados: ${matches.length} emoji(s):`, matches);

  

  return matches;

}



// Função para converter emoji em codepoint hexadecimal (suporta emojis complexos)

function getEmojiCodepoint(emoji) {

  const codepoints = [];

  let i = 0;

  

  // Processar cada code point corretamente (suporta surrogate pairs)

  while (i < emoji.length) {

    const code = emoji.codePointAt(i);

    

    // Ignorar variantes de apresentação (FE0F e FE0E)

    if (code !== 0xFE0F && code !== 0xFE0E) {

      codepoints.push(code.toString(16).toLowerCase());

    }

    

    // Avançar 2 posições se for surrogate pair (emoji acima U+FFFF)

    i += code > 0xFFFF ? 2 : 1;

  }

  

  // Juntar com underscore para emojis complexos (ZWJ sequences, etc)

  const result = codepoints.join('_');

  console.log(`🔍 Emoji "${emoji}" → Codepoint: ${result}`);

  return result;

}



// Função para obter URL da animação Lottie do Noto Emoji

function getNotoEmojiLottieUrl(emoji) {

  const codepoint = getEmojiCodepoint(emoji);

  const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/lottie.json`;

  console.log(`📡 URL Lottie: ${url}`);

  return url;

}



// Cache de animações Lottie para performance

const lottieCache = {};



// Cache de emojis que não têm Lottie (para não tentar novamente)

const noLottieEmojis = new Set();



// Estatísticas de carregamento

const emojiStats = {

  total: 0,

  lottieSuccess: 0,

  lottieFailed: 0,

  fallback: 0

};



// Função para mostrar estatísticas de emojis

function showEmojiStats() {

  console.log('\n📊 ESTATÍSTICAS DE EMOJIS ANIMADOS:');

  console.log(`   Total processados: ${emojiStats.total}`);

  console.log(`   ✅ Com animação Lottie: ${emojiStats.lottieSuccess} (${Math.round(emojiStats.lottieSuccess/emojiStats.total*100)}%)`);

  console.log(`   📝 Fallback estático: ${emojiStats.fallback} (${Math.round(emojiStats.fallback/emojiStats.total*100)}%)`);

  console.log(`   ❌ Falhas: ${emojiStats.lottieFailed}`);

  console.log('');

}



// Função para tentar carregar Lottie com fallback automático

async function loadLottieWithFallback(emoji, lottieDiv, container) {

  const lottieUrl = getNotoEmojiLottieUrl(emoji);

  

  emojiStats.total++;

  

  // Se já sabemos que não tem Lottie, usar fallback direto

  if (noLottieEmojis.has(emoji)) {

    console.log(`💨 Emoji ${emoji} sem Lottie conhecido, usando fallback direto`);

    emojiStats.fallback++;

    useFallbackEmoji(emoji, lottieDiv);

    return;

  }

  

  // Se já está em cache, usar cache

  if (lottieCache[lottieUrl]) {

    lottieDiv.classList.remove('loading');

    

    const animation = lottie.loadAnimation({

      container: lottieDiv,

      renderer: 'svg',

      loop: true,

      autoplay: true,

      animationData: lottieCache[lottieUrl]

    });

    

    setupAnimationEvents(animation, container);

    emojiStats.lottieSuccess++;

    console.log(`✨ Emoji ${emoji} carregado do cache!`);

    return;

  }

  

  // Tentar carregar do servidor

  try {

    console.log(`⏳ Carregando ${emoji} de ${lottieUrl}`);

    

    const response = await fetch(lottieUrl);

    console.log(`📥 Resposta para ${emoji}: Status ${response.status}`);

    

    if (!response.ok) {

      throw new Error(`HTTP ${response.status}`);

    }

    

    const animationData = await response.json();

    

    // Validar se o JSON é válido

    if (!animationData || !animationData.layers) {

      throw new Error('JSON inválido');

    }

    

    lottieCache[lottieUrl] = animationData;

    lottieDiv.classList.remove('loading');

    

    console.log(`✅ JSON Lottie carregado para ${emoji}! Tamanho: ${JSON.stringify(animationData).length} bytes`);

    

    const animation = lottie.loadAnimation({

      container: lottieDiv,

      renderer: 'svg',

      loop: true,

      autoplay: true,

      animationData: animationData

    });

    

    setupAnimationEvents(animation, container);

    

    // Adicionar classe 'loaded' para animação de pulso

    setTimeout(() => {

      container.classList.add('loaded');

    }, 100);

    

    emojiStats.lottieSuccess++;

    console.log(`🎬 Emoji ${emoji} carregado com animação Lottie do Google! ✨`);

    

    // Mostrar estatísticas a cada 5 emojis processados

    if (emojiStats.total % 5 === 0) {

      showEmojiStats();

    }

    

  } catch (error) {

    // Registrar que este emoji não tem Lottie

    noLottieEmojis.add(emoji);

    emojiStats.fallback++;

    

    console.warn(`⚠️ Lottie indisponível para ${emoji} (codepoint: ${getEmojiCodepoint(emoji)})`);

    console.warn(`   Erro: ${error.message}`);

    console.warn(`   URL tentada: ${lottieUrl}`);

    console.log(`📝 Usando Noto Color Emoji estático como fallback`);

    

    useFallbackEmoji(emoji, lottieDiv);

    

    // Mostrar estatísticas

    if (emojiStats.total % 5 === 0) {

      showEmojiStats();

    }

  }

}



// Função para configurar eventos da animação

function setupAnimationEvents(animation, container) {

  // Hover para replay

  container.addEventListener('mouseenter', () => {

    animation.goToAndPlay(0);

  });

  

  // Clique para replay

  container.addEventListener('click', () => {

    animation.goToAndPlay(0);

  });

}



// Função para usar emoji fallback (estático)

function useFallbackEmoji(emoji, lottieDiv) {

  lottieDiv.classList.remove('loading');

  lottieDiv.innerHTML = '';

  const fallbackSpan = document.createElement('span');

  fallbackSpan.classList.add('emoji-fallback');

  fallbackSpan.textContent = emoji;

  lottieDiv.appendChild(fallbackSpan);

}



// Função para criar elemento de emoji grande com animação Lottie

function createLargeEmoji(emoji, index = 0) {

  const container = document.createElement('div');

  container.classList.add('emoji-large-container');

  container.style.animationDelay = `${index * 0.1}s`;

  container.setAttribute('data-emoji', emoji);

  

  // Gerar ID único

  const uniqueId = `lottie-${generateUniqueId()}`;

  container.id = uniqueId;

  

  // Criar elemento para Lottie

  const lottieDiv = document.createElement('div');

  lottieDiv.classList.add('lottie-emoji', 'loading');

  container.appendChild(lottieDiv);

  

  // Carregar animação Lottie após um pequeno delay

  setTimeout(() => {

    if (typeof lottie !== 'undefined') {

      loadLottieWithFallback(emoji, lottieDiv, container);

    } else {

      // Lottie não disponível, usar emoji estático Noto

      console.warn('⚠️ Biblioteca Lottie não carregada, usando emojis estáticos');

      useFallbackEmoji(emoji, lottieDiv);

    }

  }, index * 100);

  

  return container;

}



function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;

  });

}



function formatFileSize(bytes) {

  if (bytes === 0) return '0 Bytes';

  const k = 1024;

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];

}



function getFileIcon(fileName) {

  const ext = fileName.split('.').pop().toLowerCase();

  const icons = {

    'pdf': 'bx-file-blank', 'doc': 'bx-file', 'docx': 'bx-file',

    'xls': 'bxs-spreadsheet', 'xlsx': 'bxs-spreadsheet',

    'zip': 'bx-archive', 'rar': 'bx-archive',

    'default': 'bx-file-blank'

  };

  return icons[ext] || icons['default'];

}



function isImageFile(fileName) {

  const ext = fileName.split('.').pop().toLowerCase();

  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);

}



function isVideoFile(fileName) {

  const ext = fileName.split('.').pop().toLowerCase();

  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);

}



function showToast(message, type = 'info') {

  const toast = document.createElement('div');

  toast.textContent = message;

  toast.style.cssText = `

    position: fixed; top: 20px; right: 20px; z-index: 10000;

    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};

    color: white; padding: 12px 20px; border-radius: 8px;

    animation: slideIn 0.3s ease-out;

  `;

  document.body.appendChild(toast);

  setTimeout(() => {

    toast.style.animation = 'slideOut 0.3s ease-in';

    setTimeout(() => toast.remove(), 300);

  }, 3000);

}



// Estilos para toast

if (!document.getElementById('toast-styles')) {

  const style = document.createElement('style');

  style.id = 'toast-styles';

  style.textContent = `

    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

  `;

  document.head.appendChild(style);

}


const DEFAULT_PROFILE_IMAGE = '../../assets/images/avatars/profile-1.png';
const ADMIN_USERNAME = 'adm';

function getPlaceholderAvatarDataUri(size, text) {
  var t = (text || 'U').charAt(0);
  var s = size || 36;
  return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '"><rect fill="#e0e0e0" width="' + s + '" height="' + s + '"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="' + (s/2) + '" font-family="sans-serif">' + t + '</text></svg>');
}

// Função para normalizar caminhos de imagens antigos para os novos
function normalizeImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return DEFAULT_PROFILE_IMAGE;
  }
  
  // Normalizar caminhos antigos
  const oldPaths = [
    'profile-1.png', 'imagens/profile-1.png',
    'imagens/avatars/profile-1.png',
    './imagens/avatars/profile-1.png',
    'imagens/avatars/profile-1.jpg',
    './imagens/avatars/profile-1.jpg',
    'imagens/branding/logo.png',
    './imagens/branding/logo.png'
  ];
  
  if (oldPaths.includes(imagePath)) {
    if (imagePath.includes('profile-1')) {
      return DEFAULT_PROFILE_IMAGE;
    }
    // Para outros arquivos de imagem antigos
    return imagePath.replace(/^\.?\/?imagens\//, '../../assets/images/');
  }
  
  // Se já é base64 ou URL completa, retornar como está
  if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Corrigir caminho incompleto (ex: assets/images/profile-1.png sem avatars)
  if (imagePath.includes('profile-1') && imagePath.includes('assets/images') && !imagePath.includes('avatars')) {
    return DEFAULT_PROFILE_IMAGE;
  }
  
  // Se já está no caminho correto, retornar como está
  if (imagePath.includes('assets/images')) {
    return imagePath;
  }
  
  return imagePath;
}
const ADMIN_NAME = 'Administrador';
const ADMIN_SECTOR = 'Administrativo';
const ADMIN_PASSWORD_HASH = "fmAvLiwiJztcXVs/Pjw6fH17K18pKComXiUkI0AhNDA0eXRpcnVjZVNuaW1kQX5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAIW1ldHN5U2F0ZUJtdWluaW1vRH5gLy4sIic7XF1bPz48Onx9eytfKSgqJl4lJCNAITQyMDJnb3JQZXVzb0o9WVdiQlpIVHBkWGFLcEhkamhsVno5Q1VxZG5ObWhVTTNzVU00QTNTRDlXYllsV1ZybEVNQmhtVEVGRU1saGxVd05tYldwbVdXNVVkaGRWTXJGRlZ4b2xWeW8wUVh0R2FWTjJSU2xWV1ZSM2RUZGtVeEYyUjRkVlpxeEdSV2hsUnJKMmExUVhZR1psVE5OalRXUkZWU0pVVHg0VVJQWkZacGQxVjRobFZ1cDBjU1ZWTURGMlJ4VWxVWGQzZGFWRU40SlZNdmxIVnJSV2FSTkRhSWRGYnJGVFl5SVZWalpFWk9sbFZ3TkhWVlIzVE5aa1c1Rm1Sa2RWWXRKbGNXWkZjelpGYlpkbldFNWtWVFZFY1hsbE1vdG1VWFpWV1cxV01vTldNS0puVnN4V1lOZGtSd1JtUms5VVRGcEZkVngyWXhZbFZTWmpUSFIzVldabFN6WlZWTmhuVlZGRFVXcG1RVlpWTUtoVldXaDJhUzFtVmFkVmI0bDJVd1VUZFdabFdIVkdiRzltV0dabFRaZGxVelZsYmt0bVVXcFZXUnBtVFZWbE1TSlhWeFEyU1dGalNvRm1SYWRWWnRSR1NXRkRadkptUldsMFZzcDFVbFJFYTBaRk1rZFhUV0psY1I1R2NwNWtWd05YV1dSV1lpWmtWWWRWYjRkVlY2WkVTWkZEWmhaVmJLTlZZR2hHV090R2NYZDFWc2RsVlZGalNUcG1Sb1ZsTVJoM1ZZWjBWTmRsVVlwVlJXdDJVRnBGU1p0R2RURkdiYWgzVnRSWFZYeFdTNGxGVk9GV1RYWmtka1prVlZkRlJWZG5WVlZ6VlN4R2M2UlZieGMxVXlnMlZXTlRUeDBrUldWMVZ0UkhXWlpsV1hsbGJvSmxWc3BGTmlKRGVYWkZWV1JuVndnMlNTMW1Tb1ZsYUNwbFV4QTNjV0pEZWhKMVZLbGtZR3BsVGlOalUwWkZiYU5rVkhaRlZrZFVNWVJsZUZkWFZzcDBkaXhtV0hkRmJhcFZWeEEzY1dabFJQMUViSmhIVlVaa1ZrVjFiM2xWTXd0bVlHcFVVWDFHZVROMk1DVm5WWUoxVU5KalJ2UjJSeGdWWkdCM1ZVaEZaUGRsUlNkbFVySjFWWFJrVklsVk1rTmxVeDRVZGlWRWFYZDFSbmxuVnMxRWVpWlZXNE5WVmFkbFV5STFWWHRtVkxKbFZrZGxXRVprYU9aRWN6UlZWa2RrVUdwbGVqWmtXYUZHU29SblY2WjBjTlZWTUVSbGFHZDFVR2xGZWFaa1NYSm1SV0ZsVXNSMlVTMVdVNlpsVm9ObFlzcDFiWHRtV28xVVJ3aEVWVmxETk5aRWJHcFZSa3htVklGa2VYUmxVUDFrVktGMlVySlZZbFZsUlpaVlZ4OFVZc0pWV2FSa1JUUkZNS1YxVnVwMFFUZGtUeU4xYVNsR1ZzbFVlWlZGWlRKR2JrVlhUV0pWVVNSRmJZbGxiQkZqVnlVRWVOZFZNU0ptUktsMVZXSjFjTkpUVDNaRmJrbFdZRlYwZFRkRmRXRm1Wb1JuWXc0RVRqUjBaNE5sZWpoM1VIbGxNa0pEY1J4ME1PZDFWSDVFTWx0R2N3Um1NczFFWnJaRWRhZFdQOW8wYnpWWFpRSjNibkpETXlRVElBTkNKbDRsSnFnU0tmdHllOXhuTzg0elBiMUZYN2NpSXM0eUxnNUhSdjFXYXVsV2R0SlVaMEYyVTVOSGRsMVdJQU5DSmw0bEpxZ1NLZnR5ZTl4bk84NHpQYjFGWDdjaUlzNHlMZzVYUWsxV2F1TlZaalZuY3BSWGUwQUROaEEwSWtVaVhtb0NLcDgxSzcxSGY2d2pQL3NWWGN0ekppd2lMdkFtZg==";

function generateUltraSecureHash(input) {
  if (input == null) {
    input = '';
  }

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

function normalizeUsername(username) {
  return (username || '').trim().toLowerCase();
}

function safeJsonParse(jsonString, defaultValue) {
  try {
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
      return defaultValue;
    }
    const parsed = JSON.parse(jsonString);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    console.warn('Erro ao fazer parse JSON, usando valor padrão:', error);
    return defaultValue;
  }
}

function sanitizeUsers(rawUsers) {
  let usersArray = [];
  
  if (Array.isArray(rawUsers)) {
    usersArray = rawUsers.slice();
  } else if (rawUsers && typeof rawUsers === 'object') {
    usersArray = Object.values(rawUsers).filter(Boolean);
  }
  
  let existingAdmin = null;
  const seenUsernames = new Set();
  const sanitizedUsers = [];
  
  usersArray.forEach((user) => {
    if (!user || typeof user !== 'object') return;
    
    const username = normalizeUsername(user.username);
    if (!username) return;
    
    if (username === ADMIN_USERNAME) {
      if (!existingAdmin) {
        existingAdmin = { ...user };
      }
      return;
    }
    
    if (seenUsernames.has(username)) {
      return;
    }
    
    seenUsernames.add(username);
    
    const allowedRoles = ["admin", "user", "contributor"];
    const resolvedRole = allowedRoles.includes(user.role) ? user.role : "user";
    const resolvedStatus = user.status || (resolvedRole === "contributor" ? "pending" : "active");
    const mustResetPassword = typeof user.mustResetPassword === "boolean"
      ? user.mustResetPassword
      : (resolvedRole === "contributor");

    const normalizedUser = {
      ...user,
      username: user.username || username,
      fullName: user.fullName || user.username || username.toUpperCase(),
      sector: user.sector || "Setor não definido",
      role: resolvedRole,
      status: resolvedStatus,
      mustResetPassword,
      profileImage: normalizeImagePath(user.profileImage) || DEFAULT_PROFILE_IMAGE,
      createdAt: user.createdAt || Date.now()
    };

    if (normalizedUser.role === "admin") {
      normalizedUser.status = "active";
      normalizedUser.mustResetPassword = false;
    }

    sanitizedUsers.push(normalizedUser);
  });
  
  sanitizedUsers.sort((a, b) => {
    const nameA = (a.fullName || a.username || "").toLowerCase();
    const nameB = (b.fullName || b.username || "").toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
  
  const adminUser = {
    ...(existingAdmin || {}),
    fullName: existingAdmin?.fullName || ADMIN_NAME,
    username: ADMIN_USERNAME,
    sector: existingAdmin?.sector || ADMIN_SECTOR,
    role: 'admin',
    passwordHash: ADMIN_PASSWORD_HASH,
    profileImage: normalizeImagePath(existingAdmin?.profileImage) || DEFAULT_PROFILE_IMAGE,
    createdAt: existingAdmin?.createdAt || Date.now()
  };
  
  if (!adminUser.createdAt) {
    adminUser.createdAt = Date.now();
  }
  
  return [adminUser, ...sanitizedUsers];
}

function persistUsersToStorage(users) {
  const sanitized = sanitizeUsers(users);
  localStorage.setItem('users', JSON.stringify(sanitized));
  localStorage.setItem('usersUpdatedAt', Date.now().toString());
  return sanitized;
}

function getUsersFromStorage() {
  return sanitizeUsers(safeJsonParse(localStorage.getItem('users'), []));
}

function ensureAdminUser() {
  const users = safeJsonParse(localStorage.getItem('users'), []);
  const sanitized = sanitizeUsers(users);
  const adminUser = {
    username: "adm",
    password: "admin123",
    fullName: "Administrador",
    role: "admin",
    sector: "Administração",
    profileImage: DEFAULT_PROFILE_IMAGE,
    createdAt: Date.now()
  };
  
  // Verificar se admin já existe
  const hasAdmin = sanitized.some(u => u.username === "adm" && u.role === "admin");
  if (!hasAdmin) {
    // Só atualizar se realmente precisar adicionar o admin
    return persistUsersToStorage([adminUser, ...sanitized]);
  }
  
  // Se admin já existe, retornar sem atualizar localStorage (evita loop)
  return [adminUser, ...sanitized];
}

function getContributorContacts() {
  return safeJsonParse(localStorage.getItem('contributorContacts'), []);
}

function setContributorContacts(contacts) {
  localStorage.setItem('contributorContacts', JSON.stringify(contacts));
  localStorage.setItem('contributorContactsUpdatedAt', Date.now().toString());
  return contacts;
}

// Função para limpar contatos estáticos/exemplo (para testes)
function clearStaticContributorContacts() {
  localStorage.removeItem('contributorContacts');
  localStorage.removeItem('contributorContactsUpdatedAt');
  console.log('✅ Contatos estáticos de contribuintes removidos do localStorage');
  // Recarregar lista de contatos se a função de atualização estiver disponível
  if (typeof updateSupportContactsList === 'function') {
    updateSupportContactsList();
  }
}

// Expor função globalmente para uso no console
window.clearStaticContributorContacts = clearStaticContributorContacts;

function getContributorEmployees() {
  return safeJsonParse(localStorage.getItem('contributorEmployees'), []);
}

function getEmployeesByContributorId(contributorId) {
  const employees = getContributorEmployees();
  return employees.filter(emp => emp.contributorId === contributorId);
}

// Função para gerar chatId de um funcionário
function getEmployeeChatId(contributorId, employeeId) {
  return `chat_contributor_${contributorId}_employee_${employeeId}`;
}

// Função para verificar se um chatId é de um funcionário
function isEmployeeChatId(chatId) {
  return chatId && chatId.includes('_employee_');
}

// Função para extrair employeeId de um chatId de funcionário
function getEmployeeIdFromChatId(chatId) {
  if (!isEmployeeChatId(chatId)) return null;
  const match = chatId.match(/_employee_([^_]+)$/);
  return match ? match[1] : null;
}

// Função para extrair contributorId de um chatId
function getContributorIdFromChatId(chatId) {
  if (isEmployeeChatId(chatId)) {
    // chat_contributor_XXX_employee_YYY
    const match = chatId.match(/chat_contributor_([^_]+)_employee_/);
    return match ? match[1] : null;
  } else {
    // chat_contributor_XXX
    const match = chatId.match(/chat_contributor_(.+)$/);
    return match ? match[1] : null;
  }
}


// ==================== AUTENTICAÇÃO SIMPLES ====================



const secureAuth = {

  isAuthenticated: () => localStorage.getItem('isAuthenticated') === 'true',

  getCurrentUser: () => safeJsonParse(localStorage.getItem('currentUser'), {}),
  authenticate: async (username, password) => {
    const users = ensureAdminUser();
    const normalizedUsername = normalizeUsername(username);
    const user = users.find(u => normalizeUsername(u.username) === normalizedUsername);
    if (!user) {

      return { success: false, error: 'Usuário não encontrado' };

    }


    const hashedPassword = generateUltraSecureHash(password || '');
    if (user.passwordHash && hashedPassword !== user.passwordHash) {
      return { success: false, error: 'Senha incorreta' };
    }

    localStorage.setItem('isAuthenticated', 'true');

    localStorage.setItem('currentUser', JSON.stringify(user));

    return { success: true, user };

  },

  validateAdminPassword: async (password) => {

    ensureAdminUser();
    const hashedPassword = generateUltraSecureHash(password || '');
    if (hashedPassword !== ADMIN_PASSWORD_HASH) {
      return { success: false, error: 'Senha de administrador incorreta' };

    }

    return { success: true };

  },

  logout: () => {

    localStorage.removeItem('isAuthenticated');

    localStorage.removeItem('currentUser');

    location.reload();

  }

};


let contributorOnboardingModal = null;
let contributorOnboardingForm = null;
let contributorInfoListEl = null;
let contributorNewPasswordInput = null;
let contributorConfirmPasswordInput = null;
let contributorConfirmDataCheckbox = null;
let contributorWelcomeNameEl = null;
let pendingContributorContext = null;

function getContributorsFromStorage() {
  const rawContributors = JSON.parse(localStorage.getItem("contributors") || "[]");
  let changed = false;

  const normalizedContributors = rawContributors.map(contributor => {
    const status = contributor.status || "active";
    let chatId = contributor.chatId;
    const supportPasswordHash = contributor.supportPasswordHash || null;
    const mustResetPassword = contributor.mustResetPassword !== false;

    if (!chatId) {
      chatId = `chat_contributor_${contributor.id || generateUniqueId()}`;
      changed = true;
    }

    return {
      ...contributor,
      status,
      chatId,
      supportPasswordHash,
      mustResetPassword
    };
  });

  if (changed) {
    localStorage.setItem("contributors", JSON.stringify(normalizedContributors));
  }

  return normalizedContributors;
}

function persistContributors(contributors) {
  localStorage.setItem("contributors", JSON.stringify(contributors));
  localStorage.setItem("contributorsUpdatedAt", Date.now().toString());
  return contributors;
}

function setSupportInputEnabled(enabled) {
  const messageInputEl = document.querySelector(".message-input input[type='text']");
  const sendButtonEl = document.querySelector(".message-input .send-button");
  
  if (!messageInputEl) {
    return;
  }
  
  messageInputEl.disabled = !enabled;
  if (!enabled) {
    messageInputEl.value = "";
    messageInputEl.placeholder = "Disponível após confirmar seu cadastro";
  } else {
    messageInputEl.placeholder = "Digite sua mensagem...";
  }
  
  if (sendButtonEl) {
    sendButtonEl.disabled = !enabled;
  }
}

function showContributorOnboarding(user) {
  if (!user || !user.contributorId || !contributorOnboardingModal || !contributorOnboardingForm) {
    return;
  }
  
  const contributors = getContributorsFromStorage();
  const contributor = contributors.find(c => c.id === user.contributorId);
  
  if (!contributor) {
    showToast("Não foi possível localizar o cadastro do contribuinte.", "error");
    return;
  }
  
  pendingContributorContext = { user, contributor };
  contributorOnboardingForm.dataset.contributorId = contributor.id;
  
  if (contributorWelcomeNameEl) {
    contributorWelcomeNameEl.textContent = contributor.razaoSocial || user.fullName || "Contribuinte";
  }
  
  if (contributorInfoListEl) {
    const infoItems = [
      { label: "Razão Social", value: contributor.razaoSocial },
      { label: "CNPJ", value: contributor.cnpj },
      { label: "Inscrição Estadual", value: contributor.inscricaoEstadual || "Não informado" },
      { label: "Município", value: contributor.municipio },
      { label: "Logradouro", value: contributor.logradouro },
      { label: "Regime Tributário", value: contributor.regime },
      { label: "Atividade Principal", value: contributor.atividade },
      { label: "Status", value: contributor.status === "pending" ? "Pendente" : "Ativo" }
    ];
    
    contributorInfoListEl.innerHTML = infoItems
      .filter(item => !!item.value)
      .map(item => `
        <li>
          <strong>${item.label}</strong>
          <span>${item.value}</span>
        </li>
      `).join("");
  }
  
  if (contributorNewPasswordInput) {
    contributorNewPasswordInput.value = "";
  }
  
  if (contributorConfirmPasswordInput) {
    contributorConfirmPasswordInput.value = "";
  }
  
  if (contributorConfirmDataCheckbox) {
    contributorConfirmDataCheckbox.checked = false;
  }
  
  contributorOnboardingModal.classList.remove("hidden");
  setSupportInputEnabled(false);
  
  setTimeout(() => {
    if (contributorNewPasswordInput) {
      contributorNewPasswordInput.focus();
    }
  }, 200);
}

function hideContributorOnboarding() {
  if (contributorOnboardingModal) {
    contributorOnboardingModal.classList.add("hidden");
  }
  if (contributorOnboardingForm) {
    contributorOnboardingForm.dataset.contributorId = "";
  }
  pendingContributorContext = null;
  setSupportInputEnabled(true);
}


const inputValidator = {

  validate: (type, value) => (!value || !value.trim()) ? { valid: false, message: 'Campo obrigatório' } : { valid: true },

  sanitize: (text) => text,

  validateFile: (file) => file ? { valid: true, errors: [] } : { valid: false, errors: ['Sem arquivo'] }

};



// Inicializar usuários padrão

async function initializeDefaultUsers() {

  try {

    ensureAdminUser();
    console.log("✅ Usuário administrador garantido");
  } catch (error) {

    console.error('Erro ao inicializar usuários:', error);

  }

}



// Chamar inicialização ao carregar o script (aguardar auth.js carregar)

document.addEventListener('DOMContentLoaded', async () => {

  await initializeDefaultUsers();

});



// ==================== INTEGRAÇÃO FIREBASE REMOVIDA ====================
// O sistema agora funciona apenas com localStorage

// Função stub para compatibilidade (sempre retorna false)
function isFirebaseAvailable() {
  return false; // Firebase removido - usar apenas localStorage
}

// Função vazia para compatibilidade (Firebase removido)
async function syncUsersWithFirebase() {
  // Firebase removido - usar apenas localStorage
  return Promise.resolve();
}

// Função vazia para compatibilidade (Firebase removido)
function saveSupportMessageToFirebase(message) {
  // Firebase removido - usar apenas localStorage
  return Promise.resolve();
}

// Função vazia para compatibilidade (Firebase removido)
function listenToSupportMessages(chatId, callback) {
  // Firebase removido - usar apenas localStorage
}

// Função vazia para compatibilidade (Firebase removido)
function updateOnlineStatus(username, isOnline) {
  // Firebase removido - usar apenas localStorage
}



// ==================== FIM INTEGRAÇÃO FIREBASE ====================



// ==================== SISTEMA DE HASH SEGURO ====================



// Função para criar hash SHA-256 (assíncrona)

async function hashPassword(password) {

  try {

  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;

  } catch (error) {

    console.error('Erro ao criar hash:', error);

    return simpleHash(password);

  }

}



// Função de hash síncrona SHA-256 (usando SubtleCrypto de forma síncrona via Promise)

function hashPasswordSync(password) {

  // Esta função retorna uma Promise que será resolvida com o hash

  return hashPassword(password);

}



// Função de hash síncrona simples (fallback para compatibilidade)

function simpleHash(str) {

  let hash = 0;

  for (let i = 0; i < str.length; i++) {

    const char = str.charCodeAt(i);

    hash = ((hash << 5) - hash) + char;

    hash = hash & hash;

  }

  return Math.abs(hash).toString(16);

}



// ==================== CONFIGURAÇÃO DE SEGURANÇA ====================

// Hashes de autenticação - SHA-256

// ATENÇÃO: Estes hashes foram gerados usando algoritmo SHA-256 de forma irreversível

// Não é possível descobrir as senhas originais a partir destes hashes

// Algoritmo: SHA-256 (Secure Hash Algorithm 256-bit)

// Complexidade: 2^256 possibilidades (praticamente impossível de quebrar por força bruta)



let failedAttempts = 0;

const MAX_ATTEMPTS = 5;

let lockoutTime = 0;



async function verifyAdminPassword(password) {

    if (lockoutTime > Date.now()) {

      return false;

    }

    

  await new Promise(resolve => setTimeout(resolve, 250));

  const hashed = generateUltraSecureHash(password || '');
  const isValid = hashed === ADMIN_PASSWORD_HASH;
    

    if (!isValid) {

    failedAttempts += 1;
      if (failedAttempts >= MAX_ATTEMPTS) {

      lockoutTime = Date.now() + (60000 * failedAttempts);
      }

      return false;

    }

    

    failedAttempts = 0;

    lockoutTime = 0;

    return true;

}



// Verificar se usuário está autenticado ao carregar a página

function checkAuthentication() {

  const loginContainer = document.getElementById("dominium-login");
  const chatApp = document.getElementById("chatApp");

  

  // Verificar se há credenciais salvas (remember me ativado)
  const savedUsername = localStorage.getItem("savedUsername");
  const savedPassword = localStorage.getItem("savedPassword");
  const hasSavedCredentials = !!(savedUsername && savedPassword);

  // Verificar se secureAuth está disponível E se há credenciais salvas
  // Só fazer login automático se o usuário tiver marcado "lembrar de mim"
  if (typeof secureAuth !== 'undefined' && secureAuth.isAuthenticated() && hasSavedCredentials) {

    // Usuário autenticado com remember me, mostrar chat

    loginContainer?.classList.add("hidden");
    chatApp.style.display = "flex";

  } else {

    // Usuário não autenticado ou sem remember me, mostrar login
    // Limpar sessão se não houver remember me
    if (!hasSavedCredentials && typeof secureAuth !== 'undefined' && secureAuth.isAuthenticated()) {
      secureAuth.logout();
      return;
    }

    loginContainer?.classList.remove("hidden");
    chatApp.style.display = "none";

  }

}



// Função para fazer login com autenticação segura

async function loginUser(username, password) {

  try {

    ensureAdminUser();
    // Firebase removido - usando apenas localStorage

    

    // Usar sistema de autenticação seguro

    if (typeof secureAuth === 'undefined') {

      throw new Error('Sistema de autenticação não carregado');

    }

    const authResult = await secureAuth.authenticate(username, password);

    console.log("[loginUser] Tentativa de login para", username, "Resultado:", authResult);
    

    if (authResult.success) {

      const user = authResult.user;

      const isContributor = user.role === "contributor";
      const needsOnboarding = isContributor && (user.mustResetPassword || user.status === "pending");
      pendingContributorContext = null;
      localStorage.setItem("clientName", user.fullName || user.username || "");
      

      // Atualizar status online no Firebase

      updateOnlineStatus(username, true);

      

      // Esconder login e mostrar chat

      document.getElementById("dominium-login")?.classList.add("hidden");
      document.getElementById("chatApp").style.display = "flex";


      const adminSidebarButton = document.querySelector(".sidebar button[data-section='admin']");
      if (adminSidebarButton) {
        adminSidebarButton.style.display = user.role === "admin" ? "" : "none";
      }

      if (!needsOnboarding) {
        setSupportInputEnabled(true);
      }
      

      // Atualizar informações do perfil (será chamada após DOM estar pronto)

      setTimeout(() => {

        const profileBox = document.querySelector(".profile-box");

        if (profileBox) {

          const profileName = profileBox.querySelector("h3");

          const profileSector = profileBox.querySelector("p");

          const profileImage = profileBox.querySelector("img");
          

          if (profileName) {

            // Usar fullName se disponível, senão usar username

            profileName.textContent = user.fullName || user.username;

          }

          

          if (profileSector) {

            profileSector.textContent = user.sector || "Setor não definido";

          }

          
          if (profileImage) {
            profileImage.src = normalizeImagePath(user.profileImage) || DEFAULT_PROFILE_IMAGE;
          }
        }
        
        if (needsOnboarding) {
          showContributorOnboarding(user);
        } else {
          setSupportInputEnabled(true);
        }

        

        // Carregar contatos de suporte após login

        if (typeof updateSupportContactsList === 'function') {

          updateSupportContactsList();

        }

      }, 100);

      

      return true;

    } else {

      throw new Error(authResult.error);

    }

  } catch (error) {

    return false;

  }

}



// Função para fazer logout

function logoutUser() {

  // Usar sistema de autenticação seguro

  if (typeof secureAuth !== 'undefined') {

    secureAuth.logout();

  } else {

    // Fallback para logout básico

    localStorage.removeItem("isAuthenticated");

    localStorage.removeItem("currentUser");

    location.reload();

  }

}



// ==================== FIM SISTEMA DE LOGIN ====================



// Array de contatos - inicializado vazio, será populado dinamicamente com dados reais
// Não há dados padrão sendo cadastrados automaticamente
const contacts = [];

  

  // Armazenar chats de suporte

  let supportChats = {};

  

  // ==================== FUNÇÕES UTILITÁRIAS PARA ARQUIVOS ====================

  

  // Converter arquivo para Base64

  function fileToBase64(file) {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => resolve(reader.result);

      reader.onerror = error => reject(error);

    });

  }

  

  // Formatar tamanho do arquivo

  function formatFileSize(bytes) {

    if (bytes === 0) return '0 Bytes';

    const k = 1024;

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];

  }

  

  // Obter ícone do arquivo baseado no tipo

  function getFileIcon(fileName) {

    const ext = fileName.split('.').pop().toLowerCase();

    const icons = {

      // Documentos

      'pdf': 'bx-file-blank',

      'doc': 'bx-file',

      'docx': 'bx-file',

      'txt': 'bx-file',

      'rtf': 'bx-file',

      // Planilhas

      'xls': 'bxs-spreadsheet',

      'xlsx': 'bxs-spreadsheet',

      'csv': 'bxs-spreadsheet',

      // Apresentações

      'ppt': 'bxs-file-doc',

      'pptx': 'bxs-file-doc',

      // Compactados

      'zip': 'bx-archive',

      'rar': 'bx-archive',

      '7z': 'bx-archive',

      // Código

      'html': 'bx-code-alt',

      'css': 'bx-code-alt',

      'js': 'bx-code-alt',

      'json': 'bx-code-alt',

      'xml': 'bx-code-alt',

      // Áudio

      'mp3': 'bx-music',

      'wav': 'bx-music',

      'ogg': 'bx-music',

      'flac': 'bx-music',

      // Outros

      'default': 'bx-file-blank'

    };

    return icons[ext] || icons['default'];

  }

  

  // Verificar se arquivo é imagem

  function isImageFile(fileName) {

    const ext = fileName.split('.').pop().toLowerCase();

    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);

  }

  

  // Verificar se arquivo é vídeo

  function isVideoFile(fileName) {

    const ext = fileName.split('.').pop().toLowerCase();

    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);

  }

  

  // Criar elemento HTML para arquivo

  function createFileElement(file, fileData, caption = null) {

    const container = document.createElement('div');

    container.classList.add('message-file');

    

    // Se for imagem, mostrar preview

    if (isImageFile(file.name)) {

      const preview = document.createElement('div');

      preview.classList.add('message-file-preview');

      const img = document.createElement('img');

      img.src = fileData;

      img.alt = file.name;

      img.onclick = () => window.open(fileData, '_blank');

      preview.appendChild(img);

      container.appendChild(preview);

    }

    // Se for vídeo, mostrar player

    else if (isVideoFile(file.name)) {

      const preview = document.createElement('div');

      preview.classList.add('message-file-preview');

      const video = document.createElement('video');

      video.src = fileData;

      video.controls = true;

      preview.appendChild(video);

      container.appendChild(preview);

    }

    // Outros tipos de arquivo - mostrar card de documento

    else {

      const doc = document.createElement('div');

      doc.classList.add('message-file-document');

      doc.onclick = () => {

        const link = document.createElement('a');

        link.href = fileData;

        link.download = file.name;

        link.click();

      };

      

      const icon = document.createElement('div');

      icon.classList.add('message-file-icon');

      icon.innerHTML = `<i class='bx ${getFileIcon(file.name)}'></i>`;

      

      const info = document.createElement('div');

      info.classList.add('message-file-info');

      const name = document.createElement('div');

      name.classList.add('message-file-name');

      name.textContent = file.name;

      const size = document.createElement('div');

      size.classList.add('message-file-size');

      size.textContent = formatFileSize(file.size);

      info.appendChild(name);

      info.appendChild(size);

      

      const download = document.createElement('div');

      download.classList.add('message-file-download');

      download.innerHTML = `<i class='bx bx-download'></i>`;

      

      doc.appendChild(icon);

      doc.appendChild(info);

      doc.appendChild(download);

      container.appendChild(doc);

    }

    

    return container;

  }

  

  // ==================== FIM FUNÇÕES UTILITÁRIAS PARA ARQUIVOS ====================

  

  document.addEventListener("DOMContentLoaded", async () => {

    // ==================== INICIALIZAÇÃO DO SISTEMA ====================

    

    ensureAdminUser();
    
    const dominiumLoginContainer = document.querySelector("#dominium-login .container");
    const dominiumSignUpLink = document.querySelector("#dominium-login .SignUpLink");
    const dominiumLoginForm = document.getElementById("dominiumLoginForm");
    const dominiumLoginUsernameInput = document.getElementById("dominiumLoginUsername");
    const dominiumLoginPasswordInput = document.getElementById("dominiumLoginPassword");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    contributorOnboardingModal = document.getElementById("contributorOnboarding");
    contributorOnboardingForm = document.getElementById("contributorOnboardingForm");
    contributorInfoListEl = document.getElementById("contributorInfoList");
    contributorNewPasswordInput = document.getElementById("contributorNewPassword");
    contributorConfirmPasswordInput = document.getElementById("contributorConfirmPassword");
    contributorConfirmDataCheckbox = document.getElementById("contributorConfirmData");
    contributorWelcomeNameEl = document.getElementById("contributorWelcomeName");
    
    // Carregar credenciais salvas se existirem
    const savedUsername = localStorage.getItem("savedUsername");
    const savedPassword = localStorage.getItem("savedPassword");
    
    if (savedUsername && dominiumLoginUsernameInput) {
      dominiumLoginUsernameInput.value = savedUsername;
    }
    
    if (savedPassword && dominiumLoginPasswordInput && rememberMeCheckbox) {
      dominiumLoginPasswordInput.value = savedPassword;
      rememberMeCheckbox.checked = true;
    }
    
    // Declarar variáveis do sistema de suporte no início do DOMContentLoaded
    let supportContactsSection = null;
    let currentSupportChatId = null;
    let selectedEmployeeId = null;
    let isSwitchingEmployee = false;
    
    // Inicializar supportContactsSection
    supportContactsSection = document.getElementById("supportContactsSection");
    
    function toggleDominiumAdmin(enable) {
      // Placeholder mantido por compatibilidade; agora sempre login único
      if (enable) {
        dominiumLoginUsernameInput?.focus();
      }
    }
    
    dominiumSignUpLink?.addEventListener("click", (event) => event.preventDefault());
    
    dominiumLoginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = dominiumLoginUsernameInput?.value?.trim();
      const password = dominiumLoginPasswordInput?.value || "";
      const rememberMe = rememberMeCheckbox?.checked || false;
      
      if (!username) {
        showToast("Informe o usuário.", "error");
        dominiumLoginUsernameInput?.focus();
        return;
      }
      
      if (!password) {
        showToast("Informe a senha.", "error");
        dominiumLoginPasswordInput?.focus();
        return;
      }
      
      const success = await loginUser(username, password);
      if (success) {
        // Salvar ou remover credenciais baseado no checkbox
        if (rememberMe) {
          localStorage.setItem("savedUsername", username);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedUsername");
          localStorage.removeItem("savedPassword");
        }
        
        dominiumLoginForm.reset();
        // Restaurar valores se "lembrar" estiver marcado
        if (rememberMe) {
          dominiumLoginUsernameInput.value = username;
          dominiumLoginPasswordInput.value = password;
          rememberMeCheckbox.checked = true;
        }
        dominiumLoginPasswordInput?.blur();
      } else {
        showToast("Usuário ou senha incorretos.", "error");
      }
    });
    
    toggleDominiumAdmin(false);
    
    if (contributorOnboardingForm) {
      contributorOnboardingForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        if (!pendingContributorContext || !pendingContributorContext.user || !pendingContributorContext.contributor) {
          hideContributorOnboarding();
          return;
        }
        
        const newPassword = contributorNewPasswordInput?.value?.trim() || "";
        const confirmPassword = contributorConfirmPasswordInput?.value?.trim() || "";
        
        if (!newPassword) {
          showToast("Defina uma nova senha para continuar.", "error");
          contributorNewPasswordInput?.focus();
          return;
        }
        
        if (newPassword !== confirmPassword) {
          showToast("As senhas informadas não coincidem.", "error");
          contributorConfirmPasswordInput?.focus();
          return;
        }
        
        if (contributorConfirmDataCheckbox && !contributorConfirmDataCheckbox.checked) {
          showToast("Confirme que você conferiu os dados antes de continuar.", "error");
          return;
        }
        
        const submitBtn = contributorOnboardingForm.querySelector(".btn-confirm-onboarding");
        const originalText = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";
        }
        
        try {
          const hashedPassword = generateUltraSecureHash(newPassword);
          const users = getUsersFromStorage();
          const normalizedUsername = normalizeUsername(pendingContributorContext.user.username);
          const userIndex = users.findIndex(u => normalizeUsername(u.username) === normalizedUsername);
          
          if (userIndex === -1) {
            showToast("Não foi possível atualizar o usuário vinculado.", "error");
            return;
          }
          
          const updatedUser = {
            ...users[userIndex],
            passwordHash: hashedPassword,
            mustResetPassword: false,
            status: "active",
            updatedAt: Date.now()
          };
          
          const updatedUsersRaw = users.map((u, idx) => idx === userIndex ? updatedUser : u);
          const persistedUsers = persistUsersToStorage(updatedUsersRaw);
          localStorage.setItem('users', JSON.stringify(persistedUsers));
          
          // Firebase removido - usar apenas localStorage
          
          let contributors = getContributorsFromStorage();
          const contributorIndex = contributors.findIndex(c => c.id === pendingContributorContext.contributor.id);
          if (contributorIndex !== -1) {
            contributors[contributorIndex] = {
              ...contributors[contributorIndex],
              status: "active",
              activatedAt: Date.now(),
              lastConfirmedAt: Date.now()
            };
            persistContributors(contributors);
            // Firebase removido - usar apenas localStorage
            
            pendingContributorContext.contributor = contributors[contributorIndex];
          }
          
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          pendingContributorContext.user = updatedUser;
          
          if (typeof renderContributorsList === "function") {
            renderContributorsList();
          }
          
          if (typeof renderUsersList === "function") {
            renderUsersList();
          }
          
          if (typeof updateProfileInfo === "function") {
            updateProfileInfo();
          }
          
          hideContributorOnboarding();
          showToast("Dados confirmados! Seu acesso ao suporte foi liberado.", "success");
        } catch (error) {
          console.error("Erro ao concluir onboarding do contribuinte:", error);
          showToast("Não foi possível concluir a confirmação. Tente novamente.", "error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText || "<i class='bx bx-check'></i> Confirmar e acessar o suporte";
          }
        }
      });
    }
    

    // ==================== INICIALIZAÇÃO DO LOGIN ====================

    

    // Sincronizar usuários com Firebase ao carregar (se disponível)

    try {

      await syncUsersWithFirebase();

    } catch (error) {

      console.log("📝 Modo Local: Usando apenas localStorage");

    }

    

    // Verificar autenticação ao carregar

    checkAuthentication();

    

    // Carregar contatos de suporte se usuário estiver autenticado

    if (localStorage.getItem("isAuthenticated") === "true") {

      setTimeout(() => {

        updateSupportContactsList();

      }, 500);

    }

    

    // Firebase removido - listeners em tempo real desabilitados
    // O sistema agora funciona apenas com localStorage

    

    // ==================== FIM INICIALIZAÇÃO DO LOGIN ====================
    
    // ==================== PAINEL DE ADMINISTRAÇÃO ====================
    
    const adminContainer = document.querySelector(".admin-container");
    const addUserForm = document.getElementById("addUserForm");
    const usersList = document.getElementById("usersList");
    const totalUsersSpan = document.getElementById("totalUsers");
    const profileImageInput = document.getElementById("newUserProfileImage");
    const profileImagePreview = document.getElementById("profileImagePreview");
    const profileImageSelectBtn = document.getElementById("profileImageSelectBtn");
    const profileImageClearBtn = document.getElementById("profileImageClearBtn");
    
    profileImageSelectBtn?.addEventListener("click", () => profileImageInput?.click());
    
    profileImageInput?.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        if (profileImagePreview) {
          profileImagePreview.src = DEFAULT_PROFILE_IMAGE;
          delete profileImagePreview.dataset.image;
        }
          return;

        }

        

      if (!file.type.startsWith("image/")) {
        showToast("Selecione um arquivo de imagem válido.", "error");
        event.target.value = "";
        if (profileImagePreview) {
          profileImagePreview.src = DEFAULT_PROFILE_IMAGE;
          delete profileImagePreview.dataset.image;
        }

        return;
    }

    

      try {
        const base64 = await fileToBase64(file);
        if (profileImagePreview) {
          profileImagePreview.src = base64;
          profileImagePreview.dataset.image = base64;
        }
      } catch (error) {
        showToast("Não foi possível carregar a imagem selecionada.", "error");
        event.target.value = "";
        if (profileImagePreview) {
          profileImagePreview.src = DEFAULT_PROFILE_IMAGE;
          delete profileImagePreview.dataset.image;
        }
      }
    });
    
    profileImageClearBtn?.addEventListener("click", () => {
      if (profileImageInput) {
        profileImageInput.value = "";
      }
      if (profileImagePreview) {
        profileImagePreview.src = DEFAULT_PROFILE_IMAGE;
        delete profileImagePreview.dataset.image;
      }
    });
    

    // Verificar se usuário é admin

    function isAdmin() {

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      return currentUser.role === "admin";

    }

    

    // Função para adicionar usuário

    async function addUser(fullName, username, sector, role, adminPassword, userPassword, confirmPassword) {
      const users = getUsersFromStorage();
      console.log("[addUser] Usuários atuais:", users);
      

      // Verificar se usuário já existe

      if (users.some(u => normalizeUsername(u.username) === normalizeUsername(username))) {
        return { success: false, message: "Username já existe! Escolha outro." };

      }

      

      // Validar que usuário atual é administrador
      let currentUser = null;

      if (typeof secureAuth !== 'undefined') {

        currentUser = secureAuth.getCurrentUser();

      } else {

        currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      }

      

      if (!currentUser || currentUser.role !== "admin") {

        return { success: false, message: "Apenas usuários com privilégios de Administrador podem adicionar usuários." };
      }
      
      if (!adminPassword) {
        return { success: false, message: "Informe a senha do administrador para confirmar a operação." };
      }
      
      if (userPassword !== confirmPassword) {
        return { success: false, message: "As senhas informadas não coincidem." };
      }

      

      // Validar senha de administrador usando hash SHA-256

      if (typeof secureAuth !== 'undefined' && secureAuth.validateAdminPassword) {

        const validation = await secureAuth.validateAdminPassword(adminPassword);

        if (!validation.success) {

          return { success: false, message: validation.error };

        }

      } else {

        const isValid = await verifyAdminPassword(adminPassword);

        if (!isValid) {

          return { success: false, message: "Senha de administrador incorreta!" };

        }

      }

      

      let profileImage = DEFAULT_PROFILE_IMAGE;
      const profileImagePreview = document.getElementById("profileImagePreview");
      if (profileImageInput && profileImageInput.files && profileImageInput.files[0]) {
        profileImage = await fileToBase64(profileImageInput.files[0]);
      } else if (profileImagePreview && profileImagePreview.dataset.image) {
        profileImage = profileImagePreview.dataset.image;
      }
      
      const newUser = {

        fullName,
        username,
        sector,
        role,
        passwordHash: generateUltraSecureHash(userPassword || ""),
        profileImage,
        createdAt: Date.now()

      };

      console.log("[addUser] Novo usuário montado:", newUser);
      

      // Adicionar localmente

      const updatedUsers = persistUsersToStorage([...users, newUser]);
      console.log("[addUser] Usuários após persistir:", updatedUsers);
      console.log("[addUser] LocalStorage(users):", localStorage.getItem("users"));
      

      // Firebase removido - usar apenas localStorage
      

      return { success: true, message: "Usuário adicionado com sucesso!", users: updatedUsers };
    }

    

    // Função para deletar usuário

    async function deleteUser(username, adminPassword) {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      
      if (!currentUser || currentUser.role !== "admin") {
        showToast("Apenas usuários com privilégios de Administrador podem deletar usuários.", "error");
        return { success: false };
      }
      
      if (normalizeUsername(username) === ADMIN_USERNAME) {
        showToast("O usuário ADM não pode ser removido.", "error");
        return { success: false };
      }
      

        if (username === currentUser.username) {

        showToast("Você não pode deletar sua própria conta!", "error");

        return { success: false };
      }

      

      if (!adminPassword || !adminPassword.trim()) {
        showToast("Informe a senha do administrador para confirmar a exclusão.", "error");
        return { success: false };
      }

      const trimmedAdminPassword = adminPassword.trim();
      if (typeof secureAuth !== 'undefined' && secureAuth.validateAdminPassword) {
        const validation = await secureAuth.validateAdminPassword(trimmedAdminPassword);
        if (!validation.success) {
          showToast(validation.error || "Senha de administrador incorreta.", "error");
          return { success: false };
        }
      } else {
        const isValid = await verifyAdminPassword(trimmedAdminPassword);
        if (!isValid) {
          showToast("Senha de administrador incorreta!", "error");
          return { success: false };
        }
      }

      

      // Remover localmente

      let users = getUsersFromStorage();
      const targetUsername = normalizeUsername(username);
      users = users.filter(u => normalizeUsername(u.username) !== targetUsername);
      const updatedUsers = persistUsersToStorage(users);
      

      // Remover do Firebase (se disponível)

      // Firebase removido - usar apenas localStorage

      

      return { success: true, users: updatedUsers };
    }

    

    // Função para renderizar lista de usuários

    function renderUsersList(forcedUsers = null) {
      if (!usersList || !totalUsersSpan) {
        return;
      }
      
      const rawUsers = Array.isArray(forcedUsers) ? sanitizeUsers(forcedUsers) : ensureAdminUser();
      const users = rawUsers.filter(user => user.role !== "contributor");
      console.log("[renderUsersList] Renderizando", users.length, "usuários:", users.map(u => u.username));
      usersList.innerHTML = "";

      totalUsersSpan.textContent = `${users.length} usuário${users.length !== 1 ? 's' : ''}`;

      
      if (!users.length) {
        const emptyState = document.createElement("div");
        emptyState.classList.add("user-item");
        emptyState.textContent = "Nenhum usuário cadastrado.";
        usersList.appendChild(emptyState);
        return;
      }
      

      users.forEach(user => {

        const displayName = user.fullName || user.username;
        const userItem = document.createElement("div");

        userItem.classList.add("user-item");

        

        const userInfo = document.createElement("div");
        userInfo.classList.add("user-info");
        
        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        const hasProfileImage = user.profileImage && user.profileImage !== DEFAULT_PROFILE_IMAGE;
        
        if (hasProfileImage) {
          avatar.classList.add("has-image");
          const img = document.createElement("img");
          img.src = normalizeImagePath(user.profileImage) || DEFAULT_PROFILE_IMAGE;
          img.alt = displayName || user.username || "Usuário";
          img.addEventListener("error", () => {
            avatar.classList.remove("has-image");
            const fallbackName = displayName || user.username || "?";
            const safeName = (fallbackName && typeof fallbackName === 'string' && String(fallbackName).trim() !== '')
              ? String(fallbackName).trim()
              : '?';
            avatar.textContent = (safeName && safeName.length > 0) ? safeName.charAt(0).toUpperCase() : '?';
          });
          avatar.appendChild(img);
        } else {
          const fallbackName = displayName || user.username || "?";
          const safeName = (fallbackName && typeof fallbackName === 'string' && String(fallbackName).trim() !== '')
            ? String(fallbackName).trim()
            : '?';
          avatar.textContent = (safeName && safeName.length > 0) ? safeName.charAt(0).toUpperCase() : '?';
        }
        
        const userDetails = document.createElement("div");
        userDetails.classList.add("user-details");
        
        const nameEl = document.createElement("div");
        nameEl.classList.add("user-name");
        nameEl.textContent = displayName || "Usuário sem nome";
        
        const userMeta = document.createElement("div");
        userMeta.classList.add("user-meta");
        
        const sectorEl = document.createElement("div");
        sectorEl.classList.add("user-sector");
        const sectorIcon = document.createElement("i");
        sectorIcon.className = 'bx bx-building';
        sectorEl.appendChild(sectorIcon);
        sectorEl.appendChild(document.createTextNode(` ${user.sector || "Setor não definido"}`));
        
        const roleEl = document.createElement("div");
        roleEl.classList.add("user-role");
        let roleIconClass = "bx-user";
        let roleLabel = "Usuário";
        if (user.role === "admin") {
          roleEl.classList.add("admin");
          roleIconClass = "bx-shield-alt-2";
          roleLabel = "Administrador";
        } else if (user.role === "contributor") {
          roleEl.classList.add("contributor");
          roleIconClass = "bx-briefcase-alt";
          roleLabel = "Contribuinte";
        }
        const roleIcon = document.createElement("i");
        roleIcon.className = `bx ${roleIconClass}`;
        roleEl.appendChild(roleIcon);
        roleEl.appendChild(document.createTextNode(` ${roleLabel}`));
        
        userMeta.appendChild(sectorEl);
        userMeta.appendChild(roleEl);
        
        userDetails.appendChild(nameEl);
        userDetails.appendChild(userMeta);
        
        if (displayName && user.username && displayName !== user.username) {
          const usernameTag = document.createElement("div");
          usernameTag.style.fontSize = "11px";
          usernameTag.style.color = "#9ca3af";
          usernameTag.style.marginTop = "4px";
          usernameTag.textContent = `@${user.username}`;
          userDetails.appendChild(usernameTag);
        }
        
        userInfo.appendChild(avatar);
        userInfo.appendChild(userDetails);
        
        const actions = document.createElement("div");
        actions.classList.add("user-actions");
        
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("btn-delete-user");
        deleteBtn.setAttribute("data-username", user.username);
        deleteBtn.innerHTML = "<i class='bx bx-trash'></i> Deletar";
        
        if (normalizeUsername(user.username) === ADMIN_USERNAME) {
          deleteBtn.disabled = true;
          deleteBtn.title = "O administrador padrão não pode ser removido.";
        }
        
        actions.appendChild(deleteBtn);
        
        userItem.appendChild(userInfo);
        userItem.appendChild(actions);
        

        usersList.appendChild(userItem);

      });

      

      // Adicionar eventos de deletar

      usersList.querySelectorAll(".btn-delete-user").forEach(btn => {
        btn.addEventListener("click", async (e) => {

          const username = e.currentTarget.getAttribute("data-username");

          const normalizedUsername = normalizeUsername(username);
          const user = users.find(u => normalizeUsername(u.username) === normalizedUsername);
          const displayName = user ? (user.fullName || user.username) : username;

          
          if (e.currentTarget.disabled) {
            return;
          }
          
          if (confirm(`Tem certeza que deseja deletar o usuário "${displayName}"?`)) {

            const adminPassword = prompt("Digite a senha do administrador para confirmar a exclusão:");
            if (adminPassword === null) {
              showToast("Exclusão cancelada pelo usuário.", "info");
              return;
            }

            const result = await deleteUser(username, adminPassword);
            if (result?.success) {
              renderUsersList(result.users);
              showToast(`Usuário "${displayName}" removido com sucesso.`, "success");
            }

          }

        });

      });

    }

    

    // Evento de submit do formulário de adicionar usuário

    if (addUserForm) {

      addUserForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        

        const fullName = document.getElementById("newUserFullName").value.trim();

        const username = document.getElementById("newUsername").value.trim();

        const sector = document.getElementById("newUserSector").value;

        const role = document.getElementById("newUserRole").value;

        const adminPassword = document.getElementById("adminPassword").value;

        const userPassword = document.getElementById("newUserPassword").value;
        let confirmPassword = document.getElementById("newUserConfirmPassword").value;
        

        // Validação básica

        if (!fullName || !username || !sector || !adminPassword) {

          showToast("Preencha todos os campos obrigatórios", "error");

          return;

        }

        

        // Validar formato do username (sem espaços)

        if (username.includes(' ')) {

          showToast("Username não pode conter espaços. Use pontos ou underscores.", "error");

          return;

        }

        

        // Adicionar indicador de loading

        const submitBtn = addUserForm.querySelector('.btn-add-user');

        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;

        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verificando...';

        

        if (confirmPassword === "" && userPassword !== "") {
          confirmPassword = userPassword;
        }
        
        if (userPassword !== confirmPassword) {
          showToast("As senhas informadas não coincidem.", "error");
          return;
        }
        
        const result = await addUser(fullName, username, sector, role, adminPassword, userPassword, confirmPassword);
        

        // Restaurar botão

        submitBtn.disabled = false;

        submitBtn.innerHTML = originalText;

        

        if (result.success) {

          showToast(result.message, "success");

          addUserForm.reset();

          const userPasswordInput = document.getElementById("newUserPassword");
          const confirmPasswordInput = document.getElementById("newUserConfirmPassword");
          if (userPasswordInput) userPasswordInput.value = "";
          if (confirmPasswordInput) confirmPasswordInput.value = "";
          if (profileImageInput) {
            profileImageInput.value = "";
          }
          if (profileImagePreview) {
            profileImagePreview.src = DEFAULT_PROFILE_IMAGE;
            delete profileImagePreview.dataset.image;
          }
          renderUsersList(result.users);
          

          // Limpar contador de tentativas falhadas em caso de sucesso

          if (typeof failedAttempts !== 'undefined') {

            failedAttempts = 0;

            lockoutTime = 0;

          }

        } else {

          showToast(result.message, "error");

          

          // Mostrar aviso de tentativas restantes se houver

          if (typeof failedAttempts !== 'undefined' && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS) {

            const remaining = MAX_ATTEMPTS - failedAttempts;

            setTimeout(() => {

              showToast(`⚠️ Tentativas restantes: ${remaining}`, "error");

            }, 500);

          }

        }

      });

    }

    

    // Renderizar lista ao carregar se admin estiver ativo

    if (adminContainer) {

      const observer = new MutationObserver(() => {

        if (adminContainer.classList.contains("active")) {

          renderUsersList();

        }

      });

      observer.observe(adminContainer, { attributes: true, attributeFilter: ['class'] });

    }

    

    // ==================== FIM PAINEL DE ADMINISTRAÇÃO ====================

    

    // ==================== SISTEMA DE ABAS DO ADMIN ====================

    

    const adminTabs = document.querySelectorAll(".admin-tab");

    const adminTabContents = document.querySelectorAll(".admin-tab-content");

    

    adminTabs.forEach(tab => {

      tab.addEventListener("click", () => {

        const targetTab = tab.getAttribute("data-tab");

        

        // Remover active de todas as abas

        adminTabs.forEach(t => t.classList.remove("active"));

        adminTabContents.forEach(content => content.classList.remove("active"));

        

        // Adicionar active na aba clicada

        tab.classList.add("active");

        

        // Mostrar conteúdo correspondente

        if (targetTab === "users") {

          document.getElementById("usersTab").classList.add("active");

        } else if (targetTab === "contributors") {

          document.getElementById("contributorsTab").classList.add("active");

          renderContributorsList();

        } else if (targetTab === "recruitment-requests") {

          document.getElementById("recruitmentRequestsTab")?.classList.add("active");

          // Carregar solicitações quando a aba for aberta
          if (typeof window.renderRecruitmentRequests === 'function') {
            window.renderRecruitmentRequests();
          } else {
            console.warn('⚠️ renderRecruitmentRequests não está disponível');
          }

        }

      });

    });

    

    // ==================== FIM SISTEMA DE ABAS ====================

    

    // ==================== GESTÃO DE CONTRIBUINTES ====================

    

    const addContributorForm = document.getElementById("addContributorForm");

    const contributorsList = document.getElementById("contributorsList");

    const totalContributorsSpan = document.getElementById("totalContributors");

    

    // Formatação de CNPJ em tempo real

    const cnpjInput = document.getElementById("contributorCNPJ");

    if (cnpjInput) {

      cnpjInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.length <= 14) {

          value = value.replace(/^(\d{2})(\d)/, "$1.$2");

          value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");

          value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");

          value = value.replace(/(\d{4})(\d)/, "$1-$2");

          e.target.value = value;

        }

      });

    }

    

    // Formatação de CEP em tempo real e busca automática

    const cepInput = document.getElementById("contributorCEP");
    const ufInput = document.getElementById("contributorUF");

    // Formatação de UF (apenas letras maiúsculas, máximo 2 caracteres)

    if (ufInput) {

      ufInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase();

        if (value.length > 2) {

          value = value.slice(0, 2);

        }

        e.target.value = value;

      });

    }

    

    if (cepInput) {

      // Máscara de CEP

      cepInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.length <= 8) {

          if (value.length > 5) {

            value = value.replace(/^(\d{5})(\d)/, "$1-$2");

          }

          e.target.value = value;

        } else {

          e.target.value = value.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");

        }

      });

      

      // Busca automática quando CEP estiver completo (8 dígitos)
      let cepSearchTimeout = null;
      
      cepInput.addEventListener("input", async (e) => {

        const cep = e.target.value.replace(/\D/g, "");

        // Limpar timeout anterior
        if (cepSearchTimeout) {
          clearTimeout(cepSearchTimeout);
        }

        // Buscar automaticamente quando tiver 8 dígitos (com pequeno delay para evitar buscas durante digitação)
        if (cep.length === 8) {
          cepSearchTimeout = setTimeout(async () => {
            await buscarCEP(cep);
          }, 500); // Aguardar 500ms após parar de digitar
        }

      });

      

      // Também buscar ao sair do campo

      cepInput.addEventListener("blur", async (e) => {

        const cep = e.target.value.replace(/\D/g, "");

        if (cep.length === 8) {

          await buscarCEP(cep);

        }

      });

      

      // Também buscar ao pressionar Enter

      cepInput.addEventListener("keypress", async (e) => {

        if (e.key === "Enter") {

          e.preventDefault();

          const cep = e.target.value.replace(/\D/g, "");

          if (cep.length === 8) {

            await buscarCEP(cep);

          }

        }

      });

    }

    

    // Função para buscar CEP via API ViaCEP

    async function buscarCEP(cep) {

      if (!cep || cep.length !== 8) {

        return;

      }

      

      const logradouroInput = document.getElementById("contributorLogradouro");

      const bairroInput = document.getElementById("contributorBairro");

      const municipioInput = document.getElementById("contributorMunicipio");

      const ufInput = document.getElementById("contributorUF");

      

      if (!logradouroInput || !bairroInput || !municipioInput || !ufInput) {

        return;

      }

      

      // Mostrar loading e desabilitar campos durante a busca

      logradouroInput.disabled = true;

      bairroInput.disabled = true;

      municipioInput.disabled = true;

      ufInput.disabled = true;

      

      const originalPlaceholderLogradouro = logradouroInput.placeholder;

      const originalPlaceholderBairro = bairroInput.placeholder;

      const originalPlaceholderMunicipio = municipioInput.placeholder;

      const originalPlaceholderUF = ufInput.placeholder;

      

      logradouroInput.placeholder = "Buscando...";

      bairroInput.placeholder = "Buscando...";

      municipioInput.placeholder = "Buscando...";

      ufInput.placeholder = "Buscando...";

      

      try {

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

        const data = await response.json();

        

        if (data.erro) {

          showToast("CEP não encontrado. Verifique o CEP digitado.", "error");

          logradouroInput.disabled = false;

          bairroInput.disabled = false;

          municipioInput.disabled = false;

          ufInput.disabled = false;

          logradouroInput.placeholder = originalPlaceholderLogradouro;

          bairroInput.placeholder = originalPlaceholderBairro;

          municipioInput.placeholder = originalPlaceholderMunicipio;

          ufInput.placeholder = originalPlaceholderUF;

          return;

        }

        

        // Preencher campos com os dados do CEP (sobrescrever campos existentes)

        if (data.logradouro) {

          logradouroInput.value = data.logradouro;

        }

        if (data.bairro) {

          bairroInput.value = data.bairro;

        }

        if (data.localidade) {

          municipioInput.value = data.localidade;

        }

        if (data.uf) {

          ufInput.value = data.uf.toUpperCase();

        }

        

        showToast("CEP encontrado! Campos preenchidos automaticamente.", "success");

        

      } catch (error) {

        console.error("Erro ao buscar CEP:", error);

        showToast("Erro ao buscar CEP. Tente novamente.", "error");

      } finally {

        // Restaurar campos

        logradouroInput.disabled = false;

        bairroInput.disabled = false;

        municipioInput.disabled = false;

        ufInput.disabled = false;

        logradouroInput.placeholder = originalPlaceholderLogradouro;

        bairroInput.placeholder = originalPlaceholderBairro;

        municipioInput.placeholder = originalPlaceholderMunicipio;

        ufInput.placeholder = originalPlaceholderUF;

      }

    }

    

    // Função para adicionar contribuinte

    async function addContributor(razaoSocial, cnpj, ie, cep, logradouro, numero, bairro, municipio, uf, regime, atividade, adminPassword) {

      const contributors = getContributorsFromStorage();
      

      // Verificar se CNPJ já existe

      if (contributors.some(c => c.cnpj === cnpj)) {

        return { success: false, message: "CNPJ já cadastrado!" };

      }


      

      // Validar senha de administrador

      const isValid = await verifyAdminPassword(adminPassword);

      if (!isValid) {

        return { success: false, message: "Senha de administrador incorreta!" };

      }

      
      const initialSupportPassword = "12345";
      const supportPasswordHash = generateUltraSecureHash(initialSupportPassword);
      const contributorId = generateUniqueId();
      const chatId = `chat_contributor_${contributorId}`;
      

      // Criar novo contribuinte

      const newContributor = {

        id: contributorId,
        razaoSocial: razaoSocial,

        cnpj: cnpj,

        inscricaoEstadual: ie || "Não informado",

        cep: cep,

        logradouro: logradouro,

        numero: numero,

        bairro: bairro,

        municipio: municipio,

        uf: uf,

        regime: regime,

        atividade: atividade,

        status: "pending",
        chatId,
        supportPasswordHash,
        mustResetPassword: true,
        createdAt: Date.now()

      };

      

      contributors.push(newContributor);

      persistContributors(contributors);

      const contributorContacts = getContributorContacts();
      const filteredContacts = contributorContacts.filter(contact => contact.contributorId !== contributorId);
      filteredContacts.push({
        contributorId,
        fullName: razaoSocial,
        cnpj,
        chatId,
        status: "pending",
        sector: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setContributorContacts(filteredContacts);
      

      // Firebase removido - usar apenas localStorage

      

      return { success: true, message: "Contribuinte adicionado com sucesso! Status definido como pendente." };
    }

    

    // Função para deletar contribuinte

    async function deleteContributor(contributorId) {

      let contributors = getContributorsFromStorage();
      const contributor = contributors.find(c => c.id === contributorId);

      

      if (!contributor) {

        return false;

      }

      

      contributors = contributors.filter(c => c.id !== contributorId);

      persistContributors(contributors);
      
      const contributorContacts = getContributorContacts();
      const remainingContacts = contributorContacts.filter(contact => contact.contributorId !== contributorId);
      if (remainingContacts.length !== contributorContacts.length) {
        setContributorContacts(remainingContacts);
      }
      

      // Firebase removido - usar apenas localStorage

      

      return true;

    }

    

    // Função para renderizar lista de contribuintes

    function renderContributorsList() {

      const contributors = getContributorsFromStorage();
      contributorsList.innerHTML = "";

      totalContributorsSpan.textContent = `${contributors.length} contribuinte${contributors.length !== 1 ? 's' : ''}`;

      

      if (contributors.length === 0) {

        contributorsList.innerHTML = `

          <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">

            <i class='bx bx-building' style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>

            <p style="font-size: 14px; font-weight: 500;">Nenhum contribuinte cadastrado ainda.</p>

          </div>

        `;

        return;

      }

      

      contributors.forEach(contributor => {

        const status = contributor.status || "active";
        const statusLabel = status === "pending" ? "Pendente" : "Ativo";
        const statusIcon = status === "pending" ? "bx-time-five" : "bx-check-circle";
        const contributorItem = document.createElement("div");

        contributorItem.classList.add("user-item", "contributor-item");

        
        // Validar razaoSocial antes de usar charAt
        const razaoSocial = contributor.razaoSocial || '';
        const initial = (razaoSocial && typeof razaoSocial === 'string' && razaoSocial.trim() !== '')
          ? razaoSocial.trim().charAt(0).toUpperCase()
          : '?';

        

        contributorItem.innerHTML = `

          <div class="user-info">

            <div class="user-avatar" style="background: #10b981;">${initial}</div>

            <div class="user-details">

              <div class="user-name">
                ${contributor.razaoSocial}
                <span class="contributor-status-badge ${status}">
                  <i class='bx ${statusIcon}'></i>
                  ${statusLabel}
                </span>
              </div>
              <div class="user-meta">

                <div class="user-sector">

                  <i class='bx bx-id-card'></i>

                  ${contributor.cnpj}

                </div>

                <div class="user-role">

                  <i class='bx bx-briefcase'></i>

                  ${contributor.regime}

                </div>

              </div>

              <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap;">

                <span><i class='bx bx-map'></i> ${contributor.municipio}</span>

                <span><i class='bx bx-building'></i> ${contributor.atividade}</span>

              </div>

              <div class="contributor-details" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">

                  <div>

                    <strong style="color: #6b7280;">IE:</strong>

                    <span style="color: #1f2937; margin-left: 4px;">${contributor.inscricaoEstadual}</span>

                  </div>

                  <div>

                    <strong style="color: #6b7280;">Município:</strong>

                    <span style="color: #1f2937; margin-left: 4px;">${contributor.municipio}</span>

                  </div>

                  <div>
                    <strong style="color: #6b7280;">Status:</strong>
                    <span style="color: ${status === "pending" ? "#d97706" : "#16a34a"}; margin-left: 4px;">${statusLabel}</span>
                  </div>
                  <div style="grid-column: 1 / -1;">

                    <strong style="color: #6b7280;">Logradouro:</strong>

                    <span style="color: #1f2937; margin-left: 4px;">${contributor.logradouro}</span>

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div class="user-actions" style="display: flex; gap: 8px;">

            <button class="btn-view-contributor" data-contributor-id="${contributor.id}" title="Ver detalhes">

              <i class='bx bx-info-circle'></i>

            </button>

            <button class="btn-delete-user" data-contributor-id="${contributor.id}">

              <i class='bx bx-trash'></i> Deletar

            </button>

          </div>

        `;

        

        contributorsList.appendChild(contributorItem);

      });

      

      // Adicionar eventos de visualizar detalhes

      document.querySelectorAll(".btn-view-contributor").forEach(btn => {

        btn.addEventListener("click", (e) => {

          e.stopPropagation();

          const contributorId = btn.getAttribute("data-contributor-id");

          const contributorItem = btn.closest(".contributor-item");

          const detailsDiv = contributorItem.querySelector(".contributor-details");

          const icon = btn.querySelector("i");

          

          if (detailsDiv.style.display === "none") {

            detailsDiv.style.display = "block";

            detailsDiv.style.animation = "slideDown 0.3s ease-out";

            icon.classList.remove("bx-info-circle");

            icon.classList.add("bx-chevron-up");

            btn.style.background = "#10b981";

            btn.style.color = "white";

          } else {

            detailsDiv.style.display = "none";

            icon.classList.remove("bx-chevron-up");

            icon.classList.add("bx-info-circle");

            btn.style.background = "";

            btn.style.color = "";

          }

        });

      });

      

      // Adicionar eventos de deletar

      document.querySelectorAll(".btn-delete-user[data-contributor-id]").forEach(btn => {

        btn.addEventListener("click", async (e) => {

          e.stopPropagation();

          const contributorId = e.currentTarget.getAttribute("data-contributor-id");

          const contributor = contributors.find(c => c.id === contributorId);

          

          if (contributor && confirm(`Tem certeza que deseja deletar o contribuinte "${contributor.razaoSocial}"?`)) {

            const deleted = await deleteContributor(contributorId);

            if (deleted) {

              showToast("Contribuinte deletado com sucesso!", "success");

              renderContributorsList();

            }

          }

        });

      });

    }

    

    // Evento de submit do formulário de adicionar contribuinte

    if (addContributorForm) {

      addContributorForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        

        const razaoSocial = document.getElementById("contributorRazaoSocial").value.trim();

        const cnpj = document.getElementById("contributorCNPJ").value.trim();

        const ie = document.getElementById("contributorIE").value.trim();

        const cep = document.getElementById("contributorCEP").value.trim();

        const logradouro = document.getElementById("contributorLogradouro").value.trim();

        const numero = document.getElementById("contributorNumero").value.trim();

        const bairro = document.getElementById("contributorBairro").value.trim();

        const municipio = document.getElementById("contributorMunicipio").value.trim();

        const uf = document.getElementById("contributorUF").value.trim().toUpperCase();

        const regime = document.getElementById("contributorRegime").value;

        const atividade = document.getElementById("contributorAtividade").value.trim();

        const adminPassword = document.getElementById("contributorAdminPassword").value;

        

        // Validação básica

        if (!razaoSocial || !cnpj || !cep || !logradouro || !numero || !bairro || !municipio || !uf || !regime || !atividade || !adminPassword) {

          showToast("Preencha todos os campos obrigatórios", "error");

          return;

        }

        

        // Validar CEP (deve ter 8 dígitos)

        const cepNumerico = cep.replace(/\D/g, "");

        if (cepNumerico.length !== 8) {

          showToast("CEP inválido! Digite os 8 dígitos.", "error");

          return;

        }

        

        // Validar UF (deve ter 2 caracteres)

        if (uf.length !== 2) {

          showToast("UF inválida! Digite a sigla do estado (ex: SP).", "error");

          return;

        }

        

        // Validar CNPJ (mínimo de caracteres)

        if (cnpj.replace(/\D/g, "").length !== 14) {

          showToast("CNPJ inválido! Digite os 14 dígitos.", "error");

          return;

        }

        

        // Adicionar indicador de loading

        const submitBtn = addContributorForm.querySelector('.btn-add-user');

        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;

        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verificando...';

        

        const result = await addContributor(razaoSocial, cnpj, ie, cep, logradouro, numero, bairro, municipio, uf, regime, atividade, adminPassword);

        

        // Restaurar botão

        submitBtn.disabled = false;

        submitBtn.innerHTML = originalText;

        

        if (result.success) {

          showToast(result.message, "success");

          addContributorForm.reset();

          renderContributorsList();

          if (typeof renderUsersList === "function") {
            renderUsersList();
          }
          

          // Limpar contador de tentativas falhadas em caso de sucesso

          if (typeof failedAttempts !== 'undefined') {

            failedAttempts = 0;

            lockoutTime = 0;

          }

        } else {

          showToast(result.message, "error");

          

          // Mostrar aviso de tentativas restantes se houver

          if (typeof failedAttempts !== 'undefined' && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS) {

            const remaining = MAX_ATTEMPTS - failedAttempts;

            setTimeout(() => {

              showToast(`⚠️ Tentativas restantes: ${remaining}`, "error");

            }, 500);

          }

        }

      });

    }

    

    // ==================== FIM GESTÃO DE CONTRIBUINTES ====================

    

    // Adicionar evento de logout

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {

      logoutButton.addEventListener("click", () => {

        if (confirm("Tem certeza que deseja sair?")) {

          logoutUser();

        }

      });

    }

    

    // Atualizar informações do perfil do usuário logado

    function updateProfileInfo() {

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      

      if (currentUser.username) {

        const profileBox = document.querySelector(".profile-box");

        

        if (profileBox) {

          const profileName = profileBox.querySelector("h3");

          const profileSector = profileBox.querySelector("p");

          const profileImage = profileBox.querySelector("img");
          

          if (profileName) {

            // Usar fullName se disponível, senão usar username

            profileName.textContent = currentUser.fullName || currentUser.username;

          }

          

          if (profileSector) {

            profileSector.textContent = currentUser.sector || "Setor não definido";

          }

          
          if (profileImage) {
            profileImage.src = normalizeImagePath(currentUser.profileImage) || DEFAULT_PROFILE_IMAGE;
          }
          
          // Renderizar arquivos do usuário
          renderUserFiles();
        }

      }

    }

    // Variável para controlar inicialização do accordion (event delegation)
    // Declarada antes de qualquer uso (updateProfileInfo -> renderUserFiles -> initializeFileCategories)
    let fileCategoriesInitialized = false;

    // Chamar atualização de perfil se usuário estiver autenticado

    if (localStorage.getItem("isAuthenticated") === "true") {

      updateProfileInfo();

    }

    

    // ==================== FUNÇÕES PARA LISTA DE ARQUIVOS DO PERFIL ====================

    // Função para obter a extensão do arquivo em maiúsculas (para categoria)
    function getFileType(fileName) {
      if (!fileName) return null;
      const ext = fileName.split('.').pop();
      return ext ? ext.toUpperCase() : null;
    }

    // Função para obter ícone baseado na extensão
    function getCategoryIcon(ext) {
      const extLower = ext.toLowerCase();
      const iconMap = {
        // Documentos
        'pdf': 'bxs-file-pdf',
        'doc': 'bxs-file-blank',
        'docx': 'bxs-file-blank',
        'txt': 'bxs-file-blank',
        'rtf': 'bxs-file-blank',
        // Planilhas
        'xls': 'bxs-spreadsheet',
        'xlsx': 'bxs-spreadsheet',
        'csv': 'bxs-spreadsheet',
        // Imagens
        'jpg': 'bxs-image',
        'jpeg': 'bxs-image',
        'png': 'bxs-image',
        'gif': 'bxs-image',
        'webp': 'bxs-image',
        'svg': 'bxs-image',
        'bmp': 'bxs-image',
        // Vídeos
        'mp4': 'bxs-video',
        'webm': 'bxs-video',
        'ogg': 'bxs-video',
        'mov': 'bxs-video',
        'avi': 'bxs-video',
        'mkv': 'bxs-video',
        // Arquivos
        'zip': 'bx-archive',
        'rar': 'bx-archive',
        '7z': 'bx-archive'
      };
      return iconMap[extLower] || 'bx-file-blank'; // Ícone padrão
    }

    

    // Função para verificar se é um arquivo do sistema (logo, perfil, etc.)
    function isSystemFile(fileName) {
      if (!fileName) return true;
      const systemFiles = [
        'logo.png', 'profile-1.png', 'Sercon.png',
        'logo.jpg', 'profile-1.jpg', 'Sercon.jpg',
        'logo.jpeg', 'profile-1.jpeg', 'Sercon.jpeg'
      ];
      const lowerFileName = fileName.toLowerCase();
      return systemFiles.some(sysFile => lowerFileName.includes(sysFile.toLowerCase()));
    }

    // Função para verificar se arquivo pertence ao mesmo setor do usuário
    function isFileFromSameSector(msgSector, userSector) {
      if (!msgSector || !userSector) return false;
      return msgSector.trim().toLowerCase() === userSector.trim().toLowerCase();
    }

    // Função para buscar todos os arquivos do usuário logado (enviados e recebidos)
    // Arquivos são compartilhados entre usuários do mesmo setor
    // Administradores veem todos os arquivos de todos os setores

    function getUserFiles() {

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      const userName = currentUser.fullName || currentUser.username;
      const userSector = currentUser.sector || "";
      const userIsAdmin = isAdmin();

      if (!userName) return [];

      const userFiles = [];
      const seenFiles = new Set(); // Para evitar duplicatas

      // 1. Buscar mensagens do localStorage (supportMessages)
      const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");

      allMessages.forEach(msg => {

        // Verificar se a mensagem tem arquivo
        if (msg.file && msg.file.name) {

          // Filtrar arquivos do sistema
          if (isSystemFile(msg.file.name)) {
            return;
          }

          // Verificar setor da mensagem
          const msgSector = msg.sector || "";
          
          // Administrador vê todos os arquivos de todos os setores
          // Usuário normal vê TODOS os arquivos do mesmo setor (não apenas os seus próprios)
          const canAccessFile = userIsAdmin || isFileFromSameSector(msgSector, userSector);

          if (!canAccessFile) {
            return; // Usuário não tem acesso a este arquivo (setor diferente)
          }

          // Criar chave única para evitar duplicatas
          const fileKey = `${msg.file.name}-${msg.timestamp}-${msg.file.size}`;
          if (seenFiles.has(fileKey)) {
            return; // Já adicionado
          }
          seenFiles.add(fileKey);

          // Se passou pela verificação de setor acima, incluir o arquivo
          // Administradores veem todos os arquivos
          // Usuários veem todos os arquivos do mesmo setor (compartilhamento por setor)
          const fileType = getFileType(msg.file.name);

          if (fileType) {
            // Verificar se foi enviado ou recebido pelo usuário atual (apenas para informação)
            const isSentByUser = msg.sender === userName || (msg.type === "support" && msg.sender === userName);
            const isReceivedByUser = msg.type === "client" || (msg.sender && msg.sender !== userName && msg.type !== "support");

            userFiles.push({

              ...msg.file,

              timestamp: msg.timestamp || Date.now(),

              time: msg.time || getCurrentTime(),

              caption: msg.caption || null,

              chatId: msg.chatId || null,

              type: fileType,

              sender: msg.sender || msg.senderName || msg.clientName || null,

              sector: msgSector,

              isReceived: isReceivedByUser,

              isFromSameUser: isSentByUser || isReceivedByUser

            });

          }

        }

      });

      // 2. Buscar arquivos em contact.messages dos contatos
      try {
        const contacts = JSON.parse(localStorage.getItem("contacts") || "[]");
        
        contacts.forEach(contact => {
          if (contact.messages && Array.isArray(contact.messages)) {
            // Verificar se o contato tem setor definido
            const contactSector = contact.sector || "";
            
            // Administrador vê todos os arquivos
            // Usuário normal vê apenas arquivos de contatos do mesmo setor
            const canAccessContact = userIsAdmin || isFileFromSameSector(contactSector, userSector);
            
            if (!canAccessContact) {
              return; // Pular contatos de outros setores
            }

            contact.messages.forEach(msg => {
              if (msg.file && msg.file.name) {
                
                // Filtrar arquivos do sistema
                if (isSystemFile(msg.file.name)) {
                  return;
                }

                // Criar chave única para evitar duplicatas
                const fileKey = `${msg.file.name}-${msg.timestamp}-${msg.file.size}`;
                if (seenFiles.has(fileKey)) {
                  return; // Já adicionado
                }
                seenFiles.add(fileKey);

                // Se passou pela verificação de setor acima, incluir o arquivo
                // Usuários do mesmo setor compartilham todos os arquivos
                const fileType = getFileType(msg.file.name);

                if (fileType) {
                  // Verificar se foi enviado ou recebido pelo usuário atual (apenas para informação)
                  const isSentByUser = msg.type === "sent";
                  const isReceivedByUser = msg.type === "received";

                  userFiles.push({

                    ...msg.file,

                    timestamp: msg.timestamp || Date.now(),

                    time: msg.time || getCurrentTime(),

                    caption: msg.caption || null,

                    chatId: `chat_contact_${contact.id}`,

                    contactId: contact.id,

                    type: fileType,

                    sender: isSentByUser ? userName : contact.name,

                    sector: contactSector,

                    isReceived: isReceivedByUser,

                    isFromSameUser: isSentByUser || isReceivedByUser

                  });

                }

              }

            });

          }

        });

      } catch (error) {

        console.warn("Erro ao buscar arquivos dos contatos:", error);

      }

      // Ordenar por timestamp (mais recente primeiro)

      userFiles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return userFiles;

    }

    

    // Função para filtrar arquivos por tipo

    function filterFilesByType(files, type) {

      return files.filter(file => file.type === type);

    }

    

    // Função para criar elemento de arquivo na lista

    function createFileListItem(file) {

      const fileItem = document.createElement('div');

      fileItem.classList.add('profile-file-item');

      fileItem.innerHTML = `

        <div class="profile-file-icon">

          <i class='bx ${getFileIcon(file.name)}'></i>

        </div>

        <div class="profile-file-info">

          <div class="profile-file-name" title="${file.name}">${file.name}</div>

          <div class="profile-file-meta">

            <span>${formatFileSize(file.size)}</span>

            <span>•</span>

            <span>${file.time || 'N/A'}</span>

          </div>

        </div>

        <div class="profile-file-action">

          <a href="${file.data}" download="${file.name}" class="profile-file-download" title="Baixar arquivo">

            <i class='bx bx-download'></i>

          </a>

        </div>

      `;

      return fileItem;

    }

    

    // Função para criar elemento de categoria
    function createCategoryElement(category, files) {
      const categoryDiv = document.createElement('div');
      categoryDiv.classList.add('file-category');
      categoryDiv.setAttribute('data-category', category);
      
      const iconClass = getCategoryIcon(category);
      
      categoryDiv.innerHTML = `
        <div class="file-category-header">
          <i class='bx ${iconClass}'></i>
          <span>${category}</span>
          <i class='bx bx-chevron-down category-arrow'></i>
          <span class="file-count" id="fileCount${category}">${files.length}</span>
        </div>
        <div class="file-category-content" id="fileList${category}"></div>
      `;
      
      return categoryDiv;
    }

    // Função para renderizar arquivos por categoria (dinâmico)
    function renderUserFiles() {
      const allFiles = getUserFiles();
      const container = document.getElementById('profileFilesContainer');
      
      if (!container) return;
      
      // Agrupar arquivos por extensão (categoria)
      const filesByCategory = {};
      allFiles.forEach(file => {
        const category = file.type; // Extensão em maiúsculas
        if (category) {
          if (!filesByCategory[category]) {
            filesByCategory[category] = [];
          }
          filesByCategory[category].push(file);
        }
      });
      
      // Limpar container
      container.innerHTML = '';
      
      // Ordenar categorias alfabeticamente
      const sortedCategories = Object.keys(filesByCategory).sort();
      
      // Criar e adicionar categorias apenas se tiverem arquivos
      sortedCategories.forEach(category => {
        const categoryFiles = filesByCategory[category];
        
        // Apenas criar categoria se tiver arquivos
        if (categoryFiles.length > 0) {
          const categoryElement = createCategoryElement(category, categoryFiles);
          container.appendChild(categoryElement);
          
          // Preencher lista de arquivos
          const listEl = categoryElement.querySelector(`#fileList${category}`);
          if (listEl) {
            categoryFiles.forEach(file => {
              const fileItem = createFileListItem(file);
              listEl.appendChild(fileItem);
            });
          }
        }
      });
      
      // Re-inicializar accordion para as novas categorias
      initializeFileCategories();
    }

    

    // Função para inicializar o accordion das categorias (usa event delegation)
    function initializeFileCategories() {
      const container = document.getElementById('profileFilesContainer');
      if (!container) return;
      
      // Usar event delegation para evitar listeners duplicados
      // Adicionar listener apenas uma vez no container
      if (!fileCategoriesInitialized) {
        container.addEventListener('click', (e) => {
          // Verificar se o clique foi no header da categoria
          const header = e.target.closest('.file-category-header');
          if (!header) return;
          
          e.stopPropagation();
          
          const category = header.closest('.file-category');
          const content = category.querySelector('.file-category-content');
          const arrow = header.querySelector('.category-arrow');
          
          if (!content || !arrow) return;
          
          if (category.classList.contains('expanded')) {
            category.classList.remove('expanded');
            content.style.maxHeight = null;
            arrow.classList.remove('expanded');
          } else {
            category.classList.add('expanded');
            content.style.maxHeight = content.scrollHeight + 'px';
            arrow.classList.add('expanded');
          }
        });
        
        fileCategoriesInitialized = true;
      }
    }

    

    // Chamar funções de inicialização

    if (localStorage.getItem("isAuthenticated") === "true") {

      renderUserFiles();

      initializeFileCategories();

    }

    

    // Desabilitar input de mensagem inicialmente

    disableMessageInput();

    

    // ==================== FUNCIONALIDADE DE PESQUISA DE CONTATOS ====================

    

    const searchInput = document.querySelector(".search-bar input");

    

    if (searchInput) {

      searchInput.addEventListener("input", (e) => {

        const searchTerm = e.target.value.toLowerCase().trim();

        

        // Selecionar todos os contatos (normais e de suporte)

        const allContacts = document.querySelectorAll(".contact");

        

        if (searchTerm === "") {

          // Se o campo está vazio, mostrar todos os contatos

          allContacts.forEach(contact => {

            contact.style.display = "flex";

          });

          return;

        }

        

        // Filtrar contatos por nome ou setor

        allContacts.forEach(contact => {

          const contactName = contact.querySelector(".contact-info h4");

          const contactPreview = contact.querySelector(".contact-info p");

          

          if (contactName) {

            const name = contactName.textContent.toLowerCase();

            const preview = contactPreview ? contactPreview.textContent.toLowerCase() : "";

            

            // Verificar se o termo de busca está presente no nome ou na preview

            if (name.includes(searchTerm) || preview.includes(searchTerm)) {

              contact.style.display = "flex";

              

              // Adicionar animação de entrada

              contact.style.animation = "contactFadeIn 0.3s ease-out";

            } else {

              contact.style.display = "none";

            }

          }

        });

      });

      

      // Limpar pesquisa ao clicar no X (se adicionar botão de limpar)

      searchInput.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

          searchInput.value = "";

          // Disparar evento input para mostrar todos os contatos

          searchInput.dispatchEvent(new Event("input"));

          searchInput.blur();

        }

      });

    }

    

    // ==================== FIM FUNCIONALIDADE DE PESQUISA ====================

    

    // ==================== GRADIENTE DINÂMICO DE SCROLL ====================

    

    /**

     * Sistema de gradiente dinâmico que se adapta à posição do scroll:

     * - No topo: apenas gradiente embaixo

     * - No final: apenas gradiente em cima

     * - No meio: gradiente em ambos os lados

     */

    

    function setupDynamicScrollGradient(element) {

      if (!element) return;

      

      function updateScrollGradient() {

        const scrollTop = element.scrollTop;

        const scrollHeight = element.scrollHeight;

        const clientHeight = element.clientHeight;

        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        

        // Verificar se tem scroll disponível

        const hasScroll = scrollHeight > clientHeight;

        

        if (!hasScroll) {

          // Sem scroll - remover ambas as classes

          element.classList.remove('can-scroll-up', 'can-scroll-down');

          return;

        }

        

        // Pode rolar para cima? (não está no topo)

        if (scrollTop > 5) {

          element.classList.add('can-scroll-up');

        } else {

          element.classList.remove('can-scroll-up');

        }

        

        // Pode rolar para baixo? (não está no final)

        if (scrollBottom > 5) {

          element.classList.add('can-scroll-down');

        } else {

          element.classList.remove('can-scroll-down');

        }

      }

      

      // Atualizar ao rolar

      element.addEventListener('scroll', updateScrollGradient);

      

      // Atualizar inicialmente

      setTimeout(updateScrollGradient, 100);

      

      // Atualizar quando o conteúdo mudar

      const observer = new MutationObserver(() => {

        setTimeout(updateScrollGradient, 50);

      });

      observer.observe(element, {

        childList: true,

        subtree: true

      });

      

      // Atualizar ao redimensionar

      window.addEventListener('resize', updateScrollGradient);

      

      return () => {

        element.removeEventListener('scroll', updateScrollGradient);

        window.removeEventListener('resize', updateScrollGradient);

        observer.disconnect();

      };

    }

    

    // Aplicar gradiente dinâmico em todas as áreas com scroll

    const scrollElements = [

      document.querySelector('.messages'),

      document.querySelector('.contacts-list'),

      document.querySelector('.chat-list'),

      document.querySelector('.admin-content'),

      document.querySelector('.tasks-list'),

      document.querySelector('.emoji-grid'),

      document.querySelector('.contact-selector-list'),

      document.querySelector('.report-preview-content'),

      document.querySelector('.scheduled-message-container'),

      document.querySelector('.modal-content')

    ];

    

    scrollElements.forEach(element => {

      if (element) {

        setupDynamicScrollGradient(element);

      }

    });

    

    // ==================== FIM GRADIENTE DINÂMICO DE SCROLL ====================

    

    const contactElements = document.querySelectorAll(".contact");

    const messagesContainer = document.querySelector(".messages");

    const contactBox = document.querySelector(".contact-box");

    const sidebarButtons = document.querySelectorAll(".sidebar button:not(#logoutButton)");

    const chatContainer = document.querySelector(".chat-container");

    const chatList = document.querySelector(".chat-list");

    const chatMain = document.querySelector(".chat-main");

    const sendButton = document.querySelector(".message-input i");

    const messageInput = document.querySelector(".message-input input[type='text']");

    const fileInput = document.getElementById("fileInput");

    const attachButton = document.getElementById("attachButton");

    const taxAgendaContainer = document.querySelector(".tax-agenda-container");
    const ncmContainer = document.querySelector(".ncm-container");

    const internalChatContainer = document.querySelector(".internal-chat-container");

    const rightPanel = document.querySelector(".right-panel");

  

    // Função para formatar a hora atual

    function getCurrentTime() {

      const now = new Date();

      const hours = String(now.getHours()).padStart(2, "0");

      const minutes = String(now.getMinutes()).padStart(2, "0");

      return `${hours}:${minutes}`;

    }

  

    // Função para atualizar o chat e o contact-box

    function updateChat(contactId) {

      console.log(`📝 Atualizando chat para contato ID: ${contactId}`);

      const contact = contacts.find(c => c.id === parseInt(contactId));

      if (!contact) {

        console.error(`❌ Contato ${contactId} não encontrado`);

        return;

      }

      // CRITICAL: ANTES de recarregar, criar um mapa completo de TODOS os file.data das mensagens existentes
      // Isso será nossa fonte de verdade para preservar os arquivos
      const existingFileDataMap = new Map(); // Map<timestamp|id, fileObject>
      
      if (contact.messages && Array.isArray(contact.messages)) {
        contact.messages.forEach(existingMsg => {
          if (existingMsg.file && existingMsg.file.data) {
            // Criar entrada por timestamp
            if (existingMsg.timestamp) {
              existingFileDataMap.set(existingMsg.timestamp, {
                name: existingMsg.file.name,
                size: existingMsg.file.size,
                type: existingMsg.file.type,
                data: existingMsg.file.data
              });
            }
            // Criar entrada por ID (se existir)
            if (existingMsg.id) {
              existingFileDataMap.set('id:' + existingMsg.id, {
                name: existingMsg.file.name,
                size: existingMsg.file.size,
                type: existingMsg.file.type,
                data: existingMsg.file.data
              });
            }
            // Criar entrada por combinação timestamp+filename (para casos onde ID pode estar faltando)
            if (existingMsg.timestamp && existingMsg.file.name) {
              existingFileDataMap.set(`file:${existingMsg.timestamp}:${existingMsg.file.name}`, {
                name: existingMsg.file.name,
                size: existingMsg.file.size,
                type: existingMsg.file.type,
                data: existingMsg.file.data
              });
            }
          }
        });
      }
      
      console.log(`[updateChat] ⚠️ PRESERVANDO ${existingFileDataMap.size} file.data das mensagens existentes do contato`);

      // CRITICAL: Carregar mensagens do localStorage e mesclar com mensagens existentes
      // Preservar file.data das mensagens existentes
      try {
        const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
        const contactChatId = `chat_contact_${contact.id}`;
        
        // DEBUG: Log mensagens existentes do contato
        console.log(`[updateChat] Contato ${contact.id} - Mensagens existentes:`, contact.messages?.length || 0);
        if (contact.messages && contact.messages.length > 0) {
          const messagesWithFiles = contact.messages.filter(m => m.file && m.file.data);
          console.log(`[updateChat] Mensagens com file.data:`, messagesWithFiles.length);
          messagesWithFiles.forEach((m, idx) => {
            console.log(`[updateChat] Mensagem ${idx + 1} com arquivo:`, {
              timestamp: m.timestamp,
              id: m.id,
              fileName: m.file?.name,
              hasData: !!m.file?.data,
              dataLength: m.file?.data?.length || 0
            });
          });
        }
        
        // Filtrar mensagens deste contato
        const localStorageMessages = allMessages.filter(msg => {
          const isContactMessage = msg.chatId === contactChatId || 
                                   msg.chatId === contact.id.toString() ||
                                   (msg.contactId && msg.contactId === contact.id.toString()) ||
                                   (msg.contactId && parseInt(msg.contactId) === contact.id);
          return isContactMessage;
        });
        
        console.log(`[updateChat] Mensagens do localStorage para contato ${contact.id}:`, localStorageMessages.length);
        const localStorageMessagesWithFiles = localStorageMessages.filter(m => m.file);
        console.log(`[updateChat] Mensagens do localStorage com file (sem data):`, localStorageMessagesWithFiles.length);
        localStorageMessagesWithFiles.forEach((m, idx) => {
          console.log(`[updateChat] localStorage mensagem ${idx + 1} com file:`, {
            timestamp: m.timestamp,
            id: m.id,
            fileName: m.file?.name,
            hasData: !!m.file?.data,
            dataLength: m.file?.data?.length || 0
          });
        });
        
        // CRITICAL: Usar o mapa de file.data criado ANTES do try/catch para preservar arquivos
        // O mapa existingFileDataMap já foi criado acima com TODOS os file.data das mensagens existentes
        console.log(`[updateChat] Usando mapa existente com ${existingFileDataMap.size} file.data preservados`);
        
        // Criar também um mapa de informações completas dos arquivos para facilitar a mesclagem
        const existingFileInfoMap = new Map();
        existingFileDataMap.forEach((fileObj, key) => {
          existingFileInfoMap.set(key, fileObj);
        });
        
        // CRITICAL: Mesclar mensagens do localStorage com mensagens existentes, preservando file.data
        // Estratégia: SEMPRE usar file.data do mapa criado ANTES (existingFileDataMap) se existir
        // Isso garante que o file.data das mensagens existentes seja SEMPRE preservado
        const mergedMessages = localStorageMessages.map(msg => {
          // Tentar encontrar file.data da mensagem existente usando múltiplas chaves
          let existingFileInfo = null;
          
          // Tentar por ID primeiro
          if (msg.id) {
            existingFileInfo = existingFileDataMap.get('id:' + msg.id);
          }
          // Se não encontrou por ID, tentar por timestamp
          if (!existingFileInfo && msg.timestamp) {
            existingFileInfo = existingFileDataMap.get(msg.timestamp);
          }
          // Tentar por combinação timestamp+filename
          if (!existingFileInfo && msg.timestamp && msg.file && msg.file.name) {
            existingFileInfo = existingFileDataMap.get(`file:${msg.timestamp}:${msg.file.name}`);
          }
          
          // CRITICAL: Se encontrou file.data existente no mapa, SEMPRE usar ele
          if (existingFileInfo && existingFileInfo.data) {
            console.log(`[updateChat] ✅ PRESERVANDO file.data da mensagem existente para timestamp ${msg.timestamp}, id: ${msg.id}, fileName: ${existingFileInfo.name}`);
            
            // SEMPRE usar o file.data do mapa (fonte de verdade)
            msg.file = {
              name: existingFileInfo.name || msg.file?.name,
              size: existingFileInfo.size || msg.file?.size,
              type: existingFileInfo.type || msg.file?.type,
              data: existingFileInfo.data // CRITICAL: SEMPRE usar file.data do mapa
            };
          } else if (msg.file && !msg.file.data) {
            console.log(`[updateChat] ⚠️ Mensagem timestamp ${msg.timestamp}, id: ${msg.id} tem file mas não tem data e não encontrou no mapa`);
          } else if (msg.file && msg.file.data) {
            // Mensagem do localStorage tem file.data, mas vamos verificar se há uma versão mais completa no mapa
            console.log(`[updateChat] Mensagem timestamp ${msg.timestamp}, id: ${msg.id} já tem file.data no localStorage`);
          }
          
          return msg;
        });
        
        // Converter mensagens do localStorage para o formato do contato
        // CRITICAL: Preservar file.data do localStorage se existir
        const convertedMessages = mergedMessages.map(msg => {
          const converted = {
            text: msg.text || (msg.file ? '[Arquivo]' : ''),
            type: msg.type === "sent" ? "sent" : "received",
            time: msg.time || getCurrentTime(),
            timestamp: msg.timestamp || Date.now(),
            isEmojiOnly: msg.isEmojiOnly || false,
            caption: msg.caption,
            id: msg.id
          };
          
          // CRITICAL: Preservar file.data - SEMPRE usar do mapa se existir, senão do localStorage
          if (msg.file) {
            // Verificar se há file.data no mapa (prioridade)
            let fileDataToUse = msg.file.data;
            let existingFileInfo = null;
            
            if (converted.id) {
              existingFileInfo = existingFileDataMap.get('id:' + converted.id);
            }
            if (!existingFileInfo && converted.timestamp) {
              existingFileInfo = existingFileDataMap.get(converted.timestamp);
            }
            
            // Se encontrou no mapa, usar do mapa (prioridade)
            if (existingFileInfo && existingFileInfo.data) {
              fileDataToUse = existingFileInfo.data;
              console.log(`[updateChat] ✅ USANDO file.data do mapa durante conversão para timestamp ${converted.timestamp}, id: ${converted.id}`);
            }
            
            converted.file = {
              name: existingFileInfo?.name || msg.file.name,
              size: existingFileInfo?.size || msg.file.size,
              type: existingFileInfo?.type || msg.file.type,
              data: fileDataToUse // CRITICAL: Usar do mapa se existir, senão do localStorage
            };
            
            console.log(`[updateChat] Convertendo mensagem com arquivo:`, {
              id: converted.id,
              timestamp: converted.timestamp,
              fileName: converted.file.name,
              hasData: !!converted.file.data,
              dataLength: converted.file.data?.length || 0,
              source: existingFileInfo ? 'mapa' : (msg.file.data ? 'localStorage' : 'nenhum')
            });
          }
          
          return converted;
        });
        
        // CRITICAL: Incluir também mensagens existentes que não estão no localStorage
        // E garantir que mensagens existentes com file.data sejam preservadas mesmo se estiverem no localStorage
        if (contact.messages && Array.isArray(contact.messages)) {
          const existingTimestamps = new Set(convertedMessages.map(m => m.timestamp));
          const existingIds = new Set(convertedMessages.map(m => m.id).filter(id => id));
          
          // Criar um mapa das mensagens convertidas para facilitar a atualização
          const convertedMessagesMap = new Map();
          convertedMessages.forEach((msg, idx) => {
            if (msg.timestamp) convertedMessagesMap.set(msg.timestamp, idx);
            if (msg.id) convertedMessagesMap.set('id:' + msg.id, idx);
          });
          
          contact.messages.forEach(existingMsg => {
            // Verificar se a mensagem já não foi incluída
            const alreadyIncluded = 
              (existingMsg.timestamp && existingTimestamps.has(existingMsg.timestamp)) ||
              (existingMsg.id && existingIds.has(existingMsg.id));
            
            if (!alreadyIncluded) {
              // Mensagem não está no localStorage, adicionar se tiver arquivo
              if (existingMsg.file && existingMsg.file.data) {
                console.log(`[updateChat] Adicionando mensagem local com arquivo não encontrada no localStorage:`, existingMsg.id || existingMsg.timestamp, existingMsg.file.name);
                convertedMessages.push(existingMsg);
              } else if (!existingMsg.file) {
                // Mensagem sem arquivo também deve ser adicionada
                convertedMessages.push(existingMsg);
              }
            } else {
              // Mensagem já está incluída, mas verificar se precisa atualizar file.data
              if (existingMsg.file && existingMsg.file.data) {
                // Encontrar a mensagem correspondente nas mensagens convertidas
                let convertedIdx = -1;
                if (existingMsg.id) {
                  const idx = convertedMessagesMap.get('id:' + existingMsg.id);
                  if (idx !== undefined) convertedIdx = idx;
                }
                if (convertedIdx === -1 && existingMsg.timestamp) {
                  const idx = convertedMessagesMap.get(existingMsg.timestamp);
                  if (idx !== undefined) convertedIdx = idx;
                }
                
                if (convertedIdx >= 0) {
                  const convertedMsg = convertedMessages[convertedIdx];
                  // Se a mensagem convertida não tem file.data ou tem mas a existente é mais recente, usar a existente
                  if (!convertedMsg.file || !convertedMsg.file.data || 
                      (existingMsg.timestamp && convertedMsg.timestamp && existingMsg.timestamp > convertedMsg.timestamp)) {
                    console.log(`[updateChat] Atualizando file.data da mensagem já incluída:`, existingMsg.id || existingMsg.timestamp, existingMsg.file.name);
                    if (!convertedMsg.file) {
                      convertedMsg.file = {};
                    }
                    convertedMsg.file = {
                      name: existingMsg.file.name || convertedMsg.file.name,
                      size: existingMsg.file.size || convertedMsg.file.size,
                      type: existingMsg.file.type || convertedMsg.file.type,
                      data: existingMsg.file.data // CRITICAL: Sempre usar file.data da mensagem existente
                    };
                  }
                }
              }
            }
          });
        }
        
        // CRITICAL: Atualizar contact.messages APENAS para referência, mas renderizar DIRETAMENTE do localStorage
        // Isso garante que file.data seja sempre preservado, como no sistema Suporte
        contact.messages = convertedMessages;
        
        // DEBUG: Verificar quantas mensagens têm file.data após mesclagem
        const finalMessagesWithFiles = contact.messages.filter(m => m.file && m.file.data);
        console.log(`[updateChat] ✅ Após mesclagem: ${contact.messages.length} mensagens totais, ${finalMessagesWithFiles.length} com file.data`);
        finalMessagesWithFiles.forEach((m, idx) => {
          console.log(`[updateChat] Mensagem final ${idx + 1} com arquivo:`, {
            timestamp: m.timestamp,
            id: m.id,
            fileName: m.file?.name,
            hasData: !!m.file?.data,
            dataLength: m.file?.data?.length || 0
          });
        });
        
        // Ordenar mensagens por timestamp
        contact.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // CRITICAL: Garantir que contact.messages tenha file.data preservado do localStorage
        // Atualizar contact.messages com file.data do localStorage se estiver faltando
        contact.messages.forEach((msg, idx) => {
          if (msg.file && !msg.file.data) {
            // Tentar encontrar file.data no localStorage
            const localStorageMsg = localStorageMessages.find(lm => 
              (lm.id && lm.id === msg.id) || 
              (lm.timestamp === msg.timestamp)
            );
            if (localStorageMsg && localStorageMsg.file && localStorageMsg.file.data) {
              console.log(`[updateChat] ✅ Restaurando file.data do localStorage para mensagem ${idx + 1}`);
              msg.file.data = localStorageMsg.file.data;
            }
          }
        });
      } catch (error) {
        console.warn("Erro ao carregar mensagens do localStorage:", error);
        // Se houver erro, manter as mensagens existentes do contato
        if (!contact.messages) {
          contact.messages = [];
        }
      }

      console.log(`✅ Contato encontrado: ${contact.name}`);



      // Atualizar contact-box

      try {

        const contactImage = contactBox.querySelector("img");
        if (contactImage) {
          contactImage.src = contact.image;
          contactImage.onerror = function() { this.src = contact.fallbackImage; };
        }

        const contactTitle = contactBox.querySelector(".contact-box-title");
        if (contactTitle) {
          contactTitle.textContent = contact.name;
        }

        const contactSubtitle = contactBox.querySelector("p");
        if (contactSubtitle) {
          contactSubtitle.textContent = contact.status;
        }

        contactBox.classList.remove("hidden");

        console.log(`✅ Contact-box atualizado`);

      } catch (error) {

        console.error('❌ Erro ao atualizar contact-box:', error);

      }



      // Obter nome do usuário logado

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      const userName = currentUser.fullName || currentUser.username || "Usuário";



      // Atualizar mensagens com indicadores de data

      messagesContainer.innerHTML = "";

      let lastMessageDate = null;

      

      console.log(`📨 Renderizando ${contact.messages.length} mensagens...`);

      

      contact.messages.forEach((message, index) => {

        try {

          // Adicionar indicador de data se for diferente da mensagem anterior

          const messageDate = message.timestamp || Date.now();

          const messageDateString = new Date(messageDate).toDateString();

          

          if (messageDateString !== lastMessageDate) {

            const dateText = getRelativeDate(messageDate);

            const dateDivider = createDateDivider(dateText);

            messagesContainer.appendChild(dateDivider);

            lastMessageDate = messageDateString;

            console.log(`📅 Indicador de data adicionado: ${dateText}`);

          }

        } catch (error) {

          console.error(`❌ Erro ao adicionar indicador de data na mensagem ${index}:`, error);

        }

        

        try {

          const messageDiv = document.createElement("div");

          messageDiv.classList.add("message", message.type);

          

          // Verificar se é mensagem de emoji apenas

          const onlyEmojis = message.isEmojiOnly || isOnlyEmojis(message.text);

          if (onlyEmojis) {

            messageDiv.classList.add("emoji-only");

          }

          

          if (message.type === "sent") {

            const infoDiv = document.createElement("span");

            infoDiv.classList.add("message-sent-info");

            infoDiv.textContent = userName;

            messageDiv.appendChild(infoDiv);

          }

          // Se mensagem tem arquivo, renderizar arquivo
          // CRITICAL: SEMPRE buscar file.data do localStorage primeiro (como no sistema Suporte)
          if (message.file) {
            let fileDataToRender = null;
            
            // SEMPRE buscar do localStorage primeiro (fonte de verdade, como no Suporte)
            try {
              const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
              const contactChatId = `chat_contact_${contact.id}`;
              
              // Buscar mensagem no localStorage usando múltiplos critérios
              const localStorageMsg = allMessages.find(lm => {
                // Verificar se é mensagem deste contato
                const isContactMessage = lm.chatId === contactChatId || 
                                         lm.chatId === contact.id.toString() ||
                                         (lm.contactId && lm.contactId === contact.id.toString()) ||
                                         (lm.contactId && parseInt(lm.contactId) === contact.id);
                if (!isContactMessage) return false;
                
                // Tentar encontrar por múltiplos critérios
                if (message.id && lm.id === message.id) return true;
                if (message.timestamp && lm.timestamp === message.timestamp) return true;
                if (message.file && lm.file && 
                    message.file.name === lm.file.name && 
                    message.timestamp === lm.timestamp) return true;
                
                return false;
              });
              
              if (localStorageMsg && localStorageMsg.file && localStorageMsg.file.data) {
                fileDataToRender = localStorageMsg.file.data;
                console.log(`[updateChat] ✅ file.data encontrado no localStorage:`, {
                  timestamp: message.timestamp,
                  id: message.id,
                  fileName: message.file.name,
                  dataLength: fileDataToRender.length
                });
              } else {
                // Fallback: usar file.data de contact.messages se existir
                if (message.file.data) {
                  fileDataToRender = message.file.data;
                  console.log(`[updateChat] Usando file.data de contact.messages:`, {
                    timestamp: message.timestamp,
                    id: message.id,
                    fileName: message.file.name
                  });
                }
              }
            } catch (error) {
              console.warn(`[updateChat] Erro ao buscar file.data do localStorage:`, error);
              // Fallback: usar file.data de contact.messages se existir
              if (message.file.data) {
                fileDataToRender = message.file.data;
              }
            }
            
            if (fileDataToRender) {
              console.log(`[updateChat] ✅ Renderizando mensagem com arquivo:`, {
                timestamp: message.timestamp,
                id: message.id,
                fileName: message.file.name,
                hasData: !!fileDataToRender,
                dataLength: fileDataToRender.length || 0
              });
              const fileObj = {
                name: message.file.name,
                size: message.file.size,
                type: message.file.type
              };
              const fileElement = createFileElement(fileObj, fileDataToRender, message.caption);
              messageDiv.appendChild(fileElement);
              
              // Se houver legenda, adicionar como texto separado
              if (message.caption) {
                const captionDiv = document.createElement("span");
                captionDiv.textContent = message.caption;
                messageDiv.appendChild(captionDiv);
              }
            } else {
              console.error(`[updateChat] ❌ ERRO: Mensagem tem file mas não encontrou file.data (nem no localStorage nem em contact.messages):`, {
                timestamp: message.timestamp,
                id: message.id,
                fileName: message.file.name,
                hasFileInMessage: !!message.file,
                hasDataInMessage: !!message.file.data
              });
            }
          }
          // Renderizar emojis grandes ou texto normal
          else if (onlyEmojis) {

            const emojis = extractEmojis(message.text);

            const emojiCount = emojis.length;

            

            emojis.forEach((emoji, index) => {

              const emojiContainer = createLargeEmoji(emoji, index);

              

              // Ajustar tamanho baseado na quantidade

              if (emojiCount === 1) {

                // Manter tamanho grande padrão (80px)

              } else if (emojiCount <= 3) {

                emojiContainer.classList.add('emoji-medium');

              } else {

                emojiContainer.classList.add('emoji-small');

              }

              

              messageDiv.appendChild(emojiContainer);

            });

          } else {

            const textDiv = document.createElement("span");

            textDiv.textContent = message.text;

            messageDiv.appendChild(textDiv);

          }

          

          if (message.type === "sent") {

            const timeDiv = document.createElement("span");

            timeDiv.classList.add("message-time");

            timeDiv.textContent = message.time || getCurrentTime();

            messageDiv.appendChild(timeDiv);

          }

          messagesContainer.appendChild(messageDiv);

        } catch (error) {

          console.error(`❌ Erro ao renderizar mensagem ${index}:`, error);

        }

      });



      // Rolagem automática para a última mensagem

      messagesContainer.scrollTop = messagesContainer.scrollHeight;



      // Atualizar contato ativo

      contactElements.forEach(c => c.classList.remove("active"));

      const activeContactElement = document.querySelector(`.contact[data-contact-id="${contactId}"]`);

      if (activeContactElement) {

        activeContactElement.classList.add("active");

      }

      

      // Habilitar input de mensagem quando contato for selecionado

      enableMessageInput();

      

      console.log(`✅ Chat atualizado com sucesso para ${contact.name}`);

    }

    

    // Função para habilitar/desabilitar input de mensagem

    function enableMessageInput() {

      const messageInputContainer = document.querySelector(".message-input");

      const messageInput = document.querySelector(".message-input input[type='text']");

      

      if (messageInputContainer) {

        messageInputContainer.classList.add("active");

      }

      

      if (messageInput) {

        messageInput.disabled = false;

        messageInput.placeholder = "Digite uma mensagem...";

      }

    }

    

    function disableMessageInput() {

      const messageInputContainer = document.querySelector(".message-input");

      const messageInput = document.querySelector(".message-input input[type='text']");

      

      if (messageInputContainer) {

        messageInputContainer.classList.remove("active");

      }

      

      if (messageInput) {

        messageInput.disabled = true;

        messageInput.value = "";

      }

    }

  

    // Evento de clique nos contatos

    contactElements.forEach(contact => {

      contact.addEventListener("click", () => {

        const contactId = contact.getAttribute("data-contact-id");

        console.log(`🔵 Clicou no contato ID: ${contactId}`);

        try {

          updateChat(contactId);

        } catch (error) {

          console.error('❌ Erro ao atualizar chat:', error);

        }

      });

    });

  

    // Evento de clique nos botões da sidebar

    sidebarButtons.forEach(button => {

      button.addEventListener("click", () => {

        const section = button.getAttribute("data-section");

        

        // Verificar permissão para admin

        if (section === "admin" && !isAdmin()) {

          showToast("Acesso negado! Apenas administradores podem acessar esta seção.", "error");

          return;

        }

        

        sidebarButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");



        if (section === "chat") {

          chatContainer.classList.remove("hidden");

          chatList.classList.remove("hidden");

          chatMain.classList.remove("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.remove("active");

          if (ncmContainer) ncmContainer.classList.add("hidden");
          
          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (internalChatContainer) internalChatContainer.style.display = "none";

          rightPanel.classList.remove("hidden");

          

          // Carregar/atualizar contatos de suporte ao abrir seção de chat

          if (typeof updateSupportContactsList === 'function') {

            updateSupportContactsList();

          }

          

          // Verificar se há algum contato selecionado

          const hasActiveContact = document.querySelector(".contact.active");

          if (!hasActiveContact) {

            // Se não houver contato selecionado, esconder a barra de mensagens

            disableMessageInput();

          }

        } else if (section === "internal-chat") {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.remove("active");

          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (internalChatContainer) {
            internalChatContainer.style.display = "flex";
            // Garantir que o chat-main dentro do internal-chat-container esteja visível
            const internalChatMain = internalChatContainer.querySelector(".chat-main");
            if (internalChatMain) {
              internalChatMain.classList.remove("hidden");
              internalChatMain.style.display = "flex";
            }
          }

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.remove("hidden");

          // Carregar/atualizar contatos internos ao abrir seção
          if (typeof updateInternalContactsList === 'function') {
            updateInternalContactsList();
          }

          // Verificar se há algum contato selecionado
          const hasActiveContact = document.querySelector("#internalContactsSection .contact.active");
          if (!hasActiveContact) {
            disableInternalMessageInput();
          } else {
            // Se já houver um contato ativo, recarregar o chat
            const activeContact = document.querySelector("#internalContactsSection .contact.active");
            if (activeContact) {
              const chatId = activeContact.dataset.chatId;
              const username = activeContact.dataset.username;
              const users = getUsersFromStorage();
              const user = users.find(u => normalizeUsername(u.username) === username);
              if (user && chatId) {
                loadInternalChat(chatId, user);
              }
            }
          }

        } else if (section === "admin") {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.add("active");

          scheduledMessageContainer.classList.remove("active");

          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (ncmContainer) ncmContainer.classList.add("hidden");

          if (internalChatContainer) internalChatContainer.style.display = "none";

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

        } else if (section === "tax-agenda") {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.add("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.remove("active");

          if (ncmContainer) ncmContainer.classList.add("hidden");

          if (internalChatContainer) internalChatContainer.style.display = "none";

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

        } else if (section === "scheduled-message") {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.add("active");

          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (ncmContainer) ncmContainer.classList.add("hidden");

          if (internalChatContainer) internalChatContainer.style.display = "none";

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

          

          // Carregar contatos no seletor

          if (typeof loadContactsSelector === 'function') {

            loadContactsSelector();

          }

          

          // Resetar área de relatório

          if (reportPreview) reportPreview.style.display = 'none';

          if (downloadPdfBtn) downloadPdfBtn.style.display = 'none';

        } else if (section === "ncm") {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.remove("active");

          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (ncmContainer) {
            ncmContainer.classList.remove("hidden");
            ncmContainer.style.display = "";
            ncmContainer.style.visibility = "";
            ncmContainer.style.opacity = "";
          }

          if (internalChatContainer) internalChatContainer.style.display = "none";

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

        } else if (section === "job-management") {
          chatContainer.classList.add("hidden");
          chatList.classList.add("hidden");
          chatMain.classList.add("hidden");
          taxAgendaContainer.classList.remove("active");
          adminContainer.classList.remove("active");
          scheduledMessageContainer.classList.remove("active");
          if (ncmContainer) ncmContainer.classList.add("hidden");
          if (internalChatContainer) internalChatContainer.style.display = "none";
          contactBox.classList.add("hidden");
          contactElements.forEach(c => c.classList.remove("active"));
          messagesContainer.innerHTML = "";
          rightPanel.classList.add("hidden");

          // Mostrar container de gerenciamento de vagas
          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) {
            jobManagementContainer.classList.add("active");
            // Carregar vagas quando a seção for aberta
            if (typeof loadJobManagementData === 'function') {
              loadJobManagementData();
            }
          }

        } else {

          chatContainer.classList.add("hidden");

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          taxAgendaContainer.classList.remove("active");

          adminContainer.classList.remove("active");

          scheduledMessageContainer.classList.remove("active");

          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) jobManagementContainer.classList.remove("active");

          if (ncmContainer) ncmContainer.classList.add("hidden");

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.remove("hidden");

        }

      });

    });

  

    // Função para enviar mensagem

    function sendMessage() {

      if (!messageInput) return;

      

      const text = messageInput.value.trim();

      if (!text) return;

      

      const sanitizedText = text;

      const onlyEmojis = isOnlyEmojis(sanitizedText);

      

      // Verificar se é chat de suporte

      if (currentSupportChatId) {

        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

        const userName = currentUser.fullName || currentUser.username || "Usuário";

        const userSector = currentUser.sector || "";

        const time = getCurrentTime();

        

        // Obter o setor do chat atual

        const currentChat = supportChats[currentSupportChatId];

        const chatSector = currentChat ? currentChat.sector : userSector;

        

        // Determinar o chatId correto para a mensagem
        // Se estiver em um chat de funcionário, usar o chatId do funcionário
        // Se estiver em um chat do administrador, usar o chatId do administrador
        const isEmployeeChat = isEmployeeChatId(currentSupportChatId);
        let targetChatId = currentSupportChatId;
        let targetEmployeeId = null;
        
        if (isEmployeeChat && currentChat && currentChat.employeeId) {
          // Mensagem em chat de funcionário - usar chatId do funcionário
          targetChatId = currentSupportChatId;
          targetEmployeeId = currentChat.employeeId;
        } else if (currentChat && currentChat.contributorId) {
          // Mensagem em chat do administrador - usar chatId do administrador
          targetChatId = currentChat.chatId || `chat_contributor_${currentChat.contributorId}`;
          // Não adicionar targetEmployeeId (mensagem para o administrador)
        }
        
        const messageData = {
          id: generateUniqueId(),
          chatId: targetChatId,
          sender: userName,
          profileImage: "../../assets/images/avatars/profile-1.png",
          text: sanitizedText,
          type: "support",
          sector: chatSector,
          isEmojiOnly: onlyEmojis,
          time: time,
          timestamp: Date.now(),
          read: false,
          contributorId: currentChat ? currentChat.contributorId : null
        };
        
        // Adicionar targetEmployeeId se estiver em chat de funcionário
        if (targetEmployeeId) {
          messageData.targetEmployeeId = targetEmployeeId;
        }

        

        // Adicionar mensagem na interface

        const messageDiv = document.createElement("div");

        messageDiv.classList.add("message", "sent");

        

        // Se for apenas emojis, adicionar classe especial

        if (onlyEmojis) {

          messageDiv.classList.add("emoji-only");

        }

        

        // Removido message-sent-info do chat com contribuintes - o usuário já sabe com quem está conversando

        

        // Renderizar emojis grandes ou texto normal

        if (onlyEmojis) {

          const emojis = extractEmojis(sanitizedText);

          const emojiCount = emojis.length;

          

          console.log(`🎨 Renderizando ${emojiCount} emoji(s) com animação Lottie!`);

          

          emojis.forEach((emoji, index) => {

            const emojiContainer = createLargeEmoji(emoji, index);

            

            // Ajustar tamanho baseado na quantidade

            if (emojiCount === 1) {

              // Manter tamanho grande padrão (80px)

              console.log(`📏 1 emoji - Tamanho grande (80px)`);

            } else if (emojiCount <= 3) {

              emojiContainer.classList.add('emoji-medium');

              console.log(`📏 ${emojiCount} emojis - Tamanho médio (60px)`);

            } else {

              emojiContainer.classList.add('emoji-small');

              console.log(`📏 ${emojiCount} emojis - Tamanho pequeno (45px)`);

            }

            

            messageDiv.appendChild(emojiContainer);

          });

        } else {

        const textDiv = document.createElement("span");

        textDiv.textContent = sanitizedText;

        messageDiv.appendChild(textDiv);

        }

        

        const timeDiv = document.createElement("span");

        timeDiv.classList.add("message-time");

        timeDiv.textContent = time;

        messageDiv.appendChild(timeDiv);

        

        messagesContainer.appendChild(messageDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        

        // Salvar no localStorage

        const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");

        messages.push(messageData);

        localStorage.setItem("supportMessages", JSON.stringify(messages));

        

        // Salvar no Firebase

        saveSupportMessageToFirebase(messageData);

        

        // Atualizar lista de contatos
        updateSupportContactsList();
        
        // Atualizar lista de funcionários do contribuinte ativo (se houver)
        updateActiveContributorEmployeesList();
        
        // Atualizar badges do sidebar
        updateSidebarBadges();

        messageInput.value = "";

        return;

      }

      

      // Chat normal

      const activeContact = document.querySelector(".contact.active:not(.support-contact)");

      if (!activeContact) return;

      

      const contactId = activeContact.getAttribute("data-contact-id");

      const contact = contacts.find(c => c.id === parseInt(contactId));

      if (!contact) return;

      

      const time = getCurrentTime();

      const timestamp = Date.now();

      // Garantir que contact.messages seja um array
      if (!contact.messages) {
        contact.messages = [];
      }
      
      contact.messages.push({ text: sanitizedText, type: "sent", time, timestamp, isEmojiOnly: onlyEmojis });
      
      // Salvar mensagem no localStorage para persistência
      try {
        const messageData = {
          id: generateUniqueId(),
          chatId: `chat_contact_${contact.id}`,
          contactId: contact.id.toString(),
          text: sanitizedText,
          type: "sent",
          sender: userName,
          time: time,
          timestamp: timestamp,
          isEmojiOnly: onlyEmojis
        };
        
        const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
        allMessages.push(messageData);
        localStorage.setItem("supportMessages", JSON.stringify(allMessages));
      } catch (error) {
        console.warn("Erro ao salvar mensagem no localStorage:", error);
      }

      

      // Obter nome do usuário logado

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      const userName = currentUser.fullName || currentUser.username || "Usuário";



      const messageDiv = document.createElement("div");

      messageDiv.classList.add("message", "sent");

      

      // Se for apenas emojis, adicionar classe especial

      if (onlyEmojis) {

        messageDiv.classList.add("emoji-only");

      }

      

      const infoDiv = document.createElement("span");

      infoDiv.classList.add("message-sent-info");

      infoDiv.textContent = userName;

      messageDiv.appendChild(infoDiv);

      

      // Renderizar emojis grandes ou texto normal

      if (onlyEmojis) {

        const emojis = extractEmojis(sanitizedText);

        const emojiCount = emojis.length;

        

        emojis.forEach((emoji, index) => {

          const emojiContainer = createLargeEmoji(emoji, index);

          

          // Ajustar tamanho baseado na quantidade

          if (emojiCount === 1) {

            // Manter tamanho grande padrão (80px)

          } else if (emojiCount <= 3) {

            emojiContainer.classList.add('emoji-medium');

          } else {

            emojiContainer.classList.add('emoji-small');

          }

          

          messageDiv.appendChild(emojiContainer);

        });

      } else {

      const textDiv = document.createElement("span");

      textDiv.textContent = sanitizedText;

      messageDiv.appendChild(textDiv);

      }

      

      const timeDiv = document.createElement("span");

      timeDiv.classList.add("message-time");

      timeDiv.textContent = time;

      messageDiv.appendChild(timeDiv);

      messagesContainer.appendChild(messageDiv);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;



      // Atualizar pré-visualização na lista de contatos

      const previewText = onlyEmojis ? sanitizedText.substring(0, 10) : sanitizedText;

      activeContact.querySelector(".contact-info p").textContent = `Enviado: ${previewText}`;

      messageInput.value = "";

    }



    // Evento de envio de mensagem

    if (sendButton) {

      sendButton.addEventListener("click", () => {

        // Se estiver no modo de pré-visualização, enviar arquivo

        if (isPreviewMode && currentFile && currentFileData) {

          sendFileWithCaption();

          return;

        }

        sendMessage();

      });

    }

    

    // Evento de ENTER para enviar mensagem

    if (messageInput) {

      messageInput.addEventListener("keypress", (e) => {

        if (e.key === "Enter" && !e.shiftKey) {

          e.preventDefault();

          // Se estiver no modo de pré-visualização, enviar arquivo

          if (isPreviewMode && currentFile && currentFileData) {

            sendFileWithCaption();

            return;

          }

          sendMessage();

        }

      });

    }



    // Evento de checkbox nas tarefas

    const taskCheckboxes = document.querySelectorAll(".task-checkbox");

    taskCheckboxes.forEach(checkbox => {

      checkbox.addEventListener("change", (e) => {

        const taskItem = e.target.closest(".task-item");

        const taskTitle = taskItem.querySelector(".task-title");

        

        if (e.target.checked) {

          taskTitle.classList.add("completed");

        } else {

          taskTitle.classList.remove("completed");

        }

        

        // Verificar tarefas de hoje após marcar/desmarcar

        setTimeout(() => {

          if (typeof checkTodayTasks === 'function') {

            checkTodayTasks();

          }

        }, 100);

      });

    });



    // Modal de adicionar lembrete

    const addTaskBtn = document.querySelector(".add-task-btn");

    const modal = document.getElementById("addTaskModal");

    const closeModalBtn = document.getElementById("closeModalBtn");

    const cancelBtn = document.getElementById("cancelBtn");

    const saveTaskBtn = document.getElementById("saveTaskBtn");

    const tasksListContainer = document.querySelector(".tasks-list");



    // Abrir modal

    if (addTaskBtn) {

      addTaskBtn.addEventListener("click", () => {

        modal.classList.add("active");

      });

    }



    // Fechar modal

    function closeModal() {

      modal.classList.remove("active");

      // Limpar campos

      document.getElementById("taskDay").value = "";

      document.getElementById("taskMonth").value = "Jan";

      document.getElementById("taskTitle").value = "";

      document.getElementById("taskDescription").value = "";

    }



    if (closeModalBtn) {

      closeModalBtn.addEventListener("click", closeModal);

    }



    if (cancelBtn) {

      cancelBtn.addEventListener("click", closeModal);

    }



    // Fechar ao clicar fora do modal

    modal.addEventListener("click", (e) => {

      if (e.target === modal) {

        closeModal();

      }

    });



    // Validar apenas números no campo de dia

    const taskDayInput = document.getElementById("taskDay");

    if (taskDayInput) {

      taskDayInput.addEventListener("input", (e) => {

        // Permitir apenas números

        e.target.value = e.target.value.replace(/[^0-9]/g, '');

      });

    }



    // Salvar novo lembrete

    if (saveTaskBtn) {

      saveTaskBtn.addEventListener("click", () => {

        const day = document.getElementById("taskDay").value;

        const month = document.getElementById("taskMonth").value;

        const title = document.getElementById("taskTitle").value.trim();

        const description = document.getElementById("taskDescription").value.trim();



        // Validações

        if (!day || day < 1 || day > 31) {

          showToast("Por favor, insira um dia válido entre 1 e 31", "error");

          return;

        }



        if (!title) {

          showToast("Por favor, insira um título para o lembrete", "error");

          return;

        }



        // Descrição é opcional, mas se estiver vazia, usar um placeholder

        const finalDescription = description || "Sem descrição";



        // Criar o elemento do lembrete

        const taskItem = document.createElement("div");

        taskItem.classList.add("task-item", "reminder-task");

        

        const taskDate = `${String(day).padStart(2, '0')} ${month} 2025`;

        

        taskItem.innerHTML = `

          <div class="task-icon"><i class='bx bx-calendar'></i></div>

          <div class="task-date">${taskDate}</div>

          <div class="task-content">

            <input type="checkbox" class="task-checkbox" aria-label="Marcar ${title} como concluído">

            <div class="task-info">

              <div class="task-title">${title}</div>

              <div class="task-description">${finalDescription}</div>

            </div>

          </div>

        `;



        // Adicionar evento ao novo checkbox

        const newCheckbox = taskItem.querySelector(".task-checkbox");

        newCheckbox.addEventListener("change", (e) => {

          const taskTitle = taskItem.querySelector(".task-title");

          if (e.target.checked) {

            taskTitle.classList.add("completed");

          } else {

            taskTitle.classList.remove("completed");

          }

          

          // Verificar tarefas de hoje

          setTimeout(() => {

            if (typeof checkTodayTasks === 'function') {

              checkTodayTasks();

            }

          }, 100);

        });



        // Adicionar à lista

        tasksListContainer.appendChild(taskItem);

        

        // Reordenar tarefas por data

        sortTasksByDate();

        

        // Reprocessar divisória de hoje

        addTodayDivider();

        

        // Atualizar calendários com novos indicadores

        generateCalendar(0, 0);

        generateCalendar(1, 1);

        

        // Verificar se há tarefas para hoje (atualizar badge)

        checkTodayTasks();



        // Rolar até o novo item

        taskItem.scrollIntoView({ behavior: "smooth", block: "nearest" });



        // Fechar modal e limpar

        closeModal();

      });

    }



    // Navegação do calendário

    const calendarSections = document.querySelectorAll(".calendar-month-section");

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 

                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    

    let currentDate = new Date();

    let currentMonth = currentDate.getMonth();

    let currentYear = currentDate.getFullYear();

    

    // Função para obter tarefas por data

    function getTasksForDate(day, month, year) {

      const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const dateString = `${String(day).padStart(2, '0')} ${monthAbbr[month]} ${year}`;

      

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      const tasksOnDate = {

        hasReminder: false,

        hasTax: false

      };

      

      allTasks.forEach(task => {

        const taskDateElement = task.querySelector(".task-date");

        if (taskDateElement && taskDateElement.textContent.trim() === dateString) {

          if (task.classList.contains('reminder-task')) {

            tasksOnDate.hasReminder = true;

          }

        }

      });

      

      return tasksOnDate;

    }

    

    function generateCalendar(monthOffset, sectionIndex) {

      const section = calendarSections[sectionIndex];

      if (!section) return;

      

      const displayDate = new Date(currentYear, currentMonth + monthOffset, 1);

      const month = displayDate.getMonth();

      const year = displayDate.getFullYear();

      

      // Atualizar título

      const titleElement = section.querySelector(".calendar-title");

      if (titleElement) {

        titleElement.textContent = `${monthNames[month]} ${year}`;

      }

      

      // Gerar grid do calendário

      const grid = section.querySelector(".calendar-grid");

      if (!grid) return;

      

      // Limpar grid (manter apenas headers)

      const headers = grid.querySelectorAll(".calendar-day-header");

      grid.innerHTML = "";

      headers.forEach(header => grid.appendChild(header));

      

      // Primeiro dia do mês e último dia

      const firstDay = new Date(year, month, 1).getDay();

      const lastDate = new Date(year, month + 1, 0).getDate();

      const prevLastDate = new Date(year, month, 0).getDate();

      

      // Dias do mês anterior

      for (let i = firstDay - 1; i >= 0; i--) {

        const day = document.createElement("div");

        day.classList.add("calendar-day", "other-month");

        day.textContent = prevLastDate - i;

        grid.appendChild(day);

      }

      

      // Dias do mês atual

      const today = new Date();

      for (let i = 1; i <= lastDate; i++) {

        const day = document.createElement("div");

        day.classList.add("calendar-day");

        day.textContent = i;

        

        // Marcar dia atual

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {

          day.classList.add("today");

        }

        

        // Adicionar indicadores de tarefas

        const tasksInfo = getTasksForDate(i, month, year);

        if (tasksInfo.hasReminder || tasksInfo.hasTax) {

          const indicatorsContainer = document.createElement("div");

          indicatorsContainer.classList.add("calendar-day-indicators");

          

          if (tasksInfo.hasReminder) {

            const reminderIndicator = document.createElement("span");

            reminderIndicator.classList.add("day-indicator", "reminder");

            reminderIndicator.title = "Possui lembrete";

            indicatorsContainer.appendChild(reminderIndicator);

          }

          

          if (tasksInfo.hasTax) {

            const taxIndicator = document.createElement("span");

            taxIndicator.classList.add("day-indicator", "tax");

            taxIndicator.title = "Possui vencimento";

            indicatorsContainer.appendChild(taxIndicator);

          }

          

          day.appendChild(indicatorsContainer);

          

          // Adicionar classe para indicar que tem tarefas

          day.classList.add('has-tasks');

          

          // Adicionar evento de clique para filtrar por este dia

          day.addEventListener('click', (e) => {

            e.stopPropagation();

            const clickedDate = new Date(year, month, i);

            filterTasksBySpecificDate(clickedDate);

          });

          

          // Adicionar cursor pointer para indicar que é clicável

          day.style.cursor = 'pointer';

        }

        

        grid.appendChild(day);

      }

      

      // Dias do próximo mês (completar grid)

      const totalCells = grid.children.length - 7; // Subtrair headers

      const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);

      for (let i = 1; i <= remainingCells; i++) {

        const day = document.createElement("div");

        day.classList.add("calendar-day", "other-month");

        day.textContent = i;

        grid.appendChild(day);

      }

    }

    

    // ==================== LEMBRETES AUTOMÁTICOS DE VENCIMENTOS FISCAIS ====================
    
    // Função para calcular próximo dia útil (não sábado, não domingo)
    function getNextBusinessDay(date) {
      const d = new Date(date);
      while (d.getDay() === 0 || d.getDay() === 6) { // 0 = Domingo, 6 = Sábado
        d.setDate(d.getDate() + 1);
      }
      return d;
    }
    
    // Função para calcular o n-ésimo dia útil
    function getNthBusinessDay(year, month, n) {
      const date = new Date(year, month, 1);
      let businessDays = 0;
      while (businessDays < n) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          businessDays++;
          if (businessDays === n) break;
        }
        date.setDate(date.getDate() + 1);
      }
      return date;
    }
    
    // Função para obter último dia útil do mês
    function getLastBusinessDayOfMonth(year, month) {
      const lastDay = new Date(year, month + 1, 0); // Último dia do mês
      let d = new Date(lastDay);
      while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() - 1);
      }
      return d;
    }
    
    // Função para criar lembretes automáticos baseados no mês atual
    function initializeAutoTaxReminders() {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      
      // Verificar se já foram criados os lembretes deste mês
      const remindersKey = `taxReminders_${currentYear}_${currentMonth}`;
      const alreadyCreated = localStorage.getItem(remindersKey) === 'true';
      
      const reminders = [];
      
      // 1. EFD-ICMS/IPI: 20º dia do mês atual (vencimento), referente à apuração do mês anterior
      const efdIcmsVencimento = new Date(currentYear, currentMonth, 20);
      const efdIcmsDate = getNextBusinessDay(efdIcmsVencimento);
      if (efdIcmsDate.getMonth() === currentMonth) { // Só adicionar se o vencimento for no mês atual
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const apuracaoMonth = monthNames[prevMonth];
        const apuracaoMonthAbbr = monthAbbr[prevMonth];
        reminders.push({
          day: efdIcmsDate.getDate(),
          month: monthAbbr[efdIcmsDate.getMonth()],
          year: efdIcmsDate.getFullYear(),
          title: `EFD-ICMS/IPI - Apuração ${apuracaoMonthAbbr}/${prevYear}`,
          description: `Escrituração Fiscal Digital ICMS/IPI - Apuração: ${apuracaoMonth}/${prevYear} | Vencimento: ${String(efdIcmsDate.getDate()).padStart(2, '0')}/${String(efdIcmsDate.getMonth() + 1).padStart(2, '0')}/${efdIcmsDate.getFullYear()} (até o 20º dia do mês subsequente)`
        });
      }
      
      // 2. EFD-Contribuições: 10º dia útil do mês atual (vencimento), referente à apuração de 2 meses atrás
      const efdContribVencimento = new Date(currentYear, currentMonth, 1);
      const efdContribDate = getNthBusinessDay(efdContribVencimento.getFullYear(), efdContribVencimento.getMonth(), 10);
      if (efdContribDate.getMonth() === currentMonth) { // Só adicionar se o vencimento for no mês atual
        const apuracaoMonthIndex = currentMonth < 2 ? (currentMonth + 10) : (currentMonth - 2);
        const apuracaoYear = currentMonth < 2 ? (currentYear - 1) : currentYear;
        const apuracaoMonth = monthNames[apuracaoMonthIndex];
        const apuracaoMonthAbbr = monthAbbr[apuracaoMonthIndex];
        reminders.push({
          day: efdContribDate.getDate(),
          month: monthAbbr[efdContribDate.getMonth()],
          year: efdContribDate.getFullYear(),
          title: `EFD-Contribuições - Apuração ${apuracaoMonthAbbr}/${apuracaoYear}`,
          description: `Escrituração Fiscal Digital das Contribuições incidentes sobre a Receita - Apuração: ${apuracaoMonth}/${apuracaoYear} | Vencimento: ${String(efdContribDate.getDate()).padStart(2, '0')}/${String(efdContribDate.getMonth() + 1).padStart(2, '0')}/${efdContribDate.getFullYear()} (10º dia útil do segundo mês subsequente)`
        });
      }
      
      // 3. EFD-Reinf: mesma regra do EFD-Contribuições
      if (efdContribDate.getMonth() === currentMonth) {
        const apuracaoMonthIndex = currentMonth < 2 ? (currentMonth + 10) : (currentMonth - 2);
        const apuracaoYear = currentMonth < 2 ? (currentYear - 1) : currentYear;
        const apuracaoMonth = monthNames[apuracaoMonthIndex];
        const apuracaoMonthAbbr = monthAbbr[apuracaoMonthIndex];
        reminders.push({
          day: efdContribDate.getDate(),
          month: monthAbbr[efdContribDate.getMonth()],
          year: efdContribDate.getFullYear(),
          title: `EFD-Reinf - Apuração ${apuracaoMonthAbbr}/${apuracaoYear}`,
          description: `Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais - Apuração: ${apuracaoMonth}/${apuracaoYear} | Vencimento: ${String(efdContribDate.getDate()).padStart(2, '0')}/${String(efdContribDate.getMonth() + 1).padStart(2, '0')}/${efdContribDate.getFullYear()} (10º dia útil do segundo mês subsequente)`
        });
      }
      
      // 4. Dirbi: 20º dia do mês atual (vencimento), referente à apuração de 2 meses atrás
      const dirbiVencimento = new Date(currentYear, currentMonth, 20);
      if (dirbiVencimento.getMonth() === currentMonth) {
        const apuracaoMonthIndex = currentMonth < 2 ? (currentMonth + 10) : (currentMonth - 2);
        const apuracaoYear = currentMonth < 2 ? (currentYear - 1) : currentYear;
        const apuracaoMonth = monthNames[apuracaoMonthIndex];
        const apuracaoMonthAbbr = monthAbbr[apuracaoMonthIndex];
        reminders.push({
          day: dirbiVencimento.getDate(),
          month: monthAbbr[dirbiVencimento.getMonth()],
          year: dirbiVencimento.getFullYear(),
          title: `Dirbi - Apuração ${apuracaoMonthAbbr}/${apuracaoYear}`,
          description: `Declaração de Incentivos, Renúncias, Benefícios e Imunidades de Natureza Tributária - Apuração: ${apuracaoMonth}/${apuracaoYear} | Vencimento: ${String(dirbiVencimento.getDate()).padStart(2, '0')}/${String(dirbiVencimento.getMonth() + 1).padStart(2, '0')}/${dirbiVencimento.getFullYear()} (até o 20º dia do segundo mês subsequente)`
        });
      }
      
      // 5. DCTFWeb: último dia útil do mês atual (vencimento), referente à apuração do mês anterior
      const dctfDate = getLastBusinessDayOfMonth(currentYear, currentMonth);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const apuracaoMonth = monthNames[prevMonth];
      const apuracaoMonthAbbr = monthAbbr[prevMonth];
      reminders.push({
        day: dctfDate.getDate(),
        month: monthAbbr[dctfDate.getMonth()],
        year: dctfDate.getFullYear(),
        title: `DCTFWeb - Apuração ${apuracaoMonthAbbr}/${prevYear}`,
        description: `Declaração de Débitos e Créditos Tributários Federais - Apuração: ${apuracaoMonth}/${prevYear} | Vencimento: ${String(dctfDate.getDate()).padStart(2, '0')}/${String(dctfDate.getMonth() + 1).padStart(2, '0')}/${dctfDate.getFullYear()} (último dia útil do mês subsequente)`
      });
      
      // Verificar se os lembretes realmente existem no DOM
      const expectedTitles = reminders.map(r => r.title);
      
      const existingTasks = document.querySelectorAll('.task-item');
      let foundCount = 0;
      existingTasks.forEach(task => {
        const taskTitle = task.querySelector('.task-title')?.textContent.trim();
        if (taskTitle && expectedTitles.includes(taskTitle)) {
          foundCount++;
        }
      });
      
      console.log(`🔍 [initializeAutoTaxReminders] Verificando lembretes para ${monthNames[currentMonth]}/${currentYear}:`, alreadyCreated ? 'marcado como criado' : 'não marcado', `| Encontrados no DOM: ${foundCount}/${expectedTitles.length}`);
      
      // Se já foram criados E existem no DOM, não recriar
      if (alreadyCreated && foundCount === expectedTitles.length && expectedTitles.length > 0) {
        console.log(`⏭️ [initializeAutoTaxReminders] Lembretes já existem. Pulando criação.`);
        return;
      }
      
      // Se foram marcados como criados mas não existem no DOM, limpar a marcação
      if (alreadyCreated && foundCount < expectedTitles.length) {
        console.log(`⚠️ [initializeAutoTaxReminders] Lembretes marcados como criados mas não encontrados no DOM. Recriando...`);
        localStorage.removeItem(remindersKey);
      }
      
      // Obter tasksListContainer se não estiver disponível no escopo
      const container = tasksListContainer || document.querySelector(".tasks-list");
      console.log(`📦 [initializeAutoTaxReminders] Container encontrado:`, container ? 'SIM' : 'NÃO');
      if (!container) {
        console.error('❌ [initializeAutoTaxReminders] tasksListContainer não encontrado!');
        return;
      }
      
      console.log(`📋 [initializeAutoTaxReminders] Criando ${reminders.length} lembretes...`);
      
      // Criar elementos de lembretes e adicionar ao DOM
      let createdCount = 0;
      reminders.forEach(reminder => {
        // Verificar se já existe um lembrete com o mesmo título e data
        const existingTasks = document.querySelectorAll('.task-item');
        let exists = false;
        existingTasks.forEach(task => {
          const taskDate = task.querySelector('.task-date')?.textContent.trim();
          const taskTitle = task.querySelector('.task-title')?.textContent.trim();
          const expectedDate = `${String(reminder.day).padStart(2, '0')} ${reminder.month} ${reminder.year}`;
          if (taskDate === expectedDate && taskTitle === reminder.title) {
            exists = true;
          }
        });
        
        if (!exists) {
          const taskItem = document.createElement("div");
          taskItem.classList.add("task-item", "reminder-task", "auto-reminder");
          const taskDate = `${String(reminder.day).padStart(2, '0')} ${reminder.month} ${reminder.year}`;
          taskItem.innerHTML = `
            <div class="task-icon"><i class='bx bx-calendar'></i></div>
            <div class="task-date">${taskDate}</div>
            <div class="task-content">
              <input type="checkbox" class="task-checkbox" aria-label="Marcar ${reminder.title} como concluído">
              <div class="task-info">
                <div class="task-title">${reminder.title}</div>
                <div class="task-description">${reminder.description}</div>
              </div>
            </div>
          `;
          
          // Adicionar evento ao checkbox
          const checkbox = taskItem.querySelector(".task-checkbox");
          checkbox.addEventListener("change", (e) => {
            const taskTitle = taskItem.querySelector(".task-title");
            if (e.target.checked) {
              taskTitle.classList.add("completed");
            } else {
              taskTitle.classList.remove("completed");
            }
            setTimeout(() => {
              if (typeof checkTodayTasks === 'function') {
                checkTodayTasks();
              }
            }, 100);
          });
          
          container.appendChild(taskItem);
          createdCount++;
          console.log(`✅ [initializeAutoTaxReminders] Lembrete criado: ${reminder.title} - ${reminder.day} ${reminder.month} ${reminder.year}`);
        }
      });
      
      // Marcar como criados apenas se foram criados lembretes
      if (createdCount > 0) {
        localStorage.setItem(remindersKey, 'true');
        console.log(`✅ [initializeAutoTaxReminders] ${createdCount} lembretes fiscais automáticos criados para ${apuracaoMonth}/${currentYear}`);
      } else {
        console.log(`⚠️ [initializeAutoTaxReminders] Nenhum lembrete foi criado (todos já existem?)`);
      }
      
      // Reordenar tarefas
      if (typeof sortTasksByDate === 'function') {
        sortTasksByDate();
      }
      if (typeof addTodayDivider === 'function') {
        addTodayDivider();
      }
      if (typeof checkTodayTasks === 'function') {
        checkTodayTasks();
      }
      generateCalendar(0, 0);
      generateCalendar(1, 1);
    }
    
    // ==================== FIM LEMBRETES AUTOMÁTICOS ====================

    // Gerar calendários iniciais

    generateCalendar(0, 0); // Mês atual no primeiro calendário

    generateCalendar(1, 1); // Próximo mês no segundo calendário
    
    // Inicializar lembretes automáticos (deve ser chamado após tasksListContainer estar definido)
    // Aguardar um pouco para garantir que tasksListContainer esteja disponível
    setTimeout(() => {
      if (tasksListContainer) {
        initializeAutoTaxReminders();
      } else {
        console.warn('⚠️ tasksListContainer não encontrado, tentando novamente...');
        setTimeout(() => {
          const container = document.querySelector(".tasks-list");
          if (container) {
            initializeAutoTaxReminders();
          }
        }, 500);
      }
    }, 200);

    

    

    // Verificar tarefas de hoje ao gerar calendários

    setTimeout(() => {

      if (typeof checkTodayTasks === 'function') {

        checkTodayTasks();

      }

    }, 1000); // Aumentado para 1000ms para aguardar carregamento dos vencimentos

    

    // Botões de navegação

    const prevButtons = document.querySelectorAll(".prev-month");

    const nextButtons = document.querySelectorAll(".next-month");

    

    prevButtons.forEach(btn => {

      btn.addEventListener("click", () => {

        // Adicionar animação

        calendarSections.forEach(section => section.classList.add("animating"));

        

        setTimeout(() => {

          currentMonth--;

          if (currentMonth < 0) {

            currentMonth = 11;

            currentYear--;

          }

          generateCalendar(0, 0);

          generateCalendar(1, 1);

          

          // Verificar se precisa carregar mais vencimentos (mês atual e próximo)

          const nextMonthIndex = (currentMonth + 1) % 12;

          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

          

          // Remover animação

          setTimeout(() => {

            calendarSections.forEach(section => section.classList.remove("animating"));

          }, 50);

        }, 150);

      });

    });

    

    nextButtons.forEach(btn => {

      btn.addEventListener("click", () => {

        // Adicionar animação

        calendarSections.forEach(section => section.classList.add("animating"));

        

        setTimeout(() => {

          currentMonth++;

          if (currentMonth > 11) {

            currentMonth = 0;

            currentYear++;

          }

          generateCalendar(0, 0);

          generateCalendar(1, 1);

          

          // Verificar se precisa carregar mais vencimentos (mês atual e próximo)

          const nextMonthIndex = (currentMonth + 1) % 12;

          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

          

          // Remover animação

          setTimeout(() => {

            calendarSections.forEach(section => section.classList.remove("animating"));

          }, 50);

        }, 150);

      });

    });



    // Função para destacar dia no calendário e filtrar tarefas

    function highlightCalendarDay(day, monthAbbr) {

      // Mapear abreviações de mês para números

      const monthMap = {

        "Jan": 0, "Fev": 1, "Mar": 2, "Abr": 3, "Mai": 4, "Jun": 5,

        "Jul": 6, "Ago": 7, "Set": 8, "Out": 9, "Nov": 10, "Dez": 11

      };

      

      const targetMonth = monthMap[monthAbbr];

      const targetDay = parseInt(day);

      

      if (targetMonth === undefined || isNaN(targetDay)) return;

      

      // Remover destaques anteriores

      document.querySelectorAll(".calendar-day.highlighted, .calendar-day.selected").forEach(d => {

        d.classList.remove("highlighted", "selected");

      });

      

      // Criar objeto Date para a data clicada (usar ano atual)

      const today = new Date();

      const targetYear = today.getFullYear();

      const clickedDate = new Date(targetYear, targetMonth, targetDay);

      

      // Filtrar tarefas por esta data específica

      filterTasksBySpecificDate(clickedDate);

      

      // Verificar se o mês está visível nos calendários atuais

      const firstCalendarMonth = currentMonth;

      const secondCalendarMonth = (currentMonth + 1) % 12;

      

      // Se o mês não está visível, navegar até ele

      if (targetMonth !== firstCalendarMonth && targetMonth !== secondCalendarMonth) {

        // Calcular diferença

        let diff = targetMonth - currentMonth;

        

        // Ajustar para mudança de ano

        if (diff < -6) diff += 12;

        if (diff > 6) diff -= 12;

        

        // Animar navegação

        calendarSections.forEach(section => section.classList.add("animating"));

        

        setTimeout(() => {

          currentMonth = targetMonth;

          generateCalendar(0, 0);

          generateCalendar(1, 1);

          

          setTimeout(() => {

            calendarSections.forEach(section => section.classList.remove("animating"));

            // Destacar o dia após a animação

            highlightDayInCalendar(targetDay, targetMonth);

          }, 50);

        }, 150);

      } else {

        // Mês já visível, apenas destacar

        highlightDayInCalendar(targetDay, targetMonth);

      }

    }

    

    // Função auxiliar para destacar o dia específico

    function highlightDayInCalendar(day, month) {

      calendarSections.forEach((section, index) => {

        const sectionMonth = (currentMonth + index) % 12;

        

        if (sectionMonth === month) {

          const days = section.querySelectorAll(".calendar-day:not(.other-month)");

          days.forEach(dayElement => {

            if (parseInt(dayElement.textContent) === day) {

              dayElement.classList.add("selected");

            }

          });

        }

      });

    }

    

    // Adicionar evento de clique nos lembretes e vencimentos existentes

    function addTaskClickEvents() {

      const allTasks = document.querySelectorAll(".task-item");

      

      allTasks.forEach(task => {

        task.addEventListener("click", (e) => {

          // Não ativar se clicou no checkbox

          if (e.target.type === "checkbox") return;

          

          const dateText = task.querySelector(".task-date").textContent;

          // Formato: "15 Jan 2025"

          const parts = dateText.split(" ");

          

          if (parts.length >= 2) {

            const day = parts[0];

            const month = parts[1];

            highlightCalendarDay(day, month);

          }

        });

      });

    }

    

    // Aplicar eventos aos lembretes e vencimentos existentes

    addTaskClickEvents();

    

    // Ordenar tarefas com hoje no topo

    sortTasksByDate();

    

    // Adicionar divisória para tarefas de hoje

    addTodayDivider();

    

    // Modificar a função de salvar lembrete para adicionar o evento

    const originalSaveHandler = saveTaskBtn;

    if (originalSaveHandler) {

      const saveClickHandler = originalSaveHandler.onclick || 

                                originalSaveHandler._listeners?.click?.[0];

      

      // Adicionar evento a novas tarefas criadas

      const originalAppendChild = tasksListContainer.appendChild;

      tasksListContainer.appendChild = function(newTask) {

        const result = originalAppendChild.call(this, newTask);

        

        // Se for um lembrete, adicionar evento de clique

        if (newTask.classList && newTask.classList.contains("reminder-task")) {

          newTask.addEventListener("click", (e) => {

            if (e.target.type === "checkbox") return;

            

            const dateText = newTask.querySelector(".task-date").textContent;

            const parts = dateText.split(" ");

            

            if (parts.length >= 2) {

              const day = parts[0];

              const month = parts[1];

              highlightCalendarDay(day, month);

            }

          });

        }

        

        return result;

      };

    }

    

    // Função para ordenar tarefas por data (hoje no topo)

    function sortTasksByDate() {

      const tasksList = document.querySelector(".tasks-list");

      if (!tasksList) return;

      

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      

      // Função para converter data de tarefa em objeto Date

      function parseTaskDate(dateString) {

        // Formato: "15 Jan 2025"

        const parts = dateString.trim().split(" ");

        if (parts.length < 3) return null;

        

        const day = parseInt(parts[0]);

        const monthIndex = monthNames.indexOf(parts[1]);

        const year = parseInt(parts[2]);

        

        if (isNaN(day) || monthIndex === -1 || isNaN(year)) return null;

        

        return new Date(year, monthIndex, day);

      }

      

      // Obter todas as tarefas

      const allTasks = Array.from(tasksList.querySelectorAll(".task-item"));

      

      // Separar tarefas de hoje das outras

      const todayTasks = [];

      const otherTasks = [];

      

      allTasks.forEach(task => {

        const taskDate = parseTaskDate(task.querySelector(".task-date").textContent);

        if (!taskDate) {

          otherTasks.push(task);

          return;

        }

        

        taskDate.setHours(0, 0, 0, 0);

        

        if (taskDate.getTime() === today.getTime()) {

          todayTasks.push(task);

        } else {

          otherTasks.push(task);

        }

      });

      

      // Ordenar cada grupo por data

      todayTasks.sort((a, b) => {

        const dateA = parseTaskDate(a.querySelector(".task-date").textContent);

        const dateB = parseTaskDate(b.querySelector(".task-date").textContent);

        if (!dateA || !dateB) return 0;

        return dateA - dateB;

      });

      

      otherTasks.sort((a, b) => {

        const dateA = parseTaskDate(a.querySelector(".task-date").textContent);

        const dateB = parseTaskDate(b.querySelector(".task-date").textContent);

        if (!dateA || !dateB) return 0;

        return dateA - dateB;

      });

      

      // Limpar lista

      tasksList.innerHTML = "";

      

      // Re-adicionar: primeiro tarefas de hoje, depois as outras

      todayTasks.forEach(task => {

        tasksList.appendChild(task);

      });

      

      otherTasks.forEach(task => {

        tasksList.appendChild(task);

      });

      

      console.log(`📋 Tarefas ordenadas: ${todayTasks.length} de hoje, ${otherTasks.length} futuras/passadas`);

    }

    

    // Função para adicionar divisórias de tarefas de hoje

    function addTodayDivider() {

      const tasksList = document.querySelector(".tasks-list");

      if (!tasksList) return;

      

      const today = new Date();

      const todayDay = today.getDate();

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const todayMonth = monthNames[today.getMonth()];

      const todayYear = today.getFullYear();

      const todayString = `${String(todayDay).padStart(2, '0')} ${todayMonth} ${todayYear}`;

      

      const allTasks = tasksList.querySelectorAll(".task-item");

      let firstTodayTask = null;

      let lastTodayTask = null;

      let todayTasksCount = 0;

      

      // Remover divisórias antigas se existirem

      const oldDividers = tasksList.querySelectorAll(".today-divider, .today-group-start, .today-group-end");

      oldDividers.forEach(divider => divider.remove());

      

      // Encontrar primeira e última tarefa de hoje

      allTasks.forEach(task => {

        const taskDate = task.querySelector(".task-date");

        if (taskDate && taskDate.textContent.trim() === todayString) {

          if (!firstTodayTask) {

            firstTodayTask = task;

          }

          lastTodayTask = task;

          todayTasksCount++;

        }

      });

      

      // Se encontrou tarefas de hoje, adicionar divisórias

      if (firstTodayTask && lastTodayTask && todayTasksCount > 0) {

        // Divisória de início (antes da primeira tarefa de hoje)

        const startDivider = document.createElement("div");

        startDivider.classList.add("today-group-start");

        startDivider.innerHTML = `

          <div class="today-group-start-text">📌 Hoje (${todayTasksCount})</div>

        `;

        tasksList.insertBefore(startDivider, firstTodayTask);

        

        // Divisória de fim (depois da última tarefa de hoje)

        const endDivider = document.createElement("div");

        endDivider.classList.add("today-group-end");

        

        // Inserir após a última tarefa de hoje

        if (lastTodayTask.nextSibling) {

          tasksList.insertBefore(endDivider, lastTodayTask.nextSibling);

        } else {

          tasksList.appendChild(endDivider);

        }

        

        console.log(`📌 Grupo de hoje criado: ${todayTasksCount} tarefa(s)`);

        

        // Scroll suave até o início do grupo

        setTimeout(() => {

          startDivider.scrollIntoView({ behavior: "smooth", block: "start" });

        }, 500);

      }

    }

    

    // ==================== SISTEMA DE FILTRO DE TAREFAS POR INTERVALO ====================

    

    const filterTaskBtn = document.getElementById("filterTaskBtn");

    const dateRangePicker = document.getElementById("dateRangePicker");

    const closeDatePicker = document.getElementById("closeDatePicker");

    const startCalendarGrid = document.getElementById("startCalendarGrid");

    const endCalendarGrid = document.getElementById("endCalendarGrid");

    const startMonthYear = document.getElementById("startMonthYear");

    const endMonthYear = document.getElementById("endMonthYear");

    const startDateDisplay = document.getElementById("startDateDisplay");

    const endDateDisplay = document.getElementById("endDateDisplay");

    const applyFilterBtn = document.getElementById("applyFilterBtn");

    const clearFilterBtn = document.getElementById("clearFilterBtn");

    

    let startDate = null;

    let endDate = null;

    let startCalendarMonth = new Date().getMonth();

    let startCalendarYear = new Date().getFullYear();

    let endCalendarMonth = new Date().getMonth();

    let endCalendarYear = new Date().getFullYear();

    

    const monthNamesLong = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 

                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    

    // Toggle do seletor de datas

    if (filterTaskBtn) {

      filterTaskBtn.addEventListener("click", (e) => {

        e.preventDefault();

        e.stopPropagation();

        dateRangePicker.classList.toggle("active");

        filterTaskBtn.classList.toggle("active");

        

        if (dateRangePicker.classList.contains("active")) {

          // Gerar calendários ao abrir

          generateMiniCalendar('start');

          generateMiniCalendar('end');

          console.log('📅 Seletor de intervalo de datas aberto');

        }

      });

    }

    

    // Impedir que cliques dentro do seletor o fechem

    if (dateRangePicker) {

      dateRangePicker.addEventListener('click', (e) => {

        e.stopPropagation();

      });

    }

    

    // Fechar seletor ao clicar no X

    if (closeDatePicker) {

      closeDatePicker.addEventListener("click", (e) => {

        e.preventDefault();

        e.stopPropagation();

        dateRangePicker.classList.remove("active");

        filterTaskBtn.classList.remove("active");

        console.log('❌ Seletor de datas fechado');

      });

    }

    

    // Fechar ao clicar fora (DESABILITADO - só fecha ao clicar no X ou Aplicar)

    // document.addEventListener("click", (e) => {

    //   if (dateRangePicker && !dateRangePicker.contains(e.target) && e.target !== filterTaskBtn) {

    //     dateRangePicker.classList.remove("active");

    //     if (filterTaskBtn) {

    //       filterTaskBtn.classList.remove("active");

    //     }

    //   }

    // });

    

    // Função para gerar mini calendário

    function generateMiniCalendar(type) {

      const grid = type === 'start' ? startCalendarGrid : endCalendarGrid;

      const month = type === 'start' ? startCalendarMonth : endCalendarMonth;

      const year = type === 'start' ? startCalendarYear : endCalendarYear;

      const monthYearDisplay = type === 'start' ? startMonthYear : endMonthYear;

      

      // Atualizar título

      monthYearDisplay.textContent = `${monthNamesLong[month]} ${year}`;

      

      // Limpar grid (manter headers)

      const headers = grid.querySelectorAll('.mini-day-header');

      grid.innerHTML = '';

      headers.forEach(header => grid.appendChild(header));

      

      // Calcular dias

      const firstDay = new Date(year, month, 1).getDay();

      const lastDate = new Date(year, month + 1, 0).getDate();

      const prevLastDate = new Date(year, month, 0).getDate();

      const today = new Date();

      

      // Dias do mês anterior

      for (let i = firstDay - 1; i >= 0; i--) {

        const day = document.createElement('div');

        day.classList.add('mini-calendar-day', 'other-month');

        day.textContent = prevLastDate - i;

        grid.appendChild(day);

      }

      

      // Dias do mês atual

      for (let i = 1; i <= lastDate; i++) {

        const day = document.createElement('div');

        day.classList.add('mini-calendar-day');

        day.textContent = i;

        

        const currentDate = new Date(year, month, i);

        

        // Marcar dia de hoje

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {

          day.classList.add('today');

        }

        

        // Marcar dias selecionados

        if (startDate && currentDate.getTime() === startDate.getTime()) {

          day.classList.add('selected');

        }

        if (endDate && currentDate.getTime() === endDate.getTime()) {

          day.classList.add('selected');

        }

        

        // Marcar dias no intervalo

        if (startDate && endDate && currentDate > startDate && currentDate < endDate) {

          day.classList.add('in-range');

        }

        

        // Desabilitar datas inválidas

        if (type === 'end' && startDate && currentDate < startDate) {

          day.classList.add('disabled');

        }

        

        // Evento de clique

        day.addEventListener('click', (e) => {

          e.stopPropagation();

          if (day.classList.contains('disabled')) {

            // showToast('⚠️ Data final não pode ser anterior à data inicial', 'error');

            return;

          }

          if (!day.classList.contains('other-month')) {

            selectDate(type, currentDate);

          }

        });

        

        grid.appendChild(day);

      }

      

      // Completar grid com dias do próximo mês

      const totalCells = grid.children.length - 7;

      const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

      for (let i = 1; i <= remainingCells; i++) {

        const day = document.createElement('div');

        day.classList.add('mini-calendar-day', 'other-month');

        day.textContent = i;

        grid.appendChild(day);

      }

    }

    

    // Função para selecionar data

    function selectDate(type, date) {

      if (type === 'start') {

        startDate = date;

        // Se data inicial for maior que final, limpar data final

        if (endDate && startDate > endDate) {

          endDate = null;

          endDateDisplay.textContent = 'Selecione';

          // showToast('Data final foi limpa pois é anterior à nova data inicial', 'info');

        }

        startDateDisplay.textContent = formatDateDisplay(date);

        console.log(`📅 Data inicial selecionada: ${formatDateDisplay(date)}`);

        

        // if (!endDate) {

        //   showToast('Agora selecione a data final', 'info');

        // }

      } else {

        // Só permitir selecionar data final se houver data inicial

        if (!startDate) {

          // showToast('⚠️ Selecione primeiro a data inicial', 'error');

          console.warn('⚠️ Selecione primeiro a data inicial');

          return;

        }

        endDate = date;

        endDateDisplay.textContent = formatDateDisplay(date);

        console.log(`📅 Data final selecionada: ${formatDateDisplay(date)}`);

      }

      

      // Atualizar ambos os calendários para refletir seleção

      generateMiniCalendar('start');

      generateMiniCalendar('end');

      

      // Habilitar botão de aplicar se ambas as datas estiverem selecionadas

      if (applyFilterBtn) {

        const bothSelected = startDate && endDate;

        applyFilterBtn.disabled = !bothSelected;

        

        if (bothSelected) {

          applyFilterBtn.style.opacity = '1';

          applyFilterBtn.style.cursor = 'pointer';

        } else {

          applyFilterBtn.style.opacity = '0.5';

          applyFilterBtn.style.cursor = 'not-allowed';

        }

      }

    }

    

    // Função para formatar data para exibição

    function formatDateDisplay(date) {

      const day = String(date.getDate()).padStart(2, '0');

      const month = String(date.getMonth() + 1).padStart(2, '0');

      const year = date.getFullYear();

      return `${day}/${month}/${year}`;

    }

    

    // Navegação dos mini calendários

    const miniPrevButtons = document.querySelectorAll('.mini-prev-month');

    const miniNextButtons = document.querySelectorAll('.mini-next-month');

    

    miniPrevButtons.forEach(btn => {

      btn.addEventListener('click', (e) => {

        e.preventDefault();

        e.stopPropagation();

        const calendarType = btn.getAttribute('data-calendar');

        

        if (calendarType === 'start') {

          startCalendarMonth--;

          if (startCalendarMonth < 0) {

            startCalendarMonth = 11;

            startCalendarYear--;

          }

          generateMiniCalendar('start');

        } else {

          endCalendarMonth--;

          if (endCalendarMonth < 0) {

            endCalendarMonth = 11;

            endCalendarYear--;

          }

          generateMiniCalendar('end');

        }

      });

    });

    

    miniNextButtons.forEach(btn => {

      btn.addEventListener('click', (e) => {

        e.preventDefault();

        e.stopPropagation();

        const calendarType = btn.getAttribute('data-calendar');

        

        if (calendarType === 'start') {

          startCalendarMonth++;

          if (startCalendarMonth > 11) {

            startCalendarMonth = 0;

            startCalendarYear++;

          }

          generateMiniCalendar('start');

        } else {

          endCalendarMonth++;

          if (endCalendarMonth > 11) {

            endCalendarMonth = 0;

            endCalendarYear++;

          }

          generateMiniCalendar('end');

        }

      });

    });

    

    // Função para parse de data da task

    function parseTaskDate(dateString) {

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const parts = dateString.trim().split(" ");

      

      if (parts.length < 3) return null;

      

      const day = parseInt(parts[0]);

      const monthIndex = monthNames.indexOf(parts[1]);

      const year = parseInt(parts[2]);

      

      if (isNaN(day) || monthIndex === -1 || isNaN(year)) return null;

      

      return new Date(year, monthIndex, day);

    }

    

    // Função para filtrar tarefas por data específica

    function filterTasksBySpecificDate(date) {

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      let visibleCount = 0;

      

      // Normalizar data

      const targetDate = new Date(date);

      targetDate.setHours(0, 0, 0, 0);

      

      allTasks.forEach(task => {

        const taskDateElement = task.querySelector(".task-date");

        if (!taskDateElement) {

          task.classList.add("hidden-by-filter");

          return;

        }

        

        const taskDate = parseTaskDate(taskDateElement.textContent);

        if (!taskDate) {

          task.classList.add("hidden-by-filter");

          return;

        }

        

        taskDate.setHours(0, 0, 0, 0);

        

        // Verificar se a data da tarefa é igual à data clicada

        const shouldShow = taskDate.getTime() === targetDate.getTime();

        

        if (shouldShow) {

          task.classList.remove("hidden-by-filter");

          visibleCount++;

        } else {

          task.classList.add("hidden-by-filter");

        }

      });

      

      // Remover seleção anterior de dias

      document.querySelectorAll(".calendar-day.selected").forEach(d => {

        d.classList.remove("selected");

      });

      

      // Marcar dia clicado como selecionado

      const allCalendarDays = document.querySelectorAll(".calendar-day");

      allCalendarDays.forEach(dayElement => {

        const dayText = parseInt(dayElement.textContent);

        if (!isNaN(dayText) && !dayElement.classList.contains('other-month')) {

          const parent = dayElement.closest('.calendar-month-section');

          if (parent) {

            const monthTitle = parent.querySelector('.calendar-title').textContent;

            const [monthName, yearText] = monthTitle.split(' ');

            const monthIndex = monthNames.indexOf(monthName);

            const yearNum = parseInt(yearText);

            

            if (dayText === date.getDate() && monthIndex === date.getMonth() && yearNum === date.getFullYear()) {

              dayElement.classList.add('selected');

            }

          }

        }

      });

      

      // Ocultar divisórias de hoje quando filtrar

      const todayDividers = document.querySelectorAll(".today-divider, .today-group-start, .today-group-end");

      todayDividers.forEach(divider => {

        divider.style.display = 'none';

      });

      

      console.log(`📅 Filtrando tarefas do dia: ${formatDateDisplay(date)}`);

      console.log(`   ${visibleCount} tarefa(s) encontrada(s)`);

      

      // Atualizar contador no badge e mostrar apenas quando filtro ativo

      const countBadge = document.getElementById('tasksCountBadge');

      if (countBadge) {

        countBadge.textContent = visibleCount;

        countBadge.classList.add('visible', 'updated');

        setTimeout(() => {

          countBadge.classList.remove('updated');

        }, 500);

      }

      

      // Feedback removido - apenas logs

      const dateFormatted = formatDateDisplay(date);

      // Log para debug

      // console.log(`${visibleCount} tarefa(s) encontrada(s) em ${dateFormatted}`);

      

      // Adicionar indicador visual no botão e na lista

      if (filterTaskBtn) {

        filterTaskBtn.classList.add('has-filter');

      }

      

      const tasksList = document.querySelector(".tasks-list");

      if (tasksList) {

        tasksList.classList.add('has-filter');

      }

      

      // Rolar para a primeira tarefa visível

      const firstVisibleTask = document.querySelector(".task-item:not(.hidden-by-filter)");

      if (firstVisibleTask) {

        firstVisibleTask.scrollIntoView({ behavior: "smooth", block: "center" });

      }

    }

    

    // Função para filtrar tarefas por intervalo de datas

    function filterTasksByDateRange() {

      if (!startDate || !endDate) {

        // showToast('Selecione as duas datas primeiro', 'error');

        return;

      }

      

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      let visibleCount = 0;

      

      // Normalizar horários para comparação apenas de datas

      const filterStart = new Date(startDate);

      filterStart.setHours(0, 0, 0, 0);

      

      const filterEnd = new Date(endDate);

      filterEnd.setHours(23, 59, 59, 999);

      

      allTasks.forEach(task => {

        const taskDateElement = task.querySelector(".task-date");

        if (!taskDateElement) {

          task.classList.add("hidden-by-filter");

          return;

        }

        

        const taskDate = parseTaskDate(taskDateElement.textContent);

        if (!taskDate) {

          task.classList.add("hidden-by-filter");

          return;

        }

        

        taskDate.setHours(0, 0, 0, 0);

        

        // Verificar se a data da tarefa está no intervalo

        const shouldShow = taskDate >= filterStart && taskDate <= filterEnd;

        

        if (shouldShow) {

          task.classList.remove("hidden-by-filter");

          visibleCount++;

        } else {

          task.classList.add("hidden-by-filter");

        }

      });

      

      // Ocultar divisórias de hoje quando filtrar

      const todayDividers = document.querySelectorAll(".today-divider, .today-group-start, .today-group-end");

      todayDividers.forEach(divider => {

        divider.style.display = 'none';

      });

      

      console.log(`🔍 Filtro de intervalo aplicado: ${visibleCount} tarefa(s) visível(is)`);

      console.log(`   Período: ${formatDateDisplay(startDate)} → ${formatDateDisplay(endDate)}`);

      

      // Atualizar contador no badge e mostrar apenas quando filtro ativo

      const countBadge = document.getElementById('tasksCountBadge');

      if (countBadge) {

        countBadge.textContent = visibleCount;

        countBadge.classList.add('visible', 'updated');

        setTimeout(() => {

          countBadge.classList.remove('updated');

        }, 500);

      }

      

      // Feedback removido - apenas atualização visual

      // if (visibleCount === 0) {

      //   showToast(`Nenhuma tarefa no período selecionado`, "info");

      // } else {

      //   showToast(`${visibleCount} tarefa(s) encontrada(s) no período`, "success");

      // }

      

      // Adicionar indicador visual no botão e na lista

      if (filterTaskBtn) {

        filterTaskBtn.classList.add('has-filter');

      }

      

      const tasksList = document.querySelector(".tasks-list");

      if (tasksList) {

        tasksList.classList.add('has-filter');

      }

      

      // NÃO FECHAR o seletor aqui - mantê-lo aberto para o usuário ver resultado

      // O usuário pode fechar manualmente ou fazer novo filtro

      console.log('✅ Filtro aplicado com sucesso!');

    }

    

    // Botão aplicar filtro

    if (applyFilterBtn) {

      applyFilterBtn.addEventListener('click', (e) => {

        e.stopPropagation();

        filterTasksByDateRange();

        

        // Fechar seletor após aplicar filtro

        setTimeout(() => {

          dateRangePicker.classList.remove("active");

          filterTaskBtn.classList.remove("active");

        }, 300);

      });

    }

    

    // Botão limpar filtro

    if (clearFilterBtn) {

      clearFilterBtn.addEventListener('click', (e) => {

        e.stopPropagation();

        

        // Limpar datas selecionadas do seletor de intervalo

        startDate = null;

        endDate = null;

        if (startDateDisplay) startDateDisplay.textContent = 'Selecione';

        if (endDateDisplay) endDateDisplay.textContent = 'Selecione';

        

        // Usar função centralizada para limpar filtros

        clearAllFilters();

        

        // Regenerar calendários

        generateMiniCalendar('start');

        generateMiniCalendar('end');

        

        // Desabilitar botão aplicar

        if (applyFilterBtn) {

          applyFilterBtn.disabled = true;

          applyFilterBtn.style.opacity = '0.5';

          applyFilterBtn.style.cursor = 'not-allowed';

        }

      });

    }

    

    // Inicializar contador de tarefas ao carregar

    function updateTasksCount() {

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      const visibleTasks = document.querySelectorAll(".task-item:not(.today-divider):not(.hidden-by-filter)");

      

      const countBadge = document.getElementById('tasksCountBadge');

      if (countBadge) {

        countBadge.textContent = visibleTasks.length;

        // Badge só aparece quando há filtro ativo, não ao carregar

      }

      

      return visibleTasks.length;

    }

    

    // Função para verificar se há tarefas para hoje

    function checkTodayTasks() {

      const today = new Date();

      const todayDay = today.getDate();

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      const todayMonth = monthNames[today.getMonth()];

      const todayYear = today.getFullYear();

      const todayString = `${String(todayDay).padStart(2, '0')} ${todayMonth} ${todayYear}`;

      

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      let hasTodayTasks = false;

      

      allTasks.forEach(task => {

        const taskDate = task.querySelector(".task-date");

        if (taskDate && taskDate.textContent.trim() === todayString) {

          hasTodayTasks = true;

        }

      });

      

      // Atualizar badge no botão Tax Agenda

      const taxAgendaBtn = document.querySelector('.sidebar button[data-section="tax-agenda"]');

      if (taxAgendaBtn) {

        if (hasTodayTasks) {

          taxAgendaBtn.classList.add('has-today-tasks');

          console.log('🔴 Badge ativado: Há tarefas para hoje!');

        } else {

          taxAgendaBtn.classList.remove('has-today-tasks');

        }

      }

      

      return hasTodayTasks;

    }

    

    // Inicializar sem mostrar badge ao carregar

    setTimeout(() => {

      updateTasksCount();

      // Badge fica oculto até aplicar um filtro

      const countBadge = document.getElementById('tasksCountBadge');

      if (countBadge) {

        countBadge.classList.remove('visible');

      }

      

      // Verificar tarefas de hoje e ativar badge se necessário

      checkTodayTasks();

    }, 500);

    

    // Função para remover todos os filtros

    function clearAllFilters() {

      // Mostrar todas as tarefas

      const allTasks = document.querySelectorAll(".task-item:not(.today-divider)");

      allTasks.forEach(task => {

        task.classList.remove("hidden-by-filter");

      });

      

      // Recriar divisórias de hoje após limpar filtros

      addTodayDivider();

      

      // Remover seleção de dias

      document.querySelectorAll(".calendar-day.selected, .calendar-day.highlighted").forEach(d => {

        d.classList.remove("selected", "highlighted");

      });

      

      // Remover indicador visual do botão

      if (filterTaskBtn) {

        filterTaskBtn.classList.remove('has-filter');

      }

      

      // Remover indicador visual da lista

      const tasksList = document.querySelector(".tasks-list");

      if (tasksList) {

        tasksList.classList.remove('has-filter');

      }

      

      // Ocultar badge de contagem

      const countBadge = document.getElementById('tasksCountBadge');

      if (countBadge) {

        countBadge.classList.remove('visible');

      }

      

      console.log('🔄 Filtro removido - Todas as tarefas visíveis');

    }

    

    // Evento para desfazer filtro ao clicar na área vazia da lista

    const tasksListForClick = document.querySelector(".tasks-list");

    if (tasksListForClick) {

      tasksListForClick.addEventListener('click', (e) => {

        // Verificar se clicou na área vazia (não em uma task)

        if (e.target === tasksListForClick || e.target.classList.contains('tasks-list')) {

          // Verificar se há filtro ativo

          const hasHiddenTasks = document.querySelector(".task-item.hidden-by-filter");

          if (hasHiddenTasks || filterTaskBtn?.classList.contains('has-filter')) {

            clearAllFilters();

            // showToast('✨ Filtro removido - Exibindo todas as tarefas', 'success');

          }

        }

      });

    }

    

    // ==================== FIM SISTEMA DE FILTRO ====================

    

    // ==================== SISTEMA DE SUPORTE ====================

    // Variáveis já declaradas no início do DOMContentLoaded (linha 2138-2141)
    // supportContactsSection, currentSupportChatId, selectedEmployeeId, isSwitchingEmployee

    // Gerenciar intervalos para limpeza adequada (evitar memory leaks)
    const activeIntervals = new Set();
    
    // Função auxiliar para criar intervalos gerenciados
    function createManagedInterval(callback, delay) {
      const intervalId = setInterval(callback, delay);
      activeIntervals.add(intervalId);
      return intervalId;
    }
    
    // Função para limpar todos os intervalos
    function cleanupIntervals() {
      activeIntervals.forEach(intervalId => {
        clearInterval(intervalId);
      });
      activeIntervals.clear();
    }
    
    // Limpar intervalos ao sair da página (já existe cleanupAll abaixo que limpa tudo)

    // Listener para sincronizar funcionários em tempo real quando criados no Suporte
    window.addEventListener('storage', (e) => {
      // Detectar mudanças nos funcionários do contribuinte
      if (e.key === 'contributorEmployees' || e.key === 'contributorEmployeesUpdatedAt') {
        // Verificar se há um chat de contribuinte ativo
        if (currentSupportChatId) {
          const chatData = supportChats[currentSupportChatId];
          if (chatData && chatData.contributorId) {
            // Atualizar a lista de funcionários
            renderEmployeesList(chatData.contributorId);
          }
        }
      }
    });

    // Também verificar mudanças no mesmo contexto (quando a mudança é feita na mesma aba)
    // Isso é necessário porque o evento 'storage' só dispara em outras abas/janelas
    let lastEmployeesUpdateTime = localStorage.getItem('contributorEmployeesUpdatedAt');
    createManagedInterval(() => {
      const currentUpdateTime = localStorage.getItem('contributorEmployeesUpdatedAt');
      if (currentUpdateTime && currentUpdateTime !== lastEmployeesUpdateTime) {
        lastEmployeesUpdateTime = currentUpdateTime;
        // Verificar se há um chat de contribuinte ativo
        if (currentSupportChatId) {
          const chatData = supportChats[currentSupportChatId];
          if (chatData && chatData.contributorId) {
            // Atualizar a lista de funcionários
            renderEmployeesList(chatData.contributorId);
          }
        }
      }
    }, 1000); // Verificar a cada 1 segundo

    // Função para gerar cor baseada no nome

    function getColorFromName(name) {
      // Validar e normalizar nome: converter para string, validar e usar fallback se necessário
      let safeName = '?';
      
      try {
        if (name != null && name !== undefined) {
          const nameStr = String(name);
          const trimmed = nameStr.trim();
          if (trimmed !== '') {
            safeName = trimmed;
          }
        }
      } catch (error) {
        console.warn('Erro ao validar nome em getColorFromName:', error);
        safeName = '?';
      }

      const colors = [

        '#ef4444', // vermelho

        '#f59e0b', // laranja

        '#10b981', // verde

        '#3b82f6', // azul

        '#8b5cf6', // roxo

        '#ec4899', // pink

        '#14b8a6', // teal

        '#f97316', // orange

        '#06b6d4', // cyan

        '#a855f7', // purple

        '#84cc16', // lime

        '#f43f5e'  // rose

      ];

      

      // Gerar hash simples do nome

      let hash = 0;

      try {
        for (let i = 0; i < safeName.length; i++) {

          hash = safeName.charCodeAt(i) + ((hash << 5) - hash);

        }
      } catch (error) {
        console.warn('Erro ao gerar hash em getColorFromName:', error);
        hash = 0;
      }

      

      const index = Math.abs(hash) % colors.length;

      return colors[index];

    }

    

    // Função para criar avatar com inicial

    function createAvatarElement(name, size = 40) {
      // Validar e normalizar nome: converter para string, validar e usar fallback se necessário
      let safeName = '?';
      let initial = '?';
      
      try {
        if (name != null && name !== undefined) {
          const nameStr = String(name);
          const trimmed = nameStr.trim();
          if (trimmed !== '' && trimmed.length > 0) {
            safeName = trimmed;
            // Pegar a primeira letra não-espaço
            // match() retorna um array, então precisamos acessar o primeiro elemento [0]
            const firstCharMatch = trimmed.match(/\S/);
            if (firstCharMatch && firstCharMatch[0]) {
              initial = firstCharMatch[0].toUpperCase();
            } else {
              initial = '?';
            }
          }
        }
      } catch (error) {
        console.warn('Erro ao validar nome em createAvatarElement:', error);
        safeName = '?';
        initial = '?';
      }
      
      const color = getColorFromName(safeName);

      const avatar = document.createElement("div");
      avatar.classList.add("avatar-initial");

      // Aplicar estilos inline APENAS para cores (background-color)
      // CRITICAL: NÃO aplicar estilos inline de tamanho, display, ou layout para avatares padrão
      // O CSS já define TUDO com !important para evitar conflitos
      // Aplicar apenas background-color e textContent, deixar o CSS controlar TUDO o resto
      avatar.style.backgroundColor = color;
      avatar.textContent = initial || '?';
      
      // CRITICAL: Para avatares padrão (40px e 56px), NÃO aplicar NENHUM estilo inline
      // exceto background-color e textContent
      // Isso permite que o CSS controle completamente os tamanhos, display e layout
      // Apenas aplicar tamanhos customizados para tamanhos diferentes dos padrões
      if (size !== 40 && size !== 56) {
        // Apenas aplicar tamanho customizado se não for o padrão
        avatar.style.width = `${size}px`;
        avatar.style.height = `${size}px`;
        // Calcular fontSize proporcional ao tamanho
        const fontSize = Math.floor(size * 0.45);
        avatar.style.fontSize = `${fontSize}px`;
      }
      // Para tamanhos padrão (40px e 56px), NÃO aplicar NADA - deixar o CSS controlar completamente
      
      // Border radius já é definido pelo CSS (8px para avatares padrão)
      // Apenas aplicar border-radius circular para avatares grandes (profile > 56px)
      if (size > 56) {
        avatar.style.borderRadius = '50%';
      }
      
      // NÃO aplicar estilos inline de display, layout, ou visibilidade
      // O CSS já controla isso com !important

      

      return avatar;

    }

    

    // Função para verificar se cliente está online (últimos 5 minutos)

    function isClientOnline(chatId) {

      const lastActivity = localStorage.getItem(`clientActivity_${chatId}`);

      if (!lastActivity) return false;

      

      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

      return parseInt(lastActivity) > fiveMinutesAgo;

    }
    
    function parseTimestampValue(value) {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
      }
      if (typeof value === "string") {
        const numeric = Number(value);
        if (!Number.isNaN(numeric) && numeric > 0) {
          return numeric;
        }
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      return null;
    }
    
    function getMessageTimestamp(message) {
      if (!message || typeof message !== "object") {
        return null;
      }
    
      const candidates = [
        message.timestamp,
        message.sentAt,
        message.createdAt,
        message.updatedAt
      ];
    
      for (const candidate of candidates) {
        const parsed = parseTimestampValue(candidate);
        if (parsed) {
          return parsed;
        }
      }
    
      return null;
    }
    
    // Variável para incremento de timestamp (declarada antes de assignComputedTimestamp)
    let computedTimestampIncrement = 0;
    
    function assignComputedTimestamp(message) {
      if (!message || typeof message !== "object") {
        return 0;
      }
    
      if (typeof message._computedTimestamp === "number") {
        return message._computedTimestamp;
      }
    
      if (computedTimestampIncrement > 1000000) {
        computedTimestampIncrement = 0;
      }
      computedTimestampIncrement += 1;
    
      const computed = Date.now() + computedTimestampIncrement;
      Object.defineProperty(message, "_computedTimestamp", {
        value: computed,
        writable: true,
        configurable: true,
        enumerable: false
      });
      return computed;
    }
    
    function getMessageTimestampValue(message) {
      const parsed = getMessageTimestamp(message);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
      return assignComputedTimestamp(message);
    }
    

    // Função para obter chats de suporte do localStorage e Firebase (se disponível)

    async function getSupportChats() {
      // Resetar incremento ao iniciar
      computedTimestampIncrement = 0;

      // Obter setor do usuário logado

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      const userSector = currentUser.sector || "";

      

      // Carregar mensagens do localStorage

      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");

      

      // Carregar mensagens do Firebase (se disponível)
      // Firebase removido - usar apenas localStorage
      // Mensagens já foram carregadas do localStorage acima

      

      const chats = {};

      messages.forEach(msg => {
        // Determinar o chatId correto para a mensagem
        let targetChatId = msg.chatId;
        
        // Determinar o chatId correto baseado no tipo de mensagem
        if (msg.contributorId) {
          // Mensagem de funcionário (tem employeeId E senderRole === "employee")
          if (msg.type === "client" && msg.employeeId && msg.senderRole === "employee") {
            // Mensagem de funcionário vai para o chat do funcionário
            targetChatId = getEmployeeChatId(msg.contributorId, msg.employeeId);
          } 
          // Mensagem de suporte direcionada a funcionário (tem targetEmployeeId)
          else if (msg.type === "support" && msg.targetEmployeeId) {
            // Mensagem de suporte direcionada a funcionário vai para o chat do funcionário
            targetChatId = getEmployeeChatId(msg.contributorId, msg.targetEmployeeId);
          } 
          // Mensagem do administrador (NÃO tem employeeId E NÃO tem senderRole "employee")
          // Tratar mensagens antigas que podem não ter senderRole (considerar como admin)
          else {
            const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
            const isEmployee = msg.senderRole === "employee";
            // Se não tem employeeId E não é funcionário (ou senderRole é undefined/null), é admin
            if (!hasEmployeeId && !isEmployee) {
              // Mensagem do administrador vai para o chat do administrador
              targetChatId = msg.chatId || `chat_contributor_${msg.contributorId}`;
            } else {
              // Se não se encaixa em nenhuma categoria, usar chatId original ou criar chat do administrador
              targetChatId = msg.chatId || `chat_contributor_${msg.contributorId}`;
            }
          }
        }
        
        // Determinar se é chat de funcionário e extrair employeeId
        const isEmployeeChat = isEmployeeChatId(targetChatId);
        const contributorId = msg.contributorId || getContributorIdFromChatId(targetChatId);
        const employeeId = isEmployeeChat ? getEmployeeIdFromChatId(targetChatId) : null;
        
        // Filtrar mensagens por setor, mas manter o chat ativo
        if (msg.sector) {
          if (msg.sector !== userSector && !chats[targetChatId]) {
            return; // Pular mensagens de outros setores apenas se ainda não há contexto do chat
          }
        } else if (!chats[targetChatId]) {
          // Mensagens sem setor são consideradas apenas se o chat já está mapeado
          // Mas vamos criar o chat mesmo assim se for necessário
        }

        // Criar chat se não existir
        if (!chats[targetChatId]) {
          // Obter nome do contribuinte/funcionário
          let clientName = msg.clientName || "Contribuinte";
          if (contributorId) {
            const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
            const contributor = contributors.find(c => c.id === contributorId);
            if (contributor) {
              clientName = contributor.razaoSocial || clientName;
            }
          }
          
          chats[targetChatId] = {
            chatId: targetChatId,
            clientName: clientName,
            sector: msg.sector || "",
            messages: [],
            lastMessage: null,
            lastMessageTimestamp: -Infinity,
            unreadCount: 0,
            isOnline: false,
            contributorId: contributorId || null,
            employeeId: employeeId || null,
            isContactOnly: !isEmployeeChat && !!contributorId, // Contatos são apenas chats do administrador
            isEmployeeChat: isEmployeeChat || false,
            lastClientSender: null
          };
        }

        // Adicionar mensagem ao chat correto
        const effectiveTimestamp = getMessageTimestampValue(msg);
        msg._computedTimestamp = effectiveTimestamp;
        
        // Atualizar chatId da mensagem para o chat correto
        msg.chatId = targetChatId;
        
        chats[targetChatId].messages.push(msg);

        if (!chats[targetChatId].contributorId && msg.contributorId) {
          chats[targetChatId].contributorId = msg.contributorId;
        }
        
        // Atualizar employeeId se necessário (caso o chat já exista mas não tenha employeeId)
        if (employeeId && !chats[targetChatId].employeeId) {
          chats[targetChatId].employeeId = employeeId;
        }

        if (effectiveTimestamp >= (chats[targetChatId].lastMessageTimestamp ?? -Infinity)) {
          chats[targetChatId].lastMessage = msg;
          chats[targetChatId].lastMessageTimestamp = effectiveTimestamp;
        }

        if (msg.type === "client") {
          const roleFallback = msg.senderRole === "employee" ? "Funcionário" : "Administrador";
          const senderName =
            msg.senderName ||
            msg.sender ||
            msg.clientName ||
            chats[targetChatId].clientName ||
            roleFallback;
          const currentSenderTimestamp = chats[targetChatId].lastClientSender?.timestamp ?? -Infinity;
          if (effectiveTimestamp >= currentSenderTimestamp) {
            chats[targetChatId].lastClientSender = {
              name: senderName,
              role: msg.senderRole || null,
              timestamp: effectiveTimestamp
            };
          }
        }

        // Contar mensagens não lidas do cliente
        if (msg.type === "client" && !msg.read) {
          chats[targetChatId].unreadCount++;
        }
      });

      

      // Verificar status online de cada chat

      Object.keys(chats).forEach(chatId => {

        chats[chatId].isOnline = isClientOnline(chatId);

      });


      Object.values(chats).forEach(chat => {
        chat.messages = Array.isArray(chat.messages)
          ? chat.messages.sort((a, b) => getMessageTimestampValue(a) - getMessageTimestampValue(b))
          : [];

        if (!chat.lastMessage && chat.messages.length > 0) {
          chat.lastMessage = chat.messages[chat.messages.length - 1];
          chat.lastMessageTimestamp = getMessageTimestampValue(chat.lastMessage);
        }

        if (!chat.lastClientSender) {
          const latestClientMessage = [...chat.messages].reverse().find(message => message.type === "client");
          if (latestClientMessage) {
            const roleFallback =
              latestClientMessage.senderRole === "employee" ? "Funcionário" : "Administrador";
            const fallbackName =
              latestClientMessage.senderName ||
              latestClientMessage.sender ||
              latestClientMessage.clientName ||
              chat.clientName ||
              roleFallback;
            chat.lastClientSender = {
              name: fallbackName,
              role: latestClientMessage.senderRole || null,
              timestamp: getMessageTimestampValue(latestClientMessage)
            };
          }
        }
      });
      

      return chats;

    }

    

    // Função para criar elemento de contato de suporte

    function createSupportContactElement(chatData) {

      const contact = document.createElement("div");

      contact.classList.add("contact", "support-contact");

      contact.setAttribute("data-support-chat-id", chatData.chatId);

      

      // Adicionar classe 'online' se cliente estiver online

      if (chatData.isOnline) {

        contact.classList.add("online");

      }

      

      const orderedMessages = Array.isArray(chatData.messages)
        ? [...chatData.messages].sort((a, b) => getMessageTimestampValue(a) - getMessageTimestampValue(b))
        : [];

      chatData.messages = orderedMessages;

      let lastClientSender = chatData.lastClientSender || null;

      if (!lastClientSender && orderedMessages.length > 0) {
        const latestClientMessage = [...orderedMessages].reverse().find(msg => msg.type === "client");
        if (latestClientMessage) {
          const roleFallback =
            latestClientMessage.senderRole === "employee" ? "Funcionário" : "Administrador";

          const fallbackName =
            latestClientMessage.senderName ||
            latestClientMessage.sender ||
            latestClientMessage.clientName ||
            chatData.clientName ||
            roleFallback;

          lastClientSender = {
            name: fallbackName,
            role: latestClientMessage.senderRole || null,
            timestamp: getMessageTimestampValue(latestClientMessage)
          };
          chatData.lastClientSender = lastClientSender;
        }
      }

      const lastMsg = orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1] : null;
      chatData.lastMessage = lastMsg;
      chatData.lastMessageTimestamp = lastMsg ? getMessageTimestampValue(lastMsg) : -Infinity;

      function truncatePreview(text, maxLength = 90) {
        if (!text) return "Sem mensagens recentes";
        const sanitized = String(text).replace(/\s+/g, " ").trim();
        return sanitized.length > maxLength
          ? `${sanitized.slice(0, maxLength - 1)}…`
          : sanitized;
      }

      function formatContactTime(message) {
        if (!message) return "";

        const timestamp = getMessageTimestampValue(message);
        if (timestamp) {
          try {
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) {
              return message.time || "";
            }

            const now = new Date();
            const isSameDay = date.toDateString() === now.toDateString();

            if (isSameDay) {
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              return `${hours}:${minutes}`;
            }

            return getRelativeDate(timestamp);
          } catch (error) {
            console.warn("Não foi possível formatar a data do contato:", error);
          }
        }

        return message.time || "";
      }

      let previewText = "Sem mensagens recentes";

      if (lastMsg) {
        const contentText = lastMsg.text && String(lastMsg.text).trim() !== ""
          ? lastMsg.text
          : (lastMsg.file ? "[Arquivo enviado]" : "");

        if (lastMsg.type === "client") {
          const senderDisplay =
            lastMsg.senderName ||
            lastClientSender?.name ||
            chatData.clientName ||
            "Cliente";
          previewText = contentText ? `${senderDisplay}: ${contentText}` : senderDisplay;
        } else {
          const senderDisplay = lastMsg.senderName || lastMsg.sender || "Você";
          previewText = contentText ? `${senderDisplay}: ${contentText}` : senderDisplay;
        }
      }
      

      // Criar avatar com inicial
      const avatarName = chatData.clientName || chatData.lastClientSender?.name || "Contato";
      const avatar = createAvatarElement(avatarName, 40);

      

      // Criar estrutura do contato

      const contactInfo = document.createElement("div");

      contactInfo.classList.add("contact-info");

      

      const contactIconClass = chatData.contributorId ? "bx bx-building" : "bx bx-support";

      const headerRow = document.createElement("div");
      headerRow.classList.add("contact-info-header");

      const contactTitle = document.createElement("h4");
      contactTitle.classList.add("contact-name");
      contactTitle.textContent = chatData.clientName || "Contato";

      const supportIcon = document.createElement("i");
      supportIcon.className = `${contactIconClass} support-icon`;
      contactTitle.appendChild(supportIcon);

      const contactTime = document.createElement("span");
      contactTime.classList.add("contact-time");
      contactTime.textContent = formatContactTime(lastMsg);

      headerRow.appendChild(contactTitle);
      headerRow.appendChild(contactTime);

      const footerRow = document.createElement("div");
      footerRow.classList.add("contact-info-footer");

      const lastMessageEl = document.createElement("p");
      lastMessageEl.classList.add("contact-last-message");
      lastMessageEl.textContent = truncatePreview(previewText);
      footerRow.appendChild(lastMessageEl);

      // Contar mensagens não lidas do admin e dos funcionários separadamente
      if (chatData.contributorId) {
        const adminUnreadCount = getAdminUnreadCount(chatData.contributorId);
        const employeesUnreadCount = getEmployeesUnreadCount(chatData.contributorId);
        
        // Se há mensagens não lidas do admin: mostrar bolinha verde + número
        if (adminUnreadCount > 0) {
          const badge = document.createElement("span");
          badge.classList.add("unread-badge");
          badge.textContent = adminUnreadCount;
          footerRow.appendChild(badge);
          contact.classList.add("has-unread");
        }
        
        // Se há mensagens não lidas de funcionários (mesmo sem mensagens do admin): mostrar apenas bolinha verde
        if (employeesUnreadCount > 0 && adminUnreadCount === 0) {
          const greenDot = document.createElement("span");
          greenDot.classList.add("unread-dot");
          footerRow.appendChild(greenDot);
          contact.classList.add("has-unread");
        }
        
        // Se há mensagens não lidas de ambos: mostrar bolinha verde + número (do admin)
        if (employeesUnreadCount > 0 && adminUnreadCount > 0) {
          const badge = document.createElement("span");
          badge.classList.add("unread-badge");
          badge.textContent = adminUnreadCount;
          footerRow.appendChild(badge);
          contact.classList.add("has-unread");
        }
      } else {
        // Para contatos não contribuintes, manter comportamento original
        if (chatData.unreadCount > 0) {
          const badge = document.createElement("span");
          badge.classList.add("unread-badge");
          badge.textContent = chatData.unreadCount;
          footerRow.appendChild(badge);
          contact.classList.add("has-unread");
        }
      }

      contactInfo.appendChild(headerRow);
      contactInfo.appendChild(footerRow);

      contact.appendChild(avatar);
      contact.appendChild(contactInfo);

      if (chatData.contributorId) {
        contact.classList.add("contributor-contact");
      }

      

      // Evento de clique

      contact.addEventListener("click", () => {

        loadSupportChat(chatData.chatId);

      });

      

      return contact;

    }

    

    // Função para atualizar lista de contatos de suporte
    async function updateSupportContactsList() {
      // CRITICAL: Sempre atualizar lista de funcionários após atualizar lista de contatos
      // (replicando comportamento automático - será chamado no final da função)
      // Garantir que supportContactsSection está inicializado
      if (!supportContactsSection) {
        supportContactsSection = document.getElementById("supportContactsSection");
      }

      if (!supportContactsSection) {

        console.warn("supportContactsSection não encontrado");

        return;

      }

      // Primeiro, garantir que os contatos de contribuintes existam
      const contributorContactsData = getContributorContacts();
      const contributorRecords = typeof getContributorsFromStorage === "function"
        ? getContributorsFromStorage()
        : [];

      // Obter lista de IDs de contribuintes ativos
      const activeContributorIds = contributorRecords
        .filter(contributor => (contributor.status || "active") === "active")
        .map(contributor => contributor.id);

      let contactsChanged = false;

      // Remover contatos órfãos (contatos sem contribuinte correspondente)
      const validContacts = contributorContactsData.filter(contact => {
        if (!contact.contributorId) {
          return false; // Remover contatos sem contributorId
        }
        // Manter apenas contatos que têm um contribuinte ativo correspondente
        const hasContributor = activeContributorIds.includes(contact.contributorId);
        if (!hasContributor) {
          contactsChanged = true;
          return false; // Remover contato órfão
        }
        return true;
      });

      // Adicionar novos contatos para contribuintes que não têm contato ainda
      contributorRecords
        .filter(contributor => (contributor.status || "active") === "active")
        .forEach(contributor => {
          if (!validContacts.some(contact => contact.contributorId === contributor.id)) {
            // Usar o chatId do contribuinte se existir, senão criar um novo
            const chatId = contributor.chatId || `chat_contributor_${contributor.id}`;
            validContacts.push({
              contributorId: contributor.id,
              fullName: contributor.razaoSocial,
              cnpj: contributor.cnpj,
              chatId: chatId,
              status: "active",
              sector: "",
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            contactsChanged = true;
          }
        });

      // Primeiro, criar/atualizar os chats de contatos ANTES de chamar getSupportChats()
      // Isso garante que os contatos sem mensagens sejam preservados
      validContacts
        .filter(contact => contact.status === "active")
        .forEach(contact => {
          if (!contact.chatId) {
            contact.chatId = `chat_contributor_${contact.contributorId || generateUniqueId()}`;
            contactsChanged = true;
          }
        });

      // Salvar contatos atualizados antes de carregar chats
      if (contactsChanged) {
        setContributorContacts(validContacts);
      }

      // Agora carregar chats do Firebase/localStorage (que contém mensagens)
      const chatsWithMessages = await getSupportChats();

      // Inicializar supportChats com os chats que têm mensagens
      supportChats = { ...chatsWithMessages };

      // Agora, garantir que todos os contatos válidos tenham um chat, mesmo sem mensagens
      validContacts
        .filter(contact => contact.status === "active")
        .forEach(contact => {
          const existingChat = supportChats[contact.chatId];
          if (!existingChat) {
            // Criar chat para contato sem mensagens
            supportChats[contact.chatId] = {
              chatId: contact.chatId,
              clientName: contact.fullName || "Contribuinte",
              sector: contact.sector || "",
              messages: [],
              lastMessage: null,
              lastMessageTimestamp: -Infinity,
              unreadCount: 0,
              isOnline: false,
              isContactOnly: true,
              contributorId: contact.contributorId
            };
          } else {
            // Atualizar informações do chat existente
            existingChat.messages = existingChat.messages || [];
            existingChat.clientName = existingChat.clientName || contact.fullName || "Contribuinte";
            existingChat.contributorId = existingChat.contributorId || contact.contributorId;
            existingChat.isContactOnly = true; // Garantir que seja marcado como contato
            // Garantir que tenha lastMessageTimestamp
            if (!existingChat.lastMessageTimestamp && existingChat.lastMessage) {
              existingChat.lastMessageTimestamp = getMessageTimestampValue(existingChat.lastMessage);
            } else if (!existingChat.lastMessageTimestamp) {
              existingChat.lastMessageTimestamp = -Infinity;
            }
          }
        });

      // Remover chats órfãos do supportChats (apenas chats de contatos)
      const validChatIds = new Set(validContacts.map(contact => contact.chatId));
      Object.keys(supportChats).forEach(chatId => {
        const chat = supportChats[chatId];
        // Remover apenas chats que são marcados como "isContactOnly" (contatos de contribuintes)
        if (chat.isContactOnly) {
          // Se o chat tem um contribuinte mas não está na lista de ativos, remover
          if (chat.contributorId && !activeContributorIds.includes(chat.contributorId)) {
            console.log(`🗑️ Removendo chat órfão: ${chatId} (contribuinte ${chat.contributorId} não encontrado)`);
            delete supportChats[chatId];
          }
          // Se o chat não está na lista de contatos válidos, remover
          else if (!validChatIds.has(chatId)) {
            console.log(`🗑️ Removendo chat órfão: ${chatId} (não está na lista de contatos válidos)`);
            delete supportChats[chatId];
          }
        }
      });

      // CRITICAL: Preservar qual contato está ativo antes de limpar
      const activeContactBeforeUpdate = document.querySelector(".contact.support-contact.contributor-contact.active");
      const activeChatIdBeforeUpdate = activeContactBeforeUpdate ? activeContactBeforeUpdate.getAttribute("data-support-chat-id") : null;

      supportContactsSection.innerHTML = "";

      // Atualizar seletor de contatos quando a lista principal for atualizada
      if (typeof loadContactsSelector === 'function') {
        loadContactsSelector();
      }

      // Ordenar chats por lastMessageTimestamp (usando o timestamp diretamente, não a mensagem)
      const chatIds = Object.keys(supportChats).sort((a, b) => {
        const chatA = supportChats[a];
        const chatB = supportChats[b];
        // Usar lastMessageTimestamp se disponível, senão usar -Infinity
        const timeA = chatA.lastMessageTimestamp !== undefined 
          ? chatA.lastMessageTimestamp 
          : (chatA.lastMessage ? getMessageTimestampValue(chatA.lastMessage) : -Infinity);
        const timeB = chatB.lastMessageTimestamp !== undefined 
          ? chatB.lastMessageTimestamp 
          : (chatB.lastMessage ? getMessageTimestampValue(chatB.lastMessage) : -Infinity);
        return timeB - timeA;
      });

      

      if (chatIds.length > 0) {

        console.log(`📨 ${chatIds.length} chat(s) de suporte carregado(s)`);

      }

      

      // Filtrar apenas chats de contatos válidos (isContactOnly === true)
      // IMPORTANTE: Mostrar TODOS os contatos de contribuintes ativos, mesmo sem mensagens
      const validContactChatIds = chatIds.filter(chatId => {
        const chat = supportChats[chatId];
        // Mostrar apenas chats de contatos que têm um contribuinte válido
        if (chat.isContactOnly) {
          if (chat.contributorId) {
            // Verificar se o contribuinte ainda existe e está ativo
            const contributorExists = typeof getContributorsFromStorage === "function" &&
              getContributorsFromStorage().some(c => 
                c.id === chat.contributorId && (c.status || "active") === "active"
              );
            if (!contributorExists) {
              console.log(`⚠️ Chat ${chatId} tem contribuinte ${chat.contributorId} que não está mais ativo`);
            }
            return contributorExists;
          }
          console.log(`⚠️ Chat ${chatId} não tem contributorId`);
          return false; // Não mostrar contatos sem contribuinte
        }
        return false; // Não mostrar chats que não são contatos
      });

      // Garantir que todos os contatos válidos apareçam na lista, mesmo que não estejam em chatIds
      // (isso pode acontecer se o contato não tem mensagens e não foi incluído no resultado de getSupportChats)
      validContacts
        .filter(contact => contact.status === "active")
        .forEach(contact => {
          if (!validContactChatIds.includes(contact.chatId)) {
            // Adicionar o chatId à lista se ainda não estiver lá
            if (supportChats[contact.chatId]) {
              validContactChatIds.push(contact.chatId);
            }
          }
        });

      validContactChatIds.forEach(chatId => {

        const contactElement = createSupportContactElement(supportChats[chatId]);

        // CRITICAL: Reaplicar classe active se este era o contato ativo antes da atualização
        if (activeChatIdBeforeUpdate && chatId === activeChatIdBeforeUpdate) {
          contactElement.classList.add("active");
        }

        supportContactsSection.appendChild(contactElement);

      });

      // CRITICAL: Sempre atualizar lista de funcionários após atualizar lista de contatos
      // (replicando comportamento automático do contacts-list)
      updateActiveContributorEmployeesList();
      
      // Atualizar badges do sidebar
      updateSidebarBadges();

    }

    

    // Função para adicionar mensagem individual ao chat (sem recarregar tudo)

    function addSupportMessageToChat(msg) {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userName = currentUser.fullName || currentUser.username || "Usuário";

      const effectiveTimestamp = getMessageTimestampValue(msg);
      msg._computedTimestamp = effectiveTimestamp;

      // Determinar o chatId correto para a mensagem (mesma lógica de getSupportChats)
      let targetChatId = msg.chatId;
      
      // Se a mensagem é de um funcionário (tem employeeId), usar chat do funcionário
      if (msg.contributorId && msg.employeeId && msg.type === "client") {
        // Mensagem de funcionário vai para o chat do funcionário
        targetChatId = getEmployeeChatId(msg.contributorId, msg.employeeId);
      } else if (msg.contributorId && msg.targetEmployeeId && msg.type === "support") {
        // Mensagem de suporte direcionada a funcionário vai para o chat do funcionário
        targetChatId = getEmployeeChatId(msg.contributorId, msg.targetEmployeeId);
      } else if (msg.contributorId) {
        // Mensagem do administrador (NÃO tem employeeId E NÃO tem senderRole "employee")
        // Verificar se é mensagem do administrador
        const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
        const isEmployee = msg.senderRole === "employee";
        if (!hasEmployeeId && !isEmployee) {
          // Mensagem do administrador vai para o chat do administrador
          targetChatId = msg.chatId || `chat_contributor_${msg.contributorId}`;
        } else {
          // Se não se encaixa em nenhuma categoria, usar chatId original ou criar chat do administrador
          targetChatId = msg.chatId || `chat_contributor_${msg.contributorId}`;
        }
      }
      
      // Determinar se é chat de funcionário e extrair employeeId
      const isEmployeeChat = isEmployeeChatId(targetChatId);
      const contributorId = msg.contributorId || getContributorIdFromChatId(targetChatId);
      const employeeId = isEmployeeChat ? getEmployeeIdFromChatId(targetChatId) : null;
      
      // Atualizar chatId da mensagem para o chat correto
      msg.chatId = targetChatId;
      
      if (!supportChats[targetChatId]) {
        // Verificar se o contribuinte existe antes de criar o chat
        const contributorExists = contributorId && 
          typeof getContributorsFromStorage === "function" &&
          getContributorsFromStorage().some(c => 
            c.id === contributorId && (c.status || "active") === "active"
          );
        
        // Se não há contribuinte válido, não criar o chat (ignorar mensagem)
        if (contributorId && !contributorExists) {
          console.warn(`⚠️ Mensagem ignorada: contribuinte ${contributorId} não encontrado ou inativo`);
          return; // Ignorar mensagem de contribuinte inválido
        }
        
        // Obter nome do contribuinte
        let clientName = msg.clientName || "Contribuinte";
        if (contributorId) {
          const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
          const contributor = contributors.find(c => c.id === contributorId);
          if (contributor) {
            clientName = contributor.razaoSocial || clientName;
          }
        }
        
        supportChats[targetChatId] = {
          chatId: targetChatId,
          clientName: clientName,
          sector: msg.sector || "",
          messages: [],
          lastMessage: null,
          lastMessageTimestamp: -Infinity,
          unreadCount: 0,
          isOnline: false,
          contributorId: contributorId || null,
          employeeId: employeeId || null,
          isContactOnly: !isEmployeeChat && !!contributorId,
          isEmployeeChat: isEmployeeChat || false,
          lastClientSender: null
        };
      }

      const chatData = supportChats[targetChatId];
      chatData.messages = Array.isArray(chatData.messages) ? chatData.messages : [];
      chatData.messages.push(msg);
      chatData.messages = chatData.messages.sort((a, b) => getMessageTimestampValue(a) - getMessageTimestampValue(b));
      chatData.lastMessage = chatData.messages[chatData.messages.length - 1];
      chatData.lastMessageTimestamp = getMessageTimestampValue(chatData.lastMessage);

      if (!chatData.clientName && msg.clientName) {
        chatData.clientName = msg.clientName;
      }
      
      // Atualizar employeeId se necessário
      if (employeeId && !chatData.employeeId) {
        chatData.employeeId = employeeId;
      }

      if (msg.type === "client") {
        const roleFallback = msg.senderRole === "employee" ? "Funcionário" : "Administrador";
        const senderName =
          msg.senderName ||
          msg.sender ||
          msg.clientName ||
          chatData.clientName ||
          roleFallback;
        chatData.lastClientSender = {
          name: senderName,
          role: msg.senderRole || null,
          timestamp: effectiveTimestamp
        };
        
        // Atualizar unreadCount se a mensagem não foi lida
        if (!msg.read) {
          chatData.unreadCount = (chatData.unreadCount || 0) + 1;
        }
      } else {
        // Se for mensagem do suporte e o chat estiver aberto, marcar como lida
        if (currentSupportChatId === targetChatId) {
          // Não atualizar unreadCount para mensagens do suporte
        }
      }
      
      // Re-renderizar lista de funcionários se for chat de funcionário
      if (chatData.contributorId && chatData.employeeId) {
        renderEmployeesList(chatData.contributorId);
      }
      
      // Atualizar lista de contatos para refletir novos indicadores de mensagens não lidas
      if (chatData.contributorId) {
        updateSupportContactsList();
        // CRITICAL: Sempre atualizar lista de funcionários quando atualizar lista de contatos
        // (replicando o comportamento automático do contacts-list)
        updateActiveContributorEmployeesList();
      }

      const messageDiv = document.createElement("div");

      messageDiv.classList.add("message", msg.type === "client" ? "received" : "sent");

      messageDiv.setAttribute("data-message-id", msg.id);

      

      // Verificar se é mensagem de emoji apenas

      const onlyEmojis = msg.isEmojiOnly || (msg.text && isOnlyEmojis(msg.text));

      if (onlyEmojis) {

        messageDiv.classList.add("emoji-only");

      }

      

      // Removido message-sent-info do chat com contribuintes - o usuário já sabe com quem está conversando

      

      // Se mensagem tem arquivo, renderizar arquivo

      if (msg.file) {

        const fileObj = {

          name: msg.file.name,

          size: msg.file.size,

          type: msg.file.type

        };

        const fileElement = createFileElement(fileObj, msg.file.data);

        messageDiv.appendChild(fileElement);

      }

      // Se for apenas emojis, renderizar emojis grandes com Lottie

      else if (msg.text && onlyEmojis) {

        const emojis = extractEmojis(msg.text);

        const emojiCount = emojis.length;

        

        emojis.forEach((emoji, index) => {

          const emojiContainer = createLargeEmoji(emoji, index);

          

          // Ajustar tamanho baseado na quantidade

          if (emojiCount === 1) {

            // Manter tamanho grande padrão (80px)

          } else if (emojiCount <= 3) {

            emojiContainer.classList.add('emoji-medium');

          } else {

            emojiContainer.classList.add('emoji-small');

          }

          

          messageDiv.appendChild(emojiContainer);

        });

      }

      // Senão, renderizar texto normal

      else if (msg.text) {

        const textDiv = document.createElement("span");

        textDiv.textContent = msg.text;

        messageDiv.appendChild(textDiv);

      }

      

      // Adicionar horário para todos os tipos de mensagem

      const timeDiv = document.createElement("span");

      timeDiv.classList.add("message-time");

      timeDiv.textContent = msg.time || getCurrentTime();

      messageDiv.appendChild(timeDiv);

      // Adicionar data timestamp como atributo para verificação de date-divider
      messageDiv.setAttribute("data-timestamp", effectiveTimestamp.toString());

      // Verificar se precisa adicionar date-divider antes da mensagem (apenas se o chat estiver aberto)
      if (currentSupportChatId === targetChatId) {
        const messagesContainer = document.querySelector(".messages");
        if (messagesContainer) {
          const lastMessageElement = messagesContainer.querySelector(".message:last-child, .date-divider:last-child");
          if (lastMessageElement && !lastMessageElement.classList.contains("date-divider")) {
            const lastMessageTimestamp = lastMessageElement.getAttribute("data-timestamp");
            if (lastMessageTimestamp) {
              const lastMessageDate = new Date(parseInt(lastMessageTimestamp)).toDateString();
              const messageDate = new Date(effectiveTimestamp).toDateString();
              
              if (messageDate !== lastMessageDate) {
                const dateText = getRelativeDate(effectiveTimestamp);
                const dateDivider = createDateDivider(dateText);
                messagesContainer.appendChild(dateDivider);
              }
            }
          } else if (!lastMessageElement) {
            // Se não há mensagens anteriores, adicionar date-divider
            const dateText = getRelativeDate(effectiveTimestamp);
            const dateDivider = createDateDivider(dateText);
            messagesContainer.appendChild(dateDivider);
          }

          messagesContainer.appendChild(messageDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }


      if (currentSupportChatId === msg.chatId) {
        const titleElement = contactBox.querySelector(".contact-box-title");
        const subtitleElement = contactBox.querySelector("p");
        // contact-box-title deve sempre mostrar a razão social (clientName)
        if (titleElement) {
          titleElement.textContent = chatData.clientName || "Contribuinte";
        }
        // subtitle (p) deve mostrar o funcionário selecionado ou "Administrador"
        if (subtitleElement) {
          if (selectedEmployeeId && chatData.contributorId) {
            // Mostrar nome do funcionário selecionado
            const employees = getEmployeesByContributorId(chatData.contributorId);
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
            if (selectedEmployee) {
              subtitleElement.textContent = selectedEmployee.fullName || selectedEmployee.username || "Funcionário";
            } else {
              subtitleElement.textContent = "Conversa com Administrador";
            }
          } else if (chatData.contributorId) {
            // Quando é contribuinte mas nenhum funcionário está selecionado = conversa com administrador
            subtitleElement.textContent = "Conversa com Administrador";
          } else if (chatData.sector) {
            subtitleElement.textContent = chatData.sector;
          } else {
            subtitleElement.textContent = "Conversa geral";
          }
        }
        // Atualizar lista de funcionários para mostrar badges atualizados
        if (chatData.contributorId) {
          renderEmployeesList(chatData.contributorId);
        }
      }

      updateSupportContactsList();
      // updateActiveContributorEmployeesList será chamado dentro de updateSupportContactsList
      
      // Atualizar lista de arquivos do perfil se a mensagem tiver arquivo
      if (msg.file && msg.file.name) {
        renderUserFiles();
      }
    }

    

    // Função para carregar chat de suporte

    async function loadSupportChat(chatId) {
      currentSupportChatId = chatId;

      const chatData = supportChats[chatId];
      
      if (!chatData) return;
      
      // CRITICAL: Marcar o contato como ativo ANTES de qualquer outra operação
      // Isso garante que updateActiveContributorEmployeesList possa detectar o contato ativo
      const contactElements = document.querySelectorAll(".contact.support-contact");
      contactElements.forEach(c => c.classList.remove("active"));
      const activeContactElement = document.querySelector(`.contact.support-contact[data-support-chat-id="${chatId}"]`);
      if (activeContactElement) {
        activeContactElement.classList.add("active");
      }

      // Determinar se é chat de funcionário ou chat do administrador (DECLARAR IMEDIATAMENTE APÓS O RETURN)
      // Isso garante que as variáveis estejam disponíveis em todo o escopo da função
      const isChatEmployee = isEmployeeChatId(chatId);
      const contributorIdFromChat = chatData.contributorId || getContributorIdFromChatId(chatId);
      
      console.log(`[loadSupportChat] Iniciando carregamento - chatId: ${chatId}, contributorId do chatData: ${chatData.contributorId}, contributorId extraído: ${getContributorIdFromChatId(chatId)}, contributorIdFromChat final: ${contributorIdFromChat}`);

      // CRITICAL: Recarregar mensagens para garantir que apenas as mensagens corretas estejam no chat
      // As funções loadEmployeeChatMessages e loadAdminChatMessages são assíncronas e atualizam chatData.messages diretamente
      // Então precisamos chamá-las e depois ordenar as mensagens
      if (isChatEmployee && contributorIdFromChat && chatData.employeeId) {
        // Chat de funcionário - recarregar mensagens do funcionário
        await loadEmployeeChatMessages(chatId, contributorIdFromChat, chatData.employeeId);
      } else if (!isChatEmployee && contributorIdFromChat) {
        // Chat do administrador - recarregar mensagens do administrador
        await loadAdminChatMessages(chatId, contributorIdFromChat);
      }

      if (!Array.isArray(chatData.messages)) {
        chatData.messages = [];
      }

      // Ordenar mensagens após o carregamento
      chatData.messages = [...chatData.messages].sort((a, b) => getMessageTimestampValue(a) - getMessageTimestampValue(b));
      if (chatData.messages.length > 0) {
        chatData.lastMessage = chatData.messages[chatData.messages.length - 1];
        chatData.lastMessageTimestamp = getMessageTimestampValue(chatData.lastMessage);
      }

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userSector = currentUser.sector || "";

      if (!chatData.sector && userSector) {
        chatData.sector = userSector;

        if (chatData.contributorId) {
          const contacts = getContributorContacts();
          const contact = contacts.find(c =>
            c.chatId === chatId || c.contributorId === chatData.contributorId
          );
          if (contact) {
            contact.sector = userSector;
            setContributorContacts(contacts);
          }
        }
      }
      
      chatData.isContactOnly = false;
      

      // Desativar outros contatos

      document.querySelectorAll(".contact").forEach(c => c.classList.remove("active"));

      const selectedContactElement = document.querySelector(`[data-support-chat-id="${chatId}"]`);
      if (selectedContactElement) {
        selectedContactElement.classList.add("active");
      }
      

      // Atualizar contact-box com avatar de inicial

      // Criar estrutura do header com avatar à esquerda e títulos à direita
      let headerElement = contactBox.querySelector(".contact-box-header");
      let infoElement = contactBox.querySelector(".contact-box-info");
      
      // Se não existir, criar a estrutura
      if (!headerElement) {
        headerElement = document.createElement("div");
        headerElement.classList.add("contact-box-header");
        // Inserir antes do employees-list-container ou no início
        const employeesContainer = contactBox.querySelector("#employeesListContainer");
        if (employeesContainer) {
          contactBox.insertBefore(headerElement, employeesContainer);
        } else {
          contactBox.insertBefore(headerElement, contactBox.firstChild);
        }
      }
      
      if (!infoElement) {
        infoElement = document.createElement("div");
        infoElement.classList.add("contact-box-info");
        headerElement.appendChild(infoElement);
      }

      // CRITICAL: Remover apenas imagem e avatar antigos do header (NÃO remover avatares de funcionários)
      // Os avatares de funcionários estão em .employee-item .avatar-initial dentro de #employeesListContainer
      // e devem ser preservados
      const oldImgInHeader = headerElement.querySelector("img");
      if (oldImgInHeader) oldImgInHeader.remove();

      // Remover apenas avatar antigo do header (não remover avatares de funcionários)
      const oldAvatarInHeader = headerElement.querySelector(".avatar-initial");
      if (oldAvatarInHeader) {
        oldAvatarInHeader.remove();
      }
      
      // CRITICAL: Não remover avatares que estão dentro de employee-item
      // Verificar se há avatares fora do header e fora dos employee-items (caso existam)
      // Mas NÃO remover avatares de funcionários
      const allAvatars = contactBox.querySelectorAll(".avatar-initial");
      allAvatars.forEach(avatarEl => {
        // Se o avatar está dentro de um employee-item, NÃO remover
        if (avatarEl.closest('.employee-item')) {
          return; // Preservar avatar de funcionário
        }
        // Se o avatar está no header, já foi removido acima
        if (avatarEl.closest('.contact-box-header')) {
          return; // Já foi processado
        }
        // Se o avatar está diretamente no contact-box (sem header), remover
        // (caso exista algum avatar órfão)
        if (avatarEl.parentElement === contactBox || !avatarEl.closest('.contact-box-header')) {
          avatarEl.remove();
        }
      });

      // Criar e adicionar avatar com inicial (56px, maior que a lista de contatos)
      const avatarName = chatData.clientName || chatData.lastClientSender?.name || "Contribuinte";
      const avatar = createAvatarElement(avatarName, 56);
      
      // Adicionar avatar no início do header (antes do infoElement)
      headerElement.insertBefore(avatar, infoElement);

      const titleElement = contactBox.querySelector(".contact-box-title");
      let subtitle = contactBox.querySelector("p");

      // Criar subtitle se não existir
      if (!subtitle) {
        subtitle = document.createElement("p");
        infoElement.appendChild(subtitle);
      }

      // Mover titleElement e subtitle para dentro do infoElement se não estiverem
      if (titleElement && !infoElement.contains(titleElement)) {
        // Remover de onde estiver antes de adicionar
        if (titleElement.parentNode) {
          titleElement.parentNode.removeChild(titleElement);
        }
        infoElement.appendChild(titleElement);
      }
      if (subtitle && !infoElement.contains(subtitle)) {
        // Remover de onde estiver antes de adicionar
        if (subtitle.parentNode) {
          subtitle.parentNode.removeChild(subtitle);
        }
        infoElement.appendChild(subtitle);
      }

      let requesterLabel =
        chatData.lastClientSender?.name ||
        chatData.clientName ||
        "Contato";

      if (!chatData.lastClientSender) {
        const latestClientMessage = Array.isArray(chatData.messages)
          ? [...chatData.messages].reverse().find(msg => msg.type === "client")
          : null;

        if (latestClientMessage) {
          const roleFallback =
            latestClientMessage.senderRole === "employee" ? "Funcionário" : "Administrador";

          const fallbackName =
            latestClientMessage.senderName ||
            latestClientMessage.sender ||
            latestClientMessage.clientName ||
            chatData.clientName ||
            roleFallback;

          chatData.lastClientSender = {
            name: fallbackName,
            role: latestClientMessage.senderRole || null,
            timestamp: getMessageTimestampValue(latestClientMessage)
          };

          requesterLabel = fallbackName;
        }
      }

      // Atualizar título e subtítulo baseado no tipo de chat
      // isChatEmployee e contributorIdFromChat já foram declarados no início da função
      if (titleElement) {
        if (isChatEmployee && contributorIdFromChat) {
          // Chat de funcionário - título mostra razão social do contribuinte
          const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
          const contributor = contributors.find(c => c.id === contributorIdFromChat);
          titleElement.textContent = contributor ? contributor.razaoSocial : chatData.clientName || "Contribuinte";
        } else {
          // Chat do administrador - título mostra razão social
          titleElement.textContent = chatData.clientName || "Contribuinte";
        }
      }
      
      if (subtitle) {
        if (isChatEmployee && contributorIdFromChat) {
          // Chat de funcionário - mostrar nome do funcionário
          const employeeIdFromChat = getEmployeeIdFromChatId(chatId);
          if (employeeIdFromChat) {
            const employees = getEmployeesByContributorId(contributorIdFromChat);
            const employee = employees.find(emp => emp.id === employeeIdFromChat);
            if (employee) {
              subtitle.textContent = employee.fullName || employee.username || "Funcionário";
            } else {
              subtitle.textContent = "Funcionário";
            }
          } else {
            subtitle.textContent = "Funcionário";
          }
        } else if (contributorIdFromChat) {
          // Chat do administrador
          subtitle.textContent = "Conversa com Administrador";
        } else if (chatData.sector) {
          subtitle.textContent = chatData.sector;
        } else {
          subtitle.textContent = "Conversa geral";
        }
      }
      
      contactBox.classList.remove("hidden");

      

      // Limpar e carregar mensagens com indicadores de data

      messagesContainer.innerHTML = "";

      let lastMessageDate = null;

      

      // Obter nome do usuário logado
      const userName = currentUser.fullName || currentUser.username || "Usuário";

      // IMPORTANTE: Não filtrar mensagens! Cada chat já tem apenas suas próprias mensagens
      // O chatId já identifica se é chat do administrador (chat_contributor_XXX) 
      // ou chat de funcionário (chat_contributor_XXX_employee_YYY)
      // isChatEmployee e contributorIdFromChat já foram declarados no início da função
      const messagesToDisplay = chatData.messages || [];
      
      // DEBUG: Verificar quantas mensagens têm file.data ANTES da renderização
      const messagesWithFiles = messagesToDisplay.filter(m => m.file);
      const messagesWithFileData = messagesToDisplay.filter(m => m.file && m.file.data);
      console.log(`📨 Carregando ${messagesToDisplay.length} mensagens do chat ${chatId} (${isChatEmployee ? 'funcionário' : 'administrador'})`);
      console.log(`[loadSupportChat] ⚠️ ANTES da renderização - Mensagens com file: ${messagesWithFiles.length}, com file.data: ${messagesWithFileData.length}`);
      
      // CRITICAL: Garantir que todas as mensagens com arquivo tenham file.data antes de renderizar
      // Buscar file.data do localStorage para todas as mensagens que não têm
      if (messagesWithFiles.length > messagesWithFileData.length) {
        console.log(`[loadSupportChat] ⚠️ ALERTA: ${messagesWithFiles.length - messagesWithFileData.length} mensagens têm file mas não têm file.data! Buscando do localStorage...`);
        try {
          const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
          const localStorageMessagesMap = new Map();
          allMessages.forEach(lm => {
            if (lm.id && lm.file && lm.file.data) {
              localStorageMessagesMap.set(lm.id, lm);
            }
            if (lm.timestamp && lm.file && lm.file.data) {
              localStorageMessagesMap.set('ts:' + lm.timestamp, lm);
            }
          });
          
          let restoredCount = 0;
          messagesToDisplay.forEach(msg => {
            if (msg.file && !msg.file.data) {
              let fileDataFromStorage = null;
              if (msg.id && localStorageMessagesMap.has(msg.id)) {
                const storageMsg = localStorageMessagesMap.get(msg.id);
                if (storageMsg.file && storageMsg.file.data) {
                  fileDataFromStorage = storageMsg.file.data;
                }
              }
              if (!fileDataFromStorage && msg.timestamp && localStorageMessagesMap.has('ts:' + msg.timestamp)) {
                const storageMsg = localStorageMessagesMap.get('ts:' + msg.timestamp);
                if (storageMsg.file && storageMsg.file.data) {
                  fileDataFromStorage = storageMsg.file.data;
                }
              }
              
              if (fileDataFromStorage) {
                msg.file.data = fileDataFromStorage;
                restoredCount++;
                console.log(`[loadSupportChat] ✅ Restaurado file.data ANTES da renderização para mensagem ${msg.id || msg.timestamp}`);
              }
            }
          });
          
          if (restoredCount > 0) {
            console.log(`[loadSupportChat] ✅ Total de ${restoredCount} file.data restaurados ANTES da renderização`);
          }
        } catch (error) {
          console.error(`[loadSupportChat] ❌ Erro ao restaurar file.data antes da renderização:`, error);
        }
      }

      // Se não houver mensagens para mostrar, exibir mensagem informativa
      if (messagesToDisplay.length === 0) {
        const noMessagesDiv = document.createElement("div");
        noMessagesDiv.classList.add("no-messages");
        noMessagesDiv.style.textAlign = "center";
        noMessagesDiv.style.padding = "40px 20px";
        noMessagesDiv.style.color = "#888";
        
        if (isChatEmployee) {
          noMessagesDiv.innerHTML = `
            <i class='bx bx-message-dots' style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Nenhuma mensagem ainda nesta conversa.</p>
            <p style="font-size: 12px; margin-top: 8px;">Inicie uma conversa com este funcionário.</p>
          `;
        } else if (contributorIdFromChat) {
          noMessagesDiv.innerHTML = `
            <i class='bx bx-user' style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Conversa com Administrador</p>
            <p style="font-size: 12px; margin-top: 8px;">Nenhuma mensagem ainda. Selecione um funcionário na lista abaixo para conversar com ele.</p>
          `;
        } else {
          noMessagesDiv.innerHTML = `
            <i class='bx bx-user' style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Nenhuma mensagem ainda.</p>
          `;
        }
        
        messagesContainer.appendChild(noMessagesDiv);
        // NÃO fazer return aqui - deixar continuar para renderizar funcionários e habilitar input
      } else {
        // Se houver mensagens, renderizá-las
        messagesToDisplay.forEach(msg => {

        // Adicionar indicador de data se for diferente da mensagem anterior

        const messageDate = getMessageTimestampValue(msg);
        const messageDateString = new Date(messageDate).toDateString();

        

        if (messageDateString !== lastMessageDate) {

          const dateText = getRelativeDate(messageDate);

          const dateDivider = createDateDivider(dateText);

          messagesContainer.appendChild(dateDivider);

          lastMessageDate = messageDateString;

        }

        

        const messageDiv = document.createElement("div");

        messageDiv.classList.add("message", msg.type === "client" ? "received" : "sent");

        messageDiv.setAttribute("data-message-id", msg.id);

        

        // Verificar se é mensagem de emoji apenas

        const onlyEmojis = msg.isEmojiOnly || (msg.text && isOnlyEmojis(msg.text));

        if (onlyEmojis) {

          messageDiv.classList.add("emoji-only");

        }

        

        // Removido message-sent-info do chat com contribuintes - o usuário já sabe com quem está conversando

        

        // Se mensagem tem arquivo, renderizar arquivo
        // CRITICAL: SEMPRE buscar file.data do localStorage primeiro (como no sistema Suporte)
        if (msg.file) {
          let fileDataToRender = msg.file.data;
          
          // CRITICAL: SEMPRE buscar file.data do localStorage original (não filtrar por chatId)
          // O chatId pode ter sido alterado durante o carregamento, então buscar por ID/timestamp
          if (!fileDataToRender) {
            try {
              const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
              
              // Buscar mensagem no localStorage usando ID ou timestamp (não chatId)
              // Isso garante que encontremos a mensagem mesmo se o chatId foi alterado
              const localStorageMsg = allMessages.find(lm => {
                // Tentar encontrar por ID primeiro (mais confiável)
                if (msg.id && lm.id === msg.id) return true;
                
                // Se não encontrou por ID, tentar por timestamp + fileName
                if (msg.timestamp && lm.timestamp === msg.timestamp) {
                  // Se ambas têm arquivo, verificar se o nome também corresponde
                  if (msg.file && lm.file) {
                    if (msg.file.name === lm.file.name) return true;
                  } else {
                    // Se não têm arquivo, timestamp é suficiente
                    return true;
                  }
                }
                
                return false;
              });
              
              if (localStorageMsg && localStorageMsg.file && localStorageMsg.file.data) {
                fileDataToRender = localStorageMsg.file.data;
                console.log(`[loadSupportChat] ✅ file.data encontrado no localStorage:`, {
                  timestamp: msg.timestamp,
                  id: msg.id,
                  fileName: msg.file.name,
                  dataLength: fileDataToRender.length,
                  foundBy: msg.id ? 'ID' : 'timestamp'
                });
              } else if (msg.file) {
                console.warn(`[loadSupportChat] ⚠️ Mensagem tem file mas não encontrou file.data no localStorage:`, {
                  timestamp: msg.timestamp,
                  id: msg.id,
                  fileName: msg.file.name,
                  searchedMessages: allMessages.length
                });
              }
            } catch (error) {
              console.warn(`[loadSupportChat] Erro ao buscar file.data do localStorage:`, error);
            }
          } else {
            console.log(`[loadSupportChat] ✅ file.data já presente na mensagem:`, {
              timestamp: msg.timestamp,
              id: msg.id,
              fileName: msg.file.name,
              dataLength: fileDataToRender.length
            });
          }
          
          if (fileDataToRender) {
            console.log(`[loadSupportChat] ✅ Renderizando mensagem com arquivo:`, {
              timestamp: msg.timestamp,
              id: msg.id,
              fileName: msg.file.name,
              hasData: !!fileDataToRender,
              dataLength: fileDataToRender.length || 0
            });
            
            const fileObj = {
              name: msg.file.name,
              size: msg.file.size,
              type: msg.file.type
            };
            
            const fileElement = createFileElement(fileObj, fileDataToRender);
          messageDiv.appendChild(fileElement);

            // Se houver legenda, adicionar como texto separado
            if (msg.caption) {
              const captionDiv = document.createElement("span");
              captionDiv.textContent = msg.caption;
              messageDiv.appendChild(captionDiv);
            }
          } else {
            console.error(`[loadSupportChat] ❌ ERRO: Mensagem tem file mas não encontrou file.data (nem no localStorage nem em msg.file):`, {
              timestamp: msg.timestamp,
              id: msg.id,
              fileName: msg.file.name,
              hasFileInMessage: !!msg.file,
              hasDataInMessage: !!msg.file.data
            });
          }
        }

        // Se for apenas emojis, renderizar emojis grandes com Lottie

        else if (msg.text && onlyEmojis) {

          const emojis = extractEmojis(msg.text);

          const emojiCount = emojis.length;

          

          emojis.forEach((emoji, index) => {

            const emojiContainer = createLargeEmoji(emoji, index);

            

            // Ajustar tamanho baseado na quantidade

            if (emojiCount === 1) {

              // Manter tamanho grande padrão (80px)

            } else if (emojiCount <= 3) {

              emojiContainer.classList.add('emoji-medium');

            } else {

              emojiContainer.classList.add('emoji-small');

            }

            

            messageDiv.appendChild(emojiContainer);

          });

        }

        // Senão, renderizar texto normal

        else if (msg.text) {

          const textDiv = document.createElement("span");

          textDiv.textContent = msg.text;

          messageDiv.appendChild(textDiv);

        }

        

        // Adicionar horário para todos os tipos de mensagem

        const timeDiv = document.createElement("span");

        timeDiv.classList.add("message-time");

        timeDiv.textContent = msg.time || getCurrentTime();

        messageDiv.appendChild(timeDiv);

        

        messagesContainer.appendChild(messageDiv);

        });

        // Rolar para o final apenas se houver mensagens
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      // Marcar mensagens como lidas ANTES de renderizar a lista de funcionários
      // Isso garante que os contadores sejam atualizados corretamente
      markSupportMessagesAsRead(chatId);

      // Remover indicador de não lidas do contato principal (badge numérica)
      // Isso deve ser feito DEPOIS de marcar as mensagens como lidas
      if (selectedContactElement) {
        selectedContactElement.classList.remove("has-unread");
        const unreadBadge = selectedContactElement.querySelector(".unread-badge");
        if (unreadBadge) {
          unreadBadge.remove();
        }
        // Remover também o unread-dot se existir
        const unreadDot = selectedContactElement.querySelector(".unread-dot");
        if (unreadDot) {
          unreadDot.remove();
        }
      }

      // Habilitar input de mensagem para suporte (sempre, mesmo sem mensagens)
      enableMessageInput();

      

      // Ativar listener em tempo real para este chat específico
      startRealtimeChatListener(chatId);

      // Renderizar lista de funcionários se for um contribuinte (tanto chat do admin quanto de funcionário)
      // isChatEmployee e contributorIdFromChat já foram declarados no início da função
      console.log(`[loadSupportChat] Verificando renderização de funcionários - contributorIdFromChat: ${contributorIdFromChat}, isChatEmployee: ${isChatEmployee}`);
      
      // CRITICAL: Sempre renderizar lista de funcionários se houver um contributorId
      // Mesmo que não haja funcionários, a função deve ser chamada para garantir que está visível quando necessário
      // IMPORTANTE: Após marcar mensagens como lidas, atualizar a lista de funcionários para refletir o novo unreadCount
      if (contributorIdFromChat) {
        // Se é chat de funcionário, extrair o employeeId
        if (isChatEmployee) {
          const employeeIdFromChat = getEmployeeIdFromChatId(chatId);
          selectedEmployeeId = employeeIdFromChat;
        } else {
          // Chat do administrador
          selectedEmployeeId = null;
        }
        
        // CRITICAL: Sempre renderizar lista de funcionários ao abrir chat de contribuinte
      // Usar setTimeout para garantir que o DOM esteja pronto e que markSupportMessagesAsRead tenha terminado
        console.log(`[loadSupportChat] Renderizando lista de funcionários para contribuinte ${contributorIdFromChat}`);
        setTimeout(() => {
          renderEmployeesList(contributorIdFromChat);
        // Após re-renderizar, remover o indicador de não lidas (employee-unread-indicator)
        // do funcionário cujo chat acabou de ser aberto
        if (isChatEmployee && chatData.employeeId) {
          const employeesListContainer = document.getElementById("employeesListContainer");
          if (employeesListContainer) {
            const employeesList = employeesListContainer.querySelector("#employeesList");
            if (employeesList) {
              const activeEmployeeItem = employeesList.querySelector(`.employee-item[data-employee-id="${chatData.employeeId}"]`);
              if (activeEmployeeItem) {
                activeEmployeeItem.classList.remove("has-unread");
                const unreadIndicator = activeEmployeeItem.querySelector(".employee-unread-indicator");
                if (unreadIndicator) {
                  unreadIndicator.remove();
                }
              }
            }
          }
        }
        }, 0);
        
        // Atualizar subtítulo baseado no tipo de chat
        const subtitleElement = contactBox.querySelector("p");
        if (subtitleElement) {
          if (isChatEmployee && selectedEmployeeId) {
            // Chat de funcionário - mostrar nome do funcionário
            const employees = getEmployeesByContributorId(contributorIdFromChat);
            const employee = employees.find(emp => emp.id === selectedEmployeeId);
            if (employee) {
              subtitleElement.textContent = employee.fullName || employee.username || "Funcionário";
            } else {
              subtitleElement.textContent = "Funcionário";
            }
          } else {
            // Chat do administrador
            subtitleElement.textContent = "Conversa com Administrador";
          }
        }
      } else {
        // Esconder lista de funcionários se não for um contribuinte
        const employeesListContainer = document.getElementById("employeesListContainer");
        if (employeesListContainer) {
          employeesListContainer.classList.add("hidden");
        }
        selectedEmployeeId = null;
      }

    }

    // Função para carregar mensagens de um chat de funcionário
    async function loadEmployeeChatMessages(employeeChatId, contributorId, employeeId) {
      // Garantir que o chat existe antes de carregar mensagens
      if (!supportChats[employeeChatId]) {
        // Criar chat do funcionário se não existir
        const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
        const contributor = contributors.find(c => c.id === contributorId);
        supportChats[employeeChatId] = {
          chatId: employeeChatId,
          clientName: contributor ? contributor.razaoSocial : "Contribuinte",
          sector: "",
          messages: [],
          lastMessage: null,
          lastMessageTimestamp: -Infinity,
          unreadCount: 0,
          isOnline: false,
          contributorId: contributorId,
          employeeId: employeeId,
          isContactOnly: false,
          isEmployeeChat: true
        };
      }
      
      // Carregar mensagens do localStorage e Firebase
      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      
      // DEBUG: Verificar quantas mensagens têm file.data no localStorage
      const messagesWithFiles = messages.filter(m => m.file && m.file.data);
      console.log(`[loadEmployeeChatMessages] Total de mensagens no localStorage: ${messages.length}, com file.data: ${messagesWithFiles.length}`);
      
      // DEBUG: Verificar mensagens com arquivo que pertencem a este funcionário ANTES da filtragem
      const messagesWithFilesForEmployee = messages.filter(msg => {
        if (!msg.file || !msg.file.data) return false;
        return (msg.chatId === employeeChatId) ||
               (msg.type === "client" && msg.contributorId === contributorId && msg.employeeId === employeeId) ||
               (msg.type === "support" && msg.contributorId === contributorId && msg.targetEmployeeId === employeeId);
      });
      console.log(`[loadEmployeeChatMessages] Mensagens com file.data que PERTENCEM a este funcionário (antes do filtro): ${messagesWithFilesForEmployee.length}`);
      if (messagesWithFilesForEmployee.length > 0) {
        messagesWithFilesForEmployee.forEach((msg, idx) => {
          console.log(`[loadEmployeeChatMessages] Mensagem ${idx + 1} com arquivo que pertence ao funcionário:`, {
            id: msg.id,
            timestamp: msg.timestamp,
            type: msg.type,
            chatId: msg.chatId,
            expectedChatId: employeeChatId,
            contributorId: msg.contributorId,
            employeeId: msg.employeeId,
            targetEmployeeId: msg.targetEmployeeId,
            fileName: msg.file.name,
            hasData: !!msg.file.data
          });
        });
      }
      
      // Filtrar mensagens deste funcionário
      // CRITICAL: Incluir mensagens que correspondem ao chatId do funcionário também
      const employeeMessages = messages.filter(msg => {
        // Verificar se o chatId corresponde ao chat do funcionário
        if (msg.chatId === employeeChatId) {
          return true;
        }
        
        // Mensagens do funcionário
        if (msg.type === "client" && msg.contributorId === contributorId && msg.employeeId === employeeId) {
          return true;
        }
        // Mensagens de suporte direcionadas a este funcionário
        if (msg.type === "support" && msg.contributorId === contributorId && msg.targetEmployeeId === employeeId) {
          return true;
        }
        return false;
      });
      
      // DEBUG: Verificar se há mensagens com arquivo que não foram incluídas
      const messagesWithFilesNotIncluded = messages.filter(msg => {
        if (msg.file && msg.file.data) {
          const isIncluded = employeeMessages.some(em => 
            (em.id && em.id === msg.id) || 
            (em.timestamp === msg.timestamp)
          );
          if (!isIncluded) {
            // Verificar se deveria estar incluída
            const shouldBeIncluded = 
              (msg.chatId === employeeChatId) ||
              (msg.type === "client" && msg.contributorId === contributorId && msg.employeeId === employeeId) ||
              (msg.type === "support" && msg.contributorId === contributorId && msg.targetEmployeeId === employeeId);
            if (shouldBeIncluded) {
              console.warn(`[loadEmployeeChatMessages] ⚠️ Mensagem com arquivo não incluída mas deveria estar:`, {
                id: msg.id,
                timestamp: msg.timestamp,
                chatId: msg.chatId,
                type: msg.type,
                contributorId: msg.contributorId,
                employeeId: msg.employeeId,
                targetEmployeeId: msg.targetEmployeeId,
                fileName: msg.file.name
              });
              return true;
            }
          }
        }
        return false;
      });
      
      if (messagesWithFilesNotIncluded.length > 0) {
        console.warn(`[loadEmployeeChatMessages] ⚠️ ${messagesWithFilesNotIncluded.length} mensagens com arquivo não foram incluídas na filtragem!`);
      }
      
      // DEBUG: Verificar quantas mensagens filtradas têm file
      const filteredMessagesWithFiles = employeeMessages.filter(m => m.file);
      const filteredMessagesWithFileData = employeeMessages.filter(m => m.file && m.file.data);
      console.log(`[loadEmployeeChatMessages] Mensagens filtradas: ${employeeMessages.length}, com file: ${filteredMessagesWithFiles.length}, com file.data: ${filteredMessagesWithFileData.length}`);
      
      // Atualizar chatId das mensagens para o chat do funcionário
      employeeMessages.forEach(msg => {
        msg.chatId = employeeChatId;
      });
      
      // Preservar dados existentes do chat antes de atualizar
      const existingChat = supportChats[employeeChatId];
      const existingMessages = existingChat?.messages || [];
      
      // CRITICAL: Mesclar mensagens preservando file.data das mensagens existentes
      // Criar um mapa das mensagens existentes por ID para preservar file.data
      const existingMessagesMap = new Map();
      existingMessages.forEach(existingMsg => {
        if (existingMsg.id && existingMsg.file && existingMsg.file.data) {
          existingMessagesMap.set(existingMsg.id, existingMsg);
        }
      });
      
      // CRITICAL: Atualizar mensagens do localStorage, SEMPRE buscando file.data do localStorage original
      // Criar um mapa de todas as mensagens do localStorage original (com file.data completo)
      const localStorageMessagesMap = new Map();
      messages.forEach(lm => {
        if (lm.id && lm.file && lm.file.data) {
          localStorageMessagesMap.set(lm.id, lm);
        }
        if (lm.timestamp && lm.file && lm.file.data) {
          localStorageMessagesMap.set('ts:' + lm.timestamp, lm);
        }
      });
      
      employeeMessages.forEach(msg => {
        // CRITICAL: SEMPRE buscar file.data do localStorage original primeiro
        let fileDataFromStorage = null;
        
        // Tentar por ID primeiro (mais confiável)
        if (msg.id && localStorageMessagesMap.has(msg.id)) {
          const storageMsg = localStorageMessagesMap.get(msg.id);
          if (storageMsg.file && storageMsg.file.data) {
            fileDataFromStorage = storageMsg.file.data;
            console.log(`[loadEmployeeChatMessages] ✅ file.data encontrado por ID: ${msg.id}`);
          }
        }
        
        // Se não encontrou por ID, tentar por timestamp
        if (!fileDataFromStorage && msg.timestamp && localStorageMessagesMap.has('ts:' + msg.timestamp)) {
          const storageMsg = localStorageMessagesMap.get('ts:' + msg.timestamp);
          if (storageMsg.file && storageMsg.file.data) {
            fileDataFromStorage = storageMsg.file.data;
            console.log(`[loadEmployeeChatMessages] ✅ file.data encontrado por timestamp: ${msg.timestamp}`);
          }
        }
        
        // Se encontrou file.data no localStorage, SEMPRE usar ele (sobrescrever se necessário)
        if (fileDataFromStorage && msg.file) {
          msg.file.data = fileDataFromStorage;
          console.log(`[loadEmployeeChatMessages] ✅ Restaurado file.data do localStorage para mensagem ${msg.id || msg.timestamp}, fileName: ${msg.file.name}`);
        } else if (msg.file && !msg.file.data) {
          console.warn(`[loadEmployeeChatMessages] ⚠️ Mensagem tem file mas não encontrou file.data:`, {
            id: msg.id,
            timestamp: msg.timestamp,
            fileName: msg.file.name
          });
        } else if (msg.id && existingMessagesMap.has(msg.id)) {
          // Fallback: usar file.data da mensagem existente se não encontrou no localStorage
          const existingMsg = existingMessagesMap.get(msg.id);
          if (existingMsg.file && existingMsg.file.data && (!msg.file || !msg.file.data)) {
            if (!msg.file) {
              msg.file = {};
            }
            msg.file.data = existingMsg.file.data;
            // Preservar também outros dados do arquivo se necessário
            if (existingMsg.file.name && !msg.file.name) {
              msg.file.name = existingMsg.file.name;
            }
            if (existingMsg.file.size && !msg.file.size) {
              msg.file.size = existingMsg.file.size;
            }
            if (existingMsg.file.type && !msg.file.type) {
              msg.file.type = existingMsg.file.type;
            }
          }
        }
      });
      
      // Atualizar mensagens do chat
      supportChats[employeeChatId].messages = employeeMessages;
      
      if (employeeMessages.length > 0) {
        supportChats[employeeChatId].lastMessage = employeeMessages[employeeMessages.length - 1];
        supportChats[employeeChatId].lastMessageTimestamp = getMessageTimestampValue(supportChats[employeeChatId].lastMessage);
      } else {
        // Se não houver mensagens, preservar lastMessage existente ou definir como null
        if (!existingChat.lastMessage) {
          supportChats[employeeChatId].lastMessage = null;
          supportChats[employeeChatId].lastMessageTimestamp = -Infinity;
        }
      }
      
      // Garantir que outros campos importantes sejam preservados
      supportChats[employeeChatId].chatId = employeeChatId;
      supportChats[employeeChatId].contributorId = contributorId;
      supportChats[employeeChatId].employeeId = employeeId;
      supportChats[employeeChatId].isEmployeeChat = true;
      
      // Preservar clientName se já existir
      if (!supportChats[employeeChatId].clientName && existingChat.clientName) {
        supportChats[employeeChatId].clientName = existingChat.clientName;
      }
    }
    
    // Função para carregar mensagens do chat do administrador
    async function loadAdminChatMessages(adminChatId, contributorId) {
      // Carregar mensagens do localStorage e Firebase
      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      
      // DEBUG: Verificar quantas mensagens têm file.data no localStorage
      const messagesWithFiles = messages.filter(m => m.file && m.file.data);
      console.log(`[loadAdminChatMessages] Total de mensagens no localStorage: ${messages.length}, com file.data: ${messagesWithFiles.length}`);
      
      // Filtrar mensagens do administrador (sem employeeId e sem targetEmployeeId)
      // CRITICAL: Apenas mensagens que NÃO são de funcionários
      const adminMessages = messages.filter(msg => {
        // Verificar se a mensagem pertence a este contribuinte
        if (msg.contributorId !== contributorId) return false;
        
        // Mensagens de cliente do administrador
        // Deve NÃO ter employeeId E NÃO ter senderRole "employee"
        if (msg.type === "client") {
          const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
          const isEmployee = msg.senderRole === "employee";
          // Apenas mensagens sem employeeId E sem senderRole "employee"
          const isAdminMessage = !hasEmployeeId && !isEmployee;
          return isAdminMessage;
        }
        
        // Mensagens de suporte para o administrador
        // Deve NÃO ter targetEmployeeId (mensagens gerais para o administrador)
        if (msg.type === "support") {
          const hasTarget = msg.targetEmployeeId && msg.targetEmployeeId !== null && msg.targetEmployeeId !== undefined && msg.targetEmployeeId !== "";
          // Apenas mensagens sem targetEmployeeId (gerais para o administrador)
          return !hasTarget;
        }
        
        return false;
      });
      
      // DEBUG: Verificar quantas mensagens filtradas têm file
      const filteredMessagesWithFiles = adminMessages.filter(m => m.file);
      const filteredMessagesWithFileData = adminMessages.filter(m => m.file && m.file.data);
      console.log(`[loadAdminChatMessages] Mensagens filtradas: ${adminMessages.length}, com file: ${filteredMessagesWithFiles.length}, com file.data: ${filteredMessagesWithFileData.length}`);
      
      // Atualizar chatId das mensagens para o chat do administrador
      adminMessages.forEach(msg => {
        msg.chatId = adminChatId;
      });
      
      // Adicionar mensagens ao chat
      if (supportChats[adminChatId]) {
        // CRITICAL: Mesclar mensagens preservando file.data das mensagens existentes
        const existingMessages = supportChats[adminChatId].messages || [];
        
        // Criar um mapa das mensagens existentes por ID para preservar file.data
        const existingMessagesMap = new Map();
        existingMessages.forEach(existingMsg => {
          if (existingMsg.id && existingMsg.file && existingMsg.file.data) {
            existingMessagesMap.set(existingMsg.id, existingMsg);
          }
        });
        
        // CRITICAL: Atualizar mensagens do localStorage, SEMPRE buscando file.data do localStorage original
        // Criar um mapa de todas as mensagens do localStorage original (com file.data completo)
        const localStorageMessagesMap = new Map();
        messages.forEach(lm => {
          if (lm.id && lm.file && lm.file.data) {
            localStorageMessagesMap.set(lm.id, lm);
          }
          if (lm.timestamp && lm.file && lm.file.data) {
            localStorageMessagesMap.set('ts:' + lm.timestamp, lm);
          }
        });
        
        adminMessages.forEach(msg => {
          // CRITICAL: SEMPRE buscar file.data do localStorage original primeiro
          let fileDataFromStorage = null;
          
          // Tentar por ID primeiro (mais confiável)
          if (msg.id && localStorageMessagesMap.has(msg.id)) {
            const storageMsg = localStorageMessagesMap.get(msg.id);
            if (storageMsg.file && storageMsg.file.data) {
              fileDataFromStorage = storageMsg.file.data;
              console.log(`[loadAdminChatMessages] ✅ file.data encontrado por ID: ${msg.id}`);
            }
          }
          
          // Se não encontrou por ID, tentar por timestamp
          if (!fileDataFromStorage && msg.timestamp && localStorageMessagesMap.has('ts:' + msg.timestamp)) {
            const storageMsg = localStorageMessagesMap.get('ts:' + msg.timestamp);
            if (storageMsg.file && storageMsg.file.data) {
              fileDataFromStorage = storageMsg.file.data;
              console.log(`[loadAdminChatMessages] ✅ file.data encontrado por timestamp: ${msg.timestamp}`);
            }
          }
          
          // Se encontrou file.data no localStorage, SEMPRE usar ele (sobrescrever se necessário)
          if (fileDataFromStorage && msg.file) {
            msg.file.data = fileDataFromStorage;
            console.log(`[loadAdminChatMessages] ✅ Restaurado file.data do localStorage para mensagem ${msg.id || msg.timestamp}, fileName: ${msg.file.name}`);
          } else if (msg.file && !msg.file.data) {
            console.warn(`[loadAdminChatMessages] ⚠️ Mensagem tem file mas não encontrou file.data:`, {
              id: msg.id,
              timestamp: msg.timestamp,
              fileName: msg.file.name
            });
          } else if (msg.id && existingMessagesMap.has(msg.id)) {
            // Fallback: usar file.data da mensagem existente se não encontrou no localStorage
            const existingMsg = existingMessagesMap.get(msg.id);
            if (existingMsg.file && existingMsg.file.data && (!msg.file || !msg.file.data)) {
              if (!msg.file) {
                msg.file = {};
              }
              msg.file.data = existingMsg.file.data;
              // Preservar também outros dados do arquivo se necessário
              if (existingMsg.file.name && !msg.file.name) {
                msg.file.name = existingMsg.file.name;
              }
              if (existingMsg.file.size && !msg.file.size) {
                msg.file.size = existingMsg.file.size;
              }
              if (existingMsg.file.type && !msg.file.type) {
                msg.file.type = existingMsg.file.type;
              }
            }
          }
        });
        
        supportChats[adminChatId].messages = adminMessages;
        if (adminMessages.length > 0) {
          supportChats[adminChatId].lastMessage = adminMessages[adminMessages.length - 1];
          supportChats[adminChatId].lastMessageTimestamp = getMessageTimestampValue(supportChats[adminChatId].lastMessage);
        }
      }
    }
    
    // Função handler para event delegation nos funcionários
    async function handleEmployeeClick(event) {
      // Prevenir múltiplas execuções simultâneas
      if (isSwitchingEmployee) {
        console.warn("[handleEmployeeClick] Já está alternando entre funcionários, ignorando clique");
        return;
      }
      
      // Encontrar o elemento employee-item clicado
      const employeeItem = event.target.closest(".employee-item");
      if (!employeeItem) return;
      
      // Obter dados do funcionário
      const employeeId = employeeItem.getAttribute("data-employee-id");
      const employeeChatId = employeeItem.getAttribute("data-chat-id");
      
      if (!employeeId || !employeeChatId) return;
      
      // Obter chatId do contribuinte atual (chat do administrador)
      if (!currentSupportChatId) return;
      
      const currentChatData = supportChats[currentSupportChatId];
      if (!currentChatData) return;
      
      // Obter contributorId do chat atual
      const contributorIdFromCurrent = currentChatData.contributorId || getContributorIdFromChatId(currentSupportChatId);
      if (!contributorIdFromCurrent) return;
      
      // Verificar se estamos no chat do administrador ou no chat de outro funcionário
      const isCurrentlyEmployeeChat = isEmployeeChatId(currentSupportChatId);
      
      // Se já está no chat deste funcionário, não fazer nada
      if (isCurrentlyEmployeeChat && currentSupportChatId === employeeChatId) {
        console.log("[handleEmployeeClick] Já está no chat deste funcionário, ignorando");
        return;
      }
      
      // Ativar flag de alternância
      isSwitchingEmployee = true;
      console.log(`[handleEmployeeClick] Iniciando alternância para funcionário ${employeeId}`);
      
      try {
        // ChatId do administrador
        const adminChatId = `chat_contributor_${contributorIdFromCurrent}`;
        
        // Se clicar no mesmo funcionário (já está no chat dele), voltar para o chat do administrador
        if (isCurrentlyEmployeeChat && currentSupportChatId === employeeChatId) {
          // Voltar para o chat do administrador
          // Garantir que o chat do administrador existe
          if (!supportChats[adminChatId]) {
            const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
            const contributor = contributors.find(c => c.id === contributorIdFromCurrent);
            if (contributor) {
              supportChats[adminChatId] = {
                chatId: adminChatId,
                clientName: contributor.razaoSocial || "Contribuinte",
                sector: "",
                messages: [],
                lastMessage: null,
                lastMessageTimestamp: -Infinity,
                unreadCount: 0,
                isOnline: false,
                contributorId: contributorIdFromCurrent,
                isContactOnly: true,
                isEmployeeChat: false
              };
            }
          }
          
          // CRITICAL: Sempre recarregar mensagens ao voltar para o chat do administrador
          await loadAdminChatMessages(adminChatId, contributorIdFromCurrent);
          
          // Carregar chat do administrador (aguardar conclusão)
          await loadSupportChat(adminChatId);
        } else {
          // CRITICAL: Sempre recarregar mensagens ao alternar entre funcionários
          // Isso garante que as mensagens estejam atualizadas e corretas
          // A função loadEmployeeChatMessages já cria o chat se não existir
          await loadEmployeeChatMessages(employeeChatId, contributorIdFromCurrent, employeeId);
          
          // Carregar chat do funcionário (aguardar conclusão)
          await loadSupportChat(employeeChatId);
        }
        
        // Atualizar lista de funcionários para mostrar badges atualizados
        renderEmployeesList(contributorIdFromCurrent);
        
        console.log(`[handleEmployeeClick] Alternância concluída para funcionário ${employeeId}`);
      } catch (error) {
        console.error("[handleEmployeeClick] Erro ao alternar entre funcionários:", error);
      } finally {
        // Sempre liberar o flag, mesmo em caso de erro
        isSwitchingEmployee = false;
      }
    }
    
    // Função para atualizar lista de funcionários do contribuinte ativo (similar a updateSupportContactsList)
    function updateActiveContributorEmployeesList() {
      // Detectar qual contato de contribuinte está selecionado (ativo)
      const activeContributorContact = document.querySelector(".contact.support-contact.contributor-contact.active");
      if (!activeContributorContact) {
        console.log("[updateActiveContributorEmployeesList] Nenhum contribuinte ativo encontrado");
        return; // Se não há contribuinte ativo, não fazer nada
      }
      
      const activeChatId = activeContributorContact.getAttribute("data-support-chat-id");
      if (!activeChatId) {
        console.log("[updateActiveContributorEmployeesList] ChatId não encontrado no contato ativo");
        return;
      }
      
      if (!supportChats[activeChatId]) {
        console.log(`[updateActiveContributorEmployeesList] Chat ${activeChatId} não encontrado em supportChats`);
        return;
      }
      
      const activeChat = supportChats[activeChatId];
      if (!activeChat.contributorId) {
        console.log(`[updateActiveContributorEmployeesList] Chat ${activeChatId} não tem contributorId`);
        return;
      }
      
      console.log(`[updateActiveContributorEmployeesList] Atualizando lista de funcionários para contribuinte ${activeChat.contributorId}`);
      // Atualizar lista de funcionários do contribuinte ativo (sempre recriar, como updateSupportContactsList faz)
      renderEmployeesList(activeChat.contributorId);
    }

    // Função para contar total de mensagens não lidas do chat de contribuintes
    function getTotalSupportUnreadCount() {
      let totalUnread = 0;
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);
      
      // Contar mensagens não lidas de todos os contribuintes
      Object.keys(supportChats).forEach(chatId => {
        const chatData = supportChats[chatId];
        if (!chatData || !chatData.contributorId) return;
        
        // Contar mensagens não lidas do admin
        const adminUnread = getAdminUnreadCount(chatData.contributorId);
        // Contar mensagens não lidas dos funcionários
        const employeesUnread = getEmployeesUnreadCount(chatData.contributorId);
        
        // Se há mensagens do admin, usar o número do admin
        // Se não há mensagens do admin mas há dos funcionários, contar as dos funcionários
        if (adminUnread > 0) {
          totalUnread += adminUnread;
        } else if (employeesUnread > 0) {
          totalUnread += employeesUnread;
        }
      });
      
      return totalUnread;
    }
    
    // Função para contar total de mensagens não lidas do chat interno
    function getTotalInternalUnreadCount() {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);
      const messages = getInternalMessages();
      let totalUnread = 0;
      
      Object.keys(messages).forEach(chatId => {
        const chatMessages = messages[chatId] || [];
        const unreadCount = chatMessages.filter(msg => {
          const senderUsername = normalizeUsername(msg.sender || msg.senderUsername || "");
          const isReceived = senderUsername !== currentUsername;
          if (isReceived && msg.read === undefined) {
            msg.read = false;
          }
          return isReceived && !msg.read;
        }).length;
        totalUnread += unreadCount;
      });
      
      return totalUnread;
    }
    
    // Função para atualizar badges dos ícones do sidebar
    function updateSidebarBadges() {
      // Badge para chat de contribuintes (apenas bolinha verde, sem número)
      const chatButton = document.querySelector('.sidebar button[data-section="chat"]');
      if (chatButton) {
        const unreadCount = getTotalSupportUnreadCount();
        let badge = chatButton.querySelector('.sidebar-unread-dot');
        
        if (unreadCount > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'sidebar-unread-dot';
            chatButton.appendChild(badge);
          }
          chatButton.classList.add('has-unread');
        } else {
          if (badge) {
            badge.remove();
          }
          chatButton.classList.remove('has-unread');
        }
      }
      
      // Badge para chat interno (apenas bolinha verde, sem número)
      const internalChatButton = document.querySelector('.sidebar button[data-section="internal-chat"]');
      if (internalChatButton) {
        const unreadCount = getTotalInternalUnreadCount();
        let badge = internalChatButton.querySelector('.sidebar-unread-dot');
        
        if (unreadCount > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'sidebar-unread-dot';
            internalChatButton.appendChild(badge);
          }
          internalChatButton.classList.add('has-unread');
        } else {
          if (badge) {
            badge.remove();
          }
          internalChatButton.classList.remove('has-unread');
        }
      }
    }

    // Função para renderizar lista de funcionários do contribuinte
    function renderEmployeesList(contributorId) {
      const employeesListContainer = document.getElementById("employeesListContainer");
      const employeesList = document.getElementById("employeesList");
      const employeesCount = document.getElementById("employeesCount");

      if (!employeesListContainer || !employeesList || !employeesCount) {
        console.error("Elementos da lista de funcionários não encontrados");
        return;
      }

      // Obter todos os funcionários do storage primeiro
      const allEmployees = getContributorEmployees();
      console.log(`[renderEmployeesList] Total de funcionários no storage:`, allEmployees.length);
      console.log(`[renderEmployeesList] Todos os funcionários:`, allEmployees);
      
      // Obter funcionários do contribuinte específico
      const employees = getEmployeesByContributorId(contributorId);
      
      console.log(`[renderEmployeesList] Renderizando lista de funcionários para contribuinte ${contributorId}:`, employees.length, "funcionários encontrados");
      console.log(`[renderEmployeesList] Funcionários encontrados:`, employees);

      // Atualizar contador
      employeesCount.textContent = employees.length;

      // Limpar lista (isso remove os event listeners antigos também)
      employeesList.innerHTML = "";

      // Se não houver funcionários, esconder a lista
      if (employees.length === 0) {
        employeesListContainer.classList.add("hidden");
        console.warn(`[renderEmployeesList] Nenhum funcionário encontrado para contribuinte ${contributorId}`);
        return;
      }

      // CRITICAL: Sempre mostrar lista se há funcionários
      employeesListContainer.classList.remove("hidden");
      console.log(`[renderEmployeesList] Container de funcionários tornado visível`);

      // Usar event delegation para evitar duplicação de listeners
      // Remover listener antigo se existir
      employeesList.removeEventListener("click", handleEmployeeClick);
      
      // Adicionar um único listener usando event delegation
      employeesList.addEventListener("click", handleEmployeeClick);

      // Renderizar cada funcionário
      console.log(`[renderEmployeesList] Iniciando renderização de ${employees.length} funcionários`);
      employees.forEach((employee, index) => {
        console.log(`[renderEmployeesList] Renderizando funcionário ${index + 1}/${employees.length}:`, employee);
        // Obter chatId do funcionário
        const employeeChatId = getEmployeeChatId(contributorId, employee.id);
        
        // Garantir que o chat do funcionário existe e tem as mensagens carregadas
        // A função loadEmployeeChatMessages cria o chat se não existir
        // Mas chamamos de forma assíncrona para não bloquear a renderização
        if (!supportChats[employeeChatId]) {
          // Criar chat imediatamente para que a renderização funcione
          const contributors = typeof getContributorsFromStorage === "function" ? getContributorsFromStorage() : [];
          const contributor = contributors.find(c => c.id === contributorId);
          supportChats[employeeChatId] = {
            chatId: employeeChatId,
            clientName: contributor ? contributor.razaoSocial : "Contribuinte",
            sector: "",
            messages: [],
            lastMessage: null,
            lastMessageTimestamp: -Infinity,
            unreadCount: 0,
            isOnline: false,
            contributorId: contributorId,
            employeeId: employee.id,
            isContactOnly: false,
            isEmployeeChat: true
          };
        }
        
        // Carregar mensagens existentes deste funcionário ANTES de contar não lidas
        // CRITICAL: Recarregar mensagens do localStorage para garantir dados atualizados
        const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
        const employeeMessages = messages.filter(msg => {
          // Mensagens do funcionário
          if (msg.type === "client" && msg.contributorId === contributorId && msg.employeeId === employee.id) {
            return true;
          }
          // Mensagens de suporte direcionadas a este funcionário
          if (msg.type === "support" && msg.contributorId === contributorId && msg.targetEmployeeId === employee.id) {
            return true;
          }
          return false;
        });
        
        // Atualizar chat com mensagens recarregadas
        const employeeChat = supportChats[employeeChatId];
        employeeChat.messages = employeeMessages;
        if (employeeMessages.length > 0) {
          employeeChat.lastMessage = employeeMessages[employeeMessages.length - 1];
          employeeChat.lastMessageTimestamp = getMessageTimestampValue(employeeChat.lastMessage);
        }
        
        const lastEmployeeMsg = employeeChat.lastMessage || null;
        
        // Contar mensagens não lidas do chat do funcionário
        // Mensagens não lidas são as que são do cliente (type === "client") e não foram lidas (!msg.read)
        const unreadCount = employeeMessages.filter(msg => {
          return msg.type === "client" && !msg.read;
        }).length;
        
        // Atualizar unreadCount no chat do funcionário
        employeeChat.unreadCount = unreadCount;
        
        // Verificar se este é o chat atual
        const isCurrentChat = currentSupportChatId === employeeChatId;

        const employeeItem = document.createElement("div");
        employeeItem.classList.add("employee-item");
        employeeItem.setAttribute("data-employee-id", employee.id);
        employeeItem.setAttribute("data-chat-id", employeeChatId);
        
        // Adicionar classe active se for o chat atual
        if (isCurrentChat) {
          employeeItem.classList.add("active");
        }

        // Adicionar classe has-unread se houver mensagens não lidas
        if (unreadCount > 0) {
          employeeItem.classList.add("has-unread");
        }

        // Criar avatar do funcionário (mesmo estilo do contact)
        // Garantir que o avatar sempre seja criado, mesmo se o nome estiver vazio
        const employeeNameForAvatar = employee.fullName || employee.username || employee.id || "Funcionário";
        const employeeAvatar = createAvatarElement(employeeNameForAvatar, 40);
        // Não adicionar classe employee-avatar duplicada (já tem avatar-initial)
        // O CSS já estiliza .contact-box .employee-item .avatar-initial
        // Garantir que o avatar tenha atributos para preservação
        employeeAvatar.setAttribute("data-employee-avatar-id", employee.id);
        employeeAvatar.setAttribute("data-employee-id", employee.id);

        // Criar informações do funcionário (mesma estrutura do contact-info)
        const employeeInfo = document.createElement("div");
        employeeInfo.classList.add("employee-info");

        // Criar nome do funcionário (mesmo estilo do contact-name)
        const employeeName = document.createElement("div");
        employeeName.classList.add("employee-name");
        
        // Criar span para o texto do nome
        const employeeNameText = document.createElement("span");
        employeeNameText.classList.add("employee-name-text");
        employeeNameText.textContent = employee.fullName || employee.username || "Funcionário";
        employeeName.appendChild(employeeNameText);

        // Criar elemento para última mensagem (mesmo estilo do contact-last-message)
        const employeeLastMessage = document.createElement("div");
        employeeLastMessage.classList.add("employee-username"); // Mantém a classe para compatibilidade CSS
        
        // Função auxiliar para truncar preview (mesma lógica do contact-last-message)
        function truncateEmployeePreview(text, maxLength = 90) {
          if (!text) return "Sem mensagens recentes";
          const sanitized = String(text).replace(/\s+/g, " ").trim();
          return sanitized.length > maxLength
            ? sanitized.substring(0, maxLength) + "..."
            : sanitized;
        }
        
        // Formatar última mensagem
        let previewText = "Sem mensagens recentes";
        if (lastEmployeeMsg) {
          const contentText = lastEmployeeMsg.text && String(lastEmployeeMsg.text).trim() !== ""
            ? String(lastEmployeeMsg.text).trim()
            : "";
          
          if (lastEmployeeMsg.type === "client") {
            const senderDisplay = lastEmployeeMsg.senderName || 
                                  lastEmployeeMsg.sender || 
                                  employee.fullName || 
                                  employee.username || 
                                  "Funcionário";
            previewText = contentText ? `${senderDisplay}: ${contentText}` : senderDisplay;
          } else {
            const senderDisplay = lastEmployeeMsg.senderName || lastEmployeeMsg.sender || "Você";
            previewText = contentText ? `${senderDisplay}: ${contentText}` : senderDisplay;
          }
        }
        
        employeeLastMessage.textContent = truncateEmployeePreview(previewText);

        employeeInfo.appendChild(employeeName);
        employeeInfo.appendChild(employeeLastMessage);

        employeeItem.appendChild(employeeAvatar);
        employeeItem.appendChild(employeeInfo);
        
        // Adicionar indicador de mensagens não lidas no canto direito inferior do box do funcionário
        if (unreadCount > 0) {
          const unreadIndicator = document.createElement("div");
          unreadIndicator.classList.add("employee-unread-indicator");
          
          // Criar badge com número (sem bolinha verde)
          const badge = document.createElement("span");
          badge.classList.add("unread-badge");
          badge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
          unreadIndicator.appendChild(badge);
          
          employeeItem.appendChild(unreadIndicator);
        }

        // Event delegation é usado no container employeesList
        // Não precisamos adicionar listeners individuais aqui

        employeesList.appendChild(employeeItem);
        console.log(`[renderEmployeesList] Funcionário ${index + 1} adicionado ao DOM:`, employeeItem);
      });
      
      // Verificar se os elementos foram adicionados corretamente
      const renderedEmployees = employeesList.querySelectorAll(".employee-item");
      console.log(`[renderEmployeesList] Total de elementos .employee-item no DOM: ${renderedEmployees.length}`);
      console.log(`[renderEmployeesList] Container está visível? ${!employeesListContainer.classList.contains("hidden")}`);
      console.log(`[renderEmployeesList] Estilos do container:`, window.getComputedStyle(employeesListContainer).display, window.getComputedStyle(employeesListContainer).visibility);
    }

    

    // Função para marcar mensagens como lidas

    // Função para contar mensagens não lidas do administrador para um contribuinte
    function getAdminUnreadCount(contributorId) {
      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      const adminMessages = messages.filter(msg => {
        if (msg.contributorId !== contributorId) return false;
        // Apenas mensagens do tipo "client" (recebidas do contribuinte) podem ser não lidas
        // Mensagens do tipo "support" são enviadas pelo suporte, não recebidas
        if (msg.type === "client") {
          const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
          const isEmployee = msg.senderRole === "employee";
          // Mensagens do admin: sem employeeId e sem senderRole "employee"
          const isAdminMessage = !hasEmployeeId && !isEmployee;
          return isAdminMessage && !msg.read;
        }
        return false;
      });
      return adminMessages.length;
    }

    // Função para contar mensagens não lidas de funcionários para um contribuinte
    function getEmployeesUnreadCount(contributorId) {
      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      const employeeMessages = messages.filter(msg => {
        if (msg.contributorId !== contributorId) return false;
        if (msg.type === "client") {
          const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
          const isEmployee = msg.senderRole === "employee";
          return hasEmployeeId && isEmployee && !msg.read;
        }
        return false;
      });
      return employeeMessages.length;
    }

    function markSupportMessagesAsRead(chatId) {

      const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      const chatData = supportChats[chatId];

      if (!chatData) return;
      
      // Determinar se é chat de funcionário ou do administrador
      const isChatEmployee = isEmployeeChatId(chatId);
      const contributorId = chatData.contributorId || getContributorIdFromChatId(chatId);
      const employeeId = chatData.employeeId || (isChatEmployee ? getEmployeeIdFromChatId(chatId) : null);

      let messagesMarked = 0;

      // Marcar mensagens como lidas no localStorage
      messages.forEach(msg => {
        // Apenas mensagens do tipo "client" (recebidas do contribuinte) podem ser marcadas como lidas
        if (msg.type !== "client") return;
        
        // Verificar se a mensagem pertence a este contribuinte
        if (msg.contributorId !== contributorId) return;

        // Para chat de funcionário: marcar mensagens deste funcionário específico
        if (isChatEmployee && employeeId) {
          const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
          const isEmployee = msg.senderRole === "employee";
          // Comparar employeeId como string para evitar problemas de tipo
          const msgEmployeeId = String(msg.employeeId || "");
          const targetEmployeeId = String(employeeId || "");
          // Marcar apenas mensagens deste funcionário específico
          if (hasEmployeeId && msgEmployeeId === targetEmployeeId && isEmployee) {
            if (!msg.read) {
          msg.read = true;
              messagesMarked++;
            }
          }
        } 
        // Para chat do administrador: marcar mensagens do administrador (sem employeeId e sem senderRole "employee")
        else if (!isChatEmployee) {
          const hasEmployeeId = msg.employeeId && msg.employeeId !== null && msg.employeeId !== undefined && msg.employeeId !== "";
          const isEmployee = msg.senderRole === "employee";
          // Marcar apenas mensagens do administrador (sem employeeId e sem senderRole "employee")
          if (!hasEmployeeId && !isEmployee) {
            if (!msg.read) {
              msg.read = true;
              messagesMarked++;
            }
          }
        }
      });

      // Salvar mensagens atualizadas no localStorage
      if (messagesMarked > 0) {
      localStorage.setItem("supportMessages", JSON.stringify(messages));
        
        // Atualizar também as mensagens no objeto chatData para refletir o estado de "lidas"
        if (chatData.messages && Array.isArray(chatData.messages)) {
          chatData.messages.forEach(msg => {
            if (msg.type === "client" && !msg.read) {
              // Verificar se esta mensagem foi marcada como lida no localStorage
              const updatedMsg = messages.find(m => 
                m.id === msg.id || 
                (m.timestamp === msg.timestamp && m.text === msg.text && m.contributorId === msg.contributorId)
              );
              if (updatedMsg && updatedMsg.read) {
                msg.read = true;
              }
            }
          });
        }
      }

      // Atualizar unreadCount no chat correspondente
        const chatMessages = chatData.messages || [];
        const unreadCount = chatMessages.filter(msg => {
          return msg.type === "client" && !msg.read;
        }).length;
        chatData.unreadCount = unreadCount;
        
        // Se for chat de funcionário, atualizar a lista de funcionários para refletir o novo contador
        if (chatData.contributorId && chatData.employeeId) {
          renderEmployeesList(chatData.contributorId);
      }

      // Atualizar lista de contatos para refletir os novos contadores
      updateSupportContactsList();

    }

    

    // ==================== FUNCIONALIDADE DE ANEXAR ARQUIVOS ====================

    

    // Variáveis para a pré-visualização inline

    const filePreviewInline = document.getElementById("filePreviewInline");

    const filePreviewContentInline = document.getElementById("filePreviewContentInline");

    const closePreviewInline = document.getElementById("closePreviewInline");

    let currentFile = null;

    let currentFileData = null;

    let isPreviewMode = false;

    

    // Verificar se os elementos existem

    if (!filePreviewInline || !filePreviewContentInline || !closePreviewInline) {

      console.error("Elementos da pré-visualização não encontrados!");

    }

    

    // Função para mostrar pré-visualização inline

    function showFilePreviewInline(file, fileData) {

      if (!filePreviewInline || !filePreviewContentInline) {

        console.error("Elementos da pré-visualização não encontrados!");

        return;

      }

      

      currentFile = file;

      currentFileData = fileData;

      isPreviewMode = true;

      

      // Limpar container

      filePreviewContentInline.innerHTML = "";

      

      // Criar pré-visualização baseada no tipo de arquivo

      if (isImageFile(file.name)) {

        const img = document.createElement("img");

        img.src = fileData;

        img.alt = file.name;

        filePreviewContentInline.appendChild(img);

      } else if (isVideoFile(file.name)) {

        const video = document.createElement("video");

        video.src = fileData;

        video.controls = true;

        filePreviewContentInline.appendChild(video);

      } else {

        // Documento

        const docDiv = document.createElement("div");

        docDiv.classList.add("file-preview-document-inline");

        

        const icon = document.createElement("div");

        icon.classList.add("file-preview-document-icon-inline");

        icon.innerHTML = `<i class='bx ${getFileIcon(file.name)}'></i>`;

        

        const info = document.createElement("div");

        info.classList.add("file-preview-document-info-inline");

        

        const name = document.createElement("div");

        name.classList.add("file-preview-document-name-inline");

        name.textContent = file.name;

        

        const size = document.createElement("div");

        size.classList.add("file-preview-document-size-inline");

        size.textContent = formatFileSize(file.size);

        

        info.appendChild(name);

        info.appendChild(size);

        docDiv.appendChild(icon);

        docDiv.appendChild(info);

        filePreviewContentInline.appendChild(docDiv);

      }

      

      // Mostrar pré-visualização inline

      filePreviewInline.style.display = "block";

      

      // Alterar placeholder do input para legenda

      if (messageInput) {

        messageInput.placeholder = "Adicione uma legenda ao arquivo...";

      }

    }

    

    // Função para fechar pré-visualização inline

    function closeFilePreviewInline() {

      if (filePreviewInline) {

        filePreviewInline.style.display = "none";

      }

      currentFile = null;

      currentFileData = null;

      isPreviewMode = false;

      if (fileInput) {

        fileInput.value = "";

      }

      if (messageInput) {

        messageInput.placeholder = "Digite uma mensagem...";

      }

    }

    

    // Função para enviar arquivo com legenda

    function sendFileWithCaption() {
      console.log('[sendFileWithCaption] Função chamada. currentFile:', !!currentFile, 'currentFileData:', !!currentFileData, 'currentSupportChatId:', currentSupportChatId);

      if (!currentFile || !currentFileData) {
        console.warn('[sendFileWithCaption] Retornando: currentFile ou currentFileData não existe');
        return;
      }

      const caption = messageInput.value.trim();
      const time = getCurrentTime();

        // Obter nome do usuário logado
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const userName = currentUser.fullName || currentUser.username || "Usuário";
        const userSector = currentUser.sector || "";

            // Verificar se é um chat de suporte
            if (currentSupportChatId) {
        console.log('[sendFileWithCaption] Chat de suporte detectado:', currentSupportChatId);

              // Obter o setor do chat atual
              const currentChat = supportChats[currentSupportChatId];
              const chatSector = currentChat ? currentChat.sector : userSector;

        // CRITICAL: Extrair contributorId e employeeId do chatId para garantir que a mensagem seja filtrada corretamente
        const isEmployeeChat = isEmployeeChatId(currentSupportChatId);
        const contributorId = currentChat?.contributorId || getContributorIdFromChatId(currentSupportChatId);
        const employeeId = isEmployeeChat ? (currentChat?.employeeId || getEmployeeIdFromChatId(currentSupportChatId)) : null;

              const messageData = {
                id: generateUniqueId(),
                chatId: currentSupportChatId,
                sender: userName,
                profileImage: "../../assets/images/avatars/profile-1.png",
                type: "support",
                sector: chatSector, // Adicionar setor à mensagem de arquivo
                time: time,
                timestamp: Date.now(),
                read: false,
          // CRITICAL: Adicionar campos necessários para filtragem
          contributorId: contributorId,
          targetEmployeeId: employeeId, // Para mensagens de suporte direcionadas a funcionários
                file: {
            name: currentFile.name,
            size: currentFile.size,
            type: currentFile.type,
            data: currentFileData // CRITICAL: Salvar file.data no localStorage
          }
        };
        
        console.log('[sendFileWithCaption] Mensagem de arquivo salva com campos:', {
          id: messageData.id,
          chatId: messageData.chatId,
          contributorId: messageData.contributorId,
          targetEmployeeId: messageData.targetEmployeeId,
          fileName: messageData.file.name,
          hasData: !!messageData.file.data
        });

              // Adicionar mensagem na interface
              const messageDiv = document.createElement("div");

              messageDiv.classList.add("message", "sent");

              // Removido message-sent-info do chat com contribuintes - o usuário já sabe com quem está conversando

        // Adicionar arquivo
        const fileElement = createFileElement(currentFile, currentFileData);

        messageDiv.appendChild(fileElement);

        // Adicionar legenda como texto separado se existir
        if (caption) {
          const captionDiv = document.createElement("span");
          captionDiv.textContent = caption;
          messageDiv.appendChild(captionDiv);
        }

              const timeDiv = document.createElement("span");

              timeDiv.classList.add("message-time");

              timeDiv.textContent = time;

              messageDiv.appendChild(timeDiv);

              messagesContainer.appendChild(messageDiv);

              messagesContainer.scrollTop = messagesContainer.scrollHeight;

              // Salvar no localStorage
              const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");

              messages.push(messageData);

              localStorage.setItem("supportMessages", JSON.stringify(messages));

              // Salvar no Firebase
              saveSupportMessageToFirebase(messageData);

              // Atualizar lista de contatos
              updateSupportContactsList();
              
              // Atualizar lista de funcionários do contribuinte ativo (se houver)
              updateActiveContributorEmployeesList();
              
              // Atualizar badges do sidebar
              updateSidebarBadges();
              
              // Atualizar lista de arquivos do perfil
              renderUserFiles();

            } else {
              // Contato normal
        console.log('[sendFileWithCaption] Contato normal detectado');

              const activeContact = document.querySelector(".contact.active:not(.support-contact)");

        if (!activeContact) {
          console.warn('[sendFileWithCaption] Nenhum contato ativo encontrado');
          return;
        }

              const contactId = activeContact.getAttribute("data-contact-id");
        console.log('[sendFileWithCaption] Contato ID:', contactId);

              const contact = contacts.find(c => c.id === parseInt(contactId));

        if (!contact) {
          console.warn('[sendFileWithCaption] Contato', contactId, 'não encontrado no array contacts');
          return;
        }
              
        console.log('[sendFileWithCaption] Contato encontrado:', contact.name);

              // Garantir que contact.messages seja um array
              if (!contact.messages) {
                contact.messages = [];
              }
              
              const timestamp = Date.now();
              
              contact.messages.push({ 
                type: "sent", 
          time: time,
                timestamp: timestamp,
                file: {
              name: currentFile.name,
              size: currentFile.size,
              type: currentFile.type,
              data: currentFileData
            },
            caption: caption
              });
              
              // Salvar mensagem de arquivo no localStorage para persistência
              try {
                const messageData = {
                  id: generateUniqueId(),
            chatId: 'chat_contact_' + contact.id,
                  contactId: contact.id.toString(),
                  text: caption || '[Arquivo]',
                  type: "sent",
                  sender: userName,
                  time: time,
                  timestamp: timestamp,
                  file: {
                    name: currentFile.name,
                    size: currentFile.size,
                    type: currentFile.type,
              data: currentFileData // CRITICAL: Salvar file.data no localStorage
            }
          };
          
          console.log('[sendFileWithCaption] Salvando mensagem com arquivo no localStorage:', {
            id: messageData.id,
            timestamp: messageData.timestamp,
            fileName: messageData.file.name,
            hasData: !!messageData.file.data,
            dataLength: messageData.file.data ? messageData.file.data.length : 0
          });
                
                const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
                allMessages.push(messageData);
                localStorage.setItem("supportMessages", JSON.stringify(allMessages));
          
          console.log('[sendFileWithCaption] Mensagem salva no localStorage. Total de mensagens:', allMessages.length);
                
                // Atualizar lista de arquivos do perfil
                renderUserFiles();
              } catch (error) {
                console.warn("Erro ao salvar mensagem de arquivo no localStorage:", error);
              }

              const messageDiv = document.createElement("div");

              messageDiv.classList.add("message", "sent");

              const infoDiv = document.createElement("span");

              infoDiv.classList.add("message-sent-info");

              infoDiv.textContent = userName;

              messageDiv.appendChild(infoDiv);

        // Adicionar arquivo
          const fileElement = createFileElement(currentFile, currentFileData);

          messageDiv.appendChild(fileElement);

          // Adicionar legenda como texto separado se existir
          if (caption) {
            const captionDiv = document.createElement("span");
            captionDiv.textContent = caption;
            messageDiv.appendChild(captionDiv);
          }

              const timeDiv = document.createElement("span");

              timeDiv.classList.add("message-time");

              timeDiv.textContent = time;

              messageDiv.appendChild(timeDiv);

              messagesContainer.appendChild(messageDiv);

              messagesContainer.scrollTop = messagesContainer.scrollHeight;

        activeContact.querySelector(".contact-info p").textContent = 'Enviado: ' + currentFile.name;

      }

      

      // Limpar input de mensagem

      if (messageInput) {

        messageInput.value = "";

      }

      

      // Fechar pré-visualização inline

      closeFilePreviewInline();

    }

    

    // Eventos da pré-visualização inline

    if (closePreviewInline) {

      closePreviewInline.addEventListener("click", closeFilePreviewInline);

    }

    

    // ==================== FUNCIONALIDADE DE EMOJIS ====================

    

    // Variáveis para emojis

    const emojiButton = document.getElementById("emojiButton");

    const emojiPanel = document.getElementById("emojiPanel");

    const emojiGrid = document.getElementById("emojiGrid");

    const emojiCategories = document.querySelectorAll(".emoji-category");

    

    // Verificar se os elementos de emoji existem

    if (!emojiButton || !emojiPanel || !emojiGrid) {

      console.error("Elementos de emoji não encontrados!", {

        emojiButton: emojiButton,

        emojiPanel: emojiPanel,

        emojiGrid: emojiGrid

      });

    }

    

    // Coleção completa de Noto Emoji Animation

    // Fonte: https://googlefonts.github.io/noto-emoji-animation/

    const emojiData = {

      smileys: [

        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '🫠', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', 

        '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡',

        '🤐', '🤨', '😐', '😑', '😶', '🫥', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', 

        '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',

        '🧐', '😕', '🫤', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', 

        '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', 

        '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'

      ],

      hearts: [

        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗',

        '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', 

        '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚',

        '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️'

      ],

      gestures: [

        '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙',

        '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲',

        '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴',

        '👀', '👁️', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍🦰', '👨‍🦱',

        '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️'

      ],

      animals: [

        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈',

        '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', 

        '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖',

        '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓',

        '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑',

        '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', 

        '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲',

        '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🪺', '🪹'

      ],

      food: [

        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆',

        '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🫘', '🥐', '🍞', '🥖', '🥨',

        '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙',

        '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙',

        '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',

        '🍿', '🍩', '🍪', '🌰', '🥜', '🫘', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻',

        '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'

      ],

      objects: [

        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏑', '🏒', '🥍', '🏏', '🪃',

        '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥽', '🥼', '🦺', '⛷️', '🏂', '🪂', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🤼', '🤼‍♂️',

        '🤼‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🤺', '🤾', '🤾‍♂️', '🤾‍♀️', '🏌️', '🏌️‍♂️', '🏌️‍♀️',

        '🏇', '🧘', '🧘‍♂️', '🧘‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🚣', '🚣‍♂️',

        '🚣‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🏆', '🥇', '🥈', '🥉', '🏅',

        '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🤹‍♂️', '🤹‍♀️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',

        '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎯',

        '🎳', '🎮', '🎰', '🧩', '🪩', '🪀', '🪁', '🎏', '🎐', '🎀', '🎁', '🎊', '🎉', '🎈', '🎂', '🎆', '🎇', '🧨',

        '✨', '🎄', '🎋', '🎍', '🎑', '🎎', '🎏', '🎐', '🎀', '🧧', '🎁', '🎀', '🪄', '🪅', '🪆'

      ]

    };

    

    // Função para renderizar emojis com Noto Animation

    function renderEmojis(category) {

      if (!emojiGrid) {

        console.error("Grid de emojis não encontrado!");

        return;

      }

      

      emojiGrid.innerHTML = "";

      const emojis = emojiData[category] || emojiData.smileys;

      

      console.log(`🎨 Renderizando ${emojis.length} emojis animados da categoria: ${category}`);

      

      // Atualizar contador no header

      const emojiCountElement = document.getElementById('emojiPanelCount');

      if (emojiCountElement) {

        emojiCountElement.textContent = `${emojis.length} emojis`;

      }

      

      emojis.forEach((emoji, index) => {

        const emojiBtn = document.createElement("button");

        emojiBtn.classList.add("emoji-item", "noto-emoji-animated");

        emojiBtn.textContent = emoji;

        emojiBtn.style.animationDelay = `${index * 0.008}s`;

        emojiBtn.title = emoji; // Tooltip com o emoji

        

        // Adicionar atributo para acessibilidade

        emojiBtn.setAttribute('aria-label', `Emoji ${emoji}`);

        

        emojiBtn.addEventListener("click", (e) => {

          e.stopPropagation();

          insertEmoji(emoji);

          

          // Feedback visual aprimorado

          emojiBtn.style.transform = "scale(1.6) rotate(15deg)";

          emojiBtn.style.filter = "brightness(1.3)";

          setTimeout(() => {

            emojiBtn.style.transform = "";

            emojiBtn.style.filter = "";

          }, 250);

          

          // Efeito de partículas ao clicar

          createEmojiParticles(emojiBtn, emoji);

          

          // Fechar painel após selecionar

          setTimeout(() => {

            if (emojiPanel) {

              emojiPanel.style.display = "none";

            }

          }, 350);

        });

        

        emojiGrid.appendChild(emojiBtn);

      });

      

      console.log(`✅ ${emojis.length} emojis Noto renderizados com sucesso!`);

    }

    

    // Função para criar efeito de partículas ao clicar no emoji

    function createEmojiParticles(button, emoji) {

      const rect = button.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;

      const centerY = rect.top + rect.height / 2;

      

      // Criar 3-5 partículas pequenas

      const particleCount = 3 + Math.floor(Math.random() * 3);

      

      for (let i = 0; i < particleCount; i++) {

        const particle = document.createElement('div');

        particle.textContent = emoji;

        particle.style.cssText = `

          position: fixed;

          left: ${centerX}px;

          top: ${centerY}px;

          font-size: 16px;

          font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;

          pointer-events: none;

          z-index: 10000;

          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);

          opacity: 1;

        `;

        

        document.body.appendChild(particle);

        

        // Animar partícula

        const angle = (Math.PI * 2 * i) / particleCount;

        const distance = 40 + Math.random() * 30;

        const x = Math.cos(angle) * distance;

        const y = Math.sin(angle) * distance;

        

        requestAnimationFrame(() => {

          particle.style.transform = `translate(${x}px, ${y}px) scale(0.3) rotate(${Math.random() * 360}deg)`;

          particle.style.opacity = '0';

        });

        

        // Remover após animação

        setTimeout(() => particle.remove(), 600);

      }

    }

    

    // Função para inserir emoji no input

    function insertEmoji(emoji) {

      if (!messageInput) {

        console.error("Input de mensagem não encontrado!");

        return;

      }

      

      const cursorPos = messageInput.selectionStart;

      const textBefore = messageInput.value.substring(0, cursorPos);

      const textAfter = messageInput.value.substring(cursorPos);

      

      messageInput.value = textBefore + emoji + textAfter;

      messageInput.focus();

      messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

    }

    

    // Eventos dos emojis com Noto Animation

    if (emojiButton && emojiPanel) {

      emojiButton.addEventListener("click", (e) => {

        e.preventDefault();

        e.stopPropagation();

        console.log("🎨 Abrindo painel de Noto Emoji Animation...");

        const isVisible = emojiPanel.style.display === "block";

        emojiPanel.style.display = isVisible ? "none" : "block";

        

        if (emojiPanel.style.display === "block") {

          // Renderizar categoria ativa

          const activeCategory = document.querySelector('.emoji-category.active');

          const categoryName = activeCategory ? activeCategory.getAttribute('data-category') : 'smileys';

          renderEmojis(categoryName);

          

          console.log(`✨ Painel Noto Emoji aberto com ${emojiData[categoryName].length} emojis!`);

        }

      });

    } else {

      console.error("Botão ou painel de emojis não encontrado para adicionar evento!");

    }

    

    if (emojiCategories.length > 0) {

      emojiCategories.forEach(category => {

        category.addEventListener("click", (e) => {

          e.stopPropagation();

          

          // Remover ativo de todas e adicionar na clicada

          emojiCategories.forEach(c => c.classList.remove("active"));

          category.classList.add("active");

          

          // Renderizar nova categoria

          const categoryName = category.getAttribute("data-category");

          console.log(`🔄 Trocando para categoria: ${categoryName}`);

          renderEmojis(categoryName);

          

          // Efeito visual de troca

          emojiGrid.style.opacity = '0';

          emojiGrid.style.transform = 'scale(0.95)';

          setTimeout(() => {

            emojiGrid.style.transition = 'all 0.3s ease';

            emojiGrid.style.opacity = '1';

            emojiGrid.style.transform = 'scale(1)';

          }, 50);

        });

      });

    }

    

    // Fechar painel de emojis ao clicar fora

    document.addEventListener("click", (e) => {

      if (emojiButton && emojiPanel && !emojiButton.contains(e.target) && !emojiPanel.contains(e.target)) {

        emojiPanel.style.display = "none";

      }

    });

    

    // Evento do botão de anexar

    if (attachButton && fileInput) {

      attachButton.addEventListener("click", () => {

        fileInput.click();

      });

      

      // Evento quando arquivo é selecionado

      fileInput.addEventListener("change", async (e) => {

        const files = e.target.files;

        if (!files || files.length === 0) return;

        

        const file = files[0];

        

        try {

          const fileData = await fileToBase64(file);

          showFilePreviewInline(file, fileData);

        } catch (error) {

          showToast("Erro ao processar arquivo", "error");

          console.error(error);

        }

      });

    }

    

    // ==================== FIM FUNCIONALIDADE DE ANEXAR ARQUIVOS ====================

    

    // Armazenar listeners ativos para evitar duplicatas

    let activeChatListener = null;

    let activeListeners = new Set();

    

    // Função para limpar listeners

    function cleanupListeners() {

      activeListeners.forEach(listener => {

        if (listener && typeof listener.off === 'function') {

          listener.off();

        }

      });

      activeListeners.clear();

    }
    
    // Função para limpar intervalos (acessível globalmente)
    function cleanupAllIntervals() {
      if (typeof cleanupIntervals === 'function') {
        cleanupIntervals();
      }
    }
    
    // Função para limpar tudo (listeners e intervalos)
    function cleanupAll() {
      cleanupListeners();
      cleanupAllIntervals();
    }

    // Limpar listeners e intervalos ao sair da página

    window.addEventListener('beforeunload', cleanupAll);

    window.addEventListener('pagehide', cleanupAll);

    

    // Firebase removido - listener em tempo real desabilitado
    // O sistema agora usa verificações periódicas para novas mensagens
    function startRealtimeChatListener(chatId) {
      // Firebase removido - usar apenas localStorage
      // Novas mensagens serão detectadas via checkForNewSupportMessages()
    }

    

    // Verificar novas mensagens de suporte periodicamente

    function checkForNewSupportMessages() {

      const lastCheck = localStorage.getItem("lastSupportCheck") || "0";

      const currentTime = Date.now().toString();

      

      const newMessageNotification = localStorage.getItem("newSupportMessage");

      

      if (newMessageNotification && parseInt(newMessageNotification) > parseInt(lastCheck)) {

        updateSupportContactsList();

        

        // Recarregar chat aberto para refletir novas mensagens (Suporte -> Chat)

        if (currentSupportChatId && typeof loadSupportChat === "function") {

          loadSupportChat(currentSupportChatId);

        }

      }

      

      localStorage.setItem("lastSupportCheck", currentTime);

    }

    

    // Carregar contatos de suporte inicialmente

    updateSupportContactsList();

    
    window.addEventListener("storage", (event) => {
      // Atualizações relacionadas a suporte (mensagens e contatos)
      if (event.key === "supportMessages" || event.key === "newSupportMessage" || event.key === "contributorContacts" || event.key === "contributorContactsUpdatedAt") {
        updateSupportContactsList();
        // Se um chat de suporte estiver aberto, recarregar o chat atual para refletir novas mensagens quase em tempo real
        if ((event.key === "supportMessages" || event.key === "newSupportMessage") && currentSupportChatId && typeof loadSupportChat === "function") {
          loadSupportChat(currentSupportChatId);
        }
        
        // CRITICAL: Atualizar chat de contatos normais quando uma nova mensagem chega
        // Verificar se há um contato normal ativo (não suporte)
        if ((event.key === "supportMessages" || event.key === "newSupportMessage")) {
          const activeContact = document.querySelector(".contact.active:not(.support-contact)");
          if (activeContact) {
            const contactId = activeContact.getAttribute("data-contact-id");
            if (contactId && typeof updateChat === "function") {
              // Atualizar o chat preservando file.data das mensagens existentes
              updateChat(contactId);
            }
          }
        }
      }
      
      if ((event.key === "contributors" || event.key === "contributorsUpdatedAt") && typeof renderContributorsList === "function") {
        renderContributorsList();
      }
      
      if ((event.key === "users" || event.key === "usersUpdatedAt") && typeof renderUsersList === "function") {
        // Evitar renderização em loop: só renderizar se o painel admin estiver ativo
        const adminContainer = document.querySelector(".admin-container");
        if (adminContainer && adminContainer.classList.contains("active")) {
          // Usar debounce para evitar renderizações em cascata
          clearTimeout(window.renderUsersListTimeout);
          window.renderUsersListTimeout = setTimeout(() => {
            renderUsersList();
          }, 100);
        }
      }
    });
    

    // Firebase removido - listeners em tempo real desabilitados
    // O sistema agora funciona apenas com localStorage e verificações periódicas

    

    // Verificar novas mensagens a cada 2 segundos (fallback)
    createManagedInterval(checkForNewSupportMessages, 2000);

    // Atualizar lista de contatos a cada 5 segundos
    createManagedInterval(() => {
      const chatContainer = document.querySelector(".chat-container");
      if (chatContainer && !chatContainer.classList.contains("hidden")) {
        updateSupportContactsList();
      }
    }, 5000);

    // Verificar tarefas de hoje periodicamente (a cada 1 minuto)
    createManagedInterval(() => {
      if (typeof checkTodayTasks === 'function') {
        checkTodayTasks();
      }
    }, 60000);

    

    // Atualizar contatos ao trocar de seção

    sidebarButtons.forEach(button => {

      button.addEventListener("click", () => {

        if (button.getAttribute("data-section") === "chat") {

          updateSupportContactsList();

        } else {

          // Ao sair da seção de chat, limpar o listener ativo

          if (activeChatListener) {

            activeChatListener.off();

            activeChatListener = null;

          }

          currentSupportChatId = null;

        }

      });

    });

    

    // ==================== CHAT REPORT FUNCTIONALITY ====================

    

    const scheduledMessageContainer = document.querySelector(".scheduled-message-container");

    const contactSelectorButton = document.getElementById("contactSelectorButton");

    const contactSelectorDropdown = document.getElementById("contactSelectorDropdown");

    const contactSelectorList = document.getElementById("contactSelectorList");

    const contactSearchInput = document.getElementById("contactSearchInput");

    const datetimeSelectorButton = document.getElementById("datetimeSelectorButton");

    const datetimeSelectorDropdown = document.getElementById("datetimeSelectorDropdown");

    const closeDatetimePicker = document.getElementById("closeDatetimePicker");

    const scheduleStartCalendarGrid = document.getElementById("scheduleStartCalendarGrid");

    const scheduleEndCalendarGrid = document.getElementById("scheduleEndCalendarGrid");

    const scheduleStartMonthYear = document.getElementById("scheduleStartMonthYear");

    const scheduleEndMonthYear = document.getElementById("scheduleEndMonthYear");

    const reportStartDateDisplay = document.getElementById("reportStartDateDisplay");

    const reportEndDateDisplay = document.getElementById("reportEndDateDisplay");

    const applyDatetimeBtn = document.getElementById("applyDatetimeBtn");

    const clearDatetimeBtn = document.getElementById("clearDatetimeBtn");

    const generateReportBtn = document.getElementById("generateReportBtn");

    const downloadPdfBtn = document.getElementById("downloadPdfBtn");

    const reportPreview = document.getElementById("reportPreview");

    const reportPreviewContent = document.getElementById("reportPreviewContent");

    const reportMessageCount = document.getElementById("reportMessageCount");

    

    let selectedContact = null;
    
    let selectedEmployee = null;

    let reportStartDate = null;

    let reportEndDate = null;
    
    // Elementos do seletor de funcionário
    const employeeSelectorField = document.getElementById("employeeSelectorField");
    const employeeSelectorButton = document.getElementById("employeeSelectorButton");
    const employeeSelectorDropdown = document.getElementById("employeeSelectorDropdown");
    const employeeSelectorList = document.getElementById("employeeSelectorList");
    const employeeSearchInput = document.getElementById("employeeSearchInput");

    let scheduleStartCalendarMonth = new Date().getMonth();

    let scheduleStartCalendarYear = new Date().getFullYear();

    let scheduleEndCalendarMonth = new Date().getMonth();

    let scheduleEndCalendarYear = new Date().getFullYear();

    let currentReportData = null;

    

    // Função para carregar contatos no seletor
    // Usa apenas os contatos que estão realmente disponíveis na lista principal
    function loadContactsSelector() {

      if (!contactSelectorList) return;

      

      contactSelectorList.innerHTML = "";

      // Obter contatos normais (da lista principal)
      const contactsList = document.querySelector('.contacts-list');
      const normalContactsInList = contactsList ? contactsList.querySelectorAll('.contact:not(.support-contact)') : [];
      
      normalContactsInList.forEach(contactElement => {
        const contactId = contactElement.getAttribute('data-contact-id');
        const contactName = contactElement.querySelector('.contact-name')?.textContent || 'Contato';
        const contactImage = contactElement.querySelector('img')?.src || null;
        
        // Encontrar o contato completo no array contacts
        const fullContact = contacts.find(c => c.id === parseInt(contactId));
        if (fullContact) {
          const item = createContactSelectorItem(
            fullContact.id, 
            fullContact.name, 
            fullContact.image, 
            'Contato', 
            'normal'
          );
          contactSelectorList.appendChild(item);
        }
      });

      // Obter contatos de suporte que estão realmente na lista principal
      const supportContactsInList = contactsList ? contactsList.querySelectorAll('.contact.support-contact') : [];
      
      supportContactsInList.forEach(contactElement => {
        const chatId = contactElement.getAttribute('data-support-chat-id');
        if (chatId && supportChats[chatId]) {
          const chatData = supportChats[chatId];
          
          // Verificar se é um contato válido (isContactOnly e tem contributorId ativo)
          if (chatData.isContactOnly && chatData.contributorId) {
            // Verificar se o contribuinte ainda está ativo
            const contributorExists = typeof getContributorsFromStorage === "function" &&
              getContributorsFromStorage().some(c => 
                c.id === chatData.contributorId && (c.status || "active") === "active"
              );
            
            if (contributorExists) {
              const item = createContactSelectorItem(
                chatId, 
                chatData.clientName, 
                null, 
                'Suporte', 
                'support'
              );
              contactSelectorList.appendChild(item);
            }
          }
        }
      });

    }

    

    // Função para criar item de contato no seletor

    function createContactSelectorItem(id, name, image, type, contactType) {
      // Validar nome primeiro antes de usar
      const safeName = (name && typeof name === 'string' && String(name).trim() !== '') 
        ? String(name).trim() 
        : '?';
      const safeInitial = (safeName && safeName.length > 0) 
        ? safeName.charAt(0).toUpperCase() 
        : '?';

      const item = document.createElement("div");

      item.classList.add("contact-selector-item");

      item.setAttribute("data-contact-id", id);

      item.setAttribute("data-contact-type", contactType);

      

      // Criar avatar

      let avatarHTML = '';

      if (image && contactType === 'normal') {

        avatarHTML = `<img src="${image}" onerror="this.src='${getPlaceholderAvatarDataUri(36, safeInitial)}'" alt="${safeName}">`;

      } else {

        // Criar avatar com inicial

        const color = getColorFromName(safeName);

        avatarHTML = `<div class="avatar-initial" style="width: 36px; height: 36px; min-width: 36px; min-height: 36px; max-width: 36px; max-height: 36px; font-size: 16px; background: ${color}; border-radius: 8px;">${safeInitial}</div>`;

      }

      

      item.innerHTML = `

        ${avatarHTML}

        <div class="contact-selector-item-info">

          <h5>${name}</h5>

          <p>${type}</p>

        </div>

        <i class='bx bx-check'></i>

      `;

      

      // Evento de clique

      item.addEventListener("click", () => {

        selectContact(id, name, contactType);

      });

      

      return item;

    }

    

    // Função para selecionar contato

    function selectContact(id, name, type) {

      selectedContact = { id, name, type };
      
      // Resetar seleção de funcionário quando mudar de contato
      selectedEmployee = null;
      const employeeDisplay = document.querySelector(".selected-employee-display");
      if (employeeDisplay) {
        employeeDisplay.textContent = "Selecione um funcionário...";
        employeeDisplay.classList.remove("has-selection");
      }

      

      // Atualizar display

      const display = document.querySelector(".selected-contact-display");

      if (display) {

        display.textContent = name;

        display.classList.add("has-selection");

      }

      

      // Atualizar itens selecionados

      document.querySelectorAll(".contact-selector-item").forEach(item => {

        if (item.getAttribute("data-contact-id") === id.toString()) {

          item.classList.add("selected");

        } else {

          item.classList.remove("selected");

        }

      });

      

      // Fechar dropdown

      contactSelectorDropdown.classList.remove("active");

      contactSelectorButton.classList.remove("active");
      
      // Se for um contato de suporte, mostrar campo de seleção de funcionário
      if (type === 'support') {
        // Extrair contributorId do chatId
        const contributorId = getContributorIdFromChatId(id);
        if (contributorId && employeeSelectorField) {
          employeeSelectorField.style.display = "block";
          loadEmployeesSelector(contributorId);
        } else {
          // Se não conseguir extrair contributorId, esconder campo
          if (employeeSelectorField) {
            employeeSelectorField.style.display = "none";
          }
        }
      } else {
        // Se não for contato de suporte, esconder campo de funcionário
        if (employeeSelectorField) {
          employeeSelectorField.style.display = "none";
        }
      }

      

      console.log(`✅ Contato selecionado: ${name} (${type})`);

    }
    
    // Função para carregar funcionários no seletor
    function loadEmployeesSelector(contributorId) {
      if (!employeeSelectorList) return;
      
      employeeSelectorList.innerHTML = "";
      
      // Obter funcionários do contribuinte
      const employees = getEmployeesByContributorId(contributorId);
      
      if (employees.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.classList.add("contact-selector-item", "empty-message");
        emptyMessage.textContent = "Nenhum funcionário encontrado para este contribuinte";
        employeeSelectorList.appendChild(emptyMessage);
        return;
      }
      
      // Adicionar opção "Administrador" (chat do administrador)
      const adminItem = document.createElement("div");
      adminItem.classList.add("contact-selector-item");
      adminItem.setAttribute("data-employee-id", "admin");
      adminItem.setAttribute("data-employee-type", "admin");
      
      const adminColor = getColorFromName("Administrador");
      adminItem.innerHTML = `
        <div class="avatar-initial" style="width: 36px; height: 36px; min-width: 36px; min-height: 36px; max-width: 36px; max-height: 36px; font-size: 16px; background: ${adminColor}; border-radius: 8px;">A</div>
        <div class="contact-selector-item-info">
          <h5>Administrador</h5>
          <p>Chat do administrador do contribuinte</p>
        </div>
        <i class='bx bx-check'></i>
      `;
      
      adminItem.addEventListener("click", () => {
        selectEmployee("admin", "Administrador", "admin");
      });
      
      employeeSelectorList.appendChild(adminItem);
      
      // Adicionar funcionários
      employees.forEach(employee => {
        const employeeItem = createEmployeeSelectorItem(employee);
        employeeSelectorList.appendChild(employeeItem);
      });
    }
    
    // Função para criar item de funcionário no seletor
    function createEmployeeSelectorItem(employee) {
      const employeeName = employee.fullName || employee.username || "Funcionário";
      const safeName = (employeeName && typeof employeeName === 'string' && String(employeeName).trim() !== '') 
        ? String(employeeName).trim() 
        : 'Funcionário';
      const safeInitial = (safeName && safeName.length > 0) 
        ? safeName.charAt(0).toUpperCase() 
        : 'F';
      
      const item = document.createElement("div");
      item.classList.add("contact-selector-item");
      item.setAttribute("data-employee-id", employee.id);
      item.setAttribute("data-employee-type", "employee");
      
      const color = getColorFromName(safeName);
      item.innerHTML = `
        <div class="avatar-initial" style="width: 36px; height: 36px; min-width: 36px; min-height: 36px; max-width: 36px; max-height: 36px; font-size: 16px; background: ${color}; border-radius: 8px;">${safeInitial}</div>
        <div class="contact-selector-item-info">
          <h5>${employeeName}</h5>
          <p>Funcionário</p>
        </div>
        <i class='bx bx-check'></i>
      `;
      
      item.addEventListener("click", () => {
        selectEmployee(employee.id, employeeName, "employee");
      });
      
      return item;
    }
    
    // Função para selecionar funcionário
    function selectEmployee(id, name, type) {
      selectedEmployee = { id, name, type };
      
      // Atualizar display
      const display = document.querySelector(".selected-employee-display");
      if (display) {
        display.textContent = name;
        display.classList.add("has-selection");
      }
      
      // Atualizar itens selecionados
      document.querySelectorAll("#employeeSelectorList .contact-selector-item").forEach(item => {
        if (item.getAttribute("data-employee-id") === id.toString()) {
          item.classList.add("selected");
        } else {
          item.classList.remove("selected");
        }
      });
      
      // Fechar dropdown
      if (employeeSelectorDropdown) {
        employeeSelectorDropdown.classList.remove("active");
      }
      if (employeeSelectorButton) {
        employeeSelectorButton.classList.remove("active");
      }
      
      console.log(`✅ Funcionário selecionado: ${name} (${type})`);
    }

    

    // Toggle do seletor de contatos

    if (contactSelectorButton) {

      contactSelectorButton.addEventListener("click", (e) => {

        e.stopPropagation();

        contactSelectorDropdown.classList.toggle("active");

        contactSelectorButton.classList.toggle("active");
        
        // Fechar dropdown de funcionário se estiver aberto
        if (employeeSelectorDropdown) {
          employeeSelectorDropdown.classList.remove("active");
        }
        if (employeeSelectorButton) {
          employeeSelectorButton.classList.remove("active");
        }

      });

    }
    
    // Toggle do seletor de funcionários
    if (employeeSelectorButton) {
      employeeSelectorButton.addEventListener("click", (e) => {
        e.stopPropagation();
        
        // Só abrir se um contato de suporte estiver selecionado
        if (!selectedContact || selectedContact.type !== 'support') {
          showToast("Selecione um contato de suporte primeiro", "error");
          return;
        }
        
        employeeSelectorDropdown.classList.toggle("active");
        employeeSelectorButton.classList.toggle("active");
        
        // Fechar dropdown de contatos se estiver aberto
        if (contactSelectorDropdown) {
          contactSelectorDropdown.classList.remove("active");
        }
        if (contactSelectorButton) {
          contactSelectorButton.classList.remove("active");
        }
      });
    }
    
    // Busca de funcionários
    if (employeeSearchInput) {
      employeeSearchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const items = employeeSelectorList.querySelectorAll(".contact-selector-item");
        
        items.forEach(item => {
          const name = item.querySelector("h5")?.textContent?.toLowerCase() || "";
          if (name.includes(searchTerm)) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
    }

    

    // Impedir que cliques dentro do dropdown o fechem

    if (datetimeSelectorDropdown) {

      datetimeSelectorDropdown.addEventListener('click', (e) => {

        e.stopPropagation();

      });

    }

    

    if (contactSelectorDropdown) {

      contactSelectorDropdown.addEventListener('click', (e) => {

        e.stopPropagation();

      });

    }
    
    // Impedir que cliques dentro do dropdown de funcionário o fechem
    if (employeeSelectorDropdown) {
      employeeSelectorDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    

    // Fechar dropdown ao clicar fora

    document.addEventListener("click", (e) => {

      if (contactSelectorDropdown && 

          !contactSelectorDropdown.contains(e.target) && 

          e.target !== contactSelectorButton &&

          !contactSelectorButton.contains(e.target)) {

        contactSelectorDropdown.classList.remove("active");

        contactSelectorButton.classList.remove("active");

      }
      
      if (employeeSelectorDropdown && 

          !employeeSelectorDropdown.contains(e.target) && 

          e.target !== employeeSelectorButton &&

          !employeeSelectorButton.contains(e.target)) {

        employeeSelectorDropdown.classList.remove("active");

        employeeSelectorButton.classList.remove("active");

      }

      

      if (datetimeSelectorDropdown && 

          !datetimeSelectorDropdown.contains(e.target) && 

          e.target !== datetimeSelectorButton &&

          !datetimeSelectorButton.contains(e.target)) {

        datetimeSelectorDropdown.classList.remove("active");

        datetimeSelectorButton.classList.remove("active");

      }

    });

    

    // Busca de contatos

    if (contactSearchInput) {

      contactSearchInput.addEventListener("input", (e) => {

        const searchTerm = e.target.value.toLowerCase();

        const items = contactSelectorList.querySelectorAll(".contact-selector-item");

        

        items.forEach(item => {

          const name = item.querySelector("h5").textContent.toLowerCase();

          if (name.includes(searchTerm)) {

            item.style.display = "flex";

          } else {

            item.style.display = "none";

          }

        });

      });

    }

    

    // ==================== SELETOR DE INTERVALO DE DATAS ====================

    

    // Toggle do seletor de data

    if (datetimeSelectorButton) {

      datetimeSelectorButton.addEventListener("click", (e) => {

        e.stopPropagation();

        datetimeSelectorDropdown.classList.toggle("active");

        datetimeSelectorButton.classList.toggle("active");

        

        if (datetimeSelectorDropdown.classList.contains("active")) {

          generateReportCalendar('start');

          generateReportCalendar('end');

        }

      });

    }

    

    // Fechar seletor de data

    if (closeDatetimePicker) {

      closeDatetimePicker.addEventListener("click", (e) => {

        e.stopPropagation();

        datetimeSelectorDropdown.classList.remove("active");

        datetimeSelectorButton.classList.remove("active");

      });

    }

    

    // Função para gerar calendário do relatório

    function generateReportCalendar(type) {

      const grid = type === 'start' ? scheduleStartCalendarGrid : scheduleEndCalendarGrid;

      const month = type === 'start' ? scheduleStartCalendarMonth : scheduleEndCalendarMonth;

      const year = type === 'start' ? scheduleStartCalendarYear : scheduleEndCalendarYear;

      const monthYearDisplay = type === 'start' ? scheduleStartMonthYear : scheduleEndMonthYear;

      

      if (!grid) return;

      

      // Atualizar título

      if (monthYearDisplay) {

        monthYearDisplay.textContent = `${monthNamesLong[month]} ${year}`;

      }

      

      // Limpar grid (manter headers)

      const headers = grid.querySelectorAll('.schedule-day-header');

      grid.innerHTML = '';

      headers.forEach(header => grid.appendChild(header));

      

      // Calcular dias

      const firstDay = new Date(year, month, 1).getDay();

      const lastDate = new Date(year, month + 1, 0).getDate();

      const prevLastDate = new Date(year, month, 0).getDate();

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      

      // Dias do mês anterior

      for (let i = firstDay - 1; i >= 0; i--) {

        const day = document.createElement('div');

        day.classList.add('schedule-calendar-day', 'other-month');

        day.textContent = prevLastDate - i;

        grid.appendChild(day);

      }

      

      // Dias do mês atual

      for (let i = 1; i <= lastDate; i++) {

        const day = document.createElement('div');

        day.classList.add('schedule-calendar-day');

        day.textContent = i;

        

        const currentDate = new Date(year, month, i);

        currentDate.setHours(0, 0, 0, 0);

        

        // Marcar dia de hoje

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {

          day.classList.add('today');

        }

        

        // Marcar dias selecionados

        if (reportStartDate && currentDate.getTime() === reportStartDate.getTime()) {

          day.classList.add('selected');

        }

        if (reportEndDate && currentDate.getTime() === reportEndDate.getTime()) {

          day.classList.add('selected');

        }

        

        // Marcar dias no intervalo

        if (reportStartDate && reportEndDate && 

            currentDate > reportStartDate && currentDate < reportEndDate) {

          day.classList.add('in-range');

        }

        

        // Desabilitar datas inválidas

        if (type === 'end' && reportStartDate && currentDate < reportStartDate) {

          day.classList.add('disabled');

        }

        

        // Evento de clique

        day.addEventListener('click', () => {

          if (day.classList.contains('disabled') || day.classList.contains('other-month')) {

            return;

          }

          selectReportDate(type, currentDate);

        });

        

        grid.appendChild(day);

      }

      

      // Completar grid

      const totalCells = grid.children.length - 7;

      const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

      for (let i = 1; i <= remainingCells; i++) {

        const day = document.createElement('div');

        day.classList.add('schedule-calendar-day', 'other-month');

        day.textContent = i;

        grid.appendChild(day);

      }

    }

    

    // Função para selecionar data do relatório

    function selectReportDate(type, date) {

      if (type === 'start') {

        reportStartDate = date;

        // Se data inicial for maior que final, limpar data final

        if (reportEndDate && reportStartDate > reportEndDate) {

          reportEndDate = null;

          if (reportEndDateDisplay) reportEndDateDisplay.textContent = 'Selecione';

        }

        if (reportStartDateDisplay) reportStartDateDisplay.textContent = formatDateDisplay(date);

        console.log(`📅 Data inicial selecionada: ${formatDateDisplay(date)}`);

      } else {

        // Só permitir selecionar data final se houver data inicial

        if (!reportStartDate) {

          console.warn('⚠️ Selecione primeiro a data inicial');

          return;

        }

        reportEndDate = date;

        if (reportEndDateDisplay) reportEndDateDisplay.textContent = formatDateDisplay(date);

        console.log(`📅 Data final selecionada: ${formatDateDisplay(date)}`);

      }

      

      // Atualizar ambos os calendários

      generateReportCalendar('start');

      generateReportCalendar('end');

      

      // Habilitar botão de aplicar se ambas as datas estiverem selecionadas

      if (applyDatetimeBtn) {

        const bothSelected = reportStartDate && reportEndDate;

        applyDatetimeBtn.disabled = !bothSelected;

        

        if (bothSelected) {

          applyDatetimeBtn.style.opacity = '1';

          applyDatetimeBtn.style.cursor = 'pointer';

        } else {

          applyDatetimeBtn.style.opacity = '0.5';

          applyDatetimeBtn.style.cursor = 'not-allowed';

        }

      }

    }

    

    // Navegação dos calendários

    document.querySelectorAll(".schedule-prev-month").forEach(btn => {

      btn.addEventListener("click", (e) => {

        e.stopPropagation();

        const calendarType = btn.getAttribute('data-calendar');

        

        if (calendarType === 'start') {

          scheduleStartCalendarMonth--;

          if (scheduleStartCalendarMonth < 0) {

            scheduleStartCalendarMonth = 11;

            scheduleStartCalendarYear--;

          }

          generateReportCalendar('start');

        } else {

          scheduleEndCalendarMonth--;

          if (scheduleEndCalendarMonth < 0) {

            scheduleEndCalendarMonth = 11;

            scheduleEndCalendarYear--;

          }

          generateReportCalendar('end');

        }

      });

    });

    

    document.querySelectorAll(".schedule-next-month").forEach(btn => {

      btn.addEventListener("click", (e) => {

        e.stopPropagation();

        const calendarType = btn.getAttribute('data-calendar');

        

        if (calendarType === 'start') {

          scheduleStartCalendarMonth++;

          if (scheduleStartCalendarMonth > 11) {

            scheduleStartCalendarMonth = 0;

            scheduleStartCalendarYear++;

          }

          generateReportCalendar('start');

        } else {

          scheduleEndCalendarMonth++;

          if (scheduleEndCalendarMonth > 11) {

            scheduleEndCalendarMonth = 0;

            scheduleEndCalendarYear++;

          }

          generateReportCalendar('end');

        }

      });

    });

    

    // Aplicar período selecionado

    if (applyDatetimeBtn) {

      applyDatetimeBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        

        if (!reportStartDate || !reportEndDate) {

          return;

        }

        

        // Atualizar display do botão

        const display = document.querySelector(".selected-datetime-display");

        if (display) {

          const startStr = formatDateDisplay(reportStartDate);

          const endStr = formatDateDisplay(reportEndDate);

          display.textContent = `${startStr} até ${endStr}`;

          display.classList.add("has-selection");

        }

        

        // Fechar dropdown

        datetimeSelectorDropdown.classList.remove("active");

        datetimeSelectorButton.classList.remove("active");

      });

    }

    

    // Limpar seleção de período

    if (clearDatetimeBtn) {

      clearDatetimeBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        

        reportStartDate = null;

        reportEndDate = null;

        

        if (reportStartDateDisplay) reportStartDateDisplay.textContent = 'Selecione';

        if (reportEndDateDisplay) reportEndDateDisplay.textContent = 'Selecione';

        

        const display = document.querySelector(".selected-datetime-display");

        if (display) {

          display.textContent = 'Selecione o período...';

          display.classList.remove("has-selection");

        }

        

        generateReportCalendar('start');

        generateReportCalendar('end');

        

        // Desabilitar botão aplicar

        if (applyDatetimeBtn) {

          applyDatetimeBtn.disabled = true;

          applyDatetimeBtn.style.opacity = '0.5';

          applyDatetimeBtn.style.cursor = 'not-allowed';

        }

      });

    }

    

    // Gerar relatório

    if (generateReportBtn) {

      generateReportBtn.addEventListener("click", () => {

        if (!selectedContact) {

          showToast("Selecione um contato primeiro", "error");

          return;

        }

        

        if (!reportStartDate || !reportEndDate) {

          showToast("Selecione o período (data inicial e final)", "error");

          return;

        }

        

        // Gerar relatório
        
        // Se for contato de suporte, verificar se há funcionário selecionado
        const reportData = generateChatReport(selectedContact, reportStartDate, reportEndDate, selectedEmployee);

        

        if (reportData.messages.length === 0) {

          showToast("Nenhuma mensagem encontrada no período selecionado", "info");

          if (reportPreview) reportPreview.style.display = 'none';

          if (downloadPdfBtn) downloadPdfBtn.style.display = 'none';

          return;

        }

        

        // Armazenar dados do relatório

        currentReportData = reportData;

        

        // Renderizar preview

        renderReportPreview(reportData);

        

        // Mostrar área de preview e botão de download

        if (reportPreview) reportPreview.style.display = 'block';

        if (downloadPdfBtn) downloadPdfBtn.style.display = 'flex';

      });

    }

    

    // Função para gerar dados do relatório

    function generateChatReport(contact, startDate, endDate, employee = null) {

      const messages = [];

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      const userName = currentUser.fullName || currentUser.username || "Usuário";

      

      // Normalizar datas

      const start = new Date(startDate);

      start.setHours(0, 0, 0, 0);

      

      const end = new Date(endDate);

      end.setHours(23, 59, 59, 999);

      

      // Verificar se é contato de suporte

      if (contact.type === 'support') {

        // Buscar mensagens de suporte

        const supportMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
        
        // Determinar o chatId correto baseado no funcionário selecionado
        let targetChatId = contact.id;
        
        if (employee && employee.type === 'employee') {
          // Se um funcionário foi selecionado, usar o chatId do funcionário
          const contributorId = getContributorIdFromChatId(contact.id);
          if (contributorId && employee.id) {
            targetChatId = getEmployeeChatId(contributorId, employee.id);
          }
        } else if (employee && employee.type === 'admin') {
          // Se "Administrador" foi selecionado, usar o chatId do administrador (já é o contact.id)
          targetChatId = contact.id;
        }
        // Se employee for null, usar o contact.id (comportamento padrão)

        supportMessages.forEach(msg => {

          if (msg.chatId === targetChatId) {
            
            // Filtrar mensagens do funcionário selecionado se aplicável
            if (employee && employee.type === 'employee') {
              // Mostrar apenas mensagens deste funcionário específico
              // Mensagens do funcionário (senderRole === "employee" e employeeId corresponde)
              // OU mensagens de resposta do suporte direcionadas a este funcionário (targetEmployeeId corresponde)
              const isEmployeeMessage = (msg.senderRole === "employee" && msg.employeeId === employee.id) ||
                                        (msg.type === "support" && msg.targetEmployeeId === employee.id);
              
              // Excluir mensagens de outros funcionários
              if (!isEmployeeMessage && msg.employeeId && msg.employeeId !== employee.id) {
                return; // Ignorar mensagens de outros funcionários
              }
            } else if (employee && employee.type === 'admin') {
              // Se "Administrador" foi selecionado, mostrar apenas mensagens do administrador
              // (sem employeeId ou employeeId null)
              if (msg.employeeId && msg.employeeId !== null) {
                return; // Ignorar mensagens de funcionários
              }
            }

            const msgDate = new Date(msg.timestamp);

            

            if (msgDate >= start && msgDate <= end) {

              const messageData = {

                text: msg.text || '[Arquivo]',

                sender: msg.type === 'client' ? msg.clientName : msg.sender,

                type: msg.type === 'client' ? 'received' : 'sent',

                time: msg.time,

                timestamp: msg.timestamp,

                date: formatDateDisplay(msgDate)

              };

              

              // Adicionar informações de arquivo se existir

              if (msg.file) {

                const fileExt = msg.file.name.split('.').pop().toLowerCase();

                messageData.fileInfo = {

                  name: msg.file.name,

                  format: fileExt.toUpperCase(),

                  size: formatFileSize(msg.file.size)

                };

              }

              

              messages.push(messageData);

            }

          }

        });

      } else {

        // Buscar mensagens de contato normal
        
        const normalContact = contacts.find(c => c.id === parseInt(contact.id));
        
        // Verificar se o contato existe
        if (!normalContact) {
          console.warn(`[generateChatReport] Contato ${contact.id} não encontrado no array contacts`);
          return {
            contactName: contact.name || 'Contato Desconhecido',
            contactType: contact.type,
            startDate: formatDateDisplay(start),
            endDate: formatDateDisplay(end),
            generatedAt: new Date().toLocaleString('pt-BR'),
            messages: []
          };
        }
        
        // Buscar mensagens do array local do contato
        if (normalContact.messages && Array.isArray(normalContact.messages) && normalContact.messages.length > 0) {
          normalContact.messages.forEach(msg => {
            // Verificar se a mensagem tem timestamp válido
            if (!msg.timestamp) {
              console.warn(`[generateChatReport] Mensagem sem timestamp encontrada:`, msg);
              return;
            }
            
            const msgDate = new Date(msg.timestamp);
            
            // Verificar se a data é válida
            if (isNaN(msgDate.getTime())) {
              console.warn(`[generateChatReport] Data inválida na mensagem:`, msg);
              return;
            }
            
            if (msgDate >= start && msgDate <= end) {
              const messageData = {
                text: msg.text || '[Arquivo]',
                sender: msg.type === 'sent' ? userName : normalContact.name,
                type: msg.type,
                time: msg.time || getCurrentTime(),
                timestamp: msg.timestamp,
                date: formatDateDisplay(msgDate)
              };
              
              // Adicionar informações de arquivo se existir
              if (msg.file) {
                const fileExt = msg.file.name.split('.').pop().toLowerCase();
                messageData.fileInfo = {
                  name: msg.file.name,
                  format: fileExt.toUpperCase(),
                  size: formatFileSize(msg.file.size)
                };
              }
              
              messages.push(messageData);
            }
          });
        }
        
        // Também buscar mensagens do localStorage (supportMessages) caso existam para este contato
        // As mensagens de contatos normais podem estar armazenadas no localStorage com um chatId baseado no contact.id
        const allMessages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
        const contactChatId = `chat_contact_${contact.id}`;
        
        allMessages.forEach(msg => {
          // Verificar se a mensagem pertence a este contato
          // Pode estar usando contactChatId ou chatId baseado no contact.id
          const isContactMessage = msg.chatId === contactChatId || 
                                   msg.chatId === contact.id.toString() ||
                                   (msg.contactId && msg.contactId === contact.id.toString()) ||
                                   (msg.contactId && parseInt(msg.contactId) === contact.id);
          
          if (isContactMessage && msg.timestamp) {
            const msgDate = new Date(msg.timestamp);
            
            // Verificar se a data é válida
            if (isNaN(msgDate.getTime())) {
              return;
            }
            
            // Verificar se já não foi adicionada (evitar duplicatas)
            // Comparar por id se disponível, senão por timestamp e texto
            const alreadyAdded = messages.some(m => {
              if (m.id && msg.id) {
                return m.id === msg.id;
              }
              // Comparar por timestamp e texto
              if (m.timestamp === msg.timestamp) {
                return (m.text || '[Arquivo]') === (msg.text || '[Arquivo]');
              }
              return false;
            });
            if (alreadyAdded) {
              return;
            }
            
            if (msgDate >= start && msgDate <= end) {
              const messageData = {
                text: msg.text || '[Arquivo]',
                sender: msg.type === 'client' ? (msg.clientName || normalContact.name) : (msg.sender || userName),
                type: msg.type === 'client' ? 'received' : 'sent',
                time: msg.time || getCurrentTime(),
                timestamp: msg.timestamp,
                date: formatDateDisplay(msgDate)
              };
              
              // Adicionar informações de arquivo se existir
              if (msg.file) {
                const fileExt = msg.file.name.split('.').pop().toLowerCase();
                messageData.fileInfo = {
                  name: msg.file.name,
                  format: fileExt.toUpperCase(),
                  size: formatFileSize(msg.file.size)
                };
              }
              
              messages.push(messageData);
            }
          }
        });
        
        console.log(`[generateChatReport] Total de mensagens encontradas para contato ${contact.id}: ${messages.length}`);
      }

      

      // Ordenar por timestamp

      messages.sort((a, b) => a.timestamp - b.timestamp);

      

      return {

        contactName: contact.name,

        contactType: contact.type,

        startDate: formatDateDisplay(start),

        endDate: formatDateDisplay(end),

        generatedAt: new Date().toLocaleString('pt-BR'),

        messages: messages

      };

    }

    

    // Função para renderizar preview do relatório

    function renderReportPreview(data) {

      if (!reportPreviewContent) return;

      

      // Atualizar contador

      if (reportMessageCount) {

        reportMessageCount.textContent = `${data.messages.length} mensagem${data.messages.length !== 1 ? 's' : ''}`;

      }

      

      // Limpar conteúdo

      reportPreviewContent.innerHTML = '';

      

      // Cabeçalho do relatório

      const header = document.createElement('div');

      header.classList.add('report-header-info');

      header.innerHTML = `

        <h3>Relatório de Conversas</h3>

        <div class="report-meta">

          <div class="report-meta-item">

            <i class='bx bx-user'></i>

            <span><strong>Contato:</strong> ${data.contactName}</span>

          </div>

          <div class="report-meta-item">

            <i class='bx bx-calendar'></i>

            <span><strong>Período:</strong> ${data.startDate} até ${data.endDate}</span>

          </div>

          <div class="report-meta-item">

            <i class='bx bx-time'></i>

            <span><strong>Gerado em:</strong> ${data.generatedAt}</span>

          </div>

        </div>

      `;

      reportPreviewContent.appendChild(header);

      

      // Renderizar mensagens

      if (data.messages.length === 0) {

        const empty = document.createElement('div');

        empty.classList.add('report-empty');

        empty.innerHTML = `

          <i class='bx bx-message-x'></i>

          <p>Nenhuma mensagem neste período</p>

        `;

        reportPreviewContent.appendChild(empty);

      } else {

        data.messages.forEach(msg => {

          const msgItem = document.createElement('div');

          msgItem.classList.add('report-message-item', msg.type);

          

          const senderDiv = document.createElement('div');

          senderDiv.classList.add('report-message-sender');

          senderDiv.textContent = msg.sender;

          

          const timeDiv = document.createElement('div');

          timeDiv.classList.add('report-message-time');

          timeDiv.innerHTML = `<i class='bx bx-time-five'></i> ${msg.date} - ${msg.time}`;

          

          const textDiv = document.createElement('div');

          textDiv.classList.add('report-message-text');

          textDiv.textContent = msg.text || '';

          

          msgItem.appendChild(senderDiv);

          msgItem.appendChild(timeDiv);

          msgItem.appendChild(textDiv);

          

          // Adicionar info de arquivo se existir

          if (msg.fileInfo) {

            const fileDiv = document.createElement('div');

            fileDiv.style.cssText = `

              background: rgba(0, 0, 0, 0.05);

              padding: 10px;

              border-radius: 6px;

              margin-top: 8px;

              font-size: 12px;

            `;

            fileDiv.innerHTML = `

              📎 <strong>Arquivo:</strong> ${msg.fileInfo.name}<br>

              <strong>Formato:</strong> ${msg.fileInfo.format} | <strong>Tamanho:</strong> ${msg.fileInfo.size}

            `;

            msgItem.appendChild(fileDiv);

          }

          

          reportPreviewContent.appendChild(msgItem);

        });

      }

      

      console.log(`📊 Relatório renderizado: ${data.messages.length} mensagens`);

    }

    

    // Baixar relatório em PDF

    if (downloadPdfBtn) {

      downloadPdfBtn.addEventListener("click", () => {

        if (!currentReportData) {

          showToast("Gere um relatório primeiro", "error");

          return;

        }

        

        generatePDF(currentReportData);

      });

    }

    

    // Função para renderizar conteúdo completo para PDF

    function renderPDFContent(data) {

      const pdfContent = document.getElementById('pdfContent');

      if (!pdfContent) {

        console.error('pdfContent não encontrado!');

        return;

      }

      

      console.log('🎨 Renderizando conteúdo para PDF...');

      

      pdfContent.innerHTML = '';

      

      // Cabeçalho

      const header = document.createElement('div');

      header.classList.add('pdf-header');

      header.innerHTML = `

        <h1>RELATÓRIO DE CONVERSAS</h1>

        <div class="pdf-header-info">

          <div class="pdf-header-info-item">

            <strong>Contato:</strong> ${data.contactName}

          </div>

          <div class="pdf-header-info-item">

            <strong>Período:</strong> ${data.startDate} até ${data.endDate}

          </div>

          <div class="pdf-header-info-item">

            <strong>Gerado em:</strong> ${data.generatedAt}

          </div>

          <div class="pdf-header-info-item">

            <strong>Total de mensagens:</strong> ${data.messages.length}

          </div>

        </div>

      `;

      pdfContent.appendChild(header);

      

      // Container de mensagens

      const messagesContainer = document.createElement('div');

      messagesContainer.classList.add('pdf-messages-container');

      

      console.log(`📝 Renderizando ${data.messages.length} mensagens...`);

      

      // Renderizar cada mensagem

      data.messages.forEach((msg, index) => {

        const msgDiv = document.createElement('div');

        msgDiv.classList.add('pdf-message-item', msg.type);

        

        const senderDiv = document.createElement('div');

        senderDiv.classList.add('pdf-message-sender');

        senderDiv.textContent = msg.sender;

        

        const datetimeDiv = document.createElement('div');

        datetimeDiv.classList.add('pdf-message-datetime');

        datetimeDiv.textContent = `${msg.date} - ${msg.time}`;

        

        const textDiv = document.createElement('div');

        textDiv.classList.add('pdf-message-text');

        textDiv.textContent = msg.text || '';

        

        msgDiv.appendChild(senderDiv);

        msgDiv.appendChild(datetimeDiv);

        msgDiv.appendChild(textDiv);

        

        // Adicionar info de arquivo se existir

        if (msg.fileInfo) {

          const fileDiv = document.createElement('div');

          fileDiv.classList.add('pdf-file-info');

          fileDiv.innerHTML = `

            📎 <strong>Arquivo:</strong> ${msg.fileInfo.name}<br>

            <strong>Formato:</strong> ${msg.fileInfo.format} | <strong>Tamanho:</strong> ${msg.fileInfo.size}

          `;

          msgDiv.appendChild(fileDiv);

        }

        

        messagesContainer.appendChild(msgDiv);

      });

      

      pdfContent.appendChild(messagesContainer);

      

      console.log('✅ Conteúdo renderizado! Altura total:', pdfContent.scrollHeight + 'px');

    }

    

    // Função para gerar PDF com html2canvas (preserva emojis visuais)

    async function generatePDF(data) {

      try {

        // Verificar se bibliotecas estão disponíveis

        if (typeof window.jspdf === 'undefined') {

          showToast("Biblioteca jsPDF não carregada. Recarregue a página.", "error");

          return;

        }

        

        if (typeof html2canvas === 'undefined') {

          showToast("Biblioteca html2canvas não carregada. Recarregue a página.", "error");

          return;

        }

        

        console.log('📸 Preparando conteúdo completo do relatório...');

        

        // Mostrar indicador de loading

        if (downloadPdfBtn) {

          downloadPdfBtn.disabled = true;

          downloadPdfBtn.style.opacity = '0.5';

          downloadPdfBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin" style="font-size: 24px; color: white;"></i>';

        }

        

        // Renderizar conteúdo completo no container oculto

        renderPDFContent(data);

        

        // Capturar o container oculto como imagem

        const pdfElement = document.getElementById('pdfContent');

        

        if (!pdfElement) {

          showToast("Container PDF não encontrado", "error");

          return;

        }

        

        // Verificar se há conteúdo

        if (!pdfElement.innerHTML || pdfElement.innerHTML.trim() === '') {

          console.error('Conteúdo PDF vazio!');

          showToast("Erro: conteúdo vazio", "error");

          return;

        }

        

        console.log(`📸 Capturando ${data.messages.length} mensagens...`);

        console.log('Altura do conteúdo:', pdfElement.scrollHeight + 'px');

        

        // Delay maior para garantir renderização de fontes e emojis

        await new Promise(resolve => setTimeout(resolve, 500));

        

        // Configurações do html2canvas

        const canvas = await html2canvas(pdfElement, {

          scale: 2.5, // Qualidade ainda maior

          useCORS: true,

          allowTaint: true,

          logging: true,

          backgroundColor: '#ffffff',

          width: 800,

          height: pdfElement.scrollHeight,

          scrollY: 0,

          scrollX: 0

        });

        

        console.log('✅ Captura concluída!');

        console.log('Canvas:', canvas.width + 'x' + canvas.height);

        

        // Verificar se canvas é válido

        if (!canvas || canvas.width === 0 || canvas.height === 0) {

          console.error('Canvas inválido!');

          showToast("Erro ao capturar conteúdo", "error");

          

          // Restaurar botão

          if (downloadPdfBtn) {

            downloadPdfBtn.disabled = false;

            downloadPdfBtn.style.opacity = '1';

            downloadPdfBtn.innerHTML = '<img src="https://img.icons8.com/fluency/48/pdf--v1.png" alt="pdf">';

          }

          return;

        }

        

        // Criar PDF

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({

          orientation: 'portrait',

          unit: 'mm',

          format: 'a4'

        });

        

        const pageWidth = doc.internal.pageSize.getWidth();

        const pageHeight = doc.internal.pageSize.getHeight();

        const margin = 10;

        

        // Converter canvas para imagem

        const imgData = canvas.toDataURL('image/png');

        

        console.log('Imagem gerada, tamanho:', imgData.length, 'bytes');

        

        // Calcular dimensões mantendo proporção

        const imgWidth = pageWidth - (margin * 2);

        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        

        let heightLeft = imgHeight;

        let position = margin;

        

        // Adicionar primeira página

        doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);

        heightLeft -= (pageHeight - margin * 2);

        

        // Adicionar páginas adicionais se necessário

        while (heightLeft > 0) {

          position = heightLeft - imgHeight + margin;

          doc.addPage();

          doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);

          heightLeft -= (pageHeight - margin * 2);

        }

        

        // Salvar PDF

        const fileName = `Relatorio_${data.contactName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        doc.save(fileName);

        

        console.log(`📥 PDF gerado com ${data.messages.length} mensagens e emojis visuais: ${fileName}`);

        

        // Limpar container oculto

        pdfElement.innerHTML = '';

        

        // Restaurar botão

        if (downloadPdfBtn) {

          downloadPdfBtn.disabled = false;

          downloadPdfBtn.style.opacity = '1';

          downloadPdfBtn.innerHTML = '<img src="https://img.icons8.com/fluency/48/pdf--v1.png" alt="pdf">';

        }

        

      } catch (error) {

        console.error('Erro ao gerar PDF:', error);

        showToast("Erro ao gerar PDF. Tente novamente.", "error");

        

        // Restaurar botão em caso de erro

        if (downloadPdfBtn) {

          downloadPdfBtn.disabled = false;

          downloadPdfBtn.style.opacity = '1';

          downloadPdfBtn.innerHTML = '<img src="https://img.icons8.com/fluency/48/pdf--v1.png" alt="pdf">';

        }

      }

    }

    

    // ==================== FIM CHAT REPORT FUNCTIONALITY ====================

    // ==================== INTERNAL CHAT FUNCTIONALITY ====================

    let currentInternalChatId = null;
    let internalChatMessages = {};

    // Função para obter ou criar ID de chat interno entre dois usuários
    function getInternalChatId(user1, user2) {
      const users = [user1, user2].sort();
      return `internal_${users[0]}_${users[1]}`;
    }

    // Função para carregar mensagens internas do localStorage
    function getInternalMessages() {
      return safeJsonParse(localStorage.getItem("internalMessages"), {});
    }

    // Função para salvar mensagens internas no localStorage
    function saveInternalMessages(messages) {
      localStorage.setItem("internalMessages", JSON.stringify(messages));
    }

    // Função para atualizar lista de contatos internos
    function updateInternalContactsList() {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);
      
      if (!currentUsername) {
        console.warn("Usuário não autenticado");
        return;
      }

      const internalContactsSection = document.getElementById("internalContactsSection");
      if (!internalContactsSection) return;

      internalContactsSection.innerHTML = "";

      const users = getUsersFromStorage();
      const filteredUsers = users.filter(user => {
        const userUsername = normalizeUsername(user.username);
        // Excluir o usuário atual e usuários com role "contributor"
        return userUsername && 
               userUsername !== currentUsername && 
               user.role !== "contributor";
      });

      // Ordenar por nome
      filteredUsers.sort((a, b) => {
        const nameA = (a.fullName || a.username || "").toLowerCase();
        const nameB = (b.fullName || b.username || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      filteredUsers.forEach(user => {
        const userUsername = normalizeUsername(user.username);
        const chatId = getInternalChatId(currentUsername, userUsername);
        const messages = getInternalMessages();
        const chatMessages = messages[chatId] || [];
        
        // Obter última mensagem
        let lastMessage = null;
        let lastMessageTime = null;
        if (chatMessages.length > 0) {
          const sortedMessages = [...chatMessages].sort((a, b) => 
            (a.timestamp || 0) - (b.timestamp || 0)
          );
          lastMessage = sortedMessages[sortedMessages.length - 1];
          lastMessageTime = lastMessage.timestamp || Date.now();
        }
        
        // Contar mensagens não lidas (mensagens recebidas que não foram lidas)
        // Garantir que mensagens recebidas tenham read: false por padrão se não tiverem o campo
        const unreadCount = chatMessages.filter(msg => {
          const senderUsername = normalizeUsername(msg.sender || msg.senderUsername || "");
          const isReceived = senderUsername !== currentUsername;
          // Se é mensagem recebida e não tem campo read, considerar como não lida
          if (isReceived && msg.read === undefined) {
            msg.read = false;
          }
          return isReceived && !msg.read;
        }).length;
        
        // Salvar mensagens atualizadas se houver mudanças
        if (unreadCount > 0) {
          const hasChanges = chatMessages.some(msg => {
            const senderUsername = normalizeUsername(msg.sender || msg.senderUsername || "");
            const isReceived = senderUsername !== currentUsername;
            return isReceived && msg.read === undefined;
          });
          if (hasChanges) {
            saveInternalMessages(messages);
          }
        }

        const contactElement = createInternalContactElement(user, chatId, lastMessage, lastMessageTime, unreadCount);
        internalContactsSection.appendChild(contactElement);
      });

      // Adicionar eventos de busca (remover listener anterior se existir)
      const searchInput = document.getElementById("internalChatSearch");
      if (searchInput) {
        // Remover listener anterior se existir
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.addEventListener("input", (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const contacts = internalContactsSection.querySelectorAll(".contact");
          contacts.forEach(contact => {
            const name = contact.querySelector(".contact-name")?.textContent.toLowerCase() || "";
            const sector = contact.querySelector(".contact-info-footer p")?.textContent.toLowerCase() || "";
            if (name.includes(searchTerm) || sector.includes(searchTerm)) {
              contact.style.display = "flex";
            } else {
              contact.style.display = "none";
            }
          });
        });
      }
    }

    // Função para criar elemento de contato interno
    function createInternalContactElement(user, chatId, lastMessage, lastMessageTime, unreadCount = 0) {
      const contact = document.createElement("div");
      contact.className = "contact support-contact";
      contact.dataset.chatId = chatId;
      contact.dataset.username = normalizeUsername(user.username);

      const userName = user.fullName || user.username || "Usuário";
      const userSector = user.sector || "Sem setor";
      const profileImage = normalizeImagePath(user.profileImage) || DEFAULT_PROFILE_IMAGE;

      let lastMessageText = "Nenhuma mensagem ainda";
      let timeText = "";

      if (lastMessage) {
        if (lastMessage.file) {
          lastMessageText = "📎 Arquivo";
        } else if (lastMessage.text) {
          lastMessageText = lastMessage.text.length > 50 
            ? lastMessage.text.substring(0, 50) + "..." 
            : lastMessage.text;
        }
        timeText = lastMessageTime ? getRelativeDate(new Date(lastMessageTime)) : "";
      }

      // Criar estrutura do contato
      const contactInfo = document.createElement("div");
      contactInfo.className = "contact-info";
      
      const headerRow = document.createElement("div");
      headerRow.className = "contact-info-header";
      
      const contactName = document.createElement("h4");
      contactName.className = "contact-name";
      contactName.textContent = userName;
      headerRow.appendChild(contactName);
      
      const contactTime = document.createElement("span");
      contactTime.className = "contact-time";
      contactTime.textContent = timeText;
      headerRow.appendChild(contactTime);
      
      const footerRow = document.createElement("div");
      footerRow.className = "contact-info-footer";
      
      const lastMessageEl = document.createElement("p");
      lastMessageEl.className = "contact-last-message";
      lastMessageEl.textContent = lastMessageText;
      footerRow.appendChild(lastMessageEl);
      
      // Adicionar indicador de mensagens não lidas (badge verde com número)
      if (unreadCount > 0) {
        const badge = document.createElement("span");
        badge.className = "unread-badge";
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
        footerRow.appendChild(badge);
        contact.classList.add("has-unread");
      }
      
      contactInfo.appendChild(headerRow);
      contactInfo.appendChild(footerRow);
      
      const img = document.createElement("img");
      img.src = profileImage;
      img.onerror = function() {
        this.onerror = null;
        this.src = DEFAULT_PROFILE_IMAGE;
      };
      img.alt = userName;
      
      contact.appendChild(img);
      contact.appendChild(contactInfo);

      contact.addEventListener("click", () => {
        document.querySelectorAll("#internalContactsSection .contact").forEach(c => {
          c.classList.remove("active");
        });
        contact.classList.add("active");
        loadInternalChat(chatId, user);
      });

      return contact;
    }

    // Função para carregar chat interno
    function loadInternalChat(chatId, user) {
      currentInternalChatId = chatId;
      const messagesContainer = document.getElementById("internalMessages");
      const chatMain = document.querySelector(".internal-chat-container .chat-main");
      
      if (!messagesContainer) {
        console.error("Container de mensagens interno não encontrado");
        return;
      }

      // Garantir que o chat-main está visível
      if (chatMain) {
        chatMain.classList.remove("hidden");
        chatMain.style.display = "flex";
      }

      messagesContainer.innerHTML = "";

      const messages = getInternalMessages();
      const chatMessages = messages[chatId] || [];
      
      // Ordenar mensagens por timestamp
      const sortedMessages = [...chatMessages].sort((a, b) => 
        (a.timestamp || 0) - (b.timestamp || 0)
      );

      let lastMessageDate = null;
      sortedMessages.forEach(msg => {
        // Adicionar indicador de data se for diferente da mensagem anterior
        const messageDate = msg.timestamp || Date.now();
        const messageDateString = new Date(messageDate).toDateString();

        if (messageDateString !== lastMessageDate) {
          const dateText = getRelativeDate(messageDate);
          const dateDivider = createDateDivider(dateText);
          messagesContainer.appendChild(dateDivider);
          lastMessageDate = messageDateString;
        }

        addInternalMessageToChat(msg, false);
      });

      // Scroll para o final após um pequeno delay para garantir que os elementos foram renderizados
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
      
      // Marcar mensagens como lidas quando o chat é aberto
      markInternalMessagesAsRead(chatId);
      
      // Habilitar input de mensagem
      enableInternalMessageInput();
      
      console.log("✅ Chat interno carregado para:", user.fullName || user.username);
    }
    
    // Função para marcar mensagens internas como lidas
    function markInternalMessagesAsRead(chatId) {
      const messages = getInternalMessages();
      const chatMessages = messages[chatId] || [];
      
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);
      
      let hasUnreadMessages = false;
      chatMessages.forEach(msg => {
        const senderUsername = normalizeUsername(msg.sender || msg.senderUsername || "");
        const isReceived = senderUsername !== currentUsername;
        if (isReceived && !msg.read) {
          msg.read = true;
          hasUnreadMessages = true;
        }
      });
      
      if (hasUnreadMessages) {
        saveInternalMessages(messages);
        // Atualizar lista de contatos para remover indicadores
        updateInternalContactsList();
      }
    }

    // Função para adicionar mensagem ao chat interno
    function addInternalMessageToChat(msg, scroll = true) {
      const messagesContainer = document.getElementById("internalMessages");
      if (!messagesContainer) return;

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);
      const senderUsername = normalizeUsername(msg.sender || msg.senderUsername || "");
      
      const isSent = senderUsername === currentUsername;
      const messageClass = isSent ? "sent" : "received";

      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${messageClass}`;

      const time = msg.time || getCurrentTime();
      const senderName = msg.senderName || msg.sender || "Usuário";

      let messageContent = "";

      if (msg.file) {
        // Mensagem com arquivo
        let fileData = msg.file.data;
        // Se fileData não começar com data:, adicionar o prefixo
        if (fileData && !fileData.startsWith('data:')) {
          fileData = `data:${msg.file.type || 'application/octet-stream'};base64,${fileData}`;
        }
        const fileElement = createFileElement(msg.file, fileData, msg.caption);
        messageContent = fileElement.outerHTML;
        messageDiv.classList.add("has-file");
      } else if (msg.text) {
        // Verificar se é apenas emojis
        if (isOnlyEmojis(msg.text)) {
          messageDiv.classList.add("emoji-only");
          const emojis = extractEmojis(msg.text);
          messageContent = emojis.map((emoji, index) => {
            return createLargeEmoji(emoji, index).outerHTML;
          }).join("");
        } else {
          messageContent = `<div class="message-text">${msg.text}</div>`;
        }
      }

      messageDiv.innerHTML = `
        ${messageContent}
        <span class="message-time">${time}</span>
      `;

      // Adicionar data timestamp como atributo para verificação de date-divider
      const messageTimestamp = msg.timestamp || Date.now();
      messageDiv.setAttribute("data-timestamp", messageTimestamp.toString());

      // Verificar se precisa adicionar date-divider antes da mensagem
      const lastMessageElement = messagesContainer.querySelector(".message:last-child, .date-divider:last-child");
      if (lastMessageElement && !lastMessageElement.classList.contains("date-divider")) {
        const lastMessageTimestamp = lastMessageElement.getAttribute("data-timestamp");
        if (lastMessageTimestamp) {
          const lastMessageDate = new Date(parseInt(lastMessageTimestamp)).toDateString();
          const messageDate = new Date(messageTimestamp).toDateString();
          
          if (messageDate !== lastMessageDate) {
            const dateText = getRelativeDate(messageTimestamp);
            const dateDivider = createDateDivider(dateText);
            messagesContainer.appendChild(dateDivider);
          }
        }
      } else if (!lastMessageElement) {
        // Se não há mensagens anteriores, adicionar date-divider
        const dateText = getRelativeDate(messageTimestamp);
        const dateDivider = createDateDivider(dateText);
        messagesContainer.appendChild(dateDivider);
      }

      messagesContainer.appendChild(messageDiv);

      if (scroll) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      // Se a mensagem é recebida, gerenciar status de leitura
      if (!isSent) {
        const messages = getInternalMessages();
        const chatMessages = messages[msg.chatId] || [];
        const messageIndex = chatMessages.findIndex(m => m.id === msg.id);
        if (messageIndex !== -1) {
          // Garantir que mensagens recebidas tenham read: false por padrão se não tiverem o campo
          if (chatMessages[messageIndex].read === undefined) {
            chatMessages[messageIndex].read = false;
            saveInternalMessages(messages);
          }
          
          // Se o chat está aberto, marcar como lida
          if (currentInternalChatId === msg.chatId && !chatMessages[messageIndex].read) {
            chatMessages[messageIndex].read = true;
            saveInternalMessages(messages);
            updateInternalContactsList();
          } else if (currentInternalChatId !== msg.chatId) {
            // Se o chat não está aberto, atualizar lista para mostrar badge
            updateInternalContactsList();
          }
        }
      }
    }

    // Função para enviar mensagem interna
    async function sendInternalMessage() {
      if (!currentInternalChatId) {
        showToast("Selecione um contato para enviar mensagem", "warning");
        return;
      }

      const messageInput = document.getElementById("internalMessageInput");
      const fileInput = document.getElementById("internalFileInput");
      
      if (!messageInput) return;

      const text = messageInput.value.trim();
      const files = fileInput?.files || [];

      if (!text && files.length === 0) {
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const currentUsername = normalizeUsername(currentUser.username);

      const messages = getInternalMessages();
      if (!messages[currentInternalChatId]) {
        messages[currentInternalChatId] = [];
      }

      const timestamp = Date.now();
      const time = getCurrentTime();

      if (files.length > 0) {
        // Enviar arquivos
        for (const file of Array.from(files)) {
          const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: await fileToBase64(file)
          };

          const message = {
            id: generateUniqueId(),
            chatId: currentInternalChatId,
            sender: currentUsername,
            senderName: currentUser.fullName || currentUser.username,
            file: fileData,
            caption: text || null,
            timestamp: timestamp,
            time: time,
            type: "internal"
          };

          messages[currentInternalChatId].push(message);
          saveInternalMessages(messages);
          addInternalMessageToChat(message);
        }

        fileInput.value = "";
      } else if (text) {
        // Enviar mensagem de texto
        const message = {
          id: generateUniqueId(),
          chatId: currentInternalChatId,
          sender: currentUsername,
          senderName: currentUser.fullName || currentUser.username,
          text: text,
          timestamp: timestamp,
          time: time,
          type: "internal"
        };

        messages[currentInternalChatId].push(message);
        saveInternalMessages(messages);
        addInternalMessageToChat(message);
      }

      messageInput.value = "";
      updateInternalContactsList();
    }

    // Funções para habilitar/desabilitar input de mensagem interna
    function enableInternalMessageInput() {
      const messageInputContainer = document.querySelector(".internal-chat-container .message-input");
      const messageInput = document.getElementById("internalMessageInput");
      const sendButton = document.getElementById("internalSendButton");
      
      console.log("🔧 Habilitando input interno:", {
        container: !!messageInputContainer,
        input: !!messageInput,
        button: !!sendButton
      });
      
      if (messageInputContainer) {
        messageInputContainer.classList.add("active");
        messageInputContainer.style.display = "flex";
        console.log("✅ Classe 'active' adicionada ao message-input");
      } else {
        console.error("❌ Container message-input não encontrado no chat interno");
      }
      
      if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Digite sua mensagem aqui...";
      }
      
      if (sendButton) {
        sendButton.disabled = false;
      }
    }

    function disableInternalMessageInput() {
      const messageInputContainer = document.querySelector(".internal-chat-container .message-input");
      const messageInput = document.getElementById("internalMessageInput");
      const sendButton = document.getElementById("internalSendButton");
      
      if (messageInputContainer) {
        messageInputContainer.classList.remove("active");
        messageInputContainer.style.display = "none";
      }
      
      if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = "Selecione um contato para enviar mensagem";
      }
      
      if (sendButton) {
        sendButton.disabled = true;
      }
    }

    // Event listeners para chat interno
    const internalSendButton = document.getElementById("internalSendButton");
    const internalMessageInput = document.getElementById("internalMessageInput");
    const internalFileInput = document.getElementById("internalFileInput");
    const internalAttachButton = document.getElementById("internalAttachButton");
    const internalEmojiButton = document.getElementById("internalEmojiButton");

    if (internalSendButton) {
      internalSendButton.addEventListener("click", sendInternalMessage);
    }

    if (internalMessageInput) {
      internalMessageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendInternalMessage();
        }
      });
    }

    if (internalAttachButton && internalFileInput) {
      internalAttachButton.addEventListener("click", () => {
        internalFileInput.click();
      });
    }

    if (internalEmojiButton) {
      internalEmojiButton.addEventListener("click", () => {
        const emojiPanel = document.getElementById("internalEmojiPanel");
        if (emojiPanel) {
          const isVisible = emojiPanel.style.display === "block";
          emojiPanel.style.display = isVisible ? "none" : "block";
          
          if (!isVisible) {
            // Renderizar emojis se ainda não foram renderizados
            const emojiGrid = document.getElementById("internalEmojiGrid");
            if (emojiGrid && emojiGrid.children.length === 0) {
              if (typeof renderEmojis === "function") {
                renderEmojis("smileys", "internalEmojiGrid");
              }
            }
          }
        }
      });
    }

    // Event listener para categorias de emoji no chat interno
    const internalEmojiCategories = document.querySelectorAll("#internalEmojiPanel .emoji-category");
    internalEmojiCategories.forEach(categoryBtn => {
      categoryBtn.addEventListener("click", () => {
        internalEmojiCategories.forEach(btn => btn.classList.remove("active"));
        categoryBtn.classList.add("active");
        const category = categoryBtn.dataset.category;
        if (typeof renderEmojis === "function") {
          renderEmojis(category, "internalEmojiGrid");
        }
      });
    });

    // ==================== FIM INTERNAL CHAT FUNCTIONALITY ====================

    // ==================== SOLICITAÇÕES DE RECRUTAMENTO ====================
    
    // Função para carregar solicitações de recrutamento do localStorage
    window.loadRecruitmentRequests = function() {
      try {
        const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
        console.log('📋 Solicitações carregadas:', requests.length);
        return requests;
      } catch (error) {
        console.error('Erro ao carregar solicitações de recrutamento:', error);
        return [];
      }
    };
    
    // Função para exibir solicitações de recrutamento
    window.renderRecruitmentRequests = function() {
      const requestsList = document.getElementById('recruitmentRequestsList');
      const totalBadge = document.getElementById('totalRecruitmentRequests');
      
      if (!requestsList) {
        console.warn('⚠️ Elemento recruitmentRequestsList não encontrado');
        return;
      }
      
      const requests = window.loadRecruitmentRequests();
      console.log('📋 Renderizando solicitações:', requests.length);
      
      // Atualizar badge
      if (totalBadge) {
        totalBadge.textContent = `${requests.length} solicitação(ões)`;
      }
      
      if (requests.length === 0) {
        requestsList.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
            <h3 style="color: #374151; margin-bottom: 10px;">Nenhuma solicitação</h3>
            <p>Não há solicitações de recrutamento no momento.</p>
          </div>
        `;
        return;
      }
      
      // Ordenar por data (mais recentes primeiro)
      const sortedRequests = requests.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      requestsList.innerHTML = sortedRequests.map(request => {
        const date = new Date(request.createdAt);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Status badge
        const statusBadge = {
          pending: { text: 'Pendente', class: 'status-pending' },
          approved: { text: 'Aprovada', class: 'status-approved' },
          rejected: { text: 'Rejeitada', class: 'status-rejected' },
          redirected: { text: 'Redirecionada', class: 'status-redirected' }
        }[request.status] || { text: 'Pendente', class: 'status-pending' };
        
        return `
          <div class="recruitment-request-card" data-request-id="${request.id}" onclick="viewRecruitmentRequestDetails('${request.id}')">
            <div class="request-card-header">
              <div class="request-card-title">
                <h4>${request.jobTitle}</h4>
                <span class="request-company">${request.contributorName}</span>
              </div>
              <div class="request-card-badges">
                <span class="status-badge ${statusBadge.class}">${statusBadge.text}</span>
                <span class="vacancy-badge">${request.vacancyQuantity} vaga(s)</span>
              </div>
            </div>
            <div class="request-card-info">
              <div class="request-info-item">
                <i class='bx bx-dollar'></i>
                <span>${request.salary}</span>
              </div>
              <div class="request-info-item">
                <i class='bx bx-time'></i>
                <span>${request.workSchedule}</span>
              </div>
              <div class="request-info-item">
                <i class='bx bx-map'></i>
                <span>${getLocationText(request.locationPreference)}</span>
              </div>
              <div class="request-info-item">
                <i class='bx bx-calendar'></i>
                <span>${formattedDate}</span>
              </div>
            </div>
            <div class="request-card-actions">
              <button class="btn-view-details" onclick="event.stopPropagation(); viewRecruitmentRequestDetails('${request.id}')">
                <i class='bx bx-show'></i> Ver Detalhes
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Função para obter texto da localização
    function getLocationText(locationPreference) {
      const locations = {
        'qualquer': 'Qualquer localização',
        'remoto': 'Remoto',
        'presencial': 'Presencial',
        'hibrido': 'Híbrido',
        'proximo': 'Proximidade obrigatória',
        'mesma_cidade': 'Mesma cidade',
        'mesmo_estado': 'Mesmo estado'
      };
      return locations[locationPreference] || locationPreference;
    }
    
    // Função para visualizar detalhes completos da solicitação
    window.viewRecruitmentRequestDetails = function(requestId) {
      const requests = window.loadRecruitmentRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        alert('Solicitação não encontrada.');
        return;
      }
      
      // Criar modal com detalhes completos
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'recruitmentRequestModal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h2>Detalhes da Solicitação de Recrutamento</h2>
            <button class="close-modal-btn" onclick="closeRecruitmentRequestModal()">
              <i class='bx bx-x'></i>
            </button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="request-detail-section">
              <h3>Informações Básicas</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Cargo:</strong> ${request.jobTitle}
                </div>
                <div class="detail-item">
                  <strong>Quantidade de Vagas:</strong> ${request.vacancyQuantity}
                </div>
                <div class="detail-item">
                  <strong>Salário:</strong> ${request.salary}
                </div>
                <div class="detail-item">
                  <strong>Regime de Trabalho:</strong> ${request.workSchedule}
                </div>
              </div>
            </div>
            
            <div class="request-detail-section">
              <h3>Localização</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Preferência:</strong> ${getLocationText(request.locationPreference)}
                </div>
                ${request.companyAddress ? `
                <div class="detail-item">
                  <strong>Endereço da Empresa:</strong> ${request.companyAddress}
                </div>
                ` : ''}
                ${request.maxDistance ? `
                <div class="detail-item">
                  <strong>Distância Máxima:</strong> ${request.maxDistance} km
                </div>
                ` : ''}
              </div>
            </div>
            
            ${request.educationLevel ? `
            <div class="request-detail-section">
              <h3>Requisitos</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Escolaridade Mínima:</strong> ${getEducationText(request.educationLevel)}
                </div>
                ${request.experienceRequired ? `
                <div class="detail-item">
                  <strong>Experiência Necessária:</strong> ${getExperienceText(request.experienceRequired)}
                </div>
                ` : ''}
              </div>
              ${request.requiredSkills ? `
              <div class="detail-item full-width">
                <strong>Habilidades e Competências:</strong>
                <p style="margin-top: 8px; color: #6b7280;">${request.requiredSkills}</p>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="request-detail-section">
              <h3>Descrição da Vaga</h3>
              <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${request.jobDescription}</p>
            </div>
            
            ${request.benefits ? `
            <div class="request-detail-section">
              <h3>Benefícios Oferecidos</h3>
              <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${request.benefits}</p>
            </div>
            ` : ''}
            
            ${request.contactEmail || request.contactPhone ? `
            <div class="request-detail-section">
              <h3>Contato</h3>
              <div class="detail-grid">
                ${request.contactEmail ? `
                <div class="detail-item">
                  <strong>E-mail:</strong> ${request.contactEmail}
                </div>
                ` : ''}
                ${request.contactPhone ? `
                <div class="detail-item">
                  <strong>Telefone:</strong> ${request.contactPhone}
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}
            
            <div class="request-detail-section">
              <h3>Informações do Contribuinte</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Contribuinte:</strong> ${request.contributorName}
                </div>
                <div class="detail-item">
                  <strong>Data da Solicitação:</strong> ${new Date(request.createdAt).toLocaleString('pt-BR')}
                </div>
                <div class="detail-item">
                  <strong>Status:</strong> <span class="status-badge ${getStatusClass(request.status)}">${getStatusText(request.status)}</span>
                </div>
              </div>
            </div>
            
            <div class="request-detail-actions">
              <button class="btn-redirect-vacancy" onclick="redirectRecruitmentRequest('${request.id}')">
                <i class='bx bx-link-external'></i> Redirecionar Vaga
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.style.display = 'flex';
      
      // Fechar modal ao clicar fora
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeRecruitmentRequestModal();
        }
      });
    };
    
    // Função para fechar modal
    window.closeRecruitmentRequestModal = function() {
      const modal = document.getElementById('recruitmentRequestModal');
      if (modal) {
        modal.remove();
      }
    };

    
    // Função para redirecionar vaga
    window.redirectRecruitmentRequest = function(requestId) {
      const requests = window.loadRecruitmentRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        alert('Solicitação não encontrada.');
        return;
      }
      
      // Atualizar status para "redirected"
      request.status = 'redirected';
      request.redirectedAt = new Date().toISOString();
      
      // Salvar de volta no localStorage
      const allRequests = window.loadRecruitmentRequests();
      const index = allRequests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        allRequests[index] = request;
        localStorage.setItem('recruitmentRequests', JSON.stringify(allRequests));
        localStorage.setItem('recruitmentRequestsUpdatedAt', Date.now().toString());
      }
      
      // Redirecionar para a página pública de vagas
      const redirectUrl = '../pages/vagas-publicas.html';
      window.open(redirectUrl, '_blank');
      
      // Fechar modal e atualizar lista
      closeRecruitmentRequestModal();
      window.renderRecruitmentRequests();
    };
    
    // Funções auxiliares
    function getEducationText(level) {
      const levels = {
        'fundamental': 'Ensino Fundamental',
        'medio': 'Ensino Médio',
        'tecnico': 'Técnico',
        'superior': 'Superior',
        'pos_graduacao': 'Pós-Graduação'
      };
      return levels[level] || level;
    }
    
    function getExperienceText(exp) {
      const experiences = {
        'sem_experiencia': 'Sem experiência',
        '6_meses': '6 meses',
        '1_ano': '1 ano',
        '2_anos': '2 anos',
        '3_anos': '3 anos',
        '5_anos': '5 anos ou mais'
      };
      return experiences[exp] || exp;
    }
    
    function getStatusText(status) {
      const statuses = {
        'pending': 'Pendente',
        'approved': 'Aprovada',
        'rejected': 'Rejeitada',
        'redirected': 'Redirecionada'
      };
      return statuses[status] || status;
    }
    
    function getStatusClass(status) {
      const classes = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected',
        'redirected': 'status-redirected'
      };
      return classes[status] || 'status-pending';
    }
    
    // Carregar solicitações se a aba já estiver ativa ao carregar a página
    setTimeout(() => {
      if (document.getElementById('recruitmentRequestsTab')?.classList.contains('active')) {
        if (typeof window.renderRecruitmentRequests === 'function') {
          window.renderRecruitmentRequests();
        }
      }
    }, 100);

    // ==================== FIM SOLICITAÇÕES DE RECRUTAMENTO ====================

    // ==================== GERENCIAMENTO DE VAGAS ====================

    // Função auxiliar para obter usuário atual
    function getCurrentUser() {
      try {
        if (typeof secureAuth !== 'undefined' && secureAuth.getCurrentUser) {
          return secureAuth.getCurrentUser();
        }
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : {};
      } catch (e) {
        return {};
      }
    }

    // Função para carregar dados de gerenciamento de vagas
    function loadJobManagementData() {
      console.log('💼 Carregando dados de gerenciamento de vagas...');
      
      // Carregar solicitações do localStorage
      const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
      
      // Carregar vagas publicadas
      const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
      
      // Carregar candidaturas
      const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      
      // Separar por status
      const pending = requests.filter(r => r.status === 'pending');
      const rejected = requests.filter(r => r.status === 'rejected');
      const published = publishedJobs.filter(j => j.isPublished === true);
      
      // Atualizar badges
      updateJobBadges(pending.length, published.length, rejected.length, applications.length);
      
      // Renderizar listas
      renderJobList('pendingJobsList', pending, 'pending');
      renderJobList('publishedJobsList', published, 'published');
      renderJobList('rejectedJobsList', rejected, 'rejected');
      
      // Renderizar candidaturas
      renderApplicationsList('applicationsList', applications);
    }

    // Expor função no escopo global
    window.loadJobManagementData = loadJobManagementData;

    // Função para atualizar badges
    function updateJobBadges(pending, published, rejected, applications = 0) {
      const badges = {
        'requestsBadge': pending,
        'publishedBadge': published,
        'rejectedBadge': rejected,
        'applicationsBadge': applications
      };
      
      Object.keys(badges).forEach(badgeId => {
        const badge = document.getElementById(badgeId);
        if (badge) {
          badge.textContent = badges[badgeId];
          badge.style.display = badges[badgeId] > 0 ? 'inline-block' : 'none';
        }
      });
    }

    // Função para renderizar lista de vagas
    function renderJobList(containerId, jobs, status) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      if (jobs.length === 0) {
        container.innerHTML = `
          <div class="no-jobs-message">
            <i class='bx bx-inbox' style="font-size: 3em; color: #ccc; margin-bottom: 15px;"></i>
            <p>Nenhuma vaga encontrada</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = jobs.map(job => createJobCard(job, status)).join('');
      
      // Adicionar event listeners aos botões
      container.querySelectorAll('.view-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.closest('.job-management-card').dataset.jobId;
          openJobDetailModal(jobId, status);
        });
      });
      
      container.querySelectorAll('.reject-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.closest('.job-management-card').dataset.jobId;
          rejectJob(jobId);
        });
      });
      
      container.querySelectorAll('.publish-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.closest('.job-management-card').dataset.jobId;
          publishJob(jobId);
        });
      });
      
      container.querySelectorAll('.unpublish-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.closest('.job-management-card').dataset.jobId;
          unpublishJob(jobId);
        });
      });
    }

    // Função para renderizar lista de candidaturas
    function renderApplicationsList(containerId, applications) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      if (applications.length === 0) {
        container.innerHTML = `
          <div class="no-jobs-message">
            <i class='bx bx-inbox' style="font-size: 3em; color: #ccc; margin-bottom: 15px;"></i>
            <p>Nenhuma candidatura recebida ainda</p>
          </div>
        `;
        return;
      }
      
      // Ordenar por data (mais recentes primeiro)
      const sortedApplications = [...applications].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      container.innerHTML = sortedApplications.map(app => createApplicationCard(app)).join('');
      
      // Adicionar event listeners aos botões
      container.querySelectorAll('.view-application-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const applicationId = e.target.closest('.job-management-card').dataset.applicationId;
          openApplicationDetailModal(applicationId);
        });
      });
      
      container.querySelectorAll('.download-resume-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const applicationId = e.target.closest('.job-management-card').dataset.applicationId;
          downloadResume(applicationId);
        });
      });
    }

    // Função para criar card de candidatura
    function createApplicationCard(application) {
      const statusBadge = getApplicationStatusBadge(application.status);
      const date = new Date(application.createdAt);
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const hasResume = application.resumeBase64 ? 'Sim' : 'Não';
      
      return `
        <div class="job-management-card" data-application-id="${application.id}">
          <div class="job-card-header">
            <div class="job-card-title-section">
              <h3 class="job-card-title">${application.fullName || 'Nome não informado'}</h3>
              <span class="job-card-company">${application.jobTitle || 'Vaga não encontrada'} - ${application.jobCompany || 'Empresa'}</span>
            </div>
            <div class="job-card-badges">
              ${statusBadge}
              <span class="job-card-date">${formattedDate}</span>
            </div>
          </div>
          <div class="job-card-info">
            <div class="job-info-item">
              <i class='bx bx-envelope'></i>
              <span>${application.email || 'Não informado'}</span>
            </div>
            <div class="job-info-item">
              <i class='bx bx-phone'></i>
              <span>${application.phone || 'Não informado'}</span>
            </div>
            <div class="job-info-item">
              <i class='bx bx-file'></i>
              <span>Currículo: ${hasResume}</span>
            </div>
          </div>
          ${application.coverMessage ? `
            <div class="job-card-description">
              <strong>Mensagem:</strong> ${application.coverMessage.substring(0, 150)}${application.coverMessage.length > 150 ? '...' : ''}
            </div>
          ` : ''}
          <div class="job-card-actions">
            <button class="job-action-btn view-job-btn view-application-btn" title="Ver detalhes">
              <i class='bx bx-show'></i> Ver Detalhes
            </button>
            ${application.resumeBase64 ? `
              <button class="job-action-btn view-job-btn download-resume-btn" title="Baixar currículo">
                <i class='bx bx-download'></i> Baixar CV
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Função para obter badge de status da candidatura
    function getApplicationStatusBadge(status) {
      const statusMap = {
        'pending': { text: 'Pendente', class: 'status-pending' },
        'reviewed': { text: 'Revisada', class: 'status-approved' },
        'contacted': { text: 'Contatada', class: 'status-published' },
        'rejected': { text: 'Rejeitada', class: 'status-rejected' },
        'hired': { text: 'Contratada', class: 'status-approved' }
      };
      
      const statusInfo = statusMap[status] || statusMap['pending'];
      return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    // Função para abrir modal de detalhes da candidatura
    function openApplicationDetailModal(applicationId) {
      const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      const application = applications.find(a => a.id === applicationId);
      
      if (!application) {
        console.error('Candidatura não encontrada:', applicationId);
        alert('Candidatura não encontrada!');
        return;
      }

      const modal = document.getElementById('jobDetailModal');
      const modalBody = document.getElementById('jobDetailModalBody');
      const modalFooter = document.getElementById('jobDetailModalFooter');
      const modalTitle = document.getElementById('modalJobTitle');
      
      if (!modal || !modalBody || !modalFooter || !modalTitle) return;
      
      modalTitle.textContent = `Candidatura de ${application.fullName}`;
      
      // Preencher corpo do modal
      const date = new Date(application.createdAt);
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      modalBody.innerHTML = `
        <div class="job-detail-section">
          <h3>Informações da Vaga</h3>
          <div class="job-detail-item"><strong>Cargo:</strong> ${application.jobTitle || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Empresa:</strong> ${application.jobCompany || 'Não informado'}</div>
        </div>

        <div class="job-detail-section">
          <h3>Dados do Candidato</h3>
          <div class="job-detail-item"><strong>Nome Completo:</strong> ${application.fullName || 'Não informado'}</div>
          <div class="job-detail-item"><strong>E-mail:</strong> <a href="mailto:${application.email}">${application.email || 'Não informado'}</a></div>
          <div class="job-detail-item"><strong>Telefone:</strong> <a href="tel:${application.phone}">${application.phone || 'Não informado'}</a></div>
        </div>

        ${application.coverMessage ? `
        <div class="job-detail-section">
          <h3>Mensagem de Apresentação</h3>
          <p style="white-space: pre-wrap;">${application.coverMessage}</p>
        </div>
        ` : ''}

        ${application.resumeBase64 ? `
        <div class="job-detail-section">
          <h3>Currículo</h3>
          <div class="job-detail-item">
            <strong>Arquivo:</strong> ${application.resumeFileName || 'curriculo.pdf'}
            <br>
            <small>Tamanho: ${application.resumeFileSize ? (application.resumeFileSize / 1024).toFixed(2) + ' KB' : 'Não informado'}</small>
          </div>
          <button class="btn-download-resume" onclick="downloadResume('${application.id}')" style="margin-top: 10px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class='bx bx-download'></i> Baixar Currículo
          </button>
        </div>
        ` : ''}

        <div class="job-detail-section">
          <h3>Informações do Sistema</h3>
          <div class="job-detail-item"><strong>Status:</strong> ${getApplicationStatusBadge(application.status)}</div>
          <div class="job-detail-item"><strong>Data de Candidatura:</strong> ${formattedDate}</div>
          ${application.reviewedAt ? `<div class="job-detail-item"><strong>Revisada em:</strong> ${new Date(application.reviewedAt).toLocaleString('pt-BR')}</div>` : ''}
          ${application.reviewedBy ? `<div class="job-detail-item"><strong>Revisada por:</strong> ${application.reviewedBy}</div>` : ''}
        </div>
      `;
      
      // Preencher rodapé com ações
      const currentUser = getCurrentUser();
      const userName = currentUser.fullName || currentUser.username || 'Admin';
      
      modalFooter.innerHTML = `
        <button class="btn-close-modal" onclick="closeJobDetailModal()">
          <i class='bx bx-x'></i> Fechar
        </button>
        ${application.status === 'pending' ? `
          <button class="btn-approve-job" onclick="updateApplicationStatus('${application.id}', 'reviewed', '${userName}')">
            <i class='bx bx-check'></i> Marcar como Revisada
          </button>
          <button class="btn-approve-job" onclick="updateApplicationStatus('${application.id}', 'contacted', '${userName}')" style="background: #3b82f6;">
            <i class='bx bx-phone'></i> Marcar como Contatada
          </button>
        ` : ''}
        ${application.status !== 'rejected' ? `
          <button class="btn-reject-job" onclick="updateApplicationStatus('${application.id}', 'rejected', '${userName}')">
            <i class='bx bx-x'></i> Rejeitar
          </button>
        ` : ''}
        ${application.status !== 'hired' ? `
          <button class="btn-approve-job" onclick="updateApplicationStatus('${application.id}', 'hired', '${userName}')" style="background: #10b981;">
            <i class='bx bx-check-circle'></i> Contratar
          </button>
        ` : ''}
      `;
      
      modal.classList.remove('hidden');
    }

    // Função para baixar currículo
    function downloadResume(applicationId) {
      const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      const application = applications.find(a => a.id === applicationId);
      
      if (!application || !application.resumeBase64) {
        alert('Currículo não encontrado!');
        return;
      }
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = application.resumeBase64;
      link.download = application.resumeFileName || `curriculo_${application.fullName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Função para atualizar status da candidatura
    function updateApplicationStatus(applicationId, newStatus, reviewedBy) {
      const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      const applicationIndex = applications.findIndex(a => a.id === applicationId);
      
      if (applicationIndex === -1) {
        alert('Candidatura não encontrada!');
        return;
      }
      
      applications[applicationIndex].status = newStatus;
      applications[applicationIndex].reviewedAt = new Date().toISOString();
      applications[applicationIndex].reviewedBy = reviewedBy;
      
      localStorage.setItem('jobApplications', JSON.stringify(applications));
      localStorage.setItem('jobApplicationsUpdatedAt', Date.now().toString());
      
      // Recarregar dados
      if (typeof loadJobManagementData === 'function') {
        loadJobManagementData();
      }
      
      // Fechar modal e reabrir para mostrar atualização
      closeJobDetailModal();
      setTimeout(() => {
        openApplicationDetailModal(applicationId);
      }, 100);
    }

    // Expor funções no escopo global
    window.openApplicationDetailModal = openApplicationDetailModal;
    window.downloadResume = downloadResume;
    window.updateApplicationStatus = updateApplicationStatus;

    // Função para criar card de vaga
    function createJobCard(job, status) {
      const statusBadge = getStatusBadge(job.status || status);
      const date = new Date(job.createdAt || Date.now());
      const formattedDate = date.toLocaleDateString('pt-BR');
      
      let actions = '';
      if (status === 'pending') {
        actions = `
          <button class="job-action-btn publish-job-btn" title="Publicar">
            <i class='bx bx-globe'></i> Publicar
          </button>
          <button class="job-action-btn reject-job-btn" title="Rejeitar">
            <i class='bx bx-x'></i> Rejeitar
          </button>
        `;
      } else if (status === 'published') {
        actions = `
          <button class="job-action-btn unpublish-job-btn" title="Despublicar">
            <i class='bx bx-hide'></i> Despublicar
          </button>
        `;
      }
      
      return `
        <div class="job-management-card" data-job-id="${job.id}">
          <div class="job-card-header">
            <div class="job-card-title-section">
              <h3 class="job-card-title">${job.jobTitle || 'Sem título'}</h3>
              <span class="job-card-company">${job.contributorName || 'Empresa não informada'}</span>
            </div>
            <div class="job-card-badges">
              ${statusBadge}
              <span class="job-card-date">${formattedDate}</span>
            </div>
          </div>
          <div class="job-card-info">
            <div class="job-info-item">
              <i class='bx bx-user'></i>
              <span>${job.vacancyQuantity || 1} vaga(s)</span>
            </div>
            <div class="job-info-item">
              <i class='bx bx-dollar'></i>
              <span>${job.salary || 'A combinar'}</span>
            </div>
            <div class="job-info-item">
              <i class='bx bx-time'></i>
              <span>${job.workSchedule || 'Não especificado'}</span>
            </div>
            <div class="job-info-item">
              <i class='bx bx-map'></i>
              <span>${formatLocationPreference(job.locationPreference)}</span>
            </div>
          </div>
          <div class="job-card-description">
            ${(job.jobDescription || '').substring(0, 150)}${(job.jobDescription || '').length > 150 ? '...' : ''}
          </div>
          <div class="job-card-actions">
            <button class="job-action-btn view-job-btn" title="Ver detalhes">
              <i class='bx bx-show'></i> Ver Detalhes
            </button>
            ${actions}
          </div>
        </div>
      `;
    }

    // Função para obter badge de status
    function getStatusBadge(status) {
      const badges = {
        'pending': '<span class="status-badge status-pending">Pendente</span>',
        'approved': '<span class="status-badge status-approved">Aprovada</span>',
        'rejected': '<span class="status-badge status-rejected">Rejeitada</span>',
        'published': '<span class="status-badge status-published">Publicada</span>'
      };
      return badges[status] || badges['pending'];
    }

    // Função para formatar preferência de localização
    function formatLocationPreference(preference) {
      const map = {
        'remoto': 'Remoto',
        'presencial': 'Presencial',
        'hibrido': 'Híbrido',
        'qualquer': 'Qualquer localização',
        'proximo': 'Proximidade obrigatória',
        'mesma_cidade': 'Mesma cidade',
        'mesmo_estado': 'Mesmo estado'
      };
      return map[preference] || preference || 'Não especificado';
    }

    // Função para abrir modal de detalhes
    function openJobDetailModal(jobId, status) {
      let job;
      
      if (status === 'published') {
        const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
        job = publishedJobs.find(j => j.id === jobId);
      } else {
        const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
        job = requests.find(r => r.id === jobId);
      }
      
      if (!job) {
        console.error('Vaga não encontrada:', jobId);
        return;
      }
      
      const modal = document.getElementById('jobDetailModal');
      const modalBody = document.getElementById('jobDetailModalBody');
      const modalFooter = document.getElementById('jobDetailModalFooter');
      const modalTitle = document.getElementById('modalJobTitle');
      
      if (!modal || !modalBody || !modalFooter || !modalTitle) return;
      
      modalTitle.textContent = job.jobTitle || 'Detalhes da Vaga';
      
      // Preencher corpo do modal
      modalBody.innerHTML = `
        <div class="job-detail-section">
          <h3>Informações Básicas</h3>
          <div class="job-detail-item"><strong>Empresa:</strong> ${job.contributorName || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Cargo:</strong> ${job.jobTitle || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Vagas Disponíveis:</strong> ${job.vacancyQuantity || 1}</div>
          <div class="job-detail-item"><strong>Salário:</strong> ${job.salary || 'A combinar'}</div>
          <div class="job-detail-item"><strong>Regime:</strong> ${job.workSchedule || 'Não especificado'}</div>
          <div class="job-detail-item"><strong>Localização:</strong> ${formatLocationPreference(job.locationPreference)}</div>
          ${job.companyAddress ? `<div class="job-detail-item"><strong>Endereço:</strong> ${job.companyAddress}</div>` : ''}
          ${job.maxDistance ? `<div class="job-detail-item"><strong>Distância Máxima:</strong> ${job.maxDistance} km</div>` : ''}
        </div>

        <div class="job-detail-section">
          <h3>Descrição da Vaga</h3>
          <p>${job.jobDescription || 'Não informado'}</p>
        </div>

        ${job.requiredSkills ? `
        <div class="job-detail-section">
          <h3>Requisitos e Qualificações</h3>
          <p>${job.requiredSkills}</p>
          ${job.educationLevel ? `<p><strong>Escolaridade:</strong> ${formatEducationLevel(job.educationLevel)}</p>` : ''}
          ${job.experienceRequired ? `<p><strong>Experiência:</strong> ${formatExperience(job.experienceRequired)}</p>` : ''}
        </div>
        ` : ''}

        ${job.benefits ? `
        <div class="job-detail-section">
          <h3>Benefícios</h3>
          <p>${job.benefits}</p>
        </div>
        ` : ''}

        ${job.contactEmail || job.contactPhone ? `
        <div class="job-detail-section">
          <h3>Contato</h3>
          ${job.contactEmail ? `<div class="job-detail-item"><strong>E-mail:</strong> ${job.contactEmail}</div>` : ''}
          ${job.contactPhone ? `<div class="job-detail-item"><strong>Telefone:</strong> ${job.contactPhone}</div>` : ''}
        </div>
        ` : ''}

        <div class="job-detail-section">
          <h3>Informações do Sistema</h3>
          <div class="job-detail-item"><strong>Status:</strong> ${getStatusBadge(job.status || status)}</div>
          <div class="job-detail-item"><strong>Data de Criação:</strong> ${new Date(job.createdAt).toLocaleString('pt-BR')}</div>
          ${job.publishedAt ? `<div class="job-detail-item"><strong>Data de Publicação:</strong> ${new Date(job.publishedAt).toLocaleString('pt-BR')}</div>` : ''}
        </div>
      `;
      
      // Preencher rodapé com ações
      let footerActions = '';
      if (status === 'pending') {
        footerActions = `
          <button class="btn-publish-job" onclick="publishJob('${jobId}')">
            <i class='bx bx-globe'></i> Publicar
          </button>
          <button class="btn-reject-job" onclick="rejectJob('${jobId}')">
            <i class='bx bx-x'></i> Rejeitar
          </button>
        `;
      } else if (status === 'published') {
        footerActions = `
          <button class="btn-unpublish-job" onclick="unpublishJob('${jobId}')">
            <i class='bx bx-hide'></i> Despublicar
          </button>
        `;
      }
      
      modalFooter.innerHTML = footerActions + `
        <button class="btn-close-modal" onclick="closeJobDetailModal()">
          <i class='bx bx-x'></i> Fechar
        </button>
      `;
      
      modal.classList.remove('hidden');
    }

    // Função para fechar modal
    function closeJobDetailModal() {
      const modal = document.getElementById('jobDetailModal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }

    // Expor funções no escopo global para uso em onclick
    window.closeJobDetailModal = closeJobDetailModal;

    // Função para aprovar vaga
    function approveJob(jobId) {
      const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
      const jobIndex = requests.findIndex(r => r.id === jobId);
      
      if (jobIndex === -1) {
        alert('Vaga não encontrada!');
        return;
      }
      
      requests[jobIndex].status = 'approved';
      requests[jobIndex].approvedAt = new Date().toISOString();
      requests[jobIndex].approvedBy = getCurrentUser()?.username || 'Admin';
      
      localStorage.setItem('recruitmentRequests', JSON.stringify(requests));
      localStorage.setItem('recruitmentRequestsUpdatedAt', Date.now().toString());
      
      // Recarregar dados
      loadJobManagementData();
      closeJobDetailModal();
      
      // Mostrar notificação
      if (typeof showToast === 'function') {
        showToast('Vaga aprovada com sucesso!', 'success');
      } else {
        alert('Vaga aprovada com sucesso!');
      }
    }

    // Expor função no escopo global
    window.approveJob = approveJob;

    // Função para rejeitar vaga
    function rejectJob(jobId) {
      const reason = prompt('Informe o motivo da rejeição (opcional):');
      
      const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
      const jobIndex = requests.findIndex(r => r.id === jobId);
      
      if (jobIndex === -1) {
        alert('Vaga não encontrada!');
        return;
      }
      
      requests[jobIndex].status = 'rejected';
      requests[jobIndex].rejectedAt = new Date().toISOString();
      requests[jobIndex].rejectedBy = getCurrentUser()?.username || 'Admin';
      if (reason) {
        requests[jobIndex].rejectionReason = reason;
      }
      
      localStorage.setItem('recruitmentRequests', JSON.stringify(requests));
      localStorage.setItem('recruitmentRequestsUpdatedAt', Date.now().toString());
      
      // Remover da lista de publicadas se estiver lá
      const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
      const publishedIndex = publishedJobs.findIndex(j => j.id === jobId);
      if (publishedIndex !== -1) {
        publishedJobs.splice(publishedIndex, 1);
        localStorage.setItem('publishedJobs', JSON.stringify(publishedJobs));
      }
      
      // Recarregar dados
      loadJobManagementData();
      closeJobDetailModal();
      
      // Mostrar notificação
      if (typeof showToast === 'function') {
        showToast('Vaga rejeitada.', 'info');
      } else {
        alert('Vaga rejeitada.');
      }
    }

    // Expor função no escopo global
    window.rejectJob = rejectJob;

    // Função para publicar vaga
    function publishJob(jobId) {
      const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
      const job = requests.find(r => r.id === jobId);
      
      if (!job) {
        alert('Vaga não encontrada!');
        return;
      }
      
      // Permitir publicar diretamente de pending
      if (job.status !== 'pending' && job.status !== 'approved') {
        alert('Apenas solicitações pendentes podem ser publicadas!');
        return;
      }
      
      // Adicionar à lista de publicadas
      const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
      
      // Verificar se já não está publicada
      if (publishedJobs.find(j => j.id === jobId)) {
        alert('Esta vaga já está publicada!');
        return;
      }
      
      const publishedJob = {
        ...job,
        isPublished: true,
        publishedAt: new Date().toISOString(),
        publishedBy: getCurrentUser()?.username || 'Admin',
        status: 'published'
      };
      
      publishedJobs.push(publishedJob);
      localStorage.setItem('publishedJobs', JSON.stringify(publishedJobs));
      
      // Atualizar status na solicitação original
      job.status = 'published';
      job.isPublished = true;
      job.publishedAt = publishedJob.publishedAt;
      localStorage.setItem('recruitmentRequests', JSON.stringify(requests));
      localStorage.setItem('recruitmentRequestsUpdatedAt', Date.now().toString());
      
      // Recarregar dados
      loadJobManagementData();
      closeJobDetailModal();
      
      // Mostrar notificação
      if (typeof showToast === 'function') {
        showToast('Vaga publicada com sucesso!', 'success');
      } else {
        alert('Vaga publicada com sucesso!');
      }
    }

    // Expor função no escopo global
    window.publishJob = publishJob;

    // Função para despublicar vaga
    function unpublishJob(jobId) {
      if (!confirm('Tem certeza que deseja despublicar esta vaga?')) {
        return;
      }
      
      const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
      const jobIndex = publishedJobs.findIndex(j => j.id === jobId);
      
      if (jobIndex === -1) {
        alert('Vaga não encontrada!');
        return;
      }
      
      publishedJobs[jobIndex].isPublished = false;
      publishedJobs[jobIndex].unpublishedAt = new Date().toISOString();
      publishedJobs[jobIndex].unpublishedBy = getCurrentUser()?.username || 'Admin';
      
      localStorage.setItem('publishedJobs', JSON.stringify(publishedJobs));
      
      // Atualizar status na solicitação original
      const requests = JSON.parse(localStorage.getItem('recruitmentRequests') || '[]');
      const requestIndex = requests.findIndex(r => r.id === jobId);
      if (requestIndex !== -1) {
        requests[requestIndex].isPublished = false;
        requests[requestIndex].status = 'pending'; // Volta para pendente
        localStorage.setItem('recruitmentRequests', JSON.stringify(requests));
      }
      
      // Recarregar dados
      loadJobManagementData();
      closeJobDetailModal();
      
      // Mostrar notificação
      if (typeof showToast === 'function') {
        showToast('Vaga despublicada com sucesso!', 'info');
      } else {
        alert('Vaga despublicada com sucesso!');
      }
    }

    // Expor função no escopo global
    window.unpublishJob = unpublishJob;

    // Funções auxiliares
    function formatEducationLevel(level) {
      const map = {
        'fundamental': 'Ensino Fundamental',
        'medio': 'Ensino Médio',
        'tecnico': 'Técnico',
        'superior': 'Superior',
        'pos_graduacao': 'Pós-Graduação'
      };
      return map[level] || level;
    }

    function formatExperience(experience) {
      const map = {
        'sem_experiencia': 'Sem experiência',
        '6_meses': '6 meses',
        '1_ano': '1 ano',
        '2_anos': '2 anos',
        '3_anos': '3 anos',
        '5_anos': '5 anos ou mais'
      };
      return map[experience] || experience;
    }

    // Event listeners para tabs de gerenciamento de vagas
    const jobTabs = document.querySelectorAll('.job-tab');
    const jobTabPanels = document.querySelectorAll('.job-tab-panel');
    
    jobTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Remover active de todas as tabs e panels
        jobTabs.forEach(t => t.classList.remove('active'));
        jobTabPanels.forEach(p => p.classList.remove('active'));
        
        // Adicionar active na tab e panel selecionados
        tab.classList.add('active');
        const panel = document.getElementById(targetTab + 'Tab');
        if (panel) {
          panel.classList.add('active');
        }
        
        // Recarregar dados da tab selecionada
        if (typeof loadJobManagementData === 'function') {
          loadJobManagementData();
        }
      });
    });
    
    // Fechar modal ao clicar fora
    const jobDetailModal = document.getElementById('jobDetailModal');
    if (jobDetailModal) {
      jobDetailModal.addEventListener('click', (e) => {
        if (e.target.id === 'jobDetailModal') {
          closeJobDetailModal();
        }
      });
    }
    
    const closeJobDetailModalBtn = document.getElementById('closeJobDetailModal');
    if (closeJobDetailModalBtn) {
      closeJobDetailModalBtn.addEventListener('click', closeJobDetailModal);
    }

    // ==================== FIM GERENCIAMENTO DE VAGAS ====================

  });

