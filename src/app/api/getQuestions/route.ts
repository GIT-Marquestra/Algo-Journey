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

      return NextResponse.json({ questions }, { status: 200 })
    } catch (error) {
      console.log(error)
      return NextResponse.json({ error }, { status: 400 })
    }
  
}