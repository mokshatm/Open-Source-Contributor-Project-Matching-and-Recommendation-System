import { NextResponse } from "next/server";
import { collectGitHubIssues, TRACKED_REPOSITORIES } from "@/services/githubIssues";
import { fetchGitHubProfile, GitHubApiError } from "@/services/github";
import { extractRequirementsForIssues } from "@/services/requirementExtraction";
import { evaluateIssuesEligibility } from "@/services/eligibility";
import { matchIssuesToDeveloper, recommendIssuesToDeveloper } from "@/services/matching";
import { rankRecommendations } from "@/services/ranking";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.username) return NextResponse.json({ error: "Connect a GitHub profile on the Profile page to evaluate eligibility." }, { status: 400 });
    const [githubProfile, collected] = await Promise.all([
      fetchGitHubProfile(String(body.username)),
      collectGitHubIssues({ repos: TRACKED_REPOSITORIES, perPage: 100, maxPages: 2, concurrency: 4, forceRefresh: body.refresh === true }),
    ]);
    const profile = {
      ...githubProfile,
      skills: Array.isArray(body.skills) ? body.skills : [],
      experienceLevel: ["Beginner", "Intermediate", "Advanced"].includes(body.experienceLevel) ? body.experienceLevel : "Unknown",
      selectedDomains: Array.isArray(body.selectedDomains) ? body.selectedDomains : [],
    };
    const issues = extractRequirementsForIssues(collected.issues);
    const eligibleIssues = evaluateIssuesEligibility(issues, profile);
    const matchedIssues = matchIssuesToDeveloper(eligibleIssues, profile);
    return NextResponse.json({
      ...collected,
      issues: matchedIssues,
      recommendations: rankRecommendations(recommendIssuesToDeveloper(eligibleIssues, profile)),
      profile: { username: githubProfile.profile.username, experienceLevel: profile.experienceLevel },
      trackedRepositories: TRACKED_REPOSITORIES.length,
    });
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to evaluate GitHub issue eligibility." }, { status });
  }
}

