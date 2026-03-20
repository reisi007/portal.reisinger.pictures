import React, { useState, useEffect } from 'react';
import { useSettings } from '../../logic/useSettings';

export default function ManagementSettingsView() {
    const { watermark, updateWatermark } = useSettings();
    const [file, setFile] = useState<File | null>(null);
    const [scale, setScale] = useState<number>(0.1);
    const [opacity, setOpacity] = useState<number>(0.6);
    const [position, setPosition] = useState<string>('bottom-right');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (watermark) {
            setScale(watermark.scale);
            setOpacity(watermark.opacity);
            setPosition(watermark.position);
        }
    }, [watermark]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const fd = new FormData();
        if (file) fd.append('svg', file);
        fd.append('scale', scale.toString());
        fd.append('opacity', opacity.toString());
        fd.append('position', position);

        await updateWatermark(fd);
        setSaving(false);
        setFile(null);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto w-full">
            <h1 className="text-4xl font-bold mb-6">Einstellungen</h1>

            <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">Wasserzeichen für Gäste</h2>

                    {!watermark?.has_svg && (
                        <div className="alert alert-warning shadow-sm mb-6">
                            <span className="iconify mdi--alert text-xl"></span>
                            <span>Es wurde noch kein SVG-Wasserzeichen hochgeladen. Gäste laden Bilder in öffentlichen Galerien derzeit in Originalqualität ohne Wasserzeichen herunter.</span>
                        </div>
                    )}
                    {watermark?.has_svg && (
                        <div className="alert alert-success shadow-sm mb-6">
                            <span className="iconify mdi--check-circle text-xl"></span>
                            <span>SVG Wasserzeichen ist aktiv.</span>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-bold">Logo (nur .svg)</span></label>
                            <input type="file" accept=".svg" onChange={e => setFile(e.target.files?.[0] || null)} className="file-input file-input-bordered w-full" />
                            <div className="label"><span className="label-text-alt opacity-70">Lade eine neue Datei hoch, um das aktuelle Logo zu ersetzen.</span></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Größe (Skalierung)</span></label>
                                <input type="range" min="0.05" max="0.5" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="range range-primary" />
                                <div className="text-center text-sm mt-2">{Math.round(scale * 100)}% der Bildbreite</div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Deckkraft</span></label>
                                <input type="range" min="0.1" max="1.0" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="range range-primary" />
                                <div className="text-center text-sm mt-2">{Math.round(opacity * 100)}%</div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Position</span></label>
                                <select value={position} onChange={e => setPosition(e.target.value)} className="select select-bordered w-full">
                                    <option value="bottom-right">Unten Rechts</option>
                                    <option value="bottom-left">Unten Links</option>
                                    <option value="top-right">Oben Rechts</option>
                                    <option value="top-left">Oben Links</option>
                                    <option value="center">Zentriert</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button type="submit" disabled={saving} className="btn btn-primary">
                                {saving ? <span className="loading loading-spinner"></span> : 'Speichern & Cache leeren'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
