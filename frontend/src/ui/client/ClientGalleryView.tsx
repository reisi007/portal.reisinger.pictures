import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGallery } from '../../logic/useGallery';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

export default function ClientGalleryView() {
    const params = useParams();
    const splat = params['*'];
    const slug = splat ? splat.split('/').pop() : '';

    const navigate = useNavigate();
    const { gallery, photos, totalPhotos, isLoading, isError, ratePhoto, size, setSize, isReachingEnd } = useGallery(slug);
    const galleryRef = useRef<HTMLDivElement>(null);
    const [finishing, setFinishing] = useState(false);

    useEffect(() => {
        let lightbox: PhotoSwipeLightbox | null = null;
        if (galleryRef.current && photos.length > 0) {
            lightbox = new PhotoSwipeLightbox({ gallery: galleryRef.current, children: 'a.pswp-item', pswpModule: () => import('photoswipe') });
            
            lightbox.on('uiRegister', function() {
                lightbox!.pswp!.ui!.registerElement({
                    name: 'custom-caption', order: 9, isButton: false, appendTo: 'wrapper', html: '',
                    onInit: (el, pswp) => {
                        lightbox!.pswp!.on('change', () => {
                            const currSlideElement = lightbox!.pswp!.currSlide?.data?.element;
                            if (currSlideElement) {
                                const title = currSlideElement.getAttribute('data-title') || '';
                                const desc = currSlideElement.getAttribute('data-desc') || '';
                                const artist = currSlideElement.getAttribute('data-artist') || '';
                                
                                // FIX: Prevention of XSS Vulnerability
                                el.innerHTML = ''; 
                                
                                if (title || desc) {
                                    const container = document.createElement('div');
                                    container.className = 'absolute bottom-5 left-5 text-white drop-shadow-md max-w-[600px] font-sans leading-relaxed pointer-events-none p-4';
                                    
                                    if (title) {
                                        const b = document.createElement('b');
                                        b.className = 'text-lg block mb-1';
                                        b.textContent = title;
                                        container.appendChild(b);
                                    }
                                    if (desc) {
                                        const span = document.createElement('span');
                                        span.textContent = desc;
                                        container.appendChild(span);
                                    }
                                    if (artist) {
                                        if (desc) container.appendChild(document.createElement('br'));
                                        const small = document.createElement('small');
                                        small.className = 'opacity-80 mt-1 block';
                                        small.textContent = '© ' + artist;
                                        container.appendChild(small);
                                    }
                                    el.appendChild(container);
                                }
                            }
                        });
                    }
                });
            });

            lightbox.init();
        }
        return () => { if (lightbox) lightbox.destroy(); };
    }, [photos.length]);

    const handleFinishRating = async () => {
        if (!window.confirm('Auswahl wirklich abschließen? Der Fotograf wird benachrichtigt.')) return;
        setFinishing(true);
        try {
            const res = await fetch('/api/galleries/' + gallery!.id + '/finish-rating', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('rp_jwt') || '') }
            });
            if (res.ok) alert('Der Fotograf wurde erfolgreich benachrichtigt!');
            else alert('Fehler beim Senden der Benachrichtigung.');
        } catch (e) { alert('Netzwerkfehler'); }
        setFinishing(false);
    };

    if (isLoading && photos.length === 0) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner"></span></div>;
    
    if (isError?.message === 'Unauthenticated' || isError?.message?.includes('401')) {
        return <Navigate to="/login" replace />;
    }

    if (isError || !gallery) return <div className="p-8 text-center text-error">Galerie nicht gefunden oder Zugriff verweigert.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <button onClick={() => navigate('/')} className="btn btn-sm btn-ghost mb-4">&larr; Zurück zur Übersicht</button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{gallery.name}</h1>
                    <p className="opacity-70">{gallery.type === 'selection' ? 'Wähle deine Favoriten aus.' : 'Lade deine Bilder herunter.'}</p>
                </div>
                
                <div className="flex gap-2">
                    {gallery.type === 'selection' && (
                        <button onClick={handleFinishRating} disabled={finishing} className="btn btn-success text-white">
                            {finishing ? <span className="loading loading-spinner"></span> : <span className="iconify mdi--check-all"></span>}
                            Auswahl abschließen
                        </button>
                    )}
                    {gallery.type === 'delivery' && totalPhotos > 0 && (
                        <button onClick={() => window.open('/api/galleries/' + gallery.id + '/download-zip', '_self')} className="btn btn-primary">
                            Alle herunterladen (.zip)
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6" ref={galleryRef}>
                {photos.map(photo => (
                    <div key={photo.id} className="card bg-base-200 shadow-xl overflow-hidden relative group">
                        <a href={photo.url} 
                           data-pswp-width={photo.width || 2000} 
                           data-pswp-height={photo.height || 1333} 
                           data-title={photo.title}
                           data-desc={photo.description}
                           data-artist={photo.artist}
                           className="pswp-item block relative aspect-square">
                            <img src={photo.thumb_url} className="object-cover w-full h-full" loading="lazy" />
                        </a>
                        
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.preventDefault(); navigate('/photos/' + photo.id); }} className="btn btn-circle btn-sm btn-neutral shadow-lg" title="Details & Metadaten">
                                <span className="iconify mdi--information-variant text-lg"></span>
                            </button>
                        </div>

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
                                <button onClick={() => window.open('/api/photos/' + photo.id + '/download', '_self')} className="btn btn-secondary btn-sm">Einzel-Download</button>
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
