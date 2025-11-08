# Coolify Button Dashboard

Secure button dashboard with iPhone-style homescreen interface and session-based authentication.

## Features

- Modern iPhone-style glassmorphic UI
- Session-based authentication (24h)
- Secure action execution via Browser-Use API
- Automated LinkedIn posting with AI-generated content
- Input modal for dynamic parameters
- Toast notifications for action feedback
- Responsive design (mobile & desktop)
- Docker-ready for Coolify deployment

## Tech Stack

- **Backend:** Node.js + Express + express-session
- **Frontend:** Vanilla HTML/CSS/JavaScript (no build step)
- **Automation:** Browser-Use API
- **Deployment:** Docker + Coolify
- **SSL:** Automatic via Coolify/Traefik

## Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/DanielWRau/coolify-button-app.git
cd coolify-button-app

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start server
npm start
```

App runs on http://localhost:3000

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Coolify deployment guide.

## Environment Variables

```bash
PORT=3000                          # Server port
NODE_ENV=production                # Environment

# App Authentication
APP_PASSWORD=your_secure_password  # App login password
SESSION_SECRET=random_32_chars     # Session encryption key

# Browser-Use Integration
BROWSER_USE_API_KEY=xxx            # Browser-Use API key
LINKEDIN_EMAIL=your@email.com      # LinkedIn credentials
LINKEDIN_PASSWORD=your_password    # LinkedIn credentials

# OpenRouter AI Configuration
OPENROUTER_API_KEY=sk-or-xxx      # OpenRouter API key
OPENROUTER_MODEL=openai/gpt-4.1-mini  # AI model to use

# Scheduled Posts (Persists across redeployments)
SCHEDULE_ENABLED=true              # Enable daily posts
SCHEDULE_TIME=09:00                # Post time (24h format)
SCHEDULE_TIMEZONE=Europe/Berlin    # Timezone
SCHEDULE_TOPICS=Topic 1,Topic 2,Topic 3  # Comma-separated topics
```

**Security Notes:**
- Change `APP_PASSWORD` to a strong password
- Generate random `SESSION_SECRET` (min. 32 characters)
- Never commit credentials to Git
- Use Coolify's Secret management

**Scheduled Posts Notes:**
- ENV configuration persists across Coolify redeployments
- UI changes override ENV until next deployment
- Set `SCHEDULE_ENABLED=true` to activate on startup
- Topics can be managed via Settings UI (Button 6)

## Authentication

### How it works

1. **First visit:** Redirected to `/login`
2. **Password check:** Enter `APP_PASSWORD`
3. **Session created:** 24-hour session cookie set
4. **Dashboard access:** Full access to all buttons
5. **Auto-expire:** Session expires after 24h

### Security Features

- Session-based authentication
- Secure cookies (HTTPS-only in production)
- HttpOnly cookies (XSS protection)
- No database required
- Simple password management via environment variables

## Current Actions

### Action 1: LinkedIn Post Generator

Creates and posts AI-generated LinkedIn content:

1. Click "Post Gen" button
2. Enter topic in modal
3. Browser-Use automation:
   - Logs into LinkedIn
   - Generates professional post content
   - Posts to your LinkedIn feed
   - Includes relevant hashtags

### Actions 2-6

Placeholder buttons ready for customization.

## API Endpoints

```
GET  /health              - Health check (no auth)
GET  /login               - Login page (no auth)
POST /auth/login          - Authenticate user
POST /auth/logout         - Destroy session
POST /api/action/:id      - Trigger action (auth required)
GET  /*                   - Dashboard (auth required)
```

### Example Request

```bash
# Login first
curl -c cookies.txt -X POST https://buttons.a-g-e-n-t.de/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_app_password"}'

# Then call action
curl -b cookies.txt -X POST https://buttons.a-g-e-n-t.de/api/action/1 \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI in Software Development"}'
```

## Project Structure

```
coolify-button-app/
├── server.js              # Express backend with auth
├── package.json           # Dependencies
├── Dockerfile             # Container config
├── .env.example           # Environment template
├── DEPLOYMENT.md          # Deployment guide
├── README.md              # This file
└── public/
    ├── index.html         # Dashboard UI
    ├── login.html         # Login page
    ├── app.js             # Frontend logic
    └── styles.css         # Glassmorphic styling
```

## Customization

### Add New Action

1. **Frontend:** Add button in `public/index.html`
2. **Logic:** Add handler in `public/app.js`
3. **Backend:** Add endpoint in `server.js`

Example:

```javascript
// server.js
case '2':
  const result = await yourCustomAction(req.body);
  res.json({ success: true, message: 'Done!', data: result });
  break;
```

## Security

### Best Practices

- Strong `APP_PASSWORD` (min. 12 characters)
- Random `SESSION_SECRET` (min. 32 characters)
- All secrets in Coolify as "Secret" variables
- HTTPS enforced via Coolify
- **DO NOT** use Coolify Basic Auth (causes SSL errors)

### Session Management

- 24-hour session duration
- Automatic expiration
- Secure cookies in production
- HttpOnly protection

## Coolify Deployment

### Important: SSL Configuration

**DO NOT activate Coolify's Basic Authentication!**

Coolify's Basic Auth causes `SSL_ERROR_INTERNAL_ERROR_ALERT` errors. This app has built-in session-based authentication that works perfectly with SSL.

### Setup Steps

1. Connect GitHub repository to Coolify
2. Set all environment variables
3. **Disable Coolify Basic Auth**
4. Configure domain and SSL
5. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Monitoring

Check app health:
```bash
curl https://buttons.a-g-e-n-t.de/health
```

Expected response:
```json
{"status":"ok"}
```

View logs in Coolify dashboard.

## Troubleshooting

### SSL_ERROR_INTERNAL_ERROR_ALERT

**Cause:** Coolify Basic Auth is enabled  
**Solution:** Disable Basic Auth in Coolify → Security settings

### Container exits immediately

**Cause:** Syntax error or missing environment variables  
**Solution:** Check Coolify logs for error messages

### Can't login

**Cause:** Wrong `APP_PASSWORD` or not set  
**Solution:** Verify environment variable in Coolify

### Session expires too fast

**Normal:** Sessions last 24 hours  
**Solution:** Just login again

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting tips.

## License

MIT

## Support

For issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review Coolify logs
3. Verify environment variables
4. Check Browser-Use API status
5. Ensure Coolify Basic Auth is **disabled**

## Roadmap

- [x] Session-based authentication
- [x] LinkedIn post automation
- [ ] Add more action templates
- [ ] Action history/logging
- [ ] Webhook support
- [ ] Scheduled actions
- [ ] Multi-user support
