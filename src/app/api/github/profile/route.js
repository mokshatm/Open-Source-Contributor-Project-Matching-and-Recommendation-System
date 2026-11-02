import { NextResponse } from "next/server";
import { fetchGitHubProfile, GitHubApiError } from "@/services/github";


export async function GET(request) {
  try {
    const username = new URL(request.url).searchParams.get("username") || "";
    return NextResponse.json(await fetchGitHubProfile(username));
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to load GitHub profile." }, { status });
  }
}

