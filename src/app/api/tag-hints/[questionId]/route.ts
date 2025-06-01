import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = request.url;
    const arr = url.split('/');
    const questionId = arr[arr.length - 1];
    
    // Get session to check if user is authenticated
    const session = await getServerSession();

    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }, 
    });
    if(!user) NextResponse.json({ error: 'User email not found' }, { status: 404 });
    const userId = user?.id

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
        },
        // Include ratings for counts and user's rating
        ratings: {
          select: {
            id: true,
            isHelpful: true,
            userId: true
          }
        }
      }
    });
    
    const formattedTagHints = tagHints.map(tagHint => {
      // Calculate rating counts
      const likes = tagHint.ratings.filter(rating => rating.isHelpful === true).length;
      const dislikes = tagHint.ratings.filter(rating => rating.isHelpful === false).length;
      
      // Find current user's rating if authenticated
      const userRating = userId 
        ? tagHint.ratings.find(rating => rating.userId === userId)?.isHelpful ?? null
        : null;

      return {
        id: tagHint.id,
        tagId: tagHint.tagId,
        tagName: tagHint.tag.name,
        hints: tagHint.hints,
        ratings: {
          likes: likes,
          dislikes: dislikes,
          userRating: userRating // null if not rated, true if liked, false if disliked
        }
      };
    });
    
    return NextResponse.json(formattedTagHints);
  } catch (error) {
    console.error("Error fetching tag hints:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag hints" },
      { status: 500 }
    );
  }
}