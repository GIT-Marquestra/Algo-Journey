import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("❌ No authorization code received");
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      console.error("❌ Failed to get access token");
      return NextResponse.json({ error: "Failed to get access token" }, { status: 400 });
    }
    const accessToken = data.access_token;
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("❌ Session not found");
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    session.user.githubAccessToken = accessToken;
    
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/chat/true/${accessToken}`);
  } catch (error) {
    console.error("🔥 GitHub OAuth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}