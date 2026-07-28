import { NextResponse } from 'next/server';
import { getCurrentConfig } from '@/lib/storage';

export async function GET() {
  try {
    const config = await getCurrentConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch latest config' }, { status: 500 });
  }
}
