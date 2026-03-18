import React from 'react';
import { useAuth } from '../logic/useAuth';
import AdminGalleryView from './admin/AdminGalleryView';
import ClientGalleryView from './client/ClientGalleryView';

export default function GalleryView() {
    const { user } = useAuth();
    if (!user) return null;
    return user.is_admin ? <AdminGalleryView /> : <ClientGalleryView />;
}
