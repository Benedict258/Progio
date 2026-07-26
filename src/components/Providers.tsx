"use client";

import { FreemiumProvider } from "@/contexts/FreemiumContext";
import { AppLayout } from "@/components/AppLayout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FreemiumProvider>
      <AppLayout>{children}</AppLayout>
    </FreemiumProvider>
  );
}
