import { NextResponse } from "next/server";
import { z } from "zod";
import { ContestStatus, Difficulty, SubmissionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

// Type definitions for the response data
type UserProfileResponse = {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      leetcodeUsername: string;
      codeforcesUsername: string;
      section: string;
      enrollmentNum: string;
      individualPoints: number;
      profileUrl?: string | null;
      createdAt: Date;
      group?: {
        id: string;
        name: string;
        groupPoints: number;
        coordinator: {
          username: string;
          email: string;
        };
      } | null;
      submissions: Array<{
        id: string;
        score: number;
        status: SubmissionStatus;
        createdAt: Date;
        question: {
          id: string;
          leetcodeUrl?: string | null;
          codeforcesUrl?: string | null;
          difficulty: Difficulty;
          points: number;
          slug: string;
          questionTags: Array<{
            name: string;
          }>;
        };
        contest?: {
          id: number;
          name: string;
          startTime: Date;
          endTime: Date;
          status: ContestStatus;
        } | null;
      }>;
      contestHistory: Array<{
        id: number;
        name: string;
        startTime: Date;
        endTime: Date;
        status: ContestStatus;
        submissions: Array<{
          id: string;
          score: number;
          status: SubmissionStatus;
          question: {
            slug: string;
            difficulty: Difficulty;
            points: number;
          };
        }>;
        groupPerformance?: {
          score: number;
          rank?: number;
        } | null;
      }>;
    };
  };
  error?: string;
};

// Input validation schema


export async function GET(
  request: Request,
) {
  try {

    console.log(request.url)

    // Validate the user ID
    const { url } = request
    const info = url.split('getProfileDetails/')[1]
    const username = decodeURIComponent(info)

    // Fetch user data with related information
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        leetcodeUsername: true,
        codeforcesUsername: true,
        section: true,
        enrollmentNum: true,
        individualPoints: true,
        profileUrl: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            groupPoints: true,
            coordinator: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            score: true,
            status: true,
            createdAt: true,
            question: {
              select: {
                id: true,
                leetcodeUrl: true,
                codeforcesUrl: true,
                difficulty: true,
                points: true,
                slug: true,
                questionTags: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            contest: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                status: true,
              },
            },
          },
        },
      },
    });

    
    if (!user) {
        return NextResponse.json<UserProfileResponse>(
            { success: false, error: "User not found" },
            { status: 404 }
        );
    }
    
    const userId = user?.id
    // Fetch contest history
    const contestHistory = await prisma.contest.findMany({
      where: {
        submissions: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        status: true,
        submissions: {
          where: {
            userId: userId,
          },
          select: {
            id: true,
            score: true,
            status: true,
            question: {
              select: {
                slug: true,
                difficulty: true,
                points: true,
              },
            },
          },
        },
        attemptedGroups: user.group ? {
          where: {
            groupId: user.group.id,
          },
          select: {
            score: true,
            rank: true,
          },
        } : undefined,
      },
    });

    // Transform contest history to include group performance
    const transformedContestHistory = contestHistory.map(contest => ({
      id: contest.id,
      name: contest.name,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: contest.status,
      submissions: contest.submissions,
      groupPerformance: contest.attemptedGroups?.[0] ? {
        score: contest.attemptedGroups[0].score,
        rank: contest.attemptedGroups[0].rank ?? undefined // Convert null to undefined
      } : null
    }));

    const response: UserProfileResponse = {
      success: true,
      data: {
        user: {
          ...user,
          contestHistory: transformedContestHistory,
        },
      },
    };

    return NextResponse.json<UserProfileResponse>(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json<UserProfileResponse>(
      { 
        success: false, 
        error: error instanceof z.ZodError 
          ? "Invalid user ID format" 
          : "Failed to fetch user profile" 
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}