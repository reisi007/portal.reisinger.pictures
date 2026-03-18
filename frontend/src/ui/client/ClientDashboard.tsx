import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../logic/useAuth';

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    if (!user) return null;

    return (
        <div className="min-h-screen bg-base-200">
            <div className="navbar bg-base-100 shadow-md px-4 md:px-8">
                <div className="flex-1"><a className="text-xl font-bold text-primary">Meine Galerien</a></div>
                <div className="flex-none">
                    <span className="mr-4 text-sm opacity-70 hidden md:inline">{user.email}</span>
                    <button onClick={logout} className="btn btn-outline btn-sm btn-error">Abmelden</button>
                </div>
            </div>
            <main className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Willkommen zurück, {user.name}!</h1>
                {(user as any).my_galleries?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(user as any).my_galleries.map((g: any) => (
                            <div key={g.id} className="card bg-base-100 shadow-xl cursor-pointer" onClick={() => navigate("/g/" + g.slug)}>
                                <div className="card-body">
                                    <h2 className="card-title text-primary">{g.type === 'selection' ? '✨ ' : '📦 '} {g.name}</h2>
                                    <div className="card-actions justify-end mt-4"><button className="btn btn-primary btn-sm">Öffnen</button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="alert shadow-lg bg-base-100">
                        <span>Aktuell sind keine Galerien für dich freigeschaltet.</span>
                    </div>
                )}
            </main>
        </div>
    );
}
