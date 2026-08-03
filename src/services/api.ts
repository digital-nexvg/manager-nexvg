function resolveApiBaseUrl() {
  const rawValue = import.meta.env.VITE_API_URL?.trim();

  if (!rawValue) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  const candidate = rawValue.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      const pathSegment = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');

      if (pathSegment && !pathSegment.includes('/') && /[a-z0-9.-]+\.[a-z0-9.-]+/i.test(pathSegment)) {
        return `${parsed.protocol}//${pathSegment}`;
      }

      return `${parsed.origin}${parsed.pathname === '/' ? '' : parsed.pathname}`;
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(new URL(normalizedPath, API_BASE_URL || window.location.origin), {
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
