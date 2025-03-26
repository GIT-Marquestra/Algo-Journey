import { NextResponse } from "next/server";
import { Octokit } from "@octokit/core";

export async function POST(req: Request) {

  const request = await req.json()

  const { accessToken } = request
 
  if (!accessToken) {
    return NextResponse.json({ message: "GitHub not connected" }, { status: 235 });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });

    const response = await octokit.request("GET /user/repos", {
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    });
    const repos = response.data.map((p) => p.name)

    const githubUsername = response.data[0].owner.login

    return NextResponse.json({ success: true, repos, githubUsername });
  } catch (error) {
    console.error("❌ GitHub API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}