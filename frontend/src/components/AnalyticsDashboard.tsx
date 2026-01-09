import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AnalyticsReport } from '../types';
import { ReportPrintView } from './ReportPrintView';
import { TrendingUp, Users, FileText, CheckCircle, XCircle, Slash, Printer } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPrintView, setShowPrintView] = useState(false);

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

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        <option value={2025} className="text-black">2025</option>
                        <option value={2026} className="text-black">2026</option>
                    </select>

                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m} className="text-black">
                                {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowPrintView(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        <Printer size={18} />
                        Print / PDF Report
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-white p-8">Loading analytics...</div>
            ) : error ? (
                <div className="text-red-400 p-8">Failed to load report: {error}</div>
            ) : report ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard
                            title="New Vacancies"
                            value={report.metrics.new_vacancies_count}
                            icon={<FileText className="text-blue-400" />}
                            gradient="from-blue-500/10 to-blue-500/5 hover:from-blue-500/20"
                        />
                        <StatCard
                            title="Applied"
                            value={report.metrics.applications_sent}
                            icon={<TrendingUp className="text-orange-400" />}
                            gradient="from-orange-500/10 to-orange-500/5 hover:from-orange-500/20"
                        />
                        <StatCard
                            title="Interviews"
                            value={report.metrics.interviews}
                            icon={<Users className="text-purple-400" />}
                            gradient="from-purple-500/10 to-purple-500/5 hover:from-purple-500/20"
                        />
                        <StatCard
                            title="Offers"
                            value={report.metrics.offers}
                            icon={<CheckCircle className="text-green-400" />}
                            gradient="from-green-500/10 to-green-500/5 hover:from-green-500/20"
                        />
                        <StatCard
                            title="Rejected"
                            value={report.metrics.rejected}
                            icon={<XCircle className="text-red-400" />}
                            gradient="from-red-500/10 to-red-500/5 hover:from-red-500/20"
                        />
                        <StatCard
                            title="Closed"
                            value={report.metrics.closed}
                            icon={<Slash className="text-gray-400" />}
                            gradient="from-gray-500/10 to-gray-500/5 hover:from-gray-500/20"
                        />
                    </div>

                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-6">Recent Activity Log</h3>
                        <div className="space-y-4">
                            {report.recent_activity.length === 0 ? (
                                <p className="text-gray-400">No recent activity recorded for this period.</p>
                            ) : (
                                [...report.recent_activity]
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map((event) => (
                                        <div key={event.id} className="flex items-center gap-4 text-sm border-b border-white/5 pb-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <div className="text-gray-400 min-w-[150px]">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </div>
                                            <div className="text-white flex-1">
                                                <span className="font-medium text-blue-300">{event.type}</span>
                                                {event.stage_from && event.stage_to && (
                                                    <span className="text-gray-400 mx-2">
                                                        {event.stage_from} → <span className="text-white">{event.stage_to}</span>
                                                    </span>
                                                )}
                                                {event.comment && <span className="text-gray-500 ml-2">- {event.comment}</span>}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; gradient: string }> = ({
    title, value, icon, gradient
}) => (
    <div className={`glass-panel p-4 rounded-xl border border-white/5 transition-all duration-300 bg-gradient-to-br ${gradient}`}>
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
    </div>
);
