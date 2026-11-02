import { NextResponse } from "next/server";
import { fetchGitHubRateLimit, GitHubApiError } from "@/services/github";


export async function GET() {
  try {
    return NextResponse.json(await fetchGitHubRateLimit());
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to verify GitHub authentication." }, { status });
  }
}

