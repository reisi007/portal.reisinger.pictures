import useSWR from 'swr';
import { fetcher } from '../api';

export interface Gallery {
    id: number;
    name: string;
    slug: string;
    type: 'selection' | 'delivery';
    is_live: boolean;
    is_public: boolean;
    gallery_group_id?: number | null;
    expires_at?: string | null;
}

export interface GalleryGroup {
    id: number;
    name: string;
    parent_id: number | null;
    children?: GalleryGroup[];
    galleries?: Gallery[];
}

export interface GalleryTreeResponse {
    groups: GalleryGroup[];
    root_galleries: Gallery[];
}

export function useAdminGalleries() {
    const { data, error, isLoading, mutate } = useSWR<GalleryTreeResponse>('/api/admin/galleries', fetcher);

    const createGroup = async (name: string, parentId?: number | null) => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch('/api/admin/gallery-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, parent_id: parentId })
        });
        if (!res.ok) throw new Error('Gruppe konnte nicht erstellt werden.');
        await mutate();
    };

    const createGallery = async (name: string, type: 'selection' | 'delivery', isLive: boolean, groupId?: number | null, password?: string, expiresAt?: string) => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch('/api/admin/galleries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                name, 
                type, 
                is_live: isLive,
                gallery_group_id: groupId,
                password: password || null,
                expires_at: expiresAt || null
            })
        });
        if (!res.ok) throw new Error('Galerie konnte nicht erstellt werden.');
        await mutate();
    };

    const deleteGallery = async (id: number) => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch(`/api/admin/galleries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Galerie konnte nicht gelöscht werden.');
        await mutate();
    };

    return {
        tree: data,
        isLoading,
        isError: error,
        mutate,
        createGroup,
        createGallery,
        deleteGallery
    };
}
