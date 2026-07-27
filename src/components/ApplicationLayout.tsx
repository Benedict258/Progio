"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Save, Send, CheckCircle2, Clock, Loader2 } from "lucide-react";
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
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: <Clock size={14} /> },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: <Send size={14} /> },
  won: { label: "Awarded", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={14} /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <Clock size={14} /> },
};

export function ApplicationLayout({
  applicationId,
  trackType,
  opportunityTitle,
  sections,
  backHref,
}: ApplicationLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.key || "");
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sectionContent }),
      });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Submit this application? You won't be able to edit it after submission.")) return;
    setSubmitting(true);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sectionContent }),
      });
      const res = await fetch(`/api/applications/${applicationId}/status`, {
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

  const statusInfo = statusConfig[status] || statusConfig.draft;

  return (
    <div className="flex h-screen bg-slate-50">
      <SectionSidebar
        sections={sections}
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
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
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
          </div>
        </header>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {sections.find((s) => s.key === activeSection)?.label}
              </h2>
              <AICoWriterButton
                trackType={trackType}
                sectionKey={activeSection}
                onStream={(content) => handleContentUpdate(activeSection, content)}
              />
            </div>

            <ProseMirrorEditor
              content={sectionContent[activeSection] || ""}
              onUpdate={(html) => handleContentUpdate(activeSection, html)}
              placeholder={`Write your ${sections.find((s) => s.key === activeSection)?.label || "section"} here...`}
            />

            <p className="mt-3 text-xs text-slate-400">
              Tip: Use the AI Co-Writer to generate a first draft, then refine it with your own voice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
