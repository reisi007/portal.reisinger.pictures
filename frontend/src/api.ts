export const fetcher = async <T>(url: string): Promise<T> => {
    const token = localStorage.getItem('rp_jwt');
    const res = await fetch(url, {
        headers: {
            'Authorization': token ? "Bearer " + token : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json() as Promise<T>;
};

export const apiMutate = async <T>(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> => {
    const token = localStorage.getItem('rp_jwt');
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? "Bearer " + token : ''
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error('API Error');
    const text = await res.text();
    return text ? JSON.parse(text) : {} as T;
};