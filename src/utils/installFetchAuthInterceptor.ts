const LOCAL_STORAGE_KEY = 'bati_pilot_auth_session';

let installed = false;

export function installFetchAuthInterceptor(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : typeof input === 'object' && input && 'url' in input
        ? String(input.url)
        : '';

    const isSameOriginApi =
      urlStr.startsWith('/api/') ||
      (typeof window.location !== 'undefined' && urlStr.startsWith(`${window.location.origin}/api/`));

    if (!isSameOriginApi) {
      return originalFetch(input, init);
    }

    let token: string | null = null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && typeof parsed.token === 'string') {
          token = parsed.token;
        }
      }
    } catch {
      // ignore storage errors
    }

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const nextInit: RequestInit = {
      ...init,
      headers,
      credentials: init?.credentials || 'include',
    };

    const response = await originalFetch(input, nextInit);

    const isAuthAttempt =
      urlStr.includes('/api/auth/login') ||
      urlStr.includes('/api/auth/register-company') ||
      urlStr.includes('/api/auth/logout');

    if (response.status === 401 && !isAuthAttempt && token) {
      window.dispatchEvent(new CustomEvent('bati-pilot-auth-expired'));
    }

    return response;
  };
}
