
import prisma from "@/lib/prisma";

export async function fetchContests(){
    const contests = await prisma.contest.findMany()
    return contests
}