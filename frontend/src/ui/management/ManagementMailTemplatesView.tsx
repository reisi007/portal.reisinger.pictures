import React, { useState } from 'react';
import { useEmailTemplates, EmailTemplate } from '../../logic/useEmailTemplates';

export default function ManagementMailTemplatesView() {
    const { templates, isLoading, saveTemplate, deleteTemplate } = useEmailTemplates();
    const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            await saveTemplate(editing);
            setEditing(null);
        }
    };

    if (isLoading) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold">E-Mail Vorlagen</h1>
                <button className="btn btn-primary" onClick={() => setEditing({ name: '', subject: '', body: '' })}>+ Neue Vorlage</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates?.map(tpl => (
                    <div key={tpl.id} className="card bg-base-200 shadow-sm border border-base-300">
                        <div className="card-body p-6">
                            <h2 className="card-title text-primary">{tpl.name}</h2>
                            <p className="text-sm font-semibold mt-2 truncate">Betreff: {tpl.subject}</p>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-ghost btn-xs text-error" onClick={() => { if(window.confirm('Löschen?')) deleteTemplate(tpl.id) }}>Löschen</button>
                                <button className="btn btn-secondary btn-xs" onClick={() => setEditing(tpl)}>Bearbeiten</button>
                            </div>
                        </div>
                    </div>
                ))}
                {templates?.length === 0 && <div className="col-span-full text-center opacity-50">Noch keine Vorlagen angelegt.</div>}
            </div>

            {editing && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl relative">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setEditing(null)}>✕</button>
                        <h3 className="font-bold text-xl mb-4">{editing.id ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Name der Vorlage (Intern)</span></label>
                                <input type="text" required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">E-Mail Betreff</span></label>
                                <input type="text" required value={editing.subject} onChange={e => setEditing({...editing, subject: e.target.value})} className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Nachricht (HTML erlaubt)</span>
                                    <span className="label-text-alt opacity-70">Variablen: {"{user_name}"}, {"{gallery_name}"}, {"{link}"}</span>
                                </label>
                                <textarea required value={editing.body} onChange={e => setEditing({...editing, body: e.target.value})} className="textarea textarea-bordered h-48 font-mono text-sm"></textarea>
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Abbrechen</button>
                                <button type="submit" className="btn btn-primary">Speichern</button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop"></div>
                </div>
            )}
        </div>
    );
}