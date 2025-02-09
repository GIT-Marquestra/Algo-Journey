import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session?.user?.email

  if(!userEmail) return 

  const user = await prisma.user.findUnique({
    where:{
        email: userEmail
    }
  })

  if(!user) return NextResponse.json({ error: "User not found" }, { status: 410 });


  return NextResponse.json({ username: user.username }, { status: 200 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error }, { status: 200 });
  }
}