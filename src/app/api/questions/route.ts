import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get current time in IST
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

    // Get the latest contest
    const latestContest = await prisma.contest.findFirst({
      orderBy: { startTime: 'desc' },
      select: { id: true, endTime: true },
    });

    // Find user by email and fetch individualPoints
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, individualPoints: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all submissions by the user
    const userSubmissions = await prisma.submission.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        score: true,
        createdAt: true,
        question: {
          select: {
            id: true,
            leetcodeUrl: true,
            codeforcesUrl: true,
            difficulty: true,
            points: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(userSubmissions);

    // Define the type explicitly
    type QuestionOnContestWithDetails = Awaited<
      ReturnType<typeof prisma.questionOnContest.findMany>
    >;

    let questions: QuestionOnContestWithDetails = [];

    if (latestContest && istTime > latestContest.endTime) {
       questions = await prisma.questionOnContest.findMany({
        select: {
          id: true,
          contestId: true,
          questionId: true, // Ensure this is selected
          createdAt: true,  // Ensure this is selected
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
                  id: true,
                  name: true,
                },
              },
              submissions: {
                where: { userId: user.id },
                select: {
                  status: true,
                  score: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { contest: { startTime: 'desc' } },
      });
    } else if (latestContest) {
      questions = await prisma.questionOnContest.findMany({
        where: { contestId: { not: latestContest.id } },
        select: {
          id: true,
          contestId: true,
          questionId: true, // Include questionId
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
                  id: true,
                  name: true,
                },
              },
              submissions: {
                where: { userId: user.id },
                select: {
                  status: true,
                  score: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { contest: { startTime: 'desc' } },
      });
    }

    return NextResponse.json(
      { questions, individualPoints: user.individualPoints, submissions: userSubmissions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}