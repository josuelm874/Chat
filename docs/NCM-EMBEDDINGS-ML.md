# Embeddings e classificação automática – NCM

Este documento descreve o uso de **embeddings** e **classificação automática (ML)** para melhorar o reconhecimento de produtos mesmo com nomenclatura desconexa (termos que não aparecem na NCM, regionalismos, abreviações não mapeadas, etc.). **Não** usamos APIs externas de classificação; tudo roda localmente (Python ou Node para gerar vetores, browser para inferência).

---

## Como usar (resumo)

1. **Gerar `ncm-embeddings.json`** (uma vez):  
   `cd scripts/ncm && npm install && npm run generate-embeddings`  
   Ou, com Python: `pip install -r scripts/ncm/requirements.txt && python scripts/ncm/generate_ncm_embeddings.py`.
2. **Servir o app via HTTP** (não `file://`), para o `fetch` do JSON funcionar.
3. **Consulta de produto**: se o motor de regras retornar 0 resultados, o front chama automaticamente a busca por **similaridade** (embeddings) e exibe "Sugestões por similaridade (embeddings)".

---

## 1. Visão geral

| Camada | Função | Quando usar |
|--------|--------|-------------|
| **Motor base (regras)** | `ncm-motor.js`: normalização, KEYWORD_CHAPTER, QUERY_SYNONYMS, match por token, score, fallback. | Sempre. Primeira tentativa. |
| **Embeddings** | Representar descrições (produto e NCM) em vetores; buscar por **similaridade semântica**. | Fallback quando regras retornam 0 resultados; ou para enriquecer/reranquear. |
| **Classificação por exemplos (k-NN)** | Banco de exemplos `(descrição, NCM)`. Embeddas + k-NN; sugerir NCM dos vizinhos mais próximos. | Fallback adicional; ou quando há histórico de classificações (planilhas, XMLs). |

Ordem sugerida: **regras → embeddings (NCM) → k-NN (exemplos)**. Cada etapa pode devolver sugestões; o front exibe “Por regras”, “Por similaridade” e “Por exemplos” quando fizer sentido.

---

## 2. Embeddings

### 2.1 Ideia

- **Modelo**: encoder de sentenças (ex.: `paraphrase-multilingual-MiniLM-L12-v2`), que gera vetores densos para texto em português (e outros idiomas).
- **NCM**: para cada NCM de 8 dígitos, concatenamos `descricao4 + descricao6 + descricao8` (como no motor) e geramos um **embedding**. Resultado: arquivo `ncm-embeddings.json` com `{codigo, descricao, capitulo, embedding: [ floats ]}`.
- **Consulta**: o usuário digita a descrição do produto → embedding da query → **similaridade de cosseno** com todos os vetores NCM → top‑K NCMs mais similares.

Assim, mesmo que a descrição use palavras que não existem na NCM (ex.: “air fryer”, “pod”), o vetor pode ficar próximo de “aparelhos electrotérmicos”, “fritadeira”, etc., e sugerir cap. 85.

### 2.2 Geração dos vetores

**Opção A – Node (recomendado, mesmo modelo do browser)**

- **Script**: `scripts/ncm/generate-ncm-embeddings.mjs`.
- **Uso**: `cd scripts/ncm && npm install && npm run generate-embeddings`.
- **Entrada**: `docs/NCM/Tabela_NCM.json`.
- **Saída**: `docs/NCM/ncm-embeddings.json`.
- **Dependência**: `@xenova/transformers`. Modelo: `Xenova/paraphrase-multilingual-MiniLM-L12-v2`.

**Opção B – Python**

- **Script**: `scripts/ncm/generate_ncm_embeddings.py`.
- **Uso**: `pip install -r scripts/ncm/requirements.txt && python scripts/ncm/generate_ncm_embeddings.py`.
- **Modelo**: `paraphrase-multilingual-MiniLM-L12-v2` (sentence-transformers). Os vetores podem diferir ligeiramente do Node/browser; para máxima consistência, prefira a opção A.

Em ambos os casos, o script percorre a tabela, considera só itens de 8 dígitos, monta `descricaoCompleta` (4+6+8) e gera um embedding por NCM.

### 2.3 Uso no front (Transformers.js)

