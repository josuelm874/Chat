# Chat UI – Sercon

Aplicação web (Chat, Suporte, Vagas, NCM) com integração Supabase e motor de correlação NCM.

## Estrutura

```
Chat UI/
├── assets/
│   └── images/
│       ├── branding/   # logo, Sercon
│       └── avatars/    # profile-1, etc.
├── docs/
│   └── NCM/
│       ├── data/       # Tabela_NCM.js, Tabela_TIPI.js, ncm-embeddings.json
│       └── fontes/     # JSON intermediários
└── src/
    ├── client/     # boot.html, Chat.html (entrada principal)
    ├── core/       # config, constants, utils, supabase-sync
    ├── modules/
    │   ├── ncm/    # motor, sercon-tabs, correlacao, embeddings, wikipedia
    │   └── suporte/# Suporte.html, boot-suporte
    └── pages/      # vagas-publicas
```

## Como rodar

**Frontend**: servir via HTTP (ex.: `npx serve .` na raiz do projeto) e abrir `src/client/boot.html` ou `src/client/Chat.html`.

## Módulos NCM

- **Consulta de NCM**: busca por nome do produto (sugestões de NCM) ou por código NCM (vigência + TIPI).
- **Correlação de Produtos**: importa planilha, verifica NCMs.
