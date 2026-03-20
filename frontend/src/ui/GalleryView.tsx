import React from 'react';
import { useAuth } from '../logic/useAuth';
import ManagementGalleryView from './management/ManagementGalleryView';
import ClientGalleryView from './client/ClientGalleryView';

export default function GalleryView() {
    const { user } = useAuth();
    if (!user) return null;
    return (user.is_admin || user.is_photographer) ? <ManagementGalleryView /> : <ClientGalleryView />;
}
