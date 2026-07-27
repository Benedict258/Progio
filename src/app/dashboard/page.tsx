"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockUser,
  mockGrantMatches,
  mockScholarshipMatches,
  mockDeadlines,
  mockApplications,
  mockReadiness,
  type MatchOpportunity,
  type Deadline,
} from "@/lib/mock-data";

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

function GreetingHeader({ user }: { user: typeof mockUser }) {
  const completed = user.onboardingSteps.filter((s) => s.completed).length;
  const total = user.onboardingSteps.length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user.name}
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
  searchQuery,
  onStartApplication,
}: {
  searchQuery: string;
  onStartApplication: (id: string, track: "grant" | "scholarship") => void;
}) {
  const filteredGrants = useMemo(() => {
    if (!searchQuery) return mockGrantMatches;
    const q = searchQuery.toLowerCase();
    return mockGrantMatches.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.matchReasons.some((r) => r.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredScholarships = useMemo(() => {
    if (!searchQuery) return mockScholarshipMatches;
    const q = searchQuery.toLowerCase();
    return mockScholarshipMatches.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.matchReasons.some((r) => r.toLowerCase().includes(q))
    );
  }, [searchQuery]);

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
            filteredGrants.map((m) => (
              <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
            ))
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
            filteredScholarships.map((m) => (
              <MatchCard key={m.id} match={m} onStartApplication={onStartApplication} />
            ))
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
        {sorted.map((d) => (
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
        ))}
      </div>
    </div>
  );
}

function ProfileCompletionWidget({ user }: { user: typeof mockUser }) {
  const [showModal, setShowModal] = useState(false);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (user.profileCompletion / 100) * circumference;

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
            {user.profileCompletion}%
          </span>
        </div>

        <div className="flex-1">
          <p className="text-sm text-slate-600">
            Complete your profile to improve match accuracy.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Sparkles size={14} />
              AI Fill
            </Link>
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

function ApplicationsInProgressWidget({ applications }: { applications: typeof mockApplications }) {
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

  const getHref = (app: (typeof mockApplications)[number]) => {
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
}: {
  assessments: typeof mockReadiness;
}) {
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
        {sorted.map((d) => (
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
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState(mockUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  const handleStartApplication = async (id: string, track: "grant" | "scholarship") => {
    setCreating(id);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          opportunity_id: id,
          type: track,
        }),
      });

      if (res.ok) {
        const data = await res.json();
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

      <GreetingHeader user={user} />
      <GlobalSearch onSearch={setSearchQuery} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <MatchingOpportunities
            searchQuery={searchQuery}
            onStartApplication={handleStartApplication}
          />
          <ReadinessAssessmentWidget assessments={mockReadiness} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ClosingSoonWidget deadlines={mockDeadlines} />
          <ProfileCompletionWidget user={user} />
          <ApplicationsInProgressWidget applications={mockApplications} />
          <DeadlinesDueSoonList deadlines={mockDeadlines} />
        </div>
      </div>
    </div>
  );
}
