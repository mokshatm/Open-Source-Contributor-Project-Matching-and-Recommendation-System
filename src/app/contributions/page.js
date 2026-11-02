import React from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { GitPullRequest, GitMerge, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";

export default function ContributionsPage() {
  const contributionsList = [
    {
      id: "pr_1",
      repo: "fastapi-users/core",
      pr_number: 312,
      title: "Add async retry handlers for PostgreSQL pool reconnects",
      status: "Merged",
      impact: "+3.2% Python Proficiency",
      date: "3 days ago",
    },
    {
      id: "pr_2",
      repo: "tiangolo/sqlmodel",
      pr_number: 145,
      title: "Fix typing validation on relationship lazy-loading",
      status: "Merged",
      impact: "+2.5% SQLAlchemy Proficiency",
      date: "1 week ago",
    },
    {
      id: "pr_3",
      repo: "fastapi-contrib/async-pg-pool",
      pr_number: 482,
      title: "Implement connection pooling retry logic with exponential backoff",
      status: "In Progress",
      impact: "Pending Review",
      date: "Started yesterday",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Contributions"
        description="Completed pull requests automatically reinforce your extracted developer profile and recalibrate subsequent recommendation scoring."
        badgeText="Feedback Loop • Sample Data"
      >
        <Button variant="secondary" size="md">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Pull Requests</span>
        </Button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-[#71717a] font-medium block">Merged Pull Requests</span>
          <span className="text-2xl font-semibold text-[#ededef] mt-1 block">34</span>
          <span className="text-[11px] text-[#71717a] mt-1 block">Verified on GitHub</span>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-[#71717a] font-medium block">Active In Progress</span>
          <span className="text-2xl font-semibold text-[#ededef] mt-1 block">2</span>
          <span className="text-[11px] text-[#71717a] mt-1 block">1 recommended issue</span>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-[#71717a] font-medium block">Profile Feedback Loop</span>
          <span className="text-2xl font-semibold text-emerald-400 mt-1 block">Active</span>
          <span className="text-[11px] text-[#71717a] mt-1 block">Continuous skill calibration</span>
        </div>
      </div>

      {/* Contributions List */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]">
          <h3 className="text-xs font-medium text-[#ededef]">
            Tracked Pull Requests & Profile Calibration
          </h3>
          <span className="text-xs font-mono text-[#71717a]">
            {contributionsList.length} items
          </span>
        </div>

        <div className="space-y-3">
          {contributionsList.map((pr) => (
            <div
              key={pr.id}
              className="p-3.5 rounded-lg bg-[#111113] border border-[#202024] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2d2d33] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#71717a]">
                  <span className="font-mono text-[#a1a1aa] font-medium">{pr.repo}</span>
                  <span>#{pr.pr_number}</span>
                  <span>•</span>
                  <span
                    className={`font-mono text-[11px] ${
                      pr.status === "Merged" ? "text-emerald-400" : "text-[#d9733c]"
                    }`}
                  >
                    {pr.status}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-[#ededef]">
                  {pr.title}
                </h4>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                <div className="sm:text-right">
                  <span className="text-[11px] font-mono text-[#d9733c] block">
                    {pr.impact}
                  </span>
                  <span className="text-[10px] text-[#71717a]">{pr.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
