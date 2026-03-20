import React, { useState, useEffect } from 'react';
import { UserDetailed, Role } from '../../../logic/useUsers';

interface UserPermissionsModalProps {
    user: UserDetailed | null;
    roles?: Role[];
    flatGroups: { id: number; name: string; depth: number }[];
    flatGalleries: { id: number; name: string }[];
    onClose: () => void;
    onSave: (id: number, roles: number[], groups: number[], galleries: number[], canEditMeta: boolean) => Promise<void>;
}

export default function UserPermissionsModal({ user, roles, flatGroups, flatGalleries, onClose, onSave }: UserPermissionsModalProps) {
    const [selRoles, setSelRoles] = useState<number[]>([]);
    const [selGroups, setSelGroups] = useState<number[]>([]);
    const [selGalleries, setSelGalleries] = useState<number[]>([]);
    const [canEditMeta, setCanEditMeta] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setSelRoles(user.roles.map(r => r.id));
            setSelGroups(user.gallery_groups.map(g => g.id));
            setSelGalleries(user.galleries.map(g => g.id));
            setCanEditMeta(user.can_edit_metadata || false);
        }
    }, [user]);

    if (!user) return null;

    const toggleItem = (arr: number[], setArr: any, id: number) => {
        setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
    };

    const handleSave = () => {
        onSave(user.id, selRoles, selGroups, selGalleries, canEditMeta);
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
                <h3 className="font-bold text-2xl mb-1">{user.name} bearbeiten</h3>
                <p className="opacity-70 text-sm mb-6 flex items-center gap-2">
                    <span className="iconify mdi--email-outline"></span> {user.email}
                </p>
                
                <div className="form-control mb-6 bg-base-200 p-4 rounded-box">
                    <label className="cursor-pointer label justify-start gap-4">
                        <input type="checkbox" checked={canEditMeta} onChange={e => setCanEditMeta(e.target.checked)} className="checkbox checkbox-primary" />
                        <div>
                            <span className="label-text font-bold block">Metadaten bearbeiten (IPTC)</span>
                            <span className="label-text-alt opacity-70">Erlaubt diesem User, Bildbeschreibungen im Web zu bearbeiten.</span>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-base-300 rounded-box p-4 h-64 overflow-y-auto">
                        <h4 className="font-bold mb-2 sticky top-0 bg-base-100">Rollen</h4>
                        {roles?.map(r => (
                            <label key={r.id} className="label cursor-pointer justify-start gap-3 p-1">
                                <input type="checkbox" checked={selRoles.includes(r.id)} onChange={() => toggleItem(selRoles, setSelRoles, r.id)} className="checkbox checkbox-sm checkbox-primary" />
                                <span className="label-text">{r.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border border-base-300 rounded-box p-4 h-64 overflow-y-auto">
                        <h4 className="font-bold mb-2 sticky top-0 bg-base-100">Gruppen</h4>
                        {flatGroups.map(g => (
                            <label key={g.id} className="label cursor-pointer justify-start gap-3 p-1">
                                <input type="checkbox" checked={selGroups.includes(g.id)} onChange={() => toggleItem(selGroups, setSelGroups, g.id)} className="checkbox checkbox-sm checkbox-primary" />
                                <span className="label-text">{'- '.repeat(g.depth)}{g.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border border-base-300 rounded-box p-4 h-64 overflow-y-auto">
                        <h4 className="font-bold mb-2 sticky top-0 bg-base-100">Galerien</h4>
                        {flatGalleries.map(g => (
                            <label key={g.id} className="label cursor-pointer justify-start gap-3 p-1">
                                <input type="checkbox" checked={selGalleries.includes(g.id)} onChange={() => toggleItem(selGalleries, setSelGalleries, g.id)} className="checkbox checkbox-sm checkbox-primary" />
                                <span className="label-text truncate" title={g.name}>{g.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="modal-action mt-6">
                    <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
                    <button className="btn btn-primary" onClick={handleSave}>Speichern</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
