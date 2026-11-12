const LEVELS = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const SCORE_FACTORS = {
  skillCompatibility: "Skill overlap",
  experienceSuitability: "Experience fit",
  freshness: "Freshness",
};
const ENTRY_LABEL_PATTERN = /good first issue|beginner|newcomer|starter|help wanted|documentation|first[- ]timers?[- ]only/i;

function Section({ title, children }) {
  return (
    <section className="py-3 first:pt-0 border-t first:border-t-0 border-white/[0.06]">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717a] mb-2">{title}</h4>
      {children}
    </section>
  );
}

function updatedAgo(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "updated today";
  if (days === 1) return "updated 1 day ago";
  if (days < 30) return `updated ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `updated ${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `updated ${years} ${years === 1 ? "year" : "years"} ago`;
}

function experienceText(experience) {
  const level = experience?.developerLevel;
  const difficulty = experience?.issueDifficulty;
  if (LEVELS[level] === undefined || LEVELS[difficulty] === undefined) {
    return "No experience-level estimate is available.";
  }
  if (LEVELS[difficulty] <= LEVELS[level]) {
    return `Estimated ${difficulty.toLowerCase()} scope is at or below your ${level.toLowerCase()} experience level.`;
  }
  return `Estimated ${difficulty.toLowerCase()} scope is above your ${level.toLowerCase()} experience level.`;
}

function formatFactorScore(score) {
  return Number.isInteger(score) ? score : Number(score.toFixed(1));
}

export default function EligibilityExplanation({ issue }) {
  const eligibility = issue.eligibility || {};
  const match = issue.match || {};
  const extraction = issue.requirementExtraction || {};
  const context = extraction.repositoryContext || {};
  const matchedSkills = [...new Set(match.matchedSkills || eligibility.matchedRequiredSkills || [])];
  const relatedSkills = [...new Set(match.relatedSkills || [])];
  const repoContext = [context.programmingLanguage?.name, ...(context.topics || []).map((topic) => topic.name)].filter(Boolean);
  const entryLabels = (issue.labels || []).map((label) => label.name).filter((name) => ENTRY_LABEL_PATTERN.test(name));
  const activity = [
    Number.isFinite(issue.commentsCount) ? `${issue.commentsCount} ${issue.commentsCount === 1 ? "comment" : "comments"}` : null,
    updatedAgo(issue.updatedAt),
  ].filter(Boolean);
  const scoreFactors = (match.scoreBreakdown || []).filter(({ score, weight }) => Number.isFinite(score) && Number.isFinite(weight));
  const exclusionReason = eligibility.exclusionReasons?.find(Boolean);
  const score = match.score;
  const scoreIsKnown = Number.isFinite(score);
  const interestMatches = match.interestAlignment?.matchedInterests || eligibility.interestAlignment?.matchedInterests || [];
  const facts = [];

  if (matchedSkills.length) facts.push(`Your profile matches ${matchedSkills.slice(0, 5).join(", ")} in the issue requirements.`);
  else facts.push("No exact match was found between your profile skills and the extracted issue requirements.");
  if (relatedSkills.length) facts.push(`Related skills: ${relatedSkills.slice(0, 4).join(", ")}.`);
  if (interestMatches.length) facts.push(`Your selected interests include ${interestMatches.slice(0, 3).join(", ")}.`);
  if (repoContext.length) facts.push(`Repository context: ${[...new Set(repoContext)].slice(0, 6).join(", ")}.`);

  return (
    <div className="divide-y divide-white/[0.06]">
      <Section title="Eligibility">
        <p className={`text-sm font-semibold ${eligibility.eligible ? "text-emerald-200" : "text-rose-200"}`}>
          {eligibility.eligible ? "Eligible for recommendation" : "Not eligible"}
          {!eligibility.eligible && exclusionReason && <span className="ml-1 font-normal text-[#a1a1aa]">· {exclusionReason}</span>}
        </p>
      </Section>

      <Section title="Tech Stack Alignment">
        <ul className="space-y-1.5 text-sm leading-relaxed text-[#c4c4ca]">
          {facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
      </Section>

      <Section title="Experience Fit">
        <p className="text-sm text-[#ededef]">{experienceText(match.experienceSuitability || eligibility.experienceSuitability)}</p>
      </Section>

      <Section title="Issue Complexity & Activity">
        <ul className="space-y-1.5 text-sm leading-relaxed text-[#c4c4ca]">
          <li>Difficulty estimate: {extraction.estimatedDifficulty?.value || "not available"}.</li>
          {entryLabels.length > 0 && <li>Contributor labels: {entryLabels.join(", ")}.</li>}
          {activity.length > 0 && <li>{activity.join(" · ")}.</li>}
          {!entryLabels.length && <li>No beginner or contributor-help label is attached.</li>}
        </ul>
      </Section>

      {scoreIsKnown && (
        <Section title={`Score Context · ${score}/100`}>
          {scoreFactors.length ? (
            <ul className="space-y-1.5 text-sm text-[#c4c4ca]">
              {scoreFactors.map(({ component, score: factorScore, maxScore }) => (
                <li key={component} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <span>{SCORE_FACTORS[component] || component}</span>
                  <span className="text-[#a1a1aa]">{formatFactorScore(factorScore)}/{maxScore} points</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#a1a1aa]">The recommendation score is available, but its factor details were not returned.</p>
          )}
          <p className="mt-2 text-xs text-[#71717a]">The total is the exact sum of skill overlap, experience fit, and freshness. Selected interests break ties.</p>
        </Section>
      )}
    </div>
  );
}
