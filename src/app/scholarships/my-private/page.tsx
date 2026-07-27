"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Lock,
  Calendar,
  DollarSign,
  Edit3,
  ExternalLink,
  Upload,
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Tag,
  MapPin,
} from "lucide-react";
import {
  fetchPrivateOpportunities,
  createPrivateOpportunity,
  updatePrivateOpportunity,
  deletePrivateOpportunity,
  parseExternalUrl,
  createApplicationFromOpportunity,
  type PrivateOpportunity,
} from "@/lib/api/private-opportunities";

type Tab = "manual" | "import";
type View = "list" | "detail" | "edit";

export default function MyPrivateScholarshipsPage() {
  const router = useRouter();
  const [items, setItems] = useState<PrivateOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<PrivateOpportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [deadline, setDeadline] = useState("");
  const [awardRange, setAwardRange] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [fieldTags, setFieldTags] = useState("");
  const [region, setRegion] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await fetchPrivateOpportunities("scholarship");
      setItems(data);
    } catch {
      setError("Failed to load private scholarships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const resetForm = () => {
    setTitle("");
    setProvider("");
    setDeadline("");
    setAwardRange("");
    setDescription("");
    setEligibility("");
    setFieldTags("");
    setRegion("");
    setSourceUrl("");
    setGuidelines("");
    setImportUrl("");
    setError("");
  };

  const handleManualAdd = async () => {
    if (!title.trim() || !provider.trim()) return;
    try {
      setSubmitting(true);
      const eligibilityObj = eligibility.trim()
        ? { notes: eligibility.trim() }
        : undefined;
      const tags = fieldTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createPrivateOpportunity({
        type: "scholarship",
        title: title.trim(),
        provider: provider.trim(),
        description: description.trim() || undefined,
        eligibility_criteria: eligibilityObj,
        award_range: awardRange.trim() || undefined,
        deadline: deadline || undefined,
        field_tags: tags.length > 0 ? tags : undefined,
        region: region.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        guidelines: guidelines.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
      await refresh();
    } catch {
      setError("Failed to create opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    try {
      setImporting(true);
      setError("");
      const parsed = await parseExternalUrl(importUrl.trim(), "scholarship");
      if (parsed.title) setTitle(parsed.title);
      if (parsed.provider) setProvider(parsed.provider);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.deadline) setDeadline(parsed.deadline);
      if (parsed.award_range) setAwardRange(parsed.award_range);
      if (parsed.field_tags) setFieldTags(parsed.field_tags.join(", "));
      if (parsed.region) setRegion(parsed.region);
      if (parsed.source_url) setSourceUrl(parsed.source_url);
      if (parsed.eligibility_criteria) {
        setEligibility(JSON.stringify(parsed.eligibility_criteria, null, 2));
      }
      setActiveTab("manual");
    } catch {
      setError("Failed to parse URL. You can fill in details manually.");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePrivateOpportunity(id);
      if (selected?.id === id) {
        setView("list");
        setSelected(null);
      }
      await refresh();
    } catch {
      setError("Failed to delete opportunity");
    }
  };

  const handleStartApplication = async (opp: PrivateOpportunity) => {
    try {
      setSubmitting(true);
      const app = await createApplicationFromOpportunity(opp.id, "scholarship");
      router.push(`/scholarships/applications/${app.id}`);
    } catch {
      setError("Failed to create application");
      setSubmitting(false);
    }
  };

  const handleEdit = (opp: PrivateOpportunity) => {
    setSelected(opp);
    setTitle(opp.title);
    setProvider(opp.provider);
    setDeadline(opp.deadline || "");
    setAwardRange(opp.award_range || "");
    setDescription(opp.description || "");
    setEligibility(opp.eligibility_criteria ? JSON.stringify(opp.eligibility_criteria, null, 2) : "");
    setFieldTags(opp.field_tags?.join(", ") || "");
    setRegion(opp.region || "");
    setSourceUrl(opp.source_url || "");
    setGuidelines(opp.guidelines || "");
    setView("edit");
  };

  const handleSaveEdit = async () => {
    if (!selected || !title.trim() || !provider.trim()) return;
    try {
      setSubmitting(true);
      const tags = fieldTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      let eligibilityObj: Record<string, unknown> | undefined = undefined;
      if (eligibility.trim()) {
        try {
          eligibilityObj = JSON.parse(eligibility);
        } catch {
          eligibilityObj = { notes: eligibility.trim() };
        }
      }
      await updatePrivateOpportunity(selected.id, {
        title: title.trim(),
        provider: provider.trim(),
        description: description.trim() || undefined,
        eligibility_criteria: eligibilityObj,
        award_range: awardRange.trim() || undefined,
        deadline: deadline || undefined,
        field_tags: tags.length > 0 ? tags : undefined,
        region: region.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        guidelines: guidelines.trim() || undefined,
      });
      resetForm();
      setView("list");
      setSelected(null);
      await refresh();
    } catch {
      setError("Failed to update opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  // Detail view
  if (view === "detail" && selected) {
    return (
      <div className="p-8 max-w-4xl">
        <button
          onClick={() => { setView("list"); setSelected(null); }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={16} /> Back to list
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full mb-2">
                Scholarship
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{selected.title}</h1>
              <p className="text-slate-600 mt-1">{selected.provider}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(selected)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {selected.deadline && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={16} className="text-slate-400" />
                Deadline: {selected.deadline}
              </div>
            )}
            {selected.award_range && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <DollarSign size={16} className="text-slate-400" />
                {selected.award_range}
              </div>
            )}
            {selected.region && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin size={16} className="text-slate-400" />
                {selected.region}
              </div>
            )}
          </div>

          {selected.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
            </div>
          )}

          {selected.field_tags && selected.field_tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Fields</h3>
              <div className="flex flex-wrap gap-2">
                {selected.field_tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selected.eligibility_criteria && Object.keys(selected.eligibility_criteria).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Eligibility Criteria</h3>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                {Object.entries(selected.eligibility_criteria).map(([k, v]) => (
                  <div key={k} className="flex gap-2 mb-1">
                    <span className="font-medium text-slate-900">{k}:</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.guidelines && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Guidelines</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.guidelines}</p>
            </div>
          )}

          {selected.source_url && (
            <div className="mb-6">
              <a
                href={selected.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
              >
                <ExternalLink size={14} /> View original source
              </a>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 mt-4">
            <button
              onClick={() => handleStartApplication(selected)}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Start Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit view
  if (view === "edit") {
    return (
      <div className="p-8 max-w-4xl">
        <button
          onClick={() => { setView("list"); setSelected(null); resetForm(); }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={16} /> Back to list
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Scholarship Opportunity</h2>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Women in STEM Scholarship" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider *</label>
              <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Society of Women Engineers" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Award Range</label>
              <input type="text" value={awardRange} onChange={(e) => setAwardRange(e.target.value)} placeholder="e.g. $5,000 - $25,000" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. United States" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Field Tags</label>
              <input type="text" value={fieldTags} onChange={(e) => setFieldTags(e.target.value)} placeholder="Comma separated: STEM, Engineering" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Eligibility Criteria</label>
              <textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="Undergraduate, GPA 3.5+, Women in STEM..." rows={2} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Source URL</label>
              <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal Guidelines / Notes</label>
              <textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Your personal notes or application guidelines..." rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={handleSaveEdit} disabled={!title.trim() || !provider.trim() || submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Save Changes
            </button>
            <button onClick={() => { setView("list"); setSelected(null); resetForm(); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Private Scholarships</h1>
          <p className="text-slate-600">Add scholarship opportunities you found outside the platform.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); resetForm(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Scholarship
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 mb-8 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "manual"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} /> Manual Entry
              </span>
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "import"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Upload size={14} /> Import from URL
              </span>
            </button>
          </div>

          <div className="p-6">
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {activeTab === "import" ? (
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Paste a URL to a scholarship page. We&apos;ll extract the key details automatically.
                </p>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://scholarships.example.com/..."
                    className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleImport}
                    disabled={!importUrl.trim() || importing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Import
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Works best with scholarship listing pages. PDF import coming soon.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  {selected ? "Edit Scholarship Opportunity" : "Add Private Scholarship"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Women in STEM Scholarship" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider *</label>
                    <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Society of Women Engineers" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Award Range</label>
                    <input type="text" value={awardRange} onChange={(e) => setAwardRange(e.target.value)} placeholder="e.g. $5,000 - $25,000" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
                    <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. United States" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Field Tags</label>
                    <input type="text" value={fieldTags} onChange={(e) => setFieldTags(e.target.value)} placeholder="Comma separated: STEM, Engineering" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Eligibility Criteria</label>
                    <textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="Undergraduate, GPA 3.5+, Women in STEM..." rows={2} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Source URL</label>
                    <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal Guidelines / Notes</label>
                    <textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Your personal notes or application guidelines..." rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <button onClick={handleManualAdd} disabled={!title.trim() || !provider.trim() || submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Scholarship
                  </button>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opportunity list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Loader2 size={24} className="text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading private scholarships...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No private scholarships</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Add scholarship opportunities you found outside the platform, or import them from a URL.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => { setSelected(item); setView("detail"); }}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    {item.is_parsed && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">Imported</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{item.provider}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                    {item.award_range && (
                      <span className="inline-flex items-center gap-1.5">
                        <DollarSign size={14} className="text-slate-400" />
                        {item.award_range}
                      </span>
                    )}
                    {item.deadline && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        Due {item.deadline}
                      </span>
                    )}
                    {item.region && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {item.region}
                      </span>
                    )}
                  </div>
                  {item.field_tags && item.field_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.field_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">{tag}</span>
                      ))}
                      {item.field_tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">+{item.field_tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-4"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
