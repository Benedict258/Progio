const API_BASE = "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!res.ok) {
      console.warn(`API error: ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    const text = await res.text();
    if (!text) return null as T;
    return JSON.parse(text);
  } catch (err) {
    console.warn(`API connection error for ${path}:`, err);
    return null;
  }
}

export async function apiFetchArray<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T[]> {
  const result = await apiFetch<T[] | { items: T[] }>(path, options);
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "items" in result) {
    return (result as { items: T[] }).items;
  }
  return [];
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: FetchOptions = {}
): Promise<T | null> {
  return apiFetch<T>(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options: FetchOptions = {}
): Promise<T | null> {
  return apiFetch<T>(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(
  path: string,
  options: FetchOptions = {}
): Promise<boolean> {
  try {
    const res = await fetch(buildUrl(path, options.params), {
      ...options,
      method: "DELETE",
    });
    return res.ok;
  } catch {
    console.warn(`API delete error for ${path}`);
    return false;
  }
}

export { API_BASE };
