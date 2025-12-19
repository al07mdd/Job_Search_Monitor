import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Moon, Sun, Globe } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const { theme, setTheme, reportLanguage, setReportLanguage } = useSettings();

    return (
        <div className={`p-8 max-w-2xl mx-auto space-y-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {/* Appearance Section */}
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    Appearance
                </h3>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">App Theme</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Choose between dark and light mode
                        </div>
                    </div>

                    <div className="flex bg-gray-200 dark:bg-white/10 p-1 rounded-lg">
                        <button
                            onClick={() => setTheme('light')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            Dark
                        </button>
                    </div>
                </div>
            </div>

            {/* Reporting Section */}
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Globe size={20} />
                    Reporting
                </h3>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">Report Language</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Language for printed PDF headers
                        </div>
                    </div>

                    <select
                        value={reportLanguage}
                        onChange={(e) => setReportLanguage(e.target.value as 'en' | 'de')}
                        className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark'
                                ? 'bg-black/20 border-white/10 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                    >
                        <option value="en">🇺🇸 English</option>
                        <option value="de">🇩🇪 Deutsch</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
