const LEVELS = { Beginner: 0, Intermediate: 1, Advanced: 2 };

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="py-3 first:pt-0 border-t first:border-t-0 border-white/[0.06]">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] mb-1.5">{title}</h4>
      {children}
    </section>
  );
}

function SkillNames({ items }) {
  const names = [...new Set((items || []).map((item) => item.name).filter(Boolean))];
  return names.length ? <p className="text-xs text-[#ededef] leading-relaxed">{names.join(", ")}</p> : null;
}

export default function EligibilityExplanation({ issue }) {
  const extraction = issue.requirementExtraction;
  const eligibility = issue.eligibility;
  const match = issue.match;
  const matched = match?.matchedSkills || eligibility?.matchedRequiredSkills || [];
  const related = match?.relatedSkills || [];
  const unfamiliar = match?.missingSkills || eligibility?.unfamiliarSkills || eligibility?.missingSkills || [];
  const interest = match?.interestAlignment || eligibility?.interestAlignment || { issueDomain: "Unknown", selectedInterests: [], matchedInterests: [] };
  const experience = match?.experienceSuitability || eligibility?.experienceSuitability || { developerLevel: "Unknown", issueDifficulty: "Unknown" };
  const categories = extraction && [
    { label: "Languages", skills: extraction.programmingLanguages },
    { label: "Frameworks and libraries", skills: extraction.frameworks },
    { label: "Technical concepts", skills: [...(extraction.databases || []), ...(extraction.technicalConcepts || [])] },
  ];
  const evidenceMap = new Map();
  for (const skill of (categories || []).flatMap(({ skills }) => skills || [])) {
    for (const item of skill.evidence || []) {
      if (!item.text) continue;
      const key = `${item.source}:${item.text}`;
      const evidenceItem = evidenceMap.get(key) || { ...item, skills: [] };
      if (!evidenceItem.skills.includes(skill.name)) evidenceItem.skills.push(skill.name);
      evidenceMap.set(key, evidenceItem);
    }
  }
  const evidence = [...evidenceMap.values()];
  const excludedReason = eligibility?.exclusionReasons?.filter(Boolean).join(" ");
  const isOpen = String(issue.state || "").toLowerCase() === "open";
  const eligibilityReason = !eligibility?.eligible
    ? excludedReason || "The issue did not pass the available eligibility checks."
    : eligibility?.status === "eligible_insufficient_requirements"
      ? `${isOpen ? "Open issue with a usable record" : "Usable issue record"}; no technical skills could be confirmed from its text.`
      : matched.length && unfamiliar.length
        ? `${isOpen ? "Open issue" : "Usable issue"}: ${matched.length} profile skill${matched.length === 1 ? "" : "s"} match; ${unfamiliar.length} extracted skill${unfamiliar.length === 1 ? " is" : "s are"} unfamiliar and do not block eligibility.`
        : matched.length
          ? `${isOpen ? "Open issue" : "Usable issue"}: ${matched.length} extracted skill${matched.length === 1 ? " matches" : "s match"} your profile.`
          : unfamiliar.length
            ? `${isOpen ? "Open issue" : "Usable issue"}: no profile skills match; unfamiliar extracted skills are not mandatory prerequisites.`
            : "No closed-state, pull-request, or invalid-record exclusion was detected.";
  const interestReason = interest.issueDomain === "Unknown"
    ? "No direct interest match; the issue domain could not be classified. This does not affect eligibility."
    : interest.matchedInterests.length > 0
      ? `Direct match: ${interest.matchedInterests.join(", ")} · issue domain: ${interest.issueDomain}.`
      : `No direct interest match for ${interest.issueDomain}. Interest alignment does not affect eligibility.`;
  const context = extraction?.repositoryContext;
  const contextItems = [context?.programmingLanguage?.name, ...(context?.topics || []).map((topic) => topic.name)].filter(Boolean);
  const requirementNames = [...new Set((categories || []).flatMap(({ skills }) => skills || []).map((skill) => skill.name))];
  const scoreComponentNames = {
    skillCompatibility: "Skills",
    interestAlignment: "Interests",
    experienceSuitability: "Experience",
    requirementRelevance: "Requirement relevance",
  };
  const whyMatches = match?.explanation || (matched.length > 0 && interest.matchedInterests.length > 0
    ? `Your profile matches ${matched.slice(0, 2).join(" and ")}, and the ${interest.issueDomain} issue domain aligns with ${interest.matchedInterests.slice(0, 2).join(" and ")}.`
    : matched.length > 0
      ? `Your profile includes ${matched.slice(0, 3).join(", ")}, which match the issue skills supported by its evidence.`
      : interest.matchedInterests.length > 0
        ? `The ${interest.issueDomain} issue domain aligns with your selected ${interest.matchedInterests.slice(0, 2).join(" and ")} interest${interest.matchedInterests.length === 1 ? "" : "s"}.`
        : unfamiliar.length > 0
          ? `Extracted issue skills ${unfamiliar.slice(0, 3).join(", ")} are not in the available profile; they offer a concrete area to learn without making the issue ineligible.`
          : requirementNames.length === 0
            ? "No issue-level technical skills were extracted, so skill overlap is unknown; eligibility is based on issue availability and usable data."
            : `The extracted skills ${requirementNames.slice(0, 3).join(", ")} are not present in the available profile, but they do not automatically exclude the issue.`);

  return (
    <div className="divide-y divide-white/[0.06]">
      <Section title="Eligibility Status">
        <p className={`text-xs font-semibold ${eligibility?.eligible ? "text-emerald-300" : "text-rose-300"}`}>
          {eligibility?.eligible ? "Eligible" : "Not eligible"}<span className="text-[#a1a1aa] font-normal"> · {eligibilityReason}</span>
        </p>
      </Section>

      {match?.score !== null && match?.score !== undefined && (
        <Section title="Compatibility Score">
          <p className="text-xs text-[#ededef]">{match.score}/100 · {match.explanation}</p>
          {match.scoreBreakdown?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {match.scoreBreakdown.map(({ component, score, weight, contribution }) => (
                <li key={component} className="text-[11px] text-[#a1a1aa]">
                  {scoreComponentNames[component] || component}: {score}/100 × {Math.round(weight * 100)}% = {contribution.toFixed(1)} points
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {(matched.length > 0 || related.length > 0 || unfamiliar.length > 0) && (
        <Section title="Skill Compatibility">
          <div className="space-y-1.5">
            {matched.length > 0 && <p className="text-xs text-[#ededef]"><span className="text-[#71717a]">Matched: </span>{matched.join(", ")}</p>}
            {related.length > 0 && <p className="text-xs text-sky-200"><span className="text-[#71717a]">Related: </span>{related.join(", ")}</p>}
            {unfamiliar.length > 0 && <p className="text-xs text-amber-200"><span className="text-[#71717a]">Unfamiliar (not assumed prerequisites): </span>{unfamiliar.join(", ")}</p>}
            {unfamiliar.length > 0 && <p className="text-[11px] text-[#a1a1aa]">Learning opportunities: explore these skills while contributing; they are not mandatory prerequisites.</p>}
          </div>
        </Section>
      )}

      <Section title="Interest Alignment"><p className="text-xs text-[#a1a1aa]">{interestReason}</p></Section>

      {categories?.some(({ skills }) => skills?.length > 0) && (
        <Section title="Issue Requirements">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
            {categories.map(({ label, skills }) => skills?.length > 0 && (
              <div key={label}><p className="text-[10px] text-[#71717a] mb-0.5">{label}</p><SkillNames items={skills} /></div>
            ))}
          </div>
        </Section>
      )}

      {(experience.developerLevel !== "Unknown" || experience.issueDifficulty !== "Unknown") && (
        <Section title="Experience Suitability">
          <p className="text-xs text-[#ededef]">Developer level: {experience.developerLevel === "Unknown" ? "Unknown" : experience.developerLevel} · Issue difficulty: {experience.issueDifficulty === "Unknown" ? "Unknown; no supported estimate" : `Estimated ${experience.issueDifficulty}`}</p>
          {experience.developerLevel !== "Unknown" && experience.issueDifficulty !== "Unknown" && LEVELS[experience.issueDifficulty] !== undefined && LEVELS[experience.developerLevel] !== undefined && (
            <p className="text-[11px] text-[#a1a1aa] mt-1">{LEVELS[experience.issueDifficulty] <= LEVELS[experience.developerLevel] ? "Within the selected experience level." : "Above the selected level; this is a learning opportunity, not an exclusion."}</p>
          )}
        </Section>
      )}

      <Section title="Why This Issue Matches"><p className="text-xs text-[#a1a1aa] leading-relaxed">{whyMatches}</p></Section>

      {(evidence.length > 0 || contextItems.length > 0) && (
        <details className="py-3">
          <summary className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] cursor-pointer hover:text-[#a1a1aa]">Supporting Evidence</summary>
          {evidence.length > 0 && <ul className="mt-2 space-y-1.5">{evidence.slice(0, 6).map((item, index) => <li key={`${item.source}-${index}`} className="text-[11px] text-[#a1a1aa] leading-relaxed"><span className="text-[#ea6c33]">{item.skills.join(", ")}</span> · issue {item.source.replace("issue ", "")}: “{item.text}”</li>)}</ul>}
          {contextItems.length > 0 && <div className="mt-3 pt-2 border-t border-white/[0.06]"><p className="text-[10px] font-semibold text-[#71717a]">Repository context · not issue requirements</p><p className="text-[11px] text-[#8e8e93] mt-1">{contextItems.join(" · ")}</p></div>}
        </details>
      )}
    </div>
  );
}
