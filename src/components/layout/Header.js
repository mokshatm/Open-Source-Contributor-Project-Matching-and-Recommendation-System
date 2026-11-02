"use client";

import React from "react";
import { Search, Sun, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#0c0c0e]/60 backdrop-blur-md px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, issues, or skills..."
            className="w-full bg-white/[0.04] border border-white/[0.07] text-xs text-[#ededef] pl-10 pr-4 py-2 rounded-xl placeholder-[#71717a] focus:outline-none focus:border-white/[0.18] transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-[#8e8e93] hover:text-[#ededef] hover:bg-white/[0.04] transition-colors"
        >
          <Sun className="w-4 h-4" />
        </button>

        <button
          aria-label="Notifications"
          className="p-2 rounded-xl text-[#8e8e93] hover:text-[#ededef] hover:bg-white/[0.04] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea6c33] absolute top-2 right-2 ring-2 ring-[#0c0c0e]" />
        </button>

        <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-xs font-semibold text-[#ededef] ml-1">
          AR
        </div>
      </div>
    </header>
  );
}
