# Estrutura e tomada de decisão – assimilação Produto ↔ NCM

Este documento descreve a **estrutura** do motor NCM e o **fluxo de decisão** usado para assimilar produtos a NCMs (consulta e correlação). Ver também `NCM-RGI.md` e `NCM-BUSCA.md`.

---

## 1. Visão geral

```
[Descrição do produto]
    → preprocessProductDescription (remove 2UN, 350ML, 400G, KG, PROM+BAT, 0,01…)
    → normalização (+ filtro NOISE_TOKENS: prom, bat, predilecta…)
    → chapter hint (KEYWORD_CHAPTER)
    → runSearch(tokens, null)
    → [0 resultados?] → fallback: expandTokens + runSearch(expanded, chapter)
    → ordenação (score, hits8, cobertura, RGI 3a/3c)
    → sugestões NCM (8 dígitos) + boxes 4/6/8
```

**Correlação** (validar NCM informado para um produto): usa `sugerirNCM` e verifica se o código informado está nas sugestões ou no mesmo capítulo.

---

## 2. Estrutura de dados

### 2.1 Entrada

- **`NCM_TABELA_DATA`** (Tabela_NCM.js): árvore por níveis → capítulos → `ncms` (posições 4/6/8 dígitos com `codigo`, `descricao`).

### 2.2 Índice (`INDEX`)

- **`flattenNcmTable`** constrói uma lista só de **itens de 8 dígitos**.
- Cada item guarda:
  - `codigo` (8 dígitos, só números)
  - `descricao` (8 díg.)
  - `descricao4`, `descricao6` (subgrupos)
  - `descricaoCompleta` = `desc4 + desc6 + desc8`
  - `capitulo` (2 dígitos).

### 2.3 Camadas auxiliares

| Camada | Uso |
|--------|-----|
| **STOPWORDS** | Remove "de", "da", "em", etc. da normalização. |
| **NCM_GENERIC** | "outros", "outras", "demais" → penalidade 0,4 quando **todos** os matches são só esses termos. |
| **NCM_ALIASES** | Código 8 díg. → termos extras na busca (ex.: 22021000 ↔ "refrigerante"). |
| **QUERY_SYNONYMS** | Termo do produto → termos das NCMs; usado no **fallback**. |
| **KEYWORD_CHAPTER** | Termos → capítulo (2 díg.); gera **chapter hint** e restringe fallback. |
| **NOISE_TOKENS** | Tokens removidos na normalização (prom, bat, predilecta, etc.). |

---

## 3. Fluxo de decisão (passo a passo)

### 3.1 Pré-processamento e normalização do produto

1. **`preprocessProductDescription`**: remove da string original:
   - Quantidade + unidade: `2UN`, `350ML`, `400G`, `KG`, `12,5 LT`, etc.
   - Blocos de promo: `PROM+BAT`.
   - Decimais de preço: `0,01`.
   - Códigos de modelo: `PA1604-C`, `AB12345`, etc. (`[A-Z]{2}\d{4,}[-]?[A-Z0-9]*`).
   - Expande abreviações: `LIQ` → `liquido`, `ACHOC` → `achocolatado`.
2. **Normalização**: lowercase, NFD, remove acentos, deixa só `a-z0-9` e espaços.
3. Split em palavras; filtra: `length >= 3`, não está em **STOPWORDS** nem em **NOISE_TOKENS** (prom, bat, predilecta…).
4. Resultado: **`tokens`** (ex.: "2UN COCA COLA 350ML LATA PROM+BAT 0,01" → pré-processo → "COCA COLA LATA" → normalização elimina "prom"/"bat" via NOISE → `["coca","cola","lata"]`; "lata" não é NOISE, mas coca/cola + cap. 22 e NCM_ALIASES 2202 levam à bebida).

### 3.2 Chapter hint

1. Para cada capítulo em **KEYWORD_CHAPTER**, conta quantos `tokens` aparecem na lista.
2. Capítulo com **maior contagem** vira **`chapterHint`** (ex.: "arroz" → cap. 10).
3. Usado para: **bônus de score** (×1,2), **penalidade** em outro cap. (×0,88), **exclusão** 22/84, **fallback** restrito ao capítulo.

### 3.3 Busca principal (`runSearch(tokens, null)`)

Para cada item do **INDEX**:

