import { NextResponse } from 'next/server';
import { getHistoryItem } from '@/lib/storage';

export async function GET(req, { params }) {
  try {
    const { filename } = await params;
    const item = await getHistoryItem(filename);
    if (!item) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
