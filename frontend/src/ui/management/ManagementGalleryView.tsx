import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useGallery} from '../../logic/useGallery';
import {flattenGroups, Gallery, useProtectedGalleries} from '../../logic/useGalleries';
import {useEmailTemplates} from '../../logic/useEmailTemplates';
import {useAuth} from '../../logic/useAuth';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import EmailComposerModal from './components/EmailComposerModal';
import InviteModal from './components/InviteModal';
import PageLayout from '../components/PageLayout';
import GalleryModals from '../components/GalleryModals';

export default function ManagementGalleryView() {
    const params = useParams();
    const splat = params['*'];
    const slug = splat ? splat.split('/').pop() : '';

    const navigate = useNavigate();
    const {
        gallery,
        photos,
        downloadsCount,
        isLoading,
        isError,
        size,
        setSize,
        isReachingEnd,
        mutate
    } = useGallery(slug);
    const {tree, updateGallery, deleteGallery} = useProtectedGalleries();
    const {templates} = useEmailTemplates();
    const {user} = useAuth();

    const [isGalleryEditModalOpen, setGalleryEditModalOpen] = useState(false);
    const safeGroups = Array.isArray(tree?.groups) ? tree.groups : [];

    const galleryRef = useRef<HTMLDivElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        let lightbox: PhotoSwipeLightbox | null = null;
        if (galleryRef.current && photos.length > 0) {
            lightbox = new PhotoSwipeLightbox({
                gallery: galleryRef.current,
                children: 'a.pswp-item',
                pswpModule: () => import('photoswipe')
            });
            lightbox.init();
        }
        return () => {
            if (lightbox) lightbox.destroy();
        };
    }, [photos.length]);

    const handleWebUpload = async (files: FileList | null) => {
        if (!files || !gallery) return;
        setUploading(true);
        for (const file of Array.from(files)) {
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
            } catch (err) {
                console.error(err);
            }
        }
        setUploading(false);
        mutate();
    };

    if (isLoading && photos.length === 0) return <PageLayout>
        <div className="flex h-full items-center justify-center"><span className="loading loading-spinner"></span></div>
    </PageLayout>;
    if (isError || !gallery) return <PageLayout>
        <div className="p-8 text-center text-error">Galerie nicht gefunden.</div>
    </PageLayout>;

    return (
        <PageLayout>
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {gallery.name}
                        {user?.is_photographer && (
                            <button onClick={() => setGalleryEditModalOpen(true)}
                                    className="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom"
                                    data-tip="Galerie bearbeiten">
                                <span className="iconify mdi--pencil text-xl"></span>
                            </button>
                        )}
                    </h1>
                    <div className="flex flex-wrap gap-4 items-center">
                        <span className="badge badge-ghost font-normal">{downloadsCount || 0} Downloads</span>
                        {user?.is_photographer && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsInviteModalOpen(true)} className="btn btn-outline btn-sm">
                                    <span className="iconify mdi--link"></span> Einladungslink
                                </button>
                                <button onClick={() => setIsMailModalOpen(true)} className="btn btn-primary btn-sm">
                                    <span className="iconify mdi--email-fast"></span> E-Mail senden
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {user?.is_photographer && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            handleWebUpload(e.dataTransfer.files);
                        }}
                        className={`mb-8 p-6 md:p-10 border-2 border-dashed rounded-box flex flex-col items-center justify-center text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-base-content/30 bg-base-200'}`}
                    >
                        <span className="iconify mdi--cloud-upload text-5xl mb-3 text-primary"></span>
                        <h3 className="font-bold text-xl mb-1">Bilder hierher ziehen</h3>
                        <p className="text-sm opacity-70 mb-6">oder auf den Button klicken, um Dateien auszuwählen</p>
                        <input type="file" multiple accept="image/*" onChange={(e) => handleWebUpload(e.target.files)}
                               disabled={uploading}
                               className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs"/>
                    </div>
                )}

                {!isLoading && photos.length === 0 && (
                    <div
                        className="py-20 text-center flex flex-col items-center justify-center opacity-70 bg-base-200 rounded-box border border-base-300">
                        <span className="iconify mdi--image-off-outline text-6xl mb-4"></span>
                        <h3 className="text-2xl font-bold">Noch keine Bilder vorhanden</h3>
                        {gallery.is_live ? (
                            <p className="mt-2 text-warning flex items-center gap-2">
                                <span className="iconify mdi--autorenew animate-spin"></span>
                                Dies ist eine LIVE Galerie. Diese Ansicht aktualisiert sich automatisch alle 10
                                Sekunden.
                            </p>
                        ) : (
                            <p className="mt-2">Lade Bilder per Drag & Drop hoch oder importiere sie über die
                                FTP-Inbox.</p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4" ref={galleryRef}>
                    {photos.map(photo => (
                        <div key={photo.id} className="relative group">
                            <a href={photo.url} data-pswp-width={photo.width || 2000}
                               data-pswp-height={photo.height || 1333}
                               className="pswp-item block relative aspect-square">
                                <img src={photo.thumb_url} className="object-cover w-full h-full rounded"
                                     loading="lazy"/>
                            </a>
                        </div>
                    ))}
                </div>

                {!isReachingEnd && photos.length > 0 && (
                    <div className="text-center mt-8">
                        <button className="btn btn-outline" onClick={() => setSize(size + 1)}>Mehr laden</button>
                    </div>
                )}

                <EmailComposerModal
                    isOpen={isMailModalOpen}
                    onClose={() => setIsMailModalOpen(false)}
                    galleryId={gallery.id}
                    templates={templates}
                />

                {isInviteModalOpen && (
                    <InviteModal galleryId={gallery.id} onClose={() => setIsInviteModalOpen(false)}/>
                )}

                <GalleryModals
                    availableGroups={flattenGroups(safeGroups)}
                    isGroupModalOpen={false} setGroupModalOpen={() => {
                }}
                    isGalleryModalOpen={isGalleryEditModalOpen} setGalleryModalOpen={setGalleryEditModalOpen}
                    editingGallery={gallery as unknown as Gallery}
                    onCreateGroup={async () => {
                    }} onCreateGallery={async () => {
                }}
                    onUpdateGroup={async () => {
                    }}
                    onUpdateGallery={async (...args) => {
                        await updateGallery(...args);
                        mutate();
                    }}
                    onDeleteGroup={async () => {
                    }}
                    onDeleteGallery={async (id) => {
                        await deleteGallery(id);
                        navigate('/');
                    }}
                />
            </div>
        </PageLayout>
    );
}