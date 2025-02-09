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


    const isCoordinator = user.group?.coordinatorId === user.id;

    return NextResponse.json({ isCoordinator }, { status: 200 });
  } catch (error) {
    console.error("Error checking coordinator status:", error);
    return NextResponse.json({ error: "Failed to check coordinator status" }, { status: 500 });
  }
}