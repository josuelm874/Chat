# Chat UI – Sercon

Aplicação web (Chat, Suporte, Vagas, NCM) com integração Supabase.

## Interfaces e público-alvo

| Interface | Caminho | Público | Descrição |
|-----------|---------|---------|-----------|
| **Operador** | `src/operador/index.html` | Operadores internos | Chat, NCM, vagas, relatórios, tarefas |
| **Cliente** | `src/cliente/index.html` | Clientes do sistema | Painel de suporte, NCM, recrutamento |
| **Público** | `src/publico/vagas.html` | Público externo | Listagem de vagas e candidatura |

Cada interface tem seu **boot** (splash screen):
- Operador: `src/operador/boot.html` → redireciona para `index.html`
- Cliente: `src/cliente/boot.html` → redireciona para `index.html`

## Como rodar

Servir via HTTP na raiz do projeto e abrir a interface desejada.

Exemplo: `npx serve .`

## Módulo NCM

**Consulta de NCM**: digite um código NCM (8 dígitos) para verificar vigência, descrições hierárquicas (2, 4, 6 e 8 dígitos) e dados TIPI (Redução de Alíquota, CST, Classificação Tributária). Usa `tabela-ncm.js` e `tabela-tipi.js`.

---

## Estrutura do projeto

```
Chat UI/
├── assets/
│   ├── data/                    # Dados de runtime (JS carregados pelo HTML)
│   │   ├── tabela-ncm.js       # window.NCM_TABELA_DATA
│   │   └── tabela-tipi.js      # window.TIPI_TABELA_DATA
│   └── images/
│       ├── avatars/             # Avatares de perfil
│       │   └── profile-1.png
│       └── branding/            # Logos
│           ├── logo.png
│           └── Sercon.png
├── data/                        # Fontes/origem dos dados (JSON)
│   ├── tabela-ncm.json
│   └── tabela-tipi.json
├── src/
│   ├── shared/                  # Módulos compartilhados
│   │   ├── config.js
│   │   ├── constants.js
│   │   ├── utils.js
│   │   └── supabase-sync.js
│   ├── operador/                # Interface dos operadores
│   │   ├── index.html
│   │   ├── operador-script.js
│   │   ├── operador-style.css
│   │   ├── boot.html
│   │   ├── boot-script.js
│   │   └── boot-style.css
│   ├── cliente/                 # Interface dos clientes
│   │   ├── index.html
│   │   ├── cliente-script.js
│   │   ├── cliente-style.css
│   │   ├── boot.html
│   │   ├── boot-script.js
│   │   └── boot-style.css
│   ├── publico/                 # Páginas públicas
│   │   └── vagas.html
│   └── modules/                 # Módulos reutilizáveis
│       └── ncm/
│           ├── ncm-motor.js
│           └── ncm-tabs.js
└── README.md
```

---

## Detalhes dos arquivos

### assets/data/ — Dados de runtime

| Arquivo | Descrição |
|---------|-----------|
| `tabela-ncm.js` | Tabela NCM (`window.NCM_TABELA_DATA`) |
| `tabela-tipi.js` | Tabela TIPI (`window.TIPI_TABELA_DATA`) |

### data/ — Fontes JSON

| Arquivo | Descrição |
|---------|-----------|
| `tabela-ncm.json` | Fonte JSON da tabela NCM |
| `tabela-tipi.json` | Fonte JSON da tabela TIPI |

### src/shared/ — Compartilhado

| Arquivo | Descrição |
|---------|-----------|
| `config.js` | Configurações centralizadas (Supabase, APIs, limites) |
| `constants.js` | Constantes da aplicação |
| `utils.js` | Utilitários (debounce, formatação, etc.) |
| `supabase-sync.js` | Sincronização com Supabase |

### src/operador/ — Operadores

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Interface principal (chat, NCM, vagas, relatórios) |
| `operador-script.js` | Lógica do painel do operador |
| `operador-style.css` | Estilos do painel do operador |
| `boot.html` | Splash screen → redireciona para index.html |
| `boot-script.js` | Lógica do boot |
| `boot-style.css` | Estilos do boot |

### src/cliente/ — Clientes

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Interface de suporte (chat, NCM, recrutamento) |
| `cliente-script.js` | Lógica do painel do cliente |
| `cliente-style.css` | Estilos do painel do cliente |
| `boot.html` | Splash screen → redireciona para index.html |
| `boot-script.js` | Lógica do boot |
| `boot-style.css` | Estilos do boot |

### src/publico/ — Público

| Arquivo | Descrição |
|---------|-----------|
| `vagas.html` | Listagem pública de vagas e candidatura |

### src/modules/ncm/ — Módulo NCM

| Arquivo | Descrição |
|---------|-----------|
| `ncm-motor.js` | Motor de busca por código NCM |
| `ncm-tabs.js` | Interface da consulta NCM + TIPI |

---

## Fluxo de carregamento

### Operador
1. `index.html` carrega: `config.js` → `constants.js` → `utils.js` → `supabase-sync.js`
2. NCM: `tabela-ncm.js` → `tabela-tipi.js` → `ncm-motor.js` → `ncm-tabs.js`
3. Imagens: `../../assets/images/...`

### Cliente
1. `index.html` carrega: `config.js` → `constants.js` → `utils.js` → `supabase-sync.js`
2. Imagens: `../../assets/images/...`
