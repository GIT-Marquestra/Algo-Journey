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
            where: { email: userEmail },
            include: {
                group: {
                    include: {
                        members: {
                            select: {
                                username: true,
                                individualPoints: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        
        // Fetch all upcoming contests
        let upcomingContests = await prisma.contest.findMany({
            where: { status: "UPCOMING" },
            orderBy: { startTime: "asc" },
        });

        console.log(upcomingContests)
        
        if (!upcomingContests.length) {
            upcomingContests = await prisma.contest.findMany({
                take: 2,
            });
        }

        // Calculate current time in IST
        const nowO = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // IST offset
        const now = new Date(nowO.getTime() + offset);

        // Update status for all upcoming contests
        const updatedContests = await Promise.all(
            upcomingContests.map(async (contest) => {
                if (now > contest.endTime) {
                    // Contest has ended
                    return prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "COMPLETED" },
                    });
                } else if (now >= contest.startTime && now <= contest.endTime) {
                    // Contest is ongoing
                    return prisma.contest.update({
                        where: { id: contest.id },
                        data: { status: "ACTIVE" },
                    });
                }
                return contest; // Return unchanged if no update needed
            })
        );

        const submissionCount = await prisma.submission.count({
            where: { userId: user.id },
        });

        
        return NextResponse.json(
            {
                latestContests: updatedContests,
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
                                individualPoints: member.individualPoints,
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