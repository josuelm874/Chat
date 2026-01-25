// Suporte Script - Lado do Cliente

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const messageDate = new Date(date);
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
}

// Função para criar indicador de data
function createDateDivider(dateText) {
  const divider = document.createElement('div');
  divider.classList.add('date-divider');
  divider.innerHTML = `<div class="date-divider-box">${dateText}</div>`;
  return divider;
}

// ==================== SISTEMA DE EMOJIS ANIMADOS LOTTIE ====================

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
  // Regex avançada que captura emojis simples e complexos
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const matches = text.match(emojiRegex) || [];
  
  console.log(`🔎 Extraindo emojis de: "${text}"`);
  console.log(`   Encontrados: ${matches.length} emoji(s):`, matches);
  
  return matches;
}

// Função para converter emoji em codepoint hexadecimal
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
    
    // Avançar 2 posições se for surrogate pair
    i += code > 0xFFFF ? 2 : 1;
  }
  
  const result = codepoints.join('_');
  console.log(`🔍 Emoji "${emoji}" → Codepoint: ${result}`);
  return result;
}

// Função para obter URL da animação Lottie
function getNotoEmojiLottieUrl(emoji) {
  const codepoint = getEmojiCodepoint(emoji);
  const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/lottie.json`;
  console.log(`📡 URL Lottie: ${url}`);
  return url;
}

// Cache de animações Lottie
const lottieCache = {};
const noLottieEmojis = new Set();

// Estatísticas de carregamento
const emojiStats = {
  total: 0,
  lottieSuccess: 0,
  fallback: 0
};

// Função para carregar Lottie com fallback
async function loadLottieWithFallback(emoji, lottieDiv, container) {
  const lottieUrl = getNotoEmojiLottieUrl(emoji);
  emojiStats.total++;
  
  // Se já sabemos que não tem Lottie, usar fallback
  if (noLottieEmojis.has(emoji)) {
    console.log(`💨 Emoji ${emoji} sem Lottie, usando fallback`);
    emojiStats.fallback++;
    useFallbackEmoji(emoji, lottieDiv);
    return;
  }
  
  // Se está em cache, usar cache
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
    console.log(`⏳ Carregando ${emoji} de ${lottieUrl}`);
    const response = await fetch(lottieUrl);
    console.log(`📥 Resposta para ${emoji}: Status ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const animationData = await response.json();
    
    if (!animationData || !animationData.layers) {
      throw new Error('JSON inválido');
    }
    
    lottieCache[lottieUrl] = animationData;
    lottieDiv.classList.remove('loading');
    
    console.log(`✅ Lottie carregado para ${emoji}!`);
    
    const animation = lottie.loadAnimation({
      container: lottieDiv,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData
    });
    
    setupAnimationEvents(animation, container);
    
    setTimeout(() => container.classList.add('loaded'), 100);
    
    emojiStats.lottieSuccess++;
    console.log(`🎬 Emoji ${emoji} animado! ✨`);
    
  } catch (error) {
    noLottieEmojis.add(emoji);
    emojiStats.fallback++;
    console.warn(`⚠️ Lottie indisponível para ${emoji}, usando fallback`);
    useFallbackEmoji(emoji, lottieDiv);
  }
}

// Configurar eventos da animação
function setupAnimationEvents(animation, container) {
  container.addEventListener('mouseenter', () => {
    animation.goToAndPlay(0);
  });
  container.addEventListener('click', () => {
    animation.goToAndPlay(0);
  });
}

// Usar emoji fallback
function useFallbackEmoji(emoji, lottieDiv) {
  lottieDiv.classList.remove('loading');
  lottieDiv.innerHTML = '';
  const fallbackSpan = document.createElement('span');
  fallbackSpan.classList.add('emoji-fallback');
  fallbackSpan.textContent = emoji;
  lottieDiv.appendChild(fallbackSpan);
}

// Criar elemento de emoji grande com Lottie
function createLargeEmoji(emoji, index = 0) {
  const container = document.createElement('div');
  container.classList.add('emoji-large-container');
  container.style.animationDelay = `${index * 0.1}s`;
  container.setAttribute('data-emoji', emoji);
  
  const uniqueId = `lottie-${generateUniqueId()}`;
  container.id = uniqueId;
  
  const lottieDiv = document.createElement('div');
  lottieDiv.classList.add('lottie-emoji', 'loading');
  container.appendChild(lottieDiv);
  
  setTimeout(() => {
    if (typeof lottie !== 'undefined') {
      loadLottieWithFallback(emoji, lottieDiv, container);
    } else {
      console.warn('⚠️ Lottie não carregada');
      useFallbackEmoji(emoji, lottieDiv);
    }
  }, index * 100);
  
  return container;
}

// ==================== FIM SISTEMA DE EMOJIS ANIMADOS ====================

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

const inputValidator = {
  validate: (type, value) => (!value || !value.trim()) ? { valid: false, message: 'Campo obrigatório' } : { valid: true },
  sanitize: (text) => text,
  validateFile: (file) => file ? { valid: true, errors: [] } : { valid: false, errors: ['Sem arquivo'] }
};

// Firebase removido - usar apenas localStorage

// Função stub para compatibilidade
function isFirebaseAvailable() {
  return false; // Firebase removido
}

// ==================== FUNÇÕES DE ARQUIVOS ====================

