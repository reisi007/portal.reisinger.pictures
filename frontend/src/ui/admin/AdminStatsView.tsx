import React, { useState } from 'react';
import { useStats } from '../../logic/useStats';

export default function AdminStatsView() {
    const [page, setPage] = useState(1);
    const { stats, logs, isLoading } = useStats(page);

    if (isLoading && !stats) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="p-10 max-w-6xl mx-auto w-full">
            <h1 className="text-4xl font-bold mb-6">Statistiken & Audit-Logs</h1>

            {/* Kacheln (Statistiken) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="stat bg-base-200 rounded-box border border-base-300 shadow-sm">
                    <div className="stat-title text-base-content/70">Zugeordnete Galerien</div>
                    <div className="stat-value text-primary">{stats?.galleries_count || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-box border border-base-300 shadow-sm">
                    <div className="stat-title text-base-content/70">Downloads Gesamt</div>
                    <div className="stat-value text-secondary">{stats?.total_downloads || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-box border border-base-300 shadow-sm">
                    <div className="stat-title text-base-content/70">Anonyme Gäste</div>
                    <div className="stat-value text-accent">{stats?.guest_downloads || 0}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Linke Seite: Domain Auswertung */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-200 border border-base-300 shadow-sm">
                        <div className="card-body p-6">
                            <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                                <span className="iconify mdi--domain text-primary"></span> Top Domains
                            </h2>
                            <ul className="menu bg-base-100 p-0 rounded-box border border-base-300">
                                {stats?.domain_stats.map((d, i) => (
                                    <li key={i} className="border-b border-base-300 last:border-0">
                                        <a className="flex justify-between cursor-default hover:bg-base-100">
                                            <span className="font-semibold text-sm">@{d.domain}</span>
                                            <span className="badge badge-sm badge-primary">{d.count}</span>
                                        </a>
                                    </li>
                                ))}
                                {(!stats?.domain_stats || stats.domain_stats.length === 0) && (
                                    <li className="disabled p-4 text-center text-sm opacity-50">Noch keine registrierten Firmen-Downloads.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Rechte Seite: Log Tabelle */}
                <div className="lg:col-span-3">
                    <div className="card bg-base-200 border border-base-300 shadow-sm">
                        <div className="card-body p-0 overflow-hidden">
                            <div className="p-4 border-b border-base-300 flex items-center gap-2">
                                <span className="iconify mdi--format-list-bulleted text-xl text-primary"></span>
                                <h2 className="font-bold text-lg">Letzte Aktivitäten</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Datum / Zeit</th>
                                            <th>Benutzer / Gast</th>
                                            <th>Galerie</th>
                                            <th>Datei</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs?.data.map(log => (
                                            <tr key={log.id}>
                                                <td className="whitespace-nowrap text-xs opacity-70">
                                                    {new Date(log.created_at).toLocaleString('de-DE')}
                                                </td>
                                                <td className="font-bold">{log.user_name_snapshot || 'Anonymer Gast'}</td>
                                                <td>{log.gallery_name_snapshot || '-'}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        {log.item_type === 'full_zip' 
                                                            ? <span className="badge badge-secondary badge-xs">ZIP</span>
                                                            : <span className="badge badge-accent badge-xs">JPG</span>}
                                                        <span className="truncate max-w-[150px] text-xs" title={log.item_identifier}>
                                                            {log.item_identifier}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!logs?.data || logs.data.length === 0) && (
                                            <tr><td colSpan={4} className="text-center opacity-50 py-8">Noch keine Downloads aufgezeichnet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {logs && logs.last_page > 1 && (
                                <div className="flex justify-between items-center p-4 border-t border-base-300 bg-base-100">
                                    <button className="btn btn-sm btn-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&larr; Zurück</button>
                                    <span className="text-sm font-semibold">Seite {page} von {logs.last_page}</span>
                                    <button className="btn btn-sm btn-outline" disabled={page === logs.last_page} onClick={() => setPage(p => p + 1)}>Weiter &rarr;</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
