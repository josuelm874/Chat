# API REST para Consulta NCM

API REST desenvolvida em Node.js/Express para consulta de códigos NCM (Nomenclatura Comum do Mercosul).

## 🚀 Instalação

```bash
cd api
npm install
```

## 📡 Executar API

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

A API estará disponível em: `http://localhost:3000`

## 📚 Endpoints

### 1. Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-13T10:30:00.000Z",
  "uptime": 123.45
}
```

### 2. Busca por Texto
```http
GET /api/ncm/search?q=coca cola&limit=30&offset=0
```

**Parâmetros:**
- `q` (obrigatório): Termo de busca (descrição ou código)
- `limit` (opcional): Limite de resultados (padrão: 30)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta:**
```json
{
  "success": true,
  "query": "coca cola",
  "total": 5,
  "limit": 30,
  "offset": 0,
  "results": [
    {
      "code": "22021000",
      "cleanCode": "22021000",
      "description": "Águas, incluindo as águas minerais e as águas gaseificadas, adicionadas de açúcar ou outros edulcorantes ou aromatizadas; outras bebidas não alcoólicas",
      "chapter": "22",
      "chapterDescription": "Bebidas, líquidos alcoólicos e vinagres",
      "level": "Level I",
      "levelDescription": "...",
      "score": 150,
      "matchedWords": 2
    }
  ]
}
```

### 3. Busca por Código
```http
GET /api/ncm/code/22021000
```

**Parâmetros:**
- `code`: Código NCM (2, 4, 6 ou 8 dígitos)

**Resposta:**
```json
{
  "success": true,
  "code": "22021000",
  "result": {
    "code": "22021000",
    "cleanCode": "22021000",
    "description": "...",
    "chapter": "22",
    "chapterDescription": "...",
    "level": "Level I",
    "levelDescription": "...",
    "isComplete": true,
    "codeMatch": true,
    "score": 100
  }
}
```

### 4. Busca Hierárquica
```http
POST /api/ncm/hierarchical
Content-Type: application/json

{
  "query": "refrigerante coca cola",
  "options": {
    "limit": 10
  }
}
```

**Body:**
- `query` (obrigatório): Termo de busca
- `options` (opcional): Opções de busca

**Resposta:**
```json
{
  "success": true,
  "query": "refrigerante coca cola",
  "total": 3,
  "results": [...]
}
```

### 5. Listar Capítulos
```http
GET /api/ncm/chapters?level=Level I
```

**Parâmetros:**
- `level` (opcional): Filtrar por level

**Resposta:**
```json
{
  "success": true,
  "total": 97,
  "chapters": [
    {
      "code": "01",
      "description": "Animais vivos",
      "level": "Level I",
      "levelDescription": "..."
    }
  ]
}
```

### 6. Estatísticas
```http
GET /api/ncm/stats
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "totalNCMs": 12345,
    "totalChapters": 97,
    "totalLevels": 8,
    "levels": {
      "Level I": {
        "chapters": 5,
        "ncms": 1234
      }
    }
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` (opcional):

```env
PORT=3000
NODE_ENV=production
```

### Caminho dos Dados

A API busca os dados em: `../docs/NCM/Tabela_NCM.json`

Para alterar, edite `api/utils/ncmDataLoader.js`

## 📦 Estrutura do Projeto

```
api/
├── server.js              # Servidor principal
├── routes/
│   └── ncm.js            # Rotas da API
├── controllers/
│   └── ncmController.js # Controllers
├── services/
│   └── ncmService.js    # Lógica de negócio
├── utils/
│   └── ncmDataLoader.js # Carregador de dados
└── package.json
```

## 🧪 Testando a API

### Com cURL

```bash
# Health check
curl http://localhost:3000/health

# Busca por texto
curl "http://localhost:3000/api/ncm/search?q=coca%20cola"

# Busca por código
curl http://localhost:3000/api/ncm/code/22021000

# Estatísticas
curl http://localhost:3000/api/ncm/stats
```

### Com JavaScript (fetch)

```javascript
// Busca por texto
const response = await fetch('http://localhost:3000/api/ncm/search?q=coca cola');
const data = await response.json();
console.log(data);

// Busca por código
const response2 = await fetch('http://localhost:3000/api/ncm/code/22021000');
const data2 = await response2.json();
console.log(data2);
```

## 🔄 Integração com Frontend

Para integrar com o frontend existente, você precisará:

1. Atualizar `ncm-advanced-system.js` para fazer chamadas à API
2. Substituir as buscas locais por chamadas HTTP
3. Adicionar tratamento de erros e loading states

Exemplo de integração:

```javascript
// Substituir performIntelligentSearch() por:
async function performIntelligentSearch() {
  const query = document.getElementById('searchInput').value.trim();
  
  try {
    const response = await fetch(`http://localhost:3000/api/ncm/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.success) {
      displayResults(data.results);
    }
  } catch (error) {
    console.error('Erro ao buscar NCM:', error);
  }
}
```

## 📝 Notas

- A API carrega os dados na memória para melhor performance
- Os dados são cacheados após o primeiro carregamento
- Use `reload()` para recarregar dados após atualizações
- A API suporta CORS para integração com frontend

## 🐛 Troubleshooting

### Erro: "Arquivo não encontrado"
- Verifique se o arquivo `Tabela_NCM.json` existe em `docs/NCM/`
- Verifique o caminho em `utils/ncmDataLoader.js`

### Erro: "Dados NCM inválidos"
- Verifique se o JSON está bem formatado
- Execute o script Python para regenerar o JSON

### API lenta
- Os dados são carregados na primeira requisição
- Considere usar cache Redis para produção
- Otimize as buscas com índices

## 📄 Licença

ISC

