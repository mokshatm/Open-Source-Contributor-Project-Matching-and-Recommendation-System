import { NextResponse } from "next/server";
import { collectGitHubIssues, TRACKED_REPOSITORIES } from "@/services/githubIssues";
import { extractRequirementsForIssues } from "@/services/requirementExtraction";
import { GitHubApiError } from "@/services/github";
import { evaluateIssuesEligibility } from "@/services/eligibility";
import { recommendIssuesToDeveloper } from "@/services/matching";
import { rankRecommendations } from "@/services/ranking";
import { extractEnvironmentRequirements } from "@/services/environmentRequirements";

async function search(query, profile = null) {
  query = String(query || "").trim().toLowerCase();
  if (query.length < 2) return NextResponse.json({ results: [] });
  try {
    const collected = await collectGitHubIssues({ repos: TRACKED_REPOSITORIES, perPage: 100, maxPages: 2, concurrency: 4 });
    const issues = extractRequirementsForIssues(collected.issues);
    let scoreById = new Map();
    if (profile) {
      const safeProfile = {
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        experienceLevel: ["Beginner", "Intermediate", "Advanced"].includes(profile.experienceLevel) ? profile.experienceLevel : "Unknown",
        selectedDomains: Array.isArray(profile.selectedDomains) ? profile.selectedDomains : [],
      };
      const eligible = evaluateIssuesEligibility(issues, safeProfile);
      const ranked = rankRecommendations(recommendIssuesToDeveloper(eligible, safeProfile));
      scoreById = new Map(ranked.map((issue) => [issue.id, issue.match?.score ?? null]));
    }
    const results = [];
    const repositories = new Map(TRACKED_REPOSITORIES
      .filter((name) => name.toLowerCase().includes(query))
      .map((name) => [name, { type: "repository", id: name, title: name, repoFullName: name, matchScore: null }]));
    for (const issue of issues) {
      const extraction = issue.requirementExtraction;
      const skills = ["programmingLanguages", "frameworks", "databases", "technicalConcepts"].flatMap((key) => extraction?.[key] || []).map((skill) => skill.name);
      const labels = (issue.labels || []).map((label) => label.name);
      const text = [issue.title, issue.body, issue.repoFullName, ...skills, ...labels, ...(issue.repoTopics || [])].join(" ").toLowerCase();
      if (text.includes(query)) results.push({ type: "issue", id: issue.id, title: issue.title, repoFullName: issue.repoFullName, url: issue.url, skills: [...new Set(skills)].slice(0, 6), labels: labels.slice(0, 4), environmentRequirements: extractEnvironmentRequirements(issue), matchScore: scoreById.get(issue.id) ?? null });
      if (issue.repoFullName?.toLowerCase().includes(query) && !repositories.has(issue.repoFullName)) repositories.set(issue.repoFullName, { type: "repository", id: issue.repoFullName, title: issue.repoFullName, repoFullName: issue.repoFullName, matchScore: null });
    }
    return NextResponse.json({ results: [...results, ...repositories.values()].slice(0, 12), partial: collected.errors.length > 0, rateLimitHit: collected.rateLimitHit });
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to search collected GitHub issues." }, { status });
  }
}

export async function GET(request) {
  return search(new URL(request.url).searchParams.get("q"));
}

export async function POST(request) {
  try {
    const body = await request.json();
    return search(body?.q, body?.profile || null);
  } catch {
    return NextResponse.json({ error: "Invalid search request." }, { status: 400 });
  }
}
