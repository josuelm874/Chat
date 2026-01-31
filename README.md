# Chat UI – Sercon

Aplicação web (Chat, Suporte, Vagas, NCM) com integração Supabase e motor de correlação NCM.

## Estrutura

```
Chat UI/
├── assets/images/     # logo.png, profile-1.png, Sercon.png
├── docs/NCM/          # Tabela_NCM.js, Tabela_TIPI.js, ncm-embeddings.json, planilhas-fonte
├── scripts/
│   ├── ncm/           # convert_ncm_to_json.py, generate-ncm-embeddings.mjs
│   └── tipi/          # tipi_xlsx_to_json.py
└── src/
    ├── client/        # boot, Chat
    ├── pages/         # vagas-publicas
    ├── shared/        # config, utils, supabase-sync
    └── support/       # Suporte, NCM (motor, embeddings, wikipedia, correlação)
```

## Como rodar

1. **Frontend**: servir via HTTP (ex.: `npx serve .` ou `python -m http.server`) e abrir `src/client/boot.html` ou `Chat.html`.

2. **Scripts** (atualizar dados):
   - NCM Excel → JSON: `python scripts/ncm/convert_ncm_to_json.py [planilha.xlsx]`
   - TIPI: `python scripts/tipi/tipi_xlsx_to_json.py` (usa `docs/NCM/Tabela TIPI.xlsx`)
   - Embeddings: `node scripts/ncm/generate-ncm-embeddings.mjs`
