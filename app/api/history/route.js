import { NextResponse } from 'next/server';
import { getHistoryIndex } from '@/lib/storage';

export async function GET() {
  try {
    const history = await getHistoryIndex();
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
