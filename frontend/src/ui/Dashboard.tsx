import React from 'react';
import { useAuth } from '../logic/useAuth';
import AdminDashboard from './admin/AdminDashboard';
import ClientDashboard from './client/ClientDashboard';

export default function Dashboard() {
    const { user } = useAuth();
    if (!user) return null;
    return user.is_admin ? <AdminDashboard /> : <ClientDashboard />;
}
