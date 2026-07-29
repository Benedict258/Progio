"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Lightbulb,
  FileText,
  Sparkles,
  Loader2,
  Search,
  ArrowRight,
  Save,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  AICoach,
  getStoredCoachProfile,
} from "@/components/AICoach";

interface Concept {
  title: string;
  problem_statement: string;
  methodology: string;
  expected_impact: string;
  fit_score: number;
}

interface Opportunity {
  id: string;
  title: string;
  provider: string;
  type: string;
  deadline: string;
  award_range: string;
  field_tags: string[];
}

type Mode = "select" | "grant" | "freeform";

export default function GrantsBrainstormPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamingConceptIdx, setStreamingConceptIdx] = useState(-1);
  const [freeformIdea, setFreeformIdea] = useState("");
  const [blueprint, setBlueprint] = useState<Record<string, string>>({});
  const [streamingField, setStreamingField] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantName, setGrantName] = useState("");
  const [parsedOpp, setParsedOpp] = useState<Record<string, unknown> | null>(null);
  const [coachProfile, setCoachProfile] = useState<ReturnType<typeof getStoredCoachProfile>>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [coachContext, setCoachContext] = useState<string>("");

  useEffect(() => {
    const stored = getStoredCoachProfile();
    if (stored) {
      setCoachProfile(stored);
    } else {
      setShowCoach(true);
    }
  }, []);

  const handleCoachComplete = (summary: string, profile: { field: string; focus: string; challenges: string; impact: string }) => {
    setCoachProfile(profile);
    setCoachContext(summary);
    setShowCoach(false);
  };

  const handleCoachSkip = () => {
    setShowCoach(false);
  };

  const fetchOpportunities = useCallback(async () => {
    setLoadingOpps(true);
    try {
      const data = await apiFetch<{ matches?: Array<Record<string, unknown>> }>(
        "/api/opportunities/matches",
        { params: { user_id: "user-001", type: "grant" } }
      );
      if (data?.matches) {
        setOpportunities(
          data.matches.map((m) => ({
            id: m.opportunity_id as string,
            title: m.title as string,
            provider: m.provider as string,
            type: "grant",
            deadline: (m.deadline as string) || "TBD",
            award_range: (m.award_range as string) || "",
            field_tags: [],
          }))
        );
      }
    } catch {
      setOpportunities([]);
    } finally {
      setLoadingOpps(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "grant") fetchOpportunities();
  }, [mode, fetchOpportunities]);

  const handleGenerateFromGrant = async () => {
    if (!selectedOpp) return;
    setGenerating(true);
    setConcepts([]);
    setStreamingConceptIdx(-1);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: selectedOpp.id,
          user_id: "user-001",
          coach_context: coachContext || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Generation failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      const newConcepts: Concept[] = [];
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
            if (data.event === "concept_start") {
              while (newConcepts.length <= data.index) {
                newConcepts.push({
                  title: "",
                  problem_statement: "",
                  methodology: "",
                  expected_impact: "",
                  fit_score: 0,
                });
              }
              setStreamingConceptIdx(data.index);
              setConcepts([...newConcepts]);
            } else if (data.event === "concept_chunk") {
              if (newConcepts[data.index]) {
                const field = data.field as keyof Concept;
                const current = newConcepts[data.index];
                const updated = { ...current, [field]: ((current[field] as string) || "") + data.content };
                newConcepts[data.index] = updated;
                setConcepts([...newConcepts]);
              }
            } else if (data.event === "done") {
              setStreamingConceptIdx(-1);
            }
          } catch {
            // skip unparseable
          }
        }
      }

      setConcepts([...newConcepts]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleParseName = async () => {
    if (!grantName.trim()) return;
    setGenerating(true);
    setError(null);
    setParsedOpp(null);

    try {
      const res = await fetch("http://localhost:8000/api/opportunities/parse-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: grantName, type: "grant" }),
      });
      if (!res.ok) throw new Error("Failed to find opportunity");
      const data = await res.json();
      setParsedOpp(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromIdea = async () => {
    if (!freeformIdea.trim()) return;
    setGenerating(true);
    setBlueprint({});
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_text: freeformIdea,
          user_id: "user-001",
          coach_context: coachContext || undefined,
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

  const handleUseConcept = async (concept: Concept) => {
    setSaving(true);
    try {
      const sections = {
        technical_approach: `${concept.problem_statement}\n\n${concept.methodology}`,
        impact_sdg: concept.expected_impact,
        essay_writing: `${concept.title}\n\n${concept.problem_statement}`,
      };
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          opportunity_id: selectedOpp?.id || null,
          type: "grant",
          sections,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/grants/applications/${data.id}`);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlueprint = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          type: "grant",
          sections: blueprint,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/grants/applications/${data.id}`);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const filteredOpps = searchQuery
    ? opportunities.filter(
        (o) =>
          o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : opportunities;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/grants/all"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Grants
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb size={20} className="text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Nye&apos;s Idea Studio — Brainstorm to Blueprint</h1>
        </div>
        <div className="flex items-center gap-4 ml-13">
          <p className="text-slate-600">
            Let Nye help you turn ideas into structured funding proposals.
          </p>
          {coachProfile && !showCoach && (
            <button
              onClick={() => setShowCoach(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors"
            >
              <MessageCircle size={12} />
              Chat with Nye
            </button>
          )}
        </div>
      </div>

      {/* AI Coach */}
      {showCoach && (
        <AICoach onComplete={handleCoachComplete} onSkip={handleCoachSkip} />
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setMode("grant")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "grant"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText size={16} />
          From a Grant
        </button>
        <button
          onClick={() => setMode("freeform")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "freeform"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={16} />
          From an Idea
        </button>
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

      {/* GRANT MODE */}
      {mode === "grant" && (
        <div className="space-y-6">
          {/* Grant Name Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Search by Grant Name
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter a grant or scholarship name to get structured information and suggestions.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={grantName}
                onChange={(e) => setGrantName(e.target.value)}
                placeholder="e.g., NSF CAREER Award, Fulbright Scholarship..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleParseName()}
              />
              <button
                onClick={handleParseName}
                disabled={generating || !grantName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
            </div>

            {/* Parsed Result */}
            {parsedOpp && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="font-medium text-slate-900">{String(parsedOpp.title || "")}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {parsedOpp.provider ? `${parsedOpp.provider} · ` : ""}
                  {parsedOpp.award_range ? `${parsedOpp.award_range} · ` : ""}
                  {parsedOpp.deadline ? `Due ${parsedOpp.deadline}` : ""}
                </div>
                {parsedOpp.description ? (
                  <p className="text-sm text-slate-600 mt-2">{String(parsedOpp.description)}</p>
                ) : null}
                {parsedOpp.field_tags ? (
                  <div className="flex gap-2 mt-2">
                    {(parsedOpp.field_tags as string[]).map((tag: string) => (
                      <span key={tag} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {!selectedOpp ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Select a Grant Opportunity
              </h2>
              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grants..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {loadingOpps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {filteredOpps.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="font-medium text-slate-900">{opp.title}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {opp.provider}
                        {opp.award_range && ` · ${opp.award_range}`}
                        {opp.deadline && ` · Due ${opp.deadline}`}
                      </div>
                    </button>
                  ))}
                  {filteredOpps.length === 0 && (
                    <p className="text-center text-slate-400 py-4">
                      Start by selecting a grant or describing your idea. Nye will generate tailored proposal concepts.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected opportunity */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedOpp.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedOpp.provider}
                      {selectedOpp.award_range && ` · ${selectedOpp.award_range}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOpp(null);
                      setConcepts([]);
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Change
                  </button>
                </div>
                <button
                  onClick={handleGenerateFromGrant}
                  disabled={generating}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {generating ? "Nye is generating concepts..." : "Generate Concepts"}
                </button>
              </div>

              {/* Concepts */}
              {concepts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Proposal Concepts
                  </h3>
                  {concepts.map((concept, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 p-6 relative"
                    >
                      {streamingConceptIdx === idx && (
                        <div className="absolute top-4 right-4">
                          <Loader2
                            size={16}
                            className="animate-spin text-indigo-600"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-base font-semibold text-slate-900 pr-8">
                          {concept.title}
                        </h4>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          <BarChart3 size={12} />
                          {concept.fit_score}% fit
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">
                            Problem Statement
                          </span>
                          <p className="text-slate-600 mt-1">
                            {concept.problem_statement}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">
                            Methodology
                          </span>
                          <p className="text-slate-600 mt-1">{concept.methodology}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">
                            Expected Impact
                          </span>
                          <p className="text-slate-600 mt-1">
                            {concept.expected_impact}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUseConcept(concept)}
                        disabled={saving}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <ArrowRight size={14} />
                        Use This Idea
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FREEFORM MODE */}
      {mode === "freeform" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Describe Your Idea
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Paste or write your raw research idea, project concept, or proposal
              direction. The AI will structure it into a proposal blueprint.
            </p>
            <textarea
              value={freeformIdea}
              onChange={(e) => setFreeformIdea(e.target.value)}
              placeholder="e.g., I want to build a machine learning system that helps farmers in East Africa detect crop diseases early using smartphone photos. The system should work offline and support local languages..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGenerateFromIdea}
                disabled={generating || !freeformIdea.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {generating ? "Structuring..." : "Structure My Idea"}
              </button>
              {Object.keys(blueprint).length > 0 && (
                <button
                  onClick={handleSaveBlueprint}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save as Draft
                </button>
              )}
            </div>
          </div>

          {/* Blueprint Output */}
          {Object.keys(blueprint).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Structured Proposal Blueprint
              </h3>
              <div className="space-y-5">
                {(["objectives", "significance", "methodology", "expected_impact"] as const).map(
                  (field) => (
                    <div key={field}>
                      <h4 className="text-sm font-semibold text-slate-700 capitalize mb-1">
                        {field.replace("_", " ")}
                      </h4>
                      <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {blueprint[field] || (streamingField === field ? "" : "")}
                        {streamingField === field && (
                          <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
