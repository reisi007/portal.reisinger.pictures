import useSWR from 'swr';
import { fetcher, apiMutate } from '../api';

export interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
}

export function useEmailTemplates() {
    const { data: templates, mutate, isLoading } = useSWR<EmailTemplate[]>('/api/admin/email-templates', fetcher);

    const saveTemplate = async (template: Partial<EmailTemplate>) => {
        const isNew = !template.id;
        const url = isNew ? '/api/admin/email-templates' : '/api/admin/email-templates/' + template.id;
        await apiMutate(url, isNew ? 'POST' : 'PUT', template);
        mutate();
    };

    const deleteTemplate = async (id: number) => {
        await apiMutate('/api/admin/email-templates/' + id, 'DELETE');
        mutate();
    };

    return { templates, isLoading, saveTemplate, deleteTemplate };
}
