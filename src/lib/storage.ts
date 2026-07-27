const SAVED_GRANTS_KEY = "progio_saved_grants";
const SAVED_SCHOLARSHIPS_KEY = "progio_saved_scholarships";
const PRIVATE_GRANTS_KEY = "progio_private_grants";
const PRIVATE_SCHOLARSHIPS_KEY = "progio_private_scholarships";
const ALERTS_GRANTS_KEY = "progio_alerts_grants";
const ALERTS_SCHOLARSHIPS_KEY = "progio_alerts_scholarships";

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Saved opportunities
export function getSavedGrants() {
  return readList<{ id: string; title: string; provider: string; deadline: string; amount?: string; track: string }>(SAVED_GRANTS_KEY);
}
export function isGrantSaved(id: string) {
  return getSavedGrants().some((g) => g.id === id);
}
export function toggleGrantSaved(item: { id: string; title: string; provider: string; deadline: string; amount?: string; track: string }) {
  const list = getSavedGrants();
  const idx = list.findIndex((g) => g.id === item.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(item);
  writeList(SAVED_GRANTS_KEY, list);
  return idx < 0;
}

export function getSavedScholarships() {
  return readList<{ id: string; title: string; provider: string; deadline: string; amount?: string; track: string }>(SAVED_SCHOLARSHIPS_KEY);
}
export function isScholarshipSaved(id: string) {
  return getSavedScholarships().some((s) => s.id === id);
}
export function toggleScholarshipSaved(item: { id: string; title: string; provider: string; deadline: string; amount?: string; track: string }) {
  const list = getSavedScholarships();
  const idx = list.findIndex((s) => s.id === item.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(item);
  writeList(SAVED_SCHOLARSHIPS_KEY, list);
  return idx < 0;
}

// Private opportunities
export interface PrivateOpportunity {
  id: string;
  title: string;
  provider: string;
  deadline: string;
  award_range: string;
  description: string;
}

export function getPrivateGrants() {
  return readList<PrivateOpportunity>(PRIVATE_GRANTS_KEY);
}
export function addPrivateGrant(item: Omit<PrivateOpportunity, "id">) {
  const list = getPrivateGrants();
  list.push({ ...item, id: `pg-${Date.now()}` });
  writeList(PRIVATE_GRANTS_KEY, list);
}
export function removePrivateGrant(id: string) {
  writeList(PRIVATE_GRANTS_KEY, getPrivateGrants().filter((g) => g.id !== id));
}

export function getPrivateScholarships() {
  return readList<PrivateOpportunity>(PRIVATE_SCHOLARSHIPS_KEY);
}
export function addPrivateScholarship(item: Omit<PrivateOpportunity, "id">) {
  const list = getPrivateScholarships();
  list.push({ ...item, id: `ps-${Date.now()}` });
  writeList(PRIVATE_SCHOLARSHIPS_KEY, list);
}
export function removePrivateScholarship(id: string) {
  writeList(PRIVATE_SCHOLARSHIPS_KEY, getPrivateScholarships().filter((s) => s.id !== id));
}

// Alert preferences
export interface AlertPreference {
  id: string;
  track: "grant" | "scholarship";
  field_of_study: string;
  region: string;
  deadline_urgency: "any" | "1_week" | "1_month" | "3_months";
  created_at: string;
}

export function getAlerts(track: "grant" | "scholarship") {
  const key = track === "grant" ? ALERTS_GRANTS_KEY : ALERTS_SCHOLARSHIPS_KEY;
  return readList<AlertPreference>(key);
}
export function addAlert(track: "grant" | "scholarship", alert: Omit<AlertPreference, "id" | "track" | "created_at">) {
  const key = track === "grant" ? ALERTS_GRANTS_KEY : ALERTS_SCHOLARSHIPS_KEY;
  const list = readList<AlertPreference>(key);
  list.push({ ...alert, id: `alert-${Date.now()}`, track, created_at: new Date().toISOString() });
  writeList(key, list);
}
export function removeAlert(track: "grant" | "scholarship", id: string) {
  const key = track === "grant" ? ALERTS_GRANTS_KEY : ALERTS_SCHOLARSHIPS_KEY;
  writeList(key, readList<AlertPreference>(key).filter((a) => a.id !== id));
}
