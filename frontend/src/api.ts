let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshToken = async (): Promise<string | null> => {
    // Return existing promise if a refresh is already in progress to avoid concurrent refresh calls
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        const token = localStorage.getItem('rp_jwt');
        if (!token) return null;

        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                // Token totally expired or blacklisted
                localStorage.removeItem('rp_jwt');
                return null;
            }

            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('rp_jwt', data.access_token);
                return data.access_token;
            }
            return null;
        } catch (e) {
            localStorage.removeItem('rp_jwt');
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

const getHeaders = (token: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

export const fetcher = async <T>(url: string): Promise<T> => {
    let token = localStorage.getItem('rp_jwt');
    let res = await fetch(url, { headers: getHeaders(token) });

    // Intercept 401 Unauthorized for silent refresh
    if (res.status === 401 && token && !url.includes('/api/auth/')) {
        const newToken = await refreshToken();
        if (newToken) {
            // Retry original request with the new token
            res = await fetch(url, { headers: getHeaders(newToken) });
        }
    }

    if (!res.ok) throw new Error('API Error');
    return res.json() as Promise<T>;
};

export const apiMutate = async <T>(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> => {
    let token = localStorage.getItem('rp_jwt');
    let res = await fetch(url, {
        method,
        headers: getHeaders(token),
        body: body ? JSON.stringify(body) : undefined
    });

    // Intercept 401 Unauthorized for silent refresh
    if (res.status === 401 && token && !url.includes('/api/auth/')) {
        const newToken = await refreshToken();
        if (newToken) {
            // Retry original mutation with the new token
            res = await fetch(url, {
                method,
                headers: getHeaders(newToken),
                body: body ? JSON.stringify(body) : undefined
            });
        }
    }

    if (!res.ok) throw new Error('API Error');
    const text = await res.text();
    return text ? JSON.parse(text) : {} as T;
};