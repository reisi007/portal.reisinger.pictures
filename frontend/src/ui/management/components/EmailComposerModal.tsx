import React, { useState } from 'react';
import { EmailTemplate } from '../../../logic/useEmailTemplates';
import { apiMutate } from '../../../api';

interface EmailComposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    galleryId: number;
    templates?: EmailTemplate[];
}

export default function EmailComposerModal({ isOpen, onClose, galleryId, templates }: EmailComposerModalProps) {
    const [mailSubject, setMailSubject] = useState('');
    const [mailBody, setMailBody] = useState('');
    const [sendingMail, setSendingMail] = useState(false);

    if (!isOpen) return null;

    const handleTemplateSelect = (tplId: string) => {
        if (!tplId) return;
        const tpl = templates?.find(t => t.id.toString() === tplId);
        if (tpl) {
            setMailSubject(tpl.subject);
            setMailBody(tpl.body);
        }
    };

    const handleSendCustomMail = async () => {
        if (!galleryId || !mailSubject || !mailBody) return;
        setSendingMail(true);
        try {
            const data = await apiMutate<{success: boolean, notified_count: number}>(`/api/management/galleries/${galleryId}/send-custom-email`, 'POST', { subject: mailSubject, body: mailBody });
            alert('Erfolg! ' + data.notified_count + ' E-Mails versendet.');
            onClose();
        } catch(err: any) { 
            alert('Fehler: ' + err.message); 
        }
        setSendingMail(false);
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
                <h3 className="font-bold text-xl mb-4">Nachricht an Kunden senden</h3>
                
                <div className="form-control mb-4">
                    <label className="label"><span className="label-text font-bold">Vorlage auswählen</span></label>
                    <select onChange={e => handleTemplateSelect(e.target.value)} className="select select-bordered w-full">
                        <option value="">-- Bitte wählen --</option>
                        {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="form-control mb-4">
                    <label className="label"><span className="label-text font-bold">Betreff</span></label>
                    <input type="text" value={mailSubject} onChange={e => setMailSubject(e.target.value)} className="input input-bordered w-full" />
                </div>

                <div className="form-control mb-6">
                    <label className="label">
                        <span className="label-text font-bold">Nachricht (HTML erlaubt)</span>
                        <span className="label-text-alt opacity-70">Variablen: {"{user_name}"}, {"{gallery_name}"}, {"{link}"}</span>
                    </label>
                    <textarea value={mailBody} onChange={e => setMailBody(e.target.value)} className="textarea textarea-bordered h-48 font-mono text-sm"></textarea>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
                    <button className="btn btn-primary" disabled={sendingMail || !mailSubject || !mailBody} onClick={handleSendCustomMail}>
                        {sendingMail ? <span className="loading loading-spinner"></span> : 'Nachricht Senden'}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
