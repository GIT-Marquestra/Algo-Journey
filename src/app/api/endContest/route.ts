import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession()
        const userEmail = session?.user?.email
        const body = await req.json();
        const { contestId, finalScore, questions } = body;
        console.log(body);

        if (!contestId || !userEmail || typeof finalScore !== "number" || !Array.isArray(questions)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        const contestID = parseInt(contestId);

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { group: { include: { members: true } } },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (prisma) => {
            // Store submissions
            await Promise.all(
                questions.map(async (questionId) => {
                    const question = await prisma.questionOnContest.findFirst({
                        where: { id: questionId },
                        include: { question: true },
                    });

                    if (!question || !question.question) {
                        throw new Error(`Invalid questionId: ${questionId}`);
                    }

                    console.log("Found question ID:", question.question.id);

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

                const latestContest = await prisma.contest.findFirst({ orderBy: { id: "desc" } });

 
                const existingGroupAttempt = await prisma.groupOnContest.findUnique({
                    where: { groupId_contestId: { groupId: user.groupId, contestId: contestID } },
                });

                const groupScore = existingGroupAttempt
                    ? latestContest?.id !== contestID
                        ? finalScore / 2
                        : finalScore
                    : finalScore;

                await prisma.groupOnContest.upsert({
                    where: { groupId_contestId: { groupId: user.groupId, contestId: contestID } },
                    create: { groupId: user.groupId, contestId: contestID, score: groupScore },
                    update: { score: { increment: groupScore } },
                });

               
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

            
            const allMembersSubmissions = await prisma.submission.findMany({
                where: { contestId: contestID, userId: { in: user.group?.members.map(m => m.id) || [] } },
                distinct: ["userId"],
            });

            if (user.group?.members && allMembersSubmissions.length === user.group.members.length) {
                await prisma.contest.update({
                    where: { id: contestID },
                    data: { status: "COMPLETED" },
                });
            }

            return { message: "Contest submissions recorded successfully" };
        },{
            timeout: 15000, // Increase timeout to 15 seconds (adjust as needed)
            isolationLevel: "ReadCommitted", // Ensures consistency but improves concurrency
        });

        return NextResponse.json({ message: result.message }, { status: 200 });

    } catch (error) {
        console.error("Error processing contest submissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}