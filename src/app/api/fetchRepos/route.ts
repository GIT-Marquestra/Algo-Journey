import { NextResponse } from "next/server";
import { Octokit } from "@octokit/core";

export async function POST(req: Request) {

  const request = await req.json()

  const { accessToken } = request
 
  if (!accessToken) {
    return NextResponse.json({ message: "GitHub not connected" }, { status: 401 });
  }

  try {
    // ✅ Initialize Octokit with the received access token
    const octokit = new Octokit({ auth: accessToken });

    // ✅ Fetch the authenticated user's repositories
    const response = await octokit.request("GET /user/repos", {
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    });
    const repos = response.data.map((p) => p.name)

    console.log(repos)

    return NextResponse.json({ success: true, repos });
  } catch (error: any) {
    console.error("❌ GitHub API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to fetch repositories", details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}