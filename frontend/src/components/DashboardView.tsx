import React, { useEffect, useMemo, useState } from 'react';
import type { Vacancy, AnalyticsReport } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { Users, Target, Zap, Clock, Calendar, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface Props {
    vacancies: Vacancy[];
    onNavigate: (vacancy: Vacancy) => void;
}

export const DashboardView: React.FC<Props> = ({ vacancies, onNavigate }) => {
    const { theme } = useSettings();
    const isDark = theme === 'dark';

    // Date Filter State (-1 for All Time)
    const [selectedMonth, setSelectedMonth] = useState(-1);
    const [selectedYear, setSelectedYear] = useState(2025);

    // Backend Report State
    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        loadBackendStats();
    }, [selectedMonth, selectedYear, vacancies]); // Recalculate if date or data changes

    const loadBackendStats = async () => {
        setLoadingReport(true);
        try {
            // Convert monthly index (0-11) to (1-12) if not all time (-1)
            const targetMonth = selectedMonth === -1 ? -1 : selectedMonth + 1;
            const data = await api.getReport(selectedYear, targetMonth);
            setReport(data);
        } catch (e) {
            console.error("Failed to load dashboard stats", e);
        } finally {
            setLoadingReport(false);
        }
    };

    // --- Calculation Logic ---
    const stats = useMemo(() => {
        const metrics = report?.metrics;

        // KPI: Total and Active always from current prop state (live)
        const total = vacancies.length;
        const active = vacancies.filter(v => v.stage !== 'closed' && v.stage !== 'rejected' && v.stage !== 'new').length;

        // Funnel counts from Backend (More accurate - based on events)
        const counts = {
            applied: metrics?.applications_sent || 0,
            response: (metrics as any)?.responses || 0,
            interview: metrics?.interviews || 0,
            offer: metrics?.offers || 0
        };

        // Calculate rates based on Backend metrics
        const responseRate = counts.applied ? Math.round((counts.response / counts.applied) * 100) : 0;
        const interviewRate = counts.applied ? Math.round((counts.interview / counts.applied) * 100) : 0;

        // Find stale vacancies (still live logic)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const staleItems = vacancies.filter(v => {
            if (v.stage === 'closed' || v.stage === 'rejected' || v.stage === 'new') return false;
            if (!['applied', 'response'].includes(v.stage)) return false;

            const updateDate = new Date(v.updated_at && v.updated_at !== v.created_at ? v.updated_at : v.created_at);
            return updateDate < sevenDaysAgo;
        });

        return { total, active, counts, responseRate, interviewRate, staleItems, maxVal: Math.max(counts.applied, 1) };
    }, [vacancies, report]);

    return (
        <div className="h-full flex flex-col gap-4 p-2 overflow-hidden">

            {/* Header & Controls */}
            <div className="flex justify-between items-center shrink-0">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Overview</h2>

                <div className="flex items-center gap-3">
                    {loadingReport && <Loader2 size={16} className="animate-spin text-blue-400" />}
                    <div className={`flex items-center px-3 py-1.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <Calendar size={14} className={`mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className={`bg-transparent border-none text-sm focus:ring-0 cursor-pointer focus:outline-none font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}
                        >
                            <option value={-1} className={isDark ? 'bg-gray-800' : 'bg-white'}>All Time</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i} className={isDark ? 'bg-gray-800' : 'bg-white'}>
                                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                                </option>
                            ))}
                        </select>

                        {selectedMonth !== -1 && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className={`bg-transparent border-none text-sm focus:ring-0 ml-2 cursor-pointer focus:outline-none font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}
                            >
                                <option value={2025} className={isDark ? 'bg-gray-800' : 'bg-white'}>2025</option>
                                <option value={2026} className={isDark ? 'bg-gray-800' : 'bg-white'}>2026</option>
                                <option value={2027} className={isDark ? 'bg-gray-800' : 'bg-white'}>2027</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <KpiCard
                    title="Active Pipeline"
                    value={stats.active}
                    icon={<Target className="text-blue-500" />}
                    sub="vacancies in progress"
                    isDark={isDark}
                />
                <KpiCard
                    title="Response Rate"
                    value={`${stats.counts.response} (${stats.responseRate}%)`}
                    icon={<Zap className="text-yellow-500" />}
                    sub="from applications"
                    isDark={isDark}
                />
                <KpiCard
                    title="Interview Rate"
                    value={`${stats.counts.interview} (${stats.interviewRate}%)`}
                    icon={<Users className="text-purple-500" />}
                    sub="conversion success"
                    isDark={isDark}
                />
                <KpiCard
                    title="Needs Attention"
                    value={stats.staleItems.length}
                    icon={<Clock className="text-red-400" />}
                    sub="> 7 days no update"
                    isDark={isDark}
                />
            </div>

            {/* Main Content Area - Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* Application Funnel */}
                <div className={`lg:col-span-2 rounded-2xl p-6 flex flex-col ${isDark ? 'glass-panel' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>Application Funnel</h3>

                    <div className="flex-1 flex flex-col justify-center space-y-5 px-4 md:px-8">
                        <FunnelBar label="Applications Sent" count={stats.counts.applied} max={stats.maxVal} color="bg-blue-500" isDark={isDark} />
                        <FunnelBar label="Responses Received" count={stats.counts.response} max={stats.maxVal} color="bg-cyan-500" isDark={isDark} />
                        <FunnelBar label="Interviews" count={stats.counts.interview} max={stats.maxVal} color="bg-purple-500" isDark={isDark} />
                        <FunnelBar label="Offers" count={stats.counts.offer} max={stats.maxVal} color="bg-green-500" isDark={isDark} />
                    </div>
                </div>

                {/* Stale Jobs List */}
                <div className={`lg:col-span-1 rounded-2xl p-6 flex flex-col h-full ${isDark ? 'glass-panel' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Needs Attention</h3>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">7 days no update</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0 max-h-[350px]">
                        {stats.staleItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <div className="p-3 bg-green-500/10 rounded-full mb-3 text-green-500">
                                    <Zap size={24} />
                                </div>
                                <div className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>All Caught Up!</div>
                                <div className="text-xs text-gray-500">No stuck vacancies found. Great momentum!</div>
                            </div>
                        ) : (
                            stats.staleItems.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => onNavigate(v)}
                                    className={`p-3 rounded-xl border text-sm flex flex-col gap-2 cursor-pointer transition-all ${isDark
                                        ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20'
                                        : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-blue-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className={`font-semibold line-clamp-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{v.position}</div>
                                            <div className="text-xs text-gray-500 text-left">{v.company}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${v.stage === 'applied' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
                                            }`}>
                                            {v.stage}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-[10px] text-gray-500 pt-2 border-t border-white/5 mt-1">
                                        <Clock size={10} className="mr-1" />
                                        Last update: {new Date(v.updated_at || v.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={`mt-auto text-center text-xs py-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Showing trends based on {selectedMonth === -1 ? 'all time' : new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })} activity • {stats.total} total vacancies
            </div>

        </div>
    );
};

// --- Subcomponents ---

const KpiCard = ({ title, value, icon, sub, isDark }: any) => (
    <div className={`rounded-2xl p-5 flex items-center justify-between transition-transform hover:scale-[1.02] ${isDark ? 'glass-panel' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <div>
            <div className="text-sm text-gray-400 mb-1 font-medium">{title}</div>
            <div className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{value}</div>
            <div className="text-[11px] text-gray-500 mt-1 font-medium">{sub}</div>
        </div>
        <div className={`p-3.5 rounded-xl shadow-inner ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
            {icon}
        </div>
    </div>
);

const FunnelBar = ({ label, count, max, color, isDark }: any) => {
    const widthPercent = max > 0 ? (count / max) * 100 : 0;
    const displayPercent = Math.round(widthPercent);

    return (
        <div className="w-full">
            <div className="flex justify-between text-sm mb-2 px-1">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{count}</span>
            </div>
            <div className={`h-8 w-full rounded-xl relative ${isDark ? 'bg-black/20' : 'bg-gray-100'}`}>
                <div
                    className={`h-full ${color} rounded-l-xl transition-all duration-1000 ease-out flex items-center justify-end pr-3 relative group`}
                    style={{ width: `${Math.max(widthPercent, 2)}%`, minWidth: '4px' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-l-xl" />

                    {/* Tooltip */}
                    <div className={`absolute bottom-full mb-2 right-0 px-2 py-1 text-xs font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none ${isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'}`}>
                        {count} <span className="text-gray-500 font-normal">({displayPercent}%)</span>
                        <div className={`absolute top-full right-2 border-4 border-transparent ${isDark ? 'border-t-gray-800' : 'border-t-white'}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
