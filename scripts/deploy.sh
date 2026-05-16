#!/usr/bin/env bash
# Deploy script para a VPS (rodar dentro de /var/www/gestao-firstlineai)
set -euo pipefail

APP_DIR="/var/www/gestao-firstlineai"
APP_NAME="gestao-firstlineai"

cd "$APP_DIR"

echo "==> git pull"
git fetch --all
git checkout main
git pull origin main

echo "==> npm ci"
npm ci

echo "==> build"
npm run build

echo "==> garantindo 'serve' instalado globalmente"
if ! command -v serve >/dev/null 2>&1; then
  npm install -g serve
fi

echo "==> (re)start PM2"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  # remove qualquer processo antigo de vite dev rodando
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  pm2 start ecosystem.config.cjs
fi

pm2 save
pm2 status
