import useSWR from 'swr';
import { fetcher, apiMutate } from '../api';
import { useAuth } from './useAuth';

export interface Gallery {
    id: number;
    name: string;
    slug: string;
    full_path: string;
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

export const flattenGroups = (groups: GalleryGroup[], depth = 0): {id: number, name: string, depth: number}[] => {
    let flat: {id: number, name: string, depth: number}[] = [];
    for (const g of groups) {
        flat.push({ id: g.id, name: g.name, depth });
        if (g.children) flat = flat.concat(flattenGroups(g.children, depth + 1));
    }
    return flat;
};

export function useProtectedGalleries() {
    const { user } = useAuth();
    const canFetch = user?.is_admin || user?.is_photographer;

    const { data, error, isLoading, mutate } = useSWR<GalleryTreeResponse>(
        canFetch ? '/api/management/galleries' : null, 
        fetcher
    );

    const createGroup = async (name: string, parentId?: number | null) => {
        try {
            await apiMutate('/api/management/gallery-groups', 'POST', { name, parent_id: parentId });
            await mutate();
        } catch (e) {
            throw new Error('Gruppe konnte nicht erstellt werden.');
        }
    };

    const createGallery = async (name: string, type: 'selection' | 'delivery', isLive: boolean, isPublic: boolean, groupId?: number | null) => {
        try {
            await apiMutate('/api/management/galleries', 'POST', { 
                name, type, is_live: isLive, is_public: isPublic, gallery_group_id: groupId
            });
            await mutate();
        } catch (e) {
            throw new Error('Galerie konnte nicht erstellt werden.');
        }
    };

    const deleteGallery = async (id: number) => {
        try {
            await apiMutate(`/api/management/galleries/${id}`, 'DELETE');
            await mutate();
        } catch (e) {
            throw new Error('Galerie konnte nicht gelöscht werden.');
        }
    };

    return { tree: data, isLoading, isError: error, mutate, createGroup, createGallery, deleteGallery };
}
