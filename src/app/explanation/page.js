import React from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { mockRecommendedIssues } from "@/data/mockData";

export default function ExplanationPage() {
  const issue = mockRecommendedIssues[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recommendation Explanation"
        description="Stage 5: Explainable AI (XAI) transparently breaking down matched skills, relevant experience evidence, and identified skill gaps."
        badgeText="Stage 5 • XAI"
      >
        <a href={issue.url} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="md">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Issue on GitHub</span>
          </Button>
        </a>
      </PageHeader>

      {/* Main Issue Card */}
      <div className="glass-card p-6 rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#202024]">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs text-[#71717a]">
              <span className="font-mono text-[#a1a1aa]">{issue.repository}</span>
              <span>#{issue.issue_number}</span>
              <span>•</span>
              <span>{issue.language}</span>
              <span>•</span>
              <span>{issue.difficulty}</span>
            </div>
            <h2 className="text-lg font-semibold text-[#ededef]">
              {issue.title}
            </h2>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-3xl font-semibold text-[#d9733c] font-mono">
              {issue.matching_scores.overall_rank_score}%
            </span>
            <span className="block text-[10px] text-[#71717a] font-mono">
              Overall Confidence Fit
            </span>
          </div>
        </div>

        {/* Explainability Breakdown: Matched vs Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Strengths */}
          <div className="p-5 rounded-lg bg-[#111113] border border-[#202024] space-y-3">
            <div className="flex items-center gap-2 text-[#ededef] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Matched Skills & Proficiencies</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {issue.explainability.matched_skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#18181b] text-emerald-400 border border-emerald-900/30"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="pt-2 text-xs text-[#8e8e93] space-y-1">
              <span className="text-[#a1a1aa] font-medium block">Verified Activity Evidence:</span>
              <p className="leading-relaxed bg-[#141416] p-3 rounded border border-[#1e1e22]">
                {issue.explainability.relevant_experience}
              </p>
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="p-5 rounded-lg bg-[#111113] border border-[#202024] space-y-3">
            <div className="flex items-center gap-2 text-[#ededef] text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-[#d9733c]" />
              <span>Identified Skill Gaps / Learning Opportunities</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {issue.explainability.skill_gaps.map((gap) => (
                <span
                  key={gap}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#18181b] text-[#d9733c] border border-[#d9733c]/20"
                >
                  {gap}
                </span>
              ))}
            </div>
            <div className="pt-2 text-xs text-[#8e8e93] space-y-1">
              <span className="text-[#a1a1aa] font-medium block">Domain Alignment Note:</span>
              <p className="leading-relaxed bg-[#141416] p-3 rounded border border-[#1e1e22]">
                {issue.explainability.interest_alignment_notes}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Factor Ranking Weights */}
        <div className="pt-4 border-t border-[#202024] space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717a]">
            Underlying Multi-Factor Ranking Parameters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {Object.entries(issue.matching_scores).map(([metric, val]) => (
              <div key={metric} className="p-3 rounded bg-[#101012] border border-[#1e1e22]">
                <span className="block text-[10px] text-[#71717a] font-mono capitalize">
                  {metric.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold text-[#ededef] mt-1 block font-mono">
                  {val}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
