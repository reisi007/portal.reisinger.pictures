import React, { useState } from 'react';
import { useUsers, UserDetailed } from '../../logic/useUsers';
import { useAdminGalleries } from '../../logic/useGalleries';
import DomainMappingTab from './components/DomainMappingTab';
import UserPermissionsModal from './components/UserPermissionsModal';

export default function AdminUserView() {
    const { users, roles, mappings, updateUser, createMapping, deleteMapping } = useUsers();
    const { tree } = useAdminGalleries();
    const [activeTab, setActiveTab] = useState<'users' | 'mappings'>('users');
    const [editingUser, setEditingUser] = useState<UserDetailed | null>(null);

    const flattenGroups = (groups: any[], depth = 0): any[] => {
        let flat: any[] = [];
        for (const g of groups) {
            flat.push({ id: g.id, name: g.name, depth });
            if (g.children) flat = flat.concat(flattenGroups(g.children, depth + 1));
        }
        return flat;
    };

    const flatGroups = tree ? flattenGroups(tree.groups) : [];
    const flatGalleries = tree ? [...(tree.groups.flatMap(g => g.galleries || [])), ...(tree.root_galleries || [])] : [];

    const handleSaveUser = async (id: number, selRoles: number[], selGroups: number[], selGalleries: number[], canEditMeta: boolean) => {
        await (updateUser as any)(id, selRoles, selGroups, selGalleries, canEditMeta);
        setEditingUser(null);
    };

    return (
        <div className="p-10 max-w-6xl mx-auto w-full">
            <h1 className="text-4xl font-bold mb-6">Benutzer &amp; Auto-Zuordnungen</h1>
            
            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`} onClick={() => setActiveTab('users')}>Benutzerverwaltung</a>
                <a className={`tab ${activeTab === 'mappings' ? 'tab-active' : ''}`} onClick={() => setActiveTab('mappings')}>Domain-Mappings</a>
            </div>

            {activeTab === 'users' && (
                <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>E-Mail</th>
                                <th>Rollen</th>
                                <th>Rechte (Gruppen / Galerien)</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map(u => (
                                <tr key={u.id}>
                                    <td className="font-bold">{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.roles.map(r => <span key={r.id} className="badge badge-primary badge-sm mr-1">{r.name}</span>)}</td>
                                    <td className="text-xs">
                                        {u.gallery_groups.length} Gruppen, {u.galleries.length} Galerien
                                    </td>
                                    <td><button className="btn btn-xs btn-outline" onClick={() => setEditingUser(u)}>Bearbeiten</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'mappings' && (
                <DomainMappingTab 
                    mappings={mappings} 
                    roles={roles} 
                    flatGroups={flatGroups} 
                    onCreateMapping={createMapping} 
                    onDeleteMapping={deleteMapping} 
                />
            )}

            <UserPermissionsModal 
                user={editingUser} 
                roles={roles} 
                flatGroups={flatGroups} 
                flatGalleries={flatGalleries} 
                onClose={() => setEditingUser(null)} 
                onSave={handleSaveUser} 
            />
        </div>
    );
}
