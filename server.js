const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || crypto.createHash('sha256').update('admin123').digest('hex');
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || '';
const BROWSER_USE_TASK_ID = process.env.BROWSER_USE_TASK_ID || '';

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  
  // Hash incoming password with SHA256 and compare
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const isValid = passwordHash === ADMIN_PASSWORD_HASH;
  
  if (isValid) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Action endpoints (protected)
app.post('/api/action/:id', requireAuth, async (req, res) => {
  const actionId = req.params.id;
  
  console.log(`Action triggered: ${actionId}`);
  
  try {
    switch(actionId) {
      case '1':
        // Browser-Use API Check
        if (!BROWSER_USE_API_KEY || !BROWSER_USE_TASK_ID) {
          return res.status(500).json({ 
            success: false, 
            error: 'Browser-Use credentials not configured' 
          });
        }
        
        console.log('Checking Browser-Use Task Status...');
        
        // Wait 30 seconds before checking
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const response = await fetch(`https://api.browser-use.com/api/v1/task/${BROWSER_USE_TASK_ID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${BROWSER_USE_API_KEY}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const taskData = await response.json();
        
        res.json({ 
          success: true, 
          message: 'Browser-Use task checked',
          data: {
            status: taskData.status,
            task: taskData.task,
            steps: taskData.steps?.length || 0,
            live_url: taskData.live_url
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

// Catch-all route - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Browser-Use API: ${BROWSER_USE_API_KEY ? 'Configured' : 'Not configured'}`);
});