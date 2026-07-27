"use client";

import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  original: string;
  refined: string;
  onAccept: (refined: string) => void;
  onReject: () => void;
}

interface DiffSegment {
  type: "same" | "added" | "removed";
  text: string;
}

function computeDiff(original: string, refined: string): DiffSegment[] {
  const origWords = original.split(/(\s+)/);
  const refWords = refined.split(/(\s+)/);

  const segments: DiffSegment[] = [];

  const origSet = new Set(origWords.filter((w) => w.trim()));
  const refSet = new Set(refWords.filter((w) => w.trim()));

  const removed = origWords.filter((w) => w.trim() && !refSet.has(w));
  const added = refWords.filter((w) => w.trim() && !origSet.has(w));

  if (removed.length === 0 && added.length === 0) {
    return [{ type: "same", text: refined }];
  }

  // Simple diff: show removed from original, then added in refined
  let remainingRemoved = [...removed];
  let remainingAdded = [...added];

  const usedOrig = new Set<string>();
  const usedRef = new Set<string>();

  // Track segments of original text
  for (const word of origWords) {
    if (!word.trim()) {
      segments.push({ type: "same", text: word });
      continue;
    }

    const idx = remainingRemoved.indexOf(word);
    if (idx !== -1) {
      segments.push({ type: "removed", text: word });
      remainingRemoved.splice(idx, 1);
      usedOrig.add(word);
    } else {
      segments.push({ type: "same", text: word });
    }
  }

  // Insert added words at boundaries
  if (remainingAdded.length > 0) {
    const addedText = remainingAdded.join(" ");
    // Find a good insertion point (after first sentence or paragraph break)
    let inserted = false;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].text.includes(".") || segments[i].text.includes("\n")) {
        segments.splice(i + 1, 0, { type: "added", text: " " + addedText + " " });
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      segments.push({ type: "added", text: " " + addedText });
    }
  }

  return segments;
}

export function DiffViewer({ original, refined, onAccept, onReject }: DiffViewerProps) {
  const segments = computeDiff(original, refined);

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-600">Proposed Changes</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            <X size={12} />
            Reject
          </button>
          <button
            onClick={() => onAccept(refined)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-md hover:from-violet-700 hover:to-indigo-700 transition-all"
          >
            <Check size={12} />
            Accept
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Original
          </div>
          <div className="p-3 bg-red-50 rounded-md text-sm text-slate-700 leading-relaxed border border-red-100">
            {original}
          </div>
        </div>

        {/* Arrow */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Refined
          </div>
          <div className="p-3 bg-emerald-50 rounded-md text-sm text-slate-700 leading-relaxed border border-emerald-100">
            {refined}
          </div>
        </div>
      </div>

      {/* Inline diff view */}
      <div className="px-4 pb-4">
        <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
          <ArrowRight size={12} />
          Inline Changes
        </div>
        <div className="p-3 bg-slate-50 rounded-md text-sm leading-relaxed font-mono">
          {segments.map((seg, i) => (
            <span
              key={i}
              className={cn(
                seg.type === "added" && "bg-emerald-100 text-emerald-800 px-0.5 rounded",
                seg.type === "removed" && "bg-red-100 text-red-800 line-through px-0.5 rounded",
                seg.type === "same" && "text-slate-600"
              )}
            >
              {seg.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
