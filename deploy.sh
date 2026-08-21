#!/bin/bash
# ==============================================================================
# Automated Zero-Downtime Deploy Script for Miracle on AWS EC2 (Amazon Linux 2023)
# ==============================================================================

set -e

PROJECT_DIR="/home/ec2-user/miracleclube"

echo "--------------------------------------------------------"
echo "🚀 Iniciando deploy da Miracle no Amazon Linux 2023..."
echo "⏰ Data: $(date)"
echo "--------------------------------------------------------"

cd "$PROJECT_DIR"

# 1. Puxar as últimas alterações do GitHub
echo "📥 1/5 - Atualizando código do repositório GitHub..."
git pull origin main

# 2. Instalar dependências limpas
echo "📦 2/5 - Instalando dependências com npm ci..."
npm ci --silent

# 3. Compilar o Frontend Vite para Produção
echo "🔨 3/5 - Compilando frontend Vite para pasta dist/..."
npm run build

# 4. Recarregar o backend Node.js no PM2 sem interrupção
echo "🔄 4/5 - Recarregando backend no PM2..."
if pm2 list | grep -q "miracle-backend"; then
    pm2 reload ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

# 5. Validar e Recarregar Nginx
echo "🌐 5/5 - Validando e recarregando Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "--------------------------------------------------------"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🌐 Site online: https://miraclebrasil.com"
echo "--------------------------------------------------------"
