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

      const questionsArena = await prisma.question.findMany({
        select:{
          inArena: true
        }
      })


      return NextResponse.json({ questions, questionsCount: questionsArena.length, questionsInArena: questionsArena.filter((p) => p.inArena).length }, { status: 200 })
    } catch (error) {
      console.log(error)
      return NextResponse.json({ error }, { status: 400 })
    }
  
}