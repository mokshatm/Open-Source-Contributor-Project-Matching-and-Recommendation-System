"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  User,
  Sparkles,
  Compass,
  GitPullRequest,
  Boxes,
  Building2,
  MessageCircle,
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
    name: "Target Organisations",
    href: "/target-organisations",
    icon: Building2,
  },
  {
    name: "Community & Milestones",
    href: "/community-milestones",
    icon: MessageCircle,
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
    name: "My Contributions",
    href: "/contributions",
    icon: GitPullRequest,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 sm:w-60 bg-[#0e0e11]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <Link href="/" aria-label="OS Matcher dashboard" className="p-2 sm:p-6 border-b border-glass flex items-center justify-center sm:justify-start gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ea6c33] to-[#c8551f] flex items-center justify-center text-white shadow-md shadow-[#ea6c33]/20">
          <Boxes className="w-5 h-5" />
        </div>
        <div className="hidden sm:block">
          <h2 className="text-base font-bold text-[#ededef] tracking-tight leading-snug">
            OS Matcher
          </h2>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-1.5 sm:px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="hidden sm:block px-3 pb-2 text-xs font-semibold text-[#71717a] uppercase tracking-wider">
          Menu
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name}
              title={item.name}
              className={`flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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
              <span className="truncate hidden sm:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
