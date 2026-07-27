"use client";

import { useState, useEffect } from "react";
import { BookMarked, Copy, Check, Download, ChevronDown, Trash2 } from "lucide-react";

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

interface ResearchProject {
  id: string;
  title: string;
  citations: Citation[];
}

export default function CitationManagerPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [citationStyle, setCitationStyle] = useState<"APA" | "MLA" | "IEEE">("APA");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

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

  const generateBibTeX = (citation: Citation) => {
    const firstAuthor = citation.authors[0] || "unknown";
    const key = firstAuthor.split(" ").pop()?.toLowerCase() || "author" + citation.year;
    const authors = citation.authors.join(" and ");
    return `@article{${key},
  title = {${citation.title}},
  author = {${authors}},
  journal = {${citation.journal}},
  year = {${citation.year}},
  volume = {${citation.volume || ""}},
  number = {${citation.issue || ""}},
  pages = {${citation.pages || ""}},
  doi = {${citation.doi || ""}}
}`;
  };

  const exportBibTeX = () => {
    let bibtex = "";
    projects.forEach((project) => {
      project.citations.forEach((citation) => {
        bibtex += generateBibTeX(citation) + "\n\n";
      });
    });
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "citations.bib";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allCitations = projects.flatMap((p) =>
    p.citations.map((c) => ({ ...c, projectTitle: p.title, projectId: p.id }))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citation Manager</h1>
          <p className="text-slate-500 mt-1">
            Organize and format your citations across research projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={citationStyle}
            onChange={(e) => setCitationStyle(e.target.value as "APA" | "MLA" | "IEEE")}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="APA">APA Style</option>
            <option value="MLA">MLA Style</option>
            <option value="IEEE">IEEE Style</option>
          </select>
          <button
            onClick={exportBibTeX}
            disabled={allCitations.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={14} />
            Export BibTeX
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading citations...</div>
      ) : allCitations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <BookMarked size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Citations Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Add citations from the Literature Discovery page or your Research Projects to
            see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects
            .filter((p) => p.citations && p.citations.length > 0)
            .map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedProject(
                      expandedProject === project.id ? null : project.id
                    )
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {project.citations.length} citation
                      {project.citations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${
                      expandedProject === project.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedProject === project.id && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    {project.citations.map((citation) => (
                      <div
                        key={citation.id}
                        className="bg-slate-50 p-4 rounded-lg"
                      >
                        <p className="text-sm text-slate-700 font-mono leading-relaxed">
                          {formatCitation(citation, citationStyle)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                formatCitation(citation, citationStyle),
                                citation.id
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                          >
                            {copiedId === citation.id ? (
                              <>
                                <Check size={12} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Copy
                              </>
                            )}
                          </button>
                          <span className="text-xs text-slate-400">
                            {citation.year} • {citation.journal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
