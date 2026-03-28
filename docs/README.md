# Chat UI Sercon – Documentação Técnica Completa

Documentação detalhada do sistema de Chat, Suporte, Vagas e NCM da Sercon.

---

## Índice da Documentação

| Documento | Descrição |
|-----------|-----------|
| [**Arquitetura**](./ARCHITECTURE.md) | Visão geral, fluxo de carregamento, estrutura de pastas |
| [**Módulos Compartilhados**](./SHARED.md) | config.js, constants.js, utils.js – cada função documentada |
| [**Supabase**](./SUPABASE.md) | Sincronização, validação NCM, API completa |
| [**Módulo NCM**](./NCM.md) | ncm-motor.js, ncm-tabs.js – consulta e conferência |
| [**Interface Operador**](./OPERADOR.md) | operador-script.js – todas as funções e seções |
| [**Interface Cliente**](./CLIENTE.md) | cliente-script.js – painel de suporte |
| [**Interface Público**](./PUBLICO.md) | vagas.html, vagas-script.js – vagas públicas |
| [**Configuração**](./CONFIG.md) | CONFIG, CONSTANTS, variáveis de ambiente |
| [**Design System**](./DESIGN_SYSTEM.md) | Tokens, temas, componentes visuais |
| [**Changelog**](./CHANGELOG.md) | Registro de alterações |

---

## Manter a documentação atualizada

Ao modificar o código, atualize a documentação correspondente:

- **config.js, constants.js, utils.js** → `SHARED.md`, `CONFIG.md`
- **supabase-sync.js** → `SUPABASE.md`
- **ncm-motor.js, ncm-tabs.js** → `NCM.md`
- **operador-script.js** → `OPERADOR.md`
- **cliente-script.js** → `CLIENTE.md`
- **vagas-script.js** → `PUBLICO.md`
- **Estilos, tokens** → `DESIGN_SYSTEM.md`
- **Estrutura, fluxos** → `ARCHITECTURE.md`

Regra do Cursor em `.cursor/rules/documentation.mdc` orienta o assistente a manter a documentação sincronizada.

---

## Visão Geral do Sistema

O **Chat UI Sercon** é uma aplicação web que oferece:

- **Chat de Suporte**: comunicação entre operadores e clientes (contribuintes)
- **Chat Interno**: mensagens entre operadores
- **Painel Admin**: gestão de usuários, contribuintes e solicitações de recrutamento
- **Tax Agenda**: calendário fiscal, lembretes e vencimentos tributários
- **Relatório de Conversas**: exportação de histórico em PDF
- **Consulta NCM**: busca por código NCM, conferência de planilhas
- **Gerenciamento de Vagas**: aprovação, publicação e candidaturas

### Interfaces e Público-Alvo

| Interface | Caminho | Público |
|-----------|---------|---------|
| **Operador** | `src/operador/index.html` | Operadores internos |
| **Cliente** | `src/cliente/index.html` | Clientes (contribuintes) |
| **Público** | `src/publico/vagas.html` | Visitantes externos |

---

## Como Rodar

```bash
# Na raiz do projeto
npx serve .
```

Acesse:
- Operador: `http://localhost:3000/src/operador/index.html`
- Cliente: `http://localhost:3000/src/cliente/index.html`
- Vagas: `http://localhost:3000/src/publico/vagas.html`

---

## Dependências Externas

- **Google Fonts** (Inter, Noto Color Emoji)
- **Boxicons** (ícones)
- **Lottie Web** (animações de emoji)
- **jsPDF** (geração de PDF)
- **html2canvas** (captura de tela)
- **SheetJS (xlsx)** (leitura/escrita Excel)
- **Supabase JS** (carregado dinamicamente)

---

## Estrutura de Arquivos

```
Chat UI/
├── docs/                    # Esta documentação
├── assets/data/             # tabela-ncm.js, tabela-tipi.js
├── data/                    # JSON fonte (tabela-ncm.json, tabela-tipi.json)
├── src/
│   ├── shared/              # config, constants, utils, supabase-sync
│   ├── operador/            # Interface operador
│   ├── cliente/             # Interface cliente
│   ├── publico/             # Vagas públicas
│   └── modules/ncm/         # ncm-motor, ncm-tabs
└── README.md
```

---

*Última atualização: Março 2025*
