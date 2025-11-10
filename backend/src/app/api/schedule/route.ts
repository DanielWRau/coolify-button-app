import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { extractBearerToken, verifyToken } from '@/lib/jwt';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');

interface PostingTime {
  hour: number;      // 0-23
  minute: number;    // 0-59
  jitterMinutes: number; // ±variance (default: 30)
}

interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  topics: string[];
  currentTopicIndex: number; // Track position in topic rotation
  postingTimes: PostingTime[]; // Multiple posting times per day
  weekdays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] - true = enabled
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function getScheduleConfig(): Promise<ScheduleConfig> {
  await ensureDataDir();

  if (existsSync(SCHEDULE_FILE)) {
    try {
      const data = await readFile(SCHEDULE_FILE, 'utf-8');
      const config = JSON.parse(data);

      // Migrate old format to new format
      if (config.time && !config.postingTimes) {
        const [hour, minute] = config.time.split(':').map(Number);
        config.postingTimes = [{ hour, minute, jitterMinutes: 30 }];
        delete config.time;
      }

      // Ensure all fields exist
      return {
        enabled: config.enabled ?? false,
        timezone: config.timezone ?? 'Europe/Berlin',
        topics: config.topics ?? [],
        currentTopicIndex: config.currentTopicIndex ?? 0,
        postingTimes: config.postingTimes ?? [],
        weekdays: config.weekdays ?? [true, true, true, true, true, false, false], // Mon-Fri default
      };
    } catch (error) {
      console.error('Error reading schedule file:', error);
    }
  }

  // Default config from env variables (legacy support)
  const topicsStr = process.env.SCHEDULE_TOPICS || '';
  const timeStr = process.env.SCHEDULE_TIME || '09:00';
  const [hour, minute] = timeStr.split(':').map(Number);

  return {
    enabled: process.env.SCHEDULE_ENABLED === 'true',
    timezone: process.env.SCHEDULE_TIMEZONE || 'Europe/Berlin',
    topics: topicsStr ? topicsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
    currentTopicIndex: 0,
    postingTimes: [{ hour, minute, jitterMinutes: 30 }],
    weekdays: [true, true, true, true, true, false, false], // Mon-Fri default
  };
}

async function saveScheduleConfig(config: ScheduleConfig) {
  await ensureDataDir();
  await writeFile(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  console.log('[SCHEDULE] GET request received');
  
  const authHeader = request.headers.get('authorization');
  console.log('[SCHEDULE] Auth header:', authHeader ? 'Present' : 'MISSING');
  
  const token = extractBearerToken(authHeader);
  if (!token) {
    console.log('[SCHEDULE] No token found');
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.authenticated) {
    console.log('[SCHEDULE] Invalid token');
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  console.log('[SCHEDULE] Auth successful');

  try {
    const config = await getScheduleConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[SCHEDULE] POST request received');

  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.authenticated) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const currentConfig = await getScheduleConfig();

    const newConfig: ScheduleConfig = {
      enabled: updates.enabled ?? currentConfig.enabled,
      timezone: updates.timezone ?? currentConfig.timezone,
      topics: updates.topics ?? currentConfig.topics,
      currentTopicIndex: updates.currentTopicIndex ?? currentConfig.currentTopicIndex,
      postingTimes: updates.postingTimes ?? currentConfig.postingTimes,
      weekdays: updates.weekdays ?? currentConfig.weekdays,
    };

    await saveScheduleConfig(newConfig);

    console.log('[SCHEDULE] Config updated:', newConfig);

    // Reinitialize scheduler with new config
    try {
      const { reinitializeScheduler } = await import('@/lib/scheduled-poster');
      await reinitializeScheduler();
      console.log('[SCHEDULE] Scheduler reinitialized');
    } catch (error) {
      console.error('[SCHEDULE] Failed to reinitialize scheduler:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: newConfig,
    });
  } catch (error: any) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// Export helper for cron job access
export { getScheduleConfig, saveScheduleConfig };
