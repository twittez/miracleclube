# 🚀 Guia Oficial de Deploy na AWS EC2 (Amazon Linux 2023) - Miracle

Este guia documenta o processo passo a passo para colocar o site **https://miraclebrasil.com** e **https://www.miraclebrasil.com** 100% online na sua instância AWS EC2 rodando **Amazon Linux 2023**.

---

## 🏗️ 1. Arquitetura do Projeto

* **Domínios:** `miraclebrasil.com` e `www.miraclebrasil.com` (com HTTPS obrigatório e canônico sem `www`).
* **Frontend:** React 19 + TypeScript + Vite compilado para arquivos estáticos em `/home/ec2-user/miracleclube/dist`.
* **Backend:** Node.js Express (`server.mjs`) rodando na porta interna `3001` gerenciado por **PM2** com reinicialização automática pós-reboot.
* **Banco de Dados:** Supabase Cloud PostgreSQL (`https://jjcmfkwrbwlsgcsdaaeb.supabase.co`).
* **Web Server / Reverse Proxy:** **Nginx** na porta `80` (HTTP) e `443` (HTTPS) roteando `/` para o SPA React e `/api/*` para o backend Node.
* **Certificado SSL:** Let's Encrypt gratuito com renovação automática via **Certbot**.

---

## 🌐 2. Configuração de DNS (No seu provedor de domínio / Registro.br / Cloudflare / Route 53)

Aponte os registros DNS do seu domínio para o **IP Público da sua instância EC2** (recomendado associar um **Elastic IP** na AWS para que o IP nunca mude):

| Tipo | Nome | Valor / Destino | TTL |
|---|---|---|---|
| **A** | `@` *(ou miraclebrasil.com)* | `IP-PUBLICO-DA-EC2` | Automático / 300 |
| **CNAME** | `www` | `miraclebrasil.com` *(ou IP-PUBLICO-DA-EC2 via tipo A)* | Automático / 300 |

---

## 🛡️ 3. Security Group na AWS (Regras de Entrada / Inbound Rules)

No console da AWS EC2, acerte as portas do Security Group da sua instância:

| Tipo | Protocolo | Porta | Origem / Source | Descrição |
|---|---|---|---|---|
| **SSH** | TCP | `22` | `Seu-IP/32` *(ou 0.0.0.0/0 se necessário)* | Acesso administrativo |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Tráfego web padrão |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Tráfego web seguro SSL |

*(As portas internas do Node `3001`/`3002` NÃO devem ser abertas publicamente no Security Group).*

---

## ⚡ 4. Executando o Setup Inicial na Instância EC2

Conecte na sua EC2 via SSH:
```bash
ssh -i sua-chave.pem ec2-user@IP-PUBLICO-DA-EC2
```

Execute os comandos abaixo para preparar o servidor:

```bash
# 1. Atualizar pacotes do Amazon Linux 2023
sudo dnf update -y

# 2. Instalar Node.js 20 LTS, Git e Nginx
sudo dnf install -y git nginx nodejs python3-pip

# 3. Instalar PM2 globalmente e Certbot
sudo npm install -g pm2
sudo pip3 install certbot certbot-nginx

# 4. Clonar o projeto
cd /home/ec2-user
git clone https://github.com/twittez/miracleclube.git
cd miracleclube

# 5. Ajustar permissões para o Nginx conseguir ler a pasta
chmod 755 /home/ec2-user
chmod 755 /home/ec2-user/miracleclube

# 6. Criar o arquivo de variáveis de ambiente .env
nano .env
```

Cole o conteúdo no arquivo `.env`:
```ini
# Supabase Cloud Database
SUPABASE_URL=https://jjcmfkwrbwlsgcsdaaeb.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# UTMify API Server-Side
UTMIFY_API_TOKEN=FsJgKEwd4drMgkHF2zdOVRbwyH2o0C61ZGJ4
BACKFILL_SECRET=miracle_backfill_2026_sec

# Gateway Beehive
BEEHIVE_SECRET_KEY=sec_live_placeholder

# Porta do Servidor
PORT=3001
SERVER_PORT=3001
NODE_ENV=production
```
*(Salve com `Ctrl+O`, `Enter` e saia com `Ctrl+X`)*.

---

## 🔨 5. Compilar o Projeto e Iniciar os Serviços

```bash
# Instalar dependências e compilar frontend
npm ci
npm run build

# Iniciar o backend no PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# (Execute a linha com sudo sugerida pelo comando acima para garantir o restart automático pós-reboot)

# Configurar o Nginx
sudo cp nginx/miraclebrasil.conf /etc/nginx/conf.d/miraclebrasil.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## 🔒 6. Gerar o Certificado SSL HTTPS Gratuito (Let's Encrypt)

Com o DNS já apontado para o IP da sua EC2, execute:

```bash
sudo certbot --nginx -d miraclebrasil.com -d www.miraclebrasil.com
```

* Digite seu e-mail para avisos de renovação.
* Aceite os termos com `Y`.
* O Certbot vai validar o domínio, emitir o certificado e configurar o Nginx automaticamente.

### Testar a Renovação Automática do SSL:
```bash
sudo certbot renew --dry-run
```

Para garantir a renovação automática periódica, crie uma tarefa no cron:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
```

---

## 🔄 7. Como Atualizar o Site no Futuro (Deploy com 1 Comando)

Sempre que você fizer alterações no GitHub, para atualizar o site no servidor basta rodar:

```bash
cd /home/ec2-user/miracleclube
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 8. Comandos Úteis para Monitoramento

* **Ver status do Backend:** `pm2 status`
* **Ver logs em tempo real:** `pm2 logs miracle-backend`
* **Ver status do Nginx:** `sudo systemctl status nginx`
* **Ver logs de erro do Nginx:** `sudo tail -f /var/log/nginx/error.log`
* **Reiniciar aplicação:** `pm2 restart miracle-backend`
