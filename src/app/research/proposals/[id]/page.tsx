"use client";

import { use } from "react";
import { ApplicationLayout } from "@/components/ApplicationLayout";

const RESEARCH_SECTIONS = [
  { key: "literature_review", label: "Literature Review" },
  { key: "hypothesis", label: "Hypothesis" },
  { key: "methodology", label: "Methodology" },
  { key: "expected_outcomes", label: "Expected Outcomes" },
];

export default function ResearchProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ApplicationLayout
      applicationId={id}
      trackType="research"
      opportunityTitle="Research Proposal"
      sections={RESEARCH_SECTIONS}
      backHref="/research/literature"
    />
  );
}
