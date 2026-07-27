"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Lock, Calendar, DollarSign } from "lucide-react";
import { getPrivateScholarships, addPrivateScholarship, removePrivateScholarship, type PrivateOpportunity } from "@/lib/storage";

export default function MyPrivateScholarshipsPage() {
  const [items, setItems] = useState<PrivateOpportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [deadline, setDeadline] = useState("");
  const [awardRange, setAwardRange] = useState("");
  const [description, setDescription] = useState("");

  const refresh = () => setItems(getPrivateScholarships());

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = () => {
    if (!title.trim() || !provider.trim()) return;
    addPrivateScholarship({
      title: title.trim(),
      provider: provider.trim(),
      deadline: deadline || "TBD",
      award_range: awardRange.trim(),
      description: description.trim(),
    });
    refresh();
    setShowForm(false);
    setTitle("");
    setProvider("");
    setDeadline("");
    setAwardRange("");
    setDescription("");
  };

  const handleRemove = (id: string) => {
    removePrivateScholarship(id);
    refresh();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Private Scholarships</h1>
          <p className="text-slate-600">Manually add scholarship opportunities not in the database.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Opportunity
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Private Scholarship</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Women in STEM Scholarship"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider *</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Society of Women Engineers"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Award Range</label>
              <input
                type="text"
                value={awardRange}
                onChange={(e) => setAwardRange(e.target.value)}
                placeholder="e.g. $5,000 - $25,000"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the opportunity..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !provider.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Opportunity
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
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No private scholarships</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Add scholarship opportunities you found outside the platform to keep everything in one place.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
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
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-500 mt-2">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-4"
                  title="Remove"
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
