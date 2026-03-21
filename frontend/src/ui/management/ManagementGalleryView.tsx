import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGallery } from '../../logic/useGallery';
import { useEmailTemplates } from '../../logic/useEmailTemplates';
import { useAuth } from '../../logic/useAuth';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import EmailComposerModal from './components/EmailComposerModal';
import PageLayout from '../components/PageLayout';

export default function ManagementGalleryView() {
    const params = useParams();
    const splat = params['*'];
    const slug = splat ? splat.split('/').pop() : '';

    const { gallery, photos, isLoading, isError, size, setSize, isReachingEnd, mutate } = useGallery(slug);
    const { templates } = useEmailTemplates();
    const { user } = useAuth();
    
    const galleryRef = useRef<HTMLDivElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);

    useEffect(() => {
        let lightbox: PhotoSwipeLightbox | null = null;
        if (galleryRef.current && photos.length > 0) {
            lightbox = new PhotoSwipeLightbox({ gallery: galleryRef.current, children: 'a.pswp-item', pswpModule: () => import('photoswipe') });
            lightbox.init();
        }
        return () => { if (lightbox) lightbox.destroy(); };
    }, [photos.length]);

    const handleWebUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !gallery) return;
        setUploading(true);
        for (const file of Array.from(e.target.files)) {
            const formData = new FormData();
            formData.append('gallery_id', gallery.id.toString());
            formData.append('lr_uuid', 'web-' + Math.random().toString(36).substring(2, 15));
            formData.append('file', file);
            try {
                await fetch('/api/management/upload', {
                    method: 'POST', 
                    headers: { 
                        'Authorization': 'Bearer ' + (localStorage.getItem('rp_jwt') || ''),
                        'Accept': 'application/json'
                    }, 
                    body: formData
                });
            } catch (err) {}
        }
        setUploading(false); mutate(); 
    };

    if (isLoading && photos.length === 0) return <PageLayout><div className="flex h-full items-center justify-center"><span className="loading loading-spinner"></span></div></PageLayout>;
    if (isError || !gallery) return <PageLayout><div className="p-8 text-center text-error">Galerie nicht gefunden.</div></PageLayout>;

    return (
        <PageLayout>
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="iconify mdi--shield-account text-primary"></span> {gallery.name}
                    </h1>
                    <button onClick={() => setIsMailModalOpen(true)} className="btn btn-outline btn-info">
                        <span className="iconify mdi--email-fast"></span> Kunden benachrichtigen
                    </button>
                </div>

                {user?.is_photographer && (
                    <div className="mb-8 p-6 bg-base-200 rounded-box border border-base-300 flex items-center gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">Bilder hochladen</h3>
                            <p className="text-sm opacity-70">Lade direkt über den Browser hoch.</p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handleWebUpload} disabled={uploading} className="file-input file-input-bordered w-full max-w-xs" />
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4" ref={galleryRef}>
                    {photos.map(photo => (
                        <div key={photo.id} className="relative group">
                            <a href={photo.url} data-pswp-width={photo.width || 2000} data-pswp-height={photo.height || 1333} className="pswp-item block relative aspect-square">
                                <img src={photo.thumb_url} className="object-cover w-full h-full rounded" loading="lazy" />
                            </a>
                        </div>
                    ))}
                </div>
                
                {!isReachingEnd && photos.length > 0 && (
                    <div className="text-center mt-8"><button className="btn btn-outline" onClick={() => setSize(size + 1)}>Mehr laden</button></div>
                )}

                <EmailComposerModal 
                    isOpen={isMailModalOpen} 
                    onClose={() => setIsMailModalOpen(false)} 
                    galleryId={gallery.id} 
                    templates={templates} 
                />
            </div>
        </PageLayout>
    );
}