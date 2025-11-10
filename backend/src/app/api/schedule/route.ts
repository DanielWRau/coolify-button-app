import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { extractBearerToken, verifyToken } from '@/lib/jwt';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');

interface ScheduleConfig {
  enabled: boolean;
  time: string;
  timezone: string;
  topics: string[];
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
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading schedule file:', error);
    }
  }

  const topicsStr = process.env.SCHEDULE_TOPICS || '';
  return {
    enabled: process.env.SCHEDULE_ENABLED === 'true',
    time: process.env.SCHEDULE_TIME || '09:00',
    timezone: process.env.SCHEDULE_TIMEZONE || 'Europe/Berlin',
    topics: topicsStr ? topicsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
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
      time: updates.time ?? currentConfig.time,
      timezone: updates.timezone ?? currentConfig.timezone,
      topics: updates.topics ?? currentConfig.topics,
    };

    await saveScheduleConfig(newConfig);

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
