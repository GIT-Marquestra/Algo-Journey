import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { coordinatedGroup: { select: { id: true } } }, 
    });

    if (user?.coordinatedGroup) {
      return NextResponse.json({ isCoordinator: true, groupId: user.coordinatedGroup.id });
    }

    return NextResponse.json({ isCoordinator: false });

  } catch (error) {
    console.error('Error checking coordinator status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}