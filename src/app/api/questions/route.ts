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

    // Custom ordering for difficulty levels
    const difficultyOrder = {
      BEGINNER: 1,
      EASY: 2,
      MEDIUM: 3,
      HARD: 4,
      VERYHARD: 5
    };

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
      }
    });

  // Update the sorting in your existing getArenaQuestions API
const sortedQuestions = questions.sort((a, b) => {
  // First check if arenaOrder exists and use it
  //@ts-expect-error: do not knwo what to do here 
  if (a.arenaOrder !== null && b.arenaOrder !== null) {
    //@ts-expect-error: do not knwo what to do here 
    return a.arenaOrder - b.arenaOrder;
  }
  
  // Fall back to difficulty sorting if arenaOrder is not available
  const diffA = difficultyOrder[a.difficulty];
  const diffB = difficultyOrder[b.difficulty];
  
  if (diffA !== diffB) {
    return diffA - diffB;
  }
  
  // Finally sort by arenaAddedAt
  if (!a.arenaAddedAt && !b.arenaAddedAt) return 0;
  if (!a.arenaAddedAt) return 1;
  if (!b.arenaAddedAt) return -1;
  
  return a.arenaAddedAt.getTime() - b.arenaAddedAt.getTime();
});
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      }
    });

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

    const questionsWithSolvedStatus = sortedQuestions.map(question => ({
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