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
    console.log(request);
    const { duration, questions } = request;

    // Create the contest first
    const contest = await prisma.contest.create({
      data: {
        startTime: request.startTime,  
        endTime: request.endTime,
        duration,
        name: request.name
      }
    });

    // Create temporary contest question entries
    if (questions && questions.length > 0) {
      await prisma.tempContestQuestion.create({
        data: {
          contestId: contest.id,
          questions: {
            connect: questions.map(q => ({ id: q.id }))
          }
        }
      });
    }

    return NextResponse.json({ 
      contestId: contest.id,
      message: "Contest and temporary questions created successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      error: "Contest creation failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}