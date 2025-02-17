import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 
interface Q {
  id : string
}
export async function POST(req: Request) {
  const request = await req.json()
  console.log(request)
  const { duration } = request

  console.log(duration)

  try {
    const contest = await prisma.contest.create({
      data: {
        startTime: request.startTime,  
        endTime: request.endTime,
        duration
      }
    })
    console.log(contest)
    const user = await prisma.questionOnContest.createMany({
      data: request.questions.map((q : Q) => ({
        contestId: contest.id,
        questionId: q.id,
      }))
    });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }
}
