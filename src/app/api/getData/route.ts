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

        console.log('grgw')

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
                group: {
                    include: {
                        members: {
                            select: { username: true, individualPoints: true },
                        },
                    },
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }


        // Calculate current time in IST
        const nowO = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // IST offset
        const now = new Date(nowO.getTime() + offset);

        // Fetch contests that might need updates
        const contestsToUpdate = await prisma.contest.findMany({
            where: {
                status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] },
            },
            orderBy: { startTime: "asc" },
        });

        // Update contest statuses
        await Promise.all(
            contestsToUpdate.map(async (contest) => {
                if (now > contest.endTime) {
                    // Contest has ended, mark as COMPLETED
                    return prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "COMPLETED" },
                    });
                } else if (now >= contest.startTime && now <= contest.endTime) {
                    // Contest is ongoing, mark as ACTIVE
                    return prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "ACTIVE" },
                    });
                } else if (now < contest.startTime) {
                    // Contest is ongoing, mark as ACTIVE
                    return prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "UPCOMING" },
                    });
                } 
                return contest; // Return unchanged if no update needed
            })
        );

        // Fetch updated contest list (latest 2)
        const latestContests = await prisma.contest.findMany({
            orderBy: { startTime: "desc" },
            take: 2,
        });

        const submissionCount = await prisma.submission.count({
            where: { userId: user.id },
        });


        console.log({
            latestContests,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                individualPoints: user.individualPoints,
                group: user.group
            },
            submissionCount
        })

        return NextResponse.json(
            {
                latestContests,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    individualPoints: user.individualPoints,
                    group: user.group
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