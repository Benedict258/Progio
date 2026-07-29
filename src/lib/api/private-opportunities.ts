import { apiFetch, apiFetchArray, apiPost, apiPut, apiDelete } from "../api";

export interface PrivateOpportunity {
  id: string;
  user_id: string;
  type: "grant" | "scholarship";
  title: string;
  provider: string;
  description: string | null;
  eligibility_criteria: Record<string, unknown> | null;
  award_range: string | null;
  deadline: string | null;
  field_tags: string[] | null;
  region: string | null;
  source_url: string | null;
  guidelines: string | null;
  is_parsed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ParsedExternal {
  title: string | null;
  provider: string | null;
  description: string | null;
  deadline: string | null;
  award_range: string | null;
  eligibility_criteria: Record<string, unknown> | null;
  field_tags: string[] | null;
  region: string | null;
  source_url: string | null;
}

const USER_ID = "user-001";

export async function fetchPrivateOpportunities(type?: "grant" | "scholarship"): Promise<PrivateOpportunity[]> {
  const params: Record<string, string> = { user_id: USER_ID };
  if (type) params.type = type;
  return apiFetchArray<PrivateOpportunity>("/api/opportunities/private", { params });
}

export async function getPrivateOpportunity(id: string): Promise<PrivateOpportunity | null> {
  return apiFetch<PrivateOpportunity>(`/api/opportunities/private/${id}`);
}

export async function createPrivateOpportunity(data: {
  type: "grant" | "scholarship";
  title: string;
  provider: string;
  description?: string;
  eligibility_criteria?: Record<string, unknown>;
  award_range?: string;
  deadline?: string;
  field_tags?: string[];
  region?: string;
  source_url?: string;
  guidelines?: string;
  is_parsed?: boolean;
}): Promise<PrivateOpportunity | null> {
  return apiPost<PrivateOpportunity>("/api/opportunities/private", {
    ...data,
    user_id: USER_ID,
  });
}

export async function updatePrivateOpportunity(
  id: string,
  data: Partial<Omit<PrivateOpportunity, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<PrivateOpportunity | null> {
  return apiPut<PrivateOpportunity>(`/api/opportunities/private/${id}`, data);
}

export async function deletePrivateOpportunity(id: string): Promise<boolean> {
  return apiDelete(`/api/opportunities/private/${id}`);
}

export async function parseExternalUrl(url: string, type: "grant" | "scholarship" = "grant"): Promise<ParsedExternal | null> {
  return apiPost<ParsedExternal>("/api/opportunities/parse-external", { url, type });
}

export async function createApplicationFromOpportunity(
  opportunityId: string,
  type: "grant" | "scholarship"
): Promise<{ id: string } | null> {
  return apiPost<{ id: string }>("/api/applications", {
    user_id: USER_ID,
    opportunity_id: opportunityId,
    type,
  });
}
