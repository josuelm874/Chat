# Módulo NCM – Consulta e Conferência

O módulo NCM permite consultar códigos NCM, visualizar o banco de validações e conferir planilhas contra um banco de referência.

---

## 1. Dependências e Carregamento

### Ordem de carregamento (operador index.html)

```
1. tabela-ncm.js   → window.NCM_TABELA_DATA
2. tabela-tipi.js   → window.TIPI_TABELA_DATA
3. ncm-motor.js     → window.ncmMotor
4. ncm-tabs.js      → Inicializa UI (DOMContentLoaded)
```

### Dados de entrada

- **NCM_TABELA_DATA**: Estrutura hierárquica com capítulos e NCMs (código, descrição 2/4/6/8 dígitos)
- **TIPI_TABELA_DATA**: Dados tributários (redução_aliquota, cst, classificacao_tributaria) por NCM

---

## 2. ncm-motor.js

Motor de busca por código NCM. Expõe `window.ncmMotor`.

### 2.1 Funções

#### `buscarPorCodigo(codigo)`
- **Parâmetros**: `codigo` – string (8 dígitos, aceita 0000.00.00 ou 00000000)
- **Retorno**: `{ codigo, descricao, descricao2, descricao4, descricao6, capitulo, codigoFormatado } | null`
- **Descrição**: Busca NCM na tabela. Retorna null se não encontrado ou código inválido.
- **Campos retornados**:
  - `codigo`: 8 dígitos
  - `descricao`: descrição completa (8 dígitos)
  - `descricao2`, `descricao4`, `descricao6`: descrições hierárquicas
  - `capitulo`: 2 dígitos do capítulo
  - `codigoFormatado`: formato 0000.00.00

#### `getNcmsByChapter(chapter, limit)`
- **Parâmetros**:
  - `chapter` – string (2 dígitos do capítulo)
  - `limit` – number (default 5, máx 10)
- **Retorno**: `Array<{ codigo, codigoFormatado }>`
- **Descrição**: Retorna exemplos de NCMs vigentes do capítulo. Usado quando NCM informada está vencida (sugestões).

#### `formatNcm(codigo)`
- **Parâmetros**: `codigo` – string
- **Retorno**: `string`
- **Descrição**: Formata código como 0000.00.00. Ex: "22021000" → "2202.10.00"

#### `ensureIndex()`
- **Retorno**: void
- **Descrição**: Constrói índice plano a partir de NCM_TABELA_DATA (flattenNcmTable). Chamado internamente antes de buscas.

#### `isReady()`
- **Retorno**: `boolean`
- **Descrição**: Verifica se o índice foi construído e há dados. Chama ensureIndex() internamente.

---

## 3. ncm-tabs.js

Interface com 2 abas: Consulta de NCM e Conferir planilha.

### 3.1 Aba "Consulta de NCM"

**Elementos**:
- `#ncm-produto-nome` – Nome do produto (opcional, para validação no banco)
- `#ncm-produto-search` – Código NCM
- `#ncm-produto-search-btn` – Botão Buscar
- `#ncm-produto-results` – Área de resultado
- `#ncm-produto-results-grid` – Grid de cards

**Fluxo**:
1. Usuário digita código NCM (8 dígitos)
2. `ncmMotor.buscarPorCodigo()` busca na tabela
3. Se não encontrado: exibe "NCM vencida" + sugestões via `getNcmsByChapter()`
4. Se encontrado: exibe card com descrições 2/4/6/8 dígitos + dados TIPI
5. Se Supabase configurado e produto informado: `loadValidacaoNcm()` para validação específica
6. Se Supabase configurado: `listValidacaoNcmByNcm()` para "produtos já validados para este NCM"

**getTipiByCodigo(codigo)** (função interna):
- Busca em TIPI_TABELA_DATA
- Retorna `{ reducao_aliquota, cst, classificacao_tributaria }` ou null
- Valores padrão se não encontrar: reducao 0, cst '000', classificacao '000001'

---

### 3.2 Aba "Conferir planilha"

**Objetivo**: Comparar planilha (produto + NCM) com banco de referência. Identificar divergências e produtos não encontrados.

**Elementos**:
- `#ncm-planilha-banco-file` – Arquivo do banco (CSV ou Excel)
- `#ncm-planilha-file` – Arquivo da planilha a conferir
- `#ncm-planilha-run-btn` – Botão Conferir
- `#ncm-planilha-loading` – Carregando
- `#ncm-planilha-summary` – Resumo
- `#ncm-planilha-gerar-relatorio-btn` – Gerar relatório Excel
- Abas: Divergências, Não encontrados

