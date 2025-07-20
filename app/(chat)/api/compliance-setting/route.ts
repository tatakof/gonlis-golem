import { NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const STORAGE_DIR = join(process.cwd(), 'data');
const SETTING_FILE = join(STORAGE_DIR, 'compliance-setting.json');

async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function GET() {
  // Skip auth check for personal use
  try {
    await ensureStorageDir();
    
    let enabled = true; // Default to enabled
    if (existsSync(SETTING_FILE)) {
      const data = await readFile(SETTING_FILE, 'utf-8');
      const setting = JSON.parse(data);
      enabled = setting.enabled !== false; // Default to true if not explicitly false
    }
    
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Failed to read compliance setting:', error);
    return NextResponse.json({ enabled: true }); // Default to enabled
  }
}

export async function POST(request: Request) {
  // Skip auth check for personal use
  try {
    const { enabled } = await request.json();
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid setting' }, { status: 400 });
    }

    await ensureStorageDir();
    await writeFile(SETTING_FILE, JSON.stringify({ enabled }), 'utf-8');
    
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Failed to save compliance setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
} 