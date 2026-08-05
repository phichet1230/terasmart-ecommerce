#!/bin/bash

# ==============================================================================
# TeraSmart E-Commerce 1-Click Automated Deployment Script
# Target Platform: Ubuntu 20.04 / 22.04 LTS Cloud VPS
# ==============================================================================

set -e

echo "🚀 [1/4] Checking and installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose Plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

echo "📦 [2/4] Building production assets (npm run build)..."
if command -v npm &> /dev/null; then
    npm install
    npm run build
fi

echo "🐳 [3/4] Launching Docker Containers (PostgreSQL, Backend API, Nginx)..."
docker compose down || true
docker compose up -d --build

echo "⚡ [4/4] Verifying System Health..."
sleep 5
docker compose ps

echo "=============================================================================="
echo "✅ SUCCESS! TeraSmart E-Commerce is now running live on your Cloud Server!"
echo "🌐 Access Storefront at: http://<YOUR_SERVER_IP>"
echo "🔌 API Endpoint at: http://<YOUR_SERVER_IP>/api/v1"
echo "=============================================================================="
