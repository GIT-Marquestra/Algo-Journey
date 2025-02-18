import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const contests = await prisma.contest.findMany({
      where: {
        status: 'COMPLETED'
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        attemptedGroups: {
          select: {
            id: true,
            score: true,
            rank: true,
            group: {
              select: {
                id: true,
                name: true,
                coordinator: {
                  select: {
                    username: true
                  }
                },
                members: {
                  select: {
                    username: true
                  }
                }
              }
            }
          },
          orderBy: {
            score: 'desc'
          }
        }
      },
      orderBy: {
        endTime: 'desc'
      }
    });

    const formattedContests = contests.map(contest => ({
      id: contest.id,
      name: `Contest #${contest.id}`,
      date: contest.startTime,
      endTime: contest.endTime,
      rankedGroups: contest.attemptedGroups.map(entry => ({
        id: entry.id,
        score: entry.score,
        rank: entry.rank,
        group: {
          name: entry.group.name,
          coordinator: {
            username: entry.group.coordinator.username
          },
          members: entry.group.members
        }
      }))
    }));

    return NextResponse.json(formattedContests, { status: 200 });
  } catch (error) {
    console.error('Error fetching contest leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch contest leaderboard' }, { status: 500 });
  }
}