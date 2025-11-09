import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

  // Try to read from file first
  if (existsSync(SCHEDULE_FILE)) {
    try {
      const data = await readFile(SCHEDULE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading schedule file:', error);
    }
  }

  // Fallback to environment variables
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

export async function GET() {
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
