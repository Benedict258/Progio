"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  FileText,
  GraduationCap,
  FlaskConical,
  CheckCircle2,
  Sparkles,
  Target,
  Calendar,
  ArrowRight,
  BookOpen,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GatedContent } from "@/components/GatedContent";
import { apiFetch, apiFetchArray, apiPost } from "@/lib/api";
const mockUser = {
  id: "user-001",
  name: "Dr. Amara Osei",
  fullName: "Dr. Amara Osei",
  email: "amara.osei@ug.edu.gh",
  institution: "University of Ghana",
  department: "Computational Biology",
  field: "Computational Biology",
  profileCompletion: 100,
  onboardingSteps: [
    { label: "Complete Profile", completed: true },
    { label: "Set Preferences", completed: true },
    { label: "Browse Grants", completed: true },
    { label: "Start Application", completed: true },
    { label: "Take Assessment", completed: true },
    { label: "Review Matches", completed: true },
  ],
};

interface MatchOpportunity {
  id: string;
  title: string;
  provider: string;
  matchScore: number;
  deadline: string;
  matchReasons: string[];
  track: "grant" | "scholarship";
  amount?: string;
}

interface Deadline {
  id: string;
  title: string;
  provider: string;
  track: "grant" | "scholarship" | "research";
  deadline: string;
  daysRemaining: number;
  applicationStatus: "not_started" | "in_progress" | "submitted";
}

interface Application {
  id: string;
  opportunityTitle: string;
  track: "grant" | "scholarship" | "research";
  status: "drafting" | "review" | "submitted" | "awarded" | "rejected";
  lastEdited: string;
  progress: number;
}

interface ReadinessAssessment {
  id: string;
  type: "grant" | "scholarship" | "research";
  label: string;
  completed: boolean;
  score?: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function matchScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function trackBadge(track: "grant" | "scholarship" | "research") {
  const styles = {
    grant: "bg-indigo-100 text-indigo-700",
    scholarship: "bg-purple-100 text-purple-700",
    research: "bg-teal-100 text-teal-700",
  };
  return styles[track];
}

function trackIcon(track: "grant" | "scholarship" | "research", size = 16) {
  switch (track) {
    case "grant":
      return <FileText size={size} />;
    case "scholarship":
      return <GraduationCap size={size} />;
    case "research":
      return <FlaskConical size={size} />;
  }
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    not_started: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    drafting: "bg-blue-100 text-blue-700",
    review: "bg-amber-100 text-amber-700",
    submitted: "bg-emerald-100 text-emerald-700",
    awarded: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: "grant" | "scholarship" | "research" | "general";
  title: string;
  description: string;
}) {
  const iconMap = {
    grant: <FileText size={24} className="text-slate-400" />,
    scholarship: <GraduationCap size={24} className="text-slate-400" />,
    research: <FlaskConical size={24} className="text-slate-400" />,
    general: <BookOpen size={24} className="text-slate-400" />,
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
        {iconMap[icon]}
      </div>
      <p className="text-sm font-medium text-slate-900 mb-1">{title}</p>
      <p className="text-xs text-slate-500 max-w-xs mx-auto">{description}</p>
    </div>
  );
}

// ─── Widgets ────────────────────────────────────────────────────────────

function GreetingHeader({
  user,
  onboardingSteps,
}: {
  user: { name: string; profile_completion_pct?: number };
  onboardingSteps?: { label: string; completed: boolean }[];
}) {
  const steps = onboardingSteps ?? mockUser.onboardingSteps;
  const completed = steps.filter((s) => s.completed).length;
  const total = steps.length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user.name.split(" ").pop() || user.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening across your opportunities today.
        </p>
      </div>
      <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="text-sm text-slate-600">
          Quick start{" "}
          <span className="font-semibold text-indigo-600">
            {completed}/{total}
          </span>
        </div>
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </Link>
    </div>
  );
}

function GlobalSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search grants, scholarships, research..."
        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
      />
    </div>
  );
}

