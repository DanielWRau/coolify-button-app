const express = require('express');
const path = require('path');
const session = require('express-session');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || '';
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';
const APP_PASSWORD = process.env.APP_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

// Load LinkedIn post prompt structure
const postPrompt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts', 'linkedin-post-structure.json'), 'utf8')
);

// Scheduled post configuration (stored in memory, can be persisted to DB later)
let scheduledPostConfig = {
  enabled: false,
  time: '09:00', // Default: 9:00 AM
  timezone: 'Europe/Berlin',
  topics: [
    'AI in der Softwareentwicklung',
    'Remote Work Best Practices',
    'Leadership Lessons',
    'Tech Trends 2025'
  ]
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  if (req.accepts('html')) {
    return res.redirect('/login');
  }
  
  res.status(401).json({ success: false, error: 'Not authenticated' });
};

// AI Post Generation Function
async function generateLinkedInPost(topic) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }

  const prompt = `${postPrompt.system_prompt}

THEMA: ${topic}

STRUKTUR:
${JSON.stringify(postPrompt.post_structure, null, 2)}

RICHTLINIEN:
${JSON.stringify(postPrompt.guidelines, null, 2)}

Erstelle jetzt einen LinkedIn Post zu diesem Thema. Der Post sollte direkt als fertiger Text zurückgegeben werden, ohne zusätzliche Erklärungen.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://buttons.a-g-e-n-t.de',
      'X-Title': 'Button Dashboard'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Browser-Use LinkedIn Posting Function
async function postToLinkedIn(content) {
  if (!BROWSER_USE_API_KEY || !LINKEDIN_EMAIL || !LINKEDIN_PASSWORD) {
    throw new Error('Browser-Use or LinkedIn credentials not configured');
  }

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
12. Type the following post content exactly as written:

${content}

13. Click Post button
14. Wait 5 seconds to confirm posting
15. Task completed successfully
  `.trim();

  const response = await fetch('https://api.browser-use.com/api/v1/run-task', {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Browser-Use API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Scheduled Post Execution
async function executeScheduledPost() {
  if (!scheduledPostConfig.enabled) {
    return;
  }

  try {
    console.log('[SCHEDULED] Starting scheduled LinkedIn post...');
    
    // Pick random topic
    const randomTopic = scheduledPostConfig.topics[
      Math.floor(Math.random() * scheduledPostConfig.topics.length)
    ];
    
    console.log(`[SCHEDULED] Topic: ${randomTopic}`);
    
    // Generate post with AI
    const generatedPost = await generateLinkedInPost(randomTopic);
    console.log(`[SCHEDULED] AI generated post (${generatedPost.length} chars)`);
    
    // Post to LinkedIn
    const result = await postToLinkedIn(generatedPost);
    console.log(`[SCHEDULED] Posted successfully! Task ID: ${result.id}`);
    
  } catch (error) {
    console.error('[SCHEDULED] Error:', error.message);
  }
}

// Setup Cron Job
function setupScheduledPost() {
  const [hour, minute] = scheduledPostConfig.time.split(':');
  const cronExpression = `${minute} ${hour} * * *`; // Every day at specified time
  
  cron.schedule(cronExpression, executeScheduledPost, {
    timezone: scheduledPostConfig.timezone
  });
  
  console.log(`Scheduled LinkedIn post set for ${scheduledPostConfig.time} ${scheduledPostConfig.timezone}`);
}

// Initialize scheduled post if enabled
if (scheduledPostConfig.enabled) {
  setupScheduledPost();
}

// Public routes
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

// Serve static files
app.use('/styles.css', express.static(path.join(__dirname, 'public', 'styles.css')));
app.use('/app.js', express.static(path.join(__dirname, 'public', 'app.js')));

// Protected routes

// Get schedule config
app.get('/api/schedule', requireAuth, (req, res) => {
  res.json(scheduledPostConfig);
});

// Update schedule config
app.post('/api/schedule', requireAuth, (req, res) => {
  const { enabled, time, topics } = req.body;
  
  if (enabled !== undefined) scheduledPostConfig.enabled = enabled;
  if (time) scheduledPostConfig.time = time;
  if (topics && Array.isArray(topics)) scheduledPostConfig.topics = topics;
  
  // Restart cron job if config changed
  if (scheduledPostConfig.enabled) {
    setupScheduledPost();
  }
  
  res.json({ success: true, config: scheduledPostConfig });
});

// Generate LinkedIn post with AI
app.post('/api/generate-post', requireAuth, async (req, res) => {
  const { topic } = req.body;
  
  if (!topic) {
    return res.status(400).json({ success: false, error: 'Topic required' });
  }
  
  try {
    const generatedPost = await generateLinkedInPost(topic);
    res.json({ success: true, content: generatedPost });
  } catch (error) {
    console.error('AI Generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Action endpoints
app.post('/api/action/:id', requireAuth, async (req, res) => {
  const actionId = req.params.id;
  
  console.log(`Action triggered: ${actionId}`);
  
  try {
    switch(actionId) {
      case '1':
        // LinkedIn Post Generator
        const { topic, useAI } = req.body;
        
        if (!topic) {
          return res.status(400).json({ 
            success: false, 
            error: 'Bitte gib ein Thema ein' 
          });
        }
        
        let postContent = topic;
        
        // Generate with AI if requested
        if (useAI) {
          try {
            postContent = await generateLinkedInPost(topic);
            console.log(`AI generated post: ${postContent.substring(0, 100)}...`);
          } catch (aiError) {
            console.error('AI generation failed, using manual topic:', aiError);
            // Fallback to manual topic if AI fails
          }
        }
        
        // Post to LinkedIn
        const taskData = await postToLinkedIn(postContent);
        
        res.json({ 
          success: true, 
          message: `LinkedIn Post wird erstellt${useAI ? ' (AI-generiert)' : ''}`,
          data: {
            task_id: taskData.id,
            status: 'Task gestartet',
            live_url: taskData.live_url,
            topic: topic,
            ai_generated: useAI || false
          },
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

// Dashboard
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all
app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Browser-Use API: ${BROWSER_USE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`LinkedIn Email: ${LINKEDIN_EMAIL ? 'Configured' : 'Not configured'}`);
  console.log(`OpenRouter API: ${OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`Scheduled Posts: ${scheduledPostConfig.enabled ? 'ENABLED at ' + scheduledPostConfig.time : 'DISABLED'}`);
});
