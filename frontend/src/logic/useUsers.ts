import useSWR from 'swr';
import { fetcher } from '../api';

export interface Role { id: number; name: string; }
export interface UserDetailed {
    id: number; name: string; email: string; can_edit_metadata: boolean;
    roles: Role[]; gallery_groups: { id: number; name: string }[]; galleries: { id: number; name: string }[];
}
export interface DomainMapping { id: number; domain: string; role?: Role; gallery_group?: { id: number; name: string }; }

export function useUsers() {
    const { data: users, mutate: mutateUsers } = useSWR<UserDetailed[]>('/api/admin/users', fetcher);
    const { data: roles } = useSWR<Role[]>('/api/admin/roles', fetcher);
    const { data: mappings, mutate: mutateMappings } = useSWR<DomainMapping[]>('/api/admin/domain-mappings', fetcher);

    const updateUser = async (id: number, role_ids: number[], gallery_group_ids: number[], gallery_ids: number[], can_edit_metadata: boolean) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role_ids, gallery_group_ids, gallery_ids, can_edit_metadata })
        });
        mutateUsers();
    };

    const createMapping = async (domain: string, role_id: number | null, gallery_group_id: number | null) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch('/api/admin/domain-mappings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ domain, role_id, gallery_group_id })
        });
        mutateMappings();
    };

    const deleteMapping = async (id: number) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch(`/api/admin/domain-mappings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        mutateMappings();
    };

    return { users, roles, mappings, updateUser, createMapping, deleteMapping };
}
