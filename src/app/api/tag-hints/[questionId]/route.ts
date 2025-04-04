import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  try {

    const url = request.url
    const arr = url.split('/')
    const questionId = arr[arr.length - 1] 
    
    const tagHints = await prisma.tagHint.findMany({
      where: {
        questionId: questionId
      },
      include: {
        tag: true,
        hints: {
          orderBy: {
            sequence: 'asc'
          }
        }
      }
    });
    
    const formattedTagHints = tagHints.map(tagHint => ({
      id: tagHint.id,
      tagId: tagHint.tagId,
      tagName: tagHint.tag.name,
      hints: tagHint.hints
    }));
    
    return NextResponse.json(formattedTagHints);
  } catch (error) {
    console.error("Error fetching tag hints:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag hints" },
      { status: 500 }
    );
  }
}