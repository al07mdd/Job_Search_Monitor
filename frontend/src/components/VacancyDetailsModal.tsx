import React, { useEffect, useState } from 'react';
import { X, Calendar, MessageSquare, ArrowRight, Pencil, Trash2, Check, Loader2 } from 'lucide-react';
import type { Vacancy, Event } from '../types';
import { api } from '../services/api';
import { VacancyStage } from '../types';

interface Props {
    vacancy: Vacancy;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEdit: (vacancy: Vacancy) => void;
    onUpdate: (updatedVacancy: Vacancy) => void;
    onStatusChange?: (id: string, stage: VacancyStage) => void;
}

export const VacancyDetailsModal: React.FC<Props> = ({ vacancy, onClose, onDelete, onEdit, onUpdate, onStatusChange }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState(vacancy.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        loadEvents();
        setNotes(vacancy.notes || '');
    }, [vacancy.id]);

    const loadEvents = async () => {
        try {
            const data = await api.getEvents(vacancy.id);
            setEvents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onStatusChange) {
            const newStage = e.target.value as VacancyStage;
            onStatusChange(vacancy.id, newStage);
            setTimeout(loadEvents, 500);
        }
    };

    const handleNotesBlur = async () => {
        if (notes !== vacancy.notes) {
            setIsSavingNotes(true);
            try {
                const updateData = {
                    company: vacancy.company,
                    position: vacancy.position,
                    location: vacancy.location,
                    work_format: vacancy.work_format,
                    link: vacancy.link,
                    salary_min: vacancy.salary_min,
                    salary_max: vacancy.salary_max,
                    currency: vacancy.currency,
                    source: vacancy.source,
                    contacts: vacancy.contacts,
                    notes: notes
                };

                const updated = await api.updateVacancy(vacancy.id, updateData as any);
                onUpdate(updated);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2000);
            } catch (e) {
                console.error("Failed to save notes", e);
            } finally {
                setIsSavingNotes(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{vacancy.position}</h2>
                        <div className="text-gray-400 text-lg mb-2">{vacancy.company}</div>
                        <select
                            value={vacancy.stage}
                            onChange={handleStageChange}
                            className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md px-2 py-1 text-sm outline-none focus:border-blue-500 cursor-pointer"
                        >
                            {Object.values(VacancyStage).map(stage => (
                                <option key={stage} value={stage} className="text-black bg-white">
                                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(vacancy)} className="p-2 text-gray-400 hover:text-blue-400 rounded hover:bg-white/5 transition-colors" title="Edit details">
                            <Pencil size={20} />
                        </button>
                        <button onClick={() => onDelete(vacancy.id)} className="p-2 text-gray-400 hover:text-red-400 rounded hover:bg-white/5 transition-colors" title="Delete">
                            <Trash2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Compensation</div>
                                <div className="text-white font-medium">
                                    {vacancy.salary_min ? `${vacancy.currency || ''} ${vacancy.salary_min}` : 'Not specified'}
                                    {vacancy.salary_max ? ` - ${vacancy.salary_max}` : ''}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Format & Location</div>
                                <div className="text-white font-medium">
                                    {vacancy.work_format ? (vacancy.work_format.charAt(0).toUpperCase() + vacancy.work_format.slice(1)) : 'N/A'} • {vacancy.location || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {vacancy.link && (
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Link</div>
                                    <a href={vacancy.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all block truncate">
                                        {vacancy.link}
                                    </a>
                                </div>
                            )}
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Contacts</div>
                                <div className="text-white font-medium break-words">
                                    {vacancy.contacts || 'No contact info'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-between">
                            <span className="flex items-center"><MessageSquare className="mr-2" size={20} /> Notes</span>
                            <div className="flex items-center gap-2">
                                {isSavingNotes && <span className="text-xs text-blue-400 font-normal flex items-center"><Loader2 size={12} className="animate-spin mr-1" /> Saving...</span>}
                                {savedSuccess && <span className="text-xs text-green-400 font-normal flex items-center"><Check size={12} className="mr-1" /> Saved</span>}
                            </div>
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-y min-h-[100px] transition-colors ${savedSuccess ? 'border-green-500/30' : 'border-white/10'
                                }`}
                            placeholder="Add your notes, interview feedback, or thoughts here..."
                        />
                        <div className="text-xs text-gray-500 mt-1 italic">
                            Changes are saved automatically when you click outside.
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Calendar className="mr-2" size={20} />
                            History
                        </h3>

                        <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[2px] before:bg-white/10">
                            {loading ? (
                                <div className="text-gray-500 pl-8">Loading history...</div>
                            ) : events.length === 0 ? (
                                <div className="text-gray-500 pl-8">No events recorded.</div>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0a0e]" />

                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-400">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>

                                            <div className="text-white font-medium">
                                                {event.type === 'status_change' ? 'Stage Changed' : 'Event Logged'}
                                            </div>

                                            {event.stage_from && event.stage_to && (
                                                <div className="flex items-center text-sm text-gray-300 bg-white/5 w-fit px-2 py-1 rounded mt-1">
                                                    {event.stage_from} <ArrowRight size={14} className="mx-2" /> <span className="text-blue-300">{event.stage_to}</span>
                                                </div>
                                            )}

                                            {event.comment && (
                                                <div className="flex items-start gap-2 mt-1 text-gray-400 text-sm italic">
                                                    <MessageSquare size={14} className="mt-1 flex-shrink-0" />
                                                    {event.comment}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
