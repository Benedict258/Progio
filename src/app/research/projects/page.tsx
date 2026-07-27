"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Plus, BookOpen, FileText, Calendar } from "lucide-react";

interface ResearchProject {
  id: string;
  user_id: string;
  title: string;
  notes: { content?: string; sections?: { title: string; content: string }[] } | null;
  citations: { id: string; title: string; year: number }[] | null;
  linked_application_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function MyResearchProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/research/projects?user_id=user-001");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("http://localhost:8000/api/research/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-001",
          title: newProjectTitle,
        }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects([newProject, ...projects]);
        setShowCreateModal(false);
        setNewProjectTitle("");
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Research Projects</h1>
          <p className="text-slate-500 mt-1">Manage your ongoing research projects.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Create New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FlaskConical size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Research Projects</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Create your first research project to organize your literature and citations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/research/projects/${project.id}`)}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {project.title}
                  </h3>
                  {project.linked_application_id && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600">
                      <FileText size={12} />
                      <span>Linked to application</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <FlaskConical size={18} className="text-indigo-600" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BookOpen size={14} className="text-slate-400" />
                  <span>
                    {project.citations?.length || 0} citation
                    {(project.citations?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText size={14} className="text-slate-400" />
                  <span>
                    {project.notes?.sections?.length || 0} note
                    {(project.notes?.sections?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={12} />
                <span>Created {formatDate(project.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Create New Research Project</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Enter project title..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectTitle("");
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={creating || !newProjectTitle.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
