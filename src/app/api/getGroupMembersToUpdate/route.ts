import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure Prisma client is correctly imported

export async function POST(req: Request) {
  try {
    // ✅ Fetch all groups with their members' usernames and IDs
    const request = await req.json()
    const { groupName } = request
    const members = await prisma.group.findUnique({
        where:{
            name: groupName
        },
        select: {
            members: {
            select: {
                id: true,
                username: true,
            },
            },
        },
    });
    
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("🔥 Error fetching groups:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}