import { NextResponse } from "next/server";
import { collectGitHubIssues, collectOrganizationGitHubIssues, TRACKED_REPOSITORIES } from "@/services/githubIssues";
import { fetchGitHubProfile, GitHubApiError } from "@/services/github";
import { extractRequirementsForIssues } from "@/services/requirementExtraction";
import { evaluateIssuesEligibility } from "@/services/eligibility";
import { matchIssuesToDeveloper, recommendIssuesToDeveloper } from "@/services/matching";
import { rankRecommendations } from "@/services/ranking";
import { getDeveloperPersona } from "@/services/developerPersonas";
import { addEnvironmentRequirements } from "@/services/environmentRequirements";

const QUICK_FILTERS = [
  "Good First Issue",
  "Help Wanted",
  "Beginner Friendly",
  "Documentation & i18n",
  "Frontend / UI",
  "Backend / API",
  "Web & Developer Tools",
];

function matchesQuickFilter(labelName, filter) {
  const normalized = String(labelName || "").toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  switch (filter) {
    case "Good First Issue": return /\bgood\s+first\s+issue\b|\bfirst[- ]timers?[- ]only\b/.test(normalized);
    case "Help Wanted": return /\bhelp\s+wanted\b|\bcontributions?\s+welcome\b/.test(normalized);
    case "Beginner Friendly": return /\bbeginner\b|\bnewcomer\b|\bstarter\b|\beasy\b|\bgood\s+first\s+issue\b|\bfirst[- ]timers?[- ]only\b/.test(normalized);
    case "Documentation & i18n": return /\bdocs?\b|\bdocumentation\b|\bi18n\b|\bl10n\b|\btranslation\b|\blocali[sz]ation\b/.test(normalized);
    case "Frontend / UI": return /\bfront\s*end\b|\bfrontend\b|\bui\b|\buser\s+interface\b|\bdesign\b|\bcss\b|\baccessibility\b/.test(normalized);
    case "Backend / API": return /\bback\s*end\b|\bbackend\b|\bapi\b|\bserver\b|\bdatabase\b|\bservice\b/.test(normalized);
    case "Web & Developer Tools": return /\bweb\b|\bdeveloper\s+tools?\b|\bdevtools?\b|\btooling\b|\bcli\b|\bbuild\s+tools?\b/.test(normalized);
    default: return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.username) return NextResponse.json({ error: "Connect a GitHub profile on the Profile page to evaluate eligibility." }, { status: 400 });
    const targeted = body.mode === "targeted";
    const persona = getDeveloperPersona(body.personaId);
    const targetOrganizations = Array.isArray(body.targetOrganizations) ? body.targetOrganizations : [];
    const quickFilters = Array.isArray(body.quickFilters) ? body.quickFilters.filter((filter) => QUICK_FILTERS.includes(filter) || filter === "documentation") : [];
    const collectionOptions = { perPage: 100, maxPages: 2, concurrency: 4, forceRefresh: body.refresh === true };
    const [githubProfile, collected] = await Promise.all([
      fetchGitHubProfile(String(body.username)),
      targeted
        ? collectOrganizationGitHubIssues(targetOrganizations, collectionOptions)
        : collectGitHubIssues({ ...collectionOptions, repos: TRACKED_REPOSITORIES }),
    ]);
    const profile = {
      ...githubProfile,
      ...(persona.demo ? { detectedLanguages: [], detectedTopics: [] } : {}),
      skills: persona.demo ? persona.skills : Array.isArray(body.skills) ? body.skills : [],
      experienceLevel: persona.demo ? persona.experienceLevel : ["Beginner", "Intermediate", "Advanced"].includes(body.experienceLevel) ? body.experienceLevel : "Unknown",
      selectedDomains: persona.demo ? persona.selectedDomains : Array.isArray(body.selectedDomains) ? body.selectedDomains : [],
    };
    const filteredIssues = quickFilters.length
      ? collected.issues.filter((issue) => issue.labels?.some((label) => quickFilters.some((filter) => matchesQuickFilter(label.name, filter === "documentation" ? "Documentation & i18n" : filter))))
      : collected.issues;
    const issues = extractRequirementsForIssues(filteredIssues);
    const eligibleIssues = evaluateIssuesEligibility(issues, profile);
    const matchedIssues = matchIssuesToDeveloper(eligibleIssues, profile);
    const rankedRecommendations = rankRecommendations(recommendIssuesToDeveloper(eligibleIssues, profile));
    return NextResponse.json({
      ...collected,
      issues: matchedIssues.map(addEnvironmentRequirements),
      recommendations: rankedRecommendations.map(addEnvironmentRequirements),
      profile: { username: githubProfile.profile.username, experienceLevel: profile.experienceLevel, personaId: persona.id, personaLabel: persona.label, isDemoPersona: persona.demo },
      trackedRepositories: collected.trackedRepositories ?? TRACKED_REPOSITORIES.length,
      recommendationMode: targeted ? "targeted" : "general",
      targetOrganizations: targeted ? targetOrganizations : [],
      quickFilters,
    });
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Unable to evaluate GitHub issue eligibility." }, { status });
  }
}