**Formato do banco** (CSV):
- Colunas obrigatórias: `produto`, `ncm`
- `Banco_Dados.csv` é a referência principal de produto×NCM correto

**Formato da planilha** (CSV/Excel):
- Colunas de produto (aliases): produto, produtos, descrição, descricao, descrição de produtos, descricao de produtos
- Colunas de NCM: ncm, codigo ncm, código ncm

**Fluxo**:
1. Usuário seleciona banco e planilha
2. Parse: `parseCsv()` para CSV, `parseExcelToHeadersRows()` para Excel (SheetJS)
3. Banco: criação de índice de matching com:
   - nome normalizado
   - nome canônico com expansão de abreviações/sinônimos
   - tokens para score de similaridade
4. Para cada linha da planilha, o produto passa por pipeline conservador:
   - match exato normalizado
   - match canônico (abreviação/sinônimo)
   - match por prefixo canônico
   - match por similaridade de tokens (somente acima do limiar de confiança)
5. Resultado da linha:
   - `Válida` (produto encontrado e NCM igual)
   - `Divergente` (produto encontrado e NCM diferente)
   - `Não encontrado` (sem correspondência confiável)
6. A coluna de sugestão mostra rastreabilidade do match (`estratégia` + `confiança`)
7. Se não houver match acima do limiar, o sistema mostra até 3 candidatos com confiança para revisão humana (sem validar automaticamente)
8. "Gerar relatório": Excel unificado com colunas fixas + extras opcionais da planilha

**Calibração aplicada (casos reais de atacado)**:
- Abreviações priorizadas: `ALIS`→`ALISAMENTO`, `CONDIC`→`CONDICIONADOR`, `CR`→`CREME`, `DES`→`DESCOLORANTE`, `ACUC`→`ACUCAR`
- Normalização adicional: remoção de ruído de pontuação, descarte de tokens de embalagem/medida (`ML`, `KG`, `UN`, `CX`, etc.) e singularização simples
- Similaridade com âncoras semânticas (ex.: `ALISAMENTO`, `CONDICIONADOR`, `CREME`, `DESCOLORANTE`, `ACUCAR`, `CRISTAL`) para melhorar precisão
- Modo equilibrado: limiar mínimo de confiança ajustado para **0.81** com trava de ambiguidade por NCM diferente

**Manutenção recomendada**:
- Sempre que surgir novo padrão de abreviação do cliente, incluir no dicionário `PRODUCT_ABBREVIATIONS`
- Manter validação conservadora: match abaixo do limiar deve continuar como `Não encontrado`
- Revisar periodicamente os top candidatos exibidos para enriquecer sinônimos sem aumentar falso positivo fiscal

**Funções auxiliares**:
- `parseCsv(text)` – Primeira linha = cabeçalho, detecta separador ; ou ,
- `parseExcelToHeadersRows(arrayBuffer)` – SheetJS, primeira aba, primeira linha = headers
- `findColunaProdutoPlanilha(headers)` – Índice da coluna produto
- `findColunaNcmPlanilha(headers)` – Índice da coluna NCM
- `isExcelFile(file)` – Detecta .xlsx, .xls, etc.
- `normalizarNcm8Local(ncm)` – Normaliza NCM para 8 dígitos
- `normalizeProductNameAdvanced(name)` – normalização robusta de nomenclatura
- `expandAbbreviations(tokens)` – expansão de abreviações/sinônimos
- `findProductInBanco(produto, bancoIndex)` – matching em camadas com confiança

---

## 4. Inicialização (initTabs)

- Escuta cliques nos botões `.ncm-tab-btn`
- `data-ncm-tab`: `consulta-produto`, `conferir-planilha`
- `initConsultaNcm()` e `initConferirPlanilha()` são chamados em ready()

---

## 5. Integração com Supabase

- `supabaseSync.loadValidacaoNcm(produto, ncm)`
- `supabaseSync.listValidacaoNcmByNcm(ncm, limit)`
- `supabaseSync.listValidacaoNcmSimByProduto(produto)` – usado na conferência (banco pode ser arquivo local, não Supabase)

A conferência de planilha usa **arquivo de banco** local (CSV/Excel), não obrigatoriamente o Supabase. O Supabase é usado na consulta para exibir validações (produtos já validados para o NCM informado).

---

*Módulo NCM – Chat UI Sercon*
