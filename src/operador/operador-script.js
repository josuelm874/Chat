// generateUniqueId, getCurrentTime, getRelativeDate, createDateDivider
// definidas em shared/utils.js (carregado antes deste arquivo)

// Função para obter data relativa ou formatada — mantida localmente por compatibilidade
// TODO: remover quando confirmar que operador/index.html carrega utils.js antes

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


  }

  

  return result;

}



// Função para extrair emojis de uma string (melhorada para todos os tipos)

function extractEmojis(text) {

  // Regex avançada que captura emojis simples e complexos (incluindo ZWJ sequences)

  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

  const matches = text.match(emojiRegex) || [];

  



  

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


  return result;

}



// Função para obter URL da animação Lottie do Noto Emoji

function getNotoEmojiLottieUrl(emoji) {

  const codepoint = getEmojiCodepoint(emoji);

  const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/lottie.json`;


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







}



// Função para tentar carregar Lottie com fallback automático

async function loadLottieWithFallback(emoji, lottieDiv, container) {

  const lottieUrl = getNotoEmojiLottieUrl(emoji);

  

  emojiStats.total++;

  

  // Se já sabemos que não tem Lottie, usar fallback direto

  if (noLottieEmojis.has(emoji)) {


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


    return;

  }

  

  // Tentar carregar do servidor

  try {


    

    const response = await fetch(lottieUrl);


    

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


    

    // Mostrar estatísticas a cada 5 emojis processados

    if (emojiStats.total % 5 === 0) {

      showEmojiStats();

    }

    

  } catch (error) {

    // Registrar que este emoji não tem Lottie

    noLottieEmojis.add(emoji);

    emojiStats.fallback++;

    





    

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

    'ppt': 'bx-slideshow', 'pptx': 'bx-slideshow',

    'zip': 'bx-archive', 'rar': 'bx-archive', '7z': 'bx-archive',

    'mp3': 'bx-music', 'wav': 'bx-music', 'm4a': 'bx-music', 'ogg': 'bx-music', 'flac': 'bx-music',

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

  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);

}



function isAudioFile(fileName) {

  const ext = fileName.split('.').pop().toLowerCase();

  return ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'flac', 'aac'].includes(ext);

}



function showToast(message, type = 'info') {

  const toast = document.createElement('div');

  toast.textContent = message;

  toast.style.cssText = `

    position: fixed; top: 20px; right: 20px; z-index: 10000;

    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};

    color: white; padding: 12px 20px; border-radius: 8px;

    animation: slideIn 0.35s var(--ease-out-smooth);

  `;

  document.body.appendChild(toast);

  setTimeout(() => {

    toast.style.animation = 'slideOut 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

    setTimeout(() => toast.remove(), 350);

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
const ADMIN_SECTOR = 'Administração';
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
  // Sincronizar com Supabase (fire-and-forget para não bloquear o fluxo síncrono)
  if (typeof window !== 'undefined' && window.supabaseSync && typeof window.supabaseSync.save === 'function') {
    window.supabaseSync.save('users', sanitized).catch(e =>
      console.warn('[persistUsersToStorage] Falha ao sincronizar users com Supabase:', e)
    );
  }
  return sanitized;
}

function getUsersFromStorage() {
  return sanitizeUsers(safeJsonParse(localStorage.getItem('users'), []));
}

function ensureAdminUser() {
  const users = safeJsonParse(localStorage.getItem('users'), []);
  const sanitized = sanitizeUsers(users);
  // sanitizeUsers já garante que o admin (adm) está sempre no índice 0.
  // Não adicionar um segundo admin aqui — isso causaria duplicata.
  return sanitized;
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
  const rawContributors = getStorageItem("contributors", []);
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

  sanitize: (text) => escapeHtml(text),

  validateFile: (file) => file ? { valid: true, errors: [] } : { valid: false, errors: ['Sem arquivo'] }

};



// Inicializar usuários padrão

async function initializeDefaultUsers() {

  try {

    ensureAdminUser();
  } catch (error) {


  }

}



// Chamar inicialização ao carregar o script (aguardar auth.js carregar)

document.addEventListener('DOMContentLoaded', async () => {

  await initializeDefaultUsers();

});






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

  // Verificar se o usuário veio da nova tela de login (/login/index.html).
  // O login-script.js salva 'currentUser' ao autenticar — usamos isso como sinal.
  const currentUser = typeof secureAuth !== 'undefined' && secureAuth.getCurrentUser
    ? secureAuth.getCurrentUser()
    : null;
  const authenticatedViaLoginPage = typeof secureAuth !== 'undefined'
    && secureAuth.isAuthenticated()
    && !!(currentUser && currentUser.username);

  // Autenticado: via nova tela de login OU via "lembrar de mim" do login interno
  if (authenticatedViaLoginPage || (typeof secureAuth !== 'undefined' && secureAuth.isAuthenticated() && hasSavedCredentials)) {

    // Mostrar chat diretamente — sem precisar do login interno
    document.documentElement.classList.add('preload');
    loginContainer?.classList.add("hidden");
    chatApp.style.display = "flex";

    // Ajustar visibilidade do botão admin conforme role do usuário
    const adminSidebarButton = document.querySelector(".sidebar button[data-section='admin']");
    if (adminSidebarButton && currentUser) {
      adminSidebarButton.style.display = currentUser.role === "admin" ? "" : "none";
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('preload');
        if (typeof window.updateSidebarNotch === "function") window.updateSidebarNotch(false);
      });
    });

  } else {

    // Não autenticado — redirecionar para o login unificado
    if (typeof secureAuth !== 'undefined' && secureAuth.isAuthenticated()) {
      secureAuth.logout();
    }
    window.location.replace('/login/');

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

    

    if (authResult.success) {

      const user = authResult.user;

      const isContributor = user.role === "contributor";
      const needsOnboarding = isContributor && (user.mustResetPassword || user.status === "pending");
      pendingContributorContext = null;
      localStorage.setItem("clientName", user.fullName || user.username || "");

      // Esconder login e mostrar chat

      document.getElementById("dominium-login")?.classList.add("hidden");
      document.getElementById("chatApp").style.display = "flex";
      requestAnimationFrame(() => {
        if (typeof window.updateSidebarNotch === "function") window.updateSidebarNotch(false);
      });


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

  // Limpar sessão e redirecionar para login unificado
  if (typeof secureAuth !== 'undefined') {
    secureAuth.logout();
  } else {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
  }
  localStorage.removeItem("_session_at");
  window.location.replace('/login/');

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

    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);

  }



  // Verificar se arquivo é áudio

  function isAudioFile(fileName) {

    const ext = fileName.split('.').pop().toLowerCase();

    return ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'flac', 'aac'].includes(ext);

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

    // Se for áudio, mostrar player inline

    else if (isAudioFile(file.name)) {

      const wrap = document.createElement('div');

      wrap.classList.add('message-file-audio');

      const nameEl = document.createElement('div');

      nameEl.classList.add('message-file-name');

      nameEl.textContent = file.name;

      const audio = document.createElement('audio');

      audio.src = fileData;

      audio.controls = true;

      audio.preload = 'metadata';

      wrap.appendChild(nameEl);

      wrap.appendChild(audio);

      container.appendChild(wrap);

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

    // Prevenir restauração de scroll do browser (causaria deslocamento dos panels após reload)
    if (history.scrollRestoration) history.scrollRestoration = 'manual';

    // Prevenir flash de transições CSS no carregamento inicial
    // Remove a classe após 2 frames para garantir que o primeiro render seja estável
    document.documentElement.classList.add('preload');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('preload');
      });
    });

    // ==================== INICIALIZAÇÃO DO SISTEMA ====================

    ensureAdminUser();

    // ==================== BACKGROUND ASSÍNCRONO ====================
    // Carrega o MP4 (light e dark) de forma assíncrona para não bloquear o render inicial.
    // O #appBgLayer exibe cor sólida (--chat-app-bg) enquanto a mídia carrega, depois faz fade-in.
    (function initAppBackground() {
      const BG = {
        light: { type: 'video', src: '../../assets/images/branding/Background White.mp4' },
        dark:  { type: 'video', src: '../../assets/images/branding/Background Black.mp4' },
      };

      const layer = document.getElementById('appBgLayer');
      if (!layer) return;

      let currentSrc = null;

      function loadBackground(theme) {
        const cfg = BG[theme] || BG.light;
        if (currentSrc === cfg.src) return; // já carregado
        currentSrc = cfg.src;

        // Fade out e remove mídia anterior
        const prev = layer.firstElementChild;
        if (prev) {
          prev.classList.remove('loaded');
          setTimeout(() => { if (layer.contains(prev)) layer.removeChild(prev); }, 500);
        }

        if (cfg.type === 'video') {
          const vid = document.createElement('video');
          vid.autoplay = true;
          vid.loop = true;
          vid.muted = true;
          vid.playsInline = true;
          vid.setAttribute('playsinline', '');
          vid.disablePictureInPicture = true;
          vid.disableRemotePlayback = true;
          vid.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
          vid.src = cfg.src;
          layer.appendChild(vid);
          vid.addEventListener('canplay', function onCanPlay() {
            vid.removeEventListener('canplay', onCanPlay);
            vid.classList.add('loaded');
            vid.play().catch(() => {});
          }, { once: true });
          vid.load();
        } else {
          const img = document.createElement('img');
          img.alt = '';
          img.decoding = 'async';
          img.src = cfg.src;
          layer.appendChild(img);
          if (img.complete) {
            img.classList.add('loaded');
          } else {
            img.addEventListener('load', function() { img.classList.add('loaded'); }, { once: true });
          }
        }
      }

      // Expor para uso no setTheme
      window._loadAppBackground = loadBackground;
    })();

    // ==================== TEMA CLARO/ESCURO (PIN 2) ====================
    (function initTheme() {
      const root = document.documentElement;
      // Detectar preferência do sistema na primeira visita
      let stored = localStorage.getItem("operador-theme");
      if (!stored) {
        stored = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
          ? "dark" : "light";
      }
      root.setAttribute("data-theme", stored);

      const themeSwitch = document.getElementById("themeSwitch");
      const themeRingProgress = document.querySelector(".theme-switch-chain .theme-ring-progress");

      function syncThemeSwitch(theme) {
        if (themeSwitch) themeSwitch.checked = (theme === "dark");
      }
      syncThemeSwitch(stored);

      if (window._loadAppBackground) window._loadAppBackground(stored);

      function setTheme(theme) {
        root.setAttribute("data-theme", theme);
        localStorage.setItem("operador-theme", theme);
        syncThemeSwitch(theme);
        if (window._loadAppBackground) window._loadAppBackground(theme);
      }

      function playThemeRingAnimation(toDark) {
        if (!themeRingProgress) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        themeRingProgress.classList.remove("theme-ring-to-dark", "theme-ring-to-light");
        void themeRingProgress.offsetWidth;
        themeRingProgress.classList.add(toDark ? "theme-ring-to-dark" : "theme-ring-to-light");
      }

      if (themeRingProgress) {
        themeRingProgress.addEventListener("animationend", function (ev) {
          if (ev.target !== themeRingProgress) return;
          if (ev.animationName !== "theme-ring-to-dark" && ev.animationName !== "theme-ring-to-light") return;
          themeRingProgress.classList.remove("theme-ring-to-dark", "theme-ring-to-light");
        });
      }

      if (themeSwitch) {
        themeSwitch.addEventListener("change", function () {
          playThemeRingAnimation(this.checked);
          setTheme(this.checked ? "dark" : "light");
        });
      }

      if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
          if (!localStorage.getItem("operador-theme")) {
            var auto = e.matches ? "dark" : "light";
            root.setAttribute("data-theme", auto);
            syncThemeSwitch(auto);
            if (window._loadAppBackground) window._loadAppBackground(auto);
          }
        });
      }
    })();

    // ==================== SUPABASE: SYNC INICIAL + REAL-TIME ====================
    (function initSupabaseIntegration() {
      if (!window.supabaseSync) return;

      // Quando Supabase estiver pronto, executar sync + real-time
      window.supabaseSync.onReady(async function() {
        // Migração única de dados localStorage → Supabase
        var _cloudMigrated = 'softtech_cloud_migrated_v1';
        var _cloudMigratedLegacy = 'sercon_cloud_migrated_v1';
        if (!localStorage.getItem(_cloudMigrated) && !localStorage.getItem(_cloudMigratedLegacy)) {
          const migrationKeys = [
            'users', 'contributors', 'contributorContacts', 'contributorEmployees',
            'supportMessages', 'internalMessages', 'tasks', 'recruitmentRequests', 'chatui_lembretes'
          ];
          for (const key of migrationKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
              try { await window.supabaseSync.save(key, JSON.parse(raw)); } catch(e) {}
            }
          }
          localStorage.setItem(_cloudMigrated, '1');
        } else if (!localStorage.getItem(_cloudMigrated)) {
          localStorage.setItem(_cloudMigrated, '1');
        }

        // Sync bidirecional de todos os dados
        try {
          // Forçar refresh de 'users' direto do Supabase antes do sync geral.
          // Isso garante que dados locais desatualizados (ex: usuários deletados) não
          // sejam re-enviados ao Supabase pelo syncData quando localUpdated > cloudUpdated.
          await window.supabaseSync.refresh('users');

          const result = await window.supabaseSync.syncAll();
          // Recarregar listas após sync
          if (typeof updateSupportContactsList === 'function') updateSupportContactsList();
          if (typeof updateInternalContactsList === 'function') updateInternalContactsList();
          if (typeof renderLembretes === 'function') renderLembretes();
          if (typeof renderUsersList === 'function') renderUsersList();
        } catch(e) {
        }

        // Real-time subscriptions — canais guardados para unsubscribe no unload
        const _supaChannels = [];

        // Debounce para evitar chamadas concorrentes de updateChat
        let _updateChatTimer = null;
        function _debouncedUpdateChat(contactId) {
          clearTimeout(_updateChatTimer);
          _updateChatTimer = setTimeout(function() {
            if (typeof updateChat === 'function') {
              try { updateChat(contactId); } catch(e) {}
            }
          }, 80);
        }

        const _ch1 = window.supabaseSync.subscribeToKey('supportMessages', function() {
          if (typeof updateSupportContactsList === 'function') updateSupportContactsList();
          // Recarregar chat ativo se houver
          const activeContact = document.querySelector(".contacts-list .contact.active");
          if (activeContact) {
            const contactId = activeContact.getAttribute("data-contact-id");
            if (contactId) _debouncedUpdateChat(contactId);
          }
        });
        if (_ch1) _supaChannels.push(_ch1);

        const _ch2 = window.supabaseSync.subscribeToKey('internalMessages', function() {
          if (typeof updateInternalContactsList === 'function') updateInternalContactsList();
        });
        if (_ch2) _supaChannels.push(_ch2);

        const _ch3 = window.supabaseSync.subscribeToKey('users', function() {
          if (typeof renderUsersList === 'function') renderUsersList();
        });
        if (_ch3) _supaChannels.push(_ch3);

        const _ch4 = window.supabaseSync.subscribeToKey('contributors', function() {
          if (typeof renderContributorsList === 'function') renderContributorsList();
        });
        if (_ch4) _supaChannels.push(_ch4);

        // Limpar subscriptions ao sair da página
        window.addEventListener('beforeunload', function() {
          _supaChannels.forEach(function(ch) { try { ch.unsubscribe(); } catch(e) {} });
        });
      });
    })();

    // Tooltip bar estilo Arch Linux (barra que expande à direita do ícone)
    let hideSidebarTooltipBar = async () => {};
    let _tooltipPendingShow = null;

    (function initSidebarTooltipBar() {
      const tooltipBar = document.getElementById("sidebar-tooltip-bar");
      const lists = document.querySelectorAll(".sidebar .center-icons .list");
      if (!tooltipBar || !lists.length) return;

      // Listener global: quando a transição de retração terminar, executa o próximo show
      tooltipBar.addEventListener("transitionend", (e) => {
        if (e.propertyName !== "max-width") return;
        if (tooltipBar.classList.contains("visible")) return;
        tooltipBar.classList.remove("retracting");
        if (_tooltipPendingShow) {
          const fn = _tooltipPendingShow;
          _tooltipPendingShow = null;
          fn();
        }
      });

      // Aplica o tooltip para um ícone
      const applyTooltip = (btn, titleEl) => {
        const icon = btn.querySelector(".icon");
        const rect = icon ? icon.getBoundingClientRect() : btn.getBoundingClientRect();
        tooltipBar.classList.remove("retracting");
        tooltipBar.style.setProperty("--tooltip-x", `${rect.right}px`);
        tooltipBar.style.setProperty("--tooltip-y", `${rect.top}px`);
        tooltipBar.style.setProperty("--tooltip-h", `${rect.height}px`);
        tooltipBar.textContent = titleEl.textContent.trim();
        tooltipBar.classList.add("visible");
        tooltipBar.setAttribute("aria-hidden", "false");
      };

      // Retrai o tooltip com animação rápida
      // Só adiciona .retracting se o tooltip estava visível — evita travar o estado
      // quando é chamado em ícone ativo (onde o tooltip nunca foi exibido).
      const retractTooltip = () => {
        if (tooltipBar.classList.contains("visible")) {
          tooltipBar.classList.add("retracting");
        }
        tooltipBar.classList.remove("visible");
        tooltipBar.setAttribute("aria-hidden", "true");
      };

      // Promessa usada pelo click handler da sidebar (aguarda retração completa)
      hideSidebarTooltipBar = () => {
        _tooltipPendingShow = null;
        if (!tooltipBar.classList.contains("visible") && !tooltipBar.classList.contains("retracting")) {
          return Promise.resolve();
        }
        retractTooltip();
        return new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            tooltipBar.removeEventListener("transitionend", h);
            tooltipBar.classList.remove("retracting");
            resolve();
          };
          const h = (e) => { if (e.propertyName === "max-width") finish(); };
          tooltipBar.addEventListener("transitionend", h);
          setTimeout(finish, 220);
        });
      };

      lists.forEach((list) => {
        const btn = list.querySelector("button");
        const titleEl = list.querySelector(".title");
        if (!btn || !titleEl) return;
        const isActive = () => btn.classList.contains("active");

        list.addEventListener("mouseenter", () => {
          _tooltipPendingShow = null;
          if (isActive()) return;

          const isShowingOrRetracting =
            tooltipBar.classList.contains("visible") ||
            tooltipBar.classList.contains("retracting");

          if (isShowingOrRetracting) {
            // Recolhe o tooltip atual primeiro, depois exibe o deste ícone
            retractTooltip();
            _tooltipPendingShow = () => {
              if (list.matches(":hover") && !isActive()) applyTooltip(btn, titleEl);
            };
          } else {
            applyTooltip(btn, titleEl);
          }
        });

        list.addEventListener("mouseleave", () => {
          _tooltipPendingShow = null;
          retractTooltip();
        });
      });

      // Injetar elemento de cápsula em cada .list (feito aqui para garantir DOM pronto)
      lists.forEach((list) => {
        if (list.querySelector(".sidebar-capsule")) return; // evita duplicata
        const capsule = document.createElement("span");
        capsule.className = "sidebar-capsule";
        capsule.setAttribute("aria-hidden", "true");
        list.insertBefore(capsule, list.firstChild);
      });
    })();

    contributorOnboardingModal = document.getElementById("contributorOnboarding");
    contributorOnboardingForm = document.getElementById("contributorOnboardingForm");
    contributorInfoListEl = document.getElementById("contributorInfoList");
    contributorNewPasswordInput = document.getElementById("contributorNewPassword");
    contributorConfirmPasswordInput = document.getElementById("contributorConfirmPassword");
    contributorConfirmDataCheckbox = document.getElementById("contributorConfirmData");
    contributorWelcomeNameEl = document.getElementById("contributorWelcomeName");

    // Declarar variáveis do sistema de suporte no início do DOMContentLoaded
    let supportContactsSection = null;
    let currentSupportChatId = null;
    let selectedEmployeeId = null;
    let isSwitchingEmployee = false;
    
    // Inicializar supportContactsSection
    supportContactsSection = document.getElementById("supportContactsSection");
    
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

      const currentUser = getStorageItem("currentUser", {});

      return currentUser.role === "admin";

    }

    

    // Função para adicionar usuário

    async function addUser(fullName, username, sector, role, adminPassword, userPassword, confirmPassword) {
      const users = getUsersFromStorage();
      

      // Verificar se usuário já existe

      if (users.some(u => normalizeUsername(u.username) === normalizeUsername(username))) {
        return { success: false, message: "Username já existe! Escolha outro." };

      }

      

      // Validar que usuário atual é administrador
      let currentUser = null;

      if (typeof secureAuth !== 'undefined') {

        currentUser = secureAuth.getCurrentUser();

      } else {

        currentUser = getStorageItem("currentUser", {});

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
        status: "active",
        createdAt: Date.now()

      };

      

      // Adicionar localmente

      const updatedUsers = persistUsersToStorage([...users, newUser]);
      

      // Firebase removido - usar apenas localStorage
      

      return { success: true, message: "Usuário adicionado com sucesso!", users: updatedUsers };
    }

    

    // Função para deletar usuário

    async function deleteUser(username, adminPassword) {
      const currentUser = getStorageItem("currentUser", {});

      
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

      // Limpar threads do chat interno que envolvem o operador deletado.
      // Formato do chatId: "internal_userA_userB" — remove qualquer thread
      // em que o username do operador apareça como participante.
      try {
        const internalMsgs = getStorageItem('internalMessages', {});
        const cleanedInternal = {};
        Object.keys(internalMsgs).forEach(chatId => {
          const parts = chatId.replace(/^internal_/, '').split('_');
          const involves = parts.some(p => normalizeUsername(p) === targetUsername);
          if (!involves) {
            cleanedInternal[chatId] = internalMsgs[chatId];
          }
        });
        setStorageItem('internalMessages', cleanedInternal);
      } catch (e) {
        console.warn('[deleteUser] Não foi possível limpar internalMessages:', e);
      }

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

        adminTabContents.forEach(content => deactivatePanel(content));



        // Adicionar active na aba clicada

        tab.classList.add("active");



        // Mostrar conteúdo correspondente

        if (targetTab === "users") {

          activatePanel(document.getElementById("usersTab"));

        } else if (targetTab === "contributors") {

          activatePanel(document.getElementById("contributorsTab"));

          renderContributorsList();

        } else if (targetTab === "sectors") {
          activatePanel(document.getElementById("sectorsTab"));
          renderSectorsList();
        }

      });

    });

    // ==================== GERENCIAMENTO DE SETORES ====================

    function getSectors() {
      var raw = localStorage.getItem('sectors');
      if (!raw) return [];
      try { return JSON.parse(raw) || []; } catch (_) { return []; }
    }

    function saveSectors(list) {
      localStorage.setItem('sectors', JSON.stringify(list));
      localStorage.setItem('sectorsUpdatedAt', Date.now().toString());
      populateSectorDropdown();
    }

    function populateSectorDropdown() {
      var select = document.getElementById('newUserSector');
      if (!select) return;
      var currentValue = select.value;
      var sectors = getSectors();
      select.innerHTML = '<option value="">Selecione um setor</option>';
      sectors.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
      if (currentValue) select.value = currentValue;
    }

    function renderSectorsList() {
      var container = document.getElementById('sectorsList');
      if (!container) return;
      var sectors = getSectors();
      container.innerHTML = '';
      if (sectors.length === 0) {
        container.innerHTML =
          '<div class="sectors-empty-state">' +
            '<i class="bx bx-category-alt" aria-hidden="true"></i>' +
            '<h4>Nenhum setor cadastrado</h4>' +
            '<p>Crie o primeiro setor para organizar os atendimentos.</p>' +
            '<button type="button" class="btn-create-first-sector" id="createFirstSectorBtn">' +
              '<i class="bx bx-plus"></i> Criar primeiro setor' +
            '</button>' +
          '</div>';
        var firstBtn = container.querySelector('#createFirstSectorBtn');
        if (firstBtn) {
          firstBtn.addEventListener('click', function () {
            var form = document.getElementById('addSectorForm');
            var input = document.getElementById('newSectorName');
            if (form) form.classList.remove('hidden');
            if (input) { input.value = ''; input.focus(); }
          });
        }
        return;
      }
      sectors.forEach(function (name, idx) {
        var div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML =
          '<div class="user-info">' +
            '<div class="user-details">' +
              '<span class="user-name"><i class="bx bx-category" style="margin-right:6px;"></i>' + name + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="user-actions">' +
            '<button class="btn-delete-user" data-idx="' + idx + '" title="Remover setor"><i class="bx bx-trash"></i></button>' +
          '</div>';
        div.querySelector('.btn-delete-user').addEventListener('click', function () {
          var s = getSectors();
          s.splice(idx, 1);
          saveSectors(s);
          renderSectorsList();
        });
        container.appendChild(div);
      });
    }

    // Add sector form
    var addSectorBtn = document.getElementById('addSectorBtn');
    var addSectorForm = document.getElementById('addSectorForm');
    var saveSectorBtn = document.getElementById('saveSectorBtn');
    var cancelSectorBtn = document.getElementById('cancelSectorBtn');
    var newSectorNameInput = document.getElementById('newSectorName');

    if (addSectorBtn && addSectorForm) {
      addSectorBtn.addEventListener('click', function () {
        addSectorForm.classList.remove('hidden');
        if (newSectorNameInput) { newSectorNameInput.value = ''; newSectorNameInput.focus(); }
      });
    }
    if (cancelSectorBtn && addSectorForm) {
      cancelSectorBtn.addEventListener('click', function () {
        addSectorForm.classList.add('hidden');
      });
    }
    if (saveSectorBtn) {
      saveSectorBtn.addEventListener('click', function () {
        var currentUser = {};
        try { currentUser = getStorageItem('currentUser', {}); } catch (_) {}
        if (currentUser.role !== 'admin') {
          if (typeof showToast === 'function') showToast('Apenas administradores podem criar setores.', 'error');
          return;
        }
        var name = (newSectorNameInput ? newSectorNameInput.value : '').trim();
        if (!name) return;
        var sectors = getSectors();
        if (sectors.some(function (s) { return s.toLowerCase() === name.toLowerCase(); })) {
          if (typeof showToast === 'function') showToast('Este setor já existe.', 'error');
          return;
        }
        sectors.push(name);
        saveSectors(sectors);
        renderSectorsList();
        if (addSectorForm) addSectorForm.classList.add('hidden');
        if (typeof showToast === 'function') showToast('Setor "' + name + '" criado com sucesso!', 'success');
      });
    }

    // Init: populate dropdown (lista vazia até o admin criar o primeiro setor)
    populateSectorDropdown();

    // ==================== FIM GERENCIAMENTO DE SETORES ====================

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

            detailsDiv.style.animation = "slideDown 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

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

    const soundMuteToggle = document.getElementById("soundMuteToggle");
    if (soundMuteToggle) {
      const syncMuteBtn = () => {
        const muted = localStorage.getItem("notificationSoundMuted") === "1";
        soundMuteToggle.setAttribute("aria-pressed", muted ? "true" : "false");
        soundMuteToggle.setAttribute("title", muted ? "Ativar notificações" : "Silenciar notificações");
        soundMuteToggle.setAttribute("aria-label", muted ? "Ativar notificações" : "Silenciar notificações");
        const icon = soundMuteToggle.querySelector("i");
        if (icon) icon.className = muted ? "bx bx-bell-off" : "bx bx-bell";
        soundMuteToggle.classList.toggle("is-muted", muted);
      };
      syncMuteBtn();
      soundMuteToggle.addEventListener("click", () => {
        const muted = localStorage.getItem("notificationSoundMuted") === "1";
        localStorage.setItem("notificationSoundMuted", muted ? "0" : "1");
        syncMuteBtn();
      });
      window.addEventListener("storage", (e) => {
        if (e.key === "notificationSoundMuted") syncMuteBtn();
      });
    }

    

    // Atualizar informações do perfil do usuário logado

    function updateProfileInfo() {

      const currentUser = getStorageItem("currentUser", {});

      

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
        'logo.png', 'profile-1.png', 'SoftTech.png', 'Sercon.png',
        'logo.jpg', 'profile-1.jpg', 'SoftTech.jpg', 'Sercon.jpg',
        'logo.jpeg', 'profile-1.jpeg', 'SoftTech.jpeg', 'Sercon.jpeg'
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

      const currentUser = getStorageItem("currentUser", {});

      const userName = currentUser.fullName || currentUser.username;
      const userSector = currentUser.sector || "";
      const userIsAdmin = isAdmin();

      if (!userName) return [];

      const userFiles = [];
      const seenFiles = new Set(); // Para evitar duplicatas

      // 1. Buscar mensagens do localStorage (supportMessages)
      const allMessages = getStorageItem("supportMessages", []);

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
        const contacts = getStorageItem("contacts", []);
        
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

    

    const searchInput = document.getElementById("contactsUnifiedSearch")
      || document.querySelector(".search-bar input");

    function escapeSearchHtml(text) {
      return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function highlightAllMatches(fullText, term) {
      const text = String(fullText || "");
      if (!term) return escapeSearchHtml(text);
      const lower = text.toLowerCase();
      const termLower = term.toLowerCase();
      let result = "";
      let cursor = 0;
      let idx = lower.indexOf(termLower, cursor);
      while (idx !== -1) {
        result += escapeSearchHtml(text.slice(cursor, idx));
        result += `<mark>${escapeSearchHtml(text.slice(idx, idx + term.length))}</mark>`;
        cursor = idx + term.length;
        idx = lower.indexOf(termLower, cursor);
      }
      result += escapeSearchHtml(text.slice(cursor));
      return result;
    }

    function searchAcrossMessages(term) {
      const results = [];
      if (!term || !supportChats) return results;
      const lower = term.toLowerCase();
      Object.keys(supportChats).forEach(chatId => {
        const chat = supportChats[chatId];
        const messages = Array.isArray(chat?.messages) ? chat.messages : [];
        // Coletar TODAS as mensagens que batem, de qualquer remetente (cliente ou operador)
        messages.forEach(msg => {
          const text = msg?.text ? String(msg.text) : "";
          if (!text || !text.toLowerCase().includes(lower)) return;
          const senderLabel = msg.type === "client"
            ? (msg.senderName || chat.clientName || "Cliente")
            : (msg.senderName || msg.sender || "Operador");
          results.push({
            chatId,
            messageId: msg.id,
            clientName: chat.clientName || "Contato",
            senderLabel,
            senderType: msg.type === "client" ? "client" : "agent",
            fullText: highlightAllMatches(text, term),
            timestamp: getMessageTimestampValue(msg)
          });
        });
      });
      results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return results;
    }

    function clearMessageMatchesSection() {
      const section = document.getElementById("supportMessageMatchesSection");
      if (!section) return;
      section.innerHTML = "";
      section.hidden = true;
    }

    function pulseMessageById(messageId) {
      if (!messageId) return;
      const el = document.querySelector(`.messages [data-message-id="${messageId}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("message-pulse");
      void el.offsetWidth;
      el.classList.add("message-pulse");
      setTimeout(() => el.classList.remove("message-pulse"), 2200);
    }

    async function openChatFromMatch(chatId, messageId) {
      if (typeof loadSupportChat !== "function") return;
      await loadSupportChat(chatId);
      setTimeout(() => pulseMessageById(messageId), 120);
    }

    function renderMessageMatches(term) {
      const section = document.getElementById("supportMessageMatchesSection");
      if (!section) return;
      const matches = searchAcrossMessages(term);
      if (matches.length === 0) {
        section.innerHTML = "";
        section.hidden = true;
        return;
      }
      section.hidden = false;
      section.innerHTML = `<div class="message-matches-header">Mensagens (${matches.length})</div>`;
      matches.forEach(match => {
        const item = document.createElement("div");
        item.className = `contact message-match sender-${match.senderType}`;
        item.setAttribute("data-chat-id", match.chatId);
        if (match.messageId) item.setAttribute("data-message-id", match.messageId);
        const avatar = createAvatarElement(match.clientName, 36);
        const avatarWrap = document.createElement("div");
        avatarWrap.className = "contact-avatar-wrap";
        avatarWrap.appendChild(avatar);
        const info = document.createElement("div");
        info.className = "contact-info";
        info.innerHTML = `
          <div class="contact-info-header">
            <h4 class="contact-name">${escapeSearchHtml(match.clientName)}</h4>
            <span class="contact-match-sender">${escapeSearchHtml(match.senderLabel)}</span>
          </div>
          <div class="contact-info-footer">
            <p class="contact-match-preview">${escapeSearchHtml(match.fullText)}</p>
          </div>`;
        item.appendChild(avatarWrap);
        item.appendChild(info);
        item.addEventListener("click", () => openChatFromMatch(match.chatId, match.messageId));
        section.appendChild(item);
      });
    }

    if (searchInput) {
      let _contactsSearchDebounce = null;

      const runUnifiedSearch = (raw) => {
        const searchTerm = (raw || "").toLowerCase().trim();
        const supportSection = document.getElementById("supportContactsSection");
        const allContacts = document.querySelectorAll("#supportContactsSection .contact");

        if (searchTerm === "") {
          allContacts.forEach(c => { c.style.display = "flex"; });
          clearMessageMatchesSection();
          if (supportSection) supportSection.hidden = false;
          return;
        }

        let nameMatches = 0;
        allContacts.forEach(contact => {
          const nameEl = contact.querySelector(".contact-info h4");
          const previewEl = contact.querySelector(".contact-info p");
          const name = nameEl ? nameEl.textContent.toLowerCase() : "";
          const preview = previewEl ? previewEl.textContent.toLowerCase() : "";
          if (name.includes(searchTerm) || preview.includes(searchTerm)) {
            contact.style.display = "flex";
            contact.style.animation = "contactFadeIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
            nameMatches++;
          } else {
            contact.style.display = "none";
          }
        });

        if (nameMatches === 0) {
          if (supportSection) supportSection.hidden = true;
          renderMessageMatches(searchTerm);
        } else {
          if (supportSection) supportSection.hidden = false;
          clearMessageMatchesSection();
        }
      };

      searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        clearTimeout(_contactsSearchDebounce);
        _contactsSearchDebounce = setTimeout(() => runUnifiedSearch(value), 150);
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          searchInput.value = "";
          runUnifiedSearch("");
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

      element.addEventListener('scroll', updateScrollGradient, { passive: true });

      

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

    const sidebarButtons = document.querySelectorAll(".sidebar .center-icons button[data-section]");

    // ── Notch côncavo: círculo branco protuberante + sidebar com clip-path dinâmico
    //    que recorta um semicírculo ao redor do círculo + scoops côncavos acima/abaixo,
    //    replicando a forma do vídeo de referência (Barra lateral.mp4). ──
    const sidebarEl = document.querySelector(".sidebar");
    const sidebarNotchEl = document.querySelector(".sidebar-notch");
    const chatAppEl = document.getElementById("chatApp");

    function buildNotchClipPath(W, H, ny) {
      // Geometria fiel ao vídeo @Inspirações/Barra lateral.mp4:
      // O FUNDO do scoop é um ARCO CONCÊNTRICO ao círculo — mesma curvatura,
      // mas raio maior (arcR = R + GAP), afundando o scoop e criando um
      // espaçamento UNIFORME entre o círculo e a borda do scoop.
      const R = 24;         // raio do círculo (= --notch-size / 2)
      const CX = 50;        // centro x do círculo (= CSS left)
      const GAP = 8;        // espaço uniforme entre o círculo e o fundo do scoop
      const arcR = R + GAP; // raio do arco (concêntrico com círculo → gap uniforme)
      const sh = R + 26;    // folga vertical total acima/abaixo do círculo (= 50)
      // Ângulo do arco que forma o fundo do scoop (metade).
      // 45° → arco total 90° (quarto de círculo) — bem arredondado.
      const alpha = (45 * Math.PI) / 180;
      const cosA = Math.cos(alpha); // ≈ 0.707
      const sinA = Math.sin(alpha); // ≈ 0.707
      // Pontos onde o arco encosta tangencialmente no fundo do scoop:
      const arcX = CX - arcR * cosA;    // x do ponto de encontro com a bezier
      const arcOff = arcR * sinA;       // Y offset do centro do círculo
      // Distância dos pontos de controle bezier (controla suavidade da transição):
      const t = 20;
      const y1 = Math.max(0, ny - sh);
      const y2 = Math.min(H, ny + sh);
      return (
        `path('M 0 0 L ${W} 0 L ${W} ${y1} ` +
        // Bezier de entrada: borda reta → tangente do arco (parte superior)
        `C ${W} ${y1 + t} ${arcX + t * sinA} ${ny - arcOff - t * cosA} ${arcX} ${ny - arcOff} ` +
        // Arco concêntrico com raio arcR (R+GAP) — gap uniforme ao redor do círculo
        `A ${arcR} ${arcR} 0 0 0 ${arcX} ${ny + arcOff} ` +
        // Bezier de saída: tangente do arco → borda reta (parte inferior, simétrica)
        `C ${arcX + t * sinA} ${ny + arcOff + t * cosA} ${W} ${y2 - t} ${W} ${y2} ` +
        `L ${W} ${H} L 0 ${H} Z')`
      );
    }

    const notchIconEl = sidebarNotchEl ? sidebarNotchEl.querySelector(".sidebar-notch-icon") : null;

    function syncNotchIcon(activeBtn, previousBtn) {
      if (!notchIconEl || !activeBtn) return;
      // Copia a classe do ícone do botão ativo (ex.: "bx bx-send") para que o
      // notch exiba o mesmo glifo dentro do círculo.
      const srcIcon = activeBtn.querySelector(".icon i");
      if (!srcIcon) return;
      const iconName = Array.from(srcIcon.classList).find((c) => c.startsWith("bx-"));
      notchIconEl.className = "sidebar-notch-icon bx" + (iconName ? " " + iconName : "");

      // Animação: o novo ícone "sai" do centro do botão na sidebar e desliza até
      // o centro do notch, mudando de cor (branco → dourado) ao longo do trajeto.
      // Isso é feito calculando o offset entre o botão ativo e o centro do notch
      // e aplicando uma transform inicial que depois anima para zero.
      if (previousBtn && previousBtn !== activeBtn) {
        const notchRect = sidebarNotchEl.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const notchCenterX = notchRect.left + notchRect.width / 2;
        const notchCenterY = notchRect.top + notchRect.height / 2;
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        const dx = btnCenterX - notchCenterX;
        const dy = btnCenterY - notchCenterY;
        // Posiciona o ícone na posição do botão antes de iniciar a animação
        notchIconEl.style.transition = "none";
        notchIconEl.style.transform = `translate(${dx}px, ${dy}px)`;
        notchIconEl.style.color = getComputedStyle(document.documentElement).getPropertyValue("--bg-surface").trim() || "#ffffff";
        // Reflow forçado para o browser aplicar o estado inicial antes da animação
        void notchIconEl.offsetWidth;
        notchIconEl.style.transition =
          "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), color 500ms ease-out 120ms";
        notchIconEl.style.transform = "translate(0, 0)";
        notchIconEl.style.color = "#fbbf24";
      } else {
        // Sem animação (primeira carga): ícone direto no centro do notch
        notchIconEl.style.transition = "none";
        notchIconEl.style.transform = "translate(0, 0)";
        notchIconEl.style.color = "#fbbf24";
      }
    }

    function updateSidebarNotch(animate = true, previousActiveBtn = null) {
      if (!sidebarEl || !sidebarNotchEl || !chatAppEl) return;
      const activeBtn = sidebarEl.querySelector(".center-icons .list button.active");
      if (!activeBtn) return;
      syncNotchIcon(activeBtn, previousActiveBtn);
      const iconEl = activeBtn.querySelector(".icon") || activeBtn;
      const sbRect = sidebarEl.getBoundingClientRect();
      const caRect = chatAppEl.getBoundingClientRect();
      const btnRect = iconEl.getBoundingClientRect();
      // Y relativo à sidebar (para o clip-path)
      const ySidebar = (btnRect.top - sbRect.top) + (btnRect.height / 2);
      // Y relativo ao chat-app (para posicionar o círculo, que é sibling da sidebar)
      const yChatApp = (btnRect.top - caRect.top) + (btnRect.height / 2);
      const W = sbRect.width;
      const H = sbRect.height;
      const clipPath = buildNotchClipPath(W, H, ySidebar);
      if (!animate) {
        const prevNotchTransition = sidebarNotchEl.style.transition;
        const prevSbTransition = sidebarEl.style.transition;
        sidebarNotchEl.style.transition = "none";
        sidebarEl.style.transition = "none";
        chatAppEl.style.setProperty("--notch-y", yChatApp + "px");
        sidebarEl.style.setProperty("--notch-clip", clipPath);
        // force reflow
        void sidebarNotchEl.offsetHeight;
        sidebarNotchEl.style.transition = prevNotchTransition || "";
        sidebarEl.style.transition = prevSbTransition || "";
      } else {
        chatAppEl.style.setProperty("--notch-y", yChatApp + "px");
        sidebarEl.style.setProperty("--notch-clip", clipPath);
      }
      sidebarEl.classList.add("notch-ready");
    }
    // Inicializa após layout
    requestAnimationFrame(() => updateSidebarNotch(false));
    window.addEventListener("resize", () => updateSidebarNotch(false));
    window.updateSidebarNotch = updateSidebarNotch;

    const chatContainer = document.querySelector(".chat-container");

    const chatList = document.querySelector(".chat-list");

    const chatMain = document.querySelector(".chat-main");

    const sendButton = document.querySelector(".message-input i");

    const messageInput = document.querySelector(".message-input input[type='text']");

    const fileInput = document.getElementById("fileInput");

    const attachButton = document.getElementById("attachButton");

    const taxAgendaContainer = document.querySelector(".tax-agenda-container");
    const ncmContainer = document.querySelector(".ncm-container");

    let taxAgendaClockInterval = null;
    const TAX_AGENDA_CLOCK_MODE_KEY = "operador-tax-agenda-clock-mode";

    function updateTaxAgendaDateTime() {
      const dateEl = document.getElementById("taxAgendaDate");
      const digitalEl = document.getElementById("taxAgendaClockDigital");
      const hourHand = document.getElementById("clockHourHand");
      const minuteHand = document.getElementById("clockMinuteHand");
      const secondHand = document.getElementById("clockSecondHand");
      if (!dateEl) return;
      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      dateEl.setAttribute("datetime", now.toISOString());
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      if (digitalEl) digitalEl.textContent = `${hours}:${minutes}:${seconds}`;
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      const hourDeg = (h * 30) + (m * 0.5);
      const minuteDeg = (m * 6) + (s * 0.1);
      const secondDeg = s * 6;
      if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
      if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
      if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;
    }

    function stopTaxAgendaClock() {
      if (taxAgendaClockInterval != null) {
        clearInterval(taxAgendaClockInterval);
        taxAgendaClockInterval = null;
      }
    }

    function startTaxAgendaClock() {
      stopTaxAgendaClock();
      updateTaxAgendaDateTime();
      taxAgendaClockInterval = setInterval(updateTaxAgendaDateTime, 1000);
    }

    let taxAgendaClockToggleInitialized = false;
    function initTaxAgendaClockToggle() {
      if (taxAgendaClockToggleInitialized) return;
      const toggle = document.getElementById("taxAgendaClockToggle");
      const wrapper = document.querySelector(".tax-agenda-clock-wrapper");
      const analogEl = document.getElementById("taxAgendaClockAnalog");
      const digitalEl = document.getElementById("taxAgendaClockDigital");
      if (!analogEl || !digitalEl) return;
      taxAgendaClockToggleInitialized = true;
      const isDigital = localStorage.getItem(TAX_AGENDA_CLOCK_MODE_KEY) === "digital";
      function applyMode(digital) {
        if (digital) {
          analogEl.classList.add("hidden");
          analogEl.setAttribute("aria-hidden", "true");
          digitalEl.classList.remove("hidden");
          digitalEl.setAttribute("aria-hidden", "false");
          if (toggle) {
            const span = toggle.querySelector("span");
            if (span) span.textContent = "Analógico";
            toggle.setAttribute("aria-pressed", "true");
          }
        } else {
          analogEl.classList.remove("hidden");
          analogEl.setAttribute("aria-hidden", "false");
          digitalEl.classList.add("hidden");
          digitalEl.setAttribute("aria-hidden", "true");
          if (toggle) {
            const span = toggle.querySelector("span");
            if (span) span.textContent = "Digital";
            toggle.setAttribute("aria-pressed", "false");
          }
        }
      }
      function toggleMode() {
        const digital = analogEl.classList.contains("hidden");
        localStorage.setItem(TAX_AGENDA_CLOCK_MODE_KEY, digital ? "analog" : "digital");
        applyMode(!digital);
      }
      applyMode(isDigital);
      if (wrapper) {
        wrapper.setAttribute("role", "button");
        wrapper.setAttribute("tabindex", "0");
        wrapper.setAttribute("title", "Clique para alternar entre analógico e digital");
        wrapper.addEventListener("click", toggleMode);
        wrapper.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMode(); }
        });
      }
      if (toggle) toggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMode(); });
    }

    // ==================== SUB-TABS DO TAX AGENDA ====================
    function initTaxAgendaSubtabs() {
      const subtabBtns = document.querySelectorAll(".tax-subtab");
      const subtabPanels = {
        obligations: document.getElementById("obligationsSubPanel"),
        lembretes: document.getElementById("lembretesSubPanel")
      };
      const taxTasks = document.querySelector(".tax-agenda-tasks");
      const titleTextEl = document.getElementById("tasksListTitleText");
      if (!subtabBtns.length) return;
      subtabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.subtab;
          subtabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          Object.entries(subtabPanels).forEach(([key, panel]) => {
            if (!panel) return;
            if (key === target) {
              activatePanel(panel);
            } else {
              deactivatePanel(panel);
            }
          });
          if (taxTasks) {
            if (target === "lembretes") {
              taxTasks.classList.add("lembretes-active");
            } else {
              taxTasks.classList.remove("lembretes-active");
            }
          }
          if (titleTextEl) {
            titleTextEl.textContent = target === "lembretes" ? "Lembretes" : "Agenda Fiscal";
          }
          if (target === "lembretes" && typeof renderLembretes === "function") {
            renderLembretes();
          }
        });
      });
    }
    initTaxAgendaSubtabs();

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


      const contact = contacts.find(c => c.id === parseInt(contactId));

      if (!contact) {


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
      

      // CRITICAL: Carregar mensagens do localStorage e mesclar com mensagens existentes
      // Preservar file.data das mensagens existentes
      try {
        const allMessages = getStorageItem("supportMessages", []);
        const contactChatId = `chat_contact_${contact.id}`;
        
        // DEBUG: Log mensagens existentes do contato
        if (contact.messages && contact.messages.length > 0) {
          const messagesWithFiles = contact.messages.filter(m => m.file && m.file.data);
          messagesWithFiles.forEach((m, idx) => {
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
        
        const localStorageMessagesWithFiles = localStorageMessages.filter(m => m.file);
        localStorageMessagesWithFiles.forEach((m, idx) => {
        });
        
        // CRITICAL: Usar o mapa de file.data criado ANTES do try/catch para preservar arquivos
        // O mapa existingFileDataMap já foi criado acima com TODOS os file.data das mensagens existentes
        
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
            
            // SEMPRE usar o file.data do mapa (fonte de verdade)
            msg.file = {
              name: existingFileInfo.name || msg.file?.name,
              size: existingFileInfo.size || msg.file?.size,
              type: existingFileInfo.type || msg.file?.type,
              data: existingFileInfo.data // CRITICAL: SEMPRE usar file.data do mapa
            };
          } else if (msg.file && !msg.file.data) {
          } else if (msg.file && msg.file.data) {
            // Mensagem do localStorage tem file.data, mas vamos verificar se há uma versão mais completa no mapa
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
            }
            
            converted.file = {
              name: existingFileInfo?.name || msg.file.name,
              size: existingFileInfo?.size || msg.file.size,
              type: existingFileInfo?.type || msg.file.type,
              data: fileDataToUse // CRITICAL: Usar do mapa se existir, senão do localStorage
            };
            
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
        finalMessagesWithFiles.forEach((m, idx) => {
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
              msg.file.data = localStorageMsg.file.data;
            }
          }
        });
      } catch (error) {
        // Se houver erro, manter as mensagens existentes do contato
        if (!contact.messages) {
          contact.messages = [];
        }
      }




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

        // Atualizar chat header
        const chatHeader = document.getElementById("chatHeader");
        const chatHeaderName = document.getElementById("chatHeaderName");
        const chatHeaderStatus = document.getElementById("chatHeaderStatus");
        const chatHeaderAvatar = document.getElementById("chatHeaderAvatar");
        if (chatHeader) chatHeader.style.display = "flex";
        if (chatHeaderName) chatHeaderName.textContent = contact.name || "Contato";
        if (chatHeaderStatus) chatHeaderStatus.textContent = contact.status || "";
        if (chatHeaderAvatar) {
          const initial = (contact.name || "?").charAt(0).toUpperCase();
          if (contact.image && !contact.image.includes("profile-1.png")) {
            chatHeaderAvatar.innerHTML = '';
            const _hdrImg = document.createElement('img');
            _hdrImg.src = contact.image;
            _hdrImg.alt = contact.name || '?';
            _hdrImg.addEventListener('error', function() { chatHeaderAvatar.textContent = initial; });
            chatHeaderAvatar.appendChild(_hdrImg);
          } else {
            chatHeaderAvatar.textContent = initial;
          }
        }


      } catch (error) {


      }



      // Obter nome do usuário logado

      const currentUser = getStorageItem("currentUser", {});

      const userName = currentUser.fullName || currentUser.username || "Usuário";



      // Atualizar mensagens com indicadores de data

      messagesContainer.innerHTML = "";

      let lastMessageDate = null;

      


      

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


          }

        } catch (error) {


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
              const allMessages = getStorageItem("supportMessages", []);
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
              } else {
                // Fallback: usar file.data de contact.messages se existir
                if (message.file.data) {
                  fileDataToRender = message.file.data;
                }
              }
            } catch (error) {
              // Fallback: usar file.data de contact.messages se existir
              if (message.file.data) {
                fileDataToRender = message.file.data;
              }
            }
            
            if (fileDataToRender) {
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

      // Esconder chat header quando não há contato selecionado
      const chatHeaderEl = document.getElementById("chatHeader");
      if (chatHeaderEl) chatHeaderEl.style.display = "none";

    }



    // Evento de clique nos contatos

    contactElements.forEach(contact => {

      contact.addEventListener("click", () => {

        const contactId = contact.getAttribute("data-contact-id");


        try {

          updateChat(contactId);

        } catch (error) {


        }

      });

    });

  

    // Helpers para ativar/desativar painéis com suporte a inert
    function activatePanel(el) {
      if (!el) return;
      el.classList.add('active');
      el.removeAttribute('inert');
    }
    function deactivatePanel(el) {
      if (!el) return;
      el.classList.remove('active');
      el.setAttribute('inert', '');
    }

    // Evento de clique nos botões da sidebar

    sidebarButtons.forEach(button => {

      button.addEventListener("click", async () => {

        const section = button.getAttribute("data-section");

        

        // Verificar permissão para admin

        if (section === "admin" && !isAdmin()) {

          showToast("Acesso negado! Apenas administradores podem acessar esta seção.", "error");

          return;

        }

        

        // Troca SÍNCRONA do .active (sem await entre remove/add) para evitar que
        // o ícone da aba antiga apareça duplicado (uma vez no notch, outra na sidebar)
        // durante o intervalo em que nenhum botão está ativo.
        const activeBtn = document.querySelector(".sidebar .center-icons button.active");
        if (activeBtn && activeBtn !== button) {
          activeBtn.classList.remove("active");
        } else if (!activeBtn) {
          sidebarButtons.forEach((btn) => btn.classList.remove("active"));
        }
        button.classList.add("active");
        if (typeof updateSidebarNotch === "function") updateSidebarNotch(true, activeBtn);

        // Depois de trocar o estado visual, escondemos o tooltip (rápido, < 160ms)
        const tooltipPromise = hideSidebarTooltipBar();
        await tooltipPromise;

        stopTaxAgendaClock();

        if (section === "chat") {

          activatePanel(chatContainer);

          chatList.classList.remove("hidden");

          chatMain.classList.remove("hidden");

          deactivatePanel(taxAgendaContainer);

          deactivatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          deactivatePanel(ncmContainer);

          const jobManagementContainer = document.querySelector(".job-management-container");
          deactivatePanel(jobManagementContainer);

          deactivatePanel(internalChatContainer);

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

          deactivatePanel(chatContainer);

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          deactivatePanel(taxAgendaContainer);

          deactivatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          deactivatePanel(ncmContainer);

          const jobManagementContainer = document.querySelector(".job-management-container");
          deactivatePanel(jobManagementContainer);

          if (internalChatContainer) {
            activatePanel(internalChatContainer);
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

          deactivatePanel(chatContainer);

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          deactivatePanel(taxAgendaContainer);

          activatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          const jobManagementContainer = document.querySelector(".job-management-container");
          deactivatePanel(jobManagementContainer);

          deactivatePanel(ncmContainer);

          deactivatePanel(internalChatContainer);

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

        } else if (section === "tax-agenda") {

          deactivatePanel(chatContainer);

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          activatePanel(taxAgendaContainer);

          deactivatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          deactivatePanel(ncmContainer);

          deactivatePanel(internalChatContainer);

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

          startTaxAgendaClock();

          if (typeof initTaxAgendaClockToggle === 'function') initTaxAgendaClockToggle();

          // Resetar sub-tabs para "Agenda Fiscal"
          const subtabObligations = document.getElementById("subtabObligations");
          if (subtabObligations) subtabObligations.click();

        } else if (section === "ncm") {

          deactivatePanel(chatContainer);

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          deactivatePanel(taxAgendaContainer);

          deactivatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          const jobManagementContainer = document.querySelector(".job-management-container");
          deactivatePanel(jobManagementContainer);

          activatePanel(ncmContainer);

          deactivatePanel(internalChatContainer);

          contactBox.classList.add("hidden");

          contactElements.forEach(c => c.classList.remove("active"));

          messagesContainer.innerHTML = "";

          rightPanel.classList.add("hidden");

        } else if (section === "job-management") {
          deactivatePanel(chatContainer);
          chatList.classList.add("hidden");
          chatMain.classList.add("hidden");
          deactivatePanel(taxAgendaContainer);
          deactivatePanel(adminContainer);
          deactivatePanel(scheduledMessageContainer);
          deactivatePanel(ncmContainer);
          deactivatePanel(internalChatContainer);
          contactBox.classList.add("hidden");
          contactElements.forEach(c => c.classList.remove("active"));
          messagesContainer.innerHTML = "";
          rightPanel.classList.add("hidden");

          // Mostrar container de gerenciamento de vagas
          const jobManagementContainer = document.querySelector(".job-management-container");
          if (jobManagementContainer) {
            activatePanel(jobManagementContainer);
            // Carregar vagas quando a seção for aberta
            if (typeof loadJobManagementData === 'function') {
              loadJobManagementData();
            }
          }

        } else {

          deactivatePanel(chatContainer);

          chatList.classList.add("hidden");

          chatMain.classList.add("hidden");

          deactivatePanel(taxAgendaContainer);

          deactivatePanel(adminContainer);

          deactivatePanel(scheduledMessageContainer);

          const jobManagementContainer = document.querySelector(".job-management-container");
          deactivatePanel(jobManagementContainer);

          deactivatePanel(ncmContainer);

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

        const currentUser = getStorageItem("currentUser", {});

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
          profileImage: currentUser.profileImage || DEFAULT_PROFILE_IMAGE,
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

        

        // Salvar no localStorage

        const messages = getStorageItem("supportMessages", []);

        messages.push(messageData);

        localStorage.setItem("supportMessages", JSON.stringify(messages));

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
        
        const allMessages = getStorageItem("supportMessages", []);
        allMessages.push(messageData);
        localStorage.setItem("supportMessages", JSON.stringify(allMessages));
      } catch (error) {
      }

      

      // Obter nome do usuário logado

      const currentUser = getStorageItem("currentUser", {});

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
      
      
      // Se já foram criados E existem no DOM, não recriar
      if (alreadyCreated && foundCount === expectedTitles.length && expectedTitles.length > 0) {
        return;
      }
      
      // Se foram marcados como criados mas não existem no DOM, limpar a marcação
      if (alreadyCreated && foundCount < expectedTitles.length) {
        localStorage.removeItem(remindersKey);
      }
      
      // Obter tasksListContainer se não estiver disponível no escopo
      const container = tasksListContainer || document.querySelector(".tasks-list");
      if (!container) {
        return;
      }
      
      
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
        }
      });
      
      // Marcar como criados apenas se foram criados lembretes
      if (createdCount > 0) {
        localStorage.setItem(remindersKey, 'true');
      } else {
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
    }
    
    // ==================== FIM LEMBRETES AUTOMÁTICOS ====================

    // Gerar calendários iniciais

    generateCalendar(0, 0);
    
    // Inicializar lembretes automáticos (deve ser chamado após tasksListContainer estar definido)
    // Aguardar um pouco para garantir que tasksListContainer esteja disponível
    setTimeout(() => {
      if (tasksListContainer) {
        initializeAutoTaxReminders();
      } else {
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


        

        // if (!endDate) {

        //   showToast('Agora selecione a data final', 'info');

        // }

      } else {

        // Só permitir selecionar data final se houver data inicial

        if (!startDate) {

          // showToast('⚠️ Selecione primeiro a data inicial', 'error');


          return;

        }

        endDate = date;

        endDateDisplay.textContent = formatDateDisplay(date);


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

      //
      

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

      const currentUser = getStorageItem("currentUser", {});

      const userSector = currentUser.sector || "";
      const userIsAdmin = isAdmin(); // Admin vê mensagens de todos os setores



      // Carregar mensagens do localStorage

      const messages = getStorageItem("supportMessages", []);

      

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
        // Admin vê todas as mensagens independente de setor
        if (msg.sector && !userIsAdmin) {
          if (msg.sector !== userSector && !chats[targetChatId]) {
            return; // Pular mensagens de outros setores apenas se ainda não há contexto do chat
          }
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

      // Wrapper do avatar com status dot
      const avatarWrap = document.createElement("div");
      avatarWrap.classList.add("contact-avatar-wrap");
      avatarWrap.appendChild(avatar);
      const statusDot = document.createElement("span");
      statusDot.classList.add("status-dot");
      if (!chatData.isOnline) statusDot.classList.add("offline");
      avatarWrap.appendChild(statusDot);

      contact.appendChild(avatarWrap);
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
            delete supportChats[chatId];
          }
          // Se o chat não está na lista de contatos válidos, remover
          else if (!validChatIds.has(chatId)) {
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
            }
            return contributorExists;
          }
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
      const currentUser = getStorageItem("currentUser", {});
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

      // Mostrar chat header quando um contato é selecionado
      const chatHeaderEl = document.getElementById("chatHeader");
      if (chatHeaderEl) chatHeaderEl.style.display = "flex";

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

      const currentUser = getStorageItem("currentUser", {});
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
      
      // CRITICAL: Garantir que todas as mensagens com arquivo tenham file.data antes de renderizar
      // Buscar file.data do localStorage para todas as mensagens que não têm
      if (messagesWithFiles.length > messagesWithFileData.length) {
        try {
          const allMessages = getStorageItem("supportMessages", []);
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
              }
            }
          });
          
          if (restoredCount > 0) {
          }
        } catch (error) {
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
              const allMessages = getStorageItem("supportMessages", []);
              
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
              } else if (msg.file) {
              }
            } catch (error) {
            }
          } else {
          }
          
          if (fileDataToRender) {
            
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
      const messages = getStorageItem("supportMessages", []);
      
      // DEBUG: Verificar quantas mensagens têm file.data no localStorage
      const messagesWithFiles = messages.filter(m => m.file && m.file.data);
      
      // DEBUG: Verificar mensagens com arquivo que pertencem a este funcionário ANTES da filtragem
      const messagesWithFilesForEmployee = messages.filter(msg => {
        if (!msg.file || !msg.file.data) return false;
        return (msg.chatId === employeeChatId) ||
               (msg.type === "client" && msg.contributorId === contributorId && msg.employeeId === employeeId) ||
               (msg.type === "support" && msg.contributorId === contributorId && msg.targetEmployeeId === employeeId);
      });
      if (messagesWithFilesForEmployee.length > 0) {
        messagesWithFilesForEmployee.forEach((msg, idx) => {
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
              return true;
            }
          }
        }
        return false;
      });
      
      if (messagesWithFilesNotIncluded.length > 0) {
      }
      
      // DEBUG: Verificar quantas mensagens filtradas têm file
      const filteredMessagesWithFiles = employeeMessages.filter(m => m.file);
      const filteredMessagesWithFileData = employeeMessages.filter(m => m.file && m.file.data);
      
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
          }
        }
        
        // Se não encontrou por ID, tentar por timestamp
        if (!fileDataFromStorage && msg.timestamp && localStorageMessagesMap.has('ts:' + msg.timestamp)) {
          const storageMsg = localStorageMessagesMap.get('ts:' + msg.timestamp);
          if (storageMsg.file && storageMsg.file.data) {
            fileDataFromStorage = storageMsg.file.data;
          }
        }
        
        // Se encontrou file.data no localStorage, SEMPRE usar ele (sobrescrever se necessário)
        if (fileDataFromStorage && msg.file) {
          msg.file.data = fileDataFromStorage;
        } else if (msg.file && !msg.file.data) {
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
      const messages = getStorageItem("supportMessages", []);
      
      // DEBUG: Verificar quantas mensagens têm file.data no localStorage
      const messagesWithFiles = messages.filter(m => m.file && m.file.data);
      
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
            }
          }
          
          // Se não encontrou por ID, tentar por timestamp
          if (!fileDataFromStorage && msg.timestamp && localStorageMessagesMap.has('ts:' + msg.timestamp)) {
            const storageMsg = localStorageMessagesMap.get('ts:' + msg.timestamp);
            if (storageMsg.file && storageMsg.file.data) {
              fileDataFromStorage = storageMsg.file.data;
            }
          }
          
          // Se encontrou file.data no localStorage, SEMPRE usar ele (sobrescrever se necessário)
          if (fileDataFromStorage && msg.file) {
            msg.file.data = fileDataFromStorage;
          } else if (msg.file && !msg.file.data) {
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
        return;
      }
      
      // Ativar flag de alternância
      isSwitchingEmployee = true;
      
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
        
      } catch (error) {
      } finally {
        // Sempre liberar o flag, mesmo em caso de erro
        isSwitchingEmployee = false;
      }
    }
    
    // Função para atualizar lista de funcionários do contribuinte ativo (similar a updateSupportContactsList)
    function updateActiveContributorEmployeesList() {
      // Detectar qual contato de contribuinte está selecionado (ativo)
      const activeContributorContact = document.querySelector(".contact.support-contact.contributor-contact.active");
      if (!activeContributorContact) return;

      const activeChatId = activeContributorContact.getAttribute("data-support-chat-id");
      if (!activeChatId) return;
      
      if (!supportChats[activeChatId]) {
        return;
      }
      
      const activeChat = supportChats[activeChatId];
      if (!activeChat.contributorId) {
        return;
      }
      
      // Atualizar lista de funcionários do contribuinte ativo (sempre recriar, como updateSupportContactsList faz)
      renderEmployeesList(activeChat.contributorId);
    }

    // Função para contar total de mensagens não lidas do chat de contribuintes
    function getTotalSupportUnreadCount() {
      let totalUnread = 0;
      const currentUser = getStorageItem("currentUser", {});
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
      const currentUser = getStorageItem("currentUser", {});
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
        return;
      }

      // Obter todos os funcionários do storage primeiro
      const allEmployees = getContributorEmployees();
      
      // Obter funcionários do contribuinte específico
      const employees = getEmployeesByContributorId(contributorId);
      

      // Atualizar contador
      employeesCount.textContent = employees.length;

      // Limpar lista (isso remove os event listeners antigos também)
      employeesList.innerHTML = "";

      // Se não houver funcionários, esconder a lista
      if (employees.length === 0) {
        employeesListContainer.classList.add("hidden");
        return;
      }

      // CRITICAL: Sempre mostrar lista se há funcionários
      employeesListContainer.classList.remove("hidden");

      // Usar event delegation para evitar duplicação de listeners
      // Remover listener antigo se existir
      employeesList.removeEventListener("click", handleEmployeeClick);
      
      // Adicionar um único listener usando event delegation
      employeesList.addEventListener("click", handleEmployeeClick);

      // Renderizar cada funcionário
      employees.forEach((employee, index) => {
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
        const messages = getStorageItem("supportMessages", []);
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
      });
      
      // Verificar se os elementos foram adicionados corretamente
      const renderedEmployees = employeesList.querySelectorAll(".employee-item");
    }

    

    // Função para marcar mensagens como lidas

    // Função para contar mensagens não lidas do administrador para um contribuinte
    function getAdminUnreadCount(contributorId) {
      const messages = getStorageItem("supportMessages", []);
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
      const messages = getStorageItem("supportMessages", []);
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

      const messages = getStorageItem("supportMessages", []);
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


    }

    

    // Função para mostrar pré-visualização inline

    function showFilePreviewInline(file, fileData) {

      if (!filePreviewInline || !filePreviewContentInline) {


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

      } else if (isAudioFile(file.name)) {

        const audio = document.createElement("audio");

        audio.src = fileData;

        audio.controls = true;

        audio.preload = "metadata";

        filePreviewContentInline.appendChild(audio);

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

      if (!currentFile || !currentFileData) {
        return;
      }

      const caption = messageInput.value.trim();
      const time = getCurrentTime();

        // Obter nome do usuário logado
        const currentUser = getStorageItem("currentUser", {});
        const userName = currentUser.fullName || currentUser.username || "Usuário";
        const userSector = currentUser.sector || "";

            // Verificar se é um chat de suporte
            if (currentSupportChatId) {

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
                profileImage: currentUser.profileImage || DEFAULT_PROFILE_IMAGE,
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
              const messages = getStorageItem("supportMessages", []);

              messages.push(messageData);

              localStorage.setItem("supportMessages", JSON.stringify(messages));

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

              const activeContact = document.querySelector(".contact.active:not(.support-contact)");

        if (!activeContact) {
          return;
        }

              const contactId = activeContact.getAttribute("data-contact-id");

              const contact = contacts.find(c => c.id === parseInt(contactId));

        if (!contact) {
          return;
        }
              

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
          
                
                const allMessages = getStorageItem("supportMessages", []);
                allMessages.push(messageData);
                localStorage.setItem("supportMessages", JSON.stringify(allMessages));
          
                
                // Atualizar lista de arquivos do perfil
                renderUserFiles();
              } catch (error) {
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


        return;

      }

      

      emojiGrid.innerHTML = "";

      const emojis = emojiData[category] || emojiData.smileys;

      


      

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

          transition: all 0.6s var(--ease-out-smooth);

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


        const isVisible = emojiPanel.style.display === "block";

        emojiPanel.style.display = isVisible ? "none" : "block";

        

        if (emojiPanel.style.display === "block") {

          // Renderizar categoria ativa

          const activeCategory = document.querySelector('.emoji-category.active');

          const categoryName = activeCategory ? activeCategory.getAttribute('data-category') : 'smileys';

          renderEmojis(categoryName);

          


        }

      });

    } else {


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

        // Limite de 10 MB para arquivos enviados no chat
        const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_CHAT_FILE_SIZE) {
          showToast("Arquivo muito grande. O limite é 10 MB.", "error");
          fileInput.value = '';
          return;
        }

        try {

          const fileData = await fileToBase64(file);

          showFilePreviewInline(file, fileData);

        } catch (error) {

          showToast("Erro ao processar arquivo", "error");


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
      if (chatContainer && chatContainer.classList.contains("active")) {
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

    // ==================== MENU ⋮ DO CHAT (Exportar Histórico) ====================
    (function initChatOptionsMenu() {
      const chatOptionsBtn = document.getElementById("chatOptionsBtn");
      const chatOptionsDropdown = document.getElementById("chatOptionsDropdown");
      const chatOptionExportReport = document.getElementById("chatOptionExportReport");
      const closeReportModalBtn = document.getElementById("closeReportModal");
      const reportBackdrop = document.getElementById("reportModalBackdrop");

      if (!chatOptionsBtn) return;

      // Toggle dropdown
      chatOptionsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chatOptionsDropdown.classList.toggle("hidden");
      });

      // Fechar dropdown ao clicar fora
      document.addEventListener("click", () => {
        if (chatOptionsDropdown) chatOptionsDropdown.classList.add("hidden");
      });

      function openReportOverlay() {
        if (typeof loadContactsSelector === "function") loadContactsSelector();

        // Pré-selecionar o contato ativo no chat
        const activeContactEl = document.querySelector(".contacts-list .contact.active");
        if (activeContactEl) {
          const chatId = activeContactEl.getAttribute("data-support-chat-id");
          const contactId = activeContactEl.getAttribute("data-contact-id");
          if (chatId && supportChats[chatId]) {
            selectedContact = { id: chatId, type: "support", clientName: supportChats[chatId].clientName };
          } else if (contactId) {
            const c = contacts.find(ct => String(ct.id) === String(contactId));
            if (c) selectedContact = { ...c, type: "normal" };
          }
          const displayEl = document.getElementById("selectedContactDisplay");
          if (displayEl && selectedContact) {
            displayEl.textContent = selectedContact.clientName || selectedContact.name || "Contato";
          }
        }

        scheduledMessageContainer.classList.add("overlay-active");
        if (closeReportModalBtn) closeReportModalBtn.classList.remove("hidden");
        if (reportBackdrop) reportBackdrop.classList.remove("hidden");
        if (reportPreview) reportPreview.style.display = "none";
        if (downloadPdfBtn) downloadPdfBtn.style.display = "none";
      }

      function closeReportOverlay() {
        scheduledMessageContainer.classList.remove("overlay-active");
        if (closeReportModalBtn) closeReportModalBtn.classList.add("hidden");
        if (reportBackdrop) reportBackdrop.classList.add("hidden");
      }

      if (chatOptionExportReport) {
        chatOptionExportReport.addEventListener("click", () => {
          chatOptionsDropdown.classList.add("hidden");
          openReportOverlay();
        });
      }

      if (closeReportModalBtn) closeReportModalBtn.addEventListener("click", closeReportOverlay);
      if (reportBackdrop) reportBackdrop.addEventListener("click", closeReportOverlay);
    })();


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

        avatarHTML = `<img class="contact-avatar-img" src="${escapeAttr(image)}" alt="${escapeAttr(safeName)}" data-fallback-initial="${escapeAttr(safeInitial)}">`;

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

      

      // Vincular fallback do avatar via event listener (evita onerror inline)
      const avatarImg = item.querySelector('.contact-avatar-img');
      if (avatarImg) {
        const fallbackInitial = avatarImg.getAttribute('data-fallback-initial') || '?';
        avatarImg.addEventListener('error', function() {
          this.src = getPlaceholderAvatarDataUri(36, fallbackInitial);
        });
      }

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


      } else {

        // Só permitir selecionar data final se houver data inicial

        if (!reportStartDate) {


          return;

        }

        reportEndDate = date;

        if (reportEndDateDisplay) reportEndDateDisplay.textContent = formatDateDisplay(date);


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

      const currentUser = getStorageItem("currentUser", {});

      const userName = currentUser.fullName || currentUser.username || "Usuário";

      

      // Normalizar datas

      const start = new Date(startDate);

      start.setHours(0, 0, 0, 0);

      

      const end = new Date(endDate);

      end.setHours(23, 59, 59, 999);

      

      // Verificar se é contato de suporte

      if (contact.type === 'support') {

        // Buscar mensagens de suporte

        const supportMessages = getStorageItem("supportMessages", []);
        
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
              return;
            }
            
            const msgDate = new Date(msg.timestamp);
            
            // Verificar se a data é válida
            if (isNaN(msgDate.getTime())) {
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
        const allMessages = getStorageItem("supportMessages", []);
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

              📎 <strong>Arquivo:</strong> ${escapeHtml(msg.fileInfo.name)}<br>

              <strong>Formato:</strong> ${msg.fileInfo.format} | <strong>Tamanho:</strong> ${msg.fileInfo.size}

            `;

            msgItem.appendChild(fileDiv);

          }

          

          reportPreviewContent.appendChild(msgItem);

        });

      }

      


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


        return;

      }

      


      

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

            📎 <strong>Arquivo:</strong> ${escapeHtml(msg.fileInfo.name)}<br>

            <strong>Formato:</strong> ${msg.fileInfo.format} | <strong>Tamanho:</strong> ${msg.fileInfo.size}

          `;

          msgDiv.appendChild(fileDiv);

        }

        

        messagesContainer.appendChild(msgDiv);

      });

      

      pdfContent.appendChild(messagesContainer);

      


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


          showToast("Erro: conteúdo vazio", "error");

          return;

        }

        



        

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

        



        

        // Verificar se canvas é válido

        if (!canvas || canvas.width === 0 || canvas.height === 0) {


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

        


        

        // Limpar container oculto

        pdfElement.innerHTML = '';

        

        // Restaurar botão

        if (downloadPdfBtn) {

          downloadPdfBtn.disabled = false;

          downloadPdfBtn.style.opacity = '1';

          downloadPdfBtn.innerHTML = '<img src="https://img.icons8.com/fluency/48/pdf--v1.png" alt="pdf">';

        }

        

      } catch (error) {


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
      const currentUser = getStorageItem("currentUser", {});
      const currentUsername = normalizeUsername(currentUser.username);
      
      if (!currentUsername) {
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

      // Restaurar destaque do contato ativo após reconstrução da lista
      if (currentInternalChatId) {
        const activeContact = internalContactsSection.querySelector(
          `[data-chat-id="${currentInternalChatId}"]`
        );
        if (activeContact) activeContact.classList.add("active");
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
      
    }
    
    // Função para marcar mensagens internas como lidas
    function markInternalMessagesAsRead(chatId) {
      const messages = getInternalMessages();
      const chatMessages = messages[chatId] || [];
      
      const currentUser = getStorageItem("currentUser", {});
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

      const currentUser = getStorageItem("currentUser", {});
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

      const currentUser = getStorageItem("currentUser", {});
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
      
      
      if (messageInputContainer) {
        messageInputContainer.classList.add("active");
        messageInputContainer.style.display = "flex";
      } else {
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
        const requests = getStorageItem('recruitmentRequests', []);
        return requests;
      } catch (error) {
        return [];
      }
    };
    
    // Função para exibir solicitações de recrutamento
    window.renderRecruitmentRequests = function() {
      const requestsList = document.getElementById('recruitmentRequestsList');
      const totalBadge = document.getElementById('totalRecruitmentRequests');
      
      if (!requestsList) {
        return;
      }
      
      const requests = window.loadRecruitmentRequests();
      
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
      
      requestsList.innerHTML = '';
      sortedRequests.forEach(function(request) {
        const date = new Date(request.createdAt);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const statusBadge = {
          pending: { text: 'Pendente', class: 'status-pending' },
          approved: { text: 'Aprovada', class: 'status-approved' },
          rejected: { text: 'Rejeitada', class: 'status-rejected' },
          redirected: { text: 'Redirecionada', class: 'status-redirected' }
        }[request.status] || { text: 'Pendente', class: 'status-pending' };

        const _e = escapeHtml;
        const card = document.createElement('div');
        card.className = 'recruitment-request-card';
        card.dataset.requestId = request.id;
        card.innerHTML = `
          <div class="request-card-header">
            <div class="request-card-title">
              <h4>${_e(request.jobTitle)}</h4>
              <span class="request-company">${_e(request.contributorName)}</span>
            </div>
            <div class="request-card-badges">
              <span class="status-badge ${statusBadge.class}">${statusBadge.text}</span>
              <span class="vacancy-badge">${_e(String(request.vacancyQuantity))} vaga(s)</span>
            </div>
          </div>
          <div class="request-card-info">
            <div class="request-info-item"><i class='bx bx-dollar'></i><span>${_e(request.salary)}</span></div>
            <div class="request-info-item"><i class='bx bx-time'></i><span>${_e(request.workSchedule)}</span></div>
            <div class="request-info-item"><i class='bx bx-map'></i><span>${_e(getLocationText(request.locationPreference))}</span></div>
            <div class="request-info-item"><i class='bx bx-calendar'></i><span>${formattedDate}</span></div>
          </div>
          <div class="request-card-actions">
            <button class="btn-view-details">
              <i class='bx bx-show'></i> Ver Detalhes
            </button>
          </div>
        `;
        card.addEventListener('click', function() { viewRecruitmentRequestDetails(request.id); });
        card.querySelector('.btn-view-details').addEventListener('click', function(e) {
          e.stopPropagation();
          viewRecruitmentRequestDetails(request.id);
        });
        requestsList.appendChild(card);
      });
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
      const _e = escapeHtml;
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h2>Detalhes da Solicitação de Recrutamento</h2>
            <button class="close-modal-btn js-close-recruitment-modal">
              <i class='bx bx-x'></i>
            </button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div class="request-detail-section">
              <h3>Informações Básicas</h3>
              <div class="detail-grid">
                <div class="detail-item"><strong>Cargo:</strong> ${_e(request.jobTitle)}</div>
                <div class="detail-item"><strong>Quantidade de Vagas:</strong> ${_e(String(request.vacancyQuantity))}</div>
                <div class="detail-item"><strong>Salário:</strong> ${_e(request.salary)}</div>
                <div class="detail-item"><strong>Regime de Trabalho:</strong> ${_e(request.workSchedule)}</div>
              </div>
            </div>

            <div class="request-detail-section">
              <h3>Localização</h3>
              <div class="detail-grid">
                <div class="detail-item"><strong>Preferência:</strong> ${_e(getLocationText(request.locationPreference))}</div>
                ${request.companyAddress ? `<div class="detail-item"><strong>Endereço da Empresa:</strong> ${_e(request.companyAddress)}</div>` : ''}
                ${request.maxDistance ? `<div class="detail-item"><strong>Distância Máxima:</strong> ${_e(String(request.maxDistance))} km</div>` : ''}
              </div>
            </div>

            ${request.educationLevel ? `
            <div class="request-detail-section">
              <h3>Requisitos</h3>
              <div class="detail-grid">
                <div class="detail-item"><strong>Escolaridade Mínima:</strong> ${_e(getEducationText(request.educationLevel))}</div>
                ${request.experienceRequired ? `<div class="detail-item"><strong>Experiência Necessária:</strong> ${_e(getExperienceText(request.experienceRequired))}</div>` : ''}
              </div>
              ${request.requiredSkills ? `<div class="detail-item full-width"><strong>Habilidades e Competências:</strong><p style="margin-top: 8px; color: #6b7280;">${_e(request.requiredSkills)}</p></div>` : ''}
            </div>
            ` : ''}

            <div class="request-detail-section">
              <h3>Descrição da Vaga</h3>
              <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${_e(request.jobDescription)}</p>
            </div>

            ${request.benefits ? `
            <div class="request-detail-section">
              <h3>Benefícios Oferecidos</h3>
              <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${_e(request.benefits)}</p>
            </div>
            ` : ''}

            ${request.contactEmail || request.contactPhone ? `
            <div class="request-detail-section">
              <h3>Contato</h3>
              <div class="detail-grid">
                ${request.contactEmail ? `<div class="detail-item"><strong>E-mail:</strong> ${_e(request.contactEmail)}</div>` : ''}
                ${request.contactPhone ? `<div class="detail-item"><strong>Telefone:</strong> ${_e(request.contactPhone)}</div>` : ''}
              </div>
            </div>
            ` : ''}

            <div class="request-detail-section">
              <h3>Informações do Contribuinte</h3>
              <div class="detail-grid">
                <div class="detail-item"><strong>Contribuinte:</strong> ${_e(request.contributorName)}</div>
                <div class="detail-item"><strong>Data da Solicitação:</strong> ${new Date(request.createdAt).toLocaleString('pt-BR')}</div>
                <div class="detail-item"><strong>Status:</strong> <span class="status-badge ${getStatusClass(request.status)}">${getStatusText(request.status)}</span></div>
              </div>
            </div>

            <div class="request-detail-actions">
              <button class="btn-redirect-vacancy js-redirect-vacancy">
                <i class='bx bx-link-external'></i> Redirecionar Vaga
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.style.display = 'flex';

      // Vincular botões via addEventListener (sem onclick inline)
      const _closeBtn = modal.querySelector('.js-close-recruitment-modal');
      if (_closeBtn) _closeBtn.addEventListener('click', closeRecruitmentRequestModal);
      const _redirectBtn = modal.querySelector('.js-redirect-vacancy');
      if (_redirectBtn) _redirectBtn.addEventListener('click', function() { redirectRecruitmentRequest(request.id); });

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
      const redirectUrl = '../publico/vagas.html';
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
      
      // Carregar solicitações do localStorage
      const requests = getStorageItem('recruitmentRequests', []);
      
      // Carregar vagas publicadas
      const publishedJobs = getStorageItem('publishedJobs', []);
      
      // Carregar candidaturas
      const applications = getStorageItem('jobApplications', []);
      
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
      const applications = getStorageItem('jobApplications', []);
      const application = applications.find(a => a.id === applicationId);
      
      if (!application) {
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
      
      // Usar escapeHtml em todos os campos do usuário para evitar XSS
      const _esc = escapeHtml;
      modalBody.innerHTML = `
        <div class="job-detail-section">
          <h3>Informações da Vaga</h3>
          <div class="job-detail-item"><strong>Cargo:</strong> ${_esc(application.jobTitle) || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Empresa:</strong> ${_esc(application.jobCompany) || 'Não informado'}</div>
        </div>

        <div class="job-detail-section">
          <h3>Dados do Candidato</h3>
          <div class="job-detail-item"><strong>Nome Completo:</strong> ${_esc(application.fullName) || 'Não informado'}</div>
          <div class="job-detail-item"><strong>E-mail:</strong> <a href="mailto:${escapeAttr(application.email)}">${_esc(application.email) || 'Não informado'}</a></div>
          <div class="job-detail-item"><strong>Telefone:</strong> <a href="tel:${escapeAttr(application.phone)}">${_esc(application.phone) || 'Não informado'}</a></div>
        </div>

        ${application.coverMessage ? `
        <div class="job-detail-section">
          <h3>Mensagem de Apresentação</h3>
          <p style="white-space: pre-wrap;">${_esc(application.coverMessage)}</p>
        </div>
        ` : ''}

        ${application.resumeBase64 ? `
        <div class="job-detail-section">
          <h3>Currículo</h3>
          <div class="job-detail-item">
            <strong>Arquivo:</strong> ${_esc(application.resumeFileName || 'curriculo.pdf')}
            <br>
            <small>Tamanho: ${application.resumeFileSize ? (application.resumeFileSize / 1024).toFixed(2) + ' KB' : 'Não informado'}</small>
          </div>
          <button class="btn-download-resume js-download-resume" style="margin-top: 10px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class='bx bx-download'></i> Baixar Currículo
          </button>
        </div>
        ` : ''}

        <div class="job-detail-section">
          <h3>Informações do Sistema</h3>
          <div class="job-detail-item"><strong>Status:</strong> ${getApplicationStatusBadge(application.status)}</div>
          <div class="job-detail-item"><strong>Data de Candidatura:</strong> ${formattedDate}</div>
          ${application.reviewedAt ? `<div class="job-detail-item"><strong>Revisada em:</strong> ${new Date(application.reviewedAt).toLocaleString('pt-BR')}</div>` : ''}
          ${application.reviewedBy ? `<div class="job-detail-item"><strong>Revisada por:</strong> ${_esc(application.reviewedBy)}</div>` : ''}
        </div>
      `;

      // Vincular botão de download via addEventListener (sem onclick inline)
      const _dlBtn = modalBody.querySelector('.js-download-resume');
      if (_dlBtn) {
        _dlBtn.addEventListener('click', function() { downloadResume(application.id); });
      }
      
      // Preencher rodapé com ações
      const currentUser = getCurrentUser();
      const userName = currentUser.fullName || currentUser.username || 'Admin';
      
      // Construção por DOM para evitar injeção via application.id / userName em onclick
      modalFooter.innerHTML = '';

      const _btnFechar = document.createElement('button');
      _btnFechar.className = 'btn-close-modal';
      _btnFechar.innerHTML = "<i class='bx bx-x'></i> Fechar";
      _btnFechar.addEventListener('click', closeJobDetailModal);
      modalFooter.appendChild(_btnFechar);

      if (application.status === 'pending') {
        const _btnRevisar = document.createElement('button');
        _btnRevisar.className = 'btn-approve-job';
        _btnRevisar.innerHTML = "<i class='bx bx-check'></i> Marcar como Revisada";
        _btnRevisar.addEventListener('click', () => updateApplicationStatus(application.id, 'reviewed', userName));
        modalFooter.appendChild(_btnRevisar);

        const _btnContatar = document.createElement('button');
        _btnContatar.className = 'btn-approve-job';
        _btnContatar.style.background = '#3b82f6';
        _btnContatar.innerHTML = "<i class='bx bx-phone'></i> Marcar como Contatada";
        _btnContatar.addEventListener('click', () => updateApplicationStatus(application.id, 'contacted', userName));
        modalFooter.appendChild(_btnContatar);
      }

      if (application.status !== 'rejected') {
        const _btnRejeitar = document.createElement('button');
        _btnRejeitar.className = 'btn-reject-job';
        _btnRejeitar.innerHTML = "<i class='bx bx-x'></i> Rejeitar";
        _btnRejeitar.addEventListener('click', () => updateApplicationStatus(application.id, 'rejected', userName));
        modalFooter.appendChild(_btnRejeitar);
      }

      if (application.status !== 'hired') {
        const _btnContratar = document.createElement('button');
        _btnContratar.className = 'btn-approve-job';
        _btnContratar.style.background = '#10b981';
        _btnContratar.innerHTML = "<i class='bx bx-check-circle'></i> Contratar";
        _btnContratar.addEventListener('click', () => updateApplicationStatus(application.id, 'hired', userName));
        modalFooter.appendChild(_btnContratar);
      }
      
      modal.classList.remove('hidden');
    }

    // Função para baixar currículo
    function downloadResume(applicationId) {
      const applications = getStorageItem('jobApplications', []);
      const application = applications.find(a => a.id === applicationId);
      
      if (!application || !application.resumeBase64) {
        alert('Currículo não encontrado!');
        return;
      }
      
      // Validar que é um data:URI legítimo antes de usar como href
      if (typeof application.resumeBase64 !== 'string' || !application.resumeBase64.startsWith('data:')) {
        alert('Arquivo de currículo inválido ou corrompido.');
        return;
      }

      // Criar link de download
      const link = document.createElement('a');
      link.href = application.resumeBase64;
      link.download = application.resumeFileName || `curriculo_${(application.fullName || 'candidato').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Função para atualizar status da candidatura
    function updateApplicationStatus(applicationId, newStatus, reviewedBy) {
      const applications = getStorageItem('jobApplications', []);
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
        const publishedJobs = getStorageItem('publishedJobs', []);
        job = publishedJobs.find(j => j.id === jobId);
      } else {
        const requests = getStorageItem('recruitmentRequests', []);
        job = requests.find(r => r.id === jobId);
      }
      
      if (!job) {
        return;
      }
      
      const modal = document.getElementById('jobDetailModal');
      const modalBody = document.getElementById('jobDetailModalBody');
      const modalFooter = document.getElementById('jobDetailModalFooter');
      const modalTitle = document.getElementById('modalJobTitle');
      
      if (!modal || !modalBody || !modalFooter || !modalTitle) return;
      
      modalTitle.textContent = job.jobTitle || 'Detalhes da Vaga';
      
      // Preencher corpo do modal
      const _e = escapeHtml;
      modalBody.innerHTML = `
        <div class="job-detail-section">
          <h3>Informações Básicas</h3>
          <div class="job-detail-item"><strong>Empresa:</strong> ${_e(job.contributorName) || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Cargo:</strong> ${_e(job.jobTitle) || 'Não informado'}</div>
          <div class="job-detail-item"><strong>Vagas Disponíveis:</strong> ${_e(String(job.vacancyQuantity || 1))}</div>
          <div class="job-detail-item"><strong>Salário:</strong> ${_e(job.salary) || 'A combinar'}</div>
          <div class="job-detail-item"><strong>Regime:</strong> ${_e(job.workSchedule) || 'Não especificado'}</div>
          <div class="job-detail-item"><strong>Localização:</strong> ${_e(formatLocationPreference(job.locationPreference))}</div>
          ${job.companyAddress ? `<div class="job-detail-item"><strong>Endereço:</strong> ${_e(job.companyAddress)}</div>` : ''}
          ${job.maxDistance ? `<div class="job-detail-item"><strong>Distância Máxima:</strong> ${_e(String(job.maxDistance))} km</div>` : ''}
        </div>

        <div class="job-detail-section">
          <h3>Descrição da Vaga</h3>
          <p>${_e(job.jobDescription) || 'Não informado'}</p>
        </div>

        ${job.requiredSkills ? `
        <div class="job-detail-section">
          <h3>Requisitos e Qualificações</h3>
          <p>${_e(job.requiredSkills)}</p>
          ${job.educationLevel ? `<p><strong>Escolaridade:</strong> ${_e(formatEducationLevel(job.educationLevel))}</p>` : ''}
          ${job.experienceRequired ? `<p><strong>Experiência:</strong> ${_e(formatExperience(job.experienceRequired))}</p>` : ''}
        </div>
        ` : ''}

        ${job.benefits ? `
        <div class="job-detail-section">
          <h3>Benefícios</h3>
          <p>${_e(job.benefits)}</p>
        </div>
        ` : ''}

        ${job.contactEmail || job.contactPhone ? `
        <div class="job-detail-section">
          <h3>Contato</h3>
          ${job.contactEmail ? `<div class="job-detail-item"><strong>E-mail:</strong> ${_e(job.contactEmail)}</div>` : ''}
          ${job.contactPhone ? `<div class="job-detail-item"><strong>Telefone:</strong> ${_e(job.contactPhone)}</div>` : ''}
        </div>
        ` : ''}

        <div class="job-detail-section">
          <h3>Informações do Sistema</h3>
          <div class="job-detail-item"><strong>Status:</strong> ${getStatusBadge(job.status || status)}</div>
          <div class="job-detail-item"><strong>Data de Criação:</strong> ${new Date(job.createdAt).toLocaleString('pt-BR')}</div>
          ${job.publishedAt ? `<div class="job-detail-item"><strong>Data de Publicação:</strong> ${new Date(job.publishedAt).toLocaleString('pt-BR')}</div>` : ''}
        </div>
      `;

      // Rodapé: construção DOM para evitar injeção via jobId em onclick
      modalFooter.innerHTML = '';
      if (status === 'pending') {
        const _btnPublish = document.createElement('button');
        _btnPublish.className = 'btn-publish-job';
        _btnPublish.innerHTML = "<i class='bx bx-globe'></i> Publicar";
        _btnPublish.addEventListener('click', () => publishJob(jobId));
        modalFooter.appendChild(_btnPublish);

        const _btnReject = document.createElement('button');
        _btnReject.className = 'btn-reject-job';
        _btnReject.innerHTML = "<i class='bx bx-x'></i> Rejeitar";
        _btnReject.addEventListener('click', () => rejectJob(jobId));
        modalFooter.appendChild(_btnReject);
      } else if (status === 'published') {
        const _btnUnpublish = document.createElement('button');
        _btnUnpublish.className = 'btn-unpublish-job';
        _btnUnpublish.innerHTML = "<i class='bx bx-hide'></i> Despublicar";
        _btnUnpublish.addEventListener('click', () => unpublishJob(jobId));
        modalFooter.appendChild(_btnUnpublish);
      }
      const _btnClose = document.createElement('button');
      _btnClose.className = 'btn-close-modal';
      _btnClose.innerHTML = "<i class='bx bx-x'></i> Fechar";
      _btnClose.addEventListener('click', closeJobDetailModal);
      modalFooter.appendChild(_btnClose);
      
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
      const requests = getStorageItem('recruitmentRequests', []);
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
      
      const requests = getStorageItem('recruitmentRequests', []);
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
      const publishedJobs = getStorageItem('publishedJobs', []);
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
      const requests = getStorageItem('recruitmentRequests', []);
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
      const publishedJobs = getStorageItem('publishedJobs', []);
      
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
      
      const publishedJobs = getStorageItem('publishedJobs', []);
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
      const requests = getStorageItem('recruitmentRequests', []);
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

    // ==================== LEMBRETES ====================

    const LEMBRETES_KEY = "chatui_lembretes";
    let lembreteCurrentFilter = "all";

    function getLembretes() {
      try { return JSON.parse(localStorage.getItem(LEMBRETES_KEY) || "[]"); } catch { return []; }
    }

    function saveLembretes(list) {
      localStorage.setItem(LEMBRETES_KEY, JSON.stringify(list));
      updateLembretesBadge();
    }

    function updateLembretesBadge() {
      const badge = document.getElementById("lembretesNavBadge");
      if (!badge) return;
      const today = new Date(); today.setHours(0,0,0,0);
      const list = getLembretes();
      const hasPending = list.some(l => {
        if (l.done) return false;
        const d = new Date(l.data + "T00:00:00");
        return d <= today;
      });
      badge.classList.toggle("visible", hasPending);
    }

    function formatLembreteDate(data, hora) {
      if (!data) return "";
      const d = new Date(data + "T00:00:00");
      const opts = { day: "2-digit", month: "short", year: "numeric" };
      let str = d.toLocaleDateString("pt-BR", opts);
      if (hora) str += " · " + hora;
      return str;
    }

    function isOverdue(data) {
      if (!data) return false;
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(data + "T00:00:00");
      return d < today;
    }

    function isToday(data) {
      if (!data) return false;
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(data + "T00:00:00");
      return d.getTime() === today.getTime();
    }

    function isThisWeek(data) {
      if (!data) return false;
      const today = new Date(); today.setHours(0,0,0,0);
      const end = new Date(today); end.setDate(today.getDate() + 7);
      const d = new Date(data + "T00:00:00");
      return d >= today && d < end;
    }

    function renderLembretes() {
      const list = getLembretes();
      const container = document.getElementById("lembretesListContainer");
      const empty = document.getElementById("lembretesEmpty");
      if (!container || !empty) return;

      const filtered = list.filter(l => {
        if (lembreteCurrentFilter === "today") return isToday(l.data) && !l.done;
        if (lembreteCurrentFilter === "week") return isThisWeek(l.data) && !l.done;
        if (lembreteCurrentFilter === "overdue") return isOverdue(l.data) && !l.done;
        return true;
      });

      container.innerHTML = "";
      if (filtered.length === 0) {
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");

      filtered.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(a.data + "T00:00:00") - new Date(b.data + "T00:00:00");
      });

      filtered.forEach((l, i) => {
        const overdue = isOverdue(l.data) && !l.done;
        const card = document.createElement("div");
        card.className = "lembrete-card" + (overdue ? " overdue" : "") + (l.done ? " done" : "");
        card.dataset.id = l.id;
        card.dataset.cat = l.cat || "geral";
        card.style.animationDelay = (i * 0.045) + "s";
        card.innerHTML = `
          <div class="lembrete-card-top">
            <div class="lembrete-card-title">${escapeHtml(l.titulo)}</div>
            <div class="lembrete-card-actions">
              <button class="lembrete-card-action done-btn" title="${l.done ? "Desfazer" : "Concluir"}">
                <i class='bx ${l.done ? "bx-undo" : "bx-check"}'></i>
              </button>
              <button class="lembrete-card-action edit-btn" title="Editar"><i class='bx bx-pencil'></i></button>
              <button class="lembrete-card-action delete delete-btn" title="Excluir"><i class='bx bx-trash'></i></button>
            </div>
          </div>
          ${l.descricao ? `<div class="lembrete-card-desc">${escapeHtml(l.descricao)}</div>` : ""}
          <div class="lembrete-card-footer">
            <div class="lembrete-card-date">
              <i class='bx bx-calendar'></i>
              ${formatLembreteDate(l.data, l.hora)}
            </div>
            <span class="lembrete-cat-badge ${l.cat || "geral"}">${l.cat || "geral"}</span>
          </div>`;

        card.querySelector(".done-btn").addEventListener("click", e => {
          e.stopPropagation();
          toggleLembreteDone(l.id);
        });
        card.querySelector(".edit-btn").addEventListener("click", e => {
          e.stopPropagation();
          openLembreteModal(l.id);
        });
        card.querySelector(".delete-btn").addEventListener("click", e => {
          e.stopPropagation();
          deleteLembrete(l.id);
        });

        container.appendChild(card);
      });
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    function openLembreteModal(editId) {
      const modal = document.getElementById("lembreteModal");
      const form = document.getElementById("lembreteForm");
      const title = document.getElementById("lembreteModalTitle");
      if (!modal || !form) return;

      form.reset();
      document.getElementById("lembreteEditId").value = "";
      document.querySelectorAll(".lembrete-cat").forEach(b => b.classList.toggle("active", b.dataset.cat === "geral"));

      if (editId) {
        const list = getLembretes();
        const item = list.find(l => l.id === editId);
        if (item) {
          title.textContent = "Editar Lembrete";
          document.getElementById("lembreteEditId").value = item.id;
          document.getElementById("lembreteTitulo").value = item.titulo;
          document.getElementById("lembreteDescricao").value = item.descricao || "";
          document.getElementById("lembreteData").value = item.data;
          document.getElementById("lembreteHora").value = item.hora || "";
          document.querySelectorAll(".lembrete-cat").forEach(b => b.classList.toggle("active", b.dataset.cat === item.cat));
        }
      } else {
        title.textContent = "Novo Lembrete";
        const today = new Date();
        document.getElementById("lembreteData").value = today.toISOString().split("T")[0];
      }

      modal.classList.remove("hidden");
    }

    function closeLembreteModal() {
      const modal = document.getElementById("lembreteModal");
      if (modal) modal.classList.add("hidden");
    }

    function deleteLembrete(id) {
      const list = getLembretes().filter(l => l.id !== id);
      saveLembretes(list);
      renderLembretes();
    }

    function toggleLembreteDone(id) {
      const list = getLembretes();
      const item = list.find(l => l.id === id);
      if (item) { item.done = !item.done; saveLembretes(list); renderLembretes(); }
    }

    // Bind modal events
    const addLembreteBtn = document.getElementById("addLembreteBtn");
    if (addLembreteBtn) addLembreteBtn.addEventListener("click", () => openLembreteModal(null));

    const closeLembreteModalBtn = document.getElementById("closeLembreteModal");
    if (closeLembreteModalBtn) closeLembreteModalBtn.addEventListener("click", closeLembreteModal);

    const cancelLembreteBtn = document.getElementById("cancelLembreteBtn");
    if (cancelLembreteBtn) cancelLembreteBtn.addEventListener("click", closeLembreteModal);

    const lembreteModal = document.getElementById("lembreteModal");
    if (lembreteModal) {
      lembreteModal.addEventListener("click", e => { if (e.target === lembreteModal) closeLembreteModal(); });
    }

    // Category selection
    document.querySelectorAll(".lembrete-cat").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".lembrete-cat").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Filter buttons
    document.querySelectorAll(".lembrete-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".lembrete-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        lembreteCurrentFilter = btn.dataset.filter;
        renderLembretes();
      });
    });

    // Form submit
    const lembreteForm = document.getElementById("lembreteForm");
    if (lembreteForm) {
      lembreteForm.addEventListener("submit", e => {
        e.preventDefault();
        const editId = document.getElementById("lembreteEditId").value;
        const titulo = document.getElementById("lembreteTitulo").value.trim();
        const descricao = document.getElementById("lembreteDescricao").value.trim();
        const data = document.getElementById("lembreteData").value;
        const hora = document.getElementById("lembreteHora").value;
        const cat = document.querySelector(".lembrete-cat.active")?.dataset.cat || "geral";

        if (!titulo || !data) return;

        const list = getLembretes();
        if (editId) {
          const item = list.find(l => l.id === editId);
          if (item) Object.assign(item, { titulo, descricao, data, hora, cat });
        } else {
          list.push({ id: "lr_" + Date.now(), titulo, descricao, data, hora, cat, done: false });
        }
        saveLembretes(list);
        closeLembreteModal();
        renderLembretes();
      });
    }

    // Init badge on load
    updateLembretesBadge();

    // ==================== FIM LEMBRETES ====================

    // ==================== REAL-TIME POLLING & NOTIFICATIONS ====================

    // --- State tracking ---
    let _lastSupportRaw = localStorage.getItem('supportMessages') || '[]';
    let _lastInternalRaw = localStorage.getItem('internalMessages') || '{}';
    let _lastSupportUnread = 0;
    let _lastInternalUnread = 0;
    let _notifAudioCtx = null;
    const _originalTitle = document.title;

    // --- Notification Permission ---
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // --- Sound (Web Audio API — no external files) ---
    function playNotificationSound() {
      try {
        if (localStorage.getItem('notificationSoundMuted') === '1') return;
        if (!_notifAudioCtx) _notifAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (_notifAudioCtx.state === 'suspended') _notifAudioCtx.resume();
        const t = _notifAudioCtx.currentTime;
        const o = _notifAudioCtx.createOscillator();
        const g = _notifAudioCtx.createGain();
        o.connect(g);
        g.connect(_notifAudioCtx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(830, t);
        o.frequency.setValueAtTime(580, t + 0.12);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.start(t);
        o.stop(t + 0.4);
      } catch (_) {}
    }
    window.setNotificationSoundMuted = (muted) => {
      localStorage.setItem('notificationSoundMuted', muted ? '1' : '0');
    };
    window.isNotificationSoundMuted = () => localStorage.getItem('notificationSoundMuted') === '1';

    // --- Browser notification ---
    function showBrowserNotification(title, body) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (!document.hidden) return;
      try {
        const n = new Notification(title, {
          body: body || '',
          icon: '../../assets/images/avatars/profile-1.png',
          tag: 'dominium-' + Date.now()
        });
        n.onclick = function () { window.focus(); n.close(); };
        setTimeout(function () { n.close(); }, 5000);
      } catch (_) {}
    }

    // --- Tab badge ---
    function updateTabBadge() {
      try {
        const total = getTotalSupportUnreadCount() + getTotalInternalUnreadCount();
        document.title = total > 0 ? '(' + total + ') ' + _originalTitle : _originalTitle;
      } catch (_) {}
    }

    // --- Support chat polling ---
    function pollSupportMessages() {
      const raw = localStorage.getItem('supportMessages') || '[]';
      if (raw === _lastSupportRaw) return;
      _lastSupportRaw = raw;

      try { updateSupportContactsList(); } catch (_) {}

      if (currentSupportChatId) {
        var activeContact = document.querySelector('.contacts-list .contact.active');
        if (activeContact) {
          var contactId = activeContact.getAttribute('data-contact-id');
          if (contactId) { try { updateChat(contactId); } catch (_) {} }
        }
      }

      var currentUnread = getTotalSupportUnreadCount();
      if (currentUnread > _lastSupportUnread) {
        try {
          var messages = JSON.parse(raw);
          var cu = getStorageItem('currentUser', {});
          var lastMsg = null;
          for (var i = messages.length - 1; i >= 0; i--) {
            if (normalizeUsername(messages[i].sender) !== normalizeUsername(cu.username)) {
              lastMsg = messages[i]; break;
            }
          }
          if (lastMsg) {
            playNotificationSound();
            showBrowserNotification(
              lastMsg.sender || 'Nova mensagem',
              lastMsg.text ? lastMsg.text.substring(0, 100) : 'Arquivo enviado'
            );
          }
        } catch (_) {}
      }
      _lastSupportUnread = currentUnread;
      updateSidebarBadges();
      updateTabBadge();
    }

    // --- Internal chat polling ---
    function pollInternalMessages() {
      var raw = localStorage.getItem('internalMessages') || '{}';
      if (raw === _lastInternalRaw) return;
      _lastInternalRaw = raw;

      try { updateInternalContactsList(); } catch (_) {}

      if (currentInternalChatId) {
        try { loadInternalChatMessages(currentInternalChatId); } catch (_) {}
      }

      var currentUnread = getTotalInternalUnreadCount();
      if (currentUnread > _lastInternalUnread) {
        try {
          var messages = JSON.parse(raw);
          var cu = getStorageItem('currentUser', {});
          var latestMsg = null;
          Object.values(messages).forEach(function (chatMsgs) {
            var arr = Array.isArray(chatMsgs) ? chatMsgs : [];
            for (var i = arr.length - 1; i >= 0; i--) {
              var m = arr[i];
              if (normalizeUsername(m.sender) !== normalizeUsername(cu.username) && !m.read) {
                if (!latestMsg || m.timestamp > latestMsg.timestamp) latestMsg = m;
                break;
              }
            }
          });
          if (latestMsg) {
            playNotificationSound();
            showBrowserNotification(
              latestMsg.senderName || latestMsg.sender || 'Chat interno',
              latestMsg.text ? latestMsg.text.substring(0, 100) : 'Arquivo enviado'
            );
          }
        } catch (_) {}
      }
      _lastInternalUnread = currentUnread;
      updateSidebarBadges();
      updateTabBadge();
    }

    // --- Cross-tab sync via storage event ---
    window.addEventListener('storage', function (e) {
      if (e.key === 'supportMessages') pollSupportMessages();
      if (e.key === 'internalMessages') pollInternalMessages();
      if (e.key === 'users') { try { renderUsersList(); } catch (_) {} }
    });

    // --- Init polling ---
    try { _lastSupportUnread = getTotalSupportUnreadCount(); } catch (_) {}
    try { _lastInternalUnread = getTotalInternalUnreadCount(); } catch (_) {}
    window._pollSupportInterval = window._pollSupportInterval || setInterval(pollSupportMessages, 2000);
    window._pollInternalInterval = window._pollInternalInterval || setInterval(pollInternalMessages, 2000);
    updateTabBadge();

    // ==================== FIM POLLING & NOTIFICATIONS ====================

    // ==================== MESSAGE SEARCH ====================

    var _searchMatches = [];
    var _searchIndex = -1;

    function toggleChatSearch() {
      var bar = document.getElementById('chatSearchBar');
      if (!bar) return;
      var isHidden = bar.classList.contains('hidden');
      bar.classList.toggle('hidden');
      if (isHidden) {
        var input = document.getElementById('chatSearchInput');
        if (input) { input.value = ''; input.focus(); }
      }
      clearSearchHighlights();
    }

    function clearSearchHighlights() {
      _searchMatches = [];
      _searchIndex = -1;
      document.querySelectorAll('.search-highlight').forEach(function (el) { el.classList.remove('search-highlight'); });
      document.querySelectorAll('.search-current').forEach(function (el) { el.classList.remove('search-current'); });
      var counter = document.getElementById('chatSearchCount');
      if (counter) counter.textContent = '0/0';
    }

    function searchMessages(query) {
      clearSearchHighlights();
      if (!query || query.length < 2) return;

      var messagesContainer = document.querySelector('.messages');
      if (!messagesContainer) return;

      var allMsgEls = messagesContainer.querySelectorAll('.message, .msg, .support-message');
      var lowerQuery = query.toLowerCase();

      allMsgEls.forEach(function (el) {
        if ((el.textContent || '').toLowerCase().includes(lowerQuery)) {
          el.classList.add('search-highlight');
          _searchMatches.push(el);
        }
      });

      var counter = document.getElementById('chatSearchCount');
      if (_searchMatches.length > 0) {
        _searchIndex = 0;
        _searchMatches[0].classList.add('search-current');
        _searchMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (counter) counter.textContent = '1/' + _searchMatches.length;
      } else {
        if (counter) counter.textContent = '0/0';
      }
    }

    function searchNavigate(direction) {
      if (_searchMatches.length === 0) return;
      _searchMatches[_searchIndex].classList.remove('search-current');
      _searchIndex = direction === 'next'
        ? (_searchIndex + 1) % _searchMatches.length
        : (_searchIndex - 1 + _searchMatches.length) % _searchMatches.length;
      _searchMatches[_searchIndex].classList.add('search-current');
      _searchMatches[_searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var counter = document.getElementById('chatSearchCount');
      if (counter) counter.textContent = (_searchIndex + 1) + '/' + _searchMatches.length;
    }

    // Bind search events
    var _chatSearchInput = document.getElementById('chatSearchInput');
    if (_chatSearchInput) {
      var _searchDebounce = null;
      _chatSearchInput.addEventListener('input', function (e) {
        clearTimeout(_searchDebounce);
        _searchDebounce = setTimeout(function () { searchMessages(e.target.value.trim()); }, 300);
      });
      _chatSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); searchNavigate(e.shiftKey ? 'prev' : 'next'); }
        if (e.key === 'Escape') toggleChatSearch();
      });
    }
    var _chatSearchPrev = document.getElementById('chatSearchPrev');
    var _chatSearchNext = document.getElementById('chatSearchNext');
    var _chatSearchClose = document.getElementById('chatSearchClose');
    if (_chatSearchPrev) _chatSearchPrev.addEventListener('click', function () { searchNavigate('prev'); });
    if (_chatSearchNext) _chatSearchNext.addEventListener('click', function () { searchNavigate('next'); });
    if (_chatSearchClose) _chatSearchClose.addEventListener('click', function () { toggleChatSearch(); });

    // Search button in chat header
    var _chatSearchBtn = document.getElementById('chatSearchBtn');
    if (_chatSearchBtn) _chatSearchBtn.addEventListener('click', function () { toggleChatSearch(); });

    // ---- Internal chat message search (paridade com chat público) ----
    var _intSearchMatches = [];
    var _intSearchIndex = -1;

    function toggleInternalChatSearch() {
      var bar = document.getElementById('internalChatSearchBar');
      if (!bar) return;
      var isHidden = bar.classList.contains('hidden');
      bar.classList.toggle('hidden');
      if (isHidden) {
        var input = document.getElementById('internalChatSearchInput');
        if (input) { input.value = ''; input.focus(); }
      }
      clearInternalSearchHighlights();
    }

    function clearInternalSearchHighlights() {
      _intSearchMatches = [];
      _intSearchIndex = -1;
      var container = document.getElementById('internalMessages');
      if (container) {
        container.querySelectorAll('.search-highlight').forEach(function (el) { el.classList.remove('search-highlight'); });
        container.querySelectorAll('.search-current').forEach(function (el) { el.classList.remove('search-current'); });
      }
      var counter = document.getElementById('internalChatSearchCount');
      if (counter) counter.textContent = '0/0';
    }

    function searchInternalMessages(query) {
      clearInternalSearchHighlights();
      if (!query || query.length < 2) return;
      var container = document.getElementById('internalMessages');
      if (!container) return;
      var allMsgEls = container.querySelectorAll('.message, .msg, .support-message');
      var lowerQuery = query.toLowerCase();
      allMsgEls.forEach(function (el) {
        if ((el.textContent || '').toLowerCase().includes(lowerQuery)) {
          el.classList.add('search-highlight');
          _intSearchMatches.push(el);
        }
      });
      var counter = document.getElementById('internalChatSearchCount');
      if (_intSearchMatches.length > 0) {
        _intSearchIndex = 0;
        _intSearchMatches[0].classList.add('search-current');
        _intSearchMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (counter) counter.textContent = '1/' + _intSearchMatches.length;
      } else {
        if (counter) counter.textContent = '0/0';
      }
    }

    function internalSearchNavigate(direction) {
      if (_intSearchMatches.length === 0) return;
      _intSearchMatches[_intSearchIndex].classList.remove('search-current');
      _intSearchIndex = direction === 'next'
        ? (_intSearchIndex + 1) % _intSearchMatches.length
        : (_intSearchIndex - 1 + _intSearchMatches.length) % _intSearchMatches.length;
      _intSearchMatches[_intSearchIndex].classList.add('search-current');
      _intSearchMatches[_intSearchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var counter = document.getElementById('internalChatSearchCount');
      if (counter) counter.textContent = (_intSearchIndex + 1) + '/' + _intSearchMatches.length;
    }

    var _intChatSearchInput = document.getElementById('internalChatSearchInput');
    if (_intChatSearchInput) {
      var _intSearchDebounce = null;
      _intChatSearchInput.addEventListener('input', function (e) {
        clearTimeout(_intSearchDebounce);
        _intSearchDebounce = setTimeout(function () { searchInternalMessages(e.target.value.trim()); }, 300);
      });
      _intChatSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); internalSearchNavigate(e.shiftKey ? 'prev' : 'next'); }
        if (e.key === 'Escape') toggleInternalChatSearch();
      });
    }
    var _intChatSearchPrev = document.getElementById('internalChatSearchPrev');
    var _intChatSearchNext = document.getElementById('internalChatSearchNext');
    var _intChatSearchClose = document.getElementById('internalChatSearchClose');
    if (_intChatSearchPrev) _intChatSearchPrev.addEventListener('click', function () { internalSearchNavigate('prev'); });
    if (_intChatSearchNext) _intChatSearchNext.addEventListener('click', function () { internalSearchNavigate('next'); });
    if (_intChatSearchClose) _intChatSearchClose.addEventListener('click', function () { toggleInternalChatSearch(); });
    var _intChatSearchBtn = document.getElementById('internalChatSearchBtn');
    if (_intChatSearchBtn) _intChatSearchBtn.addEventListener('click', function () { toggleInternalChatSearch(); });

    // ==================== FIM MESSAGE SEARCH ====================

  });

  // ==================== REACTIONS EM MENSAGENS (Fase 2.3) ====================
  (function initMessageReactionsFeature() {
    if (window.__reactionsInitialized) return;
    window.__reactionsInitialized = true;

    const REACTION_EMOJIS = ["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83C\uDF89"];
    const STORAGE_KEYS = ["supportMessages", "internalMessages"];

    function getCurrentUserId() {
      try {
        const u = getStorageItem("currentUser", {});
        return u.id || u.username || u.fullName || "anon";
      } catch (e) { return "anon"; }
    }

    function getCurrentUserName() {
      try {
        const u = getStorageItem("currentUser", {});
        return u.fullName || u.username || "Usuário";
      } catch (e) { return "Usuário"; }
    }

    function findMessageAndStore(msgId) {
      for (const key of STORAGE_KEYS) {
        const list = getStorageItem(key, []);
        const idx = list.findIndex(m => m && m.id === msgId);
        if (idx !== -1) return { storageKey: key, list, idx, message: list[idx] };
      }
      return null;
    }

    function persistMessage(storageKey, list) {
      localStorage.setItem(storageKey, JSON.stringify(list));
      localStorage.setItem("newSupportMessage", Date.now().toString()); // trigger cross-tab sync
    }

    function toggleReaction(msgId, emoji) {
      const hit = findMessageAndStore(msgId);
      if (!hit) return null;
      const { storageKey, list, idx, message } = hit;
      message.reactions = message.reactions || {};
      const users = message.reactions[emoji] = Array.isArray(message.reactions[emoji])
        ? message.reactions[emoji] : [];
      const userId = getCurrentUserId();
      const pos = users.indexOf(userId);
      if (pos >= 0) users.splice(pos, 1);
      else users.push(userId);
      if (users.length === 0) delete message.reactions[emoji];
      list[idx] = message;
      persistMessage(storageKey, list);
      return message.reactions;
    }

    function getReactionsFor(msgId) {
      const hit = findMessageAndStore(msgId);
      return hit && hit.message.reactions ? hit.message.reactions : {};
    }

    function renderReactionsRow(messageEl, reactions) {
      let row = messageEl.querySelector(":scope > .reactions-row");
      const entries = Object.entries(reactions || {}).filter(([, users]) => Array.isArray(users) && users.length > 0);
      if (entries.length === 0) { if (row) row.remove(); return; }
      if (!row) {
        row = document.createElement("div");
        row.className = "reactions-row";
        messageEl.appendChild(row);
      }
      const userId = getCurrentUserId();
      row.innerHTML = "";
      entries.forEach(([emoji, users]) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "reaction-pill" + (users.includes(userId) ? " own" : "");
        pill.setAttribute("data-emoji", emoji);
        pill.title = users.length === 1 ? "1 reação" : `${users.length} reações`;
        pill.innerHTML = `<span class="reaction-emoji">${emoji}</span><span class="reaction-count">${users.length}</span>`;
        row.appendChild(pill);
      });
    }

    function ensureActionButton(messageEl) {
      if (messageEl.querySelector(":scope > .message-actions-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "message-actions-btn";
      btn.setAttribute("aria-label", "Reagir à mensagem");
      btn.innerHTML = "<i class='bx bx-dots-horizontal-rounded'></i>";
      messageEl.appendChild(btn);
    }

    function enrichMessage(messageEl) {
      if (!messageEl || messageEl.dataset.reactionsEnriched === "1") return;
      const msgId = messageEl.getAttribute("data-message-id");
      if (!msgId) return;
      messageEl.dataset.reactionsEnriched = "1";
      ensureActionButton(messageEl);
      const reactions = getReactionsFor(msgId);
      renderReactionsRow(messageEl, reactions);
    }

    function scanContainer(root) {
      if (!root) return;
      root.querySelectorAll(".message[data-message-id]").forEach(enrichMessage);
    }

    // Popover
    let popoverEl = null;
    let popoverForMsgId = null;

    function closePopover() {
      if (popoverEl) { popoverEl.remove(); popoverEl = null; }
      popoverForMsgId = null;
    }

    function openPopover(anchorBtn, msgId) {
      closePopover();
      popoverForMsgId = msgId;
      popoverEl = document.createElement("div");
      popoverEl.className = "reaction-popover";
      popoverEl.setAttribute("role", "menu");
      REACTION_EMOJIS.forEach(emoji => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "reaction-popover-btn";
        b.setAttribute("data-emoji", emoji);
        b.textContent = emoji;
        popoverEl.appendChild(b);
      });
      document.body.appendChild(popoverEl);
      const rect = anchorBtn.getBoundingClientRect();
      const top = rect.top + window.scrollY - popoverEl.offsetHeight - 8;
      const left = Math.max(8, rect.left + window.scrollX - (popoverEl.offsetWidth / 2) + (rect.width / 2));
      popoverEl.style.top = `${top < 8 ? rect.bottom + window.scrollY + 8 : top}px`;
      popoverEl.style.left = `${left}px`;
      requestAnimationFrame(() => popoverEl.classList.add("open"));
    }

    function handleDelegatedClick(e) {
      const pill = e.target.closest(".reaction-pill");
      if (pill) {
        const messageEl = pill.closest(".message[data-message-id]");
        if (!messageEl) return;
        const emoji = pill.getAttribute("data-emoji");
        const newReactions = toggleReaction(messageEl.getAttribute("data-message-id"), emoji);
        renderReactionsRow(messageEl, newReactions || {});
        closePopover();
        return;
      }
      const popBtn = e.target.closest(".reaction-popover-btn");
      if (popBtn && popoverForMsgId) {
        const emoji = popBtn.getAttribute("data-emoji");
        const messageEl = document.querySelector(`.message[data-message-id="${CSS.escape(popoverForMsgId)}"]`);
        const newReactions = toggleReaction(popoverForMsgId, emoji);
        if (messageEl) renderReactionsRow(messageEl, newReactions || {});
        closePopover();
        return;
      }
      const actionBtn = e.target.closest(".message-actions-btn");
      if (actionBtn) {
        const messageEl = actionBtn.closest(".message[data-message-id]");
        if (!messageEl) return;
        const msgId = messageEl.getAttribute("data-message-id");
        if (popoverForMsgId === msgId) closePopover();
        else openPopover(actionBtn, msgId);
        return;
      }
      if (popoverEl && !e.target.closest(".reaction-popover")) closePopover();
    }

    // Long-press mobile
    let pressTimer = null;
    let pressTargetMsgId = null;
    function handlePointerDown(e) {
      const msgEl = e.target.closest(".message[data-message-id]");
      if (!msgEl) return;
      if (e.pointerType !== "touch") return;
      pressTargetMsgId = msgEl.getAttribute("data-message-id");
      const anchor = msgEl.querySelector(".message-actions-btn") || msgEl;
      pressTimer = setTimeout(() => {
        openPopover(anchor, pressTargetMsgId);
        pressTargetMsgId = null;
      }, 400);
    }
    function cancelPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      pressTargetMsgId = null;
    }

    function handleStorageSync(e) {
      if (!STORAGE_KEYS.includes(e.key)) return;
      document.querySelectorAll(".message[data-message-id]").forEach(el => {
        renderReactionsRow(el, getReactionsFor(el.getAttribute("data-message-id")));
      });
    }

    function start() {
      const roots = [
        document.querySelector(".messages"),
        document.querySelector(".chat-messages"),
        document.querySelector(".internal-messages"),
        document.querySelector("#internalChatMessages")
      ].filter(Boolean);

      roots.forEach(scanContainer);

      const observer = new MutationObserver(muts => {
        muts.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(".message[data-message-id]")) enrichMessage(node);
            else if (node.querySelectorAll) node.querySelectorAll(".message[data-message-id]").forEach(enrichMessage);
          });
        });
      });
      roots.forEach(root => observer.observe(root, { childList: true, subtree: true }));

      document.addEventListener("click", handleDelegatedClick);
      document.addEventListener("pointerdown", handlePointerDown);
      ["pointerup", "pointercancel", "pointerleave", "scroll"].forEach(ev =>
        document.addEventListener(ev, cancelPress, true));
      window.addEventListener("storage", handleStorageSync);
      window.addEventListener("resize", closePopover);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  })();
  // ==================== FIM REACTIONS ====================

  // ==================== STATUS DE ENTREGA/LEITURA \u2713\u2713 (Fase 2.4) ====================
  (function initDeliveryStatusFeature() {
    if (window.__deliveryStatusInitialized) return;
    window.__deliveryStatusInitialized = true;

    const STORAGE_KEY = "supportMessages";
    const SYNC_KEY = "deliveryStatusUpdate";

    function readAll() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
      catch (e) { return []; }
    }
    function writeAll(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        localStorage.setItem(SYNC_KEY, String(Date.now()));
      } catch (e) { /* ignore quota */ }
    }

    function getActiveChatId() {
      const el = document.querySelector(".contact.support-contact.active[data-support-chat-id]");
      return el ? el.getAttribute("data-support-chat-id") : null;
    }

    // Como operador: mensagens RECEBIDAS s\u00e3o do tipo "client". Marcamos delivered quando
    // este lado est\u00e1 ativo (qualquer chat) e read quando o chat ativo \u00e9 o da mensagem.
    function stampIncoming() {
      const chatId = getActiveChatId();
      const isVisible = document.visibilityState === "visible";
      const list = readAll();
      let changed = false;
      for (const m of list) {
        if (!m || m.type !== "client") continue;
        if (!m.delivered) { m.delivered = true; m.deliveredAt = Date.now(); changed = true; }
        if (isVisible && chatId && m.chatId === chatId && !m.read) {
          m.read = true; m.readAt = Date.now(); changed = true;
        }
      }
      if (changed) writeAll(list);
    }

    function findMeta(msgId) {
      const list = readAll();
      return list.find(m => m && m.id === msgId) || null;
    }

    function renderTick(messageEl) {
      if (!messageEl.classList.contains("sent")) return;
      const msgId = messageEl.getAttribute("data-message-id");
      if (!msgId) return;
      const meta = findMeta(msgId);
      let tick = messageEl.querySelector(":scope > .delivery-ticks");
      if (!tick) {
        tick = document.createElement("span");
        tick.className = "delivery-ticks";
        messageEl.appendChild(tick);
      }
      let state = "sent";
      if (meta) {
        if (meta.read) state = "read";
        else if (meta.delivered) state = "delivered";
      }
      tick.classList.remove("sent", "delivered", "read");
      tick.classList.add(state);
      tick.innerHTML = state === "sent"
        ? "<i class='bx bx-check'></i>"
        : "<i class='bx bx-check-double'></i>";
      tick.setAttribute("title", state === "read" ? "Lida" : state === "delivered" ? "Entregue" : "Enviada");
    }

    function renderAll(root) {
      (root || document).querySelectorAll(".message.sent[data-message-id]").forEach(renderTick);
    }

    function start() {
      stampIncoming();
      renderAll();

      const observer = new MutationObserver(muts => {
        muts.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(".message.sent[data-message-id]")) renderTick(node);
            else if (node.querySelectorAll) node.querySelectorAll(".message.sent[data-message-id]").forEach(renderTick);
          });
        });
      });
      const roots = [document.querySelector(".messages"), document.querySelector(".chat-messages")].filter(Boolean);
      roots.forEach(root => observer.observe(root, { childList: true, subtree: true }));

      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY || e.key === SYNC_KEY || e.key === "newSupportMessage") {
          renderAll();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") { stampIncoming(); renderAll(); }
      });

      document.addEventListener("click", (e) => {
        if (e.target.closest(".contact.support-contact")) {
          setTimeout(() => { stampIncoming(); renderAll(); }, 120);
        }
      });

      window._opTicksInterval = window._opTicksInterval || setInterval(() => { stampIncoming(); renderAll(); }, 4000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  })();
  // ==================== FIM STATUS \u2713\u2713 ====================

  // ==================== INDICADOR DE DIGITA\u00c7\u00c3O (Fase 2.5) ====================
  (function initTypingIndicatorFeature() {
    if (window.__typingIndicatorInit) return;
    window.__typingIndicatorInit = true;

    const KEY = "typingIndicators";
    const THROTTLE_MS = 1000;
    const STALE_MS = 3000;

    function getMe() {
      try {
        const u = getStorageItem("currentUser", {});
        return {
          id: u.id || u.username || u.fullName || "anon",
          name: u.fullName || u.username || "Operador",
          role: "operator"
        };
      } catch (e) { return { id: "anon", name: "Operador", role: "operator" }; }
    }
    function readMap() {
      try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
      catch (e) { return {}; }
    }
    function writeMap(map) {
      try { localStorage.setItem(KEY, JSON.stringify(map)); }
      catch (e) { /* ignore */ }
    }
    function getActiveChatId() {
      const el = document.querySelector(".contact.support-contact.active[data-support-chat-id]");
      return el ? el.getAttribute("data-support-chat-id") : null;
    }

    let lastWrite = 0;
    function recordTyping(chatId) {
      if (!chatId) return;
      const now = Date.now();
      if (now - lastWrite < THROTTLE_MS) return;
      lastWrite = now;
      const map = readMap();
      const me = getMe();
      map[chatId] = { userId: me.id, name: me.name, role: me.role, ts: now };
      writeMap(map);
    }

    function ensureIndicator(container) {
      let el = container.querySelector(":scope > .typing-indicator");
      if (!el) {
        el = document.createElement("div");
        el.className = "typing-indicator";
        el.hidden = true;
        el.innerHTML = '<span class="typing-name"></span><span class="typing-dots"><i></i><i></i><i></i></span>';
        // inserir imediatamente antes de .message-input do mesmo chat-main
        const input = container.parentElement ? container.parentElement.querySelector(".message-input") : null;
        if (input && input.parentElement) input.parentElement.insertBefore(el, input);
        else container.parentElement.appendChild(el);
      }
      return el;
    }

    function render() {
      // dois containers poss\u00edveis: .messages (suporte) e #internalMessages (interno)
      const messagesRoot = document.querySelector(".chat-container.active .messages") || document.querySelector(".messages");
      if (messagesRoot) {
        const chatId = getActiveChatId();
        const entry = chatId ? readMap()[chatId] : null;
        const me = getMe();
        const isActive = entry && entry.userId !== me.id && (Date.now() - (entry.ts || 0) < STALE_MS);
        const el = ensureIndicator(messagesRoot);
        if (isActive) {
          el.querySelector(".typing-name").textContent = `${entry.name} est\u00e1 digitando`;
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      }
    }

    function start() {
      // Operador escreve no input de suporte
      const supportInput = document.querySelector(".chat-container .message-input input[type='text']");
      if (supportInput) {
        supportInput.addEventListener("input", () => recordTyping(getActiveChatId()));
      }
      render();
      window.addEventListener("storage", (e) => { if (e.key === KEY) render(); });
      window._opTypingRenderInterval = window._opTypingRenderInterval || setInterval(render, 1500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  })();
  // ==================== FIM TYPING ====================

  // ==================== TEMPLATES DE RESPOSTA R\u00c1PIDA (Fase 2.6) ====================
  (function initQuickRepliesFeature() {
    if (window.__quickRepliesInit) return;
    window.__quickRepliesInit = true;

    const KEY = "quickReplies";
    const DEFAULTS = [
      { shortcut: "/oi",      text: "Ol\u00e1, como posso ajudar?" },
      { shortcut: "/tchau",   text: "Obrigado pelo contato! Qualquer d\u00favida estamos \u00e0 disposi\u00e7\u00e3o." },
      { shortcut: "/aguarde", text: "Um instante, por favor \u2014 j\u00e1 verifico isso para voc\u00ea." },
      { shortcut: "/docs",    text: "Para prosseguir, voc\u00ea pode me enviar os documentos necess\u00e1rios?" }
    ];

    function read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) { localStorage.setItem(KEY, JSON.stringify(DEFAULTS)); return DEFAULTS.slice(); }
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : DEFAULTS.slice();
      } catch (e) { return DEFAULTS.slice(); }
    }
    function save(list) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }
    window.quickRepliesApi = {
      getAll: read,
      setAll: save,
      add: (shortcut, text) => {
        const list = read();
        const norm = shortcut.startsWith("/") ? shortcut : "/" + shortcut;
        const idx = list.findIndex(q => q.shortcut === norm);
        if (idx !== -1) list[idx].text = text;
        else list.push({ shortcut: norm, text });
        save(list);
        return list;
      },
      remove: (shortcut) => {
        const list = read().filter(q => q.shortcut !== shortcut);
        save(list);
        return list;
      }
    };

    // ----- Dropdown de sugest\u00f5es acima do input -----
    function findMessageInput() {
      return document.querySelector(".chat-container .message-input input[type='text']");
    }

    let dropdownEl = null;
    let selectedIdx = -1;
    let currentMatches = [];

    function ensureDropdown(anchor) {
      if (dropdownEl) return dropdownEl;
      dropdownEl = document.createElement("div");
      dropdownEl.className = "quick-reply-suggestions";
      document.body.appendChild(dropdownEl);
      return dropdownEl;
    }

    function positionDropdown(anchor) {
      if (!dropdownEl) return;
      const rect = anchor.getBoundingClientRect();
      const top = rect.top + window.scrollY - dropdownEl.offsetHeight - 6;
      dropdownEl.style.top = `${Math.max(8, top)}px`;
      dropdownEl.style.left = `${rect.left + window.scrollX}px`;
      dropdownEl.style.width = `${Math.max(260, rect.width * 0.6)}px`;
    }

    function closeDropdown() {
      if (dropdownEl) { dropdownEl.remove(); dropdownEl = null; }
      selectedIdx = -1;
      currentMatches = [];
    }

    function renderMatches(anchor, matches) {
      ensureDropdown(anchor);
      dropdownEl.innerHTML = "";
      if (matches.length === 0) { closeDropdown(); return; }
      matches.forEach((m, i) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "quick-reply-item" + (i === selectedIdx ? " active" : "");
        item.setAttribute("data-idx", String(i));
        item.innerHTML = `
          <span class="quick-reply-shortcut">${m.shortcut}</span>
          <span class="quick-reply-text">${m.text.replace(/</g, "&lt;")}</span>
        `;
        dropdownEl.appendChild(item);
      });
      positionDropdown(anchor);
    }

    function applyMatch(input, match) {
      if (!input || !match) return;
      input.value = match.text;
      input.focus();
      input.setSelectionRange(match.text.length, match.text.length);
      closeDropdown();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function updateSuggestions(input) {
      const val = input.value;
      if (!val.startsWith("/")) { closeDropdown(); return; }
      const term = val.slice(1).toLowerCase();
      const list = read();
      const matches = list.filter(q => q.shortcut.slice(1).toLowerCase().startsWith(term));
      currentMatches = matches;
      if (selectedIdx >= matches.length) selectedIdx = matches.length - 1;
      if (selectedIdx < 0 && matches.length > 0) selectedIdx = 0;
      renderMatches(input, matches);
    }

    function bindInput() {
      const input = findMessageInput();
      if (!input || input.dataset.quickRepliesBound === "1") return;
      input.dataset.quickRepliesBound = "1";

      input.addEventListener("input", () => updateSuggestions(input));
      input.addEventListener("focus", () => updateSuggestions(input));
      input.addEventListener("blur", () => setTimeout(closeDropdown, 150));
      input.addEventListener("keydown", (e) => {
        if (!dropdownEl || currentMatches.length === 0) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          selectedIdx = (selectedIdx + 1) % currentMatches.length;
          renderMatches(input, currentMatches);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          selectedIdx = (selectedIdx - 1 + currentMatches.length) % currentMatches.length;
          renderMatches(input, currentMatches);
        } else if (e.key === "Tab" || e.key === "Enter") {
          if (selectedIdx >= 0) {
            e.preventDefault();
            applyMatch(input, currentMatches[selectedIdx]);
          }
        } else if (e.key === "Escape") {
          closeDropdown();
        }
      });

      document.addEventListener("click", (e) => {
        const item = e.target.closest(".quick-reply-item");
        if (item) {
          const idx = parseInt(item.getAttribute("data-idx"), 10);
          applyMatch(input, currentMatches[idx]);
        } else if (dropdownEl && !e.target.closest(".quick-reply-suggestions") && e.target !== input) {
          closeDropdown();
        }
      });

      window.addEventListener("resize", () => dropdownEl && positionDropdown(input));
      window.addEventListener("scroll", () => dropdownEl && positionDropdown(input), true);
    }

    function start() {
      read(); // garante defaults no primeiro uso
      bindInput();
      // rebind se a UI criar o input depois (ex.: tab swap)
      const observer = new MutationObserver(() => bindInput());
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  })();
  // ==================== FIM QUICK REPLIES ====================

