import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { contestId, isAllSelected } = data
    let { groups } = data

    console.log(contestId, isAllSelected, groups)

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
      // 
    }

    if (isAllSelected) {
      // If all groups should have access, fetch all group IDs
      const allGroups = await prisma.group.findMany({ select: { id: true } });
      groups = allGroups.map(group => group.id);
    }

    // Upsert (update or insert) permissions for each group
    const permissions = await Promise.all(
      groups.map(async (groupId: string) => {
        return prisma.groupPermission.upsert({
          where: { groupId_contestId: { groupId, contestId } },
          update: { contestId },
          create: { groupId, contestId },
        });
      })
    );

    return NextResponse.json(
      { message: "Permissions set successfully", permissions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting group permissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}