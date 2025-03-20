import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const { contestId: id } = await req.json();

    
    if (!id) {
        return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }
    
    const contest = await prisma.contest.findUnique({
      where: { id: parseInt(id) },
      include:{
        questions: {
          include:{
            question: {
              include:{
                questionTags: true
              }
            }
          }
        }
      }
    });

    console.log(contest)
    
    if (!contest) {
        return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }
    
    return NextResponse.json({ contest }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contest:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}