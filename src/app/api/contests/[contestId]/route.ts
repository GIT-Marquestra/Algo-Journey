import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  { params }: { params: { contestId: string } }
) {
  try {
    const contestId = parseInt(params.contestId);
    
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        questions: {
          include: {
            question: true,
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

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Filter submissions for each member to only include those for this specific contest
    const processedContest = {
      ...contest,
      attemptedGroups: contest.attemptedGroups.map(groupAttempt => ({
        ...groupAttempt,
        group: {
          ...groupAttempt.group,
          members: groupAttempt.group.members.map(member => ({
            ...member,
            submissions: member.submissions.filter(submission => submission.contestId === contestId)
          }))
        }
      }))
    };

    return NextResponse.json(processedContest);
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}