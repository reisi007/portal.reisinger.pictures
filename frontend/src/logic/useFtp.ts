import useSWR from 'swr';
import { fetcher, apiMutate } from '../api';

export interface FtpStatus {
    ftp_folder: string;
    file_count: number;
    current_target_gallery: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

export function useFtp() {
    const { data: status, mutate, isLoading } = useSWR<FtpStatus>('/api/management/ftp/status', fetcher);

    const setTargetGallery = async (gallery_id: number | null) => {
        await apiMutate('/api/management/ftp/target', 'POST', { gallery_id });
        mutate();
    };

    const processInbox = async () => {
        const data = await apiMutate<any>('/api/management/ftp/process', 'POST');
        mutate();
        return data;
    };

    return { status, isLoading, setTargetGallery, processInbox };
}
