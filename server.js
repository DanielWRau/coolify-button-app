require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cron = require('node-cron');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Import article tools
const { generateArticle } = require('./lib/article-tools');
const articleStorage = require('./lib/article-storage');

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

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;
const EMAIL_TO = process.env.EMAIL_TO || '';

// Load prompt structures
const postPrompt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts', 'linkedin-post-structure.json'), 'utf8')
);
const scheduledPostPrompt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts', 'scheduled-posts-prompt.json'), 'utf8')
);
const topicGenerationPrompt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts', 'topic-generation-prompt.json'), 'utf8')
);

// Scheduled post configuration with ENV support
const defaultTopics = [
  'AI in der Softwareentwicklung',
  'Remote Work Best Practices',
  'Leadership Lessons',
  'Tech Trends 2025'
];

// Parse topics from ENV (comma-separated string)
function parseTopicsFromEnv(envString) {
  if (!envString || envString.trim() === '') {
    return defaultTopics;
  }
  return envString.split(',').map(t => t.trim()).filter(t => t.length > 0);
}

// Initialize config from ENV or defaults
let scheduledPostConfig = {
  enabled: process.env.SCHEDULE_ENABLED === 'true',
  time: process.env.SCHEDULE_TIME || '09:00',
  timezone: process.env.SCHEDULE_TIMEZONE || 'Europe/Berlin',
  topics: parseTopicsFromEnv(process.env.SCHEDULE_TOPICS)
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy - REQUIRED when behind nginx/reverse proxy
// This tells Express to trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Session middleware - BEFORE routes
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // REQUIRED when behind reverse proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Auto-detect based on environment
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
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

// AI Topic Generation Function
async function generateTopics(count = 5) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }

  const prompt = `${topicGenerationPrompt.system_prompt}

AUFGABE: ${topicGenerationPrompt.task.replace('{count}', count)}

ANFORDERUNGEN:
${JSON.stringify(topicGenerationPrompt.requirements, null, 2)}

FOKUS-BEREICHE:
${topicGenerationPrompt.focus_areas.join('\n')}

QUALITAETSKRITERIEN:
${JSON.stringify(topicGenerationPrompt.quality_criteria, null, 2)}

Erstelle genau ${count} LinkedIn Post-Themen als JSON Array. Nur das Array zurueckgeben, keine Erklaerungen.`;

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
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Parse JSON response
  try {
    const topics = JSON.parse(content);
    return Array.isArray(topics) ? topics : [];
  } catch (e) {
    console.error('Failed to parse topics JSON:', content);
    return [];
  }
}

// AI Post Generation Function (manual posts)
async function generateLinkedInPost(topic, useScheduledPrompt = false) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }

  const promptConfig = useScheduledPrompt ? scheduledPostPrompt : postPrompt;

  const prompt = `${promptConfig.system_prompt}

THEMA: ${topic}

STRUKTUR:
${JSON.stringify(promptConfig.post_structure, null, 2)}

RICHTLINIEN:
${JSON.stringify(promptConfig.guidelines, null, 2)}

${useScheduledPrompt ? `CONTENT FOKUS:\n${JSON.stringify(promptConfig.content_focus, null, 2)}\n` : ''}
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

// SMTP Transporter Setup
function createEmailTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('SMTP configuration incomplete');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

// Send LinkedIn Post via Email
async function sendLinkedInPostEmail(topic, postContent) {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `LinkedIn Post: ${topic}`,
    text: `LinkedIn Post zum Thema: ${topic}\n\n---\n\n${postContent}\n\n---\n\nGeneriert am: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0077b5; border-bottom: 3px solid #0077b5; padding-bottom: 10px;">
          LinkedIn Post: ${topic}
        </h2>

        <div style="background: #f3f6f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <pre style="font-family: inherit; white-space: pre-wrap; line-height: 1.6; margin: 0;">${postContent}</pre>
        </div>

        <div style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>Generiert am: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
          <p style="margin: 0;">Automatisch erstellt von Button Dashboard</p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
}

// Scheduled Post Execution
async function executeScheduledPost() {
  if (!scheduledPostConfig.enabled) {
    return;
  }

  try {
    console.log('[SCHEDULED] Starting scheduled LinkedIn post...');

    const randomTopic = scheduledPostConfig.topics[
      Math.floor(Math.random() * scheduledPostConfig.topics.length)
    ];

    console.log(`[SCHEDULED] Topic: ${randomTopic}`);

    const generatedPost = await generateLinkedInPost(randomTopic, true); // Use scheduled prompt
    console.log(`[SCHEDULED] AI generated post (${generatedPost.length} chars)`);

    const result = await postToLinkedIn(generatedPost);
    console.log(`[SCHEDULED] Posted successfully! Task ID: ${result.id}`);

  } catch (error) {
    console.error('[SCHEDULED] Error:', error.message);
  }
}

