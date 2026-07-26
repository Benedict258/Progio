"use client";

import { useFreemiumGating } from "@/hooks/useFreemiumGating";

interface GatedContentProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GatedContent({ feature, children, fallback }: GatedContentProps) {
  const { isUnlocked } = useFreemiumGating();

  if (isUnlocked(feature)) {
    return <>{children}</>;
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
