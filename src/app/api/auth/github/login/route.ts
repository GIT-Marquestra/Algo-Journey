import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/github/callback";

  // GitHub OAuth URL
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(githubAuthUrl);
}