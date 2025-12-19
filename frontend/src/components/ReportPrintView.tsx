import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AnalyticsReport } from '../types';
import { X, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
    year: number;
    month: number;
    metrics: AnalyticsReport['metrics'];
    onClose: () => void;
}

interface DetailedVacancy {
    company: string;
    position: string;
    current_stage: string;
    history: {
        date: string;
        status: string;
        comment: string;
    }[];
}

const translations = {
    en: {
        title: "Job Search Report",
        generated: "Generated on",
        summary: "Monthly Summary",
        page: "Page",
        of: "of",
        continued: "Activity Continued",
        footer: "JobTracker Report System",
        kpi: {
            new: "New Positions",
            app: "Applications",
            int: "Interviews",
            off: "Offers Received",
            rej: "Rejections"
        },
        table: {
            title: "Activity Overview",
            job: "Job Details",
            stage: "Current Stage",
            history: "Progress History",
            change: "Change",
            noActivity: "No activity",
            empty: "No activity recorded for this period."
        }
    },
    de: {
        title: "Bewerbungsbericht",
        generated: "Erstellt am",
        summary: "Monatsübersicht",
        page: "Seite",
        of: "von",
        continued: "Aktivität Fortgesetzt",
        footer: "JobTracker Berichtssystem",
        kpi: {
            new: "Neue Positionen",
            app: "Bewerbungen",
            int: "Interviews",
            off: "Angebote",
            rej: "Absagen"
        },
        table: {
            title: "Aktivitätsübersicht",
            job: "Stellendetails",
            stage: "Aktueller Status",
            history: "Verlauf",
            change: "Änderung",
            noActivity: "Keine Aktivität",
            empty: "Keine Aktivitäten in diesem Zeitraum aufgezeichnet."
        }
    }
};

