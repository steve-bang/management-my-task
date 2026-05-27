import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await db.collection('dumps').doc(id).update(body);
    return NextResponse.json({ data: { id, ...body } });
  } catch (err) {
    console.error('[PATCH /api/dumps/[id]]', err);
    return NextResponse.json({ error: 'Không thể cập nhật ghi chú' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.collection('dumps').doc(id).delete();
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error('[DELETE /api/dumps/[id]]', err);
    return NextResponse.json({ error: 'Không thể xóa ghi chú' }, { status: 500 });
  }
}