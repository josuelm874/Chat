# Supabase – Sincronização e Validação NCM

O arquivo `src/shared/supabase-sync.js` implementa a sincronização de dados entre múltiplos PCs e o acesso à tabela de validação NCM.

---

## 1. Configuração

Em `config.js`:

```javascript
CONFIG.SUPABASE = {
  URL: 'https://seu-projeto.supabase.co',
  ANON_KEY: 'sua_chave_anon',
  TABLE_NAME: 'system_data',
  VALIDACAO_NCM_TABLE: 'validacao_ncm'
};
```

Se URL ou ANON_KEY estiverem vazios ou com placeholders, o sistema usa apenas localStorage e exibe aviso no console.

---

## 2. API Pública (window.supabaseSync)

### 2.1 Inicialização e Status

#### `init()`
- **Retorno**: `boolean`
- **Descrição**: Inicializa o cliente Supabase. Carrega o script da CDN se necessário. Retorna `true` se configurado com sucesso.
- **Chamada**: Automática no `DOMContentLoaded` ou ao carregar o script.

#### `isConfigured()`
- **Retorno**: `boolean`
- **Descrição**: Indica se o Supabase está configurado e pronto para uso.

---

### 2.2 Sincronização de Dados do Sistema

#### `save(key, data)`
- **Parâmetros**:
  - `key` – string (ex: 'users', 'contributors')
  - `data` – qualquer valor serializável em JSON
- **Retorno**: `Promise<{ success, local?, cloud?, error? }>`
- **Comportamento**:
  1. Salva em localStorage
  2. Se Supabase configurado, faz upsert na tabela `system_data` (onConflict: 'key')
  3. Retorna `{ success: true, local: true }` ou `{ success: true, cloud: true, local: true }`
  4. Em erro no cloud, retorna `{ success: false, error, local: true }` (dados locais já salvos)

#### `load(key, defaultValue)`
- **Parâmetros**:
  - `key` – string
  - `defaultValue` – valor padrão se não houver dados (default: null)
- **Retorno**: `Promise<*>` – valor carregado
- **Comportamento**:
  1. Se Supabase configurado, tenta buscar na tabela `system_data`
  2. Se encontrar, atualiza localStorage e retorna o valor
  3. Se não encontrar ou erro, lê do localStorage
  4. Se não houver dados, retorna defaultValue

#### `sync(key)`
- **Parâmetros**: `key` – string
- **Retorno**: `Promise<{ synced, action?, data?, error?, reason? }>`
- **Comportamento**:
  - Compara `updated_at` do cloud com timestamp local (`key_updated`)
  - Se cloud mais recente: baixa e atualiza localStorage → `{ synced: true, action: 'downloaded', data }`
  - Se local mais recente: envia para cloud → `{ synced: true, action: 'uploaded' }`
  - Se iguais: `{ synced: true, action: 'already_synced' }`
  - Se Supabase não configurado: `{ synced: false, reason: 'Supabase não configurado' }`

#### `syncAll(keys)`
- **Parâmetros**: `keys` – array de strings (opcional). Default: `['users', 'contributors', 'contributorContacts', 'contributorEmployees', 'supportMessages', 'internalMessages', 'tasks', 'recruitmentRequests']`
- **Retorno**: `Promise<Object>` – objeto com resultado de cada chave
- **Exemplo**: `{ users: { synced: true, action: 'downloaded' }, contributors: { synced: true, action: 'already_synced' } }`

#### `refresh(key)`
- **Parâmetros**: `key` – string
- **Retorno**: `Promise<* | null>`
- **Descrição**: Força download do cloud, sobrescreve localStorage. Retorna o valor ou null em erro.

---

### 2.3 Validação NCM (tabela validacao_ncm)

A tabela deve ter as colunas: `produto`, `ncm`, `resultado`, `detalhe`.

#### `loadValidacaoNcm(produto, ncm)`
- **Parâmetros**:
  - `produto` – string (nome do produto)
  - `ncm` – string (código NCM, 8 dígitos)
- **Retorno**: `Promise<{ produto, ncm, resultado, detalhe } | null>`
- **Descrição**: Busca validação exata por produto e NCM. NCM é normalizado para 8 dígitos.

#### `listValidacaoNcmByNcm(ncm, limit)`
- **Parâmetros**:
  - `ncm` – string (8 dígitos)
  - `limit` – number (default 50, máx 100)
- **Retorno**: `Promise<Array<{ produto, ncm, resultado, detalhe }>>`
- **Descrição**: Lista validações cadastradas para um NCM. Ordenado por produto. Usado para "produtos já validados para este NCM".

#### `listValidacaoNcmSimByProduto(produto)`
- **Parâmetros**: `produto` – string
- **Retorno**: `Promise<Array<{ produto, ncm, resultado, detalhe }>>`
- **Descrição**: Lista validações com resultado 'sim' cujo produto começa com as 2 primeiras palavras do parâmetro. Usado na conferência de planilha. Limite 50.

#### `listValidacaoNcmAll(limit, offset)`
- **Parâmetros**:
  - `limit` – number (default 100, máx 500)
  - `offset` – number (0-based)
- **Retorno**: `Promise<Array | { data: [], error }>`
- **Descrição**: Lista todas as validações com paginação. Ordenado por produto, ncm. Usado na aba "Banco cadastrado".

---

### 2.4 Utilitários Internos (expostos)

#### `normalizarNcm8(ncm)`
- **Parâmetros**: `ncm` – string ou null
- **Retorno**: `string`
- **Descrição**: Remove não-dígitos, preenche com zeros à esquerda até 8 dígitos. Retorna '' se inválido.

#### `primeirasDuasPalavras(texto)`
- **Parâmetros**: `texto` – string
- **Retorno**: `string`
- **Descrição**: Retorna as 2 primeiras palavras do texto (para match de produto na conferência).

---

## 3. Estrutura da Tabela system_data

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| key | text (PK) | Chave (ex: 'users', 'contributors') |
| value | jsonb | Dados JSON |
| updated_at | timestamptz | Data de atualização |

Upsert com `onConflict: 'key'` para atualizar registros existentes.

---

## 4. Estrutura da Tabela validacao_ncm

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| produto | text | Nome do produto |
| ncm | text | Código NCM (8 dígitos) |
| resultado | text | 'sim', 'NAO', 'REVISAR', 'ERRO' |
| detalhe | text | Detalhe opcional |

Pode ser populada pelo script Python `correlacao_ncm.py`. Use a mesma URL e ANON_KEY do projeto Supabase.

---

## 5. Fluxo de Sincronização na Aplicação

1. **Ao carregar**: `supabaseSync.load()` para users, contributors, etc.
2. **Ao salvar**: `supabaseSync.save()` após alterações locais
3. **Sincronização periódica ou manual**: `supabaseSync.sync()` ou `syncAll()`
4. **Evento storage**: Outras abas/janelas podem disparar `window.addEventListener('storage', ...)` para reagir a mudanças locais

---

*Supabase – Chat UI Sercon*
