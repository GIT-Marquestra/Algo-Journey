import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: {
        startTime: 'desc'
      },
      include: {
        questions: {
          include: {
            question: true
          }
        },
        attemptedGroups: {
          orderBy: {
            score: 'desc'
          },
          include: {
            group: {
              include: {
                coordinator: {
                  select: {
                    username: true
                  }
                },
                members: {
                  select: {
                    id: true,
                    username: true,
                    submissions: {
                      where: {
                        contestId: {
                          not: null
                        }
                      },
                      include: {
                        question: {
                          select: {
                            id: true,
                            slug: true,
                            points: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Filter submissions for each member to only include those for the specific contest
    const processedContests = contests.map(contest => {
      return {
        ...contest,
        attemptedGroups: contest.attemptedGroups.map(groupAttempt => ({
          ...groupAttempt,
          group: {
            ...groupAttempt.group,
            members: groupAttempt.group.members.map(member => ({
              ...member,
              submissions: member.submissions.filter(submission => submission.contestId === contest.id)
            }))
          }
        }))
      };
    });

    return NextResponse.json(processedContests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}