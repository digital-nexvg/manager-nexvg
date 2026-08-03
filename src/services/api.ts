function resolveApiBaseUrl() {
  const rawValue = import.meta.env.VITE_API_URL?.trim();

  if (!rawValue) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  const candidate = rawValue.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      const pathname = parsed.pathname.replace(/\/+$/, '');

      if (pathname && pathname !== '/' && !pathname.startsWith('/api')) {
        return `${parsed.origin}${pathname}`;
      }

      return parsed.origin;
    } catch {
      return candidate;
    }
  }

  if (/^[a-z0-9.-]+(\.[a-z0-9.-]+)+(:\d+)?$/i.test(candidate)) {
    return `https://${candidate}`;
  }

  return candidate;
}

const API_BASE_URL = resolveApiBaseUrl();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = API_BASE_URL ? `${API_BASE_URL}/` : `${window.location.origin}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const response = await fetch(new URL(normalizedPath, baseUrl), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = 'Erro na requisição';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      try {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      } catch {
        // noop
      }
    }

    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
