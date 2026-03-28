# Módulos Compartilhados (src/shared/)

Arquivos usados por múltiplas interfaces do Chat UI.

---

## 1. config.js

Configurações centralizadas do sistema. Modifique aqui para ajustar comportamentos sem alterar o código principal.

### 1.1 Armazenamento

| Propriedade | Tipo | Valor | Descrição |
|-------------|------|-------|-----------|
| `MAX_MESSAGES_STORAGE_MB` | number | 4 | Tamanho máximo de armazenamento de mensagens (MB). Mensagens antigas são limpas ao exceder. |
| `MAX_FILE_SIZE_FOR_STORAGE` | number | 512000 | 500KB – arquivos maiores têm dados removidos após limpeza |
| `MAX_FILE_UPLOAD_SIZE` | number | 10485760 | 10MB – tamanho máximo para upload |

### 1.2 Tempo

| Propriedade | Tipo | Valor | Descrição |
|-------------|------|-------|-----------|
| `POLLING_INTERVAL` | number | 2000 | Intervalo de verificação de novas mensagens (ms) |
| `ONLINE_STATUS_INTERVAL` | number | 30000 | Intervalo de atualização de status online (ms) |
| `OFFLINE_TIMEOUT` | number | 300000 | Tempo de inatividade para considerar usuário offline (5 min) |

### 1.3 Chaves do localStorage (STORAGE_KEYS)

| Chave | Uso |
|-------|-----|
| `users` | Lista de usuários do sistema |
| `contributors` | Contribuintes cadastrados |
| `contributorContacts` | Contatos por contribuinte |
| `contributorEmployees` | Funcionários por contribuinte |
| `supportMessages` | Mensagens de suporte |
| `internalMessages` | Mensagens internas |
| `currentUser` | Usuário logado |
| `tasks` | Tarefas/lembretes da Tax Agenda |
| `lastSupportCheck` | Última verificação de suporte |
| `newSupportMessage` | Flag de nova mensagem |
| `chatId` | ID do chat selecionado |
| `selectedSector` | Setor selecionado |
| `chatViewMode` | Modo de visualização do chat |
| `recruitmentRequests` | Solicitações de recrutamento |

### 1.4 UI

| Propriedade | Tipo | Valor | Descrição |
|-------------|------|-------|-----------|
| `ANIMATION_DURATION` | number | 300 | Tempo de animação padrão (ms) |
| `EMOJI_ANIMATION_DELAY` | number | 8 | Delay entre animações de emojis |
| `EMOJI_PANEL_CLOSE_DELAY` | number | 350 | Tempo para fechar painel de emojis após seleção |
| `MESSAGE_PREVIEW_LENGTH` | number | 90 | Comprimento máximo do preview de mensagem |
| `MAX_UNREAD_BADGE` | number | 99 | Máximo de mensagens não lidas no badge |

### 1.5 Setores (SECTORS)

```javascript
['Fiscal Real', 'Fiscal Simples', 'Processo', 'Contábil', 'Pessoal', 'Financeiro']
```

### 1.6 Permissões (ROLES)

| Chave | Valor | Descrição |
|-------|------|-----------|
| `ADMIN` | 'admin' | Administrador |
| `USER` | 'user' | Usuário comum |
| `CONTRIBUTOR` | 'contributor' | Contribuinte (cliente) |

### 1.7 Tipos de Arquivo Permitidos (ALLOWED_FILE_TYPES)

- **IMAGES**: jpeg, png, gif, webp
- **VIDEOS**: mp4, webm, ogg
- **DOCUMENTS**: pdf, doc, docx, xls, xlsx

### 1.8 Categorias de Emoji (EMOJI_CATEGORIES)

```javascript
{ SMILEYS: 'smileys', HEARTS: 'hearts', GESTURES: 'gestures', ANIMALS: 'animals', FOOD: 'food', OBJECTS: 'objects' }
```

### 1.9 Supabase (SUPABASE)

| Propriedade | Descrição |
|-------------|-----------|
| `URL` | URL do projeto Supabase |
| `ANON_KEY` | Chave pública (anon) |
| `TABLE_NAME` | Tabela de dados do sistema (system_data) |
| `VALIDACAO_NCM_TABLE` | Tabela validacao_ncm (produto×NCM) |

---

## 2. constants.js

Constantes utilizadas em múltiplos arquivos.

### 2.1 ELEMENTS – IDs de elementos DOM

