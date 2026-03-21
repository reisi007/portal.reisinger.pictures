import React, { useState } from 'react';

interface GalleryModalsProps {
    availableGroups: {id: number, name: string, depth: number, is_public: boolean | null}[];
    isGroupModalOpen: boolean;
    setGroupModalOpen: (open: boolean) => void;
    isGalleryModalOpen: boolean;
    setGalleryModalOpen: (open: boolean) => void;
    onCreateGroup: (name: string, isPublic: boolean | null, parentId?: number | null) => Promise<void>;
    onCreateGallery: (name: string, type: 'selection'|'delivery', isLive: boolean, isPublic: boolean, parentId?: number|null, pw?: string, exp?: string) => Promise<void>;
}

export default function GalleryModals({ availableGroups, isGroupModalOpen, setGroupModalOpen, isGalleryModalOpen, setGalleryModalOpen, onCreateGroup, onCreateGallery }: GalleryModalsProps) {
    // Flow State
    const [returnToGallery, setReturnToGallery] = useState(false);

    // Group State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupIsPublic, setNewGroupIsPublic] = useState<'null'|'true'|'false'>('null');
    const [groupParentId, setGroupParentId] = useState<number | ''>('');

    // Gallery State
    const [newGalleryName, setNewGalleryName] = useState('');
    const [newGalleryType, setNewGalleryType] = useState<'selection' | 'delivery'>('delivery');
    const [newGalleryIsPublic, setNewGalleryIsPublic] = useState(false);
    const [newGalleryIsLive, setNewGalleryIsLive] = useState(false);
    const [galleryParentId, setGalleryParentId] = useState<number | ''>('');
    const [newGalleryPassword, setNewGalleryPassword] = useState('');
    const [newGalleryExpiresAt, setNewGalleryExpiresAt] = useState('');

    const closeGroupModal = () => {
        setGroupModalOpen(false); 
        if(returnToGallery) { 
            setGalleryModalOpen(true); 
            setReturnToGallery(false); 
        }
    };

    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        
        const isPub = newGroupIsPublic === 'null' ? null : newGroupIsPublic === 'true';
        await onCreateGroup(newGroupName, isPub, groupParentId === '' ? null : Number(groupParentId));
        
        setNewGroupName(''); 
        setGroupParentId(''); 
        setNewGroupIsPublic('null');
        closeGroupModal();
    };

    const handleGallerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGalleryName.trim()) return;
        await onCreateGallery(newGalleryName, newGalleryType, newGalleryIsLive, newGalleryIsPublic, galleryParentId === '' ? null : Number(galleryParentId), newGalleryPassword, newGalleryExpiresAt);
        setNewGalleryName(''); 
        setNewGalleryType('delivery'); 
        setNewGalleryIsPublic(false);
        setNewGalleryIsLive(false); 
        setGalleryParentId(''); 
        setNewGalleryPassword(''); 
        setNewGalleryExpiresAt(''); 
        setGalleryModalOpen(false);
    };

    const handleTypeChange = (val: 'selection' | 'delivery') => {
        setNewGalleryType(val);
        if (val === 'selection') {
            setNewGalleryIsLive(false);
        }
    };

    const selectedParent = availableGroups.find(g => g.id === (galleryParentId === '' ? null : Number(galleryParentId)));
    const forcedVisibility = selectedParent?.is_public;
    const isVisibilityForced = forcedVisibility !== undefined && forcedVisibility !== null;

    return (
        <>
            {/* Modal: Neue Meta-Galerie */}
            <dialog className={`modal ${isGroupModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box relative">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeGroupModal}>✕</button>
                    <h3 className="font-bold text-lg mb-4">Neue Meta-Galerie erstellen</h3>
                    <form onSubmit={handleGroupSubmit}>
                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text font-bold">Name der Meta-Galerie</span></label>
                            <input type="text" required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="input input-bordered w-full" />
                        </div>
                        
                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text font-bold">Sichtbarkeits-Vorgabe</span></label>
                            <select value={newGroupIsPublic} onChange={e => setNewGroupIsPublic(e.target.value as any)} className="select select-bordered w-full">
                                <option value="null">Keine Vorgabe (Unterordner entscheiden selbst)</option>
                                <option value="false">Privat erzwingen (Nur mit Link / Passwort)</option>
                                <option value="true">Öffentlich erzwingen (Für alle sichtbar)</option>
                            </select>
                        </div>

                        <div className="form-control w-full mb-6">
                            <label className="label"><span className="label-text font-bold">Übergeordnete Meta-Galerie</span></label>
                            <select value={groupParentId} onChange={e => setGroupParentId(e.target.value ? Number(e.target.value) : '')} className="select select-bordered w-full">
                                <option value="">-- Keine --</option>
                                {availableGroups.map(g => <option key={g.id} value={g.id}>{'- '.repeat(g.depth)}{g.name}</option>)}
                            </select>
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={closeGroupModal}>Abbrechen</button>
                            <button type="submit" className="btn btn-primary">Erstellen</button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop"></div>
            </dialog>

            {/* Modal: Neue Galerie */}
            <dialog className={`modal ${isGalleryModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl relative">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setGalleryModalOpen(false)}>✕</button>
                    <div className="flex justify-between items-center mb-6 mr-8">
                        <h3 className="font-bold text-lg">Neue Galerie erstellen</h3>
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => { setGalleryModalOpen(false); setReturnToGallery(true); setGroupModalOpen(true); }}>
                            Ordner / Meta-Galerie erstellen
                        </button>
                    </div>

                    <form onSubmit={handleGallerySubmit}>
                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text font-bold">Name der Galerie</span></label>
                            <input type="text" required value={newGalleryName} onChange={e => setNewGalleryName(e.target.value)} className="input input-bordered w-full" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="form-control w-full md:w-1/2">
                                <label className="label"><span className="label-text font-bold">Galerie-Typ</span></label>
                                <select required value={newGalleryType} onChange={e => handleTypeChange(e.target.value as 'selection'|'delivery')} className="select select-bordered w-full">
                                    <option value="delivery">Delivery (Downloads)</option>
                                    <option value="selection">Auswahl (Ratings)</option>
                                </select>
                            </div>
                            <div className="form-control w-full md:w-1/2">
                                <label className="label">
                                    <span className="label-text font-bold">Sichtbarkeit</span>
                                    {isVisibilityForced && <span className="label-text-alt text-warning">Wird durch Meta-Galerie erzwungen</span>}
                                </label>
                                <select 
                                    required 
                                    disabled={isVisibilityForced}
                                    value={isVisibilityForced ? (forcedVisibility ? 'true' : 'false') : (newGalleryIsPublic ? 'true' : 'false')} 
                                    onChange={e => setNewGalleryIsPublic(e.target.value === 'true')} 
                                    className="select select-bordered w-full"
                                >
                                    <option value="false">Privat (Nur mit Link / Passwort)</option>
                                    <option value="true">Öffentlich (Für alle sichtbar)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-control w-full mb-4">
                            <label className="label"><span className="label-text font-bold">In welchem Ordner soll die Galerie liegen?</span></label>
                            <select value={galleryParentId} onChange={e => setGalleryParentId(e.target.value ? Number(e.target.value) : '')} className="select select-bordered w-full">
                                <option value="">-- Oberste Ebene (Root) --</option>
                                {availableGroups.map(g => <option key={g.id} value={g.id}>{'- '.repeat(g.depth)}{g.name}</option>)}
                            </select>
                        </div>

                        {newGalleryType === 'delivery' && (
                            <div className="form-control w-full mb-4">
                                <label className="cursor-pointer label justify-start gap-4 bg-base-200 p-3 rounded-box">
                                    <input type="checkbox" checked={newGalleryIsLive} onChange={e => setNewGalleryIsLive(e.target.checked)} className="checkbox checkbox-error" />
                                    <div>
                                        <span className="label-text font-bold block">LIVE Galerie</span>
                                        <span className="label-text-alt opacity-70">Die Galerie aktualisiert sich für Besucher automatisch alle 10s.</span>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="form-control w-full md:w-1/2">
                                <label className="label"><span className="label-text font-bold">Passwort</span></label>
                                <input type="text" value={newGalleryPassword} onChange={e => setNewGalleryPassword(e.target.value)} className="input input-bordered w-full" placeholder="Leer = Nur Magic Link" />
                            </div>
                            <div className="form-control w-full md:w-1/2">
                                <label className="label"><span className="label-text font-bold">Ablaufdatum</span></label>
                                <input type="date" value={newGalleryExpiresAt} onChange={e => setNewGalleryExpiresAt(e.target.value)} className="input input-bordered w-full" />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={() => setGalleryModalOpen(false)}>Abbrechen</button>
                            <button type="submit" className="btn btn-primary">Galerie erstellen</button>
                        </div>
                    </form>
                </div>
                <div className="modal-backdrop"></div>
            </dialog>
        </>
    );
}