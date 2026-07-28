import { NextResponse } from 'next/server';
import { getNames } from '@/lib/storage';

export async function GET() {
  try {
    const names = await getNames();
    return NextResponse.json(names);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch names' }, { status: 500 });
  }
}
