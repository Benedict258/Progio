"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { getSavedGrants, toggleGrantSaved } from "@/lib/storage";

interface SavedItem {
  id: string;
  title: string;
  provider: string;
  deadline: string;
  amount?: string;
  track: string;
}

export default function SavedGrantsPage() {
  const [saved, setSaved] = useState<SavedItem[]>([]);

  useEffect(() => {
    setSaved(getSavedGrants());
  }, []);

  const handleRemove = (id: string) => {
    const item = saved.find((s) => s.id === id);
    if (item) {
      toggleGrantSaved(item);
      setSaved(getSavedGrants());
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Saved Grants</h1>
        <p className="text-slate-600">Grants you have bookmarked for later.</p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved grants</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-4">
            Browse grants and click the bookmark icon to save opportunities for later.
          </p>
          <Link
            href="/grants/all"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Grants
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{item.provider}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                    {item.amount && (
                      <span className="inline-flex items-center gap-1.5">
                        <DollarSign size={14} className="text-slate-400" />
                        {item.amount}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      Due {item.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href="/grants/all"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View <ArrowRight size={12} />
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
