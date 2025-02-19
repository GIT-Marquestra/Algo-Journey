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

        // Create QuestionOnContest entry
        if (tempQuestion?.contestId) {
          // Create entry with contestId
          await prisma.questionOnContest.create({
            data: {
              contestId: tempQuestion.contestId,
              questionId: question.id
            }
          });

          // Disconnect the question and delete temp entry if no questions remain
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
        } else {
          // If no contestId, create entry with null contestId
          await prisma.questionOnContest.create({
            data: {
              questionId: question.id,
              contestId: null
            }
          });
        }

        return {
          ...question,
          contestId: tempQuestion?.contestId || null
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
      error: 'Internal server error'
    }, { status: 500 });
  }
}