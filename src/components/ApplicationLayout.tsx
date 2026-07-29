"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Save, Send, CheckCircle2, Clock, Loader2, Trophy, Upload, History, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SectionSidebar, Section } from "./SectionSidebar";
import { ProseMirrorEditor } from "./Editor";
import { AICoWriterButton } from "./AICoWriterButton";
import { cn } from "@/lib/utils";

interface ApplicationLayoutProps {
  applicationId: string;
  trackType: "grant" | "scholarship" | "research";
  opportunityTitle: string;
  sections: Section[];
  backHref: string;
  onSectionsChange?: (sections: Section[]) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: <Clock size={14} /> },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: <Send size={14} /> },
  won: { label: "Awarded", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={14} /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <Clock size={14} /> },
};

interface TemplateSection {
  key: string;
  label: string;
  description: string;
  word_limit: number | null;
}

export function ApplicationLayout({
  applicationId,
  trackType,
  opportunityTitle,
  sections,
  backHref,
  onSectionsChange,
}: ApplicationLayoutProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sections[0]?.key || "");
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingWon, setMarkingWon] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionHistory, setVersionHistory] = useState<Array<{ timestamp: string; sections: Record<string, string>; status: string }>>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const lastSavedContent = useRef<Record<string, string>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateUrl, setTemplateUrl] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [parsingTemplate, setParsingTemplate] = useState(false);
  const [currentSections, setCurrentSections] = useState<Section[]>(sections);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/applications/${applicationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
          if (data.version_history) setVersionHistory(data.version_history);
          if (data.sections) {
            setSectionContent(data.sections);
            lastSavedContent.current = data.sections;
          }
        }
      } catch {
        // keep default
      }
    };
    fetchStatus();
  }, [applicationId]);

  const refreshVersionHistory = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/applications/${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.version_history) setVersionHistory(data.version_history);
      }
    } catch {
      // ignore
    }
  }, [applicationId]);

  const autoSave = useCallback(async (content: Record<string, string>) => {
    const hasChanges = JSON.stringify(content) !== JSON.stringify(lastSavedContent.current);
    if (!hasChanges) return;
    setSaveStatus("saving");
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: content }),
      });
      lastSavedContent.current = { ...content };
      setSaveStatus("saved");
      refreshVersionHistory();
    } catch {
      setSaveStatus("idle");
    }
  }, [applicationId, refreshVersionHistory]);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave(sectionContent);
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [sectionContent, autoSave]);

  const handleRestoreVersion = async (version: { sections: Record<string, string>; status: string }) => {
    setSectionContent(version.sections);
    setShowVersionHistory(false);
    setSaveStatus("idle");
    lastSavedContent.current = { ...version.sections };
  };

  const handleContentUpdate = useCallback(
    (key: string, html: string) => {
      setSectionContent((prev) => ({ ...prev, [key]: html }));
      if (html.replace(/<[^>]*>/g, "").trim().length > 20) {
        setCompletedSections((prev) => new Set([...prev, key]));
      }
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sectionContent }),
      });
      lastSavedContent.current = { ...sectionContent };
      setSaveStatus("saved");
      refreshVersionHistory();
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("idle");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Submit this application? You won't be able to edit it after submission.")) return;
    setSubmitting(true);
    try {
      await fetch(`http://localhost:8000/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sectionContent }),
      });
      const res = await fetch(`http://localhost:8000/api/applications/${applicationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });
      if (res.ok) setStatus("submitted");
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsWon = async () => {
    if (!confirm("Mark this application as won? This will create a new project and cannot be undone.")) return;
    setMarkingWon(true);
    try {
      const res = await fetch(`http://localhost:8000/api/applications/${applicationId}/mark-won`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setStatus("won");
        router.push("/projects");
      }
    } catch (err) {
      console.error("Mark as won failed:", err);
    } finally {
      setMarkingWon(false);
    }
  };

  const handleParseTemplate = async () => {
    setParsingTemplate(true);
    try {
      let res: Response;
      if (templateFile) {
        const formData = new FormData();
        formData.append("file", templateFile);
        res = await fetch("http://localhost:8000/api/opportunities/parse-template-file", {
          method: "POST",
          body: formData,
        });
      } else if (templateUrl.trim()) {
        res = await fetch("http://localhost:8000/api/opportunities/parse-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: templateUrl }),
        });
      } else {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const newSections: Section[] = (data.sections || []).map((s: TemplateSection) => ({
          key: s.key,
          label: s.label,
        }));
        if (newSections.length > 0) {
          setCurrentSections(newSections);
          setActiveSection(newSections[0].key);
          onSectionsChange?.(newSections);
        }
        setTemplateOpen(false);
        setTemplateUrl("");
        setTemplateFile(null);
      }
    } catch (err) {
      console.error("Template parse failed:", err);
    } finally {
      setParsingTemplate(false);
    }
  };

  const statusInfo = statusConfig[status] || statusConfig.draft;
  const canMarkAsWon = status === "draft" || status === "submitted";

  return (
    <div className="flex h-screen bg-slate-50">
      <SectionSidebar
        sections={currentSections}
        activeSection={activeSection}
        completedSections={completedSections}
        onSelect={setActiveSection}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href={backHref}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {opportunityTitle}
              </h1>
              <p className="text-xs text-slate-500 capitalize">{trackType} Application</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 size={12} />
                Saved ✓
              </span>
            )}

            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                statusInfo.color
              )}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>

            <button
              onClick={() => setTemplateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Upload size={14} />
              Import Template
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>

            <button
              onClick={() => {
                refreshVersionHistory();
                setShowVersionHistory(!showVersionHistory);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <History size={14} />
              Version History
            </button>

            {status === "draft" && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            )}

            {canMarkAsWon && (
              <button
                onClick={handleMarkAsWon}
                disabled={markingWon}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {markingWon ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                Mark as Won
              </button>
            )}
          </div>
        </header>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {currentSections.find((s) => s.key === activeSection)?.label}
              </h2>
              <AICoWriterButton
                applicationId={applicationId}
                trackType={trackType}
                sectionKey={activeSection}
                onStream={(content) => handleContentUpdate(activeSection, content)}
              />
            </div>

            <ProseMirrorEditor
              content={sectionContent[activeSection] || ""}
              onUpdate={(html) => handleContentUpdate(activeSection, html)}
              placeholder={`Write your ${currentSections.find((s) => s.key === activeSection)?.label || "section"} here...`}
              applicationId={applicationId}
            />

            <p className="mt-3 text-xs text-slate-400">
              Tip: Use the AI Co-Writer to generate a first draft. Select any text to access AI refinement tools for tone, length, and content adjustments.
            </p>
          </div>
        </div>
      </div>

      {templateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Import Donor Template</h3>
              <button
                onClick={() => { setTemplateOpen(false); setTemplateUrl(""); setTemplateFile(null); }}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Template URL</label>
                <input
                  type="url"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://example.com/grant-template"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="text-center text-xs text-slate-400">or</div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Upload File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <button
                onClick={handleParseTemplate}
                disabled={parsingTemplate || (!templateUrl.trim() && !templateFile)}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {parsingTemplate ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Parsing...
                  </span>
                ) : (
                  "Parse & Import"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Version History</h2>
            <button
              onClick={() => setShowVersionHistory(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {versionHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No previous versions yet. Versions are saved automatically as you edit.</p>
            ) : (
              <div className="space-y-3">
                {[...versionHistory].reverse().map((version, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">
                        {new Date(version.timestamp).toLocaleString()}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        version.status === "draft" ? "bg-slate-200 text-slate-600" :
                        version.status === "submitted" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-200 text-slate-600"
                      )}>
                        {version.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mb-2">
                      {Object.keys(version.sections || {}).length} section(s)
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(version)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
