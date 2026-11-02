import React from "react";

export default function Card({
  children,
  className = "",
  hover = false,
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      className={`glass-card rounded-xl p-5 ${
        hover ? "hover:border-white/[0.12] cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
