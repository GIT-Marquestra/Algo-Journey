import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface UpdateData {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface QuestionItem {
  questionId: string;
  // Add other properties if present in your questions objects
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contestId, questions, startTime, endTime, duration } = body;
    
    console.log("Received request:", body);

    // Validate required input
    if (!contestId) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }

    // Convert types safely
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

    // Prepare update data
    const updateData: UpdateData = {};
    
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (duration != null) updateData.duration = parseInt(duration);

    // Update the contest
    await prisma.contest.update({
      where: { id: parsedContestId },
      data: updateData,
    });

    // Handle questions update if provided and valid
    if (questions && Array.isArray(questions) && questions.length > 0) {
      // First delete existing questions connected to this contest
      await prisma.questionOnContest.deleteMany({
        where: { contestId: parsedContestId },
      });

      // Extract question IDs from objects and create connections
      const questionConnections = questions
        .filter((q: QuestionItem) => q && typeof q.questionId === 'string')
        .map((q: QuestionItem) => ({
          contestId: parsedContestId,
          questionId: q.questionId,
        }));

      console.log("Creating question connections:", questionConnections);

      // Only attempt to create if there are valid question connections
      if (questionConnections.length > 0) {
        await prisma.questionOnContest.createMany({
          data: questionConnections,
        });
      }
    }

    // Fetch the updated contest with questions to return
    const contestWithQuestions = await prisma.contest.findUnique({
      where: { id: parsedContestId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: "Contest updated successfully", 
      contest: contestWithQuestions 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating contest:", error);
    return NextResponse.json({ 
      error: "Failed to update contest", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}