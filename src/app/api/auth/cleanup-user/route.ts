// app/api/auth/cleanup-user/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {

    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { email }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Cleanup Error:', error);
    return NextResponse.json({ error: 'Failed to cleanup user' }, { status: 500 });
  }
}