1. **Normas**: `norm4` = `normalizeText(descricao4)`, idem `descricao6`; `norm8` = `normalizeText(descricao8 + NCM_ALIASES[codigo])`.
2. **Match por token**:
   - Só considera match quando **o termo da NCM contém o termo do produto** (nunca o contrário).
   - Exige **fronteira de palavra** (fim da palavra ou próximo caractere não alfanumérico); **plural em -s** é aceito (ex.: "bolacha" ↔ "bolachas").
   - Mínimo 3 caracteres por token.
3. **Contagens**: `hits4`, `hits6`, `hits8` = quantos tokens deram match em 4, 6 e 8 dígitos.
4. **Regras de exclusão**:
   - Nenhum token deu match → **exclui**.
   - `hits8 < 1` → **exclui** (obrigatório ter match no 8 dígitos).
   - **genericOnly** (todos os matches em NCM_GENERIC) → **penaliza** (×0,4), mas não exclui.
   - `chapterHint === '22'` e `capitulo === '84'` → **exclui** (refrigerante vs equipamento).
   - `score < 0.45` → **exclui**.
5. **Score**:
   - Por token: 0,15 (4 díg.) + 0,25 (6 díg.) + 0,6 (8 díg.); +0,15 se **match exato** no 8 díg.
   - `score = (soma dos pesos) / tokens.length` × bônus/penalidade de capítulo.
6. **Cobertura**: `tokenCoverage = tokensMatched / tokens.length`.

### 3.4 Ordenação (desempate)

Ordem de prioridade:

1. **Score** (maior primeiro).
2. **`hits8`** (maior primeiro).
3. **Cobertura** (maior primeiro).
4. **RGI 3a – Especificidade:** descrição 8 díg. **mais longa** primeiro.
5. **RGI 3c – Último na ordem numérica:** **código maior** primeiro.

### 3.5 Fallback (0 resultados)

1. Se **`results.length === 0`** e existe **`chapterHint`**.
2. **`expandTokens(tokens)`**: adiciona sinônimos de **QUERY_SYNONYMS** (e `localStorage`) aos tokens.
3. **`runSearch(expanded, chapterHint)`**: nova busca **só no capítulo** do hint.
4. Retorna esses resultados (aproximação da **RGI 4** – artigos mais semelhantes).

### 3.6 Correlação (NCM informado × produto)

1. Chama **`sugerirNCM(produto, { limit: 10 })`**.
2. **Encontrado**: NCM informado igual a alguma sugestão ou prefixo/subcódigo compatível (6+ dígitos).
3. **Mesmo capítulo**: pelo menos uma sugestão tem mesmo capítulo que o NCM informado.
4. **Decisão**:
   - `ok = true` → "NCM compatível com o produto."
   - `ok = false` e mesmo capítulo → "NCM em capítulo relacionado. Confira a descrição."
   - Caso contrário → "NCM pode não corresponder ao produto. Verifique as sugestões."

---

## 4. Resumo das decisões

| Decisão | Regra / efeito |
|--------|-----------------|
| Match só quando NCM contém termo do produto | Reduz falsos positivos (ex.: "cha" em "bolacha"). |
| Obrigatório `hits8 >= 1` | Garante que a **posição 8 díg.** descreve o produto. |
| Pesos 4 &lt; 6 &lt; 8 | Subgrupos **impactam**, mas o 8 díg. pesa mais. |
| Chapter hint ×1,2 / ×0,88 | Reforça capítulo coerente com o termo. |
| Exclusão 22/84 | Evita "refrigerador" para "refrigerante". |
| Score mínimo 0,45 | Corta matches muito fracos. |
| Generic-only ×0,4 | Reduz peso de matches só em "outros", "demais", etc. |
| Ordenação por especificidade e código | Alinha com **RGI 3a** e **3c**. |
| Fallback com sinônimos + capítulo | Aproxima **RGI 4** (mais semelhantes). |

---

## 5. Onde alterar o comportamento

- **Pré-processamento e ruído:** `preprocessProductDescription`, **NOISE_TOKENS**.
- **Tokens / stopwords:** `normalizeText`, **STOPWORDS**, **NCM_GENERIC**.
- **Capítulos:** **KEYWORD_CHAPTER**.
- **Aliases e sinônimos:** **NCM_ALIASES**, **QUERY_SYNONYMS**, `addQuerySynonym` / `localStorage`.
- **Match:** `matchToken`, `matchExact` (fronteira, plural).
- **Score e filtros:** `runSearch` (pesos, limites, exclusão 22/84, score mínimo).
- **Ordenação:** `runSearch` (sort).
- **Fallback:** `sugerirNCM` (expand + `runSearch` com `restrictChapter`).
- **Correlação:** `correlacionar` (uso das sugestões e mensagens).

