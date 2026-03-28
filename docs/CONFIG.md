# Configuração – Chat UI Sercon

Guia detalhado de configuração do sistema.

---

## 1. config.js – Referência Completa

### 1.1 Armazenamento

```javascript
MAX_MESSAGES_STORAGE_MB: 4,        // MB para mensagens
MAX_FILE_SIZE_FOR_STORAGE: 500 * 1024,  // 500KB
MAX_FILE_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
```

### 1.2 Tempo

```javascript
POLLING_INTERVAL: 2000,      // 2s
ONLINE_STATUS_INTERVAL: 30000,  // 30s
OFFLINE_TIMEOUT: 300000,     // 5 min
```

### 1.3 Supabase

```javascript
SUPABASE: {
  URL: 'https://seu-projeto.supabase.co',
  ANON_KEY: 'sua_chave_anon',
  TABLE_NAME: 'system_data',
  VALIDACAO_NCM_TABLE: 'validacao_ncm'
}
```

**Obter URL e ANON_KEY**: Dashboard Supabase → Project Settings → API.

**Tabela system_data**: `key` (text PK), `value` (jsonb), `updated_at` (timestamptz).

**Tabela validacao_ncm**: `produto`, `ncm`, `resultado`, `detalhe`.

### 1.4 Firebase (Legado)

```javascript
FIREBASE: { ENABLED: false, COLLECTIONS: { ... } }
```

Firebase está desabilitado. O sistema usa localStorage e Supabase.

### 1.5 Debug

```javascript
DEBUG: false,
LOG_LEVELS: { ERROR: 'error', WARN: 'warn', INFO: 'info', DEBUG: 'debug' }
```

---

## 2. constants.js – Referência

| Objeto | Uso |
|--------|-----|
| `ELEMENTS` | IDs de elementos DOM |
| `CLASSES` | Classes CSS |
| `PATTERNS` | Regex para chat IDs |
| `MESSAGES` | Mensagens de erro/sucesso/info |
| `DEFAULTS` | Valores padrão |
| `EVENTS` | Eventos customizados |
| `VALIDATION` | Valores de validação |
| `REGEX` | Padrões de validação |

---

## 3. Variáveis de Ambiente

O projeto não usa `.env` por padrão. Para produção:

- **Supabase**: configure `CONFIG.SUPABASE.URL` e `ANON_KEY` em `config.js`
- **CORS**: se servir de outro domínio, configure CORS no Supabase
- **HTTPS**: recomendado para produção

---

## 4. Tema (Claro/Escuro)

- **Chave**: `localStorage.operador-theme`
- **Valores**: `'light'` ou `'dark'`
- **Atributo**: `document.documentElement.setAttribute('data-theme', 'light'|'dark')`
- **Tokens**: definidos em `:root` e `[data-theme="dark"]` no CSS

---

## 5. Credenciais Salvas (Lembrar)

- **Chaves**: `savedUsername`, `savedPassword`
- **Condição**: checkbox "Lembrar de mim" no login
- **Segurança**: senha em texto plano no localStorage (apenas para conveniência)

---

## 6. Integração com correlacao_ncm.py

Para usar o mesmo banco da validação NCM (script Python):

1. Use a mesma `SUPABASE_URL` do `.env` do Python em `CONFIG.SUPABASE.URL`
2. Use a mesma chave anon do projeto em `CONFIG.SUPABASE.ANON_KEY`
3. Garanta que a tabela `validacao_ncm` exista com colunas: `produto`, `ncm`, `resultado`, `detalhe`
4. RLS deve permitir `SELECT` para a chave anon

---

*Configuração – Chat UI Sercon*