| Chave | Valor | Uso |
|-------|------|-----|
| `CHAT_APP` | 'chatApp' | Container principal do chat |
| `CHAT_CONTAINER` | 'chatContainer' | Container do chat |
| `CHAT_LIST` | 'chatList' | Lista de contatos |
| `CHAT_MAIN` | 'chatMain' | Área principal de mensagens |
| `MESSAGES_CONTAINER` | 'messages' | Container de mensagens |
| `MESSAGE_INPUT` | 'messageInput' | Campo de input |
| `SEND_BUTTON` | 'sendButton' | Botão enviar |
| `ATTACH_BUTTON` | 'attachButton' | Botão anexar |
| `FILE_INPUT` | 'fileInput' | Input de arquivo |
| `EMOJI_BUTTON` | 'emojiButton' | Botão emoji |
| `EMOJI_PANEL` | 'emojiPanel' | Painel de emojis |
| `EMOJI_GRID` | 'emojiGrid' | Grid de emojis |
| `DOMINIUM_LOGIN` | 'dominium-login' | Seção de login |
| `LOGIN_FORM` | 'dominiumLoginForm' | Formulário de login |
| `LOGIN_USERNAME` | 'dominiumLoginUsername' | Campo username |
| `LOGIN_PASSWORD` | 'dominiumLoginPassword' | Campo senha |

### 2.2 CLASSES – Classes CSS

| Chave | Valor |
|-------|-------|
| `ACTIVE` | 'active' |
| `HIDDEN` | 'hidden' |
| `VISIBLE` | 'visible' |
| `ONLINE` | 'online' |
| `OFFLINE` | 'offline' |
| `HAS_UNREAD` | 'has-unread' |
| `SENT` | 'sent' |
| `RECEIVED` | 'received' |
| `CLIENT` | 'client' |
| `SUPPORT` | 'support' |
| `EMOJI_ONLY` | 'emoji-only' |
| `LOADING` | 'loading' |
| `ERROR` | 'error' |
| `SUCCESS` | 'success' |
| `WARNING` | 'warning' |

### 2.3 PATTERNS – Padrões de identificação

| Chave | Regex | Descrição |
|-------|-------|-----------|
| `CHAT_ID_CONTRIBUTOR` | `/^chat_contributor_(.+)$/` | Chat com contribuinte |
| `CHAT_ID_EMPLOYEE` | `/^chat_contributor_(.+)_employee_(.+)$/` | Chat com funcionário |
| `CHAT_ID_CONTACT` | `/^chat_contact_(.+)$/` | Chat com contato |
| `INTERNAL_CHAT_ID` | `/^internal_(.+)_(.+)$/` | Chat interno |

### 2.4 MESSAGES – Mensagens do sistema

- **ERROR**: FILE_TOO_LARGE, FILE_TYPE_NOT_ALLOWED, MESSAGE_EMPTY, LOGIN_FAILED, NETWORK_ERROR, STORAGE_FULL
- **SUCCESS**: MESSAGE_SENT, FILE_UPLOADED, USER_ADDED, CONTRIBUTOR_ADDED
- **INFO**: LOADING, NO_MESSAGES, NO_CONTACTS, SELECT_SECTOR

### 2.5 DEFAULTS

| Chave | Valor |
|-------|-------|
| `PROFILE_IMAGE` | '../../assets/images/avatars/profile-1.png' |
| `AVATAR_SIZE` | 40 |
| `MESSAGE_TIME_FORMAT` | 'HH:mm' |
| `DATE_FORMAT` | 'DD/MM/YYYY' |
| `MAX_RETRIES` | 3 |
| `RETRY_DELAY` | 1000 |

### 2.6 EVENTS – Eventos customizados

| Chave | Valor |
|-------|-------|
| `MESSAGE_SENT` | 'message:sent' |
| `MESSAGE_RECEIVED` | 'message:received' |
| `FILE_UPLOADED` | 'file:uploaded' |
| `USER_LOGIN` | 'user:login' |
| `USER_LOGOUT` | 'user:logout' |
| `SECTOR_CHANGED` | 'sector:changed' |
| `CHAT_OPENED` | 'chat:opened' |
| `CHAT_CLOSED` | 'chat:closed' |

### 2.7 VALIDATION

| Chave | Valor |
|-------|-------|
| `USERNAME_MIN_LENGTH` | 3 |
| `USERNAME_MAX_LENGTH` | 50 |
| `PASSWORD_MIN_LENGTH` | 6 |
| `CNPJ_LENGTH` | 18 |
| `CEP_LENGTH` | 9 |

### 2.8 REGEX

| Chave | Padrão |
|-------|--------|
| `EMAIL` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `CNPJ` | `/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/` |
| `CEP` | `/^\d{5}-?\d{3}$/` |
| `PHONE` | `/^\(\d{2}\)\s\d{4,5}-\d{4}$/` |

