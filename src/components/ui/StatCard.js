import React from "react";

export default function StatCard({
  title,
  value,
  description,
  annotation,
  className = ""
}) {
  return (
    <div className={`glass-card p-4 rounded-xl ${className}`}>
      <span className="text-xs text-[#a1a1aa] font-medium block">
        {title}
      </span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[#ededef] tracking-tight">
          {value}
        </span>
        {annotation && (
          <span className="text-xs text-[#71717a] font-mono">
            {annotation}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-[#71717a] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
