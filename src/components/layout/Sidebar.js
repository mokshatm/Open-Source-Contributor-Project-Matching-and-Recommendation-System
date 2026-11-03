"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  User,
  Sparkles,
  Compass,
  Layers,
  GitPullRequest,
  Boxes,
  BarChart3
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutGrid,
  },
  {
    name: "Developer Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Recommended Issues",
    href: "/recommendations",
    icon: Sparkles,
  },
  {
    name: "Explore Issues",
    href: "/explore",
    icon: Compass,
  },
  {
    name: "Match Explanation",
    href: "/explanation",
    icon: Layers,
  },
  {
    name: "My Contributions",
    href: "/contributions",
    icon: GitPullRequest,
  },
  {
    name: "Evaluation",
    href: "/evaluation",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#0e0e11]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ea6c33] to-[#c8551f] flex items-center justify-center text-white shadow-md shadow-[#ea6c33]/20">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#ededef] tracking-tight leading-snug">
            OS Matcher
          </h2>
          <p className="text-[11px] text-[#71717a] font-mono leading-tight">
            Research Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
          Menu
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/[0.07] text-[#ededef] border border-white/[0.09] shadow-sm"
                  : "text-[#8e8e93] hover:text-[#ededef] hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#ea6c33]" : "text-[#71717a]"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
