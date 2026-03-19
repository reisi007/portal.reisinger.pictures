import useSWR from 'swr';
import { fetcher } from '../api';

export interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
}

export function useEmailTemplates() {
    const { data: templates, mutate, isLoading } = useSWR<EmailTemplate[]>('/api/admin/email-templates', fetcher);

    const saveTemplate = async (template: Partial<EmailTemplate>) => {
        const token = localStorage.getItem('rp_jwt');
        const isNew = !template.id;
        const url = isNew ? '/api/admin/email-templates' : '/api/admin/email-templates/' + template.id;
        
        const res = await fetch(url, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(template)
        });
        if (!res.ok) throw new Error('Fehler beim Speichern der Vorlage');
        mutate();
    };

    const deleteTemplate = async (id: number) => {
        const token = localStorage.getItem('rp_jwt');
        await fetch('/api/admin/email-templates/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        mutate();
    };

    return { templates, isLoading, saveTemplate, deleteTemplate };
}