function MatchCard({
  match,
  onStartApplication,
}: {
  match: MatchOpportunity;
  onStartApplication: (id: string, track: "grant" | "scholarship") => void;
}) {
  const detailHref = match.track === "grant" ? `/grants/all` : `/scholarships/all`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm leading-snug truncate">
            {match.title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{match.provider}</p>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border",
            matchScoreColor(match.matchScore)
          )}
        >
          {match.matchScore}%
        </span>
      </div>

      {match.amount && (
        <p className="text-sm font-medium text-emerald-600 mt-2">{match.amount}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {match.matchReasons.map((reason) => (
          <span
            key={reason}
            className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
          >
            {reason}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          Deadline: {new Date(match.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={detailHref}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => onStartApplication(match.id, match.track)}
            className="text-xs font-medium px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Application
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchingOpportunities({
  grants,
  scholarships,
  searchQuery,
  loading,
  onStartApplication,
}: {
  grants: MatchOpportunity[];
  scholarships: MatchOpportunity[];
  searchQuery: string;
  loading: boolean;
  onStartApplication: (id: string, track: "grant" | "scholarship") => void;
}) {
  const filteredGrants = useMemo(() => {
    if (!searchQuery) return grants;
    const q = searchQuery.toLowerCase();
    return grants.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.matchReasons.some((r) => r.toLowerCase().includes(q))
    );
  }, [searchQuery, grants]);

  const filteredScholarships = useMemo(() => {
    if (!searchQuery) return scholarships;
    const q = searchQuery.toLowerCase();
    return scholarships.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.matchReasons.some((r) => r.toLowerCase().includes(q))
    );
  }, [searchQuery, scholarships]);

  const freeGrants = filteredGrants.slice(0, 3);
  const gatedGrants = filteredGrants.slice(3);
  const freeScholarships = filteredScholarships.slice(0, 3);
  const gatedScholarships = filteredScholarships.slice(3);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Top Grant Matches</h3>
        </div>
        <div className="space-y-3">
          {filteredGrants.length === 0 ? (
            <EmptyState
              icon="grant"
              title="No grants found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <>
              {freeGrants.map((m) => (
                <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
              ))}
              {gatedGrants.length > 0 && (
                <GatedContent feature="full_opportunities">
                  <div className="space-y-3">
                    {gatedGrants.map((m) => (
                      <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
                    ))}
                  </div>
                </GatedContent>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={18} className="text-purple-600" />
          <h3 className="text-sm font-semibold text-slate-900">Top Scholarship Matches</h3>
        </div>
        <div className="space-y-3">
          {filteredScholarships.length === 0 ? (
            <EmptyState
              icon="scholarship"
              title="No scholarships found"
              description="Complete your profile to improve matches."
            />
          ) : (
            <>
              {freeScholarships.map((m) => (
                <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
              ))}
              {gatedScholarships.length > 0 && (
                <GatedContent feature="full_opportunities">
                  <div className="space-y-3">
                    {gatedScholarships.map((m) => (
                      <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
                    ))}
                  </div>
                </GatedContent>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ClosingSoonWidget({ deadlines }: { deadlines: Deadline[] }) {
  const sorted = useMemo(
    () => [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5),
    [deadlines]
  );

  const getHref = (d: Deadline) => {
    if (d.applicationStatus === "in_progress") {
      return d.track === "grant"
        ? `/grants/applications/app-${d.id}`
        : d.track === "scholarship"
        ? `/scholarships/applications/app-${d.id}`
        : `/research/proposals/app-${d.id}`;
    }
    return d.track === "grant"
      ? "/grants/all"
      : d.track === "scholarship"
      ? "/scholarships/all"
      : "/research/literature";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Closing Soon</h3>
      </div>
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
        ) : (
          sorted.map((d) => (
            <Link
              key={d.id}
              href={getHref(d)}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{d.provider}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                    trackBadge(d.track)
                  )}
                >
                  {d.track}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    d.daysRemaining <= 7 ? "text-red-600" : "text-slate-600"
                  )}
                >
                  {getDaysLabel(d.daysRemaining)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileCompletionWidget({
  profilePct,
}: {
  profilePct: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (profilePct / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Profile Completion</h3>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="96" height="96" className="-rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#6366f1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
            {Math.round(profilePct)}%
          </span>
        </div>

        <div className="flex-1">
          <p className="text-sm text-slate-600">
            Complete your profile to improve match accuracy.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <GatedContent feature="ai_fill">
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Sparkles size={14} />
                AI Fill
              </Link>
            </GatedContent>
            <Link
              href="/profile"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-2">AI Profile Assist</h4>
            <p className="text-sm text-slate-500 mb-4">
              Upload your CV or LinkedIn profile and our AI will auto-fill the remaining fields.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
              <FileText size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">
                Drop your file here or <span className="text-indigo-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT up to 10MB</p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Upload & Fill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationsInProgressWidget({
  applications,
  loading,
}: {
  applications: Application[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Applications In Progress</h3>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Applications In Progress</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            No applications yet. Start one from a match and the AI co-writer drafts the outline with you.
          </p>
          <Link
            href="/grants/all"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Browse Grants <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  const getHref = (app: Application) => {
    if (app.track === "grant") return `/grants/applications/${app.id}`;
    if (app.track === "scholarship") return `/scholarships/applications/${app.id}`;
    return `/research/proposals/${app.id}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Applications In Progress</h3>
      </div>
      <div className="space-y-3">
        {applications.map((app) => (
          <Link
            key={app.id}
            href={getHref(app)}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {app.opportunityTitle}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Last edited {app.lastEdited}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${app.progress}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  statusColor(app.status)
                )}
              >
                {statusLabel(app.status)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReadinessAssessmentWidget({
  assessments,
  loading,
}: {
  assessments: ReadinessAssessment[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Readiness Assessments</h3>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Readiness Assessments</h3>
      </div>
      <div className="space-y-3">
        {assessments.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              a.completed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
            )}
          >
            <div className="flex items-center gap-3">
              {trackIcon(a.type, 20)}
              <div>
                <p className="text-sm font-medium text-slate-900">{a.label}</p>
                {a.completed && a.score !== undefined ? (
                  <p className="text-xs text-emerald-600">Score: {a.score}/100</p>
                ) : (
                  <p className="text-xs text-amber-600">Needs your attention</p>
                )}
              </div>
            </div>
            <Link
              href={`/readiness/${a.type}`}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                a.completed
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              {a.completed ? "Retake" : "10 min · Take assessment"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeadlinesDueSoonList({ deadlines }: { deadlines: Deadline[] }) {
  const sorted = useMemo(
    () => [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining),
    [deadlines]
  );

  const getHref = (d: Deadline) => {
    if (d.applicationStatus === "in_progress") {
      return d.track === "grant"
        ? `/grants/applications/app-${d.id}`
        : d.track === "scholarship"
        ? `/scholarships/applications/app-${d.id}`
        : `/research/proposals/app-${d.id}`;
    }
    return d.track === "grant"
      ? "/grants/all"
      : d.track === "scholarship"
      ? "/scholarships/all"
      : "/research/literature";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Deadlines Due Soon</h3>
      </div>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
        ) : (
          sorted.map((d) => (
            <Link
              key={d.id}
              href={getHref(d)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span
                className={cn(
                  "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                  d.daysRemaining <= 7
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {d.daysRemaining}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                <p className="text-xs text-slate-500">
                  {new Date(d.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                    trackBadge(d.track)
                  )}
                >
                  {d.track}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                    statusColor(d.applicationStatus)
                  )}
                >
                  {statusLabel(d.applicationStatus)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  const [user, setUser] = useState(mockUser);
  const [profilePct, setProfilePct] = useState(mockUser.profileCompletion);
  const [grants, setGrants] = useState<MatchOpportunity[]>([]);
  const [scholarships, setScholarships] = useState<MatchOpportunity[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [readiness, setReadiness] = useState<ReadinessAssessment[]>([]);

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReadiness, setLoadingReadiness] = useState(true);

  // 1. Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiFetch<{
          name?: string;
          email?: string;
          institution?: string;
          field_of_study?: string;
          profile_completion_pct?: number;
        }>("/api/profile", { params: { user_id: "user-001" } });
        if (data) {
          setUser((prev) => ({
            ...prev,
            name: data.name || prev.name,
            fullName: data.name || prev.fullName,
            email: data.email || prev.email,
            institution: data.institution || prev.institution,
            field: data.field_of_study || prev.field,
          }));
          setProfilePct(data.profile_completion_pct ?? 0);
        }
      } catch {
        // keep default state
      }
    }
    fetchProfile();
  }, []);

  // 2. Fetch enriched matches for grants and scholarships
  useEffect(() => {
    async function fetchMatches() {
      try {
        const [grantData, scholarshipData] = await Promise.all([
          apiFetch<{ matches?: Array<{ opportunity_id: string; title: string; provider: string; score: number; match_reasons: string[]; award_range?: string; deadline?: string }> }>("/api/opportunities/matches-enriched", { params: { user_id: "user-001", type: "grant" } }),
          apiFetch<{ matches?: Array<{ opportunity_id: string; title: string; provider: string; score: number; match_reasons: string[]; award_range?: string; deadline?: string }> }>("/api/opportunities/matches-enriched", { params: { user_id: "user-001", type: "scholarship" } }),
        ]);

        if (grantData?.matches) {
          const mappedGrants: MatchOpportunity[] = grantData.matches.map(
            (m) => ({
              id: m.opportunity_id,
              title: m.title,
              provider: m.provider,
              matchScore: Math.round(m.score),
              deadline: m.deadline || "2027-01-01",
              matchReasons: m.match_reasons,
              track: "grant" as const,
              amount: m.award_range || undefined,
            })
          );
          setGrants(mappedGrants);
        }

        if (scholarshipData?.matches) {
          const mappedScholarships: MatchOpportunity[] = scholarshipData.matches.map(
            (m) => ({
              id: m.opportunity_id,
              title: m.title,
              provider: m.provider,
              matchScore: Math.round(m.score),
              deadline: m.deadline || "2027-01-01",
              matchReasons: m.match_reasons,
              track: "scholarship" as const,
              amount: m.award_range || undefined,
            })
          );
          setScholarships(mappedScholarships);
        }

        // Derive deadlines from both grant and scholarship matches
        const allMatches = [
          ...(grantData?.matches || []),
          ...(scholarshipData?.matches || []),
        ];
        const derivedDeadlines: Deadline[] = allMatches
          .filter((m) => m.deadline)
          .map((m) => ({
            id: m.opportunity_id,
            title: m.title,
            provider: m.provider,
            track: (m.opportunity_id.startsWith("opp-g") ? "grant" : "scholarship") as "grant" | "scholarship",
            deadline: m.deadline!,
            daysRemaining: daysUntil(m.deadline!),
            applicationStatus: "not_started" as const,
          }))
          .sort((a: Deadline, b: Deadline) => a.daysRemaining - b.daysRemaining);
        setDeadlines(derivedDeadlines);
      } catch {
        // keep empty state
      } finally {
        setLoadingMatches(false);
      }
    }
    fetchMatches();
  }, []);

  // 3. Fetch projects (applications in progress)
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await apiFetchArray<{
          id: string;
          status: string;
          source_application_id?: string;
          progress_pct?: number;
          updated_at?: string;
        }>("/api/projects", { params: { user_id: "user-001" } });
        const mapped = data.map((p) => ({
          id: p.id,
          opportunityTitle: p.source_application_id || "Untitled Project",
          track: "grant" as const,
          status: (p.status === "completed" ? "submitted" : "drafting") as "drafting",
          lastEdited: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Never",
          progress: p.progress_pct ?? 0,
        }));
        setApplications(mapped);
      } catch {
        // keep empty state
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  // 4. Fetch readiness assessment results
  useEffect(() => {
    async function fetchReadiness() {
      try {
        const data = await apiFetch<Array<{ track: string; score: number }>>("/api/readiness/results/user-001");
        if (Array.isArray(data) && data.length > 0) {
          const trackLabels: Record<string, string> = {
            grant: "Grant Readiness",
            scholarship: "Scholarship Readiness",
            research: "Research Readiness",
          };
          const completedTracks = new Map(
            data.map((r) => [r.track, r.score])
          );
          const mapped: ReadinessAssessment[] = ["grant", "scholarship", "research"].map((track) => ({
            id: `r-${track}`,
            type: track as "grant" | "scholarship" | "research",
            label: trackLabels[track],
            completed: completedTracks.has(track),
            score: completedTracks.get(track),
          }));
          setReadiness(mapped);
        }
      } catch {
        // keep empty state
      } finally {
        setLoadingReadiness(false);
      }
    }
    fetchReadiness();
  }, []);

  const handleStartApplication = async (id: string, track: "grant" | "scholarship") => {
    setCreating(id);
    try {
      const data = await apiPost<{ id: string }>("/api/applications", {
        user_id: "user-001",
        opportunity_id: id,
        type: track,
      });

      if (data) {
        router.push(`/${track === "grant" ? "grants" : "scholarships"}/applications/${data.id}`);
      } else {
        const app = `app-${Date.now()}`;
        router.push(`/${track === "grant" ? "grants" : "scholarships"}/applications/${app}`);
      }
    } catch {
      const app = `app-${Date.now()}`;
      router.push(`/${track === "grant" ? "grants" : "scholarships"}/applications/${app}`);
    } finally {
      setCreating(null);
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {creating && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-200">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">Creating application...</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <GreetingHeader user={user} onboardingSteps={user.onboardingSteps} />
        </div>
        <button
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm print:hidden mt-2"
        >
          <Printer size={16} />
          Export PDF
        </button>
      </div>
      <GlobalSearch onSearch={setSearchQuery} />

      {/* Advanced Search Filters - Gated */}
      <GatedContent feature="advanced_search">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Advanced Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Field of Study</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All fields</option>
                <option>Computer Science</option>
                <option>Biology</option>
                <option>Engineering</option>
                <option>Physics</option>
                <option>Social Sciences</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Region</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All regions</option>
                <option>North America</option>
                <option>Europe</option>
                <option>Asia</option>
                <option>Africa</option>
                <option>Global</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deadline Range</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Any deadline</option>
                <option>Within 7 days</option>
                <option>Within 30 days</option>
                <option>Within 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </GatedContent>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <MatchingOpportunities
            grants={grants}
            scholarships={scholarships}
            searchQuery={searchQuery}
            loading={loadingMatches}
            onStartApplication={handleStartApplication}
          />
          <ReadinessAssessmentWidget assessments={readiness} loading={loadingReadiness} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ClosingSoonWidget deadlines={deadlines} />
          <ProfileCompletionWidget profilePct={profilePct} />
          <ApplicationsInProgressWidget applications={applications} loading={loadingProjects} />
          <DeadlinesDueSoonList deadlines={deadlines} />
        </div>
      </div>
    </div>
  );
}
