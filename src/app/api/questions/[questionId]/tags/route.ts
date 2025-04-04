import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  try {

    const url = request.url
    const arr = url.split('/')
    const questionId = arr[arr.length - 2] 

    console.log("questionId", questionId)   
    
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { questionTags: true }
    });
    
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(question.questionTags);
  } catch (error) {
    console.error("Error fetching question tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch question tags" },
      { status: 500 }
    );
  }
}