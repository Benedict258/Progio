"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockGrantMatches } from "@/lib/mock-data";
import {
  FileText,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function OpportunityCard({
  opportunity,
  onStartApplication,
}: {
  opportunity: (typeof mockGrantMatches)[number];
  onStartApplication: (id: string) => void;
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
        <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium ml-4 flex-shrink-0">
          <Sparkles size={14} />
          {opportunity.matchScore}% match
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
        {opportunity.amount && (
          <span className="inline-flex items-center gap-1.5">
            <DollarSign size={14} className="text-slate-400" />
            {opportunity.amount}
          </span>
        )}
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
        <FileText size={16} />
        Start Application
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function AllGrantsPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);

  const handleStartApplication = async (opportunityId: string) => {
    setCreating(opportunityId);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          opportunity_id: opportunityId,
          type: "grant",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/grants/applications/${data.id}`);
      } else {
        const app = `app-${Date.now()}`;
        router.push(`/grants/applications/${app}`);
      }
    } catch {
      const app = `app-${Date.now()}`;
      router.push(`/grants/applications/${app}`);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">All Grants</h1>
        <p className="text-slate-600">
          Browse and apply for grant opportunities matched to your profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockGrantMatches.map((opp) => (
          <div key={opp.id} className="relative">
            {creating === opp.id && (
              <div className="absolute inset-0 bg-white/80 rounded-xl z-10 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            )}
            <OpportunityCard
              opportunity={opp}
              onStartApplication={handleStartApplication}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
