import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request
) {
    const request = await req.json()
  try {

    if (!request.body.userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check if they're already in a group
    const user = await prisma.user.findUnique({
      where: { email: request.body.userEmail },
      include: { group: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    let userGroup = null
    if (user.group) {
      userGroup = await prisma.group.findUnique({
        where:{
          id: user.group.id
        },
        include:{
          coordinator:{
            select: {
              username: true,
              email: true
            }

          },
          _count: {
            select: { members: true }
          }
        }
        
      })
    }

    // Fetch all groups with their member count
    const groups = await prisma.group.findMany({
      include: {
        coordinator: {
          select: {
            username: true,
            email: true
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    return NextResponse.json({ groups, userGroup }, { status: 200 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}