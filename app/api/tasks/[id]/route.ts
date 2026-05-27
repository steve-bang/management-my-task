import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await db.collection('tasks').doc(id).update(body);
    return NextResponse.json({ data: { id, ...body } });
  } catch (err) {
    console.error('[PUT /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Không thể cập nhật task' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.collection('tasks').doc(id).delete();
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error('[DELETE /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Không thể xóa task' }, { status: 500 });
  }
}