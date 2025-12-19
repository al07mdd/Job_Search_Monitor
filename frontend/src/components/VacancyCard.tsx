import React from 'react';
import type { Vacancy } from '../types';
import { Briefcase, MapPin, Building2, DollarSign } from 'lucide-react';

interface Props {
    vacancy: Vacancy;
    onClick: () => void;
}

export const VacancyCard: React.FC<Props> = ({ vacancy, onClick }) => {
    const getAccentColor = (stage: string) => {
        switch (stage.toLowerCase()) {
            case 'new': return '59 130 246';      // Blue
            case 'applied': return '249 115 22';  // Orange
            case 'response': return '6 182 212';  // Cyan
            case 'interview': return '168 85 247'; // Purple
            case 'offer': return '34 197 94';     // Green
            case 'rejected': return '239 68 68';  // Red
            case 'closed': return '107 114 128';  // Gray
            default: return '107 114 128';
        }
    };

    return (
        <div
            className={`kanban-card group`}
            onClick={onClick}
            style={{ '--card-accent': getAccentColor(vacancy.stage) } as any}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{vacancy.position}</h3>
            </div>

            <div className="flex items-center text-sm text-gray-400 mb-1">
                <Building2 size={14} className="mr-1" />
                <span>{vacancy.company}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {vacancy.salary_min && (
                    <span className="text-xs bg-white/5 px-2 py-1 rounded flex items-center">
                        <DollarSign size={10} className="mr-1" />
                        {vacancy.currency} {vacancy.salary_min / 1000}k+
                    </span>
                )}

                {vacancy.location && (
                    <span className="text-xs bg-white/5 px-2 py-1 rounded flex items-center">
                        <MapPin size={10} className="mr-1" />
                        {vacancy.location}
                    </span>
                )}

                {vacancy.work_format && (
                    <span className="text-xs bg-white/5 px-2 py-1 rounded flex items-center">
                        <Briefcase size={10} className="mr-1" />
                        {vacancy.work_format}
                    </span>
                )}
            </div>
        </div>
    );
};
