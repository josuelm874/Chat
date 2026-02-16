# Chat UI – Sercon

Aplicação web (Chat, Suporte, Vagas, NCM) com integração Supabase.

## Estrutura

Consulte **[ESTRUTURA.md](ESTRUTURA.md)** para a documentação completa pasta a pasta e arquivo por arquivo.

```
Chat UI/
├── assets/images/     # branding, avatars
├── docs/NCM/          # Tabela NCM e TIPI (data/, fontes/)
└── src/
    ├── client/        # boot.html, Chat.html (entradas)
    ├── core/          # config, constants, utils, supabase-sync
    ├── modules/
    │   ├── ncm/       # ncm-motor, ncm-sercon-tabs
    │   └── suporte/   # Suporte.html, boot-suporte
    └── pages/         # vagas-publicas.html
```

## Como rodar

Servir via HTTP na raiz do projeto e abrir:

- `src/client/boot.html` – tela de carregamento
- `src/client/Chat.html` – aplicação principal

Exemplo: `npx serve .`

## Módulo NCM

**Consulta de NCM**: digite um código NCM (8 dígitos) para verificar vigência, descrições hierárquicas (2, 4, 6 e 8 dígitos) e dados TIPI (Redução de Alíquota, CST, Classificação Tributária). Usa `Tabela_NCM.js` e `Tabela_TIPI.js`.
