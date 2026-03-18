import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../logic/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

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

    return (
        <div className="flex h-screen items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
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
                </div>
            </div>
        </div>
    );
}
