import useSWR from 'swr';
import {apiMutate, fetcher} from '../api';

export interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
}

export function useEmailTemplates() {
    const {data: templates, mutate, isLoading} = useSWR<EmailTemplate[]>('/api/management/email-templates', fetcher);

    const saveTemplate = async (template: Partial<EmailTemplate>) => {
        const isNew = !template.id;
        const url = isNew ? '/api/management/email-templates' : '/api/management/email-templates/' + template.id;
        await apiMutate(url, isNew ? 'POST' : 'PUT', template);
        mutate();
    };

    const deleteTemplate = async (id: number) => {
        await apiMutate('/api/management/email-templates/' + id, 'DELETE');
        mutate();
    };

    return {templates, isLoading, saveTemplate, deleteTemplate};
}
