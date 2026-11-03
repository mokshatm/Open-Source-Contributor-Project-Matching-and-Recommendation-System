import Link from "next/link";
import { ArrowRight, Compass, UserRound, GitBranch } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="pb-6 border-b border-[#202024]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ea6c33]">CONTRIBUTOR WORKSPACE</span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ededef] mt-1">Find an issue worth contributing to.</h1>
        <p className="text-sm text-[#8e8e93] mt-2">Connect your GitHub profile, then explore real issues with transparent skill and experience context.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/profile" className="glass-card rounded-2xl p-5 space-y-3 hover:border-white/[0.13] transition-colors">
          <UserRound className="w-5 h-5 text-[#ea6c33]" />
          <h2 className="text-sm font-semibold text-[#ededef]">Developer profile</h2>
          <p className="text-xs text-[#8e8e93] leading-relaxed">Connect your real GitHub profile, review observed language evidence, add skills, and choose interests and experience level.</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea6c33]">Review profile <ArrowRight className="w-3.5 h-3.5" /></span>
        </Link>
        <Link href="/explore" className="glass-card rounded-2xl p-5 space-y-3 hover:border-white/[0.13] transition-colors">
          <Compass className="w-5 h-5 text-[#ea6c33]" />
          <h2 className="text-sm font-semibold text-[#ededef]">Explore open issues</h2>
          <p className="text-xs text-[#8e8e93] leading-relaxed">Search and filter real GitHub issues. Review issue requirements, eligibility, interest alignment, experience fit, and evidence.</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea6c33]">Explore issues <ArrowRight className="w-3.5 h-3.5" /></span>
        </Link>
      </div>

      <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
        <GitBranch className="w-4 h-4 text-[#71717a] shrink-0 mt-0.5" />
        <p className="text-xs text-[#8e8e93] leading-relaxed">Issues are collected, checked for eligibility, matched to your profile, and ranked by compatibility in Explore Issues.</p>
      </div>
    </div>
  );
}
