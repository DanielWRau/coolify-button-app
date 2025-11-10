# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Secure button dashboard application with iPhone-style UI, JWT authentication, and automated LinkedIn posting via Browser-Use API. Built for Coolify deployment with Docker and GitHub Actions.

**Tech Stack**:
- **Backend**: Next.js 15 App Router + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Deployment**: Docker multi-service with Nginx reverse proxy

## CORS & Authentication

### Dynamic CORS with Middleware
- **File**: `backend/src/middleware.ts`
- **Purpose**: Runtime origin detection for multi-domain support
- **How it works**:
  - Reads `Origin` header from incoming requests
  - Reflects it in `Access-Control-Allow-Origin` response
  - Handles OPTIONS preflight requests
  - Supports Nginx reverse proxy setup

### Why Dynamic CORS?
Docker images are built in GitHub Actions without knowledge of deployment domain. Static `FRONTEND_URL` would be hardcoded at build-time. Middleware allows same image to work on:
- Development: `localhost:3000`
- Staging: `staging.example.com`
- Production: `buttons.a-g-e-n-t.de`

### Authentication Flow
- **JWT-based**: Tokens generated at `/api/auth/login`
- **Storage**: Frontend `localStorage` (`auth_token`)
- **Validation**: Every API request via `requireAuth` wrapper
- **Expiry**: 24 hours (configurable in `backend/src/lib/jwt.ts`)

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Run application locally
npm start

