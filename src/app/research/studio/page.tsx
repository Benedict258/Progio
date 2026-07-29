"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Sparkles,
  Loader2,
  Save,
  ArrowRight,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function ResearchStudioPage() {
  const router = useRouter();
  const [ideaText, setIdeaText] = useState("");
  const [blueprint, setBlueprint] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [streamingField, setStreamingField] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!ideaText.trim()) return;
    setGenerating(true);
    setBlueprint({});
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_text: ideaText,
          user_id: "user-001",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Generation failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      const bp: Record<string, string> = {};
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.event === "blueprint_chunk") {
              bp[data.field] = (bp[data.field] || "") + data.content;
              setStreamingField(data.field);
              setBlueprint({ ...bp });
            } else if (data.event === "blueprint_field_done") {
              setStreamingField("");
            }
          } catch {
            // skip
          }
        }
      }

      setBlueprint({ ...bp });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsProject = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          type: "research",
          sections: {
            ...blueprint,
            research_idea: ideaText,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/research/proposals/${data.id}`);
      }
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/research"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Research
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FlaskConical size={20} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Research Idea Studio</h1>
        </div>
        <p className="text-slate-600 ml-13">
          Transform a raw research idea into a structured proposal with hypothesis,
          methodology, and expected outcomes.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Your Research Idea
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Describe your research concept, hypothesis, or the problem you want to
          investigate. Be as specific or broad as you like — the AI will structure it
          into a proposal.
        </p>
        <textarea
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="e.g., I want to investigate whether federated learning can improve disease surveillance accuracy in low-resource settings while preserving patient privacy. The hypothesis is that models trained across multiple under-resourced clinics will outperform models trained on a single large dataset..."
          rows={8}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleGenerate}
            disabled={generating || !ideaText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {generating ? "Structuring Research Idea..." : "Structure My Research"}
          </button>
          {Object.keys(blueprint).length > 0 && (
            <button
              onClick={handleSaveAsProject}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save as Research Project
            </button>
          )}
        </div>
      </div>

      {/* Output Blueprint */}
      {Object.keys(blueprint).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Structured Research Proposal
          </h3>
          <div className="space-y-6">
            {(["objectives", "significance", "methodology", "expected_impact"] as const).map(
              (field) => (
                <div key={field}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center text-xs font-bold text-emerald-700">
                      {field === "objectives"
                        ? "O"
                        : field === "significance"
                          ? "S"
                          : field === "methodology"
                            ? "M"
                            : "I"}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 capitalize">
                      {field.replace("_", " ")}
                    </h4>
                  </div>
                  <div className="ml-8 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {blueprint[field] || ""}
                    {streamingField === field && (
                      <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={handleSaveAsProject}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              Save as Research Project
            </button>
            <button
              onClick={() => {
                setBlueprint({});
                setIdeaText("");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!generating && Object.keys(blueprint).length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FlaskConical size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            Your structured research proposal will appear here
          </p>
        </div>
      )}
    </div>
  );
}
