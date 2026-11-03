import { evaluateFixedDataset } from "@/services/evaluation";

function formatMetric(value) {
  return value === null ? "Not available" : `${(value * 100).toFixed(1)}%`;
}

function relevanceLabel(label) {
  if (label === "Partially relevant") return "Partial";
  return label || "Unjudged";
}

export default function EvaluationPage() {
  const evaluation = evaluateFixedDataset();
  const metrics = [
    ["Precision@5", evaluation.overall.precisionAt5],
    ["Recall@5", evaluation.overall.recallAt5],
    ["NDCG@5", evaluation.overall.ndcgAt5],
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="pb-5 border-b border-[#202024]">
        <h1 className="text-xl font-bold tracking-tight text-[#ededef]">Prototype Evaluation</h1>
        <p className="text-xs text-[#8e8e93] mt-1">A reproducible, fixed-snapshot evaluation of the existing ranked recommendations.</p>
      </header>

      <section className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[#ededef]">Evaluation dataset</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          {evaluation.candidateCount} actual issues selected from {evaluation.sourceStats.collectedIssueCount} issues collected across {evaluation.sourceStats.trackedRepositoryCount} tracked repositories on {evaluation.snapshotDate}. They are evaluated for {evaluation.profileCount} labelled evaluation profiles with {evaluation.judgmentCount} manually assigned profile–issue relevance judgments ({Math.round(evaluation.judgmentCoverage * 100)}% profile/candidate coverage).
        </p>
        <p className="text-[11px] text-[#71717a] leading-relaxed">The fixed snapshot uses the issue identifiers, titles, update times, and extracted requirements used by matching. Issue links point to the original GitHub records; full issue bodies are not copied into the evaluation fixture.</p>
        <p className="text-[11px] text-[#71717a] leading-relaxed">The 11-issue pool is a small coverage sample spanning frontend, Go networking, Python testing, documentation, and database work, including negative examples for each profile.</p>
        <p className="text-[11px] text-[#71717a] leading-relaxed">
          Relevance labels are independent of recommendation scores. Relevant and Partially relevant count as positive for Precision@5 and Recall@5; NDCG uses graded labels 2, 1, and 0, with gain 2^label − 1 and logarithmic rank discount. Precision@5 divides by five even if fewer than five recommendations are returned. Overall metrics are macro averages across the three profiles.
        </p>
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          This is an initial prototype evaluation, not scientific validation. The pool is small and hand-labelled; judgments are subjective and have no independent second annotator.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {metrics.map(([name, value]) => (
          <div key={name} className="glass-card rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Macro {name}</p>
            <p className="text-2xl font-bold text-[#ededef] mt-1">{formatMetric(value)}</p>
          </div>
        ))}
      </section>

      <div className="space-y-4">
        {evaluation.profiles.map((result) => (
          <section key={result.profile.id} className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#ededef]">{result.profile.name}</h2>
                <p className="text-[11px] text-[#71717a] mt-1">{result.profile.experienceLevel} · {result.profile.skills.join(", ")} · interests: {result.profile.selectedDomains.join(", ")}</p>
                <p className="text-[10px] text-[#52525b] mt-1">{result.candidateCount} candidates · {result.judgmentCount} judgments</p>
              </div>
              <div className="flex gap-3 text-[11px] text-[#a1a1aa]">
                <span>P@5 <strong className="text-[#ededef]">{formatMetric(result.metrics.precisionAt5)}</strong></span>
                <span>R@5 <strong className="text-[#ededef]">{formatMetric(result.metrics.recallAt5)}</strong></span>
                <span>NDCG@5 <strong className="text-[#ededef]">{formatMetric(result.metrics.ndcgAt5)}</strong></span>
              </div>
            </div>

            <ol className="divide-y divide-white/[0.06]">
              {result.topFive.map((issue) => (
                <li key={issue.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#71717a]">Rank #{issue.rankingPosition} · {issue.repoFullName} · #{issue.number}</p>
                    <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ededef] hover:text-[#ea6c33] leading-relaxed">{issue.title}</a>
                    <p className="text-[10px] text-[#71717a] mt-0.5">{issue.match.score === null ? "Unknown score" : `${issue.match.score}/100`} · {issue.match.explanation}</p>
                    {issue.judgment?.rationale && <p className="text-[10px] text-[#52525b] mt-0.5">Judgment rationale: {issue.judgment.rationale}</p>}
                  </div>
                  <span className={`shrink-0 text-[10px] px-2 py-1 rounded-lg ${issue.judgment?.label === "Relevant" ? "bg-emerald-950/60 text-emerald-300" : issue.judgment?.label === "Partially relevant" ? "bg-amber-950/60 text-amber-200" : "bg-[#1c1c20] text-[#8e8e93]"}`}>
                    {relevanceLabel(issue.judgment?.label)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="glass-panel rounded-2xl p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[#ededef]">Judgment criteria</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">Labels were assigned from explicit issue-level extracted requirements, the synthetic profile’s declared skills and selected interests, and stated experience. Repository language and topics were not treated as mandatory requirements. “Relevant” means at least two exact requirement matches, or one exact match plus an aligned issue domain. “Partially relevant” means an exact or related skill overlap, or an aligned domain/task, with meaningful gaps, but below the Relevant threshold. “Not relevant” means neither requirement overlap nor aligned domain/task; experience suitability alone does not establish relevance. Judgments were made without consulting match scores or ranked positions.</p>
      </section>
    </div>
  );
}
