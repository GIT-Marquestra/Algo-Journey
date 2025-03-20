import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
) {
  try {

    const url = request.url.split('/')

    const questionId = url[url.length - 1]

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const hint = await prisma.hint.findUnique({
      where: {
        questionId: questionId,
      },
      select: {
        hint1: true,
        hint2: true,
        hint3: true,
      },
    });

    if (!hint) {
      return NextResponse.json(
        { error: "No hints found for this question" },
        { status: 404 }
      );
    }

    return NextResponse.json(hint);
  } catch (error) {
    console.error("Error fetching hint:", error);
    return NextResponse.json(
      { error: "Failed to fetch hints" },
      { status: 500 }
    );
  }
}