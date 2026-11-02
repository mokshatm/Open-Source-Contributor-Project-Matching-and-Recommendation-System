import React from "react";
import Link from "next/link";
import {
  mockDeveloperProfile,
  mockRecommendedIssues,
  mockDashboardMetrics
} from "@/data/mockData";
import {
  Layers,
  Crosshair,
  BarChart2,
  User,
  Star,
  Info,
  ExternalLink,
  ArrowRight,
  RotateCw
} from "lucide-react";

export default function DashboardPage() {
  const topIssues = mockRecommendedIssues.slice(0, 2);

  return (
    <div className="space-y-8">
      {/* 1. Top Greeting / Workspace Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ea6c33]">
            YOUR WORKSPACE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ededef] mt-0.5">
            Good evening, Alex.
          </h1>
          <p className="text-xs sm:text-sm text-[#71717a] mt-1">
            Find your next meaningful open-source contribution.
          </p>
        </div>

        <button
          type="button"
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-[#ededef] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {/* 2. Statistics Section (Single Horizontal Glass Container with 4 Sections) */}
      <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        {/* Stat 1: Recommended Issues */}
        <div className="flex items-start gap-3.5 px-4 first:pl-0 py-3 sm:py-0">
          <div className="w-8 h-8 rounded-lg bg-[#ea6c33]/15 flex items-center justify-center text-[#ea6c33] shrink-0 mt-0.5">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#ededef] tracking-tight block">
              {mockDashboardMetrics.personalized_recommendations_count}
            </span>
            <span className="text-xs font-medium text-[#ededef] mt-0.5 block">
              Recommended issues
            </span>
            <span className="text-[11px] text-[#71717a] mt-0.5 block">
              Tailored to your verified skills
            </span>
          </div>
        </div>

        {/* Stat 2: Top Match Confidence */}
        <div className="flex items-start gap-3.5 px-4 py-3 sm:py-0">
          <div className="w-8 h-8 rounded-lg bg-[#ea6c33]/15 flex items-center justify-center text-[#ea6c33] shrink-0 mt-0.5">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#ededef] font-mono tracking-tight block">
              93%
            </span>
            <span className="text-xs font-medium text-[#ededef] mt-0.5 block">
              Top match confidence
            </span>
            <span className="text-[11px] text-[#71717a] font-mono mt-0.5 block truncate max-w-[170px]">
              fastapi-contrib/async-pg-pool
            </span>
          </div>
        </div>

        {/* Stat 3: Avg Skill Compatibility */}
        <div className="flex items-start gap-3.5 px-4 py-3 sm:py-0">
          <div className="w-8 h-8 rounded-lg bg-[#ea6c33]/15 flex items-center justify-center text-[#ea6c33] shrink-0 mt-0.5">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#ededef] font-mono tracking-tight block">
              {mockDashboardMetrics.average_skill_match_rate}
            </span>
            <span className="text-xs font-medium text-[#ededef] mt-0.5 block">
              Avg skill compatibility
            </span>
            <span className="text-[11px] text-[#71717a] mt-0.5 block">
              Across candidate pool
            </span>
          </div>
        </div>

        {/* Stat 4: Profile Completeness */}
        <div className="flex items-start gap-3.5 px-4 last:pr-0 py-3 sm:py-0">
          <div className="w-8 h-8 rounded-lg bg-[#ea6c33]/15 flex items-center justify-center text-[#ea6c33] shrink-0 mt-0.5">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#ededef] font-mono tracking-tight block">
              {mockDashboardMetrics.profile_completeness_percent}%
            </span>
            <span className="text-xs font-medium text-[#ededef] mt-0.5 block">
              Profile completeness
            </span>
            <span className="text-[11px] text-[#71717a] mt-0.5 block">
              7 skills verified from GitHub
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout (68% Recommended Issues / 32% Developer Profile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (68% width): Recommended Issues */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-lg font-bold text-[#ededef] tracking-tight">
                Recommended Issues
              </h2>
              <p className="text-xs text-[#71717a] mt-0.5">
                Issues ranked by skill compatibility, domain interest, and experience fit
              </p>
            </div>
            <Link
              href="/recommendations"
              className="text-xs font-medium text-[#ea6c33] hover:text-[#f47b45] flex items-center gap-1 transition-colors"
            >
              <span>View all (12)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {topIssues.map((issue) => (
              <div
                key={issue.id}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                {/* Issue Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#71717a] flex-wrap">
                      <span className="font-mono text-[#a1a1aa] font-medium">
                        {issue.repository}
                      </span>
                      <span className="font-mono">#{issue.issue_number}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#a1a1aa]">
                        <Star className="w-3.5 h-3.5 text-[#ea6c33]" />
                        <span>{issue.repository_stars.toLocaleString()}</span>
                      </span>
                      <span>•</span>
                      <span>{issue.language}</span>
                      <span>•</span>
                      <span className="text-[#a1a1aa]">{issue.difficulty}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-[#ededef] leading-snug">
                      {issue.title}
                    </h3>
                  </div>

                  {/* Match Fit Score */}
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold text-[#ea6c33] font-mono block leading-none">
                      {issue.matching_scores.overall_rank_score}%
                    </span>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-[#71717a] mt-1.5 block">
                      MATCH FIT
                    </span>
                  </div>
                </div>

                {/* NLP Extracted Skills */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-xs text-[#71717a]">NLP Extracted:</span>
                  {issue.nlp_extracted_requirements.primary_technologies.map((tech) => (
                    <span
                      key={tech}
                      className="glass-pill text-xs px-2.5 py-1 rounded-lg font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Inset Match Evidence & Learning Curve Panel */}
                <div className="glass-inset rounded-xl p-4 flex items-start gap-3 text-xs text-[#8e8e93] leading-relaxed">
                  <Info className="w-4 h-4 text-[#71717a] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>
                      <strong className="text-[#ededef] font-medium">Match Evidence: </strong>
                      {issue.explainability.relevant_experience}
                    </p>
                    {issue.explainability.skill_gaps.length > 0 && (
                      <p>
                        <strong className="text-[#ea6c33] font-medium">Learning Curve: </strong>
                        {issue.explainability.skill_gaps.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Scores & Action Button */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-4 text-xs text-[#71717a]">
                    <span>Skill match: <strong className="text-[#ededef] font-mono font-medium">{issue.matching_scores.skill_compatibility}%</strong></span>
                    <span>Interest fit: <strong className="text-[#ededef] font-mono font-medium">{issue.matching_scores.interest_alignment}%</strong></span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link href="/explanation">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-xs font-bold text-[#ededef] transition-colors cursor-pointer"
                      >
                        Explain Match
                      </button>
                    </Link>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-[#71717a] hover:text-[#ededef] hover:bg-white/[0.04] transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (32% width): Developer Profile Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-[#ededef] tracking-tight">
              Developer Profile
            </h2>
            <Link
              href="/profile"
              className="text-xs font-medium text-[#ea6c33] hover:text-[#f47b45] flex items-center gap-1 transition-colors"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-6">
            {/* Subsection 1: Profile Identity */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center font-bold text-sm text-[#ededef] shadow-sm">
                  AR
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#ededef] leading-tight">
                    {mockDeveloperProfile.name}
                  </h3>
                  <p className="text-xs text-[#71717a] font-mono mt-0.5">
                    @{mockDeveloperProfile.github_username}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#8e8e93] leading-relaxed mt-3.5">
                {mockDeveloperProfile.bio}
              </p>
            </div>

            {/* Subsection Divider */}
            <div className="border-t border-white/[0.07]" />

            {/* Subsection 2: Extracted Skills & Compatibility */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#ededef] block">
                Extracted Skills & Compatibility
              </span>

              <div className="space-y-2.5">
                {mockDeveloperProfile.skills.slice(0, 5).map((skill) => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#ededef] font-mono text-[11px]">
                        {skill.name}
                      </span>
                      <span className="text-[#71717a] text-[11px] font-mono">
                        {skill.proficiency}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ea6c33] rounded-full"
                        style={{ width: `${skill.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsection Divider */}
            <div className="border-t border-white/[0.07]" />

            {/* Subsection 3: Domain Interests */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#ededef] block">
                Domain Interests
              </span>

              <div className="flex flex-wrap gap-2">
                {mockDeveloperProfile.interest_domains.slice(0, 3).map((domain) => (
                  <span
                    key={domain}
                    className="glass-pill text-xs px-3 py-1.5 rounded-lg text-[#a1a1aa]"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
