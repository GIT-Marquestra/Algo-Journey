import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { contestId } = await req.json();

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    console.log(contestId)
    // Fetch all groups that have permission for the given contestId
    const permittedGroups = await prisma.groupPermission.findMany({
      where: { contestId: parseInt(contestId) },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if(!permittedGroups) return NextResponse.json({ message: 'No group permitted for this contest.' }, { status: 204 })
    
    // Extract only group details
    const groups = permittedGroups.map((permission) => permission.group);

    return NextResponse.json(
      { permittedGroups: groups },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching permitted groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}