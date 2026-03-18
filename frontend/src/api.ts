export const fetcher = async <T>(url: string): Promise<T> => {
    const token = localStorage.getItem('rp_jwt');
    const res = await fetch(url, {
        headers: {
            'Authorization': token ? "Bearer " + token : '',
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json() as Promise<T>;
};
