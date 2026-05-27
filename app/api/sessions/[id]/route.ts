import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await db.collection('sessions').doc(id).update(body);
    return NextResponse.json({ data: { id, ...body } });
  } catch (err) {
    console.error('[PUT /api/sessions/[id]]', err);
    return NextResponse.json({ error: 'Không thể cập nhật session' }, { status: 500 });
  }
}