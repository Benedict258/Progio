const API_BASE = "http://localhost:8000";

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
  const params = new URLSearchParams({ user_id: USER_ID });
  if (type) params.set("type", type);
  const res = await fetch(`${API_BASE}/api/opportunities/private?${params}`);
  if (!res.ok) throw new Error("Failed to fetch private opportunities");
  return res.json();
}

export async function getPrivateOpportunity(id: string): Promise<PrivateOpportunity> {
  const res = await fetch(`${API_BASE}/api/opportunities/private/${id}`);
  if (!res.ok) throw new Error("Private opportunity not found");
  return res.json();
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
}): Promise<PrivateOpportunity> {
  const res = await fetch(`${API_BASE}/api/opportunities/private`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, user_id: USER_ID }),
  });
  if (!res.ok) throw new Error("Failed to create private opportunity");
  return res.json();
}

export async function updatePrivateOpportunity(
  id: string,
  data: Partial<Omit<PrivateOpportunity, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<PrivateOpportunity> {
  const res = await fetch(`${API_BASE}/api/opportunities/private/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update private opportunity");
  return res.json();
}

export async function deletePrivateOpportunity(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/opportunities/private/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete private opportunity");
}

export async function parseExternalUrl(url: string, type: "grant" | "scholarship" = "grant"): Promise<ParsedExternal> {
  const res = await fetch(`${API_BASE}/api/opportunities/parse-external`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, type }),
  });
  if (!res.ok) throw new Error("Failed to parse external URL");
  return res.json();
}

export async function createApplicationFromOpportunity(
  opportunityId: string,
  type: "grant" | "scholarship"
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: USER_ID, opportunity_id: opportunityId, type }),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}
