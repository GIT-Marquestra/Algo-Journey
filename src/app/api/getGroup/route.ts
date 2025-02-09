import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session?.user?.email;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { group: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.group) {
      return NextResponse.json({ message: "User is not part of any group" }, { status: 200 });
    }

    return NextResponse.json({ group: user.group }, { status: 200 });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}