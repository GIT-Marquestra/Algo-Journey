import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession()
        const userEmail = session?.user?.email
        const body = await req.json();
        const { contestId, finalScore, questions, questionsFromDb } = body;

        
        if (!contestId || !userEmail || typeof finalScore !== "number" || !Array.isArray(questions)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        const contestID = parseInt(contestId);

        const latestContest = await prisma.contest.findFirst({
            orderBy:{
                id: 'desc'
            }
        })
        

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { group: { include: { members: true } } },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (prisma) => {
            // Delete the TempContestTime entry for this user and contest
            await prisma.tempContestTime.deleteMany({
                where: {
                    userId: user.id,
                    contestId: contestID
                }
            });
            
            // Handle empty questions array by creating a dummy submission
            if (questions.length === 0 && Array.isArray(questionsFromDb) && questionsFromDb.length > 0) {
                // Select a random question from questionsFromDb
                const randomIndex = Math.floor(Math.random() * questionsFromDb.length);
                const randomQuestion = questionsFromDb[randomIndex];
                
                // Create a dummy submission with zero score
                if (randomQuestion && randomQuestion.question && randomQuestion.question.id) {
                    await prisma.submission.create({
                        data: {
                            userId: user.id,
                            questionId: randomQuestion.question.id,
                            contestId: contestID,
                            status: 'PENDING', // or use a different status like "PENDING" if preferred
                            score: 0, // Zero score for dummy submission
                        },
                    });
                }
            } else {
                // Process normal submissions if questions array is not empty
                await Promise.all(
                    questions.map(async (questionId) => {
                        const question = await prisma.questionOnContest.findFirst({
                            where: { questionId: questionId },
                            include: { question: true },
                        });

                        console.log('question: ', question)

                        if (!question || !question.question) {
                            throw new Error(`Invalid questionId: ${questionId}`);
                        }

                        await prisma.submission.create({
                            data: {
                                userId: user.id,
                                questionId: question.question.id,
                                contestId: contestID,
                                status: "ACCEPTED",
                                score: question.question.points,
                            },
                        });
                    })
                );
            }

            // Update individual points
            const userSubmissions = await prisma.submission.findMany({
                where: { userId: user.id, status: "ACCEPTED" },
                select: { score: true },
            });

            const totalUserPoints = userSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0);

            await prisma.user.update({
                where: { id: user.id },
                data: { individualPoints: totalUserPoints },
            });

            if (user.groupId && user.group) {
                // Count total permitted members for this contest
                const contestPermission = await prisma.contestPermission.findFirst({
                    where: { contestId: contestID },
                    include: { users: { where: { groupId: user.groupId } } },
                });

                // Get the number of members with permission (minimum is 1 since current user has permission)
                const totalPermittedMembers = contestPermission ? contestPermission.users.length : 1;
                
                // For averaging, always use at least 4 members as divisor
                const divisor = Math.max(4, totalPermittedMembers);
                const averageScore = finalScore / divisor;
                
                // Check if this is the first attempt for this contest by the group
                await prisma.groupOnContest.findUnique({
                    where: { groupId_contestId: { groupId: user.groupId, contestId: contestID } },
                });

                // Create or update the group's score for this contest
               if(latestContest){
                const now = new Date();
                const istOffset = 5.5 * 60 * 60 * 1000; // IST offset from UTC
                const currentTimeIST = new Date(now.getTime() + istOffset);
                const contestStart = new Date(latestContest.startTime);
                const contestEnd = new Date(latestContest.endTime);

                if(contestStart <= currentTimeIST && currentTimeIST <= contestEnd){

                    await prisma.groupOnContest.upsert({
                        where: { groupId_contestId: { groupId: user.groupId, contestId: contestID } },
                        create: { groupId: user.groupId, contestId: contestID, score: averageScore },
                        update: { score: { increment: averageScore } },
                    });
                   }
                }

                // Update rankings for all groups in this contest
                const groupsInContest = await prisma.groupOnContest.findMany({
                    where: { contestId: contestID },
                    orderBy: { score: "desc" },
                });

                for (let i = 0; i < groupsInContest.length; i++) {
                    await prisma.groupOnContest.update({
                        where: { id: groupsInContest[i].id },
                        data: { rank: i + 1 },
                    });
                }

                // Recalculate total group points by summing scores from all contests
                const totalGroupPoints = await prisma.groupOnContest.findMany({
                    where: { groupId: user.groupId },
                    select: { score: true },
                });

                const groupTotalScore = totalGroupPoints.reduce((acc, curr) => acc + (curr.score || 0), 0);
                await prisma.group.update({
                    where: { id: user.groupId },
                    data: { groupPoints: groupTotalScore },
                });
            }

            // Check if all members with permission have submitted for this contest
            if (user.group?.members) {
                const contestPermission = await prisma.contestPermission.findFirst({
                    where: { contestId: contestID },
                    include: { users: { where: { groupId: user.groupId } } },
                });
                
                if (contestPermission) {
                    const permittedMemberIds = contestPermission.users.map(u => u.id);
                    
                    const allMembersSubmissions = await prisma.submission.findMany({
                        where: { 
                            contestId: contestID, 
                            userId: { in: permittedMemberIds } 
                        },
                        distinct: ["userId"],
                    });
    
                    if (allMembersSubmissions.length === permittedMemberIds.length) {
                        await prisma.contest.update({
                            where: { id: contestID },
                            data: { status: "COMPLETED" },
                        });
                    }
                }
            }

            return { message: "Contest submissions recorded successfully" };
        },{
            timeout: 40000, 
            isolationLevel: "ReadCommitted", // Ensures consistency but improves concurrency
        });

        return NextResponse.json({ message: result.message }, { status: 200 });

    } catch (error) {
        console.error("Error processing contest submissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}