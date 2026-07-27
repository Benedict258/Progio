"use client";

import { useFreemiumGating } from "@/hooks/useFreemiumGating";

interface GatedContentProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm ${className}`}
    >
      PRO
    </span>
  );
}

export function GatedContent({ feature, children, fallback }: GatedContentProps) {
  const { isUnlocked, demoMode } = useFreemiumGating();

  if (isUnlocked(feature)) {
    return (
      <div className="relative">
        {demoMode && (
          <div className="absolute -top-1 -right-1 z-10">
            <ProBadge />
          </div>
        )}
        <div
          className={
            demoMode
              ? "ring-1 ring-indigo-100/60 rounded-lg"
              : undefined
          }
        >
          {children}
        </div>
      </div>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="blur-sm select-none pointer-events-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
        <div className="text-center p-6">
          <ProBadge className="mb-2" />
          <p className="text-slate-600 font-medium mb-2">Premium Feature</p>
          <p className="text-slate-400 text-sm mb-4">Unlock this feature to continue</p>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
