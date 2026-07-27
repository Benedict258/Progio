"use client";

import { use } from "react";
import { ApplicationLayout } from "@/components/ApplicationLayout";

const GRANT_SECTIONS = [
  { key: "abstract", label: "Abstract" },
  { key: "technical_approach", label: "Technical Approach" },
  { key: "budget", label: "Budget" },
  { key: "impact", label: "Impact" },
  { key: "timeline", label: "Timeline" },
];

export default function GrantApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ApplicationLayout
      applicationId={id}
      trackType="grant"
      opportunityTitle="Grant Application"
      sections={GRANT_SECTIONS}
      backHref="/grants/all"
    />
  );
}
