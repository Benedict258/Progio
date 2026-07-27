"use client";

import { use } from "react";
import { ApplicationLayout } from "@/components/ApplicationLayout";

const SCHOLARSHIP_SECTIONS = [
  { key: "personal_statement", label: "Personal Statement" },
  { key: "academic_goals", label: "Academic Goals" },
  { key: "leadership", label: "Leadership" },
  { key: "recommendations", label: "Recommendations" },
];

export default function ScholarshipApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ApplicationLayout
      applicationId={id}
      trackType="scholarship"
      opportunityTitle="Scholarship Application"
      sections={SCHOLARSHIP_SECTIONS}
      backHref="/scholarships/all"
    />
  );
}
