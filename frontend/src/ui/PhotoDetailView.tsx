import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '../api';
import { Photo } from './logic/useGallery';
import { useAuth } from '../logic/useAuth';
import { usePhoto } from '../logic/usePhoto';

interface Breadcrumb { name: string; type: 'group' | 'gallery'; full_path?: string; }
interface PhotoContextData { photo: Photo; breadcrumbs: Breadcrumb[]; }

export default function PhotoDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updateMetadata, deletePhoto } = usePhoto();

    const { data, error, isLoading, mutate } = useSWR<PhotoContextData>(
        id ? '/api/photos/' + id + '/context' : null, fetcher
    );

    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [artist, setArtist] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.photo) {
            setTitle(data.photo.title || '');
            setDesc(data.photo.description || '');
            setArtist(data.photo.artist || '');
        }
    }, [data?.photo]);

    if (isLoading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error || !data) return <div className="p-8 text-center text-error">Foto konnte nicht geladen werden oder keine Berechtigung.</div>;

    const { photo, breadcrumbs } = data;
    const canEdit = user?.is_admin || user?.can_edit_metadata;

    const handleSaveMeta = async () => {
        setSaving(true);
        try {
            await updateMetadata(photo.id, title, desc, user?.is_admin ? artist : undefined);
            mutate();
        } catch (e) { alert('Fehler beim Speichern'); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Bild wirklich endgültig löschen?')) return;
        try {
            await deletePhoto(photo.id);
            navigate(-1);
        } catch(e) { alert('Fehler beim Löschen'); }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col md:flex-row h-screen gap-6">
            <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center mb-6 gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost">
                        <span className="iconify mdi--arrow-left text-2xl"></span>
                    </button>
                    <div className="text-sm breadcrumbs flex-1 overflow-hidden">
                        <ul>
                            <li><a onClick={() => navigate('/')}>Dashboard</a></li>
                            {breadcrumbs.map((bc, idx) => (
                                <li key={idx}>
                                    {bc.type === 'gallery' && bc.full_path
                                        ? <a onClick={() => navigate('/' + bc.full_path)} className="font-semibold text-primary">{bc.name}</a>
                                        : <span className="opacity-70">{bc.name}</span>
                                    }
                                </li>
                            ))}
                            <li>{photo.filename}</li>
                        </ul>
                    </div>
                </div>

                <div className="flex-1 bg-base-200 rounded-box flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
                    <img src={photo.url} alt={photo.filename} className="max-w-full max-h-full object-contain rounded drop-shadow-2xl" />
                </div>
            </div>

            <div className="w-full md:w-80 flex flex-col gap-6 pt-16">
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body p-6">
                        <h2 className="card-title text-lg mb-4">IPTC Metadaten</h2>
                        {canEdit ? (
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Titel</span></label>
                                    <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="input input-sm input-bordered" />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Beschreibung</span></label>
                                    <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="textarea textarea-bordered textarea-sm h-24"></textarea>
                                </div>
                                {user?.is_admin && (
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Fotograf / Copyright</span></label>
                                        <input type="text" value={artist} onChange={e=>setArtist(e.target.value)} className="input input-sm input-bordered" />
                                    </div>
                                )}
                                {!user?.is_admin && <div className="text-xs opacity-70 mt-2">Fotograf: {artist || 'Unbekannt'}</div>}
                                <button onClick={handleSaveMeta} disabled={saving} className="btn btn-primary btn-sm w-full mt-4">
                                    {saving ? <span className="loading loading-spinner"></span> : 'In Datenbank & Datei speichern'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-sm">
                                <div><span className="font-bold block text-xs opacity-70">Titel</span>{photo.title || '-'}</div>
                                <div><span className="font-bold block text-xs opacity-70">Beschreibung</span>{photo.description || '-'}</div>
                                <div><span className="font-bold block text-xs opacity-70">Fotograf</span>{photo.artist || '-'}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-sm opacity-50 px-2">
                    <p>Format: {photo.width} x {photo.height}px</p>
                    <p className="truncate">UUID: {photo.lr_uuid}</p>
                </div>

                {user?.is_admin && (
                    <button onClick={handleDelete} className="btn btn-outline btn-error w-full mt-auto">
                        <span className="iconify mdi--trash-can"></span> Bild löschen
                    </button>
                )}
            </div>
        </div>
    );
}
