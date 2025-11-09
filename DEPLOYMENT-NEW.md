# Deployment Guide - Modernized Stack

## 🚀 Quick Deploy with Docker Compose

### 1. Environment Setup
```bash
# Copy example environment
cp backend/.env.example backend/.env

# Edit environment variables
nano backend/.env
```

### 2. Build and Start
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access
- Frontend: http://localhost
- Backend API: http://localhost:3001

## 📦 GitHub Container Registry

Die GitHub Action pusht automatisch Container Images nach `ghcr.io`.

### Pull Pre-Built Images
```bash
# Set your GitHub username
GHUSER=your-github-username

# Pull images
docker pull ghcr.io/$GHUSER/coolify-button-app/frontend:latest
docker pull ghcr.io/$GHUSER/coolify-button-app/backend:latest

# Run with docker-compose
docker-compose pull
docker-compose up -d
```

## 🔧 Coolify Deployment

### Option 1: Docker Compose (Empfohlen)

1. **Create New Service** in Coolify
2. **Service Type**: Docker Compose
3. **Repository**: Link to your GitHub repository
4. **File**: `docker-compose.yml`
5. **Environment Variables**: Set in Coolify UI
6. **Deploy**: Coolify baut und startet automatisch

### Option 2: Separate Services

**Frontend Service:**
- **Type**: Docker Container
- **Image**: `ghcr.io/$GHUSER/coolify-button-app/frontend:latest`
- **Port**: 80
- **Healthcheck**: `wget --quiet --tries=1 --spider http://localhost/`

**Backend Service:**
- **Type**: Docker Container
- **Image**: `ghcr.io/$GHUSER/coolify-button-app/backend:latest`
- **Port**: 3001
- **Environment Variables**: (siehe unten)
- **Healthcheck**: `node -e "require('http').get('http://localhost:3001', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"`
- **Volumes**: `/app/data` für persistente Article Storage

## 🔐 Environment Variables (Backend)

### Required
```env
OPENROUTER_API_KEY=sk-or-...
```

### Recommended
```env
APP_PASSWORD=your-secure-password
SESSION_SECRET=random-secret-minimum-32-chars
OPENROUTER_MODEL=openai/gpt-4o-mini
FRONTEND_URL=https://your-domain.com
```

### Optional (LinkedIn Automation)
```env
BROWSER_USE_API_KEY=your-key
LINKEDIN_EMAIL=your-email
LINKEDIN_PASSWORD=your-password
```

### Optional (Email Notifications)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TO=recipient@email.com
```

### Optional (Scheduled Posts)
```env
SCHEDULE_ENABLED=true
SCHEDULE_TIME=09:00
SCHEDULE_TIMEZONE=Europe/Berlin
SCHEDULE_TOPICS=AI,Remote Work,Leadership,Tech Trends
```

## 🔄 CI/CD Workflow

### Automatic Triggers
- Push to `main` → Build and push `latest` tag
- Push to `develop` → Build and push `develop` tag
- Create tag `v1.0.0` → Build and push semantic version tags
- Pull Request → Build only (no push)

### Manual Trigger
```bash
# Via GitHub UI: Actions → Build and Push → Run workflow
```

### Secrets Required
- **GITHUB_TOKEN**: Auto-provided by GitHub Actions
- No additional secrets needed! 🎉

## 📊 Health Checks

### Frontend
```bash
curl http://localhost/
# Should return 200 OK
```

### Backend
```bash
curl http://localhost:3001/api/health
# Should return {"status":"ok"}
```

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Data Persistence
```bash
# Backup articles
docker cp coolify-backend:/app/data ./backup

# Restore articles
docker cp ./backup/articles.json coolify-backend:/app/data/
```

### Network Issues
```bash
# Check network
docker network inspect coolify-button-app_default

# Recreate network
docker-compose down
docker-compose up -d
```

## 🎯 Production Checklist

- [ ] Set strong `APP_PASSWORD`
- [ ] Generate secure `SESSION_SECRET` (32+ chars)
- [ ] Configure `OPENROUTER_API_KEY`
- [ ] Set `FRONTEND_URL` to actual domain
- [ ] Enable HTTPS via Coolify/Reverse Proxy
- [ ] Configure volume backup for `/app/data`
- [ ] Set up monitoring/alerts
- [ ] Test health checks
- [ ] Verify CORS settings
- [ ] Check logs for errors

## 📈 Scaling

### Horizontal Scaling
- Frontend: Kann beliebig skaliert werden (stateless)
- Backend: Shared data directory erforderlich (NFS/S3)

### Vertical Scaling
- Frontend: 256MB RAM minimum
- Backend: 512MB RAM minimum, 1GB empfohlen

## 🔒 Security Hardening

1. **Reverse Proxy**: Use nginx/Traefik with SSL
2. **Rate Limiting**: Implement on proxy level
3. **Secrets**: Use Coolify secrets management
4. **Firewall**: Block direct container access
5. **Updates**: Auto-pull latest images via Coolify

## 📝 Monitoring

### Container Logs
```bash
docker-compose logs -f --tail=100
```

### Resource Usage
```bash
docker stats
```

### Health Status
```bash
docker-compose ps
```

## 🆘 Support

Bei Problemen:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Test local build: `npm run build`
4. Check GitHub Actions for CI errors
5. Review this guide's troubleshooting section
