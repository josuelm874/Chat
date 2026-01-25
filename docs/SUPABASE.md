# Configuração Supabase – Chat UI

O Chat UI usa **Supabase** para sincronizar dados entre múltiplos PCs (usuários, contribuintes, mensagens, tarefas, etc.).

## Credenciais

Configuradas em `src/shared/config.js`:

```js
CONFIG.SUPABASE = {
  URL: 'https://distsrgjhofvktcxgyub.supabase.co',
  ANON_KEY: 'sb_publishable_Sq8IRu0U3u22SzUz-bF8DQ_bZl-NvG6',
  TABLE_NAME: 'system_data'
}
```

- **URL**: projeto Supabase  
- **ANON_KEY**: chave pública (publishable)  
- **TABLE_NAME**: tabela onde os dados são armazenados (`system_data`)

## Tabela `system_data`

Crie a tabela no **Supabase Dashboard** → SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS system_data (
  id         SERIAL PRIMARY KEY,
  key        TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscas por key
CREATE INDEX IF NOT EXISTS idx_system_data_key ON system_data (key);

-- RLS (opcional): permitir leitura/escrita com anon key
ALTER TABLE system_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso anônimo para system_data"
  ON system_data FOR ALL
  USING (true)
  WITH CHECK (true);
```

Ajuste a policy conforme suas regras de segurança (RLS).

## Uso no código

O módulo `supabase-sync.js` expõe `window.supabaseSync`:

| Função | Descrição |
|--------|-----------|
| `supabaseSync.init()` | Inicializa o cliente Supabase |
| `supabaseSync.save(key, data)` | Salva no localStorage e na nuvem |
| `supabaseSync.load(key, defaultValue)` | Carrega da nuvem (ou localStorage como fallback) |
| `supabaseSync.sync(key)` | Sincroniza uma chave (compara timestamps) |
| `supabaseSync.syncAll(keys?)` | Sincroniza várias chaves (default: users, contributors, …) |
| `supabaseSync.refresh(key)` | Força recarregar do Supabase e atualiza o localStorage |
| `supabaseSync.isConfigured()` | Verifica se o Supabase está configurado |

## Chaves sincronizadas por padrão

- `users`
- `contributors`
- `contributorContacts`
- `contributorEmployees`
- `supportMessages`
- `internalMessages`
- `tasks`
- `recruitmentRequests`

## Fallback

Se o Supabase não estiver configurado ou houver falha de rede, o sistema usa **apenas localStorage**. Os dados continuam sendo salvos localmente.

## Onde o script é carregado

- `src/client/Chat.html`
- `src/support/Suporte.html`

Ambos carregam `supabase-sync.js` após `config.js` e `utils.js`.
