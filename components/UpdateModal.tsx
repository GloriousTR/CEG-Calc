import React from 'react';

interface UpdateModalProps {
    isOpen: boolean;
    version: string;
    releaseNotes: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDownloading: boolean;
    progress: number;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    isOpen,
    version,
    releaseNotes,
    onConfirm,
    onCancel,
    isDownloading,
    progress,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Yeni Güncelleme Mevcut! 🚀
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Sürüm: <span className="font-mono font-medium text-primary">{version}</span>
                    </p>

                    <div className="bg-background-light dark:bg-background-dark rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Yenilikler
                        </h3>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {releaseNotes || "Hata düzeltmeleri ve performans iyileştirmeleri."}
                        </div>
                    </div>

                    {isDownloading ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>İndiriliyor...</span>
                                <span>%{Math.round(progress)}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Daha Sonra
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                            >
                                İndir ve Yükle
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
