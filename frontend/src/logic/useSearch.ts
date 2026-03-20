import useSWR from 'swr';
import { fetcher } from '../api';
import { Photo } from './useGallery';
import { Gallery } from './useGalleries';

export interface SearchResults {
    galleries: Gallery[];
    photos: Photo[];
}

export function useSearch(query: string, personal: boolean = false) {
    // Die Restriktion (query >= 2) wurde entfernt, damit leere Queries die neuesten Bilder laden
    const { data, error, isLoading } = useSWR<SearchResults>(
        `/api/search?q=${encodeURIComponent(query)}`,
        fetcher
    );

    return {
        results: data,
        isLoading,
        isError: error
    };
}
