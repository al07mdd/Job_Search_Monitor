import { VacancyStage } from '../types';
import type { Vacancy, VacancyCreate, Event, AnalyticsReport } from '../types';

const API_URL = 'http://localhost:8000/api';

export const api = {
    async getVacancies(): Promise<Vacancy[]> {
        const res = await fetch(`${API_URL}/vacancies`);
        if (!res.ok) throw new Error('Failed to fetch vacancies');
        return res.json();
    },

    async createVacancy(data: VacancyCreate): Promise<Vacancy> {
        const res = await fetch(`${API_URL}/vacancies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create vacancy');
        return res.json();
    },

    async updateStage(id: string, stage: VacancyStage, comment?: string): Promise<void> {
        const params = new URLSearchParams({ stage });
        if (comment) params.append('comment', comment);

        const res = await fetch(`${API_URL}/vacancies/${id}/stage?${params.toString()}`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to update stage');
    },

    async getEvents(id: string): Promise<Event[]> {
        const res = await fetch(`${API_URL}/vacancies/${id}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    async getReport(year?: number, month?: number): Promise<AnalyticsReport> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());

        const res = await fetch(`${API_URL}/analytics/report?${params.toString()}`);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Report fetch failed: ${res.status} ${res.statusText} ${text}`);
        }
        return res.json();
    },

    async downloadReport(year: number, month: number): Promise<void> {
        const res = await fetch(`${API_URL}/analytics/export?year=${year}&month=${month}`);
        if (!res.ok) throw new Error('Failed to download report');

        // Trigger download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job_search_report_${year}_${month.toString().padStart(2, '0')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    async getDetailedReport(year: number, month: number): Promise<any[]> {
        const res = await fetch(`${API_URL}/analytics/detailed-report?year=${year}&month=${month}`);
        if (!res.ok) throw new Error('Failed to fetch detailed report');
        return res.json();
    },

    async deleteVacancy(id: string): Promise<void> {
        const res = await fetch(`${API_URL}/vacancies/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete vacancy');
    },

    async updateVacancy(id: string, data: VacancyCreate): Promise<Vacancy> {
        const res = await fetch(`${API_URL}/vacancies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update vacancy');
        return res.json();
    }
};
