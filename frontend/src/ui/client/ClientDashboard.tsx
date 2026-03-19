import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../logic/useAuth';
import { useSearch } from '../../logic/useSearch';

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const { results: searchResults } = useSearch(searchQuery);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-base-200">
            <div className="navbar bg-base-100 shadow-md px-4 md:px-8 flex flex-col md:flex-row gap-4 py-4 md:py-0 h-auto md:h-16 z-50">
                <div className="flex-1 w-full md:w-auto flex justify-between items-center">
                    <a className="text-xl font-bold text-primary">Meine Galerien</a>
                    <div className="md:hidden">
                        <button onClick={logout} className="btn btn-outline btn-sm btn-error">Abmelden</button>
                    </div>
                </div>

                {/* Globale Suche für Kunden */}
                <div className="flex-none w-full md:w-auto flex-1 max-w-xl relative">
                    <input 
                        type="text" 
                        placeholder="Bilder durchsuchen..." 
                        className="input input-sm input-bordered w-full" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    {searchQuery.length >= 2 && searchResults && (
                        <div className="absolute top-10 left-0 w-full bg-base-100 shadow-2xl rounded-box border border-base-300 z-50">
                            <ul className="menu p-2">
                                {searchResults.galleries.map(g => (
                                    <li key={g.id}><a onClick={() => navigate('/' + g.full_path)}>📁 {g.name}</a></li>
                                ))}
                                {searchResults.photos.map(p => (
                                    <li key={p.id}><a onClick={() => navigate('/photos/' + p.id)}>{p.filename}</a></li>
                                ))}
                                {searchResults.galleries.length === 0 && searchResults.photos.length === 0 && (
                                    <li className="disabled"><a>Keine Treffer gefunden</a></li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex-none hidden md:flex items-center ml-4">
                    <span className="mr-4 text-sm opacity-70">{user.email}</span>
                    <button onClick={logout} className="btn btn-outline btn-sm btn-error">Abmelden</button>
                </div>
            </div>
            
            <main className="container mx-auto p-8 relative z-0">
                <h1 className="text-3xl font-bold mb-8">Willkommen zurück, {user.name}!</h1>
                {(user as any).my_galleries?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(user as any).my_galleries.map((g: any) => (
                            <div key={g.id} className="card bg-base-100 shadow-xl cursor-pointer" onClick={() => navigate('/' + g.full_path)}>
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
