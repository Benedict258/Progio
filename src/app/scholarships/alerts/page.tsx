"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Mail, BellRing } from "lucide-react";
import { getAlerts, addAlert, removeAlert, type AlertPreference } from "@/lib/storage";

const FIELDS_OF_STUDY = [
  "Any",
  "Computer Science",
  "Health Sciences",
  "Engineering",
  "Business",
  "Education",
  "Natural Sciences",
  "Social Sciences",
  "Arts & Humanities",
];

const REGIONS = ["Any", "Africa", "North America", "Europe", "Asia", "Global"];

const URGENCY_OPTIONS = [
  { value: "any", label: "Any deadline" },
  { value: "1_week", label: "Within 1 week" },
  { value: "1_month", label: "Within 1 month" },
  { value: "3_months", label: "Within 3 months" },
] as const;

export default function ScholarshipAlertsPage() {
  const [alerts, setAlerts] = useState<AlertPreference[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fieldOfStudy, setFieldOfStudy] = useState("Any");
  const [region, setRegion] = useState("Any");
  const [deadlineUrgency, setDeadlineUrgency] = useState<"any" | "1_week" | "1_month" | "3_months">("any");

  useEffect(() => {
    setAlerts(getAlerts("scholarship"));
  }, []);

  const handleSave = () => {
    addAlert("scholarship", {
      field_of_study: fieldOfStudy,
      region,
      deadline_urgency: deadlineUrgency,
    });
    setAlerts(getAlerts("scholarship"));
    setShowForm(false);
    setFieldOfStudy("Any");
    setRegion("Any");
    setDeadlineUrgency("any");
  };

  const handleRemove = (id: string) => {
    removeAlert("scholarship", id);
    setAlerts(getAlerts("scholarship"));
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Scholarship Alerts</h1>
          <p className="text-slate-600">Get notified about scholarship opportunities matching your criteria.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New Alert
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Alert Preference</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Field of Study</label>
              <select
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {FIELDS_OF_STUDY.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline Urgency</label>
              <select
                value={deadlineUrgency}
                onChange={(e) => setDeadlineUrgency(e.target.value as typeof deadlineUrgency)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BellRing size={16} />
              Save Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No alerts configured</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Create an alert to get notified when new scholarships match your field and region.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Mail size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {alert.field_of_study} scholarships &middot; {alert.region}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deadline: {URGENCY_OPTIONS.find((o) => o.value === alert.deadline_urgency)?.label} &middot; Created {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(alert.id)}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Remove alert"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
