import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id;

    const { tagHintId, isHelpful } = await request.json();

    // DEBUG: Log the received values
    console.log("Received tagHintId:", tagHintId);
    console.log("Received isHelpful:", isHelpful);
    console.log("User ID:", userId);

    if (!tagHintId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: "tagHintId and isHelpful (boolean) are required" },
        { status: 400 }
      );
    }

    // DEBUG: Check if tagHint exists and log details
    console.log("Checking if tagHint exists...");
    const tagHintExists = await prisma.tagHint.findUnique({
      where: { id: tagHintId },
      select: { 
        id: true,
        questionId: true,
        tagId: true
      }
    });

    console.log("TagHint query result:", tagHintExists);

    if (!tagHintExists) {
      // DEBUG: Let's see what TagHints actually exist
      const allTagHints = await prisma.tagHint.findMany({
        select: { id: true },
        take: 5 // Just first 5 for debugging
      });
      console.log("Available TagHint IDs (first 5):", allTagHints);
      
      return NextResponse.json(
        { 
          error: "TagHint not found",
          debug: {
            requestedId: tagHintId,
            availableIds: allTagHints.map(th => th.id)
          }
        },
        { status: 404 }
      );
    }

    // 2214d366-4673-47a5-b3bb-8d35cecbe998

    // Check if user already rated this tagHint
    console.log("Checking for existing rating...");
    const existingRating = await prisma.tagHintRating.findUnique({
      where: {
        userId_tagHintId: {
          userId: userId,
          tagHintId: tagHintId
        }
      }
    });

    console.log("Existing rating:", existingRating);

    let rating;

    if (existingRating) {
      if (existingRating.isHelpful === isHelpful) {
        // Same rating clicked - remove it (toggle off)
        console.log("Deleting existing rating...");
        await prisma.tagHintRating.delete({
          where: {
            id: existingRating.id
          }
        });
        rating = null;
      } else {
        // Different rating clicked - update it
        console.log("Updating existing rating...");
        rating = await prisma.tagHintRating.update({
          where: {
            id: existingRating.id
          },
          data: {
            isHelpful: isHelpful
          }
        });
      }
    } else {
      // No existing rating - create new one
      console.log("Creating new rating...");
      console.log("Data to create:", {
        userId: userId,
        tagHintId: tagHintId,  
        isHelpful: isHelpful
      });

      // DOUBLE CHECK: Verify TagHint exists right before creation
      const lastCheck = await prisma.tagHint.findUnique({
        where: { id: tagHintId }
      });
      console.log("Last check before create - TagHint exists:", !!lastCheck);

      if (!lastCheck) {
        return NextResponse.json(
          { error: "TagHint disappeared before creation" },
          { status: 500 }
        );
      }

      rating = await prisma.tagHintRating.create({
        data: {
          userId: userId,
          tagHintId: tagHintId,
          isHelpful: isHelpful
        }
      });
      console.log("Created rating:", rating);
    }

    // Get updated counts
    const [likesCount, dislikesCount] = await Promise.all([
      prisma.tagHintRating.count({
        where: {
          tagHintId: tagHintId,
          isHelpful: true
        }
      }),
      prisma.tagHintRating.count({
        where: {
          tagHintId: tagHintId,
          isHelpful: false
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      userRating: rating ? rating.isHelpful : null,
      counts: {
        likes: likesCount,
        dislikes: dislikesCount
      }
    });

  } catch (error) {
    console.error("Error handling rating:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      { error: "Failed to process rating" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const tagHintId = searchParams.get('tagHintId');

    if (!tagHintId) {
      return NextResponse.json(
        { error: "tagHintId is required" },
        { status: 400 }
      );
    }

    // Check if tagHint exists
    const tagHintExists = await prisma.tagHint.findUnique({
      where: { id: tagHintId },
      select: { id: true }
    });

    if (!tagHintExists) {
      return NextResponse.json(
        { error: "TagHint not found" },
        { status: 404 }
      );
    }

    // Delete user's rating
    const deletedRating = await prisma.tagHintRating.deleteMany({
      where: {
        userId: userId,
        tagHintId: tagHintId
      }
    });

    if (deletedRating.count === 0) {
      return NextResponse.json(
        { error: "No rating found to delete" },
        { status: 404 }
      );
    }

    // Get updated counts
    const [likesCount, dislikesCount] = await Promise.all([
      prisma.tagHintRating.count({
        where: {
          tagHintId: tagHintId,
          isHelpful: true
        }
      }),
      prisma.tagHintRating.count({
        where: {
          tagHintId: tagHintId,
          isHelpful: false
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      userRating: null,
      counts: {
        likes: likesCount,
        dislikes: dislikesCount
      }
    });

  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}