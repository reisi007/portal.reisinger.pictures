import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../logic/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [localError, setLocalError] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setLocalError('Login fehlgeschlagen. Bitte prüfe deine Daten.');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim().length >= 2) navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
    };

    return (
        <div className="flex flex-col h-screen items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-2xl mb-8">
                <div className="card-body">
                    <h2 className="card-title text-3xl font-bold mb-2 justify-center text-primary">Portal Login</h2>
                    <p className="text-center text-xs opacity-60 mb-6">Bitte melde dich mit deiner E-Mail Adresse an.</p>
                    {localError && <div className="alert alert-error text-sm py-2 mb-4 shadow-sm">{localError}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">E-Mail</span></label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input input-bordered" placeholder="deine@email.de" />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Passwort</span></label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input input-bordered" />
                        </div>
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary w-full text-lg">Anmelden</button>
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link to="/register" className="link link-hover text-base-content/70">Noch kein Account? Registrieren.</Link>
                    </div>
                </div>
            </div>

            {/* Öffentliche Suche für Gäste */}
            <div className="w-full max-w-sm text-center">
                <div className="divider opacity-50 mb-6">ODER</div>
                <form onSubmit={handleSearch}>
                    <div className="join w-full shadow-sm">
                        <input type="text" placeholder="Öffentliche Galerien suchen..." className="input input-bordered join-item w-full bg-base-100" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <button type="submit" className="btn btn-secondary join-item"><span className="iconify mdi--magnify text-xl"></span></button>
                    </div>
                </form>
            </div>
        </div>
    );
}
