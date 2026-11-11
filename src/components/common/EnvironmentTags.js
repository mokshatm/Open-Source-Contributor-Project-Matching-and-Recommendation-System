export default function EnvironmentTags({ requirements = [] }) {
  if (!requirements.length) return null;
  return <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Detected local environment requirements">
    {requirements.map((requirement) => <span key={requirement} className="rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-amber-300">{requirement}</span>)}
  </div>;
}
