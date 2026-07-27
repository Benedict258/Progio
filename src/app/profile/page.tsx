"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Building2,
  BookOpen,
  GraduationCap,
  Globe,
  Wallet,
  FolderOpen,
  Sparkles,
  X,
} from "lucide-react";
import { GatedContent } from "@/components/GatedContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Profile {
  id: string;
  name: string;
  email: string;
  institution: string | null;
  field_of_study: string | null;
  level: string | null;
  region: string | null;
  funding_needs: Record<string, number> | null;
  past_projects: Array<{ title: string; year: number; outcome: string }> | null;
  profile_completion_pct: number;
}

interface AIFillResult {
  institution: string | null;
  field_of_study: string | null;
  level: string | null;
  region: string | null;
  funding_needs: Record<string, number> | null;
  past_projects: Array<{ title: string; year: number; outcome: string }> | null;
  raw_text_preview: string;
  confidence: Record<string, string>;
}

const LEVELS = ["Bachelors", "Masters", "PhD", "Postdoc"];
const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "West Africa",
  "East Africa",
  "Asia",
  "Oceania",
  "Global",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIFillResult | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    field_of_study: "",
    level: "",
    region: "",
    funding_needs_json: "{}",
    past_projects_json: "[]",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        institution: data.institution || "",
        field_of_study: data.field_of_study || "",
        level: data.level || "",
        region: data.region || "",
        funding_needs_json: data.funding_needs
          ? JSON.stringify(data.funding_needs, null, 2)
          : "{}",
        past_projects_json: data.past_projects
          ? JSON.stringify(data.past_projects, null, 2)
          : "[]",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      let funding_needs = null;
      let past_projects = null;

      try {
        const parsed = JSON.parse(formData.funding_needs_json);
        if (Object.keys(parsed).length > 0) funding_needs = parsed;
      } catch {
        /* keep null */
      }

      try {
        const parsed = JSON.parse(formData.past_projects_json);
        if (Array.isArray(parsed) && parsed.length > 0) past_projects = parsed;
      } catch {
        /* keep null */
      }

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          institution: formData.institution || null,
          field_of_study: formData.field_of_study || null,
          level: formData.level || null,
          region: formData.region || null,
          funding_needs,
          past_projects,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch {
      setMessage({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleAiFill(file: File) {
    setAiLoading(true);
    setAiResult(null);
    setShowAiPreview(false);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/profile/ai-fill`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "AI extraction failed");
      }

      const result: AIFillResult = await res.json();
      setAiResult(result);
      setShowAiPreview(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "AI extraction failed.",
      });
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiResult) return;
    setFormData((prev) => ({
      ...prev,
      institution: aiResult.institution || prev.institution,
      field_of_study: aiResult.field_of_study || prev.field_of_study,
      level: aiResult.level || prev.level,
      region: aiResult.region || prev.region,
      funding_needs_json: aiResult.funding_needs
        ? JSON.stringify(aiResult.funding_needs, null, 2)
        : prev.funding_needs_json,
      past_projects_json: aiResult.past_projects
        ? JSON.stringify(aiResult.past_projects, null, 2)
        : prev.past_projects_json,
    }));
    setShowAiPreview(false);
    setAiResult(null);
    setMessage({ type: "success", text: "AI suggestions applied. Review and save." });
  }

  function ProgressBar({ pct }: { pct: number }) {
    const color =
      pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700">
            Profile Completion
          </span>
          <span className="text-sm font-semibold text-slate-900">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-64" />
          <div className="mt-8 h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile</h1>
        <p className="text-slate-600">Manage your account and preferences.</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {profile && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <ProgressBar pct={profile.profile_completion_pct} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-900">
                Account Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-900">
                Academic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                  placeholder="University or institution"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) =>
                    setFormData({ ...formData, field_of_study: e.target.value })
                  }
                  placeholder="e.g. Computational Biology"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} /> Level
                  </span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Globe size={14} /> Region
                  </span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-900">
                Funding Needs (JSON)
              </h3>
            </div>
            <textarea
              value={formData.funding_needs_json}
              onChange={(e) =>
                setFormData({ ...formData, funding_needs_json: e.target.value })
              }
              rows={4}
              placeholder='{"tuition": 15000, "research": 25000, "living": 10000}'
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-900">
                Past Projects (JSON)
              </h3>
            </div>
            <textarea
              value={formData.past_projects_json}
              onChange={(e) =>
                setFormData({ ...formData, past_projects_json: e.target.value })
              }
              rows={4}
              placeholder='[{"title": "Project Name", "year": 2024, "outcome": "published"}]'
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-6">
          <GatedContent feature="ai_fill_cv">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-900">
                  AI Profile Fill
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Upload your CV, transcript, or academic document and let AI
                extract your profile information.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.csv,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAiFill(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload CV / Transcript
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                PDF, TXT, MD, CSV, DOC, DOCX (max 10MB)
              </p>
            </div>
          </GatedContent>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3">
              Field Checklist
            </h3>
            <div className="space-y-2">
              {[
                { label: "Institution", filled: !!formData.institution },
                { label: "Field of Study", filled: !!formData.field_of_study },
                { label: "Level", filled: !!formData.level },
                { label: "Region", filled: !!formData.region },
                {
                  label: "Funding Needs",
                  filled: formData.funding_needs_json !== "{}",
                },
                {
                  label: "Past Projects",
                  filled: formData.past_projects_json !== "[]",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.filled ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    {item.filled && (
                      <CheckCircle size={12} className="text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      item.filled ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>

      {showAiPreview && aiResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">
                    AI Extraction Results
                  </h3>
                </div>
                <button
                  onClick={() => setShowAiPreview(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Review the extracted fields below. You can apply them to your
                profile or dismiss.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Institution", value: aiResult.institution, key: "institution" },
                {
                  label: "Field of Study",
                  value: aiResult.field_of_study,
                  key: "field_of_study",
                },
                { label: "Level", value: aiResult.level, key: "level" },
                { label: "Region", value: aiResult.region, key: "region" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">
                      {item.label}
                    </label>
                    {aiResult.confidence[item.key] && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          aiResult.confidence[item.key] === "high"
                            ? "bg-emerald-100 text-emerald-700"
                            : aiResult.confidence[item.key] === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {aiResult.confidence[item.key]} confidence
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    {item.value || (
                      <span className="text-slate-400 italic">
                        Not detected
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {aiResult.raw_text_preview && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Extracted Text Preview
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {aiResult.raw_text_preview}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowAiPreview(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={applyAiResult}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Apply to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
