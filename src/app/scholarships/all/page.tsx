"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
interface ScholarshipOpportunity {
  id: string;
  title: string;
  provider: string;
  matchScore: number;
  deadline: string;
  matchReasons: string[];
  track: "scholarship";
  amount?: string;
}
import {
  GraduationCap,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  Search,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { toggleScholarshipSaved, isScholarshipSaved, getSavedScholarships } from "@/lib/storage";
import { GatedContent } from "@/components/GatedContent";
import { apiFetch, apiPost } from "@/lib/api";

function OpportunityCard({
  opportunity,
  onStartApplication,
  saved,
  onToggleSave,
}: {
  opportunity: ScholarshipOpportunity;
  onStartApplication: (id: string) => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">
            {opportunity.title}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{opportunity.provider}</p>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            <Sparkles size={14} />
            {opportunity.matchScore}% match
          </div>
          <button
            onClick={onToggleSave}
            className={`p-2 rounded-lg transition-colors ${saved ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 hover:text-indigo-600"}`}
            title={saved ? "Remove from saved" : "Save opportunity"}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap size={14} className="text-slate-400" />
          Scholarship
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          Due {opportunity.deadline}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {opportunity.matchReasons.map((reason) => (
          <span
            key={reason}
            className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium"
          >
            {reason}
          </span>
        ))}
      </div>

      <button
        onClick={() => onStartApplication(opportunity.id)}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <GraduationCap size={16} />
        Start Application
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={24} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No scholarships found</h3>
      <p className="text-slate-500 max-w-md mx-auto">
        Complete your profile to improve matches. New opportunities are added regularly.
      </p>
    </div>
  );
}

export default function AllScholarshipsPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [scholarships, setScholarships] = useState<ScholarshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSaved = useCallback(() => {
    setSavedIds(new Set(getSavedScholarships().map((s) => s.id)));
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  useEffect(() => {
    async function fetchScholarships() {
      try {
        const data = await apiFetch<{ matches?: Array<Record<string, unknown>> }>(
          "/api/opportunities/matches",
          { params: { user_id: "user-001", type: "scholarship" } }
        );
        if (data?.matches) {
          const mapped: ScholarshipOpportunity[] = data.matches.map(
            (m) => ({
              id: m.opportunity_id as string,
              title: m.title as string,
              provider: m.provider as string,
              matchScore: Math.round(m.score as number),
              deadline: m.deadline as string,
              matchReasons: m.match_reasons as string[],
              track: "scholarship" as const,
              amount: (m.award_range as string) || undefined,
            })
          );
          setScholarships(mapped);
        }
      } catch {
        setScholarships([]);
      } finally {
        setLoading(false);
      }
    }
    fetchScholarships();
  }, []);

  const filteredScholarships = searchQuery
    ? scholarships.filter(
        (opp) =>
          opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.matchReasons.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : scholarships;

  const handleStartApplication = async (opportunityId: string) => {
    setCreating(opportunityId);
    try {
      const data = await apiPost<{ id: string }>("/api/applications", {
        user_id: "user-001",
        opportunity_id: opportunityId,
        type: "scholarship",
      });

      if (data) {
        router.push(`/scholarships/applications/${data.id}`);
      } else {
        const app = `app-${Date.now()}`;
        router.push(`/scholarships/applications/${app}`);
      }
    } catch {
      const app = `app-${Date.now()}`;
      router.push(`/scholarships/applications/${app}`);
    } finally {
      setCreating(null);
    }
  };

  const handleToggleSave = (opp: ScholarshipOpportunity) => {
    toggleScholarshipSaved({
      id: opp.id,
      title: opp.title,
      provider: opp.provider,
      deadline: opp.deadline,
      amount: opp.amount,
      track: opp.track,
    });
    refreshSaved();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">All Scholarships</h1>
        <p className="text-slate-600">
          Browse and apply for scholarship opportunities matched to your profile.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scholarships..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <GatedContent feature="advanced_filters">
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredScholarships.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filteredScholarships.slice(0, 3).map((opp) => (
              <div key={opp.id} className="relative">
                {creating === opp.id && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl z-10 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                  </div>
                )}
                <OpportunityCard
                  opportunity={opp}
                  onStartApplication={handleStartApplication}
                  saved={savedIds.has(opp.id)}
                  onToggleSave={() => handleToggleSave(opp)}
                />
              </div>
            ))}
            {filteredScholarships.length > 3 && (
              <GatedContent feature="full_scholarships">
                <>
                  {filteredScholarships.slice(3).map((opp) => (
                    <div key={opp.id} className="relative">
                      {creating === opp.id && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl z-10 flex items-center justify-center">
                          <Loader2 size={24} className="animate-spin text-indigo-600" />
                        </div>
                      )}
                      <OpportunityCard
                        opportunity={opp}
                        onStartApplication={handleStartApplication}
                        saved={savedIds.has(opp.id)}
                        onToggleSave={() => handleToggleSave(opp)}
                      />
                    </div>
                  ))}
                </>
              </GatedContent>
            )}
          </>
        )}
      </div>
    </div>
  );
}
