import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

interface Question {
  id: string;
}

interface ContestRequest {
  startTime: Date;
  endTime: Date;
  duration: number;
  name: string;
  questions: Question[];
}

export async function POST(req: Request) {
  try {
    const request: ContestRequest = await req.json();
    const { duration, questions } = request;

    // Create the contest and connect questions in a single transaction
    const contest = await prisma.$transaction(async (tx) => {
      // Create the contest first
      const newContest = await tx.contest.create({
        data: {
          startTime: request.startTime,
          endTime: request.endTime,
          duration,
          name: request.name
        }
      });

      // Create the question connections through QuestionOnContest
      if (questions && questions.length > 0) {
        await tx.questionOnContest.createMany({
          data: questions.map(question => ({
            contestId: newContest.id,
            questionId: question.id
          }))
        });

        // Also create the temporary contest questions if needed
        await tx.tempContestQuestion.create({
          data: {
            contestId: newContest.id,
            questions: {
              connect: questions.map(q => ({ id: q.id }))
            }
          }
        });

        await tx.question.updateMany({
          where: {
            id: {
              in: questions.map(q => q.id)
            }
          },
          data: {
            inContest: true
          }
        })
      }

      return newContest;
    }, { timeout: 15000 });

    return NextResponse.json({
      contestId: contest.id,
      message: "Contest and questions connected successfully"
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: "Contest creation failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}