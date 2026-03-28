# Arquitetura do Chat UI Sercon

Visão geral da estrutura, fluxo de carregamento e dependências.

---

## 1. Diagrama de Estrutura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat UI Sercon                            │
├─────────────────────────────────────────────────────────────────┤
│  Interfaces                                                      │
│  ├── Operador (index.html) ──► operador-script.js (16.8k linhas)│
│  ├── Cliente (index.html)  ──► cliente-script.js (~3.5k linhas)  │
│  └── Público (vagas.html)  ──► vagas-script.js (~250 linhas)     │
├─────────────────────────────────────────────────────────────────┤
│  Módulos Compartilhados (src/shared/)                            │
│  ├── config.js      ──► Configurações globais                   │
│  ├── constants.js   ──► Constantes e padrões                    │
│  ├── utils.js       ──► Funções utilitárias                     │
│  └── supabase-sync.js ──► Sincronização Supabase                 │
├─────────────────────────────────────────────────────────────────┤
│  Módulo NCM (src/modules/ncm/)                                   │
│  ├── ncm-motor.js   ──► Busca por código NCM                    │
│  └── ncm-tabs.js    ──► UI: consulta, banco, planilha           │
├─────────────────────────────────────────────────────────────────┤
│  Dados (assets/data/)                                            │
│  ├── tabela-ncm.js  ──► window.NCM_TABELA_DATA                  │
│  └── tabela-tipi.js ──► window.TIPI_TABELA_DATA                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Fluxo de Carregamento

### 2.1 Operador (index.html)

```
1. HTML carrega:
   - config.js
   - constants.js
   - utils.js
   - supabase-sync.js
   - SheetJS (xlsx)
   - operador-style.css

2. Body carrega (ordem):
   - operador-script.js
   - tabela-ncm.js
   - tabela-tipi.js
   - ncm-motor.js
   - ncm-tabs.js

3. DOMContentLoaded:
   - ensureAdminUser()
   - initTheme() (tema claro/escuro)
   - initSidebarTooltipBar()
   - Login Dominium
   - Contributor Onboarding
   - Admin (usuários, contribuintes, recrutamento)
   - Tax Agenda
   - Scheduled Message (relatório)
   - NCM (via ncm-tabs.js)
   - Job Management
   - Chat (suporte + interno)
```

### 2.2 Cliente (index.html)

```
1. config.js → constants.js → utils.js → supabase-sync.js
2. cliente-script.js
3. DOMContentLoaded: login, chat suporte, NCM (se disponível)
```

### 2.3 Público (vagas.html)

```
1. vagas-script.js (standalone)
2. Carrega vagas de localStorage (publishedJobs)
3. Exibe listagem e permite candidatura
```

---

## 3. Armazenamento de Dados

### 3.1 localStorage

| Chave | Conteúdo |
|-------|----------|
| `users` | Array de usuários (username, passwordHash, sector, role, etc.) |
| `contributors` | Array de contribuintes (CNPJ, razão social, endereço, etc.) |
| `contributorContacts` | Mapeamento contribuinte → contatos |
| `contributorEmployees` | Mapeamento contribuinte → funcionários |
| `supportMessages` | Objeto { chatId: [mensagens] } |
| `internalMessages` | Objeto { chatId: [mensagens] } |
| `currentUser` | Usuário logado (objeto) |
| `tasks` | Array de tarefas/lembretes |
| `recruitmentRequests` | Solicitações de recrutamento |
| `publishedJobs` | Vagas publicadas |
| `operador-theme` | 'light' ou 'dark' |
| `savedUsername`, `savedPassword` | Credenciais (se "lembrar") |

### 3.2 Supabase

- **Tabela system_data**: `key` (string), `value` (JSONB), `updated_at`
- **Tabela validacao_ncm**: `produto`, `ncm`, `resultado`, `detalhe`

Sincronização: `supabaseSync.save()`, `supabaseSync.load()`, `supabaseSync.sync()`.

---

## 4. Padrões de ID de Chat

| Padrão | Formato | Exemplo |
|--------|---------|---------|
| Contribuinte | `chat_contributor_{id}` | chat_contributor_abc123 |
| Funcionário | `chat_contributor_{contribId}_employee_{empId}` | chat_contributor_abc_employee_xyz |
| Contato | `chat_contact_{id}` | chat_contact_xyz |
| Interno | `internal_{user1}_{user2}` | internal_maria_joao |

---

## 5. Fluxo de Autenticação

```
1. Usuário acessa index.html
2. checkAuthentication() verifica currentUser
3. Se não autenticado: exibe #dominium-login
4. Login: loginUser(username, password)
   - Valida usuário em getUsersFromStorage()
   - Compara hash com hashPassword()
   - Se contribuinte com mustResetPassword: showContributorOnboarding()
   - Senão: salva currentUser, oculta login, exibe chat-app
5. Logout: logoutUser() → remove currentUser, reload
```

---

## 6. Dependências entre Arquivos

```
operador-script.js
├── config.js (CONFIG)
├── constants.js (CONSTANTS)
├── utils.js (parcialmente duplicado internamente)
├── supabase-sync.js (supabaseSync)
├── window.NCM_TABELA_DATA (tabela-ncm.js)
├── window.TIPI_TABELA_DATA (tabela-tipi.js)
├── window.ncmMotor (ncm-motor.js)
└── Lottie, jsPDF, html2canvas, SheetJS (CDN)
```

---

## 7. Seções da Interface Operador

| data-section | Descrição |
|--------------|-----------|
| `chat` | Chat com contribuintes/contatos |
| `internal-chat` | Chat entre operadores |
| `admin` | Painel administrativo |
| `tax-agenda` | Calendário e lembretes |
| `scheduled-message` | Relatório de conversas |
| `ncm` | Consulta NCM |
| `job-management` | Gerenciamento de vagas |

---

*Arquitetura – Chat UI Sercon*
