const API_BASE = '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData - let browser set it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not already on login page, clear token and redirect
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }

  // Handle blob responses (for CSV / PDF / XLSX downloads)
  const contentType = response.headers.get('content-type');
  if (
    contentType &&
    (contentType.includes('application/pdf') ||
      contentType.includes('application/vnd.openxmlformats') ||
      contentType.includes('text/csv'))
  ) {
    if (!response.ok) {
      throw new Error('Error al descargar archivo');
    }
    return (await response.blob()) as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  patch: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
};
