/**
 * Constantes do Sistema
 * 
 * Este arquivo contém todas as constantes utilizadas no sistema.
 * Centraliza valores que são usados em múltiplos arquivos.
 */

const CONSTANTS = {
  // ==================== IDENTIFICADORES DE ELEMENTOS ====================
  
  ELEMENTS: {
    // Chat System
    CHAT_APP: 'chatApp',
    CHAT_CONTAINER: 'chatContainer',
    CHAT_LIST: 'chatList',
    CHAT_MAIN: 'chatMain',
    MESSAGES_CONTAINER: 'messages',
    MESSAGE_INPUT: 'messageInput',
    SEND_BUTTON: 'sendButton',
    ATTACH_BUTTON: 'attachButton',
    FILE_INPUT: 'fileInput',
    EMOJI_BUTTON: 'emojiButton',
    EMOJI_PANEL: 'emojiPanel',
    EMOJI_GRID: 'emojiGrid',
    
    // Support System
    SUPPORT_APP: 'supportApp',
    SUPPORT_CHAT_CONTAINER: 'supportChatContainer',
    SUPPORT_CHAT_MAIN: 'supportChatMain',
    SUPPORT_BUTTON: 'supportButton',
    SUPPORT_MESSAGES: 'chatMessages',
    SUPPORT_MESSAGE_INPUT: 'messageInput',
    
    // Modals
    SECTOR_MODAL: 'sectorModal',
    ADD_EMPLOYEE_MODAL: 'supportAddEmployeeModal',
    
    // Login
    DOMINIUM_LOGIN: 'dominium-login',
    LOGIN_FORM: 'dominiumLoginForm',
    LOGIN_USERNAME: 'dominiumLoginUsername',
    LOGIN_PASSWORD: 'dominiumLoginPassword'
  },
  
  // ==================== CLASSES CSS ====================
  
  CLASSES: {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    ONLINE: 'online',
    OFFLINE: 'offline',
    HAS_UNREAD: 'has-unread',
    SENT: 'sent',
    RECEIVED: 'received',
    CLIENT: 'client',
    SUPPORT: 'support',
    EMOJI_ONLY: 'emoji-only',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning'
  },
  
  // ==================== PADRÕES DE IDENTIFICAÇÃO ====================
  
  PATTERNS: {
    CHAT_ID_CONTRIBUTOR: /^chat_contributor_(.+)$/,
    CHAT_ID_EMPLOYEE: /^chat_contributor_(.+)_employee_(.+)$/,
    CHAT_ID_CONTACT: /^chat_contact_(.+)$/,
    INTERNAL_CHAT_ID: /^internal_(.+)_(.+)$/
  },
  
  // ==================== MENSAGENS DO SISTEMA ====================
  
  MESSAGES: {
    ERROR: {
      FILE_TOO_LARGE: 'Arquivo muito grande. Tamanho máximo: {size}',
      FILE_TYPE_NOT_ALLOWED: 'Tipo de arquivo não permitido',
      MESSAGE_EMPTY: 'Digite uma mensagem antes de enviar',
      LOGIN_FAILED: 'Usuário ou senha incorretos',
      NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
      STORAGE_FULL: 'Armazenamento cheio. Limpando mensagens antigas...'
    },
    SUCCESS: {
      MESSAGE_SENT: 'Mensagem enviada com sucesso',
      FILE_UPLOADED: 'Arquivo enviado com sucesso',
      USER_ADDED: 'Usuário adicionado com sucesso',
      CONTRIBUTOR_ADDED: 'Contribuinte adicionado com sucesso'
    },
    INFO: {
      LOADING: 'Carregando...',
      NO_MESSAGES: 'Nenhuma mensagem ainda',
      NO_CONTACTS: 'Nenhum contato disponível',
      SELECT_SECTOR: 'Selecione um setor para começar'
    }
  },
  
  // ==================== VALORES PADRÃO ====================
  
  DEFAULTS: {
    PROFILE_IMAGE: 'imagens/avatars/profile-1.png',
    AVATAR_SIZE: 40,
    MESSAGE_TIME_FORMAT: 'HH:mm',
    DATE_FORMAT: 'DD/MM/YYYY',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  
  // ==================== EVENTOS CUSTOMIZADOS ====================
  
  EVENTS: {
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    FILE_UPLOADED: 'file:uploaded',
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    SECTOR_CHANGED: 'sector:changed',
    CHAT_OPENED: 'chat:opened',
    CHAT_CLOSED: 'chat:closed'
  },
  
  // ==================== CONFIGURAÇÕES DE VALIDAÇÃO ====================
  
  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 6,
    CNPJ_LENGTH: 18,
    CEP_LENGTH: 9
  },
  
  // ==================== REGEX PATTERNS ====================
  
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    CEP: /^\d{5}-?\d{3}$/,
    PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  }
};

// Exportar constantes (compatível com módulos ES6 e script tags)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}


