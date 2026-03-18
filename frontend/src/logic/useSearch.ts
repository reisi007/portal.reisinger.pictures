import useSWR from 'swr';
import { fetcher } from '../api';
import { Photo } from './useGallery';
import { Gallery } from './useGalleries';

export interface SearchResults {
    galleries: Gallery[];
    photos: Photo[];
}

export function useSearch(query: string) {
    const { data, error, isLoading } = useSWR<SearchResults>(
        query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null,
        fetcher
    );

    return {
        results: data,
        isLoading,
        isError: error
    };
}
