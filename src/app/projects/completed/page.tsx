"use client";

import { useState, useMemo } from "react";
import {
  FolderCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  title: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed";
  description?: string;
}

interface Project {
  id: string;
  user_id: string;
  source_application_id?: string;
  status: "active" | "completed";
  milestones: Milestone[];
  created_at?: string;
  updated_at?: string;
  progress_pct: number;
  title?: string;
  source_opportunity?: string;
  completed_at?: string;
}

const mockCompletedProjects: Project[] = [
  {
    id: "proj-comp-001",
    user_id: "user-001",
    source_application_id: "app-comp-001",
    status: "completed",
    title: "Ford Foundation - Racial Justice Research",
    source_opportunity: "Ford Foundation",
    milestones: [
      {
        id: "ms-c001",
        title: "Project Kickoff",
        due_date: "2025-06-01T00:00:00Z",
        status: "completed",
        description: "Initial project setup, team introduction, and scope confirmation",
      },
      {
        id: "ms-c002",
        title: "First Progress Report",
        due_date: "2025-07-31T00:00:00Z",
        status: "completed",
        description: "Submit first progress report covering initial milestones achieved",
      },
      {
        id: "ms-c003",
        title: "Mid-term Review",
        due_date: "2025-11-30T00:00:00Z",
        status: "completed",
        description: "Comprehensive mid-term review of project progress and deliverables",
      },
      {
        id: "ms-c004",
        title: "Final Report Submission",
        due_date: "2026-05-31T00:00:00Z",
        status: "completed",
        description: "Submit final project report with all deliverables and outcomes",
      },
      {
        id: "ms-c005",
        title: "Project Closure",
        due_date: "2026-06-30T00:00:00Z",
        status: "completed",
        description: "Final project closure, knowledge transfer, and documentation",
      },
    ],
    created_at: "2025-05-25T00:00:00Z",
    updated_at: "2026-06-28T00:00:00Z",
    progress_pct: 100,
    completed_at: "2026-06-28T00:00:00Z",
  },
];

function milestoneStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CompletedProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">
              {project.title || "Untitled Project"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{project.source_opportunity}</p>
          </div>
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Completed
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Started {formatDate(project.created_at || "")}</span>
          </div>
          {project.completed_at && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Completed {formatDate(project.completed_at)}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Final Progress</span>
            <span className="font-semibold text-emerald-600">{project.progress_pct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${project.progress_pct}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Hide" : "View"} milestones
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <div className="space-y-3">
            {project.milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50"
              >
                {milestoneStatusIcon(m.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{m.title}</p>
                  {m.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{formatDate(m.due_date)}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompletedProjectsPage() {
  const projects = mockCompletedProjects;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Completed Projects</h1>
          <p className="text-slate-500 mt-1">Projects you have finished.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FolderCheck size={18} className="text-emerald-600" />
          <span className="font-semibold">{projects.length}</span> completed
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FolderCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Completed Projects</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Completed projects will appear here once you finish all milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <CompletedProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
