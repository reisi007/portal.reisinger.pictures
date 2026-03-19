import useSWR from 'swr';
import { fetcher } from '../api';

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
    const { data: status, mutate, isLoading } = useSWR<FtpStatus>('/api/admin/ftp/status', fetcher);

    const setTargetGallery = async (gallery_id: number | null) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch('/api/admin/ftp/target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ gallery_id })
        });
        mutate();
    };

    const processInbox = async () => {
        const token = localStorage.getItem('rp_jwt');
        const res = await fetch('/api/admin/ftp/process', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        mutate();
        return data;
    };

    return { status, isLoading, setTargetGallery, processInbox };
}
