/**
 * Configurações Centralizadas do Sistema
 * 
 * Este arquivo contém todas as configurações do sistema de Chat e Suporte.
 * Modifique aqui para ajustar comportamentos sem alterar o código principal.
 */

const CONFIG = {
  // ==================== CONFIGURAÇÕES DE ARMAZENAMENTO ====================
  
  /**
   * Tamanho máximo de armazenamento de mensagens (em MB)
   * Quando excedido, mensagens antigas são limpas
   */
  MAX_MESSAGES_STORAGE_MB: 4,
  
  /**
   * Tamanho máximo de arquivo individual (em bytes)
   * Arquivos maiores que 500KB terão dados removidos após limpeza
   */
  MAX_FILE_SIZE_FOR_STORAGE: 500 * 1024, // 500KB
  
  /**
   * Tamanho máximo de arquivo para upload (em bytes)
   */
  MAX_FILE_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  
  // ==================== CONFIGURAÇÕES DE TEMPO ====================
  
  /**
   * Intervalo de verificação de novas mensagens (em ms)
   */
  POLLING_INTERVAL: 2000, // 2 segundos
  
  /**
   * Intervalo de atualização de status online (em ms)
   */
  ONLINE_STATUS_INTERVAL: 30000, // 30 segundos
  
  /**
   * Tempo de inatividade para considerar usuário offline (em ms)
   */
  OFFLINE_TIMEOUT: 300000, // 5 minutos
  
  // ==================== CHAVES DO LOCALSTORAGE ====================
  
  STORAGE_KEYS: {
    USERS: 'users',
    CONTRIBUTORS: 'contributors',
    CONTRIBUTOR_CONTACTS: 'contributorContacts',
    CONTRIBUTOR_EMPLOYEES: 'contributorEmployees',
    SUPPORT_MESSAGES: 'supportMessages',
    INTERNAL_MESSAGES: 'internalMessages',
    CURRENT_USER: 'currentUser',
    TASKS: 'tasks',
    LAST_SUPPORT_CHECK: 'lastSupportCheck',
    NEW_SUPPORT_MESSAGE: 'newSupportMessage',
    CHAT_ID: 'chatId',
    SELECTED_SECTOR: 'selectedSector',
    CHAT_VIEW_MODE: 'chatViewMode',
    RECRUITMENT_REQUESTS: 'recruitmentRequests'
  },
  
  // ==================== CONFIGURAÇÕES DE UI ====================
  
  /**
   * Tempo de animação padrão (em ms)
   */
  ANIMATION_DURATION: 300,
  
  /**
   * Delay entre animações de emojis (em ms)
   */
  EMOJI_ANIMATION_DELAY: 8,
  
  /**
   * Tempo para fechar painel de emojis após seleção (em ms)
   */
  EMOJI_PANEL_CLOSE_DELAY: 350,
  
  // ==================== CONFIGURAÇÕES DE MENSAGENS ====================
  
  /**
   * Comprimento máximo de preview de mensagem
   */
  MESSAGE_PREVIEW_LENGTH: 90,
  
  /**
   * Número máximo de mensagens não lidas para mostrar no badge
   */
  MAX_UNREAD_BADGE: 99,
  
  // ==================== CONFIGURAÇÕES DE SETORES ====================
  
  SECTORS: [
    'Fiscal Real',
    'Fiscal Simples',
    'Processo',
    'Contábil',
    'Pessoal',
    'Financeiro'
  ],
  
  // ==================== CONFIGURAÇÕES DE PERMISSÕES ====================
  
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    CONTRIBUTOR: 'contributor'
  },
  
  // ==================== CONFIGURAÇÕES DE ARQUIVOS ====================
  
  /**
   * Tipos de arquivo permitidos para upload
   */
  ALLOWED_FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // ==================== CONFIGURAÇÕES DE EMOJIS ====================
  
  /**
   * Categorias de emojis disponíveis
   */
  EMOJI_CATEGORIES: {
    SMILEYS: 'smileys',
    HEARTS: 'hearts',
    GESTURES: 'gestures',
    ANIMALS: 'animals',
    FOOD: 'food',
    OBJECTS: 'objects'
  },
  
  // ==================== CONFIGURAÇÕES DE API ====================
  
  /**
   * URLs de APIs externas
   */
  API: {
    NOTO_EMOJI_LOTTIE: 'https://fonts.gstatic.com/s/e/notoemoji/latest',
    CEP_API: 'https://viacep.com.br/ws'
  },
  
  // ==================== CONFIGURAÇÕES DE SUPABASE ====================
  
  /**
   * Supabase – sincronização de dados entre múltiplos PCs.
   * URL do projeto e chave pública (anon/publishable).
   * Tabela: system_data (key, value JSONB, updated_at).
   */
  SUPABASE: {
    URL: 'https://distsrgjhofvktcxgyub.supabase.co',
    ANON_KEY: 'sb_publishable_Sq8IRu0U3u22SzUz-bF8DQ_bZl-NvG6',
    TABLE_NAME: 'system_data'
  },
  
  // ==================== CONFIGURAÇÕES DE FIREBASE ====================
  
  /**
   * Configurações do Firebase (se aplicável)
   */
  FIREBASE: {
    ENABLED: false, // Firebase desabilitado por padrão
    COLLECTIONS: {
      MESSAGES: 'supportMessages',
      USERS: 'users',
      CONTRIBUTORS: 'contributors'
    }
  },
  
  // ==================== CONFIGURAÇÕES DE DEBUG ====================
  
  /**
   * Habilitar logs de debug
   */
  DEBUG: false,
  
  /**
   * Níveis de log
   */
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  }
};

// Exportar configuração (compatível com módulos ES6 e script tags)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}


