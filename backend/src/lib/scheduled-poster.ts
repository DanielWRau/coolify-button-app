/**
 * Scheduled LinkedIn Poster with Topic Rotation and Weekday Support
 * Uses node-cron for scheduling and tracks topic rotation
 */

import cron from 'node-cron';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');

interface PostingTime {
  hour: number;
  minute: number;
  jitterMinutes: number;
}

interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  topics: string[];
  currentTopicIndex: number;
  postingTimes: PostingTime[];
  weekdays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

let scheduledJobs: cron.ScheduledTask[] = [];

/**
 * Load schedule configuration
 */
async function loadScheduleConfig(): Promise<ScheduleConfig | null> {
  if (!existsSync(SCHEDULE_FILE)) {
    return null;
  }

  try {
    const data = await readFile(SCHEDULE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[CRON] Failed to load schedule config:', error);
    return null;
  }
}

/**
 * Save updated schedule configuration
 */
async function saveScheduleConfig(config: ScheduleConfig): Promise<void> {
  const { writeFile } = await import('fs/promises');
  await writeFile(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get next topic from queue with rotation
 */
function getNextTopic(config: ScheduleConfig): { topic: string; newIndex: number } {
  if (config.topics.length === 0) {
    throw new Error('No topics configured');
  }

  const topic = config.topics[config.currentTopicIndex];
  const newIndex = (config.currentTopicIndex + 1) % config.topics.length;

  console.log('[CRON] Topic rotation:', {
    currentIndex: config.currentTopicIndex,
    nextIndex: newIndex,
    topic,
  });

  return { topic, newIndex };
}

/**
 * Calculate actual posting time with jitter
 */
function calculatePostingTime(postingTime: PostingTime): { hour: number; minute: number } {
  const jitter = Math.floor(Math.random() * (postingTime.jitterMinutes * 2 + 1)) - postingTime.jitterMinutes;

  let totalMinutes = postingTime.hour * 60 + postingTime.minute + jitter;

  // Handle day overflow/underflow
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;

  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  console.log('[CRON] Time with jitter:', {
    original: `${postingTime.hour}:${postingTime.minute}`,
    jitter: `${jitter >= 0 ? '+' : ''}${jitter}min`,
    actual: `${hour}:${minute}`,
  });

  return { hour, minute };
}

/**
 * Check if today is an enabled weekday
 */
function isTodayEnabled(weekdays: boolean[]): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Convert to Monday = 0 format
  const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const enabled = weekdays[mondayBasedDay];

  console.log('[CRON] Weekday check:', {
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][mondayBasedDay],
    enabled,
  });

  return enabled;
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(topic: string): Promise<void> {
  console.log('[CRON] Posting to LinkedIn:', topic);

  try {
    const browserUseApiKey = process.env.BROWSER_USE_API_KEY;
    const linkedinEmail = process.env.LINKEDIN_EMAIL;
    const linkedinPassword = process.env.LINKEDIN_PASSWORD;

    if (!browserUseApiKey || !linkedinEmail || !linkedinPassword) {
      throw new Error('LinkedIn credentials not configured');
    }

    // Import action logic
    const { researchTopic, createResearchEnhancedPrompt } = await import('./perplexity-research');
    const { BROWSER_USE_SYSTEM_PROMPT, formatForBrowserUse, generateBrowserUseTask } = await import('./browser-use-formatter');

    // Research topic
    const research = await researchTopic(topic);

    // Generate post with AI
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const enhancedPrompt = createResearchEnhancedPrompt(BROWSER_USE_SYSTEM_PROMPT, research);

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: `Create a LinkedIn post about: ${topic}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const postContent = aiData.choices[0].message.content;

    // Post via Browser-Use
    const formattedContent = formatForBrowserUse(postContent);
    const browserUseTask = generateBrowserUseTask(linkedinEmail, linkedinPassword, formattedContent);

    const browserUseResponse = await fetch('https://api.browser-use.com/api/v1/run-task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserUseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: browserUseTask,
        timeout: 180000,
      }),
    });

    if (!browserUseResponse.ok) {
      const error = await browserUseResponse.text();
      throw new Error(`Browser-Use API error: ${error}`);
    }

    const browserUseData = await browserUseResponse.json();
    console.log('[CRON] ✓ Post successful:', {
      topic,
      taskId: browserUseData.id,
    });
  } catch (error: any) {
    console.error('[CRON] Post failed:', error);
    throw error;
  }
}

/**
 * Execute scheduled post
 */
async function executeScheduledPost(): Promise<void> {
  console.log('[CRON] === Scheduled Post Execution Started ===');

  const config = await loadScheduleConfig();

  if (!config || !config.enabled) {
    console.log('[CRON] Scheduling disabled, skipping');
    return;
  }

  // Check weekday
  if (!isTodayEnabled(config.weekdays)) {
    console.log('[CRON] Today is not an enabled weekday, skipping');
    return;
  }

  // Check if we have topics
  if (config.topics.length === 0) {
    console.error('[CRON] No topics configured');
    return;
  }

  try {
    // Get next topic with rotation
    const { topic, newIndex } = getNextTopic(config);

    // Post to LinkedIn
    await postToLinkedIn(topic);

    // Update topic index for next run
    config.currentTopicIndex = newIndex;
    await saveScheduleConfig(config);

    console.log('[CRON] === Scheduled Post Execution Completed ===');
  } catch (error: any) {
    console.error('[CRON] Scheduled post failed:', error);
  }
}

/**
 * Initialize cron jobs
 */
export async function initializeScheduler(): Promise<void> {
  console.log('[CRON] Initializing scheduler...');

  const config = await loadScheduleConfig();

  if (!config || !config.enabled) {
    console.log('[CRON] Scheduling disabled');
    return;
  }

  // Stop existing jobs
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];

  // Create a job for each posting time
  config.postingTimes.forEach((postingTime, index) => {
    const { hour, minute } = calculatePostingTime(postingTime);

    // Create cron expression: minute hour * * *
    const cronExpression = `${minute} ${hour} * * *`;

    console.log('[CRON] Scheduling job', index + 1, ':', {
      time: `${hour}:${minute}`,
      jitter: `±${postingTime.jitterMinutes}min`,
      expression: cronExpression,
      timezone: config.timezone,
    });

    const job = cron.schedule(
      cronExpression,
      executeScheduledPost,
      {
        scheduled: true,
        timezone: config.timezone,
      }
    );

    scheduledJobs.push(job);
  });

  console.log('[CRON] ✓ Scheduler initialized with', scheduledJobs.length, 'jobs');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler(): void {
  console.log('[CRON] Stopping scheduler...');
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
  console.log('[CRON] ✓ Scheduler stopped');
}

/**
 * Reinitialize scheduler (call after schedule config changes)
 */
export async function reinitializeScheduler(): Promise<void> {
  stopScheduler();
  await initializeScheduler();
}