- **Biblioteca**: [Transformers.js](https://huggingface.co/docs/transformers.js) (Xenova), via CDN.
- **Modelo**: o mesmo `paraphrase-multilingual-MiniLM-L12-v2` (ou equivalente ONNX na família Xenova), para manter consistência com os vetores pré‑computados.
- **Módulo**: `src/support/ncm-embeddings.js`:
  - Carrega o modelo e o `ncm-embeddings.json`.
  - Expõe `sugerirNCMEmbeddings(descricao, limit)`:
    - Gera embedding da `descricao`.
    - Calcula similaridade de cosseno com cada NCM.
    - Retorna top‑K com `{codigo, descricao, capitulo, score}` (score = similaridade).

O primeiro uso faz o download do modelo (algumas dezenas de MB); depois fica em cache.

### 2.4 Integração com o motor

- Quando `ncmMotor.sugerirNCM` retorna **0 resultados**:
  - Chamar `sugerirNCMEmbeddings(descricao, limit)`.
  - Exibir uma seção “Sugestões por similaridade” com esses resultados.
- Opcional: **híbrido** — sempre rodar regras e embeddings; combinar rankings (ex.: média ponderada dos scores) ou mostrar as duas listas.

---

## 3. Classificação automática (ML) – por exemplos (k-NN)

### 3.1 Ideia

- Manter um **banco de exemplos** `(descrição do produto, NCM)`, por exemplo:
  - Curated: “arroz branco” → 1006.30.21, “refrigerante” → 2202.10.00, etc.
  - Ou gerado a partir de planilhas/XMLs já classificados.
- Cada exemplo vira um vetor (mesmo modelo de embeddings).
- Na busca: embedding da query → **k‑NN** nos exemplos → NCM(s) dos k vizinhos mais próximos (ex.: por média ou votação).

Isso funciona como “classificação por recuperação”: não treinamos um classificador discriminativo, mas usamos exemplos reais para sugerir NCM quando a descrição é parecida.

### 3.2 Dados

- **Arquivo**: `docs/NCM/ncm-examples.json` (ou equivalente), formato:  
  `[{ "descricao": "arroz branco tipo 1", "ncm": "10063021" }, ...]`
- **Fonte**:  
  - Manual: usuário ou especialista cadastra pares.  
  - Importação: abas “Correlação” / planilhas com colunas (produto, NCM).  
  - Exportar para `ncm-examples.json` e (re)gerar embeddings dos exemplos.

### 3.3 Geração dos embeddings dos exemplos

- **Script**: `scripts/ncm/generate_ncm_examples_embeddings.py` (ou extensão do `generate_ncm_embeddings.py`).
- Lê `ncm-examples.json`, gera um embedding por `descricao`, grava algo como `ncm-examples-embeddings.json` com `{descricao, ncm, embedding}`.

### 3.4 Uso no front

- O módulo de embeddings (ou um `ncm-knn-examples.js`) carrega `ncm-examples-embeddings.json`.
- Nova função `sugerirNCMPorExemplos(descricao, k, limit)`:
  - Embedda a query.
  - k‑NN nos exemplos.
  - Retorna NCM(s) sugeridos a partir dos vizinhos (ex.: top NCMs por frequência ou score médio), até `limit` itens.

### 3.5 Integração

- Pode ser usada como **terceiro estágio**: regras → embeddings (NCM) → k‑NN (exemplos).
- Ou apenas quando há exemplos e o usuário opta por “Buscar também por exemplos”.

---

## 4. Fluxo sugerido (resumo)

```
[Descrição do produto]
    → Motor (regras): sugerirNCM
    → Se 0 resultados (ou sempre, se híbrido):
        → Embeddings: sugerirNCMEmbeddings
    → Se ainda 0 ou “buscar por exemplos”:
        → k-NN em ncm-examples: sugerirNCMPorExemplos
    → Exibir: “Por regras” | “Por similaridade” | “Por exemplos”
```

---

## 5. Requisitos e arquivos

| Item | Descrição |
|------|-----------|
| **Python 3.8+** | Para scripts de geração. |
| **`sentence-transformers`** | Geração de embeddings (NCM e exemplos). |
| **Transformers.js (CDN)** | Inferência no browser. |
| **`ncm-embeddings.json`** | Gerado por `generate_ncm_embeddings.py`. |
| **`ncm-examples.json`** | Exemplos (descrição, NCM). Opcional. |
| **`ncm-examples-embeddings.json`** | Gerado a partir dos exemplos. Opcional. |

---

## 6. Limitações e pré-requisitos

- **Servir via HTTP**: o front faz `fetch` de `ncm-embeddings.json`. Abrir o app via `file://` pode bloquear. **Funciona** se o app estiver em HTTP/HTTPS, por exemplo:
  - **GitHub Pages** ou **Supabase** (site estático) apontando para o repositório;
  - servidor local (`npx serve`, etc.).
- **Arquivo no deploy**: inclua `docs/NCM/ncm-embeddings.json` no repositório e no deploy. O fetch usa caminho relativo ao HTML (`../../docs/NCM/ncm-embeddings.json`); a estrutura de pastas deve ser mantida.
- **Modelo em português**: funciona bem para PT; o MiniLM multilingue cobre outros idiomas.
- **Tamanho do JSON de NCM**: ~10k NCMs × 384 dims → dezenas de MB. Carregamento inicial pode demorar.
- **Primeira carga do modelo no browser**: download do ONNX na primeira busca por similaridade; depois fica em cache.
- **404 em `/models/...`**: por padrão o Transformers.js tenta carregar de `localModelPath` (`/models/`). Em deploy (GitHub/Supabase) isso vira mesmo-origem e dá 404. O `ncm-embeddings.js` define `env.allowLocalModels = false`, `env.localModelPath = ''` e `env.remoteHost = 'https://huggingface.co'` antes do `pipeline`, para forçar o carregamento sempre do Hugging Face.
- **k‑NN em exemplos**: qualidade depende da diversidade e correção dos exemplos.

---

## 7. Referências

- **Motor base**: `docs/NCM-ESTRUTURA-DECISAO.md`, `docs/NCM-BUSCA.md`, `docs/NCM-RGI.md`.
- **Transformers.js**: [transformers.js](https://huggingface.co/docs/transformers.js).
- **sentence-transformers**: [sentence-transformers](https://www.sbert.net/).

Com isso, **embeddings** e **classificação por exemplos (k-NN)** passam a complementar o motor de regras e melhoram o reconhecimento mesmo com nomenclatura desconexa, sem depender de APIs externas.
