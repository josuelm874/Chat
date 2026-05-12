# Guia de Deploy — Chat UI Soft Tech
> Supabase (banco + tempo real) → GitHub → Vercel (hospedagem)

---

## PARTE 1 — Supabase

### 1.1 Criar conta e projeto

1. Acesse **https://supabase.com** e clique em **Start your project**
2. Faça login com GitHub ou e-mail
3. Clique em **New project**
4. Preencha:
   - **Organization**: sua organização (ou crie uma)
   - **Name**: `chat-ui-soft-tech`
   - **Database Password**: crie uma senha forte e **salve em lugar seguro**
   - **Region**: escolha `South America (São Paulo)` — menor latência no Brasil
5. Clique em **Create new project** e aguarde ~2 minutos

---

### 1.2 Criar as tabelas (SQL Editor)

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql` deste projeto
4. Cole todo o conteúdo no editor do Supabase
5. Clique em **Run** (▶️)
6. Você deve ver `Success. No rows returned` — isso é correto

> O script cria:
> - `system_data` — armazenamento principal (mensagens, usuários, etc.)
> - `validacao_ncm` — resultados do script Python NCM
> - Políticas RLS (segurança por linha)
> - Realtime habilitado na `system_data`
> - Trigger que atualiza `updated_at` automaticamente

---

### 1.3 Obter as chaves de API

1. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie os dois valores:

| Campo no Supabase | Onde usar |
|---|---|
| **Project URL** | `CONFIG.SUPABASE.URL` em `src/shared/config.js` |
| **anon public** | `CONFIG.SUPABASE.ANON_KEY` em `src/shared/config.js` |

> ⚠️ **NUNCA** copie a `service_role` key para o `config.js` — ela dá acesso irrestrito ao banco e ficaria pública no navegador.

---

### 1.4 Atualizar config.js

Abra `src/shared/config.js` e substitua os dois placeholders:

```js
SUPABASE: {
  URL: 'https://SEU-PROJETO.supabase.co',   // ← Project URL
  ANON_KEY: 'eyJhbGci...',                  // ← anon public (começa com eyJ)
  ...
}
```

---

### 1.5 Verificar conexão

1. Abra o app localmente (ou após o deploy)
2. Abra o Console do navegador (F12)
3. Você deve ver a mensagem:
   ```
   ✅ Supabase (Chat UI) inicializado com sucesso!
   ```
4. Se aparecer `⚠️ Supabase não configurado`, a ANON_KEY ainda está errada

---

### 1.6 (Opcional) Configurar Realtime para substituir polling

O Realtime já está habilitado pelo script SQL. Para ativar no app, o `supabase-sync.js` já possui a função `subscribeToKey(key, callback)`. Basta chamar ela após o init para receber atualizações instantâneas em vez de polling a cada 2s.

---

## PARTE 2 — GitHub

### 2.1 Subir o projeto para o GitHub

> Se você já tem Git instalado no computador, abra o terminal na pasta do projeto.

```bash
# Inicializar repositório (se ainda não existe)
git init
git add .
git commit -m "feat: setup inicial com Supabase e Vercel"

# Criar repositório no GitHub (github.com → New repository)
# Nome sugerido: chat-ui-soft-tech
# Visibilidade: Private (recomendado)

# Conectar e subir
git remote add origin https://github.com/SEU-USUARIO/chat-ui-soft-tech.git
git branch -M main
git push -u origin main
```

> **Importante:** o `.gitignore` já exclui `node_modules/`, `dist/`, e arquivos `.env`.
> A ANON_KEY fica no `config.js` que **vai** para o repositório — isso é aceitável porque
> a chave anon do Supabase é pública por design, protegida pelas políticas RLS.

---

## PARTE 3 — Vercel

### 3.1 Criar conta e conectar ao GitHub

1. Acesse **https://vercel.com** e clique em **Sign Up**
2. Escolha **Continue with GitHub** — isso vincula sua conta automaticamente
3. Autorize o acesso ao repositório

---

### 3.2 Importar o projeto

1. No dashboard do Vercel, clique em **Add New → Project**
2. Encontre o repositório `chat-ui-soft-tech` e clique em **Import**
3. Na tela de configuração:

| Campo | Valor |
|---|---|
| **Framework Preset** | Other |
| **Root Directory** | `.` (raiz do repositório) |
| **Build Command** | *(deixar vazio)* |
| **Output Directory** | `src` |
| **Install Command** | *(deixar vazio)* |

4. Clique em **Deploy**
5. Aguarde ~30 segundos

---

### 3.3 Acessar o app

Após o deploy, o Vercel fornece uma URL no formato:
```
https://chat-ui-soft-tech.vercel.app
```

As rotas disponíveis serão (configuradas no `vercel.json`):
- `/` → tela de login
- `/operador` → painel do operador
- `/cliente` → portal do cliente
- `/publico/vagas` → página pública de vagas

---

### 3.4 Deploy automático

A partir de agora, qualquer `git push` na branch `main` dispara um novo deploy automático no Vercel. Nenhuma ação manual necessária.

---

### 3.5 (Opcional) Domínio personalizado

1. No Vercel, vá em **Settings → Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex.: `app.softtech.com.br`)
4. Siga as instruções para configurar o DNS no seu provedor de domínio

---

## Resumo rápido

```
Supabase → criar projeto → rodar SQL → copiar URL + ANON_KEY
    ↓
config.js → colar URL e ANON_KEY
    ↓
GitHub → git init → git push
    ↓
Vercel → importar repositório → output: src → Deploy
```

---

## Arquivos criados por este setup

| Arquivo | Função |
|---|---|
| `supabase/migrations/001_initial_schema.sql` | Script de criação das tabelas, RLS e Realtime |
| `vercel.json` | Roteamento e headers de segurança para o Vercel |
| `.gitignore` | Exclui node_modules, dist, logs e segredos |
| `src/shared/config.js` | Configuração central (atualizar URL e ANON_KEY) |
| `src/shared/supabase-sync.js` | Sincronização localStorage ↔ Supabase (já funcional) |
