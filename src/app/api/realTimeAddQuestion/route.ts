import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface QuestionItem {
  questionId: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contestId, questions } = body;

    // Validate required input
    if (!contestId) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }

    // Convert contest ID to number
    const parsedContestId = parseInt(contestId);
    if (isNaN(parsedContestId)) {
      return NextResponse.json({ error: "Invalid contest ID format" }, { status: 400 });
    }

    // Check if contest exists
    const existingContest = await prisma.contest.findUnique({
      where: { id: parsedContestId },
    });

    if (!existingContest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "No questions provided" }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log("Adding new questions...");

      const questionConnections = questions
        .filter((q: QuestionItem) => q && typeof q.questionId === "string")
        .map((q: QuestionItem) => ({
          contestId: parsedContestId,
          questionId: q.questionId,
        }));

      console.log("Questions to add:", questionConnections);

      if (questionConnections.length > 0) {
        // Add only new questions (ignore existing ones)
        await tx.questionOnContest.createMany({
          data: questionConnections,
          skipDuplicates: true, // Prevent duplicate entries
        });
      }

      // Fetch updated contest with all questions
      return await tx.contest.findUnique({
        where: { id: parsedContestId },
        include: {
          questions: {
            include: {
              question: true,
            },
          },
        },
      });
    });

    console.log("Updated Questions:", result?.questions);

    return NextResponse.json(
      {
        message: "Questions added successfully",
        questions: result?.questions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding questions:", error);
    return NextResponse.json(
      {
        error: "Failed to add questions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}