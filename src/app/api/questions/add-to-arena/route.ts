import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { questionId } = body;
    
    if (!questionId) {
        return NextResponse.json(
            { success: false, message: 'Question ID is required' },
            { status: 400 }
        );
    }
    
    console.log(questionId)
    
    // Find the question first to make sure it exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    if (!question) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Update the question to mark it as in the arena
    // and set the current timestamp for when it was added
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        inArena: true,
        arenaAddedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Question successfully added to arena',
      data: updatedQuestion
    });
    
  } catch (error) {
    console.error('Error adding question to arena:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to add question to arena',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}