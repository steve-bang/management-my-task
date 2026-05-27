import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { FocusSession } from '@/app/lib/types';

export async function GET() {
  try {
    const snap = await db.collection('sessions').get();
    const sessions: FocusSession[] = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as FocusSession))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return NextResponse.json({ data: sessions });
  } catch (err) {
    console.error('[GET /api/sessions]', err);
    return NextResponse.json({ error: 'Không thể tải sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body as FocusSession;
    await db.collection('sessions').doc(id).set(rest);
    return NextResponse.json({ data: { id, ...rest } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sessions]', err);
    return NextResponse.json({ error: 'Không thể lưu session' }, { status: 500 });
  }
}