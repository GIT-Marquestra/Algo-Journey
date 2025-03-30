import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { difficulty } = await req.json();
    
    if (difficulty === "all") {
      const questions = await prisma.question.findMany({
        include: {
          questionTags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      const questionsCount = await prisma.question.count();
      const questionsInArena = await prisma.question.count({
        where: {
          inArena: true,
        },
      });
      
      return NextResponse.json({ 
        questions, 
        questionsCount, 
        questionsInArena 
      });
    }
    
    // Otherwise, filter by the selected difficulty
    const questions = await prisma.question.findMany({
      where: {
        difficulty: difficulty, // Cast to Difficulty enum
      },
      include: {
        questionTags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const questionsCount = await prisma.question.count();
    const questionsInArena = await prisma.question.count({
      where: {
        inArena: true,
      },
    });
    
    return NextResponse.json({ 
      questions, 
      questionsCount, 
      questionsInArena 
    });
  } catch (error) {
    console.error("Error filtering questions by difficulty:", error);
    return NextResponse.json(
      { error: "Failed to filter questions" },
      { status: 500 }
    );
  }
}