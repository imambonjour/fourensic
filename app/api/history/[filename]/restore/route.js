import { NextResponse } from 'next/server';
import { getCurrentConfig, getHistoryItem, saveHistoryItem, setCurrentConfig } from '@/lib/storage';

export async function POST(req, { params }) {
  try {
    const { filename } = await params;
    const restoredConfig = await getHistoryItem(filename);
    if (!restoredConfig) {
      return NextResponse.json({ error: 'Source config not found in history' }, { status: 404 });
    }

    // Save current config to history before restoring
    const current = await getCurrentConfig();
    if (current && Array.isArray(current) && current.length > 0) {
      const id = `config-${Date.now()}`;
      await saveHistoryItem(id, current);
    }

    await setCurrentConfig(restoredConfig);
    return NextResponse.json({ message: 'Config restored successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to restore config' }, { status: 500 });
  }
}