# Access application
http://localhost:3000
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with required credentials
# Required: APP_PASSWORD, SESSION_SECRET, BROWSER_USE_API_KEY
# Optional: OPENROUTER_API_KEY for AI generation
```

### Testing Deployment
The application uses Docker for deployment. Test locally:
```bash
docker build -t button-dashboard .
docker run -p 3000:3000 --env-file .env button-dashboard
```

## Architecture

### Core Application Structure

**Express Server** (`server.js`):
- Session-based authentication middleware (`requireAuth`)
- Express-session with 24-hour cookie expiration
- Trust proxy settings for reverse proxy compatibility
- Cron job scheduler for automated LinkedIn posts (node-cron)
- Article posting scheduler (checks every 5 minutes)

**Authentication Flow**:
1. All routes except `/health` and `/login` require authentication
2. Session stored in memory (no database)
3. Cookie security: `httpOnly: true`, `secure: production`, `sameSite: 'lax'`
4. **Critical**: Set `trust proxy: 1` for reverse proxy environments

**Frontend Architecture** (`public/`):
- `index.html`: iPhone-style glassmorphic dashboard with 8 button grid
- `login.html`: Session-based login page
- `app.js`: Frontend logic for button actions, modals, toast notifications
- `styles.css`: Glassmorphic design with backdrop blur effects
- No build step required - served as static files

### LinkedIn Automation System

**Post Generation Flow**:
1. User provides topic via modal input
2. AI generates professional LinkedIn content (OpenRouter API)
3. Browser-Use API automates LinkedIn login and posting
4. Two distinct prompts: manual posts vs. scheduled posts

**Scheduled Posts**:
- Configurable via environment variables or Settings UI (Button 6)
- ENV variables persist across Coolify redeployments
- Cron expression generated from `SCHEDULE_TIME` and `SCHEDULE_TIMEZONE`
- Random topic selection from configured topic list
- Timezone: Europe/Berlin (MEZ/MESZ) - set in Dockerfile

**Prompt System** (`prompts/`):
- `linkedin-post-structure.json`: Manual post template
- `scheduled-posts-prompt.json`: Automated post template
- `topic-generation-prompt.json`: AI topic generator template

### Article Management System

**AI-Powered Article Generation** (`lib/article-tools.js`):
- Uses Vercel AI SDK with OpenRouter provider
- Three-stage generation with tools:
  1. `researchTool`: Gathers facts, trends, insights
  2. `outlineTool`: Creates structured article outline
  3. `writeTool`: Writes complete article from outline
- Supports short (500-800), medium (800-1500), long (1500-2500) word counts

**Article Storage** (`lib/article-storage.js`):
- JSON file-based storage in `data/articles.json`
- Article lifecycle: draft → scheduled → posted
- Automatic timestamps (createdAt, updatedAt)
- Scheduling system with `scheduledFor` datetime

**Article Workflow**:
1. Generate article with AI tools (research → outline → write)
2. Store in JSON storage with 'draft' status
3. Schedule for future posting with datetime
4. Cron job checks every 5 minutes for scheduled articles
5. Post to LinkedIn and update status to 'posted'

### API Endpoints

**Authentication**:
- `POST /auth/login` - Password authentication, creates session
- `POST /auth/logout` - Destroys session

**LinkedIn Actions**:
- `POST /api/action/1` - LinkedIn post (with optional AI generation)
- `POST /api/generate-post` - Generate LinkedIn post content only
- `POST /api/generate-post-email` - Generate post and send via SMTP

**Scheduled Posts Management**:
- `GET /api/schedule` - Get current configuration
- `POST /api/schedule` - Update schedule settings (enabled, time, topics)
- `POST /api/generate-topics` - AI-generate topic suggestions

**Article Management**:
- `POST /api/articles/generate` - Generate new article with AI
- `GET /api/articles` - List all articles
- `GET /api/articles/:id` - Get single article
- `PUT /api/articles/:id` - Update article content
- `DELETE /api/articles/:id` - Delete article
- `POST /api/articles/:id/schedule` - Schedule article for posting
- `POST /api/articles/:id/post` - Post article immediately

### Button Actions

**Active Buttons**:
1. **LinkedIn Post**: Generate and post AI content to LinkedIn
2. **Email Post**: Generate post and send via SMTP
6. **Settings**: Configure scheduled posts (time, topics, enable/disable)

**Disabled Buttons** (3-5, 7-8): Placeholder for future actions

### Security Considerations

**Session Security**:
- Sessions are memory-based (lost on restart)
- 24-hour expiration
- Secure cookies in production
- HttpOnly prevents XSS access

**Reverse Proxy Compatibility**:
- `app.set('trust proxy', 1)` required for Coolify/nginx
- Enables proper secure cookie handling behind proxy
- Trusts `X-Forwarded-*` headers

**Important Deployment Note**:
- **Never** enable Coolify's Basic Authentication
- Causes `SSL_ERROR_INTERNAL_ERROR_ALERT` errors
- App has built-in session authentication

### Environment Variables

**Required**:
- `APP_PASSWORD`: Dashboard login password
- `SESSION_SECRET`: Session encryption key (min 32 chars)
- `BROWSER_USE_API_KEY`: Browser automation API key
- `LINKEDIN_EMAIL`, `LINKEDIN_PASSWORD`: LinkedIn credentials

**Optional**:
- `OPENROUTER_API_KEY`: For AI post generation
- `OPENROUTER_MODEL`: Model selection (default: openai/gpt-4.1-mini)
- `SCHEDULE_ENABLED`: Enable automated daily posts (true/false)
- `SCHEDULE_TIME`: Daily post time in HH:MM format (Europe/Berlin)
- `SCHEDULE_TOPICS`: Comma-separated topic list
- `SMTP_*`: Email configuration for Button 2

### Timezone Configuration

**Critical**: Application runs in Europe/Berlin timezone
- Dockerfile sets system timezone to Europe/Berlin
- All cron jobs use `timezone: 'Europe/Berlin'`
- Article posting scheduler runs in Berlin time
- Scheduled post times are interpreted as MEZ/MESZ

**Do not change** timezone settings without updating:
1. Dockerfile (`TZ=Europe/Berlin`)
2. Cron job configuration
3. Environment variable `SCHEDULE_TIMEZONE`

### Adding New Actions

1. **Frontend**: Add button in `public/index.html` with `data-action="N"`
2. **Button Logic**: Add click handler in `public/app.js`
3. **Backend**: Add case in `server.js` switch statement (line ~543)
4. **API Integration**: Implement action logic with error handling

### Code Patterns

**Error Handling**:
- Always wrap async operations in try-catch
- Return structured JSON responses: `{ success: boolean, error?: string }`
- Log errors with context: `console.error('[CONTEXT] Error:', error)`

**AI Generation Pattern**:
```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  })
});
```

**Article Generation Pattern**:
```javascript
const { generateArticle } = require('./lib/article-tools');
const result = await generateArticle(topic, {
  focus: 'practical insights',
  targetLength: 'medium',
  tone: 'professional',
});
```

**Browser-Use Integration**:
- Construct step-by-step task prompt with explicit wait times
- Handle 2FA/verification with extended timeouts (60s)
- Post task to Browser-Use API endpoint
- Return task ID for tracking

### Frontend Components

**Modal System**:
- Input modal for topic entry
- Settings modal for scheduled post configuration
- Toast notifications for action feedback

**Button States**:
- Active: Full opacity, clickable
- Disabled: 40% opacity, pointer-events disabled
- Loading: Shows spinner during action execution

## Key Implementation Details

**Scheduled Post Configuration Persistence**:
- Environment variables provide defaults on startup
- UI changes update runtime configuration
- Configuration lost on restart unless ENV updated
- Settings modal allows runtime management

**Session Management**:
- In-memory sessions (restart clears all sessions)
- No session persistence to database
- Users must re-login after server restart

**Cron Job Management**:
- LinkedIn post scheduler: Dynamic cron expression from time config
- Article posting scheduler: Fixed 5-minute interval
- Timezone awareness for all scheduled tasks

**Article Storage**:
- File-based JSON storage (no database)
- Automatic directory creation on first use
- Thread-safe read/write operations
