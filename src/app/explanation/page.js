import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";

export default function ExplanationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="pb-5 border-b border-[#202024]">
        <h1 className="text-xl font-bold tracking-tight text-[#ededef]">Match Explanation</h1>
        <p className="text-xs text-[#8e8e93] mt-1">Review the evidence behind each candidate issue.</p>
      </header>
      <div className="glass-panel rounded-2xl p-6 space-y-3">
        <Lightbulb className="w-5 h-5 text-[#ea6c33]" />
        <p className="text-xs text-[#8e8e93] leading-relaxed">Each evaluated issue includes eligibility status, skill compatibility, interest alignment, issue requirements, experience suitability, and concise supporting evidence.</p>
        <Link href="/explore" className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea6c33]">Open Explore Issues <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
    </div>
  );
}
