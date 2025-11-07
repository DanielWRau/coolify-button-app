const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Password from environment (hashed)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10);

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
  
  const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  
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
  
  // Here you can add your actual action logic
  // For now, just return success
  
  try {
    // Example: Different actions based on ID
    switch(actionId) {
      case '1':
        console.log('Executing Action 1...');
        break;
      case '2':
        console.log('Executing Action 2...');
        break;
      case '3':
        console.log('Executing Action 3...');
        break;
      default:
        console.log(`Executing Action ${actionId}...`);
    }
    
    res.json({ 
      success: true, 
      message: `Action ${actionId} executed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Action error:', error);
    res.status(500).json({ error: 'Action failed' });
  }
});

// Catch-all route - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});