# Regras Gerais para Interpretação do Sistema Harmonizado (RGI)

O motor de busca NCM considera as **Regras Gerais para Interpretação do Sistema Harmonizado** ao ranquear e ao sugerir NCMs. Resumo e uso no sistema. Para o fluxo completo de decisão (normalização, match, score, filtros, fallback, correlação), ver **`NCM-ESTRUTURA-DECISAO.md`**.

---

## Regras 1 a 6 (síntese)

| Regra | Conteúdo |
|-------|----------|
| **1** | Os títulos de Seções, Capítulos e Subcapítulos têm **valor apenas indicativo**. A classificação é determinada pelos **textos das posições** e das **Notas de Seção e de Capítulo**, e, quando não contrário a esses textos, pelas Regras 2 a 5. |
| **2a** | Referência a um **artigo** inclui o artigo **incompleto ou inacabado** (se tiver características essenciais do acabado) e o **desmontado ou por montar**. |
| **2b** | Referência a uma **matéria** inclui a matéria **pura ou misturada**; obras dessa matéria incluem as **inteira ou parcialmente** constituídas por ela. Mistos/compostos → Regra 3. |
| **3a** | A **posição mais específica** prevalece sobre as mais genéricas. |
| **3b** | **Produtos misturados**, **obras compostas** ou **sortidos** → classificar pela **matéria ou artigo que confira a característica essencial**, quando for possível determiná-la. |
| **3c** | Se 3a e 3b não resolverem → classificar na posição **em último lugar na ordem numérica** entre as que possam ser consideradas. |
| **4** | Mercadorias não classificáveis pelas Regras 1–3 → posição dos **artigos mais semelhantes**. |
| **5a** | **Estojos** (câmeras, instrumentos, armas, etc.) apresentados com o artigo → classificam **com o artigo**. |
| **5b** | **Embalagens** do tipo normalmente usado para o conteúdo → classificam **com as mercadorias** (salvo embalagens reutilizáveis). |
| **6** | Nas **subposições** de uma mesma posição, aplicam-se os textos das subposições e notas, e as regras anteriores *mutatis mutandis*; só se comparam subposições **do mesmo nível**. |

*(Fonte: classificação das mercadorias na Nomenclatura – IN RFB nº 2.169/2023.)*

---

## Uso no motor de busca

### Ordenação (desempate)

O ranqueamento dos resultados aplica critérios inspirados nas RGI:

1. **Score** (relevância do match) – maior primeiro.
2. **`hits8`** – mais matches na descrição de 8 dígitos primeiro.
3. **Cobertura** – todos os termos da busca casando primeiro.
4. **RGI 3a – Especificidade:** em empate, prioriza a **descrição de 8 dígitos mais longa** (proxy para “posição mais específica”).
5. **RGI 3c – Último na ordem numérica:** persistindo o empate, prioriza o **código NCM maior** (último na ordem numérica).

### Fallback (0 resultados)

Quando a busca normal retorna **0 resultados** e existe **chapter hint** (capítulo sugerido pelo termo):

- Os tokens da busca são expandidos com **sinônimos** (`QUERY_SYNONYMS`).
- É feita nova busca **apenas no capítulo sugerido**.

Isso aproxima a **RGI 4** (artigos mais semelhantes), ao restringir a buscas no mesmo capítulo e por termos relacionados.

### Recomendações para o usuário

- **Produtos mistos/compostos (RGI 3b):** buscar pelo **componente que confere a característica essencial** (ex.: “arroz com temperos” → “arroz”).
- **Títulos apenas indicativos (RGI 1):** não confiar só no título do capítulo; usar a **descrição da posição/subposição** (ex.: textos dos boxes 4, 6 e 8 dígitos).
- **Embalagens/estojos (RGI 5):** em princípio classificam **com o conteúdo**; a busca por “produto + embalagem” pode ser feita pelo **produto** principal.

---

## Referência

O texto completo das Regras e Notas Explicativas está em “classificação das mercadorias na Nomenclatura” (IN RFB nº 2.169/2023). Este resumo serve apenas para orientar o uso do motor de busca NCM no Chat UI.