// Cron Job Reference
let scheduledCronJob = null;

// Setup Cron Job
function setupScheduledPost() {
  // Stop existing cron job if running
  if (scheduledCronJob) {
    scheduledCronJob.stop();
    console.log('Stopped existing cron job');
  }

  const [hour, minute] = scheduledPostConfig.time.split(':');
  const cronExpression = `${minute} ${hour} * * *`;

  scheduledCronJob = cron.schedule(cronExpression, executeScheduledPost, {
    timezone: scheduledPostConfig.timezone
  });

  console.log(`Scheduled LinkedIn post set for ${scheduledPostConfig.time} ${scheduledPostConfig.timezone}`);
}

// Stop Scheduled Post
function stopScheduledPost() {
  if (scheduledCronJob) {
    scheduledCronJob.stop();
    scheduledCronJob = null;
    console.log('Scheduled LinkedIn post disabled');
  }
}

if (scheduledPostConfig.enabled) {
  setupScheduledPost();
}

// Article posting cron job - check every 5 minutes for scheduled articles
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for scheduled articles to post...');

  try {
    const articles = articleStorage.loadArticles();
    const now = new Date();

    for (const article of articles) {
      if (article.status === 'scheduled' && article.scheduledFor) {
        const schedTime = new Date(article.scheduledFor);

        if (schedTime <= now) {
          console.log(`Posting scheduled article: ${article.topic}`);

          try {
            // Post to LinkedIn using the same function as regular posts
            const taskData = await postToLinkedIn(article.content);

            // Mark as posted
            articleStorage.updateArticle(article.id, {
              status: 'posted',
              postedAt: new Date().toISOString(),
              taskId: taskData.id
            });

            console.log(`Successfully posted article: ${article.topic} (Task ID: ${taskData.id})`);
          } catch (error) {
            console.error(`Failed to post article ${article.id}:`, error);
            // Don't mark as posted if it failed
          }
        }
      }
    }
  } catch (error) {
    console.error('Article posting cron error:', error);
  }
}, {
  timezone: 'Europe/Berlin'
});

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
  
  console.log('Login attempt:', { hasPassword: !!password, sessionID: req.sessionID });
  
  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, error: 'Session error' });
      }
      console.log('Login successful, session saved:', req.sessionID);
      res.json({ success: true });
    });
  } else {
    console.log('Login failed: wrong password');
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

app.get('/api/schedule', requireAuth, (req, res) => {
  res.json(scheduledPostConfig);
});

app.post('/api/schedule', requireAuth, (req, res) => {
  const { enabled, time, topics } = req.body;

  if (enabled !== undefined) scheduledPostConfig.enabled = enabled;
  if (time) scheduledPostConfig.time = time;
  if (topics && Array.isArray(topics)) scheduledPostConfig.topics = topics;

  // Handle cron job based on enabled state
  if (scheduledPostConfig.enabled) {
    setupScheduledPost(); // This will stop old job and create new one
  } else {
    stopScheduledPost(); // Stop the job if disabled
  }

  res.json({ success: true, config: scheduledPostConfig });
});

app.post('/api/generate-topics', requireAuth, async (req, res) => {
  const { count = 5 } = req.body;

  try {
    const topics = await generateTopics(count);
    res.json({ success: true, topics });
  } catch (error) {
    console.error('Topic generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// Generate LinkedIn Post and Send via Email
app.post('/api/generate-post-email', requireAuth, async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, error: 'Topic required' });
  }

  try {
    console.log(`[EMAIL-POST] Generating LinkedIn post for topic: ${topic}`);

    // Generate LinkedIn post content
    const generatedPost = await generateLinkedInPost(topic);
    console.log(`[EMAIL-POST] Post generated (${generatedPost.length} chars)`);

    // Send via email
    const emailInfo = await sendLinkedInPostEmail(topic, generatedPost);
    console.log(`[EMAIL-POST] Email sent successfully: ${emailInfo.messageId}`);

    res.json({
      success: true,
      content: generatedPost,
      email: {
        messageId: emailInfo.messageId,
        from: EMAIL_FROM,
        to: EMAIL_TO
      },
      message: 'LinkedIn Post erstellt und per Email versendet'
    });
  } catch (error) {
    console.error('[EMAIL-POST] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.message.includes('SMTP') ? 'SMTP-Konfiguration prüfen' : 'Post-Generierung fehlgeschlagen'
    });
  }
});

