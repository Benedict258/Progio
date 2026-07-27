"use client";

import { useState, useMemo } from "react";
import {
  FolderOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
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
  deliverable_deadlines?: {
    milestone_id: string;
    title: string;
    due_date: string;
    status: string;
  }[];
  created_at?: string;
  updated_at?: string;
  progress_pct: number;
  next_milestone?: Milestone;
  title?: string;
  source_opportunity?: string;
}

const mockProjects: Project[] = [
  {
    id: "proj-001",
    user_id: "user-001",
    source_application_id: "app-001",
    status: "active",
    title: "NIH R01 - Computational Genomics for Global Health",
    source_opportunity: "National Institutes of Health",
    milestones: [
      {
        id: "ms-001",
        title: "Project Kickoff",
        due_date: "2026-07-20T00:00:00Z",
        status: "completed",
        description: "Initial project setup, team introduction, and scope confirmation",
      },
      {
        id: "ms-002",
        title: "First Progress Report",
        due_date: "2026-09-15T00:00:00Z",
        status: "in_progress",
        description: "Submit first progress report covering initial milestones achieved",
      },
      {
        id: "ms-003",
        title: "Mid-term Review",
        due_date: "2027-01-15T00:00:00Z",
        status: "pending",
        description: "Comprehensive mid-term review of project progress and deliverables",
      },
      {
        id: "ms-004",
        title: "Final Report Submission",
        due_date: "2027-07-15T00:00:00Z",
        status: "pending",
        description: "Submit final project report with all deliverables and outcomes",
      },
      {
        id: "ms-005",
        title: "Project Closure",
        due_date: "2027-08-15T00:00:00Z",
        status: "pending",
        description: "Final project closure, knowledge transfer, and documentation",
      },
    ],
    deliverable_deadlines: [],
    created_at: "2026-07-13T00:00:00Z",
    updated_at: "2026-07-13T00:00:00Z",
    progress_pct: 20,
    next_milestone: {
      id: "ms-002",
      title: "First Progress Report",
      due_date: "2026-09-15T00:00:00Z",
      status: "in_progress",
    },
  },
  {
    id: "proj-002",
    user_id: "user-001",
    source_application_id: "app-002",
    status: "active",
    title: "Gates Foundation - Global Health Innovation",
    source_opportunity: "Bill & Melinda Gates Foundation",
    milestones: [
      {
        id: "ms-006",
        title: "Project Kickoff",
        due_date: "2026-08-01T00:00:00Z",
        status: "pending",
        description: "Initial project setup, team introduction, and scope confirmation",
      },
      {
        id: "ms-007",
        title: "First Progress Report",
        due_date: "2026-09-28T00:00:00Z",
        status: "pending",
        description: "Submit first progress report covering initial milestones achieved",
      },
      {
        id: "ms-008",
        title: "Mid-term Review",
        due_date: "2027-01-28T00:00:00Z",
        status: "pending",
        description: "Comprehensive mid-term review of project progress and deliverables",
      },
      {
        id: "ms-009",
        title: "Final Report Submission",
        due_date: "2027-07-28T00:00:00Z",
        status: "pending",
        description: "Submit final project report with all deliverables and outcomes",
      },
      {
        id: "ms-010",
        title: "Project Closure",
        due_date: "2027-08-27T00:00:00Z",
        status: "pending",
        description: "Final project closure, knowledge transfer, and documentation",
      },
    ],
    deliverable_deadlines: [],
    created_at: "2026-07-28T00:00:00Z",
    updated_at: "2026-07-28T00:00:00Z",
    progress_pct: 0,
    next_milestone: {
      id: "ms-006",
      title: "Project Kickoff",
      due_date: "2026-08-01T00:00:00Z",
      status: "pending",
    },
  },
];

function milestoneStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

function milestoneStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case "in_progress":
      return <Clock size={16} className="text-blue-600" />;
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

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">
              {project.title || "Untitled Project"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{project.source_opportunity}</p>
          </div>
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Active
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Progress</span>
            <span className="font-semibold text-slate-900">{project.progress_pct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${project.progress_pct}%` }}
            />
          </div>
        </div>

        {project.next_milestone && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Next Milestone</p>
            <p className="text-sm font-medium text-slate-900 mt-1">{project.next_milestone.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <Calendar size={12} />
              Due {formatDate(project.next_milestone.due_date)}
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Hide" : "View"} all milestones
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <div className="space-y-3">
            {project.milestones.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  m.status === "completed"
                    ? "bg-emerald-50"
                    : m.status === "in_progress"
                    ? "bg-blue-50"
                    : "bg-slate-50"
                )}
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
                  <span
                    className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full",
                      milestoneStatusColor(m.status)
                    )}
                  >
                    {m.status.replace(/_/g, " ")}
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

export default function ProjectsPage() {
  const projects = mockProjects;
  const activeProjects = useMemo(() => projects.filter((p) => p.status === "active"), [projects]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Projects</h1>
          <p className="text-slate-500 mt-1">Your ongoing projects and milestones.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FolderOpen size={18} className="text-indigo-600" />
          <span className="font-semibold">{activeProjects.length}</span> active
        </div>
      </div>

      {activeProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Projects</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            When you mark an application as won, a project will be automatically created with milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
