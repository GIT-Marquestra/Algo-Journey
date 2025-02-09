import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 
interface Q {
  id : string
}
export async function POST(req: Request) {
  const request = await req.json()
  console.log(request)
  let contestId = 0
  try {
  
    const lastContest = await prisma.contest.findFirst({
      orderBy: { id: 'desc' } 
    });
    console.log("Here: ", lastContest)
    if(lastContest){
      contestId = lastContest.id + 1
    } else {
      contestId = 1
    }
  } catch (error) {
    console.log(error)
    
  }
  

  try {
    const contest = await prisma.contest.create({
      data: {
        startTime: request.startTime,  
        endTime: request.endTime
      }
    })
    console.log(contest)
    const user = await prisma.questionOnContest.createMany({
      data: request.questions.map((q : Q) => ({
        contestId,
        questionId: q.id,
      }))
    });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }
}
