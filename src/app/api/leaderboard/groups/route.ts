import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust the import based on your project structure

interface GroupLeaderboardEntry {
  id: string;
  name: string;
  groupPoints: number;
  coordinatorName: string;
}

export async function POST() {
  try {
    // Fetch all groups with their points and coordinator details
    const groupsWithScores = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        groupPoints: true,
        coordinator: {
          select: {
            username: true,
          },
        },
      },
    });

    // Format the leaderboard
    const leaderboard: GroupLeaderboardEntry[] = groupsWithScores.map(group => ({
      id: group.id,
      name: group.name,
      groupPoints: group.groupPoints,
      coordinatorName: group.coordinator.username,
    }));

    // Sort leaderboard by groupPoints in descending order
    leaderboard.sort((a, b) => b.groupPoints - a.groupPoints);

    console.log("Group Leaderboard: ", leaderboard);

    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    console.error('Error fetching group leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch group leaderboard' }, { status: 500 });
  }
}