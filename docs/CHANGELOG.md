# Changelog – Chat UI Sercon

Registro de alterações do projeto. **Mantenha este arquivo atualizado** ao modificar o sistema.

---

## Formato

```
## [Versão] - YYYY-MM-DD

### Adicionado
- Novas funcionalidades

### Alterado
- Mudanças em funcionalidades existentes

### Corrigido
- Correções de bugs

### Removido
- Funcionalidades removidas
```

---

## [1.0.1] - 2025-03-08

### Removido
- Aba "Banco cadastrado" da consulta NCM (index.html e ncm-tabs.js)

---

## [1.0.0] - 2025-03-08

### Adicionado
- Documentação técnica completa em `docs/`
- README principal com índice
- ARCHITECTURE.md – arquitetura e fluxos
- SHARED.md – config, constants, utils
- SUPABASE.md – sincronização e validação NCM
- NCM.md – módulo NCM
- OPERADOR.md – interface operador (todas as funções)
- CLIENTE.md – interface cliente
- PUBLICO.md – interface público (vagas)
- CONFIG.md – configuração
- DESIGN_SYSTEM.md – tokens e componentes
- CHANGELOG.md – este arquivo

---

## Como manter a documentação atualizada

1. **Ao adicionar função**: documente em OPERADOR.md, CLIENTE.md ou SHARED.md conforme o arquivo
2. **Ao alterar config/constants**: atualize CONFIG.md e SHARED.md
3. **Ao modificar Supabase**: atualize SUPABASE.md
4. **Ao alterar NCM**: atualize NCM.md
5. **Ao mudar design**: atualize DESIGN_SYSTEM.md
6. **A cada release**: adicione entrada no CHANGELOG.md

---

*Chat UI Sercon*
