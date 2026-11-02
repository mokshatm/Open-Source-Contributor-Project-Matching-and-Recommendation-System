import React from "react";
import Badge from "../ui/Badge";

export default function PageHeader({
  title,
  description,
  badgeText,
  children
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#202024] gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-[#ededef]">
            {title}
          </h1>
          {badgeText && (
            <Badge variant="stone">
              {badgeText}
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-[#a1a1aa] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}
