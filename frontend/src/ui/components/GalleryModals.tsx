import React, { useState } from 'react';
import { GalleryGroup } from '../../logic/useGalleries';

interface GalleryModalsProps {
    availableGroups: {id: number, name: string, depth: number}[];
    isGroupModalOpen: boolean;
    setGroupModalOpen: (open: boolean) => void;
    isGalleryModalOpen: boolean;
    setGalleryModalOpen: (open: boolean) => void;
    onCreateGroup: (name: string, parentId?: number | null) => Promise<void>;
    onCreateGallery: (name: string, type: 'selection'|'delivery', isLive: boolean, parentId?: number|null, pw?: string, exp?: string) => Promise<void>;
}

export default function GalleryModals({ availableGroups, isGroupModalOpen, setGroupModalOpen, isGalleryModalOpen, setGalleryModalOpen, onCreateGroup, onCreateGallery }: GalleryModalsProps) {
    // Group State
    const [newGroupName, setNewGroupName] = useState('');
    const [groupParentId, setGroupParentId] = useState<number | ''>('');

    // Gallery State
    const [newGalleryName, setNewGalleryName] = useState('');
    const [newGalleryType, setNewGalleryType] = useState<'selection' | 'delivery'>('selection');
    const [newGalleryIsLive, setNewGalleryIsLive] = useState(false);
    const [galleryParentId, setGalleryParentId] = useState<number | ''>('');
    const [newGalleryPassword, setNewGalleryPassword] = useState('');
    const [newGalleryExpiresAt, setNewGalleryExpiresAt] = useState('');

    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        await onCreateGroup(newGroupName, groupParentId === '' ? null : Number(groupParentId));
        setNewGroupName(''); setGroupParentId(''); setGroupModalOpen(false);
    };

    const handleGallerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGalleryName.trim()) return;
        await onCreateGallery(newGalleryName, newGalleryType, newGalleryIsLive, galleryParentId === '' ? null : Number(galleryParentId), newGalleryPassword, newGalleryExpiresAt);
        setNewGalleryName(''); setNewGalleryType('selection'); setNewGalleryIsLive(false); setGalleryParentId(''); setNewGalleryPassword(''); setNewGalleryExpiresAt(''); setGalleryModalOpen(false);
    };

    return (
        <>
            {/* Modal: Neue Gruppe */}
            <dialog className={`modal ${isGroupModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Neue Gruppe erstellen</h3>
                    <form onSubmit={handleGroupSubmit}>
                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text">Name der Gruppe</span></label>
                            <input type="text" required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="input input-bordered w-full" />
                        </div>
                        <div className="form-control w-full mb-6">
                            <label className="label"><span className="label-text">Übergeordnete Gruppe</span></label>
                            <select value={groupParentId} onChange={e => setGroupParentId(e.target.value ? Number(e.target.value) : '')} className="select select-bordered w-full">
                                <option value="">-- Keine --</option>
                                {availableGroups.map(g => <option key={g.id} value={g.id}>{'- '.repeat(g.depth)}{g.name}</option>)}
                            </select>
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setGroupModalOpen(false)}>Abbrechen</button>
                            <button type="submit" className="btn btn-primary">Erstellen</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={() => setGroupModalOpen(false)}><button>close</button></form>
            </dialog>

            {/* Modal: Neue Galerie */}
            <dialog className={`modal ${isGalleryModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Neue Galerie erstellen</h3>
                    <form onSubmit={handleGallerySubmit}>
                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text">Name der Galerie</span></label>
                            <input type="text" required value={newGalleryName} onChange={e => setNewGalleryName(e.target.value)} className="input input-bordered w-full" />
                        </div>
                        
                        <div className="flex gap-4 mb-4">
                            <div className="form-control w-1/2">
                                <label className="label"><span className="label-text">Galerie-Typ</span></label>
                                <select value={newGalleryType} onChange={e => setNewGalleryType(e.target.value as 'selection'|'delivery')} className="select select-bordered w-full">
                                    <option value="selection">Auswahl (Ratings)</option>
                                    <option value="delivery">Delivery (Downloads)</option>
                                </select>
                            </div>
                            <div className="form-control w-1/2">
                                <label className="label"><span className="label-text">Gruppe</span></label>
                                <select value={galleryParentId} onChange={e => setGalleryParentId(e.target.value ? Number(e.target.value) : '')} className="select select-bordered w-full">
                                    <option value="">-- Keine --</option>
                                    {availableGroups.map(g => <option key={g.id} value={g.id}>{'- '.repeat(g.depth)}{g.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-control w-full mb-4">
                            <label className="cursor-pointer label justify-start gap-4">
                                <input type="checkbox" checked={newGalleryIsLive} onChange={e => setNewGalleryIsLive(e.target.checked)} className="checkbox checkbox-error" />
                                <span className="label-text font-bold">LIVE Galerie (Automatischer Refresh alle 10s)</span>
                            </label>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="form-control w-1/2">
                                <label className="label"><span className="label-text">Passwort (Optional)</span></label>
                                <input type="text" value={newGalleryPassword} onChange={e => setNewGalleryPassword(e.target.value)} className="input input-bordered w-full" />
                            </div>
                            <div className="form-control w-1/2">
                                <label className="label"><span className="label-text">Ablaufdatum (Optional)</span></label>
                                <input type="date" value={newGalleryExpiresAt} onChange={e => setNewGalleryExpiresAt(e.target.value)} className="input input-bordered w-full" />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setGalleryModalOpen(false)}>Abbrechen</button>
                            <button type="submit" className="btn btn-primary">Erstellen</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={() => setGalleryModalOpen(false)}><button>close</button></form>
            </dialog>
        </>
    );
}
