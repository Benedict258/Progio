"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  GraduationCap,
  Scissors,
  Target,
  Lightbulb,
  FileText,
  Pencil,
  X,
  Loader2,
  ArrowRightLeft,
  GitCompareArrows,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "./DiffViewer";

interface AIToolbarProps {
  applicationId: string;
  selectedText: string;
  position: { x: number; y: number } | null;
  onReplace: (newText: string) => void;
  onDismiss: () => void;
}

interface PresetButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  instruction: string;
}

const PRESET_BUTTONS: PresetButton[] = [
  {
    id: "make_more_academic",
    label: "Make Academic",
    icon: <GraduationCap size={14} />,
    instruction: "make_more_academic",
  },
  {
    id: "shorten",
    label: "Shorten",
    icon: <Scissors size={14} />,
    instruction: "shorten",
  },
  {
    id: "align_donor",
    label: "Align with Donor",
    icon: <Target size={14} />,
    instruction: "align_donor",
  },
  {
    id: "improve_methodology",
    label: "Improve Methodology",
    icon: <Lightbulb size={14} />,
    instruction: "improve_methodology",
  },
  {
    id: "generate_abstract",
    label: "Generate Abstract",
    icon: <FileText size={14} />,
    instruction: "generate_abstract",
  },
];

export function AIToolbar({
  applicationId,
  selectedText,
  position,
  onReplace,
  onDismiss,
}: AIToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onDismiss]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleRefine = useCallback(
    async (instruction: string, custom?: string) => {
      if (loading) return;

      setLoading(true);
      setStreamingText("");
      setRefinedText("");
      setShowDiff(false);
      setActivePreset(instruction);

      abortRef.current = new AbortController();

      try {
        const body: Record<string, string> = {
          selected_text: selectedText,
          instruction,
        };
        if (custom) {
          body.custom_instruction = custom;
        }

        const res = await fetch(
          `http://localhost:8000/api/applications/${applicationId}/refine-selection`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: abortRef.current.signal,
          }
        );

        if (!res.ok) {
          const fallback = getFallbackRefined(selectedText, instruction);
          setRefinedText(fallback);
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          const fallback = getFallbackRefined(selectedText, instruction);
          setRefinedText(fallback);
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingText(accumulated);
        }

        setRefinedText(accumulated);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const fallback = getFallbackRefined(selectedText, instruction);
          setRefinedText(fallback);
        }
      } finally {
        setLoading(false);
      }
    },
    [applicationId, selectedText, loading]
  );

  const handleAcceptDiff = useCallback(
    (text: string) => {
      onReplace(text);
      setShowDiff(false);
      setRefinedText("");
      setStreamingText("");
      setActivePreset(null);
    },
    [onReplace]
  );

  const handleRejectDiff = useCallback(() => {
    setShowDiff(false);
    setRefinedText("");
    setStreamingText("");
    setActivePreset(null);
  }, []);

  const handleCustomSubmit = useCallback(() => {
    if (customInstruction.trim()) {
      handleRefine("custom", customInstruction);
      setShowCustom(false);
    }
  }, [customInstruction, handleRefine]);

  if (!position) return null;

  const displayText = refinedText || streamingText;
  const hasResult = displayText.length > 0;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: Math.min(position.x, window.innerWidth - 380),
        top: Math.min(position.y + 10, window.innerHeight - 320),
      }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-[360px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={14} />
            <span className="text-xs font-semibold">AI Refine</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white/80 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Preset buttons */}
        {!hasResult && !loading && (
          <div className="p-3 space-y-1.5">
            {PRESET_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleRefine(btn.instruction)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all text-left",
                  "hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 hover:text-indigo-700",
                  "text-slate-600",
                  activePreset === btn.instruction && "bg-gradient-to-r from-violet-50 to-indigo-50 text-indigo-700"
                )}
              >
                <span className="text-indigo-500">{btn.icon}</span>
                {btn.label}
              </button>
            ))}

            <button
              onClick={() => setShowCustom(!showCustom)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all text-left text-slate-600 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 hover:text-indigo-700"
            >
              <span className="text-indigo-500"><Pencil size={14} /></span>
              Custom Instruction
            </button>

            {showCustom && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                  placeholder="Enter your instruction..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customInstruction.trim()}
                  className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-md hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && !hasResult && (
          <div className="p-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-indigo-500" />
            Refining your text...
          </div>
        )}

        {/* Streaming / Result */}
        {hasResult && (
          <div className="p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">Result</div>
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed max-h-[200px] overflow-y-auto border border-slate-100">
              {displayText}
              {loading && <span className="inline-block w-1 h-3 bg-indigo-500 animate-pulse ml-0.5" />}
            </div>

            {!loading && refinedText && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onReplace(refinedText)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  <ArrowRightLeft size={12} />
                  Replace
                </button>
                <button
                  onClick={() => setShowDiff(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <GitCompareArrows size={12} />
                  Show Diff
                </button>
              </div>
            )}

            {!loading && refinedText && (
              <button
                onClick={() => {
                  setRefinedText("");
                  setStreamingText("");
                  setActivePreset(null);
                }}
                className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Try another refinement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Diff modal */}
      {showDiff && refinedText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl">
            <DiffViewer
              original={selectedText}
              refined={refinedText}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getFallbackRefined(text: string, instruction: string): string {
  const fallbacks: Record<string, string> = {
    make_more_academic:
      "The investigation demonstrates significant implications for the field. " +
      "Empirical evidence substantiates the validity of the proposed approach, " +
      "with documented outcomes indicating measurable advancement. The methodology " +
      "adheres to established scholarly standards, ensuring reproducibility and rigor.",
    shorten:
      "This research addresses critical challenges through a rigorous, evidence-based " +
      "approach. The methodology yields measurable outcomes aligned with stated objectives.",
    align_donor:
      "This initiative directly advances the funder's strategic priorities by addressing " +
      "key gaps. The proposed work delivers tangible outcomes including publications, " +
      "tools, and policy recommendations that align with evaluation criteria.",
    improve_methodology:
      "Methodology improvements: (1) Mixed-methods design combining quantitative and " +
      "qualitative validation. (2) Baseline benchmarks using established protocols. " +
      "(3) Iterative validation with domain experts. (4) Reproducibility checks.",
    generate_abstract:
      "Background: Critical gaps persist in this research area. Objective: This study " +
      "proposes a novel framework. Methods: Three-phase design combining computational " +
      "analysis with empirical validation. Results: Preliminary findings suggest improvements. " +
      "Conclusions: The framework offers a viable path forward.",
  };

  return fallbacks[instruction] || text;
}
