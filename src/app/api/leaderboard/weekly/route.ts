import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) { 
  try {
    const { weekOffset = 0 } = await request.json();

    // Calculate the start and end of the requested week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Get all submissions for the specified week
    const weeklySubmissions = await prisma.submission.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startOfWeek,
          lt: endOfWeek
        },
        status: 'ACCEPTED'
      },
      _sum: {
        score: true
      }
    });

    // Get user details for all users who have submissions
    const userIds = weeklySubmissions.map(sub => sub.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        username: true
      }
    });

    // Combine the data and sort by weekly points
    const transformedLeaderboard = weeklySubmissions
      .map(submission => {
        const user = users.find(u => u.id === submission.userId);
        return {
          id: submission.userId,
          username: user?.username || 'Unknown User',
          weeklyPoints: submission._sum.score || 0
        };
      })
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    return NextResponse.json(transformedLeaderboard, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
    } else {
      console.error('Unexpected error:', error);
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the leaderboard' }, 
      { status: 500 }
    );
  }
}