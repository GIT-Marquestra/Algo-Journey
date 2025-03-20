// app/api/hints/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { questionId, hint1, hint2, hint3 } = await request.json();

    if (!questionId || !hint1 || !hint2 || !hint3) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the question exists
    const questionExists = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!questionExists) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if hints already exist for this question
    const existingHint = await prisma.hint.findUnique({
      where: { questionId },
    });

    let hint;
    if (existingHint) {
      // Update existing hints
      hint = await prisma.hint.update({
        where: { id: existingHint.id },
        data: {
          hint1,
          hint2,
          hint3,
        },
      });
    } else {
      // Create new hints
      hint = await prisma.hint.create({
        data: {
          questionId,
          hint1,
          hint2,
          hint3,
        },
      });
    }

    return NextResponse.json(hint, { status: 200 });
  } catch (error) {
    console.error("Error saving hints:", error);
    return NextResponse.json(
      { error: "Failed to save hints" },
      { status: 500 }
    );
  }
}