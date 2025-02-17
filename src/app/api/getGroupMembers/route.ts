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
        coordinatedGroup: {
          include: { members: true }
        }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!currentUser.coordinatedGroup) {
      return NextResponse.json({ error: 'You are not a coordinator of any group' }, { status: 403 });
    }

    // Format the members with the coordinator flag
    const formattedMembers = currentUser.coordinatedGroup.members.map(member => ({
      id: member.id,
      username: member.username,
      email: member.email,
      isCoordinator: member.id === currentUser.id
    }));

    return NextResponse.json({ members: formattedMembers });
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}