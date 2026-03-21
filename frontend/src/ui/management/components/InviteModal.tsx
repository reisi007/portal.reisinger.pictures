import { useState } from 'react';
import useSWR from 'swr';
import {apiMutate, fetcher} from '../../../api';

export default function InviteModal({galleryId, onClose}: { galleryId: number, onClose: () => void }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [newLink, setNewLink] = useState('');

    const {data: invites, mutate} = useSWR<{
        id: number,
        name: string,
        token: string
    }[]>(`/api/management/galleries/${galleryId}/invites`, fetcher);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const data = await apiMutate<{
                success: boolean,
                link: string
            }>(`/api/management/galleries/${galleryId}/invites`, 'POST', {name});
            if (data.success) {
                setNewLink(data.link);
                setName('');
                mutate(); // Liste aktualisieren
            }
        } catch {
            alert('Netzwerkfehler');
        }
        setLoading(false);
    };

    const handleUpdate = async (id: number, newName: string) => {
        await apiMutate(`/api/management/invites/${id}`, 'PUT', {name: newName});
        mutate();
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Einladung wirklich widerrufen? Der Link funktioniert dann nicht mehr.')) return;
        await apiMutate(`/api/management/invites/${id}`, 'DELETE');
        mutate();
    };

    const copyLink = (token: string | undefined = undefined) => {
        const url = token ? (window.location.origin + '/invite/' + token) : newLink;
        navigator.clipboard.writeText(url);
        alert('Kopiert!');
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box relative max-w-2xl">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <span className="iconify mdi--link-variant text-info"></span> Einladungen verwalten
                </h3>

                <div className="flex flex-col gap-8">
                    {/* Linke Spalte: Neu generieren */}
                    <div>
                        <h4 className="font-bold mb-2">Neuen Link generieren</h4>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Für wen ist dieser Link? (Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="z.B. Oma Erna"
                                className="input input-sm input-bordered w-full"
                            />
                            <label className="label">
                                <span className="label-text-alt opacity-70 whitespace-normal leading-tight mt-1">Wird hier ein Name eingetragen, muss sich der Gast nicht mehr namentlich anmelden.</span>
                            </label>
                        </div>

                        {newLink ? (
                            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-box">
                                <p className="text-xs font-bold text-success mb-2">Erfolgreich generiert!</p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={newLink}
                                           className="input input-xs input-bordered w-full"/>
                                    <button className="btn btn-xs btn-success text-white"
                                            onClick={() => copyLink()}>Kopieren
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="btn btn-primary btn-sm w-full mt-4" onClick={handleGenerate}
                                    disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Generieren'}
                            </button>
                        )}
                    </div>

                    {/* Rechte Spalte: Vorhandene verwalten */}
                    <div>
                        <h4 className="font-bold mb-2">Bestehende Links</h4>
                        <div className="overflow-y-auto max-h-80 rounded-box border border-base-300">
                            <table className="table table-xs table-pin-rows table-pin-cols w-full">
                                <thead className="bg-base-200">
                                <tr>
                                    <th>Name</th>
                                    <th className="text-right">Aktion</th>
                                </tr>
                                </thead>
                                <tbody>
                                {invites?.map(inv => (
                                    <tr key={inv.id}>
                                        <td className="p-1">
                                            <input
                                                type="text"
                                                className="input input-xs input-ghost w-full focus:bg-base-200"
                                                defaultValue={inv.name || ''}
                                                placeholder="Anonym"
                                                onBlur={e => {
                                                    if (e.target.value !== inv.name) handleUpdate(inv.id, e.target.value);
                                                }}
                                            />
                                        </td>
                                        <td className="text-right p-1 whitespace-nowrap">
                                            <button className="btn btn-xs btn-ghost btn-square text-info"
                                                    title="Link kopieren" onClick={() => copyLink(inv.token)}>
                                                <span className="iconify mdi--content-copy text-base"></span>
                                            </button>
                                            <button className="btn btn-xs btn-ghost btn-square text-error"
                                                    title="Widerrufen" onClick={() => handleDelete(inv.id)}>
                                                <span className="iconify mdi--trash-can text-base"></span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!invites || invites.length === 0) && (
                                    <tr>
                                        <td colSpan={2} className="text-center opacity-50 py-4">Noch keine Einladungen
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="modal-action mt-6">
                    <button className="btn" onClick={onClose}>Schließen</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
