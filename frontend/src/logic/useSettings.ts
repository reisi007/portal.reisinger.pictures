import useSWR from 'swr';
import { fetcher } from '../api';

export interface WatermarkSettings {
    has_svg: boolean;
    scale: number;
    opacity: number;
    position: string;
}

export function useSettings() {
    const { data: watermark, mutate } = useSWR<WatermarkSettings>('/api/admin/settings/watermark', fetcher);

    const updateWatermark = async (formData: FormData) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch('/api/admin/settings/watermark', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        mutate();
    };

    return { watermark, updateWatermark };
}
