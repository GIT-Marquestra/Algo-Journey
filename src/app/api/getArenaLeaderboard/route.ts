import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Parse request body
    const { topics, teams, difficulties } = await req.json();
    // Fetch submissions based on filters
    const submissions = await prisma.submission.findMany({
      where: {
        question: {
          questionTags: {
            some: { name: { in: topics.split(",") } }, // Filter by topic tags
          },
          difficulty: { in: difficulties.split(",") }, // Filter by difficulty
        },
        user: {
          group: {
            name: { in: teams.split(",") }, // Filter by team name
          },
        },
      },
      include: {
        user: { include: { group: true } }, // Include user and their group
        question: {
            include: { questionTags: true }, // Include question
        }, // Include question details
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 });
  }
}