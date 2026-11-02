import "server-only";

const LEVELS = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const PROFILE_KEY_ALIASES = { js: "javascript", "node.js": "nodejs", "vue.js": "vue", "next.js": "nextjs", golang: "go", postgres: "postgresql", "c++": "cpp" };
const normalize = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return PROFILE_KEY_ALIASES[key] || key;
};

function profileSkills(profile) {
  return [
    ...(profile?.detectedLanguages || []).map((item) => item.name),
    ...(profile?.detectedTopics || []),
    ...(profile?.skills || []).map((item) => typeof item === "string" ? item : item.name),
  ].filter(Boolean);
}

export function evaluateIssueEligibility(issue, profile = {}) {
  const extraction = issue?.requirementExtraction;
  const reasons = [];
  const evidence = [];
  if (!issue || !Number.isInteger(issue.id) || !issue.title?.trim() || !issue.url) reasons.push("Issue record is missing a usable ID, title, or URL.");
  if (issue?.isPullRequest) reasons.push("Pull requests are not eligible issue candidates.");
  if (String(issue?.state || "").toLowerCase() === "closed") reasons.push("Issue is closed.");

  const groups = ["programmingLanguages", "frameworks", "databases", "technicalConcepts"];
  const required = groups.flatMap((group) => (extraction?.[group] || [])
    .filter((skill) => skill.classification !== "repository_context")
    .map((skill) => ({ ...skill, category: group })));
  const known = new Set(profileSkills(profile).map(normalize));
  const matchedRequiredSkills = required.filter((skill) => known.has(normalize(skill.name))).map((skill) => skill.name);
  const missingSkills = required.filter((skill) => !known.has(normalize(skill.name))).map((skill) => skill.name);
  const learningOpportunities = [...missingSkills];
  for (const skill of required) {
    if (known.has(normalize(skill.name))) evidence.push({ type: "skill match", skill: skill.name, evidence: skill.evidence || [] });
  }
  const gaps = required.filter((skill) => !known.has(normalize(skill.name)));
  for (const skill of gaps) evidence.push({ type: "potential skill gap", skill: skill.name, evidence: skill.evidence || [] });

  const difficulty = extraction?.estimatedDifficulty?.value || "Unknown";
  const selectedInterests = profile.selectedDomains || [];
  const domainInterests = {
    "Web Frameworks & APIs": ["Frontend", "Backend", "Full-stack"],
    "Developer Tooling": ["DevOps", "Documentation"],
    "Distributed Systems": ["Networking", "Backend"],
    "Database Internals": ["Databases"],
    "Machine Learning & NLP": ["Machine learning"],
    "Cloud & DevOps": ["DevOps"],
    "Security & Cryptography": ["Security"],
    "Frontend & UI Engineering": ["Frontend"],
  };
  const issueDomain = extraction?.domain?.primary;
  const matchedInterests = issueDomain && issueDomain !== "Unknown"
    ? selectedInterests.filter((interest) => domainInterests[interest]?.includes(issueDomain))
    : [];
  const level = profile.experienceLevel || "Unknown";
  if (LEVELS[difficulty] !== undefined && LEVELS[level] !== undefined && LEVELS[difficulty] > LEVELS[level]) {
    evidence.push({ type: "experience", text: `${difficulty} estimate is one level above ${level}; retained as a learning opportunity.` });
    learningOpportunities.push(`${difficulty} issue scope`);
  }
  if (difficulty !== "Unknown" && extraction?.estimatedDifficulty?.evidence?.length) evidence.push({ type: "difficulty estimate", evidence: extraction.estimatedDifficulty.evidence });
  if (issue.state) evidence.push({ type: "issue status", text: `GitHub issue state: ${issue.state}` });
  if (issue.repoFullName) evidence.push({ type: "repository", text: issue.repoFullName });

  const eligible = reasons.length === 0;
  const insufficient = !extraction || extraction.status !== "complete" || required.length === 0;
  if (insufficient && eligible) evidence.push({ type: "requirements", text: "No usable extracted requirements; candidate is retained without a skill match decision." });
  return {
    issueId: issue?.id ?? null,
    eligible,
    status: eligible ? (insufficient ? "eligible_insufficient_requirements" : gaps.length ? "eligible_with_skill_gaps" : "eligible_match") : "excluded",
    exclusionReasons: reasons,
    matchedRequiredSkills: [...new Set(matchedRequiredSkills)],
    missingSkills: [...new Set(missingSkills)],
    unfamiliarSkills: [...new Set(missingSkills)],
    learningOpportunities: [...new Set(learningOpportunities)],
    interestAlignment: issueDomain && issueDomain !== "Unknown" && selectedInterests.length
      ? { issueDomain, selectedInterests, matchedInterests }
      : null,
    experienceSuitability: { developerLevel: level, issueDifficulty: difficulty },
    evidence,
  };
}

export function evaluateIssuesEligibility(issues, profile) {
  return issues.map((issue) => ({ ...issue, eligibility: evaluateIssueEligibility(issue, profile) }));
}