export const ReportPrintView: React.FC<Props> = ({ year, month, metrics, onClose }) => {
    const { reportLanguage } = useSettings();
    const t = translations[reportLanguage];

    const [paginatedData, setPaginatedData] = useState<DetailedVacancy[][]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Constants for pagination (Safe limits)
    const ITEMS_PER_FIRST_PAGE = 6;
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.getDetailedReport(year, month);

                // Clean up history
                const cleaned = res.map((v: DetailedVacancy) => {
                    const uniqueHistory = v.history.filter((h, _, self) =>
                        !(h.status === 'Created' && self.some(other => other.status.toLowerCase() === 'new' && other.date === h.date))
                    ).map(h => ({
                        ...h,
                        status: h.status.toLowerCase() === 'new' ? 'Opened' : h.status
                    }));
                    return { ...v, history: uniqueHistory };
                });

                // Paginate data
                const chunks: DetailedVacancy[][] = [];

                const firstPageItems = cleaned.slice(0, ITEMS_PER_FIRST_PAGE);
                if (firstPageItems.length > 0) chunks.push(firstPageItems);

                let remaining = cleaned.slice(ITEMS_PER_FIRST_PAGE);
                while (remaining.length > 0) {
                    chunks.push(remaining.slice(0, ITEMS_PER_PAGE));
                    remaining = remaining.slice(ITEMS_PER_PAGE);
                }

                if (cleaned.length === 0) chunks.push([]);

                setPaginatedData(chunks);

            } catch (e) {
                console.error(e);
                alert("Failed to load detailed report");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [year, month]);

    const handleDownloadPdf = async () => {
        setGeneratingPdf(true);
        try {
            // @ts-ignore
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pages = document.getElementsByClassName('report-page');

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                const canvas = await html2canvas(page, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                } as any);

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            const langSuffix = reportLanguage === 'de' ? 'DE' : 'EN';
            pdf.save(`Job_Report_${year}_${month}_${langSuffix}.pdf`);
        } catch (e: any) {
            console.error("PDF Generation failed", e);
            alert(`Failed to generate PDF: ${e.message || e}`);
        } finally {
            setGeneratingPdf(false);
        }
    };

    // PDF-safe styles (HEX only, no CSS variables)
    const styles = {
        page: { backgroundColor: '#ffffff', color: '#000000' },
        grayText: { color: '#0e0f11ff' },
        lighterText: { color: '#191a1cff' },
        darkGrayText: { color: '#0e1115ff' },

        // Borders
        lightGrayBorder: { borderColor: '#e5e7eb' },
        darkBorder: { borderColor: '#000000' },

        // Backgrounds
        grayBg: { backgroundColor: '#f9fafb' },
        lightBg: { backgroundColor: '#f3f4f6' },
        whiteBg: { backgroundColor: '#ffffff' }
    };

    if (loading) return (
        <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center text-black">
            Generating printable report...
        </div>
    );

    const locale = reportLanguage === 'de' ? 'de-DE' : 'en-US';

    return (
        <div className="fixed inset-0 bg-gray-100 z-[100] overflow-y-auto text-black font-sans flex flex-col items-center">
            {/* Control Bar - Safe to use Tailwind here as we don't capture this */}
            <div className="sticky top-0 w-full bg-white border-b border-gray-200 p-4 shadow-sm flex justify-between items-center z-50">
                <div className="font-medium text-gray-700">Preview Mode ({paginatedData.length} Pages)</div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FileDown size={18} />
                        {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        <X size={18} />
                        Close
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="py-8 space-y-8 flex flex-col items-center w-full">
                {paginatedData.map((pageItems, pageIndex) => (
                    <div
                        key={pageIndex}
                        className="report-page shadow-xl mx-auto box-border relative"
                        style={{
                            ...styles.page,
                            width: '210mm',
                            height: '297mm',
                            padding: '12mm'
                        }}
                    >
                        {/* Header (Page 1) */}
                        {pageIndex === 0 && (
                            <>
                                <div className="border-b-2 pb-4 mb-6 flex justify-between items-end" style={styles.darkBorder}>
                                    <div>
                                        <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{t.title}</h1>
                                        <p style={styles.grayText}>{t.generated} {new Date().toLocaleDateString(locale)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold">{new Date(year, month - 1).toLocaleString(locale, { month: 'long', year: 'numeric' })}</div>
                                        <div className="text-sm" style={styles.grayText}>{t.summary}</div>
                                    </div>
                                </div>

                                {/* KPI Summary */}
                                <div className="grid grid-cols-5 gap-3 mb-8">
                                    {[
                                        { label: t.kpi.new, val: metrics.new_vacancies_count },
                                        { label: t.kpi.app, val: metrics.applications_sent },
                                        { label: t.kpi.int, val: metrics.interviews },
                                        { label: t.kpi.off, val: metrics.offers },
                                        { label: t.kpi.rej, val: metrics.rejected },
                                    ].map((kpi, i) => (
                                        <div key={i} className="p-3 border rounded text-center" style={{ ...styles.grayBg, ...styles.lightGrayBorder }}>
                                            <div className="text-xl font-bold">{kpi.val}</div>
                                            <div className="text-[10px] uppercase mt-1" style={styles.grayText}>{kpi.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Continued Header (Page > 1) */}
                        {pageIndex > 0 && (
                            <div className="border-b pb-2 mb-6 flex justify-between items-end" style={styles.lightGrayBorder}>
                                <div className="text-sm font-bold uppercase" style={styles.lighterText}>{t.continued}</div>
                                <div className="text-xs" style={styles.lighterText}>
                                    {new Date(year, month - 1).toLocaleString(locale, { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        )}

                        {/* Table Header */}
                        <div className="mb-2">
                            <h2 className="text-lg font-bold border-b pb-2 mb-2 uppercase" style={styles.lightGrayBorder}>
                                {pageIndex === 0 ? t.table.title : `${t.table.title} (${t.page} ${pageIndex + 1})`}
                            </h2>
                            <div className="flex text-xs uppercase border-b pb-1" style={{ ...styles.grayText, ...styles.lightGrayBorder }}>
                                <div className="w-1/4 font-semibold">{t.table.job}</div>
                                <div className="w-1/6 font-semibold">{t.table.stage}</div>
                                <div className="flex-1 font-semibold">{t.table.history}</div>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="flex flex-col">
                            {pageItems.length === 0 && pageIndex === 0 ? (
                                <div className="italic mt-4" style={styles.lighterText}>{t.table.empty}</div>
                            ) : (
                                pageItems.map((item, idx) => (
                                    <div key={idx} className="flex border-b py-2 text-sm" style={{ ...styles.lightGrayBorder }}>
                                        <div className="w-1/4 pr-2">
                                            <div className="font-bold text-sm leading-tight">{item.company}</div>
                                            <div className="font-normal text-xs mt-0.5" style={styles.grayText}>{item.position}</div>
                                        </div>
                                        <div className="w-1/6 pr-2">
                                            <span className="inline-block px-1.5 py-0.5 rounded font-medium text-[10px] uppercase" style={styles.lightBg}>
                                                {item.current_stage}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-y-1 text-xs">
                                                {item.history.map((h, i) => (
                                                    <React.Fragment key={i}>
                                                        {i > 0 && <span className="mx-1" style={styles.lighterText}>→</span>}
                                                        <div className="flex flex-col items-center px-1.5 py-0.5 rounded border" style={{ ...styles.grayBg, borderColor: '#f3f4f6' }}>
                                                            <span className="font-semibold whitespace-nowrap text-[10px]" style={styles.darkGrayText}>
                                                                {h.status === 'status_change' ? t.table.change : h.status}
                                                            </span>
                                                            <span className="font-mono text-[9px]" style={styles.lighterText}>
                                                                {new Date(h.date).toLocaleDateString(locale)}
                                                            </span>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                                {item.history.length === 0 && <span className="italic text-[10px]" style={styles.lighterText}>{t.table.noActivity}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-8 left-12 right-12 border-t pt-2 text-xs flex justify-between" style={{ ...styles.lightGrayBorder, ...styles.lighterText }}>
                            <div>{t.footer}</div>
                            <div>{t.page} {pageIndex + 1} {t.of} {paginatedData.length}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
