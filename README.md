# Coolify Button Dashboard

Secure button dashboard with iPhone-style homescreen interface for triggering automated actions via Browser-Use API.

## Features

- Modern iPhone-style glassmorphic UI
- Secure action execution via Browser-Use API
- Automated LinkedIn posting with AI-generated content
- Input modal for dynamic parameters
- Toast notifications for action feedback
- Responsive design (mobile & desktop)
- Docker-ready for Coolify deployment

## Tech Stack

- **Backend:** Node.js + Express
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
# Edit .env with your API keys

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
BROWSER_USE_API_KEY=xxx            # Browser-Use API key
LINKEDIN_EMAIL=your@email.com      # LinkedIn credentials
LINKEDIN_PASSWORD=your_password    # LinkedIn credentials
```

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
GET  /health              - Health check
POST /api/action/:id      - Trigger action (1-6)
```

### Example Request

```bash
curl -X POST https://buttons.a-g-e-n-t.de/api/action/1 \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI in Software Development"}'
```

## Project Structure

```
coolify-button-app/
├── server.js              # Express backend
├── package.json           # Dependencies
├── Dockerfile             # Container config
├── .env.example           # Environment template
├── DEPLOYMENT.md          # Deployment guide
├── README.md              # This file
└── public/
    ├── index.html         # Main UI
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

- All secrets stored as Coolify environment variables
- No hardcoded credentials in code
- HTTPS enforced via Coolify
- Health check endpoint for monitoring

## Monitoring

Check app health:
```bash
curl https://buttons.a-g-e-n-t.de/health
```

View logs in Coolify dashboard.

## License

MIT

## Support

For issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review Coolify logs
3. Verify environment variables
4. Check Browser-Use API status

## Roadmap

- [ ] Add authentication/password protection
- [ ] Add more action templates
- [ ] Add action history/logging
- [ ] Add webhook support
- [ ] Add scheduled actions
