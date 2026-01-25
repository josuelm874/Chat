/**
 * API REST para Consulta de NCM
 * Servidor Express para busca e consulta de códigos NCM
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(compression()); // Comprimir respostas
app.use(cors()); // Permitir CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL encoded

// Logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Chat UI API',
    version: '1.0.0',
    endpoints: { health: '/health' }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`   GET /health`);
});

module.exports = app;

