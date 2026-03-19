import React, { useState } from 'react';
import { apiMutate } from '../../../api';

export default function InviteModal({ galleryId, onClose }: { galleryId: number, onClose: () => void }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const data = await apiMutate<{success: boolean, link: string}>(`/api/admin/galleries/${galleryId}/invites`, 'POST', { name });
            if (data.success) {
                setLink(data.link);
            } else {
                alert('Fehler beim Generieren.');
            }
        } catch (e) {
            alert('Netzwerkfehler');
        }
        setLoading(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(link);
        alert('Kopiert!');
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg text-primary">Einladungslink generieren</h3>
                {!link ? (
                    <>
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text font-bold">Für wen ist dieser Link? (Optional)</span>
                            </label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="z.B. Oma Erna" 
                                className="input input-bordered w-full" 
                            />
                            <label className="label">
                                <span className="label-text-alt opacity-70">Wird hier ein Name eingetragen, muss sich der Gast nicht mehr anmelden.</span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
                            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Generieren'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="alert alert-success mt-4 shadow-sm">
                            <span className="iconify mdi--check-circle text-xl"></span>
                            Link erfolgreich generiert!
                        </div>
                        <div className="mt-4 flex gap-2">
                            <input type="text" readOnly value={link} className="input input-bordered w-full" />
                            <button className="btn btn-secondary" onClick={copyLink}>Kopieren</button>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={onClose}>Schließen</button>
                        </div>
                    </>
                )}
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
