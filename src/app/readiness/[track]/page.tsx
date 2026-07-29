"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface CategoryBreakdown {
  planning: number;
  content: number;
  logistics: number;
  impact: number;
}

interface AssessmentResult {
  id: string;
  track: string;
  score: number;
  breakdown: CategoryBreakdown;
  feedback: string;
  action_items: string[];
  responses: Record<string, string>;
  completed_at: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  provider: string;
  type: string;
  award_range: string | null;
  deadline: string | null;
  region: string | null;
  field_tags: string[] | null;
}

interface FitCriterion {
  name: string;
  required: string | null;
  user_value: string | null;
  met: boolean;
  partial: boolean;
}

interface OpportunityFit {
  user_id: string;
  opportunity_id: string;
  opportunity_title: string;
  opportunity_provider: string;
  opportunity_type: string | null;
  award_range: string | null;
  deadline: string | null;
  region: string | null;
  field_tags: string[] | null;
  fit_score: number;
  criteria: FitCriterion[];
  recommendations: string[];
}

const TRACK_LABELS: Record<string, string> = {
  grant: "Grant Readiness",
  scholarship: "Scholarship Readiness",
  research: "Research Readiness",
};

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#ca8a04" : "#dc2626";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-slate-900">{score.toFixed(0)}%</span>
    </div>
  );
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{score.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function FitDrawer({
  fit,
  onClose,
  onStartAssessment,
}: {
  fit: OpportunityFit;
  onClose: () => void;
  onStartAssessment: () => void;
}) {
  const scoreColor = fit.fit_score >= 70 ? "text-green-600" : fit.fit_score >= 40 ? "text-yellow-600" : "text-red-600";
  const scoreBg = fit.fit_score >= 70 ? "bg-green-50 border-green-200" : fit.fit_score >= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Opportunity Fit</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-1">{fit.opportunity_title}</h3>
            <p className="text-sm text-slate-600">{fit.opportunity_provider}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {fit.award_range && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{fit.award_range}</span>
              )}
              {fit.deadline && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Deadline: {new Date(fit.deadline).toLocaleDateString()}
                </span>
              )}
              {fit.region && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{fit.region}</span>
              )}
            </div>
            {fit.field_tags && fit.field_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {fit.field_tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-xl border p-4 mb-6 ${scoreBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Fit Score</span>
              <span className={`text-2xl font-bold ${scoreColor}`}>{fit.fit_score.toFixed(0)}%</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">{fit.recommendations[0]}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Criteria Comparison</h3>
            <div className="space-y-3">
              {fit.criteria.map((c) => (
                <div key={c.name} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.met ? "bg-green-100 text-green-700" : c.partial ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.met ? "Met" : c.partial ? "Partial" : "Not Met"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <div>Required: <span className="text-slate-700">{c.required || "Any"}</span></div>
                    <div>Your profile: <span className="text-slate-700">{c.user_value || "Not set"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {fit.recommendations.length > 1 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {fit.recommendations.slice(1).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 text-blue-500">&#9679;</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onStartAssessment}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    </>
  );
}

export default function ReadinessWizardPage() {
  const params = useParams();
  const track = (params.track as string) || "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [fit, setFit] = useState<OpportunityFit | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [showFitDrawer, setShowFitDrawer] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState<"select" | "quiz">("select");

  useEffect(() => {
    if (!track) return;

    let cancelled = false;

    async function load() {
      try {
        const qRes = await fetch(`http://localhost:8000/api/readiness/questions/${track}`);
        if (!qRes.ok) throw new Error("Failed to load questions");
        const qData = await qRes.json();
        if (!cancelled) setQuestions(qData);
      } catch {
        if (!cancelled) setError("Failed to load questions. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const oRes = await fetch(`http://localhost:8000/api/readiness/opportunities/${track}`);
        if (oRes.ok) {
          const oData = await oRes.json();
          if (!cancelled) setOpportunities(oData);
        }
      } catch {
        // No opportunities available
      }

      try {
        const rRes = await fetch(`http://localhost:8000/api/readiness/results/default-user/${track}`);
        if (rRes.ok) {
          const rData = await rRes.json();
          if (!cancelled) setResult(rData);
        }
      } catch {
        // No existing result
      }
    }

    load();
    return () => { cancelled = true; };
  }, [track]);

  const handleSelectOpportunity = async (opp: Opportunity) => {
    setSelectedOpp(opp);
    setFitLoading(true);
    setShowFitDrawer(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/readiness/fit/${track}?user_id=user-001&opportunity_id=${opp.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setFit(data);
      }
    } catch {
      // Fit evaluation failed
    } finally {
      setFitLoading(false);
    }
  };

  const handleStartAssessment = () => {
    setShowFitDrawer(false);
    setAssessmentMode("quiz");
  };

  const handleSkipToGeneral = () => {
    setSelectedOpp(null);
    setFit(null);
    setAssessmentMode("quiz");
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/readiness/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default-user", track, responses }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Submission failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setCurrentStep(0);
    setResponses({});
    setAssessmentMode("select");
    setSelectedOpp(null);
    setFit(null);
  };

  if (!track) {
    return (
      <div className="p-8">
        <div className="text-red-600">Invalid track specified.</div>
        <Link href="/readiness" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Assessments
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading questions...</div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        <Link href="/readiness" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Assessments
        </Link>
      </div>
    );
  }

  if (result) {
    const categories = [
      { label: "Planning", score: result.breakdown.planning },
      { label: "Content", score: result.breakdown.content },
      { label: "Logistics", score: result.breakdown.logistics },
      { label: "Impact", score: result.breakdown.impact },
    ];

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/readiness" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Assessments
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{TRACK_LABELS[track] || track} Results</h1>
        <p className="text-slate-500 text-sm mb-6">
          Completed {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : "just now"}
        </p>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col items-center">
          <ScoreCircle score={result.score} />
          <p className="mt-3 text-slate-600 text-center text-sm max-w-md">{result.feedback}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Category Breakdown</h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <CategoryBar key={cat.label} label={cat.label} score={cat.score} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Action Items</h2>
          <ul className="space-y-2">
            {result.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-blue-500">&#9679;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleRetake}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Retake Assessment
        </button>
      </div>
    );
  }

  if (assessmentMode === "select") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/readiness" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Assessments
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{TRACK_LABELS[track] || track}</h1>
        <p className="text-slate-500 text-sm mb-6">
          Select an opportunity to evaluate your fit, or skip to a general readiness assessment.
        </p>

        {opportunities.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900 mb-3">Available Opportunities</h2>
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => handleSelectOpportunity(opp)}
                  className="w-full text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="font-medium text-slate-900">{opp.title}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{opp.provider}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {opp.award_range && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{opp.award_range}</span>
                    )}
                    {opp.deadline && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Due {new Date(opp.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {opp.region && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{opp.region}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSkipToGeneral}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Skip — General Readiness Assessment
        </button>

        {showFitDrawer && fit && (
          <FitDrawer
            fit={fit}
            onClose={() => setShowFitDrawer(false)}
            onStartAssessment={handleStartAssessment}
          />
        )}
        {showFitDrawer && fitLoading && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowFitDrawer(false)} />
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 flex items-center justify-center">
              <div className="text-slate-500">Evaluating fit...</div>
            </div>
          </>
        )}
      </div>
    );
  }

  const question = questions[currentStep];
  const total = questions.length;
  const progress = ((currentStep + 1) / total) * 100;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/readiness" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Back to Assessments
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{TRACK_LABELS[track] || track}</h1>
      {selectedOpp && (
        <div className="text-sm text-blue-600 mb-1">
          Assessing fit for: {selectedOpp.title}
        </div>
      )}
      <p className="text-slate-500 text-sm mb-6">
        Question {currentStep + 1} of {total}
      </p>

      <div className="h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <p className="text-lg font-medium text-slate-900 mb-5">{question.text}</p>
        <div className="space-y-3">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                responses[question.id] === opt
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={responses[question.id] === opt}
                onChange={() => handleAnswer(question.id, opt)}
                className="accent-blue-500"
              />
              <span className="capitalize text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {currentStep < total - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!responses[question.id]}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!responses[question.id] || submitting}
            className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}
