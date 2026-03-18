import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '../api';
import { Photo } from './useGallery';

interface Breadcrumb {
    name: string;
    type: 'group' | 'gallery';
    slug?: string;
}

interface PhotoContextData {
    photo: Photo;
    breadcrumbs: Breadcrumb[];
}

export default function PhotoDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, error, isLoading } = useSWR<PhotoContextData>(
        id ? `/api/photos/${id}/context` : null,
        fetcher
    );

    if (isLoading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error || !data) return <div className="p-8 text-center text-error">Foto konnte nicht geladen werden oder keine Berechtigung.</div>;

    const { photo, breadcrumbs } = data;

    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col h-screen">
            {/* Topbar & Breadcrumbs */}
            <div className="flex items-center mb-6 gap-4">
                <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost">
                    <span className="iconify mdi--arrow-left text-2xl"></span>
                </button>
                
                <div className="text-sm breadcrumbs flex-1 overflow-hidden">
                    <ul>
                        <li><a onClick={() => navigate('/')}>Dashboard</a></li>
                        {breadcrumbs.map((bc, idx) => (
                            <li key={idx}>
                                {bc.type === 'gallery' 
                                    ? <a onClick={() => navigate(`/g/${bc.slug}`)} className="font-semibold text-primary">{bc.name}</a>
                                    : <span className="opacity-70">{bc.name}</span>
                                }
                            </li>
                        ))}
                        <li>{photo.filename}</li>
                    </ul>
                </div>
            </div>

            {/* Main Photo Content */}
            <div className="flex-1 bg-base-200 rounded-box flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
                <img 
                    src={photo.url} 
                    alt={photo.filename} 
                    className="max-w-full max-h-full object-contain rounded drop-shadow-2xl" 
                />
            </div>
            
            {/* Meta Footer */}
            <div className="mt-4 text-center opacity-50 text-sm">
                {photo.width} x {photo.height}px &bull; LR UUID: {photo.lr_uuid}
            </div>
        </div>
    );
}
