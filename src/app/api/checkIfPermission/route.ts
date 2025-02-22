import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, contestId } = await req.json();

    if (!userId || !contestId) {
      return NextResponse.json({ success: false, error: "Missing userId or contestId" }, { status: 400 });
    }

    const hasPermission = await prisma.contestPermission.findFirst({
      where: {
        contestId: Number(contestId),
        users: { some: { id: userId } } 
      }
    });

    return NextResponse.json({ hasPermission: !!hasPermission });

  } catch (error) {
    console.error("Error checking contest permission:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}