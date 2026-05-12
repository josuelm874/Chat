# Chat UI — Soft Tech

> Sistema web de chat, suporte e gestão interna para escritórios contábeis e empresas de assessoria fiscal.

---

## Índice

1. [O que é este sistema](#1-o-que-é-este-sistema)
2. [Para quem é feito](#2-para-quem-é-feito)
3. [Como rodar o projeto](#3-como-rodar-o-projeto)
4. [Estrutura de arquivos](#4-estrutura-de-arquivos)
5. [Arquitetura e funcionamento](#5-arquitetura-e-funcionamento)
6. [Módulos e componentes](#6-módulos-e-componentes)
7. [Banco de dados — Supabase](#7-banco-de-dados--supabase)
8. [Tecnologias utilizadas](#8-tecnologias-utilizadas)
9. [Guia educativo — entenda cada parte](#9-guia-educativo--entenda-cada-parte)
10. [Como dar continuidade ao projeto](#10-como-dar-continuidade-ao-projeto)

---

## 1. O que é este sistema

O **Chat UI** é uma plataforma de comunicação interna desenvolvida para escritórios contábeis. Ele centraliza em um único lugar o atendimento a clientes (contribuintes), a comunicação entre operadores internos e ferramentas fiscais como a consulta de NCM.

**Em linguagem simples:** é um sistema de chat profissional feito sob medida, onde o escritório atende seus clientes, a equipe se comunica internamente, gerencia vagas de emprego e consulta classificações fiscais de produtos — tudo sem depender de WhatsApp, e-mail ou planilhas separadas.

### O que ele resolve

- Comunicação desorganizada entre escritório e clientes
- Falta de registro histórico de conversas
- Consultas fiscais (NCM/TIPI) feitas manualmente
- Gestão de vagas de emprego sem sistema centralizado
- Ausência de sincronização entre computadores da equipe

---

## 2. Para quem é feito

O sistema tem três perfis de usuário distintos:

| Perfil | Quem é | O que faz no sistema |
|--------|--------|-----------------------|
| **Operador** | Funcionários internos do escritório | Atende clientes, gerencia vagas, consulta NCM, vê relatórios |
| **Cliente (Contribuinte)** | Empresas/clientes do escritório | Envia mensagens de suporte, consulta NCM, candidata-se a vagas |
| **Público** | Qualquer pessoa | Visualiza vagas abertas e faz candidatura |

---

## 3. Como rodar o projeto

O projeto roda diretamente no navegador via servidor HTTP local. Não há backend próprio — o banco de dados é o Supabase.

### Pré-requisitos

- Node.js instalado (para o servidor local e o build)
- Conta no Supabase com o projeto configurado

### Passo a passo

```bash
# 1. Entrar na pasta do projeto
cd produtos/chat-ui

# 2. Instalar dependências de build (somente para minificação)
npm install

# 3. Servir o projeto localmente
npx serve .

# 4. Acessar no navegador:
# Operador:  http://localhost:3000/src/operador/boot.html
# Cliente:   http://localhost:3000/src/cliente/boot.html
# Público:   http://localhost:3000/src/publico/vagas.html
```

### Configurar o Supabase

Abra `src/shared/config.js` e preencha:

```javascript
SUPABASE: {
  URL: 'https://SEU-PROJETO.supabase.co',
  ANON_KEY: 'sua_chave_anonima_aqui'
}
```

### Gerar versão minificada (produção)

```bash
npm run build
# Saída em: dist/
```

---

## 4. Estrutura de arquivos

```
chat-ui/
│
├── src/                          # Código-fonte principal
│   ├── shared/                   # Módulos usados por todas as interfaces
│   │   ├── config.js             # Configurações globais (Supabase, limites, setores)
│   │   ├── constants.js          # Constantes da aplicação
│   │   ├── utils.js              # Funções auxiliares (debounce, formatação, etc.)
│   │   └── supabase-sync.js      # Toda a lógica de sincronização com Supabase
│   │
│   ├── operador/                 # Interface dos funcionários internos
│   │   ├── index.html            # Tela principal do operador
│   │   ├── operador-script.js    # Lógica completa (~16.800 linhas)
│   │   ├── operador-style.css    # Estilos visuais
│   │   ├── boot.html             # Tela de carregamento (splash screen)
│   │   ├── boot-script.js        # Lógica do splash
│   │   └── boot-style.css        # Estilos do splash
│   │
│   ├── cliente/                  # Interface dos contribuintes/clientes
│   │   ├── index.html            # Tela principal do cliente
│   │   ├── cliente-script.js     # Lógica (~3.500 linhas)
│   │   ├── cliente-style.css     # Estilos visuais
│   │   ├── boot.html             # Tela de carregamento
│   │   ├── boot-script.js        # Lógica do splash
│   │   └── boot-style.css        # Estilos do splash
│   │
│   ├── publico/                  # Páginas acessíveis sem login
│   │   ├── vagas.html            # Listagem pública de vagas
│   │   ├── vagas-script.js       # Lógica (~250 linhas)
│   │   └── vagas-style.css       # Estilos
│   │
│   └── modules/
│       └── ncm/                  # Módulo fiscal reutilizável
│           ├── ncm-motor.js      # Motor de busca por código NCM
│           └── ncm-tabs.js       # Interface das abas de consulta NCM
│
├── assets/
│   ├── data/                     # Dados carregados em runtime pelo HTML
│   │   ├── tabela-ncm.js         # Tabela NCM completa (window.NCM_TABELA_DATA)
│   │   └── tabela-tipi.js        # Tabela TIPI (window.TIPI_TABELA_DATA)
│   └── images/
│       ├── avatars/              # Fotos de perfil
│       └── branding/             # Logos e vídeos de marca
│
├── data/                         # Fontes JSON originais das tabelas fiscais
│   ├── tabela-ncm.json
│   └── tabela-tipi.json
│
├── dist/                         # Versão minificada para produção (gerado pelo build)
├── build.js                      # Script de build (minificação)
├── package.json                  # Dependências de build
└── PROJETO.md                    # Este arquivo
```

---

## 5. Arquitetura e funcionamento

### Visão geral

```
┌──────────────────────────────────────────────────┐
│                  INTERFACES                      │
│  ┌─────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │  Operador   │ │  Cliente   │ │   Público   │ │
│  │ (interna)   │ │(contribuinte│ │  (vagas)    │ │
│  └──────┬──────┘ └─────┬──────┘ └──────┬──────┘ │
└─────────┼──────────────┼───────────────┼─────────┘
          │              │               │
┌─────────▼──────────────▼───────────────▼─────────┐
│              MÓDULOS COMPARTILHADOS               │
│  config.js │ constants.js │ utils.js │ supabase  │
└─────────────────────────┬─────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
   ┌──────▼───────┐              ┌────────▼──────┐
   │  localStorage │              │   Supabase    │
   │  (local/rápido│              │  (nuvem/sync) │
   └──────────────┘              └───────────────┘
```

### Fluxo de autenticação

```
1. Usuário acessa index.html
2. Sistema verifica se há usuário logado (currentUser no localStorage)
3. Se não logado → exibe tela de login (Dominium)
4. Login:
   - Busca usuário em localStorage → compara senha com hash
   - Se contribuinte com senha temporária → tela de troca de senha
   - Se ok → salva currentUser → exibe o painel principal
5. Logout → remove currentUser → recarrega página
```

### Sincronização de dados

O sistema usa uma estratégia híbrida: **localStorage para velocidade + Supabase para persistência entre computadores**.

```
Ao salvar:     localStorage ──► Supabase (cloud)
Ao carregar:   Supabase (cloud) ──► localStorage ──► tela
Ao sincronizar: compara timestamps → vence o mais recente
```

---

## 6. Módulos e componentes

### Interface do Operador — seções principais

| Seção | Descrição |
|-------|-----------|
| `chat` | Chat com contribuintes e contatos |
| `internal-chat` | Chat privado entre operadores |
| `admin` | Gerenciamento de usuários, contribuintes, recrutamento |
| `tax-agenda` | Calendário de obrigações fiscais |
| `scheduled-message` | Relatório exportável de conversas |
| `ncm` | Consulta de classificação fiscal |
| `job-management` | Publicação e gestão de vagas |

### Módulo NCM

O módulo NCM é o mais técnico do sistema. Ele funciona em duas camadas:

1. **Motor local** (`ncm-motor.js`): busca na tabela NCM completa carregada em memória. Retorna hierarquia do código (2, 4, 6 e 8 dígitos) e dados TIPI.
2. **Banco cadastrado** (`supabase-sync.js`): busca na tabela `validacao_ncm` do Supabase, que pode ser populada pelo script Python `correlacao_ncm.py`.

### Padrões de ID de chat

```
Contribuinte:       chat_contributor_{id}
Funcionário:        chat_contributor_{contribId}_employee_{empId}
Contato:            chat_contact_{id}
Chat interno:       internal_{usuario1}_{usuario2}
```

---

## 7. Banco de dados — Supabase

### Tabela `system_data` — sincronização geral

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `key` | text (PK) | Nome do dado (ex: "users", "contributors") |
| `value` | jsonb | Dados em JSON |
| `updated_at` | timestamptz | Data da última atualização |

### Tabela `validacao_ncm` — validação fiscal

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `produto` | text | Nome do produto |
| `ncm` | text | Código NCM (8 dígitos) |
| `resultado` | text | "sim", "NAO", "REVISAR" ou "ERRO" |
| `detalhe` | text | Observação adicional |

### Chaves salvas no localStorage

| Chave | Conteúdo |
|-------|----------|
| `users` | Usuários cadastrados |
| `contributors` | Contribuintes (clientes) |
| `contributorContacts` | Contatos dos contribuintes |
| `supportMessages` | Mensagens de suporte |
| `internalMessages` | Mensagens internas |
| `currentUser` | Usuário logado |
| `tasks` | Tarefas e lembretes |
| `recruitmentRequests` | Solicitações de recrutamento |
| `publishedJobs` | Vagas publicadas |

---

## 8. Tecnologias utilizadas

| Tecnologia | Função | Por que foi escolhida |
|------------|--------|-----------------------|
| HTML5 / CSS3 / JS Vanilla | Base do sistema | Sem dependência de frameworks, roda em qualquer navegador |
| Supabase | Banco de dados e sincronização | Gratuito, simples, funciona como backend sem precisar de servidor próprio |
| SheetJS (xlsx) | Exportar dados para Excel | Biblioteca madura para manipulação de planilhas no browser |
| jsPDF + html2canvas | Exportar relatórios em PDF | Permite gerar PDFs direto do HTML sem servidor |
| Boxicons | Ícones da interface | Leve, variado, fácil de usar via CDN |
| Lottie + Noto Emoji | Animações de emoji | Emojis animados de alta qualidade do Google |
| Terser + clean-css | Minificação para produção | Reduz tamanho dos arquivos para deploy |

---

## 9. Guia educativo — entenda cada parte

Esta seção explica os conceitos usados no sistema de forma simples, para quem está aprendendo.

### O que é localStorage?

O localStorage é um espaço de armazenamento que o navegador oferece para guardar dados localmente no computador do usuário. Funciona como um dicionário: você salva com uma chave e recupera pela mesma chave.

```javascript
// Salvar
localStorage.setItem('currentUser', JSON.stringify({ nome: 'João' }));

// Recuperar
const usuario = JSON.parse(localStorage.getItem('currentUser'));
```

**Limitação importante:** o localStorage é local. Se o usuário abrir em outro computador, os dados não estarão lá — por isso usamos o Supabase para sincronizar.

### O que é o Supabase?

O Supabase é um serviço de banco de dados na nuvem. Pense nele como um Google Sheets que você acessa via código. Você salva os dados lá, e qualquer computador com a chave certa consegue ler e escrever.

**Diferença prática:**
- `localStorage` = gaveta local do computador
- `Supabase` = pasta compartilhada na nuvem

### O que é hash de senha?

Quando o usuário cria uma senha, o sistema não salva a senha em texto puro (ex: "minhasenha123"). Ele passa por uma função matemática chamada **hash** que transforma a senha em um código irreversível (ex: "a3f7b9..."). No login, a senha digitada é hasheada novamente e comparada — se o hash for igual, a senha está correta.

**Por que isso é importante?** Se alguém roubar os dados do sistema, vai ver apenas os hashes, não as senhas reais.

### O que é polling?

O sistema verifica a cada 2 segundos se há novas mensagens. Essa técnica se chama **polling**: o navegador pergunta ao servidor repetidamente "tem novidade?". É simples mas funciona bem para sistemas de pequeno/médio porte.

```javascript
CONFIG.POLLING_INTERVAL = 2000; // verifica a cada 2 segundos
```

### O que são tokens CSS (Design System)?

Em vez de escrever cores diretamente no código (`#2563eb`), o sistema usa variáveis CSS chamadas de tokens:

```css
:root {
  --accent: #2563eb;
}

/* Uso em qualquer lugar */
.botao { background: var(--accent); }
```

**Vantagem:** para mudar a cor principal do sistema inteiro, basta alterar o valor de `--accent` em um lugar só.

### O que é NCM?

NCM significa **Nomenclatura Comum do Mercosul**. É um código de 8 dígitos usado para classificar produtos para fins fiscais/tributários no Brasil. Por exemplo, `01012100` classifica cavalos de raça. O sistema permite consultar esses códigos e cruzar com a tabela TIPI (que define alíquotas de IPI).

---

## 10. Como dar continuidade ao projeto

### Para um novo desenvolvedor começar

1. Leia este arquivo inteiro
2. Configure o Supabase em `src/shared/config.js`
3. Rode `npx serve .` na raiz e acesse `src/operador/boot.html`
4. O arquivo mais importante é `src/operador/operador-script.js` — toda a lógica do painel está lá
5. Para entender o fluxo, comece pela função `DOMContentLoaded` no fim do arquivo

### Próximos passos naturais para evolução

- Migrar de localStorage para Supabase como fonte primária (eliminar a duplicação)
- Adicionar notificações em tempo real com Supabase Realtime (substituir polling)
- Criar app mobile com as mesmas APIs
- Extrair o módulo NCM como biblioteca independente
- Adicionar testes automatizados

### Onde estão as configurações importantes

| O que alterar | Onde fica |
|---------------|-----------|
| URL e chave do Supabase | `src/shared/config.js` → `CONFIG.SUPABASE` |
| Setores do escritório | `src/shared/config.js` → `CONFIG.SECTORS` |
| Intervalo de verificação de mensagens | `src/shared/config.js` → `CONFIG.POLLING_INTERVAL` |
| Cores e visual | `src/operador/operador-style.css` → variáveis `:root` |
| Lógica do operador | `src/operador/operador-script.js` |
| Lógica do cliente | `src/cliente/cliente-script.js` |

---

*Documento gerado em maio de 2026 — Chat UI Soft Tech*
