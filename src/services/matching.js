
export const MATCH_SCORE_MAXIMA = Object.freeze({ skillCompatibility: 50, experienceSuitability: 30, freshness: 20 });
const GOOD_FIRST_ISSUE_BONUS = 5;
const RELATED_SKILL_CREDIT = 0.5;
const FRESHNESS_DECAY_DAYS = 365;
const REQUIREMENT_CATEGORY_MULTIPLIERS = Object.freeze({
  programmingLanguages: 1,
  frameworks: 1,
  databases: 0.75,
  technicalConcepts: 0.5,
});
const GENERIC_CONCEPT_MULTIPLIERS = Object.freeze({
  testing: 0.2,
  documentation: 0.2,
  docker: 0.35,
  containers: 0.35,
  "devops and deployment": 0.35,
});

const SKILL_ALIASES = Object.freeze({
  js: "javascript", ts: "typescript", golang: "go", "node.js": "nodejs",
  "vue.js": "vue", "next.js": "nextjs", postgres: "postgresql", cpp: "c++",
});

const RELATED_SKILLS = Object.freeze({
  javascript: ["typescript", "nodejs", "react", "vue", "express", "nextjs"],
  typescript: ["javascript", "react", "nodejs", "nextjs"],
  python: ["django", "flask", "fastapi", "pytorch", "tensorflow"],
  java: ["spring boot", "kotlin"],
  go: ["docker", "kubernetes", "networking"],
  rust: ["c++", "systems programming", "concurrency"],
  react: ["javascript", "typescript", "frontend ui"],
  vue: ["javascript", "typescript", "frontend ui"],
  nextjs: ["react", "javascript", "typescript"],
  django: ["python", "postgresql", "rest apis"],
  fastapi: ["python", "rest apis", "backend services"],
  flask: ["python", "rest apis", "backend services"],
  "spring boot": ["java", "kotlin", "rest apis"],
  postgresql: ["sql", "database", "mysql"],
  mysql: ["sql", "database", "postgresql"],
  mongodb: ["database", "redis"],
  docker: ["containers", "devops and deployment", "kubernetes"],
  kubernetes: ["docker", "containers", "devops and deployment"],
  "rest apis": ["backend services", "http", "graphql"],
  graphql: ["rest apis", "backend services"],
  "machine learning": ["pytorch", "tensorflow", "python"],
  testing: ["pytest", "jest", "unit testing"],
});

const DOMAIN_INTERESTS = Object.freeze({
  "Web Frameworks & APIs": ["Frontend", "Backend", "Full-stack"],
  "Developer Tooling": ["DevOps", "Documentation"],
  "Distributed Systems": ["Networking", "Backend"],
  "Database Internals": ["Databases"],
  "Machine Learning & NLP": ["Machine learning"],
  "Cloud & DevOps": ["DevOps"],
  "Security & Cryptography": ["Security"],
  "Frontend & UI Engineering": ["Frontend"],
});

const LEVELS = Object.freeze({ Beginner: 1, Intermediate: 2, Advanced: 3 });
const normalize = (value) => {
  const key = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return SKILL_ALIASES[key] || key;
};
const lists = (value) => Array.isArray(value) ? value : [];
const categories = ["programmingLanguages", "frameworks", "databases", "technicalConcepts"];

function difficultyFromLabels(labels = []) {
  const text = lists(labels).map((label) => typeof label === "string" ? label : label?.name || "").join(" ").toLowerCase();
  if (/good[\s_-]+first[\s_-]+issue|beginner|first[- ]timers? only|easy|starter|newcomer/.test(text)) return "Beginner";
  if (/intermediate|medium|moderate/.test(text)) return "Intermediate";
  if (/advanced|hard|complex|expert|senior/.test(text)) return "Advanced";
  return "Unknown";
}

function profileSkillEvidence(profile = {}) {
  const skills = [
    ...lists(profile.detectedLanguages),
    ...lists(profile.detectedTopics),
    ...lists(profile.skills),
  ];
  const evidence = new Map();
  for (const skill of skills) {
    const name = typeof skill === "string" ? skill : skill?.name;
    if (typeof name !== "string" || !name.trim()) continue;
    const key = normalize(name);
    const repoCount = Number(skill?.repoCount);
    // Preserve raw frequency so dominant repository languages have structural weight.
    const hasRepositoryEvidence = Number.isFinite(repoCount) && repoCount > 0
      && (skill?.source === "repository" || skill?.sampleRepos);
    const weight = hasRepositoryEvidence
      ? repoCount
      : 1;
    evidence.set(key, Math.max(evidence.get(key) || 0, weight));
  }
  return evidence;
}

function profileEvidenceDenominator(profile, skillWeights) {
  const analyzedRepos = Number(profile.analyzedReposCount ?? profile.gitHubData?.analyzedReposCount);
  return Number.isFinite(analyzedRepos) && analyzedRepos > 0
    ? analyzedRepos
    : [...skillWeights.values()].reduce((sum, weight) => sum + weight, 0);
}

