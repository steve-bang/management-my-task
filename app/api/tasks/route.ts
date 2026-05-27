import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { Task } from '@/app/lib/types';

export async function GET() {
  try {
    const snap = await db.collection('tasks').get();
    // Sort bằng JS — không cần Firestore index
    const tasks: Task[] = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Task))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ data: tasks });
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return NextResponse.json({ error: 'Không thể tải danh sách task' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body as Task;

    if (!rest.title?.trim()) {
      return NextResponse.json({ error: 'Tên task không được để trống' }, { status: 400 });
    }
    if (!['high', 'medium', 'low'].includes(rest.priority)) {
      return NextResponse.json({ error: 'Priority không hợp lệ' }, { status: 400 });
    }

    await db.collection('tasks').doc(id).set(rest);
    return NextResponse.json({ data: { id, ...rest } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Không thể tạo task' }, { status: 500 });
  }
}