const LEVELS = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const FACTOR_LABELS = {
  skillCompatibility: "Skill overlap",
  experienceSuitability: "Experience fit",
  freshness: "Freshness",
};
const ENTRY_LABEL_PATTERN = /good[\s_-]+first[\s_-]+issue|first[- ]timers?[- ]only|help[\s_-]+wanted|beginner|newcomer|documentation/i;
const ALIASES = { js: "javascript", ts: "typescript", "node.js": "nodejs", "next.js": "nextjs", "vue.js": "vuejs", golang: "go", cpp: "c++" };

function normalizeName(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[normalized] || normalized;
}

function profileSkills(profile = {}) {
  const declaredSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const repositoryEvidence = profile.isDemoPersona ? [] : [
    ...(profile.gitHubData?.detectedLanguages || []),
    ...(profile.gitHubData?.detectedTopics || []),
  ];
  const items = [
    ...declaredSkills,
    ...repositoryEvidence,
  ];
  return [...new Set(items.map((item) => typeof item === "string" ? item : item?.name).filter(Boolean))];
}

function scoreText(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function experienceText(experience) {
  const level = experience?.developerLevel;
  const difficulty = experience?.issueDifficulty;
  if (!LEVELS.hasOwnProperty(level) || !LEVELS.hasOwnProperty(difficulty)) {
    if (level && level !== "Unknown") return `Your profile level is ${level}; this issue has no difficulty estimate.`;
    return "No profile level or issue difficulty estimate is available for comparison.";
  }
  const fits = LEVELS[difficulty] <= LEVELS[level];
  return `Profile level: ${level}. Estimated issue difficulty: ${difficulty}. ${fits ? "Within your current level." : "Above your current level."}`;
}

function updatedOn(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function Section({ title, children }) {
  return <section className="border-t border-white/[0.07] pt-3 first:border-0 first:pt-0">
    <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#8e8e93]">{title}</h4>
    {children}
  </section>;
}

export default function IssueMatchFacts({ issue, profile }) {
  const eligibility = issue.eligibility || {};
  const match = issue.match || {};
  const extraction = issue.requirementExtraction || {};
  const repositoryContext = extraction.repositoryContext || {};
  const profileSkillSet = new Set(profileSkills(profile).map(normalizeName));
  const matchedSkills = [...new Set(match.matchedSkills || eligibility.matchedRequiredSkills || [])];
  const relatedSkills = [...new Set(match.relatedSkills || [])];
  const repoFacts = [repositoryContext.programmingLanguage?.name, ...(repositoryContext.topics || []).map((topic) => topic.name)].filter(Boolean);
  const repoSkillMatches = [...new Set(repoFacts.filter((name) => profileSkillSet.has(normalizeName(name)) && !matchedSkills.some((skill) => normalizeName(skill) === normalizeName(name))))];
  const labels = (issue.labels || []).map((label) => label.name).filter(Boolean);
  const goodFirstIssue = labels.some((name) => /good[\s_-]+first[\s_-]+issue/i.test(name));
  const entryLabels = labels.filter((name) => ENTRY_LABEL_PATTERN.test(name) && !/good[\s_-]+first[\s_-]+issue/i.test(name));
  const interestMatches = match.interestAlignment?.matchedInterests || eligibility.interestAlignment?.matchedInterests || [];
  const summaryFacts = [];
  if (matchedSkills.length) summaryFacts.push(`${matchedSkills.length} direct issue-skill ${matchedSkills.length === 1 ? "match" : "matches"}`);
  if (relatedSkills.length) summaryFacts.push(`${relatedSkills.length} related issue ${relatedSkills.length === 1 ? "skill" : "skills"}`);
  if (interestMatches.length) summaryFacts.push(`alignment with selected interest${interestMatches.length === 1 ? "" : "s"} ${interestMatches.join(", ")}`);
  const summary = summaryFacts.length
    ? `Recommendation evidence: ${summaryFacts.join("; ")}.`
    : "The issue passed eligibility checks, but no direct skill or selected-interest overlap was measured.";
  const comments = Number.isFinite(issue.commentsCount) ? issue.commentsCount : null;
  const updated = updatedOn(issue.updatedAt);
  const score = Number.isFinite(match.score) ? match.score : null;
  const factors = (match.scoreBreakdown || []).filter((factor) => Number.isFinite(factor.score) && Number.isFinite(factor.weight) && Number.isFinite(factor.contribution));

  return <div className="space-y-3 rounded-xl border border-white/[0.07] bg-black/10 p-4">
    <Section title="Tech stack alignment">
      <div className="space-y-1.5 text-sm leading-relaxed text-[#c4c4ca]">
        {matchedSkills.length > 0 && <p><strong className="font-semibold text-[#ededef]">Direct profile matches:</strong> {matchedSkills.join(", ")}</p>}
        {relatedSkills.length > 0 && <p><strong className="font-semibold text-[#ededef]">Related issue skills:</strong> {relatedSkills.join(", ")}</p>}
        {repoSkillMatches.length > 0 && <p><strong className="font-semibold text-[#ededef]">Profile skills in repository context:</strong> {repoSkillMatches.join(", ")}</p>}
        {!matchedSkills.length && !relatedSkills.length && !repoSkillMatches.length && <p>No direct or related overlap was found in extracted requirements or repository metadata.</p>}
      </div>
    </Section>

    <Section title="Experience suitability">
      <p className="text-sm leading-relaxed text-[#c4c4ca]">{experienceText(match.experienceSuitability || eligibility.experienceSuitability)}</p>
    </Section>

    <Section title="Why this issue matches">
      <p className="text-sm leading-relaxed text-[#c4c4ca]">{summary}</p>
    </Section>

    <Section title="Issue complexity & activity">
      <div className="flex flex-wrap gap-2 text-xs text-[#c4c4ca]">
        <span className={`rounded-lg border px-2.5 py-1 ${goodFirstIssue ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200" : "border-white/[0.08] bg-white/[0.03] text-[#a1a1aa]"}`}>
          {goodFirstIssue ? "Has good first issue label" : "No good first issue label"}
        </span>
        {entryLabels.map((label) => <span key={label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">{label}</span>)}
        {comments !== null && <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">{comments} {comments === 1 ? "comment" : "comments"}</span>}
        {updated && <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">Updated {updated}</span>}
        {extraction.estimatedDifficulty?.value && <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">Estimated {extraction.estimatedDifficulty.value}</span>}
      </div>
    </Section>

    <Section title="How the match score is composed">
      {score === null ? <p className="text-sm text-[#a1a1aa]">No score was calculated because the available profile data provided no personal scoring signal.</p> : factors.length > 0 ? (
        <>
        <ul className="space-y-1.5 text-sm text-[#c4c4ca]">
          {factors.map((factor) => <li key={factor.component} className="flex flex-wrap justify-between gap-x-4">
            <span>{FACTOR_LABELS[factor.component] || factor.component}: {scoreText(factor.score)}/{factor.maxScore} points</span>
            <span className="text-[#a1a1aa]">+{scoreText(factor.contribution)} points</span>
          </li>)}
        </ul>
        {factors.length > 0 && <p className="mt-2 text-xs text-[#8e8e93]">The score is the sum of skill overlap, experience fit, and freshness. Selected interests break ties.</p>}
        </>
      ) : <p className="text-sm text-[#a1a1aa]">The matcher returned a score without component details.</p>}
    </Section>
  </div>;
}
