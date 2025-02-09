import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

interface LeaderboardEntry {
  id: string;
  username: string;
  individualPoints: number,
}

export async function POST() {
  try {
    const leaderboard: LeaderboardEntry[] = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        individualPoints: true,
      },
      orderBy: {
        individualPoints: 'desc',
      },
    });

    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}