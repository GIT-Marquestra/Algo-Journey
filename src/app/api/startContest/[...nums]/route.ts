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
        const session = await getServerSession()
        const userEmail = session?.user?.email
        const url = request.url

        console.log(url)
    

        const contestNumber = url.split('/api/startContest/')[1]
        
        if (!contestNumber) {
        return Response.json({ 
            error: 'Contest number not found' 
        }, { status: 400 })
        }

        // Convert to number and validate
        const contestId = parseInt(contestNumber)

        // Example: Extracting individual parameters

        if(!userEmail) return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where:{
                email: userEmail
            }
        })
        
        if (!user) {
            return NextResponse.json({ message: "User not provided" }, { status: 400 });
        }

    
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
        

        const contest: Contest = {
            ...contestData,
            startTime: contestData.startTime.toISOString(),
            endTime: contestData.endTime.toISOString(), 
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
                message: "User has already participated in this contest"
            }, { status: 430 });
        }

        if (!contest) {
            return NextResponse.json({ message: "No contest found" }, { status: 404 });
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
            return NextResponse.json({ message: "User not part of any group" }, { status: 404 });
        }

        // Time calculations
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset from UTC
        const currentTimeIST = new Date(now.getTime() + istOffset);
        
        const contestStart = new Date(contest.startTime);
        const contestEnd = new Date(contest.endTime);
        const joiningWindowEnd = new Date(contestStart.getTime() + (10 * 60 * 1000)); // 10 minutes after start
        console.log(contestStart, contestEnd, joiningWindowEnd)

        // Time validation checks
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

        // if (currentTimeIST > joiningWindowEnd) {
        //     return NextResponse.json({ 
        //         message: "Contest joining window has closed",
        //         joiningWindowEnd
        //     }, { status: 403 });
        // }

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
            return NextResponse.json({ message: "Invalid contest duration" }, { status: 400 });
        }

        const expiryTime = new Date(contestStart.getTime() + (duration * 60 * 60 * 1000)); // Convert hours to milliseconds
        console.log(expiryTime.getTime())
        const remainingTime = Math.floor((expiryTime.getTime() - currentTimeIST.getTime()) / 1000);


        console.log('questions are here: ', contest.questions)

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