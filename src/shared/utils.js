/**
 * Funções Utilitárias Compartilhadas
 * 
 * Este arquivo contém funções utilitárias que são usadas
 * tanto no sistema de Chat quanto no sistema de Suporte.
 */

// ==================== UTILITÁRIOS DE DATA E HORA ====================

/**
 * Gera um ID único baseado em timestamp e random
 * @returns {string} ID único
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Obtém a hora atual formatada (HH:mm)
 * @returns {string} Hora formatada
 */
function getCurrentTime() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

/**
 * Obtém data relativa ou formatada
 * @param {Date|string|number} date - Data a ser formatada
 * @returns {string} Data formatada (Hoje, Ontem ou DD/MM/AAAA)
 */
function getRelativeDate(date) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const messageDate = new Date(date);
    
    if (isNaN(messageDate.getTime())) {
      return 'Hoje';
    }
    
    messageDate.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    } else {
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

/**
 * Escapa HTML para evitar XSS
 * @param {string} str - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(str) {
  if (str == null) return '';
  var s = String(str);
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/**
 * Cria um divisor de data para as mensagens
 * @param {string} dateText - Texto da data
 * @returns {HTMLElement} Elemento div com a data
 */
function createDateDivider(dateText) {
  const divider = document.createElement('div');
  divider.classList.add('date-divider');
  divider.innerHTML = `<div class="date-divider-box">${dateText}</div>`;
  return divider;
}

// ==================== UTILITÁRIOS DE ARQUIVO ====================

/**
 * Converte arquivo para Base64
 * @param {File} file - Arquivo a ser convertido
 * @returns {Promise<string>} Promise com o Base64 do arquivo
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Formata tamanho de arquivo para leitura humana
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (ex: "1.5 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Verifica se o arquivo é uma imagem
 * @param {string} fileName - Nome do arquivo
 * @returns {boolean} True se for imagem
 */
function isImageFile(fileName) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
}

/**
 * Verifica se o arquivo é um vídeo
 * @param {string} fileName - Nome do arquivo
 * @returns {boolean} True se for vídeo
 */
function isVideoFile(fileName) {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

/**
 * Obtém ícone apropriado para o tipo de arquivo
 * @param {string} fileName - Nome do arquivo
 * @returns {string} Nome da classe do ícone Boxicons
 */
function getFileIcon(fileName) {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  const iconMap = {
    '.pdf': 'bx-file-blank',
    '.doc': 'bx-file',
    '.docx': 'bx-file',
    '.xls': 'bx-spreadsheet',
    '.xlsx': 'bx-spreadsheet',
    '.txt': 'bx-file',
    '.zip': 'bx-archive',
    '.rar': 'bx-archive',
    '.mp3': 'bx-music',
    '.mp4': 'bx-video',
    '.jpg': 'bx-image',
    '.jpeg': 'bx-image',
    '.png': 'bx-image',
    '.gif': 'bx-image'
  };
  
  return iconMap[ext] || 'bx-file';
}

// ==================== UTILITÁRIOS DE STRING ====================

/**
 * Normaliza username (trim e lowercase)
 * @param {string} username - Username a ser normalizado
 * @returns {string} Username normalizado
 */
function normalizeUsername(username) {
  return (username || "").trim().toLowerCase();
}

/**
 * Trunca texto com ellipsis
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 90) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ==================== UTILITÁRIOS DE STORAGE ====================

/**
 * Parse seguro de JSON com fallback
 * @param {string} jsonString - String JSON
 * @param {*} fallback - Valor padrão em caso de erro
 * @returns {*} Objeto parseado ou fallback
 */
function safeJsonParse(jsonString, fallback = null) {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.error('Erro ao fazer parse do JSON:', error);
    return fallback;
  }
}

/**
 * Obtém item do localStorage de forma segura
 * @param {string} key - Chave do localStorage
 * @param {*} defaultValue - Valor padrão
 * @returns {*} Valor do localStorage ou padrão
 */
function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Salva item no localStorage de forma segura
 * @param {string} key - Chave do localStorage
 * @param {*} value - Valor a ser salvo
 * @returns {boolean} True se salvou com sucesso
 */
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    return false;
  }
}

// ==================== UTILITÁRIOS DE VALIDAÇÃO ====================

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} True se válido
 */
function validateCNPJ(cnpj) {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return cnpjRegex.test(cnpj);
}

/**
 * Valida CEP
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} True se válido
 */
function validateCEP(cep) {
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
}

// ==================== UTILITÁRIOS DE DOM ====================

/**
 * Cria elemento com classes e atributos
 * @param {string} tag - Tag do elemento
 * @param {string[]} classes - Array de classes
 * @param {Object} attributes - Objeto com atributos
 * @param {string} text - Texto do elemento
 * @returns {HTMLElement} Elemento criado
 */
function createElement(tag, classes = [], attributes = {}, text = '') {
  const element = document.createElement(tag);
  if (classes.length > 0) {
    element.classList.add(...classes);
  }
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  if (text) {
    element.textContent = text;
  }
  return element;
}

/**
 * Remove todos os filhos de um elemento
 * @param {HTMLElement} element - Elemento a ser limpo
 */
function clearElement(element) {
  if (element) {
    element.innerHTML = '';
  }
}

// ==================== UTILITÁRIOS DE EMOJI ====================

/**
 * Verifica se o texto contém apenas emojis
 * @param {string} text - Texto a ser verificado
 * @returns {boolean} True se contém apenas emojis
 */
function isOnlyEmojis(text) {
  if (!text || !text.trim()) return false;
  
  // Remove espaços e quebras de linha
  const cleanText = text.replace(/\s/g, '');
  if (!cleanText) return false;
  
  // Regex para emojis Unicode
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]+$/u;
  
  return emojiRegex.test(cleanText);
}

// ==================== EXPORTAÇÃO ====================

// Exportar funções (compatível com módulos ES6 e script tags)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateUniqueId,
    getCurrentTime,
    getRelativeDate,
    createDateDivider,
    fileToBase64,
    formatFileSize,
    isImageFile,
    isVideoFile,
    getFileIcon,
    normalizeUsername,
    truncateText,
    safeJsonParse,
    getStorageItem,
    setStorageItem,
    validateCNPJ,
    validateCEP,
    createElement,
    clearElement,
    isOnlyEmojis
  };
}


