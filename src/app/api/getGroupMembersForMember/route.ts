// app/api/teams/members/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        group: {
          include: {
            members: true
          }
        }
      }
    });

    if (!currentUser || !currentUser.group) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    

    return NextResponse.json({ members: currentUser.group.members });
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}