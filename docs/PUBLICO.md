# Interface Público – vagas.html e vagas-script.js

Documentação da página pública de vagas – listagem e candidatura.

---

## 1. Visão Geral

A interface **pública** exibe vagas de emprego publicadas pelos operadores. Qualquer visitante pode:
- Ver a listagem de vagas
- Filtrar por busca, localização e regime
- Abrir detalhes da vaga
- Candidatar-se (nome, e-mail, telefone, currículo PDF, mensagem)

---

## 2. Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/publico/vagas.html` | Página HTML |
| `src/publico/vagas-script.js` | Lógica (~247 linhas) |
| `src/publico/vagas-style.css` | Estilos |

---

## 3. Fonte de Dados

As vagas são armazenadas em **localStorage** na chave `publishedJobs`. O operador publica vagas via "Gerenciar Vagas"; as publicadas com `isPublished === true` e `status === 'published'` são exibidas aqui.

---

## 4. Funções (vagas-script.js)

### 4.1 Variáveis Globais

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `allJobs` | array | Todas as vagas publicadas |
| `filteredJobs` | array | Vagas após filtros |

### 4.2 Funções Principais

#### `loadJobs()`
- **Retorno**: `Promise` (async)
- **Descrição**: Carrega vagas de `localStorage.publishedJobs`, filtra por `isPublished` e `status === 'published'`, mapeia para formato de exibição e ordena por data (mais recente primeiro).
- **Chamada**: Ao carregar a página.

#### `formatLocation(locationPreference, companyAddress)`
- **Parâmetros**: `locationPreference` – string, `companyAddress` – string (opcional)
- **Retorno**: `string`
- **Mapeamento**:
  - `remoto` → "Remoto"
  - `presencial` → "Presencial"
  - `hibrido` → "Híbrido"
  - `qualquer` → "Remoto ou Presencial"
  - `proximo` → "Próximo a {endereço}" ou "Proximidade obrigatória"
  - `mesma_cidade` → "Mesma cidade"
  - `mesmo_estado` → "Mesmo estado"

#### `mapLocationType(locationPreference)`
- **Parâmetros**: `locationPreference` – string
- **Retorno**: `string` – 'remoto', 'presencial', 'hibrido', 'qualquer'
- **Descrição**: Mapeia preferência para tipo usado no filtro de localização.

#### `displayJobs()`
- **Retorno**: void
- **Descrição**: Renderiza `filteredJobs` no `#jobsContainer`. Se vazio, exibe `#noJobs`. Cada vaga é um card clicável com `onclick="openJobModal('${job.id}')"`.

#### `searchJobs()`
- **Retorno**: void
- **Descrição**: Aplica filtros (busca, localização, regime) e chama `displayJobs()`.

#### `openJobModal(jobId)`
- **Parâmetros**: `jobId` – string
- **Retorno**: void
- **Descrição**: Abre modal com detalhes da vaga e formulário de candidatura. Preenche `#modalJobTitle`, `#modalBody` e exibe `#jobModal` com classe `active`.

#### `closeJobModal()`
- **Retorno**: void
- **Descrição**: Remove classe `active` do modal.

#### `applyToJob(jobId)`
- **Parâmetros**: `jobId` – string
- **Retorno**: void
- **Descrição**: Abre o modal da vaga (alias para `openJobModal`).

#### `submitApplication(event, jobId)`
- **Parâmetros**: `event` – Event, `jobId` – string
- **Retorno**: void
- **Descrição**: Processa o envio do formulário. Coleta: fullName, email, phone, coverMessage, resume (PDF). Converte currículo para Base64 e chama `saveApplication()`.

#### `saveApplication(applicationData)`
- **Parâmetros**: `applicationData` – object
- **Retorno**: void
- **Descrição**: Salva candidatura em `localStorage.jobApplications`. Exibe alert de sucesso e fecha o modal.

---

## 5. Estrutura da Candidatura (applicationData)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único (application_ + timestamp + random) |
| `jobId` | string | ID da vaga |
| `jobTitle` | string | Título da vaga |
| `jobCompany` | string | Empresa |
| `fullName` | string | Nome do candidato |
| `email` | string | E-mail |
| `phone` | string | Telefone |
| `coverMessage` | string \| null | Mensagem de apresentação |
| `status` | string | 'pending' |
| `createdAt` | string | ISO 8601 |
| `reviewedAt` | null | Preenchido pelo operador |
| `reviewedBy` | null | Preenchido pelo operador |
| `resumeBase64` | string | Currículo em Base64 |
| `resumeFileName` | string | Nome do arquivo |
| `resumeFileType` | string | Tipo MIME |
| `resumeFileSize` | number | Tamanho em bytes |

---

## 6. Elementos HTML Principais

| ID | Descrição |
|----|-----------|
| `searchInput` | Campo de busca |
| `filterLocation` | Select de localização |
| `filterSchedule` | Select de regime |
| `jobsContainer` | Container dos cards |
| `noJobs` | Mensagem quando não há vagas |
| `jobModal` | Modal de detalhes |
| `modalJobTitle` | Título no modal |
| `modalBody` | Corpo do modal (detalhes + formulário) |

---

## 7. Eventos

| Elemento | Evento | Ação |
|----------|--------|------|
| `searchInput` | keypress (Enter) | `searchJobs()` |
| `filterLocation` | change | `searchJobs()` |
| `filterSchedule` | change | `searchJobs()` |
| `jobModal` | click (no overlay) | `closeJobModal()` |

---

## 8. Formato da Vaga (objeto job)

| Campo | Descrição |
|-------|-----------|
| `id` | ID único |
| `title` | Título (jobTitle) |
| `company` | Empresa (contributorName) |
| `vacancies` | Quantidade de vagas |
| `salary` | Salário |
| `schedule` | Regime (CLT, PJ, etc.) |
| `location` | Texto formatado |
| `locationType` | remoto, presencial, hibrido, qualquer |
| `description` | Descrição curta |
| `fullDescription` | Descrição completa |
| `requirements` | Requisitos |
| `benefits` | Benefícios |
| `createdAt` | Data de publicação |

---

*Interface Público – Chat UI Sercon*
