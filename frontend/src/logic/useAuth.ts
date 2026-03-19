import useSWR from 'swr';
import { fetcher } from '../api';

export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    is_photographer: boolean;
    is_pending: boolean;
    can_edit_metadata: boolean;
}

export function useAuth() {
    const { data: user, error, mutate } = useSWR<User>('/api/auth/me', fetcher, {
        shouldRetryOnError: false,
    });

    const login = async (email: string, password: string): Promise<void> => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Login fehlgeschlagen');
        const data = await response.json();
        localStorage.setItem('rp_jwt', data.access_token);
        await mutate();
    };

    const register = async (name: string, email: string, password: string): Promise<void> => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Registrierung fehlgeschlagen');
        }
        const data = await response.json();
        localStorage.setItem('rp_jwt', data.access_token);
        await mutate();
    };

    const logout = (): void => {
        localStorage.removeItem('rp_jwt');
        mutate(undefined, false);
    };

    return { user, isLoading: !error && user === undefined, isError: error, login, register, logout };
}
