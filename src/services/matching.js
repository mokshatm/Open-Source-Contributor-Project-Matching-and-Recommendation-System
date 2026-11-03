
export const MATCHING_WEIGHTS = Object.freeze({
  skillCompatibility: 0.4,
  interestAlignment: 0.25,
  experienceSuitability: 0.2,
  requirementRelevance: 0.15,
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

const LEVELS = Object.freeze({ Beginner: 0, Intermediate: 1, Advanced: 2 });
const normalize = (value) => {
  const key = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return SKILL_ALIASES[key] || key;
};
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const lists = (value) => Array.isArray(value) ? value : [];
const categories = ["programmingLanguages", "frameworks", "databases", "technicalConcepts"];

function profileSkillNames(profile = {}) {
  return [
    ...lists(profile.detectedLanguages).map((skill) => skill?.name),
    ...lists(profile.detectedTopics).map((skill) => typeof skill === "string" ? skill : skill?.name),
    ...lists(profile.skills).map((skill) => typeof skill === "string" ? skill : skill?.name),
  ].filter((skill) => typeof skill === "string" && skill.trim());
}

function issueRequirements(issue) {
  return categories.flatMap((category) => lists(issue?.requirementExtraction?.[category])
    .filter((skill) => skill?.name && skill.classification !== "repository_context")
    .map((skill) => ({ ...skill, category })));
}

function scoreExperience(profileLevel, difficulty) {
  if (!LEVELS.hasOwnProperty(profileLevel) || !LEVELS.hasOwnProperty(difficulty)) return null;
  const gap = LEVELS[difficulty] - LEVELS[profileLevel];
  return gap <= 0 ? 100 : gap === 1 ? 55 : 25;
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
    components: { skillCompatibility: null, interestAlignment: null, experienceSuitability: null, requirementRelevance: null },
    matchedSkills: [], relatedSkills: [], missingSkills: [], unfamiliarSkills: [],
    interestAlignment: eligibility.interestAlignment || null,
    experienceSuitability: eligibility.experienceSuitability || null,
    explanation: eligibility.eligible ? "Insufficient information to calculate a compatibility score." : "Excluded because the issue fails eligibility requirements.",
  };
  if (!eligibility.eligible) return { ...empty, eligibility };

  const weights = Object.fromEntries(Object.keys(MATCHING_WEIGHTS).map((key) => [key, options.weights?.[key] ?? MATCHING_WEIGHTS[key]]));
  const weightSum = Object.values(weights).reduce((sum, weight) => sum + (Number.isFinite(weight) && weight > 0 ? weight : 0), 0);
  const safeWeights = weightSum ? Object.fromEntries(Object.entries(weights).map(([key, weight]) => [key, Number.isFinite(weight) && weight > 0 ? weight / weightSum : 0])) : MATCHING_WEIGHTS;
  const requirements = issueRequirements(issue);
  const profileSkills = profileSkillNames(profile);
  const known = new Set(profileSkills.map(normalize));
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
  const matched = new Set(matchedSkills.map(normalize));
  const related = new Set(relatedSkills.map(normalize));
  const uniqueRequirements = [...new Set(requirements.map((item) => normalize(item.name)))];
  const skillCompatibility = uniqueRequirements.length && profileSkills.length
    ? (uniqueRequirements.reduce((score, skill) => score + (matched.has(skill) ? 1 : related.has(skill) ? 0.5 : 0), 0) / uniqueRequirements.length) * 100
    : null;

  const interest = interestDetails(profile, issue?.requirementExtraction);
  const experienceSuitability = {
    developerLevel: profile?.experienceLevel || "Unknown",
    issueDifficulty: issue?.requirementExtraction?.estimatedDifficulty?.value || "Unknown",
  };
  const experience = scoreExperience(experienceSuitability.developerLevel, experienceSuitability.issueDifficulty);
  const extraction = issue?.requirementExtraction;
  const explicitRequirements = requirements.filter((requirement) => requirement.classification === "explicit").length;
  const requirementRelevance = extraction?.status === "complete" && requirements.length > 0
    ? 60 + (explicitRequirements / requirements.length) * 40
    : extraction?.status === "complete" ? 60
      : extraction && extraction.status !== "unavailable" ? 40 : null;

  const components = {
    skillCompatibility,
    interestAlignment: interest.score,
    experienceSuitability: experience,
    requirementRelevance,
  };
  // Renormalize over known components so missing profile fields never become guessed zeroes.
  const scored = Object.entries(components).filter(([key, score]) => score !== null && safeWeights[key] > 0);
  const denominator = scored.reduce((sum, [key]) => sum + safeWeights[key], 0);
  const hasPersonalSignal = components.skillCompatibility !== null || components.interestAlignment !== null || components.experienceSuitability !== null;
  const score = denominator && hasPersonalSignal ? clamp(scored.reduce((sum, [key, value]) => sum + value * safeWeights[key], 0) / denominator) : null;
  const scoreBreakdown = denominator ? scored.map(([key, value]) => ({
    component: key,
    score: value,
    weight: safeWeights[key] / denominator,
    contribution: value * safeWeights[key] / denominator,
  })) : [];

  const matchedUnique = [...new Set(matchedSkills)];
  const relatedUnique = [...new Set(relatedSkills)];
  const missingUnique = [...new Set(missingSkills)];
  const explanations = [];
  if (matchedUnique.length) explanations.push(`matches ${matchedUnique.join(", ")}`);
  if (relatedUnique.length) explanations.push(`has related experience for ${relatedUnique.join(", ")}`);
  if (requirements.length && !matchedUnique.length && !relatedUnique.length) explanations.push("has no exact or related profile skill matches");
  if (interest.details?.matchedInterests.length) explanations.push(`aligns with ${interest.details.issueDomain} interests`);
  if (experience !== null) explanations.push(experience >= 100 ? `fits ${experienceSuitability.developerLevel} experience` : `offers a ${experienceSuitability.issueDifficulty.toLowerCase()} learning opportunity`);
  const explanation = explanations.length
    ? `This issue ${explanations.join(" and ")}${missingUnique.length ? `; unfamiliar requirements include ${missingUnique.join(", ")}` : ""}.`
    : "This eligible issue has limited profile alignment; review its extracted requirements before choosing it.";

  return {
    score,
    components,
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
