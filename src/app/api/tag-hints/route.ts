import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, tagId, hints } = body;
    
    if (!questionId || !tagId || !hints || hints.length !== 3) {
      return NextResponse.json(
        { error: "Invalid request. Required: questionId, tagId, and 3 hints" },
        { status: 400 }
      );
    }
    
    // Check if this tag hint already exists
    let tagHint = await prisma.tagHint.findUnique({
      where: {
        questionId_tagId: {
          questionId,
          tagId
        }
      },
      include: { hints: true }
    });
    
    if (tagHint) {
      // Update existing hints
      for (const hint of hints) {
        const existingHint = tagHint.hints.find(h => h.sequence === hint.sequence);
        
        if (existingHint) {
          // Update existing hint
          await prisma.hintnew.update({
            where: { id: existingHint.id },
            data: { content: hint.content }
          });
        } else {
          // Create new hint
          await prisma.hintnew.create({
            data: {
              tagHintId: tagHint.id,
              content: hint.content,
              sequence: hint.sequence
            }
          });
        }
      }
    } else {
      // Create new tag hint with hints
      tagHint = await prisma.tagHint.create({
        data: {
          question: { connect: { id: questionId } },
          tag: { connect: { id: tagId } },
          hints: {
            // @ts-expect-error: not imp here elemented yet
            create: hints.map(hint => ({
              content: hint.content,
              sequence: hint.sequence
            }))
          }
        },
        include: { hints: true }
      });
    }
    
    return NextResponse.json({
      id: tagHint.id,
      hints: tagHint.hints
    });
  } catch (error) {
    console.error("Error saving tag hints:", error);
    return NextResponse.json(
      { error: "Failed to save tag hints" },
      { status: 500 }
    );
  }
}