app.post('/api/action/:id', requireAuth, async (req, res) => {
  const actionId = req.params.id;
  
  console.log(`Action triggered: ${actionId}`);
  
  try {
    switch(actionId) {
      case '1':
        const { topic, useAI } = req.body;
        
        if (!topic) {
          return res.status(400).json({ 
            success: false, 
            error: 'Bitte gib ein Thema ein' 
          });
        }
        
        let postContent = topic;
        
        if (useAI) {
          try {
            postContent = await generateLinkedInPost(topic);
            console.log(`AI generated post: ${postContent.substring(0, 100)}...`);
          } catch (aiError) {
            console.error('AI generation failed, using manual topic:', aiError);
          }
        }
        
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

// Article Management Endpoints

// Generate new article
app.post('/api/articles/generate', requireAuth, async (req, res) => {
  const { topic, focus, targetLength, tone } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, error: 'Topic required' });
  }

  try {
    console.log(`Generating article for topic: ${topic}`);

    const result = await generateArticle(topic, {
      focus: focus || 'practical insights and best practices',
      targetLength: targetLength || 'medium',
      tone: tone || 'professional',
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // Save article to storage
    const savedArticle = articleStorage.createArticle(result.article);

    res.json({
      success: true,
      article: savedArticle,
    });
  } catch (error) {
    console.error('Article generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all articles
app.get('/api/articles', requireAuth, (req, res) => {
  const articles = articleStorage.getAllArticles();
  res.json({ success: true, articles });
});

// Get single article
app.get('/api/articles/:id', requireAuth, (req, res) => {
  const article = articleStorage.getArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  res.json({ success: true, article });
});

// Update article
app.put('/api/articles/:id', requireAuth, (req, res) => {
  const { content, topic, outline, research } = req.body;

  const updated = articleStorage.updateArticle(req.params.id, {
    content,
    topic,
    outline,
    research,
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  res.json({ success: true, article: updated });
});

// Delete article
app.delete('/api/articles/:id', requireAuth, (req, res) => {
  const deleted = articleStorage.deleteArticle(req.params.id);

  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  res.json({ success: true });
});

// Schedule article
app.post('/api/articles/:id/schedule', requireAuth, (req, res) => {
  const { scheduledFor } = req.body;

  if (!scheduledFor) {
    return res.status(400).json({ success: false, error: 'scheduledFor required' });
  }

  const updated = articleStorage.scheduleArticle(req.params.id, scheduledFor);

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  res.json({ success: true, article: updated });
});

app.post('/api/articles/:id/post', requireAuth, async (req, res) => {
  try {
    const article = articleStorage.getArticle(req.params.id);

    if (!article) {
      console.log(`Article not found: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    if (!article.content || article.content.trim() === '') {
      console.log(`Article ${req.params.id} has no content`);
      return res.status(400).json({ success: false, error: 'Article has no content to post' });
    }

    console.log(`Posting article to LinkedIn: ${article.topic}`);

    // Post to LinkedIn using the same function as regular posts
    const taskData = await postToLinkedIn(article.content);

    // Mark as posted
    const updated = articleStorage.updateArticle(req.params.id, {
      status: 'posted',
      postedAt: new Date().toISOString(),
      taskId: taskData.id
    });

    res.json({
      success: true,
      article: updated,
      task: {
        id: taskData.id,
        live_url: taskData.live_url
      }
    });
  } catch (error) {
    console.error('Post article error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  const now = new Date();
  const berlinTime = now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`System Time (Berlin): ${berlinTime}`);
  console.log(`Browser-Use API: ${BROWSER_USE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`OpenRouter API: ${OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`OpenRouter Model: ${OPENROUTER_MODEL}`);
  console.log('--- Scheduled Posts Configuration ---');
  console.log(`  Enabled: ${scheduledPostConfig.enabled}`);
  console.log(`  Time: ${scheduledPostConfig.time} (${scheduledPostConfig.timezone})`);
  console.log(`  Topics: ${scheduledPostConfig.topics.length} configured`);
  if (scheduledPostConfig.enabled) {
    console.log(`  Status: ACTIVE - Next post at ${scheduledPostConfig.time} ${scheduledPostConfig.timezone}`);
    console.log(`  Cron Expression: ${scheduledPostConfig.time.split(':')[1]} ${scheduledPostConfig.time.split(':')[0]} * * *`);
  } else {
    console.log(`  Status: INACTIVE - Set SCHEDULE_ENABLED=true in ENV to activate`);
  }
});
