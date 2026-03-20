import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUsers, UserDetailed } from '../../logic/useUsers';
import { useProtectedGalleries, flattenGroups } from '../../logic/useGalleries';
import DomainMappingTab from './components/DomainMappingTab';
import UserPermissionsModal from './components/UserPermissionsModal';

export default function ManagementUserView() {
    const { users, roles, mappings, createUser, updateUser, createMapping, deleteMapping } = useUsers();
    const { tree } = useProtectedGalleries();
    
    // URL-Driven State für Tabs
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';
    
    const [editingUser, setEditingUser] = useState<UserDetailed | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const flatGroups = tree ? flattenGroups(tree.groups) : [];
    const flatGalleries = tree ? [...(tree.groups.flatMap(g => g.galleries || [])), ...(tree.root_galleries || [])] : [];

    const handleSaveUser = async (id: number, selRoles: number[], selGroups: number[], selGalleries: number[], canEditMeta: boolean) => {
        await updateUser(id, selRoles, selGroups, selGalleries, canEditMeta);
        setEditingUser(null);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await createUser(newName, newEmail);
            setNewName(''); setNewEmail('');
            setIsCreateModalOpen(false);
            alert('Nutzer angelegt! Eine E-Mail zur Passwort-Einrichtung wurde verschickt.');
        } catch(err: any) {
            alert('Fehler: ' + (err.message || 'Nutzer konnte nicht angelegt werden.'));
        }
        setIsCreating(false);
    };

    const filteredUsers = users?.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-10 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-4xl font-bold">Benutzer &amp; Rechte</h1>
                {activeTab === 'users' && (
                    <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Neuen Nutzer anlegen</button>
                )}
            </div>

            <div className="tabs tabs-box">
                {/* Tab 1: Benutzerverwaltung */}
                <input 
                    type="radio" 
                    name="management_user_tabs" 
                    className="tab font-semibold" 
                    aria-label="Benutzerverwaltung" 
                    checked={activeTab === 'users'} 
                    onChange={() => setSearchParams({ tab: 'users' })} 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <div className="mb-4">
                        <div className="join w-full md:w-1/2 shadow-sm">
                            <input 
                                type="text" 
                                placeholder="Nutzer suchen (Name oder E-Mail)..." 
                                className="input input-bordered join-item w-full bg-base-100" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                            <button className="btn btn-square join-item" disabled>
                                <span className="iconify mdi--magnify text-xl"></span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-box border border-base-300">
                        <table className="table table-zebra w-full">
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
                                {filteredUsers?.map(u => (
                                    <tr key={u.id}>
                                        <td className="font-bold">{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            {u.roles.length > 0 ? u.roles.map(r => <span key={r.id} className="badge badge-primary badge-sm mr-1">{r.name}</span>) : <span className="text-xs opacity-50">Keine Rolle</span>}
                                        </td>
                                        <td className="text-xs opacity-80">
                                            {u.gallery_groups.length} Gruppen, {u.galleries.length} Galerien
                                        </td>
                                        <td><button className="btn btn-xs btn-outline" onClick={() => setEditingUser(u)}>Bearbeiten</button></td>
                                    </tr>
                                ))}
                                {filteredUsers?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 opacity-50">
                                            Keine Nutzer gefunden, die "{searchTerm}" entsprechen.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tab 2: Domain-Mappings */}
                <input 
                    type="radio" 
                    name="management_user_tabs" 
                    className="tab font-semibold" 
                    aria-label="Domain-Mappings" 
                    checked={activeTab === 'mappings'} 
                    onChange={() => setSearchParams({ tab: 'mappings' })} 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <DomainMappingTab 
                        mappings={mappings} 
                        roles={roles} 
                        flatGroups={flatGroups} 
                        onCreateMapping={createMapping} 
                        onDeleteMapping={deleteMapping} 
                    />
                </div>
            </div>

            <UserPermissionsModal 
                user={editingUser} 
                roles={roles} 
                flatGroups={flatGroups} 
                flatGalleries={flatGalleries} 
                onClose={() => setEditingUser(null)} 
                onSave={handleSaveUser} 
            />

            {isCreateModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Neuen Nutzer einladen</h3>
                        <p className="text-sm opacity-70 mb-4">Der Nutzer erhält eine E-Mail mit einem Link, um sein Passwort festzulegen.</p>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Name</span></label>
                                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">E-Mail Adresse</span></label>
                                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input input-bordered" />
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>Abbrechen</button>
                                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                                    {isCreating ? <span className="loading loading-spinner"></span> : 'Nutzer anlegen & Einladen'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}></div>
                </div>
            )}
        </div>
    );
}
