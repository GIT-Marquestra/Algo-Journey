import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions } = body;
    
    if (!Array.isArray(questions)) {
      return NextResponse.json({
        success: false,
        error: 'Questions must be an array'
      }, { status: 400 });
    }
    
    const processedQuestions = await Promise.all(
      questions.map(async (question) => {
        // Find if question exists in TempContestQuestion
        const tempQuestion = await prisma.tempContestQuestion.findFirst({
          where: {
            questions: {
              some: {
                id: question.id
              }
            }
          },
          select: {
            id: true,
            contestId: true
          }
        });
        
        const contestId = tempQuestion?.contestId || null;
        
        // Check if QuestionOnContest entry already exists
        const existingEntry = await prisma.questionOnContest.findFirst({
          where: {
            questionId: question.id
          }
        });
        
        if (existingEntry) {
          // Update the existing entry if contestId is different
          if (existingEntry.contestId !== contestId) {
            await prisma.questionOnContest.update({
              where: {
                id: existingEntry.id
              },
              data: {
                contestId: contestId
              }
            });
          }
          // No need to update if contestId is the same
        } else {
          // Create new entry if it doesn't exist
          await prisma.questionOnContest.create({
            data: {
              contestId: contestId,
              questionId: question.id
            }
          });
        }
        
        // Check if the question is already in arena
        const currentQuestion = await prisma.question.findUnique({
          where: { id: question.id },
          select: { inArena: true }
        });
        
        // Update question status to inArena and set arenaAddedAt timestamp if not already in arena
        await prisma.question.update({    
          where: {
            id: question.id
          },
          data: {
            inArena: true,
            // Only set arenaAddedAt if the question wasn't already in arena
            ...((!currentQuestion?.inArena) && { arenaAddedAt: new Date() })
          }
        });
        
        // Process temp question if it exists
        if (tempQuestion) {
          // Disconnect the question from temp entry
          await prisma.tempContestQuestion.update({
            where: {
              id: tempQuestion.id
            },
            data: {
              questions: {
                disconnect: {
                  id: question.id
                }
              }
            }
          });
          
          // Check if temp contest has any questions left
          const remainingQuestions = await prisma.tempContestQuestion.findUnique({
            where: {
              id: tempQuestion.id
            },
            include: {
              questions: true
            }
          });

          // If no questions remain, delete the temp contest entry
          if (remainingQuestions && remainingQuestions.questions.length === 0) {
            await prisma.tempContestQuestion.delete({
              where: {
                id: tempQuestion.id
              }
            });
          }
        }
        
        return {
          ...question,
          contestId: contestId
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: processedQuestions
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing questions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}