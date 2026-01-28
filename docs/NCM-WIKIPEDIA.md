# Wikipedia API – enriquecimento para busca NCM

A **Wikipedia API** (pt) é usada para **enriquecer** a descrição do produto com características obtidas da enciclopédia antes da busca NCM. **Sempre** em português (`pt.wikipedia.org`). **Gratuita**, sem chave.

---

## Onde é usada

| Recurso | Wikipedia |
|--------|-----------|
| **Consulta de Produto** | Sim, sempre |
| **Correlação de Produtos** | Sim, sempre |
| **Controle de Vencimentos** | Não (apenas JSON da tabela NCM) |

---

## Fluxo

1. Usuário informa o produto (digitação ou planilha).
2. O sistema chama a Wikipedia (Opensearch) com termo derivado do produto (pré-processado pelo motor, se disponível).
3. Extrai títulos e descrições dos resultados.
4. **Texto enriquecido** = produto original + características da Wikipedia.
5. Motor e IA (embeddings + filtros) usam o texto enriquecido para buscar e sugerir NCMs.

---

## Implementação

- **Módulo**: `src/support/ncm-wikipedia.js`
- **API**: `https://pt.wikipedia.org/w/api.php?action=opensearch&search=...&limit=5&format=json&origin=*`
- **Função**: `ncmWikipedia.enriquecerComWikipedia(produto)` → `Promise<{ textoEnriquecido, wikiUsado }>`
- Timeout de 8 s; em caso de falha, usa apenas o produto original.

---

## Limitações

- Wikipedia cobre principalmente termos genéricos e conhecidos. Produtos muito específicos ou marcas podem não retornar resultados.
- Depende de rede. Em falha, o fluxo segue sem enriquecimento.
