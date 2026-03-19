import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../logic/useAuth';
import { GalleryGroup, Gallery, GalleryTreeResponse } from '../../logic/useGalleries';

interface SidebarProps {
    tree?: GalleryTreeResponse | null;
    isLoading?: boolean;
    isError?: any;
    onOpenGalleryModal?: () => void;
    onOpenGroupModal?: () => void;
    onDeleteGallery?: (id: number) => void;
    onGenerateInvite?: (id: number) => void;
    onSendEmail?: (id: number) => void;
    onViewChange?: (view: any) => void;
    currentView?: string;
    onCloseMobile?: () => void;
}

export default function Sidebar(props: SidebarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderGroup = (group: GalleryGroup) => {
        const safeChildren = Array.isArray(group.children) ? group.children : [];
        const safeGalleries = Array.isArray(group.galleries) ? group.galleries : [];
        return (
            <li key={"group-" + group.id}>
                <details open>
                    <summary className="font-semibold text-base-content/80">📁 {group.name}</summary>
                    <ul>
                        {safeChildren.map(renderGroup)}
                        {safeGalleries.map(renderGallery)}
                    </ul>
                </details>
            </li>
        );
    };

    const renderGallery = (gallery: Gallery) => {
        const isExpired = gallery.expires_at && new Date(gallery.expires_at) < new Date();
        return (
            <li key={"gal-" + gallery.id} className="group">
                <div className="flex justify-between items-center w-full pr-2">
                    <Link to={'/' + gallery.full_path} className={`flex-1 truncate ${isExpired ? 'line-through opacity-50' : ''}`} onClick={props.onCloseMobile}>
                        {gallery.type === 'selection' ? '✨ ' : '📦 '}
                        {gallery.name}
                        {gallery.is_live && <span className="badge badge-error badge-xs ml-2 animate-pulse">LIVE</span>}
                    </Link>
                    {props.onDeleteGallery && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.preventDefault(); props.onSendEmail?.(gallery.id); }} className="btn btn-ghost btn-xs text-primary" title="Link per E-Mail senden">E-Mail</button>
                            <button onClick={(e) => { e.preventDefault(); props.onGenerateInvite?.(gallery.id); }} className="btn btn-ghost btn-xs text-info" title="Link kopieren">Link</button>
                            <button onClick={(e) => { e.preventDefault(); props.onDeleteGallery?.(gallery.id); }} className="btn btn-ghost btn-xs text-error" title="Galerie löschen">Löschen</button>
                        </div>
                    )}
                </div>
            </li>
        );
    };

    const safeGroups = Array.isArray(props.tree?.groups) ? props.tree?.groups : [];
    const safeRootGalleries = Array.isArray(props.tree?.root_galleries) ? props.tree?.root_galleries : [];
    
    // Architektur: Klare Trennung der Nutzer-Modi auf Container-Ebene
    const isAdminOrPhotog = user?.is_admin || user?.is_photographer;
    const isClient = !isAdminOrPhotog && user;
    const isGuest = !user;

    return (
        <aside className="w-80 bg-base-200 flex flex-col h-full shadow-lg border-r border-base-300 z-20 relative shrink-0">
            <div className="p-6 border-b border-base-300 flex justify-between items-start">
                <div>
                    <Link to="/" className="flex items-center gap-3 text-xl font-bold text-primary truncate mb-2 hover:opacity-80 transition-opacity">
                        <img src="/android-chrome-192x192.png" alt="Logo" className="w-8 h-8 rounded shadow-sm bg-base-100" />
                        Reisinger Portal
                    </Link>
                    {user && (
                        <div className="tooltip tooltip-right" data-tip={`Rolle: ${user.roles?.join(', ') || 'Kunde/Gast'}`}>
                            <div className="flex gap-x-2 items-center justify-start">
                                <span className="iconify mdi--account-circle text-xl text-base-content/70 cursor-help"></span>
                                <span className="text-xs text-base-content/70 truncate">{user.email}</span>
                            </div>
                        </div>
                    )}
                </div>
                {props.onCloseMobile && (
                    <button className="btn btn-square btn-sm btn-ghost md:hidden" onClick={props.onCloseMobile}>
                        <span className="iconify mdi--close text-xl"></span>
                    </button>
                )}
            </div>

            <ul className="menu bg-base-200 w-full p-2 border-b border-base-300">
                {/* ADMIN / PHOTOGRAPHER MENU */}
                {isAdminOrPhotog && (
                    <>
                        <li><Link to="/" className={props.currentView === 'structure' ? 'active' : ''} onClick={() => { props.onViewChange?.('structure'); props.onCloseMobile?.(); }}>
                            <span className="iconify mdi--folder-multiple text-lg"></span> Galerie-Struktur
                        </Link></li>
                        {user.is_admin && (
                            <li><a className={props.currentView === 'stats' ? 'active' : ''} onClick={() => { props.onViewChange?.('stats'); props.onCloseMobile?.(); }}>
                                <span className="iconify mdi--chart-box text-lg"></span> Statistiken & Logs
                            </a></li>
                        )}
                        <li><Link to="/search" className={props.currentView === 'search' ? 'active' : ''} onClick={props.onCloseMobile}>
                            <span className="iconify mdi--magnify text-lg"></span> Globale Suche
                        </Link></li>
                    </>
                )}

                {/* CLIENT MENU */}
                {isClient && (
                    <>
                        <li><Link to="/" className={props.currentView !== 'search' ? 'active' : ''} onClick={props.onCloseMobile}>
                            <span className="iconify mdi--folder-account text-lg"></span> Meine Galerien
                        </Link></li>
                        <li><Link to="/search" className={props.currentView === 'search' ? 'active' : ''} onClick={props.onCloseMobile}>
                            <span className="iconify mdi--magnify text-lg"></span> Bilder durchsuchen
                        </Link></li>
                    </>
                )}

                {/* GUEST MENU */}
                {isGuest && (
                    <>
                        <li><Link to="/search" className="active" onClick={props.onCloseMobile}>
                            <span className="iconify mdi--magnify text-lg"></span> Öffentliche Suche
                        </Link></li>
                        <li><Link to="/login" onClick={props.onCloseMobile}>
                            <span className="iconify mdi--login text-lg"></span> Anmelden
                        </Link></li>
                    </>
                )}
            </ul>

            {isAdminOrPhotog && props.currentView === 'structure' && (
                <div className="p-4 flex gap-2 border-b border-base-300">
                    <button onClick={props.onOpenGalleryModal} className="btn btn-primary btn-sm flex-1">
                        <span className="iconify mdi--image-plus"></span> Galerie...
                    </button>
                    <button onClick={props.onOpenGroupModal} className="btn btn-outline btn-sm flex-1">
                        <span className="iconify mdi--folder-plus"></span> Meta-Galerie...
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                {props.isLoading && <div className="text-center"><span className="loading loading-dots loading-md"></span></div>}
                {props.isError && <div className="text-error text-sm">Fehler beim Laden.</div>}
                
                {/* ADMIN TREE */}
                {isAdminOrPhotog && props.currentView === 'structure' && props.tree && (
                    <ul className="menu bg-base-200 w-full rounded-box p-0">
                        {safeGroups.map(renderGroup)}
                        {safeRootGalleries.map(renderGallery)}
                        {(!safeGroups.length && !safeRootGalleries.length) && (
                            <li className="disabled"><span className="text-base-content/50">Keine Galerien gefunden</span></li>
                        )}
                    </ul>
                )}

                {/* CLIENT GALLERIES */}
                {isClient && props.currentView !== 'search' && (
                    <ul className="menu bg-base-200 w-full rounded-box p-0">
                        <li className="menu-title"><span>Freigeschaltet</span></li>
                        {(user as any).my_galleries?.map((g: any) => (
                            <li key={g.id}>
                                <Link to={'/' + g.full_path} onClick={props.onCloseMobile}>
                                    {g.type === 'selection' ? '✨ ' : '📦 '} {g.name}
                                </Link>
                            </li>
                        ))}
                        {!(user as any).my_galleries?.length && (
                            <li className="disabled"><span className="opacity-50">Keine Galerien</span></li>
                        )}
                    </ul>
                )}
            </div>

            {user && (
                <div className="p-6 border-t border-base-300">
                    <button onClick={handleLogout} className="btn btn-outline btn-error w-full">Abmelden</button>
                </div>
            )}
        </aside>
    );
}
