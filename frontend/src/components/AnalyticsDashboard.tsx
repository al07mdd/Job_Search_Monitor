import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AnalyticsReport, Vacancy } from '../types';
import { ReportPrintView } from './ReportPrintView';
import { useSettings } from '../contexts/SettingsContext';
import { TrendingUp, Users, FileText, CheckCircle, XCircle, Slash, Printer, Zap, X, MapPin } from 'lucide-react';

interface Props {
    vacancies: Vacancy[];
    onVacancyClick: (vacancy: Vacancy) => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ vacancies, onVacancyClick }) => {
    const { theme } = useSettings();
    const isDark = theme === 'dark';

    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPrintView, setShowPrintView] = useState(false);

    // Drill-down state
    const [drillDown, setDrillDown] = useState<{ title: string; ids: string[] } | null>(null);

    // Date state
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    useEffect(() => {
        loadReport();
    }, [year, month]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await api.getReport(year, month);
            setReport(data);
            setError(null);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (showPrintView && report) {
        return <ReportPrintView year={year} month={month} metrics={report.metrics} onClose={() => setShowPrintView(false)} />;
    }

    const handleCardClick = (title: string, metricsData: { count: number; ids: string[] } | null) => {
        if (metricsData && metricsData.count > 0) {
            setDrillDown({ title, ids: metricsData.ids });
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics & Reports</h2>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800 shadow-sm'}`}
                    >
                        <option value={2025} className="text-black">2025</option>
                        <option value={2026} className="text-black">2026</option>
                    </select>

                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800 shadow-sm'}`}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m} className="text-black">
                                {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowPrintView(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Printer size={18} />
                        Print / PDF Report
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading analytics data...</p>
                </div>
            ) : error ? (
                <div className="text-red-400 p-8 text-center bg-red-400/5 rounded-xl border border-red-400/10">
                    Failed to load report: {error}
                </div>
            ) : report ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        <StatCard
                            title="New Vacancies"
                            value={report.metrics.new_vacancies_count.count}
                            icon={<FileText size={20} className="text-blue-400" />}
                            gradient="from-blue-500/10 to-transparent"
                            onClick={() => handleCardClick("New Vacancies", report.metrics.new_vacancies_count)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Applied"
                            value={report.metrics.applications_sent.count}
                            icon={<TrendingUp size={20} className="text-orange-400" />}
                            gradient="from-orange-500/10 to-transparent"
                            onClick={() => handleCardClick("Applications Sent", report.metrics.applications_sent)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Responses"
                            value={report.metrics.responses.count}
                            icon={<Zap size={20} className="text-cyan-400" />}
                            gradient="from-cyan-500/10 to-transparent"
                            onClick={() => handleCardClick("Responses Received", report.metrics.responses)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Interviews"
                            value={report.metrics.interviews.count}
                            icon={<Users size={20} className="text-purple-400" />}
                            gradient="from-purple-500/10 to-transparent"
                            onClick={() => handleCardClick("Interviews Set", report.metrics.interviews)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Offers"
                            value={report.metrics.offers.count}
                            icon={<CheckCircle size={20} className="text-green-400" />}
                            gradient="from-green-500/10 to-transparent"
                            onClick={() => handleCardClick("Offers Received", report.metrics.offers)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Rejected"
                            value={report.metrics.rejected.count}
                            icon={<XCircle size={20} className="text-red-400" />}
                            gradient="from-red-500/10 to-transparent"
                            onClick={() => handleCardClick("Rejections", report.metrics.rejected)}
                            isDark={isDark}
                        />
                        <StatCard
                            title="Closed"
                            value={report.metrics.closed.count}
                            icon={<Slash size={20} className="text-gray-400" />}
                            gradient="from-gray-500/10 to-transparent"
                            onClick={() => handleCardClick("Closed Without Result", report.metrics.closed)}
                            isDark={isDark}
                        />
                    </div>

                    <div className={`rounded-xl p-6 border ${isDark ? 'glass-panel border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                            Recent Activity Log
                        </h3>
                        <div className="space-y-4">
                            {report.recent_activity.length === 0 ? (
                                <p className="text-gray-400 text-center py-8 italic">No recent activity recorded for this period.</p>
                            ) : (
                                [...report.recent_activity]
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map((event, idx) => (
                                        <div key={idx} className={`flex items-start gap-4 text-sm pb-4 ${idx !== report.recent_activity.length - 1 ? 'border-b border-white/5' : ''}`}>
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40 shrink-0"></div>
                                            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-x-4 w-full">
                                                <div className="text-gray-500 font-medium">
                                                    {new Date(event.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                                <div className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                                                    <span className="font-bold text-blue-400 uppercase text-xs mr-2 tracking-wider">{event.type}</span>
                                                    {event.stage_from && event.stage_to && (
                                                        <span className="text-gray-400 mr-2 text-xs">
                                                            {event.stage_from} → <span className={isDark ? 'text-white' : 'text-gray-900'}>{event.stage_to}</span>
                                                        </span>
                                                    )}
                                                    {event.comment && <span className="text-gray-500 italic block mt-1">— {event.comment}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </>
            ) : null}

            {/* Drill-down Modal */}
            {drillDown && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
                    <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}>
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                            <div>
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{drillDown.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{drillDown.ids.length} entries for the selected period</p>
                            </div>
                            <button
                                onClick={() => setDrillDown(null)}
                                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {vacancies.filter(v => drillDown.ids.includes(v.id)).map(vacancy => (
                                <div
                                    key={vacancy.id}
                                    onClick={() => {
                                        setDrillDown(null);
                                        onVacancyClick(vacancy);
                                    }}
                                    className={`p-4 rounded-xl border group cursor-pointer transition-all ${isDark
                                        ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-500/30'
                                        : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className={`font-bold transition-colors ${isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>{vacancy.position}</div>
                                            <div className="text-sm text-gray-500 mt-0.5">{vacancy.company}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${vncStyle(vacancy.stage, isDark)}`}>
                                            {vacancy.stage}
                                        </div>
                                    </div>
                                    {vacancy.location && (
                                        <div className="flex items-center gap-1 mt-3 text-[11px] text-gray-500">
                                            <MapPin size={12} />
                                            {vacancy.location}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={`p-4 text-center border-t ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <button
                                onClick={() => setDrillDown(null)}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const vncStyle = (stage: string, isDark: boolean) => {
    switch (stage) {
        case 'applied': return isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700';
        case 'response': return isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700';
        case 'interview': return isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700';
        case 'offer': return isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700';
        case 'rejected': return isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
        default: return isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600';
    }
};

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
    onClick: () => void;
    isDark: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, onClick, isDark }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 group cursor-pointer ${value > 0 ? 'hover:scale-[1.02] active:scale-[0.98]' : 'grayscale opacity-80'} ${isDark
            ? `glass-panel border-white/5 bg-gradient-to-br ${gradient}`
            : `bg-white border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 bg-gradient-to-br ${gradient}`}`}
    >
        <div className={`absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-blue-400/30' : 'text-blue-500/10'}`}>
            <TrendingUp size={48} rotate={45} />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>{icon}</div>
        </div>
        <div className={`text-3xl font-black mb-1 relative z-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest relative z-10">{title}</div>

        {value > 0 && (
            <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500 ${isDark ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`} style={{ width: '0%', groupHover: { width: '100%' } } as any}></div>
        )}
    </div>
);
