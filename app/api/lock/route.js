import { NextResponse } from 'next/server';
import { getAdminPassword, getLock, setLock } from '@/lib/storage';

export async function GET() {
  try {
    const lock = await getLock();
    return NextResponse.json(lock);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lock status' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { action, password } = await req.json();
    const adminPassword = await getAdminPassword();

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
    }

    if (action === 'lock') {
      const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
      const unlockAt = Date.now() + twoWeeksInMs;
      const newState = { locked: true, unlockAt };
      await setLock(newState);
      return NextResponse.json({ message: 'Configuration locked for 2 weeks', ...newState });
    } else if (action === 'unlock') {
      const newState = { locked: false, unlockAt: null };
      await setLock(newState);
      return NextResponse.json({ message: 'Configuration unlocked', ...newState });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lock status' }, { status: 500 });
  }
}
