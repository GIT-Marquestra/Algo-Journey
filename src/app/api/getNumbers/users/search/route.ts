import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



// **Route 1: Get formatted names from emails matching the query**
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { query: name } = data
    if (!name) {
      return NextResponse.json({ error: "Name query is required" }, { status: 400 });
    }

    // Find emails starting with the given query till "2024@nst.rishihood.edu.in"

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: `${name}`,
          mode: "insensitive",
        },
      },
      select: { email: true },
    });

    const formattedUsers = users.map((p) => p.email)


    return NextResponse.json({ formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching formatted names:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}