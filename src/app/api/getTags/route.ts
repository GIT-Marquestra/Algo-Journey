import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tags = await prisma.questionTag.findMany({
      orderBy:{
        createdAt: 'desc' 
      }
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

