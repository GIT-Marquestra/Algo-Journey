// app/api/questions/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Difficulty } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
) {
  try {
    // Extract questionId from the path
    // URL will be like /api/questions/123/update
    const { url } = request

    const arr = url.split('/')
    const questionId = arr[arr.length - 1]
    
    

    const req = await request.json()

    // Parse request body
    const { slug, leetcodeUrl, codeforcesUrl, difficulty, points, tags } = req.updateData



    // Get the current question data to compare points
    const currentQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionTags: true,
      },
    });

    if (!currentQuestion) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    const oldPoints = currentQuestion.points;
    const pointsDifference = points - oldPoints;

    // Begin a transaction for updating the question and related records
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // 1. Update the question
      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          slug,
          leetcodeUrl: leetcodeUrl || null,
          codeforcesUrl: codeforcesUrl || null,
          difficulty: difficulty as Difficulty,
          points,
        },
        include: {
          questionTags: true
        }
      });

      // 2. Handle tags update
      // Remove existing tags
      await tx.questionTag.deleteMany({
        where: {
          questions: {
            some: {
              id: questionId
            }
          }
        }
      });

      // Add new tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create the tag
          const tag = await tx.questionTag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          });

          // Connect the tag to the question
          await tx.question.update({
            where: { id: questionId },
            data: {
              questionTags: {
                connect: { id: tag.id }
              }
            }
          });
        }
      }

      // 3. Update user points for those who solved this question
      if (pointsDifference !== 0) {
        // Find all successful submissions for this question
        const submissions = await tx.submission.findMany({
          where: {
            questionId,
            status: 'ACCEPTED',
          },
          select: {
            userId: true,
            contestId: true,
          },
        });

        // Update points for each user who solved this question
        const userIds = [...new Set(submissions.map(s => s.userId))];
        
        for (const userId of userIds) {
          await tx.user.update({
            where: { id: userId },
            data: {
              individualPoints: {
                increment: pointsDifference
              }
            }
          });
        }

        // Find all contests containing this question
        const contestIds = [...new Set(submissions
          .filter(s => s.contestId !== null)
          .map(s => s.contestId))];

        // Update group points for each contest that had this question
        for (const contestId of contestIds) {
          // Find all groups that participated in this contest
          const groupContests = await tx.groupOnContest.findMany({
            where: { contestId: contestId as number },
            include: { group: true }
          });

          // Update each group's points
          for (const groupContest of groupContests) {
            // Find users in this group who solved this question
            const groupUserSubmissions = await tx.submission.findMany({
              where: {
                questionId,
                status: 'ACCEPTED',
                contestId: contestId as number,
                user: {
                  groupId: groupContest.groupId
                }
              }
            });
            
            // Calculate the number of members who solved this question
            const membersWhoSolved = groupUserSubmissions.length;
            
            // Get total members in the group
            const groupMembersCount = await tx.user.count({
              where: {
                groupId: groupContest.groupId
              }
            });
            
            // Calculate points delta using max(4, number of members) formula
            const divisor = Math.max(4, groupMembersCount);
            const groupPointsToAdd = (membersWhoSolved * pointsDifference) / divisor;
            
            // Update group points
            await tx.group.update({
              where: { id: groupContest.groupId },
              data: {
                groupPoints: {
                  increment: groupPointsToAdd
                }
              }
            });
            
            // Update contest score for this group
            await tx.groupOnContest.update({
              where: { id: groupContest.id },
              data: {
                score: {
                  increment: groupPointsToAdd
                }
              }
            });
          }
          
          // Re-rank groups based on new scores for this contest
          const updatedGroupContests = await tx.groupOnContest.findMany({
            where: { contestId: contestId as number },
            orderBy: { score: 'desc' }
          });
          
          // Update ranks
          for (let i = 0; i < updatedGroupContests.length; i++) {
            await tx.groupOnContest.update({
              where: { id: updatedGroupContests[i].id },
              data: { rank: i + 1 }
            });
          }
        }
      }

      return updatedQuestion;
    }, { timeout: 15000 });

    return NextResponse.json({ 
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Internal server error', error },
      { status: 500 }
    );
  }
}