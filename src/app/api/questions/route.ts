import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const request = await req.json();
    const arr: string[] = request.topic;
    const topic: string = arr[0];

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail: string = session.user.email;

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

    type QuestionOnContestWithDetails = Awaited<
      ReturnType<typeof prisma.questionOnContest.findMany>
    >;


    const questions: QuestionOnContestWithDetails = await prisma.questionOnContest.findMany({
      where: {
        question: {
          questionTags: { some: { name: topic } },
        },
      },
      select: {
        id: true,
        contestId: true,
        questionId: true,
        createdAt: true,
        question: {
          select: {
            id: true,
            leetcodeUrl: true,
            codeforcesUrl: true,
            difficulty: true,
            points: true,
            slug: true,
            questionTags: { select: { id: true, name: true } },
            submissions: {
              where: { userId: user.id },
              select: { status: true, score: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { contest: { startTime: 'desc' } },
    });

    



    // **Filter out duplicate questions based on `slug`**
    const uniqueQuestions: QuestionOnContestWithDetails = [];
    const seenSlugs = new Set<string>();

    for (const q of questions) {
      //@ts-expect-error: `q.question` is not `undefined`
      const slug = q.question.slug;
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        uniqueQuestions.push(q);
      }
    }



    return NextResponse.json(
      { questions: uniqueQuestions, individualPoints: user.individualPoints, submissions: userSubmissions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}