import { Photo } from './useGallery';
import { mutate } from 'swr';

export function usePhoto() {
    const updateMetadata = async (id: number, title: string, description: string, artist?: string) => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch(`/api/photos/${id}/meta`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, description, artist })
        });
        if (!res.ok) throw new Error('Fehler beim Speichern der Metadaten.');
        // Globalen Cache für die Galerie invalidieren (damit Texte im Raster stimmen)
        mutate(key => typeof key === 'string' && key.includes('/api/galleries/'));
        return res.json();
    };

    const deletePhoto = async (id: number) => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch(`/api/photos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Fehler beim Löschen des Fotos.');
        // Globalen Cache für die Galerie invalidieren
        mutate(key => typeof key === 'string' && key.includes('/api/galleries/'));
    };

    return { updateMetadata, deletePhoto };
}
