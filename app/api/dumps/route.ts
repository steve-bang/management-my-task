import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { BrainDump } from '@/app/lib/types';

export async function GET() {
  try {
    const snap = await db.collection('dumps').get();
    const dumps: BrainDump[] = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as BrainDump))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ data: dumps });
  } catch (err) {
    console.error('[GET /api/dumps]', err);
    return NextResponse.json({ error: 'Không thể tải brain dumps' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body as BrainDump;
    if (!rest.content?.trim()) {
      return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 });
    }
    await db.collection('dumps').doc(id).set(rest);
    return NextResponse.json({ data: { id, ...rest } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/dumps]', err);
    return NextResponse.json({ error: 'Không thể lưu ghi chú' }, { status: 500 });
  }
}