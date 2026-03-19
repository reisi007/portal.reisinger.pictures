import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InviteView() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [galleryName, setGalleryName] = useState('');
    const [requiresPassword, setRequiresPassword] = useState(false);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        fetch('/api/invites/' + token)
            .then(res => {
                if (!res.ok) throw new Error('Dieser Einladungslink ist ungültig oder abgelaufen.');
                return res.json();
            })
            .then(data => {
                setGalleryName(data.gallery_name);
                setRequiresPassword(data.requires_password);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const res = await fetch('/api/invites/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, name, email, password })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fehler beim Beitritt.');
            
            localStorage.setItem('rp_jwt', data.access_token);
            navigate('/' + data.full_path, { replace: true });
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    
    if (error && !galleryName) return (
        <div className="flex h-screen items-center justify-center bg-base-200 p-4">
            <div className="alert alert-error shadow-lg max-w-md">
                <span className="iconify mdi--alert-circle text-2xl"></span>
                <span>{error}</span>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-1">Willkommen zur Fotoauswahl</h2>
                    <p className="text-base-content/70 mb-6">Galerie: <strong>{galleryName}</strong></p>
                    
                    {error && <div className="alert alert-error text-sm py-2 mb-4">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Dein Name</span></label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input input-bordered" placeholder="z.B. Maria Muster" />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Deine E-Mail</span></label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered" placeholder="maria@beispiel.de" />
                        </div>
                        
                        {requiresPassword && (
                            <div className="form-control pt-2">
                                <label className="label"><span className="label-text font-bold text-warning">Galerie-Passwort</span></label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input input-bordered input-warning" />
                            </div>
                        )}
                        
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary w-full text-lg">Galerie öffnen</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
