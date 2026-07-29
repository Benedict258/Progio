"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";

interface CoachData {
  field: string;
  focus: string;
  challenges: string;
  impact: string;
}

interface AICoachProps {
  onComplete: (summary: string, profile: CoachData) => void;
  onSkip: () => void;
}

const COACH_STEPS = [
  {
    title: "What field are you in?",
    subtitle: "This helps me tailor suggestions to your discipline.",
    key: "field" as const,
  },
  {
    title: "What's your research focus?",
    subtitle: "Describe your current project or area of study.",
    key: "focus" as const,
  },
  {
    title: "What challenges have you faced?",
    subtitle: "Select the biggest hurdle in your academic journey.",
    key: "challenges" as const,
  },
  {
    title: "What impact do you want to make?",
    subtitle: "What change do you hope your work will bring?",
    key: "impact" as const,
  },
];

const FIELDS = [
  "Computer Science / AI",
  "Engineering",
  "Life Sciences / Biology",
  "Physical Sciences",
  "Social Sciences",
  "Humanities",
  "Health / Medicine",
  "Environmental Science",
  "Education",
  "Business / Economics",
  "Other",
];

const CHALLENGES = [
  "Funding and grants",
  "Publishing in top journals",
  "Building research collaborations",
  "Translating research to impact",
  "Work-life balance",
  "Navigating academic bureaucracy",
  "Access to resources and equipment",
  "Mentorship and networking",
];

const STORAGE_KEY = "progio-ai-coach-profile";

export function getStoredCoachProfile(): CoachData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeCoachProfile(profile: CoachData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function AICoach({ onComplete, onSkip }: AICoachProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CoachData>({
    field: "",
    focus: "",
    challenges: "",
    impact: "",
  });
  const [customField, setCustomField] = useState("");
  const [generating, setGenerating] = useState(false);

  const isStepValid = useCallback(() => {
    const currentKey = COACH_STEPS[step].key;
    if (currentKey === "field") return data.field !== "";
    if (currentKey === "focus") return data.focus.trim().length > 0;
    if (currentKey === "challenges") return data.challenges !== "";
    if (currentKey === "impact") return data.impact.trim().length > 0;
    return false;
  }, [step, data]);

  const handleNext = useCallback(() => {
    if (step < COACH_STEPS.length - 1) {
      setStep(step + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const generateSummary = useCallback(async () => {
    setGenerating(true);

    const profile = { ...data };
    if (profile.field === "Other" && customField.trim()) {
      profile.field = customField.trim();
    }

    try {
      const res = await fetch("http://localhost:8000/api/ai/coach/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: profile.field,
          research_focus: profile.focus,
          challenges: profile.challenges,
          impact: profile.impact,
        }),
      });

      if (!res.ok) throw new Error("Summary generation failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let summary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        summary += decoder.decode(value, { stream: true });
      }

      storeCoachProfile(profile);
      onComplete(summary, profile);
    } catch {
      const summary = buildLocalSummary(profile);
      storeCoachProfile(profile);
      onComplete(summary, profile);
    } finally {
      setGenerating(false);
    }
  }, [data, customField, onComplete]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles size={14} />
            Meet Nye — Your AI Coach
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Let&apos;s get to know you
          </h2>
          <p className="text-slate-500">
            Nye will use your answers to personalize brainstorming suggestions.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {COACH_STEPS.map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i <= step
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                    : "bg-slate-200"
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">
            {step + 1}/{COACH_STEPS.length}
          </span>
        </div>

        {/* Step Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {COACH_STEPS[step].title}
          </h3>
          <p className="text-sm text-slate-500 mb-6">{COACH_STEPS[step].subtitle}</p>

          {/* Step 0: Field */}
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIELDS.map((field) => (
                <button
                  key={field}
                  onClick={() => setData({ ...data, field })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    data.field === field
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {field}
                </button>
              ))}
              {data.field === "Other" && (
                <input
                  type="text"
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  placeholder="Specify your field..."
                  className="col-span-full mt-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Step 1: Research Focus */}
          {step === 1 && (
            <textarea
              value={data.focus}
              onChange={(e) => setData({ ...data, focus: e.target.value })}
              placeholder="e.g., I'm developing machine learning models to detect early signs of crop disease from drone imagery in sub-Saharan Africa..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              autoFocus
            />
          )}

          {/* Step 2: Challenges */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHALLENGES.map((challenge) => (
                <button
                  key={challenge}
                  onClick={() => setData({ ...data, challenges: challenge })}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    data.challenges === challenge
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {challenge}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Impact */}
          {step === 3 && (
            <textarea
              value={data.impact}
              onChange={(e) => setData({ ...data, impact: e.target.value })}
              placeholder="e.g., I want to build tools that help smallholder farmers increase yields and reduce food insecurity across East Africa..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              autoFocus
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip for now
          </button>
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
            {step < COACH_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={generateSummary}
                disabled={!isStepValid() || generating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Nye is preparing your profile...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Nye signature */}
        <div className="text-center mt-6">
          <span className="text-xs text-slate-300">
            Powered by Nye — your personal AI research coach
          </span>
        </div>
      </div>
    </div>
  );
}

function buildLocalSummary(profile: CoachData): string {
  return `## Your Profile Summary

**Field:** ${profile.field}
**Research Focus:** ${profile.focus}
**Primary Challenge:** ${profile.challenges}
**Desired Impact:** ${profile.impact}

### Strengths Identified
- Clear sense of purpose and direction in ${profile.field}
- Strong motivation tied to real-world impact
- Willingness to tackle meaningful challenges

### Areas to Explore
- Consider how funding opportunities align with your research focus
- Look for collaborators who complement your skillset
- Frame your proposal around the impact you described

---
*— Nye, your AI research coach*`;
}
