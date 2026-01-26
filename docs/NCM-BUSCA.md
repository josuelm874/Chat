# Busca NCM – precisão e sinônimos

## Quando o produto não encontra NCM

Às vezes a descrição oficial da NCM não usa a mesma palavra que o usuário (ex.: "refrigerante" vs "águas gaseificadas, aromatizadas"). O motor usa duas camadas para melhorar isso:

### 1. NCM_ALIASES (código)

No `ncm-motor.js`, `NCM_ALIASES` mapeia **código 8 dígitos → termos extras** usados na busca. Ex.:

- `22021000` → "refrigerante refresco bebida gaseificada aromatizada"
- `22029900` → "refrigerante refresco bebida não alcoólica"

Assim, ao buscar "refrigerante", esses códigos passam a ser encontrados.

### 2. QUERY_SYNONYMS + fallback

`QUERY_SYNONYMS` mapeia **termo de busca → termos que costumam aparecer nas NCMs**:

- `refrigerante` → gaseificada, aromatizada, bebida, edulcorantes
- `refresco` → gaseificada, aromatizada, bebida, não alcoólica
- `sorvete` → gelado, gelados, sorvetes, mantecados
- `detergente` → tensioativos, surfactantes, detergentes, lavagem
- `sabonete` → saboes, sabonetes, higiene, banho

**Fallback:** se a busca normal retorna **0 resultados** e existe **chapter hint** (capítulo sugerido pelo termo):

1. Os tokens da query são expandidos com os sinônimos.
2. Uma nova busca é feita **apenas no capítulo sugerido**.
3. Os resultados desse fallback são devolvidos.

Isso evita falsos positivos em outros capítulos e permite achar NCMs que usam outros termos.

### 3. Sinônimos customizáveis (localStorage)

Quando um produto novo não encontra NCM, é possível registrar sinônimos pelo JavaScript:

```js
// Adicionar sinônimos para "iogurte" (persiste em localStorage)
ncmMotor.addQuerySynonym('iogurte', ['leite fermentado', 'culturas lácteas']);

// Ver sinônimos atuais (built-in + custom)
ncmMotor.getQuerySynonyms();
```

Os customizados ficam em `localStorage` sob a chave `ncmQuerySynonyms` e são somados aos `QUERY_SYNONYMS` do código. Assim, cada ambiente pode corrigir buscas que falham sem alterar o motor.

### Como adicionar novo produto que não acha NCM

1. **Opção A – Alias no NCM (específico):**  
   Se souber o código exato, adicione em `NCM_ALIASES` no `ncm-motor.js`.

2. **Opção B – Sinônimos de busca (genérico):**  
   Adicione em `QUERY_SYNONYMS` no `ncm-motor.js` ou use `ncmMotor.addQuerySynonym(termo, [termos...])` para persistir no `localStorage`.

3. **Fallback:**  
   Garanta que o termo esteja em `KEYWORD_CHAPTER` (para gerar chapter hint). Com isso, em caso de 0 resultados, o fallback com sinônimos + restrição ao capítulo passa a ser usado.
