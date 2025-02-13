import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Invalid contest ID' }, { status: 400 });
    }

    const rankedGroups = await prisma.groupOnContest.findMany({
      where: { contestId: id },
      include: {
        group: {
          include: {
            coordinator: {
              select: {
                username: true,
              },
            },
            members: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

   

    
    if(!rankedGroups) return NextResponse.json({ error: 'No groups found' }, { status: 404 });

    console.log(rankedGroups)
    
    return NextResponse.json({ rankedGroups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ranked groups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}