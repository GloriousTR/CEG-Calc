import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
    toggleTheme: () => void;
    version: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    darkMode,
    toggleTheme,
    version
}) => {
    const [showThanks, setShowThanks] = useState(false);

    if (!isOpen) return null;

    const handleGitHub = async () => {
        await Browser.open({ url: 'https://github.com/GloriousTR/CEG-Calc' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#2C3035] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#25282C]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
                        ⚙️ Ayarlar
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Theme Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tema</h3>
                        <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1C2024] p-4 rounded-xl">
                            <span className="text-gray-900 dark:text-gray-200 font-medium flex items-center gap-3">
                                {darkMode ? (
                                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                )}
                                {darkMode ? 'Karanlık Mod' : 'Aydınlık Mod'}
                            </span>
                            <button
                                onClick={toggleTheme}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Hakkında</h3>
                        <div className="bg-gray-100 dark:bg-[#1C2024] p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Sürüm</span>
                                <span className="font-mono font-medium text-primary">{version}</span>
                            </div>
                            <button
                                onClick={handleGitHub}
                                className="w-full flex justify-between items-center text-sm py-2 hover:opacity-80 transition-opacity"
                            >
                                <span className="text-gray-600 dark:text-gray-400">GitHub</span>
                                <span className="font-medium text-blue-500 flex items-center gap-1">
                                    GloriousTR/CEG-Calc
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Thanks Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Teşekkürler</h3>
                        <button
                            onClick={() => setShowThanks(!showThanks)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">🙏</span>
                            Teşekkürler
                        </button>

                        {showThanks && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 animate-in slide-in-from-top duration-300">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <strong className="text-amber-600 dark:text-amber-400">CEG Türkiye</strong> ofisine teşekkürler.
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                                    Özellikle test aşamasındaki desteği için <strong className="text-orange-600 dark:text-orange-400">Hasan Hüseyin URAL</strong>'a teşekkürler! 🎉
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
