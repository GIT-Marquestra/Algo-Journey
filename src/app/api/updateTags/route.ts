import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
      const { tags } = await req.json();
  
      if (!Array.isArray(tags)) {
        return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
      }
  
      // Ensure tags are unique
      const newTags = tags.map((tag) => ({
        name: tag,
      }));
  
      await prisma.$transaction([
        prisma.questionTag.deleteMany(), // Clear existing tags
        prisma.questionTag.createMany({ data: newTags }), // Insert new tags
      ]);
  
      return NextResponse.json({ message: "Tags updated successfully" });
    } catch (error) {
        console.log(error)
      return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
    }
  }