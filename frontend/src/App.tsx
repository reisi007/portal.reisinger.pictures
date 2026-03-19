import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './logic/useAuth';
import Login from './ui/Login';
import Register from './ui/Register';
import Dashboard from './ui/Dashboard';
import GalleryView from './ui/GalleryView';
import InviteView from './ui/InviteView';
import PhotoDetailView from './ui/PhotoDetailView';
import SearchView from './ui/SearchView';
import ErrorBoundary from './ui/components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isError } = useAuth();
    if (isLoading) return <div className="flex h-screen items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    if (isError || !user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <ErrorBoundary fallback={<div className="flex h-screen items-center justify-center p-8"><div className="alert alert-error">Kritischer Fehler. Bitte Seite neu laden.</div></div>}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/invite/:token" element={<InviteView />} />
                
                <Route path="/galleries/*" element={<ErrorBoundary><GalleryView /></ErrorBoundary>} />
                <Route path="/photos/:id" element={<ErrorBoundary><PhotoDetailView /></ErrorBoundary>} />
                
                {/* Search ist nun öffentlich zugänglich! */}
                <Route path="/search" element={<ErrorBoundary><SearchView /></ErrorBoundary>} />

                <Route path="/" element={
                    <ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>
                } />
            </Routes>
        </ErrorBoundary>
    );
}
