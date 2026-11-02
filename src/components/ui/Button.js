import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-colors rounded-xl focus:outline-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs gap-2",
    lg: "px-5 py-2.5 text-sm gap-2",
  };

  const variantStyles = {
    // Solid orange — same as the Connect button
    primary:
      "bg-[#ea6c33] hover:bg-[#d45f28] text-white shadow-sm",
    // Solid dark — for secondary actions
    secondary:
      "bg-[#1c1c20] hover:bg-[#242428] text-[#ededef]",
    // Even darker / subtler
    ghost:
      "bg-[#141416] hover:bg-[#1c1c20] text-[#a1a1aa] hover:text-[#ededef]",
    // Danger — solid red
    danger:
      "bg-[#7f1d1d] hover:bg-[#991b1b] text-white",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
