import React, { useState } from 'react';
import { useFtp } from '../../logic/useFtp';
import { useAdminGalleries } from '../../logic/useGalleries';

export default function AdminFtpInbox() {
    const { status, isLoading, setTargetGallery, processInbox } = useFtp();
    const { tree } = useAdminGalleries();
    const [selectedId, setSelectedId] = useState<number | ''>('');
    const [processing, setProcessing] = useState(false);

    if (isLoading || !status) return <div className="p-4"><span className="loading loading-spinner"></span></div>;

    // Robuste Fallbacks
    const safeGroups = Array.isArray(tree?.groups) ? tree.groups : [];
    const safeRootGalleries = Array.isArray(tree?.root_galleries) ? tree.root_galleries : [];

    const flatGalleries = [
        ...(safeGroups.flatMap(g => Array.isArray(g.galleries) ? g.galleries : [])),
        ...safeRootGalleries
    ];

    const handleSetTarget = async () => {
        await setTargetGallery(selectedId === '' ? null : Number(selectedId));
        setSelectedId('');
    };

    const handleProcess = async () => {
        setProcessing(true);
        const data = await processInbox();
        alert(`Import abgeschlossen. ${data.processed} Bilder wurden verschoben.`);
        setProcessing(false);
    };

    return (
        <div className="card bg-base-200 border border-base-300 mb-8">
            <div className="card-body">
                <h2 className="card-title text-2xl flex items-center gap-2">
                    <span className="iconify mdi--folder-download text-primary"></span> FTP Inbox
                </h2>

                <div className="flex gap-4 items-center bg-base-100 p-4 rounded-box mt-2">
                    <div className="flex-1">
                        <p className="text-sm opacity-70">Dein Upload-Ordner</p>
                        <code className="font-bold">{status.ftp_folder}</code>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-70">Bilder in der Warteschlange</p>
                        <p className={`text-2xl font-bold ${status.file_count > 0 ? 'text-warning' : 'text-success'}`}>
                            {status.file_count}
                        </p>
                    </div>
                </div>

                <div className="divider my-2">Zuordnung</div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="label"><span className="label-text">Aktuelle Ziel-Galerie</span></label>
                        {status.current_target_gallery ? (
                            <div className="alert alert-info shadow-sm p-3">
                                <span>{status.current_target_gallery.name}</span>
                                <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setTargetGallery(null)}>Ändern</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select value={selectedId} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : '')} className="select select-bordered flex-1">
                                    <option value="">-- Ziel-Galerie auswählen --</option>
                                    {flatGalleries.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <button onClick={handleSetTarget} disabled={selectedId === ''} className="btn btn-secondary">Setzen</button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleProcess}
                        disabled={status.file_count === 0 || !status.current_target_gallery || processing}
                        className="btn btn-primary"
                    >
                        {processing ? <span className="loading loading-spinner"></span> : 'Bilder Importieren'}
                    </button>
                </div>

            </div>
        </div>
    );
}