"use client";

import { cn } from "@/lib/utils";
import { Check, FileText } from "lucide-react";

export interface Section {
  key: string;
  label: string;
}

interface SectionSidebarProps {
  sections: Section[];
  activeSection: string;
  completedSections: Set<string>;
  onSelect: (key: string) => void;
}

export function SectionSidebar({
  sections,
  activeSection,
  completedSections,
  onSelect,
}: SectionSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Sections
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section) => {
          const isActive = activeSection === section.key;
          const isComplete = completedSections.has(section.key);
          return (
            <button
              key={section.key}
              onClick={() => onSelect(section.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {isComplete ? (
                <Check size={16} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
              )}
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
