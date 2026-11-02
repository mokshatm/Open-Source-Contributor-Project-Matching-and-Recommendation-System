import React from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, ExternalLink, Star } from "lucide-react";
import { mockRecommendedIssues } from "@/data/mockData";

export default function RecommendationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Recommended Issues"
        description="Stage 4: Candidate issues ranked by skill compatibility, interest alignment, experience fit, difficulty calibration, and repo activity."
        badgeText="Stage 4 • Sample Data"
      />

      {/* Filter Row */}
      <div className="flex items-center gap-2 text-xs border-b border-[#202024] pb-4">
        <span className="text-[#71717a] pr-2">Filter:</span>
        <button className="px-3 py-1.5 rounded-xl bg-[#ea6c33] text-white font-bold cursor-pointer transition-colors">
          All Issues ({mockRecommendedIssues.length})
        </button>
        <button className="px-3 py-1.5 rounded-xl bg-[#1c1c20] text-[#8e8e93] hover:bg-[#242428] hover:text-[#ededef] font-bold cursor-pointer transition-colors">
          Python (2)
        </button>
        <button className="px-3 py-1.5 rounded-xl bg-[#1c1c20] text-[#8e8e93] hover:bg-[#242428] hover:text-[#ededef] font-bold cursor-pointer transition-colors">
          JavaScript (1)
        </button>
      </div>

      {/* Ranked Issues List */}
      <div className="space-y-4">
        {mockRecommendedIssues.map((issue) => (
          <div
            key={issue.id}
            className="glass-card p-5 rounded-xl hover:border-white/[0.12] transition-colors space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                {/* Meta details */}
                <div className="flex items-center gap-2 text-xs text-[#71717a] flex-wrap">
                  <span className="font-mono text-[#a1a1aa] font-medium">
                    {issue.repository}
                  </span>
                  <span>#{issue.issue_number}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#d9733c]" />
                    <span>{issue.repository_stars.toLocaleString()}</span>
                  </span>
                  <span>•</span>
                  <span>{issue.language}</span>
                  <span>•</span>
                  <span>{issue.difficulty}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Eligible</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-[#ededef]">
                  {issue.title}
                </h3>

                {/* Extracted NLP requirements */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-[#71717a]">Extracted Requirements:</span>
                  {issue.nlp_extracted_requirements.primary_technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1c1c20] text-[#a1a1aa] border border-[#27272a]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Score & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                <div className="sm:text-right">
                  <span className="text-2xl font-semibold text-[#d9733c] font-mono">
                    {issue.matching_scores.overall_rank_score}%
                  </span>
                  <span className="block text-[10px] text-[#71717a] font-mono">
                    Rank Score
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/explanation">
                    <Button variant="secondary" size="sm">
                      Explain Match
                    </Button>
                  </Link>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="sm">
                      <ExternalLink className="w-3 h-3" />
                      <span>GitHub</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Transparent Multi-Criteria Breakdown */}
            <div className="pt-3 border-t border-[#1c1c20] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[#101012] border border-[#1e1e22]">
                <span className="text-[#71717a] block text-[10px] font-mono">Skill Match</span>
                <span className="text-[#ededef] font-medium mt-0.5 block">{issue.matching_scores.skill_compatibility}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#101012] border border-[#1e1e22]">
                <span className="text-[#71717a] block text-[10px] font-mono">Interest Align</span>
                <span className="text-[#ededef] font-medium mt-0.5 block">{issue.matching_scores.interest_alignment}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#101012] border border-[#1e1e22]">
                <span className="text-[#71717a] block text-[10px] font-mono">Semantic Fit</span>
                <span className="text-[#ededef] font-medium mt-0.5 block">{issue.matching_scores.semantic_similarity}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#101012] border border-[#1e1e22]">
                <span className="text-[#71717a] block text-[10px] font-mono">Repo Activity</span>
                <span className="text-[#ededef] font-medium mt-0.5 block">{issue.matching_scores.repository_activity}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
