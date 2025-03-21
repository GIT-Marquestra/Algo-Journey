import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    const body = await request.json();
    const { topics, difficulties } = body;

    if (!topics || !Array.isArray(topics) || !difficulties || !Array.isArray(difficulties)) {
      return NextResponse.json(
        { error: 'Invalid input: topics and difficulties must be arrays' },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: {
        inArena: true,
        AND: [
          {
            questionTags: {
              some: {
                name: {
                  in: topics
                }
              }
            }
          },
          {
            difficulty: {
              in: difficulties
            }
          }
        ]
      },
      include: {
        questionTags: true,
      },
    });

    const user = await prisma.user.findUnique({
      where:{
        email: userEmail,
      }
    })

    const acceptedSubmissions = await prisma.submission.findMany({
      where: {
        userId: user?.id,
        status: 'ACCEPTED',
      },
      select: {
        questionId: true,
      },
    });

    const solvedQuestionIds = new Set(acceptedSubmissions.map(sub => sub.questionId));

    const questionsWithSolvedStatus = questions.map(question => ({
      ...question,
      isSolved: solvedQuestionIds.has(question.id), 
    }));


    return NextResponse.json({ questionsWithSolvedStatus, individualPoints: user?.individualPoints }, { status: 200 });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}