import { NextResponse } from 'next/server';
import { getAdminPassword, setAdminPassword } from '@/lib/storage';

export async function POST(req) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const activePassword = await getAdminPassword();

    if (currentPassword !== activePassword) {
      return NextResponse.json({ error: 'Password saat ini salah.' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Password baru minimal 4 karakter.' }, { status: 400 });
    }

    await setAdminPassword(newPassword);
    return NextResponse.json({ message: 'Password admin berhasil diubah.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengubah password.' }, { status: 500 });
  }
}
