#!/bin/bash

# ABA Behavior Tracking PWA - Automated Deployment Script
# Domain: autism.haielab.org

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="autism.haielab.org"
APP_DIR="/var/www/autism"
APP_NAME="autism-tracker"
NODE_VERSION="18"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ABA Tracker - Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Step 1: System Updates
echo -e "\n${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js (if not installed)
echo -e "\n${YELLOW}Step 2: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
else
    echo "Node.js already installed: $(node --version)"
fi

# Step 3: Install nginx (if not installed)
echo -e "\n${YELLOW}Step 3: Checking nginx installation...${NC}"
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "nginx already installed"
fi

# Step 4: Install Certbot (if not installed)
echo -e "\n${YELLOW}Step 4: Checking Certbot installation...${NC}"
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt install certbot python3-certbot-nginx -y
else
    echo "Certbot already installed"
fi

# Step 5: Install PM2 (if not installed)
echo -e "\n${YELLOW}Step 5: Checking PM2 installation...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo "PM2 already installed"
fi

# Step 6: Setup Application Directory
echo -e "\n${YELLOW}Step 6: Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Step 7: Install Dependencies and Build
echo -e "\n${YELLOW}Step 7: Installing dependencies and building...${NC}"
cd $APP_DIR

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please copy application files to $APP_DIR first${NC}"
    exit 1
fi

npm install
npm run build

# Step 8: Configure nginx
echo -e "\n${YELLOW}Step 8: Configuring nginx reverse proxy...${NC}"

# Create nginx config
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOL
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    access_log /var/log/nginx/autism_access.log;
    error_log /var/log/nginx/autism_error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* (service-worker\.js|sw\.js|workbox.*\.js)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;

        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;

        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(webmanifest|json|png|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;

        expires 7d;
        add_header Cache-Control "public";
    }
}
EOL

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t
sudo systemctl reload nginx

# Step 9: SSL Certificate
echo -e "\n${YELLOW}Step 9: Setting up SSL certificate...${NC}"
echo "Obtaining SSL certificate for $DOMAIN..."

# Stop PM2 if running (to free port 80)
pm2 delete $APP_NAME 2>/dev/null || true

sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@haielab.org --redirect

# Step 10: Start Application with PM2
echo -e "\n${YELLOW}Step 10: Starting application with PM2...${NC}"
cd $APP_DIR

# Stop existing instance if any
pm2 delete $APP_NAME 2>/dev/null || true

# Start application
pm2 start npm --name "$APP_NAME" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup | tail -n 1 | sudo bash

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nYour application is now running at:"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo -e "\nUseful commands:"
echo -e "  pm2 status              - Check application status"
echo -e "  pm2 logs $APP_NAME      - View logs"
echo -e "  pm2 restart $APP_NAME   - Restart application"
echo -e "  pm2 monit               - Monitor application"
echo -e "\nSSL certificate will auto-renew via certbot."
