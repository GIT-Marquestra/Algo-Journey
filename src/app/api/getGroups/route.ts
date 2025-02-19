import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ groups: groups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}