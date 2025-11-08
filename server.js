const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || '';
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';
const APP_PASSWORD = process.env.APP_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware - BEFORE any routes
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // If requesting HTML page, redirect to login
  if (req.accepts('html')) {
    return res.redirect('/login');
  }
  
  // If API request, return 401
  res.status(401).json({ success: false, error: 'Not authenticated' });
};

// Public routes - NO AUTH REQUIRED
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Serve static files - PUBLIC (styles, scripts need to load before auth check)
app.use('/styles.css', express.static(path.join(__dirname, 'public', 'styles.css')));
app.use('/app.js', express.static(path.join(__dirname, 'public', 'app.js')));

// Protected routes - AUTH REQUIRED
app.post('/api/action/:id', requireAuth, async (req, res) => {
  const actionId = req.params.id;
  
  console.log(`Action triggered: ${actionId}`);
  
  try {
    switch(actionId) {
      case '1':
        // LinkedIn Post Generator via Browser-Use
        const { topic } = req.body;
        
        if (!topic) {
          return res.status(400).json({ 
            success: false, 
            error: 'Bitte gib ein Thema ein' 
          });
        }
        
        if (!BROWSER_USE_API_KEY || !LINKEDIN_EMAIL || !LINKEDIN_PASSWORD) {
          return res.status(500).json({ 
            success: false, 
            error: 'Browser-Use oder LinkedIn Credentials nicht konfiguriert' 
          });
        }
        
        console.log(`Creating LinkedIn post about: ${topic}`);
        
        const taskPrompt = `
1. Navigate to https://www.linkedin.com/login
2. Wait 3 seconds for page load
3. Fill email field with: ${LINKEDIN_EMAIL}
4. Fill password field with: ${LINKEDIN_PASSWORD}
5. Click the Sign in button
6. Wait 15 seconds for any redirects or verification
7. If verification needed, wait 60 seconds for user to complete it
8. Navigate to https://www.linkedin.com/feed/
9. Wait 5 seconds
10. Click Start a post button
11. Wait 2 seconds
12. Write a comprehensive LinkedIn post about: "${topic}"
    - Make it engaging and professional
    - Include relevant insights and takeaways
    - Add 3-5 relevant hashtags
    - Aim for 200-300 words
13. Click Post button
14. Wait 5 seconds to confirm posting
15. Task completed successfully
        `.trim();
        
        const createResponse = await fetch('https://api.browser-use.com/api/v1/run-task', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${BROWSER_USE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task: taskPrompt,
            max_steps: 20
          })
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Browser-Use API Error:', errorText);
          throw new Error(`Browser-Use API returned ${createResponse.status}: ${errorText}`);
        }
        
        const taskData = await createResponse.json();
        
        res.json({ 
          success: true, 
          message: `LinkedIn Post wird erstellt zum Thema: ${topic}`,
          data: {
            task_id: taskData.id,
            status: 'Task gestartet',
            live_url: taskData.live_url,
            topic: topic
          },
          timestamp: new Date().toISOString()
        });
        break;
        
      case '2':
        console.log('Executing Action 2...');
        res.json({ 
          success: true, 
          message: 'Action 2 executed successfully',
          timestamp: new Date().toISOString()
        });
        break;
        
      case '3':
        console.log('Executing Action 3...');
        res.json({ 
          success: true, 
          message: 'Action 3 executed successfully',
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        console.log(`Executing Action ${actionId}...`);
        res.json({ 
          success: true, 
          message: `Action ${actionId} executed successfully`,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Action error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Action failed' 
    });
  }
});

// Dashboard - AUTH REQUIRED
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all - AUTH REQUIRED
app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Browser-Use API: ${BROWSER_USE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`LinkedIn Email: ${LINKEDIN_EMAIL ? 'Configured' : 'Not configured'}`);
  console.log(`App Password: ${APP_PASSWORD !== 'changeme123' ? 'Custom' : 'DEFAULT (CHANGE THIS!)'}`);
});
