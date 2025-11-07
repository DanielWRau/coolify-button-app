const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || '';
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Action endpoints
app.post('/api/action/:id', async (req, res) => {
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
        
        // Create Browser-Use task
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
        
        const createResponse = await fetch('https://api.browser-use.com/api/v1/task', {
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
          throw new Error(`Browser-Use API returned ${createResponse.status}`);
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

// Catch-all route - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Button Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Browser-Use API: ${BROWSER_USE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`LinkedIn Email: ${LINKEDIN_EMAIL ? 'Configured' : 'Not configured'}`);
});