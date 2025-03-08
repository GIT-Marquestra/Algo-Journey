import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getDurationUlt } from '@/serverActions/getDuration';
import { getServerSession } from 'next-auth';

interface Contest {
    id: number,
    startTime: string,
    endTime: string,
    questions: object[]
}

export async function POST(
    request: Request
) {
    try {
        const session = await getServerSession();
        const userEmail = session?.user?.email;
        const url = request.url;

        if (!userEmail) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // Extract contest ID from URL
        const contestNumber = url.split('/api/startContest/')[1];
        
        if (!contestNumber) {
            return Response.json({ error: 'Contest number not found' }, { status: 400 });
        }

        // Convert to number and validate
        const contestId = parseInt(contestNumber);

        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 });
        }

        // Get the requested contest
        const contestData = await prisma.contest.findUnique({
            where: { id: contestId },
            include: {
                questions: {
                    include: { question: true },
                },
            },
        });

        
        if (!contestData) {
            return NextResponse.json({ error: "Contest not found" }, { status: 404 });
        }

        // Find the latest active contest for comparison
        const latestContest = await prisma.contest.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { startTime: 'desc' },
        });

        const contest: Contest = {
            ...contestData,
            startTime: contestData.startTime.toISOString(),
            endTime: contestData.endTime.toISOString(),
        };

        // Get user's group
        const userGroup = await prisma.group.findFirst({
            where: {
                members: {
                    some: { id: user.id }
                }
            }
        });

        if (!userGroup) {
            return NextResponse.json({ message: "User not part of any group" }, { status: 404 });
        }

        // Check if this is the latest contest
        const isLatestContest = latestContest?.id === contestId;

        // Time calculations
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset from UTC
        const currentTimeIST = new Date(now.getTime() + istOffset);
        
        const contestStart = new Date(contest.startTime);
        const contestEnd = new Date(contest.endTime);
        const joiningWindowEnd = new Date(contestStart.getTime() + (10 * 60 * 1000)); // 10 minutes after start

        if (isLatestContest) {
            // FLOW 1: Latest contest - Check permissions and enforce timing
            
            // Check for contest permission
            const hasPermission = await prisma.contestPermission.findFirst({
                where: {
                    contestId: contestId,
                    users: {
                        some: { id: user.id }
                    }
                }
            });

            if (!hasPermission) {
                return NextResponse.json({ 
                    message: "You don't have permission to attempt this contest",
                    
                }, { status: 490 });
            }

           
            const existingSubmission = await prisma.submission.findFirst({
                where: {
                    userId: user.id,
                    contestId: contest.id
                }
            });
            
            if (existingSubmission) {
                return NextResponse.json({
                    message: "User has already participated in this contest"
                }, { status: 430 });
            }

        
            if (currentTimeIST < contestStart) {
                return NextResponse.json({ 
                    message: "Contest hasn't started yet",
                    startTime: contestStart
                }, { status: 440 });
            }

            if (currentTimeIST > contestEnd) {
                return NextResponse.json({ 
                    message: "Contest has ended",
                    endTime: contestEnd
                }, { status: 420 });
            }
        } else {
      
            console.log("Practice mode - attempting older contest");
        }

        // Common code for both flows: Set up GroupOnContest relation and calculate times
        let groupOnContest = await prisma.groupOnContest.findUnique({
            where: {
                groupId_contestId: {
                    groupId: userGroup.id,
                    contestId: contest.id,
                },
            },
        });

        if (!groupOnContest) {
            groupOnContest = await prisma.groupOnContest.create({
                data: {
                    groupId: userGroup.id,
                    contestId: contest.id,
                    score: 0,
                },
            });
        }

        const duration = getDurationUlt(contest.startTime, contest.endTime);
        if (!duration) {
            return NextResponse.json({ message: "Invalid contest duration" }, { status: 400 });
        }

        const expiryTime = new Date(contestStart.getTime() + (duration * 60 * 60 * 1000)); // Convert hours to milliseconds

        console.log(contest.questions)

        return NextResponse.json({
            message: isLatestContest ? "Starting active contest" : "Starting practice contest",
            contest: {
                id: contest.id,
                duration: contestData.duration,
                startTime: contestStart,
                endTime: contestEnd,
                joiningWindowEnd,
                expiryTime,
                isPractice: !isLatestContest
            },
            questions: contest.questions,
            groupId: userGroup.id,
            status: 200
        });

    } catch (error) {
        console.error('Contest route error:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}