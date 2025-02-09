import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userEmail = session.user.email;

        const user = await prisma.user.findUnique({
            where: {
                email: userEmail
            },
            include: {
                group: {
                    include: {
                        members: {
                            select: {
                                username: true,
                                individualPoints: true // Ensure individual points are fetched
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const latestContest = await prisma.contest.findFirst({
            orderBy: { id: "desc" },
        });

        if (!latestContest) {
            return NextResponse.json({ error: "No contest found" }, { status: 404 });
        }

        // Calculate current time in IST
        const nowO = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // IST offset
        const now = new Date(nowO.getTime() + offset);

        // Check contest status and update if needed
        if (now > latestContest.endTime) {
            // Contest has ended
            await prisma.contest.update({
                where: { id: latestContest.id },
                data: { status: "COMPLETED" },
            });
            console.log(`Updated contest ${latestContest.id} to COMPLETED`);
        } else if (now > latestContest.startTime && now < latestContest.endTime) {
            // Contest is ongoing
            await prisma.contest.update({
                where: { id: latestContest.id },
                data: { status: "ACTIVE" },
            });
            console.log(`Updated contest ${latestContest.id} to ACTIVE`);
        }

        // Get the updated contest data
        const updatedContest = await prisma.contest.findUnique({
            where: { id: latestContest.id },
        });

        const submissionCount = await prisma.submission.count({
            where: { userId: user.id },
        });

        console.log({
            latestContest: updatedContest,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                individualPoints: user.individualPoints,
                group: user.group
                    ? {
                        name: user.group.name,
                        members: user.group.members.map(member => ({
                            username: member.username,
                            individualPoints: member.individualPoints, // Include individual points
                        })),
                    }
                    : null,
            },
            submissionCount,
        },)

        return NextResponse.json(
            {
                latestContest: updatedContest,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    individualPoints: user.individualPoints,
                    group: user.group
                        ? {
                            name: user.group.name,
                            members: user.group.members.map(member => ({
                                username: member.username,
                                individualPoints: member.individualPoints, // Include individual points
                            })),
                        }
                        : null,
                },
                submissionCount,
            },
            { status: 200 }
        );
        

    } catch (error) {
        console.error("Error fetching contest data:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}