import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../logic/useAuth';
import { useAdminGalleries, GalleryGroup } from '../../logic/useGalleries';
import { useSearch } from '../../logic/useSearch';
import Sidebar from '../components/Sidebar';
import GalleryModals from '../components/GalleryModals';
import AdminUserView from './AdminUserView';
import AdminSettingsView from './AdminSettingsView';
import AdminFtpInbox from './AdminFtpInbox';
import AdminStatsView from './AdminStatsView';
import AdminMailTemplatesView from './AdminMailTemplatesView';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { tree, isLoading, isError, createGroup, createGallery, deleteGallery } = useAdminGalleries();
    const [searchQuery, setSearchQuery] = useState('');
    const { results: searchResults } = useSearch(searchQuery);
    
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [isGalleryModalOpen, setGalleryModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'structure' | 'users' | 'settings' | 'stats' | 'mail-templates'>('structure');

    const flattenGroups = (groups: GalleryGroup[], depth = 0): {id: number, name: string, depth: number}[] => {
        let flat: {id: number, name: string, depth: number}[] = [];
        for (const g of groups) {
            flat.push({ id: g.id, name: g.name, depth });
            if (g.children) flat = flat.concat(flattenGroups(g.children, depth + 1));
        }
        return flat;
    };

    return (
        <div className="flex h-screen bg-base-100">
            <Sidebar 
                userEmail={user!.email} tree={tree} isLoading={isLoading} isError={isError} onLogout={logout} 
                onOpenGalleryModal={() => setGalleryModalOpen(true)} onOpenGroupModal={() => setGroupModalOpen(true)}
                onDeleteGallery={deleteGallery} onGenerateInvite={() => {}} onSendEmail={() => {}}
                onViewChange={setCurrentView} currentView={currentView}
            />
            <main className="flex-1 overflow-y-auto flex flex-col">
                <header className="p-6 bg-base-100 border-b border-base-300 sticky top-0 z-10 flex gap-4">
                    <div className="relative flex-1 max-w-2xl">
                        <input type="text" placeholder="Suche in allen Galerien..." className="input input-bordered w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchQuery.length >= 2 && searchResults && (
                            <div className="absolute top-14 left-0 w-full bg-base-100 shadow-2xl rounded-box border border-base-300 z-50">
                                <ul className="menu p-2">
                                    {searchResults.galleries.map(g => <li key={g.id}><a onClick={() => navigate('/' + g.full_path)}>📁 {g.name}</a></li>)}
                                    {searchResults.photos.map(p => <li key={p.id}><a onClick={() => navigate('/photos/' + p.id)}>{p.filename}</a></li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </header>
                
                {currentView === 'users' && <AdminUserView />}
                {currentView === 'settings' && <AdminSettingsView />}
                {currentView === 'stats' && <AdminStatsView />}
                {currentView === 'mail-templates' && <AdminMailTemplatesView />}
                {currentView === 'structure' && (
                    <div className="p-10">
                        <AdminFtpInbox />
                        <h1 className="text-4xl font-bold mb-4">Galerie Struktur</h1>
                        <p className="opacity-70">Wähle links eine Galerie aus der Struktur aus oder erstelle neue Gruppen.</p>
                    </div>
                )}
            </main>
            <GalleryModals 
                availableGroups={tree ? flattenGroups(tree.groups) : []}
                isGroupModalOpen={isGroupModalOpen} setGroupModalOpen={setGroupModalOpen}
                isGalleryModalOpen={isGalleryModalOpen} setGalleryModalOpen={setGalleryModalOpen}
                onCreateGroup={createGroup} onCreateGallery={createGallery}
            />
        </div>
    );
}
