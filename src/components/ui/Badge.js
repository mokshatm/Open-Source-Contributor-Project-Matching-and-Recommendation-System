import React from "react";

export default function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}) {
  const variantStyles = {
    default: "bg-[#18181b] text-[#a1a1aa] border-[#27272a]",
    accent: "bg-[#d9733c]/10 text-[#d9733c] border-[#d9733c]/25",
    coral: "bg-[#d9733c]/10 text-[#d9733c] border-[#d9733c]/25",
    success: "bg-emerald-950/30 text-emerald-400 border-emerald-900/50",
    warning: "bg-amber-950/30 text-amber-400 border-amber-900/50",
    stone: "bg-[#161619] text-[#71717a] border-[#242428]",
    cream: "bg-[#1c1c20] text-[#d4d4d8] border-[#2e2e34]",
    outline: "bg-transparent text-[#a1a1aa] border-[#27272a]",
  };

  const selectedVariant = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${selectedVariant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
