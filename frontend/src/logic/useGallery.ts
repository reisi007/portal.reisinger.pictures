import useSWRInfinite from 'swr/infinite';
import { fetcher } from '../api';
import { Gallery } from './useGalleries';

export interface Photo {
    id: number;
    gallery_id: number;
    filename: string;
    lr_uuid: string;
    width: number;
    height: number;
    url: string;
    thumb_url: string;
    rating: number;
    comment: string;
}

export interface PaginatedGalleryResponse {
    gallery: Gallery;
    photos: Photo[];
    current_page: number;
    last_page: number;
    total: number;
}

export function useGallery(slug: string | undefined) {
    const getKey = (pageIndex: number, previousPageData: PaginatedGalleryResponse | null) => {
        if (!slug) return null;
        if (previousPageData && previousPageData.current_page >= previousPageData.last_page) return null;
        return "/api/galleries/" + slug + "?page=" + (pageIndex + 1);
    };

    const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<PaginatedGalleryResponse>(
        getKey,
        fetcher,
        {
            refreshInterval: (latestData) => {
                const isLive = latestData?.some(page => page.gallery.is_live);
                return isLive ? 10000 : 0;
            }
        }
    );

    const photos = data ? data.flatMap(page => page.photos) : [];
    const gallery = data?.[0]?.gallery;
    
    const isReachingEnd = data && data[data.length - 1]?.current_page >= data[data.length - 1]?.last_page;
    const totalPhotos = data?.[0]?.total || 0;

    const ratePhoto = async (photoId: number, rating: number, comment: string = '') => {
        if (data) {
            const newData = data.map(page => ({
                ...page,
                photos: page.photos.map(p => p.id === photoId ? { ...p, rating, comment } : p)
            }));
            mutate(newData, false);
        }

        const res = await fetch("/api/photos/" + photoId + "/rate", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('rp_jwt') || '')
            },
            body: JSON.stringify({ rating, comment })
        });

        if (res.status === 401) {
            // Falls ein Gast versucht zu bewerten, zur Anmeldung zwingen
            window.location.href = '/login';
        }
        
        mutate(); 
    };

    return { gallery, photos, totalPhotos, isLoading, isError: error, ratePhoto, size, setSize, isReachingEnd };
}
