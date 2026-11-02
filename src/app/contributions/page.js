import Link from "next/link";
import { ArrowRight, GitPullRequest } from "lucide-react";

export default function ContributionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="pb-5 border-b border-[#202024]">
        <h1 className="text-xl font-bold tracking-tight text-[#ededef]">My Contributions</h1>
        <p className="text-xs text-[#8e8e93] mt-1">Contribution history and profile calibration are not connected yet.</p>
      </header>
      <div className="glass-panel rounded-2xl p-6 space-y-3">
        <GitPullRequest className="w-5 h-5 text-[#ea6c33]" />
        <h2 className="text-sm font-semibold text-[#ededef]">No contribution records available</h2>
        <p className="text-xs text-[#8e8e93] leading-relaxed">This page will show verified pull requests when contribution tracking is implemented. Your current GitHub profile and skill evidence remain available on the profile page.</p>
        <Link href="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea6c33]">Open profile <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
    </div>
  );
}
