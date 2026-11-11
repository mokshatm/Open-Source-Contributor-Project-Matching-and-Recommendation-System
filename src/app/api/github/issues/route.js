import { NextResponse } from "next/server";
import { collectGitHubIssues, TRACKED_REPOSITORIES } from "@/services/githubIssues";
import { GitHubApiError } from "@/services/github";
import { extractRequirementsForIssues } from "@/services/requirementExtraction";
import { addEnvironmentRequirements } from "@/services/environmentRequirements";


export async function GET(request) {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const collected = await collectGitHubIssues({ repos: TRACKED_REPOSITORIES, perPage: 100, maxPages: 2, concurrency: 4, forceRefresh });
    return NextResponse.json({
      ...collected,
      issues: extractRequirementsForIssues(collected.issues).map(addEnvironmentRequirements),
      trackedRepositories: TRACKED_REPOSITORIES.length,
    });
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to collect GitHub issues." }, { status });
  }
}

