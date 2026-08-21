#!/bin/bash
# ==============================================================================
# Setup Completo para Amazon Linux 2023 - Miracle Store (miraclebrasil.com)
# ==============================================================================

set -e

echo "================================================================="
echo "🛠️  INICIANDO PREPARAÇÃO DA INSTÂNCIA AMAZON LINUX 2023"
echo "================================================================="

# 1. Atualizar o sistema operacional
echo "📦 1. Atualizando pacotes com dnf..."
sudo dnf update -y

# 2. Instalar Node.js 20 LTS, Git e Nginx
echo "📦 2. Instalando Node.js 20, Git e Nginx..."
sudo dnf install -y git nginx nodejs

# 3. Instalar Certbot (Let's Encrypt) e dependências de SSL
echo "🔒 3. Instalando Certbot..."
sudo dnf install -y python3-pip
sudo pip3 install certbot certbot-nginx

# 4. Instalar PM2 globalmente para gerenciar o backend Node
echo "⚡ 4. Instalando PM2 globalmente..."
sudo npm install -g pm2

# 5. Criar e configurar diretório da aplicação
PROJECT_DIR="/home/ec2-user/miracleclube"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 5. Clonando repositório..."
    cd /home/ec2-user
    git clone https://github.com/twittez/miracleclube.git
    cd miracleclube
else
    echo "📥 5. Repositório já existe, atualizando..."
    cd "$PROJECT_DIR"
    git pull origin main
fi

# Dar permissão de leitura para o Nginx acessar a home do ec2-user
chmod 755 /home/ec2-user
chmod 755 "$PROJECT_DIR"

# 6. Instalar dependências e compilar frontend
echo "🔨 6. Instalando dependências e compilando build de produção..."
cd "$PROJECT_DIR"
npm ci
npm run build

# 7. Configurar Nginx
echo "🌐 7. Configurando Nginx para miraclebrasil.com..."
sudo cp "$PROJECT_DIR/nginx/miraclebrasil.conf" /etc/nginx/conf.d/miraclebrasil.conf

# Validar e iniciar Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# 8. Iniciar backend com PM2 e configurar inicialização automática pós-reboot
echo "🚀 8. Configurando PM2 e serviço systemd..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

echo "================================================================="
echo "🎉 AMBIENTE PREPARADO COM SUCESSO!"
echo "================================================================="
echo "👉 Próximo passo para gerar o certificado SSL Let's Encrypt:"
echo "   sudo certbot --nginx -d miraclebrasil.com -d www.miraclebrasil.com"
echo "================================================================="
