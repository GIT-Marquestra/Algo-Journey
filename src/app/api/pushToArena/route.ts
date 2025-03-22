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
    
    // Create base timestamp (current time)
    const baseTimestamp = new Date();
    
    // Use transaction to ensure all operations succeed or fail together
    const processedQuestions = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const question of questions) {
        const { id, order } = question;
        
        // Find if question exists in TempContestQuestion
        const tempQuestion = await tx.tempContestQuestion.findFirst({
          where: {
            questions: {
              some: {
                id: id
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
        const existingEntry = await tx.questionOnContest.findFirst({
          where: {
            questionId: id
          }
        });
        
        if (existingEntry) {
          // Update the existing entry if contestId is different
          if (existingEntry.contestId !== contestId) {
            await tx.questionOnContest.update({
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
          await tx.questionOnContest.create({
            data: {
              contestId: contestId,
              questionId: id
            }
          });
        }
        
        // Calculate ordered timestamp - add seconds based on the order
        // This creates timestamps 1 second apart, preserving the order
        const orderedTimestamp = new Date(baseTimestamp.getTime() + (order - 1) * 1000);
        
        // Update question status to inArena and set arenaAddedAt timestamp 
        // using the calculated orderedTimestamp
        await tx.question.update({    
          where: {
            id: id
          },
          data: {
            inArena: true,
            // Always update arenaAddedAt to maintain the order
            arenaAddedAt: orderedTimestamp
          }
        });
        
        // Process temp question if it exists
        if (tempQuestion) {
          // Disconnect the question from temp entry
          await tx.tempContestQuestion.update({
            where: {
              id: tempQuestion.id
            },
            data: {
              questions: {
                disconnect: {
                  id: id
                }
              }
            }
          });
          
          // Check if temp contest has any questions left
          const remainingQuestions = await tx.tempContestQuestion.findUnique({
            where: {
              id: tempQuestion.id
            },
            include: {
              questions: true
            }
          });

          // If no questions remain, delete the temp contest entry
          if (remainingQuestions && remainingQuestions.questions.length === 0) {
            await tx.tempContestQuestion.delete({
              where: {
                id: tempQuestion.id
              }
            });
          }
        }
        
        results.push({
          id,
          order,
          contestId,
          timestamp: orderedTimestamp
        });
      }
      
      return results;
    }, {
      // Transaction options - you may need to adjust based on your Prisma version
      maxWait: 10000, // 5s max wait time for transaction
      timeout: 40000, // 10s timeout for the transaction
      isolationLevel: 'ReadCommitted' // Highest isolation level
    });

    return NextResponse.json({
      success: true,
      data: processedQuestions
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing questions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}