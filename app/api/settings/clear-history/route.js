import { NextResponse } from 'next/server';
import { clearAllHistory, getAdminPassword } from '@/lib/storage';

export async function POST(req) {
  try {
    const { password } = await req.json();
    const activePassword = await getAdminPassword();

    if (password !== activePassword) {
      return NextResponse.json({ error: 'Password admin salah.' }, { status: 403 });
    }

    await clearAllHistory();
    return NextResponse.json({ message: 'Semua riwayat berhasil dihapus.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus riwayat.' }, { status: 500 });
  }
}
