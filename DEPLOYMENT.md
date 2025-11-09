# Deployment Guide

## 🐳 Container Strategy

This project uses **GitHub Actions** to automatically build and push Docker images to GitHub Container Registry (ghcr.io).

### Automatic Builds

Every push to `main` triggers:
- ✅ Build of `frontend` and `backend` containers
- ✅ Push to `ghcr.io/danielwrau/coolify-button-app-frontend:latest`
- ✅ Push to `ghcr.io/danielwrau/coolify-button-app-backend:latest`
- ✅ Multi-arch support (amd64 + arm64)

**Images are public** - No authentication needed to pull!

---

## 🚀 Coolify Deployment

### 1. Create New Resource

1. Login to Coolify
2. **+ New Resource** → **Docker Compose**
3. Git Source: `DanielWRau/coolify-button-app`
4. Branch: `main`

### 2. Configure Environment Variables

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-...
APP_PASSWORD=your-secure-password
SESSION_SECRET=generate-64-char-random-string

# Optional - Custom Model
OPENROUTER_MODEL=openai/gpt-4o-mini

# Optional - LinkedIn Automation
BROWSER_USE_API_KEY=your-api-key
LINKEDIN_EMAIL=your-email
LINKEDIN_PASSWORD=your-password

# Optional - Email Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@example.com

# Optional - Scheduling
SCHEDULE_ENABLED=false
SCHEDULE_TIME=09:00
SCHEDULE_TIMEZONE=Europe/Berlin
SCHEDULE_TOPICS=AI,Tech,Business
```

### 3. Set Domain

- Frontend: `app.your-domain.com`
- Enable HTTPS (automatic Let's Encrypt)

### 4. Deploy

Click **Deploy** - Coolify will:
1. Pull pre-built images from ghcr.io (fast!)
2. Start containers with your env vars
3. Configure reverse proxy automatically

---

## 🛠️ Local Development

Use `docker-compose.dev.yml` for local builds:

```bash
# Build and run locally
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.dev.yml down
```

---

## 📦 Container Images

**Frontend**: `ghcr.io/danielwrau/coolify-button-app-frontend:latest`
- Nginx + React/Vite build
- ~50MB compressed
- Port: 80

**Backend**: `ghcr.io/danielwrau/coolify-button-app-backend:latest`
- Node.js + Next.js
- ~200MB compressed
- Port: 3001

---

## 🔄 Update Strategy

**Automatic Updates**:
1. Push code to `main` branch
2. GitHub Actions builds new images (5-10 min)
3. In Coolify: Click **Redeploy** to pull latest images

**Manual Image Tags**:
```yaml
# In docker-compose.yml, use specific commit SHA
image: ghcr.io/danielwrau/coolify-button-app-backend:main-abc1234
```

---

## 🔍 Troubleshooting

**Image pull fails**:
- Images are public, no auth needed
- Check GitHub Actions completed successfully
- Verify image name matches exactly

**Container won't start**:
- Check Coolify logs for missing env vars
- Ensure `OPENROUTER_API_KEY` is set
- Verify backend health check passes

**Build takes too long in Coolify**:
- You shouldn't be building in Coolify!
- Ensure `docker-compose.yml` uses `image:` not `build:`
- Check GitHub Actions ran successfully

---

## 📊 Resources

**Expected Usage**:
- Frontend: ~50MB RAM
- Backend: ~150-300MB RAM
- Storage: ~100MB (persistent data)

**Startup Time**:
- Image pull: ~30 seconds
- Container start: ~10 seconds
- Total: <1 minute
