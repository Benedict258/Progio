"use client";

import { useState } from "react";
import { Search, BookOpen, ExternalLink, Copy, Check, ChevronDown } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal: string;
  keywords: string[];
  doi: string | null;
  relevance_score: number | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
}

export default function LiteratureDiscoveryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [formatStyle, setFormatStyle] = useState<"APA" | "MLA" | "IEEE">("APA");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFormatDropdown, setShowFormatDropdown] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/research/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCitation = (paper: Paper, style: string) => {
    const citation = {
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      journal: paper.journal,
      volume: paper.volume || null,
      issue: paper.issue || null,
      pages: paper.pages || null,
      doi: paper.doi || null,
    };

    if (style === "APA") {
      const authors = paper.authors.length > 3
        ? paper.authors.slice(0, 3).join(", ") + ", et al."
        : paper.authors.length > 1
          ? paper.authors.slice(0, -1).join(", ") + ", & " + paper.authors[paper.authors.length - 1]
          : paper.authors[0];
      const vol = paper.volume ? `, ${paper.volume}` : "";
      const issue = paper.issue ? `(${paper.issue})` : "";
      const pages = paper.pages ? `, ${paper.pages}` : "";
      return `${authors} (${paper.year}). ${paper.title}. ${paper.journal}${vol}${issue}${pages}.`;
    }

    if (style === "MLA") {
      const author = paper.authors.length > 1 ? `${paper.authors[0]}, et al.` : paper.authors[0];
      const vol = paper.volume ? `, vol. ${paper.volume}` : "";
      const issue = paper.issue ? `, no. ${paper.issue}` : "";
      const pages = paper.pages ? `, pp. ${paper.pages}` : "";
      return `${author}. "${paper.title}." ${paper.journal}${vol}${issue}, ${paper.year}${pages}.`;
    }

    if (style === "IEEE") {
      const formattedAuthors = paper.authors.slice(0, 6).map((a) => {
        const parts = a.trim().split(" ");
        if (parts.length >= 2) {
          const initials = parts.slice(0, -1).map((p) => `${p[0]}.`).join(" ");
          return `${initials} ${parts[parts.length - 1]}`;
        }
        return a;
      });
      let authorStr = formattedAuthors.join(", ");
      if (paper.authors.length > 6) authorStr += ", et al.";
      const vol = paper.volume ? `vol. ${paper.volume}` : "";
      const issue = paper.issue ? `, no. ${paper.issue}` : "";
      const pages = paper.pages ? `, pp. ${paper.pages}` : "";
      return `${authorStr}, "${paper.title}," ${paper.journal}, ${vol}${issue}${pages}, ${paper.year}.`;
    }

    return "";
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToProject = async (paper: Paper) => {
    alert(`Saved "${paper.title}" to your research project!`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Literature Discovery</h1>
        <p className="text-slate-500 mt-1">AI-powered search for academic papers and literature.</p>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for papers, topics, or keywords..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {results.length} Results Found
          </h2>
          {results.map((paper) => (
            <div
              key={paper.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {paper.authors.join(", ")}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{paper.journal}</span>
                    <span>•</span>
                    <span>{paper.year}</span>
                    {paper.relevance_score !== null && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">
                          {paper.relevance_score.toFixed(1)}% relevance
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                    {paper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {paper.keywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowFormatDropdown(
                          showFormatDropdown === paper.id ? null : paper.id
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Format Citation
                      <ChevronDown size={14} />
                    </button>
                    {showFormatDropdown === paper.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-32">
                        {(["APA", "MLA", "IEEE"] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => {
                              setFormatStyle(style);
                              setSelectedPaper(paper);
                              setShowFormatDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveToProject(paper)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Save to Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Citation Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {formatStyle} Citation
              </h3>
              <button
                onClick={() => setSelectedPaper(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-700 font-mono leading-relaxed">
                {formatCitation(selectedPaper, formatStyle)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  copyToClipboard(
                    formatCitation(selectedPaper, formatStyle),
                    selectedPaper.id
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {copiedId === selectedPaper.id ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy to Clipboard
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Search for Literature
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Enter keywords, topics, or paper titles to discover relevant academic
            papers using AI-powered search.
          </p>
        </div>
      )}
    </div>
  );
}
