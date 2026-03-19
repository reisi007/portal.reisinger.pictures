import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './logic/useAuth';
import Login from './ui/Login';
import Register from './ui/Register';
import Dashboard from './ui/Dashboard';
import GalleryView from './ui/GalleryView';
import InviteView from './ui/InviteView';
import PhotoDetailView from './ui/PhotoDetailView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isError } = useAuth();
    if (isLoading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    if (isError || !user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<InviteView />} />
            
            {/* Splat Route (*) fängt die Subordner-Struktur (z.B. /galleries/2024/hochzeit) ein */}
            <Route path="/galleries/*" element={<GalleryView />} />
            <Route path="/photos/:id" element={<PhotoDetailView />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
        </Routes>
    );
}
