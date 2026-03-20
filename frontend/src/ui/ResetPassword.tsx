import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiMutate } from '../api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password !== passwordConfirm) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }

        if (password.length < 8) {
            setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        setLoading(true);
        try {
            await apiMutate('/api/auth/reset-password', 'POST', { email, token, password });
            alert('Passwort erfolgreich gesetzt! Du kannst dich nun anmelden.');
            navigate('/login');
        } catch(err: any) {
            setError(err.message || 'Fehler beim Setzen des Passworts. Evtl. ist der Link abgelaufen.');
        }
        setLoading(false);
    };

    if (!token || !email) {
        return <div className="p-8 text-center text-error">Ungültiger Link. Token oder E-Mail fehlen.</div>;
    }

    return (
        <div className="flex h-screen items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl font-bold mb-2 text-primary">Account Setup</h2>
                    <p className="text-sm opacity-70 mb-4">Setze ein neues Passwort für den Account <strong>{email}</strong>.</p>
                    
                    {error && <div className="alert alert-error text-sm py-2 mb-4 shadow-sm">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Neues Passwort</span></label>
                            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Passwort bestätigen</span></label>
                            <input type="password" required minLength={8} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="input input-bordered" />
                        </div>
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Passwort speichern'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
