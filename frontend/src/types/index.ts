export enum VacancyStage {
    NEW = "new",
    APPLIED = "applied",
    RESPONSE = "response",
    INTERVIEW = "interview",
    OFFER = "offer",
    REJECTED = "rejected",
    CLOSED = "closed"
}

export enum WorkFormat {
    REMOTE = "remote",
    HYBRID = "hybrid",
    OFFICE = "office"
}

export interface Vacancy {
    id: string;
    created_at: string;
    updated_at: string;
    company: string;
    position: string;
    location?: string;
    work_format?: WorkFormat;
    link?: string;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    source?: string;
    contacts?: string;
    stage: VacancyStage;
    notes?: string;
}

export interface VacancyCreate extends Omit<Vacancy, 'id' | 'created_at' | 'updated_at' | 'stage'> { }

export interface Event {
    id: string;
    vacancy_id: string;
    timestamp: string;
    type: string;
    stage_from?: VacancyStage;
    stage_to?: VacancyStage;
    comment?: string;
}

export interface AnalyticsReport {
    period: string;
    metrics: {
        new_vacancies_count: { count: number; ids: string[] };
        activities_count: number;
        applications_sent: { count: number; ids: string[] };
        responses: { count: number; ids: string[] };
        interviews: { count: number; ids: string[] };
        offers: { count: number; ids: string[] };
        rejected: { count: number; ids: string[] };
        closed: { count: number; ids: string[] };
    };
    recent_activity: Event[];
}
