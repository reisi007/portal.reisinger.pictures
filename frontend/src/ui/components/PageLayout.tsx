import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useProtectedGalleries } from '../../logic/useGalleries';
import AdminWatermarkBanner from '../management/components/AdminWatermarkBanner';

export default function PageLayout({ children, currentView, hideMobileHeader }: { children: React.ReactNode, currentView?: string, hideMobileHeader?: boolean }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { tree, isLoading, isError } = useProtectedGalleries();

    return (
        <div className="flex flex-col h-screen">
            <AdminWatermarkBanner />
            <div className="flex flex-1 bg-base-100 overflow-hidden relative">
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
                )}
                
                <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar 
                        tree={tree} isLoading={isLoading} isError={isError} 
                        currentView={currentView}
                        onCloseMobile={() => setIsSidebarOpen(false)}
                    />
                </div>
                
                <main className="flex-1 overflow-y-auto flex flex-col w-full relative bg-base-200">
                    {!hideMobileHeader && (
                        <header className="p-4 border-b border-base-300 bg-base-100 flex items-center gap-4 sticky top-0 z-30 md:hidden">
                            <button className="btn btn-square btn-ghost" onClick={() => setIsSidebarOpen(true)}>
                                <span className="iconify mdi--menu text-2xl"></span>
                            </button>
                            <div className="text-xl font-bold text-primary truncate">Reisinger Portal</div>
                        </header>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
