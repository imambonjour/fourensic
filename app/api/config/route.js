import { NextResponse } from 'next/server';
import { getCurrentConfig, getLock, saveHistoryItem, setCurrentConfig } from '@/lib/storage';

export async function POST(req) {
  try {
    const lock = await getLock();
    if (lock.locked) {
      return NextResponse.json({ error: 'Configuration is locked. Reshuffle is not allowed.' }, { status: 403 });
    }

    const config = await req.json();

    // Archive current config to history before overwriting
    const current = await getCurrentConfig();
    if (current && Array.isArray(current) && current.length > 0) {
      const id = `config-${Date.now()}`;
      await saveHistoryItem(id, current);
    }

    await setCurrentConfig(config);
    return NextResponse.json({ message: 'Config saved successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
