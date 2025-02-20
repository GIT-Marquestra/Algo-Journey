import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get all questions with their contest appearances
    const questions = await prisma.question.findMany({
      include: {
        // Get temporary contest appearances
        temporary: {
          select: {
            contestId: true
          }
        },
        // Get actual contest appearances
        contests: {
          select: {
            contestId: true
          }
        }
      }
    });

    // Structure the response
    const formattedQuestions = questions.map(question => {
      // Get contest IDs from temporary appearances
      const tempContestIds = question.temporary.map(temp => temp.contestId);
      
      // Get contest IDs from actual appearances
      const contestIds = question.contests.map(contest => contest.contestId);
      
      // Combine all contest IDs
      const allContestIds = [...tempContestIds, ...contestIds];

      // Remove the temporary and contests fields and add contestAppearances
      const { ...questionData } = question;
      
      return {
        ...questionData,
        contestAppearances: allContestIds
      };
    });



    
    console.log(formattedQuestions[0].contests)

    return NextResponse.json({
      success: true,
      data: formattedQuestions
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching question history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}