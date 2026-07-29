"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
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
}

type Mode = "select" | "scholarship" | "freeform";

export default function ScholarshipsBrainstormPage() {
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
  const [scholarshipName, setScholarshipName] = useState("");
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
        { params: { user_id: "user-001", type: "scholarship" } }
      );
      if (data?.matches) {
        setOpportunities(
          data.matches.map((m) => ({
            id: m.opportunity_id as string,
            title: m.title as string,
            provider: m.provider as string,
            type: "scholarship",
            deadline: (m.deadline as string) || "TBD",
            award_range: (m.award_range as string) || "",
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
    if (mode === "scholarship") fetchOpportunities();
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
            // skip
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
        personal_statement: `${concept.problem_statement}\n\n${concept.methodology}`,
        academic_goals: concept.expected_impact,
        essay_writing: `${concept.title}\n\n${concept.problem_statement}`,
      };
      const res = await fetch("http://localhost:8000/api/ai/brainstorm/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          opportunity_id: selectedOpp?.id || null,
          type: "scholarship",
          sections,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/scholarships/applications/${data.id}`);
      }
    } catch {
      // handle
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
          type: "scholarship",
          sections: blueprint,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/scholarships/applications/${data.id}`);
      }
    } catch {
      // handle
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
      <div className="mb-8">
        <Link
          href="/scholarships/all"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Scholarships
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-violet-600" />
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
          onClick={() => setMode("scholarship")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "scholarship"
              ? "bg-violet-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText size={16} />
          From a Scholarship
        </button>
        <button
          onClick={() => setMode("freeform")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            mode === "freeform"
              ? "bg-violet-600 text-white"
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

      {/* SCHOLARSHIP MODE */}
      {mode === "scholarship" && (
        <div className="space-y-6">
          {/* Scholarship Name Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Search by Scholarship Name
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter a scholarship name to get structured information and suggestions.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={scholarshipName}
                onChange={(e) => setScholarshipName(e.target.value)}
                placeholder="e.g., Fulbright, Rhodes, Gates Cambridge..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Parse by name
                    (async () => {
                      if (!scholarshipName.trim()) return;
                      setGenerating(true);
                      setError(null);
                      setParsedOpp(null);
                      try {
                        const res = await fetch("http://localhost:8000/api/opportunities/parse-external", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: scholarshipName, type: "scholarship" }),
                        });
                        if (!res.ok) throw new Error("Failed to find scholarship");
                        const data = await res.json();
                        setParsedOpp(data);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Search failed.");
                      } finally {
                        setGenerating(false);
                      }
                    })();
                  }
                }}
              />
              <button
                onClick={async () => {
                  if (!scholarshipName.trim()) return;
                  setGenerating(true);
                  setError(null);
                  setParsedOpp(null);
                  try {
                    const res = await fetch("http://localhost:8000/api/opportunities/parse-external", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: scholarshipName, type: "scholarship" }),
                    });
                    if (!res.ok) throw new Error("Failed to find scholarship");
                    const data = await res.json();
                    setParsedOpp(data);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Search failed.");
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating || !scholarshipName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
            </div>

            {parsedOpp && (
              <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <div className="font-medium text-slate-900">{String(parsedOpp.title || "")}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {parsedOpp.provider ? `${parsedOpp.provider} · ` : ""}
                  {parsedOpp.award_range ? `${parsedOpp.award_range} · ` : ""}
                  {parsedOpp.deadline ? `Due ${parsedOpp.deadline}` : ""}
                </div>
                {parsedOpp.description ? (
                  <p className="text-sm text-slate-600 mt-2">{String(parsedOpp.description)}</p>
                ) : null}
              </div>
            )}
          </div>

          {!selectedOpp ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Select a Scholarship
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
                  placeholder="Search scholarships..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {loadingOpps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-violet-600" />
                </div>
              ) : (
                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {filteredOpps.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
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
                      Start by selecting a scholarship or describing your idea. Nye will generate tailored proposal concepts.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
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
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {generating ? "Nye is generating concepts..." : "Generate Concepts"}
                </button>
              </div>

              {concepts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Scholarship Concepts
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
                            className="animate-spin text-violet-600"
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
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
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
              Describe Your Scholarship Idea
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Write about your academic goals, personal story, or the impact you want
              to create. The AI will structure it into a compelling proposal.
            </p>
            <textarea
              value={freeformIdea}
              onChange={(e) => setFreeformIdea(e.target.value)}
              placeholder="e.g., I grew up in a rural community where access to clean water was a daily struggle. This experience drove me to study environmental engineering, and I want to develop low-cost water purification systems for communities like mine..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGenerateFromIdea}
                disabled={generating || !freeformIdea.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
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
                        {blueprint[field] || ""}
                        {streamingField === field && (
                          <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse" />
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
