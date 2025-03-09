import { authOptions } from "@/lib/authOptions";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {

  const session = await getServerSession(authOptions)

  console.log(session)

  const accessToken = session?.user.githubAccessToken

  console.log('accessToken', accessToken)
  
  if (!accessToken) return NextResponse.json({ message: "GitHub not connected" }, { status: 235 });

  const response = await axios.post("https://api.github.com/user/repos", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log(response)
  const repos = response.data.repos
  NextResponse.json({ repos }, { status: 200 });
}