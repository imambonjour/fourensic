import { NextResponse } from 'next/server';
import { resetNames, setNames } from '@/lib/storage';

export async function POST(req) {
  try {
    const names = await req.json();
    if (!Array.isArray(names)) {
      return NextResponse.json({ error: 'Payload harus berupa array.' }, { status: 400 });
    }
    await setNames(names);
    return NextResponse.json({ message: 'Daftar nama berhasil diperbarui.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui nama.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await resetNames();
    return NextResponse.json({ message: 'Daftar nama berhasil direset ke default.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mereset nama.' }, { status: 500 });
  }
}
