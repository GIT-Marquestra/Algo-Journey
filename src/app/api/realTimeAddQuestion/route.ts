import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface QuestionItem {
  questionId: string;
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(body)
    const { contest_id: contestId, questions: questions2 } = body;

//@ts-expect-error: no need here 
    const questions = questions2.map((q) => ({ questionId: q.question_id, question: q.question }))
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

    // Filter and validate question IDs
    const validQuestionIds = questions
      .filter((q: QuestionItem) => q && typeof q.questionId === "string")
      .map((q: QuestionItem) => q.questionId);

    if (validQuestionIds.length === 0) {
      return NextResponse.json({ error: "No valid question IDs provided" }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create connections for new questions
      const questionConnections = validQuestionIds.map((questionId) => ({
        contestId: parsedContestId,
        questionId,
      }));

      // Add only new questions (ignore existing ones)
      await tx.questionOnContest.createMany({
        data: questionConnections,
        skipDuplicates: true, // Prevent duplicate entries
      });

      // Fetch only the newly added questions
      const addedQuestions = await tx.questionOnContest.findMany({
        where: {
          contestId: parsedContestId,
          questionId: { in: validQuestionIds },
        },
        include: {
          question: true,
        },
      });

      return addedQuestions;
    });

    return NextResponse.json(
      {
        message: "Questions added successfully",
        questions: result,
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