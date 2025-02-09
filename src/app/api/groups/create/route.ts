import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const request = await req.json();
    console.log("Incoming request:", request);

    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const admins = ["Abhishek Verma", "Taj", "Kunal", "Sai"];
    if (!admins.includes(user.username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, users, coordinator } = request;

    const coordinatorUser = await prisma.user.findUnique({
      where: { id: coordinator },
    });

    if (!coordinatorUser) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
    }

    // Check if the group already exists
    const existingGroup = await prisma.group.findUnique({
      where: { name },
      include: { members: true },
    });

    if (existingGroup) {
      // If the group exists, update its details
      const updatedGroup = await prisma.$transaction(async (tx) => {
        const updatedGroup = await tx.group.update({
          where: { id: existingGroup.id },
          data: {
            coordinator: { connect: { id: coordinator } },
            members: { connect: users.map((id: string) => ({ id })) },
          },
        });

        // Update users' groupId to match the existing group
        await tx.user.updateMany({
          where: { id: { in: users } },
          data: { groupId: existingGroup.id },
        });

        return updatedGroup;
      });

      return NextResponse.json({ group: updatedGroup, message: "Group updated successfully" }, { status: 200 });
    } else {
      // If the group doesn't exist, create it as before
      const group = await prisma.$transaction(
        async (tx) => {
          const newGroup = await tx.group.create({
            data: {
              name,
              coordinator: { connect: { id: coordinator } },
              members: { connect: users.map((id: string) => ({ id })) },
            },
          });

          await tx.user.updateMany({
            where: { id: { in: users } },
            data: { groupId: newGroup.id },
          });

          return newGroup;
        },
        { timeout: 30000 } // ⬅ Increase timeout to 30 seconds
      );

      return NextResponse.json({ group, message: "Group created successfully" }, { status: 200 });
    }
  } catch (error) {
    console.error("Error creating/updating group:", error);
    return NextResponse.json({ error: "Failed to create/update group" }, { status: 500 });
  }
}