// Criar elemento HTML para arquivo
function createFileElement(file, fileData) {
  const container = document.createElement('div');
  container.classList.add('message-file');
  
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
  else if (isVideoFile(file.name)) {
    const preview = document.createElement('div');
    preview.classList.add('message-file-preview');
    const video = document.createElement('video');
    video.src = fileData;
    video.controls = true;
    preview.appendChild(video);
    container.appendChild(preview);
  }
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

function normalizeUsername(username) {
  return (username || "").trim().toLowerCase();
}

function safeJsonParse(jsonString, fallback) {
  try {
    if (!jsonString || jsonString === "null" || jsonString === "undefined") {
      return fallback;
    }
    const parsed = JSON.parse(jsonString);
    return parsed !== null ? parsed : fallback;
  } catch (error) {
    console.warn("Não foi possível fazer parse do JSON. Usando valor padrão.", error);
    return fallback;
  }
}

function generateUltraSecureHash(input) {
  if (!input && input !== 0) {
    return '';
  }

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

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function getUsersData() {
  return safeJsonParse(localStorage.getItem("users"), []);
}

function setUsersData(users) {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("usersUpdatedAt", Date.now().toString());
  return users;
}

function getContributorsData() {
  const contributors = safeJsonParse(localStorage.getItem("contributors"), []);
  let changed = false;

  const normalizedContributors = contributors.map(contributor => {
    const status = contributor.status || "active";
    let chatId = contributor.chatId;

    if (!chatId) {
      chatId = `chat_contributor_${contributor.id || generateUniqueId()}`;
      changed = true;
    }

    return {
      ...contributor,
      status,
      chatId
    };
  });

  if (changed) {
    localStorage.setItem("contributors", JSON.stringify(normalizedContributors));
    localStorage.setItem("contributorsUpdatedAt", Date.now().toString());
  }

  return normalizedContributors;
}

function setContributorsData(contributors) {
  localStorage.setItem("contributors", JSON.stringify(contributors));
  localStorage.setItem("contributorsUpdatedAt", Date.now().toString());
  return contributors;
}

function getContributorContactsData() {
  return safeJsonParse(localStorage.getItem("contributorContacts"), []);
}

function setContributorContactsData(contacts) {
  localStorage.setItem("contributorContacts", JSON.stringify(contacts));
  localStorage.setItem("contributorContactsUpdatedAt", Date.now().toString());
  return contacts;
}

function getContributorEmployeesData() {
  return safeJsonParse(localStorage.getItem("contributorEmployees"), []);
}

function setContributorEmployeesData(employees) {
  localStorage.setItem("contributorEmployees", JSON.stringify(employees));
  localStorage.setItem("contributorEmployeesUpdatedAt", Date.now().toString());
  return employees;
}

function logoutSupportUser() {
  localStorage.removeItem("supportCurrentUser");
  localStorage.removeItem("clientName");
  window.location.reload();
}

function openSupportAddEmployeeModal() {
  console.log('[openSupportAddEmployeeModal] Abrindo modal de funcionário');
  
  if (!supportAddEmployeeModal) {
    console.warn('[openSupportAddEmployeeModal] Modal não encontrado');
    return;
  }
  
  // Adicionar classe active
  supportAddEmployeeModal.classList.add("active");
  
  // Forçar display e z-index para garantir visibilidade
  supportAddEmployeeModal.style.display = "flex";
  supportAddEmployeeModal.style.zIndex = "99999";
  supportAddEmployeeModal.style.position = "fixed";
  supportAddEmployeeModal.style.top = "0";
  supportAddEmployeeModal.style.left = "0";
  supportAddEmployeeModal.style.width = "100%";
  supportAddEmployeeModal.style.height = "100%";
  
  // IMPORTANTE: Garantir que o modal esteja no body, não dentro do supportApp
  const parentElement = supportAddEmployeeModal.parentElement;
  if (parentElement && (parentElement.id === "supportApp" || parentElement.classList.contains("support-app"))) {
    document.body.appendChild(supportAddEmployeeModal);
    console.log('[openSupportAddEmployeeModal] Modal movido do supportApp para o body');
  }
  
  supportAddEmployeeForm?.reset();
  supportEmployeeFullNameInput?.focus();
  
  // Verificar se o modal está realmente visível
  const computedStyle = window.getComputedStyle(supportAddEmployeeModal);
  console.log('[openSupportAddEmployeeModal] Modal aberto:', {
    hasActiveClass: supportAddEmployeeModal.classList.contains("active"),
    computedDisplay: computedStyle.display,
    computedZIndex: computedStyle.zIndex,
    parentElement: supportAddEmployeeModal.parentElement?.id || supportAddEmployeeModal.parentElement?.tagName
  });
}

function closeSupportAddEmployeeModal() {
  console.log('[closeSupportAddEmployeeModal] Fechando modal de funcionário');
  
  if (!supportAddEmployeeModal) {
    console.warn('[closeSupportAddEmployeeModal] Modal não encontrado');
    return;
  }
  
  // Remover classe active
  supportAddEmployeeModal.classList.remove("active");
  
  // Remover estilos inline
  supportAddEmployeeModal.style.display = "";
  supportAddEmployeeModal.style.zIndex = "";
  supportAddEmployeeModal.style.position = "";
  supportAddEmployeeModal.style.top = "";
  supportAddEmployeeModal.style.left = "";
  supportAddEmployeeModal.style.width = "";
  supportAddEmployeeModal.style.height = "";
  
  // Forçar display: none se ainda estiver visível
  const computedStyle = window.getComputedStyle(supportAddEmployeeModal);
  if (computedStyle.display !== "none") {
    supportAddEmployeeModal.style.display = "none";
  }
  
  supportAddEmployeeForm?.reset();
  
  console.log('[closeSupportAddEmployeeModal] Modal fechado');
}

let supportContributorOnboardingModal = null;
let supportContributorOnboardingForm = null;
let supportContributorInfoList = null;
let supportContributorNewPasswordInput = null;
let supportContributorConfirmPasswordInput = null;
let supportContributorConfirmDataCheckbox = null;
let supportContributorWelcomeNameEl = null;
let supportAddEmployeeModal = null;
let supportAddEmployeeForm = null;
let supportEmployeeFullNameInput = null;
let supportEmployeeUsernameInput = null;
let supportEmployeePasswordInput = null;
let supportEmployeeConfirmPasswordInput = null;
let supportAddEmployeeCloseBtn = null;
let supportPendingContributorContext = null;
let supportNeedsOnboarding = false;
let currentContributor = null;

function setSupportMessageInputEnabled(enabled) {
  const messageInputEl = document.getElementById("messageInput");
  const sendButtonEl = document.getElementById("sendButton");
  const attachButtonEl = document.getElementById("attachButton");

  if (messageInputEl) {
    messageInputEl.disabled = !enabled;
    if (!enabled) {
      messageInputEl.value = "";
      messageInputEl.placeholder = "Disponível após confirmar seu cadastro";
    } else {
      messageInputEl.placeholder = "Digite sua mensagem...";
    }
  }

  if (sendButtonEl) {
    sendButtonEl.disabled = !enabled;
  }

  if (attachButtonEl) {
    attachButtonEl.disabled = !enabled;
  }
}

function showSupportContributorOnboarding(user) {
  console.log('[showSupportContributorOnboarding] Chamada com user:', user);
  
  if (!user || !user.contributorId) {
    console.warn('[showSupportContributorOnboarding] User ou contributorId não encontrado');
    return;
  }
  
  if (!supportContributorOnboardingModal || !supportContributorOnboardingForm) {
    console.warn('[showSupportContributorOnboarding] Elementos do modal não encontrados:', {
      modal: !!supportContributorOnboardingModal,
      form: !!supportContributorOnboardingForm
    });
    return;
  }

  const contributors = getContributorsData();
  const contributor = contributors.find(c => c.id === user.contributorId);

  if (!contributor) {
    console.error('[showSupportContributorOnboarding] Contribuinte não encontrado:', user.contributorId);
    showToast("Não foi possível localizar os dados do contribuinte.", "error");
    setSupportMessageInputEnabled(true);
    return;
  }
  
  console.log('[showSupportContributorOnboarding] Contribuinte encontrado:', {
    id: contributor.id,
    razaoSocial: contributor.razaoSocial,
    mustResetPassword: contributor.mustResetPassword,
    status: contributor.status
  });

  supportNeedsOnboarding = true;
  supportPendingContributorContext = { user, contributor };
  supportContributorOnboardingForm.dataset.contributorId = contributor.id;
  supportContributorOnboardingForm.dataset.username = user.username;

  if (supportContributorWelcomeNameEl) {
    supportContributorWelcomeNameEl.textContent = user.fullName || user.username || "Contribuinte";
  }

  if (supportContributorInfoList) {
    // Montar endereço completo
    const enderecoParts = [];
    if (contributor.logradouro) enderecoParts.push(contributor.logradouro);
    if (contributor.numero) enderecoParts.push(`Nº ${contributor.numero}`);
    const enderecoCompleto = enderecoParts.length > 0 ? enderecoParts.join(", ") : null;
    
    const infoItems = [
      { label: "Razão Social", value: contributor.razaoSocial },
      { label: "CNPJ", value: contributor.cnpj },
      { label: "Inscrição Estadual", value: contributor.inscricaoEstadual || "Não informado" },
      { label: "CEP", value: contributor.cep },
      { label: "Logradouro", value: enderecoCompleto || contributor.logradouro },
      { label: "Bairro", value: contributor.bairro },
      { label: "Município", value: contributor.municipio },
      { label: "UF", value: contributor.uf },
      { label: "Regime Tributário", value: contributor.regime },
      { label: "Atividade Principal", value: contributor.atividade },
      { label: "Username", value: contributor.username || user.username },
      { label: "Status", value: contributor.status === "pending" ? "Pendente" : "Ativo" }
    ];

    supportContributorInfoList.innerHTML = infoItems
      .filter(item => !!item.value)
      .map(item => `
        <li>
          <strong>${item.label}</strong>
          <span>${item.value}</span>
        </li>
      `).join("");
  }

  if (supportContributorNewPasswordInput) {
    supportContributorNewPasswordInput.value = "";
  }

  if (supportContributorConfirmPasswordInput) {
    supportContributorConfirmPasswordInput.value = "";
  }

  if (supportContributorConfirmDataCheckbox) {
    supportContributorConfirmDataCheckbox.checked = false;
  }

  // Remover classe hidden e garantir que o modal esteja visível
  supportContributorOnboardingModal.classList.remove("hidden");
  
  // Forçar display e z-index para garantir visibilidade
  // IMPORTANTE: Usar z-index muito alto para garantir que fique acima de tudo
  supportContributorOnboardingModal.style.display = "flex";
  supportContributorOnboardingModal.style.zIndex = "99999";
  supportContributorOnboardingModal.style.position = "fixed";
  supportContributorOnboardingModal.style.top = "0";
  supportContributorOnboardingModal.style.left = "0";
  supportContributorOnboardingModal.style.width = "100%";
  supportContributorOnboardingModal.style.height = "100%";
  
  // IMPORTANTE: Garantir que o modal esteja no body, não dentro do supportApp
  // Se o modal estiver dentro do supportApp (que pode estar escondido), movê-lo para o body
  const parentElement = supportContributorOnboardingModal.parentElement;
  if (parentElement && (parentElement.id === "supportApp" || parentElement.classList.contains("support-app"))) {
    document.body.appendChild(supportContributorOnboardingModal);
    console.log('[showSupportContributorOnboarding] Modal movido do supportApp para o body');
  }
  
  setSupportMessageInputEnabled(false);
  
  // Verificar se o modal está realmente visível
  const computedStyle = window.getComputedStyle(supportContributorOnboardingModal);
  const rect = supportContributorOnboardingModal.getBoundingClientRect();
  
  console.log('[showSupportContributorOnboarding] Modal exibido com sucesso', {
    hasHiddenClass: supportContributorOnboardingModal.classList.contains("hidden"),
    display: supportContributorOnboardingModal.style.display,
    computedDisplay: computedStyle.display,
    zIndex: supportContributorOnboardingModal.style.zIndex,
    computedZIndex: computedStyle.zIndex,
    position: computedStyle.position,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    parentElement: supportContributorOnboardingModal.parentElement?.id || supportContributorOnboardingModal.parentElement?.tagName,
    isVisible: computedStyle.display !== "none" && rect.width > 0 && rect.height > 0
  });

  setTimeout(() => {
    if (supportContributorNewPasswordInput) {
      supportContributorNewPasswordInput.focus();
    }
  }, 150);
}

function hideSupportContributorOnboarding() {
  console.log('[hideSupportContributorOnboarding] Iniciando esconder modal');
  
  if (supportContributorOnboardingModal) {
    // Adicionar classe hidden
    supportContributorOnboardingModal.classList.add("hidden");
    
    // Remover TODOS os estilos inline que foram adicionados para garantir visibilidade
    supportContributorOnboardingModal.style.display = "";
    supportContributorOnboardingModal.style.zIndex = "";
    supportContributorOnboardingModal.style.position = "";
    supportContributorOnboardingModal.style.top = "";
    supportContributorOnboardingModal.style.left = "";
    supportContributorOnboardingModal.style.width = "";
    supportContributorOnboardingModal.style.height = "";
    
    // Verificar se o modal foi realmente escondido
    const computedStyle = window.getComputedStyle(supportContributorOnboardingModal);
    const hasHiddenClass = supportContributorOnboardingModal.classList.contains("hidden");
    const computedDisplay = computedStyle.display;
    
    console.log('[hideSupportContributorOnboarding] Modal escondido:', {
      hasHiddenClass: hasHiddenClass,
      computedDisplay: computedDisplay,
      isVisible: computedDisplay !== "none"
    });
    
    // Se ainda estiver visível, forçar display: none
    if (computedDisplay !== "none") {
      supportContributorOnboardingModal.style.display = "none";
      console.log('[hideSupportContributorOnboarding] Forçado display: none');
    }
  } else {
    console.warn('[hideSupportContributorOnboarding] Modal não encontrado');
  }
  
  supportNeedsOnboarding = false;
  supportPendingContributorContext = null;
  setSupportMessageInputEnabled(true);
  
  console.log('[hideSupportContributorOnboarding] Concluído');
}

// Função para remover gradientes de fundo (aplicar fundo do login)
function removeBackgroundGradients() {
  const body = document.body;
  const html = document.documentElement;
  if (!body) return;
  
  // Remove os gradientes e aplica fundo do login
  body.style.removeProperty('background-image');
  body.style.removeProperty('background-size');
  body.style.removeProperty('background-position');
  body.style.removeProperty('background-repeat');
  body.style.removeProperty('background-attachment');
  body.style.setProperty('background-color', '#25252b', 'important');
  
  if (html) {
    html.style.setProperty('background-color', '#25252b', 'important');
  }
}

// Função para aplicar gradientes de fundo via JavaScript
function applyBackgroundGradients() {
  const body = document.body;
  if (!body) return;

  // Define os gradientes de fundo
  const gradients = [
    'repeating-linear-gradient(45deg, transparent 0px, transparent 1px, rgba(75, 85, 99, 0.15) 1px, rgba(75, 85, 99, 0.15) 2px)',
    'repeating-linear-gradient(135deg, transparent 0px, transparent 2px, rgba(55, 65, 81, 0.12) 2px, rgba(55, 65, 81, 0.12) 4px)',
    'linear-gradient(0deg, transparent 0%, rgba(107, 114, 128, 0.35) 40%, rgba(107, 114, 128, 0.5) 46%, rgba(107, 114, 128, 0.55) 50%, rgba(107, 114, 128, 0.5) 54%, rgba(107, 114, 128, 0.35) 60%, transparent 100%)',
    'linear-gradient(90deg, transparent 0%, rgba(75, 85, 99, 0.4) 32%, rgba(75, 85, 99, 0.55) 42%, rgba(75, 85, 99, 0.6) 48%, rgba(75, 85, 99, 0.55) 52%, rgba(75, 85, 99, 0.45) 62%, rgba(75, 85, 99, 0.35) 72%, rgba(75, 85, 99, 0.25) 80%, rgba(75, 85, 99, 0.15) 88%, transparent 96%)',
    'linear-gradient(225deg, rgba(55, 65, 81, 0.75) 0%, rgba(55, 65, 81, 0.65) 18%, rgba(55, 65, 81, 0.55) 35%, rgba(55, 65, 81, 0.45) 52%, rgba(55, 65, 81, 0.35) 68%, rgba(55, 65, 81, 0.2) 82%, transparent 95%)',
    'linear-gradient(135deg, rgba(107, 114, 128, 0.65) 0%, rgba(107, 114, 128, 0.55) 12%, rgba(107, 114, 128, 0.45) 25%, rgba(107, 114, 128, 0.35) 40%, rgba(107, 114, 128, 0.25) 55%, rgba(107, 114, 128, 0.15) 70%, transparent 88%)',
    'linear-gradient(225deg, transparent 0%, rgba(75, 85, 99, 0.55) 25%, rgba(75, 85, 99, 0.6) 40%, rgba(75, 85, 99, 0.55) 50%, rgba(75, 85, 99, 0.45) 60%, rgba(75, 85, 99, 0.3) 70%, transparent 85%)',
    'linear-gradient(135deg, transparent 0%, transparent 25%, rgba(107, 114, 128, 0.45) 45%, rgba(107, 114, 128, 0.4) 55%, rgba(107, 114, 128, 0.3) 65%, rgba(107, 114, 128, 0.15) 75%, transparent 85%)',
    'radial-gradient(ellipse 1200px 1000px at 33.33% 50%, rgba(75, 85, 99, 1) 0%, rgba(75, 85, 99, 0.85) 15%, rgba(75, 85, 99, 0.7) 30%, rgba(75, 85, 99, 0.55) 45%, rgba(75, 85, 99, 0.4) 60%, rgba(75, 85, 99, 0.25) 75%, transparent 90%)',
    'radial-gradient(ellipse 900px 750px at 66.67% 33.33%, rgba(107, 114, 128, 1) 0%, rgba(107, 114, 128, 0.9) 12%, rgba(107, 114, 128, 0.75) 25%, rgba(107, 114, 128, 0.6) 40%, rgba(107, 114, 128, 0.45) 55%, rgba(107, 114, 128, 0.3) 70%, transparent 85%)'
  ];

  // Define os tamanhos de fundo correspondentes
  const sizes = [
    '100px 100px',
    '100px 100px',
    '100% 100%',
    '100% 100%',
    '100% 100%',
    '100% 100%',
    '100% 100%',
    '100% 100%',
    '100% 100%',
    '100% 100%'
  ];

  // Define as posições de fundo correspondentes
  const positions = [
    '0 0',
    '0 0',
    'center center',
    'center right',
    'bottom left',
    'top left',
    'center left',
    'center center',
    'center left',
    'top right'
  ];

  // Define os repeats de fundo correspondentes
  const repeats = [
    'repeat',
    'repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat',
    'no-repeat'
  ];

  // Aplica os gradientes via style inline com !important
  body.style.setProperty('background-image', gradients.join(', '), 'important');
  body.style.setProperty('background-size', sizes.join(', '), 'important');
  body.style.setProperty('background-position', positions.join(', '), 'important');
  body.style.setProperty('background-repeat', repeats.join(', '), 'important');
  body.style.setProperty('background-attachment', 'fixed', 'important');
  body.style.setProperty('background-color', '#374151', 'important');
}

document.addEventListener("DOMContentLoaded", () => {
  // Aplica fundo preto no login inicial
  removeBackgroundGradients();
  
  const loginSection = document.getElementById("dominium-login");
  const supportApp = document.getElementById("supportApp");
  const loginForm = document.getElementById("dominiumLoginForm");
  const loginUsernameInput = document.getElementById("dominiumLoginUsername");
  const loginRazaoSocialInput = document.getElementById("dominiumLoginRazaoSocial");
  const loginPasswordInput = document.getElementById("dominiumLoginPassword");
  const supportLogoutButton = document.getElementById("supportLogoutButton");
  const supportAddEmployeeButton = document.getElementById("supportAddEmployeeButton");
  supportContributorOnboardingModal = document.getElementById("supportContributorOnboarding");
  supportContributorOnboardingForm = document.getElementById("supportContributorOnboardingForm");
  supportContributorInfoList = document.getElementById("supportContributorInfoList");
  supportContributorNewPasswordInput = document.getElementById("supportContributorNewPassword");
  supportContributorConfirmPasswordInput = document.getElementById("supportContributorConfirmPassword");
  supportContributorConfirmDataCheckbox = document.getElementById("supportContributorConfirmData");
  supportContributorWelcomeNameEl = document.getElementById("supportContributorWelcomeName");
  supportAddEmployeeModal = document.getElementById("supportAddEmployeeModal");
  supportAddEmployeeForm = document.getElementById("supportAddEmployeeForm");
  supportEmployeeFullNameInput = document.getElementById("supportEmployeeFullName");
  supportEmployeeUsernameInput = document.getElementById("supportEmployeeUsername");
  supportEmployeePasswordInput = document.getElementById("supportEmployeePassword");
  supportEmployeeConfirmPasswordInput = document.getElementById("supportEmployeeConfirmPassword");
  supportAddEmployeeCloseBtn = document.getElementById("supportAddEmployeeClose");

  // Carregar credenciais salvas se existirem
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const savedRazaoSocial = localStorage.getItem("savedRazaoSocial");
  const savedUsername = localStorage.getItem("savedUsername");
  const savedPassword = localStorage.getItem("savedPassword");
  
  if (savedRazaoSocial && loginRazaoSocialInput) {
    loginRazaoSocialInput.value = savedRazaoSocial;
  }
  
  if (savedUsername && loginUsernameInput) {
    loginUsernameInput.value = savedUsername;
  }
  
  if (savedPassword && loginPasswordInput && rememberMeCheckbox) {
    loginPasswordInput.value = savedPassword;
    rememberMeCheckbox.checked = true;
  }
  
  // Manter compatibilidade com o sistema antigo
  const storedRazaoSocial = localStorage.getItem("supportLastRazaoSocial");
  if (storedRazaoSocial && loginRazaoSocialInput && !savedRazaoSocial) {
    loginRazaoSocialInput.value = storedRazaoSocial;
  }

  let supportUser = null;
  try {
    supportUser = JSON.parse(localStorage.getItem("supportCurrentUser") || "null");
  } catch (error) {
    console.warn("Não foi possível carregar o usuário do suporte salvo:", error);
    supportUser = null;
  }

  if (supportUser && supportUser.contributorId) {
    const contributors = getContributorsData();
    currentContributor = contributors.find(contributor => contributor.id === supportUser.contributorId) || null;
    if (currentContributor) {
      if (supportUser.role === "contributor") {
        // IMPORTANTE: Garantir que mustResetPassword e status sejam sempre verificados do contribuinte atual
        // Se o contribuinte foi criado recentemente, ele deve ter mustResetPassword: true e status: "pending"
        const mustResetPassword = currentContributor.mustResetPassword !== false;
        const contributorStatus = currentContributor.status || "pending";
        
        supportUser = {
          username: "adm",
          fullName: currentContributor.razaoSocial,
          role: "contributor",
          contributorId: currentContributor.id,
          mustResetPassword: mustResetPassword,
          status: contributorStatus
        };
        
        // Salvar o supportUser atualizado com os valores corretos do contribuinte
        localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
        
        const companyName = currentContributor.razaoSocial || supportUser.fullName;
        if (currentContributor.chatId) {
          localStorage.setItem("chatId", currentContributor.chatId);
        }
        if (companyName) {
          localStorage.setItem("clientName", companyName);
          const razaoSocialOriginal = (currentContributor.razaoSocial || companyName || "").trim();
          if (razaoSocialOriginal) {
            localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
          }
        }
      } else if (supportUser.role === "employee") {
        const employees = getContributorEmployeesData();
        let matchedEmployee = null;

        if (supportUser.employeeId) {
          matchedEmployee = employees.find(emp => emp.id === supportUser.employeeId);
        }

        if (!matchedEmployee) {
          matchedEmployee = employees.find(emp =>
            emp.contributorId === currentContributor.id &&
            normalizeUsername(emp.username) === normalizeUsername(supportUser.username)
          );
        }

        if (matchedEmployee) {
          supportUser = {
            username: matchedEmployee.username,
            fullName: matchedEmployee.fullName,
            role: "employee",
            contributorId: currentContributor.id,
            employeeId: matchedEmployee.id,
            mustResetPassword: false,
            status: currentContributor.status || "active"
          };
          const companyName = currentContributor.razaoSocial || "";
          localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
          // Para funcionários, usar chatId específico do funcionário
          const employeeChatId = `chat_contributor_${currentContributor.id}_employee_${matchedEmployee.id}`;
          localStorage.setItem("chatId", employeeChatId);
          console.log(`[Suporte] Login de funcionário: chatId definido como ${employeeChatId}`);
          if (companyName) {
            localStorage.setItem("clientName", companyName);
            const razaoSocialOriginal = (currentContributor.razaoSocial || companyName || "").trim();
            if (razaoSocialOriginal) {
              localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
            }
          }
        } else {
          supportUser = null;
          currentContributor = null;
          localStorage.removeItem("supportCurrentUser");
          localStorage.removeItem("clientName");
        }
      }
    } else {
      supportUser = null;
      currentContributor = null;
      localStorage.removeItem("supportCurrentUser");
      localStorage.removeItem("clientName");
    }
  }

  const hasSupportUser = !!(supportUser && supportUser.contributorId);

  // Verificar se há credenciais salvas (remember me ativado)
  const savedRazaoSocialCheck = localStorage.getItem("savedRazaoSocial");
  const savedUsernameCheck = localStorage.getItem("savedUsername");
  const savedPasswordCheck = localStorage.getItem("savedPassword");
  const hasSavedCredentials = !!(savedRazaoSocialCheck && savedUsernameCheck && savedPasswordCheck);

  if (!hasSupportUser) {
    if (supportLogoutButton) {
      supportLogoutButton.style.display = "none";
    }
    if (supportAddEmployeeButton) {
      supportAddEmployeeButton.style.display = "none";
    }
    if (supportApp) {
      supportApp.style.display = "none";
      // Remove os gradientes quando o usuário não está logado
      removeBackgroundGradients();
    }
    if (loginSection) {
      loginSection.classList.remove("hidden");
    }
  } else {
    // Só fazer login automático se o usuário tiver marcado "lembrar de mim"
    if (!hasSavedCredentials) {
      // Limpar sessão se não houver remember me
      localStorage.removeItem("supportCurrentUser");
      localStorage.removeItem("clientName");
      if (supportApp) {
        supportApp.style.display = "none";
        removeBackgroundGradients();
      }
      if (loginSection) {
        loginSection.classList.remove("hidden");
      }
      return;
    }
    
    if (supportApp) {
      supportApp.style.display = "block";
      // Aplica os gradientes de fundo apenas quando o usuário estiver logado
      applyBackgroundGradients();
      
      // Reinicializar emojis após login (caso os elementos não tenham sido encontrados antes)
      initializeEmojis();
    }
    if (loginSection) {
      loginSection.classList.add("hidden");
    }
    if (!localStorage.getItem("clientName")) {
      const companyName = currentContributor?.razaoSocial || supportUser?.fullName || "";
      if (companyName) {
        localStorage.setItem("clientName", companyName);
        const razaoSocialOriginal = (currentContributor?.razaoSocial || companyName || "").trim();
        if (razaoSocialOriginal) {
          localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
        }
      }
    }

    if (supportLogoutButton) {
      supportLogoutButton.style.display = "flex";
      supportLogoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        logoutSupportUser();
      });
    }

    if (supportAddEmployeeButton) {
      if (supportUser.role === "contributor") {
        supportAddEmployeeButton.style.display = "flex";
        supportAddEmployeeButton.addEventListener("click", () => {
          if (!currentContributor) {
            showToast("Não foi possível identificar o contribuinte atual.", "error");
            return;
          }
          openSupportAddEmployeeModal();
        });
      } else {
        supportAddEmployeeButton.style.display = "none";
      }
    }

    if (supportAddEmployeeCloseBtn) {
      supportAddEmployeeCloseBtn.addEventListener("click", (event) => {
        event.preventDefault();
        closeSupportAddEmployeeModal();
      });
    }

    if (supportAddEmployeeModal) {
      supportAddEmployeeModal.addEventListener("click", (event) => {
        if (event.target === supportAddEmployeeModal) {
          closeSupportAddEmployeeModal();
        }
      });
    }

    if (supportAddEmployeeForm) {
      supportAddEmployeeForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!currentContributor) {
          showToast("Não foi possível identificar o contribuinte atual.", "error");
          return;
        }

        const fullName = supportEmployeeFullNameInput ? supportEmployeeFullNameInput.value.trim() : "";
        const newUsername = supportEmployeeUsernameInput ? supportEmployeeUsernameInput.value.trim() : "";
        const newPassword = supportEmployeePasswordInput ? supportEmployeePasswordInput.value : "";
        const confirmPassword = supportEmployeeConfirmPasswordInput ? supportEmployeeConfirmPasswordInput.value : "";

        if (!fullName || !newUsername || !newPassword || !confirmPassword) {
          showToast("Preencha todos os campos para cadastrar o funcionário.", "error");
          return;
        }

        if (newUsername.includes(" ")) {
          showToast("O username não pode conter espaços.", "error");
          supportEmployeeUsernameInput?.focus();
          return;
        }

        if (newPassword !== confirmPassword) {
          showToast("As senhas informadas não coincidem.", "error");
          supportEmployeeConfirmPasswordInput?.focus();
          return;
        }

        const employees = getContributorEmployeesData();
        if (employees.some(employee =>
          employee.contributorId === currentContributor.id &&
          normalizeUsername(employee.username) === normalizeUsername(newUsername)
        )) {
          showToast("Já existe um funcionário com este username para esta empresa.", "error");
          supportEmployeeUsernameInput?.focus();
          return;
        }

        const newEmployee = {
          id: generateUniqueId(),
          contributorId: currentContributor.id,
          fullName,
          username: newUsername,
          passwordHash: generateUltraSecureHash(newPassword),
          createdAt: Date.now()
        };

        employees.push(newEmployee);
        setContributorEmployeesData(employees);
        showToast("Funcionário cadastrado com sucesso!", "success");
        closeSupportAddEmployeeModal();
      });
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const username = loginUsernameInput ? loginUsernameInput.value.trim() : "";
      const razaoSocialInput = loginRazaoSocialInput ? loginRazaoSocialInput.value.trim() : "";
      const password = loginPasswordInput ? loginPasswordInput.value : "";
      const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

      if (!razaoSocialInput) {
        showToast("Informe a Razão Social para continuar.", "error");
        return;
      }

      if (!username || !password) {
        showToast("Informe o usuário e a senha para continuar.", "error");
        return;
      }

      const normalizedUsername = normalizeUsername(username);
      const razaoSocialNormalized = razaoSocialInput.trim().toLowerCase();
      const contributors = getContributorsData();
      const matchedContributor = contributors.find(contributor =>
        (contributor.razaoSocial || "").trim().toLowerCase() === razaoSocialNormalized
      );

      if (!matchedContributor) {
        showToast("Razão Social não localizada. Verifique os dados informados.", "error");
        if (loginRazaoSocialInput) {
          loginRazaoSocialInput.focus();
        }
        return;
      }

      const hashedPassword = generateUltraSecureHash(password);
      const defaultPasswordHash = generateUltraSecureHash("12345");
      const employees = getContributorEmployeesData();

      if (normalizedUsername === "adm") {
        const requiresDefault = matchedContributor.mustResetPassword !== false;
        const expectedHash = matchedContributor.supportPasswordHash || defaultPasswordHash;

        if (requiresDefault) {
          if (hashedPassword !== defaultPasswordHash) {
            showToast("Senha incorreta. Utilize a senha inicial informada.", "error");
            if (loginPasswordInput) {
              loginPasswordInput.value = "";
              loginPasswordInput.focus();
            }
            return;
          }
        } else if (expectedHash && hashedPassword !== expectedHash) {
          showToast("Senha incorreta. Tente novamente.", "error");
          if (loginPasswordInput) {
            loginPasswordInput.value = "";
            loginPasswordInput.focus();
          }
          return;
        }

        currentContributor = matchedContributor;
        
        // IMPORTANTE: Garantir que mustResetPassword e status sejam sempre verificados do contribuinte
        // Novos contribuintes devem ter mustResetPassword: true e status: "pending"
        const mustResetPassword = matchedContributor.mustResetPassword !== false;
        const contributorStatus = matchedContributor.status || "pending";
        
        supportUser = {
          username: "adm",
          fullName: matchedContributor.razaoSocial,
          role: "contributor",
          contributorId: matchedContributor.id,
          mustResetPassword: mustResetPassword,
          status: contributorStatus
        };
        localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
        const companyName = matchedContributor.razaoSocial || supportUser.fullName;
        if (matchedContributor.chatId) {
          localStorage.setItem("chatId", matchedContributor.chatId);
        }
        if (companyName) {
          localStorage.setItem("clientName", companyName);
          const razaoSocialOriginal = (matchedContributor.razaoSocial || razaoSocialInput).trim();
          if (razaoSocialOriginal) {
            localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
          }
        }
      } else {
        const matchedEmployee = employees.find(employee =>
          employee.contributorId === matchedContributor.id &&
          normalizeUsername(employee.username) === normalizedUsername
        );

        if (!matchedEmployee) {
          showToast("Funcionário não encontrado para esta Razão Social.", "error");
          if (loginUsernameInput) {
            loginUsernameInput.focus();
          }
          return;
        }

        if (matchedEmployee.passwordHash && hashedPassword !== matchedEmployee.passwordHash) {
          showToast("Senha incorreta. Tente novamente.", "error");
          if (loginPasswordInput) {
            loginPasswordInput.value = "";
            loginPasswordInput.focus();
          }
          return;
        }

        currentContributor = matchedContributor;
        supportUser = {
          username: matchedEmployee.username,
          fullName: matchedEmployee.fullName,
          role: "employee",
          contributorId: matchedContributor.id,
          employeeId: matchedEmployee.id,
          mustResetPassword: false,
          status: matchedContributor.status || "active"
        };
        localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
        const companyName = matchedContributor.razaoSocial || "";
        if (matchedContributor.chatId) {
          localStorage.setItem("chatId", matchedContributor.chatId);
        }
        if (companyName) {
          localStorage.setItem("clientName", companyName);
          const razaoSocialOriginal = (matchedContributor.razaoSocial || razaoSocialInput).trim();
          if (razaoSocialOriginal) {
            localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
          }
        }
      }

      if (currentContributor?.chatId) {
        localStorage.setItem("chatId", currentContributor.chatId);
      }

      // Salvar ou remover credenciais baseado no checkbox "Lembrar de mim"
      if (rememberMe) {
        localStorage.setItem("savedRazaoSocial", razaoSocialInput);
        localStorage.setItem("savedUsername", username);
        localStorage.setItem("savedPassword", password);
      } else {
        localStorage.removeItem("savedRazaoSocial");
        localStorage.removeItem("savedUsername");
        localStorage.removeItem("savedPassword");
      }

      if (supportApp) {
        supportApp.style.display = "block";
        // Aplica os gradientes de fundo após o login
        applyBackgroundGradients();
        
        // Reinicializar emojis após login
        setTimeout(() => {
          initializeEmojis();
        }, 100);
      }
      if (loginSection) {
        loginSection.classList.add("hidden");
      }

      window.location.reload();
    });
  }

  if (!hasSupportUser) {
    return;
  }

  if (currentContributor?.chatId) {
    localStorage.setItem("chatId", currentContributor.chatId);
  }

  // IMPORTANTE: Verificar onboarding baseado nos dados ATUAIS do contribuinte, não apenas do supportUser
  // Isso garante que novos contribuintes sempre vejam o onboarding
  if (supportUser.role === "contributor" && currentContributor) {
    // Atualizar supportUser com os valores mais recentes do contribuinte
    const mustResetPassword = currentContributor.mustResetPassword !== false;
    const contributorStatus = currentContributor.status || "pending";
    
    console.log('[Onboarding] Verificando necessidade de onboarding:', {
      contributorId: currentContributor.id,
      mustResetPassword: mustResetPassword,
      status: contributorStatus,
      supportUserMustReset: supportUser.mustResetPassword,
      supportUserStatus: supportUser.status
    });
    
    // Atualizar supportUser se os valores mudaram
    if (supportUser.mustResetPassword !== mustResetPassword || supportUser.status !== contributorStatus) {
      supportUser.mustResetPassword = mustResetPassword;
      supportUser.status = contributorStatus;
      localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
      console.log('[Onboarding] supportUser atualizado com valores do contribuinte');
    }
    
    supportNeedsOnboarding = mustResetPassword || contributorStatus === "pending";
    console.log('[Onboarding] supportNeedsOnboarding definido como:', supportNeedsOnboarding);
  } else {
    supportNeedsOnboarding = false;
    if (!currentContributor) {
      console.warn('[Onboarding] currentContributor não encontrado para supportUser:', supportUser);
    }
  }

  const supportButton = document.getElementById("supportButton");
  const supportChatContainer = document.querySelector(".support-chat-container");
  const supportChatMain = document.getElementById("supportChatMain");
  const notificationsContainer = document.getElementById("notificationsContainer");
  const notificationsList = document.getElementById("notificationsList");
  
  // ==================== SISTEMA DE NOTIFICAÇÕES ====================
  
  // Função para marcar mensagens como lidas quando o chat é aberto
  function markMessagesAsRead() {
    if (!currentContributor || !supportUser || !selectedSector) return;
    
    const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
    const contributorId = currentContributor.id;
    const employeeId = supportUser.role === "employee" ? supportUser.employeeId : null;
    
    // Criar chatId baseado no tipo de usuário
    const baseChatId = `chat_contributor_${contributorId}`;
    const chatId = employeeId ? `${baseChatId}_employee_${employeeId}` : baseChatId;
    
    let hasChanges = false;
    
    // Marcar como lidas todas as mensagens recebidas do setor atual que ainda não foram lidas
    const updatedMessages = messages.map(msg => {
      // Verificar se a mensagem pertence ao chatId correto
      if (msg.chatId !== chatId) return msg;
      
      // Verificar se a mensagem é do setor atual
      if (msg.sector !== selectedSector) return msg;
      
      // Verificar se a mensagem foi recebida (não enviada pelo próprio usuário)
      if (msg.sender === currentContributor.razaoSocial) return msg;
      if (msg.senderUsername && msg.senderUsername.toLowerCase() === supportUser.username.toLowerCase()) return msg;
      
      // Marcar como lida se ainda não foi lida
      if (!msg.read || msg.read === false) {
        hasChanges = true;
        return { ...msg, read: true };
      }
      
      return msg;
    });
    
    // Salvar apenas se houve mudanças
    if (hasChanges) {
      localStorage.setItem("supportMessages", JSON.stringify(updatedMessages));
      console.log(`✅ Mensagens do setor ${selectedSector} marcadas como lidas`);
    }
  }
  
  // Função para obter mensagens não lidas agrupadas por setor
  function getUnreadNotifications() {
    if (!currentContributor || !supportUser) return [];
    
    const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
    const contributorId = currentContributor.id;
    const employeeId = supportUser.role === "employee" ? supportUser.employeeId : null;
    
    // Criar chatId baseado no tipo de usuário
    const baseChatId = `chat_contributor_${contributorId}`;
    const chatId = employeeId ? `${baseChatId}_employee_${employeeId}` : baseChatId;
    
    // Filtrar mensagens recebidas (não enviadas pelo próprio usuário) que NÃO foram lidas
    const receivedMessages = messages.filter(msg => {
      // Mensagem deve pertencer ao chatId correto
      if (msg.chatId !== chatId) return false;
      
      // Mensagem deve ter sido enviada por um setor (não pelo próprio contribuinte)
      if (msg.sender === currentContributor.razaoSocial) return false;
      if (msg.senderUsername && msg.senderUsername.toLowerCase() === supportUser.username.toLowerCase()) return false;
      
      // Mensagem NÃO deve ter sido lida (read deve ser false ou undefined)
      // Se read for true, a mensagem já foi vista, então não mostrar notificação
      return msg.read !== true;
    });
    
    // Agrupar por setor e pegar a última mensagem de cada setor
    const notificationsBySector = {};
    receivedMessages.forEach(msg => {
      const sector = msg.sector || "Geral";
      if (!notificationsBySector[sector] || 
          (msg.timestamp > notificationsBySector[sector].timestamp)) {
        notificationsBySector[sector] = {
          sector: sector,
          lastMessage: msg,
          timestamp: msg.timestamp || Date.now(),
          count: (notificationsBySector[sector]?.count || 0) + 1
        };
      } else {
        notificationsBySector[sector].count += 1;
      }
    });
    
    // Converter para array e ordenar por timestamp (mais recente primeiro)
    return Object.values(notificationsBySector).sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Função para formatar o tempo relativo
  function formatNotificationTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "Agora";
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return "Ontem";
    if (days < 7) return `${days}d atrás`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  
  // Função para obter preview da mensagem
  function getMessagePreview(message) {
    if (message.file) {
      return "📎 Arquivo anexado";
    }
    if (message.text) {
      return message.text.length > 80 ? message.text.substring(0, 80) + "..." : message.text;
    }
    if (message.caption) {
      return "📎 " + (message.caption.length > 75 ? message.caption.substring(0, 75) + "..." : message.caption);
    }
    return "Nova mensagem";
  }
  
  // Função para renderizar notificações
  function renderNotifications() {
    if (!notificationsList) return;
    
    const notifications = getUnreadNotifications();
    
    // Limpar lista
    notificationsList.innerHTML = '';
    
    // Se não houver notificações, não renderizar nada
    if (notifications.length === 0) {
      return;
    }
    
    // Renderizar cada notificação
    notifications.forEach(notification => {
      const card = document.createElement('div');
      card.className = 'notification-card unread';
      card.dataset.sector = notification.sector;
      
      const preview = getMessagePreview(notification.lastMessage);
      const time = formatNotificationTime(notification.timestamp);
      
      card.innerHTML = `
        <div class="notification-header">
          <div class="notification-sector">
            <div class="notification-sector-icon">
              <i class='bx bx-building'></i>
            </div>
            <span class="notification-sector-name">${escapeHtml(notification.sector)}</span>
          </div>
          <span class="notification-time">${time}</span>
        </div>
        <div class="notification-preview">${escapeHtml(preview)}</div>
      `;
      
      // Event listener para abrir chat do setor
      card.addEventListener('click', () => {
        openChatForSector(notification.sector);
      });
      
      notificationsList.appendChild(card);
    });
  }
  
  // Função para abrir chat de um setor específico
  function openChatForSector(sector) {
    if (!sector || !currentContributor || !supportUser) return;
    
    // Definir setor e abrir chat
    selectedSector = sector;
    localStorage.setItem("selectedSector", sector);
    
    // Criar chatId e abrir chat
    const contributorId = currentContributor.id;
    const employeeId = supportUser.role === "employee" ? supportUser.employeeId : null;
    const baseChatId = `chat_contributor_${contributorId}`;
    const chatId = employeeId ? `${baseChatId}_employee_${employeeId}` : baseChatId;
    
    localStorage.setItem("chatId", chatId);
    
    // Aplicar modo de visualização
    if (supportChatContainer) {
      const savedMode = localStorage.getItem("chatViewMode") || "popup";
      supportChatContainer.classList.remove("mode-popup", "mode-half", "mode-fullscreen");
      supportChatContainer.classList.add(`mode-${savedMode}`);
      currentViewMode = savedMode;
    }
    
    // Mostrar chat main e esconder botão
    if (supportChatMain) {
      supportChatMain.classList.add("active");
    }
    if (supportButton) {
      supportButton.classList.add("hidden");
    }
    
    // Atualizar header
    const headerTitle = document.getElementById("chatHeaderTitle");
    const headerSubtitle = document.getElementById("chatHeaderSubtitle");
    
    if (headerTitle) {
      headerTitle.textContent = `Setor ${sector}`;
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = "";
      headerSubtitle.style.display = "none";
    }
    
    // Carregar mensagens
    if (typeof loadMessages === 'function') {
      loadMessages();
    }
    if (typeof checkForNewMessages === 'function') {
      checkForNewMessages();
    }
    if (typeof updateClientActivity === 'function') {
      updateClientActivity();
    }
    if (typeof listenToFirebaseMessages === 'function') {
      listenToFirebaseMessages();
    }
    
    // Marcar mensagens como lidas quando o chat é aberto
    setTimeout(() => {
      markMessagesAsRead();
      updateNotificationsVisibility();
      renderNotifications();
    }, 500);
  }
  
  // Função para atualizar visibilidade do container de notificações
  function updateNotificationsVisibility() {
    if (!notificationsContainer || !supportChatMain) return;
    
    const isChatOpen = supportChatMain.classList.contains("active");
    
    if (isChatOpen) {
      notificationsContainer.classList.add("hidden");
    } else {
      notificationsContainer.classList.remove("hidden");
    }
  }
  
  // Inicializar visibilidade ao carregar
  updateNotificationsVisibility();
  
  // Atualizar notificações periodicamente (a cada 2 segundos)
  setInterval(() => {
    if (!supportChatMain?.classList.contains("active")) {
      renderNotifications();
    }
  }, 2000);
  
  // Renderizar notificações ao carregar
  setTimeout(() => {
    renderNotifications();
  }, 500);
  
  // Atualizar notificações quando houver mudanças no localStorage
  window.addEventListener("storage", (event) => {
    if (event.key === "supportMessages" || event.key === "newSupportMessage") {
      if (!supportChatMain?.classList.contains("active")) {
        renderNotifications();
      }
    }
  });
  
  // Também escutar mudanças locais (mesma aba)
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if ((key === "supportMessages" || key === "newSupportMessage") && 
        !supportChatMain?.classList.contains("active")) {
      setTimeout(() => renderNotifications(), 100);
    }
  };
  const ncmContainer = document.getElementById("ncmSection");
  const chatWindow = supportChatMain; // Mantido para compatibilidade
  const closeChat = document.getElementById("closeChat");
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");
  const chatMessages = document.getElementById("chatMessages");
  const fileInput = document.getElementById("fileInput");
  const attachButton = document.getElementById("attachButton");
  const viewModeButton = document.getElementById("viewModeButton");
  const viewModeDropdown = document.getElementById("viewModeDropdown");
  const viewModeOptions = document.querySelectorAll(".view-mode-option");

  let clientName = currentContributor?.razaoSocial || supportUser?.fullName || localStorage.getItem("clientName") || "";
  if (clientName) {
    localStorage.setItem("clientName", clientName);
    const razaoSocialOriginal = (currentContributor?.razaoSocial || clientName || "").trim();
    if (razaoSocialOriginal) {
      localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
    }
  }

  setSupportMessageInputEnabled(!supportNeedsOnboarding);
  if (supportNeedsOnboarding) {
    console.log('[Onboarding] Exibindo modal de onboarding para contribuinte:', supportUser.contributorId);
    showSupportContributorOnboarding(supportUser);
  } else {
    console.log('[Onboarding] Onboarding não necessário para este contribuinte');
  }

  if (supportContributorOnboardingForm) {
    supportContributorOnboardingForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!supportPendingContributorContext || !supportPendingContributorContext.user || !supportPendingContributorContext.contributor) {
        hideSupportContributorOnboarding();
        return;
      }

      const newPassword = supportContributorNewPasswordInput ? supportContributorNewPasswordInput.value.trim() : "";
      const confirmPassword = supportContributorConfirmPasswordInput ? supportContributorConfirmPasswordInput.value.trim() : "";

      if (!newPassword) {
        showToast("Defina a nova senha para continuar.", "error");
        supportContributorNewPasswordInput?.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast("As senhas informadas não coincidem.", "error");
        supportContributorConfirmPasswordInput?.focus();
        return;
      }

      if (supportContributorConfirmDataCheckbox && !supportContributorConfirmDataCheckbox.checked) {
        showToast("Confirme que seus dados estão corretos antes de prosseguir.", "error");
        return;
      }

      const submitBtn = supportContributorOnboardingForm.querySelector(".btn-confirm-onboarding");
      const originalText = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Confirmando...";
      }

      try {
        // Verificar se supportPendingContributorContext existe e tem contributor
        if (!supportPendingContributorContext || !supportPendingContributorContext.contributor) {
          throw new Error("Contexto do contribuinte não encontrado");
        }

        const hashedPassword = generateUltraSecureHash(newPassword);
        let contributors = getContributorsData();
        const contributorIndex = contributors.findIndex(c => c.id === supportPendingContributorContext.contributor.id);
        if (contributorIndex !== -1) {
          const existingContributor = contributors[contributorIndex];
          contributors[contributorIndex] = {
            ...existingContributor,
            status: "active",
            mustResetPassword: false,
            supportPasswordHash: hashedPassword,
            chatId: existingContributor.chatId || `chat_contributor_${existingContributor.id}`,
            activatedAt: existingContributor.activatedAt || Date.now(),
            lastConfirmedAt: Date.now()
          };
          setContributorsData(contributors);
          supportPendingContributorContext.contributor = contributors[contributorIndex];
          currentContributor = contributors[contributorIndex];
        }

        const contributorContacts = getContributorContactsData();
        const contactIndex = contributorContacts.findIndex(contact =>
          contact.contributorId === supportPendingContributorContext.contributor.id
        );

        const updatedContact = {
          contributorId: supportPendingContributorContext.contributor.id,
          fullName: supportPendingContributorContext.contributor.razaoSocial,
          cnpj: supportPendingContributorContext.contributor.cnpj,
          chatId: supportPendingContributorContext.contributor.chatId,
          status: "active",
          sector: contributorContacts[contactIndex]?.sector || "",
          updatedAt: Date.now()
        };

        if (contactIndex === -1) {
          contributorContacts.push(updatedContact);
        } else {
          contributorContacts[contactIndex] = {
            ...contributorContacts[contactIndex],
            ...updatedContact
          };
        }

        setContributorContactsData(contributorContacts);

        supportUser = {
          username: "adm",
          fullName: supportPendingContributorContext.contributor.razaoSocial,
          role: "contributor",
          contributorId: supportPendingContributorContext.contributor.id,
          mustResetPassword: false,
          status: supportPendingContributorContext.contributor.status || "active"
        };
        supportPendingContributorContext.user = supportUser;

        const companyName = supportPendingContributorContext.contributor.razaoSocial || supportUser.fullName;
        localStorage.setItem("supportCurrentUser", JSON.stringify(supportUser));
        if (supportPendingContributorContext.contributor.chatId) {
          localStorage.setItem("chatId", supportPendingContributorContext.contributor.chatId);
        }
        if (companyName) {
          localStorage.setItem("clientName", companyName);
          clientName = companyName;
          if (supportPendingContributorContext && supportPendingContributorContext.contributor) {
            const razaoSocialOriginal = (supportPendingContributorContext.contributor.razaoSocial || companyName || "").trim();
            if (razaoSocialOriginal) {
              localStorage.setItem("supportLastRazaoSocial", razaoSocialOriginal);
            }
          }
        }

        supportNeedsOnboarding = false;
        
        console.log('[Onboarding] Confirmação concluída, escondendo modal');
        hideSupportContributorOnboarding();
        
        // Pequeno delay para garantir que o modal seja escondido antes de mostrar o toast
        setTimeout(() => {
          showToast("Dados confirmados! Seu acesso ao suporte foi liberado.", "success");
        }, 100);
      } catch (error) {
        console.error("Erro ao confirmar os dados do contribuinte:", error);
        showToast("Não foi possível concluir a confirmação. Tente novamente.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText || "<i class='bx bx-check'></i> Confirmar e acessar o suporte";
        }
      }
    });
  }

  // Setor atualmente selecionado no suporte (deve ser declarado ANTES de qualquer uso)
  let selectedSector = ""; // Sempre vazio no início - cliente deve selecionar ao abrir

  // Função para obter o chatId correto baseado no usuário logado
  function getCurrentChatId() {
    // Se for funcionário, usar chatId específico do funcionário
    if (supportUser && supportUser.role === "employee" && supportUser.employeeId && currentContributor?.id) {
      return `chat_contributor_${currentContributor.id}_employee_${supportUser.employeeId}`;
    }
    // Se for administrador do contribuinte, usar chatId do contribuinte
    if (currentContributor?.chatId) {
      return currentContributor.chatId;
    }
    // Fallback: gerar ou obter chatId padrão
    return localStorage.getItem("chatId") || generateChatId();
  }
  
  // Função para verificar se deve mostrar welcome-message (sempre mostrar até ser escondida)
  function shouldShowWelcomeMessage() {
    if (!selectedSector) return false;
    
    const today = new Date().toDateString();
    const sectorKey = selectedSector.toLowerCase().replace(/\s+/g, '_');
    const contributorId = currentContributor?.id || supportUser?.contributorId || 'default';
    const employeeId = supportUser?.role === "employee" ? supportUser.employeeId : 'admin';
    const hiddenKey = `supportWelcomeHidden_${contributorId}_${employeeId}_${sectorKey}_${today}`;
    const isHidden = localStorage.getItem(hiddenKey) === 'true';
    
    // Sempre mostrar até ser escondida (por envio de mensagem ou scroll)
    return !isHidden;
  }
  
  // Função para esconder welcome-message com transição suave
  function hideWelcomeMessage() {
    if (!selectedSector) return;
    
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (!welcomeMessage) return;
    
    // Marcar como escondida no localStorage (por setor e por dia)
    const today = new Date().toDateString();
    const sectorKey = selectedSector.toLowerCase().replace(/\s+/g, '_');
    const contributorId = currentContributor?.id || supportUser?.contributorId || 'default';
    const employeeId = supportUser?.role === "employee" ? supportUser.employeeId : 'admin';
    const hiddenKey = `supportWelcomeHidden_${contributorId}_${employeeId}_${sectorKey}_${today}`;
    localStorage.setItem(hiddenKey, 'true');
    
    // Adicionar classe para transição suave
    welcomeMessage.classList.add('fade-out');
    
    // Remover após animação
    setTimeout(() => {
      if (welcomeMessage.parentNode) {
        welcomeMessage.remove();
      }
    }, 300);
  }

  // Função para obter chatId de funcionário (similar ao Chat-script.js)
  function getEmployeeChatId(contributorId, employeeId) {
    return `chat_contributor_${contributorId}_employee_${employeeId}`;
  }

  let chatId = getCurrentChatId();
  localStorage.setItem("chatId", chatId);
  let attendantShown = false; // Controla se já mostrou o divisor de atendente
  let currentViewMode = localStorage.getItem("chatViewMode") || "popup";
  
  // Elementos do modal de setor
  const sectorModal = document.getElementById("sectorModal");
  const closeSectorModal = document.getElementById("closeSectorModal");
  const sectorOptions = document.querySelectorAll(".sector-option");
  const changeSectorBtn = document.getElementById("changeSectorBtn");
  const changeSectorBtnHeader = document.getElementById("changeSectorBtnHeader");

  // Gerar ID único para o chat
  function generateChatId() {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("chatId", id);
    return id;
  }

  // Registrar atividade do cliente
  function updateClientActivity() {
    localStorage.setItem(`clientActivity_${chatId}`, Date.now().toString());
  }
  
  // Aplicar modo de visualização salvo
  function applyViewMode(mode) {
    if (supportChatContainer) {
      supportChatContainer.classList.remove("mode-popup", "mode-half", "mode-fullscreen");
      supportChatContainer.classList.add(`mode-${mode}`);
    }
    currentViewMode = mode;
    localStorage.setItem("chatViewMode", mode);
    
    // Atualizar opções ativas
    if (viewModeOptions && viewModeOptions.length > 0) {
      viewModeOptions.forEach(option => {
        if (option.getAttribute("data-mode") === mode) {
          option.classList.add("active");
        } else {
          option.classList.remove("active");
        }
      });
    }
  }
  
  // Abrir modal de seleção de setor
  // ==================== SISTEMA DE NAVEGAÇÃO ENTRE ABAS ====================
  
  // Função para alternar entre seções
  function switchSection(sectionName) {
    const sidebarButtons = document.querySelectorAll('.center-icons button[data-section]');
    const supportSection = document.getElementById('supportSection');
    const ncmSection = document.getElementById('ncmSection');
    const recruitmentSection = document.getElementById('recruitmentSection');
    
    // Remover active de todos os botões
    sidebarButtons.forEach(btn => btn.classList.remove('active'));
    
    // Esconder TODAS as seções completamente
    if (supportSection) {
      supportSection.classList.add('hidden');
      // Remover qualquer estilo inline que possa interferir
      supportSection.style.display = '';
      supportSection.style.visibility = '';
      supportSection.style.opacity = '';
    }
    
    if (ncmSection) {
      ncmSection.classList.add('hidden');
      // Remover qualquer estilo inline que possa interferir
      ncmSection.style.display = '';
      ncmSection.style.visibility = '';
      ncmSection.style.opacity = '';
    }
    
    if (recruitmentSection) {
      recruitmentSection.classList.add('hidden');
      // Remover qualquer estilo inline que possa interferir
      recruitmentSection.style.display = '';
      recruitmentSection.style.visibility = '';
      recruitmentSection.style.opacity = '';
    }
    
    // Mostrar APENAS a seção selecionada e ativar botão correspondente
    if (sectionName === 'support') {
      const supportBtn = document.querySelector('.center-icons button[data-section="support"]');
      if (supportBtn) supportBtn.classList.add('active');
      if (supportSection) {
        supportSection.classList.remove('hidden');
        // Garantir que está visível
        supportSection.style.display = '';
        supportSection.style.visibility = '';
        supportSection.style.opacity = '';
      }
      
      // Fechar chat se estiver aberto (voltar ao estado inicial)
      if (supportChatMain && supportChatMain.classList.contains("active")) {
        supportChatMain.classList.remove("active");
        // Limpar setor selecionado para que o usuário escolha novamente
        selectedSector = null;
        localStorage.removeItem("selectedSector");
        localStorage.removeItem("chatId");
      }
      
      // Mostrar botão de Suporte apenas na aba de Suporte
      if (supportButton) {
        supportButton.classList.remove('hidden');
        supportButton.style.display = '';
      }
      
      // Atualizar visibilidade das notificações
      updateNotificationsVisibility();
      renderNotifications();
    } else if (sectionName === 'ncm') {
      const ncmBtn = document.querySelector('.center-icons button[data-section="ncm"]');
      if (ncmBtn) ncmBtn.classList.add('active');
      if (ncmSection) {
        ncmSection.classList.remove('hidden');
        // Garantir que está visível
        ncmSection.style.display = '';
        ncmSection.style.visibility = '';
        ncmSection.style.opacity = '';
      }
      // Esconder botão de Suporte quando estiver na aba NCM
      if (supportButton) {
        supportButton.classList.add('hidden');
        supportButton.style.display = 'none';
      }
    } else if (sectionName === 'recruitment') {
      const recruitmentBtn = document.querySelector('.center-icons button[data-section="recruitment"]');
      if (recruitmentBtn) recruitmentBtn.classList.add('active');
      if (recruitmentSection) {
        recruitmentSection.classList.remove('hidden');
        // Garantir que está visível
        recruitmentSection.style.display = '';
        recruitmentSection.style.visibility = '';
        recruitmentSection.style.opacity = '';
      }
      // Esconder botão de Suporte quando estiver na aba de Recrutamento
      if (supportButton) {
        supportButton.classList.add('hidden');
        supportButton.style.display = 'none';
      }
    }
    
    console.log(`[switchSection] Aba ${sectionName} ativada. Support: ${supportSection?.classList.contains('hidden') ? 'oculta' : 'visível'}, NCM: ${ncmSection?.classList.contains('hidden') ? 'oculta' : 'visível'}, Recruitment: ${recruitmentSection?.classList.contains('hidden') ? 'oculta' : 'visível'}`);
  }
  
  // Event listeners para os botões do sidebar
  const sidebarButtons = document.querySelectorAll('.center-icons button[data-section]');
  sidebarButtons.forEach(button => {
    button.addEventListener('click', () => {
      const section = button.getAttribute('data-section');
      switchSection(section);
    });
  });
  
  // Inicializar: garantir que a seção de Suporte esteja visível por padrão
  if (supportSection && !supportSection.classList.contains('hidden')) {
    // Seção de suporte já está visível, não fazer nada
  } else if (supportSection) {
    supportSection.classList.remove('hidden');
  }
  
  // Garantir que o container de recrutamento existe e está configurado corretamente
  const recruitmentSectionCheck = document.getElementById('recruitmentSection');
  if (recruitmentSectionCheck) {
    console.log('✅ Container de recrutamento encontrado:', recruitmentSectionCheck);
  } else {
    console.error('❌ Container de recrutamento NÃO encontrado!');
  }
  
  // Garantir que a seção NCM esteja escondida inicialmente
  if (ncmSection && !ncmSection.classList.contains('hidden')) {
    ncmSection.classList.add('hidden');
  }
  
  // Garantir que a seção de Recrutamento esteja escondida inicialmente
  if (recruitmentSection && !recruitmentSection.classList.contains('hidden')) {
    recruitmentSection.classList.add('hidden');
  }
  
  // Garantir que o botão de Suporte esteja visível inicialmente (já que a aba de Suporte é a padrão)
  if (supportButton) {
    supportButton.classList.remove('hidden');
    supportButton.style.display = '';
  }
  
  supportButton.addEventListener("click", () => {
    // Sempre mostrar modal de seleção de setor ao clicar no botão
    sectorModal.classList.add("active");
    console.log('📋 Modal de seleção de setor aberto');
  });
  
  // Função para abrir o chat após setor selecionado
  function openChat() {
    // Atualizar chatId antes de abrir o chat
    chatId = getCurrentChatId();
    localStorage.setItem("chatId", chatId);
    
    // Aplicar modo de visualização primeiro
    applyViewMode(currentViewMode);
    
    // Mostrar chat main e esconder botão
    if (supportChatMain) {
      supportChatMain.classList.add("active");
    }
    if (supportButton) {
      supportButton.classList.add("hidden");
    }
    
    // Esconder notificações quando chat abre
    updateNotificationsVisibility();
    
    // Atualizar header com setor selecionado
    const headerTitle = document.getElementById("chatHeaderTitle");
    const headerSubtitle = document.getElementById("chatHeaderSubtitle");
    
    if (headerTitle && selectedSector) {
      headerTitle.textContent = `Setor ${selectedSector}`;
      console.log(`📋 Título atualizado para: Setor ${selectedSector}`);
    }
    
    if (headerSubtitle) {
      headerSubtitle.textContent = "";
      headerSubtitle.style.display = "none";
    }
    
    console.log(`[Suporte] Abrindo chat com chatId: ${chatId} (Usuário: ${supportUser?.role || 'desconhecido'}, EmployeeId: ${supportUser?.employeeId || 'N/A'})`);
    
    loadMessages();
    checkForNewMessages();
    updateClientActivity();
    listenToFirebaseMessages();
    
    // Marcar mensagens como lidas quando o chat é aberto
    setTimeout(() => {
      markMessagesAsRead();
      renderNotifications(); // Atualizar notificações após marcar como lidas
    }, 500);
  }
  
  // Evento de seleção de setor
  sectorOptions.forEach(option => {
    option.addEventListener("click", () => {
      const sector = option.getAttribute("data-sector");
      const previousSector = selectedSector;
      selectedSector = sector;
      // Não salvar setor no localStorage - cliente deve sempre selecionar
      
      // Fechar modal
      sectorModal.classList.remove("active");
      
      console.log(`📌 Setor selecionado: ${sector}`);
      
      // Obter chatId correto baseado no usuário logado
      chatId = getCurrentChatId();
      localStorage.setItem("chatId", chatId);
      console.log(`[Suporte] ChatId definido: ${chatId} (Usuário: ${supportUser?.role || 'desconhecido'}, EmployeeId: ${supportUser?.employeeId || 'N/A'})`);
      attendantShown = false;
      
      // Se o chat já estiver aberto, atualizar
      if (supportChatMain && supportChatMain.classList.contains("active")) {
        // Atualizar título com o novo setor
        const headerTitle = document.getElementById("chatHeaderTitle");
        if (headerTitle) {
          headerTitle.textContent = `Setor ${selectedSector}`;
        }
        
        const headerSubtitle = document.getElementById("chatHeaderSubtitle");
        if (headerSubtitle) {
          headerSubtitle.textContent = "";
          headerSubtitle.style.display = "none";
        }
        
        // Atualizar chatId com o novo setor
        chatId = getCurrentChatId();
        localStorage.setItem("chatId", chatId);
        
        // Limpar e recarregar mensagens do novo setor
        loadMessages();
        
        // Recarregar listeners do Firebase para o novo chatId
        if (previousSector && previousSector !== sector) {
          console.log(`🔄 Trocado de ${previousSector} para ${sector} - Novo chat iniciado`);
          // Parar listeners antigos e iniciar novos
          listenToFirebaseMessages();
        }
      } else {
        // Abrir chat pela primeira vez
        openChat();
      }
    });
  });
  
  // Botão de trocar setor (antigo - no footer)
  if (changeSectorBtn) {
    changeSectorBtn.addEventListener("click", () => {
      sectorModal.classList.add("active");
      console.log('🔄 Botão trocar setor (footer) clicado - Modal aberto');
    });
  }
  
  // Botão de trocar setor (novo - no header)
  if (changeSectorBtnHeader) {
    changeSectorBtnHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      sectorModal.classList.add("active");
      console.log('🔄 Botão trocar setor (header) clicado - Modal aberto');
    });
  }
  
  // Fechar modal de setor
  closeSectorModal.addEventListener("click", () => {
    sectorModal.classList.remove("active");
  });
  
  // Fechar modal ao clicar fora
  sectorModal.addEventListener("click", (e) => {
    if (e.target === sectorModal) {
      sectorModal.classList.remove("active");
    }
  });

  // Fechar janela de chat
  if (closeChat) {
    closeChat.addEventListener("click", () => {
      if (supportChatMain) {
        supportChatMain.classList.remove("active");
        // Mostrar notificações quando chat fecha
        updateNotificationsVisibility();
        renderNotifications();
      }
      if (supportButton) {
        supportButton.classList.remove("hidden");
      }
      
      // Limpar setor selecionado para que cliente escolha novamente na próxima vez
      selectedSector = "";
      console.log('❌ Chat fechado - Setor limpo');
    });
  }

  // Função para obter hora atual
  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Função para adicionar mensagem na interface com suporte a emojis animados
  // Função para normalizar caminhos de imagens antigos para os novos
  function normalizeImagePath(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') {
      return "../../assets/images/profile-1.png";
    }
    
    // Normalizar caminhos antigos
    const oldPaths = [
      'imagens/profile-1.png',
      './imagens/profile-1.png',
      'imagens/profile-1.jpg',
      './imagens/profile-1.jpg',
      'imagens/logo.png',
      './imagens/logo.png'
    ];
    
    if (oldPaths.includes(imagePath)) {
      if (imagePath.includes('profile-1')) {
        return "../../assets/images/profile-1.png";
      }
      // Para outros arquivos de imagem antigos
      return imagePath.replace(/^\.?\/?imagens\//, '../../assets/images/');
    }
    
    // Se já é base64 ou URL completa, retornar como está
    if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Se já está no caminho correto, retornar como está
    if (imagePath.includes('assets/images')) {
      return imagePath;
    }
    
    return imagePath;
  }
  
  function addMessage(text, type, sender, time, profileImage, fileData) {
    // Detectar se é apenas emojis
    const onlyEmojis = text && isOnlyEmojis(text);
    
    // Se for mensagem do suporte e ainda não mostrou o divisor
    if (type === "support" && !attendantShown) {
      const divider = document.createElement("div");
      divider.classList.add("attendant-divider");
      divider.innerHTML = `
        <div class="attendant-divider-text">
          Você está sendo atendido por: <strong>${sender || "Suporte"}</strong>
        </div>
      `;
      chatMessages.appendChild(divider);
      attendantShown = true;
    }
    
    if (type === "support") {
      // Criar wrapper para mensagem do suporte com perfil
      const wrapper = document.createElement("div");
      wrapper.classList.add("support-message-wrapper");
      
      // Avatar do atendente
      const avatar = document.createElement("img");
      avatar.classList.add("support-avatar");
      const normalizedProfileImage = normalizeImagePath(profileImage);
      avatar.src = normalizedProfileImage;
      avatar.onerror = function() {
        this.onerror = null; // Prevenir loop infinito
        this.src = "../../assets/images/profile-1.png";
      };
      
      // Container do conteúdo da mensagem
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("support-message-content");
      
      // Nome do atendente
      const headerDiv = document.createElement("div");
      headerDiv.classList.add("support-message-header");
      headerDiv.textContent = sender || "Suporte";
      
      // Mensagem
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", "support", "support-with-profile");
      
      // Adicionar classe emoji-only se for apenas emojis
      if (onlyEmojis) {
        messageDiv.classList.add("emoji-only");
      }
      
      // Se tiver arquivo, renderizar arquivo
      if (fileData) {
        const fileElement = createFileElement(fileData.file, fileData.data);
        messageDiv.appendChild(fileElement);
      }
      // Se for apenas emojis, renderizar emojis grandes com Lottie
      else if (text && onlyEmojis) {
        const emojis = extractEmojis(text);
        const emojiCount = emojis.length;
        
        console.log(`🎨 [CLIENTE] Renderizando ${emojiCount} emoji(s) do suporte com Lottie!`);
        
        emojis.forEach((emoji, index) => {
          const emojiContainer = createLargeEmoji(emoji, index);
          
          // Ajustar tamanho
          if (emojiCount === 1) {
            // Tamanho grande padrão
          } else if (emojiCount <= 3) {
            emojiContainer.classList.add('emoji-medium');
          } else {
            emojiContainer.classList.add('emoji-small');
          }
          
          messageDiv.appendChild(emojiContainer);
        });
      }
      // Senão, renderizar texto normal
      else {
        const textNode = document.createTextNode(text);
        messageDiv.appendChild(textNode);
      }
      
      const timeDiv = document.createElement("span");
      timeDiv.classList.add("message-time");
      timeDiv.textContent = time;
      messageDiv.appendChild(timeDiv);
      
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(messageDiv);
      
      wrapper.appendChild(avatar);
      wrapper.appendChild(contentDiv);
      
      chatMessages.appendChild(wrapper);
    } else {
      // Mensagem do cliente
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", type);
      
      // Adicionar classe emoji-only se for apenas emojis
      if (onlyEmojis) {
        messageDiv.classList.add("emoji-only");
      }
      
      // Se tiver arquivo, renderizar arquivo
      if (fileData) {
        const fileElement = createFileElement(fileData.file, fileData.data);
        messageDiv.appendChild(fileElement);
      }
      // Se for apenas emojis, renderizar emojis grandes com Lottie
      else if (text && onlyEmojis) {
        const emojis = extractEmojis(text);
        const emojiCount = emojis.length;
        
        console.log(`🎨 [CLIENTE] Renderizando ${emojiCount} emoji(s) próprio(s) com Lottie!`);
        
        emojis.forEach((emoji, index) => {
          const emojiContainer = createLargeEmoji(emoji, index);
          
          // Ajustar tamanho
          if (emojiCount === 1) {
            // Tamanho grande padrão
          } else if (emojiCount <= 3) {
            emojiContainer.classList.add('emoji-medium');
          } else {
            emojiContainer.classList.add('emoji-small');
          }
          
          messageDiv.appendChild(emojiContainer);
        });
      }
      // Senão, renderizar texto normal
      else {
        const textNode = document.createTextNode(text);
        messageDiv.appendChild(textNode);
      }
      
      const timeDiv = document.createElement("span");
      timeDiv.classList.add("message-time");
      timeDiv.textContent = time;
      messageDiv.appendChild(timeDiv);
      
      chatMessages.appendChild(messageDiv);
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Função para enviar mensagem
  function sendMessage() {
    if (supportNeedsOnboarding) {
      showToast("Finalize a confirmação do seu cadastro para enviar mensagens.", "error");
      return;
    }
    
    // Atualizar chatId para garantir que está correto antes de enviar
    chatId = getCurrentChatId();
    
    const text = messageInput.value.trim();
    const companyName = currentContributor?.razaoSocial || supportUser?.fullName || localStorage.getItem("clientName") || "";
    let senderRole = "admin";
    let senderName = "Administrador";

    if (supportUser.role === "employee") {
      senderRole = "employee";
      senderName = supportUser.fullName || "Funcionário";
    }

    if (!companyName) {
      showToast("Não foi possível identificar a Razão Social. Refaça o login.", "error");
      return;
    }
    
    if (!text) return;
    
    const time = getCurrentTime();
    const onlyEmojis = isOnlyEmojis(text);
    
    const messageData = {
      id: generateUniqueId(),
      chatId: chatId, // Usar chatId correto (já definido pelo getCurrentChatId)
      clientName: companyName,
      sector: selectedSector,
      text: text,
      type: "client",
      isEmojiOnly: onlyEmojis, // Marcar se é apenas emoji
      time: time,
      timestamp: Date.now(),
      read: false,
      senderName,
      senderRole,
      contributorId: currentContributor?.id || null,
      employeeId: supportUser?.role === "employee" ? supportUser.employeeId : null, // ID do funcionário (se for funcionário)
      targetEmployeeId: null // Sempre null para mensagens do cliente
    };
    
    console.log(`[Suporte] Enviando mensagem com chatId: ${chatId}, senderRole: ${senderRole}, employeeId: ${messageData.employeeId}`);
    
    // Esconder welcome-message se estiver visível
    hideWelcomeMessage();
    
    // Adicionar mensagem na interface
    addMessage(text, "client", senderName, time);
    
    // Salvar mensagem no localStorage
    saveMessage(messageData);
    
    // Registrar atividade
    updateClientActivity();
    
    // Limpar input
    messageInput.value = "";
    messageInput.focus();
  }

  // Firebase removido - usar apenas localStorage

  // Função para calcular tamanho aproximado de uma mensagem
  function getMessageSize(message) {
    try {
      return JSON.stringify(message).length;
    } catch (e) {
      return 0;
    }
  }

  // Função para limpar mensagens antigas e reduzir tamanho do localStorage
  function cleanupOldMessages(maxSizeMB = 4) {
    try {
      let messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
      const originalLength = messages.length;
      const maxSizeBytes = maxSizeMB * 1024 * 1024; // Converter MB para bytes
      
      // Primeiro, remover dados de arquivos grandes (>500KB), mantendo apenas metadados
      let totalSize = 0;
      messages = messages.map(msg => {
        if (msg.file && msg.file.data) {
          const base64Size = msg.file.data.length;
          const estimatedSize = (base64Size * 3) / 4;
          
          // Se arquivo maior que 500KB, remover data (mantém apenas metadados)
          if (estimatedSize > 500 * 1024) {
            console.log(`🗑️ Removendo dados de arquivo grande (mantendo metadados): ${msg.file.name} (~${Math.round(estimatedSize / 1024)}KB)`);
            return {
              ...msg,
              file: {
                name: msg.file.name,
                size: msg.file.size,
                type: msg.file.type,
                _dataRemoved: true,
                _firebaseKey: msg.id // Manter ID para buscar do Firebase se necessário
              }
            };
          }
        }
        return msg;
      });
      
      // Ordenar mensagens por timestamp (mais antigas primeiro)
      messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      // Calcular tamanho total e remover mensagens mais antigas se necessário
      let finalMessages = [];
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const msgSize = getMessageSize(msg);
        
        if (totalSize + msgSize <= maxSizeBytes) {
          finalMessages.unshift(msg);
          totalSize += msgSize;
        } else {
          // Remover mensagens mais antigas que excedem o tamanho
          break;
        }
      }
      
      // Se ainda tiver muitas mensagens, limitar quantidade (máximo 300)
      if (finalMessages.length > 300) {
        finalMessages = finalMessages.slice(-300);
        console.log(`🧹 Limpeza por quantidade: Mantidas ${finalMessages.length} mensagens mais recentes`);
      }
      
      if (originalLength !== finalMessages.length) {
        console.log(`🧹 Limpeza automática: ${originalLength - finalMessages.length} mensagens removidas (mantidas ${finalMessages.length})`);
      }
      
      // Tentar salvar a lista reduzida
      try {
        localStorage.setItem("supportMessages", JSON.stringify(finalMessages));
      } catch (e) {
        // Se ainda exceder, limpeza mais agressiva
        if (e.name === 'QuotaExceededError') {
          console.warn("⚠️ Quota ainda excedida, aplicando limpeza agressiva...");
          
          // Remover TODOS os arquivos (mantendo apenas metadados)
          finalMessages = finalMessages.map(msg => {
            if (msg.file && msg.file.data) {
              return {
                ...msg,
                file: {
                  name: msg.file.name,
                  size: msg.file.size,
                  type: msg.file.type,
                  _dataRemoved: true,
                  _firebaseKey: msg.id
                }
              };
            }
            return msg;
          });
          
          // Manter apenas últimas 100 mensagens
          if (finalMessages.length > 100) {
            finalMessages = finalMessages.slice(-100);
          }
          
          localStorage.setItem("supportMessages", JSON.stringify(finalMessages));
          console.log(`✅ Limpeza agressiva concluída: ${finalMessages.length} mensagens mantidas`);
        } else {
          throw e;
        }
      }
      
      return finalMessages;
    } catch (error) {
      console.error("❌ Erro ao limpar mensagens antigas:", error);
      // Em caso de erro, retornar array vazio para evitar corrupção
      return [];
    }
  }

  // Salvar mensagem no localStorage e Firebase (se disponível)
  function saveMessage(messageData) {
    // Se a mensagem tiver arquivo grande (>500KB), remover dados antes de salvar no localStorage
    const messageToSave = { ...messageData };
    if (messageToSave.file && messageToSave.file.data) {
      const base64Size = messageToSave.file.data.length;
      const estimatedSize = (base64Size * 3) / 4;
      
      // Se arquivo maior que 500KB, não salvar dados no localStorage
      if (estimatedSize > 500 * 1024) {
        console.log(`📦 Arquivo grande detectado (${Math.round(estimatedSize / 1024)}KB), removendo dados do localStorage (mantendo apenas metadados)`);
        messageToSave.file = {
          name: messageToSave.file.name,
          size: messageToSave.file.size,
          type: messageToSave.file.type,
          _dataRemoved: true,
          _firebaseKey: messageToSave.id
        };
      }
    }
    
    try {
      // Limpar mensagens antigas antes de adicionar nova (máximo 3MB)
      let messages = cleanupOldMessages(3);
      
      messages.push(messageToSave);
      localStorage.setItem("supportMessages", JSON.stringify(messages));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error("❌ Erro: Quota do localStorage excedida mesmo após limpeza!");
        
        // Tentar limpeza mais agressiva (máximo 2MB)
        try {
          let messages = cleanupOldMessages(2);
          
          // Garantir que a mensagem atual não tem dados de arquivo
          const cleanMessage = {
            ...messageToSave,
            file: messageToSave.file && messageToSave.file.data ? {
              name: messageToSave.file.name,
              size: messageToSave.file.size,
              type: messageToSave.file.type,
              _dataRemoved: true,
              _firebaseKey: messageToSave.id
            } : messageToSave.file
          };
          
          messages.push(cleanMessage);
          localStorage.setItem("supportMessages", JSON.stringify(messages));
          console.log("✅ Limpeza agressiva aplicada, mensagem salva (sem dados de arquivo)");
        } catch (e2) {
          console.error("❌ Erro crítico: Não foi possível salvar mensagem no localStorage:", e2);
          // Ainda assim, salvar no Firebase se disponível
        }
      } else {
        console.error("❌ Erro ao salvar mensagem:", e);
      }
    }
    
    // Firebase removido - usar apenas localStorage
    // Mensagens são salvas apenas no localStorage
    
    // Notificar que há nova mensagem
    localStorage.setItem("newSupportMessage", Date.now().toString());
  }

  // Carregar mensagens do chat atual
  function loadMessages() {
    // Atualizar chatId para garantir que está correto
    chatId = getCurrentChatId();
    
    const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
    const chatMessages = document.getElementById("chatMessages");
    
    // Limpar mensagens
    chatMessages.innerHTML = "";
    attendantShown = false; // Reset do controle do divisor
    let lastMessageDate = null;
    
    // Filtrar mensagens do chat atual E do setor atual
    // IMPORTANTE: Para funcionários, mostrar apenas mensagens do chat específico do funcionário
    // Para administrador, mostrar apenas mensagens do chat do administrador (sem employeeId ou com employeeId null)
    let currentChatMessages = messages.filter(msg => {
      // Primeiro, verificar se o chatId corresponde
      if (msg.chatId !== chatId) {
        return false;
      }
      
      // Verificar se o setor corresponde (se a mensagem tiver setor definido)
      if (selectedSector && msg.sector && msg.sector !== selectedSector) {
        return false;
      }
      
      // Se a mensagem não tiver setor mas estamos com um setor selecionado, não mostrar
      // (mensagens antigas sem setor não devem aparecer quando um setor está selecionado)
      if (selectedSector && !msg.sector) {
        return false;
      }
      
      // Se for funcionário, garantir que apenas mensagens deste funcionário sejam mostradas
      if (supportUser && supportUser.role === "employee" && supportUser.employeeId) {
        // Mostrar apenas mensagens deste funcionário (senderRole === "employee" e employeeId corresponde)
        // OU mensagens de resposta do suporte direcionadas a este funcionário (targetEmployeeId corresponde)
        return (
          (msg.senderRole === "employee" && msg.employeeId === supportUser.employeeId) ||
          (msg.type === "support" && msg.targetEmployeeId === supportUser.employeeId) ||
          // Também incluir mensagens antigas que não têm employeeId mas estão no chatId correto
          (!msg.employeeId && !msg.targetEmployeeId && msg.chatId === chatId)
        );
      }
      
      // Se for administrador, mostrar apenas mensagens sem employeeId ou com employeeId null
      if (supportUser && supportUser.role === "contributor") {
        // Mostrar apenas mensagens do administrador (sem employeeId ou employeeId null)
        // OU mensagens de resposta do suporte sem targetEmployeeId
        return (
          (!msg.employeeId || msg.employeeId === null) &&
          (!msg.targetEmployeeId || msg.targetEmployeeId === null)
        );
      }
      
      // Fallback: mostrar mensagens que correspondem ao chatId
      return true;
    });
    
    console.log(`[Suporte] Carregando mensagens: ${currentChatMessages.length} mensagens para chatId ${chatId}, setor: ${selectedSector || 'N/A'} (Usuário: ${supportUser?.role || 'desconhecido'}, EmployeeId: ${supportUser?.employeeId || 'N/A'})`);
    
    // Verificar se deve mostrar welcome-message (primeira interação do dia com este setor)
    const showWelcome = shouldShowWelcomeMessage();
    
    if (showWelcome) {
      // Criar welcome-message
      const welcomeDiv = document.createElement("div");
      welcomeDiv.className = "welcome-message";
      welcomeDiv.innerHTML = `
        <div class="welcome-icon">
          <i class='bx bx-support'></i>
        </div>
        <h4>Bem-vindo ao Suporte Sercon!</h4>
        <p>Como podemos ajudar você hoje?</p>
      `;
      chatMessages.appendChild(welcomeDiv);
    }
    
    // Adicionar mensagens com indicadores de data
    currentChatMessages.forEach(msg => {
      // Adicionar indicador de data se for diferente da mensagem anterior
      const messageDate = msg.timestamp || Date.now();
      const messageDateString = new Date(messageDate).toDateString();
      
      if (messageDateString !== lastMessageDate) {
        const dateText = getRelativeDate(messageDate);
        const dateDivider = createDateDivider(dateText);
        chatMessages.appendChild(dateDivider);
        lastMessageDate = messageDateString;
      }
      // Se tiver arquivo, passar dados do arquivo
      const fileData = msg.file ? {
        file: {
          name: msg.file.name,
          size: msg.file.size,
          type: msg.file.type
        },
        data: msg.file.data
      } : null;
      
      addMessage(
        msg.text, 
        msg.type, 
        msg.type === "client" ? (msg.senderName || msg.clientName || msg.sender) : (msg.sender || msg.senderName),
        msg.time,
        normalizeImagePath(msg.profileImage),
        fileData
      );
    });
  }

  // Verificar novas mensagens do suporte
  function checkForNewMessages() {
    // Atualizar chatId para garantir que está correto
    chatId = getCurrentChatId();
    
    const lastCheck = localStorage.getItem("lastMessageCheck") || "0";
    const messages = JSON.parse(localStorage.getItem("supportMessages") || "[]");
    
    // Filtrar mensagens do chat atual, setor atual e que sejam do suporte
    let newMessages = messages.filter(msg => {
      // Verificar chatId
      if (msg.chatId !== chatId) return false;
      
      // Verificar setor (se a mensagem tiver setor definido)
      if (selectedSector && msg.sector && msg.sector !== selectedSector) {
        return false;
      }
      
      // Se a mensagem não tiver setor mas estamos com um setor selecionado, não mostrar
      if (selectedSector && !msg.sector) {
        return false;
      }
      
      // Verificar se é mensagem do suporte e nova
      return msg.type === "support" && new Date(msg.timestamp).getTime() > parseInt(lastCheck);
    });
    
    // Se for funcionário, filtrar também por targetEmployeeId
    if (supportUser && supportUser.role === "employee" && supportUser.employeeId) {
      newMessages = newMessages.filter(msg => 
        msg.targetEmployeeId === supportUser.employeeId || 
        !msg.targetEmployeeId // Incluir mensagens antigas sem targetEmployeeId
      );
    }
    
    // Se for administrador, filtrar mensagens sem targetEmployeeId
    if (supportUser && supportUser.role === "contributor") {
      newMessages = newMessages.filter(msg => 
        !msg.targetEmployeeId || msg.targetEmployeeId === null
      );
    }
    
    if (newMessages.length > 0) {
      loadMessages();
    }
    
    localStorage.setItem("lastMessageCheck", Date.now().toString());
  }
  
  // Firebase removido - listeners em tempo real desabilitados
  // O sistema agora usa verificações periódicas para novas mensagens
  function listenToFirebaseMessages() {
    // Firebase removido - usar apenas localStorage
    // Novas mensagens serão detectadas via checkForNewMessages()
  }
  
  // Verificar novas mensagens periodicamente e atualizar atividade (fallback)
  setInterval(() => {
    if (supportChatMain && supportChatMain.classList.contains("active")) {
      checkForNewMessages();
      updateClientActivity();
    }
  }, 2000);

  // Atualização quase em tempo real via evento de storage (entre abas / janelas)
  window.addEventListener("storage", (event) => {
    // Qualquer mudança em supportMessages ou newSupportMessage dispara atualização imediata
    if (event.key === "supportMessages" || event.key === "newSupportMessage") {
      if (supportChatMain && supportChatMain.classList.contains("active")) {
        checkForNewMessages();
      }
    }
  });

  // ==================== FUNCIONALIDADE DE ANEXAR ARQUIVOS ====================
  
  // Evento do botão de anexar
  if (attachButton && fileInput) {
    attachButton.addEventListener("click", () => {
      fileInput.click();
    });
    
    // Evento quando arquivo é selecionado
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const companyName = currentContributor?.razaoSocial || supportUser?.fullName || localStorage.getItem("clientName") || "";
      if (!companyName) {
        showToast("Não foi possível identificar a Razão Social. Refaça o login.", "error");
        return;
      }

      let senderRole = "admin";
      let senderName = "Administrador";

      if (supportUser.role === "employee") {
        senderRole = "employee";
        senderName = supportUser.fullName || "Funcionário";
      }
      
      // Atualizar chatId para garantir que está correto antes de enviar
      chatId = getCurrentChatId();
      
      // Processar cada arquivo
      for (const file of files) {
        try {
          const fileDataBase64 = await fileToBase64(file);
          const time = getCurrentTime();
          
          const messageData = {
            id: generateUniqueId(),
            chatId: chatId, // Usar chatId correto (já definido pelo getCurrentChatId)
            clientName: companyName,
            sector: selectedSector, // Adicionar setor à mensagem de arquivo
            type: "client",
            time: time,
            timestamp: Date.now(),
            read: false,
            senderName,
            senderRole,
            contributorId: currentContributor?.id || null,
            employeeId: supportUser?.role === "employee" ? supportUser.employeeId : null,
            targetEmployeeId: null,
            file: {
              name: file.name,
              size: file.size,
              type: file.type,
              data: fileDataBase64
            }
          };
          
          console.log(`[Suporte] Enviando arquivo com chatId: ${chatId}, senderRole: ${senderRole}, employeeId: ${messageData.employeeId}`);
          
          addMessage(null, "client", senderName, time, null, {
            file: file,
            data: fileDataBase64
          });
          
          saveMessage(messageData);
          updateClientActivity();
        } catch (error) {
          showToast("Erro ao processar arquivo", "error");
          console.error(error);
        }
      }
      
      // Limpar input de arquivo
      fileInput.value = "";
    });
  }
  
  // ==================== FIM FUNCIONALIDADE DE ANEXAR ARQUIVOS ====================
  
  // Evento de clique no botão de enviar
  sendButton.addEventListener("click", sendMessage);

  // Evento de Enter no input
  messageInput.addEventListener("keypress", (e) => {
    if (supportNeedsOnboarding) {
      e.preventDefault();
      showToast("Finalize a confirmação do seu cadastro para enviar mensagens.", "error");
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // ==================== MODO DE VISUALIZAÇÃO ====================
  
  // Toggle dropdown do modo de visualização
  viewModeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    viewModeDropdown.classList.toggle("active");
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener("click", (e) => {
    if (!viewModeDropdown.contains(e.target) && e.target !== viewModeButton) {
      viewModeDropdown.classList.remove("active");
    }
  });
  
  // Alternar modo de visualização
  viewModeOptions.forEach(option => {
    option.addEventListener("click", () => {
      const mode = option.getAttribute("data-mode");
      applyViewMode(mode);
      viewModeDropdown.classList.remove("active");
    });
  });
  
  // Aplicar modo inicial apenas se o chat estiver aberto
  // Não aplicar no início para manter o container vazio
  // applyViewMode(currentViewMode);
  
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
  
  // Aplicar gradiente dinâmico na área de mensagens
  const chatMessagesElement = document.getElementById('chatMessages');
  if (chatMessagesElement) {
    setupDynamicScrollGradient(chatMessagesElement);
    
    // Event listener para detectar scroll para cima e esconder welcome-message
    let lastScrollTop = chatMessagesElement.scrollTop;
    chatMessagesElement.addEventListener('scroll', function() {
      const currentScrollTop = chatMessagesElement.scrollTop;
      
      // Se rolou para cima (scrollTop diminuiu) e não está no final
      if (currentScrollTop < lastScrollTop && currentScrollTop < chatMessagesElement.scrollHeight - chatMessagesElement.clientHeight - 50) {
        hideWelcomeMessage();
      }
      
      lastScrollTop = currentScrollTop;
    }, { passive: true });
  }
  
  // ==================== FIM GRADIENTE DINÂMICO DE SCROLL ====================
  
  // ==================== SISTEMA DE EMOJIS ANIMADOS NOTO ====================
  
  // Função para inicializar emojis (pode ser chamada após login)
  function initializeEmojis() {
    const emojiButton = document.getElementById("emojiButton");
    const emojiPanel = document.getElementById("emojiPanel");
    const emojiGrid = document.getElementById("emojiGrid");
    const emojiCategories = document.querySelectorAll(".emoji-category");
    const emojiMessageInput = document.getElementById("messageInput");
    
    if (!emojiButton || !emojiPanel || !emojiGrid) {
      console.warn("Elementos de emoji não encontrados ainda. Tentando novamente...");
      return false;
    }
    
    // Se já foram inicializados, não fazer novamente
    if (emojiButton.dataset.initialized === "true") {
      return true;
    }
    
    emojiButton.dataset.initialized = "true";
    
    // Eventos dos emojis com Noto Animation
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
    
    if (emojiCategories.length > 0) {
      emojiCategories.forEach(category => {
        category.addEventListener("click", (e) => {
          e.stopPropagation();
          emojiCategories.forEach(c => c.classList.remove("active"));
          category.classList.add("active");
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
    
    return true;
  }
  
  const emojiButton = document.getElementById("emojiButton");
  const emojiPanel = document.getElementById("emojiPanel");
  const emojiGrid = document.getElementById("emojiGrid");
  const emojiCategories = document.querySelectorAll(".emoji-category");
  const emojiMessageInput = document.getElementById("messageInput");
  
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

    if (!emojiMessageInput) {

      console.error("Input de mensagem não encontrado!");

      return;

    }

    

    const cursorPos = emojiMessageInput.selectionStart;

    const textBefore = emojiMessageInput.value.substring(0, cursorPos);

    const textAfter = emojiMessageInput.value.substring(cursorPos);

    

    emojiMessageInput.value = textBefore + emoji + textAfter;

    emojiMessageInput.focus();

    emojiMessageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

  }
  
  // Tentar inicializar emojis imediatamente
  if (emojiButton && emojiPanel && emojiGrid) {
    initializeEmojis();
  }

  

  // Fechar painel de emojis ao clicar fora

  document.addEventListener("click", (e) => {

    if (emojiButton && emojiPanel && !emojiButton.contains(e.target) && !emojiPanel.contains(e.target)) {

      emojiPanel.style.display = "none";

    }

  });
  
  // ==================== FIM SISTEMA DE EMOJIS ANIMADOS NOTO ====================
});

