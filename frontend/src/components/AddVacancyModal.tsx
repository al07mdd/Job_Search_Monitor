import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WorkFormat } from '../types';
import type { VacancyCreate } from '../types';

interface Props {
    onClose: () => void;
    onSubmit: (data: VacancyCreate) => Promise<void>;
    initialData?: VacancyCreate;
}

export const AddVacancyModal: React.FC<Props> = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<VacancyCreate>(initialData || {
        company: '',
        position: '',
        salary_min: 0,
        salary_max: 0,
        currency: '',
        work_format: WorkFormat.REMOTE,
        location: '',
        link: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg rounded-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h3 className="text-xl font-semibold text-white">{initialData ? 'Edit Vacancy' : 'Add New Vacancy'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Company</label>
                            <input
                                required
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                placeholder="e.g. Google"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Position</label>
                            <input
                                required
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                placeholder="e.g. Senior Developer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Min Salary</label>
                            <input
                                type="number"
                                value={formData.salary_min || ''}
                                onChange={e => setFormData({ ...formData, salary_min: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Max Salary</label>
                            <input
                                type="number"
                                value={formData.salary_max || ''}
                                onChange={e => setFormData({ ...formData, salary_max: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Currency</label>
                            <select
                                value={formData.currency || ''}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="" disabled>Select...</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Format</label>
                            <select
                                value={formData.work_format}
                                onChange={e => setFormData({ ...formData, work_format: e.target.value as WorkFormat })}
                            >
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="office">Office</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Location</label>
                            <input
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Berlin"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Link</label>
                        <input
                            value={formData.link || ''}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Vacancy')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
