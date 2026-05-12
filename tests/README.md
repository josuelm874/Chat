# Agente de Testes — Chat UI Soft Tech

Suíte de testes E2E (end-to-end) usando **Playwright** que cobre todas as funcionalidades do sistema.

## Cobertura de Testes

| Spec | O que testa |
|------|------------|
| `01-auth` | Login do operador, cliente, erro de credenciais, logout, redirecionamentos |
| `02-mensagens` | Lista de contatos, campo de mensagem (#messageInput), envio cliente→op, resposta op→cliente, exibição na UI, mensagem vazia, botão de enviar (#sendButton) |
| `03-arquivos` | Botão de anexo (#attachButton), input de arquivo (#fileInput), rejeição >10MB, preview |
| `04-funcionalidades` | Emoji picker (#emojiButton/#emojiPanel), busca unificada (#contactsUnifiedSearch), busca no chat (#chatSearchBtn), navegação entre seções, badge não lidas, tema claro/escuro |
| `05-vagas` | Página pública de vagas, filtros, modal de detalhes, formulário de candidatura, PDF >5MB |
| `06-chat-interno` | Chat entre operadores, área de mensagens (#chatMessagesOp), perfil do contato, agenda, erros JS críticos |

**Total: ~42 casos de teste**

## Assertivas Duras vs. Suaves

Todos os testes críticos agora usam `await expect(el).toBeVisible()` em vez de
`if (await el.isVisible())` — o que significa que **falham claramente** quando um
elemento obrigatório estiver ausente, em vez de pular silenciosamente.

## IDs Estáveis Adicionados

Os seguintes IDs foram adicionados ao HTML para garantir seletores confiáveis:

| Elemento | ID | Página |
|----------|----|--------|
| Campo de mensagem | `#messageInput` | Cliente e Operador |
| Botão de enviar | `#sendButton` | Operador |
| Área de mensagens | `#chatMessagesOp` | Operador |
| Lista de contatos | `#contactsList` | Operador |

## Como Rodar

### Primeira vez (instala tudo):
```
tests\instalar-e-rodar.bat
```

### Rodar novamente (após instalação):
```
tests\rodar-testes.bat
```

### Rodar spec específico:
```
npx playwright test tests/specs/02-mensagens.spec.js
```

### Modo UI interativo (ver passo a passo):
```
npm run test:ui
```

## Relatório

Após cada execução o relatório HTML é gerado em `tests/report/`.  
Abrir manualmente: `npm run test:report`

## Estrutura

```
tests/
├── helpers/
│   └── seed.js          ← injeta dados de teste no localStorage (bypass de login)
├── specs/
│   ├── 01-auth.spec.js
│   ├── 02-mensagens.spec.js
│   ├── 03-arquivos.spec.js
│   ├── 04-funcionalidades.spec.js
│   ├── 05-vagas.spec.js
│   └── 06-chat-interno.spec.js
├── tmp/                 ← arquivos temporários gerados pelos testes
├── report/              ← relatório HTML (gerado automaticamente)
├── instalar-e-rodar.bat
├── rodar-testes.bat
└── README.md
playwright.config.js     ← configuração principal
```

## Notas

- Os testes rodam com **headless: false** — o browser fica visível para acompanhar
- O servidor local sobe automaticamente na porta **9876**
- Os testes usam o mesmo localStorage que o app real — a comunicação cliente↔operador é real
- Dados de teste são limpos após cada spec (não afetam dados reais)
- O relatório HTML indica exatamente qual teste falhou, a linha do erro e um screenshot automático
