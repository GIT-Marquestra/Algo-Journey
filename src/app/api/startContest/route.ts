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

export async function POST() {
    try {
        const session = await getServerSession()
        const userEmail = session?.user?.email

        if(!userEmail) return NextResponse.json({ error: "UnAuthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where:{
                email: userEmail
            }
        })
        
        if (!user) {
            return NextResponse.json({ error: "User not provided" }, { status: 400 });
        }

        
        // Get the latest contest
        const contestData = await prisma.contest.findFirst({
            orderBy: {
                id: 'desc'
            },
            include: {
                questions: {
                    include: {
                        question: true,
                    },
                },
            },
        });
        
        if (!contestData) {
            return NextResponse.json({ error: "Contest not found" }, { status: 404 });
        }
        
        // Convert Date fields to string
        const contest: Contest = {
            ...contestData,
            startTime: contestData.startTime.toISOString(), // Convert Date to string
            endTime: contestData.endTime.toISOString(), // Convert Date to string
        };

        if(!contest) return 

        const existingSubmission = await prisma.submission.findFirst({
            where: {
                userId: user.id,
                contestId: contest.id
            }
        });
        
        if (existingSubmission) {
            return NextResponse.json({
                error: "User has already participated in this contest"
            }, { status: 403 });
        }

        if (!contest) {
            return NextResponse.json({ error: "No contest found" }, { status: 404 });
        }

        // Get user's group
        const userGroup = await prisma.group.findFirst({
            where: {
                members: {
                    some: {
                        email: user.email
                    }
                }
            }
        });

        if (!userGroup) {
            return NextResponse.json({ error: "User not part of any group" }, { status: 404 });
        }

        // Time calculations
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset from UTC
        const currentTimeIST = new Date(now.getTime() + istOffset);
        
        const contestStart = new Date(contest.startTime);
        const contestEnd = new Date(contest.endTime);
        const joiningWindowEnd = new Date(contestStart.getTime() + (10 * 60 * 1000)); // 10 minutes after start

        // Time validation checks
        if (currentTimeIST < contestStart) {
            return NextResponse.json({ 
                error: "Contest hasn't started yet",
                startTime: contestStart
            }, { status: 403 });
        }

        if (currentTimeIST > contestEnd) {
            return NextResponse.json({ 
                error: "Contest has ended",
                endTime: contestEnd
            }, { status: 420 });
        }

        if (currentTimeIST > joiningWindowEnd) {
            return NextResponse.json({ 
                error: "Contest joining window has closed",
                joiningWindowEnd
            }, { status: 403 });
        }

        // Handle group contest entry
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
            return NextResponse.json({ error: "Invalid contest duration" }, { status: 400 });
        }

        const expiryTime = new Date(contestStart.getTime() + (duration * 60 * 60 * 1000)); // Convert hours to milliseconds
        console.log(expiryTime.getTime())
        const remainingTime = Math.floor((expiryTime.getTime() - currentTimeIST.getTime()) / 1000);

        console.log(remainingTime)

        return NextResponse.json({
            message: "User can take the test",
            contest: {
                id: contest.id,
                startTime: contestStart,
                endTime: contestEnd,
                joiningWindowEnd,
                expiryTime,
            },
            remainingTime,
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