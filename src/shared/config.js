/**
 * Configurações Centralizadas do Sistema
 * 
 * Este arquivo contém todas as configurações do sistema de Chat e Suporte.
 * Modifique aqui para ajustar comportamentos sem alterar o código principal.
 */

const CONFIG = {
  // ==================== CONFIGURAÇÕES DE ARMAZENAMENTO ====================
  
  /**
   * Política de armazenamento: arquivos são preservados integralmente (sem compressão
   * nem strip de dados). Quando o localStorage fica cheio (QuotaExceededError) o
   * sistema remove as mensagens mais antigas em FIFO até caber a nova mensagem.
   * O limite prático do navegador fica perto de 5MB por origin.
   */
  MAX_MESSAGES_STORAGE_MB: 5,

  /**
   * Limiar para avisar o usuário que o armazenamento está quase cheio (80%).
   */
  STORAGE_WARN_THRESHOLD: 0.8,

  /**
   * Tamanho máximo de arquivo aceito no upload (em bytes). Acima disso o arquivo
   * simplesmente não cabe no localStorage nem codificado em base64.
   */
  MAX_FILE_UPLOAD_SIZE: 25 * 1024 * 1024, // 25MB
  
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
   * Supabase – sincronização de dados em tempo real entre múltiplos PCs.
   *
   * COMO OBTER OS VALORES:
   *   1. Acesse https://supabase.com e faça login
   *   2. Abra seu projeto → Project Settings → API
   *   3. Copie:
   *      • "Project URL"  → cole em URL abaixo
   *      • "anon public"  → cole em ANON_KEY abaixo (começa com eyJ...)
   *
   * A ANON_KEY é pública por design (fica visível no JS do browser).
   * A segurança real vem das políticas RLS configuradas no banco.
   * NUNCA coloque a SERVICE_ROLE key aqui — ela dá acesso irrestrito.
   *
   * Tabela principal : system_data    (key, value JSONB, updated_at)
   * Tabela NCM       : validacao_ncm  (produto, ncm, resultado, detalhe)
   * Script de criação: supabase/migrations/001_initial_schema.sql
   */
  SUPABASE: {
    URL: 'https://ilibmcfjdkrenimxvdxg.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaWJtY2ZqZGtyZW5pbXh2ZHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzExNzQsImV4cCI6MjA5NDEwNzE3NH0.yOroCWfGN84Ut6wnl_hmQoMW0Xlau1_h6tfhPFkW3eQ',
    TABLE_NAME: 'system_data',
    /** Tabela de validação produto×NCM (script Python correlacao_ncm). */
    VALIDACAO_NCM_TABLE: 'validacao_ncm'
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
    ER