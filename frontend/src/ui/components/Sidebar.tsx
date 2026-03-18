import React from 'react';
import { GalleryGroup, Gallery, GalleryTreeResponse } from '../../logic/useGalleries';

interface SidebarProps {
    userEmail: string;
    tree?: GalleryTreeResponse;
    isLoading: boolean;
    isError: any;
    onLogout: () => void;
    onOpenGalleryModal: () => void;
    onOpenGroupModal: () => void;
    onDeleteGallery: (id: number) => void;
    onGenerateInvite: (id: number) => void;
    onSendEmail: (id: number) => void;
}

export default function Sidebar({ userEmail, tree, isLoading, isError, onLogout, onOpenGalleryModal, onOpenGroupModal, onDeleteGallery, onGenerateInvite, onSendEmail }: SidebarProps) {
    const renderGroup = (group: GalleryGroup) => (
        <li key={"group-" + group.id}>
            <details open>
                <summary className="font-semibold text-base-content/80">📁 {group.name}</summary>
                <ul>
                    {group.children?.map(renderGroup)}
                    {group.galleries?.map(renderGallery)}
                </ul>
            </details>
        </li>
    );

    const renderGallery = (gallery: Gallery) => {
        const isExpired = gallery.expires_at && new Date(gallery.expires_at) < new Date();
        return (
            <li key={"gal-" + gallery.id} className="group">
                <div className="flex justify-between items-center w-full pr-2">
                    <a href={`/g/${gallery.slug}`} target="_blank" rel="noreferrer" className={`flex-1 truncate ${isExpired ? 'line-through opacity-50' : ''}`}>
                        {gallery.type === 'selection' ? '✨ ' : '📦 '} 
                        {gallery.name}
                        {gallery.is_live && <span className="badge badge-error badge-xs ml-2 animate-pulse">LIVE</span>}
                    </a>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.preventDefault(); onSendEmail(gallery.id); }} className="btn btn-ghost btn-xs text-primary" title="Link per E-Mail senden">E-Mail</button>
                        <button onClick={(e) => { e.preventDefault(); onGenerateInvite(gallery.id); }} className="btn btn-ghost btn-xs text-info" title="Link kopieren">Link</button>
                        <button onClick={(e) => { e.preventDefault(); onDeleteGallery(gallery.id); }} className="btn btn-ghost btn-xs text-error" title="Galerie löschen">Löschen</button>
                    </div>
                </div>
            </li>
        );
    };

    return (
        <aside className="w-80 bg-base-200 flex flex-col h-full shadow-lg border-r border-base-300 z-20 relative">
            <div className="p-6 border-b border-base-300">
                <h2 className="text-xl font-bold text-primary">Reisinger Portal</h2>
                <p className="text-xs text-base-content/70 mt-1">{userEmail}</p>
            </div>
            <div className="p-4 flex gap-2 border-b border-base-300">
                <button onClick={onOpenGalleryModal} className="btn btn-primary btn-sm flex-1">+ Galerie</button>
                <button onClick={onOpenGroupModal} className="btn btn-outline btn-sm flex-1">+ Gruppe</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && <div className="text-center"><span className="loading loading-dots loading-md"></span></div>}
                {isError && <div className="text-error text-sm">Fehler beim Laden.</div>}
                {tree && (
                    <ul className="menu bg-base-200 w-full rounded-box p-0">
                        <li className="menu-title">Struktur</li>
                        {tree.groups?.map(renderGroup)}
                        {tree.root_galleries?.map(renderGallery)}
                        {(!tree.groups?.length && !tree.root_galleries?.length) && <li className="disabled"><a>Keine Galerien gefunden</a></li>}
                    </ul>
                )}
            </div>
            <div className="p-6 border-t border-base-300">
                <button onClick={onLogout} className="btn btn-outline btn-error w-full">Abmelden</button>
            </div>
        </aside>
    );
}
