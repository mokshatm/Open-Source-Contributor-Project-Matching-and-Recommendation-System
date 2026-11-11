import { NextResponse } from "next/server";
import { githubRequest, GitHubApiError } from "@/services/github";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json({ organizations: [] });
  try {
    const response = await githubRequest(`/search/users?q=${encodeURIComponent(`${query} type:org`)}&per_page=8`);
    const data = await response.json();
    return NextResponse.json({ organizations: (data.items || []).map((item) => ({ login: item.login, avatarUrl: item.avatar_url, profileUrl: item.html_url })) });
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to search GitHub organizations." }, { status });
  }
}
