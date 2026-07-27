"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Search,
  Copy,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

interface Citation {
  id: string;
  paper_id: string | null;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal: string;
  keywords: string[];
  doi: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
}

interface ResearchProject {
  id: string;
  user_id: string;
  title: string;
  notes: { content?: string; sections?: { title: string; content: string }[] } | null;
  citations: Citation[] | null;
  linked_application_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function ResearchProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesContent, setNotesContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddCitation, setShowAddCitation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [searching, setSearching] = useState(false);
  const [citationStyle, setCitationStyle] = useState<"APA" | "MLA" | "IEEE">("APA");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/research/projects/${id}`);
      const data = await res.json();
      setProject(data);
      setNotesContent(data.notes?.content || "");
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/research/projects/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notesContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  };

  const searchPapers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch("http://localhost:8000/api/research/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const addCitation = async (paper: Paper) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/research/projects/${id}/citations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paper_id: paper.id,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            journal: paper.journal,
            volume: paper.volume || null,
            issue: paper.issue || null,
            pages: paper.pages || null,
            doi: paper.doi || null,
          }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        setSearchResults([]);
        setSearchQuery("");
        setShowAddCitation(false);
      }
    } catch (err) {
      console.error("Failed to add citation:", err);
    }
  };

  const removeCitation = async (citationId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/research/projects/${id}/citations/${citationId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
      }
    } catch (err) {
      console.error("Failed to remove citation:", err);
    }
  };

  const formatCitation = (citation: Citation, style: string) => {
    if (style === "APA") {
      const authors = citation.authors.length > 3
        ? citation.authors.slice(0, 3).join(", ") + ", et al."
        : citation.authors.length > 1
          ? citation.authors.slice(0, -1).join(", ") + ", & " + citation.authors[citation.authors.length - 1]
          : citation.authors[0];
      const vol = citation.volume ? `, ${citation.volume}` : "";
      const issue = citation.issue ? `(${citation.issue})` : "";
      const pages = citation.pages ? `, ${citation.pages}` : "";
      return `${authors} (${citation.year}). ${citation.title}. ${citation.journal}${vol}${issue}${pages}.`;
    }

    if (style === "MLA") {
      const author = citation.authors.length > 1 ? `${citation.authors[0]}, et al.` : citation.authors[0];
      const vol = citation.volume ? `, vol. ${citation.volume}` : "";
      const issue = citation.issue ? `, no. ${citation.issue}` : "";
      const pages = citation.pages ? `, pp. ${citation.pages}` : "";
      return `${author}. "${citation.title}." ${citation.journal}${vol}${issue}, ${citation.year}${pages}.`;
    }

    if (style === "IEEE") {
      const formattedAuthors = citation.authors.slice(0, 6).map((a) => {
        const parts = a.trim().split(" ");
        if (parts.length >= 2) {
          const initials = parts.slice(0, -1).map((p) => `${p[0]}.`).join(" ");
          return `${initials} ${parts[parts.length - 1]}`;
        }
        return a;
      });
      let authorStr = formattedAuthors.join(", ");
      if (citation.authors.length > 6) authorStr += ", et al.";
      const vol = citation.volume ? `vol. ${citation.volume}` : "";
      const issue = citation.issue ? `, no. ${citation.issue}` : "";
      const pages = citation.pages ? `, pp. ${citation.pages}` : "";
      return `${authorStr}, "${citation.title}," ${citation.journal}, ${vol}${issue}${pages}, ${citation.year}.`;
    }

    return "";
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12 text-slate-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12 text-slate-500">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/research/projects"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {project.citations?.length || 0} citation
            {(project.citations?.length || 0) !== 1 ? "s" : ""} • Created{" "}
            {new Date(project.created_at || "").toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Research Notes</h2>
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            <textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Start writing your research notes here..."
              className="w-full p-4 min-h-[400px] text-sm text-slate-700 placeholder-slate-400 focus:outline-none resize-y"
            />
          </div>
        </div>

        {/* Citations Section */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Citations</h2>
              <button
                onClick={() => setShowAddCitation(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">Format:</span>
                <select
                  value={citationStyle}
                  onChange={(e) =>
                    setCitationStyle(e.target.value as "APA" | "MLA" | "IEEE")
                  }
                  className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="APA">APA</option>
                  <option value="MLA">MLA</option>
                  <option value="IEEE">IEEE</option>
                </select>
              </div>

              {project.citations && project.citations.length > 0 ? (
                <div className="space-y-3">
                  {project.citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="bg-slate-50 p-3 rounded-lg group"
                    >
                      <p className="text-xs text-slate-700 font-mono leading-relaxed">
                        {formatCitation(citation, citationStyle)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              formatCitation(citation, citationStyle),
                              citation.id
                            )
                          }
                          className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-medium hover:bg-slate-50"
                        >
                          {copiedId === citation.id ? (
                            <Check size={10} />
                          ) : (
                            <Copy size={10} />
                          )}
                          Copy
                        </button>
                        <button
                          onClick={() => removeCitation(citation.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-white border border-red-200 text-red-600 rounded text-[10px] font-medium hover:bg-red-50"
                        >
                          <Trash2 size={10} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No citations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Citation Modal */}
      {showAddCitation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Add Citation</h3>
              <button
                onClick={() => {
                  setShowAddCitation(false);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchPapers()}
                    placeholder="Search for papers to add..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={searchPapers}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {searchResults.length > 0 ? (
                searchResults.map((paper) => (
                  <div
                    key={paper.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <h4 className="font-medium text-slate-900 text-sm">{paper.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {paper.authors.join(", ")} • {paper.journal} • {paper.year}
                    </p>
                    <button
                      onClick={() => addCitation(paper)}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Plus size={12} />
                      Add Citation
                    </button>
                  </div>
                ))
              ) : searchQuery && !searching ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No results found. Try a different search.
                </p>
              ) : (
                <p className="text-center text-sm text-slate-500 py-8">
                  Search for papers to add as citations to this project.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