---

## 3. utils.js – Funções Utilitárias

### 3.1 Data e Hora

#### `generateUniqueId()`
- **Retorno**: `string`
- **Descrição**: Gera ID único baseado em timestamp e random (base36).
- **Exemplo**: `"m5k2x9abc"`

#### `getCurrentTime()`
- **Retorno**: `string`
- **Descrição**: Retorna hora atual no formato HH:mm.
- **Exemplo**: `"14:35"`

#### `getRelativeDate(date)`
- **Parâmetros**: `date` – Date, string ou number
- **Retorno**: `string`
- **Descrição**: Retorna "Hoje", "Ontem" ou DD/MM/AAAA conforme a data.
- **Tratamento**: Datas inválidas retornam "Hoje".

#### `createDateDivider(dateText)`
- **Parâmetros**: `dateText` – string
- **Retorno**: `HTMLElement`
- **Descrição**: Cria elemento `<div class="date-divider">` com a data para separar mensagens.

### 3.2 Arquivos

#### `fileToBase64(file)`
- **Parâmetros**: `file` – File
- **Retorno**: `Promise<string>`
- **Descrição**: Converte arquivo para Base64 (Data URL).

#### `formatFileSize(bytes)`
- **Parâmetros**: `bytes` – number
- **Retorno**: `string`
- **Descrição**: Formata tamanho em Bytes, KB, MB ou GB.
- **Exemplo**: `"1.5 MB"`

#### `isImageFile(fileName)`
- **Parâmetros**: `fileName` – string
- **Retorno**: `boolean`
- **Extensões**: jpg, jpeg, png, gif, webp, bmp, svg

#### `isVideoFile(fileName)`
- **Parâmetros**: `fileName` – string
- **Retorno**: `boolean`
- **Extensões**: mp4, webm, ogg, mov, avi

#### `getFileIcon(fileName)`
- **Parâmetros**: `fileName` – string
- **Retorno**: `string` (classe Boxicons)
- **Mapeamento**: pdf→bx-file-blank, doc/docx→bx-file, xls/xlsx→bx-spreadsheet, etc.

### 3.3 String

#### `escapeHtml(str)`
- **Parâmetros**: `str` – string (ou null)
- **Retorno**: `string`
- **Descrição**: Escapa HTML para evitar XSS. Usa `textContent` para segurança.

#### `normalizeUsername(username)`
- **Parâmetros**: `username` – string
- **Retorno**: `string`
- **Descrição**: Trim + lowercase.

#### `truncateText(text, maxLength)`
- **Parâmetros**: `text` – string, `maxLength` – number (default 90)
- **Retorno**: `string`
- **Descrição**: Trunca com "..." se exceder maxLength.

### 3.4 Storage

#### `safeJsonParse(jsonString, fallback)`
- **Parâmetros**: `jsonString` – string, `fallback` – * (default null)
- **Retorno**: objeto parseado ou fallback
- **Descrição**: Parse seguro com try/catch.

#### `getStorageItem(key, defaultValue)`
- **Parâmetros**: `key` – string, `defaultValue` – * (default null)
- **Retorno**: valor do localStorage ou defaultValue
- **Descrição**: Lê e faz JSON.parse. Em erro retorna defaultValue.

#### `setStorageItem(key, value)`
- **Parâmetros**: `key` – string, `value` – *
- **Retorno**: `boolean`
- **Descrição**: Salva com JSON.stringify. Retorna true em sucesso.

### 3.5 Validação

#### `validateCNPJ(cnpj)`
- **Parâmetros**: `cnpj` – string
- **Retorno**: `boolean`
- **Formato esperado**: 00.000.000/0000-00

#### `validateCEP(cep)`
- **Parâmetros**: `cep` – string
- **Retorno**: `boolean`
- **Formato esperado**: 00000-000 ou 00000000

### 3.6 DOM

#### `createElement(tag, classes, attributes, text)`
- **Parâmetros**: `tag` – string, `classes` – string[], `attributes` – object, `text` – string
- **Retorno**: `HTMLElement`
- **Descrição**: Cria elemento com classes, atributos e texto.

#### `clearElement(element)`
- **Parâmetros**: `element` – HTMLElement
- **Retorno**: void
- **Descrição**: Define innerHTML = ''.

### 3.7 Emoji

#### `isOnlyEmojis(text)`
- **Parâmetros**: `text` – string
- **Retorno**: `boolean`
- **Descrição**: Verifica se o texto contém apenas emojis (Unicode). Remove espaços antes de verificar.

---

*Módulos compartilhados – Chat UI Sercon*
