# Coolify Button Dashboard - Modernized

Modern LinkedIn automation dashboard mit React Frontend und Next.js Backend.

## 🏗️ Architektur

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Next.js 15 + Vercel AI SDK + TypeScript
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## 📁 Projektstruktur

```
.
├── frontend/               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── lib/          # API Client & Utils
│   │   ├── types/        # TypeScript Types
│   │   └── App.tsx       # Main App
│   ├── Dockerfile        # Frontend Container
│   └── nginx.conf        # Nginx Config
│
├── backend/               # Next.js Backend
│   ├── src/
│   │   ├── app/api/      # API Routes
│   │   └── lib/          # Backend Logic
│   └── Dockerfile        # Backend Container
│
├── docker-compose.yml     # Local Development
└── .github/workflows/     # CI/CD Pipeline
```

## 🚀 Quick Start

### 1. Lokale Entwicklung

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# → http://localhost:5173
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# → http://localhost:3001
```

### 2. Docker Development

```bash
# Build und Start
docker-compose up --build

# Frontend: http://localhost
# Backend: http://localhost:3001
```

### 3. Production Build

**Frontend Build Test:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend Build Test:**
```bash
cd backend
npm run build
npm start
```

**Docker Production Test:**
```bash
docker-compose build
docker-compose up
```

## 🧪 Build Tests

### Frontend Build
```bash
cd frontend
npm install
npm run build
```
Expected output: `dist/` directory mit optimierten Assets

### Backend Build
```bash
cd backend
npm install
npm run build
```
Expected output: `.next/` directory mit optimiertem Next.js Build

### Docker Builds
```bash
# Frontend Container
docker build -t coolify-frontend ./frontend

# Backend Container
docker build -t coolify-backend ./backend

# Multi-platform Build (GitHub Actions simulieren)
docker buildx build --platform linux/amd64,linux/arm64 -t coolify-frontend ./frontend
docker buildx build --platform linux/amd64,linux/arm64 -t coolify-backend ./backend
```

## 🔧 Konfiguration

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```env
# App
APP_PASSWORD=changeme123
SESSION_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# AI
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=openai/gpt-4o-mini

# Browser-Use
BROWSER_USE_API_KEY=your-key

# LinkedIn
LINKEDIN_EMAIL=your-email
LINKEDIN_PASSWORD=your-password

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@example.com
EMAIL_TO=recipient@example.com

# Schedule
SCHEDULE_ENABLED=false
SCHEDULE_TIME=09:00
SCHEDULE_TIMEZONE=Europe/Berlin
SCHEDULE_TOPICS=AI,Remote Work,Leadership
```

## 🐳 Container Registry

GitHub Actions pusht automatisch nach `ghcr.io`:

```bash
# Pull Images
docker pull ghcr.io/YOUR_USERNAME/coolify-button-app/frontend:latest
docker pull ghcr.io/YOUR_USERNAME/coolify-button-app/backend:latest

# Run
docker run -p 80:80 ghcr.io/YOUR_USERNAME/coolify-button-app/frontend:latest
docker run -p 3001:3001 \
  -e OPENROUTER_API_KEY=your-key \
  ghcr.io/YOUR_USERNAME/coolify-button-app/backend:latest
```

## 🔄 CI/CD Pipeline

Die GitHub Action (`.github/workflows/build-and-push.yml`) wird getriggert bei:

- **Push** auf `main` oder `develop`
- **Pull Requests** nach `main` oder `develop`
- **Tags** mit `v*` (z.B. v1.0.0)
- **Manuell** via Workflow Dispatch

### Build Matrix:
- ✅ Frontend: React + Vite → Nginx Container
- ✅ Backend: Next.js → Node Container
- ✅ Platforms: `linux/amd64`, `linux/arm64`
- ✅ Registry: GitHub Container Registry (ghcr.io)

### Image Tags:
- `latest` (main branch)
- `main`, `develop` (branch names)
- `v1.0.0`, `v1.0`, `v1` (semantic versions)
- `main-abc1234` (git SHA)

## 📦 Features

- ✅ Modern React 18 mit TypeScript
- ✅ TailwindCSS für Styling
- ✅ React Query für State Management
- ✅ Next.js 15 API Routes
- ✅ Vercel AI SDK Integration
- ✅ Cookie-basierte Auth
- ✅ Docker Multi-Stage Builds
- ✅ Nginx Reverse Proxy
- ✅ Health Checks
- ✅ Multi-Platform Support (AMD64 + ARM64)
- ✅ GitHub Actions CI/CD

## 🧰 Development Tools

**Frontend:**
- React Router für Routing
- Axios für API Calls
- Lucide React für Icons
- date-fns für Date Formatting

**Backend:**
- Next.js App Router
- Vercel AI SDK
- Zod für Validation
- Node-Cron für Scheduling

## 📝 API Endpoints

### Auth
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

### Articles
- `GET /api/articles` - List articles
- `POST /api/articles/generate` - Generate new article
- `GET /api/articles/:id` - Get article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `POST /api/articles/:id/schedule` - Schedule article
- `POST /api/articles/:id/post` - Post to LinkedIn

## 🚢 Deployment

### Coolify Deployment

1. **Repository verlinken** in Coolify
2. **Environment Variables** setzen
3. **Docker Compose** oder separate Services
4. **Deploy**

### Docker Compose Deployment

```bash
# .env File erstellen
cp backend/.env.example .env

# Services starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f

# Stoppen
docker-compose down
```

## 🔍 Troubleshooting

### Frontend Build Fehler
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Backend Build Fehler
```bash
cd backend
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Docker Build Fehler
```bash
# Cache clearen
docker builder prune -af

# Neu bauen
docker-compose build --no-cache
```

## 📊 Performance

- Frontend Build: ~30s
- Backend Build: ~45s
- Frontend Image: ~50MB (nginx:alpine)
- Backend Image: ~200MB (node:20-alpine)
- Startup Zeit: <5s (Frontend), <10s (Backend)

## 🔐 Security

- ✅ Cookie httpOnly für Auth
- ✅ CORS Protection
- ✅ Security Headers (nginx)
- ✅ Environment Variables für Secrets
- ✅ Production-ready Defaults

## 📄 License

Same as original project.
