"use client";

import { useContext } from "react";
import { FreemiumContext } from "@/contexts/FreemiumContext";

export function useFreemiumGating() {
  const context = useContext(FreemiumContext);
  if (!context) {
    throw new Error("useFreemiumGating must be used within a FreemiumProvider");
  }
  return context;
}
