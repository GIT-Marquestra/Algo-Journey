import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface UpdateData {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface QuestionItem {
  questionId: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contestId, questions, startTime, endTime, duration, permittedGroups } = body;
    
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

    console.log(1)

    // Start a transaction to handle all updates atomically
    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: UpdateData = {};
      
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (duration != null) updateData.duration = parseInt(duration);

      // Update the contest
      await tx.contest.update({
        where: { id: parsedContestId },
        data: updateData,
      });

      // Handle questions update if provided
      if (questions && Array.isArray(questions) && questions.length > 0) {
        // Delete existing questions
        await tx.questionOnContest.deleteMany({
          where: { contestId: parsedContestId },
        });

        // Create new question connections
        const questionConnections = questions
          .filter((q: QuestionItem) => q && typeof q.questionId === 'string')
          .map((q: QuestionItem) => ({
            contestId: parsedContestId,
            questionId: q.questionId,
          }));

        if (questionConnections.length > 0) {
          await tx.questionOnContest.createMany({
            data: questionConnections,
          });
        }
      }



      // Handle group permissions update if provided
      if (permittedGroups && Array.isArray(permittedGroups)) {
        // Delete existing group permissions
        await tx.groupPermission.deleteMany({
          where: { contestId: parsedContestId },
        });

        // Create new group permissions
        if (permittedGroups.length > 0) {
          const groupPermissionData = permittedGroups.map(groupId => ({
            groupId,
            contestId: parsedContestId,
          }));

          await tx.groupPermission.createMany({
            data: groupPermissionData,
          });
        }
      }

      console.log(3)

      // Fetch updated contest with all relations
      return await tx.contest.findUnique({
        where: { id: parsedContestId },
        include: {
          questions: {
            include: {
              question: true,
            },
          },
          groupPermissions: {
            include: {
              group: true,
            },
          },
        },
      });
    });

    console.log(5)

    return NextResponse.json({ 
      message: "Contest updated successfully", 
      contest: result 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating contest:", error);
    return NextResponse.json({ 
      error: "Failed to update contest", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}