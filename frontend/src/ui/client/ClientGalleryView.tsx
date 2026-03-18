import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGallery } from '../../logic/useGallery';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

export default function ClientGalleryView() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { gallery, photos, totalPhotos, isLoading, isError, ratePhoto, size, setSize, isReachingEnd } = useGallery(slug);
    const galleryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let lightbox: PhotoSwipeLightbox | null = null;
        if (galleryRef.current && photos.length > 0) {
            lightbox = new PhotoSwipeLightbox({ gallery: galleryRef.current, children: 'a.pswp-item', pswpModule: () => import('photoswipe') });
            lightbox.init();
        }
        return () => { if (lightbox) lightbox.destroy(); };
    }, [photos.length]);

    if (isLoading && photos.length === 0) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner"></span></div>;
    if (isError || !gallery) return <div className="p-8 text-center text-error">Galerie nicht gefunden.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <button onClick={() => navigate('/')} className="btn btn-sm btn-ghost mb-4">&larr; Zurück zur Übersicht</button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{gallery.name}</h1>
                    <p className="opacity-70">{gallery.type === 'selection' ? 'Wähle deine Favoriten aus.' : 'Lade deine Bilder herunter.'}</p>
                </div>
                {gallery.type === 'delivery' && totalPhotos > 0 && (
                    <button onClick={() => window.open("/api/galleries/" + gallery.id + "/download-zip", '_self')} className="btn btn-primary">
                        Alle herunterladen (.zip)
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" ref={galleryRef}>
                {photos.map(photo => (
                    <div key={photo.id} className="card bg-base-200 shadow-xl overflow-hidden">
                        <a href={photo.url} data-pswp-width={photo.width || 2000} data-pswp-height={photo.height || 1333} className="pswp-item block relative aspect-square">
                            <img src={photo.thumb_url} className="object-cover w-full h-full" loading="lazy" />
                        </a>
                        <div className="card-body p-4 bg-base-100 flex flex-col gap-3">
                            {gallery.type === 'selection' ? (
                                <>
                                    <div className="rating rating-sm justify-center">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <input key={star} type="radio" className={"mask mask-star-2 " + (photo.rating >= star ? 'bg-orange-400' : 'bg-base-300')} checked={photo.rating === star} onChange={() => ratePhoto(photo.id, star, photo.comment || '')} />
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Kommentar..." defaultValue={photo.comment || ''} onBlur={(e) => ratePhoto(photo.id, photo.rating || 0, e.target.value)} className="input input-bordered input-sm w-full" />
                                </>
                            ) : (
                                <button onClick={() => window.open("/api/photos/" + photo.id + "/download", '_self')} className="btn btn-secondary btn-sm">Einzel-Download</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {!isReachingEnd && photos.length > 0 && (
                <div className="text-center mt-8"><button className="btn btn-outline" onClick={() => setSize(size + 1)}>Mehr laden</button></div>
            )}
        </div>
    );
}
