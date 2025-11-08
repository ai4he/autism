# ABA Behavior Tracking PWA - Deployment Guide

Complete guide for deploying the ABA Behavior Tracking application to a production server with nginx reverse proxy and SSL certificate.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Application Installation](#application-installation)
4. [Nginx Reverse Proxy Configuration](#nginx-reverse-proxy-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [PM2 Process Management](#pm2-process-management)
7. [Automated Deployment Script](#automated-deployment-script)
8. [Maintenance](#maintenance)

---

## Prerequisites

- **Server Requirements:**
  - Ubuntu 20.04+ or similar Linux distribution
  - Node.js 18+ (LTS recommended)
  - npm 9+
  - nginx 1.18+
  - Minimum 2GB RAM
  - 20GB disk space

- **DNS Configuration:**
  - Domain: `autism.haielab.org`
  - DNS A record pointing to server IP address

- **Access:**
  - SSH access to server
  - Sudo privileges

---

## Server Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js (using nvm - recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher
```

### 3. Install nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Install Certbot (for Let's Encrypt SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

---

## Application Installation

### 1. Clone or Copy Application Code

```bash
# Create application directory
sudo mkdir -p /var/www/autism
sudo chown -R $USER:$USER /var/www/autism

# Navigate to directory
cd /var/www/autism

# Copy your code here (replace with your actual method)
# Option A: Clone from git (if available)
# git clone <your-repo-url> .

# Option B: Copy from local machine using scp
# From your local machine:
# scp -r /path/to/autism/* user@server:/var/www/autism/
```

### 2. Install Dependencies

```bash
cd /var/www/autism
npm install
```

### 3. Build Application

```bash
npm run build
```

### 4. Test Application (Development Mode)

```bash
# Start in development mode to verify everything works
npm run dev

# Visit http://your-server-ip:3000 to verify
# Press Ctrl+C to stop
```

---

## Nginx Reverse Proxy Configuration

### 1. Create nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/autism.haielab.org
```

### 2. Add Configuration (HTTP only - before SSL)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name autism.haielab.org;

    # Logging
    access_log /var/log/nginx/autism_access.log;
    error_log /var/log/nginx/autism_error.log;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Service Worker and PWA assets
    location ~* (service-worker\.js|sw\.js|workbox.*\.js)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Don't cache service workers
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        # Cache static assets for 1 year
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public assets
    location /public {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        expires 7d;
        add_header Cache-Control "public";
    }

    # Manifest and icons
    location ~* \.(webmanifest|json|png|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 3. Enable Site

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/autism.haielab.org /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test is successful, reload nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### 1. Obtain Let's Encrypt SSL Certificate

```bash
# Make sure your application is not running on port 80
# Certbot will use it temporarily

sudo certbot --nginx -d autism.haielab.org
```

**Follow the prompts:**
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

### 2. Verify SSL Certificate

After certbot completes, it will automatically update your nginx configuration. The updated configuration will look like this:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name autism.haielab.org;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name autism.haielab.org;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/autism.haielab.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autism.haielab.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Logging
    access_log /var/log/nginx/autism_access.log;
    error_log /var/log/nginx/autism_error.log;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Service Worker and PWA assets
    location ~* (service-worker\.js|sw\.js|workbox.*\.js)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Don't cache service workers
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        # Cache static assets for 1 year
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public assets
    location /public {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        expires 7d;
        add_header Cache-Control "public";
    }

    # Manifest and icons
    location ~* \.(webmanifest|json|png|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;

        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 3. Test SSL Configuration

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Certbot automatically sets up a renewal cron job, but verify it:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Check if renewal timer is active
sudo systemctl status certbot.timer
```

---

## PM2 Process Management

### 1. Start Application with PM2

```bash
cd /var/www/autism

# Start application
pm2 start npm --name "autism-tracker" -- start

# Save PM2 process list
pm2 save

# Generate startup script (runs on server boot)
pm2 startup
# Follow the instructions provided by the command
```

### 2. PM2 Management Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs autism-tracker

# Restart application
pm2 restart autism-tracker

# Stop application
pm2 stop autism-tracker

# Delete from PM2
pm2 delete autism-tracker

# Monitor application
pm2 monit
```

---

## Automated Deployment Script

Create a deployment script for easy setup:

### 1. Create Script

```bash
nano /var/www/autism/deploy.sh
```

### 2. Add Content

```bash
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
```

### 3. Make Script Executable

```bash
chmod +x /var/www/autism/deploy.sh
```

### 4. Run Deployment Script

```bash
cd /var/www/autism
./deploy.sh
```

---

## Maintenance

### Update Application

```bash
cd /var/www/autism

# Pull latest changes (if using git)
git pull origin main

# Or copy new files from your local machine
# scp -r /path/to/autism/* user@server:/var/www/autism/

# Install dependencies
npm install

# Build application
npm run build

# Restart with PM2
pm2 restart autism-tracker

# Check status
pm2 status
```

### Monitor Application

```bash
# View real-time logs
pm2 logs autism-tracker --lines 100

# Monitor CPU and memory
pm2 monit

# Check nginx access logs
sudo tail -f /var/log/nginx/autism_access.log

# Check nginx error logs
sudo tail -f /var/log/nginx/autism_error.log
```

### Backup Database (IndexedDB is client-side)

Since this PWA uses IndexedDB (client-side storage), data is stored in users' browsers. No server-side database backup is needed. However, users can export their data using the built-in CSV export feature.

### SSL Certificate Renewal

Let's Encrypt certificates auto-renew, but you can manually test:

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

### Troubleshooting

#### Application not accessible

```bash
# Check if PM2 is running
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check if port 3000 is in use
sudo lsof -i :3000

# Check nginx configuration
sudo nginx -t

# View PM2 logs for errors
pm2 logs autism-tracker --err
```

#### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Check nginx SSL configuration
sudo nginx -t

# View detailed certbot logs
sudo less /var/log/letsencrypt/letsencrypt.log
```

#### High Memory Usage

```bash
# Check PM2 memory usage
pm2 monit

# Restart application
pm2 restart autism-tracker

# Consider adding memory limits in PM2
pm2 delete autism-tracker
pm2 start npm --name "autism-tracker" --max-memory-restart 500M -- start
pm2 save
```

---

## Environment Variables

If you need to add environment variables:

```bash
# Create .env file
nano /var/www/autism/.env

# Add variables (example)
NODE_ENV=production
PORT=3000

# Restart application
pm2 restart autism-tracker --update-env
```

---

## Security Recommendations

1. **Firewall Configuration:**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor Logs:**
   - Regularly check nginx and PM2 logs for suspicious activity
   - Consider setting up log rotation

4. **Backup SSL Certificates:**
   ```bash
   sudo cp -r /etc/letsencrypt /backup/letsencrypt-$(date +%Y%m%d)
   ```

---

## Support

For issues or questions:
- Check logs: `pm2 logs autism-tracker`
- Review nginx logs: `/var/log/nginx/autism_error.log`
- Verify DNS: `dig autism.haielab.org`
- Test SSL: https://www.ssllabs.com/ssltest/

---

**Last Updated:** 2025-11-08
