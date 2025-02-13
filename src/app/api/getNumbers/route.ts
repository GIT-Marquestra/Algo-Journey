import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
    try {
        const usersArray = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                section: true,
                individualPoints: true,
                email: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                individualPoints: 'desc'
            }
        })
        const groupsArray = await prisma.group.findMany({
            select: {
                id: true,
                name: true,
                coordinator: true,
                members: {
                    select: {
                        id: true,
                        username: true,
                        section: true,
                        individualPoints: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                groupPoints: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                groupPoints: 'desc'
            }
        })
        const groupsOnContest = await prisma.groupOnContest.findMany({
            select: {
                id: true,
                groupId: true,
                contestId: true,
                group: {
                    select: {
                        name: true,
                        groupPoints: true
                    }
                },
                
            },
            orderBy: {
                group: {
                    groupPoints: 'desc'
                }
            }
        })

        const contestsArray = await prisma.contest.findMany({
            select: {
                id: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        const totalUsers = usersArray.length
        const totalGroups = groupsArray.length
        const totalContests = contestsArray.length
        
        const response = {
            totalUsers,
            totalGroups,
            totalContests,
            usersArray,
            groupsArray,
            contestsArray,
            groupsOnContest,
        }   
        console.log(response)
        return NextResponse.json(response, {status: 200})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

