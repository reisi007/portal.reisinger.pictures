import useSWR from 'swr';
import { fetcher, apiMutate } from '../api';

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
        await apiMutate(`/api/admin/users/${id}`, 'PUT', { role_ids, gallery_group_ids, gallery_ids, can_edit_metadata });
        mutateUsers();
    };

    const createMapping = async (domain: string, role_id: number | null, gallery_group_id: number | null) => {
        await apiMutate('/api/admin/domain-mappings', 'POST', { domain, role_id, gallery_group_id });
        mutateMappings();
    };

    const deleteMapping = async (id: number) => {
        await apiMutate(`/api/admin/domain-mappings/${id}`, 'DELETE');
        mutateMappings();
    };

    return { users, roles, mappings, updateUser, createMapping, deleteMapping };
}
