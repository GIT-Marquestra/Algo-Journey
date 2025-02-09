import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust the import according to your setup

export async function POST(req: Request) {
  const { groupId, userEmail } = await req.json(); // Extract groupId and userEmail from the request body

  try {
    // Validate input
    if (!groupId || !userEmail) {
      return NextResponse.json({ error: 'Group ID and user email are required' }, { status: 400 });
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is a member of the group
    const isMember = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 });
    }

    // Remove user from the group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    return NextResponse.json({ message: 'Successfully left the group' }, { status: 200 });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}