#!/bin/bash

echo "🚀 Instalando API NCM..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
    echo ""
    echo "🎉 Instalação concluída!"
    echo ""
    echo "Para iniciar a API:"
    echo "  npm start        # Modo produção"
    echo "  npm run dev      # Modo desenvolvimento (com auto-reload)"
    echo ""
    echo "A API estará disponível em: http://localhost:3000"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

