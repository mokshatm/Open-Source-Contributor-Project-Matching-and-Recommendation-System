import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";

export default function RecommendationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="pb-5 border-b border-[#202024]">
        <h1 className="text-xl font-bold tracking-tight text-[#ededef]">Recommendations</h1>
        <p className="text-xs text-[#8e8e93] mt-1">Ranked eligible issues are available in Explore Issues.</p>
      </header>
      <div className="glass-panel rounded-2xl p-6 space-y-3">
        <ListChecks className="w-5 h-5 text-[#ea6c33]" />
        <h2 className="text-sm font-semibold text-[#ededef]">Recommendations are ranked by match</h2>
        <p className="text-xs text-[#8e8e93] leading-relaxed">View eligible open issues ranked by compatibility score, with skill, interest, experience, and supporting evidence details.</p>
        <Link href="/explore" className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea6c33]">View ranked issues <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
    </div>
  );
}
