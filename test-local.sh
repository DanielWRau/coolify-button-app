#!/bin/bash

# Lokaler Docker Test Workflow
# Verwendung: ./test-local.sh

set -e

echo "🧪 Starte lokalen Docker Test..."

# 1. Alte Container stoppen und aufräumen
echo ""
echo "🧹 Stoppe alte Container..."
docker-compose -f docker-compose.local.yaml down

# 2. Images neu bauen
echo ""
echo "🔨 Baue Docker Images..."
docker-compose -f docker-compose.local.yaml build --no-cache

# 3. Container starten
echo ""
echo "🚀 Starte Container..."
docker-compose -f docker-compose.local.yaml up -d

# 4. Warte auf Health Checks
echo ""
echo "⏳ Warte auf Health Checks (max 60s)..."
for i in {1..12}; do
  BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose -f docker-compose.local.yaml ps -q backend) 2>/dev/null || echo "starting")
  FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose -f docker-compose.local.yaml ps -q frontend) 2>/dev/null || echo "starting")

  echo "Backend: $BACKEND_HEALTH | Frontend: $FRONTEND_HEALTH"

  if [ "$BACKEND_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
    echo "✅ Alle Services sind healthy!"
    break
  fi

  if [ $i -eq 12 ]; then
    echo "❌ Timeout: Services nicht healthy nach 60s"
    echo ""
    echo "📋 Backend Logs:"
    docker-compose -f docker-compose.local.yaml logs backend --tail=50
    echo ""
    echo "📋 Frontend Logs:"
    docker-compose -f docker-compose.local.yaml logs frontend --tail=50
    exit 1
  fi

  sleep 5
done

# 5. Test URLs
echo ""
echo "🌐 Test URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001/api/health"

# 6. Quick Health Check
echo ""
echo "🔍 Quick Health Check:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend: OK (200)"
else
  echo "❌ Backend: FAIL ($BACKEND_STATUS)"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend: OK (200)"
else
  echo "❌ Frontend: FAIL ($FRONTEND_STATUS)"
fi

# 7. Zeige Logs
echo ""
echo "📋 Container Logs (letzte 20 Zeilen):"
echo ""
echo "--- Backend ---"
docker-compose -f docker-compose.local.yaml logs backend --tail=20
echo ""
echo "--- Frontend ---"
docker-compose -f docker-compose.local.yaml logs frontend --tail=20

echo ""
echo "✅ Setup komplett!"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Öffne http://localhost:8080 im Browser"
echo "   2. Login mit Passwort aus .env (APP_PASSWORD)"
echo "   3. Teste LinkedIn Button"
echo "   4. Bei Fehlern: docker-compose -f docker-compose.local.yaml logs -f"
echo "   5. Stoppen: docker-compose -f docker-compose.local.yaml down"
