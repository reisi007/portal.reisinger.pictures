import {mutate} from 'swr';
import {apiMutate} from '../api';

export function usePhoto() {
    const updateMetadata = async (id: number, title: string, description: string, artist?: string) => {
        const data = await apiMutate<{ success: boolean }>(`/api/photos/${id}/meta`, 'PUT', {
            title,
            description,
            artist
        });
        mutate(key => typeof key === 'string' && key.includes('/api/galleries/'));
        return data;
    };

    const deletePhoto = async (id: number) => {
        await apiMutate(`/api/photos/${id}`, 'DELETE');
        mutate(key => typeof key === 'string' && key.includes('/api/galleries/'));
    };

    return {updateMetadata, deletePhoto};
}
