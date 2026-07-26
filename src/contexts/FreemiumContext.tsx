"use client";

import React, { createContext, useContext } from "react";

interface FreemiumContextType {
  demoMode: boolean;
  isUnlocked: (feature: string) => boolean;
}

const FreemiumContext = createContext<FreemiumContextType | undefined>(undefined);

const DEMO_MODE = true;

export function FreemiumProvider({ children }: { children: React.ReactNode }) {
  const isUnlocked = (feature: string): boolean => {
    if (DEMO_MODE) return true;
    return false;
  };

  return (
    <FreemiumContext.Provider value={{ demoMode: DEMO_MODE, isUnlocked }}>
      {children}
    </FreemiumContext.Provider>
  );
}

export { FreemiumContext, DEMO_MODE };
