import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email
    if(!userEmail) return NextResponse.json({ error: "UnAuthorized" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        username: true,
        email: true,
        leetcodeUsername: true,
        codeforcesUsername: true,
        section: true,
        enrollmentNum: true,
        profileUrl: true,
        individualPoints: true,
      },
    });


    console.log(userEmail)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}