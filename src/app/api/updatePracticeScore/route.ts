import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma"; 

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { contestId, questionId, score } = await req.json();



    if (!questionId || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { group: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    await prisma.user.update({
      where: { id: user.id },
      data: { individualPoints: { increment: score } },
    });



    console.log(user.id, questionId, contestId, score)



    const res = await prisma.submission.create({
      data: {
        userId: user.id,
        questionId,
        contestId: contestId,
        score: parseInt(score),
        status: 'ACCEPTED', 
      },
    });

    console.log(res)


    if(!res) return NextResponse.json({ message: "Submission not created" });

    return NextResponse.json({ message: "Score updated and submission recorded successfully" });
  } catch (error) {
    console.error("Error updating scores and recording submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}