function requirementMultiplier(requirement) {
  const name = normalize(requirement.name);
  return GENERIC_CONCEPT_MULTIPLIERS[name] ?? REQUIREMENT_CATEGORY_MULTIPLIERS[requirement.category] ?? 1;
}

function issueRequirements(issue) {
  return categories.flatMap((category) => lists(issue?.requirementExtraction?.[category])
    .filter((skill) => skill?.name && skill.classification !== "repository_context")
    .map((skill) => ({ ...skill, category })));
}

function scoreExperience(profileLevel, difficulty, labels = []) {
  const userLevel = LEVELS[profileLevel];
  const issueLevel = LEVELS[difficulty];
  const hasGoodFirstIssueLabel = lists(labels).some(({ name }) => /good[\s_-]+first[\s_-]+issue/i.test(String(name || "")));
  const bonus = hasGoodFirstIssueLabel && (profileLevel === "Beginner" || profileLevel === "Intermediate") ? GOOD_FIRST_ISSUE_BONUS : 0;
  if (userLevel === undefined || issueLevel === undefined) return MATCH_SCORE_MAXIMA.experienceSuitability / 2 + bonus;
  const normalizedFit = 1 - Math.abs(userLevel - issueLevel) / (Object.keys(LEVELS).length - 1);
  return Math.round(((MATCH_SCORE_MAXIMA.experienceSuitability - GOOD_FIRST_ISSUE_BONUS) * normalizedFit) + bonus);
}

function scoreFreshness(updatedAt, now = Date.now()) {
  const updated = Date.parse(updatedAt || "");
  if (!Number.isFinite(updated)) return 0;
  const daysSinceUpdate = Math.max(0, (now - updated) / 86_400_000);
  return Math.round(MATCH_SCORE_MAXIMA.freshness * Math.max(0, 1 - daysSinceUpdate / FRESHNESS_DECAY_DAYS));
}

function interestDetails(profile, extraction) {
  const selected = lists(profile?.selectedDomains);
  const issueDomain = extraction?.domain?.primary;
  const mapped = issueDomain && issueDomain !== "Unknown"
    ? selected.filter((interest) => DOMAIN_INTERESTS[interest]?.includes(issueDomain))
    : [];
  if (!selected.length || !issueDomain || issueDomain === "Unknown") {
    return { score: null, details: null };
  }
  return {
    score: mapped.length ? 100 : 0,
    details: { issueDomain, selectedInterests: selected, matchedInterests: mapped },
  };
}

