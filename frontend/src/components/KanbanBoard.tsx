import React, { useMemo } from 'react';
import { VacancyStage } from '../types';
import type { Vacancy } from '../types';
import { VacancyCard } from './VacancyCard';

interface Props {
    vacancies: Vacancy[];
    onVacancyClick: (vacancy: Vacancy) => void;
    onDrop: (id: string, stage: VacancyStage) => void;
}

const COLUMNS: { id: VacancyStage; label: string }[] = [
    { id: VacancyStage.NEW, label: 'New' },
    { id: VacancyStage.APPLIED, label: 'Applied' },
    { id: VacancyStage.RESPONSE, label: 'Response' },
    { id: VacancyStage.INTERVIEW, label: 'Interview' },
    { id: VacancyStage.OFFER, label: 'Offer' },
    { id: VacancyStage.REJECTED, label: 'Rejected' },
    { id: VacancyStage.CLOSED, label: 'Closed' },
];

export const KanbanBoard: React.FC<Props> = ({ vacancies, onVacancyClick, onDrop }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            // Smart scrolling logic:
            // 1. Check if we are scrolling vertically inside a column
            let target = e.target as HTMLElement;
            let canScrollVertically = false;

            while (target && target !== el) {
                // Check if target is scrollable
                if (target.scrollHeight > target.clientHeight) {
                    const isAtTop = target.scrollTop === 0;
                    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 1;

                    // If scrolling UP and NOT at top, OR scrolling DOWN and NOT at bottom
                    if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                        canScrollVertically = true;
                        break;
                    }
                }
                target = target.parentElement as HTMLElement;
            }

            // 2. If not scrolling a column content, scroll the board horizontally
            if (!canScrollVertically && e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const grouped = useMemo(() => {
        const groups: Record<string, Vacancy[]> = {};
        COLUMNS.forEach(col => groups[col.id] = []);
        vacancies.forEach(v => {
            if (groups[v.stage]) {
                groups[v.stage].push(v);
            } else {
                // Fallback for unknown stages
                groups[VacancyStage.NEW].push(v);
            }
        });
        return groups;
    }, [vacancies]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, stage: VacancyStage) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        onDrop(id, stage);
    };

    return (
        <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 h-full"
        >
            {COLUMNS.map(col => (
                <div
                    key={col.id}
                    className="kanban-column min-w-[280px] w-72 flex flex-col h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-300">{col.label}</h3>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
                            {grouped[col.id].length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                        {grouped[col.id].map(vacancy => (
                            <div
                                key={vacancy.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, vacancy.id)}
                            >
                                <VacancyCard
                                    vacancy={vacancy}
                                    onClick={() => onVacancyClick(vacancy)}
                                />
                            </div>
                        ))}
                        {grouped[col.id].length === 0 && (
                            <div className="h-24 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-white/20 text-sm">
                                Empty
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
