import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST() {
    try {


      const questions = await prisma.question.findMany({
        include: {
          questionTags: true,
        },
        orderBy:{
          createdAt: 'desc'
        },
        take: 10
      });

      const questionsCount = await prisma.question.count()

      return NextResponse.json({ questions, questionsCount }, { status: 200 })
    } catch (error) {
      console.log(error)
      return NextResponse.json({ error }, { status: 400 })
    }
  
}