/** Calculate a content-based match for one issue. Ineligible issues receive no score. */
export function matchIssueToDeveloper(issue, profile = {}, options = {}) {
  const eligibility = issue?.eligibility || { eligible: false, exclusionReasons: ["Eligibility has not been evaluated."] };
  const empty = {
    score: null,
    components: { skillCompatibility: null, interestAlignment: null, experienceSuitability: null, requirementRelevance: null, freshness: null },
    matchedSkills: [], relatedSkills: [], missingSkills: [], unfamiliarSkills: [],
    interestAlignment: eligibility.interestAlignment || null,
    experienceSuitability: eligibility.experienceSuitability || null,
    explanation: eligibility.eligible ? "Insufficient information to calculate a compatibility score." : "Excluded because the issue fails eligibility requirements.",
  };
  if (!eligibility.eligible) return { ...empty, eligibility };

  const requirements = issueRequirements(issue);
  const skillWeights = profileSkillEvidence(profile);
  const known = new Set(skillWeights.keys());
  const matchedSkills = [];
  const relatedSkills = [];
  const missingSkills = [];
  for (const requirement of requirements) {
    const name = requirement.name;
    const normalized = normalize(name);
    if (known.has(normalized)) matchedSkills.push(name);
    else if ([...known].some((skill) => (RELATED_SKILLS[skill] || []).map(normalize).includes(normalized))) relatedSkills.push(name);
    else missingSkills.push(name);
  }
  const requirementsBySkill = new Map();
  for (const requirement of requirements) {
    const key = normalize(requirement.name);
    const existing = requirementsBySkill.get(key);
    if (!existing || requirementMultiplier(requirement) > requirementMultiplier(existing)) {
      requirementsBySkill.set(key, requirement);
    }
  }
  const uniqueRequirements = [...requirementsBySkill.keys()];
  const matched = new Set(matchedSkills.map(normalize));
  const related = new Set(relatedSkills.map(normalize));
  const totalProfileEvidence = profileEvidenceDenominator(profile, skillWeights);
  const matchedEvidenceBySkill = new Map(uniqueRequirements.map((skill) => {
    const relatedWeight = related.has(skill)
      ? Math.max(0, ...[...known].filter((knownSkill) => (RELATED_SKILLS[knownSkill] || []).map(normalize).includes(skill)).map((knownSkill) => skillWeights.get(knownSkill) || 0)) * RELATED_SKILL_CREDIT
      : 0;
    return [skill, Math.max(matched.has(skill) ? skillWeights.get(skill) || 0 : 0, relatedWeight) * requirementMultiplier(requirementsBySkill.get(skill))];
  }));
  const matchedEvidence = [...matchedEvidenceBySkill.values()].reduce((sum, weight) => sum + weight, 0);
  const skillEvidenceCapacity = totalProfileEvidence * uniqueRequirements.length;
  const skillOverlap = skillEvidenceCapacity > 0
    ? Math.round(MATCH_SCORE_MAXIMA.skillCompatibility * Math.min(1, matchedEvidence / skillEvidenceCapacity))
    : 0;

  const byEvidence = (left, right) => (matchedEvidenceBySkill.get(normalize(right)) || 0) - (matchedEvidenceBySkill.get(normalize(left)) || 0)
    || normalize(left).localeCompare(normalize(right));
  matchedSkills.sort(byEvidence);
  relatedSkills.sort(byEvidence);

  const interest = interestDetails(profile, issue?.requirementExtraction);
  const experienceSuitability = {
    developerLevel: profile?.experienceLevel || "Unknown",
    issueDifficulty: issue?.requirementExtraction?.estimatedDifficulty?.value || "Unknown",
  };
  const inferredDifficulty = experienceSuitability.issueDifficulty === "Unknown"
    ? difficultyFromLabels(issue?.labels || [])
    : experienceSuitability.issueDifficulty;
  experienceSuitability.issueDifficulty = inferredDifficulty;
  const experience = scoreExperience(experienceSuitability.developerLevel, inferredDifficulty, issue?.labels);
  const freshness = scoreFreshness(issue?.updatedAt, options.now);
  const extraction = issue?.requirementExtraction;
  const explicitRequirements = requirements.filter((requirement) => requirement.classification === "explicit").length;
  const requirementRelevance = extraction?.status === "complete" && requirements.length > 0
    ? 60 + (explicitRequirements / requirements.length) * 40
    : extraction?.status === "complete" ? 60
      : extraction && extraction.status !== "unavailable" ? 40 : null;

  const components = {
    skillCompatibility: skillOverlap,
    interestAlignment: interest.score,
    experienceSuitability: experience,
    requirementRelevance,
    freshness,
  };
  const score = skillOverlap + experience + freshness;
  const scoreBreakdown = [
    ["skillCompatibility", skillOverlap],
    ["experienceSuitability", experience],
    ["freshness", freshness],
  ].map(([component, value]) => ({
    component,
    score: value,
    maxScore: MATCH_SCORE_MAXIMA[component],
    weight: MATCH_SCORE_MAXIMA[component] / 100,
    contribution: value,
  }));

  const matchedUnique = [...new Set(matchedSkills)];
  const relatedUnique = [...new Set(relatedSkills)];
  const missingUnique = [...new Set(missingSkills)];
  const explanations = [];
  if (matchedUnique.length) explanations.push(`matches ${matchedUnique.join(", ")}`);
  if (relatedUnique.length) explanations.push(`has related experience for ${relatedUnique.join(", ")}`);
  if (requirements.length && !matchedUnique.length && !relatedUnique.length) explanations.push("has no exact or related profile skill matches");
  if (interest.details?.matchedInterests.length) explanations.push(`aligns with ${interest.details.issueDomain} interests`);
  if (experienceSuitability.developerLevel !== "Unknown" && inferredDifficulty !== "Unknown") explanations.push(`scores ${experience}/30 for ${experienceSuitability.developerLevel} experience against ${inferredDifficulty} complexity`);
  const explanation = explanations.length
    ? `This issue ${explanations.join(" and ")}${missingUnique.length ? `; unfamiliar requirements include ${missingUnique.join(", ")}` : ""}.`
    : "This eligible issue has limited profile alignment; review its extracted requirements before choosing it.";

  return {
    score,
    components,
    freshnessScore: freshness,
    scoreBreakdown,
    matchedSkills: matchedUnique,
    relatedSkills: relatedUnique,
    missingSkills: missingUnique,
    unfamiliarSkills: missingUnique,
    interestAlignment: interest.details || eligibility.interestAlignment || null,
    experienceSuitability: { ...experienceSuitability, score: experience },
    explanation,
    eligibility,
  };
}

export function matchIssuesToDeveloper(issues = [], profile = {}, options = {}) {
  return lists(issues).map((issue) => ({ ...issue, match: matchIssueToDeveloper(issue, profile, options) }));
}

/** Return only Stage 4 eligible candidates, preserving the collector's order for Stage 6. */
export function recommendIssuesToDeveloper(issues = [], profile = {}, options = {}) {
  return matchIssuesToDeveloper(issues, profile, options).filter((issue) => issue.eligibility?.eligible === true);
}
