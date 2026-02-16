# Estrutura do Chat UI – Sercon

Documentação da organização do projeto, pasta por pasta e arquivo por arquivo.

---

## Visão geral

```
Chat UI/
├── assets/           # Recursos estáticos (imagens, ícones)
├── docs/             # Documentação e dados de referência (NCM)
├── src/              # Código-fonte da aplicação
├── .gitignore
├── ESTRUTURA.md      # Este documento
└── README.md
```

---

## assets/

Recursos estáticos usados em toda a aplicação.

```
assets/
└── images/
    ├── avatars/      # Imagens de perfil de usuários
    │   └── profile-1.png
    └── branding/     # Logotipos e marca
        ├── logo.png
        └── Sercon.png
```

| Arquivo | Descrição |
|---------|-----------|
| `profile-1.png` | Avatar padrão de usuário |
| `logo.png` | Logo genérica |
| `Sercon.png` | Logo da marca Sercon |

---

## docs/

Documentação e dados de referência fora do fluxo de build.

```
docs/
└── NCM/
    ├── data/         # Tabelas NCM e TIPI (formato JS, carregadas em runtime)
    │   ├── Tabela_NCM.js   # Nomenclatura Comum do Mercosul
    │   └── Tabela_TIPI.js  # Tabela de Incidência do IPI
    └── fontes/       # JSON de origem (fonte para geração dos .js)
        ├── Tabela_NCM.json
        └── Tabela_TIPI.json
```

| Arquivo | Descrição |
|---------|-----------|
| `Tabela_NCM.js` | Tabela NCM em formato JavaScript (`window.NCM_TABELA_DATA`) |
| `Tabela_TIPI.js` | Tabela TIPI em formato JavaScript (`window.TIPI_TABELA_DATA`) |
| `Tabela_NCM.json` | Fonte JSON da tabela NCM |
| `Tabela_TIPI.json` | Fonte JSON da tabela TIPI |

---

## src/

Código-fonte da aplicação.

```
src/
├── client/           # Telas principais (entradas da aplicação)
├── core/             # Módulos compartilhados (config, utils, Supabase)
├── modules/          # Módulos de funcionalidade
│   ├── ncm/          # Consulta NCM por código
│   └── suporte/      # Painel de Suporte
└── pages/            # Páginas standalone
```

---

### src/client/

Ponto de entrada da aplicação: boot (splash) e Chat principal.

```
src/client/
├── boot.html         # Tela de inicialização/carregamento
├── boot-script.js    # Lógica do boot (redirect para Chat)
├── boot-style.css    # Estilos do boot
├── Chat.html         # Aplicação principal (Chat, NCM, Vagas, etc.)
├── Chat-script.js    # Lógica do Chat
└── Chat-style.css    # Estilos do Chat
```

| Arquivo | Descrição |
|---------|-----------|
| `boot.html` | Splash screen; redireciona para Chat após carregar |
| `boot-script.js` | Redirecionamento e lógica de boot |
| `boot-style.css` | Estilos da tela de boot |
| `Chat.html` | Interface principal: chat, NCM, gerenciamento de vagas |
| `Chat-script.js` | Lógica do chat, vagas, integração Supabase |
| `Chat-style.css` | Estilos da interface principal |

---

### src/core/

Módulos compartilhados usados por Chat e Suporte.

```
src/core/
├── config.js         # Configurações centralizadas
├── constants.js      # Constantes da aplicação
├── supabase-sync.js  # Sincronização com Supabase
└── utils.js          # Funções utilitárias
```

| Arquivo | Descrição |
|---------|-----------|
| `config.js` | `CONFIG` – limites de armazenamento, tamanhos de arquivo, timeouts |
| `constants.js` | Constantes gerais |
| `supabase-sync.js` | Sincronização de mensagens/contatos com Supabase |
| `utils.js` | Utilitários (debounce, formatação, etc.) |

---

### src/modules/

Módulos de funcionalidade específica.

#### src/modules/ncm/

Consulta NCM por código (Tabela NCM + TIPI).

```
src/modules/ncm/
├── ncm-motor.js      # Motor de busca por código
└── ncm-sercon-tabs.js# UI da consulta NCM
```

| Arquivo | Descrição |
|---------|-----------|
| `ncm-motor.js` | `buscarPorCodigo`, `formatNcm`, `getNcmsByChapter` – indexação e busca NCM |
| `ncm-sercon-tabs.js` | Interface de consulta, exibição de NCM + dados TIPI |

#### src/modules/suporte/

Painel de Suporte (interno).

```
src/modules/suporte/
├── Suporte.html      # Interface do painel de suporte
├── Suporte-script.js # Lógica do suporte
├── Suporte-style.css # Estilos do suporte
├── boot-suporte.html # Boot/entrada do suporte
├── boot-suporte-script.js
└── boot-suporte-style.css
```

| Arquivo | Descrição |
|---------|-----------|
| `Suporte.html` | Interface do painel de suporte (chat, NCM, recrutamento) |
| `Suporte-script.js` | Lógica do suporte |
| `Suporte-style.css` | Estilos do suporte |
| `boot-suporte.html` | Entrada do módulo de suporte |
| `boot-suporte-script.js` | Script do boot do suporte |
| `boot-suporte-style.css` | Estilos do boot do suporte |

---

### src/pages/

Páginas standalone acessíveis diretamente.

```
src/pages/
└── vagas-publicas.html   # Listagem pública de vagas
```

| Arquivo | Descrição |
|---------|-----------|
| `vagas-publicas.html` | Página pública de vagas de emprego |

---

## Fluxo de carregamento (Chat)

1. `Chat.html` carrega: `config.js` → `constants.js` → `utils.js` → `supabase-sync.js`
2. NCM: `Tabela_NCM.js` → `Tabela_TIPI.js` → `ncm-motor.js` → `ncm-sercon-tabs.js`
3. Imagens: `../../assets/images/...`

---

## Fluxo de carregamento (Suporte)

1. `Suporte.html` carrega os mesmos scripts `core/` (caminhos `../../core/`)
2. Imagens: `../../../assets/images/...`