---

## 6. Exemplos – como o motor entende “produtos reais”

Descrições típicas de ERP/PDV (quantidade, unidade, marca, promo) são pré-processadas e depois interpretadas assim:

| Descrição | Pré-processo | Tokens relevantes | Chapter hint | Interpretação |
|-----------|--------------|-------------------|--------------|---------------|
| **2UN COCA COLA 350ML LATA PROM+BAT 0,01** | Remove 2UN, 350ML, PROM+BAT, 0,01 | coca, cola, lata | 22 (coca, cola) | Bebida gaseificada/aromatizada. **NCM_ALIASES** 2202 inclui "coca cola"; **QUERY_SYNONYMS** coca/cola → gaseificada, aromatizada. Cap. 22. |
| **ABACATE KG** | Remove KG (ou fica filtrado len&lt;3) | abacate | 08 (abacate) | Fruta fresca. Match em "Abacates" (0804); plural -s aceito. |
| **ABACAXI EM CALDAS PREDILECTA 400G** | Remove 400G; "em" stopword; "predilecta" NOISE | abacaxi, caldas | 08 + 20 (abacaxi, calda) | "Abacaxis" em 08 (frescos) e 20 (conservas). "caldas" → **QUERY_SYNONYMS** calda/caldas → conserva, compota, edulcorada. Cap. 20 reforça **abacaxi em calda** → 2008. |

**Mais variações (abreviações, marcas, códigos):**

| Descrição | Pré-processo | Tokens relevantes | Chapter hint | Interpretação |
|-----------|--------------|-------------------|--------------|---------------|
| **ACEROLA PCT HR FRUTAS 500G** | Remove 500G; "pct","hr" NOISE ou filtrados | acerola, frutas | 08 (acerola, frutas) | Fruta. **KEYWORD_CHAPTER** 08/20: acerola, frutas. NCM 08.09 (acerola) ou 20 (suco/polpa). |
| **ACESSORIO CABELO MECHAS MOD 7 PA1604-C** | Remove códigos (PA1604-C); "mod" NOISE | acessorio, cabelo, mechas | 67 (cabelo, mechas, acessorio) | **KEYWORD_CHAPTER** 67: cabelo, mechas, acessorio. Obras de cabelo (67.03). **QUERY_SYNONYMS** mechas→madeixa, obras. |
| **ACETATO WOBBLER CONCURSO CULTURAL BIKE** | "concurso","cultural" NOISE | acetato, wobbler, bike | 39 (acetato) ou 87 (bike) | Display de acetato. **KEYWORD_CHAPTER** 39: acetato; 87: bike. Produto = plástico (39.16) ou contexto bike. Prioriza 39. |
| **ACETONA FARMAX 100ML** | Remove 100ML; "farmax" NOISE | acetona | 28 (acetona) | **KEYWORD_CHAPTER** 28: acetona, cetona. NCM 2914.11 (acetona). **QUERY_SYNONYMS** acetona→cetona, quimico. |
| **ACHOC LIQ BETAKIDS 200ML** | Remove 200ML; LIQ→liquido; ACHOC→achocolatado; "betakids" NOISE | achocolatado, liquido | 22 (achocolatado, liquido) | Bebida achocolatada. **KEYWORD_CHAPTER** 17/22: achoc, achocolatado; 22: liquido. Cap. 22. **QUERY_SYNONYMS** achoc/achocolatado→chocolate, cacau, bebida. |

Resumo: o motor **remove** qty/unidade, **expande** LIQ→liquido e ACHOC→achocolatado, **remove** códigos (ex.: PA1604-C), **filtra** ruído (prom, bat, marcas, pct, mod, concurso, cultural) e usa **KEYWORD_CHAPTER** + **QUERY_SYNONYMS** / **NCM_ALIASES** para capítulo e match. Para novos casos, ajustar pré-processo, NOISE, KEYWORD_CHAPTER e sinônimos.

Com isso, a **estrutura** e a **tomada de decisão** para assimilação produto ↔ NCM ficam explícitas e fáceis de ajustar.
