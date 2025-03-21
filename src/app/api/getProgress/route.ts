import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    const session = await getServerSession();
    const userEmail = session?.user?.email;


    const user = await prisma.user.findUnique({
      where: {
        email: userEmail
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    const questionsWithProgress = await prisma.questionTag.findMany({
      include: {
        questions: {
          where:{
            inArena: true
          },
          include: {
            submissions: {
              where: {
                userId: user.id,
                status: "ACCEPTED"
              }
            }
          }
        }
      }
    });


    const topicProgress = questionsWithProgress.reduce((acc, tag) => {
      const total = tag.questions.length;
      const solved = tag.questions.filter(q => q.submissions.length > 0).length;
      
      acc[tag.name] = {
        total,
        solved,
        percentage: total > 0 ? Math.round((solved / total) * 100) : 0
      };
      
      return acc;
    }, {} as Record<string, { total: number; solved: number; percentage: number }>);

    return NextResponse.json({ topicProgress });
    
  } catch (error) {
    console.error("Error fetching topic progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic progress" },
      { status: 500 }
    );
  }
}