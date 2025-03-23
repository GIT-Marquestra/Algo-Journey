import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { query } = data

    const question = await prisma.question.findUnique({
      where: {
        slug: query
      },
      include: {
        questionTags: true,
        hint: true,
      },
    });


    return NextResponse.json({ question: [question] });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}