import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function PATCH(req: Request) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email
    if(!userEmail) return NextResponse.json({ error: "UnAuthorized" }, { status: 404 });

    // Parse request body
    const body = await req.json();

    const {
      username,
      email,
      leetcodeUsername,
      codeforcesUsername,
      section,
      enrollmentNum,
      profileUrl,
      individualPoints
    } = body.profile;

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        username,
        email,
        leetcodeUsername,
        codeforcesUsername,
        section,
        enrollmentNum,
        profileUrl,
        individualPoints,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}